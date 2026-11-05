import { test } from "node:test";
import assert from "node:assert/strict";
import { makeSnapshot, validateAdventure } from "../src/adventures/save";
import {
  VALE_REGIONS,
  valeGround,
  valeWalk,
  valeWater,
  inWorld,
} from "../src/adventures/vale-data";
import { waterBlocked, walkHeight, riverX } from "../src/adventures/landscape";
import { CONNECTING_ROADS } from "../src/adventures/connected-landscape";
import { smoothTrail } from "../src/adventures/landscape";
test("connected world keeps legacy coordinates isolated and validates expanded bounds", () => {
  const snapshot = makeSnapshot(
    {
      version: 1,
      scene: "vale",
      layout: 3,
      objects: [
        { id: "east", asset: "barrel", x: 120, z: 40, yaw: 0, scale: 4 },
      ],
      discoveries: [],
    },
    { x: -105, z: 18, yaw: 0, pitch: 0.47 },
  );
  assert.equal(validateAdventure(snapshot).scene, "vale");
  snapshot.world.adventure = {
    ...(snapshot.world.adventure as any),
    scene: "village",
  };
  assert.throws(() => validateAdventure(snapshot), /Invalid imported/);
  assert.equal(inWorld(184, 97, "vale"), true);
  assert.equal(inWorld(185, 97, "vale"), false);
  assert.equal(inWorld(90, 0, "village"), false);
});
test("both connected river bridges share terrain, water and walking coordinates", () => {
  for (const origin of [-105, 0])
    for (let x = 23; x <= 39; x += 0.1) {
      assert.equal(waterBlocked(x + origin, 8, "vale"), false);
      assert.equal(walkHeight(x + origin, 8, "vale"), valeWalk(x + origin, 8));
    }
  for (const origin of [-105, 0])
    assert.equal(valeWater(riverX(20) + origin, 20), true);
  for (const r of VALE_REGIONS)
    assert.ok(Number.isFinite(valeGround(r.x, r.z)));
});
test("new connecting trails never cross water outside a bridge", () => {
  for (const road of CONNECTING_ROADS)
    for (const [x, z] of smoothTrail(road.points, 0.3))
      assert.equal(valeWater(x, z), false, `${x},${z}`);
});
