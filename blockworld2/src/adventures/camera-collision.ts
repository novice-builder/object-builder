import type { Obstacle } from "./landscape";
interface Point {
  x: number;
  y: number;
  z: number;
}
/** Ray parameter in metres for a normalised direction; no per-body vector/box allocation. */
export function rayBoxDistance(
  origin: Point,
  direction: Point,
  body: Obstacle,
  padding = 0.18,
) {
  let near = -Infinity,
    far = Infinity;
  for (let axis = 0; axis < 3; axis++) {
    const p = axis === 0 ? origin.x : axis === 1 ? origin.y : origin.z;
    const d = axis === 0 ? direction.x : axis === 1 ? direction.y : direction.z;
    const min =
      axis === 0
        ? body.minX - padding
        : axis === 1
          ? (body.base ?? -3)
          : body.minZ - padding;
    const max =
      axis === 0
        ? body.maxX + padding
        : axis === 1
          ? body.height + padding
          : body.maxZ + padding;
    if (Math.abs(d) < 1e-12) {
      if (p < min || p > max) return Infinity;
      continue;
    }
    let a = (min - p) / d,
      b = (max - p) / d;
    if (a > b) {
      const swap = a;
      a = b;
      b = swap;
    }
    near = Math.max(near, a);
    far = Math.min(far, b);
    if (near > far) return Infinity;
  }
  return far < 0 ? Infinity : near >= 0 ? near : far;
}
export function cameraFraction(
  target: Point,
  offset: Point,
  bodies: readonly Obstacle[],
) {
  const distance = Math.hypot(offset.x, offset.y, offset.z);
  if (!distance) return 1;
  const direction = {
    x: offset.x / distance,
    y: offset.y / distance,
    z: offset.z / distance,
  };
  let fraction = 1;
  for (const b of bodies) {
    if (
      b.height < target.y - 0.5 ||
      b.minX > target.x + distance ||
      b.maxX < target.x - distance ||
      b.minZ > target.z + distance ||
      b.maxZ < target.z - distance
    )
      continue;
    const hit = rayBoxDistance(target, direction, b),
      f = hit / distance;
    if (f < 1) {
      // A minimum camera radius must never push the camera through a nearby wall.
      const clearance = Math.min(distance * 0.04, hit * 0.5);
      fraction = Math.min(fraction, Math.max(0, (hit - clearance) / distance));
    }
  }
  return fraction;
}
