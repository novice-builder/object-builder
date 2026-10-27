import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const manifest = JSON.parse(await readFile("audio/dialogue.json", "utf8")),
  clips = {};
for (const [id, cue] of Object.entries(manifest)) {
  if (!cue.file) continue;
  const audioRoot = path.resolve("audio"),
    filename = path.resolve(audioRoot, cue.file);
  if (!filename.startsWith(audioRoot + path.sep))
    throw Error(`Audio for ${id} must be inside audio/`);
  const mime = {
    ".ogg": "audio/ogg",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
  }[path.extname(filename).toLowerCase()];
  if (!mime) throw Error(`Unsupported audio file for ${id}`);
  clips[id] =
    `data:${mime};base64,${(await readFile(filename)).toString("base64")}`;
}
const result = await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  format: "iife",
  target: ["chrome90", "safari15"],
  minify: true,
  write: false,
  legalComments: "inline",
  define: { __VOICE_CLIPS__: JSON.stringify(clips) },
});
const template = await readFile("src/index.html", "utf8"),
  css = await readFile("src/style.css", "utf8"),
  license = await readFile("node_modules/three/LICENSE", "utf8");
const js = result.outputFiles[0].text.replaceAll("</script", "<\\/script");
const html = template
  .replace("/* STYLES */", css)
  .replace("/* GAME */", () => js)
  .replace(
    "<body>",
    () => `<body>\n<!-- Included Three.js license:\n${license}\n-->`,
  );
await writeFile("../BlockWorld_Neighborhood_04.html", html);
console.log(
  `Built standalone offline HTML: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KiB. No runtime dependencies.`,
);
