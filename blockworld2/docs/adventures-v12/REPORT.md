# BlockWorld Adventures — Preview 12 active development

Miller’s End extends the existing continuous Willow Vale southwest of Willowmere. A windmill lane and a cottage/garden loop connect to the original village without loading another world. A compact inn/town-house centre, quieter cottages, workshop yard and small market reuse coherent licensed CC0 assets. Six new residential/workshop buildings have independently saved furnished interiors; the inn and town house have real connected upper floors.

Permanent footprints appear only in explicit **new layout 7**, created as a fresh record. Older layouts 1–6, saved constructions, backups and accepted Preview 01–11 archives are retained. Places clearly distinguishes the new and older scenery. Preview 11 safely rejects layout-7 imports; use Preview 12 for these new records. Old independent environments are not automatically merged or moved.

## Evidence and validation

- **201 passing deterministic tests** and strict separate Adventures build; logs included.
- **45 passing current browser checks**: 25 new-district walking/entry/save/reload/exact-return checks, four actual old-layout comparisons against independently extracted Preview 11, 14 new inn/town-house keyboard/touch/injected-gamepad stairs and camera checks, two rendering/resource checks.
- The initial proposed windmill junction ran into an existing cottage beside an old road. Actual movement exposed the obstruction; the new road now joins the clear village perimeter instead. Both routes and the southern cottage loop are traversed through ordinary movement.
- Actual layouts 3–6 match the Preview 11 reference exactly for paths, scenery/trees, collision bounds, building entrances, maps and retained construction coordinates. Tests create a new layout-7 record, then reopen the older decorated record unchanged.
- Every new home/workshop/inn is approached along the ground, entered through the real UI fade, saved/reloaded independently and exited to the exact same clear exterior. Workshop has supplies rather than a bedroom. Touchscreen and injected standard Gamepad API ascend/descend the actual new inn/town-house stairs; keyboard shares the controller.
- Genuine rendered map, street, exterior and interior screenshots were inspected. Current screenshots are managed Chromium SwiftShader emulation; physical Lenovo/iPhone/Safari/Xbox/Bluetooth tests remain **unverified**.

## Measured rendering cost

The same 52 model/image URLs load: approximately 3,724,794 encoded startup bytes versus 3,722,595 for extracted Preview 11. The district view adds 15 draw calls and 2,449 submitted triangles (205/178,188 versus 190/175,739). Four other fixed views range from unchanged to three fewer calls, with changing submitted foliage counts. This is scene workload, not physical mobile FPS or an optimisation claim. Ten actual layout-6/7 switches plateau at 89 uploaded geometries, 11 textures and nine programs in the sampled view. Existing assets/licences/source bytes remain unchanged; no new download or catalogue bulk.

## Continuing work

This source milestone is not a finished game or accepted Preview 12 package. Immediately continue meaningful connected-world/interior work: make the existing windmill a useful enterable destination using a scale-appropriate furnished room, check navigation direction during room transitions, improve district garden/market detail, then package the coherent release into a NEW version-12 folder after real package verification. More building-specific interiors/activities, settlements and measured rendering improvements remain unfinished. No deployment, main merge, automation change or reset redemption occurred.
