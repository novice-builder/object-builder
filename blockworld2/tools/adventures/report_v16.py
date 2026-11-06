"""Validate current inputs, complete evidence phases and preservation before a source checkpoint."""
from pathlib import Path
import hashlib,html,json,re,subprocess
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v16';BASE='dc3b5b7c162e525d30fd70277aa47ab786347353'
receipt=json.loads((OUT/'BUILD-RECEIPT.json').read_text());assert receipt['returncode']==0
for n,h in receipt['inputs'].items():assert hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h,'Changed build input '+n
for n,h in receipt['outputs'].items():assert hashlib.sha256((ROOT/'adventures-dist'/n).read_bytes()).hexdigest()==h,'Changed build output '+n
checks=[]
for n,count in {'oakfield.json':50,'oakfield-inputs.json':16,'oakfield-compat-cost.json':7,'oakfield-roads.json':7}.items():
 phase=json.loads((OUT/n).read_text());assert len(phase['checks'])==count,(n,len(phase['checks']));assert all(c['passed']for c in phase['checks']),n;checks.extend({**c,'evidence':n}for c in phase['checks'])
unit=(OUT/'unit-tests.txt').read_text();tests=int(re.search(r'ℹ tests (\d+)',unit)[1]);assert int(re.search(r'ℹ pass (\d+)',unit)[1])==tests and re.search(r'ℹ fail (\d+)',unit)[1]=='0'
protected=[]
for row in subprocess.check_output(['git','ls-tree','-rz',BASE],cwd=ROOT.parent).split(b'\0'):
 if not row:continue
 meta,raw=row.split(b'\t',1);n=raw.decode()
 if n.startswith(('blockworld2/src/adventures/','blockworld2/tests/adventures'))or n=='blockworld2/docs/ASSET-REBUILD-CONTINUE.md':continue
 data=(ROOT.parent/n).read_bytes();assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==meta.decode().split()[2],n;protected.append(n)
summary={'preservedRemoteBase':BASE,'verifiedRemoteCheckpoint':'084b5b8b0f11a690e8562ad83c60e830a7f4394c','runtimeSourceHashes':{n:h for n,h in receipt['inputs'].items()if n.startswith(('src/adventures/','public/adventures/'))or n in ['adventures.html','vite.adventures.config.ts']},'deterministicTests':tests,'browserChecks':len(checks),'checks':checks,'protectedFiles':protected,'runtimeBuildHashes':receipt['outputs'],'limitations':['Managed Chromium SwiftShader and phone/tablet plus standard Gamepad API emulation only; physical hardware unverified.','Fresh layout9 contains permanent new footprints; previous layouts and records are retained independently.','Existing licensed assets reused; no new model/image download or catalogue bulk.','No deployment, main merge, automation change or reset redemption.']}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
shots=[('oakfield-overview-tablet.png','Oakfield: actual new garden-village layout'),('oakfield-street-phone.png','Phone: new street and market'),('oakfield-street-tablet.png','Tablet: village centre'),('oakfield-map-phone.png','Actual map with eleven destinations'),('inn-common-phone.png','Phone: enterable Oakfield inn common room'),('inn-guest-floor-tablet.png','Tablet: physically walked guest-floor landing')]
for n,_ in shots:assert(OUT/'screenshots'/n).is_file(),n
cards=''.join(f'<figure><img src="screenshots/{n}" alt="{html.escape(t)}"><figcaption>{html.escape(t)}</figcaption></figure>'for n,t in shots)
(OUT/'gallery.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>BlockWorld Adventures Preview 16 evidence</title><style>body{background:#e6e8dc;color:#233e35;font:16px system-ui;margin:24px}main{display:flex;flex-wrap:wrap;gap:20px}figure{margin:0;max-width:560px}img{max-width:100%;max-height:760px;object-fit:contain;background:#c6d9d4}figcaption{padding:12px}</style><h1>Preview 16: actual rendered evidence</h1><p>Managed Chromium SwiftShader and phone/tablet emulation. Physical hardware unverified. Fox: PixelMannen CC0; tomkranis, AsoboStudio/scurest CC BY 4.0. See bundled provenance.</p><main>'+cards+'</main>')
print(json.dumps({'deterministicTests':tests,'browserChecks':len(checks),'protectedFiles':len(protected),'runtimeFiles':len(receipt['outputs'])}))
