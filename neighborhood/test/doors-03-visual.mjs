import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const html = await readFile("../BlockWorld_Neighborhood_03.html", "utf8"),
  out = "../work/controls-03/verification/doors";
await mkdir(out, { recursive: true });
const b = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const p = await b.newPage({ viewport: { width: 900, height: 650 } });
await p.route("**/*", (r) =>
  r.fulfill({ contentType: "text/html", body: html }),
);
await p.goto("http://localhost:8080/?test=1");
await p.waitForFunction(() => blockworld?.ready);
await p.click("#play");
const doors = await p.evaluate(() => blockworld.test.world().doors),
  captures = [];
try {
  for (const d of doors)
    for (const side of [1, -1]) {
      await p.evaluate(
        ({ d, side }) => {
          blockworld.test.fresh();
          const n = { x: Math.sin(d.baseAngle), z: Math.cos(d.baseAngle) },
            t = { x: Math.cos(d.baseAngle), z: -Math.sin(d.baseAngle) };
          blockworld.test.setPlayer({
            x: d.center.x + n.x * side * 2 + t.x * 0.6,
            z: d.center.z + n.z * side * 2 + t.z * 0.6,
            y: 0,
            vy: 0,
            grounded: true,
          });
          blockworld.test.lookAt(d.center.x, 1.2, d.center.z);
        },
        { d, side },
      );
      await p.waitForFunction(
        (id) =>
          Math.abs(
            blockworld.test.world().doors.find((d) => d.id === id).angle,
          ) > 1.56,
        d.id,
      );
      await p.screenshot({
        path: `${out}/${d.id}-${side === 1 ? "outside" : "inside"}.png`,
      });
      captures.push({
        id: d.id,
        side,
        door: await p.evaluate(
          (id) => blockworld.test.world().doors.find((d) => d.id === id),
          d.id,
        ),
      });
    }
  await writeFile(`${out}/captures.json`, JSON.stringify(captures, null, 2));
  console.log(
    "Captured",
    captures.length,
    "inside/outside automatic door views.",
  );
} finally {
  await b.close();
}
