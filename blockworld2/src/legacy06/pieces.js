import * as T from "three";
// The preview and placed object share these exact original model parts.
export const PARTS = {
  flowers: [
    [0.5, 0.16, 0.5, 0.6, 0.32, 0.6, 0xb47a50],
    [0.5, 0.48, 0.5, 0.06, 0.64, 0.06, 0x568859],
    [0.5, 0.78, 0.5, 0.46, 0.18, 0.46, 0xdd9b83],
    [0.5, 0.89, 0.5, 0.18, 0.06, 0.18, 0xf5d47b],
  ],
  lantern: [
    [0.5, 0.06, 0.5, 0.55, 0.12, 0.55, 0x5f746e],
    [0.5, 0.46, 0.5, 0.4, 0.7, 0.4, 0xf6ce73],
    [0.5, 0.87, 0.5, 0.6, 0.12, 0.6, 0x5f746e],
    ...[0.27, 0.73].flatMap((x) =>
      [0.27, 0.73].map((z) => [x, 0.46, z, 0.06, 0.75, 0.06, 0x5f746e]),
    ),
  ],
  bench: [
    [0.5, 0.47, 0.5, 0.94, 0.12, 0.64, 0xad7c50],
    [0.5, 0.77, 0.77, 0.94, 0.4, 0.1, 0xad7c50],
    ...[0.12, 0.88].flatMap((x) =>
      [0.25, 0.72].map((z) => [x, 0.22, z, 0.1, 0.44, 0.1, 0x66766a]),
    ),
  ],
};
export function detailedPiece(b, geometry, material) {
  const group = new T.Group();
  group.position.set(b.x + 0.5, b.y, b.z + 0.5);
  group.rotation.y = ((b.rotation || 0) * Math.PI) / 180;
  for (const [x, y, z, w, h, d, c] of PARTS[b.type]) {
    const mesh = new T.Mesh(geometry, material(c));
    mesh.position.set(x - 0.5, y, z - 0.5);
    mesh.scale.set(w, h, d);
    mesh.userData.block = b;
    group.add(mesh);
  }
  return group;
}
