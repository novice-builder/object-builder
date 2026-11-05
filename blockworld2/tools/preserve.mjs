import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const base = "1ffd35ed971afa7820734cf10a3287ab546f6306";
const files = execFileSync("git", ["ls-tree", "-r", "--name-only", base], {
  cwd: "..",
  encoding: "utf8",
})
  .trim()
  .split("\n");
for (const file of files) {
  const original = execFileSync("git", ["show", `${base}:${file}`], {
    cwd: "..",
    maxBuffer: 20 * 1024 * 1024,
  });
  const current = await readFile("../" + file);
  if (!original.equals(current))
    throw Error(`Protected artifact changed: ${file}`);
}
const changed = execFileSync("git", ["diff", "--name-only", base], {
  cwd: "..",
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);
if (changed.some((p) => !p.startsWith("blockworld2/")))
  throw Error("Changes outside blockworld2/");
const run1 = "645dd904ed947620ab1a9a4f243f3e80b6f81385";
const archives = execFileSync(
  "git",
  ["ls-tree", "-r", "--name-only", run1, "--", "blockworld2/artifacts"],
  { cwd: "..", encoding: "utf8" },
)
  .trim()
  .split("\n");
for (const file of archives) {
  const original = execFileSync("git", ["show", `${run1}:${file}`], {
    cwd: "..",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (!original.equals(await readFile("../" + file)))
    throw Error(`Historical archive changed: ${file}`);
}
console.log(
  `PASS: ${files.length} existing files match ${base}; ${archives.length} historical archive files intact; package-only changes`,
);
