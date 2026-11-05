export interface GroundPoint {
  x: number;
  z: number;
}
/** Search around a requested arrival without ever returning an unchecked fallback. */
export function clearArrival(
  origin: GroundPoint,
  clear: (x: number, z: number) => boolean,
  radius = 18,
): GroundPoint | null {
  if (clear(origin.x, origin.z)) return { ...origin };
  for (let r = 0.5; r <= radius; r += 0.5) {
    const samples = Math.ceil((2 * Math.PI * r) / 0.65);
    for (let i = 0; i < samples; i++) {
      const a = (i / samples) * Math.PI * 2,
        x = origin.x + Math.sin(a) * r,
        z = origin.z + Math.cos(a) * r;
      if (clear(x, z)) return { x, z };
    }
  }
  return null;
}
