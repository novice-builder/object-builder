import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { treeCanopyBounds, canopyBodies } from "../src/adventures/tree-canopy";
import { cameraFraction } from "../src/adventures/camera-collision";

test("foliage bounds use referenced indices and node transforms, excluding unused trunk vertices", () => {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute(
    "position",
    new T.Float32BufferAttribute([-1, 4, -1, 1, 4, -1, 0, 6, 1, 0, 0, 0], 3),
  );
  geometry.setIndex([0, 1, 2]);
  const material = new T.MeshStandardMaterial();
  material.name = "leafsGreen";
  const leaf = new T.Mesh(geometry, material),
    root = new T.Group();
  leaf.position.y = 0.5;
  root.position.set(3, 0, -2);
  root.add(leaf);
  const before = [...geometry.getAttribute("position").array],
    bounds = treeCanopyBounds(root);
  assert.equal(bounds.length, 1);
  assert.deepEqual(bounds[0].min.toArray(), [2, 4.5, -3]);
  assert.deepEqual(bounds[0].max.toArray(), [4, 6.5, -1]);
  assert.deepEqual([...geometry.getAttribute("position").array], before);
  assert.equal(geometry.boundingBox, null);
});
test("material groups distinguish leaves from bark on one shared accessor", () => {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute(
    "position",
    new T.Float32BufferAttribute(
      [-1, 2, -1, 1, 2, -1, 0, 4, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      3,
    ),
  );
  geometry.setIndex([0, 1, 2, 3, 4, 5]);
  geometry.addGroup(0, 3, 0);
  geometry.addGroup(3, 3, 1);
  const leaf = new T.MeshStandardMaterial(),
    wood = new T.MeshStandardMaterial();
  leaf.name = "leafsDark";
  wood.name = "woodBark";
  const source = new T.Group().add(new T.Mesh(geometry, [leaf, wood])),
    bounds = treeCanopyBounds(source);
  assert.equal(bounds.length, 1);
  assert.equal(bounds[0].min.y, 2);
  assert.equal(bounds[0].max.y, 4);
  assert.deepEqual(
    treeCanopyBounds(new T.Group().add(new T.Mesh(geometry, wood))),
    [],
  );
});
test("camera-only transformed crowns stop the camera before foliage while retaining its real base", () => {
  const box = new T.Box3(new T.Vector3(-1, 2, -1), new T.Vector3(1, 5, 1)),
    original = box.clone(),
    matrix = new T.Matrix4().compose(
      new T.Vector3(10, 0, -10),
      new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI / 4),
      new T.Vector3(2, 2, 2),
    ),
    [canopy] = canopyBodies([box], matrix),
    target = { x: 10, y: 1.35, z: 0 },
    offset = { x: 0, y: 6, z: -12 },
    trunk = { minX: 9.8, maxX: 10.2, minZ: -10.2, maxZ: -9.8, height: 10 };
  assert.equal(canopy.base, 4);
  assert.equal(canopy.height, 10);
  assert.ok(box.equals(original));
  const bounds = new T.Box3(
      new T.Vector3(canopy.minX, canopy.base, canopy.minZ),
      new T.Vector3(canopy.maxX, canopy.height, canopy.maxZ),
    ),
    oldFraction = cameraFraction(target, offset, [trunk]),
    newFraction = cameraFraction(target, offset, [trunk, canopy]),
    oldPoint = new T.Vector3(target.x, target.y, target.z).addScaledVector(
      new T.Vector3(offset.x, offset.y, offset.z),
      oldFraction,
    ),
    newPoint = new T.Vector3(target.x, target.y, target.z).addScaledVector(
      new T.Vector3(offset.x, offset.y, offset.z),
      newFraction,
    );
  assert.ok(bounds.containsPoint(oldPoint));
  assert.ok(!bounds.containsPoint(newPoint));
  assert.ok(newFraction > 0 && newFraction < oldFraction);
});
