import { createServer } from "node:http";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
/** Test-only localhost host. Copies static dist; never publishes or touches Pages. */
export async function localPreview() {
  const folder = await mkdtemp(path.join(tmpdir(), "bw2-local-preview-"));
  await cp("dist", folder, { recursive: true });
  const prefix = "/blockworld-2-test/",
    mime: Record<string, string> = {
      ".js": "application/javascript",
      ".html": "text/html",
      ".css": "text/css",
      ".json": "application/json",
      ".webmanifest": "application/manifest+json",
      ".png": "image/png",
      ".svg": "image/svg+xml",
    };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url!, "http://localhost");
      if (!url.pathname.startsWith(prefix)) throw Error();
      const file = path.resolve(
        folder,
        decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html",
      );
      if (!file.startsWith(folder + path.sep)) throw Error();
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "text/plain",
        "Cache-Control": "no-store",
      });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  return {
    folder,
    url: `http://127.0.0.1:${port}${prefix}?test=1`,
    async close() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await rm(folder, { recursive: true, force: true });
    },
  };
}
