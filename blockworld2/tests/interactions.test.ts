import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseInteraction, type Interaction } from "../src/app/interactions";
import { playPose, playDuration } from "../src/simulation/play";
import { safeStanding } from "../src/world/spawn";
import {
  fromGame,
  decode,
  encode,
  validateSnapshot,
} from "../src/persistence/schema";
import { Commands } from "../src/build/commands";
import { BuildCollisionIndex } from "../src/build/collision-index";
import { makeSunbeamRegion } from "../src/world/sunbeam-region";
import * as T from "three";
import type { AuthoredProp } from "../src/world/authoring";
test("context picks a visible nearby object and never reaches through a wall or floor", () => {
  const target = (id: string, x: number, y: number): Interaction => ({
      id,
      kind: "object",
      x,
      y,
      z: 0,
      range: 3,
      icon: "",
      label: "",
      data: {},
    }),
    p = { x: 0, y: 0, z: 0 };
  assert.equal(
    chooseInteraction(
      p,
      [target("hidden", 1, 0), target("clear", 2, 0)],
      (t) => t.id !== "hidden",
    )?.id,
    "clear",
  );
  assert.equal(
    chooseInteraction(p, [target("upstairs", 1, 3.2)], () => true),
    undefined,
  );
});
test("play paths are continuous, bounded and rotate with the equipment", () => {
  for (const kind of ["swing", "seesaw", "bounce", "slide", "rock"]) {
    const b = { x: 0, y: 0, z: 0, type: "swing", rotation: 90 };
    let before = playPose(kind, b, 0);
    for (let t = 0.02; t < playDuration(kind); t += 0.02) {
      const p = playPose(kind, b, t);
      assert.ok(
        Math.hypot(p.x - before.x, p.y - before.y, p.z - before.z) < 0.1,
      );
      assert.ok(p.y >= 0 && p.y < 2);
      before = p;
    }
  }
});
test("standing beside an upstairs seat retains the supported floor", () => {
  const p = safeStanding({ x: 1, y: 3.2, z: 1, yaw: 0 }, [
    { minX: -5, maxX: 5, minZ: -5, maxZ: 5, minY: 3, maxY: 3.2 },
  ]);
  assert.equal(p.y, 3.2);
});
test("schema 1/2 migrate to 3 and furniture states roundtrip without dropping creations", () => {
  const s = fromGame({
    template: "blank",
    blocks: [{ x: 0, y: 0, z: 0, type: "wood" }],
    doors: {},
    props: { "home:light": { on: false } },
    player: { x: 5, y: 0, z: 5, yaw: 0, pitch: 0 },
    selected: "hand",
  });
  for (const schema of [1, 2])
    assert.equal(validateSnapshot({ ...s, schema }).schema, 3);
  assert.deepEqual(decode(encode(s)).world.props, {
    "home:light": { on: false },
  });
  assert.throws(() =>
    validateSnapshot({
      ...s,
      world: { ...s.world, props: { x: { on: "bad" } } },
    }),
  );
});
test("old region saves retain layout one while new region instances use layout two", () => {
  const old = makeSunbeamRegion(new T.Group(), 1),
    fresh = makeSunbeamRegion(new T.Group(), 2);
  assert.equal(
    old.authoredProps.find(
      (p: AuthoredProp) => p.id === "cedar-villa:cupboard",
    )!.block.type,
    "wall-cupboard",
  );
  assert.equal(
    fresh.authoredProps.find(
      (p: AuthoredProp) => p.id === "cedar-villa:cupboard",
    )!.block.type,
    "dining-hutch",
  );
  const s = fromGame({
    template: "sunbeam-region",
    blocks: [],
    doors: {},
    player: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    selected: "hand",
  });
  const { layout, ...withoutLayout } = s.world;
  assert.equal(
    validateSnapshot({ ...s, schema: 2, world: withoutLayout }).world.layout,
    1,
  );
  assert.equal(s.world.layout, 2);
});
test("build collision queries remain local at capacity and update atomically with moves", () => {
  const index = new BuildCollisionIndex(),
    blocks = Array.from({ length: 12000 }, (_, i) => ({
      x: i % 120,
      y: 0,
      z: Math.floor(i / 120),
      type: "wood",
    }));
  index.reset(blocks);
  assert.ok(index.query({ x: 10, y: 0, z: 10 }, 2).length < 40);
  const b = blocks[0];
  index.update(b, false);
  assert.equal(
    index
      .blocksNear({ x: 0.5, y: 0, z: 0.5 }, 0.1)
      .some((x) => x.x === 0 && x.z === 0),
    false,
  );
  index.update({ x: 150, y: 0, z: 150, type: "wide-floor" }, true);
  assert.equal(
    index
      .blocksNear({ x: 149, y: 0, z: 150 }, 0.1)
      .some((x) => x.type === "wide-floor"),
    true,
  );
});
test("cupboard swing and state changes are obstruction tested and undoable", () => {
  const c = new Commands(
    () => [],
    () => ({ x: 3, y: 0, z: 3 }),
    () => {},
  );
  assert.equal(c.place({ x: 0, y: 0, z: 0, type: "dining-hutch" }, false), "");
  assert.equal(c.toggle(c.blocks[0]), "");
  assert.equal(c.blocks[0].open, true);
  assert.ok(c.undo());
  assert.equal(c.blocks[0].open, undefined);
});
