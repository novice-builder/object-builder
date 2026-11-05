BlockWorld Adventures — Development Preview 02

Unzip into a new folder. Run `python3 preview.py` (Windows: `py preview.py`).
Open http://localhost:8000/adventures.html . Opening the HTML directly as a file is unsupported because the app loads ES modules and GLBs.

All models, images, animations, code and licences are local. Nothing is deployed by this package. No accounts, CDN downloads or purchases are needed.

WASD/arrows walk; Shift runs; drag to orbit; wheel/pinch zooms; E discovers; B opens Build; Escape closes a menu. Touch uses a left joystick, another thumb to orbit and a Run toggle. Graphics and Run choices persist separately from world saves. Build shows real model thumbnails and filters. Walk to a clear spot, rotate and place. Tap your own object for its outline, move, rotate or remove. Undo and redo are in the menu. The limit is 200 objects; existing objects can still move at that limit.

Willowmere, Whispering Wood and Maker’s Meadow have independent records. Existing preview-01 saves retain their old layout and objects. Places > Start a fresh place creates the new scenery while preserving old records. Do not open new-layout backups in Preview 01: that older program cannot render new scenery. Use this matching package for new saves. Export backups before changing browser, address or device. Import creates a new record. Failed writes and stale-tab conflicts preserve the original and in-memory work; export or Save a new copy to recover.

To test on a tablet/iPhone on the same Wi-Fi, run `python3 preview.py --lan`, then open http://YOUR-COMPUTER-LAN-IP:8000/adventures.html . Cryptographic UUID and selectable backup-text fallbacks support restricted browser APIs. Physical Lenovo, iPhone and Safari performance remains UNVERIFIED.

Village houses are closed exterior prefabs with no opening doors/interiors. Real supplied idle, walk and run clips blend with smooth orientation; no dedicated turn clip is claimed. Collision uses simplified footprints/trunks and a bridge profile. The camera has close-wall/corner protection; foliage canopy collisions still need work. No NPC simulation, audio, vehicles, multiplayer or installed/offline service worker is claimed for this entrypoint.

Open gallery.html for actual rendered views and the before/after comparison. Read review/REPORT.md, review/summary.json and profile files for checks/measurements/limitations. Asset provenance/licences: adventures/PROVENANCE.md and adventures/licences. Original selected CC0 source assets remain separately archived in the branch's preview-01 Source Assets archive. Source: https://github.com/novice-builder/object-builder/tree/codex/blockworld-adventures-asset-rebuild . The original website, Neighborhood 06 and historical packages are unchanged.
