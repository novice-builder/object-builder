import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  bodyBox,
  cellBox,
  overlaps,
  movePlayer,
  collides,
  HOME,
} from "../src/core.js";
import { makeWorld, doorBox } from "../src/world.js";
import { doorSolidAt } from "../src/door-geometry.js";
import {
  initializeDoor,
  requestDoor,
  updateDoors,
  DOOR_CLOSE_DELAY,
} from "../src/doors.js";
import { installTouchButtons } from "../src/touch-buttons.js";
const world = makeWorld(new T.Scene());
function actor(p = {}) {
  return { x: 0.5, y: 0, z: 2, yaw: 0, vy: 0, grounded: true, ...p };
}
function advance(p, input, solids, seconds = 1, dt = 1 / 60) {
  for (let t = 0; t < seconds; t += dt) movePlayer(p, input, dt, solids);
}
function doorway(d, side, dist) {
  return actor({
    x: d.center.x + Math.sin(d.baseAngle) * side * dist,
    z: d.center.z + Math.cos(d.baseAngle) * side * dist,
    yaw: d.baseAngle + (side < 0 ? Math.PI : 0),
  });
}
function tick(d, p, auto, seconds, start = 0, blocks = []) {
  for (let t = 0; t < seconds; t += 0.016)
    updateDoors([d], p, blocks, world.solids, auto, start + t, 0.016);
}
test("02 failure: guard must work even with no material selected, and stay stable at high/low frame rates", () => {
  const solids = [cellBox({ x: 0, y: 0, z: 0 })];
  for (const dt of [1 / 240, 1 / 120, 1 / 60, 0.08])
    for (const yaw of [
      0,
      Math.PI / 2,
      Math.PI,
      (3 * Math.PI) / 2,
      Math.PI / 4,
    ]) {
      const p = actor({ x: 0.5, y: 1, z: 0.5, yaw });
      advance(p, { forward: 1, edgeProtection: true }, solids, 2, dt);
      assert.ok(p.y > 0.999, `guard at dt=${dt}, yaw=${yaw}`);
      assert.ok(p.x >= 0.1 && p.x <= 0.9 && p.z >= 0.1 && p.z <= 0.9);
    }
});
test("guard allows Jump, stops a second walking fall after landing, and OFF allows walking down", () => {
  const solids = [cellBox({ x: 0, y: 0, z: 0 }), cellBox({ x: 0, y: 0, z: 1 })];
  let p = actor({ x: 0.5, y: 1, z: 0.5, yaw: Math.PI });
  advance(p, { forward: 1, edgeProtection: true }, solids, 1);
  assert.equal(p.y, 1);
  assert.ok(p.z > 1 && p.z < 1.9, "walk across platform seam");
  p.vy = 6;
  p.grounded = false;
  advance(p, { forward: 1, edgeProtection: true }, solids, 1.5);
  assert.equal(p.y, 0);
  assert.ok(p.z > 3, "jump off deliberately");
  p = actor({ x: 0.5, y: 1, z: 0.5, yaw: Math.PI });
  advance(p, { forward: 1, edgeProtection: false }, solids, 2);
  assert.equal(p.y, 0);
  p = actor({ x: 0.5, y: 2, z: 0.5, yaw: 0 });
  advance(
    p,
    { forward: 0, edgeProtection: true },
    [...solids, cellBox({ x: 0, y: 1, z: 0 })],
    0.2,
  );
  assert.equal(p.y, 2);
  advance(
    p,
    { forward: 1, edgeProtection: true },
    [...solids, cellBox({ x: 0, y: 1, z: 0 })],
    1,
  );
  assert.equal(p.y, 2);
});
test("automatic climbing is removed even when an old saved caller supplies autoStep=true", () => {
  const b = { ...cellBox({ x: 0, y: 0, z: 0 }), step: true },
    p = actor();
  advance(p, { forward: 1, autoStep: true }, [b], 1);
  assert.equal(p.y, 0);
  assert.ok(p.z > 1.27);
  p.vy = 6;
  p.grounded = false;
  advance(p, { forward: 1 }, [b], 0.4);
  assert.ok(p.y > 0.9, "normal Jump still rises");
});
test("OBB narrow phase rejects false AABB obstruction inside the swung leaf bounding box", () => {
  const d = world.doors[0],
    leaf = doorSolidAt(d, Math.PI / 4),
    o = leaf.obb;
  const probe = {
    minX: leaf.minX + 0.01,
    maxX: leaf.minX + 0.04,
    minZ: leaf.minZ + 0.01,
    maxZ: leaf.minZ + 0.04,
    minY: 0.5,
    maxY: 1,
  };
  assert.ok(probe.minX < leaf.maxX && probe.maxZ > leaf.minZ);
  assert.equal(overlaps(probe, leaf), false);
  const centre = bodyBox(actor({ x: o.cx, z: o.cz }));
  assert.equal(overlaps(centre, leaf), true);
});
test("every door automatically opens away from either approach, animates safely, stays open nearby, then closes after a delay", () => {
  for (const d of world.doors)
    for (const side of [1, -1]) {
      initializeDoor(d);
      const p = doorway(d, side, 1.9);
      tick(d, p, true, 0.16);
      assert.equal(d.targetOpen, true, `${d.id} triggered ${side}`);
      assert.equal(d.swing, side, `${d.id} away from approach`);
      assert.ok(
        Math.abs(d.angle) > 0.02 && Math.abs(d.angle) < Math.PI / 2,
        "intermediate angle",
      );
      tick(d, p, true, 1, 0.16);
      assert.ok(Math.abs(Math.abs(d.angle) - Math.PI / 2) < 1e-5);
      for (let t = 1.2; t < 5; t += 0.1) {
        updateDoors([d], p, [], world.solids, true, t, 0.1);
        assert.equal(d.targetOpen, true);
        assert.ok(!overlaps(bodyBox(p), doorBox(d)));
      }
      const far = doorway(d, side, 4.5);
      tick(d, far, true, 0.8, 5);
      assert.equal(d.targetOpen, true, "delay is not skipped");
      tick(d, far, true, 2.5, 5.8);
      assert.equal(d.targetOpen, false);
      assert.ok(Math.abs(d.angle) < 1e-6, `${d.id} closed`);
    }
});
test("walk through, safe close and reopen from inside/outside every house without passing a closed leaf", () => {
  for (const d of world.doors)
    for (const side of [1, -1]) {
      initializeDoor(d);
      let p = doorway(d, side, 2);
      for (let t = 0; t < 2; t += 0.016) {
        updateDoors([d], p, [], world.solids, true, t, 0.016);
        movePlayer(p, { forward: 1 }, 0.016, [...world.solids, doorBox(d)]);
        assert.equal(
          overlaps(bodyBox(p), doorBox(d)),
          false,
          `${d.id} safe passage`,
        );
      }
      const signed =
        (p.x - d.center.x) * Math.sin(d.baseAngle) +
        (p.z - d.center.z) * Math.cos(d.baseAngle);
      assert.ok(signed * side < -1);
      initializeDoor(d, false);
      p = doorway(d, side, 2);
      advance(p, { forward: 1 }, [...world.solids, doorBox(d)], 1);
      assert.ok(Math.hypot(p.x - d.center.x, p.z - d.center.z) > 0.3);
      assert.ok(requestDoor(d, true, p, [], world.solids, true).ok);
      tick(d, p, false, 1);
      assert.ok(Math.abs(d.angle) > 1.5);
      p = doorway(d, -side, 2.2);
      assert.ok(requestDoor(d, false, p, [], world.solids, true).ok);
      tick(d, p, false, 1);
      assert.ok(Math.abs(d.angle) < 1e-6);
    }
});
test("closing refuses doorway occupancy and a blocked sweep, and reopens if a player returns mid-close", () => {
  const d = world.doors[0];
  initializeDoor(d, true, 1);
  let p = doorway(d, 1, 0.05);
  assert.equal(requestDoor(d, false, p, [], world.solids, true).ok, false);
  tick(d, p, true, 2);
  assert.equal(d.targetOpen, true);
  p = doorway(d, 1, 4.5);
  assert.ok(requestDoor(d, false, p, [], world.solids, true).ok);
  tick(d, p, false, 0.1);
  assert.ok(Math.abs(d.angle) > 0 && Math.abs(d.angle) < Math.PI / 2);
  p = doorway(d, 1, 0.2);
  tick(d, p, true, 1, 0.1);
  assert.equal(d.targetOpen, true);
  assert.equal(overlaps(bodyBox(p), doorBox(d)), false);
  initializeDoor(d);
  const leaf = doorSolidAt(d, Math.PI / 4),
    block = {
      x: Math.floor(leaf.obb.cx),
      y: 0,
      z: Math.floor(leaf.obb.cz),
      type: "wood",
    };
  assert.equal(
    requestDoor(d, true, doorway(d, 1, 4), [block], world.solids, true).ok,
    false,
    "placed obstruction is not bypassed",
  );
});
test("automatic OFF leaves closed doors closed; manual close has a near-player latch rather than immediately reopening", () => {
  const d = world.doors[0],
    p = doorway(d, 1, 2);
  initializeDoor(d);
  tick(d, p, false, 2);
  assert.equal(d.angle, 0);
  assert.ok(requestDoor(d, true, p, [], world.solids, true).ok);
  tick(d, p, false, 1);
  assert.ok(requestDoor(d, false, p, [], world.solids, true).ok);
  tick(d, p, true, 3, 1);
  assert.ok(Math.abs(d.angle) < 1e-6);
  assert.equal(d.manualHold, true);
  tick(d, doorway(d, 1, 5), true, 0.3, 4);
  tick(d, p, true, 1, 4.3);
  assert.ok(Math.abs(d.angle) > 1.5);
});
test("all parts of a browser-targeted button activate once despite rectangle differences and metadata-free compatibility clicks", () => {
  const root = new EventTarget();
  let count = 0;
  const b = {
    disabled: false,
    isConnected: true,
    click() {
      count++;
    },
    getBoundingClientRect: () => ({
      left: 100,
      top: 100,
      right: 150,
      bottom: 150,
    }),
  };
  installTouchButtons(root);
  const emit = (type, values = {}) => {
    const e = new Event(type, { cancelable: true });
    Object.defineProperties(
      e,
      Object.fromEntries(
        Object.entries({ target: { closest: () => b }, ...values }).map(
          ([k, v]) => [k, { value: v }],
        ),
      ),
    );
    root.dispatchEvent(e);
    return e;
  };
  for (const [x, y] of [
    [0, 0],
    [25, 0],
    [50, 0],
    [0, 25],
    [25, 25],
    [50, 25],
    [0, 50],
    [25, 50],
    [50, 50],
  ]) {
    emit("pointerdown", {
      pointerType: "touch",
      pointerId: 1,
      clientX: x,
      clientY: y,
    });
    emit("pointerup", {
      pointerType: "touch",
      pointerId: 1,
      clientX: x,
      clientY: y,
    });
    assert.equal(emit("click").defaultPrevented, true);
  }
  assert.equal(count, 9);
  emit("keydown");
  assert.equal(
    emit("click").defaultPrevented,
    false,
    "keyboard activation is not suppressed",
  );
  emit("pointerdown", { pointerType: "mouse" });
  assert.equal(emit("click").defaultPrevented, false);
});

