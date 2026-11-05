import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { makeSunbeamCounty } from "../src/world/sunbeam-county";
import {
  Aircraft,
  AIRCRAFT_PARK,
  scenicPose,
} from "../src/simulation/aircraft";
import { collides, movePlayer, overlaps } from "../src/player/physics.js";
import { SpatialIndex, around } from "../src/legacy06/spatial.js";
import { initializeDoor, updateDoors } from "../src/legacy06/doors.js";
import { doorBox } from "../src/legacy06/door-geometry.js";
test("versioned airport adds accessible terminal, aircraft-width hangar and four destinations", () => {
  const w = makeSunbeamCounty(new T.Group(), 3),
    old = makeSunbeamCounty(new T.Group(), 2);
  assert.equal(w.houses.length, 38);
  assert.equal(w.doors.length, 48);
  assert.equal(w.landmarks.length, 61);
  assert.equal(old.aircraft, undefined);
  assert.deepEqual(
    w.staticSolids.slice(0, old.staticSolids.length),
    old.staticSolids,
  );
  const index = new SpatialIndex();
  w.solids.forEach((s: any) => index.add(s));
  for (const d of w.doors.slice(-2)) {
    initializeDoor(d, false, -1);
    const p: any = {
      x: d.center.x,
      y: 0,
      z: d.center.z + 3,
      yaw: 0,
      vy: 0,
      grounded: true,
    };
    for (let t = 0; t < 1.8; t += 1 / 60) {
      updateDoors(
        [d],
        p,
        [],
        index.query(around({ ...d.center, y: 0 }, 5)),
        true,
        t,
        1 / 60,
      );
      movePlayer(p, { forward: 1, edgeProtection: true }, 1 / 60, [
        ...index.query(around(p, 3)),
        doorBox(d),
        ...w.dynamicSolids(),
      ]);
    }
    assert.ok(p.z < d.center.z - 0.5, d.id);
  }
  const plane = w.aircraft!;
  plane.pose = { ...AIRCRAFT_PARK, z: -186 };
  for (const b of plane.solids())
    assert.equal(
      w.solids.some((s: any) => overlaps(b, s)),
      false,
      "Hangar aircraft clearance",
    );
});
test("aircraft boarding ramp, floor, aisle and exit use real walking physics", () => {
  const a = new Aircraft(new T.Group()),
    p: any = {
      x: 172,
      y: 0,
      z: -151,
      yaw: -Math.PI / 2,
      vy: 0,
      grounded: true,
    };
  for (let t = 0; t < 2; t += 1 / 60)
    movePlayer(p, { forward: 1, edgeProtection: true }, 1 / 60, a.solids());
  assert.ok(p.x > 177);
  assert.ok(Math.abs(p.y - 0.6) < 0.02, JSON.stringify(p));
  p.x = 178;
  p.yaw = 0;
  for (let t = 0; t < 3; t += 1 / 60)
    movePlayer(p, { forward: 1, edgeProtection: true }, 1 / 60, a.solids());
  assert.ok(p.z < -160, JSON.stringify(p));
  assert.equal(collides(p, a.solids()), false);
  p.z = -151;
  p.yaw = Math.PI / 2;
  for (let t = 0; t < 3; t += 1 / 60)
    movePlayer(p, { forward: 1, edgeProtection: true }, 1 / 60, a.solids());
  assert.ok(p.x < 173);
  assert.ok(p.y < 0.02, JSON.stringify(p));
});
test("guided passenger flight is bounded, clears authored county and returns to the boarding pose", () => {
  const w = makeSunbeamCounty(new T.Group(), 3),
    a = w.aircraft!,
    index = new SpatialIndex();
  w.solids.forEach((s: any) => index.add(s));
  const query = (p: any, r: number) => index.query(around(p, r));
  const p: any = { x: 178, y: 0.6, z: -159, yaw: 0, pitch: 0 };
  a.board(p);
  let high = false;
  for (let t = 0; t < 95; t += 1 / 30) {
    const message = a.update(1 / 30, p, query);
    if (p.y > 18) high = true;
    if (message) {
      assert.match(message, /Welcome/);
      break;
    }
    assert.ok(Math.abs(p.x) < 240 && Math.abs(p.z) < 240 && p.y < 25);
  }
  assert.equal(high, true);
  assert.equal(a.passenger, false);
  assert.deepEqual(a.pose, AIRCRAFT_PARK);
  assert.equal(p.y, 0.6);
  assert.equal(collides(p, [...w.solids, ...a.solids()]), false);
  for (let t = 0; t <= 94; t += 0.5) {
    const pose = scenicPose(t);
    assert.ok(Math.abs(pose.x) < 230 && Math.abs(pose.z) < 230 && pose.y <= 18);
  }
});
test("a blocked scenic route returns safely without moving or deleting the obstruction", () => {
  const a = new Aircraft(new T.Group()),
    p: any = { x: 178, y: 0.6, z: -159, yaw: 0, pitch: 0 },
    solid = { minX: 192, maxX: 194, minY: 0, maxY: 24, minZ: -170, maxZ: -140 };
  a.board(p);
  let message: any;
  for (let t = 0; t < 10 && !message; t += 1 / 60)
    message = a.update(1 / 60, p, () => [solid]);
  assert.match(message, /blocked/);
  assert.equal(a.passenger, false);
  assert.equal(p.y, 0.6);
  assert.equal(solid.maxY, 24);
});

test("blocked aircraft return retains the airborne passenger and valid pose", () => {
  const a = new Aircraft(new T.Group()),
    p: any = { x: 178, y: 0.6, z: -159, yaw: 0, pitch: 0 };
  a.board(p);
  a.pose = { x: 0, y: 18, z: 0, yaw: 0 };
  const before = { ...a.pose };
  assert.throws(() =>
    a.returnToPark(p, [
      { minX: 130, maxX: 230, minY: 0, maxY: 26, minZ: -200, maxZ: -130 },
    ]),
  );
  assert.equal(a.passenger, true);
  assert.deepEqual(a.pose, before);
});
