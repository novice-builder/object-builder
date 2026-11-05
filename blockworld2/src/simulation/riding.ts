import { overlaps } from "../player/physics.js";
import { safeGround } from "../world/spawn";
export interface HorsePose {
  x: number;
  z: number;
  yaw: number;
}
/** Whole horse footprint, including nose/tail; mounted clearance includes the rider. */
export function horseBox(p: HorsePose, mounted = false) {
  const c = Math.cos(p.yaw),
    s = Math.sin(p.yaw),
    w = Math.abs(c) * 0.46 + Math.abs(s) * 1.02,
    d = Math.abs(s) * 0.46 + Math.abs(c) * 1.02;
  return {
    minX: p.x - w,
    maxX: p.x + w,
    minZ: p.z - d,
    maxZ: p.z + d,
    minY: 0.001,
    maxY: mounted ? 2.55 : 2.05,
    obb: { cx: p.x, cz: p.z, c, s, halfW: 0.46, halfD: 1.02 },
  };
}
export function rideStep(
  p: HorsePose,
  input: { forward: number; right: number },
  dt: number,
  solids: any[],
  limit = 238,
) {
  let next = { ...p };
  for (let i = 0, n = Math.max(1, Math.ceil(dt / 0.016)); i < n; i++) {
    const step = dt / n,
      candidate = {
        ...next,
        yaw:
          next.yaw - input.right * step * 1.55 * Math.sign(input.forward || 1),
      };
    const speed = input.forward * (input.forward < 0 ? 2 : 5.2);
    candidate.x -= Math.sin(candidate.yaw) * speed * step;
    candidate.z -= Math.cos(candidate.yaw) * speed * step;
    if (
      Math.abs(candidate.x) < limit - 1.1 &&
      Math.abs(candidate.z) < limit - 1.1 &&
      !solids.some((s) => overlaps(horseBox(candidate, true), s))
    )
      next = candidate;
  }
  return next;
}
export function dismountPose(p: HorsePose, solids: any[]) {
  return safeGround(
    {
      x: p.x + Math.cos(p.yaw) * 1.65,
      z: p.z - Math.sin(p.yaw) * 1.65,
      yaw: p.yaw,
    },
    [...solids, horseBox(p, true)],
  );
}
