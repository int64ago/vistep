#!/usr/bin/env python3
"""Produce static bilingual narration with measured chapter windows, never time-stretched speech.
The service is used during content production only; readers and CI use committed audio.
"""
import argparse, array, asyncio, hashlib, json, subprocess, wave
from pathlib import Path
import edge_tts
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
RATE = 44100
VOICES = {'zh': 'zh-CN-XiaoxiaoNeural', 'en': 'en-US-AvaMultilingualNeural'}
parser = argparse.ArgumentParser()
parser.add_argument('--only', help='One topic slug; omit to produce the whole collection')
parser.add_argument('--workers', type=int, default=3)
args = parser.parse_args()
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
cache = ROOT / '.voice-cache'; cache.mkdir(exist_ok=True)
out = ROOT / 'public/narration'; out.mkdir(exist_ok=True)
script_path = ROOT/'src/data/narration.json'
scripts = json.loads(script_path.read_text())
if args.only and args.only not in scripts: raise SystemExit('Unknown topic: '+args.only)
manifest_path = ROOT/'src/data/audio-manifest.json'
manifest = json.loads(manifest_path.read_text())

def command(*values):
    result = subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *map(str, values)], capture_output=True)
    if result.returncode: raise RuntimeError(result.stderr.decode()[:500])

def duration(path):
    with wave.open(str(path), 'rb') as file: return file.getnframes()/file.getframerate()

async def main():
    available = {v['ShortName'] for v in await edge_tts.list_voices()}
    if not set(VOICES.values()).issubset(available): raise RuntimeError('Configured voice is unavailable; choose and review a replacement.')
    semaphore = asyncio.Semaphore(max(1, min(args.workers, 4)))
    async def synthesize(slug, locale, index, cue):
        fingerprint = hashlib.sha256(('edge-tts-v2|'+VOICES[locale]+'|rate=+0%|'+cue[locale]).encode()).hexdigest()
        raw = cache/(fingerprint+'.mp3')
        trimmed = cache/(fingerprint+'-normalized.wav')
        async with semaphore:
            if not raw.exists():
                for attempt in range(4):
                    try:
                        temporary = raw.with_suffix('.part')
                        await edge_tts.Communicate(cue[locale], VOICES[locale], rate='+0%').save(str(temporary))
                        if temporary.stat().st_size < 1000: raise RuntimeError('Empty synthesis output')
                        temporary.replace(raw)
                        break
                    except Exception:
                        if attempt == 3: raise
                        await asyncio.sleep(2 ** (attempt + 1))
            if not trimmed.exists():
                await asyncio.to_thread(command, '-i', raw, '-af',
                    'silenceremove=start_periods=1:start_duration=0.02:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-48dB,areverse,loudnorm=I=-18:TP=-2:LRA=7',
                    '-ar', RATE, '-ac', 1, '-c:a', 'pcm_s16le', trimmed)
            seconds = duration(trimmed)
            if seconds < 2: raise RuntimeError(f'{slug}/{locale}/{index}: implausibly short speech')
            print(f'{slug}/{locale}/{index+1}: {seconds:.2f}s', flush=True)
            return (slug, locale, index), (trimmed, seconds)
    jobs = [synthesize(slug, locale, i, cue) for slug, film in scripts.items()
            if not args.only or slug == args.only for locale in VOICES for i, cue in enumerate(film['cues'])]
    rendered = dict(await asyncio.gather(*jobs))
    for slug, film in scripts.items():
        if args.only and args.only != slug: continue
        at = 0
        for i, cue in enumerate(film['cues']):
            # Both languages receive the same visual timing. Add breathing room, never acceleration.
            window = max(cue['seconds'], *(rendered[(slug, locale, i)][1] + 1.25 for locale in VOICES))
            cue['chapterAt'] = round(at, 2)
            cue['at'] = round(at + .45, 2)
            at += round(window * 2 + .49999) / 2
        film['duration'] = round(at, 2)
        if not 120 <= at <= 300: raise RuntimeError(f'{slug}: {at}s is outside the 2–5 minute editorial limit; revise the script.')
        manifest.setdefault(slug, {})
        for locale, voice in VOICES.items():
            samples = array.array('h', [0]) * round(at * RATE)
            cues = []
            for i, cue in enumerate(film['cues']):
                source, seconds = rendered[(slug, locale, i)]
                with wave.open(str(source), 'rb') as file: part = array.array('h', file.readframes(file.getnframes()))
                start = round(cue['at'] * RATE)
                end = start + len(part)
                assert end <= len(samples)
                samples[start:end] = part
                cues.append({'at':cue['at'],'end':round(end/RATE,5),'text':cue[locale],'tempo':1})
            wav = cache/f'{slug}-{locale}-mix.wav'
            with wave.open(str(wav), 'wb') as file:
                file.setnchannels(1);file.setsampwidth(2);file.setframerate(RATE);file.writeframes(samples.tobytes())
            digest = hashlib.sha256(samples.tobytes()).hexdigest()[:12]
            filename = f'{slug}-{locale}-{digest}.mp3'
            command('-i', wav, '-codec:a', 'libmp3lame', '-b:a', '128k', out/filename)
            manifest[slug][locale] = {'src':'/narration/'+filename,'duration':at,'voice':voice,'provider':'Microsoft Edge online speech via edge-tts','sampleRate':RATE,'cues':cues}
            print(f'Assembled {filename}: {at:.1f}s', flush=True)
    # Commit all metadata only after every selected track has been assembled successfully.
    for path, value in [(script_path,scripts),(manifest_path,manifest)]:
        temporary = path.with_suffix('.json.tmp')
        temporary.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n');temporary.replace(path)
    timeline = {slug:{'duration':film['duration'],'chapters':[{k:cue[k] for k in ['id','title','titleEn','caption','captionEn']}|{'at':cue['chapterAt']} for cue in film['cues']]} for slug,film in scripts.items()}
    (ROOT/'src/data/film-timeline.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2)+'\n')
    tracks = {slug:{locale:{k:track[k] for k in ['src','duration','voice']} for locale,track in locales.items()} for slug,locales in manifest.items()}
    (ROOT/'src/data/audio-tracks.json').write_text(json.dumps(tracks,ensure_ascii=False,indent=2)+'\n')
    retained = {Path(track['src']).name for locales in manifest.values() for track in locales.values()}
    for path in out.glob('*.mp3'):
        if path.name not in retained: path.unlink()

asyncio.run(main())
