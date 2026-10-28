import { launch, openGame, pose, look } from "./browser-06-helpers.mjs";
import { writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { releases } from "./browser-06-helpers.mjs";
const out = "../work/world-06/visual";
await mkdir(out, { recursive: true });
const b = await launch(),
  captures = [];
try {
  const {
    page: p,
    context: c,
    errors,
  } = await openGame(b, 6, { width: 1000, height: 800 });
  await p.waitForTimeout(3800);
  await p.setViewportSize({ width: 1000, height: 1000 });
  await p.waitForFunction(
    () =>
      document.getElementById("world").width === 1000 &&
      document.getElementById("world").height === 1000,
  );
  const survey = await p.evaluate(() => blockworld.test.survey());
  await writeFile(
    `${out}/world-top-down.png`,
    Buffer.from(survey.split(",")[1], "base64"),
  );
  captures.push("world-top-down");
  await p.setViewportSize({ width: 1000, height: 800 });
  await p.waitForFunction(
    () => document.getElementById("world").height === 800,
  );
  const views = {
    linden: [-52, -143, -30, 2, -159],
    willowstreet: [-42, 128, -18, 2, 144],
    manor: [82, 18, 103, 4, 16],
    lot: [-52, -148, -52, 0.1, -159],
    interior: [14, -157, 14, 1, -163],
    home: [-14.4, -1.2, -13, 1, -9],
    west: [-187, -40, -212, 1.5, -40],
    north: [-8, -189, -8, 2, -214],
    makers: [185, -108, 206, 1.5, -103],
    lake: [197, 98, 197, 1, 84],
    farm: [-18, 197, -18, 2, 214],
    pond: [-190, 183, -167, 0.4, 197],
    beacon: [231, 130, 214, 3, 145],
    meadow: [151, 208, 151, 0.2, 225],
  };
  for (const [name, v] of Object.entries(views)) {
    await pose(p, { x: v[0], z: v[1] });
    await look(p, ...v.slice(2));
    await p.waitForTimeout(350);
    await p.screenshot({ path: `${out}/${name}-eye.png` });
    captures.push(`${name}-eye`);
  }
  for (const [name, v] of Object.entries({
    west: [-130, 40, 5, -190, 0, -35],
    north: [45, 38, -168, -5, 0, -210],
    farm: [30, 40, 175, -40, 0, 215],
    lake: [245, 34, 104, 207, 0, 60],
  })) {
    const url = await p.evaluate((v) => blockworld.test.overview(...v), v);
    await writeFile(
      `${out}/${name}-overview.png`,
      Buffer.from(url.split(",")[1], "base64"),
    );
    captures.push(`${name}-overview`);
  }
  await p.tap("#mapButton");
  await p.screenshot({ path: `${out}/map.png` });
  captures.push("map");
  if (errors.length) throw Error(JSON.stringify(errors));
  await writeFile(
    `${out}/captures.json`,
    JSON.stringify(
      {
        captures,
        errors,
        releaseSha256: createHash("sha256").update(releases[6]).digest("hex"),
      },
      null,
      2,
    ),
  );
  console.log("Captured", captures.length, "views");
  await c.close();
} finally {
  await b.close();
}
