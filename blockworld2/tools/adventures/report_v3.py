"""Consolidate complete Preview 03 evidence without touching frozen prior versions."""
import pathlib,json,re,hashlib,subprocess,html
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/adventures-v3'
phases={'art-checks.json':10,'vale-checks.json':9,'map-checks.json':30,'stability-checks.json':5,'motion-after.json':4,'pinch-reference.json':1,'editor-checks.json':21,'collision-checks.json':8,'qa-results.json':35}
checks=[]
for file,count in phases.items():
 j=json.loads((OUT/file).read_text());assert len(j['checks'])==count,(file,len(j['checks']));assert all(c['passed'] for c in j['checks']),file
 checks.extend([{**c,'pass':file}for c in j['checks']])
unit=(OUT/'unit-tests.txt').read_text();n=re.search(r'ℹ tests (\d+)',unit)[1];assert f'ℹ pass {n}'in unit and 'ℹ fail 0'in unit
summary={'deterministicTests':int(n),'checks':checks,'environment':'Managed Chromium ANGLE SwiftShader with emulated phones/tablets. No physical Lenovo/iPhone/Safari results.','sourceHeadAtEvidenceConsolidation':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'sourceFileHashes':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()for p in (ROOT/'src/adventures').glob('*')if p.is_file()}}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
shots=[('vale-centre.png','Willowmere market square','world'),('vale-street.png','Residential street','world'),('vale-woodland.png','Whispering Wood','world'),('vale-road.png','Connecting road and forest transition','world'),('vale-meadow.png','Maker’s Meadow','world'),('vale-hamlet.png','Brookside hamlet','world'),('vale-campScale.png','New-template tent scale, with Explorer','world'),('map-desktop-full.png','Full map from actual world data','map'),('map-phone-full.png','Phone map opening at a useful local zoom','phone'),('map-phone-mini.png','Phone live minimap and touch controls','phone'),('map-phone-landscape-full.png','Landscape phone map','phone'),('map-tablet-full.png','Tablet world map','map'),('catalogue-phone.png','Phone model catalogue','editor'),('selection-desktop.png','Selected model outline','editor'),('placement-phone.png','Phone placement controls','editor'),('camera-close-wall.png','Close-wall camera protection','editor'),('meadow-before.png','Meadow before new layout','comparison'),('meadow-after.png','Meadow with curved earth lanes','comparison'),('cost-road-before.png','Road before batching/culling','comparison'),('cost-road-after.png','Road after batching/culling and material join repair','comparison')]
for name,_,_ in shots:assert(OUT/'screenshots'/name).is_file(),name
(OUT/'GALLERY.md').write_text('# Preview 03 — actual browser renders\n\nManaged Chromium/SwiftShader. Phone/tablet sizes are emulated; physical devices remain unverified.\n\n'+'\n\n'.join(f'### {title}\n\n![{title}](screenshots/{name})'for name,title,_ in shots)+'\n')
figures=''.join(f'<figure data-group="{group}"><button class="zoom" aria-label="Enlarge {html.escape(title)}"><img src="screenshots/{name}" alt="{html.escape(title)}" loading="lazy"></button><figcaption>{html.escape(title)}</figcaption></figure>'for name,title,group in shots)
page='''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BlockWorld Adventures Preview 03 · Render gallery</title><style>body{margin:0;background:#edf0e3;color:#294a3d;font:15px system-ui}main{max-width:1500px;margin:auto;padding:32px}h1{font:42px Georgia}nav{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}button{border:0;background:#faf6ea;color:#294a3d;padding:12px;border-radius:12px;cursor:pointer}nav button[aria-pressed=true]{background:#294a3d;color:white}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:20px}figure{margin:0;background:#faf6ea;border-radius:16px;overflow:hidden}figure button{padding:0;width:100%;border-radius:0}img{width:100%;height:320px;object-fit:contain;display:block;background:#cedcc8}figcaption{padding:16px}[hidden]{display:none!important}dialog{max-width:95vw;border:0;padding:8px;border-radius:16px;background:#faf6ea}dialog img{max-width:90vw;height:80vh}dialog::backdrop{background:#102b24db}a{color:#294a3d}</style></head><body><main><small>BLOCKWORLD ADVENTURES · DEVELOPMENT PREVIEW 03</small><h1>One valley. Take the long way home.</h1><p>Actual browser renders of the connected world, maps and editor. Phone/tablet layouts are emulated. Physical Lenovo, iPhone and Safari testing remains unverified.</p><p><a href="adventures.html">Open the playable preview →</a></p><nav>'''+''.join(f'<button data-filter="{group}" aria-pressed="{str(group=="all").lower()}">{label}</button>'for group,label in [('all','All views'),('world','The valley'),('map','Maps'),('phone','Phone'),('editor','Build & controls'),('comparison','Before / after')])+f'''</nav><div class="grid">{figures}</div><dialog><button aria-label="Close enlarged image">Close ✕</button><img alt=""></dialog></main><script>const d=document.querySelector('dialog');for(const b of document.querySelectorAll('[data-filter]'))b.onclick=()=>{{for(const f of document.querySelectorAll('figure'))f.hidden=b.dataset.filter!=='all'&&f.dataset.group!==b.dataset.filter;for(const x of document.querySelectorAll('[data-filter]'))x.setAttribute('aria-pressed',x===b);}};for(const b of document.querySelectorAll('.zoom'))b.onclick=()=>{{d.querySelector('img').src=b.querySelector('img').src;d.querySelector('img').alt=b.querySelector('img').alt;d.showModal();}};d.querySelector('button').onclick=()=>d.close();</script></body></html>'''
(OUT/'gallery.html').write_text(page)
report=f'''# BlockWorld Adventures — Preview 03

The Willow Vale is one connected main world: Willowmere’s market and residential lanes, Whispering Wood’s camp/trails, Maker’s Meadow, Brookside hamlet and the foresters’ cottages. Roads and two bridges connect the 370×196-metre playable area without replacing the world or active save. It introduces a new explicit `vale` template/layout 3. **Preview 01/02 records retain their separate layouts and constructions. No automatic merge or migration is performed.**

The circular live minimap tracks position/facing. Its full map is generated from actual roads, water, tree positions and building footprints (including player cottages). Touch pan/pinch, wheel/buttons, keyboard navigation, five safe destinations and Home work. Blocked destinations search nearby checked ground; no unchecked teleport fallback is returned. Phone opening focuses at a useful local zoom, with Fit for the whole valley. The full map suspends hidden 3D rendering and adds no WebGL context. Its cached bitmap is about 4.7 MiB RGBA, excluding display canvases/browser overhead.

Fresh scenery has continuous trail ribbons, curved meadow lanes, planted edges and clear building space. Corrected new-template tents have a ~3.09m shell versus the old village tent’s ~1.40m. They face their approaches; old saved layouts are not resized. Render inspection also repaired a missing hamlet/market lane and mismatched trail-junction material. The rigged Explorer retains supplied idle/walk/run blending. Blocked movement now rests instead of running in place. Clearing input releases held joystick ownership; a finger remaining after a pinch resumes orbit. Whole-footprint placement protects water, paths, bounds and uneven ground, with cached stationary preview validation.

## Validation and actual renders

**{n} deterministic tests and {len(checks)} browser/compatibility checks pass.** Strict TypeScript, production build and original preservation pass. The [gallery](GALLERY.md) contains real settlement, countryside, scale, map, phone/tablet, editor and before/after views. Chromium runs ANGLE/SwiftShader. Touch/viewport/API fallbacks are emulated; **physical Lenovo, iPhone and Safari are unverified**.

| Pass | Checks |
|---|---:|
'''+''.join(f'| `{name}` | {count} |\n'for name,count in phases.items())+'''
Six compatibility comparisons against extracted Preview 02 retain layouts 1/2 geometry, paths, colliders, landmarks and nonempty custom-scale object data in all three old scenes. New connected backups round-trip expanded coordinates as separate records. Tests cover catalogue/selection/200-object moves, failed-edit history, cached collisions, close-wall/corner cameras, stale-tab/quota recovery, backup text fallbacks and phone/tablet controls. The pinch reference records real pointer events; an initial fixture moved the released contact and read coalesced movement too early, so the corrected fixture waits for input dispatch and tests the still-held contact against preserved Preview 02 and current controls.

## Measured rendering cost

Compatible untextured nature primitives bake original linear colours/transforms into reusable vertex-colour geometry. All nine real batched models retain transformed vertices/triangle totals; incompatible materials fall back. Static bounds wholly beyond the existing 150m fog range are skipped conservatively.

| Fixed gentle view | Draw calls before | After |
|---|---:|---:|
| Willowmere | 365 | 216 |
| Woodland | 331 | 182 |
| Connecting road | 539 | 265 |
| Brookside | 373 | 216 |

This is 41–51% fewer submissions. The road drops ~357k→260k triangles. Unique scene geometry buffers grow 3,004,384→3,059,100 bytes (~55KB). CPU submission timings vary; the woodland trial set is slower. **No physical-device FPS or general CPU speedup is established.** Software rasterisation remains unsuitable as a mobile hardware benchmark. Raw measurements/source hashes and before/after renders are in `profile-*.json` and `cost-comparison.json`.

A 24-switch probe warms original/baked shared buffers in the first template cycle, then plateaus at 89 geometries/11 textures in its combined-world view. All raw counts are retained. This is a limited allocation probe, not a thermal/long-session device test. The major-route audit finds no generated tree trunks on lane centres; the wishing well intentionally occupies the paved square. It does not claim every path centre is empty.

## Preservation, assets and local preview

154 protected original/native persistence, root/archive and Preview 01/02 package/evidence files match the verified starting checkpoint `9f07d29ae458be7ddba5a88ff81c85aa73172385` byte-for-byte; see `preservation-v3.json`. Original website, Neighborhood 06, published Run 3, main, other branches and historical packages are unchanged by this work. Nothing was deployed, published or merged; no banked reset or duplicate automation was used.

The same 71 CC0 source models and 15 derived catalogue PNGs remain, with exact inventory/licences/provenance under `adventures/`. Nature batching is a runtime geometry operation; source models are unchanged. Blocked Seahill and Quaternius Nature collections are not included. No additional pack is claimed by this release.

Unzip Preview 03 into a new folder, run `python3 preview.py` (Windows `py preview.py`) and open `http://localhost:8000/adventures.html`. For same-Wi-Fi testing use `--lan` and the computer’s LAN address. All game assets are local; opening HTML directly is unsupported. Browser/address/device origins have separate storage: export backups before changing them, and import only as new copies. Use this matching version for vale/layout-3 backups; Preview 01/02 cannot render the new template. `BUILD.json` records the exact committed runtime source and file hashes; package verification is adjacent to the archive.

## Unfinished work and continuation

Prefab houses remain closed exteriors. Dedicated licensed modular doors, usable interiors and furniture are next useful gameplay work; no indoor feature is claimed here. Further countryside detailing, canopy/terrain camera edge cases, more complex construction collision and physical-device cold-load/thermal/storage checks remain. No NPC simulation, vehicles, audio, authored turn clip, streaming terrain or multiplayer is claimed in this entrypoint. Existing original-game systems remain at their original entrypoint.

This is a checkpoint in open-ended development. Read `../ASSET-REBUILD-CONTINUE.md` and `../BLOCKWORLD-DEVELOPMENT-DIRECTION.md`, acquire the exclusive checkout lock, fetch/verify GitHub and continue immediately with the highest-value unfinished item. Do not overwrite this evidence/package after release; use a new version folder. Usage exhaustion is not measured or claimed. No further schedule is asserted.
'''
(OUT/'REPORT.md').write_text(report);print('Consolidated',n,'deterministic tests and',len(checks),'browser checks')
