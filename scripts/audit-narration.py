#!/usr/bin/env python3
"""Optional transcription audit of every recorded chapter (not a listening review).
The cloudflare backend requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.
The optional mlx backend runs locally on Apple silicon with mlx-whisper installed.
Results stay in ignored artifacts/; cached transcripts are keyed by audio bytes.
"""
import argparse, base64, concurrent.futures, difflib, hashlib, json, os, re, subprocess, threading, time, urllib.error, urllib.request
from pathlib import Path
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--only', nargs='+', help='One or more topic slugs')
parser.add_argument('--workers', type=int, default=3, help='Bounded transcription concurrency (1–3)')
parser.add_argument('--attempts', type=int, default=4, choices=range(1,5), help='Attempts per uncached clip (1–4); use 1 to probe after an upstream limit')
parser.add_argument('--backend', choices=['cloudflare','mlx'], default='cloudflare')
args=parser.parse_args()
if args.backend=='cloudflare':
    account=os.environ['CLOUDFLARE_ACCOUNT_ID']; token=os.environ['CLOUDFLARE_API_TOKEN']
    url=f'https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/@cf/openai/whisper-large-v3-turbo'
else:
    import mlx_whisper
    import numpy as np
cache=ROOT/('.voice-cache/asr' if args.backend=='cloudflare' else '.voice-cache/asr-mlx-large-v3-turbo');cache.mkdir(parents=True,exist_ok=True)
manifest=json.loads((ROOT/'src/data/audio-manifest.json').read_text())
selected=set(args.only or manifest)
unknown=selected-manifest.keys()
if unknown: raise SystemExit('Unknown topics: '+', '.join(sorted(unknown)))
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
audit_stop=threading.Event()
def normalized(text): return ''.join(re.findall(r'[a-z0-9\u3400-\u9fff]',text.lower()))
def ending_coverage(expected, transcript):
    expected, transcript = normalized(expected), normalized(transcript)
    if not expected: return 0.0
    start=max(0,len(expected)-max(24,len(expected)//5))
    blocks=difflib.SequenceMatcher(None,expected,transcript,autojunk=False).get_matching_blocks()
    matched=sum(max(0,block.a+block.size-max(block.a,start)) for block in blocks)
    return matched/(len(expected)-start)
def inspect(job):
    if audit_stop.is_set(): raise RuntimeError('Transcription paused after an upstream limit; resume later from cache.')
    slug,locale,index,track,cue=job
    audio=subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-i',str(ROOT/'public'/track['src'].lstrip('/')),'-ss',str(cue['at']),'-t',str(cue['end']-cue['at']),'-ar','16000','-ac','1','-f','mp3','pipe:1'],check=True,capture_output=True).stdout
    digest=hashlib.sha256(audio).hexdigest(); file=cache/(digest+'.json')
    if file.exists(): result=json.loads(file.read_text())
    elif args.backend=='mlx':
        pcm=subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-i','pipe:0','-ar','16000','-ac','1','-f','f32le','pipe:1'],input=audio,check=True,capture_output=True).stdout
        decoded=mlx_whisper.transcribe(np.frombuffer(pcm,dtype=np.float32),path_or_hf_repo='mlx-community/whisper-large-v3-turbo',verbose=None,condition_on_previous_text=False)
        result={'text':decoded.get('text',''),'transcription_info':{'language':decoded.get('language','')}}
        file.write_text(json.dumps(result,ensure_ascii=False))
    else:
        data=json.dumps({'audio':base64.b64encode(audio).decode(),'task':'transcribe'}).encode()
        for attempt in range(args.attempts):
            if audit_stop.is_set(): raise RuntimeError('Transcription paused after an upstream limit; resume later from cache.')
            try:
                request=urllib.request.Request(url,data,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
                with urllib.request.urlopen(request,timeout=90) as response: payload=json.load(response)
                if not payload.get('success'): raise RuntimeError('Transcription service rejected request')
                result=payload['result'];file.write_text(json.dumps(result,ensure_ascii=False));break
            except urllib.error.HTTPError as error:
                try: details=json.loads(error.read())
                except (ValueError, UnicodeDecodeError): details={}
                codes=[item.get('code') for item in details.get('errors',[]) if isinstance(item,dict)]
                messages=[str(item.get('message',''))[:200] for item in details.get('errors',[]) if isinstance(item,dict)]
                if 3036 in codes or (error.code==429 and any('daily free allocation' in message.lower() for message in messages)):
                    audit_stop.set()
                    raise RuntimeError('Workers AI daily allocation exhausted; stop and resume after allocation resets.') from None
                if attempt==args.attempts-1:
                    if error.code==429: audit_stop.set()
                    raise RuntimeError(f'Transcription HTTP {error.code}, service codes {codes}: {messages}; audit remains incomplete.') from None
                if error.code==429:
                    try: delay=float(error.headers.get('Retry-After','60'))
                    except (TypeError,ValueError): delay=60
                    delay=max(30,delay,30*2**attempt)
                    print(f'{slug}/{locale}/{index+1}: HTTP 429 {codes}; backing off {delay:.0f}s',flush=True)
                    time.sleep(delay)
                else: time.sleep(2**attempt)
            except Exception:
                if attempt==args.attempts-1: raise
                time.sleep(2**attempt)
    transcript=result.get('text',''); info=result.get('transcription_info',{})
    similarity=difflib.SequenceMatcher(None,normalized(cue['text']),normalized(transcript),autojunk=False).ratio()
    language=info.get('language','')
    ending=ending_coverage(cue['text'],transcript)
    # A long missing suffix can still pass the overall similarity threshold.
    # This is a review guard, not proof of natural speech or perfect transcription.
    passed=language==locale and similarity>=.64 and ending>=.4
    entry={'backend':args.backend,'topic':slug,'locale':locale,'chapter':index+1,'audioSha256':digest,'language':language,'similarity':round(similarity,4),'endingCoverage':round(ending,4),'pass':passed,'expected':cue['text'],'transcript':transcript}
    print(f'{slug}/{locale}/{index+1}: {language} {similarity:.3f} ending {ending:.3f} {"PASS" if passed else "REVIEW"}',flush=True)
    return entry
jobs=[(slug,locale,i,track,cue) for slug,locales in manifest.items() if slug in selected for locale,track in locales.items() for i,cue in enumerate(track['cues'])]
with concurrent.futures.ThreadPoolExecutor(max_workers=1 if args.backend=='mlx' else max(1,min(args.workers,3))) as pool: results=list(pool.map(inspect,jobs))
out=ROOT/'artifacts';out.mkdir(exist_ok=True)
(out/'narration-transcription.json').write_text(json.dumps({'method':f'Independent {args.backend} Whisper large-v3-turbo ASR, no language hint or reference prompt. Does not certify vocal delivery.','chapters':results},ensure_ascii=False,indent=2)+'\n')
print(f'{len(results)} chapters; {sum(not r["pass"] for r in results)} require review.',flush=True)
raise SystemExit(0 if all(r['pass'] for r in results) else 1)
