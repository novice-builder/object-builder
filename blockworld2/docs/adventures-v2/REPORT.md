# BlockWorld Adventures — Preview 02

Prepared 06 November 2026, 05:09 ACDT. This continuation started from verified checkpoint `b15a4f356e9bbd3c44de9af1cd6fdf0cfa24b14f` on `codex/blockworld-adventures-asset-rebuild`. It ran in a usable managed execution environment, with no other active writer observed, an exclusive checkout lock, and remote-tip checks before checkpoint pushes. **No deployment, publication, main merge, public website change or banked-reset redemption occurred.**

## What changed

Fresh scenes now have smooth earth trails, clustered ground cover, bank reeds, subtle tree colour variation and distant terrain beyond the walk boundary. Existing Preview 01 records have missing/1 layout values and keep their original permanent geometry, paths, collisions and saved objects. New records carry `adventure.layout: 2` inside the existing native envelope. No original game schema/store code or database namespace was changed. Places > Start a fresh place creates the new scenery while retaining old worlds, with distinct record names.

The building catalogue uses 15 transparent 256×192 PNGs rendered from the real imported GLBs, friendly labels and category filters. PNGs total 137,179 bytes and load on demand. Opening the catalogue creates no new WebGL renderer/context. The thumbnail manifest records PNG hashes and the exact source-model hashes. Selection has a visible outline and cannot pick a user object through a permanent cottage/trunk. Existing objects move at the 200-object limit and keep their ID/custom scale. Rejected rotations preserve undo/redo state. Graphics/Run preferences use the separate guarded key `blockworld-adventures-controls-v2`; denied/corrupt storage falls back without blocking play. Portrait edit controls clear the joystick and redundant hints hide while editing.

Collision footprints are cached until a world/edit changes them, with a separately cached exclusion for the moving object. Camera ray/box clipping avoids per-body box/vector allocations. A close-wall defect was corrected: the camera no longer forces a minimum radius that can penetrate a wall. Its smoothed position is clipped again so interpolation cannot cut through a building corner.

## Tests and inspected renders

**127 deterministic tests pass and 76 browser/compatibility checks pass across four recorded passes.** Strict TypeScript, production build and preservation checks pass. The browser is managed Chromium using ANGLE/SwiftShader. Touch, viewport, missing-API and backup fallbacks are emulated; physical Lenovo/iPhone/Safari results are not claimed.

| Pass | Checks | Evidence |
| --- | ---: | --- |
| Baseline browser regressions | 35 | `qa-results.json` |
| Saved-layout compatibility and scenery | 12 | `art-checks.json` |
| Catalogue/editor/mobile UI | 21 | `editor-checks.json` |
| Collision/cache/camera regressions | 8 | `collision-checks.json` |

The compatibility pass loaded the extracted original Preview 01 package and compared old records in all three scenes with this branch. Permanent vertex/index data, path arrays, collision descriptors, landmarks and retained user objects match for layout 1. Layout 2 is explicit for fresh records; there is no silent scenery upgrade of an existing save. New-layout backups belong in the matching Preview 02 package; the older program cannot render the new scenery.

The editor pass exercises real thumbnail selection, category filters, placement, selection/outline, rotation, cancelled moves, the full 200-object limit, custom-scale retention, rejected-edit history, removal/undo, occluded picking, preference reload and phone/tablet layouts. Camera/cache checks cover reusable query views, edit invalidation, cancelled-move restoration, rotation, world switching, near-wall positioning and corner interpolation. Unit ray tests include parallel/inside/behind cases and 200 comparisons against Three.js’s established box intersection.

The [gallery](GALLERY.md) contains actual before/after scenery, catalogue, selected-object, phone/tablet controls, world and camera-regression images. Visual inspection corrected an invalid portrait media query and the resulting edit-bar/joystick overlap. Other inspected views retain clear path/bank connections and grounded props. No indoor scene is claimed.

## Measured cost

The same executor and a single browser context were used for before/after probes. Five trials each used 100 built props, 1,000 footprint queries and 500 camera updates. These are JS CPU wall times, not mobile hardware timings.

