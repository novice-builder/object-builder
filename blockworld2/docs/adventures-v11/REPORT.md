# Preview 11 — movement repair in progress

Baseline: accepted Preview 10 package commit `3dcd4f630006fd00f5631d362ce9cc20da8a595c`, runtime `6ac4edfe9e79ee71cfa815ab6ff06e1ed0075613`. This is source/evidence work, not a released Preview 11 archive.

The 08:40:52 UTC issue update makes the user's reported stair barriers the immediate priority. Preview 10 reproduction and source face measurements are in `movement-before.json` and the before screenshots. Exterior movement stopped at a building-wide box. Interior movement used a ramp and full-height invisible guard boxes; the high underside of the actual flight should allow passage, whereas low treads must retain head collision. The stock town-house exterior risers measure 0.378m at the placed scale and remain unfinished.

First repair uses the actual indoor mesh triangles: rendered treads, sloped rails, individual posts, wall openings and floor edges. A generic 1.75m-high / 0.28m-radius capsule steps at most 0.30m with real landing/head clearance, descends with ground snap, and validates reload/cancel recovery on actual surfaces. Furniture retains its existing bounded collision and cannot be automatically stepped onto. Geometry is cached per room, not rebuilt each frame. No individual stair is tagged for movement; the old ramp descriptions remain only for existing furnishing reservations/layout construction and legacy regression fixtures. Published native movement files are unchanged.

A thin-tread regression exposed rounded-corner grounding and a Three r160 octree maximum-plane precision loss. Both are covered: the tree pads its maximum as well as minimum bounds, and nearby real support recovers a grounded foot without an airborne step allowance. Mesh doorway openings remain open; tall ledges, low head clearance and furniture remain blocked.

Validation at the first repair:

- 186 deterministic tests, including four new actual-triangle movement cases. Full log: `/workspace/work/tests-v11-all.txt`.
- Strict typecheck, preservation and separate Adventures production build.
- 28 rendered/browser checks: cottage, inn and mill ascent/descent, furniture edits, actual thumbnails, reload and exact same-building exit. `mesh-rooms.json`.
- 14 phone/tablet keyboard, actual touch joystick and injected standard Gamepad API checks; high stair underside passage, low underside head collision, camera and input release. `mesh-inputs.json`.
- Actual screenshots inspected, including furnished mill upper floor and phone/tablet views. Chromium SwiftShader/touch emulation only. No physical Lenovo/iPhone/Safari/Xbox/Bluetooth result or hardware FPS claim.

Next: exterior actual mesh movement, human-scale stock exterior step correction, camera/lodge/bridge regressions; running default, optional Walk and Jump controls; versioned single-storey new rooms preserving all old saved upper floors. Continue implementing immediately after committing/pushing/verifying this repair. Rendering batching and further world expansion remain authorised after the movement correction. No new asset download or licence change in this repair.
