import { collides } from "../legacy06/core.js";
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
