# BlockWorld Adventures — Preview 13 active source

Fresh windmill rooms now match a compact 5.2×5.2m chamfered tower footprint instead of using the earlier larger rectangular template. Two real ten-tread flights turn on a 1.5m landing and reach the 3m grain loft. The upper-floor opening provides actual head clearance. Collision uses rendered walls, floors, treads, posts and rails with the existing generic capsule controller; no collision-ramp shortcut, oversized stair collider or upstairs teleport is used.

Existing premade CC0 plaster/door modules and furniture are reused, with authored floor/stair joinery. A wall-aligned 0.72m-high worktable, chair and supplies leave a tested ground-floor aisle; grain storage and shelving furnish the loft. No new download, catalogue item or texture was added. Outdoor layout 7, building placements, roads and saved construction coordinates are unchanged.

## Saves and preservation

Adventures data version **4** explicitly identifies the compact room profile. New worlds use version 4. Opening an unvisited compact windmill from an older world first makes an independently named updated copy, retaining the complete older record. A previously saved room with no compact profile keeps its older rectangular geometry, upper floor and exact furnishings; it is never regenerated. Preview 12 rejects version-4 backups safely. Older format-3 signed riverbank heights remain supported, and format 4 uses the same safe transport through the unchanged native envelope. Original public site, Run 3, Neighborhood 06, main, all accepted Preview 01–12 packages/evidence and native save/physics files remain protected.

## Verification

- **209 passing deterministic tests**, including actual two-flight geometry movement, mid-landing headroom/support/recovery, under-flight passage, taller side blocking, versioned profile validation, signed height and independently retained older edits.
- **68 passing browser checks**: 28 phone/tablet ordinary keyboard, real touch and injected standard Gamepad API ascent/descent through both flights; actual page reload on the intermediate landing; real UI fades and exact exterior return; eight independently extracted Preview 12 compatibility/upgrade/malformed-import/local-storage-denial checks; six loaded-model furniture, aisle, same-ID move, undo/redo and backup checks, eight independent geometry/cutaway/render-cost/resource checks and 18 current-world phone/tablet map/touch/orientation checks.
- Strict successful Adventures build with **318 input / 131 output hashes** in `BUILD-RECEIPT.json`; the report verifies every input/output and requires each complete browser phase.
- Genuine rendered phone/tablet landing/loft and ground-floor screenshots were inspected. Physical Lenovo/iPhone/Safari/Xbox/Bluetooth tests remain **unverified**; managed SwiftShader is not a physical FPS measurement.

Actual browser testing reproduced the Exit button receiving pointer-up without a compatibility click after mixed controls. The existing responsive button helper now handles Enter/Exit while preserving keyboard/controller activation and duplicate-click protection (`exit-touch-before.json`). Loaded-bounds checks also caught the original worktable encroaching on the stair aisle; it is now turned along the wall at a sensible height, with all six fresh furnishings and rear-corner access passing (`compact-placement-before.json`).

## Measured joinery and camera correction

An independently retained build matches verified source `725e4858a50370e4fcdef059b868fb067b01c5b9` exactly. Eighty-five repeated box meshes become three room-local batches by material and upper-floor visibility group. All **4,324 structural triangles** remain, with the same geometry signature (positions at 10µm; normals/UVs at 1e-5). Room identity and all furnishings are exact. Borrowed premade model geometry is unchanged.

The decorative exit door now follows the front-wall cutaway in both compact and older rooms, exposing the avatar near the entrance. Its collision geometry remains. The three sampled views improve from **92→30 ground calls** and **119→35 landing/loft calls** (67–71% fewer submissions). Hiding the camera-facing door also avoids 1,044 submitted triangles. Owned room buffers increase **10,824→82,224 bytes**; startup increases about 729 encoded bytes and retains the same 52 model/image URLs. Ten alternating entries/exits retain two saved rooms and plateau at 77 uploaded geometries indoors/74 outdoors, 11 textures and nine programs in the sampled final poses. These are workload/resource samples, not physical-device FPS or a universal memory claim. Actual before/after screenshots were inspected; generic movement, input and compatibility checks pass after batching.

## Next active work

Push/independently verify this tested optimisation source, create a NEW Preview 13 package, extract and verify actual runtime/backup/input behaviour before acceptance. Keep all earlier packages/evidence frozen. Then immediately continue useful connected-world/interior improvements, including coherent settlement life/detail or additional building-specific usable spaces. More faithful architectural rooms, wildlife/NPCs, activities, future distinct themes and physical device testing remain unfinished. No deployment, merge, automation change or reset redemption occurred.
