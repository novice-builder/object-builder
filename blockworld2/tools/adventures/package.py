"""Package an already-built, unpublished Adventures preview. Never invokes a release or deploy tool."""
import argparse, hashlib, json, pathlib, shutil, subprocess, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--output',type=pathlib.Path,required=True);args=p.parse_args();out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
dist=ROOT/'adventures-dist'
if not (dist/'adventures.html').is_file():raise SystemExit('Run npm run build:adventures first')
qa=json.loads((ROOT/'docs/adventures-v1/qa-results.json').read_text())
if len(qa['checks'])<30 or any(not c['passed']for c in qa['checks']):raise SystemExit('Complete rendered desktop/mobile QA before packaging')
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
readme='''BlockWorld Adventures — Preview 01 (development only)

1. Unzip this package into a new folder.
2. Run: python3 preview.py   (on Windows: py preview.py)
3. Open http://localhost:8000/adventures.html in a current browser.

Everything is local: models, animations, textures, code and licences. There are no CDN requests, accounts or purchases. A web server is required; opening adventures.html as a file will not load ES modules/GLBs in most browsers.

Desktop: WASD/arrows walk; Shift runs; drag orbits; wheel zooms; E discovers; B opens Build; Escape opens/closes menu. Touch: left joystick walks; drag the world with the other thumb to orbit; pinch the world to zoom; Run toggles speed. Build chooses a premade object; walk to a clear spot, Rotate and Place. Tap your own object to move/turn/remove it. Undo/redo are in the menu.

Places contains Willowmere village, Whispering Wood and Maker’s Meadow. Each place has a separate saved record. Saves use a new IndexedDB name and never open the original game's database. Export backups before moving the preview to a different browser, server address or device; browser saves belong to that origin. Imports create new records. If storage fails, export the in-memory work or use Save a new copy. No destructive reset/delete control is included.

Tablet/iPhone on the same Wi-Fi as your computer: run `python3 preview.py --lan`, then open http://YOUR-COMPUTER-LAN-IP:8000/adventures.html. Physical-device performance and Safari are unverified. The preview includes a UUID fallback for local network HTTP and a selectable backup-text fallback when clipboard access is unavailable. Physical-device results remain unverified.

The village buildings are closed exterior models. No interiors or opening doors are implemented. Turning blends real supplied locomotion with smooth controller orientation; no dedicated turn clip is claimed. Shadows are cached for scenery with a soft moving contact shadow under the character. Collision uses simplified footprints/trunks and an analytic bridge deck. Grass/flowers have no collision. No multiplayer, vehicle system, audio or service-worker installation is included in this preview.

Gallery and report: open gallery.html. Asset licences/provenance: adventures/PROVENANCE.md and adventures/licences/. Source: https://github.com/novice-builder/object-builder/tree/codex/blockworld-adventures-asset-rebuild/blockworld2 . This package is not a published deployment. The original public website and Neighborhood 06 are unchanged.
'''
server='''from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse, os
p=argparse.ArgumentParser();p.add_argument('--lan',action='store_true');a=p.parse_args()
os.chdir(Path(__file__).resolve().parent)
address='0.0.0.0' if a.lan else '127.0.0.1'
print('Open http://localhost:8000/adventures.html (Ctrl+C to stop)',flush=True)
ThreadingHTTPServer((address,8000),SimpleHTTPRequestHandler).serve_forever()
'''
files={str(f.relative_to(dist)):f for f in dist.rglob('*')if f.is_file()}
# Research-only unused models remain in source inventory, not in the initial download.
build={'version':'Adventures-Preview-01','sourceCommit':commit,'verifiedBase':'9f6c14be6b9821c2e6048dc75189338a1b0f9e54','published':False,'deterministicTests':116,'renderedChecks':len(qa['checks']),'files':{n:{'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}for n,f in sorted(files.items())}}
(out/'BUILD.json').write_text(json.dumps(build,indent=2)+'\n')
(out/'README.txt').write_text(readme)
archive=out/'BlockWorld-Adventures-Preview-01.zip'
if archive.exists():raise SystemExit('Versioned archive already exists; select a new output folder/version')
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for name,file in sorted(files.items()):z.write(file,name)
 z.writestr('README.txt',readme);z.writestr('preview.py',server);z.writestr('BUILD.json',json.dumps(build,indent=2))
 for file in (ROOT/'docs/adventures-v1').rglob('*'):
  if file.is_file():z.write(file,'review/'+str(file.relative_to(ROOT/'docs/adventures-v1')))
 if (ROOT/'docs/adventures-v1/gallery.html').exists():z.writestr('gallery.html',(ROOT/'docs/adventures-v1/gallery.html').read_text().replace('src="screenshots/','src="review/screenshots/'))
(out/'CHECKSUMS.sha256').write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name+'\n')
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sourceCommit':commit,'checks':len(qa['checks'])}))
