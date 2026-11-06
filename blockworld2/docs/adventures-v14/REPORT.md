# BlockWorld Adventures — Preview 14 development

Foxglade adds a woodland clearing, ranger’s cottage and a winding trail connecting Foresters’ Rest to the camp within the same continuous valley. Fresh worlds explicitly use outdoor layout **8**. Saved layouts 1–7 keep their previous scenery and constructions; the older independent regions are not reinterpreted. The cottage uses a reachable entrance and the existing separate furnished one-storey room, its own saved identity, touch fade entry/exit and exact exterior return.

A legally downloaded low-poly fox adds the authored **Survey** animation in the clearing. Its reference height is 0.62m beside the Explorer; it does not roam or use invented AI. The original 162,852-byte, 576-triangle GLB is retained at its pinned Khronos source revision. PixelMannen’s model is CC0; tomkranis’s rig/animation and AsoboStudio/scurest’s conversion are CC BY 4.0. This animated asset is **not wholly CC0**. Full attribution, source README, licence text, hashes and runtime modifications are retained in `public/adventures/wildlife/` and game credits. The blocked farm-animal source was not bypassed.

The colour texture is reduced from 1024×1024 to 256×256 at runtime, retaining original GLB bytes. This uses 16 times fewer colour texels; it is not a measured total GPU-memory claim. The model loads only for the new layout, is shared across switches and animates only while visible outdoors. Collider installation follows successful visible-model creation. Failed or late loads cannot leave an invisible barrier or spawn into a different world. Player constructions take priority over the wildlife site, including constructions added while spawn waits for the player to move.

## Verification and actual corrections

- **213 deterministic tests** pass, including pinned asset binary/licence/rig checks, new-layout validation, retained construction coordinates and continuous dry trail/map data.
- Phone/tablet browser checks walk every actual smoothed trail sample, tap the map label to travel, enter the ranger cottage, reload in its separately saved furnished room, and exit at the exact exterior and facing. The fox torso blocks ordinary movement without becoming a step. Actual screenshots were inspected.
- Independently extracted accepted Preview 13 produces the exact same layout-7 scene/model matrices, paths, obstacles, entrances, map and saved construction in the current runtime. Reloading that older world retains 52 model/image URLs and makes no fox request. Preview 13 safely rejects a new layout-8 backup without changing its records.
- Actual browser reproduction caught a deferred-spawn race with a newly placed barrel; placement is now checked immediately before spawning. Failed/delayed-load and scene-switch tests cover absence of invisible/late actors.
- Actual repeated switching exposed one leaked cloned-skeleton GPU bone texture per rebuild. Each owned skeleton is now disposed separately from shared template geometry/materials/colour texture; retained before/after resource evidence records the correction.

Current complete phase totals, strict build input/output hashes, preservation checks and measured resource results are in `summary.json`, `BUILD-RECEIPT.json`, `foxglade.json`, `fox-safety.json` and `fox-cost.json`. All older accepted preview evidence and archives remain frozen. No deployment, publishing, main merge, automation change or reset redemption occurred.

## Continuing work

This remains active development. Next tailor useful building-specific interior furnishing and activities, with actual navigation and loaded-model bounds; then continue coherent settlement composition and measured mobile rendering. Preserve old saved room contents rather than regenerating them. A new separately numbered local package can be created after the next meaningful milestone; Preview 13 remains the latest accepted packaged release until that package is independently extracted and checked.

Managed Chromium SwiftShader and phone/tablet emulation only. Physical Lenovo, iPhone, Safari, Xbox and Bluetooth testing remain **unverified**. No physical-device FPS claim. Extra fox Walk/Run clips are present in the source but are not gameplay behaviours. Arbitrary CAD-import UI and broader wildlife/NPC behaviour remain unfinished.

## Accepted local package

Runtime source **`9248b6fa360a93a34a3d1777e80c04b1b45ac67f`**. ZIP `artifacts/adventures-v14/BlockWorld-Adventures-Preview-14.zip`, **5,029,346 bytes**, SHA-256 `6a8af3ea331c66ca2f40118e05cb33614de8b2a6ce708bcb5c49a543167876dc`. All136 packaged runtime hashes, ZIP CRC and **37 actual extracted-package checks** pass. The packaged launcher was used on loopback with `--port5193`; its default is localhost:8014, preserving older address storage. Checks include ordinary stairs/compact turning flights, keyboard/touch/standard injected-gamepad Jump, native download/import/reload, older Preview13 layout refusal, lodge door, furniture floor transfer, ten-destination map, actual fox load/licences, ranger room and all six gallery images. No browser exceptions, missing files or external requests. Actual packaged phone screenshots were inspected. **213 deterministic/33 browser/37 package checks**, strict326-input/136-output receipt and1,074 protected files. Physical hardware unverified.

Freeze all v14 package/evidence after acceptance. Continue in NEW v15 paths; this package does not complete development.
