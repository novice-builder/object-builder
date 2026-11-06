import { test } from "node:test";
import assert from "node:assert/strict";
import { adventureCopyName } from "../src/adventures/copy-name";
test("long copy names retain visible suffixes and unique counters inside the actual store limit", () => {
  const used = new Set<string>(["L".repeat(60)]),
    names = [];
  for (let i = 0; i < 15; i++) {
    const n = adventureCopyName("L".repeat(60), "updated adventure", used);
    assert.ok(n.length <= 60 && n.includes(" · updated adventure"));
    assert.ok(!used.has(n));
    used.add(n);
    names.push(n);
  }
  assert.ok(names[1].endsWith(" 2") && names[14].endsWith(" 15"));
  assert.equal(
    adventureCopyName("Willow Vale", "interiors", new Set()),
    "Willow Vale · interiors",
  );
});
test("bounded copy prefixes do not split an emoji or erase the recovery label", () => {
  const used = new Set<string>();
  for (let i = 0; i < 12; i++) {
    const n = adventureCopyName("🏰".repeat(30), "recovered", used);
    used.add(n);
    assert.ok(n.length <= 60 && n.includes(" · recovered"));
    assert.ok(
      [...n].every(
        (c) =>
          c.length === 2 ||
          c.charCodeAt(0) < 0xd800 ||
          c.charCodeAt(0) > 0xdfff,
      ),
    );
  }
});
