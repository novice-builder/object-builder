# Little Block Lane — BlockWorld Neighborhood 02

A small first-person creative neighborhood for the first family play test. Four homes, three roof styles, a bending road, your furnished home and crafting table, unlimited common blocks, crafted flowers/lanterns/benches, undo, browser save and JSON backups.

## Current release: Neighborhood 02

The approved Neighborhood 01 HTML is preserved. The new `../BlockWorld_Neighborhood_02.html` keeps its visual design and adds a permanent swipeable hotbar, empty hand, direct tap/hold controls, exact furniture previews with rotation/confirmation, independent auto-step and edge protection, and clearer settings/door behavior.

Use the [02 game file on GitHub](https://github.com/novice-builder/object-builder/blob/codex/blockworld-playable-prototype/BlockWorld_Neighborhood_02.html) → **Download raw file**. Open the downloaded HTML in your browser, rather than its source preview. All renderer, game code, icons and generated textures are included. No runtime network is required.

See [Interactions 02: controls and device checklist](docs/INTERACTIONS_02.md) for play instructions, iPhone fullscreen/export limitations, save compatibility and targeted re-testing. The original [01 test guide](docs/TESTING.md) and [01 verification report](docs/VERIFICATION.md) remain as historical records.

## Develop and verify

Requires Node 20+ and npm. From this directory:

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run serve
```

`build` recreates only `../BlockWorld_Neighborhood_02.html`. `serve` offers the built HTML at port 8080 on your computer, suitable for a same-Wi-Fi tablet trial. It does not run a backend or store game progress on the server. Stop it with Ctrl+C.

Browser tests use a locally installed Chromium at `/usr/bin/chromium`; override with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. They supply the actual built HTML through a local intercepted document, so no running server is needed. Cloud sandbox execution may need permission for local browser IPC. The current interaction suite writes screenshots/results under `../work/interactions-02/verification/`. `test/preview.mjs` is an optional screenshot helper that expects the server running.

## Source map

- `src/core.js`: state, validation, placement, collision, undo; no browser dependencies.
- `src/world.js`: hand-authored map and structures, shared mesh batches, local/world axes.
- `src/main.js`: game loop, input, UI, ray interaction, saves and diagnostics.
- `src/gestures.js`, `src/touch-buttons.js`: camera/tap/hold classification and single-activation UI touches.
- `src/pieces.js`, `src/doors.js`: shared preview/final object parts and safe door operations.
- `src/icons.js`, `src/textures.js`, `src/style.css`: original visual assets and layout.
- `src/dialogue.js`, `audio/dialogue.json`: named cue playback and recording script; no speech service.
- `build.mjs`: standalone HTML bundling; `serve.mjs`: optional local preview.
- `docs/TECHNICAL_PLAN.md`: focused audit and decisions.
- `docs/INTERACTIONS_02.md`, `docs/VERIFICATION_02.md`: current controls, device checklist and verification.
- `docs/TESTING.md`, `docs/VERIFICATION.md`: historical Neighborhood 01 records.

Three.js is included under MIT; see `THIRD_PARTY_LICENSES.txt`. Existing game/editor assets and versioned files have not been replaced. This is a first vertical slice, not a finished Minecraft replacement.
