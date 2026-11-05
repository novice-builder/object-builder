# Exact continuation after Run 1

Repository: novice-builder/object-builder. Fetch `codex/blockworld2-r1b-expansion` and verify its head through GitHub before creating a new Run 2 branch. The final `artifacts/run1/BUILD.json` identifies the clean tested source commit, build identity and archive digest. Never replace the historical foundation archive.

## Preserved checkpoints

| Milestone | Verified commit |
| --- | --- |
| Foundation base | fefc37af077a657130b5aa289820210771cb4587 |
| A: isolated preview package/publishing fallback | c901ac8f18a778bc7c1c206ac671ae8df3570222 |
| B: mobile object relocation/history | ecbb127800b7ec4295b9b0911425b27232f06713 |
| C: 111 entries and four presets | 6e9845a68c8b3e1c9eeaa0b4a2ec792578c5dc91 |
| D: separate Sunbeam Town template | 9d91fc16ae309bcc0276ed3a310c25163d0d6c3b |
| E: routes/animals/traffic spacing/seating | 0166e7d19e0f0058789de8fbc7da058ee47d1274 |
| Integration: real surface heights/compound door collision | aa39046cc7fea9d8c0d08504ce78bdf86688cc68 |

Final QA/source and archive checkpoints follow these commits on the same branch. Inspect the latest GitHub history rather than assuming the table is the branch head.

## First: make the isolated test app accessible

Publication was blocked: the connector has no create-repository/Pages administration actions and `gh auth status` reports invalid injected authentication. No preview site exists as a result of this run. Use a properly authenticated environment; never inspect or print injected secrets. Follow PREVIEW.md and the guarded `tools/publish-preview.mjs --publish-test-preview` command. It only targets `novice-builder/blockworld-2-preview`, uses a non-force push and must not be redirected to object-builder.

Verify the actual returned HTTPS URL, release.json source/build identity, exact worker/manifest scope, icons, local saves and a cold offline launch before reporting publication. For later updates, clone the preview gh-pages branch and commit the new dist files to preserve its history. The helper intentionally refuses to force-replace an existing branch.

## Qualification and next implementation work

1. Run `npm ci`, `npm run check`, `npm run test:browser` from blockworld2. Keep all changes inside the package. `npm run preserve` compares all 49 original repository files; provenance tests compare all 20 frozen upstream modules and the precise elevated-ramp fork.
2. On a physical Lenovo Android tablet, qualify movement/look multitouch, catalogue scrolling/favourites/presets, move/rotate/remove/history, all camera/flight modes, doors/seats, driving/exiting, map travel, saves/backups and cold offline startup. Qualify iPhone/Safari separately. Record measured frame rate, memory and long-session save behavior; cloud Chromium/SwiftShader is not a substitute.
3. Add clear offline-ready/update feedback and a safe explicit update path. Existing workers wait for old clients to close, preserve previous caches and never clear IndexedDB. Add measured cache retention and browser persistent-storage handling without touching origin-wide or Neighborhood 06 data.
4. Expand 111 curated entries toward 190 with meaningful new geometry and tested use: remaining household/structural/garage/play objects and useful building presets. Avoid counting presets or colour changes as distinct mesh families. Improve placement ergonomics for large objects and elevated building. Preserve native schema 1 imports, schema 2 states and original legacy JSON bytes.
5. Expand interactive activities and destinations: functioning play equipment, richer resident/animal routines, navigation around obstacles and real traffic junction decisions. Current traffic is a bounded perimeter loop, horse riding is absent and most play equipment is decorative. Town buildings are single-storey; no airport, aircraft, swimming or full 320 m R1 world is delivered.

The existing foundation branch stays at fefc37af077a657130b5aa289820210771cb4587 and main at 1ffd35ed971afa7820734cf10a3287ab546f6306. Keep frequent pushed checkpoints and verify every remote SHA. No production publication, main merge, old save migration-in-place or existing Pages/service-worker change is authorised.
