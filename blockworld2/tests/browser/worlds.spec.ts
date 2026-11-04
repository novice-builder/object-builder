import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function ready(page: any) {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
}
test("storage failure retains unsaved blocks and a downloadable backup", async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(async () => {
    const a = (window as any).bw2;
    await a.session.newWorld("blank");
    a.session.store.db.close();
    a.add({ x: 4, y: 0, z: 0, type: "wood" });
  });
  await expect(page.locator("#saveAlert")).toBeVisible();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(1);
  const event = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export unsaved work", exact: true })
    .click();
  const file = await event,
    data = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(JSON.parse(data.checkpoint.json).world.blocks.length).toBe(1);
});
test("independent instances, rename and duplicate survive switching and reload", async ({
  page,
}) => {
  await ready(page);
  const original = await page.evaluate(
    () => (window as any).bw2.session.current.id,
  );
  await page.locator("#worlds").tap();
  await page.locator("[data-template=blank]").tap();
  await expect(page.locator("#modal")).toBeHidden();
  const id = await page.evaluate(() => (window as any).bw2.session.current.id);
  expect(id).not.toBe(original);
  await page.evaluate(async () => {
    const a = (window as any).bw2;
    a.add({ x: 3, y: 0, z: 0, type: "wood" });
    await a.session.save();
  });
  await page.locator("#worlds").tap();
  const row = page
    .locator(".worldRow")
    .filter({ has: page.locator(`[data-world="${id}"]`) });
  await row.locator("input").fill("My garden");
  await row.getByRole("button", { name: "Rename", exact: false }).tap();
  await page
    .getByRole("button", { name: "Duplicate My garden", exact: true })
    .tap();
  await expect(page.locator(".worldRow")).toHaveCount(3);
  await page.locator(`[data-world="${original}"]`).tap();
  await expect(page.locator("#modal")).toBeHidden();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(0);
  await page.locator("#worlds").tap();
  await page.locator(`[data-world="${id}"]`).tap();
  await expect(page.locator("#modal")).toBeHidden();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(1);
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.session.current.name),
  ).toBe("My garden");
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(1);
});
test("real backup download and file-input restore create a separate instance", async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(async () => {
    const a = (window as any).bw2;
    await a.session.newWorld("blank");
    a.add({ x: 4, y: 0, z: 0, type: "bench", rotation: 90 });
    await a.session.save();
  });
  const before = await page.evaluate(
    () => (window as any).bw2.session.current.id,
  );
  await page.locator("#worlds").tap();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export").tap();
  const download = await downloadPromise,
    bytes = await readFile((await download.path())!);
  await page
    .locator("#import")
    .setInputFiles({
      name: "backup.bw2",
      mimeType: "application/json",
      buffer: bytes,
    });
  await expect(page.locator("#modal")).toBeHidden();
  expect(
    await page.evaluate(() => (window as any).bw2.session.current.id),
  ).not.toBe(before);
  expect(
    await page.evaluate(
      () => (window as any).bw2.snapshot().blocks[0].rotation,
    ),
  ).toBe(90);
  await page.locator("#worlds").tap();
  const current = await page.evaluate(
    () => (window as any).bw2.session.current.id,
  );
  await page
    .locator("#import")
    .setInputFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from("{broken"),
    });
  await expect(page.locator("#worldError")).not.toBeEmpty();
  expect(
    await page.evaluate(() => (window as any).bw2.session.current.id),
  ).toBe(current);
});
test("conflicting tabs retain unsaved work and offer a recoverable copy", async ({
  page,
  context,
}) => {
  await ready(page);
  await page.evaluate(() => (window as any).bw2.session.newWorld("blank"));
  const second = await context.newPage();
  await ready(second);
  await page.evaluate(async () => {
    const a = (window as any).bw2;
    a.add({ x: 4, y: 0, z: 0, type: "wood" });
    await a.session.save();
  });
  await second.evaluate(() =>
    (window as any).bw2.add({ x: 5, y: 0, z: 0, type: "brick" }),
  );
  await expect(second.locator("#saveAlert")).toBeVisible();
  expect(
    await second.evaluate(() => (window as any).bw2.snapshot().blocks[0].type),
  ).toBe("brick");
  await second
    .getByRole("button", { name: "Save as new copy", exact: true })
    .click();
  await expect(second.locator("#saveAlert")).toHaveCount(0);
  expect(
    await second.evaluate(() => (window as any).bw2.session.current.name),
  ).toContain("recovered");
  expect(
    await page.evaluate(async () => {
      const a = (window as any).bw2;
      return (await a.session.store.load(a.session.current.id)).snapshot.world
        .blocks[0].type;
    }),
  ).toBe("wood");
});
