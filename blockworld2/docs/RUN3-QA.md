# Run 3 validation record

Baseline source: Run 2 410e0f8, recovered on Run 3 checkpoint 5b59718 (documentation-only). Full `npm run check` passed 88 deterministic cases, strict TypeScript, 49 original release/app files, six historical archive files and build. Full browser baseline passed 29/31; the two failures and corrections are recorded in RUN3-SAVES.md. Do not describe the baseline as 31 passing scenarios.

Stage A: nine focused deterministic cases passed; original offline/storage/conflict scenarios passed; final four-scenario recovery/update/resident/avatar run passed after fixes. See RUN3.md for later checkpoint-specific results. Final full-suite and package evidence are appended only after execution.

Environment: Linux Node 24.19.0, Chromium 154.0.8037.57, Playwright touch dispatch and ANGLE SwiftShader; 1024×600 primary, compact landscape/portrait checks. No physical Android/Lenovo, iPhone/Safari/WebKit, measured hardware FPS, thermal/battery, native RAM or real storage-eviction result is claimed.

Stage B: both single-file HTTP scenarios passed for startup/rendering, touch movement/look, catalogue/building, world selection/save/reload and backup download/file-input restore. The local-file scenario is skipped because managed Chromium denies file navigation before startup. It must not be counted as a passing local-file test. See RUN3-DISTRIBUTION.md for the exact distinction.

Initial clean package source b2b11b3, build c99d434e2c63ebda: four package-level browser scenarios passed again. ZIP CRC, exact compiled bytes, release-manifest hashes and embedded source/build identity passed. Initial packages/checksums are retained under artifacts/run3-initial and will not be overwritten by the final gameplay package.

Stage C: three deterministic county cases passed; strict TypeScript/build/preservation passed. Four focused browser scenarios passed in their final runs: county travel/map/bridge/far-save/old-world preservation, county driving/reload/draw-call bound, original Region exploration, original farm greetings/traffic. The initial bridge assertion expected more distance than four seconds of walking provides; corrected to six seconds and passed across both river banks. No runtime defect was hidden by that correction.
