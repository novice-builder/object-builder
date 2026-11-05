/** Shared world coordinates used by terrain, walking, navigation and maps. */
export const VALE_BOUNDS = { minX: -185, maxX: 185, minZ: -98, maxZ: 98 };
export const VALE_REGIONS = [
  { id: "village" as const, name: "Willowmere", x: -105, z: 0 },
  { id: "woodland" as const, name: "Whispering Wood", x: 0, z: 0 },
  { id: "meadow" as const, name: "Maker’s Meadow", x: 105, z: 0 },
];
export const valeRivers = (z: number) => [
  -75 + Math.sin(z * 0.055) * 2.5,
  30 + Math.sin(z * 0.055) * 2.5,
];
export function valeGround(x: number, z: number) {
  const edge =
    Math.max(0, Math.abs(z) - 72) / 30 + Math.max(0, Math.abs(x) - 160) / 40;
  let h =
    edge * edge * (2 + Math.sin(x * 0.08) * 0.8 + Math.cos(z * 0.1) * 0.7);
  for (const river of valeRivers(z))
    h -= Math.max(0, 1 - Math.abs(x - river) / 5) * 1.65;
  return h;
}
export function valeWalk(x: number, z: number, layout = 3) {
  if (layout >= 4 && x > 124.7 && x < 131.3 && z > -45.3 && z < -38.7)
    return 0.06;
  for (const river of valeRivers(z))
    if (Math.abs(z - 8) < 2.1 && Math.abs(x - river) < 5)
      return 0.02 + Math.max(0, 1 - Math.abs(x - river) / 5) * 0.4;
  return valeGround(x, z);
}
export function valeWater(x: number, z: number) {
  return (
    Math.abs(z - 8) > 2 && valeRivers(z).some((r) => Math.abs(x - r) < 2.65)
  );
}
export function worldBounds(scene: string) {
  return scene === "vale"
    ? VALE_BOUNDS
    : { minX: -84, maxX: 84, minZ: -84, maxZ: 84 };
}
export function inWorld(x: number, z: number, scene: string, margin = 0) {
  const b = worldBounds(scene);
  return (
    x > b.minX + margin &&
    x < b.maxX - margin &&
    z > b.minZ + margin &&
    z < b.maxZ - margin
  );
}
