# BlockWorld Adventures — Preview 02 continuation

Work only on `codex/blockworld-adventures-asset-rebuild` in `novice-builder/object-builder`. Fetch and verify the remote tip before edits. Check for an active writer and acquire an exclusive checkout lock for the run (`flock` on `/workspace/work/blockworld-adventures-writer.lock`; file presence alone is not ownership). Skip if exclusivity cannot be established. Stop if the remote moves unexpectedly; never force another writer's history. Do not deploy, publish, merge main, modify the website repository/Neighborhood 06, redeem banked usage, or overwrite old packages/evidence.

## Verified history

- Immutable starting continuation checkpoint: `b15a4f356e9bbd3c44de9af1cd6fdf0cfa24b14f` (Preview 01).
- `63ad64ae4c8342bbdb504d12c246e26e06ced068`: new woodland scenery with saved-layout preservation.
- `4bff4a4c7f45de866deb47de7514d2aef702371c`: rendered catalogue, selection/editor fixes and control preferences.
- `b6546e873dc8bbd1f723ce917fa2a6e43b3bfd7e`: cached collision footprints and close-wall/corner camera repair; tested runtime source for Preview 02.

Each checkpoint was pushed and verified using the remote SHA. Later report/package commits follow the runtime checkpoint; the package BUILD.json identifies its actual source. The original verified Run 4 fixes remain inherited; original Session/WorldStore/schema files are unchanged. No unverified Run 4 recovery edits were imported.

## Current result

The separate `adventures.html` entrypoint retains Willowmere, Whispering Wood and Maker’s Meadow, imported CC0 models, a rigged Explorer with supplied idle/walk/run crossfades, touch controls, discovery interactions, building tools, saved worlds and backups. New layout 2 scenes have soft earth trails, clustered plants, reeds, varied foliage and distant terrain. Missing/1 layout retains the original permanent geometry/path/collision/object data; actual comparisons against the extracted Preview 01 package pass in all three worlds. Existing saves are not silently upgraded. Places > Start a fresh place creates a new record with latest scenery and a distinct name.

The catalogue has 15 actual GLB-rendered thumbnails and category filters; user selection has an outline. Moves at the 200-object limit retain scale/ID. Rejected rotation preserves undo/redo. Picking is blocked by permanent cottage/trunk obstacles. Graphics/Run settings persist in a separate guarded key; denied storage does not block play. Editing UI clears the joystick on portrait phones and hides redundant hints.

Footprints are rebuilt only after edits/world replacement, with cached moving-object exclusion. Camera box tests avoid per-body allocation. Close-wall and interpolated-corner positions are constrained before rendering. A five-trial CPU probe with 100 built props reduced median 1,000 footprint queries from ~178 ms to below timer resolution, and 500 camera updates from ~52.1 ms to ~6.5 ms. **Software raster performance remains ~2 fps at 1280×800; no physical Lenovo/iPhone/Safari FPS result is claimed.**

**127 deterministic tests and 76 browser/compatibility checks pass.** Evidence and actual renders are under `docs/adventures-v2/`, with report, gallery, phase logs, summary, before/after profiles and 102-file preservation hashes. Preview 01 and older archives/evidence stay unchanged. The same 71 CC0 model inventory/licences is retained; the 15 new derived PNGs total ~137 KB and have model/image hashes. Original selected source files stay separately archived in Preview 01. Preferred Seahill/Quaternius Nature archives remain inaccessible and are not included.

The scheduled continuation actually ran in a usable environment, with exclusive checkout locking and no other writer observed. `docs/adventures-v2/continuation-run.json` records this. No additional automation or banked reset redemption is claimed.

## Reproduce / inspect

From `blockworld2/`:

```
npm ci --cache /workspace/work/npm-cache --no-audit --no-fund
npm run test:adventures
node --import tsx --test tests/*.test.ts
npm run build:adventures
python -m http.server 5175 --bind 127.0.0.1 --directory adventures-dist
```

The build writes ignored `adventures-dist/`; it does not run original release helpers. Open `/adventures.html`. Base QA: `ADVENTURES_QA_URL=http://127.0.0.1:5175 ADVENTURES_QA_OUTPUT=docs/adventures-v2 python tools/adventures/qa.py`. Focused tools: `editor_v2.py`, `collision_v2.py`; `art_v2.py` additionally needs the preserved Preview 01 extracted/served on port 5177. `profile_v2.py --phase before|after` needs a single browser context for useful CPU observations. Do not rerun these into a frozen version directory once continuing a new preview; copy/adapt to a new evidence version.

`thumbnails.py` renders catalogue PNGs using the current build; rebuild after regeneration so static PNGs are copied into dist. Original source model files remain unchanged. `report_v2.py` combines four complete passes into summary/report/gallery. `package_v2.py --version 02 --output artifacts/adventures-v2 --qa-dir docs/adventures-v2` packages a committed/tested runtime and refuses any nonempty output folder before writing. Further packages must use a NEW version/folder, never rerun over Preview 01 or 02. The local preview ZIP runs with `python3 preview.py` and includes all local assets; GitHub is the delivery fallback because the managed root cannot create the designated chat-output directory.

## Next unfinished priorities

