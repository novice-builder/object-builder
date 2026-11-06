# Preview 05 — active development

Preview 04 is preserved at remote package checkpoint `8ad0ddf448e908fd6bde9135f22be6b96a198558`. Its former `commit_refs_rules` push failure resolved on a normal fast-forward retry; no repository rule, branch, transport or protection was bypassed. This folder contains new evidence only. No site was deployed and no automation was changed.

## Map touch targets

Real touchscreen emulation reproduced the same defect on 390×844 phone and 1024×768 tablet layouts: tapping the visible edge of “Foresters’ Rest” outside the old 25px circle did nothing. `map-targets-before.json` records the two failures. Map labels now share one measured CSS-pixel layout with hit testing, use larger phone lettering, avoid nearby label/marker ink where possible, and stay inside the viewport. Visible name rectangles and padded touch areas are actionable; direct marker taps retain priority. Geography and safe arrival checks are unchanged.

Inspected rendered evidence: `screenshots/map-phone-before.png`, `map-tablet-before.png`, `map-phone-after.png` and `map-tablet-after.png`. The phone fit view keeps all six landmarks readable; the normal phone opening remains zoomed around the player. The full canvas accepts only owned, short, non-gesture releases, preventing a sparse/coalesced drag release from becoming teleportation.

`map-targets-after.json` contains 18 passing real browser checks: phone/tablet name-edge travel, label bounds at three zooms, release displacement, genuine multitouch pinch and remaining-finger pan, cancellation, fresh circle travel and no browser exceptions. Three deterministic layout/picking regressions accompany the implementation. The complete deterministic suite passes 150/150 tests; strict TypeScript, preservation and the Adventures production build pass. These are managed Chromium/SwiftShader viewport and input-emulation results; physical Lenovo, iPhone, Safari and Xbox/Bluetooth tests remain unverified.

This is an active development checkpoint, not a packaged release or an end of the assignment. Next: reproduce and refine cancelled/sparse world-view gestures, then continue useful gameplay, scene and mobile improvements. Historical packages, old layout records and asset licences remain unchanged.

## World-view touch interruption

The next pass reproduced sparse-release selection and cancelled-pinch orbit loss on phone portrait, phone landscape and tablet. The existing controls handler now checks ownership and total release displacement before selection, explicitly discards the local drag on clear, and resumes the remaining contact as an orbit-only gesture after cancellation/capture loss. Normal pointer-up continuation, ordinary taps, simultaneous joystick/look and neutral movement after cancellation are retained.

`touch-release-before.json` records six failures and three passing reference checks. `touch-release-after.json` records 24 passing browser checks. Native captured contacts exercise the real DOM handlers; sparse pointer-up and single-contact cancellation are explicit injected edge cases. The initial harness accidentally invoked its tap spy during Playwright setup; wrapping that setup in a function removed the unrelated invocation before baseline evidence was retained. The corrected baseline shows one real unintended selection callback per sparse release. Actual rendered phone/tablet/landscape layouts were inspected in `screenshots/touch-*-after.png`. Strict build/preservation passes. No physical hardware claim is made.

## Static scenery submission cost

Gentle mode now compacts static scenery batches to conservative per-instance frustum/fog bounds. Original matrices and per-instance colours remain available; stationary views do not re-upload buffers. Balanced/High restore every source instance for offscreen shadow casters. Geometry, collisions, placement, saves and asset files remain unchanged.

The first radial-distance prototype was rejected after image comparison showed peripheral foliage missing. `instance-cost-radial-prototype.json` and `instance-radial-prototype-differences.json` retain the measurements, not passing release evidence. Both chunk and instance fog checks now use forward camera depth, matching Three's fog shader. A deterministic off-axis regression covers the error. This also retains legitimate peripheral scenery previously lost by radial chunk culling.

Six inspected 1024×768 views submit **17.3–34.4% fewer triangles** than the pre-change checkpoint, with zero pixel differences between compaction and full source batches in each corrected view. Draw calls range from unchanged (woodland 170) to reduced (centre 197→181; road 250→245; hamlet 218→205; lodge 48→41; camp 99→85). The original/corrected fog checks differ, so this is a conservative real-scene comparison, not an isolated culler benchmark. See `instance-comparison.json` and the raw `instance-cost-before/after.json` trials. CPU submission times vary and do **not** establish an overall speedup. Culling medians add about 0.3–0.6ms here. Extra retained typed-array source/bounds storage is 407,680 bytes per tested world, excluding JavaScript collection/object overhead. No physical-device FPS improvement is claimed.

`instance-checks.json` passes 11 browser checks: restored geometry/matrix/colour/collision/path/creation signatures match preserved Preview 04 for village layout 1, woodland 2 and vale 3/4; ten replacement worlds plateau at 51 geometries/10 textures in the chosen lodge view; shadow modes restore all instances; Gentle resumes compaction and stable frames avoid uploads. Three focused deterministic culling/fog regressions pass; the complete final deterministic suite passes 153/153 tests, and strict build/preservation passes. The source preserves saved explicit tent scales and layout-3 constructions at the later lodge site. The original renderer/store/schema and historical packages are unchanged.

Rendered scene inspection also exposed a separate Brookside polish defect: overlapping differently shaded road ribbons shimmer at driveway junctions. Fix their surface priority/coherence next without moving paths, colliders or player constructions.
