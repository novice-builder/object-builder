import { makeSunbeamTown } from "./sunbeam-town";
import { makeSunbeamRegion } from "./sunbeam-region";
import { makeSunbeamCounty } from "./sunbeam-county";
import { makeHomeSquare } from "./home-square";
import * as T from "three";
import { makeWorld } from "../legacy06/world.js";
export type TemplateId =
  | "legacy-06"
  | "blank"
  | "home-square"
  | "sunbeam-town"
  | "sunbeam-region"
  | "sunbeam-county";
export const TEMPLATES = [
  {
    id: "sunbeam-county" as TemplateId,
    name: "Sunbeam County",
    icon: "🌄",
    layout: 2,
    spawn: { x: -21.4, y: 0, z: 0, yaw: 0, pitch: 0 },
  },
  {
    id: "sunbeam-region" as TemplateId,
    name: "Sunbeam Region",
    layout: 2,
    icon: "🌳",
    spawn: { x: -21.4, y: 0, z: 0, yaw: 0, pitch: 0 },
  },
  {
    id: "sunbeam-town" as TemplateId,
    name: "Sunbeam Town",
    icon: "☀",
    spawn: { x: -21.4, y: 0, z: 0, yaw: 0, pitch: 0 },
  },
  {
    id: "home-square" as TemplateId,
    name: "Home & Square",
    icon: "☀",
    spawn: { x: -21.4, y: 0, z: 0, yaw: 0, pitch: 0 },
  },
  {
    id: "legacy-06" as TemplateId,
    name: "Legacy neighbourhood",
    icon: "🏡",
    spawn: { x: -14.4, y: 0, z: -1.2, yaw: 0, pitch: 0 },
  },
  {
    id: "blank" as TemplateId,
    name: "Blank creative",
    icon: "🧱",
    spawn: { x: 0, y: 0, z: 8, yaw: 0, pitch: 0 },
  },
];
export function latestLayout(id: TemplateId) {
  return TEMPLATES.find((t) => t.id === id)?.layout || 1;
}
export function createWorld(
  group: T.Group,
  id: TemplateId,
  blocks: any[] = [],
  layout = latestLayout(id),
): any {
  if (id === "sunbeam-county") return makeSunbeamCounty(group, layout);
  if (id === "sunbeam-region") return makeSunbeamRegion(group, layout);
  if (id === "sunbeam-town") return makeSunbeamTown(group);
  if (id === "home-square") return makeHomeSquare(group);
  if (id === "legacy-06") return makeWorld(group, blocks);
  const ground = new T.Mesh(
    new T.PlaneGeometry(500, 500),
    new T.MeshLambertMaterial({ color: 0xa9c98a }),
  );
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);
  ground.updateMatrixWorld();
  return {
    ground,
    solids: [],
    doors: [],
    houses: [],
    rooms: [],
    roads: [],
    staticRender: { updateVisibility() {} },
  };
}
