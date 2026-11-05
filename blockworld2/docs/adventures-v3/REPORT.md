# BlockWorld Adventures — Preview 03

The Willow Vale is one connected main world: Willowmere’s market and residential lanes, Whispering Wood’s camp/trails, Maker’s Meadow, Brookside hamlet and the foresters’ cottages. Roads and two bridges connect the 370×196-metre playable area without replacing the world or active save. It introduces a new explicit `vale` template/layout 3. **Preview 01/02 records retain their separate layouts and constructions. No automatic merge or migration is performed.**

The circular live minimap tracks position/facing. Its full map is generated from actual roads, water, tree positions and building footprints (including player cottages). Touch pan/pinch, wheel/buttons, keyboard navigation, five safe destinations and Home work. Blocked destinations search nearby checked ground; no unchecked teleport fallback is returned. Phone opening focuses at a useful local zoom, with Fit for the whole valley. The full map suspends hidden 3D rendering and adds no WebGL context. Its cached bitmap is about 4.7 MiB RGBA, excluding display canvases/browser overhead.

Fresh scenery has continuous trail ribbons, curved meadow lanes, planted edges and clear building space. Corrected new-template tents have a ~3.09m shell versus the old village tent’s ~1.40m. They face their approaches; old saved layouts are not resized. Render inspection also repaired a missing hamlet/market lane and mismatched trail-junction material. The rigged Explorer retains supplied idle/walk/run blending. Blocked movement now rests instead of running in place. Clearing input releases held joystick ownership; a finger remaining after a pinch resumes orbit. Whole-footprint placement protects water, paths, bounds and uneven ground, with cached stationary preview validation.

## Validation and actual renders

**140 deterministic tests and 123 browser/compatibility checks pass.** Strict TypeScript, production build and original preservation pass. The [gallery](GALLERY.md) contains real settlement, countryside, scale, map, phone/tablet, editor and before/after views. Chromium runs ANGLE/SwiftShader. Touch/viewport/API fallbacks are emulated; **physical Lenovo, iPhone and Safari are unverified**.

| Pass | Checks |
|---|---:|
| `art-checks.json` | 10 |
| `vale-checks.json` | 9 |
| `map-checks.json` | 30 |
| `stability-checks.json` | 5 |
| `motion-after.json` | 4 |
| `pinch-reference.json` | 1 |
| `editor-checks.json` | 21 |
| `collision-checks.json` | 8 |
| `qa-results.json` | 35 |

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