| Probe | Before | After |
| --- | ---: | ---: |
| 1,000 footprint queries, median | 178.3 ms | below the timer resolution in the median trial |
| 500 camera updates, median | 52.1 ms | 6.5 ms |
| 1280×800 software-rendered view | about 2 fps | about 2 fps |

The camera-update probe uses approximately 87.5% less CPU time here. Rendering still dominates the managed software environment; **no hardware FPS improvement is established**. A small drawing-buffer diagnostic reached approximately 4–5 fps, which is also not a physical-device result. `profile-before.json` / `profile-after.json` retain all trial values, renderer identity, source context/hashes and raw view counts.

Startup resources total 3,305,481 bytes (about 3.31 MB) before server compression, plus optional catalogue PNGs on opening Build. Two 1024px model atlases remain an estimated 10.67 MiB as RGBA8 with mipmaps, excluding generated textures, framebuffer/shadow and driver allocations. Geometry/material quality was not reduced to obtain the CPU result. Additional vegetation remains instanced and scene resources are disposed on switching. The base browser pass repeats nine world switches and records bounded geometry/texture counts; that is a limited probe, not proof against every possible leak.

## Preservation, assets and distribution

Preview 01 archives/evidence and every earlier release remain untouched. The original public website, root navigator, Neighborhood 06 and existing branches retain their contents. The original `Session`, `WorldStore` and game entrypoint remain unchanged. The Adventures database remains separate from the original game. Full preservation evidence is in `preservation-v2.json`.

The same 71 CC0 models and exact creator/source licence records are retained; Preview 02 introduces derived catalogue images, not a new unverified model pack. See `adventures/PROVENANCE.md`, `inventory.json`, licences and the thumbnail manifest. The original selected source files remain in the preserved Preview 01 Source Assets archive. Preferred Seahill/Quaternius Nature downloads remain blocked and are not represented as included.

Download `BlockWorld-Adventures-Preview-02.zip`, unzip into a new folder, run `python3 preview.py` (Windows `py preview.py`) and open `http://localhost:8000/adventures.html`. For same-Wi-Fi tablet testing use `python3 preview.py --lan` and the computer’s LAN address. HTTP is required for ES modules/GLB fetches; double-clicking the HTML is unsupported. Package files are self-contained and do not require npm or CDN requests. Read `README.txt` for controls and origin-specific backup instructions. Nothing is deployed. Deliverables are retained on the verified development branch because this managed executor cannot create the designated chat-output directory on its read-only root.

## Remaining work

Physical Lenovo and iPhone/Safari testing remains the main gap: cold downloads, sustained movement/orbit, thermal behaviour, backup/export reliability and 20+ world switches. Use those measurements to choose graphics/culling defaults. The current environment cannot provide them.

Prefab buildings are still closed exteriors with no opening doors/interiors. Camera canopy collisions, terrain/footprint edge cases and larger creations need further work. There is no dedicated authored turn clip, LOD/streaming terrain, NPC simulation, audio, vehicles or multiplayer in this separate entrypoint. The original game retains its existing systems. New layouts are intentionally separate from old saved layouts; use the matching preview for new-layout backups.

The scheduled continuation actually executed in a usable environment and produced real pushed checkpoints. No further automation is claimed. Continue from `docs/ASSET-REBUILD-CONTINUE.md`, check the remote tip and exclusive writer lock, preserve previous versions, and use a new version folder for further packages.

## Extracted package verification

The Preview 02 archive is 12,336,175 bytes. It passes CRC and all 105 runtime manifest hashes. The extracted package opens the game, loads all 15 catalogue images, creates a fresh layout-2 world through the UI, displays all 16 gallery views and supports before/after filtering and zoom/close. No runtime errors, missing files or external HTTP requests were observed. Ten package checks pass; see `../../artifacts/adventures-v2/PACKAGE-VERIFICATION.json` and `CHECKSUMS.sha256`. The packaged JavaScript filename/hash matches the post-optimisation profile, and its runtime source checkpoint is `b6546e873dc8bbd1f723ce917fa2a6e43b3bfd7e`.
