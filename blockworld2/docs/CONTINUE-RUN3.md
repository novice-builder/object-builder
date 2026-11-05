# Run 3 continuation — development only

Active branch: `codex/blockworld2-run3-expansion`, based on the frozen Run 2 checkpoint `410e0f8c0d432a7466bee94bb8370f9a31922dd9`. Verify its current GitHub head before starting, then branch for the next run. Do not use the unrelated `assistant/sunbeam-expansion-plan` branch. Preserve main, previous branches/archives, Neighborhood 06/root navigator/workers/Pages and all saved progress. Do not publish, configure hosting, repair CLI authentication or merge main unless separately authorised. Git pushing through the supplied environment works; no CLI-auth repair was needed.

## Verified Run 3 checkpoints

| Milestone | GitHub source commit |
| --- | --- |
| Recovery/new Run 3 branch | 5b59718907c69937190802d3c305b945e62b6e02 |
| A: recovery/offline/update gating | 5969065cf23153e0f22367a13a7cc2a8176a4624 |
| B: same-codebase standalone/package tools | b2b11b3cbe6045ec0a382211cd6c2f10e51fc5b6 |
| Initial clean packages (preserve unchanged) | 296333e68d68a6648e7bac3bb675b2779dcfee52 |
| C: connected County layout 1 | 550904bc5a8ee44ee1b43225f90b78dcbf72e25f |
| D: riding/County layout 2 | e9dbacc94aef628f6b58500decbaf0686b41d42b |
| E: companion controls | ec03e6af27bfbdf7accda1031e298e0ae355659d |
| E: separate runabout/bicycle fleet | b879fef9e29a29c15be3aa4eb0eb120cba2d16f1 |
| F: airfield/passenger tour/County layout 3 | e19b9485e5934a6a560233b6ba305676e6a2ecac |

Final validation/package commits follow these milestones on the same branch. `artifacts/run3/BUILD.json` identifies the exact clean final source/build and package hashes. Never infer source identity from the later artifact commit; builds cannot embed their own future archive commit. Final execution evidence is in RUN3-QA.md. Initial/final Run 3 archives use different folders; foundation and Run 1 archives remain untouched. Run 2 had no final archive at handoff.

## What is complete

Run 3 A–F are implemented. Minor G enrichment consists of four furnished trail rest/picnic/bird-garden stops. No piloting, APK, live deployment or physical-device qualification was done. The README and RUN3 stage documents describe actual interactions and limits.

Latest County: 462 × 444.5 m authored extent (x −229…233, z −231…213.5), 500 m ground; 430 m road ring and 1,584 m trail; 38 main buildings including airport terminal/hangar, ten additional road garages, 48 doors, four staircases, 14 plots, 61 fixed destinations plus four live entity destinations. 196 unlimited catalogue entries, 12 atomic presets, 12 avatar appearances. Population: 16 residents, nine animals/eight species/two rideable horses, four lane-traffic vehicles, three independently parked player vehicles and one guided passenger aircraft.

Old Region layouts 1/2, County layouts 1/2, Town, Home/Square, blank and legacy remain selectable/resumable. New authored structures must use new template/layout versions. Never add permanent geometry in place to an already released layout or relocate player constructions. NPC/default vehicle relocation may seek nearby clear space around constructions; it never changes blocks.

## Important implementation details

- `world/templates.ts`: latest County layout 3, Region layout 2. `schema.ts` still writes native schema 3, reads 1/2/3, validates optional horse, pet and fleet state, and preserves explicit layout. Existing missing-layout migration is unchanged. Ground/player/flight/save coordinates remain within ±250 m; no streaming or unbounded-world implementation exists.
- `world/sunbeam-county.ts` composes unchanged Region 2. County 2 only moves the obstructing hitching rail. County 3 adds the airfield/rest stops; older instances retain their space. Both static colliders and authored prop arrays are combined, avoiding losses when `syncProps` refreshes the index.
- `simulation/riding.ts` owns oriented whole-horse/rider clearance, steering/substeps and safe dismount. `Activity.riding` excludes its own controlled collider. Save records a checked on-foot pose beside the horse; mount/dismount modes are transient. No horse jumping/stair controller exists. Three low gates intentionally omit the unusable low header; collision footprint only shrinks.
- `Activity` has bounded companion Follow/Stay/Home. Follow targets reachable standing space, never the occupied player centre. Distant companion ticks at 10 Hz; other far agents sleep. Local detours are bounded at 160 nodes. Sealed routes can cause waiting; there is no teleport-through-obstacles fallback. Home means the original Square dog habitat.
- County fleet has buggy/runabout/bicycle, live map targets and optional validated saved extras. `car`/`vehicle` getters refer to the selected vehicle; snapshot's `car` always stores the legacy buggy and `vehicles` stores extras. All parked vehicle colliders affect NPC/traffic/placement. Vehicle controls retain the existing simple flat-ground controller.
- `simulation/aircraft.ts`: procedural six-seat cabin/ramp/aisle; dynamic collision transforms with the plane. Guided 94-second tour at up to 18 m altitude; first-person free look and outside third-person camera. Use/Jump/map/Home return safely. Arrival is atomic; blocked routes return, fully blocked arrivals retain a holding passenger and recovery feedback. Save while flying stores the boarding pose, so reload is parked/on foot. This is not piloting, taxiing, flight dynamics or a realistic takeoff claim. History edits are disabled while a passenger to protect the parked boarding space on reload.
- `render/bake.ts` bakes direct opaque asset parts while keeping glass and animated groups. Existing 16 m cell batching, incremental 4 m build collision index, fixed three-light pool, local queries and paused-render suppression remain intact. No measured hardware FPS claim.
- The active `player/physics.js` remains the narrow audited fork of frozen 06: import paths, ramp base height and landing join only. Twenty frozen modules/provenance checks must remain unchanged. Original root/release/PWA checks protect 49 files and six historical archive files. Run 3 initial archive integrity must also remain unchanged versus 296333e.
- Saving: IndexedDB revision conflict checks, checksummed current/previous checkpoints, interrupted transaction retention, independent instances, backup/import copies, corruption recovery and closed-storage Save-as-copy. Errors retain memory/export and block update activation. Worker caches are scope-namespaced; no origin-wide storage/cache clearing. Only a save-gated explicit update reloads its own tab.

