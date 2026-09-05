#!/usr/bin/env python3
"""Generate chapter-timed narration and assemble a static, gap-preserving soundtrack.
Credentials stay in the environment or Wrangler's local OAuth store, never in outputs.
"""
import argparse, array, base64, concurrent.futures, hashlib, json, os, subprocess, sys, time, tomllib, wave
from pathlib import Path
import imageio_ffmpeg
ROOT = Path(__file__).resolve().parents[1]
RATE = 44100
parser = argparse.ArgumentParser()
parser.add_argument('--account', default=os.environ.get('CLOUDFLARE_ACCOUNT_ID'), required=not os.environ.get('CLOUDFLARE_ACCOUNT_ID'))
parser.add_argument('--only', help='One topic slug')
args = parser.parse_args()
config = Path.home() / 'Library/Preferences/.wrangler/config/default.toml'
token = os.environ.get('CLOUDFLARE_API_TOKEN') or (tomllib.loads(config.read_text()).get('oauth_token') if config.exists() else None)
if not token: raise SystemExit('Set CLOUDFLARE_API_TOKEN or log in with Wrangler.')
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
cache = ROOT / '.voice-cache'; cache.mkdir(exist_ok=True)
out = ROOT / 'public/narration'; out.mkdir(exist_ok=True)
scripts = json.loads((ROOT/'src/data/narration.json').read_text())
if args.only and args.only not in scripts: raise SystemExit('Unknown topic slug: '+args.only)
manifest_path = ROOT/'src/data/audio-manifest.json'
manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}

def command(*args):
    result = subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *map(str,args)],capture_output=True)
    if result.returncode: raise RuntimeError(result.stderr.decode()[:500])

def synthesize(job):
    slug, locale, index, cue = job
    fingerprint = hashlib.sha256(('melotts-v1|'+locale+'|'+cue[locale]).encode()).hexdigest()
    raw = cache/(fingerprint+'.wav')
    if not raw.exists():
        body = json.dumps({'prompt':cue[locale], 'lang':locale},ensure_ascii=False)
        for attempt in range(6):
            result = subprocess.run(['curl','-sS','--max-time','55','--config','-',f'https://api.cloudflare.com/client/v4/accounts/{args.account}/ai/run/@cf/myshell-ai/melotts','-H','Content-Type: application/json','--data-binary',body],input=('header = "Authorization: Bearer '+token+'"\n').encode(),capture_output=True)
            try:
                data=json.loads(result.stdout)
                encoded=(data.get('result') or {}).get('audio')
                if not encoded: raise ValueError(str(data.get('errors','Missing audio'))[:250])
                audio=base64.b64decode(encoded)
                if audio[:4]!=b'RIFF': raise ValueError('Expected WAV from speech model')
                raw.write_bytes(audio);break
            except (ValueError,TypeError) as error:
                if attempt==5: raise RuntimeError(f'{slug}/{locale}/{index}: {error}')
                time.sleep(min(12, 2*(attempt+1)))
    # Remove generator lead/tail silence, preserving pauses inside the spoken phrase.
    trimmed=cache/(fingerprint+'-trim.wav')
    if not trimmed.exists():
        command('-i',raw,'-af','silenceremove=start_periods=1:start_duration=0.02:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-48dB,areverse','-ar',RATE,'-ac',1,'-c:a','pcm_s16le',trimmed)
    with wave.open(str(trimmed),'rb') as w: duration=w.getnframes()/w.getframerate()
    print(f'{slug}/{locale}/{index+1}: {duration:.2f}s',flush=True)
    return (slug,locale,index), (trimmed,duration,fingerprint)

jobs=[(slug,locale,i,cue) for slug,film in scripts.items() if not args.only or slug==args.only for locale in ('zh','en') for i,cue in enumerate(film['cues'])]
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    rendered={}
    failures=[]
    futures=[pool.submit(synthesize, job) for job in jobs]
    for future in concurrent.futures.as_completed(futures):
        try:
            key, value=future.result(); rendered[key]=value
        except RuntimeError as error: failures.append(str(error))
errors=failures
for slug,film in scripts.items():
    if args.only and args.only!=slug:continue
    manifest.setdefault(slug,{})
    for locale in ('zh','en'):
        if any((slug,locale,i) not in rendered for i in range(len(film['cues']))): continue
        samples=array.array('h',[0])*round(film['duration']*RATE)
        cues=[]
        for i,cue in enumerate(film['cues']):
            source,duration,fingerprint=rendered[(slug,locale,i)]
            end=film['cues'][i+1]['at'] if i+1<len(film['cues']) else film['duration']
            window=end-cue['at']-.18
            speed=max(0.92,duration/window)
            if speed>1.18:
                errors.append(f'{slug}/{locale}/{i+1}: {duration:.2f}s for {window:.2f}s; shorten the script (would need {speed:.2f}×).')
                continue
            fitted=cache/(fingerprint+f'-fit-{speed:.5f}.wav')
            command('-i',source,'-af',f'atempo={speed:.6f},loudnorm=I=-18:TP=-2:LRA=7','-ar',RATE,'-ac',1,'-c:a','pcm_s16le',fitted)
            with wave.open(str(fitted),'rb') as w: part=array.array('h',w.readframes(w.getnframes()))
            start=round(cue['at']*RATE)
            if start+len(part)>len(samples): errors.append(f'{slug}/{locale}/{i+1}: narration exceeds film');continue
            samples[start:start+len(part)]=part
            cues.append({'at':cue['at'],'end':cue['at']+len(part)/RATE,'text':cue[locale],'tempo':round(speed,5)})
        if len(cues)!=len(film['cues']):continue
        wav=cache/f'{slug}-{locale}-mix.wav'
        with wave.open(str(wav),'wb') as w:
            w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(samples.tobytes())
        digest=hashlib.sha256(samples.tobytes()).hexdigest()[:12]
        filename=f'{slug}-{locale}-{digest}.mp3'
        command('-i',wav,'-codec:a','libmp3lame','-b:a','128k',out/filename)
        manifest[slug][locale]={'src':'/narration/'+filename,'duration':film['duration'],'voice':'MeloTTS · '+locale,'cues':cues}
        print(f'Assembled {filename}',flush=True)
temporary_manifest = manifest_path.with_suffix('.json.tmp')
temporary_manifest.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
temporary_manifest.replace(manifest_path)
if errors:
    print('\n'.join(errors),file=sys.stderr);raise SystemExit(1)
