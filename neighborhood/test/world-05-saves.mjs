import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  launch,
  openGame,
  releases,
  pose,
  look,
  speed,
} from "./browser-05-helpers.mjs";
const out = "../work/world-05/saves";
await mkdir(out, { recursive: true });
const b = await launch(),
  results = [];
async function download(p, name) {
  const promised = p.waitForEvent("download");
  await p.tap("#export");
  const f = await promised;
  await f.saveAs(`${out}/${name}`);
  return readFile(`${out}/${name}`, "utf8");
}
async function importText(p, name, text) {
  await p
    .locator("#import")
    .setInputFiles({
      name,
      mimeType: "application/json",
      buffer: Buffer.from(text),
    });
}
try {
  const g = await openGame(b, 4),
    p = g.page;
  const raw03 = JSON.stringify({
      version: 1,
      blocks: [{ x: 5, y: 0, z: 0, type: "brick" }],
      inventory: { bench: 2 },
      selected: "hand",
      player: { x: -14.4, y: 0, z: -1.2, yaw: 0, pitch: 0 },
      doors: {},
    }),
    prefs04 = JSON.stringify({
      quality: false,
      subtitles: true,
      edgeProtection: true,
      automaticDoors: true,
      placement: "direct",
    });
  await p.evaluate(
    ({ raw03, prefs04 }) => {
      localStorage.setItem("blockworld.neighborhood.01", raw03);
      localStorage.setItem("blockworld.neighborhood.controls.v4", prefs04);
      const s = blockworld.snapshot();
      s.blocks = [];
      for (let x = -81; x < -56; x++)
        for (let z = 49; z < 69; z++)
          for (let y = 0; y < 24; y++)
            s.blocks.push({
              x,
              y,
              z,
              type: ["wood", "stone", "brick", "glass"][(x + y + z + 400) % 4],
            });
      s.selected = "stone";
      s.inventory.bench = 3;
      s.player = { x: -52, y: 0, z: 60, yaw: Math.PI / 2, pitch: 0 };
      blockworld.test.load(s);
      blockworld.test.save();
    },
    { raw03, prefs04 },
  );
  const raw04 = await p.evaluate(() =>
    localStorage.getItem("blockworld.neighborhood.04"),
  );
  assert.equal(JSON.parse(raw04).blocks.length, 12000);
  await p.tap("#menu");
  const export04 = await download(p, "04-export.json");
  assert.equal(JSON.parse(export04).version, 2);
  results.push("actual 04 runtime exports a valid 12000-piece baseline");
  await g.context.route("**/*", (r) =>
    r.fulfill({ contentType: "text/html", body: releases[5] }),
  );
  await p.reload();
  await p.waitForFunction(() => window.blockworld?.ready);
  let s = await p.evaluate(() => blockworld.snapshot());
  assert.equal(s.version, 3);
  assert.deepEqual(s.blocks, JSON.parse(raw04).blocks);
  assert.equal(s.inventory.bench, 3);
  assert.equal(s.selected, "stone");
  assert.equal(
    (await p.evaluate(() => blockworld.controls())).walkSpeed,
    "normal",
  );
  await p.tap("#play");
  results.push(
    "05 automatically copies 04 large progress before 03, with all structures, selection and inventory intact",
  );
  const assertOld = async () => {
    assert.equal(
      await p.evaluate(() =>
        localStorage.getItem("blockworld.neighborhood.04"),
      ),
      raw04,
    );
    assert.equal(
      await p.evaluate(() =>
        localStorage.getItem("blockworld.neighborhood.01"),
      ),
      raw03,
    );
    assert.equal(
      await p.evaluate(() =>
        localStorage.getItem("blockworld.neighborhood.controls.v4"),
      ),
      prefs04,
    );
  };
  await assertOld();
  await speed(p, "fast");
  await p.evaluate(() => blockworld.test.save());
  await p.reload();
  await p.waitForFunction(() => window.blockworld?.ready);
  await p.tap("#play");
  assert.equal(
    (await p.evaluate(() => blockworld.snapshot())).blocks.length,
    12000,
  );
  assert.equal(
    (await p.evaluate(() => blockworld.controls())).walkSpeed,
    "fast",
  );
  await assertOld();
  results.push(
    "large progress and Fast preference survive reopening without changing old saves/settings",
  );
  await pose(p, { x: -52, z: 60, yaw: Math.PI / 2 });
  await look(p, -56.5, 0.5, 60.5);
  assert.equal(await p.evaluate(() => blockworld.test.remove()), true);
  assert.equal(
    await p.evaluate(() =>
      blockworld.test.add({ x: 150, y: 0, z: 210, type: "wood" }),
    ),
    "",
  );
  await p.evaluate(() => blockworld.test.save());
  await p.tap("#menu");
  const export05 = await download(p, "05-export.json");
  s = JSON.parse(export05);
  assert.equal(s.version, 3);
  assert.equal(s.world, "little-block-world-05");
  assert.equal(s.blocks.length, 12000);
  assert.ok(s.blocks.some((b) => b.x === 150 && b.z === 210));
  assert.ok(export05.length > 250000);
  results.push(
    "05 exports a large versioned build including new outer-world coordinates",
  );
  await p.tap("#resume");
  await p.evaluate(() => blockworld.test.fresh());
  await p.tap("#menu");
  await importText(p, "05.json", export05);
  await p.waitForFunction(() => blockworld.snapshot().blocks.length === 12000);
  assert.deepEqual(
    (await p.evaluate(() => blockworld.snapshot())).blocks,
    s.blocks,
  );
  await assertOld();
  results.push(
    "real file-input import restores every 05 piece and outer coordinate",
  );
  const bads = [
    { ...s, world: "other-world" },
    { ...s, version: 99 },
    { ...s, blocks: [s.blocks[0], s.blocks[0]] },
    {
      ...s,
      version: 2,
      world: "little-block-world-04",
      blocks: [{ x: 200, y: 0, z: 200, type: "wood" }],
    },
  ];
  for (const bad of bads) {
    await importText(p, "bad.json", JSON.stringify(bad));
    await p.waitForFunction(() =>
      document
        .getElementById("settingsFeedback")
        .textContent.startsWith("Could not"),
    );
    assert.deepEqual(
      (await p.evaluate(() => blockworld.snapshot())).blocks,
      s.blocks,
    );
  }
  results.push(
    "invalid schema, world, duplicates and invalid legacy bounds are rejected atomically",
  );
  await importText(p, "04.json", export04);
  await p.waitForFunction(
    () => !blockworld.snapshot().blocks.some((b) => b.x === 150),
  );
  assert.deepEqual(
    (await p.evaluate(() => blockworld.snapshot())).blocks,
    JSON.parse(export04).blocks,
  );
  await assertOld();
  results.push(
    "manual 04 import migrates all 12000 pieces without altering its original browser key",
  );
  await importText(p, "03.json", raw03);
  await p.waitForFunction(() => blockworld.snapshot().blocks.length === 1);
  assert.equal((await p.evaluate(() => blockworld.snapshot())).version, 3);
  await p.tap("#resume");
  await pose(p, { x: 151, z: 209 });
  await p.tap("#home");
  s = await p.evaluate(() => blockworld.snapshot());
  assert.ok(Math.hypot(s.player.x + 14.4, s.player.z + 1.2) < 0.01);
  assert.equal(s.blocks.length, 1);
  await assertOld();
  results.push(
    "03 exports remain importable; Home works from the far outer meadow without deleting builds",
  );
  await p.reload();
  await p.waitForFunction(() => window.blockworld?.ready);
  assert.equal(
    (await p.evaluate(() => blockworld.snapshot())).blocks.length,
    1,
  );
  await assertOld();
  results.push(
    "reopening restores the final imported 05 state while 03/04 remain unchanged",
  );
  assert.deepEqual(g.errors, []);
  await g.context.close();
  let fileProtocol = { tested: false };
  const c = await b.newContext();
  await c.setOffline(true);
  const fp = await c.newPage();
  try {
    await fp.goto(
      new URL("../../BlockWorld_Neighborhood_05.html?test=1", import.meta.url)
        .href,
    );
    await fp.waitForFunction(() => window.blockworld?.ready);
    fileProtocol = { tested: true, passed: true };
  } catch (e) {
    if (!String(e.message).includes("ERR_BLOCKED_BY_ADMINISTRATOR")) throw e;
    fileProtocol = {
      tested: false,
      blocked: true,
      reason:
        "Managed Chromium rejects file:// via URL policy; policy was not changed.",
    };
  }
  await c.close();
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(
      {
        results,
        errors: g.errors,
        fileProtocol,
        exportBytes04: export04.length,
        exportBytes05: export05.length,
        releaseSha256: createHash("sha256").update(releases[5]).digest("hex"),
      },
      null,
      2,
    ),
  );
  console.log("PASS", results.length, "save/navigation cases", fileProtocol);
} finally {
  await b.close();
}
