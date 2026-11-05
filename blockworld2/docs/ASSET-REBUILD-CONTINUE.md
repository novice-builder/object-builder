# BlockWorld Adventures — continuing from Preview 03

Read [BLOCKWORLD-DEVELOPMENT-DIRECTION.md](BLOCKWORLD-DEVELOPMENT-DIRECTION.md) first. The user updated the assignment during this active run: develop one connected main world, real minimap/full map, safe travel, believable scale, rich settlements and continuing gameplay. Three independent medieval environments are legacy records, not three different themes. Continue useful milestones in the same run; tests, reports and packages are checkpoints, not finish conditions.

## Safety and writer ownership

Work only in `novice-builder/object-builder` on `codex/blockworld-adventures-asset-rebuild`. Fetch and independently verify GitHub before edits and each push. Check active writers/agents/processes and acquire OS `flock(LOCK_EX|LOCK_NB)` on `/workspace/work/blockworld-adventures-writer.lock`; file existence is not ownership. Skip busy runs. Stop if the remote moves unexpectedly; never force another writer's history. Release the flock and stop owned servers at a real run boundary.

Preserve original website, Neighborhood 06, published Run 3, original native saves, main, other branches, historical archives and Preview 01/02 (and Preview 03 once packaged). No deployment, Pages change, main merge, banked-reset redemption or competing automation. Physical Lenovo/iPhone/Safari testing is unverified. No usage-meter tool is exposed: do not claim full allowance consumption/exhaustion without evidence.

## Verified checkpoint history

Each checkpoint below was pushed and independently verified with `git ls-remote`:

- `5eb28540a788737e660cca559fc2aa8df57d708d`: Preview 01 runtime.
- `b6546e873dc8bbd1f723ce917fa2a6e43b3bfd7e`: Preview 02 runtime.
- `9f07d29ae458be7ddba5a88ff81c85aa73172385`: preserved Preview 02 package/checkpoint; starting tip for this run.
- `ab00eb202ca79b4e47726004b476d3983dabc284`: fresh layout-3 art, continuous trail ribbons; updated user direction recorded.
- `a94fc7e434dec8a9bfa26144ee441734aff29e7a`: one connected `vale` template with shared terrain/collision, roads/two bridges, Brookside/forester settlements and corrected new-template tents.
- `821c0e4b73fc388d644711285c84621db06b27c6`: circular live minimap, actual-data full map, touch/keyboard pan/zoom, checked safe landmark travel/Home; 30 map browser checks.
- `02f2e6a74dd96a098b2df21187552a1c040a8364`: compatible nature batching, conservative full-fog culling, repaired earth material joins.

Input/placement and Preview 03 packaging commits follow these. Always fetch latest; `artifacts/adventures-v3/BUILD.json`, once present, records the package’s exact runtime source rather than a later packaging commit.

## Current implementation

The Willow Vale is one 370×196m playable continuous world. Willowmere, Whispering Wood and Maker’s Meadow retain their strongest scenery, connected by lanes/two streams/bridges. Brookside adds a rural six-building cluster and a market approach; the foresters have two woodland cottages. Region coordinates are x=-105/0/105. `vale-data.ts` drives ground/walk/water/bounds; `connected-landscape.ts` composes compatible region scenery with one terrain and generated vegetation. No scene/save replacement occurs while crossing regions.

New records use explicit `scene: vale, layout: 3`; old independent layouts 1/2 and later standalone layout 3 remain supported. No automatic construction migration is implemented. Six real comparisons against extracted Preview 02 retain geometry, paths, collisions, landmarks and nonempty custom-scale objects. All native persistence/schema code stays unchanged. `AdventureSession` retains isolated database `blockworld-adventures-assets-v1`, serial ownership, quota/conflict protection, export/import-new-copy and recovery.

`map-data.ts` reads real paths, water, tree coordinates and building footprints; `world-map.ts` uses a cached 2D bitmap, no extra WebGL context. Minimap follows position/facing; full map has five named destinations, touch pan/pinch, wheel/buttons/keyboard, Fit and Home. Phone opening focuses around the player, while Fit shows the entire valley. Full map suspends hidden WebGL rendering. `safe-position.ts` checks clear arrivals rather than returning an unchecked blocked fallback. Build thumbnails/selection, 200-object moves, undo/redo and separate graphics/Run preferences remain.

Latest input work releases held pointer ownership on clear, lets the remaining thumb resume orbit after a pinch, uses actual displacement for locomotion animation and validates whole placement footprints against water, paths, slopes and bounds. Stationary ghost validation is cached. Regression evidence includes the original defects, corrected pointer-event reference against Preview 02 and the passing current cases. The initial touch fixture moved the released contact/read a coalesced move too soon; corrected event traces and isolated explicit update probes are retained.

