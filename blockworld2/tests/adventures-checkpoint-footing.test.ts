import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { checkpointFooting } from "../src/adventures/checkpoint-footing";
import { CollisionSpace, MeshShape } from "../src/adventures/mesh-collision";
import { freshRoom } from "../src/adventures/interior";
import { makeSnapshot, validateAdventure } from "../src/adventures/save";
import type { BuildingEntry } from "../src/adventures/building-entry";
const entry: BuildingEntry = {
  id: "cottage",
  name: "Cottage",
  kind: "cottage",
  x: 0,
  z: 10,
  yaw: 0,
  width: 5.8,
  depth: 6.8,
  levels: 1,
};
test("airborne checkpoints land on the same actual upper floor and retain the prior landing across a stair void", () => {
  const g = new T.Group(),
    floor = new T.Mesh(new T.BoxGeometry(2, 0.2, 4));
  floor.position.set(-1, 2.9, 0);
  g.add(floor);
  const space = new CollisionSpace();
  space.add(new MeshShape(g));
  const saved = checkpointFooting({ x: -1, y: 3.6, z: 0 }, space);
  assert.ok(saved && Math.abs(saved.y - 3.002) < 0.001);
  const recovered = checkpointFooting({ x: 1, y: 3.6, z: 0 }, space, {
    x: -1,
    y: 3,
    z: 0,
  });
  assert.ok(
    recovered &&
      recovered.x === -1 &&
      Math.abs(recovered.y - 3.002) < 0.00001 &&
      recovered.z === 0,
  );
  space.boxes = [{ minX: -2, maxX: 0, minZ: -2, maxZ: 2, minY: 3, maxY: 5 }];
  assert.equal(
    checkpointFooting({ x: 1, y: 3.6, z: 0 }, space, { x: -1, y: 3, z: 0 }),
    null,
  );
});
test("versioned single-storey rooms keep beds downstairs while legacy saved upper floors remain valid", () => {
  const single = freshRoom(entry),
    legacy = freshRoom({ ...entry, levels: undefined });
  assert.ok(single.objects.every((p) => (p.y ?? 0) === 0));
  assert.ok(single.objects.some((p) => p.id === "bed"));
  assert.ok(legacy.objects.some((p) => p.id === "bed" && p.y === 3));
  const data = {
    version: 3 as const,
    scene: "village" as const,
    layout: 3 as const,
    objects: [],
    discoveries: [],
    rooms: { cottage: single },
    inside: {
      id: "cottage",
      outside: { x: 0, y: 1.5, z: 10, yaw: 0, pitch: 0.47 },
    },
  };
  const snapshot = makeSnapshot(data, {
    x: 0,
    y: 0.002,
    z: 2,
    yaw: 0,
    pitch: 0.47,
  });
  assert.equal(validateAdventure(snapshot).rooms!.cottage.entry.levels, 1);
  const old = structuredClone(snapshot);
  (old.world.adventure as any).version = 2;
  assert.throws(() => validateAdventure(old));
  const bad = structuredClone(snapshot);
  (bad.world.adventure as any).rooms.cottage.objects[0].y = 3;
  assert.throws(() => validateAdventure(bad));
  const legacySnapshot = makeSnapshot(
    { ...data, rooms: { cottage: legacy } },
    { x: 0, y: 3, z: 0, yaw: 0, pitch: 0.47 },
  );
  assert.deepEqual(
    validateAdventure(legacySnapshot).rooms!.cottage.objects,
    legacy.objects,
  );
  const outside = makeSnapshot(
    { ...data, inside: undefined },
    { x: 0, y: 1.514, z: 10, yaw: 0, pitch: 0.47 },
  );
  assert.equal(outside.player.y, 1.514);
});
