# Run 3 validation record

Baseline source: Run 2 410e0f8, recovered on Run 3 checkpoint 5b59718 (documentation-only). Full `npm run check` passed 88 deterministic cases, strict TypeScript, 49 original release/app files, six historical archive files and build. Full browser baseline passed 29/31; the two failures and corrections are recorded in RUN3-SAVES.md. Do not describe the baseline as 31 passing scenarios.

Stage A: nine focused deterministic cases passed; original offline/storage/conflict scenarios passed; final four-scenario recovery/update/resident/avatar run passed after fixes. See RUN3.md for later checkpoint-specific results. Final full-suite and package evidence are appended only after execution.

Environment: Linux Node 24.19.0, Chromium 154.0.8037.57, Playwright touch dispatch and ANGLE SwiftShader; 1024×600 primary, compact landscape/portrait checks. No physical Android/Lenovo, iPhone/Safari/WebKit, measured hardware FPS, thermal/battery, native RAM or real storage-eviction result is claimed.

Stage B: both single-file HTTP scenarios passed for startup/rendering, touch movement/look, catalogue/building, world selection/save/reload and backup download/file-input restore. The local-file scenario is skipped because managed Chromium denies file navigation before startup. It must not be counted as a passing local-file test. See RUN3-DISTRIBUTION.md for the exact distinction.

Initial clean package source b2b11b3, build c99d434e2c63ebda: four package-level browser scenarios passed again. ZIP CRC, exact compiled bytes, release-manifest hashes and embedded source/build identity passed. Initial packages/checksums are retained under artifacts/run3-initial and will not be overwritten by the final gameplay package.

Stage C: three deterministic county cases passed; strict TypeScript/build/preservation passed. Four focused browser scenarios passed in their final runs: county travel/map/bridge/far-save/old-world preservation, county driving/reload/draw-call bound, original Region exploration, original farm greetings/traffic. The initial bridge assertion expected more distance than four seconds of walking provides; corrected to six seconds and passed across both river banks. No runtime defect was hidden by that correction.

Stage D: four riding deterministic cases passed (plus six catalogue and three county cases during integration); production/type/preservation checks passed. Final touch riding scenario passed, covering the genuine entrance, extended travel, first/third-person presentation, reload and safe dismount/Home. County driving regression also passed. Initial riding browser run correctly failed on the obstructing hitching rail; corrected in versioned County layout 2, with a new deterministic entrance regression. No physical-device result claimed.

Stage E companions: nine focused deterministic cases passed, including two new companion cases, three original life cases and four riding cases. Final companion and riding touch-browser scenarios passed. Build, strict TypeScript and protected-file/archive checks passed. The initial deterministic detour test found an unreachable player-centre destination; the corrected follow point leaves standing space and passes the real obstruction test.

Stage E fleet: eight deterministic cases passed (two fleet, two companion, four riding). Four actual touch-browser scenarios passed: new car/bicycle entry/drive/reload/exit, county buggy driving, dog controls and horse riding. TypeScript, protected-file/archive validation and production website/standalone builds passed.

Stage F: eight deterministic cases passed (five aircraft, three county). Both actual airport doorways, aircraft-span hangar clearance, boarding ramp/aisle/exit, a complete 94-second guided tour, route-blocking recovery and atomic blocked-arrival preservation are covered. Five initial browser scenarios passed; after the outside-camera/rest-stop refinement the final airport, old County layout and county-driving browser scenarios passed. TypeScript/build/preservation passed. Screenshot retained at screenshots/run3/scenic-flight.png. No aircraft-piloting or physical-device claim.

## Final source validation

`npm run check` passed all **107 deterministic cases**, strict TypeScript, the protected 49 original files/six historical archive files, production Vite/release generation and same-codebase standalone generation. Twenty frozen mechanical modules also pass the provenance regressions. Raw execution: qa/run3/full-check.txt.

All **42 executable browser scenarios passed** across the full run and one corrected-fixture rerun. The full invocation ran 43: 41 passed, one file-policy skip, one new Redo-fixture failure. That fixture mistakenly performed a removal, producing Undo history, while asserting Redo history; corrected to Undo a placement. The same built game then passed the entire airport/boarding/history-guard/flight/reload/exit scenario. No runtime fix was needed for that failure. Raw full and corrected results are retained at qa/run3/full-browser-initial.txt and corrected-airfield.txt. Do not describe the initial full invocation as all green; the resolved coverage is 42 passed/one explicit skip.

The final passenger history guard disables Undo/Redo buttons and keyboard actions until landing. This closes an editing path that could restore a construction into the temporarily empty parking space and make reload conflict with the parked aircraft. The guard was present in the full regression build and verified by the corrected browser case. Other touch/door/collision, avatar/indoor camera, row/prefab/move/long-press/history, county travel, mounted/vehicle interactions, recovery, real backup download/import, independent switching, stale-tab conflict, original cache retention, worker update gating, cold offline and standalone HTTP scenarios passed.

GitHub independently confirmed unchanged main (1ffd35e), foundation (fefc37a), Run 1 (645dd90) and Run 2 (410e0f8) branch heads. Original package checks passed and Run 3 initial artifacts have no diff from 296333e. Final clean reproducibility/package evidence is appended after execution. No live publication was attempted.
