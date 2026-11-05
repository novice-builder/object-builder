import * as T from "three";
import { TownAuthor } from "./authoring";
import { addSwingDoor } from "../legacy06/buildings-06.js";
import { batchDoorLeaves } from "../legacy06/door-render.js";
import { Aircraft } from "../simulation/aircraft";
export function makeAirfield(parent: T.Group) {
  const a = new TownAuthor(parent),
    doors: any[] = [],
    houses = [
      {
        id: "airfield-terminal",
        name: "Sunbeam air terminal",
        x: 150,
        z: -166,
        w: 22,
        d: 12,
        angle: 0,
      },
      {
        id: "airfield-hangar",
        name: "Sunbeam hangar",
        x: 178,
        z: -186,
        w: 22,
        d: 22,
        angle: 0,
      },
    ];
  // Terminal: clear central aisle, genuine glazed entrance and furnished waiting room.
  a.box(150, 0.015, -166, 22, 0.025, 12, 0xd8cfb7);
  for (const x of [139, 161]) a.box(x, 1.6, -166, 0.2, 3.2, 12, 0xc2d0bf, true);
  a.box(150, 1.6, -172, 22, 3.2, 0.2, 0xc2d0bf, true);
  for (const [x, w] of [
    [143.45, 8.9],
    [155.15, 11.7],
  ])
    a.box(x, 1.6, -160, w, 3.2, 0.2, 0xc2d0bf, true);
  a.box(148.6, 2.8, -160, 1.4, 0.8, 0.2, 0xc2d0bf, true);
  a.box(150, 3.3, -166, 23, 0.2, 13, 0x809d96, true);
  addSwingDoor({
    scene: a.group,
    material: a.material,
    doors,
    h: houses[0],
    local: (x: number, z: number) => ({ x: 150 + x, z: -166 + z }),
    id: "airfield-terminal",
  });
  for (const x of [142, 145, 153]) {
    a.object("sofa", x, -168);
    a.object("coffee-table", x, -166);
  }
  a.object("kitchen-counter", 157, -169);
  a.object("kettle", 157, -169, 0, 1.1);
  a.object("floor-lamp", 159, -168, 0, 0, "airfield:light");
  a.object("bookcase", 142, -171);
  a.object("toy-box", 155, -162);
  a.object("planter", 140, -158);
  a.label("SUNBEAM AIRFIELD", 150, 3.8, -160);
  // 16 m portal and 4.6 m headroom really accommodate the 14.4 m span aircraft.
  a.box(178, 0.015, -186, 22, 0.025, 22, 0xc4c8bc);
  for (const x of [167, 189]) a.box(x, 2.7, -186, 0.2, 5.4, 22, 0xa6bbb0, true);
  a.box(178, 2.7, -197, 22, 5.4, 0.2, 0xa6bbb0, true);
  for (const x of [168.5, 187.5])
    a.box(x, 2.7, -175, 3, 5.4, 0.2, 0xa6bbb0, true);
  a.box(178, 5, -175, 16, 0.8, 0.2, 0xa6bbb0, true);
  a.box(178, 5.5, -186, 23, 0.2, 23, 0x7e9d96, true);
  for (const x of [168.5, 187.5]) {
    a.object("tool-cabinet", x, -192);
    a.object("workbench", x, -195);
  }
  const pivot = new T.Group(),
    leaf = new T.Group(),
    m = new T.Mesh(new T.BoxGeometry(16, 4.6, 0.1), a.material(0xa6bbb0));
  m.position.y = 2.3;
  leaf.add(m);
  pivot.add(leaf);
  pivot.position.set(178, 0, -175);
  a.group.add(pivot);
  doors.push({
    id: "airfield-hangar",
    kind: "roller",
    pivot,
    leaf,
    baseAngle: 0,
    center: { x: 178, z: -175 },
    hinge: { x: 178, z: -175 },
    width: 16,
    height: 4.6,
    open: false,
  });
  a.label("HANGAR", 178, 5.8, -175);
  a.box(184, 0.016, -163, 43, 0.025, 34, 0xb2beb3);
  a.box(224, 0.025, -172, 10, 0.025, 64, 0x7c938b);
  for (let z = -198; z <= -145; z += 8)
    a.box(224, 0.045, z, 0.3, 0.015, 4, 0xeee3c9);
  for (const z of [-202, -142])
    for (const x of [221, 224, 227]) a.box(x, 0.045, z, 1, 0.015, 3, 0xeee3c9);
  a.box(148.6, 0.03, -150, 2, 0.03, 20, 0xd8c6a5);
  a.box(164, 0.03, -156, 2, 0.03, 30, 0xd8c6a5);
  a.box(170, 0.03, -151, 12, 0.03, 2, 0xd8c6a5);
  a.object("bench", 216, -181, 90);
  a.object("street-sign", 145, -142);
  a.object("street-sign", 199, -174);
  const render = a.finish(doors);
  batchDoorLeaves(doors);
  const aircraft = new Aircraft(parent);
  return {
    ...a,
    doors,
    houses,
    rooms: [
      { x: 150, y: 0, z: -166 },
      { x: 178, y: 0, z: -186 },
    ],
    aircraft,
    render,
    landmarks: [
      { name: "Airfield terminal", icon: "✈", x: 148.6, z: -157 },
      { name: "Aircraft boarding ramp", icon: "✈", x: 172, z: -151 },
      { name: "Airfield hangar", icon: "⌂", x: 178, z: -171 },
      { name: "Runway lookout", icon: "🔭", x: 216, z: -185 },
    ],
  };
}
