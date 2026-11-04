# BlockWorld 2.0 development checkpoints

Branch: codex/blockworld2-autonomous-foundation
Base: 1ffd35ed971afa7820734cf10a3287ab546f6306
Started: 2026-11-04

This branch is authorized for isolated development under blockworld2/ only. No deployment, merge to main, modification of legacy artifacts, old save keys, navigator, or Pages settings is authorized.

## Checkpoint 0 — remote persistence established

A dedicated branch and this checkpoint are stored through the connected GitHub API before substantial implementation. Each stage will record executed checks and limitations, and its remote commit will be independently fetched before continuing.

## Planned stages

1. TypeScript/Three.js/Vite foundation, reproducible build and preservation tests.
2. Proven movement, touch, doors and build mechanics migrated with regression coverage.
3. Multi-world IndexedDB persistence, checkpoints, backups and legacy compatibility infrastructure.
4. Integrated Home/Square prototype, only after earlier gates pass.

This is an implementation programme, not a claim that any stage is complete.

## Stage 1 — foundation complete

Implemented pinned TypeScript 5.9.3, Vite 6.4.1 and Three.js 0.160.1 infrastructure, a bounded fixed-step loop, renderer bootstrap, architecture boundaries, isolated manifest/cache generation and source/lockfile provenance. Runtime/build dependencies are locked. No deployment workflows were added.

Executed: `npm run check` (2 deterministic tests passed, TypeScript passed, 49 original repository files byte-identical, production build passed); `npm run test:browser` (1 Chromium touch-capable smoke test passed; no page errors or legacy save-key access). Physical devices and full PWA install/update behavior are not yet qualified. The built app is an architecture foundation, not the mechanical prototype.

## Stage 2 — mechanical prototype

Migrated frozen 06 modules and retained all 41 upstream deterministic cases. New TypeScript layers provide movement/touch routing, first-person camera, automatic/manual door controls, build picking with oriented occlusion, unlimited materials/decorations, rotated previews, removal and 100-command undo/redo. The prototype uses the actual 06 environment; no old save keys are read.

Executed: TypeScript passed; 46 deterministic tests passed (41 retained + 5 new); build passed with all 49 original files byte-identical. Four browser scenarios passed for legacy-key preservation, real touch placement/rotation/undo/redo, drag/cancel, and ledges/door approach. Additional provenance and long-press checks are recorded with the checkpoint once run. These are desktop Chromium tests, not physical Android/iOS qualification.

Limitations: session-only progress at this checkpoint; world selection and persistent instances are Stage 3. Stage 4 cameras, flight and ambient activity are not yet implemented. Production bundle is about 539 kB before gzip / 147 kB gzip; Vite's 500 kB advisory is recorded, not suppressed.

Additional executed checks: frozen-source provenance test passed; real Chromium long-press removal/release suppression/Undo scenario passed. Stage 2 checkpoint therefore has 47 deterministic cases verified and five browser scenarios verified across the two browser runs.

## Stage 3 — world/save architecture complete

Implemented independent instances, create/select/resume/rename/duplicate, transactional IndexedDB writes with revision conflict protection, three previous checkpoints, corruption recovery without overwriting damaged records, portable backup download/file-input import, legacy schemas 1–4 adapter/raw-source retention and separate player/world/preferences payloads. World geometry is validated before scene replacement. Occupied Home arrivals resolve to clear ground.

Executed against this stage: TypeScript and production build passed; preservation check passed for 49 original files; 7 focused deterministic storage/arrival tests passed; all 9 browser scenarios passed. Browser scenarios include switching/reload, rename/duplicate, real backup download/import, invalid import, conflicting tabs/save-copy, and a closed-storage failure with unsaved-build export. A premature asynchronous UI assertion was corrected to wait for the rendered result, then the full browser suite passed.

The 47 Stage 2 deterministic checks plus 7 new storage/arrival cases have been run (54 total cases across the staged runs). No physical Lenovo, Safari/WebKit, real disk-full or storage eviction result is claimed. See SAVES.md for remaining recovery/installation limitations.

## Stage 4 — integrated slice implemented; final regression in progress

Implemented original Home/Square with four furnished buildings and a usable garage, first/third-person cameras, camera obstruction, creative flight, scalable category-grid catalogue (seven unlimited entries), four pedestrians, two animals, two traffic cars, one drivable buggy, drag/zoom/landmark map travel and saved camera/vehicle state. The full R1 content release is not claimed.

Initial executed checks: TypeScript/build/preservation passed; four new deterministic flight/camera/interior/vehicle tests passed; four new browser scenarios passed for integrated modes/catalogue, driving/save/reload, ambient movement/map dragging, and a cold offline tab restoring a saved build while retaining a sentinel legacy cache. No-op save deduplication was corrected and regression-tested. Final full regression and visual review follow in the next checkpoint.
