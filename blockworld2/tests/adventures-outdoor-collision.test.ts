import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { OutdoorCollision } from "../src/adventures/outdoor-collision";
import type { AssetLibrary } from "../src/adventures/assets";
function opening() {
  const g = new T.Group();
  for (const x of [-1.4, 1.4]) {
    const m = new T.Mesh(new T.BoxGeometry(1, 3, 0.2));
    m.position.set(x, 1.5, 0);
    g.add(m);
  }
  return g;
}
test("outdoor architecture shares triangle trees, preserves openings and excludes the moving building", () => {
  let creates = 0;
  const library = {
      create: () => {
        creates++;
        return opening();
      },
    } as unknown as AssetLibrary,
    cache = new OutdoorCollision(library),
    group = new T.Group(),
    built = new Map<string, T.Object3D>();
  for (let i = 0; i < 20; i++) {
    const r = opening();
    r.position.x = i * 10;
    r.userData = { asset: "building_test", movementSolid: true };
    group.add(r);
  }
  const movable = opening();
  movable.userData.asset = "building_test";
  movable.position.set(0, 0, 4);
  built.set("moving", movable);
  const bodies = [
    {
      minX: -2,
      maxX: 2,
      minZ: -0.1,
      maxZ: 0.1,
      height: 3,
      name: "building_test",
    },
    { minX: 4, maxX: 5, minZ: 0, maxZ: 1, height: 1, name: "furniture" },
  ];
  const space = cache.create(
    group,
    built,
    bodies,
    () => 0,
    () => true,
    "moving",
  );
  assert.equal(creates, 1);
  assert.equal(space.stats().instances, 20);
  assert.equal(space.stats().cachedTriangles, 24);
  assert.equal(space.boxes.length, 1);
  assert.equal(space.clear({ x: 0, y: 0.002, z: 0 }), true);
  assert.equal(space.clear({ x: 1.4, y: 0.002, z: 0 }), false);
  assert.equal(space.clear({ x: 0, y: 0.002, z: 4 }), true);
  assert.equal(
    space.cameraFraction(new T.Vector3(0, 1, 2), new T.Vector3(0, 0, -4)),
    1,
  );
  assert.ok(
    space.cameraFraction(new T.Vector3(1.4, 1, 2), new T.Vector3(0, 0, -4)) <
      0.5,
  );
  cache.create(
    group,
    built,
    bodies,
    () => 0,
    () => true,
    null,
  );
  assert.equal(creates, 1);
});
