# Neighborhood 03 — doors, touch and edge protection

[Open Neighborhood 03 on GitHub](https://github.com/novice-builder/object-builder/blob/codex/blockworld-playable-prototype/BlockWorld_Neighborhood_03.html), choose **Download raw file** (down arrow), then open the actual downloaded HTML in your browser. It is a standalone offline file. The GitHub source page does not run the game. 01 and 02 remain available unchanged.

## What's different

- **Automatic doors start ON.** Walk toward a house and its door swings away from you when that side is clear. Move clear and it closes after a short delay. It stays open while you're nearby or in the doorway. A returning player interrupts closing safely.
- You can still **tap a door or its gold button** to operate it manually, with or without a material selected. A manual close is not immediately undone by proximity: tap it open again, or step clear and approach again. **Menu → Automatic doors** switches automatic behavior on/off; enabling it resets a previous manual-close override.
- **Edge protection starts ON** and applies during ordinary walking, whether or not a material is selected. The small **shield / Edge on** button beside Undo and Jump toggles it immediately. ON stops walking off elevated platforms; **Jump deliberately** to leave one. OFF permits normal walking off edges. Your 03 choice is remembered.
- **Automatic climbing is removed.** Old climbing preferences cannot switch it back on. Use Jump to climb blocks.
- The **Hand slot is gone**. Tap a material to select it, and tap the selected material again to deselect it. With nothing selected, normal object interactions remain available. The hotbar stays horizontally scrollable. Long-press removal, Undo and furniture previews/rotation/confirmation remain.

The neighborhood, lighting, scenery, house layout and materials are preserved. The door leaves have a small functional hinge/clearance correction. The map has not expanded. Resource behavior is unchanged: common pieces remain unlimited and crafted decorations retain their existing counts. There is no new collection system or Creative mode.

## iPhone re-test checklist

1. Start without a material selected. Approach every house from outside, walk through, stay near the doorway and watch that it does not flap or close on you. Walk farther into the house, wait, then approach from inside and return through.
2. Step clear and wait for automatic closing. Return while a door is closing; it should stop closing/reopen safely. Place a piece in a potential swing path and verify that the door does not pass through it.
3. Switch Automatic Doors off. For each house, tap open, walk through, close, reopen and walk back. Repeat from the other side. Try the door panel and the gold button. Turn automatic operation back on.
4. Tap the centre, edges and corners of the visible menu buttons, hotbar items, Undo, Jump, the edge toggle and furniture/dialog buttons. Scrolling a list should not select something accidentally. Try portrait and landscape, and the same HTML-viewing app/browser used for the recording.
5. Build a small elevated platform. With **Edge on**, walk toward each edge with a material selected and deselected. Walking should stop before a fall; Jump while moving should deliberately leave it. Switch **Edge off** and walk off normally. Reopen the game and check the remembered setting.
6. Try jumping onto a block with the old auto-climb preference previously enabled. Walking alone should not raise the character. Check that Jump still works normally.
7. Select/deselect a material; place a block; hold it to remove it; Undo. Craft a bench, tap its spot, rotate its translucent preview, cancel once and then confirm. Check that bottom controls stay reachable.

Please report any remaining failure with the browser/HTML-viewer app name, orientation and approximate position/touch point. Automated mobile tests are not physical iPhone verification.

## Progress and settings

World persistence keeps the original browser save key and version-1 format. New control choices use a separate version-3 preferences key. The first 03 run defaults to edge protection and automatic doors ON; picture quality, hints and placement mode can carry over from 02. Later 03 on/off choices are remembered. Automatic climbing is ignored and cannot be re-enabled.

As before, browser/file origins affect persistence. Export a backup before changing file locations or switching older versions; 01 cannot preserve newer furniture orientation metadata. iPhone fullscreen and file-export limitations/fallbacks remain documented in [the 02 guide](INTERACTIONS_02.md). This update does not redesign saving.

## Development

From `neighborhood/`:

```sh
npm ci
npm run build
npm test
npm run test:browser
npm run serve
```

Build writes **BlockWorld_Neighborhood_03.html only**. The local server serves 03 at port 8080. A same-Wi-Fi computer server is an alternative preview if a file viewer will not execute local HTML; it requires the computer to remain available for reloads and is not an offline installation.

`test/reproduce-02.mjs` reproduces the previous release's failures for comparison. Current tests are `controls-03.test.mjs`, `controls-03-browser.mjs` and `file-input-03.mjs`, plus the original core regression tests. Old version-specific tests are retained as history; the 02 source corresponds to commit `602fe87`.
