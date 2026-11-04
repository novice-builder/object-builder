# Prototype validation

## Executed checks

- `npm run check`: all 59 deterministic cases passed, TypeScript strict compilation passed, preservation checks passed, Vite production build passed.
- `npm run test:browser`: all 14 Chromium scenarios passed.
- The deterministic suite includes all 41 retained upstream mechanical/world regressions, command history/unlimited availability, fixed-step catch-up, exact upstream provenance, IndexedDB instances/checkpoints/conflicts, portable and legacy backups, safe arrivals, flight ceilings, camera obstruction, all five slice doorways and vehicle collision/exit.
- Browser coverage includes real touch placement/rotation/undo/redo, long-press removal/release suppression, camera drag/pointer cancellation, ledges/door approach, switching/rename/duplicate/reload, real downloads/file-input imports, stale tabs, closed-storage failure with unsaved export, both cameras/flight, driving/save/reload, ambient movement, map drag/travel and a new offline tab restoring progress.
- Offline verification retained a sentinel legacy cache. Original legacy save-key sentinels were unchanged.
- All 49 files in main baseline 1ffd35ed971afa7820734cf10a3287ab546f6306 remain byte-identical. All 20 frozen source modules match their audited upstream Git blob identities.
- Screenshots of Home/Square and its home interior were visually inspected. Tablet-sized and compact landscape/portrait layouts were exercised. A render-call guardrail (below 180 in the inspected slice view) passed; this is not a frame-rate or device-memory benchmark.

The final package additionally reruns offline and visual checks after redistribution licenses are included. The artifact record identifies its exact source commit and archive SHA-256.

Final packaging checks: offline and visual/mobile-layout scenarios passed again (2/2). [Town overview](screenshots/slice-overview.png) and [furnished home](screenshots/home-interior.png) preserve the inspected rendered evidence.

Clean-source packaging: two consecutive production builds from commit `1354e3f7cef02613f047657663425794994e4312` produced byte-identical output across all 10 files. The archive passed ZIP CRC verification and every release-manifest SHA-256 check. See ../artifacts/BUILD.json for the exact archive digest and size. It is stored for recovery and review; it is not deployed.

## Environment and limits

Tests ran on Linux Chromium with touch input dispatch and ANGLE SwiftShader, at a primary 1024×600 viewport plus 844×390 and 390×844 layout checks. Node runtime is available in the cloud; dependencies and lockfile are committed. No physical Lenovo, iPhone/Safari/WebKit, actual tablet storage exhaustion/eviction, install prompt, update-across-OS-restart, thermal or sustained mobile FPS result is claimed.

Initial full integration bundle was about 568 kB JavaScript / 157 kB gzip. Vite's 500 kB chunk advisory remains visible; engine/code splitting is future measured optimization. The prototype has no accounts, network gameplay APIs, ads, purchases, unlocks, hostile actors or survival mechanics.

## Remaining release work

This completes the four authorized development stages at prototype scope. Continue R1B hardening before full R1: actual-device profiling, broader typed catalogue/model registry, more meaningful content and richer interactions, traffic/navigation robustness, iPhone backup fallbacks, raster/maskable installation icons, update UI/cache retention policy and long-session recovery tests. No deployment or main merge is authorized by this checkpoint.
