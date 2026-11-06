import type { MapDestination, MapTransform } from "./map-data";
export interface MapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface MapTarget {
  destination: MapDestination;
  x: number;
  y: number;
  label: MapRect & { font: string; lines: string[]; lineHeight: number };
}
const contains = (r: MapRect, x: number, y: number) =>
  x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
const overlaps = (a: MapRect, b: MapRect, pad = 0) =>
  a.x < b.x + b.width + pad &&
  a.x + a.width > b.x - pad &&
  a.y < b.y + b.height + pad &&
  a.y + a.height > b.y - pad;
/** One layout is shared by painted text and picking, in CSS pixels at every device pixel ratio. */
export function layoutMapTargets(
  destinations: readonly MapDestination[],
  transform: MapTransform,
  width: number,
  height: number,
  measure: (text: string, font: string) => number,
): MapTarget[] {
  const small = width < 500 && transform.scale < 1.8,
    font = small ? "600 11px system-ui" : "600 13px system-ui",
    lineHeight = small ? 13 : 16;
  const points = destinations
    .map((destination) => ({
      destination,
      ...transform.screen(destination.x, destination.z),
    }))
    .filter((p) => p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height);
  const targets: MapTarget[] = [];
  for (const p of points) {
    const name = p.destination.name,
      split = name.indexOf(" "),
      lines =
        small && split > 0
          ? [name.slice(0, split), name.slice(split + 1)]
          : [name];
    const w = Math.min(
        width - 8,
        Math.max(...lines.map((line) => measure(line, font))) + 10,
      ),
      h = lines.length * lineHeight + 8;
    const options = [
      { x: p.x - w / 2, y: p.y - 15 - h },
      { x: p.x - w / 2, y: p.y + 15 },
      { x: p.x - 15 - w, y: p.y - h / 2 },
      { x: p.x + 15, y: p.y - h / 2 },
    ];
    let best = options[0],
      score = Infinity;
    for (let i = 0; i < options.length; i++) {
      const r = {
        x: Math.max(4, Math.min(width - w - 4, options[i].x)),
        y: Math.max(4, Math.min(height - h - 4, options[i].y)),
        width: w,
        height: h,
      };
      const conflicts = targets.filter((t) => overlaps(r, t.label, 3)).length;
      const markerConflicts = points.filter(
        (o) =>
          o !== p &&
          overlaps(r, { x: o.x - 9, y: o.y - 9, width: 18, height: 18 }),
      ).length;
      const cost =
        conflicts * 1_000_000 +
        markerConflicts * 10_000 +
        i * 10 +
        Math.hypot(r.x - options[i].x, r.y - options[i].y);
      if (cost < score) {
        best = r;
        score = cost;
      }
    }
    targets.push({
      ...p,
      label: { ...best, width: w, height: h, font, lines, lineHeight },
    });
  }
  return targets;
}
/** Prefer visible ink, then generous marker/label bounds; clipped canvas space is never actionable. */
export function pickMapDestination(
  targets: readonly MapTarget[],
  x: number,
  y: number,
  width: number,
  height: number,
): MapDestination | undefined {
  if (x < 0 || y < 0 || x > width || y > height) return;
  const nearest = (items: readonly MapTarget[], label = false) =>
    [...items].sort((a, b) => {
      const distance = (t: MapTarget) =>
        label
          ? Math.hypot(
              t.label.x + t.label.width / 2 - x,
              t.label.y + t.label.height / 2 - y,
            )
          : Math.hypot(t.x - x, t.y - y);
      return distance(a) - distance(b);
    })[0]?.destination;
  return (
    nearest(targets.filter((t) => Math.hypot(t.x - x, t.y - y) <= 9)) ||
    nearest(
      targets.filter((t) => contains(t.label, x, y)),
      true,
    ) ||
    nearest(targets.filter((t) => Math.hypot(t.x - x, t.y - y) <= 25)) ||
    nearest(
      targets.filter((t) => {
        const r = t.label,
          w = Math.max(44, r.width + 8),
          h = Math.max(44, r.height + 8);
        return contains(
          {
            x: r.x - (w - r.width) / 2,
            y: r.y - (h - r.height) / 2,
            width: w,
            height: h,
          },
          x,
          y,
        );
      }),
      true,
    )
  );
}
