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
