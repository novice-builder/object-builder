// Retained evidence against the immutable 02 release. Assertions describe failures,
// not acceptance criteria for 03.
import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const html = await readFile("../BlockWorld_Neighborhood_02.html", "utf8");
await mkdir("../work/controls-03", { recursive: true });
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const c = await b.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await c.route("**/*", (r) =>
  r.fulfill({ contentType: "text/html", body: html }),
);
await c.addInitScript(() => {
  window.pointerTrace = [];
  for (const type of ["pointerdown", "pointerup"])
    document.addEventListener(
      type,
      (e) => {
        const b = e.target.closest?.("button");
        if (b?.id === "autoStep")
          window.pointerTrace.push({
            type,
            x: e.clientX,
            y: e.clientY,
            rect: b.getBoundingClientRect().toJSON(),
            target: e.target.tagName,
          });
      },
      true,
    );
});
const p = await c.newPage();
await p.goto("http://localhost:8080/?test=1");
await p.waitForFunction(() => blockworld?.ready);
await p.tap("#play");
const result = {};
await p.tap("#menu");
await p.evaluate(() => {
  window.clicks = 0;
  document
    .getElementById("autoStep")
    .addEventListener("click", () => window.clicks++);
});
for (const [name, fx, fy] of [
  ["top-edge", 0.5, 0.01],
  ["centre", 0.5, 0.5],
  ["bottom-edge", 0.5, 0.99],
]) {
  const r = await p.locator("#autoStep").boundingBox();
  await p.touchscreen.tap(r.x + r.width * fx, r.y + r.height * fy);
  result[name] = await p.evaluate(() => window.clicks);
}
result.pointerTrace = await p.evaluate(() => window.pointerTrace);
await p.tap("#resume");
await p.evaluate(() => {
  blockworld.test.setPlayer({ x: -14.4, y: 0, z: -3.4, yaw: 0, pitch: 0 });
  window.nativeToggleCount = 0;
});
await p.waitForFunction(() =>
  document.getElementById("use").textContent.includes("Open"),
);
// Browser/WKWebView compatibility clicks may have neither pointerType nor detail.
await p.tap("#use");
result.doorAfterTouch = await p.evaluate(
  () => blockworld.snapshot().doors.home,
);
await p.evaluate(() =>
  document
    .getElementById("use")
    .dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    ),
);
result.doorAfterMetadataFreeClick = await p.evaluate(
  () => blockworld.snapshot().doors.home,
);
// Enable guard with no selected material, then walk off an actual placed block.
await p.tap("#menu");
if (!(await p.evaluate(() => blockworld.controls().edgeProtection)))
  await p.tap("#edgeProtection");
await p.tap("#resume");
await p.evaluate(() => {
  blockworld.test.add({ x: 0, y: 0, z: 0, type: "wood" });
  blockworld.test.setPlayer({
    x: 0.5,
    y: 1,
    z: 0.5,
    yaw: Math.PI,
    pitch: 0,
    grounded: true,
    vy: 0,
  });
});
await p.keyboard.down("KeyW");
await p.waitForTimeout(1700);
await p.keyboard.up("KeyW");
result.edgeWithHand = await p.evaluate(() => ({
  enabled: blockworld.controls().edgeProtection,
  selected: blockworld.snapshot().selected,
  y: blockworld.snapshot().player.y,
}));
await writeFile(
  "../work/controls-03/reproduction-02.json",
  JSON.stringify(result, null, 2),
);
console.log(result);
await b.close();
