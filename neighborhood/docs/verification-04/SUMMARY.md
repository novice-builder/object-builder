# Neighborhood 04 verification results

Client release date: 28 October 2026. This is an exploration test release; 03 remains the user-approved stable baseline.

- Artifact: `BlockWorld_Neighborhood_04.html`, **577,900 bytes** (564.4 KiB).
- SHA-256: `7e57b8de5047233ce208f177a2d8a5861aba1653b7472a91fef5a389e71ffd48`.
- All 47 earlier root HTML files match the approved baseline branch byte for byte. See `preservation.json`.
- **30 deterministic tests passed** (core controls, collision, all doors, geometry, layout/path clearances, local index equivalence, large saves, meshing, crafted preview/picking and chunk identity).
- **19 mobile browser scenarios passed**, including **1,197 touch-point activations** across 390×844, 844×390, 428×760 (DPR 3 and scaled menus), and 800×600.
- All 16 building doors were exercised automatically/manual, inside/outside, including walking through, closed-door obstruction and reopening.
- **7 save/navigation scenarios passed**, including reopening 12,000 pieces, real download and real large-file import (955,919 bytes), older imports, invalid-import rejection and preservation of 03's key.
- Offline document-route runs used no external runtime assets. The additional `file://` smoke test was **blocked by managed Chromium URL policy** (`ERR_BLOCKED_BY_ADMINISTRATOR`); policy was left intact. Actual local-file execution on Lenovo/iPhone remains unverified here.

## Software-renderer observations

Linux headless Chromium, ANGLE SwiftShader software GPU; not Lenovo/iPhone. Browser 154.0.8037.57; 800×600 CSS pixels, DPR 1, gentle quality. Each row is a five-second stationary view after 1.5 seconds of settling. No simultaneous browser workload ran during profiling. These are **not tablet or iPhone FPS figures**. Short, single-run samples include scheduling/GC noise and cannot establish sustained smoothness.

| View | FPS | p95 ms | Calls | Triangles | JS heap MB | Touch release → next RAF ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 3-home | 22.5 | 83.3 | 29 | 5,014 | 6.4 | 21.7 |
| 4-home | 21.6 | 99.9 | 57 | 18,755 | 22 | 69.6 |
| 4-village | 31.5 | 66.7 | 47 | 11,277 | 35.4 | 20.6 |
| 4-park | 29.3 | 66.7 | 86 | 22,301 | 25 | 55.1 |
| 4-woods | 41.6 | 50.0 | 7 | 5,166 | 17.7 | 15.9 |
| 4-12000-pieces | 22.9 | 83.3 | 28 | 10,246 | 25.6 | 62.8 |

04's document-to-ready observation was 592 ms; first rendered frame after game boot was 386 ms. 03's ready observation was 701 ms; it also initializes the shared software GPU first, so this is not evidence that 04 starts faster. JavaScript heap is not total browser or GPU memory; GPU-memory measurement was unavailable.

At 12,000 pieces, import/validation/chunk construction took 403.8 ms. The single dense-build ray pick took 3.3 ms, removal 34.2 ms, and Undo 59.1 ms. Only the edited chunk rebuilt for each operation; the other populated chunk kept its mesh identity. This is a stress case with roughly 9,000 blocks in the edited chunk, and the edit pause remains a real limitation to retest on the tablet.

The earlier unoptimised stress view submitted 147,920 triangles and observed 1.4 FPS here. Exposed-face meshing reduced the final view to 10,246 triangles while retaining all 12,000 saved/collidable blocks. The prior report and its distinct pre-release hash are retained in `performance-before-culling.json`; it is not a measurement of the delivered artifact.

The static world uses 141 chunks and 40,310 triangles (excluding animated door meshes, browser-only sign meshes and player builds). Full visible geometric detail is retained; no distance LOD or streaming was added. Common-block meshing omits only fully hidden faces between touching opaque cubes.

Screenshots were visually reviewed for district layout, roof/facade orientation, driveway joins, woodland density, map and UI placement. They are browser renders, not user visual approval. Shops, swings and shallow water remain scenery. Follow `../WORLD_04.md` for the physical-device checklist.
