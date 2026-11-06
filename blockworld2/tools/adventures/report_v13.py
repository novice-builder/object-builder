"""Consolidate connected-world expansion evidence and verify every retained file outside the authorised active code/docs/tests."""
from pathlib import Path
import hashlib,html,json,re,subprocess,shutil
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v13';BASE='c7744177a301ae5b7c51d7535f242ee1e3527b33';VERIFIED='c7744177a301ae5b7c51d7535f242ee1e3527b33'
phases=['compact-mills.json','compact-compat.json','compact-edit.json']
expected={'compact-mills.json':28,'compact-compat.json':8,'compact-edit.json':6}
receipt=json.loads((OUT/'BUILD-RECEIPT.json').read_text());assert receipt['returncode']==0
for name,digest in receipt['inputs'].items():assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest,'Changed build input: '+name
for name,digest in receipt['outputs'].items():assert hashlib.sha256((ROOT/'adventures-dist'/name).read_bytes()).hexdigest()==digest,'Changed build output: '+name
checks=[]
for name in phases:
 phase=json.loads((OUT/name).read_text());assert len(phase['checks'])==expected[name],name+' is incomplete';assert phase['checks']and all(c['passed']for c in phase['checks']),name
 checks.extend({**c,'evidence':name}for c in phase['checks'])
unit=(OUT/'unit-tests.txt').read_text();tests=int(re.search(r'ℹ tests (\d+)',unit)[1]);assert int(re.search(r'ℹ pass (\d+)',unit)[1])==tests and re.search(r'ℹ fail (\d+)',unit)[1]=='0'
protected=[]
allowed=('blockworld2/src/adventures/','blockworld2/docs/adventures-v13/','blockworld2/tests/adventures','blockworld2/tools/adventures/')
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
summary={'verifiedRemoteCheckpoint':VERIFIED,'preservedBase':BASE,'deterministicTests':tests,'browserChecks':len(checks),'checks':checks,'protectedFiles':protected,'runtimeSourceHashes':hashes(source),'runtimeBuildHashes':hashes((ROOT/'adventures-dist').rglob('*'),ROOT/'adventures-dist'),'limitations':['Chromium SwiftShader and touch/Gamepad API emulation only; no physical Lenovo/iPhone/Safari/Xbox/Bluetooth tests.','No FPS improvement or universal mobile performance claim.','Version-4 worlds/compact-room copies require Preview 13. Older saved rooms retain their original geometry and edits.','No automatic CAD import/collision baking UI; arbitrary large custom risers still obey the 0.30m controller limit.','No new deployment or automation change.']}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
shots=[('compact-ground-phone.png','Furnished compact workroom with a clear aisle'),('compact-landing-phone.png','Phone: real intermediate landing'),('compact-loft-phone.png','Phone: connected grain loft'),('compact-landing-tablet.png','Tablet: stair turning landing'),('compact-loft-tablet.png','Tablet: compact loft and rails')]
for name,_ in shots:assert(OUT/'screenshots'/name).is_file(),name
cards=''.join(f'<figure><img src="screenshots/{n}" alt="{html.escape(t)}"><figcaption>{html.escape(t)}</figcaption></figure>'for n,t in shots)
(OUT/'gallery.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>BlockWorld Adventures Preview 13 evidence</title><style>body{background:#e6e8dc;color:#233e35;font:16px system-ui;margin:24px}main{display:flex;flex-wrap:wrap;gap:20px}figure{margin:0;max-width:560px}img{max-width:100%;max-height:760px;object-fit:contain;background:#c6d9d4}figcaption{padding:12px}</style><h1>Preview 13: actual rendered evidence</h1><p>Managed Chromium SwiftShader and phone/tablet emulation. No physical device or controller claim. These views show the real game layout.</p><main>'+cards+'</main>')
print(json.dumps({'deterministicTests':tests,'browserChecks':len(checks),'protectedFiles':len(protected),'runtimeFiles':len(summary['runtimeBuildHashes'])}))
