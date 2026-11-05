import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  APPEARANCES,
  createAvatar,
  disposeAvatar,
} from "../src/player/appearance";
import {
  fromGame,
  encode,
  decode,
  validateSnapshot,
} from "../src/persistence/schema";
test("all twelve original looks have faces, bounded silhouettes and persistent selection", () => {
  assert.equal(APPEARANCES.length, 12);
  assert.equal(new Set(APPEARANCES.map((a) => a.id)).size, 12);
  const signatures = new Set<string>();
  for (const look of APPEARANCES) {
    const body = createAvatar(look.id),
      bounds = new T.Box3().setFromObject(body.group);
    assert.ok(bounds.max.y > 1.65 && bounds.max.y < 2);
    assert.equal(body.group.userData.appearance, look.id);
    assert.equal(body.arms.length, 2);
    signatures.add(
      JSON.stringify(
        body.group.children.map((o: any) => [
          o.position.toArray(),
          o.scale.toArray(),
          o.material.color.getHex(),
        ]),
      ),
    );
    const s = fromGame({
      template: "blank",
      blocks: [],
      doors: {},
      player: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
      selected: "hand",
      avatar: look.id,
    });
    assert.equal(decode(encode(s)).preferences.avatar, look.id);
    disposeAvatar(body);
  }
  assert.equal(signatures.size, 12);
  const s = fromGame({
    template: "blank",
    blocks: [],
    doors: {},
    player: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    selected: "hand",
  });
  assert.throws(() =>
    validateSnapshot({
      ...s,
      preferences: { ...s.preferences, avatar: "missing" },
    }),
  );
});
