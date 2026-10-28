import * as T from "three";
export function addSwingDoor({
  scene,
  material,
  doors,
  h,
  local,
  id = h.id,
  x = -1.4,
  z = h.d / 2,
  width = 1.26,
  height = 2.3,
}) {
  const hinge = local(x - width / 2, z + 0.03),
    center = local(x, z),
    pivot = new T.Group();
  pivot.position.set(hinge.x, 0, hinge.z);
  pivot.rotation.y = h.angle;
  const panel = new T.Mesh(
    new T.BoxGeometry(width, height, 0.1),
    material(0x94684c),
  );
  panel.position.set(width / 2, height / 2, 0);
  pivot.add(panel);
  const inset = new T.Mesh(
    new T.BoxGeometry(width * 0.62, 0.65, 0.112),
    material(0xb6cfbd),
  );
  inset.position.set(width / 2, 1.65, 0);
  pivot.add(inset);
  const knob = new T.Mesh(
    new T.SphereGeometry(0.055, 6, 5),
    material(0xffdc76),
  );
  knob.position.set(width - 0.16, 1, 0.09);
  pivot.add(knob);
  scene.add(pivot);
  doors.push({
    id,
    pivot,
    baseAngle: h.angle,
    open: false,
    center,
    hinge,
    width,
    height,
  });
}
export function addGarage({ scene, material, doors, h, put, local }) {
  const gx = -h.w / 2 - 2.1,
    front = h.d / 2,
    gz = front - 2.7;
  put(gx, 0.007, gz, 4.2, 0.014, 5.4, 0xc5bea7);
  for (const dx of [-2.1, 2.1])
    put(gx + dx, 1.4, gz, 0.2, 2.8, 5.4, h.wall, true);
  put(gx, 1.4, front - 5.4, 4.2, 2.8, 0.2, h.wall, true);
  put(gx, 2.72, front, 4.2, 0.16, 0.2, h.wall, true);
  for (const dx of [-1.92, 1.92])
    put(gx + dx, 1.32, front, 0.36, 2.64, 0.2, h.wall, true);
  put(gx, 2.88, gz, 4.6, 0.18, 5.8, h.roof, true);
  const center = local(gx, front),
    pivot = new T.Group();
  pivot.position.set(center.x, 0, center.z);
  pivot.rotation.y = h.angle;
  const leaf = new T.Group();
  const m = new T.Mesh(new T.BoxGeometry(3.46, 2.6, 0.1), material(0xd7d4c4));
  m.position.y = 1.3;
  leaf.add(m);
  for (let y = 0.25; y < 2.6; y += 0.32) {
    const stripe = new T.Mesh(
      new T.BoxGeometry(3.42, 0.035, 0.12),
      material(0xa7afa3),
    );
    stripe.position.y = y;
    leaf.add(stripe);
  }
  pivot.add(leaf);
  scene.add(pivot);
  doors.push({
    id: h.id + "-garage",
    kind: "roller",
    pivot,
    leaf,
    baseAngle: h.angle,
    center,
    hinge: center,
    width: 3.46,
    height: 2.6,
    open: false,
  });
}
export function makeDesignedHouse({
  h,
  put,
  local,
  scene,
  material,
  doors,
  solids,
  label,
  rooms,
}) {
  const w = h.w,
    d = h.d,
    f = d / 2,
    two = h.storeys === 2,
    upper = 3.2,
    wallH = two ? 6.4 : 3,
    cream = 0xfff5d9,
    wood = 0x946647,
    glass = 0x81b9ca;
  put(0, 0.007, 0, w, 0.014, d, 0xd5b893);
  // Real facade openings, including upper windows. No glass-backed solid facades.
  for (const z of [-f, f]) {
    const door = z > 0,
      winX = w / 2 - 2,
      winW = 2.1,
      spans = door
        ? [
            [-w / 2, -2.1],
            [-0.7, winX - winW / 2],
            [winX + winW / 2, w / 2],
          ]
        : [
            [-w / 2, winX - winW / 2],
            [winX + winW / 2, w / 2],
          ];
    for (const [a, b] of spans)
      if (b > a) put((a + b) / 2, 1.5, z, b - a, 3, 0.22, h.wall, true);
    if (door) put(-1.4, 2.68, z, 1.4, 0.64, 0.22, h.wall, true);
    put(winX, 0.5, z, winW, 1, 0.22, h.wall, true);
    put(winX, 2.65, z, winW, 0.7, 0.22, h.wall, true);
    put(winX, 1.65, z, winW, 1.3, 0.1, glass, true);
    for (const x of [winX - winW / 2, winX, winX + winW / 2])
      put(x, 1.65, z, 0.065, 1.42, 0.3, cream);
    for (const y of [1, 2.3]) put(winX, y, z, winW + 0.15, 0.07, 0.3, cream);
    if (two) {
      put(0, 3.22, z, w, 0.44, 0.22, h.wall, true);
      const ww = 1.6,
        centers =
          h.id === "manor"
            ? [-w / 2 + 2, -1.4, w / 2 - 2]
            : [-w / 2 + 2, w / 2 - 2];
      let start = -w / 2;
      for (const x of centers) {
        put(
          (start + x - ww / 2) / 2,
          4.8,
          z,
          x - ww / 2 - start,
          3.2,
          0.22,
          h.wall,
          true,
        );
        put(x, 3.7, z, ww, 1, 0.22, h.wall, true);
        put(x, 5.98, z, ww, 0.84, 0.22, h.wall, true);
        put(x, 4.88, z, ww, 1.36, 0.1, glass, true);
        for (const xx of [x - ww / 2, x, x + ww / 2])
          put(xx, 4.88, z, 0.065, 1.5, 0.3, cream);
        for (const yy of [4.2, 5.56])
          put(x, yy, z, ww + 0.15, 0.07, 0.3, cream);
        start = x + ww / 2;
      }
      put((start + w / 2) / 2, 4.8, z, w / 2 - start, 3.2, 0.22, h.wall, true);
    }
  }
  for (const x of [-w / 2, w / 2])
    for (const floor of two ? [0, upper] : [0]) {
      const centers = d > 10 ? [-d / 2 + 2.5, d / 2 - 2.5] : [0],
        ww = 1.6;
      let start = -f;
      for (const z of centers) {
        put(
          x,
          floor + 1.5,
          (start + z - ww / 2) / 2,
          0.22,
          3,
          z - ww / 2 - start,
          h.wall,
          true,
        );
        put(x, floor + 0.5, z, 0.22, 1, ww, h.wall, true);
        put(x, floor + 2.65, z, 0.22, 0.7, ww, h.wall, true);
        put(x, floor + 1.65, z, 0.1, 1.3, ww, glass, true);
        for (const zz of [z - 0.8, z, z + 0.8])
          put(x, floor + 1.65, zz, 0.3, 1.42, 0.065, cream);
        for (const yy of [1, 2.3])
          put(x, floor + yy, z, 0.3, 0.07, ww + 0.15, cream);
        start = z + ww / 2;
      }
      put(x, floor + 1.5, (start + f) / 2, 0.22, 3, f - start, h.wall, true);
      if (two) {
        put(x, 3.1, 0, 0.22, 0.2, d, h.wall, true);
        put(x, wallH-.1, 0, .22, .2, d, h.wall, true);
      }
    }
  addSwingDoor({ scene, material, doors, h, local });
  const roofY = wallH + 0.06,
    peak = roofY + (h.id === "manor" ? 3.3 : 1.8),
    edge = w / 2 + 0.4,
    depth = f + 0.4;
  // Low-poly roof surfaces and fitted gable ends. Interior ceilings use warm plaster.
  const vertices = [],
    quad = (a, b, c, e) => vertices.push(...a, ...b, ...c, ...a, ...c, ...e);
  if (h.style === "hip") {
    quad(
      [-edge, roofY, depth],
      [edge, roofY, depth],
      [0, peak, 1],
      [0, peak, 1],
    );
    quad(
      [edge, roofY, depth],
      [edge, roofY, -depth],
      [0, peak, -1],
      [0, peak, 1],
    );
    quad(
      [edge, roofY, -depth],
      [-edge, roofY, -depth],
      [0, peak, -1],
      [0, peak, -1],
    );
    quad(
      [-edge, roofY, -depth],
      [-edge, roofY, depth],
      [0, peak, 1],
      [0, peak, -1],
    );
  } else if (h.style === "shed") {
    const rear = roofY + 1.4;
    quad(
      [-edge, roofY, depth],
      [edge, roofY, depth],
      [edge, rear, -depth],
      [-edge, rear, -depth],
    );
    // Fitted side and back infill closes the pitched volume above the plaster ceiling.
    for (const x of [-w / 2, w / 2]) {
      const g = new T.BufferGeometry();
      g.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          [
            x,
            wallH,
            -f,
            x,
            rear,
            -f,
            x,
            roofY,
            f,
            x,
            wallH,
            -f,
            x,
            roofY,
            f,
            x,
            wallH,
            f,
          ],
          3,
        ),
      );
      g.computeVertexNormals();
      const mat = material(h.wall).clone();
      mat.side = T.DoubleSide;
      const m = new T.Mesh(g, mat);
      m.position.set(h.x, 0, h.z);
      m.rotation.y = h.angle;
      scene.add(m);
    }
    put(0, (wallH + rear) / 2, -f, w, rear - wallH, 0.22, h.wall, true);
  } else {
    quad(
      [-edge, roofY, depth],
      [0, peak, depth],
      [0, peak, -depth],
      [-edge, roofY, -depth],
    );
    quad(
      [0, peak, depth],
      [edge, roofY, depth],
      [edge, roofY, -depth],
      [0, peak, -depth],
    );
    for (const z of [-f, f]) {
      const g = new T.BufferGeometry();
      g.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          [-w / 2, wallH, z, w / 2, wallH, z, 0, peak, z],
          3,
        ),
      );
      g.computeVertexNormals();
      const m = material(h.wall).clone();
      m.side = T.DoubleSide;
      const mesh = new T.Mesh(g, m);
      mesh.position.set(h.x, 0, h.z);
      mesh.rotation.y = h.angle;
      scene.add(mesh);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  g.computeVertexNormals();
  const mat = material(h.roof).clone();
  mat.side = T.DoubleSide;
  const mesh = new T.Mesh(g, mat);
  mesh.position.set(h.x, 0, h.z);
  mesh.rotation.y = h.angle;
  scene.add(mesh);
  put(0, wallH + 0.015, 0, w, 0.09, d, cream, true);
  // Front portico stays clear of the full swing.
  put(-1.4, 2.64, f + 0.7, h.porch || 2.4, 0.12, 1.5, h.roof, true);
  for (const x of [-2.45, -0.35])
    put(x, 1.27, f + 1.3, 0.12, 2.54, 0.12, cream, true);
  if (h.id === "manor") {
    // A tall classical portico and pediment make the residence a clear landmark.
    for (const x of [-4.9, 2.1]) {
      put(x, 3.15, f + 2, 0.32, 6.3, 0.32, cream, true);
      for (const y of [0.12, 6.25])
        put(x, y, f + 2, 0.65, 0.24, 0.65, cream, true);
    }
    put(-1.4, 6.5, f + 1.1, 7.9, 0.24, 2.8, cream, true);
    const g = new T.BufferGeometry();
    g.setAttribute(
      "position",
      new T.Float32BufferAttribute(
        [-5.35, 6.65, f + 2.55, 2.55, 6.65, f + 2.55, -1.4, 8.15, f + 2.55],
        3,
      ),
    );
    g.computeVertexNormals();
    const mat = material(cream).clone();
    mat.side = T.DoubleSide;
    const m = new T.Mesh(g, mat);
    m.position.set(h.x, 0, h.z);
    m.rotation.y = h.angle;
    scene.add(m);
    // Sheltered sitting and dining rooms have furniture clear of the central hall.
    put(3, 0.34, f - 2.5, 3.4, 0.68, 1, 0x6d9d9b, true);
    put(3, 0.88, f - 2.96, 3.4, 0.72, 0.18, 0x6d9d9b, true);
    for (const x of [1.4, 4.6]) put(x, 0.65, f - 2.5, 0.2, 0.5, 1, wood, true);
    put(3, 0.36, f - 4.2, 1.8, 0.72, 0.8, wood, true);
    put(-w / 2 + 3.3, 0.79, f - 3, 2.6, 0.15, 1.6, wood, true);
    for (const dx of [-1, 1])
      for (const dz of [-0.55, 0.55])
        put(-w / 2 + 3.3 + dx, 0.36, f - 3 + dz, 0.12, 0.72, 0.12, wood, true);
  }
  const partition = (y, z, end = w / 2 - 0.2) => {
    const gap = -1.4,
      opening = 1.7;
    put(
      (-w / 2 + gap - opening / 2) / 2,
      y + 1.5,
      z,
      gap - opening / 2 + w / 2,
      3,
      0.16,
      h.wall,
      true,
    );
    put(
      (gap + opening / 2 + end) / 2,
      y + 1.5,
      z,
      end - gap - opening / 2,
      3,
      0.16,
      h.wall,
      true,
    );
    put(gap, y + 2.72, z, opening, 0.56, 0.16, cream, true);
  };
  if (h.rooms) {
    partition(0, -0.4, two ? w / 2 - 2.2 : w / 2 - 0.2);
    rooms.push({
      house: h.id,
      name: "Back room",
      ...local(-1.4, -f + 1.7),
      y: 0,
    });
  }
  if (two) {
    const stairX = w / 2 - 1.2,
      width = 1.65,
      z0 = f - 1.4,
      z1 = -f + 1.4,
      length = z0 - z1;
    // Separate floor strips leave a genuine stairwell opening and a broad landing.
    const left = -w / 2,
      right = stairX - width / 2 - 0.12;
    put(
      (left + right) / 2,
      upper - 0.09,
      0,
      right - left,
      0.18,
      d,
      0xd5b893,
      true,
    );
    for (const [z, depth] of [
      [-f + 0.6, 1.2],
      [f - 0.6, 1.2],
    ])
      put(
        (right + w / 2) / 2,
        upper - 0.09,
        z,
        w / 2 - right,
        0.18,
        depth,
        0xd5b893,
        true,
      );
    const p = local(stairX, (z0 + z1) / 2),
      c = Math.cos(h.angle),
      s = Math.sin(h.angle),
      wx = (width * Math.abs(c) + length * Math.abs(s)) / 2,
      dz = (width * Math.abs(s) + length * Math.abs(c)) / 2;
    solids.push({
      minX: p.x - wx,
      maxX: p.x + wx,
      minZ: p.z - dz,
      maxZ: p.z + dz,
      minY: 0,
      maxY: upper,
      ramp: { cx: p.x, cz: p.z, c, s, width, length, rise: upper },
    });
    for (let i = 0; i < 16; i++) {
      const rise = (upper * (i + 1)) / 16;
      put(
        stairX,
        rise / 2,
        z0 - ((i + 0.5) * length) / 16,
        width,
        rise,
        length / 16,
        wood,
      );
    }
    // Guard the open stairwell, leaving the bottom approach and upper landing free.
    put(
      right - 0.04,
      upper + 0.48,
      (z0 + z1) / 2,
      0.1,
      0.96,
      length,
      wood,
      true,
    );
    for (const z of [z0 - 0.15, z1 + 0.15])
      put(right - 0.04, upper + 0.48, z, 0.12, 0.96, 0.12, cream, true);
    partition(upper, -0.4, right - 0.25);
    rooms.push(
      {
        house: h.id,
        name: "Upper landing",
        ...local(stairX, -f + 0.55),
        y: upper,
      },
      {
        house: h.id,
        name: "Upstairs bedroom",
        ...local(-1.4, -f + 1.7),
        y: upper,
      },
    );
  }
  // Furnishing is tied to rooms, leaving the hall, door and stair approaches clear.
  for (const y of two ? [0, upper] : [0]) {
    put(-w / 2 + 1.3, y + 0.28, -f + 1.6, 1.8, 0.56, 2.4, wood, true);
    put(-w / 2 + 1.3, y + 0.62, -f + 1.6, 1.75, 0.13, 2.3, h.roof);
    put(-w / 2 + 1.3, y + 0.73, -f + 0.8, 1.5, 0.16, 0.5, cream);
    put(-w / 2 + 1.1, y + 0.45, f - 1.1, 1.5, 0.9, 0.7, wood, true);
  }
  if (h.shop) {
    put(w / 2 - 1.5, 0.5, -f + 1.2, 2, 1, 1, wood, true);
    const p = local(0, f + 0.2);
    label(h.sign, p.x, 2.9, p.z, h.angle, Math.min(w - 1, 5));
  }
  if (h.street) {
    const edge = w / 2 + 1.2;
    // Front-garden strips and rear boundaries follow the property axes.
    put(edge, 0.22, 0, 1.1, 0.44, d + 3, 0x5a8b62, true);
    put(0, 0.38, -f - 1.6, w + 2, 0.12, 0.12, wood, true);
    for (const x of [-w / 2 - 1, 0, w / 2 + 1])
      put(x, 0.35, -f - 1.6, 0.1, 0.7, 0.1, cream, true);
    put(w / 2 - 1, 0.18, f + 1.5, 2, 0.36, 1, 0x5a8b62, true);
    for (const dx of [-0.6, 0, 0.6])
      put(w / 2 - 1 + dx, 0.43, f + 1.5, 0.3, 0.18, 0.3, 0xe6b073);
  }
  if (h.garage) addGarage({ scene, material, doors, h, put, local });
  rooms.push({ house: h.id, name: "Entrance", ...local(-1.4, f - 1.1), y: 0 });
}
