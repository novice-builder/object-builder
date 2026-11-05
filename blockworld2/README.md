# BlockWorld 2.0 development

Isolated development preview with Sunbeam Town, 111 unlimited catalogue entries and four furnishing presets. Existing Neighborhood 06 releases, installed PWA and saves remain protected.

Use Node 22 or newer:

```sh
cd blockworld2
npm ci
npm run check
npm run dev
```

For the built offline app: `npm run build`, then `npm run preview` and open http://localhost:4173. Cache priming requires a successful online load followed by reload. Do not host this package under the installed Neighborhood 06 worker's /object-builder/ scope.

See [Run 1 progress](docs/RUN1.md), [architecture](docs/ARCHITECTURE.md) and [continuation](docs/CONTINUE-RUN2.md). Browser tests use Playwright; install its Chromium or set CHROMIUM_PATH=/usr/bin/chromium when available.

## Current prototype

Run 1 adds a separate Sunbeam Town template with 12 furnished main buildings, three usable garages, four clear building plots and 16 map destinations. Original Home/Square, Blank Creative and Legacy 06 remain selectable, with independent local worlds, recovery checkpoints and portable backups.

Touch building supports rotated previews, object moves, long-press removal and Undo/Redo. The catalogue has model thumbnails, categories/search/pages, favourites, recent choices and a hotbar. First/third-person cameras, creative flight, doors/lights/seats, six residents, four animal species, two traffic cars, a drivable buggy and map travel form the integrated preview. See [catalogue](docs/CATALOGUE.md), [town](docs/SUNBEAM.md), [living world](docs/LIFE.md) and [save recovery](docs/SAVES.md).

The working branch is `codex/blockworld2-r1b-expansion`. A separate test-only Pages publication is authorised, but unavailable in this session because CLI authentication is invalid and the connector lacks repository/Pages administration. **No preview URL has been deployed or verified.** [Publishing instructions](docs/PREVIEW.md) target only `novice-builder/blockworld-2-preview`; main and the existing Pages settings are unchanged.

The Run 1 prebuilt package is `artifacts/run1/blockworld2-run1-preview.zip`. Extract it and serve the resulting folder with `python -m http.server 8080`, then visit http://localhost:8080. Opening index.html through file:// is unsupported. Tablet installation requires HTTPS. The original foundation archive remains in `artifacts/blockworld2-prototype.zip`.

This remains a development preview, below the 190-item/full-town R1 target. Physical Lenovo and Safari/iPhone qualification, sustained performance, richer activities and full intersection simulation remain outstanding. [Run 1 validation](docs/RUN1-QA.md) records executed checks; [foundation history](docs/PROGRESS.md) preserves the earlier results.
