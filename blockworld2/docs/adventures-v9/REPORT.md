# Active development after Preview 08

## Camera foliage milestone

Four deterministic valid player/camera fixtures reproduced the camera entering real indexed leaf bounds of the four supplied Kenney tree models. New camera-only crown bounds exclude unused trunk vertices shared by GLB position accessors. Walking and placement colliders, seeds, scenery geometry and saved records are unchanged. Crown bounds are computed once per library model and transformed once per static instance, never per frame. Existing world disposal clears the camera-only list.

Actual before/after renders are in `screenshots/`, and their camera/bounds data in `canopy-before.json` / `canopy-after.json`. I inspected the detailed-tree and oak views; one tight obstruction initially filled the screen with the Explorer's head, so close camera views now hide the actor. The resulting detailed-tree render leaves the route visible. This is conservative box-based camera collision, not leaf-triangle picking or a claim of universally ideal camera distance.

Three focused indexed-bounds/transform/ray regression tests pass. The strict Adventures build/preservation check passes. Six focused rendered checks pass. Full deterministic suite: 168 passing, zero failures (57.97 s). Chromium SwiftShader emulation only; physical Lenovo/iPhone/Safari/controller testing remains unverified.

## Immediate continuation

The [new user brief](../DEVELOPMENT-PRIORITIES-2026-11-06.md), also in issue #2, now prioritises richer connected settlements and fade-transition furnished interiors with real walkable stairs. No separate interior has been implemented at this checkpoint. Finish committing this camera repair and continue directly into that work. No new preview archive is issued for only this small repair; Preview 08 and all previous packages remain frozen.

## Fade interiors and real stairs — Preview 09 source milestone

Supported cottage, town-house, inn and smithy exteriors now offer a compact Enter action through the existing touch/keyboard/standard-gamepad controls. All 26 permanent supported entrance approaches in layout 5 were checked clear; supported player-placed homes also use their stable placement IDs. Existing Meadow Lodge physical door/navigation remains intact. Other prefab types, including mills/church/market, do not claim separate interiors yet.

The fade switches to a local-coordinate room sized from the exterior model, with the already licensed CC0 plaster/timber modules and Kenney furnishings. Houses/inns have a connected upper floor and continuous stair ramp beneath twenty visible treads, guarded sides and real landings. The audited existing movement/capsule/ramp functions are reused unchanged; an interior-only underside bevel and guarded landing handling prevent the capsule/foot probes snagging at the top. No stair teleport is used. Upper-floor furniture and placement have real elevation; placement keeps stairs, exit, walls and unsupported floor clear. Lower/upper cutaways and a wider, room-centred portrait camera keep navigation visible.

Rooms have individual stable identities and separately persistent edits. First entry into a version-1 world makes an independently named interior copy, retaining the original readable record. Version-2 room backups require Preview 09 or later; older previews reject them. No database/schema change or automatic remapping of original records occurs. Saved indoor coordinates/elevation restore to that room, never to the outdoor valley. Exit returns to the stored safe outside point and actual facing at the same building. Fully blocked exits stay inside; explicit full-map travel can safely leave for a different named destination. The minimap/full map show the corresponding exterior location indoors.

Transitions release inputs, refuse rapid duplicate actions, save a complete location before/after the switch and invalidate pending work on scene replacement. Before a candidate room replaces the current scene, actual source-mesh collision bounds must provide clear footing. A completely obstructed candidate is refused with scene/data/save ownership unchanged. A browser reload during a pre-commit fade retains a complete exterior checkpoint; quota failure prevents entry/copy creation. Native checksummed backup import preserves both source and per-room state.

### Verification and measured costs

- 175 deterministic tests pass (full log `unit-tests.txt`, 65.73 s). Strict typecheck, Adventures build and preservation pass. Native physics and original game files are unchanged.
- 87 accumulated focused browser/render checks pass: 6 camera crowns; 56 tablet/phone exploration, edits, reload and map checks; 9 recovery/resource checks; 12 actual browser keyboard/touch and injected Gamepad API stair checks; 4 geometry preflight/facing/approach checks. Evidence JSON files identify each check and environment. Earlier development views and final responsive camera views are both retained; `*-room-camera-final.png` shows the final framing.
- CDP touch joystick genuinely drives the normal movement controller from ground to upper landing. Injected standard Gamepad API left-stick snapshots descend the same staircase; real keyboard W/S events ascend/descend. Tests cover the smallest cottage and largest inn. These are browser emulations, not physical controller/device tests.
- Ten repeated actual enter/exit cycles plateau at 75 uploaded geometries inside / 74 outside and 11 textures in the tested cottage route, with one room record; its sampled view submits 72 draws / 7,107 triangles inside versus 145 / 141,127 outside. This is a view-specific workload observation, NOT a physical FPS claim. Outdoor group rendering/culling is suspended indoors; shared models and the outdoor scene remain cached for quick return, so no general memory reduction is claimed.
- Room joinery shares one unit-box geometry; generated resources are disposed on exit/replacement. No additional models/textures/downloads are introduced by this milestone. Existing asset provenance/licences remain unchanged. Stair/rail joinery is original supporting geometry, with the imported wall/floor/furniture meshes retained.
- 600 protected files (native/public originals, earlier reports/packages and other preserved files) match the verified base. No public site/Pages/deployment, main merge, automation change or reset redemption occurred.

### Remaining work and immediate continuation

The room templates are deliberately modest: study/dining furnishings, with a single-storey smithy variation. Bedrooms, beds, shop counters, richer building-specific activities and other exterior building types remain unfinished. No NPC/wildlife/vehicle/new-theme feature is claimed. Physical Lenovo, iPhone, Safari and Xbox/Bluetooth remain unverified. SwiftShader frame samples are not device performance.

Create Preview 09 in a NEW folder from the tested source, verify its extracted runtime and real stairs, then immediately continue coherent world expansion and furnishings appropriate to the interior types. Reuse legally verified source assets where possible; do not expand a generic building-material catalogue. Keep saved layouts and earlier numbered packages untouched.
