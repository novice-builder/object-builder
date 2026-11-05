import * as T from "three";
import { makeHomeSquare } from "./home-square";
import { renderModel } from "../build/models";
import { blockColliders } from "../build/registry";
import { addSwingDoor, addGarage } from "../legacy06/buildings-06.js";
import { batchStaticWorld } from "../legacy06/world-render.js";
import { batchDoorLeaves } from "../legacy06/door-render.js";
export const TOWN_BUILDINGS = [
  {
    id: "sunbeam-cottage",
    name: "Sunbeam cottage",
    icon: "🏡",
    x: -21,
    z: -46,
    w: 12,
    d: 10,
    angle: 0,
    wall: 0xe6c59e,
    roof: 0x9c8174,
    garage: true,
    kind: "home",
  },
  {
    id: "bluebell-house",
    name: "Bluebell house",
    icon: "🏠",
    x: 22,
    z: -46,
    w: 14,
    d: 10,
    angle: 0,
    wall: 0xb4c7ce,
    roof: 0x6e8885,
    garage: true,
    kind: "home",
  },
  {
    id: "orchard-home",
    name: "Orchard home",
    icon: "🍎",
    x: -51,
    z: -13,
    w: 12,
    d: 10,
    angle: Math.PI / 2,
    wall: 0xd3c7a0,
    roof: 0x9f8765,
    kind: "home",
  },
  {
    id: "school",
    name: "Sunbeam school",
    icon: "🎨",
    x: 50,
    z: -22,
    w: 16,
    d: 10,
    angle: Math.PI / 2,
    wall: 0xd6c9a0,
    roof: 0x688f8b,
    kind: "school",
  },
  {
    id: "clinic",
    name: "Friendly clinic",
    icon: "✚",
    x: 50,
    z: 4,
    w: 12,
    d: 10,
    angle: Math.PI / 2,
    wall: 0xd2ddd3,
    roof: 0x8ea89c,
    kind: "clinic",
  },
  {
    id: "bakery",
    name: "Little bakery",
    icon: "🥐",
    x: 22,
    z: 25,
    w: 12,
    d: 10,
    angle: 0,
    wall: 0xe5baa5,
    roof: 0xa48573,
    kind: "bakery",
  },
  {
    id: "garden-studio",
    name: "Garden studio",
    icon: "🌿",
    x: -7,
    z: 47,
    w: 12,
    d: 10,
    angle: Math.PI,
    wall: 0xb8c9aa,
    roof: 0x76968c,
    kind: "garden",
  },
  {
    id: "stable",
    name: "Orchard stables",
    icon: "🐴",
    x: -51,
    z: 29,
    w: 16,
    d: 10,
    angle: Math.PI / 2,
    wall: 0xc59d79,
    roof: 0x8c776a,
    kind: "stable",
  },
];
export function makeSunbeamTown(scene: T.Group) {
  const base: any = makeHomeSquare(scene),
    extra = new T.Group();
  scene.add(extra);
  const solids: any[] = [],
    doors: any[] = [],
    rooms: any[] = [],
    houses: any[] = [],
    labels: T.Sprite[] = [],
    seats: any[] = [];
  const cube = new T.BoxGeometry(1, 1, 1),
    materials = new Map<number, T.MeshLambertMaterial>();
  const material = (c: number) => {
    if (!materials.has(c))
      materials.set(c, new T.MeshLambertMaterial({ color: c }));
    return materials.get(c)!;
  };
  function box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number,
    solid = false,
    angle = 0,
  ) {
    const m = new T.Mesh(cube, material(color));
    m.position.set(x, y, z);
    m.rotation.y = angle;
    m.scale.set(w, h, d);
    extra.add(m);
    if (solid) {
      const c = Math.cos(angle),
        s = Math.sin(angle),
        wx = (Math.abs(c) * w + Math.abs(s) * d) / 2,
        wz = (Math.abs(s) * w + Math.abs(c) * d) / 2;
      solids.push({
        minX: x - wx,
        maxX: x + wx,
        minY: y - h / 2,
        maxY: y + h / 2,
        minZ: z - wz,
        maxZ: z + wz,
        obb: { cx: x, cz: z, c, s, halfW: w / 2, halfD: d / 2 },
      });
    }
    return m;
  }
  function object(type: string, x: number, z: number, rotation = 0, y = 0) {
    const b = { x: x - 0.5, y, z: z - 0.5, type, rotation },
      model = renderModel(b);
    model.updateMatrixWorld(true);
    model.traverse((o: any) => {
      if (o.isMesh) {
        const baked = new T.Mesh(
          o.geometry.clone().applyMatrix4(o.matrixWorld),
          o.material,
        );
        extra.add(baked);
      }
    });
    solids.push(...blockColliders(b));
    if (["chair", "armchair", "sofa", "bench", "stool"].includes(type))
      seats.push({ x, y, z, rotation });
  }
  function label(text: string, x: number, y: number, z: number) {
    if (typeof document === "undefined") return;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const c = canvas.getContext("2d")!;
    c.fillStyle = "#fff2d4";
    c.fillRect(0, 0, 512, 96);
    c.fillStyle = "#315f54";
    c.textAlign = "center";
    c.font = "bold 36px sans-serif";
    c.fillText(text, 256, 62);
    const sprite = new T.Sprite(
      new T.SpriteMaterial({
        map: new T.CanvasTexture(canvas),
        depthTest: true,
      }),
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(5.5, 1, 1);
    extra.add(sprite);
    labels.push(sprite);
  }
  const roads = [
    { x: 0, z: -56, w: 126, d: 6 },
    { x: 0, z: 56, w: 126, d: 6 },
    { x: -60, z: 0, w: 6, d: 118 },
    { x: 60, z: 0, w: 6, d: 118 },
    { x: 8, z: 0, w: 6, d: 118 },
  ];
  for (const r of roads) box(r.x, 0.014, r.z, r.w, 0.028, r.d, 0x849894);
  for (const h of TOWN_BUILDINGS) {
    houses.push(h);
    const c = Math.cos(h.angle),
      s = Math.sin(h.angle),
      local = (x: number, z: number) => ({
        x: h.x + x * c + z * s,
        z: h.z - x * s + z * c,
      });
    const put = (
      x: number,
      y: number,
      z: number,
      w: number,
      hh: number,
      d: number,
      color: number,
      solid = false,
    ) => {
      const p = local(x, z);
      return box(p.x, y, p.z, w, hh, d, color, solid, h.angle);
    };
    const front = h.d / 2,
      win = h.w / 2 - 2;
    put(0, 0.025, 0, h.w, 0.05, h.d, 0xdfcdaa);
    for (const x of [-h.w / 2, h.w / 2])
      put(x, 1.6, 0, 0.22, 3.2, h.d, h.wall, true);
    put(0, 1.6, -front, h.w, 3.2, 0.22, h.wall, true);
    for (const [a, b] of [
      [-h.w / 2, -2.1],
      [-0.7, win - 0.9],
      [win + 0.9, h.w / 2],
    ])
      if (b > a) put((a + b) / 2, 1.6, front, b - a, 3.2, 0.22, h.wall, true);
    put(-1.4, 2.76, front, 1.4, 0.88, 0.22, h.wall, true);
    put(win, 0.45, front, 1.8, 0.9, 0.22, h.wall, true);
    put(win, 2.75, front, 1.8, 0.9, 0.22, h.wall, true);
    put(win, 1.6, front, 1.8, 1.4, 0.08, 0x9fc8cc, true);
    for (const x of [win - 0.9, win, win + 0.9])
      put(x, 1.6, front + 0.07, 0.06, 1.5, 0.16, 0xffedcb);
    put(0, 3.25, 0, h.w + 0.6, 0.18, h.d + 0.6, h.roof, true);
    if (h.kind === "home" || h.kind === "stable") {
      put(0, 3.6, 0, h.w + 0.2, 0.5, h.d - 0.2, h.roof, true);
      put(0, 4, 0, h.w - 0.8, 0.3, h.d - 2, h.roof, true);
    }
    addSwingDoor({ scene: extra, material, doors, h, local });
    if (h.garage) addGarage({ scene: extra, material, doors, h, put, local });
    rooms.push({ id: h.id, x: h.x, y: 0, z: h.z });
    const furnish = (type: string, x: number, z: number, rotation = 0) => {
      const p = local(x, z);
      object(type, p.x, p.z, (h.angle * 180) / Math.PI + rotation);
    };
    if (h.kind === "home") {
      furnish("double-bed", -3, -2);
      furnish("wardrobe", 3, -3);
      furnish("sofa", 2, 1);
      furnish("coffee-table", 2, -0.3);
      furnish("floor-lamp", 4, 1);
      furnish("kitchen-counter", -4, 1);
      furnish("sink", -3, 1);
    }
    if (h.kind === "school") {
      for (const x of [-5, -2, 2, 5]) {
        furnish("desk", x, -1.5);
        furnish("chair", x, 0.2);
      }
      furnish("bookcase", 4, -4);
      furnish("toy-box", -5, -4);
    }
    if (h.kind === "clinic") {
      furnish("single-bed", -3, -1);
      furnish("washbasin", 4, -3);
      furnish("desk", 3, 0.5);
      furnish("chair", 3, 2);
      furnish("wall-cupboard", 4, 3.5);
    }
    if (h.kind === "bakery") {
      for (const x of [-4, -3, -2]) furnish("kitchen-counter", x, -3);
      furnish("oven", 1, -3);
      furnish("fridge", 3, -3);
      furnish("dining-table", 3, 1);
      furnish("chair", 3, 2.5);
    }
    if (h.kind === "garden") {
      for (const x of [-4, 0, 4]) furnish("planter", x, -3);
      furnish("workbench", 3, 0);
      furnish("garage-shelf", -4, 0);
    }
    if (h.kind === "stable") {
      for (const x of [-5, 4]) {
        furnish("rail-fence", x, -2);
        furnish("storage-crate", x, 1);
      }
      furnish("workbench", 5, 3);
    }
    const entrance = local(-1.4, front),
      end = local(-1.4, front + 3);
    box(
      (entrance.x + end.x) / 2,
      0.008,
      (entrance.z + end.z) / 2,
      2.2,
      0.012,
      3,
      0xe6d3ad,
      false,
      h.angle,
    );
    const sign = local(0, front + 0.2);
    label(h.name, sign.x, 2.8, sign.z);
  }
  // Four deliberately clear plots, parks and orchard details, not empty map expansion.
  const plots = [
    { x: -51, z: 8, w: 12, d: 12 },
    { x: 51, z: 37, w: 12, d: 14 },
    { x: -5, z: -47, w: 10, d: 10 },
    { x: 22, z: 47, w: 12, d: 10 },
  ];
  for (const p of plots) {
    box(p.x, 0.005, p.z, p.w, 0.008, p.d, 0xb5ce96);
    label("BUILD HERE", p.x, 1.2, p.z + p.d / 2);
  }
  object("play-slide", -1, 22);
  object("sandpit", -6, 25);
  object("goal", 1, 31);
  object("bench", 0, 17);
  object("bench", 18, 18);
  object("flower-bed", -12, 6);
  object("flower-bed", 31, 9);
  object("pergola", 17, 44);
  object("dining-table", 17, 44);
  object("chair", 17, 46);
  object("street-lamp", 13, 0);
  object("street-lamp", -10, 8);
  for (const x of [-55, -43, -4, 8, 40, 55])
    for (const z of [-64, 64]) object("oak-tree", x, z);
  for (const x of [-68, 68])
    for (const z of [-40, -12, 16, 40]) object("pine-tree", x, z);
  for (const x of [-12, -8, -4])
    for (const z of [28, 31]) object("fruit-tree", x, z);
  const doorRender = batchDoorLeaves(doors),
    staticRender = batchStaticWorld(
      extra,
      new Set([...doors.map((d) => d.pivot), ...labels]),
    );
  return {
    ...base,
    houses: [...base.houses, ...houses],
    rooms: [...base.rooms, ...rooms],
    doors: [...base.doors, ...doors],
    solids: [...base.solids, ...solids],
    plots,
    activities: [{ x: -1.5, y: 0, z: 21.5, type: "play-slide" }],
    seats,
    mapRoads: [
      ...[-36, 4, 36].map((z) => ({ x: 0, z, w: 84, d: 6 })),
      ...[-40, 8, 40].map((x) => ({ x, z: 0, w: 6, d: 78 })),
      ...roads,
    ],
    activityRange: 70,
    landmarks: [
      ...base.landmarks,
      ...TOWN_BUILDINGS.map((h) => {
        const c = Math.cos(h.angle),
          s = Math.sin(h.angle);
        return {
          name: h.name,
          icon: h.icon,
          x: h.x - 1.4 * c + (h.d / 2 + 3) * s,
          z: h.z + 1.4 * s + (h.d / 2 + 3) * c,
        };
      }),
      { name: "Play park", icon: "🛝", x: 0, z: 20 },
      { name: "Orchard plots", icon: "🧱", x: -51, z: 8 },
    ],
    staticRender: {
      updateVisibility(camera: any, far: number) {
        base.staticRender.updateVisibility(camera, far);
        staticRender.updateVisibility(camera, far);
      },
    },
    extraDoorRender: doorRender,
  };
}
