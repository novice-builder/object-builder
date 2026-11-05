# Playing the Run 3 preview

Download the website ZIP from artifacts/run3, extract it, enter `BlockWorld_2_Run3_Website` and run `python -m http.server 8080`. Open http://localhost:8080 in the same computer's browser. This prebuilt package needs no npm installation. It is a local development preview, not a published site. Future tablet installation needs suitable HTTPS hosting outside the old game's worker scope; no hosting was performed in this run.

The standalone HTML embeds the same game and can also be reviewed from a local HTTP server. Opening the downloaded file directly depends on device/browser policy and storage support; this environment blocks file navigation, so reliable file-origin saving is unverified. Keep exported backups when testing it. See RUN3-DISTRIBUTION.md.

- Move with the large joystick. Drag the world with another finger to look. The person picture switches cameras; wings enable creative flight and show up/down buttons. Home returns to a checked starting space.
- Open the map and choose **Meadow ranch paddock**. Walk beside the horse and tap the horse/Use picture. Joystick forward/back moves; left/right turns. Follow the country trail. Use again dismounts; blocked exits retain the rider. Reload resumes on foot beside the saved horse.
- Map **Your dog**, walk beside it and use the dog to choose **🐾 Follow**, **✋ Stay** or **⌂ Home**. It walks around obstacles and may take time to catch up after a long teleport. Home means its familiar Square habitat.
- Map **Buggy**, **Ranch runabout** or **Village bicycle**, walk alongside and use the vehicle. All share joystick driving and Use exit. Saved reload leaves it parked and the player beside it.
- Map **Airfield terminal** to explore its waiting room, or **Airfield hangar** to open the wide roller. At **Aircraft boarding ramp**, walk up the ramp and into the cabin's centre aisle toward the front seats. Use the airplane picture for a scenic passenger tour. First person looks through the cabin windows; third person shows the outside aircraft. Use/Jump, Home or map return safely. This is a guided passenger flight, not piloting.
- Open the building catalogue, choose a picture, tap a place, rotate/raise/lower and confirm. All 196 items and 12 presets are unlimited. Favourites, recent choices and eight pinned hotbar slots help browsing. Move repositions objects you built. Hold removes; Undo/Redo reverses edits. Building/history editing waits until leaving a passenger flight.
- Use chairs/sofas/benches, lights, cupboards and playground objects through the contextual picture. Walking or Use leaves seating/play. Furniture clearance and recovery checks keep interactions forgiving.
- Open Worlds to create independent instances, resume, rename, duplicate, export or import a backup copy. Older Region/County layouts keep their original geometry and constructions. New County instances have the airport and trail stops; old instances are deliberately not overwritten.

Wait for the offline-ready feedback before relying on the PWA cache. Saves remain on this browser/device; exported backups are the portable copy. If saving fails, keep the page open and use export or Save as new copy. Updates are explicit and disabled while saving is blocked. A browser clear/eviction can remove local data, so retain backups before changing origins or moving a standalone file. Neither the app nor its update process clears Neighborhood 06 storage.

Physical Lenovo/iPhone and Safari/local-file tests remain outstanding. The checked desktop Chromium viewport and touch scenarios are recorded in RUN3-QA.md.
