import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  StaticInstanceCuller,
  fogDepthVisible,
} from "../src/adventures/instance-culling";

function frustum(camera: T.PerspectiveCamera) {
  camera.updateMatrixWorld();
  return new T.Frustum().setFromProjectionMatrix(
    new T.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    ),
  );
}
test("instance compaction preserves original matrices/colours through camera turns and shadow restoration", () => {
  const mesh = new T.InstancedMesh(
      new T.BoxGeometry(),
      new T.MeshStandardMaterial(),
      3,
    ),
    parent = new T.Group(),
    camera = new T.PerspectiveCamera(60, 1, 0.1, 100);
  parent.position.x = 5;
  parent.add(mesh);
  for (const [i, x] of [0, 100, -100].entries()) {
    mesh.setMatrixAt(i, new T.Matrix4().makeTranslation(x, 0, -10));
    mesh.setColorAt(
      i,
      new T.Color(i === 0 ? 0xff0000 : i === 1 ? 0x00ff00 : 0x0000ff),
    );
  }
  parent.updateMatrixWorld(true);
  mesh.computeBoundingSphere();
  const sphere = mesh.boundingSphere!.clone(),
    matrices = [...mesh.instanceMatrix.array],
    colors = [...mesh.instanceColor!.array],
    culler = new StaticInstanceCuller(mesh);
  camera.position.set(5, 0, 0);
  camera.lookAt(5, 0, -10);
  culler.update(frustum(camera), camera, 50);
  assert.equal(mesh.count, 1);
  const version = mesh.instanceMatrix.version;
  culler.update(frustum(camera), camera, 50);
  assert.equal(
    mesh.instanceMatrix.version,
    version,
    "stationary view must not upload buffers",
  );
  camera.position.x = 105;
  camera.lookAt(105, 0, -10);
  culler.update(frustum(camera), camera, 50);
  assert.equal(mesh.count, 1);
  assert.deepEqual(
    [...mesh.instanceMatrix.array].slice(0, 16),
    matrices.slice(16, 32),
  );
  assert.deepEqual(
    [...mesh.instanceColor!.array].slice(0, 3),
    colors.slice(3, 6),
  );
  assert.ok(
    mesh.boundingSphere!.equals(sphere),
    "full bounds stay conservative after compaction",
  );
  culler.restore();
  assert.equal(mesh.count, 3);
  assert.deepEqual([...mesh.instanceMatrix.array], matrices);
  assert.deepEqual([...mesh.instanceColor!.array], colors);
  const restored = mesh.instanceMatrix.version;
  culler.restore();
  assert.equal(mesh.instanceMatrix.version, restored);
});
test("instance culling retains partial frustum/fog bounds and can recover an empty batch", () => {
  const mesh = new T.InstancedMesh(
      new T.BoxGeometry(2, 2, 2),
      new T.MeshStandardMaterial(),
      3,
    ),
    camera = new T.PerspectiveCamera(60, 1, 0.1, 100);
  mesh.setMatrixAt(0, new T.Matrix4().makeTranslation(6.2, 0, -10));
  mesh.setMatrixAt(1, new T.Matrix4().makeTranslation(0, 0, -51));
  mesh.setMatrixAt(2, new T.Matrix4().makeTranslation(0, 0, -55));
  mesh.updateMatrixWorld(true);
  const culler = new StaticInstanceCuller(mesh);
  camera.lookAt(0, 0, -10);
  culler.update(frustum(camera), camera, 50);
  assert.equal(mesh.count, 2);
  camera.lookAt(0, 0, 10);
  culler.update(frustum(camera), camera, 50);
  assert.equal(mesh.count, 0);
  camera.lookAt(0, 0, -10);
  culler.update(frustum(camera), camera, 50);
  assert.equal(mesh.count, 2);
  culler.restore();
  assert.equal(mesh.count, 3);
  assert.equal(mesh.instanceColor, null);
});

test("off-axis fog visibility follows shader depth and retains partially fogged bounds", () => {
  const camera = new T.PerspectiveCamera(100, 2, 0.1, 220);
  camera.lookAt(0, 0, -1);
  camera.updateMatrixWorld();
  const view = camera.matrixWorldInverse.elements;
  assert.ok(Math.hypot(70, 70) > 80);
  assert.equal(fogDepthVisible({ x: 70, y: 0, z: -70 }, 1, view, 80), true);
  assert.equal(fogDepthVisible({ x: 0, y: 0, z: -81 }, 2, view, 80), true);
  assert.equal(fogDepthVisible({ x: 0, y: 0, z: -83 }, 2, view, 80), false);
  camera.position.set(10, 0, 10);
  camera.lookAt(11, 0, 10);
  camera.updateMatrixWorld();
  assert.equal(
    fogDepthVisible(
      { x: 81, y: 0, z: 80 },
      1,
      camera.matrixWorldInverse.elements,
      80,
    ),
    true,
  );
});
