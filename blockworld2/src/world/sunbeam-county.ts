import * as T from "three";
import { makeSunbeamRegion } from "./sunbeam-region";
import { TownAuthor } from "./authoring";
import { makeDesignedHouse } from "../legacy06/buildings-06.js";
import { batchDoorLeaves } from "../legacy06/door-render.js";
import { blockColliders } from "../build/registry";
export const COUNTY_BUILDINGS = [
  {
    id: "hill-cottage",
    name: "Hill cottage",
    x: -116,
    z: -188,
    w: 14,
    d: 12,
    angle: Math.PI,
    style: "gable",
    kind: "home",
  },
  {
    id: "river-house",
    name: "River village house",
    x: -76,
    z: -188,
    w: 16,
    d: 12,
    angle: Math.PI,
    style: "hip",
    kind: "home",
    garage: true,
  },
  {
    id: "village-home",
    name: "Tall village home",
    x: -36,
    z: -188,
    w: 16,
    d: 14,
    angle: Math.PI,
    style: "gable",
    kind: "home",
    storeys: 2,
  },
  {
    id: "village-hall",
    name: "Hill village hall",
    x: 35,
    z: -188,
    w: 20,
    d: 14,
    angle: Math.PI,
    style: "hip",
    kind: "community",
  },
  {
    id: "country-grocer",
    name: "Country market",
    x: 74,
    z: -188,
    w: 16,
    d: 12,
    angle: Math.PI,
    style: "shed",
    kind: "shop",
  },
  {
    id: "ranch-lodge",
    name: "Meadow ranch lodge",
    x: 185,
    z: 112,
    w: 18,
    d: 14,
    angle: Math.PI / 2,
    style: "gable",
    kind: "home",
    garage: true,
  },
  {
    id: "ranch-barn",
    name: "Meadow riding barn",
    x: 185,
    z: 156,
    w: 22,
    d: 14,
    angle: Math.PI / 2,
    style: "gable",
    kind: "farm",
    garage: true,
  },
  {
    id: "ranger-station",
    name: "Woodland ranger station",
    x: -188,
    z: 118,
    w: 16,
    d: 12,
    angle: -Math.PI / 2,
    style: "shed",
    kind: "nature",
  },
  {
    id: "bridge-cafe",
    name: "River bridge cafe",
    x: -188,
    z: -105,
    w: 18,
    d: 12,
    angle: -Math.PI / 2,
    style: "hip",
    kind: "cafe",
  },
  {
    id: "meadow-garage",
    name: "Country garage",
    x: 120,
    z: 190,
    w: 18,
    d: 12,
    angle: 0,
    style: "shed",
    kind: "workshop",
    garage: true,
  },
];
export function makeSunbeamCounty(scene: T.Group, layout = 1) {
  const base = makeSunbeamRegion(scene, 2),
    a = new TownAuthor(scene),
    doors: any[] = [],
    rooms: any[] = [],
    houses: any[] = [],
    landmarks: any[] = [],
    stairs: any[] = [];
  const roads = [
    { x: 0, z: -210, w: 430, d: 7 },
    { x: 0, z: 210, w: 430, d: 7 },
    { x: -210, z: 0, w: 7, d: 427 },
    { x: 210, z: 0, w: 7, d: 427 },
    { x: 8, z: 0, w: 7, d: 420 },
    { x: -148, z: -56, w: 124, d: 7 },
    { x: 148, z: -56, w: 124, d: 7 },
    { x: 109, z: -140, w: 202, d: 6 },
  ];
  for (const r of roads) a.box(r.x, 0.015, r.z, r.w, 0.03, r.d, 0x81948d);
  for (const z of [-204.5, 204.5]) a.box(0, 0.025, z, 423, 0.03, 2, 0xd8c6a5);
  for (const x of [-204.5, 204.5]) a.box(x, 0.025, 0, 2, 0.03, 410, 0xd8c6a5);
  for (const spec of COUNTY_BUILDINGS) {
    const h = {
      ...spec,
      rooms: spec.kind === "home",
      wall:
        spec.kind === "farm"
          ? 0xbf9474
          : spec.kind === "home"
            ? 0xd9c5a2
            : 0xb9cbbd,
      roof: spec.style === "shed" ? 0x75928b : 0x9b7e66,
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
      if (
        h.kind !== "home" &&
        ((Math.abs(w - 1.8) < 0.001 &&
          Math.abs(hh - 0.56) < 0.001 &&
          Math.abs(d - 2.4) < 0.001) ||
          (Math.abs(w - 1.75) < 0.001 && Math.abs(hh - 0.13) < 0.001) ||
          (Math.abs(w - 1.5) < 0.001 &&
            (Math.abs(hh - 0.16) < 0.001 || Math.abs(hh - 0.9) < 0.001)))
      )
        return;
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
      y = 0,
      rotation = 0,
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
      furnish("sofa", 3, 2);
      furnish("coffee-table", 3, 0.5);
      furnish("sink", -4, 1);
      furnish("kitchen-counter", -5, 1);
      furnish("fridge", -5, -3);
      furnish("floor-lamp", 4, 1, 0, 0, "light");
      if (h.storeys === 2) {
        furnish("desk", 1, -4, 3.2);
        furnish("single-bed", -4, -4, 3.2);
        stairs.push({
          id: h.id,
          ...local(h.w / 2 - 1.2, h.d / 2 - 1.2),
          yaw: h.angle,
        });
      }
    }
    if (h.kind === "community") {
      for (const x of [-6, 2, 6]) {
        furnish("round-table", x, 0);
        furnish("chair", x, 2);
      }
      furnish("bookcase", 5, -5);
      furnish("toy-box", -5, -5);
    }
    if (h.kind === "shop") {
      for (const x of [-5, 0, 5]) {
        furnish("garage-shelf", x, -3);
        furnish("storage-crate", x, 2);
      }
      furnish("kitchen-counter", 3, 0);
    }
    if (h.kind === "farm") {
      for (const x of [-6, -3, 3, 6]) furnish("hay-bale", x, -3);
      furnish("feeding-trough", -5, 2);
      furnish("hitching-post", 5, 2);
    }
    if (h.kind === "nature") {
      furnish("desk", 3, -3);
      furnish("chair", 3, -1);
      furnish("bookcase", -5, -3);
      furnish("picture-frame", 0, -4, 1.2);
      furnish("bench", -4, 2);
    }
    if (h.kind === "cafe") {
      furnish("kitchen-counter", -5, -3);
      furnish("kettle", -5, -3, 1.1);
      for (const x of [1, 5]) {
        furnish("round-table", x, 0);
        furnish("chair", x, 2);
      }
    }
    if (h.kind === "workshop") {
      furnish("workbench", -5, -3);
      furnish("tool-cabinet", 4, -3);
      furnish("tyre-stack", 5, 2);
      furnish("air-compressor", -4, 2);
    }
    furnish("flower-bed", h.w / 2 - 2, h.d / 2 + 3);
    furnish("planter", -h.w / 2 + 2, h.d / 2 + 3);
    furnish("post-box", h.w / 2 + 1, h.d / 2 + 2);
    put(-1.4, 0.02, h.d / 2 + 6, 2, 0.025, 12, 0xddc9a6);
    const p = local(-1.4, h.d / 2 + 4);
    landmarks.push({
      name: h.name,
      icon: h.kind === "farm" ? "🐴" : h.kind === "home" ? "🏠" : "⌂",
      ...p,
    });
    const sign = local(0, h.d / 2 + 0.25);
    a.label(h.name, sign.x, 2.9, sign.z);
  }
  // A connected, signed ~1.6 km riding/walking loop inside the road ring.
  const trail = [
    { x: -198, z: -198 },
    { x: 8, z: -198 },
    { x: 198, z: -198 },
    { x: 198, z: 4 },
    { x: 198, z: 198 },
    { x: 8, z: 198 },
    { x: -198, z: 198 },
    { x: -198, z: 4 },
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
      2.5,
      0.025,
      length,
      0xcbbd99,
      false,
      angle,
    );
    a.object("street-sign", p.x + (p.x < 0 ? 2 : -2), p.z);
  }
  for (const [x, z, name] of [
    [-198, 35, "River riding trail"],
    [198, 60, "Ranch riding trail"],
    [38, 198, "Meadow trail"],
    [-198, 180, "Woodland loop"],
  ] as [number, number, string][])
    landmarks.push({ name, icon: "🐴", x, z });
  // The river has a real open road crossing; water recovery excludes the deck.
  a.box(-175, 0.018, -35, 14, 0.025, 150, 0x83b8c4);
  a.box(-175, 0.025, -56, 19, 0.03, 8, 0xb29a78);
  for (const z of [-60.5, -51.5])
    a.box(-175, 0.55, z, 19, 1.1, 0.12, 0x8e795c, true);
  const waterAreas = [
    ...base.waterAreas,
    { x: -175, z: -86.5, w: 14, d: 47, shore: { x: -164, z: -86 } },
    { x: -175, z: -4.5, w: 14, d: 89, shore: { x: -164, z: 0 } },
    { x: -145, z: 174, w: 52, d: 30, shore: { x: -115, z: 174 } },
  ];
  a.box(-145, 0.018, 174, 52, 0.025, 30, 0x83b8c4);
  a.object("willow", -114, 185);
  a.object("bench", -114, 176, 90);
  landmarks.push(
    { name: "River crossing", icon: "🌉", x: -175, z: -56 },
    { name: "Meadow lake", icon: "💧", x: -115, z: 174 },
  );
  // Scenery alternates farms, groves, gardens and open building areas.
  for (const x of [-225, -160, -140, 145, 165, 225])
    for (const z of [-145, -85, 85, 145, 205])
      if (!(x > 130 && z < -120) && !(x < -130 && z > 150))
        a.object((x + z) % 3 ? "birch" : "oak-tree", x, z);
  for (const x of [-135, -125, -115])
    for (const z of [135, 145, 155]) a.object("fruit-tree", x, z);
  for (const x of [145, 155, 165])
    for (const z of [175, 184]) a.object("raised-bed", x, z);
  for (const z of [128, 146])
    for (let x = 150; x < 178; x += 2) a.object("rail-fence", x, z);
  for (const x of [149, 178])
    for (let z = 130; z <= 144; z += 2)
      if (!(x === 178 && z >= 134 && z <= 140))
        a.object("rail-fence", x, z, 90);
  a.object("feeding-trough", 155, 131);
  a.object("hitching-post", 176, 137);
  a.object("hay-bale", 155, 142);
  a.object("swing", -105, -168, 0, 0, "county:village-swing");
  a.object("bench", -101, -168);
  landmarks.push(
    { name: "Meadow ranch paddock", icon: "🐴", x: 180, z: 137 },
    { name: "Airfield reservation", icon: "✈", x: 160, z: -140 },
  );
  a.box(183, 0.005, -181, 100, 0.008, 100, 0xb3c69b);
  a.label("FUTURE AIRFIELD", 160, 1.8, -145);
  const plots = [
    ...base.plots,
    { x: -140, z: -155, w: 20, d: 16 },
    { x: -42, z: 187, w: 20, d: 18 },
    { x: 48, z: 174, w: 20, d: 18 },
    { x: 180, z: -90, w: 18, d: 18 },
    { x: -220, z: 55, w: 18, d: 18 },
    { x: 50, z: -220, w: 20, d: 16 },
  ];
  for (const p of plots.slice(base.plots.length)) {
    a.box(p.x, 0.008, p.z, p.w, 0.012, p.d, 0xb5ca96);
    a.label("BUILD HERE", p.x, 1.2, p.z + p.d / 2);
  }
  const authoredBounds = new T.Box3().setFromObject(a.group);
  const staticSolids = [...base.staticSolids, ...a.solids],
    props = [...base.authoredProps, ...a.props],
    render = a.finish(doors);
  batchDoorLeaves(doors);
  return {
    ...base,
    layout,
    houses: [...base.houses, ...houses],
    rooms: [...base.rooms, ...rooms],
    doors: [...base.doors, ...doors],
    staticSolids,
    authoredProps: props,
    solids: [...staticSolids, ...props.flatMap((p) => blockColliders(p.block))],
    seats: [...base.seats, ...a.seats],
    stairs: [...base.stairs, ...stairs],
    landmarks: [...base.landmarks, ...landmarks],
    plots,
    waterAreas,
    mapRoads: [...base.mapRoads, ...roads],
    activityRange: 238,
    developedBounds: {
      minX: authoredBounds.min.x,
      maxX: authoredBounds.max.x,
      minZ: authoredBounds.min.z,
      maxZ: authoredBounds.max.z,
    },
    staticRender: {
      updateVisibility(camera: any, far: number) {
        base.staticRender.updateVisibility(camera, far);
        render.updateVisibility(camera, far);
      },
    },
  };
}
