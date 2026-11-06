# BlockWorld Adventures — active continuation after Preview 08

Read the authoritative living [standing user brief in issue #2](https://github.com/novice-builder/object-builder/issues/2) FIRST, then [BLOCKWORLD-DEVELOPMENT-DIRECTION.md](BLOCKWORLD-DEVELOPMENT-DIRECTION.md), this handoff and the latest report. This is open-ended ACTIVE DEVELOPMENT. A milestone/build/test/report/package is a checkpoint; continue implementing the next valuable unfinished item in the SAME execution until a genuine execution/usage boundary or unavoidable blocker. No usage-meter tool is exposed; do not invent allowance exhaustion.

## Authoritative priority update — 6 November 2026

Issue #2 was re-read after its 04:26:43 UTC update. Its new [immediate development brief](DEVELOPMENT-PRIORITIES-2026-11-06.md) supersedes conflicting priorities: richer connected settlements/world first; default compact Enter → fade → separate matching furnished interior → fade → safe return to the SAME building; independently persistent room edits; ordinary physically walkable stairs/upper floors using touch/keyboard/gamepad. Keep the working physical lodge door. Deprioritise generic catalogue/material expansion. Finish/checkpoint work underway, then immediately continue world expansion and fade interiors. Never stop because a package or test milestone succeeds.

## Current source and delivery

- Latest independently verified remote checkpoint before the current camera milestone: `1fe6f9961b3a9d8a385d00f2451a18a75e36c746`. Accepted Preview 08 runtime source: `57b84e7046b6e8d6852fcbe9acbe6a6a5f68f55b`. ZIP `artifacts/adventures-v8/BlockWorld-Adventures-Preview-08.zip`, 6,739,240 bytes, SHA-256 `3ad9deb092bf054c78c8d6d23484a2b607fffdabc8dcbe02f94badfc10fbe015`. 165 deterministic, 40 current browser/download checks, 19 extracted-package checks, 568 protected file comparisons. Preview 08 is accepted and frozen; new work is in v9 folders.
- Current small camera milestone: camera-only leaf bounds from actual referenced GLB indices (shared position accessors include unused trunk vertices); separate from walking/placement collision. Four actual tree/camera fixtures reproduced camera-in-foliage before, all clear after; a close obstruction now hides the character. Three focused regression tests; strict build passes. See `docs/adventures-v9/REPORT.md` and screenshots. Checkpoint this tested work then proceed directly into fade interiors, not catalogue expansion or another package of only this repair.
- Preview 07 archive was rejected: stale context/map/view after travel. Candidate retained locally in `/workspace/work/adventures-preview07-rejected`; evidence in v8. Do not overwrite or claim it passed. Preview 08 fixes arrival synchronously and uses conservative coarse-pointer defaults while preserving stored quality choices.
- A temporary usage-review block recovered after its reported retry time. No bypass/reset redemption occurred. No usage-meter tool is exposed; do not claim measured account exhaustion. Historical push blockers resolved normally.
- Prior cumulative notes and checkpoints are in `ASSET-REBUILD-HISTORY-2026-11-06.md` and frozen versioned reports.

## Exclusive work and preservation

Before ANY edits, inspect local changes/worktrees/processes, acquire an exclusive advisory flock on `/workspace/work/blockworld-adventures-writer.lock`, fetch GitHub and compare current remote ancestry. If another writer holds it, SKIP rather than overlap. A stale PID text is not proof of a live lock; preserve uncommitted work. This active run owns PID 36707's flock; later runs must establish fresh exclusivity and must not kill another writer.

Protect the original website/Run 3, Neighborhood 06, main/other/historical branches, Pages, all old packages, saves and backups. Do not deploy, publish a site, merge main, force-push, redeem a banked reset, bypass restricted asset flows, or alter/disable/complete/reschedule the user-managed hourly automation. Do not create competing automations. Explicit user authorisation covers normal development, tests, source commits and non-force branch pushes.

Old Preview 01/02 records retain separate environments/layouts. Layout 3/4 vale saves retain their constructions; new permanent footprints require an explicit opt-in NEW layout/new record. Do not silently merge/interpret independent saves. No construction-import/migration UI is claimed. Native schema/store/database isolation stays unchanged.

## Product state and next priorities

One continuous 370×196m Willow Vale joins Willowmere, Whispering Wood and Maker’s Meadow, two river bridges, Brookside/foresters' settlements, roads and shared terrain/collision. Live minimap/full actual-layout map with zoom/pan/safe landmark travel; real Meadow Lodge door/furnished room in layout 4; idle/walk/run Explorer animation; 19 builder thumbnails/furniture/human-scale new tents. Explicit saved scales stay unchanged. Standard browser Gamepad API support shares existing actions, with deadzones, neutral/release/disconnect fallback and menu help. Physical Bluetooth/hardware is unverified.

Gentle static-instance culling reduces submitted triangles 17.3–34.4% in six fixed views while matching corrected full-batch rendered pixels; shadow modes restore all casters. Fog uses forward view depth. Extra typed-array storage ~407,680 bytes/world; variable CPU submission timings do not establish an FPS gain. Resource probes plateau; SwiftShader is NOT physical-device performance. Brookside driveway materials/depth priority were polished without changing geometry/collision.

1. Implement matching fade-transition interiors at stable individual building IDs, keeping existing exterior records/archives. Reuse existing audited ramp/landing physics where appropriate. Independent room furnishings/player edits, safe exact-building return, reload/rapid-transition recovery, suspend outdoor rendering while inside.
2. Build genuine walkable stairs and upper-floor rooms with safe landings, camera visibility, furniture and normal touch/keyboard/gamepad movement. Never claim decorative stairs are functional. Existing physical Meadow Lodge remains supported.
3. Continue richer connected settlements, natural roads/countryside and discoveries; new permanent footprints require an explicit layout/new record to protect older constructions. Alderwick layout 5 is already implemented and visually inspected.
4. Maintain comfortable phone/tablet input, editor/save recovery and measured mobile rendering costs. Deprioritise generic blocks/catalogue expansion. Research legally downloadable coherent assets when they directly support the world/interiors; retain provenance. Restricted Seahill/Quaternius Nature downloads are NOT included.

Other prefab houses remain closed UNTIL the new fade-interior implementation is actually verified. NPCs/wildlife/vehicles/audio/new themed worlds remain unfinished. Physical Lenovo/iPhone/Safari/Xbox/Bluetooth tests remain unverified.

## Reproduction and workflow

From `blockworld2/`, run `npm run build:adventures` (strict TS + preservation + separate Vite output), `node --import tsx --test tests/*.test.ts` and focused `npm run test:adventures` as appropriate. Do NOT use original `npm run build` release helpers. Managed Node/browser subprocesses need the available network/IPC permission; without it Node can report only test-file counts or `spawnSync git EPERM`. Inspect logs, not just exit status.

Serve ignored `adventures-dist` on local 5175; quiet `/workspace/work/serve_adventures.py` avoids orphaned log streams. Preserved Preview 04 is extracted on 5176, Preview 05 on 5178 in this active run; check owned processes before reuse. V6 tools: `placement_targets_v6.py --phase before --url http://127.0.0.1:5178` versus `--phase after`, `placement_safety_v6.py`, `placement_input_v6.py`, `selection_cutaway_v6.py`, `placement_resources_v6.py`. Never run old tools into preserved v1–v7 folders. V8 tools: `arrival_ui_v8.py` (5180 rejected reference vs 5175 current), `startup_quality_v8.py --phase after`, `backup_version_v8.py`. Runtime review limit recovered; do not treat the prior rejection as current without a fresh check. Actual screenshots must be inspected, not merely generated. Phone/tablet are Chromium emulation only.

Commit meaningful tested milestones, push normally, independently read remote SHA, update this handoff and IMMEDIATELY implement the next priority. At a real boundary push completed work and leave an exact resume point; release only owned servers/lock. If the environment or quota blocks coding, report honestly for the next scheduled invocation without disabling it.
