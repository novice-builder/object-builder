BlockWorld Adventures — Preview 01 (development only)

1. Unzip this package into a new folder.
2. Run: python3 preview.py   (on Windows: py preview.py)
3. Open http://localhost:8000/adventures.html in a current browser.

Everything is local: models, animations, textures, code and licences. There are no CDN requests, accounts or purchases. A web server is required; opening adventures.html as a file will not load ES modules/GLBs in most browsers.

Desktop: WASD/arrows walk; Shift runs; drag orbits; wheel zooms; E discovers; B opens Build; Escape opens/closes menu. Touch: left joystick walks; drag the world with the other thumb to orbit; pinch the world to zoom; Run toggles speed. Build chooses a premade object; walk to a clear spot, Rotate and Place. Tap your own object to move/turn/remove it. Undo/redo are in the menu.

Places contains Willowmere village, Whispering Wood and Maker’s Meadow. Each place has a separate saved record. Saves use a new IndexedDB name and never open the original game's database. Export backups before moving the preview to a different browser, server address or device; browser saves belong to that origin. Imports create new records. If storage fails, export the in-memory work or use Save a new copy. No destructive reset/delete control is included.

Tablet/iPhone on the same Wi-Fi as your computer: run `python3 preview.py --lan`, then open http://YOUR-COMPUTER-LAN-IP:8000/adventures.html. Physical-device performance and Safari are unverified. The preview includes a UUID fallback for local network HTTP and a selectable backup-text fallback when clipboard access is unavailable. Physical-device results remain unverified.

The village buildings are closed exterior models. No interiors or opening doors are implemented. Turning blends real supplied locomotion with smooth controller orientation; no dedicated turn clip is claimed. Shadows are cached for scenery with a soft moving contact shadow under the character. Collision uses simplified footprints/trunks and an analytic bridge deck. Grass/flowers have no collision. No multiplayer, vehicle system, audio or service-worker installation is included in this preview.

Gallery and report: open gallery.html. Asset licences/provenance: adventures/PROVENANCE.md and adventures/licences/. Source: https://github.com/novice-builder/object-builder/tree/codex/blockworld-adventures-asset-rebuild/blockworld2 . This package is not a published deployment. The original public website and Neighborhood 06 are unchanged.
