import * as T from "three";
export type Species =
  | "dog"
  | "cat"
  | "duck"
  | "horse"
  | "cow"
  | "sheep"
  | "chicken"
  | "rabbit";
export function animalModel(species: Species) {
  const group = new T.Group(),
    geometry = new T.BoxGeometry(1, 1, 1),
    limbs: T.Mesh[] = [];
  const color =
    species === "dog"
      ? 0xc6aa83
      : species === "cat"
        ? 0xb8b4a5
        : species === "duck"
          ? 0xf5dfa0
          : 0xb98b68;
  const put = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c = color,
  ) => {
    const m = new T.Mesh(geometry, new T.MeshLambertMaterial({ color: c }));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    group.add(m);
    return m;
  };
  if (species === "duck") {
    put(0, 0.35, 0, 0.6, 0.45, 0.7);
    put(0, 0.65, -0.35, 0.34, 0.35, 0.35);
    put(0, 0.61, -0.58, 0.3, 0.12, 0.24, 0xd99d58);
    for (const x of [-0.2, 0.2])
      limbs.push(put(x, 0.1, 0, 0.13, 0.2, 0.25, 0xd99d58));
    put(-0.34, 0.4, 0, 0.12, 0.2, 0.4);
    put(0.34, 0.4, 0, 0.12, 0.2, 0.4);
  } else if (species === "chicken") {
    put(0, 0.3, 0, 0.4, 0.45, 0.5, 0xf2ead2);
    put(0, 0.65, -0.2, 0.25, 0.3, 0.25, 0xf2ead2);
    put(0, 0.65, -0.4, 0.15, 0.1, 0.16, 0xd6aa63);
    put(0, 0.85, -0.2, 0.08, 0.15, 0.15, 0xc58268);
    for (const x of [-0.12, 0.12])
      limbs.push(put(x, 0.1, 0, 0.06, 0.2, 0.1, 0xd6aa63));
  } else if (species === "rabbit") {
    put(0, 0.3, 0, 0.5, 0.4, 0.65, 0xb4b0a4);
    put(0, 0.55, -0.3, 0.3, 0.3, 0.3, 0xb4b0a4);
    for (const x of [-0.1, 0.1]) put(x, 0.88, -0.3, 0.09, 0.5, 0.12, 0xb4b0a4);
    for (const x of [-0.2, 0.2])
      limbs.push(put(x, 0.12, 0.15, 0.18, 0.25, 0.35, 0xddd4c4));
    put(0, 0.4, 0.4, 0.2, 0.2, 0.2, 0xddd4c4);
  } else if (species === "cow" || species === "sheep") {
    const cow = species === "cow",
      w = cow ? 0.9 : 0.8,
      h = cow ? 0.95 : 0.65,
      l = cow ? 1.5 : 1.1;
    put(0, h, 0, w, cow ? 0.75 : 0.7, l, 0xe9e3cc);
    put(0, h + 0.15, -l * 0.55, 0.5, 0.5, 0.45, cow ? 0xc3ab94 : 0x82776b);
    if (cow) {
      put(-0.35, h + 0.08, 0.2, 0.22, 0.65, 0.5, 0x7c7769);
      put(0.3, h - 0.1, -0.25, 0.3, 0.4, 0.4, 0x7c7769);
      for (const x of [-0.3, 0.3])
        put(x, h + 0.43, -l * 0.55, 0.12, 0.22, 0.1, 0xd8c8a1);
    } else
      for (const x of [-0.35, 0, 0.35])
        put(x, h + 0.4, 0, 0.3, 0.3, l * 0.8, 0xf0ead9);
    for (const x of [-w * 0.3, w * 0.3])
      for (const z of [-l * 0.3, l * 0.3])
        limbs.push(put(x, (h - 0.3) / 2, z, 0.12, h - 0.3, 0.12, 0x82776b));
  } else {
    const horse = species === "horse",
      height = horse ? 0.95 : 0.36,
      length = horse ? 1.35 : 0.75;
    put(0, height, 0, horse ? 0.7 : 0.5, horse ? 0.6 : 0.35, length);
    put(
      0,
      horse ? 1.55 : 0.68,
      -length * 0.48,
      horse ? 0.4 : 0.32,
      horse ? 0.6 : 0.32,
      horse ? 0.65 : 0.35,
    );
    for (const x of [horse ? -0.24 : -0.16, horse ? 0.24 : 0.16])
      for (const z of [-length * 0.33, length * 0.33])
        limbs.push(
          put(x, horse ? 0.42 : 0.15, z, 0.12, horse ? 0.85 : 0.3, 0.12),
        );
    for (const x of [-0.13, 0.13])
      put(
        x,
        horse ? 1.94 : 0.94,
        -length * 0.48,
        0.1,
        species === "dog" ? 0.23 : 0.18,
        0.12,
        species === "dog" ? 0x8f775f : color,
      );
    put(
      0,
      horse ? 1.05 : 0.55,
      length * 0.65,
      0.1,
      horse ? 0.65 : 0.55,
      0.12,
      species === "horse" ? 0x765b47 : color,
    );
  }
  if (species === "horse") {
    put(0, 1.28, 0.05, 0.72, 0.12, 0.65, 0x6f6552);
    put(0, 1.58, -0.38, 0.14, 0.55, 0.14, 0x765b47);
    for (const x of [-0.21, 0.21])
      put(x, 1.68, -0.82, 0.045, 0.07, 0.07, 0x403e37);
  }
  group.userData.species = species;
  return { group, limbs };
}
