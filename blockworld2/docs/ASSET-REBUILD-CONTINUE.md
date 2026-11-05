# BlockWorld Adventures — continuation checkpoint

Work only on `codex/blockworld-adventures-asset-rebuild` in `novice-builder/object-builder`. Do not deploy, publish, merge main, modify the separate website repo, overwrite old branches/packages, or change Neighborhood 06. Start by fetching and checking the remote SHA. Do not overlap another active writer. The source base is verified Run 4 commit `9f6c14be6b9821c2e6048dc75189338a1b0f9e54` (Run 3 plus verified menu and save-ownership repairs); no unfinished recovery edits were imported.

## Completed and verified

The separate `adventures.html` entrypoint implements Willowmere village, Whispering Wood and Maker’s Meadow, with premade KayKit/Kenney CC0 models, a real rigged Explorer, idle/walk/run crossfades, smooth controller orientation, third-person camera collision, building/trunk/water collision, spawn recovery, touch joystick/orbit/pinch/run controls, discoverable landmarks and a minimal responsive interface.

Imported asset definitions and transforms live under `src/adventures/`. Building supports placement, selection, movement, rotation, removal, undo and redo with a 200-object per-world limit. Native `WorldStore` is reused in separate database `blockworld-adventures-assets-v1`; the old database/localStorage and Run 4 Session source are unchanged. Serialized transitions retain late edits before applying reads. Checksum checkpoints, failed-write protection, stale-tab conflict detection, export/import-as-new-copy, recovery copies and clipboard-free backup text are implemented. A cryptographic UUID fallback supports LAN HTTP where `randomUUID` is unavailable.

**116 deterministic tests and 37 distinct rendered/interaction checks pass.** Strict TypeScript, preservation and production build pass. Actual screenshots cover village centre, residential lane, entrance, bridge, forest, woodland, meadow, welcome, world selection, tablet and phone orientations. Physical Lenovo/iPhone/Safari performance is unverified. Managed Chromium uses software rendering and profiles at about 2 fps; this must not be presented as hardware performance or a successful mobile FPS target. Startup requests total 3.27 MB before compression; two 1024px asset atlases estimate 10.67 MiB RGBA8+mips excluding buffers/shadow/driver allocations. Nine scene switches retain bounded geometry/texture counts in the recorded probe.

71 inventoried models total 4.48 MiB; startup uses a smaller selected subset. Full licences, source commits, hashes and processing scripts are in `public/adventures/`. Seahill and Quaternius Nature downloads were host-blocked and are not included. `artifacts/adventures-v1/BlockWorld-Adventures-Source-Assets-01.zip` preserves exact original selected CC0 files separately. Do not bypass restrictions or imply inaccessible editions were verified/downloaded.

Preview 01 is packaged under `artifacts/adventures-v1/`; `BUILD.json` records its source SHA. Do not overwrite this folder on continuation—use a new version. `docs/adventures-v1/REPORT.md`, `gallery.html`, `qa-results.json`, `profile.json`, raw logs, screenshots and `preservation.json` contain evidence and limitations. All root/Neighborhood 06 files and historical archives retain their original contents. The public website was never written or deployed.

## Resume commands

From `blockworld2/`:

```
npm ci --cache /workspace/work/npm-cache --no-audit --no-fund
npm run dev:adventures
# Open /adventures.html; the original app remains at its original entrypoint.
npm run test:adventures
npm run build:adventures
```

Build output is ignored `adventures-dist/`. Serve that directory locally (for example `python -m http.server 5175 --bind 127.0.0.1 --directory adventures-dist`) and run `ADVENTURES_QA_URL=http://127.0.0.1:5175 python tools/adventures/qa.py`, then the focused `visual-final.py` and `profile.py` scripts. The profile/focused scripts currently use port 5175. `report.py` regenerates the report/gallery from evidence. `package.py --output <NEW-VERSION-DIRECTORY>` packages a validated build and refuses to overwrite a versioned archive. Avoid the original app’s release/publish helpers.

## Next unfinished priorities

1. Physical Lenovo tablet and iPhone/Safari testing: cold load, sustained movement/orbit, thermal stability, storage/backups, 20+ scene switches. Use actual measurements to choose graphics/material/culling defaults. The available execution environment cannot establish these results.
2. Improve the woodland/countryside art direction with grounded plants, connected softer trails, intentional clearings and better distant landscape transitions; inspect actual renders after changes. Keep paths/banks clear.
3. Add better catalogue thumbnails and selection highlighting, then persistent control/quality preferences. Re-test editor collisions, undo and mobile multi-touch.
4. Investigate suitable CC0 open modular interiors/doors. Existing village prefabs are closed exterior models; do not claim indoor access until it exists and has been rendered/tested. Original game interiors remain available in the original entrypoint.
5. Camera canopy collisions, analytic bridge contact and coarse footprint edge cases need further scrutiny. No authored turn clip, dedicated LOD/streaming terrain, NPC simulation, audio, vehicles or multiplayer is claimed for this entrypoint.

Checkpoint real improvements with appropriate tests/renders, commit, push and independently verify the remote SHA. Keep this document current. No banked usage reset was redeemed. The exact next usage-reset time is not exposed; any five-hour continuation is a scheduled attempt, not a claim about allowance or execution success. Check the accompanying continuation-schedule record for confirmed scheduling state.

## Confirmed scheduling state

The native scheduling service confirmed an enabled **one-time continuation attempt at 04:27:53 ACDT on 6 November 2026** (`2026-11-05T17:57:53Z`). It preserves the current thread and requests inherited environment selection; returned environment details and next-run-time fields were null. This confirms scheduling, not a successful future run or known allowance-reset time. The prompt requires checking GitHub and skipping overlapping writers. No other project continuation was created, and no banked reset was redeemed. Machine-readable evidence: `docs/adventures-v1/continuation-schedule.json`.

## Continuation run — scenery milestone

Resumed from remote `b15a4f356e9bbd3c44de9af1cd6fdf0cfa24b14f`, with a clean worktree, no other active agent/checkout writer observed, and an exclusive local `flock` held for this run. Remote movement must stop a push rather than overwrite another writer. No deployment, main/website edits or allowance redemption occurred.

New worlds now carry optional Adventures `layout: 2`; missing/1 retains preview 01 scenery. Layout is inside the existing adventure extension, with no native store/schema change. New layouts add smooth earth trails, planted clearings, bank reeds, subtle tree colour variation and distant terrain beyond the walk boundary. Old record geometry/collision/path/object fingerprints match the extracted preview-01 runtime in all three scenes. Fresh copies get distinct names without renaming old records. Tests and real before/after renders are under `docs/adventures-v2/`: 10 focused deterministic tests and 12 art/compatibility browser checks pass, plus strict build/preservation. Preview 01 archives and its evidence stay unchanged. Preview 02 packaging and editor improvements are the next active work; do not represent them as finished from this milestone alone.
