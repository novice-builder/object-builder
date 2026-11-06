# Preview 06 — precise placement and visible editor previews

Continued immediately after the separately preserved Preview 05 delivery at `3b8b0600a24e308212e47785fde25a774f366ce8`, runtime source `c113ffcbacdc2f247b646ce55737874372879d18`. No historical package/evidence, original site, native persistence, public asset or existing save layout was replaced. No deployment or automation change occurred.

## Player-facing changes

Choose an asset, tap/click nearby ground to position its ghost, rotate/look to inspect it, then explicitly choose Place. Furniture uses a 0.25m grid; other models use the existing 0.5m grid. The Move/Aim ahead button returns the ghost to following the camera. Keyboard/default gamepad aiming remains available. Ground/floor targeting uses the shared walking height field, including the real lodge floor. Reach is bounded (normally 8m for props/furniture, 18m for buildings, enlarged for large custom models). Walking away invalidates the pinned preview; confirmation rechecks it. Path, water, footprint, collision, capacity, cancel, undo/redo and backup protections remain.

Actual screenshot inspection found a pre-existing invisible-ghost defect missed by numeric placement checks. Single-material GLB meshes were converted into material arrays even when they had no geometry groups, so they produced zero ghost draw calls. Preview materials now preserve the source material shape. Native taps and rendered-ghost callbacks reproduce zero draws on preserved Preview 05 and verify visible models after the fix. The before/after screenshots show the difference; a valid numeric location alone is not accepted as rendered evidence.

The interior pass reproduced a second existing defect: a placed chair could not be selected because the hidden facing wall still blocked picking from the elevated cutaway camera. Picking now uses actual cutaway visibility, keeps visible far walls/door/header/roof occlusion, and preserves all five physical walls for movement and placement. Native phone/tablet taps fail on the preserved package and select the outlined chair in this source. Side-view floor targeting works; the visible far wall still rejects targets behind it.

## Evidence

`placement-targets-before.json` reproduces six Preview 05 failures (ignored ground taps and invisible ghosts across phone portrait/landscape/tablet). `placement-targets-after.json` passes 33 checks, including actual ghost draws, active toolbar bounds, confirmation, anchored rotate/look, reach revalidation, Aim ahead and new-record backup round trips. An initial toolbar assertion ran after import had hidden it; the retained final run checks the active toolbar instead.

`placement-safety.json` passes 28 checks: phone/tablet interior floor support, visible chair, native selection/Move, exact target/cancel/undo/redo, invalid path/water feedback, rejected obscured prefab target, rendered multi-primitive cottage and no exceptions. This pass exposed the hidden-wall selection defect before it was fixed. `selection-cutaway.json` records two expected reference failures and two successful current native selections, retaining all physical walls.

`placement-input.json` passes seven checks for native keyboard/mouse, side cutaway, visible far-wall occlusion, orbit/cancel ownership and no runtime errors. `placement-resources.json` passes two checks: all six representative model types render over 24 preview/cancel cycles, with resources stable at 82 geometries/12 textures/11 shader programs in that chosen view. This is a bounded resource probe, not a physical or long-session/thermal performance result.

There are **72 current browser/resource/compatibility checks**, excluding the two expected Preview 05 selection failures. Five new deterministic regressions cover flat/sloped/floor ray hits, invalid/range cases and cutaway picking with unchanged physical walls. The strict build/preservation passes; the complete deterministic release suite passes 158/158 tests. Its logs are retained alongside this report. Actual rendered phone, landscape, tablet, supported interior, side cutaway, invalid-path and selection screenshots are under `screenshots/`.

All browser results use managed Chromium/SwiftShader with input/viewport emulation. Physical Lenovo, iPhone, Safari and Xbox/Bluetooth remain unverified. Existing save records and explicit scales are preserved; no new asset, world layout or destructive migration is introduced. The same 82 selected CC0 assets and provenance remain. Picking uses simplified physical bounds; stacking/vertical editing and full canopy collision are unfinished. Other original prefab houses remain closed.

## Continue

Verify and push this coherent source, create a separately numbered Preview 06 package, check its extracted runtime and independently verify the remote SHA. Then continue useful connected-world work in the same execution. A richer northern settlement/district with natural paths and safe discoveries is a candidate; permanent footprint additions require a NEW opt-in layout/new record, preserving layout 3/4 constructions. Do not silently rebuild existing worlds, add arbitrary features, stop at the archive or change the user-managed repeating automation.
