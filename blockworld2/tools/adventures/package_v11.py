"""Package a tested development build into a NEW, immutable preview folder. Never deploys."""
import argparse,pathlib,json,re,hashlib,subprocess,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--version',required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--qa-dir',type=pathlib.Path,default=pathlib.Path('docs/adventures-v11'));a=p.parse_args()
if not re.fullmatch(r'\d{2}',a.version)or int(a.version)<11:raise SystemExit('Use a new preview version, 11 or later')
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
unit=(qa_dir/'unit-tests.txt').read_text();count=re.search(r'ℹ tests (\d+)',unit);passed=re.search(r'ℹ pass (\d+)',unit);failed=re.search(r'ℹ fail (\d+)',unit)
if not count or not passed or not failed or failed[1]!='0' or count[1]!=passed[1]:raise SystemExit('Full deterministic test log must pass')
if not (dist/'adventures.html').is_file():raise SystemExit('Build the Adventures app first')
for path in ['src/adventures','public/adventures','adventures.html','vite.adventures.config.ts']:
 if subprocess.run(['git','diff','--quiet','HEAD','--',path],cwd=ROOT).returncode:raise SystemExit('Commit the tested runtime source before packaging')
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();version=a.version
readme=f'''BlockWorld Adventures — Development Preview {version}

Unzip into a NEW folder. Run `python3 preview.py` (Windows: `py preview.py`).
Open http://localhost:8000/adventures.html . ES modules/GLBs require this local server; direct file opening does not work.

Local development preview. All models, images, animations and licences are included. No accounts, CDN downloads or purchases are needed. Nothing is deployed or published.
Exact runtime source: https://github.com/novice-builder/object-builder/tree/{commit}

The continuous Willow Vale includes Willowmere, Whispering Wood, Maker's Meadow, Brookside, Alderwick and Reedbank, connected roads/trails and three fitted river bridges. The compact minimap follows your real location; tap it for the actual-world map, pan/zoom, safe landmark travel and Home.

MOVEMENT: Running is now the default. Tap Walk for a saved slower mode. Keyboard WASD/arrows move, Space jumps; Shift temporarily runs in Walk mode. Touch uses the left joystick and Jump button, with drag/pinch camera control. Standard browser gamepad mapping: left stick moves, right stick looks; A interacts/selects/confirms, B cancels, X opens Build, Y interacts, LEFT BUMPER JUMPS, right bumper rotates, left-stick click toggles Walk, View opens map and Menu opens the menu. Release controls after reconnecting/opening a menu. Touch/keyboard stay available after disconnect. Physical Xbox/Bluetooth testing is UNVERIFIED.

Generic actual-triangle collision steps onto clear walkable surfaces up to 0.30m and checks landing/head clearance. Walls, taller ledges and furniture remain blocked during normal movement. Recognised human-scale stock exterior risers are rebuilt as real smaller treads inside their original footprint (town-house 0.378m becomes 0.189m). Original GLBs and saved construction coordinates are unchanged. Idle footing, descent, headroom and elevated building-return positions have regression coverage. Arbitrary CAD import UI and all possible custom scaled mesh cases remain unfinished.

ENTER ROOMS through the compact Enter prompt. A fade changes to a matching furnished 3D room; Exit fades back to a clear position at the SAME building, retaining facing and a safe elevated threshold where applicable. Town houses, inns and the mill have actual walkable stairs/connected upper floors. New cottages and workshops are single-storey. OLD SAVED COTTAGE UPPER FLOORS AND FURNISHINGS ARE KEPT. The original Meadow Lodge retains its physical opening door. Rooms are individually editable/saved; outdoor rendering is suspended while inside, and shared outdoor resources are retained.

SAVES: New worlds/templates and movement use version 3 and require Preview 11+. An older saved world first using a new room template or Jump keeps its original record and creates an independently named updated copy. Revisiting a saved older room keeps its template. Older runtimes reject version-3 imports safely. Earlier independent Preview 01/02 environments are not silently merged/remapped. Native checksummed .bw2 export/import remains; import creates a new record. Airborne checkpoints resume on clear actual support or the preceding landing. Export before changing browser, address or device. Failed writes/stale ownership pause saves for recovery; browser-private storage is not a permanent backup.

BUILD: Existing 21 model/furniture thumbnails, explicit placement, move/cancel, rotate, undo/redo and room floor transfer remain available. No catalogue/material bulk was added. Room sizes derive from exterior bounds with current template clamps; building-specific architectural replicas, church/market interiors and richer interior activities remain unfinished.

PHONE/TABLET: Choose Gentle graphics first. To try your own device on the same Wi-Fi, run `python3 preview.py --lan`, allow the local server in your computer firewall if required, and use the computer's LAN IP with port 8000. This is an optional user-run local preview, not a site deployment. HTTP LAN origins may restrict browser Gamepad API support; touch/keyboard remain. Software Chromium SwiftShader/touch emulation is NOT physical Lenovo/iPhone/Safari performance. Physical-device/controller tests remain UNVERIFIED.

Read review/REPORT.md and review/summary.json for tests, measured costs and remaining work. gallery.html shows actual screenshots. Licences/provenance: adventures/PROVENANCE.md and adventures/licences. This milestone reuses existing CC0 models/Explorer jump clips and adds no model/image download. Original public website, Run 3, Neighborhood 06, main, older branches/packages and saved records are protected. No deployment, merge, automation change or reset redemption occurred. Development continues after this checkpoint.
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
