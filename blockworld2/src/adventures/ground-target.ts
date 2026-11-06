interface Point {
  x: number;
  y: number;
  z: number;
}
/** First supported ground/floor hit along a normalised picking ray; no scene mesh traversal. */
export function groundTarget(
  origin: Point,
  direction: Point,
  height: (x: number, z: number) => number,
  maxDistance = 80,
): Point | null {
  if (
    ![
      origin.x,
      origin.y,
      origin.z,
      direction.x,
      direction.y,
      direction.z,
      maxDistance,
    ].every(Number.isFinite) ||
    direction.y >= -0.001 ||
    maxDistance <= 0
  )
    return null;
  if (origin.y < height(origin.x, origin.z)) return null;
  for (let distance = 0.5; distance <= maxDistance; distance += 0.5) {
    const x = origin.x + direction.x * distance,
      y = origin.y + direction.y * distance,
      z = origin.z + direction.z * distance;
    if (y > height(x, z)) continue;
    let low = distance - 0.5,
      high = distance;
    for (let i = 0; i < 12; i++) {
      const middle = (low + high) / 2,
        mx = origin.x + direction.x * middle,
        mz = origin.z + direction.z * middle;
      if (origin.y + direction.y * middle > height(mx, mz)) low = middle;
      else high = middle;
    }
    const hitX = origin.x + direction.x * high,
      hitZ = origin.z + direction.z * high;
    return { x: hitX, y: height(hitX, hitZ), z: hitZ };
  }
  return null;
}
