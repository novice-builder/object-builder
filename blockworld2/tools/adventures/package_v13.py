"""Package a tested development build into a NEW, immutable preview folder. Never deploys."""
import argparse,pathlib,json,re,hashlib,subprocess,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--version',required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--qa-dir',type=pathlib.Path,default=pathlib.Path('docs/adventures-v13'));a=p.parse_args()
if not re.fullmatch(r'\d{2}',a.version)or int(a.version)<13:raise SystemExit('Use a new preview version, 13 or later')
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
Open http://localhost:8013/adventures.html . Models/modules need the server; direct file opening does not work. This local preview does not publish or deploy anything.
Exact runtime source: https://github.com/novice-builder/object-builder/tree/{commit}

SAVE SAFETY: This preview defaults to port 8013, keeping older localhost:8000 browser storage separate. To bring an older world across, export its .bw2 backup from the older preview, then use Menu > Import backup here. Import creates a new record; the old address/records stay intact. Changing browser, address or port changes storage; export before doing so. `python3 preview.py --port 8014` selects another local address if needed. Browser-private storage is not a permanent backup.

COMPACT WINDMILLS: Fresh Old Willow Windmill and Alderwick Windmill rooms have a 5.2×5.2m chamfered tower footprint, two ordinary ten-tread flights, a genuine turning landing at 1.5 m, a 3 m grain loft and head clearance through the upper-floor opening. Walk through both flights with keyboard, joystick or gamepad; no upstairs teleport or collision-ramp shortcut. A wall-aligned worktable, chair and supplies leave a usable ground aisle. Grain and shelves furnish the loft. The exit door follows the camera cutaway so it does not mask the avatar. Static joinery is batched by material/floor visibility, retaining actual collision geometry.

FORMATS: New worlds and compact-room copies use Adventures data version 4 and need Preview 13+. An older world first entering a NEW compact windmill keeps its complete original record and creates an independently named updated copy. EXISTING SAVED WINDMILL ROOMS KEEP THEIR OLD RECTANGULAR TEMPLATE, UPPER FLOOR AND EXACT EDITS. They are never silently rebuilt. Older Preview 12 rejects format 4 safely. Earlier independent Preview 01/02 places and saved layouts 1–6 worlds are not silently merged or remapped. A new layout 7 valley includes Miller’s End; earlier saved outdoor layouts remain as saved. Native checksummed backup import/export and below-zero riverbank save/reload remain supported.

ONE CONNECTED WORLD: Willow Vale includes Willowmere, Whispering Wood, Maker’s Meadow, Brookside, Alderwick, Reedbank and Miller’s End, with connecting roads/trails and three fitted bridges. Tap the live minimap for the real-world map, drag/pinch, tap a named landmark for safe travel, or choose Home. New and existing houses, inns, workshops and mills have their own saved furnished scenes. Town houses/inns/mills have connected upper floors; new cottages/workshops have one floor. Older saved upper floors stay intact. Meadow Lodge keeps its physical opening door. Outdoor rendering pauses indoors while shared resources stay loaded.

MOVEMENT/TOUCH: Running is the default; Walk saves a slower mode. WASD/arrows move, Space jumps, Shift temporarily runs in Walk mode. Touch uses the left joystick, Jump, drag to look and pinch for camera distance. Generic actual-mesh stepping supports clear surfaces up to 0.30 m with landing/head clearance; taller ledges, walls and furniture block ordinary movement. Recognised oversized stock risers are fitted inside their original footprint. Fast touch map/Enter/Exit presses work without relying on a delayed compatibility click. Keyboard and controller activation remain available.

CONTROLLER: Standard browser Gamepad API mapping: left stick moves, right stick looks; A interacts/confirms/selects, B cancels, X opens Build, Y interacts, left bumper jumps, right bumper rotates, left-stick click toggles Walk, View opens map and Menu opens menu. Release controls after reconnecting/opening a menu. Touch/keyboard remain after disconnect. Physical Xbox/Bluetooth tests are UNVERIFIED.

MOBILE: Choose Gentle graphics first. Phone portrait/landscape and tablet landscape/portrait have software browser checks. To try your own physical device on the same Wi-Fi, optionally run `python3 preview.py --lan` and use the computer’s LAN IP on port 8013. LAN HTTP can restrict Gamepad API support; touch/keyboard remain available. This optional user-run preview is not a site deployment. SwiftShader FPS does not establish Lenovo/iPhone/Safari performance. Physical devices remain unverified.

EDITING/ASSETS: Existing 21 model/furniture thumbnails and move/rotate/cancel/undo/redo/floor-transfer tools remain. No generic catalogue/material bulk was added. Existing CC0 plaster/door/furniture/environment models are reused with authored joinery; licences and source GLBs remain unchanged. Provenance: adventures/PROVENANCE.md and adventures/licences. No new model/image download. Restricted Seahill/Quaternius Nature packs are not included.

EVIDENCE/LIMITS: gallery.html and review/REPORT.md show actual browser views, tests, build receipts, preservation and measured workloads. The sampled compact room reduces ground calls 92→30 and landing/loft 119→35, with about 71 KB additional owned buffers and bounded repeated room resources; these are draw/resource measurements, not physical FPS. Other building-specific architecture, wildlife/NPCs, activities, distinct themes and arbitrary CAD import UI remain unfinished. Original public site/Run 3, Neighborhood 06, main, old branches/packages and saves/backups are protected. No deployment, main merge, automation change or reset redemption occurred. Development continues after this release.
'''
server='''from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import argparse,os
p=argparse.ArgumentParser();p.add_argument('--lan',action='store_true');p.add_argument('--port',type=int,default=8013);a=p.parse_args()
if not 1<=a.port<=65535:p.error('Port must be between 1 and 65535')
os.chdir(Path(__file__).resolve().parent)
print(f'Open http://localhost:{a.port}/adventures.html (Ctrl+C to stop)',flush=True)
ThreadingHTTPServer(('0.0.0.0' if a.lan else '127.0.0.1',a.port),SimpleHTTPRequestHandler).serve_forever()
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
