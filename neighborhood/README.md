# BlockWorld Neighborhood 05 — experimental scaling release

**Neighborhood 04 remains the stable playable version.** Its HTML and earlier releases are unchanged. 05 is developed on `codex/neighborhood-05-scale` from the 04 branch.

[Play guide and device checklist](docs/WORLD_05.md) · [Architecture and 04/05 comparison](docs/VERIFICATION_05.md)

The world expands to 500 × 500 metres while retaining the original districts. New west homes, northern village, makers district, lake park, farm, woodland, ponds and meadows are connected by roads/trails. Grown-up settings offer Normal, Quick and Fast walking. 05 uses separate saves with validated imports from 04 and older versions.

```sh
npm ci
npm run build
npm test
npm run test:browser
node test/world-05-saves.mjs
node test/world-05-visual.mjs
node test/world-05-fog.mjs
node test/world-05-performance.mjs
npm run serve
```

Output: `../BlockWorld_Neighborhood_05.html`, a standalone offline file. Browser scripts use Playwright and Chromium; run performance without other browser workloads. Software-renderer measurements do not verify iPhone or Lenovo performance.

Earlier source remains on the versioned branches; guides and evidence for 03/04 remain in `docs/`.
