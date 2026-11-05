# Run 1 validation

Environment: Node 24.19.0, Linux Chromium 154.0.8037.57, Playwright 1.56.1, touch event dispatch and ANGLE SwiftShader. Primary viewport 1024×600; compact landscape 844×390 and portrait 390×844 are exercised as layout checks.

## Executed deterministic/build checks

`npm run check` passed all **72 deterministic cases**, strict TypeScript compilation, all **49 original-file preservation checks**, and the production build. The tests include the retained 41 upstream cases, all 20 source hashes, an exact active-physics-fork comparison, atomic edits/history/presets, every one of the 111 catalogue entries at 0°/90°, native schema migration/roundtrip, fractional surface placement, elevated stairs, world isolation/recovery/conflicts, flight/camera/vehicle checks, every town doorway, garage fit, clear plots, bounded routes, four animal species, greeting pauses and traffic headway.

Runtime JavaScript is approximately 609 kB / 171 kB gzip. Vite's 500 kB advisory remains visible. Original block IDs retain the proven exposed-face/chunk renderer; new compound models use instancing. This is architectural bounding and regression coverage, not proof of sustained tablet frame rate.

## Browser validation

`npm run test:browser` passed all **22 scenarios** in the final full run. Strict TypeScript was rerun successfully after the update-test addition. Coverage includes touch placement/rotation/move/history, long-press removal/release suppression, drag/pointer cancellation, flight and both cameras, favourites/thumbnails/presets, half-slab placement/reload, doors, seats/standing, friendly animals, driving/save/reload, map drag/travel, old-template switching, independent worlds, backups/file imports, failed storage and stale tabs.

Offline checks exercise cold-tab restoration while retaining a sentinel Neighborhood 06 cache. The worker-update scenario serves a scratch copy at `/blockworld-2-preview/` on a separate localhost origin, installs a real changed worker/cache identity, closes old clients for activation and checks the same world ID/build plus legacy cache after an offline cold launch. This is a local lifecycle test, not a deployed HTTPS/device result.

The first full browser run passed 20/21. Its failing cold-reload check used a helper that had been extended to create the original slice for mechanical tests; it inadvertently created another world during resume. The helper now separates slice creation from cold resume. Earlier focused surface-placement testing also corrected an assertion that incorrectly expected a confirmation preview for immediately placed cubes. These were test setup/assertion errors; the complete final 22-scenario run passed.

## Visual and device limits

The expanded town, original home interior and rendered garden catalogue were inspected visually. The catalogue footer was then pinned within the modal so Play/paging remain in view while the object grid scrolls. Compact layout checks assert footer bounds and usable grid height, and the existing render-call guard below 180 passed. This is not an FPS measurement. [Town](screenshots/run1/town-overview.png), [interior](screenshots/run1/home-interior.png) and [catalogue](screenshots/run1/catalogue.png) retain rendered evidence separately; historical foundation evidence is unchanged.

No physical Lenovo, Android installation prompt, iPhone/Safari/WebKit, actual device storage-full/eviction, long-session thermal/memory benchmark, measured mobile FPS or OS-restart/update qualification was performed. Icons and Apple metadata are prepared; maskable safe-area qualification and visible offline-ready/update status remain follow-up work. See CONTINUE-RUN2.md.

## Preservation and packaging

All source changes stay inside blockworld2/. Existing main, foundation branch, 49 original release/app files, 20 frozen mechanical modules and the foundation archive remain intact. No existing Pages configuration or worker was changed. Preview publication is blocked by unavailable repository/Pages administration and invalid CLI authentication; no preview URL is reported as deployed.

The Run 1 archive is separate from the foundation archive. `artifacts/run1/BUILD.json` records its clean source SHA, build identity, lockfile/archive hashes and executed packaging checks. Every substantial development checkpoint was pushed and independently fetched through GitHub before proceeding.

Final packaging used clean source `f953b7895c8ee8b5245594c0892c11216aa3d252`. Two consecutive builds were byte-identical across all 13 files, build identity `c2f7ae3a6a0985fe`. The 219,889-byte archive passed ZIP CRC, exact dist-byte and release-manifest SHA-256 verification. Its SHA-256 is `239ef2ecb882bbd7154f8ac4bd176ddc9f11a3f067b55da82646a20dbda5f934`. Both cold-offline and worker-update browser scenarios passed again against this exact clean bundle (2/2). The separate archive checkpoint contains only documentation/packaging changes after the validated source commit.
