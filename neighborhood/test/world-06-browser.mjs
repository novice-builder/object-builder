import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  launch,
  openGame,
  pose,
  look,
  touchWorld,
  speed,
  releases,
} from "./browser-06-helpers.mjs";
const out = "../work/world-06/browser";
await mkdir(out, { recursive: true });
const b = await launch(),
  results = [],
  buttonChecks = [],
  errors = [];
let page;
const check = async (name, fn) => {
  await fn();
  results.push(name);
  console.log("PASS", name);
};
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
            window.hitProbe.last =
              b.id || b.dataset.item || b.dataset.walkSpeed || b.dataset.recipe;
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
    ];
    const id = await b.evaluate(
      (e) => e.id || e.dataset.item || e.dataset.walkSpeed || e.dataset.recipe,
    );
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
  const main = await openGame(b),
    p = (page = main.page);
  await check(
    "500 m bounds, 72 buildings, three ponds and retained controls load offline",
    async () => {
      const w = await p.evaluate(() => blockworld.test.world());
      assert.equal(w.config.halfSize, 250);
      assert.equal(w.houses.length, 72);
      assert.equal(w.ponds.length, 3);
      const c = await p.evaluate(() => blockworld.controls());
      assert.equal(c.walkSpeed, "normal");
      assert.equal(c.edgeProtection, true);
      assert.equal("autoStep" in c, false);
    },
  );
  await check(
    "all doors operate automatically/manual from both sides with passage and closed-leaf collision",
    async () => {
      const report = await p.evaluate(() => {
        const data = blockworld.test.world().doors,
          records = [];
        for (const entry of data)
          for (const side of [1, -1]) {
            blockworld.test.fresh();
            const d = blockworld.test
                .world()
                .doors.find((d) => d.id === entry.id),
              nx = Math.sin(d.baseAngle),
              nz = Math.cos(d.baseAngle),
              at = (distance, yaw = d.baseAngle + (side < 0 ? Math.PI : 0)) =>
                blockworld.test.setPlayer({
                  x: d.center.x + nx * side * distance,
                  z: d.center.z + nz * side * distance,
                  y: 0,
                  vy: 0,
                  grounded: true,
                  yaw,
                  pitch: 0,
                }),
              current = () =>
                blockworld.test.world().doors.find((q) => q.id === d.id);
            at(2.2);
            blockworld.test.simulate({}, 0.15);
            const partial = Math.abs(current().angle);
            blockworld.test.simulate({}, 0.8);
            const auto = current();
            blockworld.test.simulate({ forward: 1 }, 1.25);
            const inside = blockworld.snapshot().player,
              pass =
                ((inside.x - d.center.x) * nx + (inside.z - d.center.z) * nz) *
                side;
            at(4.5);
            blockworld.test.simulate({}, 2.4);
            const delayedClosed = Math.abs(current().angle) < 0.001;
            at(2.2);
            const manual = blockworld.test.toggleDoor(d.id);
            blockworld.test.simulate({}, 0.8);
            blockworld.test.simulate({ forward: 1 }, 1.25);
            const close = blockworld.test.toggleDoor(d.id);
            blockworld.test.simulate({}, 0.8);
            blockworld.test.setLook(d.baseAngle + (side > 0 ? Math.PI : 0));
            blockworld.test.simulate({ forward: 1 }, 1);
            const stopped = blockworld.snapshot().player,
              closedSide =
                ((stopped.x - d.center.x) * nx +
                  (stopped.z - d.center.z) * nz) *
                side;
            const reopen = blockworld.test.toggleDoor(d.id);
            blockworld.test.simulate({}, 0.8);
            records.push({
              id: d.id,
              kind: d.kind,
              side,
              partial,
              autoOpen: Math.abs(auto.angle) > 1.56,
              swing: auto.swing,
              pass,
              delayedClosed,
              manual,
              close,
              closedSide,
              reopen,
              reopened: Math.abs(current().angle) > 1.56,
            });
          }
        return records;
      });
      for (const r of report) {
        assert.ok(r.partial > 0 && r.partial < 1.56, r.id + " partial");
        assert.ok(
          r.autoOpen &&
            (r.kind === "roller" || r.swing === r.side) &&
            r.pass < -1.8 &&
            r.delayedClosed,
          r.id + " auto",
        );
        assert.ok(
          r.manual && r.close && r.closedSide < -0.25 && r.reopen && r.reopened,
          r.id + " manual collision",
        );
      }
      await writeFile(`${out}/doors.json`, JSON.stringify(report, null, 2));
    },
  );
  await check(
    "walking-speed buttons activate across their faces, show feedback and persist",
    async () => {
      await p.tap("#menu");
      await hitGrid(p, "[data-walk-speed]", "speed settings");
      for (const value of ["normal", "quick", "fast"]) {
        await p.locator(`[data-walk-speed="${value}"]`).tap();
        assert.equal(
          await p.evaluate(() => blockworld.controls().walkSpeed),
          value,
        );
        assert.equal(
          await p
            .locator(`[data-walk-speed="${value}"]`)
            .getAttribute("aria-pressed"),
          "true",
        );
        assert.ok(
          (await p.locator("#settingsFeedback").textContent()).includes(
            "Walking speed",
          ),
        );
      }
      await p.tap("#resume");
      await p.reload();
      await p.waitForFunction(() => window.blockworld?.ready);
      await p.tap("#play");
      assert.equal(
        await p.evaluate(() => blockworld.controls().walkSpeed),
        "fast",
      );
      for (const [value, v] of [
        ["normal", 3.4],
        ["quick", 5.1],
        ["fast", 6.8],
      ]) {
        await speed(p, value);
        await pose(p, { x: 150, z: 209 });
        await p.evaluate(() => blockworld.test.simulate({ forward: 1 }, 1));
        const at = await p.evaluate(() => blockworld.snapshot().player);
        assert.ok(Math.abs(209 - at.z - v * 1.008) < 0.025);
      }
    },
  );
  await check(
    "Fast automatic approach clears every door without walking through a closed leaf",
    async () => {
      await speed(p, "fast");
      const data = await p.evaluate(() => {
        const doors = blockworld.test.world().doors,
          records = [];
        for (const d of doors) {
          blockworld.test.fresh();
          const nx = Math.sin(d.baseAngle),
            nz = Math.cos(d.baseAngle);
          blockworld.test.setPlayer({
            x: d.center.x + nx * 4.5,
            z: d.center.z + nz * 4.5,
            y: 0,
            vy: 0,
            grounded: true,
            yaw: d.baseAngle,
            pitch: 0,
          });
          blockworld.test.simulate({ forward: 1 }, 1.4);
          const p = blockworld.snapshot().player;
          records.push({
            id: d.id,
            crossed: (p.x - d.center.x) * nx + (p.z - d.center.z) * nz,
          });
        }
        return records;
      });
      for (const d of data) assert.ok(d.crossed < -0.8, d.id);
      await writeFile(`${out}/fast-doors.json`, JSON.stringify(data, null, 2));
    },
  );
  await check(
    "Fast walking, Jump, independent edge guard and intentional descent still work",
    async () => {
      await p.evaluate(() => {
        blockworld.test.fresh();
        blockworld.test.add({ x: 150, y: 0, z: 210, type: "wood" });
      });
      await pose(p, { x: 150.5, z: 210.5, y: 1 });
      await p.evaluate(() => blockworld.test.simulate({ forward: -1 }, 0.6));
      let s = await p.evaluate(() => blockworld.snapshot());
      assert.equal(s.player.y, 1);
      assert.ok(s.player.z < 210.9);
      await p.tap("#guardToggle");
      await p.evaluate(() => blockworld.test.simulate({ forward: -1 }, 0.8));
      assert.equal((await p.evaluate(() => blockworld.snapshot())).player.y, 0);
      await p.tap("#guardToggle");
      await pose(p, { x: 150.5, z: 210.5, y: 1 });
      await p.tap("#jump");
      await p.evaluate(() => blockworld.test.simulate({ forward: -1 }, 0.3));
      s = await p.evaluate(() => blockworld.snapshot());
      assert.ok(s.player.z > 211.2 && s.player.y > 1);
      await p.evaluate(() => blockworld.test.fresh());
      await pose(p, { x: 150, z: 209 });
      await p.keyboard.down("KeyW");
      await p.waitForTimeout(400);
      await p.keyboard.up("KeyW");
      assert.ok((await p.evaluate(() => blockworld.snapshot())).player.z < 208);
    },
  );
  await check(
    "manual contextual door touch works once; metadata-free follow-up click does not reverse it",
    async () => {
      await speed(p, "normal");
      await p.tap("#menu");
      await p.tap("#automaticDoors");
      await p.tap("#resume");
      await p.evaluate(() => blockworld.test.fresh());
      await pose(p, { x: -14.4, z: -3.3 });
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
        (await p.evaluate(() => blockworld.test.world().doors[0])).targetOpen,
        true,
      );
      await p.evaluate(() => blockworld.test.simulate({}, 0.8));
      await p.tap("#menu");
      await p.tap("#automaticDoors");
      await p.tap("#resume");
    },
  );
  errors.push(...main.errors);
  await main.context.close();
  for (const [viewport, dpr, scale] of [
    [{ width: 390, height: 844 }, 1, 1],
    [{ width: 844, height: 390 }, 1, 1],
    [{ width: 428, height: 760 }, 3, 0.85],
    [{ width: 800, height: 600 }, 1, 1],
  ]) {
    const g = await openGame(b, 6, viewport, null, dpr),
      p = (page = g.page);
    await check(
      `full hit areas for header, gameplay and hotbar ${viewport.width}x${viewport.height}`,
      async () => {
        await p.evaluate(() =>
          blockworld.test.add({ x: 5, y: 0, z: 0, type: "wood" }),
        );
        await hitGrid(
          p,
          ".header-actions button,#actions button:visible,#palette button",
          "gameplay " + viewport.width,
        );
      },
    );
    await check(
      `grown-up settings and map remain usable ${viewport.width}x${viewport.height}`,
      async () => {
        await p.tap("#menu");
        if (scale !== 1)
          await p
            .locator(".settings")
            .evaluate((el, scale) => (el.style.zoom = scale), scale);
        await hitGrid(p, "#settings button", "settings " + viewport.width);
        await p.locator('[data-walk-speed="quick"]').tap();
        assert.equal(
          await p.evaluate(() => blockworld.controls().walkSpeed),
          "quick",
        );
        await p.screenshot({ path: `${out}/settings-${viewport.width}.png` });
        await p.tap("#resume");
        await p.tap("#mapButton");
        await hitGrid(p, "#map button", "map " + viewport.width);
        assert.equal(await p.locator("#mapLegend span").count(), 18);
        await p.screenshot({ path: `${out}/map-${viewport.width}.png` });
        await p.locator("#map [data-close]").tap();
      },
    );
    await check(
      `outer-area direct building, removal, Undo and crafting preview ${viewport.width}x${viewport.height}`,
      async () => {
        await p.evaluate(() => blockworld.test.fresh());
        await pose(p, { x: 150.5, z: 213 });
        await look(p, 150.5, 0.01, 210.5);
        await p.locator('[data-item="wood"]').tap();
        await touchWorld(p, 150.5, 0.01, 210.5);
        await p.waitForFunction(
          () => blockworld.snapshot().blocks.length === 1,
        );
        await p.locator('[data-item="wood"]').tap();
        assert.equal(
          await p.evaluate(() => blockworld.snapshot().selected),
          "hand",
        );
        await look(p, 150.5, 0.5, 210.5);
        const q = await p.evaluate(() =>
            blockworld.test.project(150.5, 0.5, 210.5),
          ),
          cdp = await p.context().newCDPSession(p);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: q.x, y: q.y, id: 9 }],
        });
        await p.waitForTimeout(680);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await p.waitForFunction(
          () => blockworld.snapshot().blocks.length === 0,
        );
        await p.tap("#undo");
        await p.waitForFunction(
          () => blockworld.snapshot().blocks.length === 1,
        );
        await pose(p, { x: -10.8, z: -6.2 });
        await look(p, -10.8, 0.9, -8.1);
        await touchWorld(p, -10.8, 0.9, -8.1);
        await p.waitForFunction(() => blockworld.test.getModal() === "craft");
        await hitGrid(p, "#craft button", "craft " + viewport.width);
        await p.locator('[data-recipe="bench"]').tap();
        await pose(p, { x: 150.5, z: 213 });
        await look(p, 153.5, 0.01, 210.5);
        await touchWorld(p, 153.5, 0.01, 210.5);
        await p.waitForFunction(() => !!blockworld.controls().pending);
        const panel = await p.locator("#placementControls").boundingBox();
        for (const sel of ["#actions", "#joystick"]) {
          const r = await p.locator(sel).boundingBox();
          assert.ok(
            panel.x + panel.width <= r.x + 1 ||
              r.x + r.width <= panel.x + 1 ||
              panel.y + panel.height <= r.y + 1 ||
              r.y + r.height <= panel.y + 1,
            "preview must not cover " + sel,
          );
        }
        await hitGrid(
          p,
          "#placementControls button",
          "preview " + viewport.width,
        );
        const rotation = await p.evaluate(
          () => blockworld.controls().pending.rotation,
        );
        await p.tap("#rotate90");
        await p.tap("#rotateFine");
        assert.equal(
          await p.evaluate(() => blockworld.controls().pending.rotation),
          (rotation + 105) % 360,
        );
        await p.screenshot({ path: `${out}/preview-${viewport.width}.png` });
        await p.tap("#confirmPlace");
        await p.waitForFunction(
          () => blockworld.snapshot().inventory.bench === 0,
        );
        assert.equal(
          (await p.evaluate(() => blockworld.snapshot())).blocks.length,
          2,
        );
      },
    );
    errors.push(...g.errors);
    await g.context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(
      {
        results,
        buttonChecks,
        buttonPointActivations: buttonChecks.reduce((n, c) => n + c.points, 0),
        errors,
        browser: await b.version(),
        releaseSha256: createHash("sha256").update(releases[6]).digest("hex"),
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS",
    results.length,
    "scenarios;",
    buttonChecks.reduce((n, c) => n + c.points, 0),
    "button hit points",
  );
} catch (e) {
  if (page && !page.isClosed())
    await page
      .screenshot({ path: `out/failure.png`.replace("out/", out + "/") })
      .catch(() => {});
  throw e;
} finally {
  await b.close();
}
