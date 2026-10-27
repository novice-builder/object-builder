import * as T from "three";
export const HOUSES = [
  {
    id: "home",
    name: "Your home",
    x: -13,
    z: -9,
    w: 8,
    d: 7,
    angle: 0,
    wall: 0xf1dfad,
    roof: 0x447c80,
    style: "gable",
  },
  {
    id: "peach",
    name: "Peach cottage",
    x: 6,
    z: -10,
    w: 7,
    d: 8,
    angle: 0,
    wall: 0xe7b49b,
    roof: 0x6b7690,
    style: "hip",
  },
  {
    id: "sage",
    name: "Sage bungalow",
    x: -17,
    z: 20,
    w: 9,
    d: 6,
    angle: Math.PI,
    wall: 0xb9cfb4,
    roof: 0xad6c51,
    style: "gable",
  },
  {
    id: "rose",
    name: "Rose cabin",
    x: 17,
    z: 20,
    w: 6,
    d: 8,
    angle: Math.PI,
    wall: 0xe0bbbc,
    roof: 0x6c7980,
    style: "shed",
  },
];
export function localToWorld(h, x, z) {
  const c = Math.cos(h.angle),
    s = Math.sin(h.angle);
  return { x: h.x + x * c + z * s, z: h.z - x * s + z * c };
}
export function makeWorld(scene) {
  const solids = [],
    doors = [],
    batches = new Map(),
    specialMeshes = [],
    boxGeometry = new T.BoxGeometry(1, 1, 1),
    materials = new Map();
  const material = (c) => {
    if (!materials.has(c))
      materials.set(c, new T.MeshLambertMaterial({ color: c }));
    return materials.get(c);
  };
  const matrix = new T.Object3D();
  function box(x, y, z, w, h, d, color, solid = false, angle = 0) {
    if (!batches.has(color)) batches.set(color, []);
    batches.get(color).push({ x, y, z, w, h, d, angle });
    if (solid) {
      const c = Math.abs(Math.cos(angle)),
        s = Math.abs(Math.sin(angle)),
        wx = (w * c + d * s) / 2,
        dz = (w * s + d * c) / 2;
      solids.push({
        minX: x - wx,
        maxX: x + wx,
        minY: y - h / 2,
        maxY: y + h / 2,
        minZ: z - dz,
        maxZ: z + dz,
      });
    }
  }
  const grass = 0x8fb86d,
    wood = 0x946647,
    white = 0xfff5d9,
    glass = 0x81b9ca;
  box(0, -0.18, 0, 68, 0.36, 68, grass, true);
  // Curved road ribbon, adapted from Terrain Walk / Procedural Town.
  const road = [
    [-35, 6],
    [-20, 6],
    [-6, 6],
    [6, 8.6],
    [17, 9],
    [26, 4],
    [35, 3],
  ];
  function ribbon(points, width, color, y) {
    const v = [],
      idx = [];
    points.forEach((p, i) => {
      const a = points[Math.max(0, i - 1)],
        b = points[Math.min(points.length - 1, i + 1)],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        l = Math.hypot(dx, dz),
        nx = ((-dz / l) * width) / 2,
        nz = ((dx / l) * width) / 2;
      v.push(p[0] + nx, y, p[1] + nz, p[0] - nx, y, p[1] - nz);
      if (i) {
        let k = i * 2;
        idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
      }
    });
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const mesh = new T.Mesh(g, material(color));
    scene.add(mesh);
    specialMeshes.push(mesh);
    return mesh;
  }
  ribbon(road, 7.4, 0xdecda9, 0.014);
  ribbon(road, 5, 0x687578, 0.024);
  // Short, dotted centre line follows each segment rather than cutting across bends.
  for (let i = 1; i < road.length; i++) {
    const a = road[i - 1],
      b = road[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      l = Math.hypot(dx, dz);
    for (let t = 1; t < l - 0.8; t += 3.5)
      box(
        a[0] + (dx * t) / l,
        0.031,
        a[1] + (dz * t) / l,
        0.1,
        0.012,
        1.1,
        0xf3e6be,
        false,
        Math.atan2(dx, dz),
      );
  }
  // Drives reach the sidewalk: all are ground overlays, with no raised trip edges.
  const drives = HOUSES.map((h) => {
    const entry = localToWorld(h, -1.4, h.d / 2),
      x = entry.x;
    const i = road.findIndex(
      (p, i) => i > 0 && x >= road[i - 1][0] && x <= p[0],
    );
    const a = road[i - 1],
      b = road[i],
      slope = (b[1] - a[1]) / (b[0] - a[0]);
    const roadZ = a[1] + (x - a[0]) * slope;
    // The road edge is a sloped ribbon; extend under it by 0.4 m to avoid gaps.
    const edge =
      roadZ +
      (entry.z > roadZ ? 1 : -1) * (3.7 * Math.sqrt(1 + slope * slope) - 0.4);
    return {
      x,
      z0: Math.min(entry.z, edge),
      z1: Math.max(entry.z, edge),
      w: 3,
    };
  });
  for (const d of drives)
    box(d.x, 0.012, (d.z0 + d.z1) / 2, d.w, 0.018, d.z1 - d.z0, 0xc5bea7);
  for (const h of HOUSES) {
    const { w, d } = h,
      front = d / 2,
      wallH = 3,
      doorX = -1.4,
      doorW = 1.4;
    const put = (x, y, z, bw, bh, bd, c, solid = false) => {
      const p = localToWorld(h, x, z);
      box(p.x, y, p.z, bw, bh, bd, c, solid, h.angle);
    };
    put(0, 0.006, 0, w, 0.012, d, 0xd5b893);
    // Thin, real wall pieces around door/window openings, rather than glass pasted on solid walls.
    function wallWithWindow(z) {
      const winX = 1.8,
        winW = 1.5,
        sill = 1.05,
        winH = 1.2;
      const spans =
        z > 0
          ? [
              [-w / 2, doorX - doorW / 2],
              [doorX + doorW / 2, winX - winW / 2],
              [winX + winW / 2, w / 2],
            ]
          : [
              [-w / 2, winX - winW / 2],
              [winX + winW / 2, w / 2],
            ];
      for (const [a, b] of spans)
        if (b > a) put((a + b) / 2, 1.5, z, b - a, 3, 0.22, h.wall, true);
      if (z > 0) put(doorX, 2.675, z, doorW, 0.65, 0.22, h.wall, true);
      put(winX, sill / 2, z, winW, sill, 0.22, h.wall, true);
      put(
        winX,
        (sill + winH + 3) / 2,
        z,
        winW,
        3 - sill - winH,
        0.22,
        h.wall,
        true,
      );
      put(winX, sill + winH / 2, z, winW, winH, 0.1, glass, true);
      for (const x of [winX - winW / 2, winX, winX + winW / 2])
        put(x, sill + winH / 2, z + 0.01, 0.065, winH + 0.12, 0.29, white);
      for (const y of [sill, sill + winH / 2, sill + winH])
        put(winX, y, z + 0.01, winW + 0.12, 0.065, 0.29, white);
      put(winX, sill - 0.06, z, winW + 0.27, 0.12, 0.42, white);
    }
    wallWithWindow(front);
    wallWithWindow(-front);
    put(-w / 2, 1.5, 0, 0.22, 3, d, h.wall, true);
    put(w / 2, 1.5, 0, 0.22, 3, d, h.wall, true);
    // Continuous roof meshes with gable infill; different actual roof forms.
    const verts = [],
      indices = [];
    const quad = (a, b, c, d) => {
      const k = verts.length / 3;
      verts.push(...a, ...b, ...c, ...d);
      indices.push(k, k + 1, k + 2, k, k + 2, k + 3);
    };
    const edge = w / 2 + 0.4,
      depth = front + 0.4,
      eave = 3.06,
      peak = 4.7;
    if (h.style === "gable") {
      quad(
        [-edge, eave, depth],
        [0, peak, depth],
        [0, peak, -depth],
        [-edge, eave, -depth],
      );
      quad(
        [0, peak, depth],
        [edge, eave, depth],
        [edge, eave, -depth],
        [0, peak, -depth],
      );
      // Gable wall triangles, fitted beneath both slopes.
      for (const z of [-front, front]) {
        const wallEave = eave + ((peak - eave) * 0.4) / edge;
        const g = new T.BufferGeometry();
        g.setAttribute(
          "position",
          new T.Float32BufferAttribute(
            [
              -w / 2,
              3,
              z,
              w / 2,
              3,
              z,
              w / 2,
              wallEave,
              z,
              0,
              peak,
              z,
              -w / 2,
              wallEave,
              z,
            ],
            3,
          ),
        );
        g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4]);
        g.computeVertexNormals();
        const m = material(h.wall).clone();
        m.side = T.DoubleSide;
        const mesh = new T.Mesh(g, m);
        mesh.position.set(h.x, 0, h.z);
        mesh.rotation.y = h.angle;
        scene.add(mesh);
      }
    } else if (h.style === "hip") {
      const ridge = 1.5;
      quad(
        [-edge, eave, depth],
        [edge, eave, depth],
        [0, peak, ridge],
        [0, peak, ridge],
      );
      quad(
        [edge, eave, depth],
        [edge, eave, -depth],
        [0, peak, -ridge],
        [0, peak, ridge],
      );
      quad(
        [edge, eave, -depth],
        [-edge, eave, -depth],
        [0, peak, -ridge],
        [0, peak, -ridge],
      );
      quad(
        [-edge, eave, -depth],
        [-edge, eave, depth],
        [0, peak, ridge],
        [0, peak, -ridge],
      );
    } else {
      quad(
        [-edge, eave, depth],
        [edge, eave, depth],
        [edge, 4.1, -depth],
        [-edge, 4.1, -depth],
      );
      const frontTop = eave + ((4.1 - eave) * 0.4) / (d + 0.8),
        rearTop = 4.1 - ((4.1 - eave) * 0.4) / (d + 0.8);
      put(0, (3 + rearTop) / 2, -front, w, rearTop - 3, 0.22, h.wall);
      put(0, (3 + frontTop) / 2, front, w, frontTop - 3, 0.22, h.wall);
      for (const x of [-w / 2, w / 2]) {
        const g = new T.BufferGeometry();
        g.setAttribute(
          "position",
          new T.Float32BufferAttribute(
            [x, 3, -front, x, rearTop, -front, x, frontTop, front, x, 3, front],
            3,
          ),
        );
        g.setIndex([0, 1, 2, 0, 2, 3]);
        g.computeVertexNormals();
        const m = material(h.wall).clone();
        m.side = T.DoubleSide;
        const mesh = new T.Mesh(g, m);
        mesh.position.set(h.x, 0, h.z);
        mesh.rotation.y = h.angle;
        scene.add(mesh);
      }
    }
    const roofG = new T.BufferGeometry();
    roofG.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    roofG.setIndex(indices);
    roofG.computeVertexNormals();
    const roofM = material(h.roof).clone();
    roofM.side = T.DoubleSide;
    const roof = new T.Mesh(roofG, roofM);
    roof.position.set(h.x, 0, h.z);
    roof.rotation.y = h.angle;
    scene.add(roof);
    // A flat underside makes jumping inside predictable. No invisible facade wall.
    put(0, 3.015, 0, w + 0.8, 0.09, d + 0.8, h.roof, true);
    for (const x of [-w / 2, w / 2])
      put(x, 1.5, front + 0.08, 0.13, 3, 0.14, white);
    // Porch canopy and columns, grounded directly at path height.
    put(doorX, 2.62, front + 0.7, 2.2, 0.15, 1.5, h.roof, true);
    for (const x of [doorX - 0.96, doorX + 0.96])
      put(x, 1.27, front + 1.28, 0.12, 2.54, 0.12, white, true);
    // Door uses a vertical hinge, with local axes inherited from the facade.
    const pivot = new T.Group(),
      p = localToWorld(h, doorX - doorW / 2, front + 0.03);
    pivot.position.set(p.x, 0, p.z);
    pivot.rotation.y = h.angle;
    const panel = new T.Mesh(
      new T.BoxGeometry(doorW - 0.08, 2.3, 0.1),
      material(0x94684c),
    );
    panel.position.set(doorW / 2, 1.15, 0);
    pivot.add(panel);
    const inset = new T.Mesh(
      new T.BoxGeometry(0.78, 0.7, 0.11),
      material(0xb6cfbd),
    );
    inset.position.set(doorW / 2, 1.66, 0);
    pivot.add(inset);
    const knob = new T.Mesh(
      new T.SphereGeometry(0.055, 6, 5),
      material(0xffdc76),
    );
    knob.position.set(doorW - 0.22, 1, 0.09);
    pivot.add(knob);
    scene.add(pivot);
    const center = localToWorld(h, doorX, front);
    doors.push({
      id: h.id,
      pivot,
      baseAngle: h.angle,
      open: false,
      center,
      hinge: p,
      width: doorW,
      height: 2.3,
    });
    // Cozy, deliberately sparse interiors keep a clear route through each house.
    put(-w / 2 + 1.15, 0.29, -front + 1.6, 1.7, 0.58, 2.4, wood, true);
    put(
      -w / 2 + 1.15,
      0.65,
      -front + 1.45,
      1.65,
      0.16,
      2.1,
      h.id === "home" ? 0x6d9d9b : 0xc9a167,
    );
    put(-w / 2 + 1.15, 0.78, -front + 0.65, 1.4, 0.17, 0.48, white);
    put(w / 2 - 0.9, 0.45, -front + 0.9, 1.1, 0.9, 0.7, wood, true);
    // Doorstep marker and mailbox each have a vertical post and a horizontal box.
    put(0.55, 0.05, front + 0.5, 0.8, 0.09, 0.6, h.roof);
    const mailbox = localToWorld(h, 2.15, front + 2.1);
    box(mailbox.x, 0.5, mailbox.z, 0.11, 1, 0.11, wood, true);
    box(mailbox.x, 1.05, mailbox.z, 0.55, 0.34, 0.4, h.roof);
  }
  // Interactive workbench inside the player's house: checked top and four legs.
  const table = { x: -10.8, z: -8.1 };
  box(table.x, 0.88, table.z, 1.4, 0.22, 1.1, 0xad774a, true);
  for (const dx of [-0.5, 0.5])
    for (const dz of [-0.35, 0.35])
      box(table.x + dx, 0.39, table.z + dz, 0.14, 0.78, 0.14, wood, true);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      box(
        table.x - 0.36 + i * 0.36,
        1.001,
        table.z - 0.32 + j * 0.32,
        0.29,
        0.014,
        0.26,
        (i + j) % 2 ? 0xefd8a3 : 0x754e36,
      );
  // Garden pad east of home gives a large open place to build.
  box(-4, 0.004, -0.5, 8, 0.008, 6, 0xa7be7f);
  for (const x of [-8, 0])
    for (const z of [-3.5, 2.5]) box(x, 0.16, z, 0.2, 0.32, 0.2, wood);
  // Low-poly trees: shared geometry and mesh instances, fixed placement away from homes/roads.
  const treeSpots = [
    [-27, -18],
    [-23, -7],
    [-28, 17],
    [-6, -22],
    [18, -17],
    [26, -7],
    [28, 20],
    [2, 25],
    [-28, 28],
    [27, -25],
    [13, 29],
    [-2, 19],
  ];
  const crowns = [];
  for (const [i, [x, z]] of treeSpots.entries()) {
    const height = 2.5 + (i % 3) * 0.25;
    box(x, height / 2, z, 0.42, height, 0.42, 0x846244, true);
    crowns.push({
      x,
      y: height + 0.7,
      z,
      scale: 1.9 + (i % 2) * 0.3,
      color: i % 2 ? 0x6b9d67 : 0x4d8d68,
    });
    // Tree collision ends near trunk, leaving generous walking space underneath foliage.
  }
  for (const c of new Set(crowns.map((c) => c.color))) {
    const list = crowns.filter((x) => x.color === c),
      g = new T.IcosahedronGeometry(1, 1),
      mesh = new T.InstancedMesh(g, material(c), list.length);
    list.forEach((p, i) => {
      matrix.position.set(p.x, p.y, p.z);
      matrix.scale.set(p.scale, p.scale * 0.85, p.scale);
      matrix.rotation.set(0, i, 0.2);
      matrix.updateMatrix();
      mesh.setMatrixAt(i, matrix.matrix);
    });
    scene.add(mesh);
  }
  // Perimeter hedges keep the map boundary legible and non-scary.
  for (let i = -31; i <= 31; i += 2) {
    for (const z of [-32, 32]) box(i, 0.7, z, 2, 1.4, 1.4, 0x5a8b62);
    for (const x of [-32, 32]) box(x, 0.7, i, 1.4, 1.4, 2, 0x5a8b62);
  }
  // Park bench and flowers near the bend.
  box(1, 0.48, 15, 2, 0.15, 0.65, wood, true);
  box(1, 0.94, 15.28, 2, 0.8, 0.12, wood, true);
  for (const x of [0.25, 1.75])
    box(x, 0.23, 15, 0.12, 0.46, 0.5, 0x5b7072, true);
  for (const [x, z] of [
    [-8, -14],
    [-18, -14],
    [10, -16],
    [20, 15],
    [-21, 17],
    [0, 16],
  ]) {
    box(x, 0.18, z, 0.07, 0.36, 0.07, 0x538857);
    box(x, 0.4, z, 0.32, 0.16, 0.32, 0xe6b073);
  }
  for (const [color, list] of batches) {
    const mesh = new T.InstancedMesh(boxGeometry, material(color), list.length);
    list.forEach((p, i) => {
      matrix.position.set(p.x, p.y, p.z);
      matrix.rotation.set(0, p.angle, 0);
      matrix.scale.set(p.w, p.h, p.d);
      matrix.updateMatrix();
      mesh.setMatrixAt(i, matrix.matrix);
    });
    mesh.computeBoundingSphere();
    scene.add(mesh);
  }
  const ground = new T.Mesh(
    new T.PlaneGeometry(64, 64),
    new T.MeshBasicMaterial({ visible: false }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.updateMatrixWorld();
  scene.add(ground);
  return {
    solids,
    doors,
    table,
    ground,
    road,
    drives,
    houses: HOUSES,
    batches,
  };
}
export function doorBox(door, open = door.open) {
  const a = door.baseAngle + (open ? -Math.PI / 2 : 0),
    c = Math.cos(a),
    s = Math.sin(a),
    cx = door.hinge.x + (c * door.width) / 2,
    cz = door.hinge.z - (s * door.width) / 2;
  const wx = (Math.abs(c) * door.width) / 2 + Math.abs(s) * 0.065,
    dz = (Math.abs(s) * door.width) / 2 + Math.abs(c) * 0.065;
  return {
    minX: cx - wx,
    maxX: cx + wx,
    minZ: cz - dz,
    maxZ: cz + dz,
    minY: 0,
    maxY: 2.3,
  };
}
