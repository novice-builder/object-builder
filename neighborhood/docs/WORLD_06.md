# Neighborhood 06: play and device feedback

Download **BlockWorld_Neighborhood_06.html** using GitHub’s **Download raw file** button. Keep the earlier HTML files and an exported backup. Open 06 using the same browser/app that successfully opened your previous standalone game. Once downloaded, the game needs no network assets.

The development branch is `codex/neighborhood-06-town`, based on 05 commit `4872cd7`. This is a new candidate, pending your device feedback. Neighborhood 04 remains the stable playable release and 03 remains the approved core rollback.

## Places to explore

The world stays **500 × 500 metres**. All 40 previous main buildings remain, with 32 new buildings arranged around Linden Street in the north, Willow Street in the south, and Elm Lane in the west. The existing town centre, Sunbeam village, makers district, farms, woodland and ponds remain recognisable.

Look for six two-storey residences, including Magnolia manor east of Home. Walk through the halls, climb the stairs, explore upstairs, and return downstairs without jumping. Old attached side rooms are now accessible through interior openings. Twelve garages have usable interiors and roller doors; approach to open or tap the door/side action button. Clock and beacon towers are solid clock monuments rather than pretend inaccessible rooms.

Eleven vacant frontage properties sit between neighbours, with subtle grass boundaries, a short driveway and a small BUILD sign. Six larger clearings remain for bigger creations, with paths to their edges. Building still works outside the marked areas wherever the usual placement checks permit it.

The play park groups swings, a slide/climbing frame, seesaw, sandpit and picnic shelter around walking paths. Lake park has a picnic shelter and pond-facing seating; the woodland reserve has a quieter trailhead picnic area. Playground equipment is fixed scenery.

## Controls

Touch controls retain the joystick, Jump, hotbar, long-press removal, Undo, edge protection and furniture previews. Tap the selected material again to return to an empty hand. Contextual actions now live at the right side, above the action buttons, leaving the centre view clear. They hide while confirming a furniture preview.

The circular minimap shows the nearby 96-metre area, north at the top, and a yellow player arrow. Tap it to open the full map. The maps show the built-in town; individual player-placed pieces are not drawn yet. Home returns to the original home area. Normal/Quick/Fast walking remain in grown-up settings.

Desktop: WASD/arrows move, drag the view with the mouse, Space jumps, E interacts, digits choose materials, F places, R removes or rotates a preview, Enter confirms, Z undoes, Escape opens/closes menus.

Standard Xbox-style browser mapping: left stick moves; right stick looks; A jumps; X interacts; B deselects/cancels a preview; bumpers or D-pad left/right select hotbar items; RT places/confirms; LT removes; Y rotates a preview; View undoes; Menu opens/resumes settings. Within a dialog, D-pad selects buttons, A activates and B returns. This was tested with simulated standard Gamepad API input, **not a physical controller**. Availability depends on the browser exposing the paired controller. Enable the existing Crosshair placement setting for clearer controller aiming.

## Bring your progress safely

06 uses `blockworld.neighborhood.06` and control preferences `blockworld.neighborhood.controls.v6`. It does not write to older keys. If the browser shares storage between these files, 06 copies a compatible 05 save first, then 04/older if needed. Otherwise export from the old file and import its JSON in 06’s grown-up settings.

Imports support earlier schemas 1–3 and 06’s schema 4. Pieces, crafted inventory and selection are retained after validation. When a previous build occupies a new property, 06 leaves the **whole new building out** of that save. New landscaping also gives saved pieces room. Existing buildings/roads remain; new road surfaces can run beneath old creations. Every imported piece remains subject to validation against retained permanent structures. Invalid files leave current progress intact.

Export and reopen a backup after making changes. iPhone file sharing and backup-text fallbacks remain available. Different browsers or file viewers can isolate browser storage. 06 exports are for 06; older releases safely reject the newer schema.

## Tablet/iPhone checklist

1. Start with **Gentle** quality. Walk around Home, Linden Street, Willow Street, the play park and the manor. Check that the streets feel populated, distinctive and easy to follow.
2. Enter homes, explore side rooms, climb all six staircases, turn on the upper landings and walk downstairs with edge protection on. Try Normal and Fast speeds. Test Jump separately on ordinary blocks.
3. Approach and leave both sides of house and garage doors. Stand in a doorway while it is closing; it should stay safe. Try manual operation with Automatic Doors off.
4. Drag the centre of the view while near a door. Check the side action button, minimap, hotbar, Jump and Undo for comfortable reach in portrait and landscape.
5. Build in a vacant residential lot and a larger clearing. Deselect, long-press remove, Undo, craft a bench, rotate its preview and confirm placement.
6. Import a **copy** of your previous save. Check your creations/inventory, save, close/reopen, export, and restore the export. Keep your original HTML and backup.
7. In grown-up settings, note FPS, p95 frame time, draw calls and triangles around a dense street and an open clearing. Report pauses, heat, battery drain or input delay, including device/browser, orientation and quality setting.

Automated checks use a Linux Chromium software renderer at mobile-sized viewports. They do not establish Lenovo/iPhone performance or your visual approval. The managed browser blocks local `file://` pages by policy; offline routed-document tests and real download/file-input operations passed, while actual local-file execution must be checked on your devices.

[Measured comparison, screenshots and limitations](verification-06/SUMMARY.md) · [Technical notes](VERIFICATION_06.md)
