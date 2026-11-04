import { test } from "node:test";
import assert from "node:assert/strict";
import { Commands } from "../src/build/commands";
test("decorations are unlimited and undo/redo retain rotation", () => {
  const c = new Commands(
    () => [],
    () => ({ x: 40, y: 0, z: 40 }),
    () => {},
  );
  for (let i = 0; i < 110; i++)
    assert.equal(
      c.place(
        { x: i % 10, y: 0, z: Math.floor(i / 10), type: "bench", rotation: 90 },
        false,
      ),
      "",
    );
  assert.equal(c.blocks.length, 110);
  assert.ok(c.undo());
  assert.ok(c.redo());
  assert.equal(c.blocks.at(-1)!.rotation, 90);
});
test("undo removal refuses player occupancy without consuming history", () => {
  const p = { x: 4, y: 0, z: 4 },
    c = new Commands(
      () => [],
      () => p,
      () => {},
    ),
    b = { x: 0, y: 0, z: 0, type: "wood" };
  c.place(b, false);
  c.remove(b);
  p.x = p.z = 0.5;
  assert.equal(c.undo(), false);
  p.x = 4;
  assert.ok(c.undo());
});
test("new edit invalidates redo and collision rejects placement", () => {
  const c = new Commands(
    () => [{ minX: 5, maxX: 6, minY: 0, maxY: 2, minZ: 5, maxZ: 6 }],
    () => ({ x: 10, y: 0, z: 10 }),
    () => {},
  );
  assert.notEqual(c.place({ x: 5, y: 0, z: 5, type: "wood" }, false), "");
  c.place({ x: 0, y: 0, z: 0, type: "wood" }, false);
  c.undo();
  c.place({ x: 1, y: 0, z: 0, type: "brick" }, false);
  assert.equal(c.redo(), false);
});
