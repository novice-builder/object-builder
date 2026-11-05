import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { makeSunbeamTown } from "../src/world/sunbeam-town";
import { makeHomeSquare } from "../src/world/home-square";
import { bodyBox, collides, movePlayer } from "../src/player/physics.js";
import { initializeDoor, updateDoors } from "../src/legacy06/doors.js";
import { doorBox } from "../src/legacy06/door-geometry.js";
import { carBox } from "../src/simulation/activity";
import { SpatialIndex, around } from "../src/legacy06/spatial.js";
test("new town preserves the original template and provides 12 furnished buildings, three garages and clear plots", () => {
  const original = makeHomeSquare(new T.Group()),
    town = makeSunbeamTown(new T.Group());
  assert.equal(original.houses.length, 4);
  assert.equal(town.houses.length, 12);
  assert.equal(town.doors.length, 15);
  assert.equal(town.doors.filter((d: any) => d.kind === "roller").length, 3);
  assert.equal(town.plots.length, 4);
  for (const p of town.plots)
    assert.equal(
      collides({ x: p.x, y: 0, z: p.z }, town.solids),
      false,
      "Plot " + p.x,
    );
  for (const r of town.rooms)
    assert.equal(collides({ ...r, y: 0 }, town.solids), false, r.id);
  for (const d of town.doors.filter((d: any) => d.kind === "roller")) {
    const p = {
      x: d.center.x - Math.sin(d.baseAngle) * 3,
      yaw: d.baseAngle,
      z: d.center.z - Math.cos(d.baseAngle) * 3,
    };
    assert.equal(
      town.solids.some((s: any) => collides({ x: p.x, y: 0, z: p.z }, [s])),
      false,
    );
    const shape = carBox(p);
    assert.equal(
      town.solids.some(
        (s: any) =>
          s.maxY > 0 &&
          s.minY < 1.7 &&
          s.minX < shape.maxX &&
          s.maxX > shape.minX &&
          s.minZ < shape.maxZ &&
          s.maxZ > shape.minZ,
      ),
      false,
    );
  }
});
test("all 15 town doorways open and permit passage from their approach paths", () => {
  const town = makeSunbeamTown(new T.Group()),
    index = new SpatialIndex();
  for (const b of town.solids) index.add(b);
  for (const d of town.doors) {
    initializeDoor(d, false, -1);
    const p: any = {
      x: d.center.x + Math.sin(d.baseAngle) * 3,
      z: d.center.z + Math.cos(d.baseAngle) * 3,
      y: 0,
      yaw: d.baseAngle,
      pitch: 0,
      vy: 0,
      grounded: true,
    };
    for (let time = 0; time < 1.8; time += 1 / 60) {
      updateDoors(
        [d],
        p,
        [],
        index.query(around({ ...d.center, y: 0 }, 5)),
        true,
        time,
        1 / 60,
      );
      movePlayer(p, { forward: 1, edgeProtection: true }, 1 / 60, [
        ...index.query(around(p, 3)),
        doorBox(d),
      ]);
    }
    const dot =
      (p.x - d.center.x) * Math.sin(d.baseAngle) +
      (p.z - d.center.z) * Math.cos(d.baseAngle);
    assert.ok(dot < -0.5, `${d.id} passage stopped at ${dot}`);
  }
});
