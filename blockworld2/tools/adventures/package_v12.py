"""Package a tested development build into a NEW, immutable preview folder. Never deploys."""
import argparse,pathlib,json,re,hashlib,subprocess,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--version',required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--qa-dir',type=pathlib.Path,default=pathlib.Path('docs/adventures-v12'));a=p.parse_args()
if not re.fullmatch(r'\d{2}',a.version)or int(a.version)<12:raise SystemExit('Use a new preview version, 12 or later')
out=a.output.resolve();qa_dir=(ROOT/a.qa_dir).resolve();dist=ROOT/'adventures-dist'
source_version=re.search(r'PREVIEW_VERSION\s*=\s*"(\d{2})"',(ROOT/'src/adventures/version.ts').read_text())
if not source_version or source_version[1]!=a.version:raise SystemExit('Requested package version must match the shared runtime/backup version')
# Validate BEFORE creating/changing any file. Existing packages/metadata are immutable.
if out != ROOT/f'artifacts/adventures-v{int(a.version)}':raise SystemExit('Use the matching NEW numbered artifacts folder')
if out.exists()and any(out.iterdir()):raise SystemExit('Refusing to overwrite a nonempty version folder')
if qa_dir != ROOT/f'docs/adventures-v{int(a.version)}':raise SystemExit('Use the matching NEW versioned QA folder')
qa=json.loads((qa_dir/'summary.json').read_text());checks=qa['checks']
if not checks or any(not c['passed']for c in checks):raise SystemExit('Complete successful browser checks before packaging')
for name,expected in qa['runtimeSourceHashes'].items():
 if hashlib.sha256((ROOT/name).read_bytes()).hexdigest()!=expected:raise SystemExit('Runtime source differs from tested summary: '+name)
for name,expected in qa['runtimeBuildHashes'].items():
 if hashlib.sha256((dist/name).read_bytes()).hexdigest()!=expected:raise SystemExit('Runtime build differs from tested summary: '+name)
receipt=json.loads((qa_dir/'BUILD-RECEIPT.json').read_text())
if receipt['returncode']!=0:raise SystemExit('Strict build receipt must pass')
for name,expected in receipt['inputs'].items():
 if hashlib.sha256((ROOT/name).read_bytes()).hexdigest()!=expected:raise SystemExit('Changed strict-build input: '+name)