## Build, test and package

Node 22+; current environment Node 24.19.0, Chromium 154, Playwright 1.56.1, SwiftShader, touch 1024×600 with smaller layouts. `npm ci`, `npm run check`, `npm run test:browser`. Build emits `dist/` and `standalone/BlockWorld_2_Run3_Standalone.html` from the same compiled JS/CSS/assets. Build warns that its single JS bundle exceeds 500 kB; one bundle is intentional for the self-contained format, with no extra dependencies/assets. It is not a measured tablet-performance result.

After committing clean source, run `npm run build`; repeat once and compare all bytes if changing packaging. `python tools/package.py artifacts/NEW-FOLDER` refuses dirty/mismatched source and overwrites. It writes deterministic ZIP, standalone HTML, source/build/checksums/instructions. Archive validation includes ZIP CRC, release-manifest hashes and exact compiled bytes. Push artifacts and independently verify GitHub tree/blob IDs. Never overwrite any older package folder. No player data, secrets or credentials belong in archives.

Managed Chromium denies `file://` before app startup (`ERR_BLOCKED_BY_ADMINISTRATOR`); the file scenario is explicitly skipped, not passed. The exact standalone HTML served alone under localhost HTTP passes touch gameplay, worlds, save/reload and backup download/import without other game assets. This does not qualify file-origin IndexedDB, Android Downloads launch, Safari file-provider launch, or single-HTML HTTP-offline navigation. The primary PWA has separately tested cold offline and safe update behavior.

## Exact next useful work

1. Verify the latest remote Run 3 head, final BUILD.json/checksums and full QA record; create a new branch. Use existing installed dependencies/browser or `npm ci`, then reproduce the relevant baseline once. Continue remote checkpoints after every substantial feature; stop extensive work if push verification fails.
2. Physical Lenovo Chrome/PWA and iPhone Safari checks are outstanding: long multitouch play, indoor camera, horse mounting/dismount, bicycle/buggy controls, tour boarding/return, storage pressure/eviction, background/relaunch, update with multiple tabs, and actual download/open of the standalone HTML with backups. Do not label viewport emulation as hardware measurement.
3. Highest-value next implementation: improve living-town density/route variety while retaining a bounded population. County traffic currently uses a nine-node outer graph plus central spine, so the original downtown streets can be quiet. Connect an explicitly tested inner/outer lane graph, seed some vehicles near town, retain junction/right-of-way/headway and obstacle recovery protections. Improve pedestrian visits/idle activities and compound animal avoidance before increasing counts.
4. Add further purposeful activities/interior detail and richer original building silhouettes rather than inflating catalogue counts (the 190-item target is already exceeded). Keep doorways, furniture clearance, stairs, plots and old layout geometry protected.
5. Refine bicycle pedalling/rider alignment and vehicle visual/collider matching, then consider gentle ramps only with meaningful regression tests. The shared controller intentionally remains flat-ground and simple.
6. If extending aviation, add genuine ground taxi/hangar parking and runway departures before piloting. Player aircraft control needs bounded collision/landing/world loading/camera behavior and new acceptance tests. Do not turn the current guided tour into a piloting claim.
7. Rebuild versioned packages after validated changes, retaining all earlier artifacts. Hosting remains a separate user-authorised task; no permission/authentication research is needed for development.

Final-review note: artifacts/run3-preflight retains clean 8f0c146/build ba3d9d2a98044345 before a wide-hangar-door query correction. Use artifacts/run3 for the recommended final build. Game door neighbourhood queries now scale to leaf width; keep the off-centre closed-door and edge-obstruction browser regression. Earlier narrow-door thresholds are unchanged. One software-browser standalone button-stability timeout was observed during preflight and passed on a traced rerun; see final QA rather than assuming physical-device qualification.
