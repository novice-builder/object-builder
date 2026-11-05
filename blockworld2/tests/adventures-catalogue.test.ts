import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { BUILD_CHOICES } from "../src/adventures/catalogue";
test("every offered catalogue asset has a real, current PNG render matching its licensed source", () => {
  const manifest = JSON.parse(
    readFileSync(
      new URL("../public/adventures/thumbnails/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const inventory = JSON.parse(
    readFileSync(
      new URL("../public/adventures/inventory.json", import.meta.url),
      "utf8",
    ),
  );
  for (const item of BUILD_CHOICES) {
    const entry = manifest.entries.find((e: any) => e.asset === item.id);
    assert.ok(entry, item.id);
    assert.equal(
      entry.sourceModelSha256,
      inventory.find((a: any) => a.id === item.id).sha256,
    );
    const png = readFileSync(
      new URL("../public/adventures/thumbnails/" + entry.file, import.meta.url),
    );
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 256);
    assert.equal(png.readUInt32BE(20), 192);
    assert.equal(createHash("sha256").update(png).digest("hex"), entry.sha256);
  }
});
