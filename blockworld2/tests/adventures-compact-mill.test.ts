import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  buildCompactMill,
  compactMillContains,
  compactMillSolids,
} from "../src/adventures/compact-mill";
import {
  CollisionSpace,
  MeshShape,
  BODY_RADIUS,
} from "../src/adventures/mesh-collision";
import {
  moveCharacter,
  recoverCharacter,
  type CharacterPose,
} from "../src/adventures/character-controller";
import { checkpointFooting } from "../src/adventures/checkpoint-footing";
function fixture() {
  const group = new T.Group(),
    upper = new T.Group(),
    geometry: T.BufferGeometry[] = [],
    wood = new T.MeshStandardMaterial(),
    rail = new T.MeshStandardMaterial(),
    unit = new T.BoxGeometry(1, 1, 1);
  geometry.push(unit);
  const box = (
    parent: T.Group,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    material = wood,
  ) => {
    const mesh = new T.Mesh(unit, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  };
  buildCompactMill({
    group,
    upper,
    geometry,
    wood,
    rail,
    walls: [],
    box,
    fit: (parent, _id, x, y, z, sx, sy, sz, yaw = 0) => {
      const m = box(parent, x, y + sy / 2, z, sx, sy, sz);
      m.rotation.y = yaw;
      return m;
    },
  });
  const space = new CollisionSpace(
    () => 0,
    (x, z) => compactMillContains(x, z, BODY_RADIUS),
  );
  space.add(new MeshShape(group), undefined, true, "actual compact mill");
  return {
    group,
    space,
    dispose() {
      for (const g of geometry) g.dispose();
      wood.dispose();
      rail.dispose();
    },
  };
}
function walk(p: CharacterPose, x: number, z: number, space: CollisionSpace) {
  let maxRise = 0,
    last = p.y;
  for (let i = 0; i < 2000; i++) {
    const dx = x - p.x,
      dz = z - p.z,
      n = Math.hypot(dx, dz);
    if (n < 0.05) return maxRise;
    moveCharacter(
      p,
      { vx: (dx / n) * 2.8, vz: (dz / n) * 2.8 },
      1 / 120,
      space,
    );
    maxRise = Math.max(maxRise, p.y - last);
    last = p.y;
  }
  assert.fail("Blocked route " + JSON.stringify({ target: { x, z }, p }));
}
test("compact mill actual treads connect ground, turning landing and loft in both directions", () => {
  const f = fixture(),
    p: CharacterPose = { x: 0, y: 0.002, z: 1.4, vy: 0, grounded: true };
  let max = 0;
  for (const [x, z] of [
    [0, 2.12],
    [1.45, 2.12],
    [1.45, -1.2],
  ])
    max = Math.max(max, walk(p, x, z, f.space));
  assert.ok(Math.abs(p.y - 1.502) < 0.001);
  assert.ok(f.space.clear(p));
  walk(p, -0.05, -1.2, f.space);
  assert.ok(Math.abs(p.y - 1.502) < 0.001);
  for (const [x, z] of [
    [-0.05, 2.12],
    [-1.1, 2.12],
    [-1.1, 0],
  ])
    max = Math.max(max, walk(p, x, z, f.space));
  assert.ok(Math.abs(p.y - 3.002) < 0.001);
  assert.ok(max <= 0.301);
  assert.ok(f.space.clear(p));
  for (const [x, z] of [
    [-1.1, 2.12],
    [-0.05, 2.12],
    [-0.05, -1.2],
    [1.45, -1.2],
    [1.45, 2.12],
    [0, 2.12],
    [0, 1.4],
  ])
    walk(p, x, z, f.space);
  assert.ok(Math.abs(p.y - 0.002) < 0.001);
  assert.ok(f.space.clear(p));
  f.dispose();
});
test("turning landing has genuine head clearance and both landing and loft recover to their own support", () => {
  const f = fixture();
  for (const p of [
    { x: 0.7, y: 1.502, z: -1.2 },
    { x: -1.1, y: 3.002, z: 0 },
  ]) {
    assert.ok(f.space.clear(p));
    assert.ok(f.space.supported(p));
    const saved = checkpointFooting({ ...p, y: p.y + 0.5 }, f.space);
    assert.ok(saved && Math.abs(saved.y - p.y) < 0.001);
    const recovered = recoverCharacter(
      p,
      f.space,
      { x: 0, y: 0.002, z: 1.4 },
      5,
    );
    assert.ok(recovered && Math.abs(recovered.y - p.y) < 0.001);
  }
  assert.equal(f.space.floor(0.7, -1.2, 3.1, 2.9), null);
  assert.equal(compactMillContains(2.35, 2.35, BODY_RADIUS), false);
  assert.equal(compactMillSolids().filter((s) => s.ramp).length, 2);
  f.dispose();
});
test("actual high flight permits walking below while low flight and handrails stop lateral passage", () => {
  const f = fixture(),
    p: CharacterPose = { x: -1, y: 0.002, z: 1.4, vy: 0, grounded: true };
  walk(p, 0.4, 1.4, f.space);
  assert.ok(p.x > 0.35 && p.y < 0.01);
  Object.assign(p, { x: 0.4, y: 0.002, z: 0, vy: 0, grounded: true });
  for (let i = 0; i < 120; i++)
    moveCharacter(p, { vx: 2, vz: 0 }, 1 / 120, f.space);
  assert.ok(p.x < 0.8 && p.y < 0.31);
  f.dispose();
});
