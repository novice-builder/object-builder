import { test } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import {
  buildingKind,
  type BuildingEntry,
} from "../src/adventures/building-entry";
import { HALL_HEIGHT, hallFurniture } from "../src/adventures/hall-room";
import { freshRoom } from "../src/adventures/interior";
import { roomStructure } from "../src/adventures/interior-physics";
import {
  AdventureSession,
  makeSnapshot,
  validateAdventure,
} from "../src/adventures/save";
import { WorldStore } from "../src/persistence/store";
Object.assign(globalThis, { indexedDB });
const entry: BuildingEntry = {
  id: "village-hall",
  name: "Village hall",
  kind: "hall",
  profile: "community-hall",
  levels: 1,
  x: -126.33,
  z: -32,
  yaw: Math.PI / 2,
  width: 8.23,
  depth: 9.24,
};
test("existing church asset becomes a single-floor tall hall with a reserved central aisle", () => {
  assert.equal(buildingKind("building_church_blue"), "hall");
  const furniture = hallFurniture(entry);
  assert.equal(furniture.length, 16);
  assert.equal(
    furniture.filter((p) => p.asset === "furniture-chair").length,
    12,
  );
  assert.ok(furniture.every((p) => p.y === 0));
  assert.equal(new Set(furniture.map((p) => p.id)).size, 16);
  for (const p of furniture.filter((p) => p.asset === "furniture-chair"))
    assert.ok(Math.abs(p.x) >= 1.6);
  const solids = roomStructure(entry.width, entry.depth, false, HALL_HEIGHT);
  assert.ok(solids.every((s) => s.maxY === 4.5));
  assert.ok(solids.every((s) => !s.ramp));
  assert.equal(roomStructure(entry.width, entry.depth, false)[0].maxY, 3);
});
test("new hall requires explicit format5 profile validation while older profiles retain their own geometry", () => {
  const room = freshRoom(entry);
  const snapshot = makeSnapshot(
    {
      version: 5,
      scene: "vale",
      layout: 9,
      objects: [],
      discoveries: [],
      rooms: { [entry.id]: room },
    },
    { x: -105, z: 18, yaw: 0, pitch: 0.47 },
  );
  assert.deepEqual(validateAdventure(snapshot).rooms![entry.id], room);
  for (const change of [
    { version: 4 },
    { profile: undefined },
    { kind: "cottage" },
    { levels: 2 },
    { width: 20 },
  ]) {
    const bad = structuredClone(snapshot),
      data = bad.world.adventure as any;
    if ("version" in change) data.version = change.version;
    else Object.assign(data.rooms[entry.id].entry, change);
    assert.throws(() => validateAdventure(bad));
  }
  const old = freshRoom({
    ...entry,
    id: "old-cottage",
    kind: "cottage",
    profile: undefined,
    levels: undefined,
  });
  assert.ok(old.objects.some((p) => p.id === "bed" && p.y === 3));
});
test("version5 copy retains the complete version4 world and exact older room edits before adding a hall", async () => {
  const older = freshRoom({
    ...entry,
    id: "older-inn",
    kind: "inn",
    profile: undefined,
    levels: 2,
    width: 10,
    depth: 12,
  });
  delete older.entry.profile;
  older.objects.find((p) => p.id === "serving-table")!.z += 0.2;
  const original = makeSnapshot(
    {
      version: 4,
      scene: "vale",
      layout: 9,
      objects: [
        {
          id: "retain-prop",
          asset: "barrel",
          x: 100,
          z: 20,
          yaw: 0.4,
          scale: 3,
        },
      ],
      discoveries: ["foxglade"],
      rooms: { "older-inn": older },
    },
    { x: -126.33, z: -32, yaw: 1.2, pitch: 0.47 },
  );
  let state = structuredClone(original);
  const session = new AdventureSession(
    () => state,
    (s) => {
      state = structuredClone(s);
    },
    () => {},
    () => {},
  );
  session.store = await WorldStore.open("hall-copy-" + crypto.randomUUID());
  const before = await session.store.create("Decorated older valley", original);
  await session.open(before.id);
  await session.copyForRooms(5);
  const copied = session.current!.id;
  assert.notEqual(copied, before.id);
  assert.deepEqual((await session.store.load(before.id)).snapshot, original);
  const newer = await session.store.load(copied),
    data = validateAdventure(newer.snapshot);
  assert.equal(data.version, 5);
  assert.deepEqual(data.rooms, { "older-inn": older });
  assert.deepEqual(data.objects, validateAdventure(original).objects);
});
test("a failed format5 copy leaves the selected original record and current snapshot intact", async () => {
  const original = makeSnapshot(
    {
      version: 4,
      scene: "vale",
      layout: 9,
      objects: [],
      discoveries: [],
      rooms: {},
    },
    { x: -126.33, z: -32, yaw: 0, pitch: 0.47 },
  );
  let state = structuredClone(original);
  const session = new AdventureSession(
    () => state,
    (s) => {
      state = structuredClone(s);
    },
    () => {},
    () => {},
  );
  session.store = await WorldStore.open("hall-denied-" + crypto.randomUUID());
  const before = await session.store.create("Keep this original", original);
  await session.open(before.id);
  session.store.create = async () => {
    throw new DOMException("Local test quota denial", "QuotaExceededError");
  };
  await assert.rejects(session.copyForRooms(5));
  assert.equal(session.current!.id, before.id);
  assert.deepEqual(state, original);
  assert.deepEqual((await session.store.load(before.id)).snapshot, original);
  assert.equal((await session.store.list()).length, 1);
});
