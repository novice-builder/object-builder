# Neighborhood 02 verification — 27 October 2026

The approved visual neighborhood is retained. `BlockWorld_Neighborhood_01.html` is preserved byte-for-byte; its SHA-256 remains `f056eb09efe09b59c949805a3c467ea40f39fc209c5556733aad588e6c7c45c6`. The new standalone offline release is `BlockWorld_Neighborhood_02.html`.

## Completed

Permanent horizontal hotbar with Hand, immediate ordinary block placement, deliberate tap/hold/drag classification, long-press removal, Undo and optional crosshair controls. Furniture/decorations use their actual model as a translucent preview, 90°/15° rotation, explicit confirmation/cancel, inventory accounting and saved orientation. Auto-step and edge protection are independent, default-off options; Jump/manual movement remain. Door handling, menu feedback and iPhone fullscreen/export fallback were addressed. No map expansion or visual redesign was introduced.

## Door and touch investigation

The previous button workaround manually invoked click on touch release, but only suppressed a following click when it had `pointerType === 'touch'`. A Safari-style MouseEvent without `pointerType` could activate a button twice. A second failure was reproduced in mobile automation: after a world/button touch opened crafting, the synthesized click could hit a newly revealed recipe under the finger. That was caught because the test unexpectedly crafted a lantern immediately after opening the table.

The new handler consumes follow-up touch clicks even when the target changes, while preserving keyboard/mouse input and hotbar scrolling. World gestures also consume their follow-up click. The context button's children update only when its state changes, rather than every frame interval during a press. Regression tests cover these patterns. These reproductions establish real interaction bugs; they do not prove that they were the only cause of the owner's physical iPhone symptoms.

Door geometry remains attached to a vertical hinge and closed panels remain collidable. If the normal open position is occupied, an alternate opening direction is selected and remembered. Closing refuses to intersect the player or a placed piece; the user gets a clearance message. The implementation does not teleport the player through a door.

## Automated results

- **17 core tests passed:** original movement, collision, placement, history, save and geometry tests, plus 1 m auto-step limits/headroom, independent edge protection and deliberate descent, combined assists, door cycles on both sides of every house, alternate hinge clearance, rotated model bounds, save compatibility and touch click deduplication/retargeting.
- **18 browser scenarios passed:** real 01 save opened in 02; static world house/road/drive/collision data matched; permanent hotbar/Hand; direct placement; drag-only look; hold removal and Undo; empty-ground hold/cancellation; crafting and preview cancel; rotation, confirmation and save/reload; all-house door cycles and closed collision; direct panel/table taps; optional crosshair; three groups of hotbar/multi-touch, preview/confirmation layout and settings/fallback checks at **390×844, 844×390 and 1024×600**.
- Every house was opened, walked through, closed, checked as a closed obstruction, reopened and walked back through, starting from both sides. The browser scenario deliberately injected a follow-up MouseEvent without pointerType to verify single activation.
- Network was disabled before navigation; the exact release HTML was supplied locally. No external runtime assets were requested. No page errors occurred.
- The immutable 01 hash was checked after building. The build script now outputs 02 only.

Screenshots and raw scenario results are in `verification-02/`. Visual checks included Direct Touch layouts, the actual translucent bench model, its orientation and all preview controls in phone portrait/landscape and tablet layouts. A landscape overlap found during inspection was corrected. These checks are not the owner's visual approval.

## Settings audit

Performance previously appeared behind the modal; it now also appears inside it. Quality reports the selected state and explains a 1× screen where no resolution change occurs. Hints, placement mode and assistance toggles give visible status. Fullscreen reports unavailability/rejection. Export requests native file sharing where supported, otherwise offers download and selectable/copyable backup text. Import reports selection, validation and cancellation without replacing progress on an invalid file. Browser persistence uses the original key/schema with optional new fields; preference settings have a separate key.

## Limits of this evidence

Tests ran in Linux Chromium 154.0.8037.57 with ANGLE SwiftShader, using touch/mobile emulation and an iPhone user-agent for iPhone-specific fallbacks. Unsupported fullscreen/file-sharing/clipboard availability was simulated to test fallback messaging. This was **not physical iPhone Safari or Lenovo testing**. Native iOS share-sheet behavior, actual fullscreen capability, file opening, clipboard permissions, device frame rates and final control comfort still need the owner's device trial. No new device-performance claim is made.

Both files can use the same browser save slot when the origin permits it. Export before switching versions or locations: 01 does not understand 02's orientation metadata. No persistence-system redesign, larger world, companion, voice or unrelated feature was added.

Reproduce with `npm test` and `npm run test:browser` in `neighborhood/`. The historical 01 browser suite remains available as `npm run test:baseline`. Use [the 02 device checklist](INTERACTIONS_02.md) for the next iPhone trial; world expansion can follow once the controls are approved.
