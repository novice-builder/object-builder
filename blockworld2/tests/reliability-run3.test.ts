import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { WorldStore } from "../src/persistence/store";
import { fromGame } from "../src/persistence/schema";
import { activateSavedUpdate } from "../src/app/offline";
import { Activity } from "../src/simulation/activity";
import * as T from "three";
const state = (x = 0) =>
  fromGame({
    template: "blank",
    blocks: [{ x, y: 0, z: 0, type: "wood" }],
    doors: {},
    player: { x: 10, y: 0, z: 10, yaw: 0, pitch: 0 },
    selected: "hand",
  });
test("aborting a save transaction retains the previous committed checkpoint", async () => {
  const store = await WorldStore.open("bw2-abort-" + crypto.randomUUID()),
    record = await store.create("Original", state());
  const db = store.db as any,
    transaction = db.transaction.bind(db);
  db.transaction = (names: any, mode: any, options: any) => {
    const tx: IDBTransaction = transaction(names, mode, options);
    if (mode === "readwrite") {
      const objectStore = tx.objectStore.bind(tx);
      (tx as any).objectStore = (name: string) => {
        const object = objectStore(name),
          put = object.put.bind(object);
        object.put = (value: any) => {
          const r = put(value);
          r.addEventListener("success", () => tx.abort());
          return r;
        };
        return object;
      };
    }
    return tx;
  };
  await assert.rejects(() => store.save(record.id, 0, state(2)));
  db.transaction = transaction;
  const loaded = await store.load(record.id);
  assert.equal(loaded.record.revision, 0);
  assert.equal(loaded.snapshot.world.blocks[0].x, 0);
  assert.equal((await store.save(record.id, 0, state(3))).revision, 1);
  store.db.close();
});
test("worker activation waits for saving and is never sent on failure", async () => {
  let sent = 0,
    saved = 0;
  const worker = { postMessage: () => sent++ };
  await activateSavedUpdate(
    {
      ready: true,
      blocked: false,
      save: async () => {
        saved++;
      },
    },
    worker,
  );
  assert.equal(saved, 1);
  assert.equal(sent, 1);
  await assert.rejects(() =>
    activateSavedUpdate(
      {
        ready: true,
        blocked: false,
        save: async () => {
          throw Error("quota");
        },
      },
      worker,
    ),
  );
  assert.equal(sent, 1);
  await assert.rejects(() =>
    activateSavedUpdate(
      { ready: true, blocked: true, save: async () => {} },
      worker,
    ),
  );
  assert.equal(sent, 1);
});
test("small-template residents start apart and cannot deadlock in overlapping pairs", () => {
  const a = new Activity(new T.Scene(), 47);
  const people = a.agents.filter((x) => !x.animal);
  assert.equal(new Set(people.map((p) => `${p.state.x},${p.state.z}`)).size, 4);
  const x = people[0].state.x;
  a.update(0.1, { x: -10, y: 0, z: 10 }, { forward: 0, right: 0 }, []);
  assert.notEqual(people[0].state.x, x);
  a.dispose();
});
