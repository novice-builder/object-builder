import * as T from "three";
import { WORLD, LANDMARKS } from "./world-config.js";
import {
  EXTRA_BUILDINGS,
  ROAD_LINES,
  TRAIL_LINES,
  distanceToLine,
  smoothLine,
} from "./districts.js";
import { batchStaticWorld } from "./world-render.js";
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
  ...EXTRA_BUILDINGS,
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
        ...(Math.abs(Math.sin(angle * 2)) > 1e-6
          ? {
              obb: {
                cx: x,
                cz: z,
                c: Math.cos(angle),
                s: Math.sin(angle),
                halfW: w / 2,
                halfD: d / 2,
              },
            }
          : {}),
        minX: x - wx,
        maxX: x + wx,
        minY: y - h / 2,
        maxY: y + h / 2,
        minZ: z - dz,
        maxZ: z + dz,
      });
    }
  }
  const labels = [];
  function label(text, x, y, z, angle = 0, width = 4) {
    if (typeof document === "undefined") return;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff5d9";
    ctx.fillRect(0, 0, 512, 96);
    ctx.fillStyle = "#496c61";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 50, 480);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const m = new T.Mesh(
      new T.PlaneGeometry(width, (width * 96) / 512),
      new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide }),
    );
    m.position.set(x, y, z);
    m.rotation.y = angle;
    scene.add(m);
    labels.push(m);
  }
  const grass = 0x8fb86d,
    wood = 0x946647,
    white = 0xfff5d9,
    glass = 0x81b9ca;
  box(
    0,
    -0.18,
    0,
    WORLD.halfSize * 2 + 2,
    0.36,
    WORLD.halfSize * 2 + 2,
    grass,
    true,
  );
  // Curved road ribbon, adapted from Terrain Walk / Procedural Town.
  const roads = ROAD_LINES.map(smoothLine),
    trails = TRAIL_LINES.map(smoothLine);
  const road = roads[0];
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
  for (const line of roads) {
    ribbon(line, 7.4, 0xdecda9, 0.014);
    ribbon(line, 5, 0x687578, 0.024);
  }
  for (const line of trails) ribbon(line, 2.4, 0xd5bf94, 0.018);
  // Dashes use cumulative distance so closely sampled bends keep an even rhythm.
  for (const road of roads) {
    let travelled = 0,
      nextDash = 1;
    for (let i = 1; i < road.length; i++) {
      const a = road[i - 1],
        b = road[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        length = Math.hypot(dx, dz);
      while (nextDash < travelled + length) {
        const t = (nextDash - travelled) / length;
        box(
          a[0] + dx * t,
          0.031,
          a[1] + dz * t,
          0.1,
          0.012,
          1.1,
          0xf3e6be,
          false,
          Math.atan2(dx, dz),
        );
        nextDash += 3.5;
      }
      travelled += length;
    }
  }
  // Drives reach the sidewalk: all are ground overlays, with no raised trip edges.
  const drives = HOUSES.map((h) => {
    const entry = localToWorld(h, -1.4, h.d / 2),
      apron = localToWorld(h, -1.4, h.d / 2 + 2.5),
      options = h.shop
        ? [...roads, trails[4]]
        : h.id === "willow" || h.id === "pavilion"
          ? trails
          : roads;
    const nearest = options
      .map((l) => ({
        ...distanceToLine(apron.x, apron.z, l),
        isRoad: roads.includes(l),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    let end =
      {
        bakery: { x: 44, z: -34 },
        market: { x: 60, z: -34 },
        pottery: { x: 39, z: -25 },
      }[h.id] || nearest.point;
    if (nearest.isRoad && !["bakery", "market", "pottery"].includes(h.id)) {
      const dx = apron.x - end.x,
        dz = apron.z - end.z,
        length = Math.hypot(dx, dz);
      if (length > 3.3)
        end = {
          x: end.x + (dx / length) * 3.3,
          z: end.z + (dz / length) * 3.3,
        };
    }

    const points = [
      [entry.x, entry.z],
      [apron.x, apron.z],
      [end.x, end.z],
    ];
    ribbon(points, h.shop ? 2.8 : 2.4, 0xc5bea7, 0.032);
    // Garages have their own real driveway, aligned to the facade.
    if (h.garage) {
      const g = localToWorld(h, -h.w / 2 - 2.1, h.d / 2 + 0.15);
      let e = roads
        .map((l) => distanceToLine(g.x, g.z, l))
        .sort((a, b) => a.distance - b.distance)[0].point;
      const dx = g.x - e.x,
        dz = g.z - e.z,
        length = Math.hypot(dx, dz);
      if (length > 3.3)
        e = { x: e.x + (dx / length) * 3.3, z: e.z + (dz / length) * 3.3 };

      ribbon(
        [
          [g.x, g.z],
          [e.x, e.z],
        ],
        3.6,
        0xc5bea7,
        0.033,
      );
    }
    return { entry, end, points, w: h.shop ? 2.8 : 2.4 };
  });
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
      const winX = h.w > 9 ? 2.4 : 1.8,
        winW = h.shop ? 2.6 : h.w > 9 ? 2.2 : 1.5,
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
    if (h.d > 8 && EXTRA_BUILDINGS.some((b) => b.id === h.id)) {
      // Genuine side-window openings on long footprints, with fitted glazing.
      const windows = h.d > 10 ? [-2.6, 2.6] : [0],
        half = 0.8;
      let start = -front;
      for (const z of windows) {
        const end = z - half;
        put(w / 2, 1.5, (start + end) / 2, 0.22, 3, end - start, h.wall, true);
        put(w / 2, 0.525, z, 0.22, 1.05, 1.6, h.wall, true);
        put(w / 2, 2.625, z, 0.22, 0.75, 1.6, h.wall, true);
        put(w / 2, 1.65, z, 0.1, 1.2, 1.6, glass, true);
        for (const zz of [z - half, z, z + half])
          put(w / 2 + 0.01, 1.65, zz, 0.29, 1.32, 0.065, white);
        for (const yy of [1.05, 1.65, 2.25])
          put(w / 2 + 0.01, yy, z, 0.29, 0.065, 1.72, white);
        start = z + half;
      }
      put(
        w / 2,
        1.5,
        (start + front) / 2,
        0.22,
        3,
        front - start,
        h.wall,
        true,
      );
    } else put(w / 2, 1.5, 0, 0.22, 3, d, h.wall, true);
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
    put(
      0,
      3.015,
      0,
      h.style === "shed" ? w : w + 0.8,
      0.09,
      h.style === "shed" ? d : d + 0.8,
      h.style === "shed" ? h.wall : h.roof,
      true,
    );
    for (const x of [-w / 2, w / 2])
      put(x, 1.5, front + 0.08, 0.13, 3, 0.14, white);
    // Porch canopy and columns, grounded directly at path height.
    put(doorX, 2.62, front + 0.7, h.porch || 2.2, 0.15, 1.5, h.roof, true);
    for (const x of [
      doorX - (h.porch || 2.2) / 2 + 0.14,
      doorX + (h.porch || 2.2) / 2 - 0.14,
    ])
      put(x, 1.27, front + 1.28, 0.12, 2.54, 0.12, white, true);
    // Door uses a vertical hinge, with local axes inherited from the facade.
    const pivot = new T.Group(),
      p = localToWorld(h, doorX - doorW / 2 + 0.07, front + 0.03);
    const leafWidth = doorW - 0.14;
    pivot.position.set(p.x, 0, p.z);
    pivot.rotation.y = h.angle;
    const panel = new T.Mesh(
      new T.BoxGeometry(leafWidth, 2.3, 0.1),
      material(0x94684c),
    );
    panel.position.set(leafWidth / 2, 1.15, 0);
    pivot.add(panel);
    const inset = new T.Mesh(
      new T.BoxGeometry(0.78, 0.7, 0.11),
      material(0xb6cfbd),
    );
    inset.position.set(leafWidth / 2, 1.66, 0);
    pivot.add(inset);
    const knob = new T.Mesh(
      new T.SphereGeometry(0.055, 6, 5),
      material(0xffdc76),
    );
    knob.position.set(leafWidth - 0.18, 1, 0.09);
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
      width: leafWidth,
      height: 2.3,
    });
    if (h.shop) {
      put(w / 2 - 1, 0.45, -front + 1, 1.4, 0.9, 1.3, wood, true);
      put(w / 2 - 1, 0.95, -front + 1, 1.6, 0.12, 1.5, white);
      for (let i = 0; i < 3; i++) {
        put(
          -w / 2 + 1.2 + i * 1.6,
          0.6,
          -front + 0.7,
          1.2,
          1.2,
          0.65,
          wood,
          true,
        );
        put(
          -w / 2 + 1.2 + i * 1.6,
          1.28,
          -front + 0.7,
          0.8,
          0.16,
          0.4,
          [0xe6b073, 0xb9cfb4, 0xe0bbbc][i],
        );
      }
      put(1, 2.6, front + 0.19, w - 1, 0.25, 0.6, h.roof);
      // Striped storefront awning; the doorway still has full swing clearance.
      for (let i = 0; i < 8; i++)
        put(
          -w / 2 + 0.5 + (i * (w - 1)) / 8,
          2.7,
          front + 0.8,
          (w - 1) / 8,
          0.12,
          1.4,
          i % 2 ? white : h.roof,
        );
      put(0, 3.28, front + 0.2, 4.05, 0.82, 0.12, wood);
      for (const x of [-1.65, 1.65])
        put(x, 2.96, front + 0.18, 0.1, 0.7, 0.12, wood);
      const pos = localToWorld(h, 0, front + 0.28);
      label(h.sign, pos.x, 3.28, pos.z, h.angle, 3.8);
    } else {
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
    }
    if (h.garage) {
      const gx = -w / 2 - 2.1,
        gz = front - 2.7;
      // Attached closed garage: lower mass, correctly facing its separate drive.
      put(gx, 1.25, gz, 4.2, 2.5, 5.4, h.wall, true);
      put(gx, 2.58, gz, 4.6, 0.18, 5.8, h.roof, true);
      put(gx, 1.1, front + 0.015, 3.3, 2.2, 0.06, 0xd7d4c4);
      for (let y = 0.35; y < 2.2; y += 0.35)
        put(gx, y, front + 0.055, 3.25, 0.035, 0.025, 0xa7afa3);
    }
    if (h.garden) {
      const side = h.garage ? w / 2 + 2 : -w / 2 - 2;
      put(side, 0.18, 0, 2.3, 0.36, d * 0.75, 0x5a8b62, true);
      for (let i = 0; i < 4; i++)
        put(
          side,
          0.42,
          -d * 0.25 + (i * d) / 6,
          0.4,
          0.2,
          0.4,
          [0xe6b073, 0xe0bbbc, 0xf1dfad][h.garden - 1],
        );
      if (h.garden === 3) {
        put(0, 0.3, -front - 2.2, w * 0.7, 0.6, 1.2, wood, true);
        put(0, 0.64, -front - 2.2, w * 0.65, 0.12, 1, 0x6b9d67);
      }
    }
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
  // A readable hedge boundary enclosing the full 250 m world.
  for (let i = -124; i <= 124; i += 4) {
    for (const z of [-125, 125]) box(i, 0.7, z, 4, 1.4, 1.4, 0x5a8b62);
    for (const x of [-125, 125]) box(x, 0.7, i, 1.4, 1.4, 4, 0x5a8b62);
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
  // Village square: paving, central planter, seats and a visible clock landmark.
  box(49, 0.006, -26, 23, 0.012, 23, 0xd7c8a9);
  box(49, 0.2, -26, 3, 0.4, 3, 0xb5ad96, true);
  box(49, 0.44, -26, 2.6, 0.08, 2.6, 0x6b9d67);
  box(49, 2, -26, 0.32, 4, 0.32, wood, true);
  box(49, 4.1, -26, 1.4, 1.4, 0.4, 0xf1dfad);
  if (typeof document !== "undefined") {
    const c = document.createElement("canvas");
    c.width = c.height = 192;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff5d9";
    ctx.fillRect(0, 0, 192, 192);
    ctx.strokeStyle = "#496c61";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(96, 96, 84, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "bold 23px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#496c61";
    for (const [text, x, y] of [
      ["12", 96, 34],
      ["3", 160, 98],
      ["6", 96, 160],
      ["9", 34, 98],
    ])
      ctx.fillText(text, x, y);
    ctx.lineCap = "round";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(96, 96);
    ctx.lineTo(65, 77);
    ctx.moveTo(96, 96);
    ctx.lineTo(132, 60);
    ctx.stroke();
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    const face = new T.Mesh(
      new T.PlaneGeometry(1.14, 1.14),
      new T.MeshBasicMaterial({ map: texture }),
    );
    face.position.set(49, 4.1, -25.79);
    scene.add(face);
    labels.push(face);
  }
  function bench(x, z, angle = 0) {
    const p = (dx, y, dz, w, h, d, c, solid = true) => {
      const pt = localToWorld({ x, z, angle }, dx, dz);
      box(pt.x, y, pt.z, w, h, d, c, solid, angle);
    };
    p(0, 0.48, 0, 2, 0.15, 0.65, wood);
    p(0, 0.94, 0.28, 2, 0.8, 0.12, wood);
    for (const dx of [-0.75, 0.75]) p(dx, 0.23, 0, 0.12, 0.46, 0.5, 0x5b7072);
  }
  for (const x of [40, 58]) bench(x, -26, Math.PI / 2);
  // Park: a walk-through playhouse, reachable low stepping platforms, sand and swings.
  box(65, 0.005, 46, 25, 0.01, 25, 0xa7be7f);
  box(71, 0.014, 48, 9, 0.018, 8, 0xe4ce9b);
  for (const x of [61, 67]) box(x, 1.8, 39, 0.22, 3.6, 0.22, wood, true);
  box(64, 3.55, 39, 6.6, 0.22, 0.22, wood, true);
  for (const x of [63, 65]) {
    for (const dx of [-0.32, 0.32])
      box(x + dx, 2.28, 39, 0.035, 2.4, 0.035, 0x5b7072);
    box(x, 1.06, 39, 0.85, 0.16, 0.5, 0xad6c51, true);
  }
  for (let i = 0; i < 4; i++)
    box(
      58 + i * 1.6,
      0.15 + i * 0.1,
      49,
      1.1,
      0.3 + i * 0.2,
      1.1,
      [0xad6c51, 0x447c80, 0xe6b073, 0x6b7690][i],
      true,
    );
  box(71, 0.55, 48, 2, 1.1, 2, 0xc5bea7, true);
  for (const dx of [-1.1, 1.1])
    for (const dz of [-1.1, 1.1])
      box(76 + dx, 1.2, 41 + dz, 0.16, 2.4, 0.16, wood, true);
  box(76, 2.45, 41, 2.7, 0.18, 2.7, 0x447c80, true);
  bench(58, 41, Math.PI / 2);
  bench(73, 56, Math.PI);
  // Wide, open building clearings remain free of generated scenery.
  const clearings = [
    { x: -59, z: 61, w: 44, d: 32 },
    { x: 8, z: 61, w: 27, d: 27 },
  ];
  for (const f of clearings) {
    box(f.x, 0.004, f.z, f.w, 0.008, f.d, 0xa7be7f);
    for (const dx of [-f.w / 2, f.w / 2])
      for (const dz of [-f.d / 2, f.d / 2])
        box(f.x + dx, 0.18, f.z + dz, 0.22, 0.36, 0.22, wood);
  }
  // Shallow ornamental pond and a stepping-stone crossing; no deep-water mechanics.
  const pond = { x: 18, z: -101, rx: 16, rz: 10 };
  const disk = (x, z, rx, rz, color, y = 0.02) => {
    const g = new T.CircleGeometry(1, 48);
    g.rotateX(-Math.PI / 2);
    g.scale(rx, 1, rz);
    const m = new T.Mesh(g, material(color));
    m.position.set(x, y, z);
    scene.add(m);
  };
  disk(18, -101, 18, 12, 0xd7c8a9, 0.006);
  disk(18, -101, 16, 10, 0x72aebc, 0.022);
  for (let i = 0; i < 9; i++)
    box(
      18 + (i % 2 ? 0.3 : -0.3),
      0.1,
      -110 + i * 2.25,
      1.25,
      0.2,
      1.45,
      0xb5ad96,
      true,
    );
  bench(38, -103, Math.PI / 2);
  bench(10, -116, Math.PI);
  // Orchard rows follow a small crescent rather than a street grid.
  const orchard = [];
  for (let i = 0; i < 18; i++) {
    const a = i * 0.67;
    orchard.push([
      81 + Math.cos(a) * (7 + Math.floor(i / 6) * 4),
      94 + Math.sin(a) * (7 + Math.floor(i / 6) * 4),
    ]);
  }
  bench(81, 94);
  box(81, 0.015, 97, 3, 0.03, 2, 0xe0bbbc);
  // Deterministic vegetation avoids every house, garage, drive, path and play/build area.
  const excluded = (x, z) => {
    if (Math.abs(x) < 32 && Math.abs(z) < 32) return true;
    if (
      HOUSES.some((h) => {
        const c = Math.abs(Math.cos(h.angle)),
          ss = Math.abs(Math.sin(h.angle));
        return (
          Math.abs(x - h.x) < (h.w * c + h.d * ss) / 2 + 8 &&
          Math.abs(z - h.z) < (h.w * ss + h.d * c) / 2 + 6
        );
      })
    )
      return true;
    if (
      [...roads, ...trails].some((l) => distanceToLine(x, z, l).distance < 5.2)
    )
      return true;
    if (drives.some((d) => distanceToLine(x, z, d.points).distance < 3))
      return true;
    if (
      clearings.some(
        (f) =>
          Math.abs(x - f.x) < f.w / 2 + 3 && Math.abs(z - f.z) < f.d / 2 + 3,
      )
    )
      return true;
    if (
      (Math.abs(x - 65) < 18 && Math.abs(z - 46) < 18) ||
      (Math.abs(x - 49) < 17 && Math.abs(z + 26) < 17)
    )
      return true;
    if (
      (Math.abs(x - 18) < 22 && Math.abs(z + 101) < 16) ||
      Math.hypot(x - 81, z - 94) < 24
    )
      return true;
    return false;
  };
  let seed = 73419;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const trees = [];
  for (let i = 0; i < 650; i++) {
    const x = -118 + random() * 236,
      z = -118 + random() * 236;
    if (excluded(x, z) || trees.some((p) => Math.hypot(p[0] - x, p[1] - z) < 5))
      continue;
    // Keep central sight lines open; denser woodland near the northern trail.
    if (z > -80 && random() < 0.42) continue;
    trees.push([x, z]);
  }
  // A denser grove gives woodland a different feel from the residential lawns.
  for (let i = 0; i < 600; i++) {
    const x = -95 + random() * 63,
      z = -121 + random() * 36;
    if (
      excluded(x, z) ||
      trees.some((p) => Math.hypot(p[0] - x, p[1] - z) < 3.8)
    )
      continue;
    trees.push([x, z]);
  }
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI * 2) / 24,
      x = 18 + Math.cos(a) * 16.8,
      z = -101 + Math.sin(a) * 10.8;
    if (Math.abs(x - 18) < 2) continue;
    box(x, 0.35, z, 0.055, 0.7, 0.055, 0x538857);
    box(x, 0.74, z, 0.12, 0.17, 0.12, 0x946647);
  }
  for (const [i, [x, z]] of [...trees, ...orchard].entries()) {
    const orchardTree = i >= trees.length,
      h = orchardTree ? 2.2 : 2.6 + (i % 4) * 0.35;
    box(x, h / 2, z, 0.38, h, 0.38, wood, true);
    const conifer = !orchardTree && z < -80 && i % 3 === 0;
    const g = conifer
      ? new T.ConeGeometry(2.1, 4.6, 7)
      : new T.IcosahedronGeometry(1, 1);
    if (!conifer) g.scale(2.2, 1.9, 2.2);
    const mesh = new T.Mesh(
      g,
      material(conifer ? 0x4d8d68 : i % 2 ? 0x6b9d67 : 0x5a8b62),
    );
    mesh.position.set(x, h + 0.7, z);
    scene.add(mesh);
    if (orchardTree)
      for (const dx of [-1, 1])
        box(x + dx, h + 0.5, z + 0.5, 0.22, 0.22, 0.22, 0xc78264);
  }
  // Trail markers and district signs make the route recognizable at walking height.
  for (const l of LANDMARKS.filter((l) => l.id !== "home")) {
    const x = l.id === "pond" ? 39 : l.x + 4,
      z = l.id === "pond" ? -94 : l.z + 4;
    box(x, 0.9, z, 0.14, 1.8, 0.14, wood, true);
    box(x, 1.7, z, 3.8, 0.8, 0.12, 0x447c80);
    label(l.name.toUpperCase(), x, 1.72, z + 0.075, 0, 3.6);
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
    new T.PlaneGeometry(WORLD.halfSize * 2, WORLD.halfSize * 2),
    new T.MeshBasicMaterial({ visible: false }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.updateMatrixWorld();
  scene.add(ground);
  const staticRender = batchStaticWorld(
    scene,
    new Set([...doors.map((d) => d.pivot), ground, ...labels]),
  );
  return {
    config: WORLD,
    roads,
    trails,
    clearings,
    pond,
    staticRender,
    treeCount: trees.length + orchard.length,
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
export { doorBox } from "./door-geometry.js";
