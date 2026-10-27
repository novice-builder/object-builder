# Neighborhood 04 — exploration release

Neighborhood 03 is the user-approved stable gameplay baseline. Its standalone HTML is unchanged. This version expands the world while keeping the approved controls. Treat 04 as a new test release pending tablet feedback.

## Try it

Download **BlockWorld_Neighborhood_04.html** from this branch using GitHub's **Download raw file** button. Keep the `.html` extension. Open the downloaded file in the same browser you normally use for the game; the game contains its scripts, textures and icons and needs no network connection. A file manager's text preview is not the game: choose a browser that can execute local HTML.

Start with **Quality: gentle**. The controls are the same as 03. The additional **◈ map** button is beside Home. The map pauses play, shows a yellow position/heading arrow and labelled landmark pictures, and closes with ×. North is at the top. **Home ⌂** still returns you to the original house without deleting builds.

## Places to discover

The playable boundary is 250 × 250 metres, about 16 times the old playable area. Roads and trails form one connected network.

| Area | What to look for |
| --- | --- |
| Original lane | Your familiar home, crafting table and three original neighbours remain in their original positions. |
| Residential loop to the west/northwest | Six additional houses with different footprints, roofs, broad porches, side windows, attached garages and gardens. |
| Village square to the northeast | Bakery, market, pottery shop and workshop; striped awnings, fitted signs, shelves, a clock marker and seats. |
| Play park to the southeast | Sand area, fixed swings, play shelter and low platforms to jump between. |
| Willow pond to the north | Shallow pond, stepping stones, reeds, benches and a small retreat. |
| Woodland walk to the northwest | Denser mixed broadleaf/conifer grove and a winding trail. |
| Building meadows to the southwest/south | Two clearings, 44 × 32 m and 27 × 27 m. Building also works in other clear spaces across the world. |
| Orchard picnic area to the far southeast | Curved fruit-tree rows, picnic spot and a shelter. |

There are 16 enterable buildings in total: eleven homes/retreats, four shops/workshops and one orchard shelter, plus the open park shelter. Architecture uses three roof forms, multiple sizes, fitted windows, four attached garages, varied porches and landscaping. The full world has 242 additional generated/orchard trees plus the original twelve trees.

Shops have decorative interiors, with no trading or new crafting system. Swings are scenery. Terrain remains level; the pond is shallow scenery that can be walked across. Garages are closed scenery. These choices keep the approved movement and interaction systems intact.

## Progress and backups

04 uses browser key `blockworld.neighborhood.04`, save schema **2**, world ID `little-block-world-04`. 03's key `blockworld.neighborhood.01` and controls key are never written by 04.

On first opening, if the browser exposes the older save at the same origin, 04 validates and copies it into the new world. Different local filenames/browsers may isolate storage; in that case export from 03 and import that JSON into 04. Keep the 03 backup. 04 accepts older schema-1 exports and its own schema-2 exports. A 04 export is intended for 04; the older game correctly rejects its newer schema.

Existing pieces, inventory, selection, player pose and door state are retained when valid. The original building coordinates stay unchanged so older builds can migrate. Invalid imports leave the current game unchanged. Browser storage remains dependent on the browser/file location and available space, as before. Export before moving files or clearing browser data. iPhone share-sheet and backup-text fallbacks are retained.

Capacity is **12,000 player pieces**, up to **24 blocks high**. This is a tested software capacity, not a claim that every arrangement will run smoothly on every tablet. Dense builds and crisp resolution may cost more rendering time. Common materials remain unlimited and crafted items retain their existing counts.

## Tablet test checklist

1. Export a backup from 03 first. Keep 03 installed/downloaded as your rollback. Open 04, confirm your old build was copied or import the backup, and check inventory and furniture rotations.
2. Walk from Home to the village, park, pond, woods, orchard and both building meadows. Check that the world feels interesting, the signs/map are understandable and Home reliably returns you.
3. Enter new buildings from both sides of their doors. Try automatic opening, waiting nearby, leaving, returning, and manual operation with Automatic Doors off. Report any blocked doorway or awkward porch approach.
4. Build in a meadow and near a new district. Deselect a material, place blocks, hold to remove and Undo. Craft a bench, rotate its preview and place it. Jump onto blocks and try Edge protection on/off.
5. Enable **Performance** in Settings. Note FPS and p95 frame time at Home, facing the village shops, in the woods and beside a larger build. Play for 10–15 minutes; report pauses, heat, slow camera response or worsening performance. Share the Lenovo model/browser and whether Quality is gentle or crisp. These readings are device measurements; desktop automation is not.
6. Export a 04 save, close/reopen, import the export, and confirm progress. Reopen 03 and confirm its original progress remains intact. Try airplane mode after downloading.

The most useful feedback now is real-device smoothness, map readability, architectural mistakes, and whether the places feel distinct and worth exploring. Resolve that feedback before another expansion or new game systems.
