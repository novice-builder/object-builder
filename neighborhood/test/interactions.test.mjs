import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  movePlayer,
  collides,
  cellBox,
  bodyBox,
  overlaps,
  freshState,
  validateSave,
  placementReason,
  HOME,
} from "../src/core.js";
import { makeWorld, doorBox } from "../src/world.js";
import { doorOperation } from "../src/doors.js";
import { detailedPiece } from "../src/pieces.js";
import { installTouchButtons } from "../src/touch-buttons.js";
const world = makeWorld(new T.Scene());
const player = (p = {}) => ({
  x: 0,
  y: 0,
  z: 1.5,
  yaw: 0,
  pitch: 0,
  vy: 0,
  grounded: true,
  ...p,
});
function advance(p, input, solids, n = 100) {
  for (let i = 0; i < n; i++) movePlayer(p, input, 0.016, solids);
}
test("auto-step is optional, limited to 1 m building blocks, and requires headroom", () => {
  const b = { ...cellBox({ x: -1, y: 0, z: 0 }), step: true };
  let p = player({ x: -0.5 });
  advance(p, { forward: 1 }, [b]);
  assert.equal(p.y, 0);
  assert.ok(p.z > 1.27);
  p = player({ x: -0.5 });
  advance(p, { forward: 1, autoStep: true }, [b], 24);
  assert.ok(p.y > 0.99);
  assert.ok(p.z < 1);
  p = player({ x: -0.5 });
  advance(p, { forward: 1, autoStep: true }, [{ ...b, maxY: 1.1 }], 24);
  assert.equal(p.y, 0);
  p = player({ x: -0.5 });
  advance(p, { forward: 1, autoStep: true }, [{ ...b, step: false }], 24);
  assert.equal(p.y, 0);
  p = player({ x: -0.5 });
  advance(
    p,
    { forward: 1, autoStep: true },
    [b, { minX: -2, maxX: 2, minZ: 0, maxZ: 1, minY: 2.4, maxY: 3 }],
    24,
  );
  assert.equal(p.y, 0);
});
test("edge protection stops drops while allowing normal walking, Jump, and an explicit bypass", () => {
  const block = { ...cellBox({ x: 0, y: 0, z: 0 }), step: true };
  let p = player({ x: 0.5, z: 0.5, y: 1, yaw: Math.PI });
  advance(p, { forward: 1, edgeProtection: true }, [block]);
  assert.ok(p.y > 0.99);
  assert.ok(p.z < 1.29);
  p = player({ x: 0.5, z: 0.5, y: 1, yaw: Math.PI });
  advance(p, { forward: 1 }, [block]);
  assert.equal(p.y, 0);
  assert.ok(p.z > 2);
  p = player({ x: 0.5, z: 0.5, y: 1, yaw: Math.PI });
  advance(p, { forward: 1, edgeProtection: true, allowDrop: true }, [block]);
  assert.equal(p.y, 0);
  p = player({ x: 0.5, z: 0.5, y: 1, yaw: Math.PI, vy: 6, grounded: false });
  advance(p, { forward: 1, edgeProtection: true }, [block]);
  assert.equal(p.y, 0);
  assert.ok(p.z > 2);
});
test("both assists together can climb without getting stuck at the leading edge", () => {
  const block = { ...cellBox({ x: -1, y: 0, z: 0 }), step: true },
    p = player({ x: -0.5 });
  advance(p, { forward: 1, autoStep: true, edgeProtection: true }, [block], 30);
  assert.ok(p.y > 0.99);
  assert.ok(p.z < 1);
});
test("every house door opens, passes, closes and reopens from both sides while remaining solid when closed", () => {
  for (const d of world.doors)
    for (const side of [1, -1]) {
      d.open = false;
      d.swing = -1;
      const n = { x: Math.sin(d.baseAngle), z: Math.cos(d.baseAngle) };
      let p = player({
        x: d.center.x + n.x * side * 1.9,
        z: d.center.z + n.z * side * 1.9,
        yaw: d.baseAngle + (side < 0 ? Math.PI : 0),
      });
      advance(p, { forward: 1 }, [...world.solids, doorBox(d)], 80);
      assert.ok(Math.hypot(p.x - d.center.x, p.z - d.center.z) > 0.3);
      assert.ok(!collides(p, [...world.solids, doorBox(d)]));
      let result = doorOperation(d, p, []);
      assert.ok(result.ok, d.id + " open side " + side);
      Object.assign(d, result);
      advance(p, { forward: 1 }, [...world.solids, doorBox(d)], 32);
      assert.ok(
        (p.x - d.center.x) * n.x * side + (p.z - d.center.z) * n.z * side <
          -0.5,
        d.id + " walked through",
      );
      result = doorOperation(d, p, []);
      assert.ok(result.ok, d.id + " close side " + side);
      Object.assign(d, result);
      assert.equal(d.open, false);
      result = doorOperation(d, p, []);
      assert.ok(result.ok, d.id + " reopen side " + side);
      Object.assign(d, result);
    }
});
test("door finds a clear hinge direction and refuses to close over the player or a build", () => {
  const d = { ...world.doors[0], open: false, swing: -1 };
  const occupied = doorBox(d, true, -1),
    p = player({
      x: (occupied.minX + occupied.maxX) / 2,
      z: (occupied.minZ + occupied.maxZ) / 2,
    });
  const r = doorOperation(d, p, []);
  assert.ok(r.ok);
  assert.equal(r.swing, 1);
  d.open = true;
  assert.equal(
    doorOperation(d, player({ x: d.center.x, z: d.center.z }), []).ok,
    false,
  );
  const b = {
    x: Math.floor(d.center.x),
    y: 0,
    z: Math.floor(d.center.z),
    type: "wood",
  };
  assert.equal(doorOperation(d, { ...HOME }, [b]).ok, false);
});
test("preview and placed model have identical bounds at 0, 90 and fine rotations; rotated bounds prevent overlap", () => {
  const geometry = new T.BoxGeometry(1, 1, 1),
    material = new T.MeshBasicMaterial();
  for (const type of ["bench", "flowers", "lantern"])
    for (const rotation of [0, 90, 105, 180, 270]) {
      const b = { x: 1, y: 0, z: 1, type, rotation },
        preview = detailedPiece(b, geometry, () => material),
        placed = detailedPiece(b, geometry, () => material);
      preview.updateMatrixWorld(true);
      placed.updateMatrixWorld(true);
      const a = new T.Box3().setFromObject(preview),
        c = new T.Box3().setFromObject(placed);
      assert.ok(
        a.min.distanceTo(c.min) < 1e-8 && a.max.distanceTo(c.max) < 1e-8,
      );
      const bound = cellBox(b);
      assert.ok(
        a.min.x >= bound.minX - 1e-6 &&
          a.max.x <= bound.maxX + 1e-6 &&
          a.min.z >= bound.minZ - 1e-6 &&
          a.max.z <= bound.maxZ + 1e-6,
      );
    }
  const s = freshState();
  s.inventory.bench = 1;
  s.blocks = [{ x: 2, y: 0, z: 1, type: "wood" }];
  assert.match(
    placementReason(
      { x: 1, y: 0, z: 1, type: "bench", rotation: 15 },
      s,
      [],
      HOME,
      false,
    ),
    /clear/,
  );
});
test("old version-1 saves load; rotation, empty hand and hinge direction survive new saves", () => {
  const s = freshState();
  delete s.doorSwings;
  s.selected = "wood";
  s.blocks = [{ x: 0, y: 0, z: 0, type: "bench" }];
  const old = validateSave(s);
  assert.equal(old.blocks[0].rotation, 0);
  old.blocks[0].rotation = 105;
  old.selected = "hand";
  old.doorSwings.home = 1;
  const next = validateSave(JSON.parse(JSON.stringify(old)));
  assert.equal(next.blocks[0].rotation, 105);
  assert.equal(next.selected, "hand");
  assert.equal(next.doorSwings.home, 1);
  assert.throws(() =>
    validateSave({
      ...old,
      blocks: [{ ...old.blocks[0], rotation: Infinity }],
    }),
  );
});
// Exercise the real delegated touch handler with a Safari-shaped MouseEvent click.
test("touch button activates once for pointerup plus a click without pointerType; keyboard and mouse still work", () => {
  const root = new EventTarget();
  let count = 0;
  const button = {
    disabled: false,
    getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 100 }),
    click() {
      count++;
    },
  };
  installTouchButtons(root);
  function emit(type, values) {
    const e = new Event(type, { cancelable: true });
    Object.defineProperties(
      e,
      Object.fromEntries(
        Object.entries({ target: { closest: () => button }, ...values }).map(
          ([k, v]) => [k, { value: v }],
        ),
      ),
    );
    root.dispatchEvent(e);
    return e;
  }
  emit("pointerdown", {
    pointerId: 1,
    pointerType: "touch",
    clientX: 10,
    clientY: 10,
  });
  emit("pointerup", {
    pointerId: 1,
    pointerType: "touch",
    clientX: 10,
    clientY: 10,
  });
  assert.equal(count, 1);
  assert.equal(emit("click", { detail: 1 }).defaultPrevented, true);
  assert.equal(
    emit("click", { detail: 1, target: { closest: () => ({}) } })
      .defaultPrevented,
    true,
    "a follow-up click cannot activate a different control under the finger",
  );
  assert.equal(emit("click", { detail: 0 }).defaultPrevented, false);
  assert.equal(
    emit("click", { pointerType: "mouse", detail: 1 }).defaultPrevented,
    false,
  );
  emit("pointerdown", {
    pointerId: 2,
    pointerType: "touch",
    clientX: 10,
    clientY: 10,
  });
  emit("pointermove", {
    pointerId: 2,
    pointerType: "touch",
    clientX: 40,
    clientY: 10,
  });
  emit("pointerup", {
    pointerId: 2,
    pointerType: "touch",
    clientX: 40,
    clientY: 10,
  });
  assert.equal(count, 1);
  const canvasTarget = {
    closest: (selector) => (selector === "#world" ? {} : null),
  };
  emit("pointerdown", {
    pointerId: 3,
    pointerType: "touch",
    clientX: 10,
    clientY: 10,
    target: canvasTarget,
  });
  emit("pointerup", {
    pointerId: 3,
    pointerType: "touch",
    clientX: 10,
    clientY: 10,
    target: canvasTarget,
  });
  assert.equal(
    emit("click", { detail: 1, target: { closest: () => ({}) } })
      .defaultPrevented,
    true,
    "a world tap cannot click through into a newly opened dialog",
  );
});
