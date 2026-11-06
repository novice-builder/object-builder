import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { windmillEntry } from "../src/adventures/windmill-entry";
import { buildingEntry } from "../src/adventures/building-entry";
import type { AssetLibrary } from "../src/adventures/assets";
const library = {
  bounds: new Map([
    [
      "building_windmill_blue",
      new T.Box3(new T.Vector3(-0.9, 0, -0.4), new T.Vector3(0.9, 1.5, 0.4)),
    ],
  ]),
} as unknown as AssetLibrary;
test("windmill entrances opt in without changing source transforms, even inside a rotated region", () => {
  const parent = new T.Group();
  parent.position.set(-105, 0, 20);
  parent.rotation.y = Math.PI / 2;
  const root = new T.Group();
  root.userData.asset = "building_windmill_blue";
  root.position.set(-39, 0, 24);
  root.scale.setScalar(8);
  root.rotation.y = Math.PI / 2;
  const body = new T.Mesh(new T.BoxGeometry(1.8, 1.5, 0.8));
  body.position.y = 0.75;
  root.add(body);
  parent.add(root);
  parent.updateMatrixWorld(true);
  const before = root.matrixWorld.toArray(),
    local = root.position.toArray(),
    origin = root.getWorldPosition(new T.Vector3());
  assert.equal(buildingEntry(library, "building_windmill_blue", root), null);
  const entry = windmillEntry(library, root, "Old Willow Windmill")!;
  assert.equal(entry.kind, "mill");
  assert.equal(entry.levels, 2);
  assert.equal(entry.name, "Old Willow Windmill");
  assert.ok(Math.abs(entry.x - origin.x) < 0.001);
  assert.ok(Math.abs(entry.z - (origin.z - 4.25)) < 0.001);
  assert.equal(entry.width, 6.4);
  assert.equal(entry.depth, 6.8);
  assert.deepEqual(root.matrixWorld.toArray(), before);
  assert.deepEqual(root.position.toArray(), local);
  assert.deepEqual(windmillEntry(library, root, "Old Willow Windmill"), entry);
  body.geometry.dispose();
});
test("non-windmill scenery cannot acquire a mill room through this helper", () => {
  const root = new T.Group();
  root.userData.asset = "building_market_blue";
  assert.equal(windmillEntry(library, root), null);
  assert.equal(root.children.length, 0);
});