## Evidence and measured limits

`docs/adventures-v3/REPORT.md`, `summary.json`, gallery, raw phase JSON and screenshots contain the completed evidence. **140 deterministic tests and 123 browser/compatibility checks pass** (art 10, connected world 9, map 30, stability 5, motion 4, pinch reference 1, editor 21, collision 8, baseline 35). 154 protected root/archive/native and Preview 01/02 files match 9f07d29 byte-for-byte.

Fixed gentle views reduce draw calls 41–51% (road 539→265, ~357k→260k triangles), adding ~55KB geometry buffers. Nine real baked models retain transformed vertices/triangle totals. CPU submission timings vary; no general CPU or physical FPS gain is claimed. Software rasterisation is not a mobile benchmark. A 24-switch probe warms original/baked buffers in cycle one, then plateaus at 89 geometries/11 textures for its combined-world view. This is not a physical thermal/long-session test. The cached 1536px full-map bitmap costs ~4.7MiB RGBA before other canvases/browser allocations.

The same 71 CC0 model inventory and 15 derived PNGs remain in Preview 03. Source models/licences are unchanged. Seahill and Quaternius Nature downloads remain blocked and are not included. The separate Standard FREE Quaternius Medieval modular mirror was researched earlier; 14 selected source/README/licence files were freshly matched to exact commit `21104b4045261c28fc312360841ed1a7b0ac8782` in `/workspace/work/modular-source-verification.json`. It is NOT yet included/implemented in Preview 03.

## Reproduce

From `blockworld2/` use `npm run test:adventures`, `node --import tsx --test tests/*.test.ts`, and `npm run build:adventures`. Do not run original release helpers via `npm run build`. Serve ignored `adventures-dist` with `python3 -m http.server 5175 --bind 127.0.0.1 --directory adventures-dist`.

Version-3 tools: `qa_v3.py`, `vale_v3.py`, `map_v3.py`, `editor_v3.py`, `collision_v3.py`, `motion_v3.py --phase after`, `pinch_v3.py` (needs extracted Preview 02 on 5177), `stability_v3.py`, `art_v3.py` (also 5177), and `profile_v3.py --phase before|after`. `report_v3.py` requires all nine complete passing phases and the full unit log. `package_v3.py --version 03 --output artifacts/adventures-v3 --qa-dir docs/adventures-v3` refuses nonempty output. Do not rerun into these frozen folders after release: adapt tools to NEW v4 evidence/output folders.

## Next work — continue immediately

1. Verify/extract/package-check Preview 03, push its archive/evidence and independently verify SHA, then continue work; this is not a stopping condition.
2. Implement a genuinely usable modular building with functional entrance/door and furnished interior using the legally verified free modular source if visually coherent. Preserve existing vale/layout-3 constructions: introduce a new explicit layout/opt-in for new permanent footprints. Do not claim interiors from closed prefab appearances. Keep palette/scale consistent and measure additional bytes/draws. New evidence/packages belong in v4 folders.
3. More settlement/countryside details, camera canopy/terrain edges, larger creations, robust recovery and mobile controls. Physical hardware tests remain outstanding and cannot be invented here.
4. Once the main connected world is good, research truly different themed worlds; do not relabel similar medieval scenes as new themes. Choose actual player value rather than feature counts.

The cloud briefly reported no usable execution environment during evidence consolidation, then immediately recovered; the worktree/processes and our PID 14722 flock survived, GitHub was re-fetched at 02f2e6a, and work resumed. No reset or extra automation was used. At a real environment/usage/execution boundary, push all completed work and record an exact remote resume point; do not invent measured usage exhaustion.

## Verified Preview 03 release

`eb7003e7fca9273882e1acf9af798b457a3a4bf5` is the independently pushed/verified runtime and complete evidence checkpoint: **140 deterministic tests, 123 browser checks**. The earlier provisional 124 total was corrected during consolidation: the connected-world phase has nine checks, not ten.

Preview 03 archive: `artifacts/adventures-v3/BlockWorld-Adventures-Preview-03.zip`, 22,817,772 bytes, SHA-256 `6da24107f9209bdbbe571e53233da91b309d322efe0ef3d7008fc282af48b6fe`, source `eb7003e7fca9273882e1acf9af798b457a3a4bf5`. Extracted archive passes CRC, all runtime manifest hashes and **11 package checks**, including actual map travel, 15 thumbnails and 20 gallery images. The README and adjacent BUILD/CHECKSUMS/PACKAGE-VERIFICATION files are authoritative. Preview 03/evidence are now frozen: NEW implementation/evidence should use v4 folders. Continue immediately with the next item; this package is not the end of the assignment.
