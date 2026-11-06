import { test } from "node:test";
import assert from "node:assert/strict";
import {
  roomStructure,
  moveInRoom,
  safeRoomPose,
  recoverRoomPose,
} from "../src/adventures/interior-physics";
import { freshRoom } from "../src/adventures/interior";
import { makeSnapshot, validateAdventure } from "../src/adventures/save";
import { encode, decode } from "../src/persistence/schema";
import type { BuildingEntry } from "../src/adventures/building-entry";
const entry: BuildingEntry = {
  id: "village:cottage:1",
  name: "Cottage",
  kind: "cottage",
  x: -120,
  z: 12,
  yaw: 0,
  width: 7.2,
  depth: 9,
};
test("ordinary movement climbs the continuous stair ramp, joins the upper landing and descends without a teleport", () => {
  const solids = roomStructure(7.2, 9, true),
    r = solids.find((s) => s.ramp)!.ramp!,
    p = { x: r.cx, y: 0, z: r.cz + r.length / 2 + 0.6, yaw: 0, grounded: true };
  let last = 0,
    maxStep = 0;
  for (let i = 0; i < 600; i++) {
    moveInRoom(p, 0, -2, 1 / 120, solids);
    maxStep = Math.max(maxStep, Math.abs(p.y - last));
    last = p.y;
  }
  assert.ok(p.y > 2.99, JSON.stringify(p));
  assert.ok(p.z < r.cz - r.length / 2 - 0.45);
  assert.ok(maxStep < 0.1, String(maxStep));
  assert.equal(safeRoomPose(p, solids, 7.2, 9), true);
  for (let i = 0; i < 600; i++) moveInRoom(p, 0, 2, 1 / 120, solids);
  assert.ok(p.y < 0.01, JSON.stringify(p));
  assert.ok(p.z > r.cz + r.length / 2 - 0.1);
});
test("upper-floor hole, rails and solid walls retain safe footing and a clear lower route", () => {
  const solids = roomStructure(7.2, 9, true),
    r = solids.find((s) => s.ramp)!.ramp!;
  const p = { x: r.cx - 0.7, y: 3, z: 0, yaw: 0, grounded: true };
  assert.equal(safeRoomPose(p, solids, 7.2, 9), false);
  const lower = { x: 0, y: 0, z: 0, yaw: 0, grounded: true };
  for (let i = 0; i < 1200; i++) moveInRoom(lower, -3, 0, 1 / 120, solids);
  assert.ok(lower.x > -3.6 && lower.x < -3);
  assert.equal(lower.y, 0);
});
test("separate building contents and upstairs pose survive native checksummed backups without changing old outdoor records", () => {
  const old = makeSnapshot(
      { version: 1, scene: "vale", layout: 5, objects: [], discoveries: [] },
      { x: -105, z: 18, yaw: 0, pitch: 0.47 },
    ),
    copy = structuredClone(old);
  validateAdventure(old);
  assert.deepEqual(old, copy);
  const a = freshRoom(entry),
    other = freshRoom({ ...entry, id: "village:cottage:2", x: -112 });
  a.objects[0].x += 0.25;
  const s = makeSnapshot(
    {
      version: 2,
      scene: "vale",
      layout: 5,
      objects: [],
      discoveries: [],
      rooms: { [entry.id]: a, [other.entry.id]: other },
      inside: {
        id: entry.id,
        outside: { x: entry.x, z: entry.z, yaw: 0, pitch: 0.47 },
      },
    },
    { x: 0, y: 3, z: -3.6, yaw: 1, pitch: 0.8 },
  );
  const round = decode(encode(s));
  assert.equal(round.player.y, 3);
  assert.deepEqual(
    validateAdventure(round).rooms?.[entry.id].objects,
    a.objects,
  );
  assert.notEqual(a.objects[0].x, other.objects[0].x);
  assert.deepEqual(old, copy);
  (round.world.adventure as any).version = 1;
  assert.throws(() => validateAdventure(round), /supported/);
});
test("malformed, orphaned or outdoor-coordinate room state is rejected before opening or importing", () => {
  const data = {
    version: 2 as const,
    scene: "vale" as const,
    layout: 5 as const,
    objects: [],
    discoveries: [],
    rooms: { [entry.id]: freshRoom(entry) },
    inside: { id: entry.id, outside: { x: -120, z: 12, yaw: 0, pitch: 0.47 } },
  };
  const valid = makeSnapshot(data, { x: 0, y: 0, z: 2, yaw: 0, pitch: 0.8 });
  for (const mutate of [
    (s: any) => (s.player.x = 120),
    (s: any) => (s.world.adventure.inside.id = "missing"),
    (s: any) => (s.world.adventure.rooms[entry.id].objects[0].y = 2),
    (s: any) => (s.world.adventure.rooms[entry.id].entry.width = 80),
    (s: any) => (s.world.adventure.inside.outside.x = 1000),
  ]) {
    const s = structuredClone(valid);
    mutate(s);
    assert.throws(() => validateAdventure(s));
  }
});
test("all matching exterior footprint sizes support walking and running up/down without landing snags or side falls", () => {
  for (const [width, depth] of [
    [5.8, 6.8],
    [6.3, 7.91],
    [10, 12],
  ])
    for (const speed of [3.05, 6]) {
      const solids = roomStructure(width, depth, true),
        r = solids.find((s) => s.ramp)!.ramp!,
        p = {
          x: r.cx,
          y: 0,
          z: r.cz + r.length / 2 + 0.5,
          yaw: 0,
          grounded: true,
        };
      for (let i = 0; i < 800; i++) moveInRoom(p, 0, -speed, 1 / 120, solids);
      assert.ok(
        p.y > 2.99 && p.z < r.cz - r.length / 2 - 0.45,
        JSON.stringify({ width, depth, speed, p }),
      );
      for (let i = 0; i < 800; i++) moveInRoom(p, 0, speed, 1 / 120, solids);
      assert.ok(p.y < 0.01, JSON.stringify({ width, depth, speed, p }));
      const middle = { x: r.cx, y: 1.5, z: r.cz, yaw: 0, grounded: true };
      for (let i = 0; i < 120; i++) moveInRoom(middle, -3, 0, 1 / 120, solids);
      assert.ok(middle.x > r.cx - r.width / 2, JSON.stringify(middle));
    }
});
test("room recovery preserves a safe upstairs pose, finds clear same-floor footing and refuses a fully blocked room", () => {
  const solids = roomStructure(7.2, 9, true),
    spawn = { x: 0, y: 0, z: 3.3 },
    p = { x: 0, y: 3, z: 0, yaw: 1 };
  assert.deepEqual(recoverRoomPose(p, solids, 7.2, 9, spawn), p);
  const occupied = [
    ...solids,
    { minX: -0.5, maxX: 0.5, minZ: -0.5, maxZ: 0.5, minY: 3, maxY: 5 },
  ];
  const clear = recoverRoomPose(p, occupied, 7.2, 9, spawn);
  assert.ok(clear);
  assert.equal(clear.y, 3);
  assert.equal(safeRoomPose(clear, occupied, 7.2, 9), true);
  const full = [
    ...solids,
    { minX: -4, maxX: 4, minZ: -5, maxZ: 5, minY: 0, maxY: 6 },
  ];
  assert.equal(recoverRoomPose(p, full, 7.2, 9, spawn), null);
});
test("new houses have human-scale bedrooms, inns have guest beds, and mills keep a separate working upper floor", () => {
  const house = freshRoom(entry),
    inn = freshRoom({ ...entry, id: "inn", kind: "inn", width: 10, depth: 12 }),
    mill = freshRoom({ ...entry, id: "mill", kind: "mill" });
  assert.ok(
    house.objects.some(
      (p) => p.asset === "furniture-bedsingle" && p.y === 3 && p.scale === 1.85,
    ),
  );
  assert.ok(
    house.objects.some((p) => p.asset === "furniture-cabinetbed" && p.y === 3),
  );
  assert.equal(
    inn.objects.filter((p) => p.asset === "furniture-bedsingle").length,
    2,
  );
  assert.ok(mill.objects.some((p) => p.asset === "crate_A_small" && p.y === 3));
  assert.equal(
    mill.objects.some((p) => p.asset === "furniture-bedsingle"),
    false,
  );
  const old = {
    ...house,
    objects: [
      {
        id: "old-table",
        asset: "furniture-table",
        x: -1,
        z: 1,
        y: 3,
        yaw: 0.5,
        scale: 2.5,
      },
    ],
  };
  const s = makeSnapshot(
    {
      version: 2,
      scene: "vale",
      layout: 5,
      objects: [],
      discoveries: [],
      rooms: { [entry.id]: old },
    },
    { x: -105, z: 18, yaw: 0, pitch: 0.47 },
  );
  assert.deepEqual(
    validateAdventure(s).rooms?.[entry.id].objects,
    old.objects,
    "opening an existing room never repopulates its template",
  );
});
