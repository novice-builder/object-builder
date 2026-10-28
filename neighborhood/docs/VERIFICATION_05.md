# Neighborhood 05 — scaling and verification

05 is an experimental release. **Neighborhood 04 stays available as the stable playable version**, and 03 remains the earlier approved core baseline. All 48 earlier root HTML files are preserved byte for byte; see `verification-05/preservation.json`.

## World and compatibility

The shared configuration changes the half extent from 125 to 250 metres. Visible ground, picking ground, physics/build/save limits, boundary hedges and map scale derive from it. Height (24 blocks), piece capacity (12,000), view distance, materials, lighting, quality presets and normal walking speed remain aligned with 04 for comparison.

The original 16 building definitions, two roads, six trails and entrance paths are unchanged. The old vegetation generator retains its original exclusions and RNG sequence; the outer vegetation uses a separate seed and authored grove locations. A captured fixture from 04 commit `32f47a3...` verifies every earlier collidable solid except the intentionally enlarged floor. Another assertion rejects any new solid that encroaches on the old buildable region. Older structures can therefore migrate without scenery being regenerated over them.

Twenty-four new lots form the outer districts. Generation uses four roof forms including new gambrel barns, attached service wings, carports, bay projections, chimneys and towers. Layout tests check primary building separation from roads/trails and body clearance along every entrance walkway; an additional footprint audit covers garages, wings, towers and bay projections. Authored routes form one connected network. Screenshots include a complete orthographic top-down survey and views from the districts. The survey temporarily disables fog solely for inspection; the gameplay camera is unchanged.

Schema 3 / `little-block-world-05` / separate 05 storage identifiers protect older progress. Compatible schema-1 and 04 schema-2 imports have their block coordinates validated against their original limits and are copied. All validation completes before replacing active state. Export/import/reopen tests use real browser downloads and file-input imports, including 12,000 pieces, outer coordinates, invalid data and unchanged 03/04 keys/settings.

## Movement safety

Walking presets select 3.4 / 5.1 / 6.8 m/s; invalid values fall back to Normal. The physics substep remains at most 12 ms, giving at most 8.16 cm horizontal travel per step at Fast, below the player's 28 cm half width. Tests cover normalized diagonals, thin walls, edge guard, jump height and landing across high/low frame rates. Jump strength and auto-climb remain unchanged from 04; auto-climb is absent.

Automatic opening distance scales with the selected speed, maintaining approximately the same time to the doorway. Hold distance remains outside the opening radius. The existing animated swing, full obstruction sweeps, oriented leaf collision, closing delay, occupancy protection and manual interaction are retained. Normal uses the former distances. Pure and browser tests exercise all 40 doors from both sides; Fast entry/exit and closed-leaf collision are included.

## Architecture and the measured optimisation

The existing 24 m static geometry batches, vertex colours, spatial collision indices, exposed-face player-block meshing, local edit rebuilding and instanced crafted parts remain. All world geometry and collision data stay resident. No new LOD, asset streaming or chunk generation system was introduced.

An initial paired profile showed unnecessary draw calls from scenery wholly beyond the opaque end of the existing fog. A conservative visibility check now omits a static chunk only when its entire bounding sphere is past the fog's view-space depth, with an extra 10 cm margin. It uses camera depth, not radial distance, matching Three.js fog. Partially fogged geometry keeps full detail. Moving doors, player pieces, physics and save data are unaffected.

The optimisation is small and is supported by measurements: the Home audit reduced 72 calls / 25,411 triangles to 53 calls / 19,665 triangles. Six representative viewpoints produced **identical PNG pixels** with this culling enabled and disabled. This does not establish physical-device visual approval. The before-optimisation performance report is retained with its distinct artifact hash, and the final release receives a separate paired comparison.

The resident-world model is still practical to investigate at this scale. Identified future pressure points are startup geometry construction, retained buffers/canvas textures, static scene traversal, and synchronous meshing of a densely populated player-build chunk. A larger map alone does not show which of these needs streaming. Additional geometry visible beyond the former boundary also makes some matched views more expensive; these are not dimension-only benchmarks.

## Measurements and test evidence

[Final results, performance tables and screenshots](verification-05/SUMMARY.md)

The comparison uses the unchanged 04 HTML and final 05 HTML in the same Chromium/ANGLE SwiftShader environment, 800 × 600 CSS pixels, DPR 1, Gentle quality and Normal walking. A warm-up precedes balanced **04 → 05 → 05 → 04** runs. Every shared view settles for 1.2 seconds, then records five seconds of raw frame intervals. The report pools two runs per version for FPS and p95. New outer destinations are measured separately because equivalent 04 coordinates are outside its playable area.

Identical fixtures measure ordinary placement/removal/Undo and a 12,000-piece dense build in the retained meadow. Operation times are browser CPU elapsed times, not physical finger-to-display latency. Dense editing verifies that the other populated chunk keeps its mesh identity. Reports include draw calls, submitted triangles, first frame/document-to-ready, geometry/texture counters and JavaScript heap where available. Heap is not total browser or GPU memory; GPU memory is unavailable here.

The mobile UI checks use real touch delivery across four viewports, including DPR 3 and a scaled settings container. Point probes isolate hit delivery; separate end-to-end cases execute movement, doors, crafting, placement, long-press removal, Undo, preview rotation and map/settings actions. Bulk door cases use the actual runtime controller with simulated time/poses; they are not physical-device walks. The contextual door button also receives a real touch and a metadata-free compatibility click.

No iPhone/Lenovo performance, sustained thermal behaviour or user visual approval is claimed. Short software-renderer samples contain scheduling/GC noise and do not predict tablet FPS. Managed Chromium rejects `file://` navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`; policy was not altered. The same standalone HTML runs through an intercepted document route with network disabled and no external runtime assets, and the actual device/local-file test remains outstanding.

## Reproduce

From `neighborhood/`:

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

Run performance alone, after closing other browser tests. Scripts require Playwright and `/usr/bin/chromium` (or `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`). Scratch captures/results go into ignored `work/world-05/`; the committed evidence records the release hashes.

[Device play guide and testing checklist](WORLD_05.md)
