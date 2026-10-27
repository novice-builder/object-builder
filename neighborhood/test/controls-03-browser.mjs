import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const html = await readFile("../BlockWorld_Neighborhood_03.html", "utf8"),
  old = await readFile("../BlockWorld_Neighborhood_02.html", "utf8");
const out = "../work/controls-03/verification";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const results = [],
  errors = [],
  requests = [],
  buttonChecks = [];
let page;
const check = async (name, fn) => {
  await fn();
  results.push(name);
  console.log("PASS", name);
};
async function context(viewport, dpr = 1) {
  const c = await browser.newContext({
    viewport,
    deviceScaleFactor: dpr,
    isMobile: true,
    hasTouch: true,
  });
  await c.route("**/*", (r) => {
    const u = r.request().url();
    requests.push(u);
    if (!u.startsWith("http://localhost:8080/")) {
      errors.push("External request " + u);
      return r.abort();
    }
    return r.fulfill({
      contentType: "text/html",
      body: new URL(u).pathname === "/02" ? old : html,
    });
  });
  await c.setOffline(true);
  const p = await c.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  return { c, p };
}
async function load(p, path = "/") {
  await p.goto("http://localhost:8080" + path + "?test=1");
  await p.waitForFunction(() => window.blockworld?.ready);
}
const snap = (p) => p.evaluate(() => blockworld.snapshot());
async function pose(p, v) {
  await p.evaluate(
    (v) =>
      blockworld.test.setPlayer({
        y: 0,
        vy: 0,
        grounded: true,
        pitch: 0,
        ...v,
      }),
    v,
  );
}
async function look(p, x, y, z) {
  await p.evaluate((v) => blockworld.test.lookAt(...v), [x, y, z]);
  await p.waitForTimeout(100);
}
async function worldTap(p, x, y, z) {
  const q = await p.evaluate((v) => blockworld.test.project(...v), [x, y, z]);
  await p.touchscreen.tap(q.x, q.y);
}
async function select(p, type) {
  await p.locator(`[data-item="${type}"]`).tap();
  await p.waitForFunction((t) => blockworld.snapshot().selected === t, type);
}
async function menu(p) {
  await p.tap("#menu");
  await p.waitForFunction(() => blockworld.test.getModal() === "settings");
}
async function automatic(p, on) {
  await menu(p);
  if ((await p.evaluate(() => blockworld.controls().automaticDoors)) !== on)
    await p.locator("#automaticDoors").tap();
  await p.locator("#resume").tap();
}
const clients = new WeakMap();
async function touch(p, type, points) {
  if (!clients.has(p)) clients.set(p, await p.context().newCDPSession(p));
  await clients
    .get(p)
    .send("Input.dispatchTouchEvent", { type, touchPoints: points });
}
async function hitGrid(p, selector, label) {
  await p.evaluate(() => {
    if (!window.hitProbeInstalled) {
      document.addEventListener(
        "click",
        (e) => {
          if (!window.hitProbe?.active) return;
          const b = e.target.closest("button");
          if (b) {
            window.hitProbe.count++;
            window.hitProbe.last = b.id || b.dataset.item;
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        },
        true,
      );
      window.hitProbeInstalled = true;
    }
  });
  const buttons = p.locator(selector);
  const n = await buttons.count();
  for (let i = 0; i < n; i++) {
    const b = buttons.nth(i);
    if (!(await b.isVisible()) || (await b.isDisabled())) continue;
    await b.scrollIntoViewIfNeeded();
    const r = await b.boundingBox();
    const points = [
      [r.width / 2, r.height / 2],
      [r.width / 2, 1.5],
      [r.width / 2, r.height - 1.5],
      [1.5, r.height / 2],
      [r.width - 1.5, r.height / 2],
      [8, 8],
      [r.width - 8, 8],
      [8, r.height - 8],
      [r.width - 8, r.height - 8],
    ];
    const id = await b.evaluate((e) => e.id || e.dataset.item);
    for (const [x, y] of points) {
      // Browser targets and actual pointer events, not DOM .click(), test the press path.
      await p.evaluate(() => {
        window.hitProbe = { active: true, count: 0, last: null };
      });
      await p.touchscreen.tap(r.x + x, r.y + y);
      const actual = await p.evaluate(() => window.hitProbe);
      assert.equal(
        actual.count,
        1,
        `${label}/${id} at ${x.toFixed(1)},${y.toFixed(1)}: ${JSON.stringify(actual)}`,
      );
      assert.equal(actual.last, id);
    }
    buttonChecks.push({ label, id, points: points.length });
  }
  await p.evaluate(() => {
    window.hitProbe.active = false;
  });
}
try {
  let { c, p } = await context({ width: 390, height: 844 });
  page = p;
  await load(p, "/02");
  await p.tap("#play");
  await p.evaluate(() => {
    blockworld.test.fresh();
    blockworld.test.add({ x: 5, y: 0, z: 0, type: "wood" });
    blockworld.test.save();
  });
  const oldWorld = await p.evaluate(() => blockworld.test.world());
  await load(p);
  await check(
    "02 save and unchanged neighborhood load in 03; both safety defaults are on and climbing is absent",
    async () => {
      await p.tap("#play");
      assert.equal((await snap(p)).blocks.length, 1);
      const w = await p.evaluate(() => blockworld.test.world());
      for (const k of ["houses", "road", "drives", "solids"])
        assert.deepEqual(w[k], oldWorld[k]);
      const controls = await p.evaluate(() => blockworld.controls());
      assert.equal(controls.automaticDoors, true);
      assert.equal(controls.edgeProtection, true);
      assert.equal("autoStep" in controls, false);
      assert.equal(await p.locator('[data-item="hand"]').count(), 0);
      assert.equal(await p.locator("[data-item]").count(), 7);
    },
  );
  await check(
    "all four houses auto-open away from both sides, animate, hold while nearby, and close only after leaving",
    async () => {
      await p.evaluate(() => blockworld.test.fresh());
      const doors = await p.evaluate(() => blockworld.test.world().doors);
      for (const d of doors)
        for (const side of [1, -1]) {
          const nx = Math.sin(d.baseAngle),
            nz = Math.cos(d.baseAngle);
          await pose(p, {
            x: d.center.x + nx * side * 2,
            z: d.center.z + nz * side * 2,
            yaw: d.baseAngle + (side < 0 ? Math.PI : 0),
          });
          await p.waitForFunction(
            (id) => {
              const d = blockworld.test.world().doors.find((d) => d.id === id);
              return (
                d.targetOpen &&
                Math.abs(d.angle) > 0.02 &&
                Math.abs(d.angle) < 1.55
              );
            },
            d.id,
            { timeout: 12000 },
          );
          assert.equal(
            await p.evaluate(
              (id) =>
                blockworld.test.world().doors.find((d) => d.id === id).swing,
              d.id,
            ),
            side,
          );
          await p.waitForFunction(
            (id) =>
              Math.abs(
                blockworld.test.world().doors.find((d) => d.id === id).angle,
              ) > 1.56,
            d.id,
            { timeout: 12000 },
          );
          await p.waitForTimeout(250);
          assert.equal(
            await p.evaluate(
              (id) =>
                blockworld.test.world().doors.find((d) => d.id === id)
                  .targetOpen,
              d.id,
            ),
            true,
          );
          await pose(p, {
            x: d.center.x + nx * side * 4.5,
            z: d.center.z + nz * side * 4.5,
          });
          await p.waitForTimeout(300);
          assert.equal(
            await p.evaluate(
              (id) =>
                blockworld.test.world().doors.find((d) => d.id === id)
                  .targetOpen,
              d.id,
            ),
            true,
          );
          await p.waitForFunction(
            (id) =>
              Math.abs(
                blockworld.test.world().doors.find((d) => d.id === id).angle,
              ) < 0.001,
            d.id,
            { timeout: 12000 },
          );
        }
    },
  );
  await check(
    "manual mode opens, walks through, closes and reopens every door on both sides; metadata-free clicks do not reverse the action",
    async () => {
      // A parent/child can touch Open while walking into the auto trigger radius.
      const homeDoor = await p.evaluate(() => blockworld.test.world().doors[0]);
      await p.evaluate(() => blockworld.test.fresh());
      await pose(p, {
        x: homeDoor.center.x,
        z: homeDoor.center.z + 2.5,
        yaw: 0,
      });
      await p.waitForFunction(() =>
        document.getElementById("use").textContent.includes("Open"),
      );
      const button = await p.locator("#use").boundingBox();
      await touch(p, "touchStart", [
        {
          x: button.x + button.width / 2,
          y: button.y + button.height / 2,
          id: 9,
        },
      ]);
      await pose(p, { x: homeDoor.center.x, z: homeDoor.center.z + 2, yaw: 0 });
      await p.waitForFunction(
        () => blockworld.test.world().doors[0].targetOpen,
      );
      await touch(p, "touchEnd", []);
      assert.equal(
        await p.evaluate(() => blockworld.test.world().doors[0].targetOpen),
        true,
        "Open pressed before proximity activation must not turn into Close on release",
      );

      await automatic(p, false);
      await p.evaluate(() => blockworld.test.fresh());
      const doors = await p.evaluate(() => blockworld.test.world().doors);
      for (const d of doors)
        for (const side of [1, -1]) {
          const nx = Math.sin(d.baseAngle),
            nz = Math.cos(d.baseAngle);
          await pose(p, {
            x: d.center.x + nx * side * 2.2,
            z: d.center.z + nz * side * 2.2,
            yaw: d.baseAngle + (side < 0 ? Math.PI : 0),
          });
          if (
            await p.evaluate(
              (id) =>
                blockworld.test.world().doors.find((d) => d.id === id)
                  .targetOpen,
              d.id,
            )
          ) {
            await p.evaluate((id) => blockworld.test.toggleDoor(id), d.id);
            await p.waitForFunction(
              (id) =>
                Math.abs(
                  blockworld.test.world().doors.find((d) => d.id === id).angle,
                ) < 0.001,
              d.id,
            );
          }
          await p.waitForFunction(
            () =>
              !document.getElementById("use").disabled &&
              document.getElementById("use").textContent.includes("Open"),
          );
          await p.tap("#use");
          await p.evaluate(() =>
            document
              .getElementById("use")
              .dispatchEvent(
                new MouseEvent("click", { bubbles: true, cancelable: true }),
              ),
          );
          assert.equal(
            await p.evaluate(
              (id) =>
                blockworld.test.world().doors.find((d) => d.id === id)
                  .targetOpen,
              d.id,
            ),
            true,
          );
          await p.waitForFunction(
            (id) =>
              Math.abs(
                blockworld.test.world().doors.find((d) => d.id === id).angle,
              ) > 1.56,
            d.id,
          );
          await p.evaluate(() =>
            blockworld.test.simulate({ forward: 1 }, 1.25),
          );
          let a = (await snap(p)).player;
          assert.ok(
            ((a.x - d.center.x) * nx + (a.z - d.center.z) * nz) * side < -1.8,
            `${d.id} pass from ${side}`,
          );
          await p.waitForFunction(() =>
            document.getElementById("use").textContent.includes("Close"),
          );
          await p.tap("#use");
          await p.waitForFunction(
            (id) =>
              Math.abs(
                blockworld.test.world().doors.find((d) => d.id === id).angle,
              ) < 0.001,
            d.id,
          );
          await p.evaluate(() => {
            const s = blockworld.snapshot();
            blockworld.test.setLook(s.player.yaw + Math.PI, 0);
            blockworld.test.simulate({ forward: 1 }, 1);
          });
          a = (await snap(p)).player;
          assert.ok(
            ((a.x - d.center.x) * nx + (a.z - d.center.z) * nz) * -side > 0.25,
            "closed leaf remains solid",
          );
          await p.waitForFunction(() =>
            document.getElementById("use").textContent.includes("Open"),
          );
          await p.tap("#use");
          await p.waitForFunction(
            (id) =>
              Math.abs(
                blockworld.test.world().doors.find((d) => d.id === id).angle,
              ) > 1.56,
            d.id,
          );
          await p.evaluate(() => blockworld.test.simulate({ forward: 1 }, 0.8));
        }
    },
  );
  await check(
    "automatic close cannot close onto a player in the doorway; actual Jump and normal walking work",
    async () => {
      await automatic(p, true);
      const d = await p.evaluate(() => blockworld.test.world().doors[0]);
      await pose(p, { x: d.center.x, z: d.center.z + 1.8, yaw: 0 });
      await p.waitForFunction(
        () => Math.abs(blockworld.test.world().doors[0].angle) > 1.56,
      );
      await automatic(p, false);
      await pose(p, { x: d.center.x, z: d.center.z + 2.2, yaw: 0 });
      await p.waitForFunction(() =>
        document.getElementById("use").textContent.includes("Close"),
      );
      await p.tap("#use");
      await p.waitForFunction(
        () => Math.abs(blockworld.test.world().doors[0].angle) < 0.001,
      );
      await automatic(p, true);
      await p.waitForFunction(
        () => Math.abs(blockworld.test.world().doors[0].angle) > 1.56,
      );
      await pose(p, { x: d.center.x, z: d.center.z });
      await p.waitForTimeout(1600);
      assert.equal(
        await p.evaluate(() => blockworld.test.world().doors[0].targetOpen),
        true,
      );
      await p.evaluate(() => blockworld.test.toggleDoor("home"));
      assert.equal(
        await p.evaluate(() => blockworld.test.world().doors[0].targetOpen),
        true,
      );
      await pose(p, { x: 0, z: 4, yaw: 0 });
      await p.tap("#jump");
      await p.waitForFunction(() => blockworld.snapshot().player.y > 0.15);
      await p.waitForFunction(
        () => blockworld.snapshot().player.grounded,
        {},
        { timeout: 6000 },
      );
      await p.keyboard.down("KeyW");
      await p.waitForFunction(() => blockworld.snapshot().player.z < 3.5);
      await p.keyboard.up("KeyW");
    },
  );
  await check(
    "guard applies with no selected material, toggles on screen, permits a deliberate Jump, and remembers OFF after reload",
    async () => {
      await p.evaluate(() => {
        blockworld.test.add({ x: 0, y: 0, z: 0, type: "wood" });
        blockworld.test.setPlayer({
          x: 0.5,
          y: 1,
          z: 0.5,
          vy: 0,
          grounded: true,
          yaw: Math.PI,
        });
      });
      await p.keyboard.down("KeyW");
      await p.waitForTimeout(900);
      await p.keyboard.up("KeyW");
      assert.equal((await snap(p)).player.y, 1);
      assert.ok((await snap(p)).player.z < 0.91);
      await p.tap("#jump");
      await p.keyboard.down("KeyW");
      await p.waitForFunction(
        () => blockworld.snapshot().player.y === 0,
        {},
        { timeout: 7000 },
      );
      await p.keyboard.up("KeyW");
      assert.ok((await snap(p)).player.z > 1.2);
      await p.tap("#guardToggle");
      assert.equal(
        await p.evaluate(() => blockworld.controls().edgeProtection),
        false,
      );
      await pose(p, { x: 0.5, y: 1, z: 0.5, yaw: Math.PI });
      await p.evaluate(() => blockworld.test.simulate({ forward: 1 }, 1));
      assert.equal((await snap(p)).player.y, 0);
      await p.reload();
      await p.waitForFunction(() => blockworld?.ready);
      await p.tap("#play");
      assert.equal(
        await p.evaluate(() => blockworld.controls().edgeProtection),
        false,
      );
      await p.tap("#guardToggle");
    },
  );
  await check(
    "tap a selected hotbar item to deselect; direct placement, long-press removal and Undo remain operational",
    async () => {
      await pose(p, { x: -4.5, z: 2, yaw: 0 });
      await look(p, -4.5, 0.1, -0.5);
      await select(p, "wood");
      await p.locator('[data-item="wood"]').tap();
      assert.equal((await snap(p)).selected, "hand");
      const n = (await snap(p)).blocks.length;
      await worldTap(p, -4.5, 0.01, -0.5);
      assert.equal((await snap(p)).blocks.length, n);
      await select(p, "wood");
      await worldTap(p, -4.5, 0.01, -0.5);
      await p.waitForFunction(
        (n) => blockworld.snapshot().blocks.length === n + 1,
        n,
      );
      const b = (await snap(p)).blocks.at(-1);
      await look(p, b.x + 0.5, 0.5, b.z + 0.5);
      const q = await p.evaluate(
        (v) => blockworld.test.project(...v),
        [b.x + 0.5, 0.5, b.z + 0.5],
      );
      await touch(p, "touchStart", [{ x: q.x, y: q.y, id: 4 }]);
      await p.waitForTimeout(700);
      await touch(p, "touchEnd", []);
      await p.waitForFunction(
        (n) => blockworld.snapshot().blocks.length === n,
        n,
      );
      await p.tap("#undo");
      await p.waitForFunction(
        (n) => blockworld.snapshot().blocks.length === n + 1,
        n,
      );
    },
  );
  await c.close();
  for (const [viewport, dpr, scale] of [
    [{ width: 390, height: 844 }, 1, 1],
    [{ width: 844, height: 390 }, 1, 1],
    [{ width: 428, height: 760 }, 3, 0.85],
  ]) {
    const mobile = await context(viewport, dpr);
    page = p = mobile.p;
    await load(p);
    await check(
      `welcome and gameplay buttons respond across their whole visible surface ${viewport.width}x${viewport.height}`,
      async () => {
        await hitGrid(p, "#play", `welcome ${viewport.width}`);
        await p.tap("#play");
        await p.evaluate(() =>
          blockworld.test.add({ x: 4, y: 0, z: 0, type: "wood" }),
        );
        await hitGrid(
          p,
          ".header-actions button,#actions button",
          `gameplay ${viewport.width}`,
        );
        await hitGrid(p, "#palette button", `hotbar ${viewport.width}`);
      },
    );
    await check(
      `menu buttons remain hittable at edges, corners and centre, including a scaled container ${viewport.width}x${viewport.height}`,
      async () => {
        await menu(p);
        if (scale !== 1)
          await p.evaluate((scale) => {
            document.querySelector(".settings").style.zoom = scale;
          }, scale);
        await hitGrid(
          p,
          "#settings button",
          `settings ${viewport.width} scale=${scale}`,
        );
        await p.locator("#automaticDoors").tap();
        assert.equal(
          await p.evaluate(() => blockworld.controls().automaticDoors),
          false,
        );
        await p.locator("#automaticDoors").tap();
        assert.equal(
          await p.evaluate(() => blockworld.controls().automaticDoors),
          true,
        );
        await p.locator("#diagnostics").tap();
        assert.equal(await p.locator("#menuStats").isVisible(), true);
        await p.screenshot({
          path: `${out}/settings-${viewport.width}x${viewport.height}.png`,
        });
        await p.locator("#resume").tap();
      },
    );
    await check(
      `crafting and placement controls have full hit areas; rotation/confirmation and scroll still work ${viewport.width}x${viewport.height}`,
      async () => {
        await p.evaluate(() => blockworld.test.openCraft());
        await hitGrid(p, "#craft button", `craft ${viewport.width}`);
        await p.locator('[data-recipe="bench"]').tap();
        await pose(p, { x: -4.5, z: 2 });
        await look(p, -4.5, 0.1, -0.5);
        await worldTap(p, -4.5, 0.01, -0.5);
        await p.waitForFunction(() => !!blockworld.controls().pending);
        const previewBox = await p.locator("#placementControls").boundingBox();
        for (const id of ["actions", "joystick"]) {
          const r = await p.locator("#" + id).boundingBox();
          assert.ok(
            previewBox.x + previewBox.width <= r.x + 1 ||
              r.x + r.width <= previewBox.x + 1 ||
              previewBox.y + previewBox.height <= r.y + 1 ||
              r.y + r.height <= previewBox.y + 1,
            `${id} must not be covered by the preview controls`,
          );
        }
        await hitGrid(
          p,
          "#placementControls button",
          `placement ${viewport.width}`,
        );
        await p.tap("#rotate90");
        await p.tap("#confirmPlace");
        await p.waitForFunction(
          () => blockworld.snapshot().inventory.bench === 0,
        );
        const bar = await p.locator("#palette").boundingBox();
        if (viewport.width === 390) {
          const before = (await snap(p)).selected;
          await touch(p, "touchStart", [
            { x: bar.x + bar.width - 20, y: bar.y + 20, id: 7 },
          ]);
          await touch(p, "touchMove", [
            { x: bar.x + 20, y: bar.y + 20, id: 7 },
          ]);
          await touch(p, "touchEnd", []);
          assert.equal((await snap(p)).selected, before);
        }
        const gameButtons = await p
          .locator("#actions button:visible,#joystick")
          .evaluateAll((es) =>
            es.map((e) => ({
              id: e.id,
              r: e.getBoundingClientRect().toJSON(),
            })),
          );
        for (const { id, r } of gameButtons) {
          assert.ok(r.x >= 0 && r.right <= viewport.width + 1, `${id} fits`);
          assert.ok(r.bottom <= bar.y + 1, `${id} clears bar`);
        }
        await p.screenshot({
          path: `${out}/game-${viewport.width}x${viewport.height}.png`,
        });
      },
    );
    await mobile.c.close();
  }
  assert.deepEqual(errors, []);
  const report = {
    date: new Date().toISOString(),
    browser: await browser.version(),
    renderer:
      "Headless Chromium/SwiftShader; mobile input and scaling emulation, not physical iPhone verification",
    results,
    buttonChecks,
    buttonPointActivations: buttonChecks.reduce((n, b) => n + b.points, 0),
    errors,
    requests,
    releaseSha256: createHash("sha256").update(html).digest("hex"),
  };
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
  console.log(
    `ALL ${results.length} scenarios passed; ${report.buttonPointActivations} button-point activations.`,
  );
} catch (e) {
  if (page && !page.isClosed())
    await page.screenshot({ path: `${out}/failure.png` }).catch(() => {});
  console.log("Completed scenarios", results);
  console.log("Page errors", errors);
  throw e;
} finally {
  await browser.close();
}
