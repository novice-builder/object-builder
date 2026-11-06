import { test } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import {
  MILLERS_END,
  MILLERS_END_BUILDINGS,
  MILLERS_END_ROADS,
} from "../src/adventures/millers-end-data";
import {
  makeSnapshot,
  validateAdventure,
  AdventureSession,
} from "../src/adventures/save";
import { valeWalk, valeWater, inWorld } from "../src/adventures/vale-data";
import { smoothTrail, LATEST_LAYOUT } from "../src/adventures/landscape";
import { WorldStore } from "../src/persistence/store";
Object.assign(globalThis, { indexedDB });

test("Miller’s End is an explicit new valley layout; older records preserve their construction coordinates", () => {
  assert.equal(LATEST_LAYOUT, 7);
  for (const layout of [3, 4, 5, 6, 7] as const) {
    const snapshot = makeSnapshot(
      {
        version: 3,
        rooms: {},
        scene: "vale",
        layout,
        objects: [
          {
            id: "retained-hamlet-site",
            asset: "barrel",
            x: -146,
            z: 57,
            yaw: 0.8,
            scale: 3,
          },
        ],
        discoveries: [],
      },
      { x: -105, z: 18, yaw: 0, pitch: 0.47, y: 0.002 },
    );
    const data = validateAdventure(snapshot);
    assert.equal(data.layout, layout);
    assert.deepEqual(data.objects, [
      {
        id: "retained-hamlet-site",
        asset: "barrel",
        x: -146,
        z: 57,
        yaw: 0.8,
        scale: 3,
      },
    ]);
  }
  for (const scene of ["village", "woodland", "meadow"] as const) {
    const s = makeSnapshot(
      { version: 3, rooms: {}, scene, layout: 7, objects: [], discoveries: [] },
      { x: 0, z: 18, yaw: 0, pitch: 0.47 },
    );
    assert.throws(() => validateAdventure(s), /supported/);
  }
});
test("creating a layout-7 world retains and reopens an older decorated valley unchanged", async () => {
  const original = makeSnapshot(
    {
      version: 3,
      rooms: {},
      scene: "vale",
      layout: 6,
      objects: [
        { id: "keep-me", asset: "barrel", x: -146, z: 57, yaw: 0.3, scale: 3 },
      ],
      discoveries: ["village:mill"],
    },
    { x: -146, z: 57, yaw: 0.2, pitch: 0.47, y: 0.002 },
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
    "millers-isolation-" + crypto.randomUUID(),
  );
  const old = await session.store.create("Older decorated valley", original);
  await session.open(old.id);
  const fresh = await session.create("vale");
  assert.notEqual(fresh.id, old.id);
  assert.equal(validateAdventure(state).layout, 7);
  assert.equal(validateAdventure(state).objects.length, 0);
  assert.deepEqual((await session.store.load(old.id)).snapshot, original);
  await session.open(old.id);
  assert.deepEqual(state, original);
});
test("windmill and village return lanes stay dry, continuous and inside the existing terrain", () => {
  for (const road of MILLERS_END_ROADS) {
    const points = smoothTrail(road.points, 0.3);
    for (let i = 0; i < points.length; i++) {
      const [x, z] = points[i];
      assert.ok(inWorld(x, z, "vale", road.width / 2));
      assert.equal(valeWater(x, z, 7), false);
      assert.equal(valeWalk(x, z, 7), valeWalk(x, z, 6));
      if (i)
        assert.ok(Math.hypot(x - points[i - 1][0], z - points[i - 1][1]) < 1);
    }
  }
  assert.equal(valeWalk(MILLERS_END.x, MILLERS_END.z, 7), 0);
});
