import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  freshState,
  HOME,
  movePlayer,
  collides,
  overlaps,
  bodyBox,
  cellBox,
  placementReason,
  validateSave,
  BuildHistory,
  MAX_BLOCKS,
} from "../src/core.js";
import { HOUSES, localToWorld, makeWorld, doorBox } from "../src/world.js";
const world = makeWorld(new T.Scene());
const spawn = () => ({ ...HOME, vy: 0, grounded: true });
test("forward and strafe agree with camera at four headings; diagonal speed is normalized", () => {
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const p = { ...spawn(), x: 0, z: 0, yaw };
    movePlayer(p, { forward: 1 }, 0.1, []);
    assert.ok(Math.abs(p.x + Math.sin(yaw) * 0.34) < 0.001);
    assert.ok(Math.abs(p.z + Math.cos(yaw) * 0.34) < 0.001);
  }
  const p = { ...spawn(), x: 0, z: 0 };
  movePlayer(p, { forward: 1, right: 1 }, 0.1, []);
  assert.ok(Math.abs(Math.hypot(p.x, p.z) - 0.34) < 0.001);
});
test("wall collision cannot tunnel through a thin wall at low FPS and permits sliding", () => {
  const wall = {
      minX: -20,
      maxX: 20,
      minY: 0,
      maxY: 3,
      minZ: -0.5,
      maxZ: -0.3,
    },
    p = { ...spawn(), x: 0, z: 1 };
  for (let i = 0; i < 20; i++)
    movePlayer(p, { forward: 1, right: 0.4 }, 0.1, [wall]);
  assert.ok(p.z > -0.03);
  assert.ok(p.x > 1);
  assert.equal(collides(p, [wall]), false);
});
test("jump lands on a built block, hits ceilings, and cannot jump through them", () => {
  const block = cellBox({ x: 0, y: 0, z: 0 }),
    p = { ...spawn(), x: 0.5, z: 0.5, y: 1, vy: 6, grounded: false };
  let max = 0;
  const ceiling = { minX: -1, maxX: 2, minZ: -1, maxZ: 2, minY: 3, maxY: 3.2 };
  for (let i = 0; i < 150; i++) {
    movePlayer(p, {}, 0.016, [block, ceiling]);
    max = Math.max(max, p.y);
  }
  assert.ok(max <= 1.351);
  assert.ok(Math.abs(p.y - 1) < 1e-5);
  assert.equal(p.grounded, true);
});
test("placement prevents overlaps, self-entombment, floating pieces, long reach and capacity overflow", () => {
  const s = freshState(),
    p = { ...spawn(), x: 2, z: 2 };
  assert.equal(
    placementReason({ x: 0, y: 0, z: 0, type: "wood" }, s, [], p),
    "",
  );
  assert.match(
    placementReason({ x: 2, y: 0, z: 2, type: "wood" }, s, [], p),
    /step back/,
  );
  assert.match(
    placementReason({ x: 0, y: 3, z: 0, type: "wood" }, s, [], p),
    /Join/,
  );
  assert.match(
    placementReason({ x: 20, y: 0, z: 0, type: "wood" }, s, [], p),
    /closer/,
  );
  s.blocks.push({ x: 0, y: 0, z: 0, type: "wood" });
  assert.match(
    placementReason({ x: 0, y: 0, z: 0, type: "wood" }, s, [], p),
    /clear/,
  );
  assert.equal(
    placementReason({ x: 0, y: 1, z: 0, type: "wood" }, s, [], p),
    "",
  );
  s.blocks = Array.from({ length: MAX_BLOCKS }, () => ({
    x: 0,
    y: 0,
    z: 0,
    type: "wood",
  }));
  assert.match(
    placementReason({ x: 1, y: 0, z: 0, type: "wood" }, s, [], p),
    /full/,
  );
});
test("undo returns consumed crafted items; removed pieces cannot be restored over player or closed door", () => {
  const s = freshState(),
    b = { x: 0, y: 0, z: 0, type: "bench" },
    h = new BuildHistory();
  s.blocks.push(b);
  h.record({ kind: "place", block: b });
  assert.ok(h.undo(s, spawn(), []));
  assert.equal(s.inventory.bench, 1);
  assert.equal(s.blocks.length, 0);
  s.inventory.bench = 2;
  h.record({ kind: "remove", block: b });
  assert.equal(h.undo(s, { x: 0.5, y: 0, z: 0.5 }, []), false);
  assert.equal(h.undo(s, spawn(), [cellBox(b)]), false);
  assert.ok(h.undo(s, spawn(), []));
  assert.equal(s.blocks.length, 1);
  assert.equal(s.inventory.bench, 1);
});
test("save roundtrip preserves special inventory, selection, door and pose; malformed imports are rejected", () => {
  const s = freshState();
  s.blocks = [{ x: 0, y: 0, z: 0, type: "brick" }];
  s.inventory.flowers = 2;
  s.selected = "flowers";
  s.doors.home = true;
  const next = validateSave(JSON.parse(JSON.stringify(s)), world.solids);
  assert.deepEqual(next.blocks, s.blocks);
  assert.equal(next.inventory.flowers, 2);
  assert.equal(next.doors.home, true);
  assert.equal(next.selected, "flowers");
  for (const change of [
    (s) => (s.version = 9),
    (s) => (s.blocks[0].x = Infinity),
    (s) => s.blocks.push({ ...s.blocks[0] }),
    (s) => (s.inventory.flowers = -1),
    (s) => (s.blocks[0].type = "script"),
  ]) {
    const c = structuredClone(s);
    change(c);
    assert.throws(() => validateSave(c));
  }
});
test("all houses have an upright, usable opening and a correctly oriented door at both angles", () => {
  assert.equal(HOUSES.length, 16);
  assert.equal(new Set(HOUSES.map((h) => h.style)).size, 3);
  for (const h of HOUSES) {
    const d = world.doors.find((d) => d.id === h.id);
    assert.ok(d);
    assert.equal(doorBox(d).maxY, 2.3);
    const center = localToWorld(h, -1.4, h.d / 2);
    assert.ok(Math.hypot(center.x - d.center.x, center.z - d.center.z) < 1e-6);
    const openBox = doorBox(d, true),
      atDoor = { x: center.x, y: 0, z: center.z };
    assert.equal(overlaps(bodyBox(atDoor), openBox), false);
    assert.equal(
      world.solids.some((b) => overlaps(bodyBox(atDoor), b)),
      false,
    );
    assert.equal(overlaps(bodyBox(atDoor), doorBox(d, false)), true);
  }
});
test("driveways align with the actual entrances, reach the road and houses do not intersect each other", () => {
  for (const [i, h] of HOUSES.entries()) {
    const p = localToWorld(h, -1.4, h.d / 2),
      d = world.drives[i];
    assert.ok(Math.hypot(p.x-d.entry.x,p.z-d.entry.z)<1e-6);
    const nx=Math.sin(h.angle), nz=Math.cos(h.angle);
    assert.ok((d.end.x-p.x)*nx+(d.end.z-p.z)*nz>-.01,`${h.id} driveway points out of its facade`);
  }
  for (let i = 0; i < HOUSES.length; i++)
    for (let j = 0; j < i; j++) {
      const a = HOUSES[i],
        b = HOUSES[j];
      assert.ok(
        Math.abs(a.x - b.x) > (a.w + b.w) / 2 ||
          Math.abs(a.z - b.z) > (a.d + b.d) / 2,
      );
    }
});
test("world mesh transforms are finite and scales are positive", () => {
  const scene = new T.Scene();
  makeWorld(scene);
  scene.traverse((m) => {
    assert.ok(m.position.toArray().every(Number.isFinite));
    if (m.isInstancedMesh) {
      const mat = new T.Matrix4();
      for (let i = 0; i < m.count; i++) {
        m.getMatrixAt(i, mat);
        assert.ok(mat.elements.every(Number.isFinite));
        assert.ok(mat.determinant() > 0);
      }
    }
  });
});
