import type { CollisionSpace, FootPose } from "./mesh-collision";
/** Airborne saves resume on actual clear support, keeping the previous landing across a stair void. */
export function checkpointFooting(
  p: FootPose,
  space: CollisionSpace,
  fallback?: FootPose,
): FootPose | null {
  if (space.valid(p.x, p.z) && space.supported(p) && space.clear(p))
    return { ...p };
  for (const origin of fallback ? [p, fallback] : [p]) {
    if (!space.valid(origin.x, origin.z)) continue;
    const floor = space.floor(
      origin.x,
      origin.z,
      origin.y + 0.004,
      origin.y - 1.6,
    );
    if (!floor) continue;
    const candidate = { x: origin.x, y: floor.y + 0.002, z: origin.z };
    if (space.clear(candidate)) return candidate;
  }
  return null;
}