test("leaf collision follows the rendered leaf at closed, intermediate and fully open angles", () => {
  for (const d of world.doors)
    for (const angle of [
      -Math.PI / 2,
      -Math.PI / 4,
      0,
      Math.PI / 4,
      Math.PI / 2,
    ]) {
      d.angle = angle;
      d.pivot.rotation.y = d.baseAngle + angle;
      d.pivot.updateMatrixWorld(true);
      const meshBounds = new T.Box3().setFromObject(d.pivot.children[0]),
        shape = doorSolidAt(d, angle);
      assert.ok(
        Math.abs((meshBounds.min.x + meshBounds.max.x) / 2 - shape.obb.cx) <
          1e-5,
      );
      assert.ok(
        Math.abs((meshBounds.min.z + meshBounds.max.z) / 2 - shape.obb.cz) <
          1e-5,
      );
      assert.ok(
        meshBounds.min.x >= shape.minX - 1e-5 &&
          meshBounds.max.x <= shape.maxX + 1e-5 &&
          meshBounds.min.z >= shape.minZ - 1e-5 &&
          meshBounds.max.z <= shape.maxZ + 1e-5,
      );
      assert.ok(Math.abs(meshBounds.max.y - shape.maxY) < 1e-5);
    }
});
test("an obstruction in the middle of the swing prevents closing even when both endpoints are clear", () => {
  const d = world.doors[0];
  initializeDoor(d, true, 1);
  const mid = doorSolidAt(d, Math.PI / 4),
    o = mid.obb;
  const obstacle = {
    minX: o.cx - 0.04,
    maxX: o.cx + 0.04,
    minZ: o.cz - 0.04,
    maxZ: o.cz + 0.04,
    minY: 0.4,
    maxY: 1.2,
  };
  assert.equal(overlaps(obstacle, doorSolidAt(d, 0)), false);
  assert.equal(overlaps(obstacle, doorSolidAt(d, Math.PI / 2)), false);
  assert.equal(overlaps(obstacle, mid), true);
  assert.equal(
    requestDoor(
      d,
      false,
      doorway(d, 1, 5),
      [],
      [...world.solids, obstacle],
      true,
    ).ok,
    false,
  );
  assert.equal(d.targetOpen, true);
});
