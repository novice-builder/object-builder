import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { Activity, carBox } from "../src/simulation/activity";
import { overlaps, collides } from "../src/player/physics.js";
import { fromGame, encode, decode } from "../src/persistence/schema";
test("three county vehicles use consistent controls, individual collision profiles and independent checkpoints", () => {
  const a = new Activity(new T.Scene(), 238, () => []);
  assert.equal(a.vehicles.length, 3);
  for (const i of [0, 1, 2]) {
    const v = a.vehicles[i],
      p: any = { x: v.state.x + 2, y: 0, z: v.state.z, yaw: 0, pitch: 0 },
      before = { ...v.state };
    a.use(p, a.entitySolids(), i);
    assert.equal(a.driving, true);
    for (let n = 0; n < 60; n++)
      a.update(1 / 60, p, { forward: 1, right: 0 }, []);
    assert.ok(Math.hypot(v.state.x - before.x, v.state.z - before.z) > 4);
    const recovery = a.savedPlayer(p);
    assert.equal(collides(recovery, a.entitySolids()), false);
    a.use(p, a.entitySolids());
    assert.equal(a.driving, false);
    assert.equal(collides(p, a.entitySolids()), false);
  }
  const p = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    s = fromGame({
      template: "sunbeam-county",
      blocks: [],
      doors: {},
      selected: "hand",
      player: p,
      activity: a.snapshot(),
    }),
    b = new Activity(new T.Scene(), 238);
  b.load(decode(encode(s)).world.activity);
  assert.deepEqual(b.snapshot().vehicles, a.snapshot().vehicles);
  assert.deepEqual(b.snapshot().car, a.snapshot().car);
  assert.equal(carBox(a.vehicles[2].state).obb.halfW, 0.48);
  assert.equal(carBox(a.vehicles[0].state).obb.halfW, 0.8);
  a.dispose();
  b.dispose();
});
test("parked fleet blocks a driven vehicle and blocked exits retain the driver", () => {
  const a = new Activity(new T.Scene(), 238, () => []),
    v = a.vehicles[1];
  v.state = { x: -28, z: -8, yaw: 0 };
  const p: any = { x: -26, y: 0, z: -2, yaw: 0 };
  a.use(p, [], 0);
  for (let n = 0; n < 300; n++)
    a.update(1 / 60, p, { forward: 1, right: 0 }, []);
  assert.ok(a.car.z > -4.8);
  assert.equal(overlaps(carBox(a.car), carBox(v.state)), false);
  assert.throws(() =>
    a.use(p, [
      { minX: -250, maxX: 250, minY: 0, maxY: 3, minZ: -250, maxZ: 250 },
    ]),
  );
  assert.equal(a.driving, true);
  a.dispose();
});
