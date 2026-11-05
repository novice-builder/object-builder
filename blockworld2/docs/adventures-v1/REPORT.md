# BlockWorld Adventures — preview 01

Prepared 05 November 2026, 23:26 ACDT. Development branch: [codex/blockworld-adventures-asset-rebuild](https://github.com/novice-builder/object-builder/tree/codex/blockworld-adventures-asset-rebuild). **No deployment, publication, main merge or existing website edits were performed.**

The rebuild is playable through `adventures.html`. Willowmere is a designed village with premade cottage/market/inn/windmill architecture, connected paths, planted gardens, a brook crossing and woodland camp. Whispering Wood is a separate rolling pine-forest trail world; Maker’s Meadow is a separate construction area. Each has independent saved records. The original BlockWorld 2.0 entrypoint and useful existing systems remain available unchanged.

## Play and inspect

Unzip `BlockWorld-Adventures-Preview-01.zip`, run `python3 preview.py` (Windows: `py preview.py`), and open `http://localhost:8000/adventures.html`. No npm install or external asset/CDN requests are needed to play the package. ES modules and GLB fetches require HTTP; double-clicking the game HTML directly is not supported. See the included README for same-Wi-Fi tablet/iPhone access. The self-contained output gallery opens directly as an HTML file.

WASD/arrows walk, Shift runs, drag orbits, wheel/pinch zooms, E discovers and B opens Build. Touch uses a left joystick, a second thumb to orbit and a Run toggle. Build supports premade placement, selection, movement, 45-degree rotation, removal, undo and redo. Construction avoids existing footprints, water and public paths; the per-save limit is 200 user objects. Saved objects use reusable asset IDs, paths, scales and transforms from an extensible catalogue.

## Preservation and save integrity

The branch starts at verified Run 4 commit `9f6c14be6b9821c2e6048dc75189338a1b0f9e54`, containing the atomic-menu repair and verified save-ownership correction. No unfinished recovery edits were imported. The existing `Session` and `WorldStore` implementations remain unchanged.

The new scene coordinator reuses `WorldStore` with a separate IndexedDB database, `blockworld-adventures-assets-v1`. It never opens `blockworld2-development` or legacy localStorage. Transitions are serialized; late edits flush before applying a read. Failed saves retain memory and the original record; stale-tab conflicts block overwrites. Native checksummed envelopes retain previous checkpoints. Import validates the adventure extension before creating a new record. A recovered checkpoint does not silently replace the damaged original. Export and Save a new copy remain available, including a selectable text fallback when clipboard or file downloads are unavailable.

The root/Neighborhood 06 preservation check passes. All 25 selected root and historical archive files match the verified baseline byte-for-byte; detailed hashes are in `preservation.json`. Source main remains `1ffd35ed971afa7820734cf10a3287ab546f6306`; website main was observed at `fa78c3ee44f5dbd85f62527fa9c04b37d1fd1382` and was never written by this task. Existing Run 3 and Run 4 branches retain their original remote heads.

## Assets and provenance

71 selected CC0 assets total **4.48 MiB**. Runtime requests only the selected startup catalogue. Included: KayKit Medieval Hexagon buildings/props, KayKit Adventurers Rogue processed into Explorer, and Kenney Nature Kit GLBs from a CC0 mirror. `adventures/inventory.json` records individual byte counts, hashes, source IDs, triangle counts and mesh-local bounds. `adventures/PROVENANCE.md` records exact source commits, edition evidence and source-adjacent licence copies. The separate Source Assets archive preserves the original selected glTF/bin/png and untrimmed Rogue files; the reproducible packing script is included.

The author pages describe Seahill Towns Complete and Wilds Complete as CC0 name-your-price GLB packs, but the environment blocked their download host. Quaternius Stylized Nature MegaKit’s site was also blocked. Those archives are **not** represented as downloaded or included. Public author repositories and a documented CC0 Kenney mirror supplied the implemented substitutes; no restrictions or paid editions were bypassed. A Quaternius free Medieval Village mirror was downloaded for assessment and remains unused in this runtime.

Explorer retains 13 supplied clips; pruning unused animation buffers reduced it from 3,616,284 to 885,412 bytes. Walking, idle and running use real skeletal clips with crossfades. Controller orientation turns smoothly. The runtime retints named Kenney leaves, bark, grass and tent materials to match the village palette while retaining the original source files.

## Executed checks and actual renders

**116 deterministic tests pass; 37 distinct browser/render/interaction checks pass.** Strict TypeScript and the local production build pass. Raw unit, save-regression, build and browser evidence is included beside this report. The browser environment is managed Chromium with ANGLE/SwiftShader, not physical hardware or Safari.

The browser checks cover supplied idle/walk/run transitions, acceleration/stopping, blocked building footprints, following-camera shortening before the inn, blocked-spawn recovery, bridge traversal, stream exclusion, trail bank clearance, placement/undo/redo, save/reload, import-as-copy, malformed import rejection, nine world switches, tablet/phone control bounds, partial multitouch release, missing secure-context UUID support and clipboard-free backup text. New deterministic regressions exercise the real IndexedDB store for delayed-read ownership, quota-aborted transitions, recovery copies, stale-tab conflicts and import validation.

The gallery contains actual views of the village centre, street, entrance, bridge, forest, woodland world, meadow, opening screen, world selection and three mobile viewport configurations. Renders were inspected and corrected for tree scale, palette, paving UVs, gaps at path bends, bridge/road intersection, a wet-bank woodland segment, a path-obstructing camp log and header readability. Closed doors are shown honestly; no indoor screenshot is claimed.

## Profile and optimisation

| Measurement | Observed result / limit |
| --- | --- |
| Startup resources | 3,270,300 bytes, about 3.27 MB before server compression; local production origin |
| Model/scene preparation | Approximately 1.5 seconds in one desktop run; 4.1 seconds in a separate profile setup; excludes a real-network or physical-device guarantee |
| Village view | 182 draw calls and 195,464 rendered triangles in the profiled tablet-sized view |
| Texture estimate | Two 1024×1024 asset atlases, about 10.67 MiB as RGBA8 plus mipmaps; excludes framebuffer/shadow/procedural texture and driver allocations |
| Repeated switching | Nine switches; generated geometry counts settle within 58–80 and texture counts remain 10 in the measured gentle-quality sequence; bounded in this test, not proof against every possible leak |
| Emulated touch views | 1280×800 tablet; 390×844 portrait phone; 844×390 landscape phone; DPR 1 |
| Software frame samples | About 2 fps in both gentle and balanced samples; this software-rendered environment is slow and does not establish mobile hardware FPS |
| Physical devices / Safari | Unverified |

Optimisations include shared village atlas textures, reusable model geometry/materials, spatially grouped instanced vegetation, automatic frustum culling, removal of unused animation buffer ranges, four concurrent asset loads, bounded object/history limits, explicit scene buffer/material/texture/instance disposal, cached 1024-pixel scenery shadows and a cheap moving character contact shadow. Gentle mode removes shadows and caps DPR at 1; balanced caps DPR at 1.5; high caps DPR at 2. No geometry decimation or unnecessary texture loss was applied. No separate LOD system or texture/mesh codec is claimed.

## Remaining limitations and next priorities

- Physical Lenovo/iPhone and Safari performance is the main validation gap. Test cold loading, sustained walking/orbiting, thermal behaviour, storage/export and 20+ world switches on the actual devices before recommending graphics defaults.
- Prefab buildings are closed exteriors: no opening doors or accessible indoor scenes. The original game retains its existing door/interior systems.
- Collision uses simplified building footprints, tree trunks and an analytic bridge deck. The camera may still intersect foliage canopies; high-speed/edge-case collision and larger user constructions deserve more device testing.
- No dedicated authored turn clip is present; turning combines smooth orientation with supplied locomotion. No jumping interaction, vehicles, NPC life simulation, multiplayer or audio is claimed for the new entrypoint.
- Editing permanent scene pieces is unsupported. Asset catalogue buttons use symbols/text; rendered thumbnails and clearer selection highlighting would improve editing. Quality/run preferences reset on reload.
- Scene loading caches the startup catalogue. The environment has no streaming terrain or LOD system. Further mobile tuning should follow actual hardware measurements.
- Browser saves belong to their origin. Changing address/device requires backup export/import. No service worker or installable app was added, preserving the existing Neighborhood 06 setup.

## Resume

Fetch the development branch, read `docs/ASSET-REBUILD-CONTINUE.md`, check the remote tip and keep existing branches/releases untouched. Run `npm ci --cache /workspace/work/npm-cache`, then `npm run dev:adventures`. Use `npm run build:adventures`, `npm run test:adventures` and the QA scripts under `tools/adventures/`; do not run publishing/release helpers for the original app. Work on the next unfinished priority, checkpoint tests/renders in Git commits, push and verify the remote SHA. New packages must get new version names; never overwrite preview 01 or older releases. Do not deploy without explicit user approval. No banked usage reset was redeemed.
