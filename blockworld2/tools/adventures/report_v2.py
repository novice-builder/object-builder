"""Build the Preview-02 report/gallery from recorded runs without rewriting Preview 01."""
import pathlib,json,html,re,statistics,datetime
from zoneinfo import ZoneInfo
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v2';phase_files=[('Baseline browser regressions','qa-results.json'),('Saved-layout compatibility and scenery','art-checks.json'),('Catalogue/editor/mobile UI','editor-checks.json'),('Collision/cache/camera regressions','collision-checks.json')]
phases=[];checks=[]
for title,file in phase_files:
 j=json.loads((OUT/file).read_text());assert len(j['checks'])=={'qa-results.json':35,'art-checks.json':12,'editor-checks.json':21,'collision-checks.json':8}[file], 'Incomplete recorded pass: '+file;phases.append({'name':title,'checks':len(j['checks']),'file':file});checks+=j['checks']
assert all(c['passed']for c in checks);assert len({c['name']for c in checks})==len(checks),'Duplicate check names'
unit=(OUT/'unit-tests.txt').read_text();total=int(re.search(r'ℹ tests (\d+)',unit)[1]);assert re.search(r'ℹ fail 0',unit)
before=json.loads((OUT/'profile-before.json').read_text());after=json.loads((OUT/'profile-after.json').read_text());base=json.loads((OUT/'qa-results.json').read_text());startup=sum(x['bytes']for x in base['metrics']['startupResources']);thumbs=json.loads((ROOT/'public/adventures/thumbnails/manifest.json').read_text());thumb_bytes=sum(x['bytes']for x in thumbs['entries'])
median=lambda profile,key:statistics.median(t[key]for t in profile['collisionCPU']['trials']);oldcam=median(before,'cameraMs');newcam=median(after,'cameraMs');newquery=median(after,'queryMs');query_text='below the timer resolution in the median trial'if newquery==0 else f'{newquery:.2f} ms';date=datetime.datetime.now(ZoneInfo('Australia/Adelaide')).strftime('%d %B %Y, %H:%M %Z')
summary={'version':'Adventures-Preview-02','generated':date,'physicalDevicesTested':False,'phases':phases,'deterministicTests':total,'checks':checks,'preservationBase':'b15a4f356e9bbd3c44de9af1cd6fdf0cfa24b14f','published':False};(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
shots=[('woodland-before','Whispering Wood — Preview 01','comparison','Actual render of the original packaged scene.'),('woodland-after','Whispering Wood — new scenery','comparison','Curved earth trails, planted clearings, reeds and varied foliage; new layouts only.'),('centre','Willowmere village centre','world','Premade houses, the well, market and connected streets.'),('forest','Woodland at the village edge','world','The village’s outer trail now uses the earth material and softer turns.'),('bridge','Willowbrook bridge','world','The original premade deck stays clear and connects both banks.'),('meadow-after','Maker’s Meadow','world','An independent open construction area.'),('catalogue-desktop','Rendered asset catalogue','editor','15 real model thumbnails, friendly names and category filters.'),('selection-desktop','Selection and editing','editor','A visible outline marks the selected premade object.'),('catalogue-phone','Phone asset catalogue','mobile','390×844 Chromium touch emulation; the catalogue scrolls vertically.'),('placement-phone','Phone placement controls','mobile','Editing controls sit above the movement joystick.'),('catalogue-tablet','Tablet asset catalogue','mobile','1280×800 touch emulation.'),('tablet','Tablet player view','mobile','Walking, orbit and Run controls on the actual rendered scene.'),('iphone-portrait','Portrait phone player view','mobile','390×844 touch emulation.'),('iphone-landscape','Landscape phone player view','mobile','844×390 touch emulation.'),('camera-close-wall','Close-wall camera regression','camera','The camera stays outside the inn; the nearby player body hides.'),('places','Saved adventures and world selection','interface','Existing saves retain their old scenery; fresh places use the latest layout.')]
figures=''
for stem,title,category,caption in shots:
 path=OUT/'screenshots'/f'{stem}.png';assert path.exists(),path
 figures+=f'<figure data-category="{category}"><button class="zoom" aria-label="Enlarge {html.escape(title)}"><img src="screenshots/{stem}.png" loading="lazy" alt="{html.escape(title+": "+caption)}"></button><figcaption><small>{category.upper()}</small><h2>{html.escape(title)}</h2><p>{html.escape(caption)}</p></figcaption></figure>'
# Reuse the established gallery presentation; keep all historical files untouched.
gallery=(ROOT/'docs/adventures-v1/gallery.html').read_text();start=gallery.index('<div class="grid">')+len('<div class="grid">');end=gallery.index('</div></main>',start);gallery=gallery[:start]+figures+gallery[end:]
nav_start=gallery.index('<nav aria-label="Filter screenshots">');nav_end=gallery.index('</nav>',nav_start)+6
gallery=gallery[:nav_start]+'<nav aria-label="Filter screenshots">'+''.join(f'<button aria-pressed="{str(i==0).lower()}" data-filter="{key}">{label}</button>'for i,(key,label)in enumerate([('all','All views'),('comparison','Before / after'),('world','Worlds'),('editor','Editor'),('mobile','Mobile'),('camera','Camera'),('interface','Interface')]))+'</nav>'+gallery[nav_end:]
gallery=gallery.replace('Preview 01','Preview 02').replace('PREVIEW 01','PREVIEW 02').replace('116 deterministic tests passed',f'{total} deterministic tests passed').replace('37 rendered & interaction checks',f'{len(checks)} browser & compatibility checks').replace('3.27 MB startup resources, uncompressed',f'{startup/1e6:.2f} MB startup resources, uncompressed')
gallery=gallery.replace('Actual local browser renders of the premade-asset rebuild. The village, woodland and creative meadow are playable.', 'Actual local browser renders of the continued rebuild: softer woodland scenery, an illustrated catalogue and safer editing/camera behaviour.')
gallery=gallery.replace('body{margin:0;', 'body{margin:0;').replace('<footer>','<footer>Preview 02 · '+date+'<br>',1)
gallery=re.sub(r'Generated [^<]+\.', 'Generated '+date+'.',gallery)
(OUT/'gallery.html').write_text(gallery)
md='# BlockWorld Adventures — Preview 02 gallery\n\nActual local browser renders. Nothing was deployed. [Preview package](../../artifacts/adventures-v2/BlockWorld-Adventures-Preview-02.zip) · [Full report](REPORT.md).\n\nPhysical Lenovo/iPhone and Safari performance remains unverified. Houses are exterior-only. Existing Preview 01 saves retain their original scene layout.\n'
for stem,title,category,caption in shots:md+=f'\n## {title}\n\n{caption}\n\n![{title}](screenshots/{stem}.png)\n'
(OUT/'GALLERY.md').write_text(md)
report=f'''# BlockWorld Adventures — Preview 02

Prepared {date}. This continuation started from verified checkpoint `b15a4f356e9bbd3c44de9af1cd6fdf0cfa24b14f` on `codex/blockworld-adventures-asset-rebuild`. It ran in a usable managed execution environment, with no other active writer observed, an exclusive checkout lock, and remote-tip checks before checkpoint pushes. **No deployment, publication, main merge, public website change or banked-reset redemption occurred.**

## What changed

Fresh scenes now have smooth earth trails, clustered ground cover, bank reeds, subtle tree colour variation and distant terrain beyond the walk boundary. Existing Preview 01 records have missing/1 layout values and keep their original permanent geometry, paths, collisions and saved objects. New records carry `adventure.layout: 2` inside the existing native envelope. No original game schema/store code or database namespace was changed. Places > Start a fresh place creates the new scenery while retaining old worlds, with distinct record names.

The building catalogue uses 15 transparent 256×192 PNGs rendered from the real imported GLBs, friendly labels and category filters. PNGs total {thumb_bytes:,} bytes and load on demand. Opening the catalogue creates no new WebGL renderer/context. The thumbnail manifest records PNG hashes and the exact source-model hashes. Selection has a visible outline and cannot pick a user object through a permanent cottage/trunk. Existing objects move at the 200-object limit and keep their ID/custom scale. Rejected rotations preserve undo/redo state. Graphics/Run preferences use the separate guarded key `blockworld-adventures-controls-v2`; denied/corrupt storage falls back without blocking play. Portrait edit controls clear the joystick and redundant hints hide while editing.

Collision footprints are cached until a world/edit changes them, with a separately cached exclusion for the moving object. Camera ray/box clipping avoids per-body box/vector allocations. A close-wall defect was corrected: the camera no longer forces a minimum radius that can penetrate a wall. Its smoothed position is clipped again so interpolation cannot cut through a building corner.

## Tests and inspected renders

**{total} deterministic tests pass and {len(checks)} browser/compatibility checks pass across four recorded passes.** Strict TypeScript, production build and preservation checks pass. The browser is managed Chromium using ANGLE/SwiftShader. Touch, viewport, missing-API and backup fallbacks are emulated; physical Lenovo/iPhone/Safari results are not claimed.

| Pass | Checks | Evidence |
| --- | ---: | --- |
'''+''.join(f"| {phase['name']} | {phase['checks']} | `{phase['file']}` |\n"for phase in phases)+f'''
The compatibility pass loaded the extracted original Preview 01 package and compared old records in all three scenes with this branch. Permanent vertex/index data, path arrays, collision descriptors, landmarks and retained user objects match for layout 1. Layout 2 is explicit for fresh records; there is no silent scenery upgrade of an existing save. New-layout backups belong in the matching Preview 02 package; the older program cannot render the new scenery.

The editor pass exercises real thumbnail selection, category filters, placement, selection/outline, rotation, cancelled moves, the full 200-object limit, custom-scale retention, rejected-edit history, removal/undo, occluded picking, preference reload and phone/tablet layouts. Camera/cache checks cover reusable query views, edit invalidation, cancelled-move restoration, rotation, world switching, near-wall positioning and corner interpolation. Unit ray tests include parallel/inside/behind cases and 200 comparisons against Three.js’s established box intersection.

The [gallery](GALLERY.md) contains actual before/after scenery, catalogue, selected-object, phone/tablet controls, world and camera-regression images. Visual inspection corrected an invalid portrait media query and the resulting edit-bar/joystick overlap. Other inspected views retain clear path/bank connections and grounded props. No indoor scene is claimed.

## Measured cost

The same executor and a single browser context were used for before/after probes. Five trials each used 100 built props, 1,000 footprint queries and 500 camera updates. These are JS CPU wall times, not mobile hardware timings.

| Probe | Before | After |
| --- | ---: | ---: |
| 1,000 footprint queries, median | {median(before,'queryMs'):.1f} ms | {query_text} |
| 500 camera updates, median | {oldcam:.1f} ms | {newcam:.1f} ms |
| 1280×800 software-rendered view | about 2 fps | about 2 fps |

The camera-update probe uses approximately {(1-newcam/oldcam)*100:.1f}% less CPU time here. Rendering still dominates the managed software environment; **no hardware FPS improvement is established**. A small drawing-buffer diagnostic reached approximately 4–5 fps, which is also not a physical-device result. `profile-before.json` / `profile-after.json` retain all trial values, renderer identity, source context/hashes and raw view counts.

Startup resources total {startup:,} bytes (about {startup/1e6:.2f} MB) before server compression, plus optional catalogue PNGs on opening Build. Two 1024px model atlases remain an estimated 10.67 MiB as RGBA8 with mipmaps, excluding generated textures, framebuffer/shadow and driver allocations. Geometry/material quality was not reduced to obtain the CPU result. Additional vegetation remains instanced and scene resources are disposed on switching. The base browser pass repeats nine world switches and records bounded geometry/texture counts; that is a limited probe, not proof against every possible leak.

## Preservation, assets and distribution

Preview 01 archives/evidence and every earlier release remain untouched. The original public website, root navigator, Neighborhood 06 and existing branches retain their contents. The original `Session`, `WorldStore` and game entrypoint remain unchanged. The Adventures database remains separate from the original game. Full preservation evidence is in `preservation-v2.json`.

The same 71 CC0 models and exact creator/source licence records are retained; Preview 02 introduces derived catalogue images, not a new unverified model pack. See `adventures/PROVENANCE.md`, `inventory.json`, licences and the thumbnail manifest. The original selected source files remain in the preserved Preview 01 Source Assets archive. Preferred Seahill/Quaternius Nature downloads remain blocked and are not represented as included.

Download `BlockWorld-Adventures-Preview-02.zip`, unzip into a new folder, run `python3 preview.py` (Windows `py preview.py`) and open `http://localhost:8000/adventures.html`. For same-Wi-Fi tablet testing use `python3 preview.py --lan` and the computer’s LAN address. HTTP is required for ES modules/GLB fetches; double-clicking the HTML is unsupported. Package files are self-contained and do not require npm or CDN requests. Read `README.txt` for controls and origin-specific backup instructions. Nothing is deployed. Deliverables are retained on the verified development branch because this managed executor cannot create the designated chat-output directory on its read-only root.

## Remaining work

Physical Lenovo and iPhone/Safari testing remains the main gap: cold downloads, sustained movement/orbit, thermal behaviour, backup/export reliability and 20+ world switches. Use those measurements to choose graphics/culling defaults. The current environment cannot provide them.

Prefab buildings are still closed exteriors with no opening doors/interiors. Camera canopy collisions, terrain/footprint edge cases and larger creations need further work. There is no dedicated authored turn clip, LOD/streaming terrain, NPC simulation, audio, vehicles or multiplayer in this separate entrypoint. The original game retains its existing systems. New layouts are intentionally separate from old saved layouts; use the matching preview for new-layout backups.

The scheduled continuation actually executed in a usable environment and produced real pushed checkpoints. No further automation is claimed. Continue from `docs/ASSET-REBUILD-CONTINUE.md`, check the remote tip and exclusive writer lock, preserve previous versions, and use a new version folder for further packages.
'''
(OUT/'REPORT.md').write_text(report);print('Generated report/gallery:',total,'deterministic tests,',len(checks),'browser checks')
