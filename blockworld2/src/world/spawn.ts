import { collides, supportHeight } from "../player/physics.js";
/** Seats/play on an upper floor must stand on that floor, never teleport downstairs. */
export function safeStanding(origin: any, solids: any[]) {
  for (let r = 0; r <= 4; r++)
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++) {
        if (r && Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
        const p = {
          ...origin,
          x: origin.x + dx * 0.6,
          z: origin.z + dz * 0.6,
          y: origin.y || 0,
          vy: 0,
          grounded: true,
        };
        if (!collides(p, solids) && supportHeight(p, solids) >= p.y - 0.04)
          return p;
      }
  throw Error("Keep a little space beside the seat");
}
/** Flat-world recovery search. Never select an occupied home/dismount cell. */
export function safeGround(
  origin: { x: number; z: number; yaw?: number },
  solids: any[],
) {
  for (let r = 0; r <= 12; r++)
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++) {
        if (r && Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
        const p = {
          x: origin.x + dx,
          y: 0,
          z: origin.z + dz,
          yaw: origin.yaw || 0,
          pitch: 0,
          vy: 0,
          grounded: true,
        };
        if (Math.abs(p.x) < 249 && Math.abs(p.z) < 249 && !collides(p, solids))
          return p;
      }
  throw Error("No clear arrival space. Your current position is retained.");
}
