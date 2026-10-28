import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  launch,
  openGame,
  pose,
  look,
  releases,
} from "./browser-06-helpers.mjs";
const out = "../work/world-06/performance";
await mkdir(out, { recursive: true });
const b = await launch(),
  report = {
    date: new Date().toISOString(),
    browser: await b.version(),
    renderer:
      "Linux Chromium / ANGLE SwiftShader software GPU; not a physical iPhone or Lenovo",
    viewport: { width: 800, height: 600 },
    dpr: 1,
    quality: "gentle",
    sampleSeconds: 5,
    settleMs: 1200,
    order: [5, 6, 6, 5],
    releaseSha256: createHash("sha256").update(releases[6]).digest("hex"),
    baselineSha256: createHash("sha256").update(releases[5]).digest("hex"),
    runs: [],
    outer: [],
  };
async function sample(p, name, position) {
  await pose(p, position);
  await p.waitForTimeout(1200);
  return await p.evaluate(
    (name) =>
      new Promise((resolve) => {
        const times = [];
        let last = performance.now(),
          start = last;
        function tick(now) {
          times.push(now - last);
          last = now;
          if (now - start < 5000) return requestAnimationFrame(tick);
          const sorted = [...times].sort((a, b) => a - b);
          resolve({
            name,
            frames: times.length,
            seconds: (now - start) / 1000,
            fps: (times.length * 1000) / (now - start),
            p95: sorted[Math.floor((sorted.length - 1) * 0.95)],
            frameTimes: times,
            stats: blockworld.stats(),
          });
        }
        requestAnimationFrame(tick);
      }),
    name,
  );
}
async function ordinary(p) {
  await p.evaluate(() => blockworld.test.fresh());
  await p.locator('[data-item="wood"]').tap();
  await pose(p, { x: -4.5, z: 2 });
  await look(p, -4.5, 0.01, -0.5);
  return p.evaluate(() => {
    const t = performance.now(),
      placed = blockworld.test.place(),
      a = performance.now(),
      removed = blockworld.test.remove(),
      b = performance.now(),
      undone = blockworld.test.undo(),
      c = performance.now();
    return {
      placed,
      removed,
      undone,
      placeMs: a - t,
      removeMs: b - a,
      undoMs: c - b,
    };
  });
}
async function stress(p) {
  return p.evaluate(() => {
    const data = blockworld.snapshot();
    data.blocks = [];
    for (let x = -81; x < -56; x++)
      for (let z = 49; z < 69; z++)
        for (let y = 0; y < 24; y++)
          data.blocks.push({
            x,
            y,
            z,
            type: ["wood", "stone", "brick", "glass"][(x + y + z + 400) % 4],
          });
    data.player = { x: -52, y: 0, z: 60, yaw: Math.PI / 2, pitch: 0 };
    const t = performance.now();
    blockworld.test.load(data);
    return {
      loadMs: performance.now() - t,
      count: blockworld.snapshot().blocks.length,
    };
  });
}
try {
  // Warm shared software GPU before collecting either version's startup measurements.
  const warm = await openGame(b, 5);
  await warm.page.waitForTimeout(1200);
  await warm.context.close();
  for (let run = 0; run < report.order.length; run++) {
    const version = report.order[run],
      g = await openGame(b, version),
      p = g.page;
    const record = {
      run,
      version,
      readyMs: g.readyMs,
      samples: [],
      ordinary: [],
    };
    for (const [name, v] of [
      ["home", { x: -14.4, z: -1.2 }],
      ["village", { x: 49, z: -18 }],
      ["woods", { x: -65, z: -103 }],
      ["linden-street", { x: -30, z: -143, yaw: Math.PI / 2 }],
      ["willow-street", { x: -18, z: 128, yaw: -Math.PI / 2 }],
      ["open", { x: -59, z: 61, yaw: Math.PI / 2 }],
    ])
      record.samples.push(await sample(p, name, v));
    for (let i = 0; i < 3; i++) {
      const result = await ordinary(p);
      assert.ok(result.placed && result.removed && result.undone);
      record.ordinary.push(result);
    }
    record.stress = await stress(p);
    assert.equal(record.stress.count, 12000);
    record.samples.push(
      await sample(p, "dense-12000", { x: -52, z: 60, yaw: Math.PI / 2 }),
    );
    record.denseEdit = await p.evaluate(() => {
      blockworld.test.lookAt(-56.5, 0.5, 60.5);
      const before = blockworld.test.chunkInfo(),
        t = performance.now(),
        removed = blockworld.test.remove(),
        r = performance.now(),
        undone = blockworld.test.undo(),
        end = performance.now(),
        after = blockworld.test.chunkInfo();
      return {
        removed,
        undone,
        removeMs: r - t,
        undoMs: end - r,
        rebuilds: after.rebuilt - before.rebuilt,
        unaffectedChunks: before.groups.filter((g) =>
          after.groups.some((a) => a.key === g.key && a.id === g.id),
        ).length,
      };
    });
    assert.ok(record.denseEdit.removed && record.denseEdit.undone);
    assert.equal(record.denseEdit.rebuilds, 2);
    assert.ok(record.denseEdit.unaffectedChunks > 0);
    assert.deepEqual(g.errors, []);
    record.errors = g.errors;
    report.runs.push(record);
    console.log(
      "PASS comparison run",
      run,
      version,
      record.samples.map((s) => `${s.name}:${s.fps.toFixed(1)}`).join(" "),
    );
    await g.context.close();
  }
  const g = await openGame(b, 6);
  for (const [name, v] of [
    ["sunbeam-square", { x: -8, z: -189 }],
    ["reed-pond", { x: -193, z: 178, yaw: -1 }],
    ["far-open", { x: 151, z: 209, yaw: Math.PI / 2 }],
  ])
    report.outer.push(await sample(g.page, name, v));
  assert.deepEqual(g.errors, []);
  await g.context.close();
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
  console.log("PASS paired 05/06 performance comparison");
} finally {
  await b.close();
}
