# Verification — 27 October 2026

Milestone 1 is implemented as an isolated prototype, not a finished game. No actual Lenovo tablet or iPhone was available. The owner has not approved the appearance. Remote publication was blocked by automatic approval review because uploading the generated work to the public repository was not explicitly approved. The development branch and commits exist locally; the download package includes the complete source and a Git bundle.

## Observed checks

- **9 core tests passed:** camera-relative and diagonal movement; wall sliding and low-FPS collision substeps; jump/floor/ceiling collision; supported placement, self-overlap, reach and capacity rules; undo with crafted-item accounting; validated save roundtrip and bad import rejection; vertical doors and correctly transformed usable openings; entrance/drive alignment and house separation; finite positive mesh transforms.
- **12 browser scenarios passed:** startup; real keyboard walk to a closed door/open/enter; jump and pause/input release; actual nearby workbench UI and a recipe; place/remove/undo through UI; autosave/reload; export/import; offline interaction without external assets; an 800-piece save; touch joystick/look/cancel, placement and button layout at 1024×600, 600×960 and 390×844. These are Chromium touch emulations, not physical-device tests.
- **Offline startup smoke passed:** network disabled before initial navigation, with the built HTML document supplied locally. Only the document loads were requested; renderer, icons and generated art required no external assets. The managed Chromium policy blocks `file://` navigation, so OS/file-manager launch was not verified here. Actual Android local-file opening and airplane-mode reopening remain owner checks.
- No page errors occurred in the successful browser run. Browser version: Chromium 154.0.8037.57, headless Linux, ANGLE SwiftShader.
- Existing tracked files, including `index.html` and every old version, have no changes relative to the inspected `origin/main` baseline. Only new files were added.

Run `npm test` and `npm run test:browser` in `neighborhood/` to reproduce. `node test/performance.mjs` produces the controlled samples below. Browser tests use installed Chromium; see the README for the executable override. Raw results and screenshots are included in the download package.

## Visual inspection

Screenshots were inspected from north/south oblique angles for all four houses, plus overview, interior, crafting and tablet/phone UI. This found and corrected lawn showing through coplanar indoor floors, small roof infill gaps, a porch-drive alignment issue, and the phone instruction label overlapping buttons. The touch run also caught suppressed native clicks after canceled gestures; touch buttons now activate on release and suppress duplicate touch clicks.

Final inspected views show upright doors and knobs, window frames in wall openings, roof forms joined to their wall profiles, grounded posts/furniture and driveways reaching the road. The neighborhood has four compact single-room houses with varied dimensions, colors and three roof forms. Their facades and furnishing approach are intentionally simple and still share a family resemblance; more varied floor plans and side windows are appropriate after the first child play test. There are no garages or cars to misorient. Glass is stylized opaque/frosted material in this release. No automated geometry check is being treated as visual approval.

## Controlled performance sample

Same camera, 1024×640, DPR 1, no shadows. Each sample lasted about 3.6 seconds. **Software graphics in the cloud; these values neither measure nor predict Lenovo performance.** The stress sample deliberately puts all four instanced build batches in view.

| Measure | Empty neighborhood | 800 placed pieces |
| --- | ---: | ---: |
| Average sampled FPS | 22.7 | 3.6 |
| p95 frame interval | 83.3 ms | 450.0 ms |
| Draw calls | 32 | 36 |
| Rendered triangles | 5,082 | 14,682 |
| Uploaded procedural textures | 0 | 4 |
| JS heap estimate | 5.9 MiB | 9.0 MiB |
| Last placed-mesh rebuild | 0.2 ms | 2.3 ms |
| First rendered frame from game script start | 537 ms | 221 ms |

The empty scene has no placed materials, so their textures are not uploaded yet. FPS and frame pacing are poor in the software-rendered stress case and are **not accepted as a tablet result**. Heap is browser-exposed JS heap, not total process, device RAM or GPU memory. First-frame timing excludes download/browser launch. These short samples are observations, not a stable hardware benchmark. The on-device overlay is available for the owner's measurements. Keep the neighborhood small and tune only after those measurements.

## Scope and practical limits

Implemented: walk/look/jump, touch input, safe home return, doors, furnished home, 1 m snapped build/remove/undo, four unlimited common materials, three picture recipes with inventory counts, autosave and JSON backup/restore, diagnostics and an offline bundle. Undo is session-only. Fixed structures are protected. Crafted objects use conservative whole-cell collision, and the lantern is decorative in a daylight world.

Not implemented: companion/family role-play, mining/resources, custom-piece editor imports, gamepad support, educational rewards, voice recordings, Android APK or PWA installation. Named voice cues and a 13-line script/manifest are prepared; missing recordings stay silent and playback is not yet audio-tested.

Next: the owner's tablet trial should decide file delivery, control size/look speed, visual style, saving and performance. Fix those issues first. Then add one friendly companion with a few home interactions before expanding the map or bringing editor complexity back.
