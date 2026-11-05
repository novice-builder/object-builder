import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
async function walk(dir) {
  const result = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = dir + "/" + e.name;
    result.push(...(e.isDirectory() ? await walk(p) : [p]));
  }
  return result;
}
const entries = [];
for (const file of await walk("dist"))
  entries.push({
    url: "./" + file.slice(5),
    sha256: createHash("sha256")
      .update(await readFile(file))
      .digest("hex"),
  });
entries.sort((a, b) => a.url.localeCompare(b.url));
const id = createHash("sha256")
  .update(JSON.stringify(entries))
  .digest("hex")
  .slice(0, 16);
await writeFile(
  "dist/release.json",
  JSON.stringify(
    {
      build: id,
      sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
        encoding: "utf8",
      }).trim(),
      sourceDirty: !!execFileSync("git", ["status", "--porcelain", "--", "."], {
        encoding: "utf8",
      }).trim(),
      lockfileSha256: createHash("sha256")
        .update(await readFile("package-lock.json"))
        .digest("hex"),
      legacySource: "df958096a88254bf611a64798e317ecb9fc3f5f9",
      files: entries,
    },
    null,
    2,
  ),
);
const files = [
  "./",
  "./index.html",
  "./release.json",
  ...entries.map((e) => e.url),
];
await writeFile(
  "dist/sw.js",
  `const PREFIX='bw2:development:'+encodeURIComponent(self.registration.scope)+':';const CACHE=PREFIX+'${id}';const FILES=${JSON.stringify([...new Set(files)])};self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));self.addEventListener('message',event=>{if(event.data?.type==='BW2_ACTIVATE')self.skipWaiting();});self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||!url.href.startsWith(self.registration.scope))return;const path=url.pathname.slice(new URL(self.registration.scope).pathname.length);if(!FILES.some(f=>f==='./'+path)&&event.request.mode!=='navigate')return;event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||(event.request.mode==='navigate'?await cache.match('./index.html'):null)||fetch(event.request)));});`,
);
console.log("Isolated offline build", id, "— not deployed");
