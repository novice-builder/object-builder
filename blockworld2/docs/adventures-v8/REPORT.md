# Preview 08 — immediate arrival feedback and conservative touch startup

Continued from independently fetched/verified source `e4fcdcffe2313ff98ec8a57e745e908a56152ba8`, including Alderwick in new layout-5 valleys. Preview 06 (`d53f461`) remains the latest accepted historical package while this work is validated. The standing issue #2 was re-read after environment recovery and is unchanged. No deployment, automation change, reset redemption or overlapping writer occurred.

## Release-probe defect, corrected before acceptance

The extracted Preview 07 candidate passed archive CRC/runtime hashes and its earlier checks but failed when travelling from Alderwick to the lodge: the interaction still referred to Alderwick until the next rendered frame. Its minimap and rendered view were stale for the same interval. The candidate was **not accepted or pushed as a validated package**. Its exact bytes/hash/source and rejected probe log are retained in `package07-candidate.json` and `package07-rejected.txt`; the unreleased archive remains locally preserved under `/workspace/work/adventures-preview07-rejected`. A new numbered Preview 08 will be used instead of overwriting it.

Travel now immediately refreshes context, minimap pose (bypassing the normal 80ms sampling throttle) and the rendered arrival view. Modal/build/save transitions clear or refresh the current interaction immediately. Editing cannot invoke an old interaction via E. Physical world/layout data, animations, collision and the normal map sampling interval remain unchanged.

`arrival-ui.json` reproduces six reference failures (phone/tablet context, map pose and rendered frame) with RAF deliberately paused. Twenty current checks pass: actual door context/operation, fresh minimap/view, modal close, pending edit and keyboard guard, cancellation, new-record scene ownership and no exceptions. Real screenshots show the stale reference and correct lodge arrival. This proves correctness independent of render cadence, not a hardware FPS improvement.

## First-use touch graphics

New coarse-pointer sessions default to Gentle graphics. Fine-pointer desktop sessions retain Balanced. Every valid saved graphics choice is preserved, including Balanced/High on touch devices, and the Run preference remains independent. Invalid/missing/denied storage uses the appropriate fallback; the existing menu remains available to change it. No user preference key, saved world, model, palette or licence is changed.

Eight browser checks cover fresh phone/tablet/desktop sessions, stored Balanced/High, denied storage, malformed preference and changed-choice reload. Two deterministic regressions cover pointer defaults and explicit-choice preservation. The first persistence fixture mistakenly reseeded the original preference on every reload; `startup-quality-initial-fixture.json` records that harness issue, and the retained final run seeds only absent keys.

On the emulated DPR-3 phone, the fresh default drawing buffer changes 585×1266→390×844 (55.6% fewer pixels), with shadows disabled; submitted triangles in the fixed startup view change 126,573→92,709. The tablet buffer changes 1536×1152→1024×768, triangles 192,034→151,084. Explicit saved settings retain their prior drawing ratio/shadows. These are managed Chromium/SwiftShader counters and viewport emulation, not physical Lenovo/iPhone/Safari performance or a general speedup claim. The appearance still uses the same premade models/materials.

## Backup version coherence

One shared `PREVIEW_VERSION` now drives welcome/menu labels and backup filenames. Actual browser download checks verify `BlockWorld-Adventures-vale-preview08.bw2`, supported layout-5 checkpoint JSON, retained explicit model scale, exact text fallback and import into a separate record. Seven checks pass. The fixture reads the existing `checkpoint.json` encoding and opens the credits disclosure before checking its visible version; hidden text is not treated as a product failure. No save/schema/database migration is involved.

## Evidence and limits

165 deterministic tests pass; strict TypeScript/preservation and the Adventures production build pass. **40 focused current browser/download checks pass** (arrival 20, startup 8, backup 7, current world/map views 5), alongside the earlier 34 Alderwick source checks retained in v7. Screenshots were actually inspected: arrival, startup appearance and phone backup/menu. Fresh current-source Alderwick, map and phone-arrival screenshots were also inspected, including native travel after a map viewport resize. New layout-5 scenery, explicit creation, old layouts and 82 selected CC0 assets/provenance are preserved. Preview 01–06 packages remain untouched; no Preview 07 candidate is represented as an accepted release.

The managed execution review temporarily rejected a build before execution with a usage-limit response. The environment subsequently restarted/recovered; after the reported retry time, normal fetch/build/test execution was available again. The same worktree/lock and remote SHA were verified before resuming. No approval bypass or banked reset was used; no unmeasured total account allowance consumption is claimed.

Physical Lenovo, iPhone, Safari and Xbox/Bluetooth remain unverified. Other prefab houses stay closed; canopy collision, stacking, further functional interiors, NPCs/wildlife/vehicles and different themed worlds remain unfinished. Accept the next package only after its extracted probe passes, then continue useful development in the same run.
