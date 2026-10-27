import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const release = new URL(
    "../../BlockWorld_Neighborhood_02.html",
    import.meta.url,
  ),
  html = await readFile(release, "utf8"),
  baseline = await readFile(
    new URL("../../BlockWorld_Neighborhood_01.html", import.meta.url),
    "utf8",
  );
const output = new URL(
  "../../work/interactions-02/verification/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
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
let currentPage;
async function check(name, fn) {
  await fn();
  results.push(name);
  console.log("PASS", name);
}
async function context(viewport = { width: 1024, height: 640 }, ios = false) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
    ...(ios
      ? {
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
        }
      : {}),
  });
  await ctx.route("**/*", (route) => {
    const url = route.request().url();
    requests.push(url);
    if (!url.startsWith("http://localhost:8080/")) {
      errors.push("External request " + url);
      return route.abort();
    }
    return route.fulfill({
      contentType: "text/html",
      body: new URL(url).pathname === "/baseline" ? baseline : html,
    });
  });
  if (ios)
    await ctx.addInitScript(() => {
      Object.defineProperty(Document.prototype, "fullscreenEnabled", {
        get: () => false,
        configurable: true,
      });
      Object.defineProperty(navigator, "canShare", {
        value: () => false,
        configurable: true,
      });
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
      });
    });
  await ctx.setOffline(true);
  const page = await ctx.newPage();
  currentPage = page;
  page.on("pageerror", (e) => errors.push(e.message));
  return { ctx, page };
}
async function load(page, path = "/") {
  await page.goto("http://localhost:8080" + path + "?test=1");
  await page.waitForFunction(() => window.blockworld?.ready);
  await page.click("#play");
}
async function snap(p) {
  return p.evaluate(() => blockworld.snapshot());
}
async function pose(p, v) {
  await p.evaluate((v) => blockworld.test.setPlayer(v), {
    vy: 0,
    grounded: true,
    y: 0,
    ...v,
  });
}
async function look(p, x, y, z) {
  await p.evaluate((v) => blockworld.test.lookAt(...v), [x, y, z]);
  await p.waitForTimeout(170);
}
async function point(p, x, y, z) {
  return p.evaluate((v) => blockworld.test.project(...v), [x, y, z]);
}
const clients = new WeakMap();
async function touch(p, type, points) {
  if (!clients.has(p)) clients.set(p, await p.context().newCDPSession(p));
  const client = clients.get(p);
  await client.send("Input.dispatchTouchEvent", { type, touchPoints: points });
}
async function tapWorld(p, x, y, z) {
  const q = await point(p, x, y, z);
  assert.ok(q.x > 0 && q.x < 2000 && q.y > 0);
  await p.touchscreen.tap(q.x, q.y);
}
async function choose(p, type) {
  await p.locator(`[data-item="${type}"]`).tap();
  await p.waitForFunction((t) => blockworld.snapshot().selected === t, type);
}
async function holdAt(p, q, duration = 750) {
  await touch(p, "touchStart", [{ x: q.x, y: q.y, id: 4 }]);
  await p.waitForTimeout(duration);
  await touch(p, "touchEnd", []);
}
try {
  let { ctx, page } = await context();
  await load(page, "/baseline");
  const originalWorld = await page.evaluate(() => blockworld.test.world());
  await page.evaluate(() => {
    blockworld.test.fresh();
    blockworld.test.add({ x: -5, y: 0, z: -1, type: "wood" });
    blockworld.test.save();
  });
  await check(
    "01 baseline save opens in 02 without losing progress or changing static neighborhood geometry",
    async () => {
      await load(page);
      const next = await snap(page);
      assert.equal(next.blocks.length, 1);
      assert.equal(next.blocks[0].type, "wood");
      const w = await page.evaluate(() => blockworld.test.world());
      for (const field of ["houses", "road", "drives", "solids"])
        assert.deepEqual(w[field], originalWorld[field]);
      await page.evaluate(() => blockworld.test.fresh());
    },
  );
  await check(
    "permanent hotbar includes empty hand; direct mode has no persistent ghost or crosshair",
    async () => {
      assert.equal(await page.locator("[data-item]").count(), 8);
      assert.equal(await page.locator("#buildHud").isVisible(), true);
      assert.equal(await page.locator("#crosshair").isVisible(), false);
      assert.equal((await snap(page)).selected, "hand");
      assert.equal(
        await page.evaluate(() => blockworld.controls().ghost),
        false,
      );
    },
  );
  await check(
    "ordinary direct tap places immediately, a drag only looks, and a stationary hold removes once",
    async () => {
      await pose(page, { x: -4.5, z: 2 });
      await look(page, -4.5, 0.1, -0.5);
      await choose(page, "wood");
      await tapWorld(page, -4.5, 0.01, -0.5);
      await page.waitForFunction(
        () => blockworld.snapshot().blocks.length === 1,
      );
      let q = await point(page, -4.5, 0.5, -0.5),
        before = await snap(page);
      await touch(page, "touchStart", [{ x: q.x, y: q.y, id: 4 }]);
      await touch(page, "touchMove", [{ x: q.x - 65, y: q.y + 20, id: 4 }]);
      await touch(page, "touchEnd", []);
      assert.equal((await snap(page)).blocks.length, 1);
      assert.notEqual((await snap(page)).player.yaw, before.player.yaw);
      const b = (await snap(page)).blocks[0];
      await look(page, b.x + 0.5, 0.5, b.z + 0.5);
      q = await point(page, b.x + 0.5, 0.5, b.z + 0.5);
      await holdAt(page, q);
      await page.waitForFunction(
        () => blockworld.snapshot().blocks.length === 0,
      );
      await page.waitForTimeout(200);
      assert.equal((await snap(page)).blocks.length, 0);
      await page.tap("#undo");
      await page.waitForFunction(
        () => blockworld.snapshot().blocks.length === 1,
      );
    },
  );
  await check(
    "holding empty ground and cancelling a touch never place a block",
    async () => {
      await pose(page, { x: -2.5, z: 2 });
      await look(page, -2.5, 0.1, -0.5);
      const q = await point(page, -2.5, 0.01, -0.5),
        n = (await snap(page)).blocks.length;
      await holdAt(page, q);
      assert.equal((await snap(page)).blocks.length, n);
      await touch(page, "touchStart", [{ x: q.x, y: q.y, id: 4 }]);
      await touch(page, "touchCancel", []);
      await page.waitForTimeout(650);
      assert.equal((await snap(page)).blocks.length, n);
    },
  );
  await check(
    "crafting produces an item; its exact translucent preview rotates without consuming inventory, and Cancel is safe",
    async () => {
      await choose(page, "hand");
      await pose(page, { x: -12.4, z: -7.1 });
      await look(page, -10.8, 0.9, -8.1);
      await page.waitForFunction(() =>
        document.getElementById("use").textContent.includes("Make"),
      );
      await page.tap("#use");
      await page.locator('[data-recipe="bench"]').tap();
      await page.waitForFunction(
        () => blockworld.snapshot().inventory.bench === 1,
      );
      await pose(page, { x: -2.5, z: 2 });
      await look(page, -2.5, 0.15, -0.5);
      const count = (await snap(page)).blocks.length;
      await tapWorld(page, -2.5, 0.01, -0.5);
      await page.waitForFunction(() => !!blockworld.controls().pending);
      assert.equal((await snap(page)).blocks.length, count);
      assert.equal((await snap(page)).inventory.bench, 1);
      const initial = await page.evaluate(
        () => blockworld.controls().pending.rotation,
      );
      await page.tap("#rotate90");
      assert.equal(
        await page.evaluate(() => blockworld.controls().pending.rotation),
        (initial + 90) % 360,
      );
      await page.tap("#rotateFine");
      assert.equal(
        await page.evaluate(() => blockworld.controls().pending.rotation),
        (initial + 105) % 360,
      );
      await page.screenshot({
        path: new URL("furniture-preview.png", output).pathname,
      });
      await page.tap("#cancelPlace");
      assert.equal(
        await page.evaluate(() => blockworld.controls().pending),
        null,
      );
      assert.equal((await snap(page)).inventory.bench, 1);
    },
  );
  let placedAngle;
  await check(
    "explicit furniture confirmation preserves orientation through save/reload and Undo",
    async () => {
      await tapWorld(page, -2.5, 0.01, -0.5);
      await page.waitForFunction(() => !!blockworld.controls().pending);
      await page.tap("#rotate90");
      await page.tap("#rotateFine");
      placedAngle = await page.evaluate(
        () => blockworld.controls().pending.rotation,
      );
      await page.tap("#confirmPlace");
      await page.waitForFunction(
        () => blockworld.snapshot().inventory.bench === 0,
      );
      assert.equal((await snap(page)).blocks.at(-1).rotation, placedAngle);
      await page.evaluate(() => blockworld.test.save());
      await page.reload();
      await page.waitForFunction(() => blockworld?.ready);
      await page.tap("#play");
      assert.equal((await snap(page)).blocks.at(-1).rotation, placedAngle);
      assert.equal(
        await page.evaluate(() => blockworld.controls().pending),
        null,
      );
      // A fresh second piece can be undone without touching the saved furniture.
      await choose(page, "stone");
      await pose(page, { x: -0.5, z: 2 });
      await look(page, -0.5, 0.1, -0.5);
      const n = (await snap(page)).blocks.length;
      await tapWorld(page, -0.5, 0.01, -0.5);
      await page.waitForFunction(
        (n) => blockworld.snapshot().blocks.length === n + 1,
        n,
      );
      await page.tap("#undo");
      await page.waitForFunction(
        (n) => blockworld.snapshot().blocks.length === n,
        n,
      );
    },
  );
  await check(
    "all four doors work from both sides, including a Safari-shaped duplicate click and closed-door collision",
    async () => {
      await choose(page, "hand");
      const doors = await page.evaluate(() => blockworld.test.world().doors);
      for (const d of doors)
        for (const side of [1, -1]) {
          const nx = Math.sin(d.baseAngle),
            nz = Math.cos(d.baseAngle),
            yaw = d.baseAngle + (side < 0 ? Math.PI : 0);
          await pose(page, {
            x: d.center.x + nx * side * 2.15,
            z: d.center.z + nz * side * 2.15,
            yaw,
            pitch: 0,
          });
          if ((await snap(page)).doors[d.id])
            await page.evaluate((id) => blockworld.test.toggleDoor(id), d.id);
          await page.waitForFunction(
            () =>
              !document.getElementById("use").disabled &&
              document.getElementById("use").textContent.includes("Open"),
          );
          await page.tap("#use");
          await page.evaluate(() =>
            document.getElementById("use").dispatchEvent(
              new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                detail: 1,
              }),
            ),
          );
          assert.equal(
            (await snap(page)).doors[d.id],
            true,
            `${d.id} open side ${side}`,
          );
          await page.keyboard.down("KeyW");
          await page.waitForFunction(
            ({ d, side, nx, nz }) => {
              const p = blockworld.snapshot().player;
              return (
                ((p.x - d.center.x) * nx + (p.z - d.center.z) * nz) * side <
                -1.2
              );
            },
            { d, side, nx, nz },
            { timeout: 12000 },
          );
          await page.keyboard.up("KeyW");
          await page.waitForFunction(() =>
            document.getElementById("use").textContent.includes("Close"),
          );
          await page.tap("#use");
          assert.equal(
            (await snap(page)).doors[d.id],
            false,
            `${d.id} closed from other side`,
          );
          await page.evaluate(() => {
            const p = blockworld.snapshot().player;
            blockworld.test.setLook(p.yaw + Math.PI, 0);
          });
          await page.keyboard.down("KeyW");
          await page.waitForFunction(
            ({ d, side, nx, nz }) => {
              const p = blockworld.snapshot().player;
              return (
                ((p.x - d.center.x) * nx + (p.z - d.center.z) * nz) * -side <
                0.5
              );
            },
            { d, side, nx, nz },
            { timeout: 8000 },
          );
          await page.waitForTimeout(300);
          await page.keyboard.up("KeyW");
          const stopped = (await snap(page)).player;
          assert.ok(
            ((stopped.x - d.center.x) * nx + (stopped.z - d.center.z) * nz) *
              -side >
              0.25,
            `${d.id} cannot pass closed door`,
          );
          await page.waitForFunction(() =>
            document.getElementById("use").textContent.includes("Open"),
          );
          await page.tap("#use");
          assert.equal((await snap(page)).doors[d.id], true, `${d.id} reopen`);
          await page.keyboard.down("KeyW");
          await page.waitForFunction(
            ({ d, side, nx, nz }) => {
              const p = blockworld.snapshot().player;
              return (
                ((p.x - d.center.x) * nx + (p.z - d.center.z) * nz) * side > 1.2
              );
            },
            { d, side, nx, nz },
            { timeout: 8000 },
          );
          await page.keyboard.up("KeyW");
        }
    },
  );
  await check(
    "empty hand can tap the door panel and crafting table directly",
    async () => {
      const d = await page.evaluate(() =>
        blockworld.test.world().doors.find((d) => d.id === "home"),
      );
      await pose(page, {
        x: d.center.x,
        z: d.center.z + 2.1,
        yaw: 0,
        pitch: 0,
      });
      if ((await snap(page)).doors.home)
        await page.evaluate(() => blockworld.test.toggleDoor("home"));
      await look(page, d.center.x, 1.2, d.center.z);
      await tapWorld(page, d.center.x, 1.2, d.center.z);
      await page.waitForFunction(() => blockworld.snapshot().doors.home);
      const opened = await page.evaluate(
        () => blockworld.test.world().doors.find((d) => d.id === "home").box,
      );
      const x = (opened.minX + opened.maxX) / 2,
        z = (opened.minZ + opened.maxZ) / 2;
      await look(page, x, 1.2, z);
      await tapWorld(page, x, 1.2, z);
      await page.waitForFunction(() => !blockworld.snapshot().doors.home);
      await pose(page, { x: -12.4, z: -7.1 });
      await look(page, -10.8, 1, -8.1);
      await tapWorld(page, -10.8, 1, -8.1);
      await page.waitForFunction(() => blockworld.test.getModal() === "craft");
      await page.keyboard.press("Escape");
    },
  );
  await check(
    "crosshair is optional; tapping the world does not build in this mode, Place does",
    async () => {
      await page.tap("#menu");
      await page.tap("#placementMode");
      assert.match(
        await page.locator("#settingsFeedback").textContent(),
        /Crosshair/,
      );
      await page.tap("#resume");
      await choose(page, "brick");
      await pose(page, { x: -6.5, z: 2 });
      await look(page, -6.5, 0.1, -0.5);
      await page.waitForFunction(() => blockworld.controls().ghost);
      assert.equal(await page.locator("#crosshair").isVisible(), true);
      const n = (await snap(page)).blocks.length;
      await tapWorld(page, -6.5, 0.01, -0.5);
      assert.equal((await snap(page)).blocks.length, n);
      await page.tap("#place");
      await page.waitForFunction(
        (n) => blockworld.snapshot().blocks.length === n + 1,
        n,
      );
    },
  );
  await ctx.close();
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 1024, height: 600 },
  ]) {
    const mobile = await context(viewport, true);
    page = mobile.page;
    currentPage = page;
    await load(page);
    await check(
      `scrollable hotbar, multi-touch walk/look and clean layout ${viewport.width}x${viewport.height}`,
      async () => {
        const palette = await page.locator("#palette").boundingBox();
        assert.ok(
          palette.x >= 0 && palette.x + palette.width <= viewport.width + 1,
        );
        assert.equal(await page.locator("#buildHud").isVisible(), true);
        if (viewport.width === 390) {
          assert.ok(
            await page
              .locator("#palette")
              .evaluate((e) => e.scrollWidth > e.clientWidth),
          );
          const selected = (await snap(page)).selected;
          const y = palette.y + palette.height / 2;
          await touch(page, "touchStart", [
            { x: palette.x + palette.width - 30, y, id: 5 },
          ]);
          await touch(page, "touchMove", [{ x: palette.x + 40, y, id: 5 }]);
          await touch(page, "touchEnd", []);
          await page.waitForTimeout(300);
          assert.ok(
            await page.locator("#palette").evaluate((e) => e.scrollLeft > 25),
          );
          assert.equal(
            (await snap(page)).selected,
            selected,
            "scroll should not select a slot",
          );
        }
        await pose(page, { x: 0, z: 0, yaw: 0, pitch: 0 });
        const j = await page.locator("#joystick").boundingBox(),
          x = j.x + j.width / 2,
          y = j.y + j.height / 2,
          lx = viewport.width * 0.6,
          ly = viewport.height * 0.32;
        await touch(page, "touchStart", [{ x, y: y - 22, id: 1 }]);
        await touch(page, "touchStart", [
          { x, y: y - 22, id: 1 },
          { x: lx, y: ly, id: 2 },
        ]);
        await touch(page, "touchMove", [
          { x, y: y - 22, id: 1 },
          { x: lx - 45, y: ly - 20, id: 2 },
        ]);
        await page.waitForFunction(() => blockworld.snapshot().player.z < -0.2);
        await touch(page, "touchEnd", []);
        let p = (await snap(page)).player;
        assert.ok(p.yaw > 0.1 && p.pitch > 0);
        await page.waitForTimeout(250);
        assert.equal((await snap(page)).player.z, p.z);
        await page.screenshot({
          path: new URL(
            `direct-${viewport.width}x${viewport.height}.png`,
            output,
          ).pathname,
        });
        const boxes = await page
          .locator("#joystick,#actions button:visible,.header-actions button")
          .evaluateAll((es) =>
            es.map((e) => ({
              id: e.id,
              r: e.getBoundingClientRect().toJSON(),
            })),
          );
        for (const { id, r } of boxes) {
          assert.ok(
            r.x >= 0 && r.right <= viewport.width + 1,
            `${id} fits width`,
          );
          assert.ok(
            r.y >= 0 && r.bottom <= viewport.height + 1,
            `${id} fits height`,
          );
          assert.ok(r.width >= 44 && r.height >= 44, `${id} touch size`);
          assert.ok(r.bottom <= palette.y + 1, `${id} does not overlap hotbar`);
        }
      },
    );
    await check(
      `furniture preview, rotation and confirmation fit ${viewport.width}x${viewport.height}`,
      async () => {
        await page.evaluate(() => blockworld.test.openCraft());
        await page.locator('[data-recipe="bench"]').tap();
        await page.waitForFunction(
          () => blockworld.snapshot().inventory.bench === 1,
        );
        await pose(page, { x: -4.5, z: 2 });
        await look(page, -4.5, 0.1, -0.5);
        await tapWorld(page, -4.5, 0.01, -0.5);
        await page.waitForFunction(() => !!blockworld.controls().pending);
        const preview = await page.locator("#placementControls").boundingBox(),
          bar = await page.locator("#palette").boundingBox();
        assert.ok(
          preview.x >= 0 && preview.x + preview.width <= viewport.width + 1,
        );
        assert.ok(preview.y >= 0 && preview.y + preview.height <= bar.y + 1);
        for (const id of ["joystick", "actions"]) {
          const r = await page.locator("#" + id).boundingBox();
          assert.ok(
            preview.x + preview.width <= r.x + 1 ||
              r.x + r.width <= preview.x + 1 ||
              preview.y + preview.height <= r.y + 1 ||
              r.y + r.height <= preview.y + 1,
            `${id} not covered by object controls`,
          );
        }
        const selected = await page
          .locator('[data-item="bench"]')
          .boundingBox();
        assert.ok(
          selected.x >= bar.x &&
            selected.x + selected.width <= bar.x + bar.width + 1,
          "crafted item selection stays visible",
        );
        await page.tap("#rotate90");
        await page.tap("#rotateFine");
        const angle = await page.evaluate(
          () => blockworld.controls().pending.rotation,
        );
        await page.screenshot({
          path: new URL(
            `preview-${viewport.width}x${viewport.height}.png`,
            output,
          ).pathname,
        });
        await page.tap("#confirmPlace");
        await page.waitForFunction(
          () => blockworld.snapshot().inventory.bench === 0,
        );
        assert.equal((await snap(page)).blocks.at(-1).rotation, angle);
        await choose(page, "hand");
      },
    );
    await check(
      `every setting gives visible feedback; unavailable fullscreen/export have iPhone fallback ${viewport.width}x${viewport.height}`,
      async () => {
        await page.tap("#menu");
        await page.tap("#fullscreen");
        assert.match(
          await page.locator("#settingsFeedback").textContent(),
          /unavailable/,
        );
        for (const id of [
          "autoStep",
          "edgeProtection",
          "quality",
          "subtitles",
          "placementMode",
          "diagnostics",
        ]) {
          const before = await page.locator("#settingsFeedback").textContent();
          await page.locator("#" + id).tap();
          const after = await page.locator("#settingsFeedback").textContent();
          assert.ok(after.length > 15 && after !== before, id + " feedback");
        }
        assert.equal(await page.locator("#menuStats").isVisible(), true);
        await page.waitForFunction(() =>
          document.getElementById("menuStats").textContent.includes("fps"),
        );
        const download = page.waitForEvent("download");
        await page.locator("#export").tap();
        await download;
        assert.match(
          await page.locator("#settingsFeedback").textContent(),
          /iPhone/,
        );
        assert.equal(await page.locator("#backupText").isVisible(), true);
        const backup = JSON.parse(
          await page.locator("#backupText").inputValue(),
        );
        assert.equal(backup.version, 1);
        await page.locator("#copyBackup").tap();
        assert.match(
          await page.locator("#settingsFeedback").textContent(),
          /selected/,
        );
        await page.screenshot({
          path: new URL(
            `settings-${viewport.width}x${viewport.height}.png`,
            output,
          ).pathname,
        });
        const prefs = await page.evaluate(() => blockworld.controls());
        await page.tap("#resume");
        await page.reload();
        await page.waitForFunction(() => blockworld?.ready);
        await page.tap("#play");
        const restored = await page.evaluate(() => blockworld.controls());
        for (const key of [
          "placement",
          "autoStep",
          "edgeProtection",
          "quality",
          "subtitles",
        ])
          assert.equal(restored[key], prefs[key]);
      },
    );
    await mobile.ctx.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    new URL("results.json", output),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        browser: await browser.version(),
        renderer:
          "Chromium / ANGLE SwiftShader, mobile and iPhone-UA emulation; not physical iPhone Safari",
        results,
        errors,
        requests,
        releaseSha256: createHash("sha256").update(html).digest("hex"),
        baselineSha256: createHash("sha256").update(baseline).digest("hex"),
      },
      null,
      2,
    ),
  );
  console.log("ALL", results.length, "browser scenarios passed.");
} catch (error) {
  if (currentPage && !currentPage.isClosed())
    await currentPage
      .screenshot({ path: new URL("failure.png", output).pathname })
      .catch(() => {});
  console.error("Successful scenarios before failure:", results);
  console.error("Page errors:", errors);
  throw error;
} finally {
  await browser.close();
}
