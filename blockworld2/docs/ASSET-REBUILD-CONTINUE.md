# BlockWorld Adventures — active development continuation

Read the authoritative living [issue #2](https://github.com/novice-builder/object-builder/issues/2) FIRST, then this handoff and the latest preview report. Re-read issue #2 after each scheduled retry; its last observed update is **2026-11-06 08:40:52 UTC**. Full movement priority: [MOVEMENT-PRIORITY-2026-11-06.md](MOVEMENT-PRIORITY-2026-11-06.md). Earlier world/interior direction: [DEVELOPMENT-PRIORITIES-2026-11-06.md](DEVELOPMENT-PRIORITIES-2026-11-06.md) and [BLOCKWORLD-DEVELOPMENT-DIRECTION.md](BLOCKWORLD-DEVELOPMENT-DIRECTION.md).

This is open-ended ACTIVE DEVELOPMENT. A milestone, passing tests, screenshot, report or preview is a checkpoint. Verify, commit, push, independently read remote SHA, update this handoff and immediately implement the next valuable unfinished item in the SAME execution until a genuine execution/usage boundary or unavoidable blocker. No usage meter is exposed; do not invent allowance exhaustion.

## Current source and next action

- Signed riverbank save/reload and recovery correction is complete: **198 deterministic / 120 browser checks**, strict build. Finish independently verifying this source checkpoint, then create and test a fresh Preview 11 package on **5186**. Both earlier unaccepted candidates remain locally preserved; neither is an accepted release.

- Latest independently verified remote: **`43a0eab38a8f0487adaa1628800b697468af1e93`**, tested default Run/Jump/version-3 room source, following exterior repair `41a79fe7c9fdb50d006e24fb53fc81926bf88b2a` and `c4a3701fda19847853eb145a7a232157aec2d6a7` indoor mesh repair. Always rediscover remote HEAD; do not reset to this value if newer commits follow.
- Third v11 source milestone is committed, pushed and independently verified: default Run, saved optional Walk, keyboard/touch/controller Jump and existing Explorer jump clips; version-3 new single-storey cottage/workshop rooms, old saved upper floors retained, real ceiling headroom, loaded-bounds furniture fitting and safe airborne checkpoints. **198 full deterministic / 120 current browser-render-resource checks / 820 exact retained files**, strict build. See [v11 report](adventures-v11/REPORT.md), summary, full test/build logs and gallery.
- NEXT: create a NEW `artifacts/adventures-v11/` archive with `tools/adventures/package_v11.py`, then extract, verify all hashes/CRC, test the real package in Chromium and inspect screenshots. No accepted Preview 11 package exists yet. Package review also corrected maximum-length upgrade/recovery names (visible suffix/counter preserved within the native 60-unit limit, original records unchanged). The unaccepted source-6f8 candidate is retained locally at `/workspace/work/preview11-candidate-before-copy-name-fix/`, reference on 5184; use a fresh final extraction on 5185. After acceptance freeze v11 docs/artifacts and IMMEDIATELY begin NEW v12 work.
- Following priority: expand the connected main world with an intentionally composed populated settlement/district, natural roads/trails and useful exploration destinations; inspect actual map/world views first. Permanent new footprints need an explicit NEW layout/new record (current latest layout 6) so older layouts 1–6/constructions remain intact. Keep new buildings enterable with matching separately saved furnished scenes and walkable stairs where appropriate. No generic catalogue/material bulk.
- Then continue building-specific interior activities and measured mobile rendering improvements. Distinct themed worlds, wildlife/NPCs, transport and other useful expansions are authorised when coherent. Do not treat these as a fixed endpoint.

## Accepted release and preservation

Latest accepted package before v11: **Preview 10**, package checkpoint `3dcd4f630006fd00f5631d362ce9cc20da8a595c`, runtime `6ac4edfe9e79ee71cfa815ab6ff06e1ed0075613`. ZIP `artifacts/adventures-v10/BlockWorld-Adventures-Preview-10.zip`, 6,735,700 bytes, SHA-256 `c56645f59f71e7a36e752bd29c4c4e92a5946f4b15b3114622075e555a4f2b75`. Preview 10 and ALL prior reports/packages are frozen. Source before these movement corrections had 182 deterministic tests and 72 focused checks; extracted package 25 checks. Never mistake that checkpoint for current remote HEAD.

Protect original website/Run 3, Neighborhood 06, main/other/historical branches, Pages, older previews/packages, all saves/backups and source licences. No deployment, publishing, main merge, force push, banked reset redemption, restricted download bypass or automation changes. Keep the existing hourly automation recurring until the USER manually disables it. Do not create a competing automation.

Preview 01/02 independent environments are retained, not silently reinterpreted as a merged world. Current main world is one continuous 370×196m Willow Vale, including Willowmere/woodland/meadow, Brookside, Alderwick and Reedbank, three fitted bridges, real minimap/full map and safe landmark travel. Older layout records keep their scene data and constructions.

## Exclusive checkout

Before edits, inspect worktrees/local changes/processes, fetch GitHub and compare current remote ancestry. Obtain an exclusive advisory flock on `/workspace/work/blockworld-adventures-writer.lock`; if another writer holds it, SKIP rather than overlap. Stale PID text alone does not prove a held lock. Do not discard uncommitted work or kill another writer.

This continuous run currently owns **PID 81890**'s fcntl flock, acquired after the normal 09:00 UTC usage retry; it expires around 17:57 UTC. Earlier PID 36707 was defunct. A later independent run must establish fresh exclusivity. Normal commands resumed successfully after the explicit retry time; no reset or bypass occurred.

## Movement, save and asset seams

- `character-controller.ts` / `mesh-collision.ts`: shared generic actual-triangle capsule stepping at most 0.30m, real support/head clearance, ground snap, two-sided movement contact, footprint idle/reload support. Preserve imported mesh openings. Trees/props retain suitable bounded collision; no oversized building/stair box in active Adventures movement.
- `outdoor-collision.ts`: shared model trees and instance matrices, moving-owner exclusion. `model-steps.ts` derives recognised human-scale stock front flights from source faces and re-cuts real treads inside unchanged bounds. The town-house 0.378m risers become 0.189m. Original GLBs and saved placements remain unchanged. Arbitrary CAD import UI/nonuniform instance baking is unfinished.
- `building-entry.ts`: stable identities, actual stair-centre/threshold prompts. `Interior` has separate local geometry with actual tread/rail/ceiling collision; outdoor rendering is suspended indoors while shared outdoor resources remain retained.
- New Adventures data version 3 supports new one-floor cottage/workshop templates and movement checkpoints. An entry with NO `levels` keeps its legacy saved upper floor; NEVER regenerate or flatten it. New town houses/inns/mills have two floors. Older versions 1/2 fork an independently named updated record before Jump/new-template use. Native schema/database isolation remains unchanged. Preview 10 safely rejects version-3 imports. `checkpoint-footing.ts` saves clear support or the preceding landing while airborne.
- Running defaults ON; Walk preference has a new v3 key, preserving/migrating graphics quality and keeping the old preference key. Space / touch Jump / standard left bumper jump once; A remains interact/confirm. Held/released/cancelled touch, controller disconnect/neutral re-arm and map interruption are tested. No physical Xbox/Bluetooth claim.
- Existing CC0 GLBs/Explorer jump clips are reused; no new model/image download in v11. 21 builder/furniture thumbnails remain, with no generic catalogue/material expansion. Original licences and source inventories are unchanged. Restricted Seahill/Quaternius Nature downloads are not included.

## Verification workflow

From `blockworld2/`: `npm run build:adventures` (strict TS + preservation + separate ignored Vite output); `node --import tsx --test tests/*.test.ts`. Do NOT use original `npm run build` release/deploy helpers. Managed Node/browser/network commands need the normal available network/IPC permission; without it Node may report file counts or git EPERM. Inspect named totals.

Current final v11 browser tools: `jump_controls_v11.py`, `room_templates_v11.py`, `room_compat_v11.py`, `movement_inputs_v11.py`, `outdoor_steps_final_v11.py`, `outdoor_regress_final_v11.py`, `movement_cost_final_v11.py`, `furniture_edit_v11.py`. `report_v11.py` consolidates their 120 checks and source/build/protected-file hashes. Earlier `mesh_rooms_v11.py` / `mesh_inputs_v11.py` represent the pre-single-storey staged repair and must not be mistaken for the final fresh-cottage template. Once v11 is accepted, copy/adapt tests into NEW v12 paths; never overwrite accepted v11 evidence.

Owned quiet servers in this run: current `adventures-dist` on 5175; extracted Preview 10 on 5183; earlier references 5176/5178/5179/5180/5181/5182. Check owned processes before reuse. The unaccepted first Preview 11 candidate is on 5184; the corrected final Preview 11 extraction should use a fresh folder and port 5185. Original/extracted packages remain unchanged. Physical Lenovo/iPhone/Safari/Xbox/Bluetooth remain UNVERIFIED. SwiftShader FPS is not physical mobile performance.

Measured v11 samples: same 52 model/image URLs, about 3.722MB startup versus 3.701MB in v10; +2–4 calls / +90–248 submitted triangles in four fixed views, unchanged textures, bounded GPU/model/tree caches. CPU idle/camera samples are workload measurements, not mobile FPS. No performance overpromise.

At a genuine boundary, push completed work, independently verify remote and leave the exact resume point; release only owned resources/lock. If execution/usage blocks work, stop truthfully and let the existing scheduled invocation retry. No indefinite uninterrupted-execution claim.

Previous source history: [ASSET-REBUILD-HISTORY-PREVIEW11-MOVEMENT.md](ASSET-REBUILD-HISTORY-PREVIEW11-MOVEMENT.md), [ASSET-REBUILD-HISTORY-2026-11-06.md](ASSET-REBUILD-HISTORY-2026-11-06.md), and frozen versioned reports.
