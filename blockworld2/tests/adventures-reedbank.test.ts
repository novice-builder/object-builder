import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REEDBANK,
  REEDBANK_ROADS,
  REEDBANK_BUILDINGS,
} from "../src/adventures/reedbank-data";
import { NORTH_CROSSING } from "../src/adventures/crossings";
import {
  valeWalk,
  valeWater,
  valeRivers,
  inWorld,
} from "../src/adventures/vale-data";
import { smoothTrail, waterBlocked } from "../src/adventures/landscape";
import { makeSnapshot, validateAdventure } from "../src/adventures/save";
test("Reedbank and the new crossing are opt-in layout 6; earlier records and water/ground remain unchanged", () => {
  for (const layout of [3, 4, 5, 6] as const) {
    const s = makeSnapshot(
      {
        version: 1,
        scene: "vale",
        layout,
        objects: [
          {
            id: "keep-river-construction",
            asset: "barrel",
            x: 12,
            z: -52,
            yaw: 0.4,
            scale: 4,
          },
        ],
        discoveries: [],
      },
      { x: 12, z: -52, yaw: 0, pitch: 0.47 },
    );
    assert.equal(validateAdventure(s).layout, layout);
    assert.equal(validateAdventure(s).objects[0].id, "keep-river-construction");
  }
  const r = valeRivers(NORTH_CROSSING.z)[1];
  for (const layout of [3, 4, 5]) {
    assert.equal(valeWater(r, -52, layout), true);
    assert.equal(valeWalk(r, -52, layout), -1.65);
  }
  assert.equal(valeWater(r, -52, 6), false);
  assert.ok(Math.abs(valeWalk(r, -52, 6) - 0.44) < 1e-10);
  assert.equal(waterBlocked(r, -52, "vale", 6), false);
  for (const z of [-56, -55, -49, -48])
    assert.equal(valeWater(valeRivers(z)[1], z, 6), true);
  assert.equal(valeWater(valeRivers(-52)[0], -52, 6), true);
});
test("all new lane samples are continuous, dry and within the existing world; bridge profile has no large height step", () => {
  for (const road of REEDBANK_ROADS) {
    const points = smoothTrail(road.points);
    for (let i = 0; i < points.length; i++) {
      const [x, z] = points[i];
      assert.equal(inWorld(x, z, "vale", 1), true);
      assert.equal(valeWater(x, z, 6), false, JSON.stringify({ x, z }));
      if (i)
        assert.ok(Math.hypot(x - points[i - 1][0], z - points[i - 1][1]) < 1.5);
    }
  }
  const r = valeRivers(-52)[1];
  let last = valeWalk(r - 6, -52, 6);
  for (let x = r - 5.95; x < r + 6; x += 0.05) {
    const y = valeWalk(x, -52, 6);
    assert.ok(Math.abs(y - last) < 0.1);
    last = y;
  }
  assert.equal(valeWater(REEDBANK.x, REEDBANK.z, 6), false);
});
test("new building seeds are unique, reachable-height dry centres, and foreign layouts are refused", () => {
  const positions = new Set();
  for (const p of REEDBANK_BUILDINGS) {
    assert.equal(valeWater(p.x, p.z, 6), false);
    assert.equal(valeWalk(p.x, p.z, 6), 0);
    assert.ok(!positions.has(`${p.x}:${p.z}`));
    positions.add(`${p.x}:${p.z}`);
  }
  const foreign = makeSnapshot(
    { version: 1, scene: "woodland", layout: 6, objects: [], discoveries: [] },
    { x: 0, z: 18, yaw: 0, pitch: 0.47 },
  );
  assert.throws(() => validateAdventure(foreign), /supported/);
});
