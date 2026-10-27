import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const html = await readFile("../BlockWorld_Neighborhood_04.html", "utf8"),
  out = "../work/world-04/saves";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const context = await browser.newContext({
  viewport: { width: 800, height: 600 },
  hasTouch: true,
  isMobile: true,
  acceptDownloads: true,
});
await context.route("**/*", (r) =>
  r.fulfill({ contentType: "text/html", body: html }),
);
await context.setOffline(true);
const page = await context.newPage(),
  results = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const legacy = {
  version: 1,
  blocks: [{ x: 5, y: 0, z: 0, type: "wood" }],
  inventory: { bench: 2 },
  selected: "brick",
  player: { x: -14.4, y: 0, z: -1.2, yaw: 0, pitch: 0 },
  doors: { home: false },
  doorSwings: { home: 1 },
};
try {
  await page.goto("http://localhost:8080/?test=1");
  await page.waitForFunction(() => window.blockworld?.ready);
  await page.tap("#play");
  await page.evaluate(() => {
    blockworld.test.fresh();
    const data = blockworld.snapshot();
    data.blocks = [];
    for (let x = -81; x < -56; x++)
      for (let z = 49; z < 69; z++)
        for (let y = 0; y < 24; y++)
          data.blocks.push({ x, y, z, type: "wood" });
    blockworld.test.load(data);
    blockworld.test.save();
  });
  const before = await page.evaluate(() => blockworld.snapshot());
  assert.equal(before.blocks.length, 12000);
  await page.reload();
  await page.waitForFunction(() => window.blockworld?.ready);
  await page.tap("#play");
  assert.equal(
    (await page.evaluate(() => blockworld.snapshot())).blocks.length,
    12000,
  );
  results.push("12000 pieces persist across reopening");
  await page.tap("#menu");
  const downloading = page.waitForEvent("download");
  await page.tap("#export");
  const download = await downloading;
  await download.saveAs(`${out}/export.json`);
  const exported = await readFile(`${out}/export.json`, "utf8");
  assert.ok(Buffer.byteLength(exported) > 250000);
  assert.equal(JSON.parse(exported).blocks.length, 12000);
  results.push(
    "real download exports 12000-piece versioned JSON larger than old import limit",
  );
  await page.tap("#resume");
  await page.evaluate(() => blockworld.test.fresh());
  await page.tap("#menu");
  await page.locator("#import").setInputFiles({
    name: "world04.json",
    mimeType: "application/json",
    buffer: Buffer.from(exported),
  });
  await page.waitForFunction(
    () => blockworld.snapshot().blocks.length === 12000,
  );
  assert.deepEqual(
    (await page.evaluate(() => blockworld.snapshot())).blocks,
    before.blocks,
  );
  results.push(
    "large exported file imports through real file input and restores every piece",
  );
  await page.locator("#import").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99,"blocks":[]}'),
  });
  await page.waitForFunction(() =>
    document
      .getElementById("settingsFeedback")
      .textContent.includes("Could not"),
  );
  assert.equal(
    (await page.evaluate(() => blockworld.snapshot())).blocks.length,
    12000,
  );
  results.push("invalid import leaves current progress unchanged");
  const legacyRaw = JSON.stringify(legacy);
  await page.evaluate(
    (raw) => localStorage.setItem("blockworld.neighborhood.01", raw),
    legacyRaw,
  );
  await page.locator("#import").setInputFiles({
    name: "03.json",
    mimeType: "application/json",
    buffer: Buffer.from(legacyRaw),
  });
  await page.waitForFunction(() => blockworld.snapshot().blocks.length === 1);
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("blockworld.neighborhood.01"),
    ),
    legacyRaw,
  );
  assert.equal((await page.evaluate(() => blockworld.snapshot())).version, 2);
  results.push(
    "older exported save imports as a copy without altering 03 browser progress",
  );
  await page.reload();
  await page.waitForFunction(() => window.blockworld?.ready);
  assert.equal(
    (await page.evaluate(() => blockworld.snapshot())).blocks.length,
    1,
  );
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("blockworld.neighborhood.01"),
    ),
    legacyRaw,
  );
  results.push("reopening retains migrated 04 state and untouched 03 key");
  await page.tap("#play");
  await page.evaluate(() =>
    blockworld.test.setPlayer({ x: 81, y: 0, z: 94, vy: 0, grounded: true }),
  );
  await page.tap("#home");
  const returned = await page.evaluate(() => blockworld.snapshot());
  assert.ok(
    Math.hypot(returned.player.x + 14.4, returned.player.z + 1.2) < 0.01,
  );
  assert.equal(returned.blocks.length, 1);
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("blockworld.neighborhood.01"),
    ),
    legacyRaw,
  );
  results.push(
    "real Home button returns from the distant orchard without changing builds or 03 progress",
  );
  const local = await browser.newContext({
    viewport: { width: 800, height: 600 },
    hasTouch: true,
    isMobile: true,
  });
  await local.setOffline(true);
  const filePage = await local.newPage(),
    requests = [];
  filePage.on("request", (r) => requests.push(r.url()));
  let fileProtocol = { tested: false };
  try {
    await filePage.goto(
      new URL("../../BlockWorld_Neighborhood_04.html?test=1", import.meta.url)
        .href,
    );
    await filePage.waitForFunction(() => window.blockworld?.ready);
    await filePage.tap("#play");
    await filePage.evaluate(() => {
      blockworld.test.add({ x: 5, y: 0, z: 0, type: "brick" });
      blockworld.test.save();
    });
    await filePage.reload();
    await filePage.waitForFunction(() => window.blockworld?.ready);
    assert.equal(
      (await filePage.evaluate(() => blockworld.snapshot())).blocks.length,
      1,
    );
    assert.ok(requests.every((u) => u.startsWith("file:")));
    results.push(
      "actual standalone file:// runs offline and retains a build on reload in Chromium",
    );
    fileProtocol = { tested: true, passed: true };
  } catch (error) {
    if (!String(error.message).includes("ERR_BLOCKED_BY_ADMINISTRATOR"))
      throw error;
    fileProtocol = {
      tested: false,
      blocked: true,
      reason:
        "Managed Chromium URL policy rejected file:// navigation: ERR_BLOCKED_BY_ADMINISTRATOR. Policy was not changed.",
    };
    console.log("BLOCKED file:// smoke test by managed browser policy");
  }
  await local.close();
  assert.deepEqual(errors, []);
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(
      {
        results,
        fileProtocol,
        exportBytes: Buffer.byteLength(exported),
        errors,
        releaseSha256: createHash("sha256").update(html).digest("hex"),
      },
      null,
      2,
    ),
  );
  console.log(results);
} finally {
  await browser.close();
}
