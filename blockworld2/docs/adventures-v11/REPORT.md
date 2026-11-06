# BlockWorld Adventures — Preview 11 movement and room corrections

Preview 11 repairs the user's Preview 10 stair barriers, adds default running and Jump, and introduces single-storey new cottages while retaining every saved older upper floor. Exact packaged runtime source is recorded in the new archive's `BUILD.json`. Baseline: accepted Preview 10 `3dcd4f630006fd00f5631d362ce9cc20da8a595c`; independently verified intermediate repairs: `c4a3701fda19847853eb145a7a232157aec2d6a7` and `41a79fe7c9fdb50d006e24fb53fc81926bf88b2a`.

## Movement and real collision

Indoor and outdoor Adventures movement share a generic 1.75m-high, 0.28m-radius capsule controller with a tunable 0.30m maximum step. It checks actual walkable support, landing width and head clearance. Walls, taller ledges and furniture block ordinary movement; Jump remains an explicit action. Actual room treads, individual posts, sloped rails, floors and openings replace the active ramp and invisible full-height stair guards. Outdoor buildings use shared actual triangle trees, including placed buildings; editor/map reservations remain separate.

The imported town-house risers measured 0.378m. Recognised human-scale stock front flights are rebuilt as real smaller treads inside their original bounds: 0.189m here. Source GLBs and saved construction coordinates are unchanged. No staircase is individually tagged for the movement controller. Very large/custom risers still obey the 0.30m limit; arbitrary CAD import UI and automatic nonuniform-instance baking remain unfinished.

The original faults are reproduced in `movement-before.json` and before images. Additional regressions cover 15–25cm mesh steps, taller blockers, low ceilings, thin tread edges, doorway gaps and stationary support. Testing caught a top-plane precision loss in Three r160's octree, a shared camera ray-direction transform between instances, and loss of support while idle at a tread edge. These are corrected. High stair undersides permit passage; genuinely low treads retain head collision. Camera tests use actual architecture and retain a clear 12m exterior stair view.

## Controls and saves

Running is the default. The Walk toggle saves a slower mode in a new preference key, migrating previous graphics quality without changing the old key. Space, a separate touch target and standard controller left bumper trigger a single Jump; A retains interaction/confirmation. Existing Explorer `Jump_Start`, `Jump_Idle` and `Jump_Land` clips provide animation. Pointer release/cancel, held buttons, map interruption and controller disconnect have regression coverage.

New worlds and new room templates use Adventures data version 3. An older world first using Jump or a new template gets an independently named updated copy, retaining the old record. Existing room entries without a new storey field preserve their original template and furnishings. New cottages/workshops have one floor; town houses, inns and mills retain actual connected upper floors. Single-storey beds are downstairs, and fresh furnishings use the actual loaded model bounds. Actual cutaway ceiling geometry limits headroom. Furniture placement checks the furniture footprint rather than requiring a player-sized clearance at every corner.

Airborne checkpoints select clear real support or the preceding landing; reload does not leave a suspended character or drop an upper-floor player downstairs. Safe elevated exterior positions/facing survive room exit. Quota-denied upgrades leave the original room intact with no queued Jump. Independent extracted Preview 10 rejects version-3 imports without modifying its active world or records.

The main world remains one connected Willow Vale with Willowmere, Whispering Wood, Maker's Meadow, Brookside, Alderwick and Reedbank. Three fitted river bridges, the real map/minimap, landmark travel and original physical Meadow Lodge door remain operational. Room dimensions use exterior model bounds and current template clamps. Building-specific architectural replicas and richer activities remain unfinished. Outdoor rendering is suspended indoors; shared outdoor resources remain retained.

## Validation and evidence

- **193 passing deterministic tests**, with the complete log in `unit-tests.txt`.
- **108 passing current browser/render/resource checks** in `summary.json`: 27 Run/Walk/Jump/input/reload/layout; 23 room-template/navigation/furniture; eight older-save/upgrade compatibility; 14 actual indoor keyboard/touch/injected-gamepad movement; 20 exterior steps/camera/elevated fade return; six bridge/lodge/cache; two rendering/world-switch; eight editor move/cancel/floor-transfer/undo/reload checks.
- Strict typecheck, preservation and separate Adventures production build. **820 retained files** match the accepted Preview 10 base exactly, covering older packages/reports, source GLBs/licences, native movement/persistence, original site and other retained files outside authorised active code/tests/docs.
- Genuine rendered screenshots were inspected. `gallery.html` selects final phone/tablet/interior/exterior views. Earlier `mesh-rooms.json`, `mesh-inputs.json` and diagnostic shots record the staged movement repair before fresh cottage templates changed; they are historical evidence, not assertions that new cottages have stairs.

Phone/tablet checks are managed Chromium SwiftShader emulation, actual keyboard/touch events and injected standard Gamepad API. Physical Lenovo, iPhone, Safari, Xbox and Bluetooth tests remain **unverified**.

## Measured cost

`render-cost-final.json` compares four fixed world views with independently extracted Preview 10 on 5183. The same 52 startup model/image URLs load. The measured gameplay build loads about 3.722MB encoded resources versus 3.701MB in Preview 10; the last subsequent runtime change clarified menu wording. Four world views add 2–4 draw calls and 90–248 submitted triangles for the fitted stairs; textures are unchanged. Ten layout 5/6 switches plateau uploaded resources.

There are 43 architecture instances sharing 11 collision shapes (20,422 source triangles), three fitted step prototypes and 1,117 existing non-architecture bodies. Eight body rebuilds retain cache counts. Seven paused idle batches show median 0.045ms simulation/update and 0.057ms camera/update at one pose on the managed CPU. These samples do not establish physical mobile FPS or an FPS improvement.

No model/image download or catalogue expansion was added. Existing CC0 provenance and original source bytes are retained. The earlier source repairs' workload samples are retained in their own JSON files.

## Continuing work

Create and verify the new Preview 11 package, push/independently verify its checkpoint, freeze v11 evidence/archive, then immediately continue coherent connected-world expansion in NEW v12 work. Use an explicit new layout/new record for permanent footprints, preserving layouts 1–6 and all constructions. Further building-specific interiors, NPCs/wildlife, distinct themes, transport, activities and measured rendering improvements remain unfinished. Restricted Seahill/Nature collections remain unincluded. No public site deployment, main merge, automation change or reset redemption occurred.
