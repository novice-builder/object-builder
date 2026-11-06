# BlockWorld Adventures — standing design direction and ongoing development authorisation

**Authoritative user follow-up; dated 6 November 2026.** This is a **living development brief** for the active Codex Cloud work, not an instruction to halt the current run, replace the repository, or finish after delivering one preview.

## Movement correction — automatic step climbing (user priority, 6 November 2026)

**Fix the current non-walkable stairs and invisible barriers before treating the stair feature as complete.** Add generic automatic step climbing to the existing player movement/character controller, rather than individually tagging stairs or retrofitting a collision ramp to every staircase.

- Set a sensible, tunable maximum step-up height (initial target approximately **0.30 m** in true game-world units, subject to checking actual avatar and stair scale). When a collidable obstacle is lower than that and a stable walkable surface is available beyond, the character should rise smoothly using ordinary forward movement. Taller ledges and walls must remain blocked.
- Verify sufficient clearance and a walkable landing; don't let step climbing climb walls, furniture, ceilings or traverse invalid geometry. Implement stable descent/ground snapping and prevent camera jitter.
- Use the collision geometry of imported building parts, including future Fusion 360 mesh imports, with appropriate simplification/performance optimization; do not assume all imported meshes come with working collision or navigation. Preserve openings, doorways, floors, landings and stair edges. Avoid a single oversized collider enclosing the staircase or building.
- Investigate the user's concrete Preview 10 observations: bottom stair clips through character; forward travel hits an invisible wall; even the space beside the stair is blocked. Identify the actual offending collision volumes, correct them, and validate with visible in-game tests instead of only passing unit tests.
- Test ascending/descending standard-height stairs, 15–25 cm steps, and a clearly taller blocking obstacle; test indoor and outdoor movement on keyboard, touch controls and Xbox controller mappings (emulate where hardware unavailable).
- Set **running as default movement speed**, with walking as an optional slower mode; make jumping available on touch/keyboard/controller without disrupting step climbing.
- Accept only after a player can enter a two-storey building, walk up the stairs, move around the upper floor, walk down and exit without collision barriers. Keep single-storey buildings single-storey inside.

This is an **implementation priority for the next safe coding checkpoint**; do not interrupt another writer or automatically publish a new website version.

## Immediate focus update — 6 November 2026: world expansion and fade-transition interiors

**NEW USER PRIORITY — overrides earlier plans where they would make door animation, extra building materials or more catalogue items the central task.**

1. **Spend the next productive development runs on expanding and populating the connected main world**, with multiple properly composed villages/towns, strong landmarks, connected roads/trails, varied density and interesting exploration. Avoid huge empty areas, poor scale, tree/road intersections and repetitive scenery. Continue expanding meaningfully once initial targets are complete.
2. **Make existing and newly placed houses/buildings enterable using a simple fade-to-interior transition** as the default. When the player approaches an appropriate entrance, show a clear, compact `Enter` prompt with keyboard, touch and Xbox-controller equivalents. On confirmation: fade out smoothly, transition to a separate matching 3D interior scene, then fade in. On exit: reverse the transition and place the player safely just outside the *same building*. Preserve the outdoor location and facing, and handle rapid taps, interrupted loads, cancelled transitions, locked/blocked exits and saving/reloading safely. No requirement to retrofit animated functional physical doors for every exterior prefab. Keep working physical doors where they already add value.
3. **Interiors should be genuinely usable spaces** with sensible sizes and architecture matching the exterior, appropriate pre-made furniture, navigation, collision and correct camera behaviour, not static cut-scenes. Favour reusable interior templates that can be tailored to building types (cottage, inn, shop, lodge, etc.) while each building has its own stable identity and separately persistent interior edits. Enter/exit should be quick, natural and reliable on mobile; load/suspend outdoor resources appropriately.
4. **Stairs must be WALKABLE**, not just decorative: any building with actual stairs and an upper accessible floor should support the player physically ascending/descending via ordinary movement, including multi-storey collision/step-height, landing clearance, camera collision, safe fall/respawn and upper-floor object interaction. Do not simulate walking upstairs solely by a teleport if navigable staircase geometry exists; use stairs/ramps or robust stepped collision for those transitions. Test on phone/tablet inputs and standard gamepad. Where a building has no actual upper floor, don't falsely claim a functioning stairwell.
5. **Do not spend the next runs on expanding the building-material catalogue**, additional block types, crafting/building inventory or decorative building supplies. Maintain and fix existing building/placement tools as needed for core gameplay, but postpone large catalogue additions unless essential to making interiors or world expansion functional. Seek useful free licensed pre-made houses, interior rooms, stairs, furniture and town assets instead.
6. Continue autonomous development with safe GitHub commits, regression tests and rendered screenshots: test entering multiple distinct houses, walking up/down stairs, furnished rooms, entering/exiting repeatedly, saving and reloading in an interior, returning to the correct exterior entrance, camera bounds, controller and touch behaviour. Preserve older releases and saves, avoid automatic deployment and do not overlap active writers.

**Priority order for immediate next coding milestones:** expand world and settlement quality; reliable fade entry/exit for buildings; furnished walkable interiors with functional stairs; scalability/UX/mobile performance; then other meaningful gameplay additions. These are ongoing development priorities, **not a stop condition**. Keep working after a milestone or preview ships within real usage/execution limits.

## 1. Merge the existing three environments into ONE connected main world
- Willowmere village, Whispering Wood, and Maker's Meadow are **regions of one continuous playable map**, not separate selections of the same art style.
- Build connected, believable traversable roads, trails, bridges and terrain transitions; let the player travel without switching saved-world records.
- Make the world richer, bigger, and more populated, with **multiple villages/towns**, some dense town centres, medium-density neighbourhoods, rural areas, forests and exploration destinations. Avoid vast empty regions while retaining some comfortable open countryside for building and travel.
- Ensure road connections, prop spacing, geometry, terrain and landmark placement are credible and visually inspected.
- Preserve Preview 01/02 existing save records and backups. Use a new versioned world layout or explicit migration, not silent destructive remapping.

