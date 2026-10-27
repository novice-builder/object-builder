# BlockWorld Neighborhood 04

A standalone offline exploration/building game. **Neighborhood 03 remains the user-approved stable gameplay baseline and is unchanged.**

[Download / play instructions and tablet checklist](docs/WORLD_04.md) · [Architecture and verification](docs/VERIFICATION_04.md)

The 250 × 250 m world contains the original lane, a varied residential loop, village square, play park, woodland pond, building meadows and orchard. Approved 03 controls are retained. 04 progress is versioned separately and older saves can be copied/imported.

```sh
npm ci
npm run build
npm test
npm run test:browser
node test/world-04-saves.mjs
node test/world-04-performance.mjs
npm run serve
```

Build output: `../BlockWorld_Neighborhood_04.html`; no external runtime assets. Browser scripts use Playwright and `/usr/bin/chromium`. Automated results do not establish real Lenovo/iPhone performance.

Earlier instructions/evidence remain in `docs/CONTROLS_03.md`, `docs/VERIFICATION_03.md` and the versioned verification directories.
