import { test } from "node:test";
import assert from "node:assert/strict";
import { sessionFixture, deferred } from "./helpers/session-fixture";
test("a world transition cannot let an older save retarget the active world or overwrite its source", async () => {
  const f = await sessionFixture();
  try {
    const { store, a, b, session, game } = f,
      loading = deferred(),
      loadGate = deferred(),
      saving = deferred(),
      saveGate = deferred(),
      load = store.load.bind(store),
      save = store.save.bind(store);
    store.load = async (id: string) => {
      if (id === b.id) {
        loading.resolve();
        await loadGate.promise;
      }
      return load(id);
    };
    store.save = async (...args: Parameters<typeof save>) => {
      saving.resolve();
      await saveGate.promise;
      return save(...args);
    };
    const change = session.open(b.id);
    await loading.promise;
    // The page can still receive a late edit/blur-save while IndexedDB resolves.
    game.state.blocks.push({ x: 4, y: 0, z: 0, type: "wood" });
    const pending = session.save();
    // Either saving is held behind the transition, or it commits before B applies.
    await Promise.race([saving.promise, new Promise((r) => setTimeout(r, 10))]);
    loadGate.resolve();
    saveGate.resolve();
    await Promise.all([change, pending]);
    assert.equal(session.current!.id, b.id);
    await session.save();
    assert.deepEqual(
      (await load(a.id)).snapshot.world.blocks.map((b) => b.x),
      [0, 4],
    );
    assert.deepEqual(
      (await load(b.id)).snapshot.world.blocks.map((b) => b.x),
      [2],
    );
  } finally {
    f.restore();
  }
});

test("rapid queued creation and switching retain every independent world", async () => {
  const f = await sessionFixture();
  try {
    const first = f.session.newWorld("blank"),
      second = f.session.newWorld("blank");
    const [a, b] = await Promise.all([first, second]);
    assert.notEqual(a.id, b.id);
    assert.equal(f.session.current!.id, b.id);
    f.game.state.blocks = [{ x: 8, y: 0, z: 0, type: "brick" }];
    await Promise.all([
      f.session.save(),
      f.session.open(f.a.id),
      f.session.open(a.id),
    ]);
    assert.equal(f.session.current!.id, a.id);
    assert.deepEqual(
      (await f.store.load(b.id)).snapshot.world.blocks.map((b) => b.x),
      [8],
    );
    assert.deepEqual(
      (await f.store.load(f.a.id)).snapshot.world.blocks.map((b) => b.x),
      [0],
    );
  } finally {
    f.restore();
  }
});
test("a failed save aborts switching and retains unsaved source data and its original record", async () => {
  const f = await sessionFixture();
  try {
    f.game.state.blocks.push({ x: 6, y: 0, z: 0, type: "wood" });
    f.store.save = async () => {
      throw new DOMException("Quota full", "QuotaExceededError");
    };
    await assert.rejects(() => f.session.open(f.b.id), /Quota/);
    assert.equal(f.session.current!.id, f.a.id);
    assert.equal(f.session.blocked, true);
    assert.deepEqual(
      f.game.state.blocks.map((b: any) => b.x),
      [0, 6],
    );
    assert.deepEqual(
      (await f.store.load(f.a.id)).snapshot.world.blocks.map((b) => b.x),
      [0],
    );
  } finally {
    f.restore();
  }
});
