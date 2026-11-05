export interface Point {
  x: number;
  z: number;
}
/** Bounded four-neighbour A*: short local detours, never a teleport or global nav mesh. */
export function findDetour(
  start: Point,
  target: Point,
  blocked: (x: number, z: number) => boolean,
  budget = 160,
): Point[] | null {
  const sx = Math.round(start.x),
    sz = Math.round(start.z),
    distance = Math.hypot(target.x - start.x, target.z - start.z);
  const end = {
    x: Math.round(
      start.x +
        (target.x - start.x) * Math.min(1, 12 / Math.max(distance, 0.01)),
    ),
    z: Math.round(
      start.z +
        (target.z - start.z) * Math.min(1, 12 / Math.max(distance, 0.01)),
    ),
  };
  const key = (x: number, z: number) => `${x},${z}`;
  const open = [{ x: sx, z: sz, g: 0 }],
    cost = new Map([[key(sx, sz), 0]]),
    parent = new Map<string, Point>();
  let count = 0;
  while (open.length && count++ < budget) {
    open.sort(
      (a, b) =>
        a.g +
        Math.abs(a.x - end.x) +
        Math.abs(a.z - end.z) -
        (b.g + Math.abs(b.x - end.x) + Math.abs(b.z - end.z)),
    );
    const p = open.shift()!;
    if (p.x === end.x && p.z === end.z) {
      const path: Point[] = [end];
      let at = key(p.x, p.z);
      while (parent.has(at)) {
        const prev = parent.get(at)!;
        path.push(prev);
        at = key(prev.x, prev.z);
      }
      path.reverse();
      path.shift();
      return path.length ? path : null;
    }
    for (const [dx, dz] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const x = p.x + dx,
        z = p.z + dz,
        g = p.g + 1;
      if (
        Math.abs(x - sx) > 14 ||
        Math.abs(z - sz) > 14 ||
        g > 28 ||
        (cost.get(key(x, z)) ?? Infinity) <= g ||
        blocked(x, z) ||
        blocked((x + p.x) / 2, (z + p.z) / 2)
      )
        continue;
      cost.set(key(x, z), g);
      parent.set(key(x, z), p);
      open.push({ x, z, g });
    }
  }
  return null;
}
