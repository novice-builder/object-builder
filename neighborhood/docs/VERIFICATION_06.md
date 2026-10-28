# Neighborhood 06 engineering notes

06 keeps the 500 × 500 m configuration and previous release artifacts. Development starts at `4872cd7` on `codex/neighborhood-06-town`. The standalone output is `BlockWorld_Neighborhood_06.html`. Earlier HTML releases are never rebuilt by the 06 build script.

## Town design

`town-06.js` authors street frontages, deliberate gaps for vacant properties, and district destinations. Linden and Willow have opposing house frontages and shared property setbacks; Elm is a smaller lane within the west collector. Ends of new roads project onto the actual smoothed collector geometry, rather than assuming unsmoothed control points remain on the road.

There are 72 main buildings versus 40 in 05. All 40 earlier main buildings remain at their previous locations. New examples include cottages, divided family houses, six two-storey residences, Magnolia manor, a library, café and roller-door workshop. Existing side wings have real interior openings. Existing garages are rebuilt as wall/roof shells with openable fronts. Clock/beacon towers are visibly clock monuments, avoiding false upper-room windows.

Interior partitions provide 1.7 m openings. Two-storey floors leave a real stairwell, with a guarded edge and back landing. Visible stair treads sit over an inclined collision surface. Movement follows this surface continuously; ordinary blocks retain the approved manual-jump behavior. Building/import placement reserves the stair fixture volume so pieces cannot embed in its treads. No general automatic climbing was reintroduced.

Eleven street properties use subtle grass overlays and frontage access, with different setbacks at collector corners. Six larger clearings were moved away from trails/road corners, retain ground-level building, and have approach paths ending at their edges. Their former sites remain ordinary buildable ground. Existing player pieces are not moved.

## Defects and their causes

| Issue | Cause found | Correction and evidence |
| --- | --- | --- |
| Blue/dark geometry near ceilings on “balcony” buildings | The shared projecting bay-window model had a low roof-coloured cap across its window opening, plus duplicate inner glazing. General roof undersides also used dark roof colours. | Fix the shared bay generator: ceiling-height plaster cap, fitted upper bay wall, no duplicate flat pane. Use plaster undersides. A separate screenshot review found a 17 cm upper side-wall/ceiling gap on the new two-storey model; a shared upper wall band closes it, with envelope checks across every variant. Same-pose 05/06 screenshots show the change; all instances use this generator. |
| Disconnected paths and awkward joins | 05 used nearest-route links without awareness of a street frontage; smoothed roads do not pass through every control point. Some old park paths crossed equipment and seats. | Named-street access, projected road joins, park perimeter paths, opening gaps in fences, relocated seating/planters, and clearing access spurs. Sampled entrance/trail collision checks and screenshots. |
| Overlapping markings/T shapes | Dashes continued through junctions and self-rejoining road polylines. | Keep cumulative-distance dashes, omit them within junction clearance, and handle self-joins explicitly. Automated marking-clearance test. |
| Grass over roads | Overlays need a consistent height ordering; growing the layout adds more chances for these to intersect. | Ground/grass overlays below path and road surfaces; paths below asphalt, drives stop at footpath edges. No raised grass platform is added over streets. Actual top-down/eye-level review. |
| Trees on walking routes or inconsistent obstruction | Fixed, orchard and procedural tree sets used different exclusions; 05’s original vegetation rules only knew the original road/path slices. | All final tree sets pass the same full-network/house/drive/lot exclusion check, including player reservations. Record accepted trunk positions; every trunk is solid and matches its visible dimensions, while foliage remains passable. Automated tests check every accepted tree. |
| Context button intercepts camera gestures | It occupied the central viewing area. | A dedicated right-side dock above actions; preview confirmation hides it. Four mobile profiles test dock separation, real camera drag and button activation. |
| New town geometry conflicts with old creations | A denser world can occupy previously empty ground; testing only wall intersections misses a build inside a proposed house. Relocated public furniture can also conflict. | Reserve the whole new property, omit that house from the imported layout, and let landscaping/public furniture yield to saved pieces. Test a real 05 build both inside a new property and at a relocated bench site. Invalid imports remain atomic. |
| Many door draw calls | Each slat, inset and knob was a separate mesh. | Bake complete animated leaves with vertex colours; 324 source meshes become 84 meshes sharing three geometries. Physics still uses independent exact door shapes. Initial Home calls fell from 155 to 83; final paired measurements are linked below. |

