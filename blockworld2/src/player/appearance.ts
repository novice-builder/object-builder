import * as T from "three";
export const APPEARANCES = [
  {
    id: "explorer",
    name: "Explorer",
    skin: 0xdba977,
    shirt: 0x6d9b8b,
    pants: 0xb19b73,
    hair: 0x654d3d,
    hat: "sun",
    extra: "pack",
  },
  {
    id: "builder",
    name: "Little builder",
    skin: 0xb8845b,
    shirt: 0xe6be6b,
    pants: 0x6d8ca0,
    hair: 0x433b32,
    hat: "hard",
    extra: "overalls",
  },
  {
    id: "gardener",
    name: "Gardener",
    skin: 0x8b5f42,
    shirt: 0xc6a2ad,
    pants: 0x607e68,
    hair: 0x3c3330,
    hat: "sun",
    extra: "apron",
  },
  {
    id: "pilot",
    name: "Friendly pilot",
    skin: 0xc49068,
    shirt: 0x7c9cb2,
    pants: 0x596e80,
    hair: 0x5a4537,
    hat: "cap",
    extra: "scarf",
  },
  {
    id: "painter",
    name: "Painter",
    skin: 0xe7c19a,
    shirt: 0xa58bab,
    pants: 0x82958f,
    hair: 0x88634a,
    hat: "beret",
    extra: "apron",
  },
  {
    id: "sailor",
    name: "Sailor",
    skin: 0x946a4b,
    shirt: 0xe9dfc8,
    pants: 0x648d9d,
    hair: 0x393430,
    hat: "sailor",
    extra: "stripes",
  },
  {
    id: "cosy",
    name: "Cosy hoodie",
    skin: 0xd2a174,
    shirt: 0xc88c7e,
    pants: 0x788b80,
    hair: 0x604c3b,
    hat: "hood",
    extra: "pocket",
  },
  {
    id: "stargazer",
    name: "Stargazer",
    skin: 0xaf7d55,
    shirt: 0x7784a6,
    pants: 0x5b6d87,
    hair: 0x3b3431,
    hat: "cap",
    extra: "star",
  },
  {
    id: "sporty",
    name: "Park runner",
    skin: 0xe5b58c,
    shirt: 0xb98779,
    pants: 0x718795,
    hair: 0x724e38,
    hat: "band",
    extra: "stripes",
  },
  {
    id: "rainbow",
    name: "Rainbow jumper",
    skin: 0x895d40,
    shirt: 0xabaaa4,
    pants: 0x748b92,
    hair: 0x352e2b,
    hat: "none",
    extra: "rainbow",
  },
  {
    id: "farmer",
    name: "Farm friend",
    skin: 0xc99a70,
    shirt: 0xb79972,
    pants: 0x7a98a0,
    hair: 0x5b4433,
    hat: "sun",
    extra: "overalls",
  },
  {
    id: "blossom",
    name: "Blossom",
    skin: 0xae7f5b,
    shirt: 0xd8b985,
    pants: 0x8fa591,
    hair: 0x45362d,
    hat: "pony",
    extra: "skirt",
  },
];
export type AppearanceId = (typeof APPEARANCES)[number]["id"];
export function createAvatar(id = "explorer") {
  const look = APPEARANCES.find((a) => a.id === id) || APPEARANCES[0],
    group = new T.Group(),
    geometry = new T.BoxGeometry(1, 1, 1),
    materials = new Map<number, T.MeshLambertMaterial>();
  const put = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number,
  ) => {
    if (!materials.has(color))
      materials.set(color, new T.MeshLambertMaterial({ color }));
    const m = new T.Mesh(geometry, materials.get(color));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    group.add(m);
    return m;
  };
  put(0, 1.43, 0, 0.4, 0.4, 0.38, look.skin);
  put(0, 1.65, 0.025, 0.43, 0.12, 0.4, look.hair);
  put(0, 0.93, 0, 0.48, 0.55, 0.3, look.shirt);
  const left = put(-0.14, 0.35, 0, 0.2, 0.65, 0.24, look.pants),
    right = put(0.14, 0.35, 0, 0.2, 0.65, 0.24, look.pants),
    arms = [
      put(-0.34, 0.92, 0, 0.16, 0.5, 0.2, look.skin),
      put(0.34, 0.92, 0, 0.16, 0.5, 0.2, look.skin),
    ];
  for (const x of [-0.08, 0.08])
    put(x, 1.47, -0.198, 0.045, 0.055, 0.025, 0x3d4540);
  put(0, 1.35, -0.198, 0.09, 0.025, 0.025, 0x8a634d);
  if (look.hat === "sun") {
    put(0, 1.74, 0, 0.72, 0.06, 0.62, 0xdac28d);
    put(0, 1.82, 0, 0.43, 0.16, 0.4, 0xdac28d);
  }
  if (look.hat === "hard") {
    put(0, 1.72, 0, 0.53, 0.07, 0.52, 0xe3be6f);
    put(0, 1.81, 0, 0.45, 0.16, 0.43, 0xe3be6f);
    put(0, 1.9, 0, 0.1, 0.04, 0.38, 0xf2d78e);
  }
  if (look.hat === "cap" || look.hat === "sailor") {
    put(
      0,
      1.74,
      0,
      0.48,
      0.15,
      0.45,
      look.hat === "sailor" ? 0xf0ead5 : look.pants,
    );
    put(
      0,
      1.71,
      -0.27,
      0.48,
      0.05,
      0.2,
      look.hat === "sailor" ? 0xf0ead5 : look.pants,
    );
  }
  if (look.hat === "beret") put(-0.04, 1.78, 0, 0.56, 0.15, 0.5, look.shirt);
  if (look.hat === "hood") {
    put(0, 1.45, 0.2, 0.5, 0.55, 0.18, look.shirt);
    put(0, 1.74, 0, 0.5, 0.1, 0.48, look.shirt);
  }
  if (look.hat === "band") put(0, 1.62, -0.01, 0.44, 0.07, 0.42, 0xe8d9b8);
  if (look.hat === "pony") put(0.2, 1.45, 0.27, 0.18, 0.45, 0.2, look.hair);
  if (look.extra === "pack") {
    put(0, 0.95, 0.26, 0.4, 0.48, 0.23, 0xc2a176);
    for (const x of [-0.18, 0.18]) put(x, 1, -0.17, 0.06, 0.45, 0.04, 0xc2a176);
  }
  if (look.extra === "overalls") {
    put(0, 0.88, -0.17, 0.32, 0.35, 0.04, look.pants);
    for (const x of [-0.13, 0.13])
      put(x, 1.12, -0.17, 0.06, 0.25, 0.04, look.pants);
  }
  if (look.extra === "apron") put(0, 0.78, -0.18, 0.4, 0.58, 0.04, 0xd5ca9c);
  if (look.extra === "scarf") {
    put(0, 1.23, 0, 0.46, 0.1, 0.35, 0xdfc48c);
    put(0.13, 1.05, -0.18, 0.1, 0.3, 0.05, 0xdfc48c);
  }
  if (look.extra === "pocket") put(0, 0.83, -0.18, 0.3, 0.18, 0.05, 0xd9a393);
  if (look.extra === "star") {
    put(0, 1.02, -0.18, 0.18, 0.06, 0.04, 0xf0d48b);
    put(0, 1.02, -0.18, 0.06, 0.18, 0.04, 0xf0d48b);
  }
  if (look.extra === "stripes" || look.extra === "rainbow")
    for (let i = 0; i < 4; i++)
      put(
        0,
        0.78 + i * 0.1,
        -0.17,
        0.46,
        0.04,
        0.035,
        look.extra === "rainbow"
          ? [0xc48775, 0xddba7c, 0x8cac91, 0x819fb2][i]
          : look.pants,
      );
  if (look.extra === "skirt") put(0, 0.59, 0, 0.58, 0.35, 0.4, look.pants);
  // Bake the fixed outfit/face/accessories into one vertex-colour mesh. Four
  // independently animated limbs remain; each character uses five draw calls.
  const animated = new Set<T.Object3D>([left, right, ...arms]);
  const fixed = group.children.filter((o) => !animated.has(o)) as T.Mesh[];
  const positions: number[] = [],
    normals: number[] = [],
    colors: number[] = [],
    v = new T.Vector3(),
    n = new T.Vector3(),
    normal = new T.Matrix3(),
    unused = new Set<T.Material>();
  for (const mesh of fixed) {
    mesh.updateMatrix();
    normal.getNormalMatrix(mesh.matrix);
    const g = mesh.geometry.toNonIndexed(),
      p = g.attributes.position,
      ns = g.attributes.normal,
      color = (mesh.material as T.MeshLambertMaterial).color;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrix);
      n.fromBufferAttribute(ns, i).applyMatrix3(normal).normalize();
      positions.push(v.x, v.y, v.z);
      normals.push(n.x, n.y, n.z);
      colors.push(color.r, color.g, color.b);
    }
    unused.add(mesh.material as T.Material);
    g.dispose();
    mesh.removeFromParent();
  }
  const baked = new T.BufferGeometry();
  baked.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  baked.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  baked.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  baked.computeBoundingSphere();
  group.add(
    new T.Mesh(baked, new T.MeshLambertMaterial({ vertexColors: true })),
  );
  for (const material of unused)
    if (!group.children.some((o) => (o as T.Mesh).material === material))
      material.dispose();
  group.userData.appearance = look.id;
  return { group, left, right, arms };
}
export function disposeAvatar(body: ReturnType<typeof createAvatar>) {
  const geometry = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>();
  body.group.traverse((o: any) => {
    if (o.isMesh) {
      geometry.add(o.geometry);
      materials.add(o.material);
    }
  });
  geometry.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  body.group.removeFromParent();
}
