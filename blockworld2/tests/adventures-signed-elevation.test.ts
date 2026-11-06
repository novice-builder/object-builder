import { test } from "node:test";
import assert from "node:assert/strict";
import { makeSnapshot, validateAdventure } from "../src/adventures/save";
import { walkHeight } from "../src/adventures/landscape";
import { encode, decode } from "../src/persistence/schema";
const data = {
  version: 3 as const,
  scene: "vale" as const,
  layout: 6 as const,
  objects: [],
  discoveries: [],
  rooms: {},
};
const x = 34.27916356357986,
  z = -52,
  y = walkHeight(x, z, "vale", 6) + 0.002;
test("actual below-zero bridge bank roundtrips through the unchanged native envelope without losing signed height", () => {
  assert.ok(y < 0);
  const snapshot = makeSnapshot(data, { x, y, z, yaw: 0, pitch: 0.47 }),
    restored = decode(encode(snapshot));
  assert.equal(restored.player.y, 0);
  assert.equal(validateAdventure(restored).outdoorElevation, y);
  const positive = makeSnapshot(validateAdventure(restored), {
    x: -105,
    y: 0.002,
    z: 18,
    yaw: 0,
    pitch: 0.47,
  });
  assert.equal(positive.player.y, 0.002);
  assert.equal((positive.world.adventure as any).outdoorElevation, undefined);
  const entry = {
    id: "bank-room",
    name: "Bank house",
    kind: "cottage" as const,
    levels: 1 as const,
    x,
    z,
    width: 5.8,
    depth: 6.8,
    yaw: 0,
  };
  const inside = makeSnapshot(
    {
      ...validateAdventure(restored),
      rooms: { "bank-room": { entry, objects: [] } },
      inside: { id: "bank-room", outside: { x, y, z, yaw: 0, pitch: 0.47 } },
    },
    { x: 0, y: 0.002, z: 2, yaw: 0, pitch: 0.47 },
  );
  assert.equal((inside.world.adventure as any).outdoorElevation, undefined);
  assert.equal(validateAdventure(decode(encode(inside))).inside!.outside.y, y);
});
test("signed elevation rejects mismatched, nonfinite, old-version or buried imports", () => {
  const valid = makeSnapshot(data, { x, y, z, yaw: 0, pitch: 0.47 });
  for (const mutate of [
    (s: any) => (s.world.adventure.outdoorElevation = 0),
    (s: any) => (s.world.adventure.outdoorElevation = -Infinity),
    (s: any) => (s.world.adventure.outdoorElevation = -3.1),
    (s: any) => (s.world.adventure.outdoorElevation = -0.8),
    (s: any) => (s.player.y = 0.2),
    (s: any) => (s.world.adventure.version = 2),
  ]) {
    const bad = structuredClone(valid);
    mutate(bad);
    assert.throws(() => validateAdventure(bad));
  }
});
