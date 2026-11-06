# BlockWorld Adventures — Preview 12 active development

Miller’s End extends the existing continuous Willow Vale southwest of Willowmere. A windmill lane and a cottage/garden loop connect to the original village without loading another world. A compact inn/town-house centre, quieter cottages, workshop yard and small market reuse coherent licensed CC0 assets. Six new residential/workshop buildings have independently saved furnished interiors; the inn and town house have real connected upper floors.

Permanent footprints appear only in explicit **new layout 7**, created as a fresh record. Older layouts 1–6, saved constructions, backups and accepted Preview 01–11 archives are retained. Places clearly distinguishes the new and older scenery. Preview 11 safely rejects layout-7 imports; use Preview 12 for these new records. Old independent environments are not automatically merged or moved.

## Evidence and validation

- **203 passing deterministic tests** and strict separate Adventures build; logs included.
- **86 passing browser checks**: 25 new-district walking/entry/save/reload/exact-return checks, four actual old-layout comparisons against independently extracted Preview 11, 14 new inn/town-house keyboard/touch/injected-gamepad stairs and camera checks, three rendering/resource checks, 22 windmill entry/stair/save/map-heading checks and 18 phone/tablet visual/map-gesture/control checks.
- The initial proposed windmill junction ran into an existing cottage beside an old road. Actual movement exposed the obstruction; the new road now joins the clear village perimeter instead. Both routes and the southern cottage loop are traversed through ordinary movement.
- Actual layouts 3–6 match the Preview 11 reference exactly for paths, scenery/trees, collision bounds, building entrances, maps and retained construction coordinates. Tests create a new layout-7 record, then reopen the older decorated record unchanged.
- Every new home/workshop/inn is approached along the ground, entered through the real UI fade, saved/reloaded independently and exited to the exact same clear exterior. Workshop has supplies rather than a bedroom. Touchscreen and injected standard Gamepad API ascend/descend the actual new inn/town-house stairs; keyboard shares the controller.
- Genuine rendered map, street, exterior and interior screenshots were inspected. Current screenshots are managed Chromium SwiftShader emulation; physical Lenovo/iPhone/Safari/Xbox/Bluetooth tests remain **unverified**.

## Measured rendering cost

The same 52 model/image URLs load: approximately 3,725,628 encoded startup bytes versus 3,722,595 for extracted Preview 11. The district view adds 15 draw calls and 47 submitted triangles (205/175,786 versus 190/175,739). Four other fixed views range from one to five fewer calls, with changing submitted foliage counts. This is scene workload, not physical mobile FPS or an optimisation claim. Ten actual layout-6/7 switches plateau at 89 uploaded geometries, 11 textures and nine programs in the sampled view. Existing assets/licences/source bytes remain unchanged; no new download or catalogue bulk.

## Continuing work

This source milestone is not a finished game or accepted Preview 12 package. Immediately continue meaningful connected-world/interior work: make the existing windmill a useful enterable destination using a scale-appropriate furnished room, check navigation direction during room transitions, improve district garden/market detail, then package the coherent release into a NEW version-12 folder after real package verification. More building-specific interiors/activities, settlements and measured rendering improvements remain unfinished. No deployment, main merge, automation change or reset redemption occurred.

## Validation correction

Source checkpoint `3026379` passed the 201-test suite, but a follow-up audit found strict TypeScript failed in the newly added test fixture (`Snapshot.world.adventure` is deliberately unknown). Its browser evidence therefore used an earlier build and must be regenerated. The claim of a passing strict build at that checkpoint was incorrect. It was not an accepted release or package. The fixture is corrected. A successful strict build now has a receipt covering 315 inputs and all 131 runtime outputs, and engine/browser evidence has been regenerated. The report checks exact expected phase counts to reject incomplete runs. The last UI helper is covered by the 18 actual current map/input checks; earlier scene workload measurements are unchanged by that helper.

## Windmills and touch navigation

In layout 7, Old Willow Windmill and Alderwick Windmill now lead through fade transitions into independent furnished mill rooms with grain lofts and actual stairs. Footprints, source GLBs and older layout entrances remain unchanged. The reusable room is approximately scaled from the model body/depth, excluding the wide sails; it is a rectangular template, not a circular architectural replica. Exact compact tower interiors remain unfinished. Nested transforms and half-turn entrance direction have regression coverage.

The real browser reproduced a map arrow changing from the saved player facing to camera heading while indoors. It now retains the exterior facing across entry, reload and exit, with the same legacy fallback as the exterior return. Fast pinch/pan followed by Fit also reproduced native pointer-up without a compatibility click. Map controls now handle completed touch/pen presses directly, suppress duplicate pointer clicks and keep keyboard/controller-generated clicks. Cancelled/dragged presses do not invoke the action. Actual two-finger zoom, one-finger pan, label-tap travel, single-action zoom buttons, keyboard Space and rotated phone/tablet layouts pass. Minimap taps no longer flash a large rectangular highlight; keyboard focus remains.

Ten alternating windmill entry/exit cycles retain two independently saved rooms and plateau uploaded resources: 105 geometries indoors, 104 outdoors, 11 textures and ten programs in the sampled final cycle. The mill view submits 72 calls and 7,107 triangles while outdoor rendering is suspended. These are managed-browser workload/resource samples, not physical mobile performance.

Next: measure batching the new district’s identical road surfaces against an independently retained pre-batch build, retain the change only with useful measured cost/visual results, then verify a new Preview 12 package. Continue beyond that release into more accurate compact interiors and useful environment/gameplay work.
