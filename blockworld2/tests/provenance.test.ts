import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
test("migrated mechanics remain byte-identical to the audited upstream source", async () => {
  const record = JSON.parse(
    await readFile(
      new URL("../docs/LEGACY-SOURCES.json", import.meta.url),
      "utf8",
    ),
  );
  for (const [file, hash] of Object.entries(record.files)) {
    const bytes = await readFile(
      new URL("../src/legacy06/" + file, import.meta.url),
    );
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash, file);
  }
});
test("active collision fork contains only the audited elevated-ramp changes", async () => {
  const read = (file: string) =>
    readFile(new URL(file, import.meta.url), "utf8");
  const original = await read("../src/legacy06/core.js");
  const expected =
    "// Audited 06 collision fork: only import paths and explicit ramp base height differ.\n" +
    original
      .replace('from "./world-config.js"', 'from "../legacy06/world-config.js"')
      .replace('from "./spatial.js"', 'from "../legacy06/spatial.js"')
      .replace(
        "return clamp((r.length / 2 - lz) / r.length, 0, 1) * r.rise;",
        "return (r.baseY || 0) + clamp((r.length / 2 - lz) / r.length, 0, 1) * r.rise;",
      )
      .replace(
        "previous !== null || p.y < 0.1 || Math.abs(p.y - b.maxY) < 0.1",
        "previous !== null || Math.abs(p.y - (b.ramp.baseY || 0)) < 0.1 || Math.abs(p.y - b.maxY) < 0.1",
      );
  assert.equal(await read("../src/player/physics.js"), expected);
});
