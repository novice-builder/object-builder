# Neighborhood 04 — architecture and verification

## Scope and preservation

New standalone release: `BlockWorld_Neighborhood_04.html`. Development branch: `codex/neighborhood-04-world`. The prior development branch remains at Neighborhood 03; local rollback branch `codex/neighborhood-03-stable` points to its final commit. All pre-existing root HTML files are preserved. The 03 baseline SHA-256 is recorded in `verification-04/baseline.sha256`.

The map is the only new navigation control. Approved touch gestures, button activation, automatic/manual door state machine, edge guard, jumping, crafting, furniture preview, hotbar and undo behaviour remain. Auto-climb remains absent. No NPCs, resources, quests or education systems were added.

## Scale audit and implementation

| Former assumption | 04 implementation |
| --- | --- |
| ±31 m physics/build/save coordinates | Shared `WORLD` configuration: ±125 m; all movement, validation, ground picking, boundaries, camera, fog and map derive from it. |
| 800 pieces, ten levels | 12,000 pieces, 24 levels. Legacy imports still enforce their original 800-piece/ten-level limits. |
| 64 m ray-picking ground | 250 m ground plane; placement reach remains the approved 6 m, independently of world size. |
| One large render batch per colour | Static geometry merged into spatial chunks with shared vertex-colour material; ordinary frustum culling. Full geometric detail stays resident. No LOD substitution or streaming. |
| Scan every solid for movement | Spatial broadphase for fixed scenery and player pieces, followed by the same precise collision/OBB tests. A nearby candidate list covers each bounded physics step. The large floor uses a global bucket. |
| Reconstruct all block meshes on edits | `BuildChunks` replaces the touched 24 m chunk, plus a neighbouring chunk only for boundary edits. Other chunks retain their mesh identities. Common blocks merge exposed textured faces by material, omitting fully hidden faces between opaque cubes. Crafted model parts are instanced by colour within each chunk. Preview and final crafted geometry still use the same PARTS data. |
| Rebuild all colliders when a door moves | Static/player indices persist; nearby door colliders are read from their current animated transforms. Door obstruction sweeps receive nearby indexed candidates and retain their exact narrowphase/animation logic. |
| Pairwise imported-block overlap checks | Indexed local overlap queries; strict validation before state replacement. |
| One shared save key/schema | Separate 04 key, schema 2 plus world ID; schema-1 imports are copied after validation. No writes to 03 storage. |
| 250 KB import ceiling | Configured 4 MB ceiling, enough for formatted exports at the new capacity. |

The authored world has 16 enterable buildings, two road ribbons with connected intersections, six trail networks, two large clearings, pond, park and orchard. Static ground/props/roofs/tree geometry is approximately 40,310 triangles in 141 chunks in the Node geometry audit; browser-only sign textures are separate meshes. Automatic door leaves stay separate moving meshes. The scene is small enough to keep resident; streaming complexity was not justified at this milestone.

Builds use shared geometry and textures. Furniture instancing also preserves object identity for picking, and its instance transform is applied to hit normals before adjacent placement. UI and gesture handling is retained from 03.

## Failures caught during development

- The first placement of the eastern workshop overlapped a curved road shoulder. Footprint/road tests caught it; the workshop was moved to a clear lot.
- A nature trail crossed the retreat and another crossed a house. Those routes were re-authored and are tested against all building footprints.
- Direct diagonal entrance paths clipped porch posts or a jamb in three new buildings. Paths now leave the doorway straight for 2.5 m before turning; player-body samples along every front walkway must clear fixed scenery.
- An initial spatial-query callback accidentally passed array indices into `doorBox`'s optional open-state argument. Browser passage testing caught an open door remaining collidable. Explicit callbacks now use each door's actual animated state. All inside/outside passage checks are repeated on the final build.
- At 800 × 600 the inherited furniture preview panel overlapped the action row. A tablet-specific CSS rule reserves the actual action-row height plus a gap; touch coordinates and hit detection are unchanged.
- The first dense-build profile drew hidden cube faces: 147,920 submitted triangles in that view. Exposed-face chunk meshing reduced the final view to 10,246 triangles without dropping any saved blocks or visible detail.
- The old file-size ceiling would have rejected larger 04 exports. The real large-file import/export test covers the replacement limit.

## Reproduce locally

From `neighborhood/`:

```sh
npm ci
npm run build
npm test
npm run test:browser
node test/world-04-saves.mjs
node test/world-04-performance.mjs
npm run serve
```

Browser scripts require `/usr/bin/chromium` and Playwright. They use a software GPU in this environment. `serve` serves the standalone HTML at port 8080; it is not a runtime dependency of the downloaded game. Keep the HTML filename unchanged when returning to saved local-file progress.

## Automated checks

Final results, artifact hashes, screenshots and performance measurements are recorded in `verification-04/`. See the generated `SUMMARY.md` there for exact counts and measurements.

Deterministic checks cover the retained core controls; all 16 doors in both directions; swing obstruction and closed-door collision; supported platform seams, jumping, edge protection and no climbing; geometry, placement/history/save validation; 250 m bounds; footprint/road/trail and walkway clearance; connected paths; spatial-vs-exhaustive collision results; large validation; distant-chunk identity; and preview-versus-instanced-furniture bounds/picking at fine rotations.

Mobile browser checks cover genuine touch input at centres, edges and rounded-corner interiors across portrait, landscape, scaled menus and a tablet viewport, plus actual end-to-end actions. The point-grid probes isolate delivery by intercepting actions after touch delivery; separate end-to-end cases execute the actions, including all automatic/manual doors, closed-door obstruction, platform/jump behaviour, hotbar, placement/removal/undo and crafting/rotation. The map is opened, drawn and closed by touch.

Save checks use a real browser download, a real file-input import of 12,000 pieces, reloads, older imports, rejection without mutation, preservation of the older key, and an attempted offline `file://` run. The managed Chromium browser rejected local-file navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`; its policy was not changed. File-protocol execution therefore remains a device test, while the same single-file HTML was exercised with network disabled through a local intercepted document route.

## Interpretation and limits

Automated browsers emulate touch and viewport sizes, not a Lenovo or iPhone GPU, thermal behaviour, Safari event system or local-file wrapper. SwiftShader numbers describe this Linux software renderer only. They cannot establish tablet FPS or visual approval. Heap readings are JavaScript heap indicators, not GPU memory. Five-second performance samples are short, unthrottled synthetic observations, not a sustained-device benchmark.

The world is intentionally level, with shallow decorative water and fixed playground scenery. Shops have decorative interiors, not a trading system. No device approval is claimed for 04; 03 remains the approved rollback baseline. Test the actual tablet using `WORLD_04.md` before choosing a further expansion or optimisation target.
