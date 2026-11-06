import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readPreferences,
  writePreferences,
  PREFERENCES_KEY,
} from "../src/adventures/preferences";
test("control preferences survive a reload in their own key", () => {
  const entries = new Map<string, string>([
    ["legacy-neighborhood", "retained"],
  ]);
  const storage = {
    getItem: (k: string) => entries.get(k) || null,
    setItem: (k: string, v: string) => {
      entries.set(k, v);
    },
  };
  assert.equal(
    writePreferences(storage, { quality: "high", running: true }),
    true,
  );
  assert.deepEqual(readPreferences(storage), {
    quality: "high",
    running: true,
  });
  assert.equal(entries.get("legacy-neighborhood"), "retained");
  assert.ok(entries.has(PREFERENCES_KEY));
  assert.equal(entries.size, 2);
});
test("invalid preferences and denied browser storage fall back without blocking play", () => {
  for (const raw of [
    "{oops",
    "null",
    "[]",
    '{"quality":"impossible","running":1}',
  ])
    assert.deepEqual(readPreferences({ getItem: () => raw }), {
      quality: "balanced",
      running: false,
    });
  assert.deepEqual(
    readPreferences({
      getItem: () => {
        throw Error("SecurityError");
      },
    }),
    { quality: "balanced", running: false },
  );
  assert.equal(
    writePreferences(
      {
        setItem: () => {
          throw Error("QuotaExceededError");
        },
      },
      { quality: "gentle", running: false },
    ),
    false,
  );
  assert.deepEqual(readPreferences(null), {
    quality: "balanced",
    running: false,
  });
});
test("first-use coarse pointers choose Gentle without changing fine-pointer defaults", () => {
  for (const storage of [
    null,
    { getItem: () => "{bad" },
    {
      getItem: () => {
        throw Error("Denied");
      },
    },
  ]) {
    assert.deepEqual(readPreferences(storage, true), {
      quality: "gentle",
      running: false,
    });
    assert.deepEqual(readPreferences(storage, false), {
      quality: "balanced",
      running: false,
    });
  }
});
test("explicit saved graphics choices override pointer defaults and retain running", () => {
  for (const quality of ["gentle", "balanced", "high"] as const) {
    const raw = JSON.stringify({ quality, running: true }),
      storage = { getItem: () => raw };
    assert.deepEqual(readPreferences(storage, true), {
      quality,
      running: true,
    });
    assert.deepEqual(readPreferences(storage, false), {
      quality,
      running: true,
    });
  }
  assert.deepEqual(
    readPreferences(
      { getItem: () => '{"quality":"invalid","running":true}' },
      true,
    ),
    { quality: "gentle", running: true },
  );
});
