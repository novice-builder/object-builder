# Little Block Lane — BlockWorld Neighborhood 03

A small first-person creative neighborhood for the first family play test. Four homes, three roof styles, a bending road, your furnished home and crafting table, unlimited common blocks, crafted flowers/lanterns/benches, undo, browser save and JSON backups.

## Current release: Neighborhood 03

The approved neighborhood is preserved, and 01/02 HTML releases remain unchanged. The new `../BlockWorld_Neighborhood_03.html` fixes doors, touch hit areas and real edge protection. Automatic doors and edge protection default ON; climbing is removed. Tap an already selected material to deselect it—there is no permanent Hand slot. The existing hotbar, previews, jumping, Undo and resource behavior remain.

Use the [03 game file on GitHub](https://github.com/novice-builder/object-builder/blob/codex/blockworld-playable-prototype/BlockWorld_Neighborhood_03.html) → **Download raw file**, then open the actual downloaded HTML in your browser. The game includes all runtime code/assets.

See [03 controls and iPhone checklist](docs/CONTROLS_03.md) and [03 bug investigation/results](docs/VERIFICATION_03.md). The 01/02 guides remain historical records.

## Develop and verify

Requires Node 20+ and npm. From this directory:

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run serve
```

`build` recreates only `../BlockWorld_Neighborhood_03.html`. `serve` offers the built HTML at port 8080 on your computer, suitable for a same-Wi-Fi tablet trial. It does not run a backend or store game progress on the server. Stop it with Ctrl+C.

Browser tests use a locally installed Chromium at `/usr/bin/chromium`; override with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. They supply the actual built HTML through a local intercepted document, so no running server is needed. Cloud sandbox execution may need permission for local browser IPC. The current interaction suite writes screenshots/results under `../work/controls-03/verification/`. `test/preview.mjs` is an optional screenshot helper that expects the server running.

## Source map

- `src/core.js`: state, validation, placement, collision, undo; no browser dependencies.
- `src/world.js`: hand-authored map and structures, shared mesh batches, local/world axes.
- `src/main.js`: game loop, input, UI, ray interaction, saves and diagnostics.
- `src/gestures.js`, `src/touch-buttons.js`: camera/tap/hold classification and single-activation UI touches.
- `src/pieces.js`, `src/doors.js`, `src/door-geometry.js`: shared object parts, automatic/manual door state and oriented leaf collision.
- `src/icons.js`, `src/textures.js`, `src/style.css`: original visual assets and layout.
- `src/dialogue.js`, `audio/dialogue.json`: named cue playback and recording script; no speech service.
- `build.mjs`: standalone HTML bundling; `serve.mjs`: optional local preview.
- `docs/TECHNICAL_PLAN.md`: focused audit and decisions.
- `docs/CONTROLS_03.md`, `docs/VERIFICATION_03.md`: current controls, device checklist and verification.
- `docs/TESTING.md`, `docs/VERIFICATION.md`: historical Neighborhood 01 records.

Three.js is included under MIT; see `THIRD_PARTY_LICENSES.txt`. Existing game/editor assets and versioned files have not been replaced. This is a first vertical slice, not a finished Minecraft replacement.
