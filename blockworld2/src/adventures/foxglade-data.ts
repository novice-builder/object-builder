/** Explicit layout 8 only: a woodland cottage and small wildlife clearing, within the same valley. */
export const FOXGLADE = { id: "foxglade", name: "Foxglade", x: -35, z: -11 };
export const FOX = { x: -34, z: -18, yaw: 0, height: 0.62 };
export const FOXGLADE_COTTAGE = {
  asset: "building_home_A_green",
  x: -45,
  z: -18,
  scale: 6.5,
  yaw: Math.PI / 2,
};
export const FOXGLADE_TRAIL = {
  points: [
    [-23, -38],
    [-31, -34],
    [-37, -27],
    [-39, -20],
    [-39, -13],
    [-35, -11],
    [-29, -10],
    [-21, -8],
    [-7, -9],
  ],
  width: 2.4,
};
export const FOXGLADE_GARDENS = [
  [-42, -15],
  [-41, -21],
  [-32, -14],
  [-30, -20],
];
export const foxGladeClearing = (x: number, z: number) =>
  x > -42 && x < -26 && z > -25 && z < -11;
export const foxBody = () => ({
  minX: FOX.x - 0.18,
  maxX: FOX.x + 0.18,
  minZ: FOX.z - 0.18,
  maxZ: FOX.z + 0.46,
  base: 0,
  height: FOX.height,
  name: "wildlife-fox",
});
/** Rotate the torso footprint with the rendered animal; the tail is not a solid wall. */
export function foxBodyAt(
  pose: { x: number; z: number; yaw: number },
  ground = 0,
) {
  const corners = [
    [-0.18, -0.18],
    [-0.18, 0.46],
    [0.18, -0.18],
    [0.18, 0.46],
  ].map(([x, z]) => [
    pose.x + x * Math.cos(pose.yaw) + z * Math.sin(pose.yaw),
    pose.z + z * Math.cos(pose.yaw) - x * Math.sin(pose.yaw),
  ]);
  return {
    minX: Math.min(...corners.map((p) => p[0])),
    maxX: Math.max(...corners.map((p) => p[0])),
    minZ: Math.min(...corners.map((p) => p[1])),
    maxZ: Math.max(...corners.map((p) => p[1])),
    base: ground,
    height: ground + FOX.height,
    name: "wildlife-fox",
  };
}
