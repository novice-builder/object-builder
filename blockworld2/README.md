# BlockWorld 2.0 development

Isolated, unpublished development package. Existing games and storage are protected.

Use Node 22 or newer:

```sh
cd blockworld2
npm ci
npm run check
npm run dev
```

For the built offline app: `npm run build`, then `npm run preview` and open http://localhost:4173. Cache priming requires a successful online load followed by reload. Do not host this package under the installed Neighborhood 06 worker's /object-builder/ scope. No deployment is authorized.

See docs/ARCHITECTURE.md and docs/PROGRESS.md for boundaries, verified checkpoints and limitations. Browser tests use Playwright; install its Chromium or set CHROMIUM_PATH=/usr/bin/chromium when available.

## Current prototype

Stages 1–4 are implemented as a development prototype: Home/Square, Blank Creative and Legacy 06 instances; safe local saves/backups; touch building and doors; both cameras and flight; basic residents/animals/traffic; a drivable buggy and map travel. See [controls and limitations](docs/SLICE.md), [save recovery](docs/SAVES.md) and [validation evidence](docs/QA.md).

The catalogue has seven unlimited entries; this is not the 190-item/full-town R1 release. Physical Lenovo and iPhone/Safari qualification remains outstanding. The branch is `codex/blockworld2-autonomous-foundation`; nothing is deployed or merged into main.

The final `artifacts/blockworld2-prototype.zip` contains a prebuilt static bundle for local review. Extract it and serve its contents over localhost HTTP (for example `python -m http.server 8080` inside the extracted folder), then visit http://localhost:8080. Opening index.html through file:// is unsupported. A tablet PWA installation requires a suitable HTTPS origin; publishing is intentionally not performed in this task. Never put this build under the installed 06 worker's /object-builder/ scope.
