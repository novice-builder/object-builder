import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist"),
  source = await readFile("dist/index.html", "utf8");
const scripts = [
    ...source.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g),
  ],
  styles = [...source.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)];
if (scripts.length !== 1 || styles.length !== 1)
  throw Error(
    "Standalone expects one compiled game bundle and stylesheet; update the packager for code splitting",
  );
const asset = async (url) => {
  const file = path.resolve(root, url.replace(/^\.\//, ""));
  if (!file.startsWith(root + path.sep)) throw Error("Asset outside build");
  return readFile(file, "utf8");
};
const js = await asset(scripts[0][1]),
  css = await asset(styles[0][0].match(/href="([^"]+)"/)[1]),
  release = JSON.parse(await readFile("dist/release.json", "utf8"));
let html = source
  .replace(
    scripts[0][0],
    () =>
      '<script type="module">' +
      js.replace(/<\/script/gi, "<\\/script") +
      "</script>",
  )
  .replace(styles[0][0], () => "<style>" + css + "</style>");
html = html
  .replace(/<link\b[^>]*rel="manifest"[^>]*>/g, "")
  .replace(/<html\b/, '<html data-standalone="true"');
const icon = (await readFile("dist/icon-180.png")).toString("base64");
html = html.replace(
  /href="\.\/icon-180.png"/g,
  () => `href="data:image/png;base64,${icon}"`,
);
html = html.replace(
  "</head>",
  () => `<link rel="icon" href="data:image/png;base64,${icon}"></head>`,
);
html = html.replace(
  "</head>",
  () =>
    `<meta name="bw2-build" content="${release.build}"><meta name="bw2-source" content="${release.sourceCommit}"></head>`,
);
const escape = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const credits = await Promise.all(
  [
    "ASSET-CREDITS.txt",
    "licenses/three-MIT.txt",
    "licenses/vite-LICENSE.md",
  ].map((file) => readFile(path.join(root, file), "utf8")),
);
html = html.replace(
  "</body>",
  () =>
    '<template id="bw2-licenses">' +
    escape(credits.join("\n\n")) +
    "</template></body>",
);
if (/<(script|link)\b[^>]*(src|href)="\.\//.test(html))
  throw Error("External application asset remains in standalone HTML");
await mkdir("standalone", { recursive: true });
await writeFile("standalone/BlockWorld_2_Run3_Standalone.html", html);
console.log(
  "Standalone HTML built from the same bundle — not published",
  Buffer.byteLength(html),
  "bytes",
);
