import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  launch,
  openGame,
  pose,
  look,
  releases,
} from "./browser-06-helpers.mjs";
const out = "../work/world-06/features";
await mkdir(out, { recursive: true });
const b = await launch(),
  results = [];
const overlap = (a, r) =>
  a.x < r.x + r.width &&
  a.x + a.width > r.x &&
  a.y < r.y + r.height &&
  a.y + a.height > r.y;
try {
  const old = await openGame(b, 5);
  await old.page.evaluate(() => {
    const s = blockworld.snapshot();
    s.blocks = [
      { x: -30, y: 0, z: -159, type: "brick" },
      { x: 81, y: 0, z: 100, type: "wood" },
    ];
    s.inventory.bench = 4;
    s.selected = "stone";
    blockworld.test.load(s);
    blockworld.test.save();
  });
  const original = await old.page.evaluate(() =>
    localStorage.getItem("blockworld.neighborhood.05"),
  );
  await old.context.route("**/*", (r) =>
    r.fulfill({ contentType: "text/html", body: releases[6] }),
  );
  await old.page.reload();
  await old.page.waitForFunction(() => blockworld?.ready);
  let snap = await old.page.evaluate(() => ({
    s: blockworld.snapshot(),
    w: blockworld.test.world(),
    old: localStorage.getItem("blockworld.neighborhood.05"),
  }));
  assert.deepEqual(snap.s.blocks, JSON.parse(original).blocks);
  assert.ok(snap.w.omitted.includes("north-n-3"));
  assert.equal(snap.old, original);
  assert.equal(snap.s.inventory.bench, 4);
  assert.equal(snap.s.selected, "stone");
  await old.page.tap("#play");
  await old.page.evaluate(() => blockworld.test.save());
  await old.page.reload();
  await old.page.waitForFunction(() => blockworld?.ready);
  assert.deepEqual(
    await old.page.evaluate(() => blockworld.snapshot().blocks),
    JSON.parse(original).blocks,
  );
  results.push(
    "real 05 runtime build in new property imports/reopens with blocks retained and whole house omitted; old key unchanged",
  );
  await old.context.close();
  const g = await openGame(b),
    p = g.page;
  await pose(p, { x: -30, z: -143 });
  await p.waitForFunction(
    () => blockworld.test.world().mapStats.pose === "-30.0,-143.0,0.00",
  );
  const first = await p.evaluate(() => ({
    w: blockworld.test.world().mapStats,
    png: document.getElementById("minimapCanvas").toDataURL(),
  }));
  await p.waitForTimeout(500);
  const idle = await p.evaluate(() => blockworld.test.world().mapStats);
  assert.equal(idle.cacheBuilds, first.w.cacheBuilds);
  assert.equal(idle.minimapDraws, first.w.minimapDraws);
  await pose(p, { x: -32, z: -143, yaw: 1.5 });
  await p.waitForTimeout(200);
  const moved = await p.evaluate(() => ({
    w: blockworld.test.world().mapStats,
    png: document.getElementById("minimapCanvas").toDataURL(),
  }));
  assert.equal(moved.w.cacheBuilds, first.w.cacheBuilds);
  assert.notEqual(moved.png, first.png);
  results.push(
    "minimap pose/heading updates without static-map rebuild; idle frames do not redraw",
  );
  await p.tap("#minimapButton");
  assert.equal(await p.evaluate(() => blockworld.test.getModal()), "map");
  await p.locator("#map [data-close]").tap();
  results.push("circular minimap opens and closes existing full map");
  const rooms = await p.evaluate(() => blockworld.test.world().rooms);
  const stairs = await p.evaluate(() =>
    blockworld.test.world().solids.filter((b) => b.ramp),
  );
  for (const s of stairs) {
    const r = s.ramp,
      angle = Math.atan2(r.s, r.c),
      z = r.length / 2 - 0.05;
    await pose(p, { x: r.cx + z * r.s, z: r.cz + z * r.c, yaw: angle });
    await p.evaluate(
      (length) => blockworld.test.simulate({ forward: 1 }, length / 3.4 + 0.45),
      r.length,
    );
    assert.ok((await p.evaluate(() => blockworld.snapshot().player.y)) > 3.1);
    await p.evaluate(() =>
      blockworld.test.setLook(blockworld.snapshot().player.yaw + Math.PI),
    );
    await p.evaluate(
      (length) => blockworld.test.simulate({ forward: 1 }, length / 3.4 + 0.8),
      r.length,
    );
    assert.ok((await p.evaluate(() => blockworld.snapshot().player.y)) < 0.1);
  }
  results.push(
    `actual runtime ascent/descent through all ${stairs.length} staircases with guard on`,
  );
  for (const [name, pos, target] of [
    ["linden-street", { x: -12, z: -143, yaw: Math.PI / 2 }, null],
    ["willow-street", { x: 0, z: 128, yaw: -Math.PI / 2 }, null],
    ["elm-street", { x: -137, z: -45, yaw: 0 }, null],
    ["manor-front", { x: 82, z: 11 }, [103, 4, 16]],
    ["playground", { x: 54, z: 55 }, [67, 1.4, 42]],
    ["lake-park", { x: 181, z: 96 }, [199, 1, 80]],
    ["vacant-lot", { x: -52, z: -147 }, [-52, 0.1, -159]],
    ["manor-living", { x: 98, z: 13, y: 0 }, [96.5, 1, 19]],
    ["manor-upstairs", { x: 103, z: 14.6, y: 3.2 }, [105, 4.5, 10]],
    ["stairs", { x: 16, z: -155, y: 0 }, [18, 2, -160]],
    ["bay-interior", { x: -160, z: -45 }, [-161, 2.65, -39.9]],
  ]) {
    await pose(p, pos);
    if (target) await look(p, ...target);
    await p.waitForTimeout(250);
    await p.screenshot({ path: `${out}/${name}.png` });
  }
  results.push(
    "eleven town, parks, lots, interior, stairs and bay-window screenshots captured",
  );
  await g.context.close();
  const profiles = [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 428, height: 760 },
    { width: 800, height: 600 },
  ];
  for (const viewport of profiles) {
    const g = await openGame(b, 6, viewport),
      p = g.page;
    await pose(p, { x: -14.4, z: -3.6 });
    await p.locator("#use").waitFor({ state: "visible" });
    const use = await p.locator("#use").boundingBox();
    assert.ok(use && use.width >= 80 && use.height >= 46);
    for (const sel of ["#actions", "#joystick", "#palette", "#minimapButton"]) {
      const r = await p.locator(sel).boundingBox();
      assert.ok(!overlap(use, r), `${viewport.width}: dock overlaps ${sel}`);
    }
    assert.ok(use.x > viewport.width * 0.48, "side dock leaves centre clear");
    const start = await p.evaluate(() => blockworld.snapshot().player.yaw),
      cdp = await p.context().newCDPSession(p);
    let x = viewport.width * 0.5,
      y = viewport.height * 0.4;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + 60, y: y + 10, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    assert.notEqual(
      await p.evaluate(() => blockworld.snapshot().player.yaw),
      start,
    );
    const mini = await p.locator("#minimapButton").boundingBox();
    for (const [dx, dy] of [
      [0.5, 0.5],
      [0.5, 0.08],
      [0.92, 0.5],
      [0.5, 0.92],
      [0.08, 0.5],
    ]) {
      await p.touchscreen.tap(
        mini.x + mini.width * dx,
        mini.y + mini.height * dy,
      );
      assert.equal(await p.evaluate(() => blockworld.test.getModal()), "map");
      await p.locator("#map [data-close]").tap();
    }
    await p.screenshot({ path: `${out}/dock-${viewport.width}.png` });
    assert.deepEqual(g.errors, []);
    results.push(
      `dock clearance, actual central camera drag and five minimap touch points ${viewport.width}x${viewport.height}`,
    );
    await g.context.close();
  }
  {
    const g = await openGame(b, 6, { width: 1000, height: 700 }, () => {
        window.testPad = null;
        Object.defineProperty(navigator, "getGamepads", {
          configurable: true,
          value: () => (window.testPad ? [window.testPad] : []),
        });
      }),
      p = g.page;
    await pose(p, { x: 8, z: 61 });
    await p.keyboard.down("KeyW");
    await p.waitForFunction(() => blockworld.snapshot().player.z < 60.5);
    await p.keyboard.up("KeyW");
    const before = await p.evaluate(() => blockworld.snapshot().player.yaw);
    await p.mouse.move(500, 260);
    await p.mouse.down();
    await p.mouse.move(600, 280, { steps: 8 });
    await p.mouse.up();
    assert.notEqual(
      await p.evaluate(() => blockworld.snapshot().player.yaw),
      before,
    );
    await pose(p, { x: 8, z: 61 });
    await p.evaluate(
      () =>
        (window.testPad = {
          mapping: "standard",
          connected: true,
          axes: [0, -1, 0, 0],
          buttons: Array.from({ length: 17 }, () => ({
            pressed: false,
            value: 0,
          })),
        }),
    );
    await p.waitForFunction(() => blockworld.snapshot().player.z < 60.5);
    await p.evaluate(() => {
      testPad.axes = [0, 0, 0.8, 0];
    });
    await p.waitForFunction(() => blockworld.snapshot().player.yaw < -0.1);
    await p.evaluate(() => {
      testPad.axes = [0, 0, 0, 0];
      testPad.buttons[0].pressed = true;
    });
    await p.waitForFunction(() => blockworld.snapshot().player.y > 0.2);
    await p.evaluate(() => (testPad.buttons[0].pressed = false));
    await p.waitForFunction(() => blockworld.snapshot().player.y === 0);
    await p.evaluate(() => (testPad.buttons[9].pressed = true));
    await p.waitForFunction(() => blockworld.test.getModal() === "settings");
    await p.evaluate(() => (testPad.buttons[9].pressed = false));
    await p.waitForTimeout(150);
    await p.evaluate(() => (testPad.buttons[0].pressed = true));
    await p.waitForFunction(() => !blockworld.test.getModal());
    await p.evaluate(() => (testPad.buttons[0].pressed = false));
    await p.evaluate(() => (testPad.buttons[5].pressed = true));
    await p.waitForFunction(() => blockworld.snapshot().selected === "wood");
    await p.evaluate(() => (testPad.buttons[5].pressed = false));
    assert.deepEqual(g.errors, []);
    results.push(
      "keyboard walking, mouse camera, simulated standard controller walking/look/jump/menu/hotbar all activate through real input handlers",
    );
    await g.context.close();
  }
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(
      {
        results,
        releaseSha256: createHash("sha256").update(releases[6]).digest("hex"),
      },
      null,
      2,
    ),
  );
  console.log("PASS", results.length, "new feature scenarios");
} finally {
  await b.close();
}
