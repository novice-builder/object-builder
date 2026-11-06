import { test } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import {
  OAKFIELD,
  OAKFIELD_ROADS,
  OAKFIELD_BUILDINGS,
  OAKFIELD_GROVE,
} from "../src/adventures/oakfield-data";
import {
  makeSnapshot,
  validateAdventure,
  AdventureSession,
} from "../src/adventures/save";
import { createMapData } from "../src/adventures/map-data";
import { inWorld, valeWater } from "../src/adventures/vale-data";
import { smoothTrail } from "../src/adventures/landscape";
import { WorldStore } from "../src/persistence/store";
import { DEFINITIONS } from "../src/adventures/assets";
Object.assign(globalThis, { indexedDB });
test("Oakfield is an explicit new layout and older constructions retain exact placement records", () => {
  for (const layout of [3, 4, 5, 6, 7, 8, 9] as const) {
    const snapshot = makeSnapshot(
      {
        version: 4,
        scene: "vale",
        layout,
        objects: [
          {
            id: "east-meadow-build",
            asset: "building_home_A_blue",
            x: 138,
            z: 52,
            yaw: 0.3,
            scale: 6,
          },
        ],
        discoveries: [],
        rooms: {},
      },
      { x: -105, z: 18, yaw: 0, pitch: 0.47 },
    );
    const data = validateAdventure(snapshot);
    assert.equal(data.layout, layout);
    assert.deepEqual(data.objects, [
      {
        id: "east-meadow-build",
        asset: "building_home_A_blue",
        x: 138,
        z: 52,
        yaw: 0.3,
        scale: 6,
      },
    ]);
  }
  for (const scene of ["village", "woodland", "meadow"] as const) {
    const snapshot = makeSnapshot(
      { version: 4, scene, layout: 9, objects: [], discoveries: [], rooms: {} },
      { x: 0, z: 18, yaw: 0, pitch: 0.47 },
    );
    assert.throws(() => validateAdventure(snapshot), /supported/);
  }
});
test("new garden-village roads stay connected, dry, bounded and smoothly sampled", () => {
  for (const road of OAKFIELD_ROADS) {
    const points = smoothTrail(road.points, 0.25);
    for (let i = 0; i < points.length; i++) {
      const [x, z] = points[i];
      assert.ok(inWorld(x, z, "vale", road.width / 2));
      assert.equal(valeWater(x, z, 9), false);
      if (i)
        assert.ok(Math.hypot(x - points[i - 1][0], z - points[i - 1][1]) < 0.7);
    }
  }
  assert.deepEqual(OAKFIELD_ROADS[0].points[0], [105, 16]);
  assert.deepEqual(OAKFIELD_ROADS[1].points[0], [78, 52]);
  assert.deepEqual(
    OAKFIELD_ROADS[1].points.at(-1),
    OAKFIELD_ROADS[0].points[3],
  );
  for (const b of OAKFIELD_BUILDINGS) assert.ok(DEFINITIONS.has(b.asset));
  for (const [x, z] of OAKFIELD_GROVE) {
    assert.ok(inWorld(x, z, "vale", 2));
    assert.equal(valeWater(x, z, 9), false);
  }
});
test("the new map target follows the actual settlement landmark rather than appearing in older worlds", () => {
  const empty = { paths: [], obstacles: [], landmarks: [] };
  assert.ok(
    !createMapData("vale", empty).destinations.some(
      (d) => d.id === OAKFIELD.id,
    ),
  );
  assert.deepEqual(
    createMapData("vale", {
      ...empty,
      landmarks: [{ ...OAKFIELD, description: "Garden village" }],
    }).destinations.find((d) => d.id === OAKFIELD.id),
    OAKFIELD,
  );
});
test("creating a fresh layout9 world preserves and reopens a decorated layout8 original unchanged", async () => {
  const original = makeSnapshot(
    {
      version: 4,
      scene: "vale",
      layout: 8,
      objects: [
        {
          id: "keep-meadow",
          asset: "barrel",
          x: 138,
          z: 52,
          yaw: 0.7,
          scale: 3,
        },
      ],
      discoveries: ["foxglade"],
      rooms: {},
    },
    { x: 138, z: 52, yaw: 0.1, pitch: 0.47 },
  );
  let state = structuredClone(original);
  const session = new AdventureSession(
    () => state,
    (s) => {
      state = structuredClone(s);
    },
    () => {},
    () => {},
  );
  session.store = await WorldStore.open("oakfield-" + crypto.randomUUID());
  const old = await session.store.create("Earlier garden build", original);
  await session.open(old.id);
  const fresh = await session.create("vale");
  assert.notEqual(fresh.id, old.id);
  assert.equal(validateAdventure(state).layout, 9);
  assert.deepEqual((await session.store.load(old.id)).snapshot, original);
  await session.open(old.id);
  assert.deepEqual(state, original);
});
