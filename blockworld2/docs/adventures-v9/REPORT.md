# Active development after Preview 08

## Camera foliage milestone

Four deterministic valid player/camera fixtures reproduced the camera entering real indexed leaf bounds of the four supplied Kenney tree models. New camera-only crown bounds exclude unused trunk vertices shared by GLB position accessors. Walking and placement colliders, seeds, scenery geometry and saved records are unchanged. Crown bounds are computed once per library model and transformed once per static instance, never per frame. Existing world disposal clears the camera-only list.

Actual before/after renders are in `screenshots/`, and their camera/bounds data in `canopy-before.json` / `canopy-after.json`. I inspected the detailed-tree and oak views; one tight obstruction initially filled the screen with the Explorer's head, so close camera views now hide the actor. The resulting detailed-tree render leaves the route visible. This is conservative box-based camera collision, not leaf-triangle picking or a claim of universally ideal camera distance.

Three focused indexed-bounds/transform/ray regression tests pass. The strict Adventures build/preservation check passes. Six focused rendered checks pass. Full deterministic suite: 168 passing, zero failures (57.97 s). Chromium SwiftShader emulation only; physical Lenovo/iPhone/Safari/controller testing remains unverified.

## Immediate continuation

The [new user brief](../DEVELOPMENT-PRIORITIES-2026-11-06.md), also in issue #2, now prioritises richer connected settlements and fade-transition furnished interiors with real walkable stairs. No separate interior has been implemented at this checkpoint. Finish committing this camera repair and continue directly into that work. No new preview archive is issued for only this small repair; Preview 08 and all previous packages remain frozen.