if receipt['outputs']!=qa['runtimeBuildHashes']:raise SystemExit('Build receipt and tested output hashes differ')
unit=(qa_dir/'unit-tests.txt').read_text();count=re.search(r'ℹ tests (\d+)',unit);passed=re.search(r'ℹ pass (\d+)',unit);failed=re.search(r'ℹ fail (\d+)',unit)
if not count or not passed or not failed or failed[1]!='0' or count[1]!=passed[1]:raise SystemExit('Full deterministic test log must pass')
if not (dist/'adventures.html').is_file():raise SystemExit('Build the Adventures app first')
for path in ['src/adventures','public/adventures','adventures.html','vite.adventures.config.ts']:
 if subprocess.run(['git','diff','--quiet','HEAD','--',path],cwd=ROOT).returncode:raise SystemExit('Commit the tested runtime source before packaging')
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();version=a.version
readme=f'''BlockWorld Adventures — Development Preview {version}

Unzip into a NEW folder. Run `python3 preview.py` (Windows: `py preview.py`).
Open http://localhost:8000/adventures.html . Models and modules require the local server; direct file opening does not work. This is a local development preview, with no publishing or deployment.
Exact runtime source: https://github.com/novice-builder/object-builder/tree/{commit}

ONE CONNECTED WORLD: Willow Vale contains Willowmere, Whispering Wood, Maker’s Meadow, Brookside, Alderwick, Reedbank and new Miller’s End. Two ordinary walking routes link the new inn, cottages, workshop and market to Willowmere and its existing windmill. Three fitted river bridges remain. Tap the live minimap for the real-world map, drag/pinch to explore, tap a named place to travel safely, or choose Home. The map is generated from actual scene data.

SAVES: Miller’s End uses a NEW layout 7 and a separate fresh world record. Earlier saved layouts and constructions are kept as they were; choose a fresh valley in Places to try the district. Layout-7 backups require Preview 12+. Older Preview 11 rejects these imports safely. Earlier version-3 rooms/movement backups need Preview 11+. Original Preview 01/02 independent worlds are not silently merged or moved. Older records using new room/movement features keep their original record when an updated copy is needed. Native checksummed .bw2 backup import creates an independent record. Export before changing browser, address or device. Private browser storage is not a permanent backup.

ENTER BUILDINGS through the Enter prompt. A short fade loads that building’s own furnished 3D room; Exit returns to the same safe exterior position/facing. New cottages/workshops have one floor; town houses, inns and mills have real walkable stairs and upper floors. Older saved upper floors and furnishings are retained. Layout 7 also opens Old Willow Windmill and Alderwick Windmill, with separate grain lofts. Windmill rooms are approximate rectangular templates, not circular architectural replicas; exact compact tower interiors remain unfinished. The original Meadow Lodge retains its physical opening door. Outdoor rendering is suspended while indoors; shared outdoor resources stay loaded. Furniture can be moved, rotated, transferred between floors and undone/redone.

MOVEMENT: Running is the default; tap Walk for a saved slower pace. WASD/arrows move; Space jumps; Shift temporarily runs in Walk mode. Touch uses the left joystick, separate Jump target, drag to look and pinch to change camera distance. Generic actual-mesh collision steps onto clear surfaces up to 0.30m, checks head/landing clearance and retains real footing. Walls, furniture and taller ledges block ordinary movement. Recognised oversized stock risers are fitted inside their original bounds. Arbitrary CAD import/collision-baking UI is unfinished.

CONTROLLER: Standard browser Gamepad API mapping: left stick moves, right stick looks; A interacts/confirms/selects, B cancels, X opens Build, Y interacts, left bumper jumps, right bumper rotates, left-stick click toggles Walk, View opens map and Menu opens menu. Release controls after reconnecting or opening a menu. Keyboard/touch remain available after disconnect. Map toolbar touch presses respond after pinch/pan, avoid duplicate actions and retain keyboard/controller activation. Physical Xbox/Bluetooth tests remain UNVERIFIED.

PHONE/TABLET: Choose Gentle graphics first. Phone portrait/landscape and tablet landscape/portrait have browser checks. To try your own physical device on the same Wi-Fi, optionally run `python3 preview.py --lan` and use the computer’s LAN IP on port8000. This is an optional user-run local preview, not deployment. LAN HTTP may restrict Gamepad API; touch/keyboard remain. Managed Chromium SwiftShader FPS does not establish Lenovo/iPhone/Safari performance. Physical device/controller tests remain unverified.

BUILDING/ASSETS: Existing 21 thumbnails and editing tools remain; no generic inventory bulk. This release reuses the existing coherent CC0 assets and licences, with no new model/texture download. Provenance: adventures/PROVENANCE.md and adventures/licences. Restricted Seahill/Quaternius Nature downloads are not included.

Review gallery.html, review/REPORT.md and review/summary.json for actual screenshots, full test/build evidence, measured workloads, preservation and known limitations. Main/original public site, Run 3, Neighborhood 06, old previews/archives/branches, player saves and backups remain protected. No deployment, merge, automation change or reset redemption occurred. Development continues after this release.
'''
server='''from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse,os
p=argparse.ArgumentParser();p.add_argument('--lan',action='store_true');a=p.parse_args();os.chdir(Path(__file__).resolve().parent)
print('Open http://localhost:8000/adventures.html (Ctrl+C to stop)',flush=True)
ThreadingHTTPServer(('0.0.0.0' if a.lan else '127.0.0.1',8000),SimpleHTTPRequestHandler).serve_forever()
'''
files={str(f.relative_to(dist)):f for f in dist.rglob('*')if f.is_file()}
build={'version':'Adventures-Preview-'+version,'sourceCommit':commit,'verifiedBase':qa['verifiedRemoteCheckpoint'],'published':False,'deterministicTests':int(count[1]),'browserChecks':len(checks),'files':{n:{'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}for n,f in sorted(files.items())}}
out.mkdir(parents=True,exist_ok=True);(out/'BUILD.json').write_text(json.dumps(build,indent=2)+'\n');(out/'README.txt').write_text(readme);archive=out/f'BlockWorld-Adventures-Preview-{version}.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for n,f in sorted(files.items()):z.write(f,n)
 z.writestr('BUILD.json',json.dumps(build,indent=2));z.writestr('README.txt',readme);z.writestr('preview.py',server)
 for f in qa_dir.rglob('*'):
  if f.is_file():z.write(f,'review/'+str(f.relative_to(qa_dir)))
 z.writestr('gallery.html',(qa_dir/'gallery.html').read_text().replace('src="screenshots/','src="review/screenshots/'))
(out/'CHECKSUMS.sha256').write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name+'\n');print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sourceCommit':commit,'checks':len(checks)}))
