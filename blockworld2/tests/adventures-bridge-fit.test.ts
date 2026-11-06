import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { fitBridge } from "../src/adventures/bridge-fit";
import { fittedBridgeHeight } from "../src/adventures/crossings";
test("diagonally authored bridge aligns its real deck axis and dimensions without changing shared geometry", () => {
  const geometry = new T.BoxGeometry(1, 0.5, 4),
    before = Array.from(geometry.getAttribute("position").array),
    material = new T.MeshBasicMaterial(),
    mesh = new T.Mesh(geometry, material);
  mesh.rotation.y = Math.PI / 6;
  const source = new T.Group().add(mesh),
    fit = fitBridge(source, 30, -52);
  fit.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(fit),
    size = box.getSize(new T.Vector3()),
    center = box.getCenter(new T.Vector3());
  assert.ok(Math.abs(size.x - 10) < 1e-4);
  assert.ok(Math.abs(size.z - 4.2) < 1e-4);
  assert.ok(Math.abs(center.x - 30) < 1e-4);
  assert.ok(Math.abs(center.z + 52) < 1e-4);
  assert.deepEqual(Array.from(geometry.getAttribute("position").array), before);
  const ray = new T.Raycaster(
    new T.Vector3(34, 5, -52),
    new T.Vector3(0, -1, 0),
  );
  assert.ok(
    ray.intersectObject(fit, true).length > 0,
    "a deck exists at the walking route, away from the centre",
  );
  geometry.dispose();
  material.dispose();
});
test("fitted bridge deck profile is smooth, symmetric and retains its central flat landing", () => {
  assert.equal(fittedBridgeHeight(0), 0.43);
  assert.equal(fittedBridgeHeight(2), 0.43);
  for (let x = 0; x <= 5; x += 0.025) {
    assert.equal(fittedBridgeHeight(x), fittedBridgeHeight(-x));
    assert.ok(
      Math.abs(fittedBridgeHeight(x) - fittedBridgeHeight(x - 0.025)) < 0.012,
    );
  }
});