1. Physical Lenovo tablet and iPhone/Safari: cold load, sustained movement/orbit, thermal behaviour, storage/export, and 20+ world switches. Use real observations to tune graphics/culling defaults. Current cloud emulation cannot establish these results.
2. Dedicated open interiors/doors using suitable licensed modular assets. Current village prefabs are closed exteriors; no indoor feature is claimed. Original game systems remain available at their original entrypoint.
3. Camera canopy/terrain edge cases and larger creations; current constraints are simplified footprints/trunks plus analytic bridge contact. Consider better collision definitions before adding complex interactive buildings.
4. Continue environment art direction with actual screenshots. Existing layout 1 must remain stable for saved constructions; new permanent scenery belongs in a new explicit layout or new scenes.
5. No authored turn clip, LOD/streamed terrain, NPC simulation, audio, vehicles or multiplayer is claimed in this entrypoint. Add only when it improves the requested experience and can be verified.

Keep progress in small tested commits, push and independently verify each SHA, and update this resume point. A future code rollback does not restore saved-world contents; retain backups/checkpoints and import only as new copies. Use the matching preview version for layout-2 backups; Preview 01 cannot render later scenery.

## Final package state

`artifacts/adventures-v2/BlockWorld-Adventures-Preview-02.zip` is 12,336,175 bytes, built from runtime checkpoint `b6546e873dc8bbd1f723ce917fa2a6e43b3bfd7e`. The extracted archive passes CRC, all 105 runtime manifest hashes and ten package UI/resource/gallery checks. `BUILD.json`, `CHECKSUMS.sha256`, `README.txt` and `PACKAGE-VERIFICATION.json` are adjacent. It includes all local assets, run helper and a review gallery; no external requests are needed to play. No further automation was configured in this run. Preview 01 and its evidence remain unchanged. Stop owned local preview servers and release the writer flock when ending a run; an old lock file by itself does not indicate an active writer.

## Active Preview 03 continuation — updated direction

The next active run started from independently fetched/verified `9f07d29ae458be7ddba5a88ff81c85aa73172385`, clean worktree, no other agent/writer observed, exclusive OS flock acquired. New in-flight layout 3 art replaces sampled overlapping path caps with continuous ribbons, gives the meadow curved earth lanes and planted edges, and retains layouts 1/2. Evidence is written to NEW `docs/adventures-v3/`; earlier folders remain frozen. Full deterministic pass: 129 tests. Compatibility/render pass compares both old layouts to extracted Preview 02.

**Read [BLOCKWORLD-DEVELOPMENT-DIRECTION.md](BLOCKWORLD-DEVELOPMENT-DIRECTION.md) before choosing further work.** New user direction received during this run: one continuous populated main world combining the three regions, real minimap/full map with safe teleport, corrected tent/model scale; old independent records remain intact. Finish/checkpoint in-flight art, then prioritise the connected world and maps over adding independent medieval scenes. Continue milestones in the same run; a successful package/test is not a stopping condition. No physical device result, usage exhaustion or new automation is claimed.

### Preview 03 milestones

- `ab00eb202ca79b4e47726004b476d3983dabc284` is the verified/pushed scenery + updated-direction checkpoint (129 deterministic tests; ten compatibility/art checks).
- Connected-world implementation follows: `vale` scene/layout 3, shared global terrain/collision, regions at x=-105/0/105, two analytic bridges, additional Brookside/forester settlements, corrected new-template tent scale/orientation, safe extended save bounds. Old scenes/layouts retain separate records. Focused tests: 22; connected browser checks: ten. Evidence `docs/adventures-v3/vale-checks.json`. No map/interior is claimed by that checkpoint. Next immediate item: live minimap and full map derived from paths/building footprints, safe landmark travel; then measured culling (current road view ~556 draw calls). User updated direction remains authoritative; continue in the same run.

- `a94fc7e434dec8a9bfa26144ee441734aff29e7a` is the independently verified connected-world checkpoint.
- Map milestone follows: `map-data.ts` reads actual roads/buildings/rivers; `world-map.ts` uses cached 2D canvases, five safe destinations, Home, touch pan/pinch, wheel/keyboard zoom; minimap follows player facing. Full map pauses hidden WebGL rendering. Phone starts zoomed around the player; Fit shows the whole valley. Checked arrival helper never returns an unchecked blocked fallback. Focused deterministic tests: 25; browser map checks/renders in `docs/adventures-v3/map-checks.json` and `screenshots/map-*`. Next: measure/reduce combined-world draw submissions, then input/camera/placement and sustained stability. No interiors or hardware FPS result claimed.

- `821c0e4b73fc388d644711285c84621db06b27c6` is the independently verified map checkpoint (30 browser checks).
- Rendering milestone follows: cached untextured nature batching, conservative full-fog sphere culling, shared earth surface at connecting road joins. Fixed views reduce draw calls 41–51%; geometry buffers add ~55KB. CPU timings vary; no hardware FPS claim. Five source-equivalence/culling/24-switch stability checks pass after explicitly accounting for first-cycle shared-buffer warmup; combined view then plateaus at 89 geometries/11 textures. See `docs/adventures-v3/profile-*.json`, `cost-comparison.json`, `stability-checks.json`. The art harness stops its old/current animation loops for explicit inspection renders; six old-layout comparisons still pass. Next immediate item: touch interruption/pinch-to-orbit, blocked movement animation and footprint placement edge cases; then complete a separately versioned Preview 03 release and continue the backlog.
