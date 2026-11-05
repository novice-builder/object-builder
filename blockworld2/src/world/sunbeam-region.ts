import * as T from "three";
import { makeSunbeamTown } from "./sunbeam-town";
import { TownAuthor } from "./authoring";
import { makeDesignedHouse } from "../legacy06/buildings-06.js";
import { blockColliders } from "../build/registry";
import { batchDoorLeaves } from "../legacy06/door-render.js";
export const REGION_BUILDINGS = [
  {
    id: "cedar-villa",
    name: "Cedar villa",
    x: -111,
    z: -105,
    w: 16,
    d: 14,
    angle: 0,
    style: "gable",
    storeys: 2,
    garage: true,
    kind: "home",
  },
  {
    id: "courtyard-home",
    name: "Courtyard home",
    x: -73,
    z: -105,
    w: 18,
    d: 14,
    angle: 0,
    style: "hip",
    garage: true,
    kind: "home",
  },
  {
    id: "oak-house",
    name: "Oak family house",
    x: -35,
    z: -105,
    w: 18,
    d: 14,
    angle: 0,
    style: "hip",
    storeys: 2,
    kind: "home",
  },
  {
    id: "lakeside-lodge",
    name: "Lakeside lodge",
    x: 4,
    z: -105,
    w: 16,
    d: 14,
    angle: 0,
    style: "shed",
    kind: "home",
  },
  {
    id: "bookshop",
    name: "Storybook shop",
    x: 42,
    z: -104,
    w: 18,
    d: 12,
    angle: 0,
    style: "gable",
    kind: "books",
  },
  {
    id: "grocer",
    name: "Garden grocer",
    x: -112,
    z: -49,
    w: 16,
    d: 12,
    angle: Math.PI / 2,
    style: "shed",
    kind: "grocer",
  },
  {
    id: "museum",
    name: "Discovery museum",
    x: -112,
    z: -12,
    w: 20,
    d: 14,
    angle: Math.PI / 2,
    style: "hip",
    kind: "museum",
  },
  {
    id: "community",
    name: "Community hall",
    x: -112,
    z: 30,
    w: 22,
    d: 16,
    angle: Math.PI / 2,
    style: "gable",
    kind: "community",
  },
  {
    id: "farmhouse",
    name: "Willow farmhouse",
    x: -111,
    z: 81,
    w: 18,
    d: 16,
    angle: Math.PI / 2,
    style: "gable",
    storeys: 2,
    garage: true,
    kind: "home",
  },
  {
    id: "farm-barn",
    name: "Willow farm barn",
    x: -70,
    z: 108,
    w: 22,
    d: 14,
    angle: Math.PI,
    style: "gable",
    kind: "farm",
  },
  {
    id: "animal-care",
    name: "Animal care lodge",
    x: -33,
    z: 108,
    w: 18,
    d: 12,
    angle: Math.PI,
    style: "hip",
    kind: "animals",
  },
  {
    id: "boathouse",
    name: "Lakeside boathouse",
    x: 111,
    z: -65,
    w: 20,
    d: 12,
    angle: 0,
    style: "shed",
    kind: "lake",
  },
  {
    id: "greenhouse",
    name: "Botanical conservatory",
    x: 111,
    z: 13,
    w: 18,
    d: 12,
    angle: -Math.PI / 2,
    style: "shed",
    kind: "garden",
  },
  {
    id: "trail-cafe",
    name: "Woodland trail cafe",
    x: 111,
    z: 64,
    w: 18,
    d: 12,
    angle: -Math.PI / 2,
    style: "hip",
    kind: "cafe",
  },
];
export function makeSunbeamRegion(scene: T.Group, layout = 2) {
  // Composition preserves every existing Sunbeam structure at its old location.
  // Only a NEW region instance receives the surrounding districts.
  const base = makeSunbeamTown(scene),
    a = new TownAuthor(scene),
    doors: any[] = [],
    rooms: any[] = [],
    houses: any[] = [],
    stairs: any[] = [],
    landmarks: any[] = [];
  const roads = [
    { x: 0, z: -82, w: 180, d: 7 },
    { x: 0, z: 82, w: 180, d: 7 },
    { x: -86, z: 0, w: 7, d: 171 },
    { x: 86, z: 0, w: 7, d: 171 },
    ...[-60, 8, 60].flatMap((x) => [
      { x, z: -70, w: 6, d: 24 },
      { x, z: 70, w: 6, d: 24 },
    ]),
    ...[-56, 4, 56].flatMap((z) => [
      { x: -73, z, w: 26, d: 6 },
      { x: 73, z, w: 26, d: 6 },
    ]),
  ];
  for (const r of roads) a.box(r.x, 0.014, r.z, r.w, 0.028, r.d, 0x829691);
  for (const z of [-87.5, 87.5]) a.box(0, 0.02, z, 184, 0.03, 2, 0xddcfaf);
  for (const x of [-91.5, 91.5]) a.box(x, 0.02, 0, 2, 0.03, 174, 0xddcfaf);
  for (const x of [-86, 8, 86])
    for (const z of [-82, 82])
      for (let i = -2; i <= 2; i++)
        a.box(x + i * 1.2, 0.035, z, 0.6, 0.01, 6, 0xf2e9d1);
  for (let n = 0; n < REGION_BUILDINGS.length; n++) {
    const spec = REGION_BUILDINGS[n],
      h = {
        ...spec,
        rooms: spec.kind === "home",
        wall: [0xd9c8a4, 0xb7c9be, 0xd0b7a0, 0xd4d9c2][n % 4],
        roof: [0x916f5d, 0x6d8a80, 0xa68a66][n % 3],
      };
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
      // The old authoring helper leaves a 0.2 m gap before its top landing.
      // Fill that gap in this new template's visible floor AND collision.
      if (
        h.storeys === 2 &&
        Math.abs(y - 3.11) < 0.001 &&
        Math.abs(z + h.d / 2 - 0.6) < 0.001 &&
        Math.abs(d - 1.2) < 0.001
      ) {
        z += 0.1;
        d += 0.2;
      }
      const p = local(x, z);
      return a.box(p.x, y, p.z, w, hh, d, color, solid, h.angle);
    };
    makeDesignedHouse({
      h,
      put,
      local,
      scene: a.group,
      material: a.material,
      doors,
      solids: a.solids,
      label: a.label,
      rooms,
    });
    const furnish = (
      type: string,
      x: number,
      z: number,
      rotation = 0,
      y = 0,
      id?: string,
    ) => {
      const p = local(x, z);
      a.object(
        type,
        p.x,
        p.z,
        (h.angle * 180) / Math.PI + rotation,
        y,
        id ? `${h.id}:${id}` : undefined,
      );
    };
    if (h.kind === "home") {
      furnish("sofa", 2, 2);
      furnish("coffee-table", 2, 0.5);
      furnish("kitchen-island", -4, 1.8);
      furnish("sink", -4, -1.5);
      furnish("fridge", -5, -3);
      furnish("coat-rack", 4, 3);
      furnish("floor-lamp", 4, 1, 0, 0, "light");
      if (layout === 1)
        furnish("wall-cupboard", -h.w / 2 + 0.3, 2, 90, 1.3, "cupboard");
      else furnish("dining-hutch", -h.w / 2 + 0.6, 2.5, 90, 0, "cupboard");
      if (h.storeys === 2) {
        furnish("double-bed", -4, -4, 0, 3.2);
        furnish("desk", 1, -4, 0, 3.2);
        furnish("armchair", 1, 2, 0, 3.2);
        stairs.push({
          id: h.id,
          ...local(h.w / 2 - 1.2, h.d / 2 - 1.2),
          yaw: h.angle,
          length: h.d - 2.8,
        });
      }
    } else if (h.kind === "books") {
      for (const x of [-5, 2, 5]) furnish("bookcase", x, -3);
      furnish("round-table", 3, 1);
      furnish("chair", 3, 3);
      furnish("rocking-chair", -5, 2);
    } else if (h.kind === "grocer") {
      for (const x of [-4, 0, 4]) {
        furnish("garage-shelf", x, -3);
        furnish("storage-crate", x, 2);
      }
      furnish("kitchen-counter", 3, 0);
    } else if (h.kind === "museum") {
      furnish("fluted-column", -5, 0);
      furnish("toy-train", 3, 1, 0, 0.81);
      furnish("dining-table", 3, 1);
      furnish("chalkboard", 5, -4);
      furnish("picture-frame", 0, -5, 0, 1);
      furnish("bench", -5, 3);
    } else if (h.kind === "community") {
      for (const x of [-6, 2, 6]) {
        furnish("round-table", x, 0);
        furnish("chair", x, 2);
      }
      furnish("toy-box", -7, -5);
      furnish("chalkboard", 5, -6);
    } else if (h.kind === "farm" || h.kind === "animals") {
      for (const x of [-5, 3]) {
        furnish("feeding-trough", x, -2);
        furnish("hay-bale", x, 2);
      }
      furnish("chicken-coop", 5, -3);
      furnish("kennel", -5, -4);
      furnish("workbench", 5, 3);
    } else if (h.kind === "garden") {
      for (const x of [-5, 0, 5]) furnish("raised-bed", x, -3);
      furnish("fern", 4, 2);
      furnish("workbench", -5, 2);
      furnish("watering-can", -5, 2, 0, 0.96);
    } else if (h.kind === "cafe") {
      furnish("corner-counter", -5, -3);
      furnish("kettle", -5, -3, 0, 1.1);
      for (const x of [1, 5]) {
        furnish("round-table", x, 0);
        furnish("chair", x, 2);
      }
      furnish("armchair", -5, 2);
    } else if (h.kind === "lake") {
      furnish("workbench", -5, -3);
      furnish("garage-shelf", 5, -3);
      furnish("bench", 4, 2);
      furnish("picture-frame", 0, -5, 0, 1.1);
    }
    const entrance = local(-1.4, h.d / 2 + 4);
    landmarks.push({
      name: h.name,
      icon: h.kind === "home" ? "🏠" : h.kind === "farm" ? "🐄" : "⌂",
      ...entrance,
    });
    put(-1.4, 0.02, h.d / 2 + 6, 2, 0.025, 12, 0xe2cfaa);
    const sign = local(0, h.d / 2 + 0.25);
    a.label(h.name, sign.x, 2.85, sign.z, h.angle);
  }
  // Places with an actual route and a reason to stop: paddocks, lake and woodland.
  const waterAreas = [
    { x: 111, z: -113, w: 44, d: 30, shore: { x: 84, z: -110 } },
  ];
  a.box(111, 0.018, -113, 44, 0.025, 30, 0x81b8c6);
  for (const x of [84, 138]) a.box(x, 0.02, -113, 2, 0.025, 40, 0xd9c8a3);
  for (const z of [-133, -93]) a.box(111, 0.02, z, 54, 0.025, 2, 0xd9c8a3);
  a.object("bench", 84, -115, 90);
  a.object("willow", 80, -127);
  a.object("willow", 138, -96);
  a.object("street-sign", 84, -92);
  landmarks.push(
    { name: "Willow lake", icon: "💧", x: 84, z: -110 },
    { name: "Lakeside lookout", icon: "☀", x: 138, z: -112 },
  );
  for (const z of [122, 145])
    for (let x = -87; x <= -60; x += 3) a.object("rail-fence", x, z);
  for (const x of [-89, -58])
    for (let z = 125; z <= 142; z += 3) a.object("rail-fence", x, z, 90);
  a.object("feeding-trough", -73, 125);
  a.object("hay-bale", -83, 141);
  a.object("chicken-coop", -60, 116);
  landmarks.push({ name: "Farm paddock", icon: "🐴", x: -72, z: 119 });
  for (const x of [36, 53, 70, 87, 104, 121, 138])
    for (const z of [104, 121, 138])
      if (!(x === 70 && z === 121))
        a.object((x + z) % 2 ? "birch" : "pine-tree", x, z);
  const trail = [
    { x: 30, z: 98 },
    { x: 70, z: 98 },
    { x: 96, z: 118 },
    { x: 70, z: 132 },
    { x: 30, z: 132 },
  ];
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i],
      q = trail[(i + 1) % trail.length],
      length = Math.hypot(q.x - p.x, q.z - p.z),
      angle = Math.atan2(q.x - p.x, q.z - p.z);
    a.box(
      (p.x + q.x) / 2,
      0.02,
      (p.z + q.z) / 2,
      2,
      0.025,
      length,
      0xd5c7a4,
      false,
      angle,
    );
    a.object("street-sign", p.x - 2, p.z);
  }
  a.object("pond-bridge", 96, 119);
  a.object("bench", 69, 127);
  a.object("round-table", 69, 124);
  a.object("flower-arch", 30, 96);
  a.object("swing", -10, 111, 0, 0, "region:swing");
  a.object("seesaw", -4, 111, 0, 0, "region:seesaw");
  a.object("trampoline", 3, 111, 0, 0, "region:trampoline");
  a.object("play-slide", 9, 111, 0, 0, "region:slide");
  landmarks.push(
    { name: "Woodland trail", icon: "🌲", x: 30, z: 98 },
    { name: "Forest picnic", icon: "☀", x: 69, z: 130 },
    { name: "Adventure playground", icon: "🛝", x: -10, z: 106 },
  );
  const plots = [
    ...base.plots,
    { x: 25, z: 108, w: 14, d: 14 },
    { x: 54, z: 108, w: 14, d: 14 },
    { x: -115, z: 123, w: 16, d: 14 },
    { x: 117, z: 91, w: 14, d: 14 },
  ];
  for (const p of plots.slice(4)) {
    a.box(p.x, 0.008, p.z, p.w, 0.012, p.d, 0xb6ce96);
    a.label("BUILD HERE", p.x, 1.2, p.z + p.d / 2);
  }
  const staticSolids = [...base.solids, ...a.solids],
    staticRender = a.finish(doors);
  batchDoorLeaves(doors);
  return {
    ...base,
    layout,
    houses: [...base.houses, ...houses],
    rooms: [...base.rooms, ...rooms],
    doors: [...base.doors, ...doors],
    solids: [
      ...staticSolids,
      ...a.props.flatMap((p) => blockColliders(p.block)),
    ],
    staticSolids,
    authoredProps: a.props,
    seats: [...base.seats, ...a.seats],
    stairs,
    plots,
    landmarks: [...base.landmarks, ...landmarks],
    waterAreas,
    mapRoads: [...base.mapRoads, ...roads],
    activityRange: 148,
    staticRender: {
      updateVisibility(camera: any, far: number) {
        base.staticRender.updateVisibility(camera, far);
        staticRender.updateVisibility(camera, far);
      },
    },
  };
}
