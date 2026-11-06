# Preview 10 development — Reedbank source milestone

The explicit NEW layout-6 valley adds Reedbank, an irregular riverside hamlet: four cottages/town houses, smithy yard, watermill, well, planted edges, service lane and northern footbridge. The new countryside route joins the existing meadow/lodge approach; the west lane connects to Foresters' Rest. The actual-layout map includes the new destination. Existing homes use the verified per-building fade rooms and stairs. The mill is an exterior landmark at this source milestone; its interior remains unfinished.

Fresh-place UI names Reedbank. Older layouts 1–5 retain their geometry, instance matrices/colours, paths, physical footprints and player constructions, including a construction deliberately placed at the new hamlet site in a layout-5 save. Reopening those records never silently upgrades them. A fresh layout creates a separate record. Preview 09 rejects layout-6 backups before changing ownership or adding an imported record. Use Preview 10+ for new layout-6 backups. No old record/backup/package is overwritten.

## Inspection-led corrections

Actual overview, street, phone/map and bridge screenshots are in `screenshots/`. I inspected the village composition, reversed the mill to place its wheel on the river side, routed the service lane around an existing forester cottage, moved a prop and brought the mill approach around the north side. Main-lane footprint checks also exposed the meadow well at the route's end; that lane now skirts the well. The first lodge-route fixture incorrectly aimed at its closed door collider: it now tests the real clear approach, without pretending to walk through a closed door.

A walking-mask-only bridge check initially passed, but the rendered supplied bridge was diagonal to the path. New layout 6 now aligns the real referenced mesh vertices' long axis before fitting all three bridges. The walking profile is sampled from that fitted model, including its flat centre; it uses fixed bridge coordinates rather than the river's slightly curving X coordinate. An independent indexed-triangle probe checks the actual walking corridor and finds about 6.96–13.03 mm foot clearance. Legacy layouts keep their original bridge geometry and profiles; no archive is rewritten. Raw initial/repaired evidence is retained.

## Tests and measured cost

180 full deterministic tests pass (`unit-tests-world.txt`, 53.39 s). Strict build/typecheck/preservation passes. Thirty focused browser/compatibility/triangle-surface/resource checks pass across `reedbank.json`, `compat-checks.json`, `bridge-surface-aligned.json` and `render-cost.json`. They include walking across the bridge and countryside route to the lodge, the forester lane, clear main-lane footprints, a new house's furnished room, phone/map layout, exact old-layout geometry/creations, older-preview rejection and repeated saved-world replacements.

Four identical-camera Gentle views against extracted Preview 09 add 9–29 draws and 213–3,337 triangles (about 0.1–1.9%; riverbank +299). Generated geometry adds 14,472 bytes; sampled startup resource bytes rise 3,669,027 → 3,673,202 (4,175 bytes of code). No additional environment model or texture is downloaded. Ten alternating layout-5/6 saved-world replacements plateau at 82 uploaded geometries, 11 textures and 9 programs in the measured final view. These are view-specific costs, not physical FPS or a general memory claim. Existing culling and Gentle touch defaults remain.

All browser checks use managed Chromium/SwiftShader and emulation. Physical Lenovo, iPhone, Safari and Xbox/Bluetooth remain unverified. No deployment, main merge, Pages/automation change or reset redemption occurred.

## Immediate continuation

Push/independently verify this source checkpoint, then immediately improve appropriate interior furnishings: a human-scale bed and bedside cabinet are legally downloadable from the same pinned Kenney CC0 conversion source. They have been researched and byte-verified locally but are NOT integrated at this source milestone. Preserve existing room edits/templates; new furnishings should apply to new rooms or explicit player placement. Make the mill worth entering using the existing fade/stair system. Do not expand generic block/material inventories. Preview 09 remains the latest accepted archive; do not overwrite it. A NEW Preview 10 archive should follow a coherent tested release milestone.
