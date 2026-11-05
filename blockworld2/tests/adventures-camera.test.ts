import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  rayBoxDistance,
  cameraFraction,
} from "../src/adventures/camera-collision";
import { CollisionCache } from "../src/adventures/collision-cache";
test("camera rays handle parallel, inside, behind and zero-length cases", () => {
  const wall = { minX: -1, maxX: 1, minZ: -5, maxZ: -4, height: 6 };
  assert.equal(
    rayBoxDistance({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: -1 }, wall, 0),
    4,
  );
  assert.equal(
    rayBoxDistance({ x: 2, y: 1, z: 0 }, { x: 0, y: 0, z: -1 }, wall, 0),
    Infinity,
  );
  assert.equal(
    rayBoxDistance({ x: 0, y: 1, z: -4.5 }, { x: 0, y: 0, z: -1 }, wall, 0),
    0.5,
  );
  assert.equal(
    rayBoxDistance({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, wall, 0),
    Infinity,
  );
  assert.equal(
    cameraFraction({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 0 }, [wall]),
    1,
  );
  const fraction = cameraFraction(
    { x: 0, y: 1.35, z: 0 },
    { x: 0, y: 3, z: 12 },
    [{ minX: -2, maxX: 2, minZ: 10, maxZ: 11, height: 6 }],
  );
  assert.ok(fraction > 0 && fraction < 10 / 12);
  assert.ok(12 * fraction < 9.82);
});
test("allocation-free ray distances agree with the established Three.js box intersection", () => {
  const body = { minX: -2, maxX: 3, minZ: -5, maxZ: -1, height: 6 },
    box = new T.Box3(
      new T.Vector3(-2.18, -3, -5.18),
      new T.Vector3(3.18, 6.18, -0.82),
    );
  for (let i = 0; i < 200; i++) {
    const origin = new T.Vector3(
        Math.sin(i * 0.31) * 8,
        Math.cos(i * 0.17) * 5 + 3,
        Math.sin(i * 0.13) * 9,
      ),
      direction = new T.Vector3(
        Math.sin(i * 0.47) + 0.1,
        Math.cos(i * 0.19) + 0.2,
        Math.sin(i * 0.23) - 0.1,
      ).normalize();
    const hit = new T.Ray(origin, direction).intersectBox(box, new T.Vector3()),
      actual = rayBoxDistance(origin, direction, body);
    if (!hit) assert.equal(actual, Infinity);
    else assert.ok(Math.abs(actual - origin.distanceTo(hit)) < 1e-8);
  }
});
test("collision views reuse footprints until an edit and exclude only the moving object", () => {
  const cache = new CollisionCache(),
    permanent = { minX: 0, maxX: 2, minZ: 0, maxZ: 2, height: 5 },
    first = { minX: 5, maxX: 6, minZ: 5, maxZ: 6, height: 1, ownerId: "first" },
    second = {
      minX: 8,
      maxX: 9,
      minZ: 8,
      maxZ: 9,
      height: 1,
      ownerId: "second",
    };
  cache.replace([permanent], [first, second]);
  const all = cache.view();
  assert.equal(cache.view(), all);
  assert.equal(all.length, 3);
  const moving = cache.view("first");
  assert.equal(cache.view("first"), moving);
  assert.deepEqual(moving, [permanent, second]);
  assert.equal(cache.view().length, 3);
  cache.replace([permanent], [{ ...first, minX: 10, maxX: 11 }]);
  assert.notEqual(cache.view(), all);
  assert.equal(cache.view().length, 2);
  assert.equal(cache.view()[1].minX, 10);
});

test("a close-wall camera stays in front of the wall rather than enforcing an unsafe minimum radius", () => {
  const target = { x: 0, y: 1.35, z: -0.4 },
    offset = { x: 0, y: 3, z: 12 },
    wall = { minX: -2, maxX: 2, minZ: 0, maxZ: 2, height: 5 };
  const fraction = cameraFraction(target, offset, [wall]);
  assert.ok(fraction > 0 && fraction < 0.02);
  assert.ok(target.z + offset.z * fraction < wall.minZ - 0.18);
});
