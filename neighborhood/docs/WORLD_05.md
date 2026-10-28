# Neighborhood 05 — experimental 500 m world

**Keep Neighborhood 04 as the stable playable version.** 05 is a separate scaling experiment, on `codex/neighborhood-05-scale`, starting from 04 commit `32f47a3bc78f5b39340866a6203c8b34b9278b59`. Neither 04 nor any earlier HTML release is overwritten.

## Download and try

Download `BlockWorld_Neighborhood_05.html` from this branch using GitHub's **Download raw file** button. Keep the `.html` extension. Open it using the same browser/local-HTML method you use for 04. It is one self-contained file: all code, textures, models and icons are included. Start with **Quality: gentle**.

There is no parental question/PIN gate. In the grown-up menu, choose:

| Preset | Ground speed | Behaviour |
| --- | ---: | --- |
| Normal | 3.4 m/s | The existing walking speed. |
| Quick | 5.1 m/s | 1.5× Normal. |
| Fast | 6.8 m/s | 2× Normal. |

The browser remembers the choice when storage is available. Jump height stays the same; horizontal jump travel changes with walking speed. Doors trigger earlier at Quick/Fast to maintain their opening lead time. Manual interaction, collision, the Jump button and edge protection remain available. These preferences belong to this browser/file location, rather than to an exported world save.

**◈ Map** covers the full 500 × 500 m boundary and shows the yellow player position/heading arrow, roads, trails, ponds and landmark pictures. North is at the top. The map pauses play. Scroll its legend if necessary on a short screen. **Home ⌂** returns to the original house. No new teleport system is included.

## Explore

All 04 areas, buildings, roads, entrance paths and collidable scenery remain at the same coordinates. The former perimeter hedge has moved to the new boundary. The new outer districts include:

| New district | Things to discover |
| --- | --- |
| Juniper/Birch residential loop, west | Verandas, a longhouse, bay windows, open carports, attached wings, garages and gardens. |
| Sunbeam village, north | Bakery, village hall, clockmaker's tower, planted square and timber pergola. |
| Makers village, east/northeast | Weavers studio, clay courtyard, long workshop and raised garden beds. |
| Lake park, east | Pond, picnic benches, low jump course and lakeside homes. |
| Red Barn farm, south | Gambrel-roof barns, farm store, farmhouse porch, crop beds and an orchard. |
| Reed pond, southwest | Large shallow pond, shore trail and cabin. |
| Beacon walk, southeast | Tower lodge and a winding connection to the eastern park. |
| Outer woodland and building meadows | Seven authored grove areas and four additional building clearings, connected to the original routes. |

There are **40 enterable primary buildings** (16 retained + 24 new), three ponds, 15 map landmarks, and six designated building clearings in total. Building capacity stays at **12,000 pieces / 24 blocks high**, keeping the performance comparison with 04 meaningful. Building is also permitted in other clear spaces across the world.

The additional architecture uses actual footprint changes, new barn roofs, carports, bay projections, broad porches, chimneys and tower silhouettes. Auxiliary wings/towers/garages are closed scenery; the primary rooms have working doors. Shops are decorative interiors, not a trading system. Water and playground scenery retain the simple 04 behaviour: no swimming, water physics, NPCs or quests were added. Terrain remains level.

## Progress compatibility

05 uses browser key `blockworld.neighborhood.05`, schema **3**, world ID `little-block-world-05`, and preference key `blockworld.neighborhood.controls.v5`.

On first opening at an origin where older progress is accessible, 05 validates and copies 04's save. If there is no 04 save, it can copy the older 01–03 key. It never writes either older key or 04's preferences. The test suite checks that new collidable scenery does not encroach on 04's buildable region.

Different local filenames, browser apps and file viewers may isolate storage. Export a backup from 04 first; if automatic copying is unavailable, import that JSON into 05. All compatible structures are retained. Imported data is completely validated before progress is replaced. Invalid imports leave the current world unchanged.

05 accepts compatible schema-1 and 04 schema-2 exports, plus its own schema-3 exports. A 05 export is intended for 05; earlier games reject its newer schema. **Keep your 04 backup and downloaded file.** Do not overwrite either with a 05 export. Export before moving files, clearing browser data or switching browsers. Existing iPhone share-sheet and backup-text fallbacks remain.

## Physical-device checklist

1. Back up 04. Download/open 05 without replacing it. Confirm copied/imported structures, inventory and furniture rotations.
2. Use the map to visit the west homes, Sunbeam village, Makers village, both new ponds, farm, Beacon walk and an outer building meadow. Check that routes and landmarks are understandable and the districts feel different. Try Home from a far corner.
3. Try all three walking speeds, especially Fast through house doors from both sides and near tight corners. Test manual doors with automatic doors switched off. Jump and use edge protection on an elevated build; try intentional descent.
4. Build in an outer meadow, long-press to remove, Undo, craft a bench at Home, rotate its preview and confirm it. Touch different parts of the new walking-speed buttons.
5. Export a 05 save, close/reopen, restore it, then reopen 04 and confirm its progress remains intact. Try offline/airplane mode after downloading. A file manager's text preview is not the running game.
6. Enable **Performance** and test for 10–15 minutes. Record FPS/p95 at the original Home, old village, old woodland, Sunbeam square, far open meadow and beside your largest build. Record the Lenovo model, browser, screen orientation, Gentle/Crisp choice, pauses, heat and camera responsiveness. Repeat on iPhone if convenient.

Browser automation here uses Linux Chromium with a software GPU, not either target device. Its local `file://` navigation is blocked by managed browser policy; network-disabled document runs and download/import tests are available, while actual device file-opening and offline behaviour remain on your checklist.

## What to decide next

Keep 04 stable while collecting device results. First establish whether 500 m feels pleasant on the Lenovo and iPhone. Then address the measured issue: frame pacing in dense views, synchronous edits to large build chunks, startup time or memory. Streaming/generation changes should follow evidence of a resident-world limit. Another expansion should wait for those results.

[Architecture, automated evidence and paired 04/05 performance report](VERIFICATION_05.md)
