import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
await mkdir("../work/screenshots", { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
});
page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE ERROR", m.text());
});
await page.goto("http://localhost:8080/?test=1");
await page.waitForFunction(() => window.blockworld?.ready);
await page.waitForTimeout(1000);
await page.screenshot({ path: "../work/screenshots/welcome.png" });
await page.click("#play");
await page.waitForTimeout(500);
await page.screenshot({ path: "../work/screenshots/home-front.png" });
const uri = await page.evaluate(() => blockworld.test.overview());
await writeFile(
  "../work/screenshots/overview.png",
  Buffer.from(uri.split(",")[1], "base64"),
);
await page.evaluate(() => {
  blockworld.test.setPlayer({ x: -12.4, y: 0, z: -7.1 });
  blockworld.test.lookAt(-10.8, 0.9, -8.1);
});
await page.waitForTimeout(300);
await page.screenshot({ path: "../work/screenshots/inside.png" });
console.log(await page.evaluate(() => blockworld.stats()));
await browser.close();
