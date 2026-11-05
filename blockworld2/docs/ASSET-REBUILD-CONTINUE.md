# BlockWorld Adventures asset rebuild

Development only. Do not deploy, publish, merge into main, change the existing website repository, or overwrite historical packages. Branch `codex/blockworld-adventures-asset-rebuild` starts at verified Run 4 checkpoint `9f6c14be6b9821c2e6048dc75189338a1b0f9e54` (Run 3 plus the verified atomic-menu and save-ownership repairs). No uncommitted recovery work was imported. All changes remain within `blockworld2/`.

## In progress

Build a separate asset-scene entrypoint and versioned preview while retaining the validated original game, persistence store and regression suite. Prioritise one designed, explorable village with real premade models and animated character, mobile controls, collisions, local backups and rendered screenshot evidence. New scene saves use a separate database so existing worlds cannot be overwritten.

## Asset access

Seahill Towns and Wilds advertise CC0 complete packs; Quaternius Stylized Nature MegaKit advertises a CC0 free standard edition and paid additional editions. The execution environment blocks their download hosts. Do not circumvent that restriction. Investigating public GitHub mirrors/official CC0 alternatives and preserving exact source commits/licences. Do not claim inaccessible preferred assets were downloaded.

## Next

Finish verified asset inventory, assemble the village and character, then inspect actual browser renders before expanding. Commit and push tested milestones; verify each remote SHA. Keep continuation state and limitations current. Physical Lenovo/iPhone performance is unverified. Automation availability has been inspected; no continuation is scheduled yet.

## Implemented checkpoint (preview 01)

`adventures.html` is the separate local entrypoint. `npm run dev:adventures` serves it on port 5174. `npm run build:adventures` writes only ignored `adventures-dist/`; the original app/build/release tools are retained. Current scene code is under `src/adventures/`, using 71 inventoried CC0 research assets in `public/adventures/` (only a selected subset is requested at startup). Full provenance, source commits, retained animation names, CC0 texts and reproducible lossless GLB packing are adjacent to the models.

Willowmere has a connected street layout, market, well, inn, homes, windmill, brook crossing and woodland camp. Whispering Wood and Maker’s Meadow are distinct selectable scenes, each with independent saves. Explorer uses supplied Idle/Walking_A/Running_A clips with crossfades and smooth orientation changes. Prefab houses are exterior-only; no door or indoor feature is claimed. Building footprints, tree trunks, stream banks and bridge rails constrain walking; the following camera shortens before solid obstacles. Touch joystick, orbit, pinch zoom and running are implemented.

Building supports premade placement, selection, movement, rotation, removal and undo/redo with a 200-object limit. The new entrypoint reuses the existing `WorldStore` in **`blockworld-adventures-assets-v1`**, with a scene extension inside the existing native envelope. It never opens `blockworld2-development` or legacy localStorage. Its coordinator serializes transitions, flushes late edits before applying a read, retains checkpoints on failed writes, detects stale-tab conflicts, and imports only validated adventure backups as new records. Existing Run 4 Session source is unchanged.

Verification so far: all **115 deterministic tests pass**, including five new Adventures regressions; strict TypeScript and preservation/build pass. Initial rendered checks verify walk/run/idle transitions, a blocked tavern footprint, the bridge crossing and stream-bank exclusion. Full browser/mobile QA and screenshots are still in progress. First renders led to corrected tree scale/materials, paving UVs, path joins and bridge alignment. Complete rendered QA and package/report before claiming the milestone finished. Do not claim physical-device performance.
