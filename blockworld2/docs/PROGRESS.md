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
