import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { WorldStore, ConflictError } from "../src/persistence/store";
import {
  fromGame,
  decode,
  encode,
  parseBackup,
} from "../src/persistence/schema";
const state = (x = 0) =>
  fromGame({
    template: "blank",
    blocks: [{ x, y: 0, z: 0, type: "wood" }],
    doors: {},
    player: { x: 10, y: 0, z: 10, yaw: 0, pitch: 0 },
    selected: "wood",
  });
const open = () => WorldStore.open("bw2-test-" + crypto.randomUUID());
test("converted backup retains the original legacy file through export/import", async () => {
  const s = await open();
  const original = JSON.stringify({
    version: 4,
    world: "little-block-world-06",
    blocks: [],
    inventory: {},
    player: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
  });
  const a = await s.import(original),
    b = await s.import(s.export(a));
  assert.equal(b.importSource, original);
  s.db.close();
});
test("independent worlds, duplicate, rename and last selection survive reopening", async () => {
  const s = await open(),
    a = await s.create("A", state()),
    b = await s.create("B", state(2));
  await s.select(b.id);
  const copy = await s.duplicate(a.id);
  await s.rename(copy.id, copy.revision, "Copy");
  const reopened = await WorldStore.open(s.db.name);
  assert.equal((await reopened.load(a.id)).snapshot.world.blocks[0].x, 0);
  assert.equal((await reopened.load(b.id)).snapshot.world.blocks[0].x, 2);
  assert.equal((await reopened.list()).length, 3);
  assert.equal(await reopened.last(), b.id);
  s.db.close();
  reopened.db.close();
});
test("stale writers cannot replace newer progress", async () => {
  const s = await open(),
    a = await s.create("A", state());
  await s.save(a.id, 0, state(2));
  await assert.rejects(() => s.save(a.id, 0, state(3)), ConflictError);
  assert.equal((await s.load(a.id)).snapshot.world.blocks[0].x, 2);
  s.db.close();
});
test("corrupt current checkpoint recovers older data without overwriting original", async () => {
  const s = await open(),
    a = await s.create("A", state()),
    b = await s.save(a.id, 0, state(2));
  const tx = s.db.transaction("worlds", "readwrite");
  tx.objectStore("worlds").put({
    ...b,
    current: { json: "broken", checksum: "bad" },
  });
  await new Promise((r) => (tx.oncomplete = r));
  const recovered = await s.load(a.id);
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.snapshot.world.blocks[0].x, 0);
  await assert.rejects(() => s.save(a.id, 1, state(4)));
  assert.equal((await s.load(a.id)).recovered, true);
  s.db.close();
});
test("backup roundtrip creates a new instance and malformed files never replace progress", async () => {
  const s = await open(),
    a = await s.create("A", state()),
    b = await s.import(s.export(a));
  assert.notEqual(a.id, b.id);
  assert.deepEqual(decode(a.current), decode(b.current));
  await assert.rejects(() => s.import("{bad"));
  assert.equal((await s.list()).length, 2);
  assert.throws(() => decode({ ...encode(state()), checksum: "bad" }));
  s.db.close();
});
test("legacy schema 4 imports preserve coordinates and raw original without storage-key access", () => {
  const source = JSON.stringify({
    version: 4,
    world: "little-block-world-06",
    blocks: [{ x: 100, y: 0, z: -100, type: "bench", rotation: 90 }],
    inventory: { bench: 0 },
    doors: { home: true },
    player: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    selected: "bench",
  });
  const parsed = parseBackup(source);
  assert.equal(parsed.source, source);
  assert.equal(parsed.snapshot.template, "legacy-06");
  assert.equal(parsed.snapshot.world.blocks[0].rotation, 90);
  assert.throws(() => parseBackup(JSON.stringify({ version: 99, blocks: [] })));
});
