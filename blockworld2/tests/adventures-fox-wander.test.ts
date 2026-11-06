import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { FoxWander } from "../src/adventures/fox-wander";
import { FOX, foxBody, foxBodyAt } from "../src/adventures/foxglade-data";
import { CollisionSpace, MeshShape } from "../src/adventures/mesh-collision";
const far = { x: 100, z: 100 };
test("bounded fox legs are deterministic, remain near home and never exceed walking/turn speed", () => {
  const a = new FoxWander(),
    b = new FoxWander(),
    clips = new Set<string>();
  let travelled = 0;
  for (let i = 0; i < 8000; i++) {
    const old = { x: a.x, z: a.z, yaw: a.yaw };
    a.update(1 / 120, () => true, far);
    b.update(1 / 120, () => true, far);
    const step = Math.hypot(a.x - old.x, a.z - old.z);
    assert.ok(step <= 0.65 / 120 + 1e-9);
    assert.ok(Math.abs(a.yaw - old.yaw) <= 2.6 / 120 + 1e-9);
    assert.ok(Math.hypot(a.x - FOX.x, a.z - FOX.z) <= 3.101);
    travelled += step;
    clips.add(a.clip);
  }
  assert.ok(travelled > 10);
  assert.deepEqual(a, b);
  assert.deepEqual([...clips].sort(), ["Survey", "Walk"]);
});
test("a newly blocked leg stops in place and retries without teleporting through construction", () => {
  const fox = new FoxWander();
  for (let i = 0; i < 1000 && fox.clip !== "Walk"; i++)
    fox.update(1 / 120, () => true, far);
  const before = { x: fox.x, z: fox.z, yaw: fox.yaw };
  let queries = 0;
  for (let i = 0; i < 1200; i++)
    fox.update(
      1 / 120,
      () => {
        queries++;
        return false;
      },
      far,
    );
  assert.deepEqual({ x: fox.x, z: fox.z, yaw: fox.yaw }, before);
  assert.equal(fox.clip, "Survey");
  assert.ok(queries < 200);
});
test("nearby player and edit suspension hold the same pose; stalled frames have bounded motion", () => {
  const fox = new FoxWander();
  for (let i = 0; i < 1200; i++) fox.update(1 / 120, () => true, far);
  const before = { x: fox.x, z: fox.z, yaw: fox.yaw };
  fox.update(0.05, () => true, { x: fox.x + 0.8, z: fox.z });
  assert.deepEqual({ x: fox.x, z: fox.z, yaw: fox.yaw }, before);
  assert.equal(fox.clip, "Survey");
  fox.pause();
  assert.equal(fox.clip, "Survey");
  for (let i = 0; i < 400; i++) {
    const old = { x: fox.x, z: fox.z };
    fox.update(10, () => true, far);
    assert.ok(Math.hypot(fox.x - old.x, fox.z - old.z) <= 0.032501);
  }
});
test("the rotating torso collider retains the original pose and follows a moved animal at its terrain height", () => {
  assert.deepEqual(foxBodyAt(FOX), foxBody());
  const b = foxBodyAt({ x: 2, z: 3, yaw: Math.PI / 2 }, 0.15);
  assert.ok(Math.abs(b.minX - 1.82) < 1e-9);
  assert.ok(Math.abs(b.maxX - 2.46) < 1e-9);
  assert.ok(Math.abs(b.minZ - 2.82) < 1e-9);
  assert.ok(Math.abs(b.maxZ - 3.18) < 1e-9);
  assert.equal(b.base, 0.15);
  assert.equal(b.height, 0.77);
});
test("collision queries can exclude the actor's own body while every other box/real mesh remains solid", () => {
  const space = new CollisionSpace(),
    p = { x: 0, y: 0.002, z: 0 };
  space.boxes = [
    {
      minX: -0.2,
      maxX: 0.2,
      minZ: -0.2,
      maxZ: 0.2,
      minY: 0,
      maxY: 0.62,
      source: "wildlife-fox",
    },
    {
      minX: 0.6,
      maxX: 0.8,
      minZ: -1,
      maxZ: 1,
      minY: 0,
      maxY: 1,
      source: "new-construction",
    },
  ];
  assert.equal(space.contact(p, 0.24, 0.65)?.source, "wildlife-fox");
  assert.equal(space.contact(p, 0.24, 0.65, "wildlife-fox"), null);
  assert.equal(
    space.contact({ ...p, x: 0.5 }, 0.24, 0.65, "wildlife-fox")?.source,
    "new-construction",
  );
  const root = new T.Group(),
    wall = new T.Mesh(new T.BoxGeometry(0.3, 0.6, 0.3));
  wall.position.y = 0.3;
  root.add(wall);
  space.add(new MeshShape(root), new T.Matrix4(), false, "real-building");
  assert.equal(
    space.contact(p, 0.24, 0.65, "wildlife-fox")?.source,
    "real-building",
  );
});
