import { test } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import { freshRoom } from "../src/adventures/interior";
import type { BuildingEntry } from "../src/adventures/building-entry";
import {
  makeSnapshot,
  validateAdventure,
  AdventureSession,
} from "../src/adventures/save";
import { WorldStore } from "../src/persistence/store";
import { encode, decode } from "../src/persistence/schema";
Object.assign(globalThis, { indexedDB });
const entry: BuildingEntry = {
  id: "windmill",
  name: "Windmill",
  kind: "mill",
  levels: 2,
  profile: "compact-windmill",
  width: 5.2,
  depth: 5.2,
  x: -139.68,
  z: 24,
  yaw: Math.PI / 2,
};
test("compact room and intermediate landing require version 4; malformed or older interpretations are refused", () => {
  const room = freshRoom(entry),
    s = makeSnapshot(
      {
        version: 4,
        scene: "vale",
        layout: 7,
        objects: [],
        discoveries: [],
        rooms: { windmill: room },
        inside: {
          id: "windmill",
          outside: { x: entry.x, z: entry.z, y: 0.002, yaw: 0, pitch: 0.47 },
        },
      },
      { x: 0.7, z: -1.2, y: 1.502, yaw: 0, pitch: 0.8 },
    );
  assert.equal(
    validateAdventure(decode(encode(s))).rooms!.windmill.entry.profile,
    "compact-windmill",
  );
  assert.equal(room.objects.length, 6);
  assert.ok(room.objects.some((p) => p.id === "grain" && p.y === 3));
  for (const mutate of [
    (a: any) => (a.version = 3),
    (a: any) => (a.rooms.windmill.entry.profile = "unknown"),
    (a: any) => (a.rooms.windmill.entry.width = 6),
    (a: any) => (a.rooms.windmill.entry.kind = "cottage"),
    (a: any) => (a.rooms.windmill.entry.levels = 1),
  ]) {
    const bad = structuredClone(s);
    mutate(bad.world.adventure);
    assert.throws(() => validateAdventure(bad), /interior/);
  }
});
test("version-4 outdoor riverbank elevation still roundtrips through the native nonnegative envelope", () => {
  const s = makeSnapshot(
    {
      version: 4,
      scene: "vale",
      layout: 7,
      objects: [],
      discoveries: [],
      rooms: {},
    },
    {
      x: 34.27916356357986,
      z: -52,
      y: -0.00662013521996321,
      yaw: 0,
      pitch: 0.47,
    },
  );
  assert.equal(s.player.y, 0);
  const a = validateAdventure(decode(encode(s)));
  assert.equal(a.outdoorElevation, -0.00662013521996321);
  assert.equal(a.version, 4);
});
test("version-4 upgrade forks once and retains the exact original rectangular mill edits and room identity", async () => {
  const { profile: _profile, ...legacyEntry } = entry;
  const oldEntry = {
      ...legacyEntry,
      width: 6.532168388366699,
      depth: 6.8,
    },
    oldRoom = freshRoom(oldEntry);
  oldRoom.objects.find((p) => p.id === "grain")!.yaw = 0.7;
  let state = makeSnapshot(
    {
      version: 3,
      scene: "vale",
      layout: 7,
      objects: [],
      discoveries: ["village:mill"],
      rooms: { windmill: oldRoom },
    },
    { x: entry.x, z: entry.z, y: 0.002, yaw: 0, pitch: 0.47 },
  );
  const original = structuredClone(state);
  const session = new AdventureSession(
    () => structuredClone(state),
    (s) => {
      state = structuredClone(s);
    },
    () => {},
    () => {},
  );
  session.store = await WorldStore.open(
    "compact-upgrade-" + crypto.randomUUID(),
  );
  const old = await session.store.create("M".repeat(60), original);
  await session.open(old.id);
  await session.copyForRooms(4);
  const id = session.current!.id;
  assert.notEqual(id, old.id);
  const upgraded = await session.store.load(id);
  assert.equal(validateAdventure(upgraded.snapshot).version, 4);
  assert.deepEqual(
    validateAdventure(upgraded.snapshot).rooms,
    validateAdventure(original).rooms,
  );
  assert.deepEqual((await session.store.load(old.id)).snapshot, original);
  assert.ok(session.current!.name.endsWith("updated adventure"));
  // The successful room transition adopts the new format after the copy is durable.
  state = structuredClone(upgraded.snapshot);
  await session.copyForRooms(4);
  assert.equal(session.current!.id, id);
  assert.equal((await session.store.list()).length, 2);
  await session.open(old.id);
  assert.deepEqual(state, original);
});
