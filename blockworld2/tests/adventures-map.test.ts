import { test } from "node:test";
import assert from "node:assert/strict";
import { MapTransform, createMapData } from "../src/adventures/map-data";
import { worldBounds } from "../src/adventures/vale-data";
import { clearArrival } from "../src/adventures/safe-position";
test("map transforms preserve world positions across zoom and pan", () => {
  const t = new MapTransform(worldBounds("vale"), 390, 680),
    point = { x: 105, z: 16 };
  const p = t.screen(point.x, point.z);
  const restored = t.world(p.x, p.y);
  assert.ok(Math.hypot(restored.x - point.x, restored.z - point.z) < 1e-9);
  const anchor = t.world(230, 330);
  t.zoom(2, 230, 330);
  const after = t.world(230, 330);
  assert.ok(Math.hypot(anchor.x - after.x, anchor.z - after.z) < 1e-9);
  t.pan(20, -30);
  const p2 = t.screen(point.x, point.z);
  assert.ok(Math.abs(t.world(p2.x, p2.y).x - point.x) < 1e-9);
  for (let i = 0; i < 100; i++) t.zoom(2);
  assert.ok(Number.isFinite(t.scale));
  t.fit();
  assert.equal(t.x, 0);
});
test("map reads actual roads, buildings and river coordinates", () => {
  const paths = [
      {
        points: [
          [0, 0],
          [10, 0],
        ],
        width: 3,
      },
    ],
    house = {
      minX: 3,
      maxX: 6,
      minZ: 4,
      maxZ: 9,
      height: 6,
      name: "building_home_A_blue",
    };
  const data = createMapData("vale", {
    paths,
    obstacles: [house, { ...house, name: "tree" }],
    landmarks: [],
  });
  assert.equal(data.paths, paths);
  assert.equal(data.buildings[0], house);
  assert.equal(data.rivers.length, 2);
  assert.equal(data.destinations.length, 5);
  assert.equal(data.trees.length, 1);
});
test("safe landmark arrivals never return unchecked blocked ground", () => {
  assert.deepEqual(
    clearArrival({ x: 1, z: 2 }, () => true),
    { x: 1, z: 2 },
  );
  assert.equal(
    clearArrival({ x: 1, z: 2 }, () => false, 3),
    null,
  );
  const p = clearArrival(
    { x: 0, z: 0 },
    (x, z) => x > 1 && Math.abs(z) < 0.5,
    4,
  )!;
  assert.ok(p.x > 1 && Math.abs(p.z) < 0.5);
});
