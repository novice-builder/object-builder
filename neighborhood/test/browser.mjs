// Runs the actual release with no server or external assets. Requires system Chromium
// or PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH pointing to a local Chromium executable.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const html = await readFile(
  new URL("../../BlockWorld_Neighborhood_01.html", import.meta.url),
  "utf8",
);
const out = new URL("../../work/verification/", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const results = [],
  errors = [],
  requests = [];
async function check(name, fn) {
  await fn();
  results.push(name);
  console.log("PASS", name);
}
async function context(options = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1024, height: 640 },
    deviceScaleFactor: 1,
    ...options,
  });
  await ctx.route("**/*", async (route) => {
    const r = route.request();
    requests.push(r.url());
    if (r.url().startsWith("http://localhost:8080/"))
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: html,
      });
    else {
      errors.push("Unexpected request: " + r.url());
      await route.abort();
    }
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  return { ctx, page };
}
async function load(page) {
  await page.goto("http://localhost:8080/?test=1");
  await page.waitForFunction(() => window.blockworld?.ready);
  await page.click("#play");
  await page.waitForTimeout(250);
}
async function look(page, x, y, z) {
  await page.evaluate(
    ([x, y, z]) => blockworld.test.lookAt(x, y, z),
    [x, y, z],
  );
  await page.waitForTimeout(250);
}
async function pose(page, p) {
  await page.evaluate((p) => blockworld.test.setPlayer(p), p);
  await page.waitForTimeout(200);
}
async function snap(page) {
  return page.evaluate(() => blockworld.snapshot());
}
try {
  const { ctx, page } = await context();
  await load(page);
  await check(
    "standalone startup has WebGL scene and four distinct houses",
    async () => {
      assert.equal(await page.locator("#fatal").isVisible(), false);
      const w = await page.evaluate(() => blockworld.test.world());
      assert.equal(w.houses.length, 4);
      assert.equal(new Set(w.houses.map((h) => h.style)).size, 3);
    },
  );
  await check(
    "W walks toward the home, closed door stops entry, use opens it, walking enters",
    async () => {
      await page.keyboard.down("KeyW");
      await page.waitForFunction(
        () => blockworld.snapshot().player.z < -4.95,
        {},
        { timeout: 18000 },
      );
      await page.keyboard.up("KeyW");
      await page.waitForTimeout(400);
      let s = await snap(page);
      assert.ok(s.player.z > -5.25);
      await page.waitForFunction(
        () => !document.getElementById("use").disabled,
      );
      await page.click("#use");
      assert.equal((await snap(page)).doors.home, true);
      await page.keyboard.down("KeyW");
      await page.waitForFunction(
        () => blockworld.snapshot().player.z < -6.5,
        {},
        { timeout: 10000 },
      );
      await page.keyboard.up("KeyW");
    },
  );
  await check(
    "jump rises and returns to floor; menu pauses movement and releases held input",
    async () => {
      await page.keyboard.press("Space");
      await page.waitForFunction(() => blockworld.snapshot().player.y > 0.1);
      await page.waitForFunction(
        () => blockworld.snapshot().player.grounded,
        {},
        { timeout: 8000 },
      );
      await page.keyboard.down("KeyW");
      await page.click("#menu");
      const a = (await snap(page)).player;
      await page.waitForTimeout(600);
      const b = (await snap(page)).player;
      assert.equal(a.z, b.z);
      await page.keyboard.up("KeyW");
      await page.click("#resume");
    },
  );
  await check(
    "actual nearby crafting table opens illustrated recipes and makes a bench",
    async () => {
      // Navigate the final short distance with an explicit setup pose, then use real UI.
      await pose(page, { x: -12.4, y: 0, z: -7.1, vy: 0 });
      await look(page, -10.8, 0.9, -8.1);
      await page.waitForFunction(() =>
        document.getElementById("use").textContent.includes("Make"),
      );
      await page.click("#use");
      assert.equal(await page.locator("#craft").isVisible(), true);
      assert.equal(await page.locator("[data-recipe]").count(), 3);
      await page.screenshot({
        path: new URL("crafting-landscape.png", out).pathname,
      });
      await page.click('[data-recipe="bench"]');
      const s = await snap(page);
      assert.equal(s.inventory.bench, 1);
      assert.equal(s.selected, "bench");
      assert.equal(await page.locator("#craft").isVisible(), false);
    },
  );
  await check(
    "build button places selected cell, remove recovers it, undo restores it",
    async () => {
      await pose(page, { x: -4, y: 0, z: 2, vy: 0 });
      await look(page, -4, 0.01, -0.8);
      const before = (await snap(page)).blocks.length;
      await page.click("#place");
      let s = await snap(page);
      assert.equal(s.blocks.length, before + 1);
      assert.equal(s.inventory.bench, 0);
      const b = s.blocks.at(-1);
      await look(page, b.x + 0.5, b.y + 0.5, b.z + 0.5);
      await page.click("#remove");
      s = await snap(page);
      assert.equal(s.blocks.length, before);
      assert.equal(s.inventory.bench, 1);
      await page.click("#undo");
      s = await snap(page);
      assert.equal(s.blocks.length, before + 1);
      assert.equal(s.inventory.bench, 0);
      await page.click('[data-item="brick"]');
      await look(page, -2, 0.01, -1.8);
      await page.click("#place");
      assert.equal((await snap(page)).blocks.at(-1).type, "brick");
      await page.screenshot({
        path: new URL("building-landscape.png", out).pathname,
      });
    },
  );
  await check(
    "autosave/reload preserves building, crafted inventory and open door",
    async () => {
      await page.evaluate(() => blockworld.test.save());
      const before = await snap(page);
      await page.reload();
      await page.waitForFunction(() => blockworld?.ready);
      await page.click("#play");
      const after = await snap(page);
      assert.deepEqual(after.blocks, before.blocks);
      assert.deepEqual(after.inventory, before.inventory);
      assert.equal(after.doors.home, true);
    },
  );
  await check(
    "export produces JSON; malformed import leaves current game intact",
    async () => {
      await page.click("#menu");
      const dl = page.waitForEvent("download");
      await page.click("#export");
      const download = await dl;
      assert.equal(download.suggestedFilename(), "Little-Block-Lane-save.json");
      const save = JSON.parse(await readFile(await download.path(), "utf8"));
      assert.equal(save.version, 1);
      const before = await snap(page);
      await page
        .locator("#import")
        .setInputFiles({
          name: "bad.json",
          mimeType: "application/json",
          buffer: Buffer.from('{"version":99}'),
        });
      await page.waitForFunction(() =>
        document
          .getElementById("importError")
          .textContent.includes("Could not"),
      );
      assert.deepEqual((await snap(page)).blocks, before.blocks);
      await page
        .locator("#import")
        .setInputFiles({
          name: "good.json",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify(save)),
        });
      await page.waitForFunction(() =>
        document
          .getElementById("importError")
          .textContent.includes("Save opened"),
      );
      await page.click("#resume");
    },
  );
  await check(
    "offline interaction works with network disabled and no asset requests",
    async () => {
      await ctx.setOffline(true);
      await page.click("#build");
      await pose(page, { x: -2, y: 0, z: 2, vy: 0 });
      await look(page, 0, 0.01, -0.5);
      await page.click('[data-item="wood"]');
      const n = (await snap(page)).blocks.length;
      await page.click("#place");
      assert.equal((await snap(page)).blocks.length, n + 1);
      assert.ok(requests.every((u) => u.startsWith("http://localhost:8080/")));
      await ctx.setOffline(false);
    },
  );
  // Capture multiple angles of every structure, without changing gameplay data.
  const houses = await page.evaluate(() => blockworld.test.world().houses);
  for (const h of houses) {
    for (const side of [1, -1]) {
      const image = await page.evaluate(
        ({ h, side }) =>
          blockworld.test.overview(h.x + 10, 6, h.z + side * 12, h.x, 1.6, h.z),
        { h, side },
      );
      await writeFile(
        new URL(`${h.id}-${side === 1 ? "south" : "north"}.png`, out),
        Buffer.from(image.split(",")[1], "base64"),
      );
    }
  }
  const overview = await page.evaluate(() =>
    blockworld.test.overview(33, 29, 39),
  );
  await writeFile(
    new URL("neighborhood-overview.png", out),
    Buffer.from(overview.split(",")[1], "base64"),
  );
  await page.waitForTimeout(1500);
  const baseline = await page.evaluate(() => blockworld.stats());
  await check(
    "800-piece stress save loads and remains functional",
    async () => {
      const stressSave = await page.evaluate(() => {
        blockworld.test.fresh();
        blockworld.test.setPlayer({ x: 20, y: 0, z: -20 });
        const s = blockworld.snapshot(),
          solids = blockworld.test.world().solids;
        s.blocks = [];
        for (let y = 0; y < 10 && s.blocks.length < 800; y++)
          for (let x = -7; x < 23 && s.blocks.length < 800; x++)
            for (let z = -3; z < 4 && s.blocks.length < 800; z++) {
              if (
                !solids.some(
                  (b) =>
                    x < b.maxX &&
                    x + 1 > b.minX &&
                    y < b.maxY &&
                    y + 1 > b.minY &&
                    z < b.maxZ &&
                    z + 1 > b.minZ,
                )
              )
                s.blocks.push({
                  x,
                  y,
                  z,
                  type: ["wood", "brick", "stone", "glass"][(x + 7) % 4],
                });
            }
        return s;
      });
      await page.addInitScript(
        (s) =>
          localStorage.setItem("blockworld.neighborhood.01", JSON.stringify(s)),
        stressSave,
      );
      await page.reload();
      await page.waitForFunction(() => blockworld?.ready);
      await page.click("#play");
      assert.equal((await snap(page)).blocks.length, 800);
      await page.waitForTimeout(1500);
    },
  );
  const stress = await page.evaluate(() => blockworld.stats());
  await ctx.close();
  const mobileResults = [];
  for (const viewport of [
    { width: 1024, height: 600 },
    { width: 600, height: 960 },
    { width: 390, height: 844 },
  ]) {
    const mobile = await context({ viewport, isMobile: true, hasTouch: true });
    const p = mobile.page;
    await load(p);
    await check(
      `touch controls, camera, cancel, and layout at ${viewport.width}×${viewport.height}`,
      async () => {
        await pose(p, { x: 0, y: 0, z: 0, vy: 0, yaw: 0, pitch: 0 });
        const client = await mobile.ctx.newCDPSession(p),
          r = await p.locator("#joystick").boundingBox(),
          cx = r.x + r.width / 2,
          cy = r.y + r.height / 2;
        const before = (await snap(p)).player;
        await client.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: cx, y: cy, id: 1 }],
        });
        await client.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: cx, y: cy - r.height * 0.28, id: 1 }],
        });
        await p.waitForFunction(
          (z) => blockworld.snapshot().player.z < z - 0.25,
          before.z,
          { timeout: 8000 },
        );
        await client.send("Input.dispatchTouchEvent", {
          type: "touchCancel",
          touchPoints: [],
        });
        const stopped = (await snap(p)).player;
        await p.waitForTimeout(400);
        assert.equal((await snap(p)).player.z, stopped.z);
        const x = viewport.width * 0.65,
          y = viewport.height * 0.36;
        await client.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x, y, id: 2 }],
        });
        await client.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x - 65, y: y + 25, id: 2 }],
        });
        await client.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        const turned = (await snap(p)).player;
        assert.ok(turned.yaw > before.yaw + 0.1);
        assert.ok(turned.pitch < -0.02);
        await p.tap("#build");
        await p.waitForFunction(() => blockworld.test.getBuilding());
        const boxes = await p
          .locator(
            "#actions button:visible,#palette button,#joystick,.header-actions button",
          )
          .evaluateAll((els) =>
            els.map((e) => ({
              id: e.id || e.dataset.item,
              rect: (() => {
                const r = e.getBoundingClientRect();
                return { x: r.x, y: r.y, w: r.width, h: r.height };
              })(),
            })),
          );
        for (const b of boxes) {
          assert.ok(
            b.rect.x >= 0 && b.rect.x + b.rect.w <= viewport.width + 1,
            `${b.id} horizontal fit`,
          );
          assert.ok(
            b.rect.y >= 0 && b.rect.y + b.rect.h <= viewport.height + 1,
            `${b.id} vertical fit`,
          );
          assert.ok(
            b.rect.h >= 44 && b.rect.w >= 44,
            `${b.id} touch size ${b.rect.w}x${b.rect.h}`,
          );
        }
        for (let i = 0; i < boxes.length; i++)
          for (let j = 0; j < i; j++) {
            const a = boxes[i].rect,
              b = boxes[j].rect;
            assert.ok(
              a.x + a.w <= b.x + 1 ||
                b.x + b.w <= a.x + 1 ||
                a.y + a.h <= b.y + 1 ||
                b.y + b.h <= a.y + 1,
              `${boxes[i].id} overlaps ${boxes[j].id}`,
            );
          }
        await p.screenshot({
          path: new URL(`touch-${viewport.width}x${viewport.height}.png`, out)
            .pathname,
        });
        // A tap on open ground uses the same place action, with a screen-based ray.
        await pose(p, { x: -4, y: 0, z: 2, vy: 0, yaw: 0, pitch: -0.6 });
        await p.tap("#place");
        await p.waitForFunction(
          () => blockworld.snapshot().blocks.length === 1,
        );
        await p.tap("#menu");
        await p.screenshot({
          path: new URL(`menu-${viewport.width}x${viewport.height}.png`, out)
            .pathname,
        });
        await p.tap("#resume");
        mobileResults.push({
          viewport,
          stats: await p.evaluate(() => blockworld.stats()),
        });
      },
    );
    await mobile.ctx.close();
  }
  assert.deepEqual(errors, []);
  const report = {
    date: new Date().toISOString(),
    browser: await browser.version(),
    renderer: "Chromium headless / ANGLE SwiftShader software graphics",
    results,
    baseline,
    stress,
    mobileResults,
    requests,
    errors,
  };
  await writeFile(
    new URL("results.json", out),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
