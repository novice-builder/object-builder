import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { findDetour } from "../src/simulation/navigation";
import { stepRoute, type RouteState } from "../src/simulation/routes";
import { RoadTraffic } from "../src/simulation/road-traffic";
import { Activity, carBox } from "../src/simulation/activity";
import { overlaps } from "../src/player/physics.js";
test("local route planning walks around a new wall without teleporting", () => {
  const blocked = (x: number, z: number) => x > 1 && x < 3 && Math.abs(z) < 1.5;
  const path = findDetour({ x: 0, z: 0 }, { x: 5, z: 0 }, blocked);
  assert.ok(path);
  assert.ok(path.some((p) => Math.abs(p.z) >= 2));
  const s: RouteState = { x: 0, z: 0, target: 1, wait: 0, stuck: 0 };
  let reached = false;
  for (let t = 0; t < 15; t += 0.05) {
    const old = { ...s };
    stepRoute(
      s,
      [
        { x: 0, z: 0 },
        { x: 5, z: 0 },
      ],
      0.05,
      1,
      blocked,
    );
    assert.ok(Math.hypot(s.x - old.x, s.z - old.z) <= 0.051);
    assert.equal(blocked(s.x, s.z), false);
    if (s.x > 4.8) reached = true;
  }
  assert.ok(reached);
  assert.equal(
    findDetour({ x: 0, z: 0 }, { x: 5, z: 0 }, () => true, 16),
    null,
  );
});
test("region population is bounded with eight species and four lane traffic vehicles", () => {
  const a = new Activity(new T.Scene(), 148);
  assert.equal(a.agents.filter((x) => !x.animal).length, 12);
  assert.equal(
    new Set(a.agents.filter((x) => x.animal).map((x) => x.species)).size,
    8,
  );
  assert.equal(a.traffic.length, 4);
  assert.ok(a.roadTraffic);
  a.dispose();
});
test("traffic deterministically traverses junctions with exclusive reservations and safe spacing", () => {
  const a = new RoadTraffic(),
    b = new RoadTraffic();
  const before = a.cars.map((c) => ({ ...c }));
  for (let i = 0; i < 4000; i++) {
    const block =
      (cars: RoadTraffic) =>
      (x: number, z: number, yaw: number, index: number) =>
        cars.cars.some(
          (c, n) => n !== index && overlaps(carBox({ x, z, yaw }), carBox(c)),
        );
    const old = a.cars.map((c) => ({ ...c }));
    a.update(0.05, block(a));
    b.update(0.05, block(b));
    for (let n = 0; n < 4; n++)
      assert.ok(
        Math.hypot(a.cars[n].x - old[n].x, a.cars[n].z - old[n].z) < 0.141,
      );
    for (let n = 0; n < 4; n++)
      for (let j = n + 1; j < 4; j++)
        assert.equal(overlaps(carBox(a.cars[n]), carBox(a.cars[j])), false);
  }
  assert.deepEqual(a.cars, b.cars);
  assert.ok(a.cars.every((c) => c.visits >= 2));
  assert.notDeepEqual(
    a.cars.map((c) => [c.x, c.z]),
    before.map((c) => [c.x, c.z]),
  );
});
test("a blocked road reverses safely and resumes without position jumps", () => {
  const traffic = new RoadTraffic();
  for (let i = 0; i < 200; i++) traffic.update(0.05, () => false);
  for (let i = 0; i < 160; i++) traffic.update(0.05, () => true);
  assert.ok(traffic.cars.some((c) => c.reverse));
  const before = traffic.cars.map((c) => ({ ...c }));
  for (let i = 0; i < 200; i++) traffic.update(0.05, () => false);
  assert.ok(
    traffic.cars.some(
      (c, i) => Math.hypot(c.x - before[i].x, c.z - before[i].z) > 1,
    ),
  );
});
