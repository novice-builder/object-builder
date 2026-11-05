import type { Obstacle } from "./landscape";
export interface PlacementGround {
  inside: (x: number, z: number) => boolean;
  water: (x: number, z: number) => boolean;
  path: (x: number, z: number) => boolean;
  height: (x: number, z: number) => number;
}
/** Cover the footprint, not only its centre; sub-path-width spacing catches narrow lanes. */
export function footprintGroundProblem(
  body: Obstacle,
  baseY: number,
  ground: PlacementGround,
) {
  const nx = Math.max(1, Math.ceil((body.maxX - body.minX) / 1.2)),
    nz = Math.max(1, Math.ceil((body.maxZ - body.minZ) / 1.2));
  for (let i = 0; i <= nx; i++)
    for (let j = 0; j <= nz; j++) {
      const x = body.minX + ((body.maxX - body.minX) * i) / nx,
        z = body.minZ + ((body.maxZ - body.minZ) * j) / nz;
      if (!ground.inside(x, z))
        return "Keep the whole object inside the explored landscape";
      if (ground.water(x, z)) return "Keep the water clear";
      if (ground.path(x, z)) return "Keep paths and entrances clear";
      if (Math.abs(ground.height(x, z) - baseY) > 0.45)
        return "Choose flatter ground for this object";
    }
  return null;
}