## 2. World themes in the future must be genuinely different
Future selectable worlds should use visually distinct theme/era packages: modern city/suburbs, ancient civilizations, mythology/fantasy, medieval, island/pirate, future/sci-fi, etc. Do not call enlarged or reordered versions of the same style different worlds. Prioritise a highly polished integrated primary world first; then expand with genuinely different themed worlds when useful.

## 3. Live minimap and full navigation/teleport map
User supplied references showing an overhead game-world map and a small circular city minimap. **Use the images ONLY as interface style inspiration; never copy their pictured road/terrain/map geometry.** Build the map from real game geography.
- Small, readable live minimap showing player position, direction, roads/trails, terrain/buildings/water where appropriate, mobile/tablet-scaled.
- Tap minimap/map control to open attractive, uncluttered overhead world map, with touch zoom/pan.
- Tapping a handful of meaningful landmarks teleports safely to accessible, validated destinations. Include a Home option.
- Do not waste screen space with giant icon legends or long sidebars.

## 4. Visual quality and correctly scaled imported assets
- Continue the markedly improved premade-asset aesthetic and player motion.
- Correct the observed **tent smaller than player** and inspect door, house, furniture, path, bridge, tree and prop scales.
- Prevent floating objects, trees on paths, misaligned roads, impossible building overlaps and obstructed paths.
- Inspect actual browser screenshots and refine composition, lighting, camera and density before adding bulk assets.
- May autonomously search/download/import legally available free or CC0 premade houses, animals, vehicles, scenery, characters, animations and thematic kits. Record licence/attribution/source and do not bypass payment/authentication or download restrictions. Prefer style coherence over model count. Optimize textures, geometry, load time and draw calls for mobile.

## 5. Mobile & tablet controls must feel effortless
The primary target is a Lenovo Android tablet, with iPhone as an important second device.
- Make touch targets comfortably sized, responsive and legible, with overlays that do not block the scene.
- Refine virtual joystick, look/orbit, run, jump/interact, build/place/edit, selection, camera and map for portrait and landscape when supported.
- Handle multitouch, safe areas, orientation, modal opening/closing, pointer release, accidental taps and touch gesture conflicts.
- Prioritise player-tested usability rather than screenshots alone.

## 6. Xbox Bluetooth gamepad compatibility
Assess now whether adding browser **Gamepad API** support to the core unified input abstraction is cheaper/safer than retrofitting later.
- If it is easier now or a modest safe addition, implement Xbox Bluetooth controller support for compatible browser/device combinations: movement (left stick), look/camera (right stick), interact/confirm (A), back/cancel (B), map/menu, run and appropriate building controls. Offer an in-game controller mapping/help view and accessible touch fallback.
- Support connect/disconnect and detect controllers gracefully; do not let a disconnected gamepad trap the player.
- Use standard gamepad mapping where available. Do not claim hardware tests without a real Xbox controller; browser emulation is limited.
- If integration is comparably easy later or risks derailing immediate world consolidation, document the integration seam and defer it.

## 7. Continuous, open-ended productive development
**This project has no predefined feature-completion endpoint.** Complete each milestone, validate, commit/push/verify the remote checkpoint, update continuation notes, then **proceed immediately to the next high-value improvement in the SAME run** without user input. Do not stop merely because you shipped a package, passed tests, produced screenshots or finished a checklist.

After the merged world and maps work well, keep autonomously improving/exploring: more settlements, functional entrances/interiors, new themed worlds, more creative building tools, wildlife/NPC behaviour, transport, activities, player customisation, lighting and scenery, and robust mobile performance.

Use the available coding time productively; avoid token-burning, redundant test loops, unnecessary architecture rewrites and low-value feature count inflation. **Individual executions still obey real compute/time limits and account quota.** If blocked/limited, checkpoint and end that execution cleanly; the separate recurring automation will try again next hour. Do not claim an indefinite single execution or guaranteed uninterrupted work.

## 8. Preservation, safety and continuation
- Active repository: `novice-builder/object-builder`. Branch: `codex/blockworld-adventures-asset-rebuild`.
- Latest verified remote branch tip should always be rediscovered at each run (do not hardcode a stale SHA).
- One writer at a time; verify no conflicting task, lock the checkout and protect branch histories.
- Never overwrite old Preview 01/02 packages or existing source versions. New versioned builds and actual rendered screenshots.
- Preserve saved worlds and backups; keep old Run 3 public site, Neighborhood 06, `main`, live GitHub Pages and historical packages untouched.
- No automatic deployment, merge or banked reset redemption.
- Run focused regression checks, compiled browser tests, asset integrity checks and visual inspections. Distinguish software emulation from real device measurements.
- Each run should read this standing issue AND `blockworld2/docs/ASSET-REBUILD-CONTINUE.md`, incorporate this direction into the continuation doc **when the coding checkout is safely writable**, and push a verified resume point.
- The automated continuation is to remain scheduled **hourly until the user manually disables it**, with skips during quota exhaustion and no overlapping writers. Do not turn off the recurring automation upon completing a run.

**Summary:** A coherent large integrated world with dense villages, clean roads, interactive minimap and landmark teleportation; genuinely different future themed worlds; genuinely friendly mobile/tablet input; Xbox Bluetooth controller if economical now; continuous autonomous polishing and meaningful expansion with safe GitHub checkpoints.
