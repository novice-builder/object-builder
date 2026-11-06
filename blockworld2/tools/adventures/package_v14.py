"""Package a tested development build into a NEW, immutable preview folder. Never deploys."""
import argparse,pathlib,json,re,hashlib,subprocess,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--version',required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--qa-dir',type=pathlib.Path,default=pathlib.Path('docs/adventures-v14'));a=p.parse_args()
if not re.fullmatch(r'\d{2}',a.version)or int(a.version)<14:raise SystemExit('Use a new preview version, 14 or later')
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
Open http://localhost:8014/adventures.html . Direct file opening cannot load models/modules. This local preview does not publish or deploy anything.
Exact runtime source: https://github.com/novice-builder/object-builder/tree/{commit}

SAVE SAFETY: Default port 8014 keeps older :8000/:8013 browser storage separate. Bring an older world across by exporting its .bw2 backup and using Menu > Import backup here. Import creates an independent record; retain the original export and browser/address. Changing browser/address/port changes storage. Browser-private storage is not a permanent backup. `--port 8015` selects another local address.

FOXGLADE: Fresh layout-8 valleys add a woodland ranger cottage, clearing, gardens and dry winding trail connecting Foresters’ Rest to the camp in the same connected world. The cottage has a separate furnished one-storey room with native save/reload and fade return to the same exterior. The real-geometry map now has ten destinations; tap the minimap, drag/pinch and tap a landmark or Home for safe travel. Existing layout-7 and earlier saved scenes/constructions keep their exact geometry; a new world does not reinterpret old records.

WILDLIFE: A 0.62m reference-height low-poly fox plays its authored Survey cycle. No roaming/AI is claimed. The original 162,852-byte/576-triangle source GLB is retained; runtime colour texture is capped at256px. New layout8 only loads the model, shared across switches; animation pauses offscreen/indoors. A failed/delayed load adds no invisible body; existing constructions take priority. Owned skeleton textures are disposed on rebuild, with measured plateau after repeated world switches.

LICENCE: Fox model by PixelMannen (2014) CC0; rig/animations by tomkranis (2014) and glTF conversion by AsoboStudio/scurest (2017), CC BY 4.0. Combined animated Fox is NOT wholly CC0. See adventures/wildlife/PROVENANCE.md, source README, full licence and pinned metadata. Runtime modifications are height normalization and texture reduction. Base KayKit/Kenney/Quaternius environment/furniture/Explorer assets remain CC0 with original provenance/licences. No restricted farm-animal, Seahill or Quaternius Nature download was bypassed/included. No generic catalogue/material bulk.

STAIRS/INTERIORS: Separate building-specific saved rooms, actual mesh stair movement, max automatic step0.30m, landing/head clearance and safe recovery remain. Compact windmills have two real flights, a1.5m turning landing and3m loft. Existing older rectangular room edits/upper floors are never regenerated. New cottages/workshops stay one-storey. Meadow Lodge keeps its opening door. New layout8 requires Preview14+; version4 compact rooms require Preview13+. Older previews reject unsupported backups safely.

CONTROLS: Running defaults ON; optional Walk saves a slower mode. WASD/arrows move; Space or touch Jump jumps, Shift temporarily runs while walking. Left joystick moves; drag looks, pinch adjusts camera. Standard Gamepad API: left/right sticks move/look; A interact/confirm, B back, X Build, Y interact, LB Jump, RB rotate, left-stick click Walk, View map, Menu menu. Release controls after opening menus/reconnecting; keyboard/touch remain after disconnect. Twenty-one existing build thumbnails and object editing/undo/redo/floor transfer remain.

MOBILE/LIMITS: Choose Gentle first. Actual managed Chromium screenshots and phone/tablet emulation are in gallery.html and review/. No physical Lenovo/iPhone/Safari/Xbox/Bluetooth tests were performed; SwiftShader FPS is not mobile performance. Optional user-run `python3 preview.py --lan` permits trying a physical device on the same Wi-Fi using the computer's LAN IP:8014; HTTP may restrict Gamepad API. This is not a public deployment.

VERIFICATION: 213 deterministic tests,33 browser checks, strict build receipt, old Preview13 geometry/save comparison, failed/late-load safety, actual cottage reload/return and measured draw/resource checks. Visible fox adds one draw call and576 triangles in the sampled Gentle view. Twelve alternating switches reuse one model fetch and plateau resources. These are workload counters, not physical FPS or total GPU-memory measurements.

KNOWN UNFINISHED: Roaming wildlife/NPCs, further building-specific activities/interiors, distinctive themes, arbitrary CAD import UI and physical-device validation. Public Run3, Neighborhood06, main, Pages, old branches/packages/saves/backups remain protected. No deploy,merge,automation change or reset redemption. Active development continues after this package.
'''
server='''from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import argparse,os
p=argparse.ArgumentParser();p.add_argument('--lan',action='store_true');p.add_argument('--port',type=int,default=8014);a=p.parse_args()
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
