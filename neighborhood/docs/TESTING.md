# Family play test: Lenovo Android tablet

The game is a first neighborhood prototype. The owner has not approved its appearance or measured it on the actual tablet. Cloud browser tests cannot establish Lenovo, iPhone or Bluetooth-controller performance.

## Start with a five-minute trial

1. Download `BlockWorld_Neighborhood_01.html` to the tablet. It is a self-contained file, about half a megabyte. Open the actual downloaded file in a recent Chrome browser, ideally landscape. A file manager's text/HTML preview is not the game.
2. Tap **Let’s play**. The round control at lower left moves you. Push upward to walk toward the cream house with the teal roof. Drag the sky/world to look around. The up arrow jumps. No reading or typing is needed for normal play.
3. Walk toward the front door until the gold door button appears; tap it. Walk inside. The checkered crafting table is on the right. Near it, tap the gold table button.
4. Choose a flower, lantern or bench picture. Go outside to the clear garden next to the house. The hammer button shows building choices. The selected item has a yellow outline. Aim down at the ground and tap **+**, or tap a nearby ground surface. A pale yellow ghost means valid placement; red means find a clear/nearby supported space. Nothing places over the player or house.
5. Choose wood/brick/stone/glass for unlimited blocks. Stack a few. Aim at your own piece and use **−** to put it away. **↶** undoes your last building step. Crafted items return to inventory when removed. Fixed houses and roads cannot be broken in this prototype.
6. Use the home picture if you get lost. Use the menu → **Export save** to keep a portable backup, even if the top label says Saved. Close and reopen the game and check progress. Import the JSON if needed.
7. Turn on airplane mode and reopen the downloaded HTML. Repeat movement, building and crafting. The HTML needs no Internet at runtime. Record whether your Android/browser/file-manager combination actually opens and saves local files reliably.

## If local HTML won't open

Android file managers differ. Some open Downloads with a restricted preview rather than Chrome. Do not interpret seeing source text or a blocked local file as a game graphics/performance result.

For a first gameplay test, serve the same HTML from a computer on the same trusted Wi-Fi:

```sh
cd object-builder/neighborhood
npm ci
npm run build
npm run serve
```

Open `http://YOUR-COMPUTER-LAN-IP:8080/` in Chrome on the tablet. Allow the local-network port in your computer firewall if it prompts. The computer must remain running for page loads; this method is a preview, not an offline installation. The page makes no external requests once loaded. Stop the server after the trial. Export/import saves when moving between LAN and local-file play, because their storage origins differ.

If your tablet cannot execute the downloaded HTML directly, the next delivery task is an Android-friendly installable package (or HTTPS-installed PWA), chosen after confirming the tablet model. No APK/PWA has been built or installation-tested in this milestone. Do not rely on a LAN page being available after closing it in airplane mode.

## Controls and things to notice

- Up on the stick should move forward in the direction you face. Drag right should look right; drag up should look up. Try walking and looking at the same time. Releasing/canceling a touch should stop motion.
- Try portrait and landscape, especially with the tablet's navigation bar visible. Buttons should remain reachable; record overlap or accidental camera movement.
- Open each house door. Check windows/roofs from front, back and inside. Are the houses pleasant and understandable? Are there visual gaps, floating objects or confusing repeated shapes?
- Building is limited to 800 pieces, a roughly 62 m play area, ten block layers, and nearby supported cells. There is no mining, combat, companion, learning task, day/night cycle or vehicle yet. The lantern is decorative. Crafted objects conservatively collide as a whole cell.
- Open the menu while moving; movement should pause. Return to play without a stuck joystick. Leave the browser and come back; controls should be released.
- Start a new session with an empty browser save or a separate browser profile only if desired. There is deliberately no easy “delete world” button for a child to press by mistake. Export before clearing browser data.

## Performance recording

Menu → **Performance** shows FPS, recent p95 frame interval, draw calls, triangles, geometries, texture count, last placed-mesh rebuild time, first rendered frame time and JS heap where supported. Heap is not total RAM/GPU use. “Gentle” quality caps pixel ratio at 1 and uses no shadow maps; “crisp” allows 1.5. Diagnostics are local and send no telemetry.

Record an empty-neighborhood reading after 10 seconds, then another with a small wall/garden. Try at least 10 minutes for warmth, stutters, browser reloads and battery behavior. There is no required frame-rate claim. The first-frame metric starts at game script execution and excludes download/browser startup time.

Please send:

- Lenovo model, Android version, Chrome version and orientation.
- How the file was opened: local Chrome, Files preview or LAN URL.
- Whether he could move, enter home, craft and place a piece with little help.
- Whether the stick/look speed/buttons felt comfortable; what he tried to do next.
- Any screenshot of an architectural/UI issue, the performance overlay, and save/reopen/airplane-mode results.

This feedback decides the next small change: controls/performance fixes first, then one friendly companion and simple home interaction.
