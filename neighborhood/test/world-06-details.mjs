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
const out = "../work/world-06/details";
await mkdir(out, { recursive: true });
const b = await launch(),
  results = [];
try {
  for (const version of [5, 6]) {
    const g = await openGame(b, version);
    await pose(g.page, { x: -160, z: -42.6 });
    await look(g.page, -160, 2.4, -38.4);
    await g.page.waitForTimeout(300);
    await g.page.screenshot({ path: `${out}/bay-${version}.png` });
    assert.deepEqual(g.errors, []);
    await g.context.close();
  }
  const g = await openGame(b),
    p = g.page,
    d = await p.evaluate(() =>
      blockworld.test.world().doors.find((d) => d.kind === "roller"),
    );
  await pose(p, {
    x: d.center.x + Math.sin(d.baseAngle) * 2.1,
    z: d.center.z + Math.cos(d.baseAngle) * 2.1,
  });
  await look(p, d.center.x, 1.1, d.center.z);
  await p.waitForFunction(
    (id) =>
      Math.abs(blockworld.test.world().doors.find((d) => d.id === id).angle) >
      1.56,
    d.id,
  );
  await p.screenshot({ path: `${out}/garage-open.png` });
  assert.equal(
    (
      await p.evaluate(() =>
        blockworld.test.world().doors.find((d) => d.kind === "roller"),
      )
    ).open,
    true,
  );
  await p.tap("#use");
  await p.waitForFunction(
    (id) =>
      Math.abs(blockworld.test.world().doors.find((d) => d.id === id).angle) <
      0.001,
    d.id,
  );
  await p.screenshot({ path: `${out}/garage-closed.png` });
  assert.deepEqual(g.errors, []);
  await g.context.close();
  results.push(
    "same-pose 05/06 bay interior screenshots",
    "actual automatic roller opening and contextual manual closing screenshots",
  );
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
  console.log("PASS detail captures");
} finally {
  await b.close();
}
