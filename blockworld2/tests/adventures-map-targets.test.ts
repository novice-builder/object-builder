import { test } from "node:test";
import assert from "node:assert/strict";
import {
  layoutMapTargets,
  pickMapDestination,
} from "../src/adventures/map-targets";
import { MapTransform, createMapData } from "../src/adventures/map-data";
import { worldBounds } from "../src/adventures/vale-data";
const data = createMapData("vale", { paths: [], obstacles: [], landmarks: [] });
const measure = (text: string) => text.length * 6.5;
test("visible map names remain actionable beyond the old marker-only hit radius", () => {
  const transform = new MapTransform(worldBounds("vale"), 1024, 610),
    targets = layoutMapTargets(
      data.destinations,
      transform,
      1024,
      610,
      measure,
    );
  const target = targets.find((t) => t.destination.id === "foresters")!,
    x = target.label.x + 5,
    y = target.label.y + target.label.height / 2;
  assert.ok(Math.hypot(x - target.x, y - target.y) > 25);
  assert.equal(pickMapDestination(targets, x, y, 1024, 610)?.id, "foresters");
});
test("labels stay inside phone/tablet viewports through pan and zoom and match their own hit areas", () => {
  for (const [w, h] of [
    [390, 677],
    [844, 266],
    [1024, 608],
  ])
    for (const zoom of [1, 1.8, 3]) {
      const transform = new MapTransform(worldBounds("vale"), w, h);
      transform.zoom(zoom);
      transform.pan(17, -10);
      for (const target of layoutMapTargets(
        data.destinations,
        transform,
        w,
        h,
        measure,
      )) {
        const r = target.label;
        assert.ok(
          r.x >= 0 && r.y >= 0 && r.x + r.width <= w && r.y + r.height <= h,
        );
        assert.equal(
          pickMapDestination(
            [target],
            r.x + r.width / 2,
            r.y + r.height / 2,
            w,
            h,
          )?.id,
          target.destination.id,
        );
      }
    }
});
test("nearby circles choose the nearest actual destination and off-canvas taps do nothing", () => {
  const transform = new MapTransform(worldBounds("vale"), 1024, 610),
    targets = layoutMapTargets(
      data.destinations,
      transform,
      1024,
      610,
      measure,
    ),
    t = targets[0];
  assert.equal(
    pickMapDestination(targets, t.x, t.y, 1024, 610)?.id,
    t.destination.id,
  );
  assert.equal(pickMapDestination(targets, -1, t.y, 1024, 610), undefined);
  assert.equal(pickMapDestination(targets, 1025, t.y, 1024, 610), undefined);
});
