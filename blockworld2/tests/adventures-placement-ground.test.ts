import { test } from "node:test";
import assert from "node:assert/strict";
import {
  footprintGroundProblem,
  type PlacementGround,
} from "../src/adventures/placement-ground";
const body = { minX: 0, maxX: 8, minZ: 0, maxZ: 8, height: 5 };
const clear: PlacementGround = {
  inside: () => true,
  water: () => false,
  path: () => false,
  height: () => 0,
};
test("large footprints catch water and narrow paths missed by a centre-only check", () => {
  assert.equal(footprintGroundProblem(body, 0, clear), null);
  assert.match(
    footprintGroundProblem(body, 0, { ...clear, water: (x) => x < 1 })!,
    /water/,
  );
  assert.match(
    footprintGroundProblem(body, 0, {
      ...clear,
      path: (x) => x > 1 && x < 2.5,
    })!,
    /paths/,
  );
});
test("footprints reject buried/floating corners and out-of-world edges", () => {
  assert.match(
    footprintGroundProblem(body, 0, {
      ...clear,
      height: (x, z) => (x === 0 && z === 0 ? 1 : 0),
    })!,
    /flatter/,
  );
  assert.match(
    footprintGroundProblem(body, 0, { ...clear, inside: (x) => x < 7 })!,
    /whole object/,
  );
});
