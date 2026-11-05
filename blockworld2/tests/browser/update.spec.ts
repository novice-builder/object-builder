import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("a scoped worker update retains saves, legacy caches and cold offline startup", async ({
  browser,
}) => {
  // A separate origin and scratch build let the real worker lifecycle run
  // without editing the production bundle or interfering with other tests.
  const folder = await mkdtemp(path.join(tmpdir(), "bw2-update-test-"));
  await cp("dist", folder, { recursive: true });
  const prefix = "/blockworld-2-preview/";
  const mime: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".webmanifest": "application/manifest+json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain",
  };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url!, "http://localhost");
      if (!url.pathname.startsWith(prefix))
        throw Error("Outside preview scope");
      const file = path.resolve(
        folder,
        decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html",
      );
      if (!file.startsWith(folder + path.sep)) throw Error("Invalid path");
      const data = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  const url = `http://127.0.0.1:${port}${prefix}?test=1`;
  const context = await browser.newContext({
    viewport: { width: 1024, height: 600 },
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForFunction(() => (window as any).bw2?.session.ready);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(
      () =>
        navigator.serviceWorker.controller &&
        (window as any).bw2?.session.ready,
    );
    const id = await page.evaluate(async () => {
      const a = (window as any).bw2;
      await a.session.newWorld("blank");
      a.add({ x: 5, y: 0, z: 0, type: "wood" });
      await a.session.save();
      const old = await caches.open("blockworld-neighborhood-06-v1");
      await old.put("/legacy-sentinel", new Response("preserved"));
      return a.session.current.id;
    });
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller!.scriptURL),
    ).toBe(`http://127.0.0.1:${port}${prefix}sw.js`);
    const worker = await readFile(path.join(folder, "sw.js"), "utf8");
    await writeFile(
      path.join(folder, "sw.js"),
      worker.replace("bw2:development:", "bw2:development:update-test:"),
    );
    await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistration())!.update(),
    );
    await page.waitForFunction(
      async () => !!(await navigator.serviceWorker.getRegistration())?.waiting,
    );
    await page.close(); // Existing clients must close; no forced activation.
    const updated = await context.newPage();
    await updated.goto(url);
    await updated.waitForFunction(() => (window as any).bw2?.session.ready);
    await updated.waitForFunction(
      async () => !(await navigator.serviceWorker.getRegistration())?.waiting,
    );
    expect(
      await updated.evaluate(() => (window as any).bw2.session.current.id),
    ).toBe(id);
    expect(
      await updated.evaluate(async () =>
        (await caches.keys()).some((k) =>
          k.startsWith("bw2:development:update-test:"),
        ),
      ),
    ).toBe(true);
    await context.setOffline(true);
    await updated.close();
    const cold = await context.newPage();
    await cold.goto(url);
    await cold.waitForFunction(() => (window as any).bw2?.session.ready);
    expect(
      await cold.evaluate(() => (window as any).bw2.session.current.id),
    ).toBe(id);
    expect(
      await cold.evaluate(() => (window as any).bw2.snapshot().blocks),
    ).toEqual([{ x: 5, y: 0, z: 0, type: "wood" }]);
    expect(
      await cold.evaluate(async () =>
        (
          await (
            await caches.open("blockworld-neighborhood-06-v1")
          ).match("/legacy-sentinel")
        )?.text(),
      ),
    ).toBe("preserved");
  } finally {
    await context.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(folder, { recursive: true, force: true });
  }
});
