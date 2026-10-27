# BlockWorld: first playable neighborhood

## Goal and decision

Make a small game enjoyable on the Lenovo Android tablet before investing in editors or city generation. Milestone 1 is an isolated Three.js game, released as `BlockWorld_Neighborhood_01.html`. All old HTML files and the navigator stay intact. Development branch: `codex/blockworld-playable-prototype`, based on `origin/main` at `69edd88a5f073f01ae0c1cea04c3ee7b86f7cee5`.

The attached project brief was read in full as project context. Its preferences for 10 cm geometry, optional learning, companions, advanced editors and voice production are not prerequisites. The user's current request governs scope. No existing release has been replaced.

## Focused source audit

This is a source inspection, not a claim that every historic experiment was run or passed tablet testing. The repository has standalone experiments and no existing automated test suite or package manifest.

| Experiment inspected | Strongest reusable part | Decision for first game |
| --- | --- | --- |
| PlayLab 1 | Camera-relative walking, custom AABB collision, jumping, pointer-captured joystick, door hinge, benchmark overlay | Use the simple game-loop approach; omit test arena, physics toggles and movable-box simulation. |
| Playable City v5 origin-chunk test | Ray-hit placement, block validity, greedy voxel meshes, chunk editing, instancing | Keep ray/grid interaction and instancing concepts; avoid city/chunk coupling and wholesale voxel destruction. |
| Terrain Walk v8 / OSM Terrain Explorer v7 | Consistent walking camera, touch joystick, `ribbon` road geometry | Adapt road ribbon algorithm; use compact hand-authored map without OSM, DEM imports or terrain streaming. |
| Procedural Town v10 | Road-aligned scenery, warm low-poly palette, deterministic generation | Reuse road/palette approach; hand-author four houses and their driveway alignment to constrain bad geometry. |
| Builder v17.96 and Workshop 03 | AABB overlap, custom piece/material definitions, snapshots, undo; batched meshlets | Adapt overlap and history patterns into a small tested state model. Do not import hundreds of kilobytes of editor controls and shared storage behavior. |
| House Studio v3 / Auto House Generator v2 | Explicit openings, wall spans, fitted roof surfaces, preview validation | Use explicit parametric wall spans and roof surfaces, with geometry tests and screenshots. No drawing editor or photo tracing dependency. |
| Adaptive Mesh Chunking v1 | Camera-relative non-inverted joystick formula, shared geometry, active-set diagnostics | Adapt movement formula and diagnostics. No adaptive hierarchy for a 64 m neighborhood. |

Existing prototypes load Three.js 0.160.x from a CDN. The new source pins 0.160.1 and bundles it into the release, so runtime does not need a CDN. Reuse means selected algorithms and patterns reimplemented in small modules; this is not a merge of complete historic games. Their old controls, loaders and editor behaviors remain experimental and unchanged.

## Representation and trade-offs

- **Building:** 1 m cells with four unlimited common materials. Crafted flowers, lanterns and benches are detailed meshes occupying one cell; geometry need not fill it. This provides fast placement and a path toward custom pieces later.
- **Fixed world:** metre-scaled freeform meshes, thin walls, door/window openings, three roof forms, four color/layout combinations, a bending road and aligned drives. Doors inherit the wall's transform and hinge around vertical Y. Homes are protected from deletion in this first trial; placed pieces can be removed and undone.
- **Compared alternatives:** 10 cm voxels multiply editing operations and storage without improving the immediate play loop. A complete greedy/chunk voxel engine is useful for larger editable terrain, but adds rebuild and material complexity here. A wholly freeform editor makes touch placement harder. The hybrid gives simple controls with believable houses.
- **Collision:** small fixed substeps, axis-separated player AABB, explicit static wall/table/door boxes and 1 m cells for player pieces. No rigid-body engine. Decorative pieces conservatively collide as whole cells; roof undersides are flat collision ceilings. No sloped terrain or vehicles in this trial.
- **Rendering:** shared box geometry and instanced batches per material, four 64×64 procedural block textures, no shadow maps, DPR capped at 1 by default (optional 1.5). 800 placed-piece limit. One small neighborhood needs neither distance LOD nor chunk streaming. Reconsider only after actual tablet measurements.
- **Persistence:** versioned, validated game-only JSON, isolated browser storage key, autosave, import/export, and bounded building undo. Browser/file storage is best effort; exported JSON is the portable backup. A local HTML package is the first delivery, not an APK or a tested Android installation flow.
- **Audio:** named cue interface, 13 friendly script lines, optional subtitles and replay, silent fallback. No synthetic speech, purchased service, downloaded voice, or recordings in this release. Approved offline recordings are a later asset task.

## Implementation stages

1. **This milestone:** four small houses, furnished player home, road/trees, walk/look/jump, open/close doors, joystick/touch UI, place/remove/undo, palette and three illustrated crafting recipes, autosave/export/import, diagnostics, offline bundle, tests and multiple-angle screenshots.
2. **Next, after device feedback:** fix controls/performance first; add one friendly companion with a few home/role-play interactions, then quick optional gathering and gamepad controls. Keep unlimited common construction.
3. **Presentation:** owner-approved licensed/family voice files, optional learning gifts with hints and no penalty, starter building ideas and more architectural variety.
4. **Only after sustained play:** larger maps, custom-piece/editor imports, terrain editing, vehicles or adaptive chunking if measured bottlenecks justify them.

Do not lock the long-term engine choice until the Lenovo trial. Evaluate comfortable control size, camera speed, ability to enter home/craft without reading, perceived building freedom, visual coherence, cold start, frame pacing, heat and save reliability.
