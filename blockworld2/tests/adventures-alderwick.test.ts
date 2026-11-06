import { test } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import {
  ALDERWICK,
  ALDERWICK_ROADS,
  ALDERWICK_BUILDINGS,
} from "../src/adventures/alderwick-data";
import {
  AdventureSession,
  makeSnapshot,
  validateAdventure,
} from "../src/adventures/save";
import { inWorld, valeWater } from "../src/adventures/vale-data";
import { createMapData } from "../src/adventures/map-data";
import { smoothTrail } from "../src/adventures/landscape";
import { WorldStore } from "../src/persistence/store";
import { DEFINITIONS } from "../src/adventures/assets";
import { closestTrailPoint } from "../src/adventures/trail-geometry";
import { distanceSegment } from "../src/adventures/landscape";
Object.assign(globalThis, { indexedDB });

test("Alderwick is an explicit new valley layout and legacy constructions retain their version", () => {
  for (const layout of [3, 4, 5] as const) {
    const snapshot = makeSnapshot(
      {
        version: 1,
        scene: "vale",
        layout,
        objects: [
          {
            id: "keep-north",
            asset: "barrel",
            x: -149,
            z: -64,
            yaw: 0.3,
            scale: 4,
          },
        ],
        discoveries: [],
      },
      { x: -105, z: 18, yaw: 0, pitch: 0.47 },
    );
    const data = validateAdventure(snapshot);
    assert.equal(data.layout, layout);
    assert.equal(data.objects[0].x, -149);
  }
  const foreign = makeSnapshot(
    { version: 1, scene: "woodland", layout: 5, objects: [], discoveries: [] },
    { x: 0, z: 18, yaw: 0, pitch: 0.47 },
  );
  assert.throws(() => validateAdventure(foreign), /supported/);
});
test("creating the new valley preserves and reopens the previous layout record unchanged", async () => {
  const original = makeSnapshot(
    {
      version: 1,
      scene: "vale",
      layout: 4,
      objects: [
        {
          id: "keep-north",
          asset: "building_home_A_blue",
          x: -149,
          z: -64,
          yaw: 0.6,
          scale: 7,
        },
      ],
      discoveries: [],
      doors: { lodge: true },
    },
    { x: -105, z: 18, yaw: 0, pitch: 0.47 },
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
  session.store = await WorldStore.open(
    "alderwick-isolation-" + crypto.randomUUID(),
  );
  const before = await session.store.create("Previous valley", original);
  await session.open(before.id);
  const fresh = await session.create("vale");
  assert.notEqual(fresh.id, before.id);
  assert.equal(validateAdventure(state).layout, 5);
  assert.equal(validateAdventure(state).objects.length, 0);
  const retained = await session.store.load(before.id);
  assert.deepEqual(retained.snapshot.world.adventure, original.world.adventure);
  await session.open(before.id);
  assert.deepEqual(state.world.adventure, original.world.adventure);
  assert.equal((await session.store.list()).length, 2);
});
test("northern road geometry stays inside the same valley and crosses no unbridged water", () => {
  for (const path of ALDERWICK_ROADS)
    for (const [x, z] of smoothTrail(path.points, 0.25)) {
      assert.ok(inWorld(x, z, "vale", path.width / 2));
      assert.equal(valeWater(x, z), false);
    }
  for (const p of ALDERWICK_BUILDINGS) assert.ok(DEFINITIONS.has(p.asset));
});
test("only the actual new settlement landmark adds its map destination", () => {
  const empty = { paths: [], obstacles: [], landmarks: [] },
    old = createMapData("vale", empty),
    current = createMapData("vale", {
      ...empty,
      landmarks: [{ ...ALDERWICK, description: "Northern square" }],
    });
  assert.ok(!old.destinations.some((d) => d.id === ALDERWICK.id));
  assert.deepEqual(
    current.destinations.find((d) => d.id === ALDERWICK.id),
    ALDERWICK,
  );
});
test("driveways join the real curved ring street without overshooting into the square", () => {
  const street = smoothTrail(ALDERWICK_ROADS[1].points);
  for (const p of ALDERWICK_BUILDINGS.filter(
    (p) =>
      p.asset.startsWith("building_home") || p.asset.includes("blacksmith"),
  )) {
    const start = [p.x + Math.sin(p.yaw) * 3.4, p.z + Math.cos(p.yaw) * 3.4],
      end = closestTrailPoint(start, street);
    assert.ok(
      street
        .slice(1)
        .some((b, i) => distanceSegment(end[0], end[1], street[i], b) < 1e-8),
    );
    assert.ok(Math.hypot(start[0] - end[0], start[1] - end[1]) < 8);
  }
  assert.deepEqual(
    closestTrailPoint(
      [1, 2],
      [
        [0, 0],
        [0, 0],
        [2, 0],
        [2, 4],
      ],
    ),
    [2, 2],
  );
});
