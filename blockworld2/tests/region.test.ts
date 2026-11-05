import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { makeSunbeamRegion } from "../src/world/sunbeam-region";
import { makeSunbeamTown } from "../src/world/sunbeam-town";
import { collides, movePlayer } from "../src/player/physics.js";
import { initializeDoor, updateDoors } from "../src/legacy06/doors.js";
import { doorBox } from "../src/legacy06/door-geometry.js";
import { SpatialIndex, around } from "../src/legacy06/spatial.js";
import { safeGround } from "../src/world/spawn";
import { carBox } from "../src/simulation/activity";
test("region preserves old town geometry and adds 26 furnished buildings, six garages and eight plots", () => {
  const old = makeSunbeamTown(new T.Group()),
    w = makeSunbeamRegion(new T.Group());
  assert.equal(w.houses.length, 26);
  assert.equal(w.doors.length, 32);
  assert.equal(w.doors.filter((d: any) => d.kind === "roller").length, 6);
  assert.equal(w.plots.length, 8);
  assert.equal(w.landmarks.length, 36);
  assert.equal(w.stairs.length, 3);
  assert.deepEqual(w.solids.slice(0, old.solids.length), old.solids);
  for (const p of w.plots)
    assert.equal(
      collides({ ...p, y: 0 }, w.solids),
      false,
      "Plot " + p.x + "," + p.z,
    );
  for (const r of w.rooms)
    assert.equal(collides(r, w.solids), false, JSON.stringify(r));
  for (const place of w.landmarks) {
    const p = safeGround(place, w.solids);
    assert.equal(collides(p, w.solids), false, place.name);
  }
  for (const d of w.doors.filter((d: any) => d.kind === "roller")) {
    const p = {
      x: d.center.x - Math.sin(d.baseAngle) * 3,
      z: d.center.z - Math.cos(d.baseAngle) * 3,
      yaw: d.baseAngle,
    };
    const box = carBox(p);
    assert.equal(
      w.solids.some(
        (s: any) =>
          s.minY < 1.7 &&
          s.maxY > 0 &&
          s.minX < box.maxX &&
          s.maxX > box.minX &&
          s.minZ < box.maxZ &&
          s.maxZ > box.minZ,
      ),
      false,
      d.id,
    );
  }
});
test("all 32 region doorways and all three stair landings are traversable", () => {
  const w = makeSunbeamRegion(new T.Group()),
    index = new SpatialIndex();
  for (const b of w.solids) index.add(b);
  for (const d of w.doors) {
    initializeDoor(d, false, -1);
    const p: any = {
      x: d.center.x + Math.sin(d.baseAngle) * 3,
      z: d.center.z + Math.cos(d.baseAngle) * 3,
      y: 0,
      yaw: d.baseAngle,
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
      ]);
    }
    assert.ok(
      (p.x - d.center.x) * Math.sin(d.baseAngle) +
        (p.z - d.center.z) * Math.cos(d.baseAngle) <
        -0.5,
      d.id,
    );
  }
  for (const stair of w.stairs) {
    const p: any = {
      x: stair.x,
      z: stair.z,
      y: 0,
      yaw: stair.yaw,
      vy: 0,
      grounded: true,
    };
    for (let t = 0; t < 5; t += 1 / 60)
      movePlayer(
        p,
        { forward: 1, edgeProtection: true },
        1 / 60,
        index.query(around(p, 4)),
      );
    assert.ok(p.y >= 3.19, stair.id + " stopped at " + p.y);
    assert.equal(collides(p, index.query(around(p, 3))), false);
    p.yaw += Math.PI;
    for (let t = 0; t < 5; t += 1 / 60)
      movePlayer(
        p,
        { forward: 1, edgeProtection: true },
        1 / 60,
        index.query(around(p, 4)),
      );
    assert.ok(p.y < 0.1, stair.id + " descent stopped at " + p.y);
  }
});
