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
