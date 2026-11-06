# BlockWorld Adventures — Preview 13 active source

Fresh windmill rooms now match a compact 5.2×5.2m chamfered tower footprint instead of using the earlier larger rectangular template. Two real ten-tread flights turn on a 1.5m landing and reach the 3m grain loft. The upper-floor opening provides actual head clearance. Collision uses rendered walls, floors, treads, posts and rails with the existing generic capsule controller; no collision-ramp shortcut, oversized stair collider or upstairs teleport is used.

Existing premade CC0 plaster/door modules and furniture are reused, with authored floor/stair joinery. A wall-aligned 0.72m-high worktable, chair and supplies leave a tested ground-floor aisle; grain storage and shelving furnish the loft. No new download, catalogue item or texture was added. Outdoor layout 7, building placements, roads and saved construction coordinates are unchanged.

## Saves and preservation

Adventures data version **4** explicitly identifies the compact room profile. New worlds use version 4. Opening an unvisited compact windmill from an older world first makes an independently named updated copy, retaining the complete older record. A previously saved room with no compact profile keeps its older rectangular geometry, upper floor and exact furnishings; it is never regenerated. Preview 12 rejects version-4 backups safely. Older format-3 signed riverbank heights remain supported, and format 4 uses the same safe transport through the unchanged native envelope. Original public site, Run 3, Neighborhood 06, main, all accepted Preview 01–12 packages/evidence and native save/physics files remain protected.

## Verification

- **209 passing deterministic tests**, including actual two-flight geometry movement, mid-landing headroom/support/recovery, under-flight passage, taller side blocking, versioned profile validation, signed height and independently retained older edits.
- **42 passing browser checks**: 28 phone/tablet ordinary keyboard, real touch and injected standard Gamepad API ascent/descent through both flights; actual page reload on the intermediate landing; real UI fades and exact exterior return; eight independently extracted Preview 12 compatibility/upgrade/malformed-import/local-storage-denial checks; six loaded-model furniture, aisle, same-ID move, undo/redo and backup checks.
- Strict successful Adventures build with **318 input / 131 output hashes** in `BUILD-RECEIPT.json`; the report verifies every input/output and requires each complete browser phase.
- Genuine rendered phone/tablet landing/loft and ground-floor screenshots were inspected. Physical Lenovo/iPhone/Safari/Xbox/Bluetooth tests remain **unverified**; managed SwiftShader is not a physical FPS measurement.

Actual browser testing reproduced the Exit button receiving pointer-up without a compatibility click after mixed controls. The existing responsive button helper now handles Enter/Exit while preserving keyboard/controller activation and duplicate-click protection (`exit-touch-before.json`). Loaded-bounds checks also caught the original worktable encroaching on the stair aisle; it is now turned along the wall at a sensible height, with all six fresh furnishings and rear-corner access passing (`compact-placement-before.json`).

## Next active work

This is a tested source checkpoint, not an accepted Preview 13 package. Next correct the decorative exit door masking the player's legs near the spawn when its front wall is cut away, then measure batching static compact stair/rail joinery against an independently retained pre-batch build. Preserve actual collision and upper-floor cutaway behaviour. Recheck inputs, navigation, save compatibility and resource plateau; package into a NEW version-13 folder only after actual package verification, then continue useful world/interior work. No deployment, merge, automation change or reset redemption occurred.
