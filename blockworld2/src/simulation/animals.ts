import * as T from "three";
export type Species = "dog" | "cat" | "duck" | "horse";
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
  group.userData.species = species;
  return { group, limbs };
}
