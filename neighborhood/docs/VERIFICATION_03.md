# Neighborhood 03 — bug investigation and verification

27 October 2026. This release fixes existing gameplay and controls. The uploaded 21.9-second recording was reviewed across its duration. It shows repeated closed-door feedback without a successful passage. The recording alone cannot reveal the browser's event metadata; the following failures were separately reproduced against the immutable 02 HTML.

## Reproduced causes and corrections

**Door activation reversed itself.** In the 02 reproduction, a real touch changed the home door state to open. A subsequent MouseEvent click with neither pointerType nor detail changed it back to closed. The old suppression recognized some synthetic touch clicks, but missed this metadata-free case. That is consistent with the repeated closed-door feedback in the recording; it is not proof of the exact event sequence on the owner's phone. In 03 a handled touch consumes its compatibility click regardless of metadata. A new pointerdown or keyboard action starts a new intentional action, preserving mouse/keyboard input. Automatic doors also remove the child's dependence on hitting a control.

**A browser-targeted button release was rejected.** The 02 trace recorded a pointer release whose target was still BUTTON, at y=320.414, while the button's newly measured bottom was 319.094. Its press/feedback layout had moved. The handler's redundant rectangle check rejected it, then suppressed the native click, producing no action. The bottom-edge attempt increased the activation count by zero; the centre activated normally. In 03 the native pointer target is authoritative. The handler uses movement only to distinguish a tap from scrolling, not to redo hit-testing. Press feedback no longer translates the button. No positional touch offsets or button enlargement were used. Settings feedback also has its own layout area above the scrollable controls, eliminating an overlapping sticky layer.

**Protection was conditional rather than universal.** The 02 reproduction had protection enabled, Hand selected, and the player walked off a placed block to y=0. The old frame code explicitly disabled protection with Hand, and grounding could flicker around the collision skin at high frame rates. 03 applies protection independently of selection, defaults it ON, stabilizes support detection and checks four foot-support probes before accepting horizontal movement at a drop. Adjacent blocks can jointly support those probes, so seams remain walkable. Jump bypasses walking protection while airborne; OFF permits ordinary falls. The gameplay toggle controls the real movement rule and persists its choice.

**Instant climbing was in the movement solver.** The old blocked-movement branch assigned feet height to the block top. That branch and the UI option have been removed. Even an old caller supplying autoStep=true cannot trigger it; normal jumping remains.

## Door geometry and automatic operation

The former instant toggle checked the destination against player/build bounds only. For animation, checking just endpoints or an enlarged axis-aligned box would miss a mid-swing obstruction or falsely block the opening. 03 uses a thin oriented leaf collider, broad-phase bounds plus separating-axis overlap, and sweep samples no more than 0.02 radians apart against the player, placed pieces and fixed world solids.

The hinge was inset 7 cm into the existing opening and the leaf sized to fit it, clearing the jamb in both directions. The wall opening, facade, colors and props did not move. The collider shares the rendered leaf transform; tests compare closed, intermediate and fully open render bounds. The knob is a decorative part, not an enlarged collision wall.

Approach opens the door away from the player when that sweep is clear, otherwise it tries the other clear direction. Motion is continuous with a nominal 0.65-second swing in game time. Opening uses a 2.25 m proximity threshold; an open door remains held within 3.1 m. Leaving starts a 1.2-second close delay. This hysteresis prevents flapping. The sweep is checked again during motion: a returning player interrupts unsafe closing and the door reopens safely. A placed obstruction is not bypassed. Manual closing has a near-player override rather than being instantly undone by auto-open; leaving the area or explicitly enabling automatic mode resets it.

## Verification

- **20 core tests passed**, including prior movement/placement/save regressions; protection at 12.5–240 simulation steps per second, four directions and diagonals; platform seams, deliberate Jump and OFF; disabled auto-climb; oriented-box false-positive rejection; every house from both sides; safe closing, delay/hysteresis, manual mode/latch; exact rendered-leaf bounds; and a mid-swing obstacle with clear endpoints.
- **15 mobile browser scenarios** exercise 02 save compatibility, unchanged static neighborhood data, automatic and manual door cycles for every house inside/outside, intermediate animation states, safe return during closing, real Jump/walking, protection/deselection, persistence, direct building/removal/Undo, furniture confirmation and controls across mobile sizes.
- **864 real touch button-point activations** test centres, top/bottom/left/right edges and four visible rounded-corner interior points for enabled gameplay, hotbar, menu, crafting, preview and welcome buttons. Actions are isolated for these geometric checks; separate integration scenarios verify the actual behavior. No DOM .click() loop is substituted for touch input.
- **27 additional native file-picker activations** check the styled Import label at the same nine points in three viewports; cancellation leaves the world unchanged.
- Viewports: **390×844, 844×390 and 428×760**. The last includes DPR 3 and a scaled menu container to test coordinate/layout assumptions. Touch capture/scrolling is exercised. Preview controls are checked not to cover gameplay controls.
- Network is disabled before the main browser navigation. Only the locally supplied document is requested; the renderer/assets are inline. No external runtime assets or page errors are expected in the successful run.

The raw results, reproduction trace and screenshots are stored in `verification-03/`. The release hash in the raw result identifies the tested HTML. Immutable 01/02 hashes are checked separately before delivery.

## Limits and next device test

These are Linux Chromium 154.0.8037.57 / ANGLE SwiftShader tests using mobile touch, scaling and browser automation. They are **not actual iPhone Safari/WKWebView or Lenovo verification**, visual approval, native-device performance measurements or proof of a particular HTML-viewer's implementation. The source recording provided real failure evidence; it was not a successful 03 test. Use [the focused iPhone checklist](CONTROLS_03.md) to verify this release in the same viewing app/browser.

The neighborhood layout, materials and resource behavior remain. There is no map expansion, new resource system, Creative mode, companion or unrelated feature in this release. 01 and 02 remain byte-for-byte unchanged.
