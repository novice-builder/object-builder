# Preview 07 — Alderwick in the connected Vale

Continued after the independently verified Preview 06 package checkpoint `d53f461b6565f171312c642507dee88eaf4343e1`. The standing issue #2 was fetched again when the hourly continuation arrived; this same active checkout retained its exclusive flock, with no other writer observed. No competing automation, deployment or public-site change occurred.

## One connected world, explicit new scenery

Fresh layout-5 valleys add Alderwick north of Willowmere: six cottages/townhouses, a market and blacksmith, a mill lane, well, planting and supplies. A compact ring street and square connect residential edges and the rural mill to Willowmere's existing ring road. All remain within the same 370×196m shared terrain/world; no separate world loading or saved-record switch is required to walk there. Existing licensed assets/palette and human-scale placement are reused; no model/texture download or new theme is claimed.

The new town is **only in new layout-5 records**. Layout-3/4 constructions and earlier independent environments keep their exact geometry, paths, collisions, matrices, colours and landmarks. New valley creation is explicit in Places, labelled “New The Willow Vale · Alderwick”; saved valley rows distinguish “earlier scenery” from “Alderwick”. No automatic upgrade, construction migration or destructive reinterpretation occurs. Layout-5 backups require Preview 07 or newer; older programs cannot render this new template. Keep matching packages and export backups.

The actual-layout map includes the new road/building geometry and one Alderwick destination, keeping seven main markers. Landmark travel uses the existing checked clear arrival in the square, and Home returns to Willowmere. The town's shops/houses use original closed prefab doors; no new interior/NPC simulation is claimed. The existing Meadow Lodge remains the furnished, enterable building.

## Rendered corrections and navigation

Actual overhead/street/phone/tablet/map views were inspected. The first audit found the market access ribbon ending inside the prefab stall's collision bounds; it now ends before the counter. Driveways now project onto the actual curved ring street, avoiding overshooting the smoothed street into grass. Depth priority follows the existing driveway fix. Trees are excluded from roads and building footprints; new building bounds do not overlap. Five deterministic regressions cover explicit layout/save isolation, real road/water bounds, actual map destinations and curved-road driveway joins.

The first movement fixture incorrectly limited each waypoint to 600 walking frames, prematurely stopping the 56m legacy street segment. Its raw result is retained in `alderwick-first-pass.json` with that correction. The corrected distance-based budget walks the normal movement/collision system from Willowmere through existing streets, along the new northern connector and into the square in 2,429 fixed simulation steps, without switching records. This is an in-browser physics/input-vector fixture, not physical device or uninterrupted manual play. Frozen-loop screenshots explicitly update the live minimap pose before capture.

The Places pass reproduced a real phone overflow with a valid 60-character imported name: modal scroll width 740px versus 360px available. Saved buttons now wrap within the modal; the retained record remains selectable. Actual phone before/after and tablet/landscape layouts were inspected. This uses isolated fixture records, not real player names/data.

## Validation and measured cost

163 deterministic tests pass. Strict TypeScript/preservation and the separate Adventures build pass. **34 current browser/compatibility/resource checks pass:** settlement/route/map 10, retained-world/record compatibility 13, resource/cost 2, Places touch layouts/labels 9. The compatibility pass compares actual source geometry and explicit saved constructions at the new town site against the preserved Preview 06 runtime, reloads a layout-4 last save, creates a separate new layout-5 record via UI and reopens the old construction unchanged. The final layout-5-only driveway refinement leaves those retained layouts untouched.

`profile.json` records fixed Gentle submissions. The village view changes 181→192 calls and 181,005→181,573 triangles; the northern view changes 57→81 calls and 99,217→100,286 triangles. Added scene geometry buffers total 14,056 bytes; no additional texture resource is required. Typed-array culling snapshots are 400,320 bytes in this new layout. Eight new layout-5 replacements plateau at 56 geometries/10 textures/9 programs in the chosen northern view. Warm resource counts depend on previously rendered views; they are not presented as a universal memory reduction. No physical-device FPS or thermal/long-session improvement is claimed. The raw startup resource sample precedes the final small Places copy/wrapping refinement; final package manifest/checks identify the delivered bytes.

The same 82 selected CC0 assets and source/licence inventory remain unchanged. All actual rendering uses managed Chromium/SwiftShader; phone/tablet are viewport and touch emulation. Physical Lenovo, iPhone, Safari and Xbox/Bluetooth remain unverified. Stacking, canopy collision, other enterable prefabs, wildlife/NPCs, vehicles and genuinely different themed worlds remain unfinished.

## Continue immediately

Checkpoint/push this tested source and independently verify GitHub; make a NEW Preview 07 package, check its extracted runtime and preserve its exact source SHA. Continue in the same execution afterward. A conservative first-use mobile graphics default and clearer road wayfinding are candidates; preserve explicit user settings and measure the cost. Further permanent footprint additions still require explicit new layout/new records. Do not stop at the package, alter the repeating automation or invent allowance exhaustion.
