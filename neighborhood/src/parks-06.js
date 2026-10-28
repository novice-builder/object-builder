import * as T from "three";
export function makeTownParks({ box, bench, scene, material, reserved }) {
  const wood = 0x946647,
    cream = 0xfff5d9,
    teal = 0x447c80,
    steel = 0x5b7072;
  const picnic = (x, z) => {
    box(x, 0.76, z, 2.5, 0.15, 1.2, wood, true);
    for (const dz of [-0.95, 0.95]) {
      box(x, 0.43, z + dz, 2.5, 0.13, 0.45, wood, true);
      for (const dx of [-0.85, 0.85])
        box(x + dx, 0.22, z + dz, 0.12, 0.44, 0.35, steel, true);
    }
    for (const dx of [-0.8, 0.8])
      box(x + dx, 0.36, z, 0.16, 0.72, 0.9, steel, true);
  };
  const shelter = (x, z) => {
    for (const dx of [-3.3, 3.3])
      for (const dz of [-2.5, 2.5])
        box(x + dx, 1.5, z + dz, 0.18, 3, 0.18, wood, true);
    box(x, 3.08, z, 7.3, 0.18, 5.8, teal, true);
    picnic(x, z);
  };
  // Suburban play garden: path around perimeter, grouped equipment inside.
  box(66, 0.006, 46, 29, 0.012, 29, 0xa7be7f);
  box(67, 0.012, 43, 22, 0.018, 17, 0xe4ce9b);
  // Swings face the seating edge; chains/foliage are passable, posts/seats solid.
  for (const x of [58, 64]) box(x, 1.8, 38, 0.2, 3.6, 0.2, wood, true);
  box(61, 3.55, 38, 6.5, 0.2, 0.22, teal, true);
  for (const x of [60, 62]) {
    for (const dx of [-0.3, 0.3])
      box(x + dx, 2.18, 38, 0.035, 2.4, 0.035, steel);
    box(x, 1, 38, 0.85, 0.15, 0.5, 0xad6c51, true);
  }
  // Climbing frame and recognisable slide, with small ladder rungs.
  for (const dx of [-1, 1])
    for (const dz of [-1, 1])
      box(73 + dx, 1.15, 39 + dz, 0.15, 2.3, 0.15, wood, true);
  box(73, 1.25, 39, 2.2, 0.15, 2.2, teal, true);
  for (const x of [72, 74]) box(x, 2, 38, 0.12, 1.4, 0.12, wood, true);
  box(73, 2.68, 39, 2.6, 0.15, 2.6, teal, true);
  for (let y = 0.22; y < 1.3; y += 0.22)
    box(73, y, 40.1, 1.5, 0.09, 0.18, cream);
  // Low-poly inclined slide deck, correctly oriented down toward its clear runout.
  if (!reserved({ minX: 74, maxX: 79, minZ: 38, maxZ: 40, minY: 0, maxY: 2 })) {
    const g = new T.BufferGeometry();
    g.setAttribute(
      "position",
      new T.Float32BufferAttribute(
        [
          74, 1.32, 38.4, 74, 1.32, 39.6, 77.8, 0.12, 39.6, 74, 1.32, 38.4,
          77.8, 0.12, 39.6, 77.8, 0.12, 38.4,
        ],
        3,
      ),
    );
    g.computeVertexNormals();
    const m = material(0xe6b073).clone();
    m.side = T.DoubleSide;
    scene.add(new T.Mesh(g, m));
  }
  box(60, 0.06, 48, 5, 0.12, 4.2, wood);
  box(60, 0.13, 48, 4.6, 0.14, 3.8, 0xe4ce9b);
  box(69, 0.22, 49, 0.6, 0.44, 1.2, teal, true);
  box(69, 0.5, 49, 4.4, 0.14, 0.5, 0xad6c51, true);
  for (const x of [67.2, 70.8]) {
    box(x, 0.7, 49, 0.1, 0.5, 0.1, cream);
    box(x, 0.79, 49, 0.4, 0.08, 0.08, cream);
  }
  bench(56, 44, -Math.PI / 2);
  bench(61, 55, 0);
  shelter(82, 66);
  // Low boundary rails leave wide entry gaps where paths meet the play garden.
  for (const x of [51, 81])
    for (const z of [40, 49]) {
      box(x, 0.45, z, 0.12, 0.9, 0.12, wood, true);
      box(x, 0.65, z, 0.12, 0.1, 5, wood, true);
    }
  // Lake park: picnic shelter, pond-facing seats and a loop rather than scattered benches.
  shelter(195, 82);
  picnic(204, 91);
  bench(204, 64, 0);
  bench(178, 77, -Math.PI / 2);
  bench(179, 91, -Math.PI / 2);
  for (const x of [190, 202]) {
    box(x, 0.18, 64, 3.5, 0.36, 1.4, 0x5a8b62, true);
    for (const dx of [-1, 0, 1]) box(x + dx, 0.42, 64, 0.4, 0.2, 0.4, 0xe0bbbc);
  }
  // Woodland reserve keeps its quiet character: one trailhead picnic table and shelter.
  picnic(-67, -111);
  box(-74, 0.5, -113, 1.4, 1, 0.14, wood, true);
  box(-74, 1.2, -113, 2.2, 0.6, 0.12, teal);
}
