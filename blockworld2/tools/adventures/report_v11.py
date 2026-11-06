"""Consolidate final movement/template evidence and verify every retained file outside the authorised active code/docs/tests."""
from pathlib import Path
import hashlib,html,json,re,subprocess,shutil
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v11';BASE='3dcd4f630006fd00f5631d362ce9cc20da8a595c';VERIFIED='5930d5ab2bfad26e321a829a2476e1555e349ba1'
phases=['jump-controls.json','room-templates.json','room-compat.json','movement-inputs-final.json','outdoor-steps-final.json','outdoor-regressions-final.json','render-cost-final.json','furniture-edit-final.json','copy-names.json','bank-saves.json']
checks=[]
for name in phases:
 phase=json.loads((OUT/name).read_text());assert phase['checks']and all(c['passed']for c in phase['checks']),name
 checks.extend({**c,'evidence':name}for c in phase['checks'])
unit=(OUT/'unit-tests.txt').read_text();tests=int(re.search(r'ℹ tests (\d+)',unit)[1]);assert int(re.search(r'ℹ pass (\d+)',unit)[1])==tests and re.search(r'ℹ fail (\d+)',unit)[1]=='0'
protected=[]
allowed=('blockworld2/src/adventures/','blockworld2/docs/adventures-v11/','blockworld2/tests/adventures','blockworld2/tools/adventures/')
allowed_files={'blockworld2/docs/ASSET-REBUILD-CONTINUE.md'}
for row in subprocess.check_output(['git','ls-tree','-rz',BASE],cwd=ROOT.parent).split(b'\0'):
 if not row:continue
 meta,raw=row.split(b'\t',1);name=raw.decode()
 if name.startswith(allowed)or name in allowed_files:continue
 path=ROOT.parent/name;data=path.read_bytes();actual=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
 assert actual==meta.decode().split()[2],name
 protected.append(name)
source=[*ROOT.glob('src/adventures/*'),*ROOT.glob('public/adventures/**/*'),ROOT/'adventures.html',ROOT/'vite.adventures.config.ts']
hashes=lambda files,base=ROOT:{str(f.relative_to(base)):hashlib.sha256(f.read_bytes()).hexdigest()for f in sorted(files)if f.is_file()}
summary={'verifiedRemoteCheckpoint':VERIFIED,'preservedBase':BASE,'deterministicTests':tests,'browserChecks':len(checks),'checks':checks,'protectedFiles':protected,'runtimeSourceHashes':hashes(source),'runtimeBuildHashes':hashes((ROOT/'adventures-dist').rglob('*'),ROOT/'adventures-dist'),'limitations':['Chromium SwiftShader and touch/Gamepad API emulation only; no physical Lenovo/iPhone/Safari/Xbox/Bluetooth tests.','No FPS improvement or universal mobile performance claim.','Version-3 backups require Preview 11+. Older records remain separately stored.','No automatic CAD import/collision baking UI; arbitrary large custom risers still obey the 0.30m controller limit.','No new deployment or automation change.']}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
shots=[('exterior-stairs-phone-after.png','Real 18.9cm exterior steps and threshold entry'),('phone-movement-inputs-final.png','Phone upper-floor movement'),('tablet-movement-inputs-final.png','Tablet upper-floor movement'),('single-storey-cottage-phone.png','Fresh furnished single-storey cottage'),('townhouse-tablet-template-upper.png','Connected town-house upper floor'),('inn-phone-template-upper.png','Inn guest room'),('jump-phone.png','Phone jump and compact controls'),('jump-tablet.png','Tablet jump and controls'),('jump-controls-phone-landscape.png','Phone landscape controls')]
for name,_ in shots:assert(OUT/'screenshots'/name).is_file(),name
cards=''.join(f'<figure><img src="screenshots/{n}" alt="{html.escape(t)}"><figcaption>{html.escape(t)}</figcaption></figure>'for n,t in shots)
(OUT/'gallery.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>BlockWorld Adventures Preview 11 evidence</title><style>body{background:#e6e8dc;color:#233e35;font:16px system-ui;margin:24px}main{display:flex;flex-wrap:wrap;gap:20px}figure{margin:0;max-width:560px}img{max-width:100%;max-height:760px;object-fit:contain;background:#c6d9d4}figcaption{padding:12px}</style><h1>Preview 11: actual rendered evidence</h1><p>Managed Chromium SwiftShader and phone/tablet emulation. No physical device or controller claim. These views show the real game layout.</p><main>'+cards+'</main>')
print(json.dumps({'deterministicTests':tests,'browserChecks':len(checks),'protectedFiles':len(protected),'runtimeFiles':len(summary['runtimeBuildHashes'])}))
