import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { Activity } from "../src/simulation/activity";
import { fromGame, encode, decode } from "../src/persistence/schema";
function place(a: Activity, x: number, z: number) {
  const d = a.pet!;
  d.state.x = x;
  d.state.z = z;
  d.model.position.set(x, 0, z);
}
test("companion follows around constructions, stays, goes home and persists independently", () => {
  const wall = {
    minX: 94.8,
    maxX: 95.2,
    minY: 0,
    maxY: 3,
    minZ: 97,
    maxZ: 103,
  };
  const a = new Activity(new T.Scene(), 238, () => [wall]),
    p = { x: 90, y: 0, z: 100, yaw: 0, pitch: 0 };
  place(a, 100, 100);
  a.setPetMode("follow");
  for (let t = 0; t < 18; t += 0.1)
    a.update(0.1, p, { forward: 0, right: 0 }, []);
  assert.ok(
    Math.hypot(a.pet!.state.x - p.x, a.pet!.state.z - p.z) < 2.6,
    JSON.stringify(a.pet!.state),
  );
  a.setPetMode("stay");
  const before = { ...a.pet!.state };
  for (let t = 0; t < 4; t += 0.1)
    a.update(0.1, p, { forward: 0, right: 0 }, []);
  assert.equal(a.pet!.state.x, before.x);
  assert.equal(a.pet!.state.z, before.z);
  const s = fromGame({
    template: "sunbeam-county",
    blocks: [],
    doors: {},
    selected: "hand",
    player: p,
    activity: a.snapshot(),
  });
  const b = new Activity(new T.Scene(), 238);
  b.load(decode(encode(s)).world.activity);
  assert.equal(b.petMode, "stay");
  assert.equal(b.pet!.state.x, before.x);
  place(a, 35, 17);
  a.setPetMode("home");
  for (let t = 0; t < 10; t += 0.1)
    a.update(0.1, { ...p, x: 40, z: 17 }, { forward: 0, right: 0 }, []);
  assert.ok(Math.hypot(a.pet!.state.x - 14, a.pet!.state.z - 17) < 0.3);
  a.dispose();
  b.dispose();
});
test("a distant following dog remains bounded, awake and never teleports", () => {
  const a = new Activity(new T.Scene(), 238, () => []);
  place(a, 100, 100);
  a.setPetMode("follow");
  for (let t = 0; t < 5; t += 1 / 60)
    a.update(1 / 60, { x: -150, y: 0, z: 100 }, { forward: 0, right: 0 }, []);
  assert.ok(a.pet!.state.x < 90);
  assert.ok(a.pet!.state.x > 82);
  assert.equal(a.pet!.model.visible, false);
  a.dispose();
});
