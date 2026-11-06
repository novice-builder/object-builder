import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { CollisionSpace, MeshShape } from "../src/adventures/mesh-collision";
import {
  moveCharacter,
  MAX_STEP_HEIGHT,
} from "../src/adventures/character-controller";
function box(
  g: T.Group,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshBasicMaterial());
  m.position.set(x, y + h / 2, z);
  g.add(m);
}
function fixture(rise = 0.2, count = 6) {
  const g = new T.Group();
  for (let i = 0; i < count; i++)
    box(g, 0, 0, -(i + 0.5) * 0.35, 1.6, (i + 1) * rise, 0.35);
  box(g, 0, 0, -count * 0.35 - 0.5, 1.6, count * rise, 1);
  const space = new CollisionSpace();
  space.add(new MeshShape(g));
  return { space, g };
}
test("generic controller climbs 15, 20 and 25 cm actual mesh steps and descends without a ramp label", () => {
  for (const rise of [0.15, 0.2, 0.25]) {
    const { space } = fixture(rise),
      p = { x: 0, y: 0.002, z: 0.6, vy: 0, grounded: true };
    for (let i = 0; i < 420 && p.z > -2.5; i++)
      moveCharacter(p, { vx: 0, vz: -2 }, 1 / 120, space);
    assert.ok(p.y > rise * 6 - 0.02, JSON.stringify({ rise, p }));
    for (let i = 0; i < 420 && p.z < 0.6; i++)
      moveCharacter(p, { vx: 0, vz: 2 }, 1 / 120, space);
    assert.ok(p.y < 0.03, JSON.stringify({ rise, p }));
  }
});
test("a taller ledge, low ceiling and furniture remain blocked while clear landings are required", () => {
  const { space } = fixture(MAX_STEP_HEIGHT + 0.06, 1),
    p = { x: 0, y: 0.002, z: 0.6, vy: 0, grounded: true };
  for (let i = 0; i < 180; i++)
    moveCharacter(p, { vx: 0, vz: -2 }, 1 / 120, space);
  assert.ok(p.z > 0, JSON.stringify(p));
  assert.ok(p.y < 0.03);
  const low = fixture(0.2, 1);
  low.space.boxes = [
    {
      minX: -1,
      maxX: 1,
      minZ: -1,
      maxZ: 0,
      minY: 1.8,
      maxY: 2,
      canStep: false,
    },
  ];
  const q = { x: 0, y: 0.002, z: 0.6, vy: 0, grounded: true };
  for (let i = 0; i < 180; i++)
    moveCharacter(q, { vx: 0, vz: -2 }, 1 / 120, low.space);
  assert.ok(q.z > 0 && q.y < 0.03, JSON.stringify(q));
  const f = new CollisionSpace();
  f.boxes = [
    {
      minX: -1,
      maxX: 1,
      minZ: -1,
      maxZ: 0,
      minY: 0,
      maxY: 0.2,
      canStep: false,
    },
  ];
  const r = { x: 0, y: 0.002, z: 0.6, vy: 0, grounded: true };
  for (let i = 0; i < 180; i++) moveCharacter(r, { vx: 0, vz: -2 }, 1 / 120, f);
  assert.ok(r.z > 0 && r.y < 0.03, JSON.stringify(r));
});
test("capsule collision preserves a real mesh doorway rather than blocking its entire bounds", () => {
  const g = new T.Group();
  box(g, -1.5, 0, 0, 1.8, 3, 0.2);
  box(g, 1.5, 0, 0, 1.8, 3, 0.2);
  box(g, 0, 2.3, 0, 1.2, 0.7, 0.2);
  const s = new CollisionSpace();
  s.add(new MeshShape(g));
  const p = { x: 0, y: 0.002, z: 1, vy: 0, grounded: true };
  for (let i = 0; i < 160; i++) moveCharacter(p, { vx: 0, vz: -2 }, 1 / 120, s);
  assert.ok(p.z < -0.5, JSON.stringify(p));
});

test("rounded capsule corners do not turn shallow thin indoor treads into a false airborne barrier", () => {
  const g = new T.Group(),
    length = 4.15,
    count = 20;
  for (let i = 0; i < count; i++)
    box(
      g,
      0,
      i * 0.15,
      (-(i + 0.5) * length) / count,
      1.6,
      0.15,
      length / count + 0.015,
    );
  box(g, 0, 2.8, -length - 0.5, 1.6, 0.2, 1);
  const space = new CollisionSpace();
  space.add(new MeshShape(g));
  for (const speed of [3.05, 6]) {
    const p = { x: 0, y: 0.002, z: 0.5, grounded: true, vy: 0 };
    for (let i = 0; i < 1000 && p.z > -length - 0.4; i++)
      moveCharacter(p, { vx: 0, vz: -speed }, 1 / 120, space);
    assert.ok(p.z < -length - 0.3 && p.y > 2.99, JSON.stringify({ speed, p }));
    for (let i = 0; i < 1000 && p.z < 0.5; i++)
      moveCharacter(p, { vx: 0, vz: speed }, 1 / 120, space);
    for (let i = 0; i < 90; i++)
      moveCharacter(p, { vx: 0, vz: 0 }, 1 / 120, space);
    assert.ok(p.z > 0.4 && p.y < 0.03, JSON.stringify({ speed, p }));
  }
});