## Rendering, collision and map

Keep the 24 m static geometry batches, vertex colours, exposed-face common-block meshing, instanced detailed pieces, spatial collision indexes and local build-chunk edits. Ordinary placement/removal/Undo do not rebuild the town. A candidate town is rebuilt only when loading progress that needs space reserved for older structures; incompatible data is rejected before the active scene/save is changed. Old scene geometries, materials and map textures are disposed when swapping it. Profiling found repeated whole-save validation during restore. The loading path now reuses one sanitized state, checks static clearance through the current/candidate index, and resolves the player pose in the existing apply-state path; it does not repeat piece/inventory/overlap validation. Candidate geometry is committed only after those checks pass.

The fully opaque fog visibility check is retained. It uses view-space depth and conservative bounding spheres, with no reduction of geometric detail. Six same-camera PNG comparisons check that enabled/disabled culling renders identical pixels. No streaming or LOD system was added.

Door collision and animation share transforms. Swing leaves retain continuous obstruction checks, player-aware direction, hysteresis, delayed closing, and manual latches. Roller leaves have vertical clearance matching the shrinking visible panel. They use the same safe preflight and per-animation-step checks; a returning player reopens a closing door. Broadphase obstacle queries are deferred until an operation or animation needs them, so distant idle doors do not query scenery every frame. All 84 doors are tested from both sides, including Fast approaches; each roller also refuses a placed obstruction and a returning player.

The full map caches built-in roads, trails, access paths, trees, properties, footprints, ponds and landmarks on a 1024² canvas. The circular minimap crops the cache around the player, shows north and heading, and updates at most 10 Hz only after position/heading changes. The existing full map draws from the same cache and refreshes the player arrow while open. The cache rebuilds only after the static layout changes. Player-placed pieces are not currently drawn on either map.

Standard Xbox-style Gamepad API input was absent from 05. 06 adds a small input adapter with deadzones, finite/clamped axes and one action per button press, using the existing gameplay handlers. Touch, keyboard and mouse keep their established handlers. Simulated gamepad input and actual browser keyboard/mouse events are exercised; physical controller/browser pairing remains unverified.

## Saves and limits

Schema 4/world `little-block-world-06`; storage `blockworld.neighborhood.06`; preferences `blockworld.neighborhood.controls.v6`. Copy/import schemas 1–3 with their original world and coordinate checks. Old keys remain untouched. Bounds remain ±250 m, build height 24, maximum pieces 12,000 and maximum import size 4 MB. Rotations, inventory, duplicates and geometry conflicts are validated before replacement. iPhone share/text export fallbacks remain unchanged.

Imports may omit new properties and public scenery where previous creations need that space; the map follows the resulting layout. New street surfaces can run beneath saved creations. Original permanent building collisions remain protected. If all conflicting pieces are later removed, reloading may restore the omitted new property. 06 saves are not backward exports to 05.

## Verification and remaining limits

[Final measurements, raw reports and screenshot gallery](verification-06/SUMMARY.md) record exact release hashes. Unit checks cover world bounds/layout, all doors, stairs, connected rooms, trunk collision, road markings, trails, lots, migration, 12,000-piece saves, placement, Undo, movement and gamepad input. Browser checks exercise real controls, file-input import/download, reload, viewport scaling, touch building and menu interactions. Pixel comparisons check the retained fog optimisation. Screenshots were inspected as rendered output.

Terrain remains flat and ponds decorative/shallow. Playground equipment is fixed scenery. Many original cottages remain one-room interiors; richer examples are concentrated in the new family houses/manor and opened wings. No NPCs, quests, swimming, water simulation or parental gate were added. Browser storage can be isolated per local file/app. Software-renderer timing and JavaScript heap indicators are not physical-device or total GPU/native-memory measurements. The managed browser blocks `file://`; real local-file play must be verified on the target devices.

Next, use the Lenovo/iPhone checklist before increasing density again. If device profiles show pauses, focus on the measured dense edit path, visible geometry/draw calls or startup allocations as appropriate. Smaller build chunks/incremental meshing and splitting long static ribbons across spatial chunks are candidates; streaming is justified only if real startup/memory data warrants it.
