"""Validate current inputs, complete evidence phases and preservation before a source checkpoint."""
from pathlib import Path
import hashlib,html,json,re,subprocess
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v15';BASE='0776b37eead4b3ac1bd16a53f25991ce3614e893'
receipt=json.loads((OUT/'BUILD-RECEIPT.json').read_text());assert receipt['returncode']==0
for n,h in receipt['inputs'].items():assert hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h,'Changed build input '+n
for n,h in receipt['outputs'].items():assert hashlib.sha256((ROOT/'adventures-dist'/n).read_bytes()).hexdigest()==h,'Changed build output '+n
checks=[]
for n,count in {'inn-rooms.json':16,'inn-compat-cost.json':7,'regular-batch.json':7}.items():
 phase=json.loads((OUT/n).read_text());assert len(phase['checks'])==count,(n,len(phase['checks']));assert all(c['passed']for c in phase['checks']),n;checks.extend({**c,'evidence':n}for c in phase['checks'])
unit=(OUT/'unit-tests.txt').read_text();tests=int(re.search(r'ℹ tests (\d+)',unit)[1]);assert int(re.search(r'ℹ pass (\d+)',unit)[1])==tests and re.search(r'ℹ fail (\d+)',unit)[1]=='0'
protected=[]
for row in subprocess.check_output(['git','ls-tree','-rz',BASE],cwd=ROOT.parent).split(b'\0'):
 if not row:continue
 meta,raw=row.split(b'\t',1);n=raw.decode()
 if n.startswith(('blockworld2/src/adventures/','blockworld2/tests/adventures'))or n=='blockworld2/docs/ASSET-REBUILD-CONTINUE.md':continue
 data=(ROOT.parent/n).read_bytes();assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==meta.decode().split()[2],n;protected.append(n)
summary={'preservedRemoteBase':BASE,'verifiedRemoteCheckpoint':'1468768ed3052a1973269ef0d9df57996a3319b9','runtimeSourceHashes':{n:h for n,h in receipt['inputs'].items()if n.startswith(('src/adventures/','public/adventures/'))or n in ['adventures.html','vite.adventures.config.ts']},'deterministicTests':tests,'browserChecks':len(checks),'checks':checks,'protectedFiles':protected,'runtimeBuildHashes':receipt['outputs'],'limitations':['Managed Chromium SwiftShader and phone/tablet plus standard Gamepad API emulation only; physical hardware unverified.','New full-sized inn furnishings apply only to newly created rooms; saved rooms are never regenerated.','Existing assets reused; no new model/image download or catalogue item.','No deployment, main merge, automation change or reset redemption.']}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
shots=[('inn-common-phone.png','Phone: furnished inn common room'),('inn-common-tablet.png','Tablet: dining groups, serving area and clear stair approach'),('inn-guest-floor-phone.png','Phone: ordinary stair ascent and guest floor'),('inn-guest-floor-tablet.png','Tablet: two upstairs beds and landing')]
for n,_ in shots:assert(OUT/'screenshots'/n).is_file(),n
cards=''.join(f'<figure><img src="screenshots/{n}" alt="{html.escape(t)}"><figcaption>{html.escape(t)}</figcaption></figure>'for n,t in shots)
(OUT/'gallery.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>BlockWorld Adventures Preview 15 evidence</title><style>body{background:#e6e8dc;color:#233e35;font:16px system-ui;margin:24px}main{display:flex;flex-wrap:wrap;gap:20px}figure{margin:0;max-width:560px}img{max-width:100%;max-height:760px;object-fit:contain;background:#c6d9d4}figcaption{padding:12px}</style><h1>Preview 15: actual rendered evidence</h1><p>Managed Chromium SwiftShader and phone/tablet emulation. Physical hardware unverified. Fox: PixelMannen CC0; tomkranis, AsoboStudio/scurest CC BY 4.0. See bundled provenance.</p><main>'+cards+'</main>')
print(json.dumps({'deterministicTests':tests,'browserChecks':len(checks),'protectedFiles':len(protected),'runtimeFiles':len(receipt['outputs'])}))
