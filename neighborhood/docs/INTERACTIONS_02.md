# Neighborhood 02 — touch and interaction update

Use `BlockWorld_Neighborhood_02.html`. The approved `BlockWorld_Neighborhood_01.html` is preserved byte-for-byte. This update keeps the houses, roads, landscape, materials, lighting and overall visual style; it changes controls and interaction behavior.

[Open the new game file on GitHub](https://github.com/novice-builder/object-builder/blob/codex/blockworld-playable-prototype/BlockWorld_Neighborhood_02.html), choose **Download raw file** (down arrow), and open the downloaded HTML in your browser. The GitHub source page does not run the game. The file includes all runtime code/assets and needs no network. If iPhone's file viewer does not execute HTML, use the same local-network preview described below.

## Play

- The **hotbar is always available**. Swipe it horizontally for more pieces. Select **Hand** for normal interactions. Choose wood, brick, stone or glass and tap a nearby clear surface to place immediately. No Build Mode is required.
- **Drag** the world to look. Small finger jitter does not turn the camera. **Hold a player-built piece for about half a second** to put it away. A hold or cancelled gesture never becomes a placement on release. Houses remain protected.
- **Furniture and crafted decorations**: select one, tap its spot, inspect the translucent model, turn it with **90°** or **15°**, then tap the **tick** to place. Cancel discards the preview. Only confirmation consumes inventory. Tapping a different spot moves the preview. Orientation is saved.
- **Undo** remains beside Jump and reverses building operations. Jump and the original movement stick are preserved.
- Tap a **door or crafting table with Hand**, or use its contextual gold button. A door chooses the other hinge direction if its normal open position is occupied. Closing cannot pass through or trap the player in the doorway: step clear if prompted.

Direct Touch is the default. There is **no persistent yellow placement ghost or crosshair** in that mode. Menu → Placement switches to optional **Crosshair** controls: aim at the centre +, then use Place; furniture still requires preview confirmation.

## Optional movement assistance

Both settings default to off and are independent:

- **Auto-step:** walk onto player-built ordinary blocks up to 1 m high, provided there is headroom. It does not automatically climb doors, furniture, house walls or taller stacks. Jump still works.
- **Edge protection:** while holding a building piece, walking stops before losing support at a drop. **Jump or choose Hand** for intentional descent; keyboard Shift also bypasses the guard. With protection off, ordinary walking off edges is unchanged.

Control settings are remembered separately from world progress when browser storage is available.

## Settings and iPhone behavior

Every control reports its state/action in the visible status box near the top of the menu. Performance readings appear **inside the menu** as well as during play, so turning them on is immediately visible. On a 1× display, selecting Crisp may not change resolution; the status explains this.

Some iPhone browsers do not support fullscreen for a game canvas. Fullscreen then explains that limitation without interrupting play. Landscape remains usable. No fullscreen/PWA installation claim is made.

Export first uses the iPhone file-sharing API when available; otherwise it requests a download and exposes **backup text** with a Copy button. If clipboard access is unavailable, the text is selected for the device's Copy command. Opening/sharing/downloading a file is not treated as proof that the user saved it. Cancelling a share/import does not replace browser progress.

The browser save key and version-1 save format remain in place. Existing saves load; orientation and door direction are optional fields. File locations and browser origin rules can still affect persistence. Export a backup before moving files or alternating versions: 01 cannot preserve 02's new object-orientation metadata. This release does not replace the persistence system.

## Focused re-test on your iPhone

1. Swipe to a material, place several blocks, drag the camera, hold one to remove it, and Undo. Check that a tap does not turn the camera and a drag does not place/remove anything.
2. Craft a bench; tap its spot, rotate 90° and 15°, cancel once, then preview and confirm. Check that the final object matches its preview. Save/reopen and check its direction.
3. At **each of the four houses**, open the door, walk through, close it, walk toward the closed panel, reopen and return through. Repeat starting from the other side, including a close approach and a position beside the hinge. The closed door must remain solid.
4. Try auto-step alone, edge protection alone, both, and neither. With protection on, test intentional descent by Jump and by selecting Hand.
5. Check phone portrait and landscape. Toggle every menu setting; check fullscreen/export explanations and export a backup. Reopen offline where your browser supports local HTML.

Please report accidental taps, uncomfortable hold timing, camera sensitivity, any door position that still fails, and whether the furniture preview/control positions feel clear. Physical iPhone Safari and Lenovo behavior still require your device test; browser emulation is not device approval.

## Development and checks

From `neighborhood/`: `npm ci`, `npm run build`, `npm test`, `npm run test:browser`. Build produces **02 only**. `npm run test:baseline` exercises the archived 01 browser scenarios. `npm run serve` serves 02 at `http://YOUR-COMPUTER-IP:8080/` for a same-Wi-Fi trial; the computer must stay running for reloads, so that route is a preview rather than an offline installation.

The implementation separates world gestures, detailed object geometry and door operations into small modules. Preview and final furniture share the same model definition. The touch workaround suppresses synthesized click events even when Safari omits `pointerType` or a newly opened menu changes the target under the finger. The context button updates only when the interaction changes, so a press no longer targets repeatedly replaced contents.
