# Little Block Lane — BlockWorld Neighborhood 01

A small first-person creative neighborhood for the first family play test. Four homes, three roof styles, a bending road, your furnished home and crafting table, unlimited common blocks, crafted flowers/lanterns/benches, undo, browser save and JSON backups.

## Play without developer tools

Open the [game file on GitHub](https://github.com/novice-builder/object-builder/blob/codex/blockworld-playable-prototype/BlockWorld_Neighborhood_01.html), then choose **Download raw file** (the down-arrow icon). Open the downloaded HTML in Chrome. The file page itself displays source code; it does not run the game.

Use the separately named `BlockWorld_Neighborhood_01.html` in the repository root. Download the actual file, then open it in a recent browser. The HTML includes its renderer, game code, icons and generated textures. No runtime Internet, account, ads, purchases or audio service is needed. This release contains no voice recordings.

On the Lenovo tablet, try Chrome in landscape. Download the file locally, then use Downloads / Files → Open with Chrome (exact choices depend on the Android version and file manager). If it shows HTML text, it is being previewed rather than executed. See [TESTING.md](docs/TESTING.md) for an alternative local-network test and the offline checklist. Android file handling and actual tablet compatibility still need the owner's test. This is not an APK or installable PWA.

Move with the left stick; drag the world to look; jump with the up-arrow button. Walk toward the teal-roofed cream house and tap the door picture. Inside on the right is the checkered workbench. Tap its table picture and choose a recipe. Tap the hammer to build, choose a picture, aim at a nearby clear space and press +. You can also tap a visible surface to place while Build is active. Minus removes your targeted piece; Undo reverses the last building step. Houses are protected in this prototype.

The home button returns to a safe spot outside your house. Common blocks are unlimited. Crafted pieces have a count, use one when placed and return to inventory when removed. Recipes have no grind or forced tasks. The lantern is a decorative model in this first daylight-only game.

Use the menu to export a save before closing or moving the file. Browser storage depends on browser settings and file/origin location; private browsing or a file manager may not retain it. Import the exported JSON to continue elsewhere. If storage is blocked the game stays playable and says “Export to save”. Building undo keeps up to 50 operations during the current session; it is not saved across reloads.

## Develop and verify

Requires Node 20+ and npm. From this directory:

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run serve
```

`build` recreates only `../BlockWorld_Neighborhood_01.html`. `serve` offers the built HTML at port 8080 on your computer, suitable for a same-Wi-Fi tablet trial. It does not run a backend or store game progress on the server. Stop it with Ctrl+C.

Browser tests use a locally installed Chromium at `/usr/bin/chromium`; override with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. They supply the actual built HTML through a local intercepted document, so no running server is needed. Cloud sandbox execution may need permission for local browser IPC. They write screenshots/results under `../work/verification/`. `test/preview.mjs` is an optional screenshot helper that expects the server running.

## Source map

- `src/core.js`: state, validation, placement, collision, undo; no browser dependencies.
- `src/world.js`: hand-authored map and structures, shared mesh batches, local/world axes.
- `src/main.js`: game loop, input, UI, ray interaction, saves and diagnostics.
- `src/icons.js`, `src/textures.js`, `src/style.css`: original visual assets and layout.
- `src/dialogue.js`, `audio/dialogue.json`: named cue playback and recording script; no speech service.
- `build.mjs`: standalone HTML bundling; `serve.mjs`: optional local preview.
- `docs/TECHNICAL_PLAN.md`: focused audit and decisions.
- `docs/TESTING.md`, `docs/VERIFICATION.md`: testing instructions and observed results.

Three.js is included under MIT; see `THIRD_PARTY_LICENSES.txt`. Existing game/editor assets and versioned files have not been replaced. This is a first vertical slice, not a finished Minecraft replacement.
