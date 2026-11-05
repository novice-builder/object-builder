import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { RegistryChunks } from "../src/build/models";
import { Commands } from "../src/build/commands";
import { createAvatar, disposeAvatar } from "../src/player/appearance";
test("a multi-object edit saves once and rebuilds each touched chunk once", () => {
  const chunks = new RegistryChunks(
      new T.Group(),
      new T.BoxGeometry(),
      { wood: new T.MeshLambertMaterial() },
      () => new T.MeshLambertMaterial(),
    ),
    pending: { block: any; present: boolean }[] = [];
  let commits = 0;
  const commands = new Commands(
    () => [],
    () => ({ x: 20, y: 0, z: 20 }),
    (block, present) => pending.push({ block, present }),
    () => {
      chunks.updateMany(pending.splice(0));
      commits++;
    },
  );
  const before = chunks.legacy.rebuilt;
  assert.equal(
    commands.placeMany(
      Array.from({ length: 5 }, (_, x) => ({ x, y: 0, z: 0, type: "wood" })),
      false,
    ),
    "",
  );
  assert.equal(commits, 1);
  assert.equal(chunks.legacy.rebuilt - before, 1);
  assert.ok(commands.undo());
  assert.equal(commits, 2);
  assert.ok(commands.redo());
  assert.equal(commits, 3);
  const nativeBefore = chunks.rebuilt;
  assert.equal(
    commands.placeMany(
      [
        { x: 0, y: 0, z: 5, type: "planter" },
        { x: 3, y: 0, z: 5, type: "planter" },
      ],
      false,
    ),
    "",
  );
  assert.equal(chunks.rebuilt - nativeBefore, 1);
  chunks.clear();
});
test("rich avatar rendering is bounded to five meshes", () => {
  const avatar = createAvatar("builder");
  assert.equal(avatar.group.children.length, 5);
  disposeAvatar(avatar);
});
