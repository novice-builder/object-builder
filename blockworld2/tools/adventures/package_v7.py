"""Package a tested development build into a NEW, immutable preview folder. Never deploys."""
import argparse,pathlib,json,re,hashlib,subprocess,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--version',required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--qa-dir',type=pathlib.Path,default=pathlib.Path('docs/adventures-v7'));a=p.parse_args()
if not re.fullmatch(r'\d{2}',a.version)or int(a.version)<7:raise SystemExit('Use a new preview version, 07 or later')
out=a.output.resolve();qa_dir=(ROOT/a.qa_dir).resolve();dist=ROOT/'adventures-dist'
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

Unzip into a new folder. Run `python3 preview.py` (Windows: `py preview.py`).
Open http://localhost:8000/adventures.html . Opening the HTML directly as a file is unsupported because the app loads ES modules and GLBs.

All models, images, animations, code and licences are local. Nothing is deployed by this package. No accounts, CDN downloads or purchases are needed.

Preview 07 adds Alderwick, a northern market neighbourhood, in fresh layout-5 valley records. It connects naturally to Willowmere without changing saved-world records during travel. Six homes, market, smithy, mill lane, well and planted edges reuse the coherent licensed asset set. Existing layout-3/4 saves and constructions remain unchanged. Choose Places, Start a fresh place, New The Willow Vale · Alderwick to explore the new layout. Saved rows identify earlier scenery and Alderwick. Layout-5 backups require Preview 07 or newer; older programs cannot render this template.

The precise nearby-ground targeting, visible model ghosts, supported interior furniture placement and cutaway-aware selection from Preview 06 are retained. Choose an asset, tap/click visible nearby ground, inspect/rotate, then choose Place. Furniture snaps to quarter metres; other objects use half metres. Aim ahead returns the ghost to camera following. Paths, water, collisions, reach, undo and backup guards remain. These fixes include ghosts that were invisible in earlier previews. Gentle culling and shadow modes are retained; no physical FPS improvement is claimed.

Tap the circular minimap or press M for the full world map. Drag/pinch or use zoom buttons; tap a named place for checked safe travel. Home returns to Willowmere. Full map pauses the hidden 3D scene.

WASD/arrows walk; Shift runs; drag to orbit; wheel/pinch zooms; E discovers; B opens Build; Escape closes a menu. Touch uses a left joystick, another thumb to orbit and a Run toggle. Standard browser-mapped controllers share movement/look/actions: A confirm/interact/place, B back, X Build, Y Interact, RB rotate, LS click Run, View map, Menu. D-pad navigates UI; the menu has mapping help. Release controls after opening a menu or reconnecting. Touch/keyboard remain if the Gamepad API is unavailable/denied. Physical Xbox/Bluetooth support is unverified; browsers may require a secure origin, and plain LAN HTTP may restrict the API. Graphics and Run choices persist separately from world saves. Build shows real model thumbnails and filters. Walk to a clear spot, tap nearby ground to position, rotate and choose Place. Aim ahead returns to camera following. Tap your own object for its outline, move, rotate or remove. Undo and redo are in the menu. The limit is 200 objects; existing objects can still move at that limit.

The Willow Vale is one continuous 370x196-metre world joining Willowmere, Whispering Wood and Maker’s Meadow, with Brookside and the foresters’ cottages. Walk the connecting roads and two bridges without changing world/save. New-template tents have corrected standing-height scale. Earlier Preview 01/02 independent records and Preview 03 vale records retain their original layout and constructions; they are not silently merged. Places lists retained records and can create a NEW connected-world record. No construction-migration tool is claimed. Do not open layout-4 backups in Preview 01/02/03: those older programs cannot render this template. Use this matching package for new saves. Export backups before changing browser, address or device. Import creates a new record. Failed writes and stale-tab conflicts preserve the original and in-memory work; export or Save a new copy to recover.

To test on a tablet/iPhone on the same Wi-Fi, run `python3 preview.py --lan`, then open http://YOUR-COMPUTER-LAN-IP:8000/adventures.html . Cryptographic UUID and selectable backup-text fallbacks support restricted browser APIs. Physical Lenovo, iPhone and Safari performance remains UNVERIFIED.

The Meadow Lodge in layout-4/5 records has a real opening door and furnished room, with supported floor, saved door state and indoor camera cutaways. Other original prefab houses remain closed. The builder has 19 model thumbnails, furniture at human scale and a walk-through rug. New tents have corrected standing-height scale; older explicit saved scales stay unchanged. Real supplied idle, walk and run clips blend with smooth orientation; no dedicated turn clip is claimed. Collision uses simplified footprints/trunks and a bridge profile. The camera has close-wall/corner protection; foliage canopy collisions still need work. No NPC simulation, audio, vehicles, multiplayer or installed/offline service worker is claimed for this entrypoint.

Open gallery.html for actual rendered views and the before/after comparison. Read review/REPORT.md, review/summary.json and profile files for checks/measurements/limitations. Asset provenance/licences: adventures/PROVENANCE.md and adventures/licences. Original selected CC0 source assets remain separately archived in the branch's preview-01 Source Assets archive. Exact runtime source: https://github.com/novice-builder/object-builder/tree/{commit} . The original website, Neighborhood 06 and historical packages are unchanged.
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
