import { test } from "node:test";
import assert from "node:assert/strict";
import { innFurniture } from "../src/adventures/inn-furniture";
import { freshRoom } from "../src/adventures/interior";
import { makeSnapshot, validateAdventure } from "../src/adventures/save";
import type { BuildingEntry } from "../src/adventures/building-entry";
const inn: BuildingEntry = {
  id: "village-inn",
  name: "Village inn",
  kind: "inn",
  levels: 2,
  width: 10,
  depth: 12,
  x: -105,
  z: -16,
  yaw: 0,
};
test("fresh full-sized inns have a common dining room, serving area and two upstairs guest beds", () => {
  for (const [width, depth] of [
    [8, 9],
    [10, 12],
  ]) {
    const objects = innFurniture({ ...inn, width, depth })!;
    assert.equal(objects.length, 14);
    assert.equal(new Set(objects.map((p) => p.id)).size, objects.length);
    assert.equal(
      objects.filter((p) => p.asset === "furniture-chair" && p.y === 0).length,
      4,
    );
    assert.equal(
      objects.filter((p) => p.asset === "furniture-table" && p.y === 0).length,
      3,
    );
    assert.equal(
      objects.filter((p) => p.asset === "furniture-bedsingle" && p.y === 3)
        .length,
      2,
    );
    assert.ok(objects.some((p) => p.id === "provisions" && p.y === 0));
    assert.ok(objects.every((p) => p.y === 0 || p.y === 3));
  }
});
test("single-storey, narrow and legacy unversioned room templates retain their existing furniture path", () => {
  for (const entry of [
    { ...inn, levels: undefined },
    { ...inn, levels: 1 as const },
    { ...inn, width: 5.8 },
    { ...inn, depth: 6.8 },
    { ...inn, kind: "cottage" as const },
  ])
    assert.equal(innFurniture(entry), null);
  const legacy = freshRoom({ ...inn, levels: undefined });
  assert.equal(legacy.objects.length, 8);
  assert.ok(legacy.objects.some((p) => p.id === "table"));
  assert.ok(!legacy.objects.some((p) => p.id === "serving-table"));
});
test("saved inn edits and identity roundtrip without regenerating newly furnished defaults", () => {
  const room = freshRoom({ ...inn, levels: undefined });
  room.entry.levels = 2;
  room.objects.find((p) => p.id === "table")!.x += 0.25;
  const original = structuredClone(room);
  const snapshot = makeSnapshot(
    {
      version: 4,
      scene: "vale",
      layout: 8,
      objects: [],
      discoveries: [],
      rooms: { [inn.id]: room },
    },
    { x: -105, z: 18, yaw: 0, pitch: 0.47 },
  );
  assert.deepEqual(validateAdventure(snapshot).rooms![inn.id], original);
  assert.equal(original.objects.length, 8);
  assert.equal(freshRoom(inn).objects.length, 14);
});
