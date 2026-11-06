import { REEDBANK } from "./reedbank-data";
import { worldBounds, valeRivers } from "./vale-data";
import { ALDERWICK } from "./alderwick-data";
import {
  riverX,
  WORLDS,
  type SceneId,
  type Obstacle,
  type Landmark,
} from "./landscape";
export interface MapPath {
  points: number[][];
  width: number;
}
export interface MapDestination {
  id: string;
  name: string;
  x: number;
  z: number;
}
export interface WorldMapData {
  scene: SceneId;
  bounds: ReturnType<typeof worldBounds>;
  paths: readonly MapPath[];
  buildings: readonly Obstacle[];
  trees: { x: number; z: number; radius: number }[];
  rivers: number[][][];
  destinations: MapDestination[];
}
export function createMapData(
  scene: SceneId,
  landscape: {
    paths: MapPath[];
    obstacles: Obstacle[];
    landmarks: Landmark[];
    mapBuildings?: Obstacle[];
    trees?: { x: number; z: number; radius: number }[];
  },
): WorldMapData {
  const bounds = worldBounds(scene),
    rivers: number[][][] = [];
  if (scene !== "meadow")
    for (let channel = 0; channel < (scene === "vale" ? 2 : 1); channel++) {
      const points: number[][] = [];
      for (let z = bounds.minZ; z <= bounds.maxZ; z += 2)
        points.push([scene === "vale" ? valeRivers(z)[channel] : riverX(z), z]);
      rivers.push(points);
    }
  const destinations =
    scene === "vale"
      ? [
          { id: "home", name: "Willowmere", x: -105, z: 18 },
          { id: "woodland", name: "Whispering Wood", x: 0, z: 24 },
          { id: "meadow", name: "Maker’s Meadow", x: 105, z: 16 },
          { id: "brookside", name: "Brookside", x: 78, z: 52 },
          { id: "foresters", name: "Foresters’ Rest", x: -23, z: -38 },
        ]
      : [
          {
            id: "home",
            name: WORLDS.find((w) => w.id === scene)!.name,
            ...WORLDS.find((w) => w.id === scene)!.spawn,
          },
          ...landscape.landmarks
            .filter((l) => !["bridge", "well"].includes(l.id))
            .slice(0, 3),
        ];
  if (
    scene === "vale" &&
    landscape.landmarks.some((l) => l.id === "lodge-door")
  )
    destinations.push({ id: "lodge", name: "Meadow Lodge", x: 128, z: -36 });
  if (
    scene === "vale" &&
    landscape.landmarks.some((l) => l.id === ALDERWICK.id)
  )
    destinations.push({ ...ALDERWICK });
  if (scene === "vale" && landscape.landmarks.some((l) => l.id === REEDBANK.id))
    destinations.push({ ...REEDBANK });
  return {
    scene,
    bounds,
    paths: landscape.paths,
    buildings: [
      ...landscape.obstacles.filter((o) => o.name?.startsWith("building_")),
      ...(landscape.mapBuildings || []),
    ],
    trees:
      landscape.trees ||
      landscape.obstacles
        .filter((o) => o.name === "tree")
        .map((o) => ({
          x: (o.minX + o.maxX) / 2,
          z: (o.minZ + o.maxZ) / 2,
          radius: 1.6,
        })),
    rivers,
    destinations,
  };
}
export class MapTransform {
  x = 0;
  z = 0;
  scale = 1;
  constructor(
    readonly bounds: ReturnType<typeof worldBounds>,
    readonly width: number,
    readonly height: number,
  ) {
    this.fit();
  }
  fit() {
    this.x = (this.bounds.minX + this.bounds.maxX) / 2;
    this.z = (this.bounds.minZ + this.bounds.maxZ) / 2;
    this.scale = Math.min(
      (this.width - 60) / (this.bounds.maxX - this.bounds.minX),
      (this.height - 90) / (this.bounds.maxZ - this.bounds.minZ),
    );
  }
  screen(x: number, z: number) {
    return {
      x: (x - this.x) * this.scale + this.width / 2,
      y: (z - this.z) * this.scale + this.height / 2,
    };
  }
  world(x: number, y: number) {
    return {
      x: (x - this.width / 2) / this.scale + this.x,
      z: (y - this.height / 2) / this.scale + this.z,
    };
  }
  zoom(factor: number, x = this.width / 2, y = this.height / 2) {
    const before = this.world(x, y),
      fit = Math.min(
        (this.width - 60) / (this.bounds.maxX - this.bounds.minX),
        (this.height - 90) / (this.bounds.maxZ - this.bounds.minZ),
      );
    this.scale = Math.max(fit, Math.min(fit * 8, this.scale * factor));
    const after = this.world(x, y);
    this.x += before.x - after.x;
    this.z += before.z - after.z;
    this.clamp();
  }
  pan(dx: number, dy: number) {
    this.x -= dx / this.scale;
    this.z -= dy / this.scale;
    this.clamp();
  }
  private clamp() {
    this.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.x));
    this.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, this.z));
  }
}
