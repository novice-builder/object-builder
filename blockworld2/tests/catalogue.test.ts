import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  CATALOGUE,
  PREFABS,
  blockColliders,
  blockBounds,
  expandPrefab,
} from "../src/build/registry";
import { renderModel } from "../src/build/models";
import { validateBlocks } from "../src/build/validation";
import { Commands } from "../src/build/commands";
import {
  fromGame,
  encode,
  decode,
  validateSnapshot,
} from "../src/persistence/schema";
import { movePlayer } from "../src/player/physics.js";
test("every curated item renders and has finite rotated collision and native backup support", () => {
  assert.equal(CATALOGUE.length, 111);
  assert.equal(new Set(CATALOGUE.map((i) => i.id)).size, 111);
  for (const item of CATALOGUE)
    for (const rotation of [0, 90]) {
      const b = { x: 0, y: 0, z: 0, type: item.id, rotation },
        bounds = blockBounds(b);
      for (const value of Object.values(bounds))
        assert.ok(Number.isFinite(value), item.id);
      assert.ok(bounds.maxY > bounds.minY, item.id);
      validateBlocks([b]);
      const model = renderModel(b);
      assert.ok(model.children.length > 0, item.id);
      const visible = new T.Box3().setFromObject(model);
      assert.ok(Number.isFinite(visible.max.y), item.id);
      const snapshot = fromGame({
        template: "blank",
        blocks: [b],
        doors: {},
        player: { x: 10, y: 0, z: 10, yaw: 0, pitch: 0 },
        selected: item.id,
      });
      assert.equal(decode(encode(snapshot)).world.blocks[0].type, item.id);
    }
});
test("all four presets place as one undoable command and reject partial invalid placement", () => {
  for (const prefab of PREFABS) {
    const c = new Commands(
        () => [],
        () => ({ x: 10, y: 0, z: 10 }),
        () => {},
      ),
      blocks = expandPrefab({ x: 0, y: 0, z: 0, type: prefab.id });
    assert.equal(c.placeMany(blocks, false), "", prefab.id);
    validateBlocks(c.blocks);
    assert.ok(c.undo());
    assert.equal(c.blocks.length, 0);
    assert.ok(c.redo());
    assert.equal(c.blocks.length, blocks.length);
  }
});
test("schema 1 worlds migrate without dropping original creations", () => {
  const s = fromGame({
    template: "blank",
    blocks: [{ x: -250, y: 0, z: 0, type: "wood" }],
    doors: {},
    player: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    selected: "wood",
  });
  const migrated = validateSnapshot({ ...s, schema: 1 });
  assert.equal(migrated.schema, 2);
  assert.equal(migrated.world.blocks[0].x, -250);
});
test("slabs and tabletops support precise vertical placement and lossless backups", () => {
  for (const [base, top, height] of [
    ["slab", "wood", 0.5],
    ["dining-table", "table-lamp", 0.81],
  ] as const) {
    const c = new Commands(
      () => [],
      () => ({ x: 10, y: 0, z: 10 }),
      () => {},
    );
    assert.equal(c.place({ x: 0, y: 0, z: 0, type: base }, false), "");
    assert.equal(c.place({ x: 0, y: height, z: 0, type: top }, false), "");
    const s = fromGame({
      template: "blank",
      blocks: c.blocks,
      doors: {},
      player: { x: 10, y: 0, z: 10, yaw: 0, pitch: 0 },
      selected: top,
    });
    assert.equal(decode(encode(s)).world.blocks[1].y, height);
    assert.ok(c.undo());
    assert.ok(c.redo());
    assert.equal(c.blocks[1].y, height);
  }
  assert.throws(() =>
    validateBlocks([{ x: 0, y: 0.12345, z: 0, type: "wood" }]),
  );
});
test("elevated stairs use their actual base height and remain climbable", () => {
  const b = { x: 0, y: 2, z: 0, type: "stairs" },
    solids = [
      ...blockColliders(b),
      { minX: -2, maxX: 2, minY: 0, maxY: 2, minZ: -2, maxZ: 3 },
    ],
    p: any = { x: 0.5, y: 2, z: 2, yaw: 0, vy: 0, grounded: true };
  for (let i = 0; i < 45; i++)
    movePlayer(p, { forward: 1, edgeProtection: true }, 1 / 60, solids);
  assert.ok(p.y > 2.9);
});
test("placed doors preserve closed collision and reject blocked sweeps", () => {
  const c = new Commands(
      () => [],
      () => ({ x: 4, y: 0, z: 4 }),
      () => {},
    ),
    door = { x: 0, y: 0, z: 0, type: "door" };
  assert.equal(c.place(door, false), "");
  assert.equal(c.blocks[0].open, undefined);
  const closed = blockBounds(c.blocks[0]);
  assert.equal(c.toggle(c.blocks[0]), "");
  assert.equal(c.blocks[0].open, true);
  assert.notDeepEqual(blockBounds(c.blocks[0]), closed);
  assert.ok(c.undo());
  assert.equal(c.blocks[0].open, undefined);
});
