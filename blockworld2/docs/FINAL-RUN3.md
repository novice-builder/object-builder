# Run 3 delivery

Branch: codex/blockworld2-run3-expansion. Recommended clean source: [bf51e71b3b5849d08773bb9a8c3172de83646a1f](https://github.com/novice-builder/object-builder/commit/bf51e71b3b5849d08773bb9a8c3172de83646a1f). Build: 7bc2f55223fd5688. The final archive/report commit follows this source and is independently checked through GitHub before completion. [CONTINUE-RUN3.md](CONTINUE-RUN3.md) lists every verified stage checkpoint and exact continuation details.

Completed A–F: save/recovery/offline update protections; shared-codebase website/standalone packaging; separate versioned County; playable horse riding; persistent companion controls; utility car/bicycle fleet; connected airfield, usable interiors and guided passenger flight. Selected G enrichment adds four furnished trail rest stops. Existing templates, saved constructions, historical archives and prior branches remain protected. No live publication, hosting configuration, authentication repair, main merge or APK work was performed.

| Current content | Delivered |
| --- | --- |
| Authored County extent | 462 × 444.5 m inside 500 m ground |
| Travel | 430 m road ring, 1,584 m signed trail, river crossing, lakes/ranch/woodland/village |
| Buildings | 38 main buildings including terminal/hangar, plus ten road garages |
| Access/building | 48 doors, four staircases, 14 plots, 61 fixed map destinations plus four live entity destinations |
| Catalogue/avatar | 196 unlimited entries, 12 atomic presets, 12 original appearances retained from Run 2 |
| Life | 16 residents, nine animals/eight species, two rideable horses, companion dog |
| Transport | Buggy, cargo-bed runabout, bicycle, four moving traffic vehicles, one six-seat guided passenger aircraft |

Riding supports touch steering, reverse/turning, whole-horse/rider collision, safe dismount and saved positions. Dog controls Follow/Stay/Home navigate around obstructions and persist per world. All three road vehicles save independently and reload with the player safely beside them. The aircraft is genuinely boarded on foot through its ramp/cabin/aisle, with seating, first-person look, outside camera, a 94-second scenic trip and safe Use/Jump/map/Home/reload recovery. It is not piloting, taxi control or realistic flight dynamics. Player obstructions stop the guided tour without altering constructions.

Final validation: **107 deterministic tests passed; 43 browser scenarios passed, zero failures, one explicit managed-file-policy skip; strict TypeScript and production builds passed**. Native schemas 1/2/3, legacy import, failed/interrupted saves, recovery copies, stale-tab conflicts, independent worlds, real backup download/import, cold offline/update gating, original cache retention, original mechanical tests and all new gameplay are covered. Two clean builds match byte-for-byte. [RUN3-QA.md](RUN3-QA.md) and raw logs contain both final outcomes and earlier corrected failures; physical-device tests were not performed.

Downloads:

- [Website/PWA ZIP](../artifacts/run3/BlockWorld_2_Run3_Website.zip) — 249,388 bytes.
- [Standalone HTML](../artifacts/run3/BlockWorld_2_Run3_Standalone.html) — 845,411 bytes.
- [Build identity/checksums/instructions](../artifacts/run3) and [play guide](PLAY-RUN3.md).

The ZIP is deployment-ready; extract and serve locally with `python -m http.server 8080` from its folder. It needs no npm setup to play. Future tablet installation requires suitable HTTPS hosting, outside the old game's worker scope. Nothing is hosted by this run. Standalone embeds the same compiled game/CSS/assets and passes HTTP-origin gameplay/save/backup tests without other assets. Managed Chromium blocks file navigation before startup; reliable direct-file launch/persistence on Android/iPhone/Safari is unverified. Keep portable backups. [Distribution limitations](RUN3-DISTRIBUTION.md) describe exact tested scope.

Archive CRC, file hashes, clean source/build identity, exact tested website bytes and shared inline code passed. Foundation/Run 1 and all three Run 3 folders remain available; initial/preflight versions were never overwritten. Main, Neighborhood 06/root navigator/workers/Pages and previous branch heads remain unchanged. No player data or secrets are packaged.

Next: qualify the Lenovo and Safari/file-launch workflows, then improve town visits/idle activities and a connected inner/outer traffic network with some vehicles seeded near downtown. Refine bicycle rider/pedal presentation and physical-device performance. Extend taxi/hangar parking and runway departures before considering actual aircraft piloting. Keep template layout versions and remote checkpoints; the exact ordered brief is in CONTINUE-RUN3.md. This remains a substantial playable development preview, with further polish and device qualification required for a full content release.
