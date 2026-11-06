"""Package a tested development build into a NEW, immutable preview folder. Never deploys."""
import argparse,pathlib,json,re,hashlib,subprocess,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--version',required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--qa-dir',type=pathlib.Path,default=pathlib.Path('docs/adventures-v10'));a=p.parse_args()
if not re.fullmatch(r'\d{2}',a.version)or int(a.version)<10:raise SystemExit('Use a new preview version, 10 or later')
out=a.output.resolve();qa_dir=(ROOT/a.qa_dir).resolve();dist=ROOT/'adventures-dist'
source_version=re.search(r'PREVIEW_VERSION\s*=\s*"(\d{2})"',(ROOT/'src/adventures/version.ts').read_text())
if not source_version or source_version[1]!=a.version:raise SystemExit('Requested package version must match the shared runtime/backup version')
# Validate BEFORE creating/changing any file. Existing packages/metadata are immutable.
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
Open http://localhost:8000/adventures.html . Direct file:// opening is unsupported because this app loads ES modules and GLBs.

This is an isolated LOCAL development preview. All models, images, animations and licences are included; no accounts, CDN downloads or purchases are needed. Nothing is deployed or published. Exact runtime source: https://github.com/novice-builder/object-builder/tree/{commit}

Enter cottages, town houses, inns, smithies and the mill using the compact Enter prompt. The screen fades to a separate furnished 3D room; houses, inns and the mill have REAL WALKABLE STAIRS and a connected upper floor. Walk upstairs/downstairs normally using the same joystick, keyboard or browser-mapped gamepad. Each building retains its own furnishings and edits. Exit fades back to a clear position at the SAME building and restores outdoor facing. The original Meadow Lodge keeps its working physical door. New house rooms have bedrooms and new inns have guest beds and bedside cabinets. The mill has an upper grain/store room. Existing decorated rooms retain their previous furnishings. Church/market rooms, shop counters and richer building-specific activities remain unfinished.

FIRST ENTRY into a version-1 saved world makes an independently named interior copy and KEEPS THE ORIGINAL RECORD. New layout-6 or bedroom-model backups require Preview 10 or later. Earlier room-only records remain compatible with Preview 09 until newer features are used. Earlier scenery and independent Preview 01/02 records are not silently combined or remapped. Native export/import uses checksummed .bw2 backups; import creates a new record. Export before changing browser, address or device. Failed writes/stale-tab conflicts preserve in-memory work and pause saving; export or Save a new copy to recover. The native persistence database/schema remains unchanged.

The Willow Vale is one continuous 370x196-metre world joining Willowmere, Whispering Wood and Maker's Meadow, three river bridges, Brookside, the foresters' cottages, Alderwick market town and (in fresh layout 6) Reedbank mill hamlet. Walk the roads without switching world/save. Existing layouts/constructions remain unchanged. Reedbank adds a northern river crossing and scenic meadow/lodge route; new layout 6 aligns the actual bridge decks and their walking profiles. Places lists older records and can create a fresh valley with Reedbank. Existing layouts 1–5 are retained. No construction-migration tool is claimed. Future different worlds will use genuinely different themes; this package prioritises the connected valley.

Tap the circular minimap or press M for the actual-geometry full world map. Drag/pinch or use zoom controls; tap a meaningful named destination for checked safe travel. Home returns to Willowmere. Indoors, the map locates the exterior entrance; explicit map travel safely leaves the room for the selected destination. The full map pauses hidden 3D rendering. Fades release held inputs and refuse rapid duplicate entry. Reload restores a complete location, including an upper floor. Fully blocked exits refuse unsafe travel; the map offers other safe destinations.

WASD/arrows walk; Shift runs; drag to orbit; wheel/pinch zooms; E interacts; B opens Build; Escape closes overlays. Touch uses a left joystick, another thumb to look and a Run toggle. Standard browser Gamepad API controls: left stick walks, right stick looks, A confirms/interacts/places, B goes back, X Build, Y interact, RB rotate, LS click Run, View map, Menu. D-pad navigates menus; mapping help is in the menu. Release controls after opening overlays/reconnecting. Touch and keyboard remain available if the Gamepad API is denied/unavailable. Physical Xbox/Bluetooth is UNVERIFIED; secure-origin/browser restrictions may apply.

Use Build to decorate rooms or create outdoors. Choose an existing model, tap nearby visible supported ground/floor, rotate and choose Place. Furniture snaps to quarter metres. Tap your own object to move, rotate or remove it; Undo/Redo are in the menu. Rooms reserve stairs/landings and exit space. Walk to a floor before decorating it. An unpinned Aim ahead preview follows the floor reached by ordinary movement; a pinned preview stays on its floor until Aim ahead is chosen. Moving keeps the object ID; undo/redo/reload retain its elevation. Cancelling restores the original with clear footing if needed. Outdoor paths, water, simplified collision, reach and save guards remain. No generic material catalogue expansion is included. New tents retain corrected human scale; explicit old saved scales stay unchanged. Supplied Explorer idle/walk/run animations and smooth turning remain; no dedicated turning clip is claimed.

Gentle graphics is the conservative fresh touch default; all explicit stored graphics/Run choices remain. Indoor rendering suspends the cached outdoor group and reuses the same licensed model library and renderer. Repeated-room resource checks plateau in the measured route. Tree camera-only crowns use actual indexed leaf bounds while walking still uses trunks. Close-camera actor hiding and responsive interior framing keep routes visible. No software-rendered FPS is represented as physical-device performance.

For phone/tablet on the same Wi-Fi: `python3 preview.py --lan`, then open http://YOUR-COMPUTER-LAN-IP:8000/adventures.html . Plain LAN HTTP may restrict some browser APIs; UUID and selectable backup-text fallbacks are provided. Physical Lenovo, iPhone, Safari and controller testing remains UNVERIFIED.

Read review/REPORT.md and review/summary.json for completed features, tests, limitations and continuation. Open gallery.html for actual rendered evidence. Asset provenance: adventures/PROVENANCE.md and adventures/licences. This milestone reuses the existing CC0 environment set and adds only two necessary verified Kenney CC0 bedroom models (26,132 bytes, no images/textures). Earlier 19 thumbnail files/manifests remain intact; two new actual renders support the necessary furnishings. Stair/rail joinery is original supporting geometry. No NPC simulation, wildlife, vehicles, audio, multiplayer, new themed world or installed/offline service worker is claimed. Original public website, Run 3, Neighborhood 06, main, older previews/packages and saves are protected. No deployment, merge, automation change or reset redemption occurred.
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
