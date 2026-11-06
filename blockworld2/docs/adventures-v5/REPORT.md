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
