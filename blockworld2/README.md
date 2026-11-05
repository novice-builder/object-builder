# BlockWorld 2.0 development preview

Run 3 is developed on `codex/blockworld2-run3-expansion`. It contains 196 unlimited catalogue items, 12 atomic presets, 12 avatar appearances, independent saved worlds and the new Sunbeam County. The county develops 462 × 444.5 m inside the 500 m ground: 38 main buildings, ten road garages and an aircraft hangar, 14 plots, 61 fixed destinations, a 1,584 m signed trail and connected country roads. Earlier world templates/layouts and player constructions remain intact.

Play includes touch movement/building/Undo/Redo, first/third-person cameras, creative flight, doors/lights/furniture/playground activities, 16 residents, eight animal species, horse riding, companion Follow/Stay/Home, buggy/runabout/bicycle driving, map travel and a boardable aircraft's guided passenger tour. The aircraft activity is not piloting. All content is immediately available; there are no costs, ads, locked items or survival/combat mechanics.

Use Node 22 or newer:

```sh
cd blockworld2
npm ci
npm run check
npm run dev
```

`npm run build` creates the website/PWA in `dist/` and the same-codebase standalone HTML in `standalone/`. `npm run preview` serves the production build at http://localhost:4173. Browser tests use Playwright and Chromium (`CHROMIUM_PATH=/usr/bin/chromium` where installed). The PWA shows offline readiness after caching. Keep portable backups; storage failures block unsafe updates and offer export/recovery.

Downloadable initial Run 3 packages are retained in [artifacts/run3-initial](artifacts/run3-initial); final gameplay packages use a separate [artifacts/run3](artifacts/run3) folder. Read [distribution and standalone limitations](docs/RUN3-DISTRIBUTION.md). Managed Chromium blocks file navigation, so local-file persistence/device compatibility is unverified; the single HTML is tested alone under an HTTP origin. Future tablet PWA installation needs suitable HTTPS hosting outside Neighborhood 06's worker scope. **Nothing is deployed or published during Run 3.** Main, prior releases, original service workers, old archives and website configuration remain protected.

See [Run 3 progress](docs/RUN3.md), [QA](docs/RUN3-QA.md), [county](docs/RUN3-COUNTY.md), [riding](docs/RUN3-RIDING.md), [companions](docs/RUN3-COMPANIONS.md), [vehicles](docs/RUN3-VEHICLES.md), [airfield](docs/RUN3-AIRFIELD.md), [save reliability](docs/RUN3-SAVES.md) and [continuation](docs/CONTINUE-RUN3.md). Physical Lenovo Android, iPhone/Safari, sustained hardware performance and local-file launch/storage qualification remain outstanding. Foundation/Run 1 documentation and packages retain their historical results.
