#!/usr/bin/env python3
"""Optional transcription audit of every recorded chapter (not a listening review).
Requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN with Workers AI access.
Results stay in ignored artifacts/; cached transcripts are keyed by audio bytes.
"""
import argparse, base64, concurrent.futures, difflib, hashlib, json, os, re, subprocess, time, urllib.request
from pathlib import Path
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--only', help='One topic slug')
args=parser.parse_args()
account=os.environ['CLOUDFLARE_ACCOUNT_ID']; token=os.environ['CLOUDFLARE_API_TOKEN']
url=f'https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/@cf/openai/whisper-large-v3-turbo'
cache=ROOT/'.voice-cache/asr';cache.mkdir(parents=True,exist_ok=True)
manifest=json.loads((ROOT/'src/data/audio-manifest.json').read_text())
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
def normalized(text): return ''.join(re.findall(r'[a-z0-9\u3400-\u9fff]',text.lower()))
def inspect(job):
    slug,locale,index,track,cue=job
    audio=subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-i',str(ROOT/'public'/track['src'].lstrip('/')),'-ss',str(cue['at']),'-t',str(cue['end']-cue['at']),'-ar','16000','-ac','1','-f','mp3','pipe:1'],check=True,capture_output=True).stdout
    digest=hashlib.sha256(audio).hexdigest(); file=cache/(digest+'.json')
    if file.exists(): result=json.loads(file.read_text())
    else:
        data=json.dumps({'audio':base64.b64encode(audio).decode(),'task':'transcribe'}).encode()
        for attempt in range(4):
            try:
                request=urllib.request.Request(url,data,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
                with urllib.request.urlopen(request,timeout=90) as response: payload=json.load(response)
                if not payload.get('success'): raise RuntimeError('Transcription service rejected request')
                result=payload['result'];file.write_text(json.dumps(result,ensure_ascii=False));break
            except Exception:
                if attempt==3: raise
                time.sleep(2**attempt)
    transcript=result.get('text',''); info=result.get('transcription_info',{})
    similarity=difflib.SequenceMatcher(None,normalized(cue['text']),normalized(transcript),autojunk=False).ratio()
    language=info.get('language','')
    passed=language==locale and similarity>=.64
    entry={'topic':slug,'locale':locale,'chapter':index+1,'audioSha256':digest,'language':language,'similarity':round(similarity,4),'pass':passed,'expected':cue['text'],'transcript':transcript}
    print(f'{slug}/{locale}/{index+1}: {language} {similarity:.3f} {"PASS" if passed else "REVIEW"}',flush=True)
    return entry
jobs=[(slug,locale,i,track,cue) for slug,locales in manifest.items() if not args.only or slug==args.only for locale,track in locales.items() for i,cue in enumerate(track['cues'])]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: results=list(pool.map(inspect,jobs))
out=ROOT/'artifacts';out.mkdir(exist_ok=True)
(out/'narration-transcription.json').write_text(json.dumps({'method':'Independent ASR, no language hint or reference prompt. Does not certify vocal delivery.','chapters':results},ensure_ascii=False,indent=2)+'\n')
print(f'{len(results)} chapters; {sum(not r["pass"] for r in results)} require review.',flush=True)
raise SystemExit(0 if all(r['pass'] for r in results) else 1)
