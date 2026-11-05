import { test } from "node:test";
import assert from "node:assert/strict";
import { lodgeWalls, lodgeDoorBody } from "../src/adventures/lodge";
import { blocked, walkHeight } from "../src/adventures/landscape";
import { makeSnapshot, validateAdventure } from "../src/adventures/save";
import { rayBoxDistance } from "../src/adventures/camera-collision";
test("lodge doorway is traversable only with an open door", () => {
  const walls = lodgeWalls();
  for (let z = -40; z < -37; z += 0.05)
    assert.equal(blocked(128, z, [...walls, lodgeDoorBody(true)]), false);
  assert.equal(blocked(128, -38.7, [...walls, lodgeDoorBody(false)]), true);
  assert.equal(blocked(124.7, -42, walls), true);
});
test("lodge floor affects only new explicit layout 4", () => {
  assert.equal(walkHeight(128, -42, "vale", 3), 0);
  assert.equal(walkHeight(128, -42, "vale", 4), 0.06);
  const s = makeSnapshot(
    {
      version: 1,
      scene: "vale",
      layout: 4,
      objects: [],
      discoveries: [],
      doors: { lodge: true },
    },
    { x: 128, z: -42, yaw: 0, pitch: 0.47 },
  );
  assert.equal(validateAdventure(s).doors?.lodge, true);
  (s.world.adventure as any).doors.lodge = "open";
  assert.throws(() => validateAdventure(s), /supported/);
});
test("camera roof slab keeps its real base above walking space", () => {
  const roof = {
    minX: 124,
    maxX: 132,
    minZ: -46,
    maxZ: -38,
    base: 3.3,
    height: 5.8,
  };
  assert.equal(
    rayBoxDistance({ x: 128, y: 1.4, z: -42 }, { x: 1, y: 0, z: 0 }, roof, 0),
    Infinity,
  );
  assert.ok(
    Math.abs(
      rayBoxDistance(
        { x: 128, y: 1.4, z: -42 },
        { x: 0, y: 1, z: 0 },
        roof,
        0,
      ) - 1.9,
    ) < 1e-9,
  );
});
