# BlockWorld Neighborhood 06 — a fuller town

06 retains the 500 × 500 m world and builds coherent Linden, Willow and Elm residential streets, frontage lots, accessible side rooms and garages, six stair-equipped residences, Magnolia manor and landscaped parks. A cached circular minimap opens the full map; contextual actions sit beside the gameplay controls. Standard Xbox-style browser gamepad input complements touch, mouse and keyboard.

[Play guide and tablet checklist](docs/WORLD_06.md) · [Architecture and defects](docs/VERIFICATION_06.md) · [Measured comparison and screenshots](docs/verification-06/SUMMARY.md)

Earlier standalone releases are unchanged. **04 remains the stable playable version; 03 is the approved core baseline.** 05 and 06 remain separate candidates until device feedback. Source history is retained on each release branch.

```sh
npm ci
npm run build
npm test
npm run test:browser
node test/world-06-features.mjs
node test/world-06-saves.mjs
node test/world-06-compatibility.mjs
node test/world-06-visual.mjs
node test/world-06-fog.mjs
node test/world-06-performance.mjs
node test/world-06-motion.mjs
npm run serve
```

Output: `../BlockWorld_Neighborhood_06.html`. No network assets are required during play. Browser scripts use Playwright and Chromium. Run performance by itself; measurements on this Linux software renderer do not verify physical iPhone, Lenovo or Xbox controller performance.
