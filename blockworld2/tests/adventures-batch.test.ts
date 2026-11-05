import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { bakeNature, fogVisible } from "../src/adventures/nature-batch";
test("nature batching retains source bounds, triangle count and linear material colours", () => {
  const source = new T.Group();
  source.position.set(2, 1, -3);
  const a = new T.Mesh(
    new T.BoxGeometry(1, 2, 1),
    new T.MeshStandardMaterial({ color: 0x527c43, roughness: 1, metalness: 0 }),
  );
  a.position.x = 2;
  source.add(a);
  const b = new T.Mesh(
    new T.BoxGeometry(2, 1, 1),
    new T.MeshStandardMaterial({ color: 0x806044, roughness: 1, metalness: 0 }),
  );
  b.position.z = 2;
  source.add(b);
  const shared = new T.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      metalness: 0,
    }),
    result = bakeNature(source, shared)!;
  assert.ok(result);
  const mesh = result.children[0] as T.Mesh;
  assert.equal(
    mesh.geometry.index!.count,
    a.geometry.index!.count + b.geometry.index!.count,
  );
  const before = new T.Box3().setFromObject(source),
    after = new T.Box3().setFromObject(result);
  assert.ok(
    before.min.distanceTo(after.min) < 1e-6 &&
      before.max.distanceTo(after.max) < 1e-6,
  );
  const colors = mesh.geometry.getAttribute("color");
  assert.ok(Math.abs(colors.getX(0) - a.material.color.r) < 1e-6);
  assert.ok(
    Math.abs(
      colors.getY(a.geometry.getAttribute("position").count) -
        b.material.color.g,
    ) < 1e-6,
  );
  assert.equal(a.geometry.getAttribute("color"), undefined);
  assert.equal(mesh.material, shared);
  assert.equal(result.children.length, 1);
});
test("batching refuses textured or transparent materials rather than silently changing them", () => {
  const source = new T.Group(),
    m = new T.MeshStandardMaterial({
      transparent: true,
      roughness: 1,
      metalness: 0,
    });
  source.add(new T.Mesh(new T.BoxGeometry(), m));
  assert.equal(bakeNature(source, m), null);
  m.transparent = false;
  m.map = new T.Texture();
  assert.equal(bakeNature(source, m), null);
});
test("fog culling conservatively retains bounds crossing the visible range", () => {
  assert.equal(
    fogVisible({ x: 120, y: 0, z: 0 }, 20, { x: 0, y: 0, z: 0 }, 110),
    true,
  );
  assert.equal(
    fogVisible({ x: 131, y: 0, z: 0 }, 20, { x: 0, y: 0, z: 0 }, 110),
    false,
  );
});
