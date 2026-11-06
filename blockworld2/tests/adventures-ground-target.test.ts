import { test } from "node:test";
import assert from "node:assert/strict";
import { groundTarget } from "../src/adventures/ground-target";

test("picking finds flat ground at the analytic ray intersection", () => {
  const hit = groundTarget(
    { x: 2, y: 5, z: 10 },
    { x: 0, y: -0.6, z: -0.8 },
    () => 0,
  )!;
  assert.ok(Math.abs(hit.x - 2) < 0.0002 && Math.abs(hit.z - 10 / 3) < 0.0002);
  assert.equal(hit.y, 0);
});
test("picking follows sloping terrain rather than an infinite y-zero plane", () => {
  const origin = { x: 2, y: 5, z: 10 },
    direction = { x: 0, y: -0.6, z: -0.8 },
    height = (x: number, z: number) => x * 0.1 + z * 0.2,
    distance =
      (origin.y - height(origin.x, origin.z)) /
      (0.2 * direction.z - direction.y),
    hit = groundTarget(origin, direction, height)!;
  assert.ok(Math.abs(hit.z - (origin.z + direction.z * distance)) < 0.0002);
  assert.equal(hit.y, height(hit.x, hit.z));
});
test("floor support is retained at the first hit, including a raised interior surface", () => {
  const floor = (x: number, z: number) =>
      Math.abs(x) < 3 && Math.abs(z) < 3 ? 0.06 : 0,
    hit = groundTarget({ x: 1, y: 3, z: 1 }, { x: 0, y: -1, z: 0 }, floor)!;
  assert.deepEqual(hit, { x: 1, y: 0.06, z: 1 });
});
test("sky, underground, invalid and beyond-range rays do not create targets", () => {
  const origin = { x: 0, y: 5, z: 0 };
  assert.equal(
    groundTarget(origin, { x: 0, y: 1, z: 0 }, () => 0),
    null,
  );
  assert.equal(
    groundTarget(origin, { x: 0, y: 0, z: -1 }, () => 0),
    null,
  );
  assert.equal(
    groundTarget({ x: 0, y: -1, z: 0 }, { x: 0, y: -1, z: 0 }, () => 0),
    null,
  );
  assert.equal(
    groundTarget(origin, { x: NaN, y: -1, z: 0 }, () => 0),
    null,
  );
  assert.equal(
    groundTarget(origin, { x: 0, y: -1, z: 0 }, () => 0, 4),
    null,
  );
});
