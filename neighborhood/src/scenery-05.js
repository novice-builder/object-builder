import * as T from "three";
import { OUTER_PONDS, OUTER_LANDMARKS } from "./expansion-05.js";
import { distanceToLine } from "./districts.js";
export function makeOuterScenery({
  scene,
  box,
  material,
  bench,
  disk,
  roads,
  trails,
  drives,
  houses,
  clearings,
  treeAllowed,
  treePositions,
}) {
  const wood = 0x946647,
    cream = 0xfff5d9;
  // Three distinct gathering spaces, not repeated housing layouts.
  box(-8, 0.006, -197, 70, 0.012, 18, 0xd7c8a9);
  for (const x of [-32, -8, 16]) {
    box(x, 0.25, -205.5, 3, 0.5, 3, 0xb5ad96, true);
    box(x, 0.54, -205.5, 2.6, 0.08, 2.6, 0x6b9d67);
    bench(x === -8 ? -16 : x, -190, 0);
  }
  // A pergola in the north square, with an unobstructed walking aisle.
  for (const x of [-5, 5])
    for (const z of [-204, -199]) box(x, 1.5, z, 0.18, 3, 0.18, wood, true);
  for (const z of [-204, -199]) box(0, 2.98, z, 10.4, 0.18, 0.22, wood, true);
  for (let x = -5; x <= 5; x += 1) box(x, 3.08, -201.5, 0.15, 0.16, 6, wood);
  // Makers garden: raised beds, a timber trellis and a communal courtyard.
  box(188, 0.006, -103, 14, 0.012, 21, 0xd7c8a9);
  for (const z of [-116, -104, -92]) bench(187, z, Math.PI / 2);
  for (const x of [199, 203, 207, 211])
    for (const z of [-27, -34]) {
      box(x, 0.2, z, 2.5, 0.4, 4, wood, true);
      box(x, 0.43, z, 2.2, 0.06, 3.7, 0x6b9d67);
      for (let i = 0; i < 4; i++)
        box(
          x,
          0.65,
          z - 1.2 + i * 0.8,
          0.4,
          0.38,
          0.4,
          i % 2 ? 0xe6b073 : 0xe0bbbc,
        );
    }
  // Pond water is deliberately decorative/shallow, retaining approved flat physics.
  for (const p of OUTER_PONDS) {
    disk(p.x, p.z, p.rx + 1.6, p.rz + 1.6, 0xd7c8a9, 0.008);
    disk(p.x, p.z, p.rx, p.rz, 0x72aebc, 0.026);
    for (let i = 0; i < 30; i++) {
      const a = (i * Math.PI * 2) / 30,
        x = p.x + Math.cos(a) * (p.rx + 0.7),
        z = p.z + Math.sin(a) * (p.rz + 0.7);
      if (Math.abs(x - p.x) < 2) continue;
      box(x, 0.4, z, 0.055, 0.8, 0.055, 0x538857);
      box(x, 0.85, z, 0.11, 0.18, 0.11, wood);
    }
  }
  // Farm courtyard, crop rows and orchard crescent, all outside the preserved core.
  box(-18, 0.006, 200, 20, 0.012, 9, 0xd7c8a9);
  for (const x of [-76, -70, -64])
    for (let z = 216; z <= 234; z += 2) {
      box(x, 0.12, z, 3, 0.24, 1.6, 0x946647);
      box(x, 0.38, z, 2.6, 0.3, 1.3, z % 4 ? 0x6b9d67 : 0xe6b073);
    }
  const treeSpots = [];
  for (let i = 0; i < 20; i++) {
    const a = i * 0.56;
    treeSpots.push({
      x: -110 + Math.cos(a) * (9 + Math.floor(i / 7) * 4),
      z: 232 + Math.sin(a) * (7 + Math.floor(i / 7) * 2),
      fruit: true,
    });
  }
  const groves = [
    [-210, -190, 26, 29],
    [-71, -225, 26, 10],
    [181, -185, 44, 24],
    [-214, 111, 19, 34],
    [66, 232, 43, 10],
    [220, 164, 17, 32],
    [-220, 214, 14, 22],
  ];
  let seed = 19052;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const blocked = (x, z) => {
    if (Math.abs(x) < 128 && Math.abs(z) < 128) return true;
    if (
      houses.some((h) => {
        const c = Math.abs(Math.cos(h.angle)),
          s = Math.abs(Math.sin(h.angle));
        return (
          Math.abs(x - h.x) < (h.w * c + h.d * s) / 2 + 10 &&
          Math.abs(z - h.z) < (h.w * s + h.d * c) / 2 + 10
        );
      })
    )
      return true;
    if (
      [...roads, ...trails].some((l) => distanceToLine(x, z, l).distance < 5.3)
    )
      return true;
    if (drives.some((d) => distanceToLine(x, z, d.points).distance < 4))
      return true;
    if (
      clearings.some(
        (f) =>
          Math.abs(x - f.x) < f.w / 2 + 4 && Math.abs(z - f.z) < f.d / 2 + 4,
      )
    )
      return true;
    if (
      OUTER_PONDS.some(
        (p) =>
          ((x - p.x) / (p.rx + 5)) ** 2 + ((z - p.z) / (p.rz + 5)) ** 2 < 1,
      )
    )
      return true;
    if (
      OUTER_LANDMARKS.some(
        (l) =>
          Math.hypot(x - (l.signX ?? l.x + 4), z - (l.signZ ?? l.z + 4)) < 5,
      )
    )
      return true;
    if (
      (Math.abs(x - 197) < 18 && Math.abs(z - 84) < 15) ||
      (Math.abs(x + 8) < 39 && Math.abs(z + 197) < 14)
    )
      return true;
    if (x > -85 && x < -55 && z > 208) return true;
    return false;
  };
  for (let i = 0; i < 2100; i++) {
    const g = groves[i % groves.length],
      a = random() * Math.PI * 2,
      r = Math.sqrt(random()),
      x = g[0] + Math.cos(a) * g[2] * r,
      z = g[1] + Math.sin(a) * g[3] * r;
    if (
      blocked(x, z) ||
      treeSpots.some((p) => Math.hypot(x - p.x, z - p.z) < 4.1)
    )
      continue;
    treeSpots.push({ x, z });
  }
  // Roadside groups provide continuity between groves without uniform scatter.
  for (const [x, z] of [
    [-223, -73],
    [-143, 12],
    [-205, 76],
    [-143, 82],
    [91, -202],
    [120, -169],
    [199, -8],
    [178, 123],
    [113, 222],
    [-50, 235],
    [-231, 159],
  ])
    for (const [dx, dz] of [
      [0, 0],
      [5, 4],
      [-4, 6],
    ])
      if (!blocked(x + dx, z + dz)) treeSpots.push({ x: x + dx, z: z + dz });
  for (const [i, p] of treeSpots.entries()) {
    if (!treeAllowed(p.x, p.z)) continue;
    treePositions.push({ x: p.x, z: p.z });
    const height = p.fruit ? 2.2 : 2.8 + (i % 4) * 0.4;
    box(p.x, height / 2, p.z, 0.4, height, 0.4, wood, true);
    const conifer = !p.fruit && i % 3 === 0,
      g = conifer
        ? new T.ConeGeometry(2.2, 4.8, 7)
        : new T.IcosahedronGeometry(1, 1);
    if (!conifer) g.scale(2.2, 2.05, 2.2);
    const m = new T.Mesh(
      g,
      material(conifer ? 0x4d8d68 : i % 2 ? 0x6b9d67 : 0x5a8b62),
    );
    m.position.set(p.x, height + 0.7, p.z);
    scene.add(m);
    if (p.fruit)
      for (const dx of [-1, 1])
        box(p.x + dx, height + 0.5, p.z + 0.4, 0.22, 0.22, 0.22, 0xc78264);
  }
  return {
    trees: treeSpots.length,
    groves: groves.length,
    ponds: OUTER_PONDS.length,
  };
}
