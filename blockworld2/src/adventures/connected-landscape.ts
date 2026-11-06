import { fitBridge } from "./bridge-fit";
import { NORTH_CROSSING } from "./crossings";
import {
  REEDBANK,
  REEDBANK_ROADS,
  REEDBANK_BUILDINGS,
  REEDBANK_GARDENS,
} from "./reedbank-data";
import * as T from "three";
import { buildingEntry, type BuildingEntry } from "./building-entry";
import { Lodge } from "./lodge";
import { StaticInstanceCuller, fogDepthVisible } from "./instance-culling";
import {
  ALDERWICK,
  ALDERWICK_ROADS,
  ALDERWICK_BUILDINGS,
  ALDERWICK_GARDENS,
} from "./alderwick-data";
import { AssetLibrary } from "./assets";
import {
  Landscape,
  blocked,
  distanceSegment,
  smoothTrail,
  type Obstacle,
  type Landmark,
} from "./landscape";
import { trailGeometry, closestTrailPoint } from "./trail-geometry";
import {
  VALE_REGIONS,
  valeGround,
  valeWalk,
  valeWater,
  valeRivers,
  inWorld,
} from "./vale-data";
export const CONNECTING_ROADS = [
  {
    points: [
      [-66, 8],
      [-58, 13],
      [-51, 21],
      [-38, 16],
      [-23, 12],
      [-9, 8],
    ],
    width: 2.8,
  },
  {
    points: [
      [46, 8],
      [62, 8],
      [78, 12],
      [90, 19],
      [105, 25],
    ],
    width: 3.2,
  },
  {
    points: [
      [105, 25],
      [95, 33],
      [85, 39],
      [78, 44],
      [78, 64],
    ],
    width: 3,
  },
  {
    points: [
      [2, -24],
      [-10, -30],
      [-23, -38],
    ],
    width: 2.2,
  },
];
export class ConnectedLandscape {
  readonly id = "vale";
  lodge?: Lodge;
  mapBuildings: Obstacle[] = [];
  private permanent: Obstacle[] = [];
  group = new T.Group();
  obstacles: Obstacle[] = [];
  cameraBodies: Obstacle[] = [];
  entrances: BuildingEntry[] = [];
  landmarks: Landmark[] = [];
  paths: { points: number[][]; width: number }[] = [];
  instances = 0;
  trees: { x: number; z: number; radius: number }[] = [];
  private regions: Landscape[] = [];
  private visibility: {
    mesh: T.Mesh;
    sphere: T.Sphere;
    culler?: StaticInstanceCuller;
  }[] = [];
  private frustum = new T.Frustum();
  private projection = new T.Matrix4();
  private geometry: T.BufferGeometry[] = [];
  private materials: T.Material[] = [];
  constructor(
    readonly library: AssetLibrary,
    readonly layout: 3 | 4 | 5 | 6 = 3,
    doorOpen = false,
  ) {
    this.terrain();
    for (const r of VALE_REGIONS) {
      const land = new Landscape(library, r.id, 3, {
        terrain: false,
        populate: false,
        fullSizeTents: true,
        alignedBridge: layout >= 6,
        reserved:
          layout >= 6
            ? (x, z) =>
                Math.abs(z + r.z - NORTH_CROSSING.z) < 3 &&
                Math.abs(x + r.x - valeRivers(NORTH_CROSSING.z)[1]) < 8
            : undefined,
        ground: (x, z) => valeGround(x + r.x, z + r.z),
        walk: (x, z) => valeWalk(x + r.x, z + r.z),
      });
      land.group.position.set(r.x, 0, r.z);
      this.group.add(land.group);
      this.regions.push(land);
      this.obstacles.push(
        ...land.obstacles.map((b) => ({
          ...b,
          minX: b.minX + r.x,
          maxX: b.maxX + r.x,
          minZ: b.minZ + r.z,
          maxZ: b.maxZ + r.z,
        })),
      );
      this.cameraBodies.push(
        ...land.cameraBodies.map((b) => ({
          ...b,
          minX: b.minX + r.x,
          maxX: b.maxX + r.x,
          minZ: b.minZ + r.z,
          maxZ: b.maxZ + r.z,
        })),
      );
      this.entrances.push(
        ...land.entrances.map((e) => ({
          ...e,
          id: r.id + ":" + e.id,
          x: e.x + r.x,
          z: e.z + r.z,
        })),
      );
      this.landmarks.push(
        ...land.landmarks.map((l) => ({
          ...l,
          id: r.id + ":" + l.id,
          x: l.x + r.x,
          z: l.z + r.z,
        })),
      );
      this.paths.push(
        ...land.paths.map((p) => ({
          width: p.width,
          points: p.points.map(([x, z]) => [x + r.x, z + r.z]),
        })),
      );
      this.instances += land.instances;
    }
    // Matching simple earth ribbon; no new texture or render target is needed.
    const road = this.regions[0].trailSurface;
    for (const path of CONNECTING_ROADS) {
      const points = smoothTrail(path.points);
      this.paths.push({ points, width: path.width });
      this.mesh(trailGeometry(points, path.width, valeWalk), road);
    }
    this.settlements();
    if (layout >= 5) this.alderwick();
    if (layout >= 6) this.reedbank();
    if (layout >= 4) {
      this.lodge = new Lodge(library, doorOpen);
      this.group.add(this.lodge.group);
      const bounds = new T.Box3().setFromObject(this.lodge.group);
      this.mapBuildings.push({
        minX: bounds.min.x,
        maxX: bounds.max.x,
        minZ: bounds.min.z,
        maxZ: bounds.max.z,
        height: bounds.max.y,
        name: "building_lodge",
      });
      this.obstacles.push(
        ...this.lodge.walls,
        ...this.lodge.furniture,
        this.lodge.doorBody(),
      );
      this.landmarks.push(...this.lodge.landmarks);
      // Reserve the actual interior/entrance against scenery and player placement.
      this.obstacles.push({
        minX: 124.4,
        maxX: 131.6,
        minZ: -45.6,
        maxZ: -38.4,
        height: 0,
        name: "lodge-reserve",
      });
      const path = {
        points: smoothTrail([
          [119, -11],
          [125, -19],
          [128, -28],
          [128, -38.4],
        ]),
        width: 2.2,
      };
      this.paths.push(path);
      this.mesh(
        trailGeometry(path.points, path.width, valeWalk),
        this.regions[0].trailSurface,
      );
    }
    this.populate();
    this.obstacles = this.obstacles.filter((o) => o.name !== "lodge-reserve");
    this.permanent = this.obstacles.filter((o) => o.name !== "lodge-door");
    this.group.updateMatrixWorld(true);
    this.group.traverse((o) => {
      if (!(o instanceof T.Mesh) || o.userData.dynamic) return;
      let sphere: T.Sphere;
      if (o instanceof T.InstancedMesh) {
        o.computeBoundingSphere();
        sphere = o.boundingSphere!.clone();
      } else {
        o.geometry.computeBoundingSphere();
        sphere = o.geometry.boundingSphere!.clone();
      }
      sphere.applyMatrix4(o.matrixWorld);
      this.visibility.push({
        mesh: o,
        sphere,
        culler:
          o instanceof T.InstancedMesh
            ? new StaticInstanceCuller(o)
            : undefined,
      });
    });
  }
  private mesh(g: T.BufferGeometry, m: T.Material) {
    const o = new T.Mesh(g, m);
    o.receiveShadow = true;
    this.geometry.push(g);
    this.group.add(o);
    return o;
  }
  private terrain() {
    const g = new T.PlaneGeometry(480, 300, 192, 120);
    g.rotateX(-Math.PI / 2);
    const p = g.getAttribute("position"),
      colors: number[] = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i);
      p.setY(i, valeGround(x, z));
      const wood = Math.exp(-(x * x) / (52 * 52));
      const c = new T.Color(0x799756).lerp(new T.Color(0x527844), wood);
      c.offsetHSL(
        Math.sin(x * 0.17 + z * 0.23) * 0.012,
        0,
        Math.cos(x * 0.11 - z * 0.19) * 0.012,
      );
      const bank = Math.max(
        ...valeRivers(z).map((r) => Math.max(0, 1 - Math.abs(x - r) / 5)),
      );
      c.lerp(new T.Color(0xc1b592), bank * 0.8);
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const ground = new T.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      flatShading: true,
    });
    this.materials.push(ground);
    this.mesh(g, ground);
    const water = new T.MeshStandardMaterial({
      color: 0x69afb5,
      roughness: 0.4,
    });
    this.materials.push(water);
    for (let river = 0; river < 2; river++) {
      const v: number[] = [],
        ix: number[] = [];
      for (let i = 0; i <= 120; i++) {
        const z = -150 + i * 2.5,
          x = valeRivers(z)[river];
        v.push(x - 2.9, -0.58, z, x + 2.9, -0.58, z);
        if (i < 120) {
          const n = i * 2;
          ix.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.Float32BufferAttribute(v, 3));
      geometry.setIndex(ix);
      geometry.computeVertexNormals();
      this.mesh(geometry, water);
    }
  }
  private place(id: string, x: number, z: number, scale: number, yaw = 0) {
    const o = this.library.create(id, scale);
    o.position.set(x, valeWalk(x, z), z);
    o.rotation.y = yaw;
    this.group.add(o);
    const entrance = buildingEntry(this.library, id, o);
    if (entrance) this.entrances.push(entrance);
    o.updateMatrixWorld(true);
    const b = new T.Box3().setFromObject(o),
      inset = id.startsWith("building_") ? 0.45 : 0.08;
    this.obstacles.push({
      minX: b.min.x + inset,
      maxX: b.max.x - inset,
      minZ: b.min.z + inset,
      maxZ: b.max.z - inset,
      height: b.max.y,
      name: id,
    });
    return o;
  }
  private settlements() {
    // Rural clusters contrast with Willowmere's dense market square.
    const driveways = this.regions[0].trailSurface.clone();
    driveways.name = "Brookside earth driveways";
    // The main road covers coplanar driveway ends cleanly, without raising walking surfaces.
    driveways.polygonOffset = true;
    driveways.polygonOffsetFactor = 1;
    driveways.polygonOffsetUnits = 1;
    this.materials.push(driveways);
    for (const [x, z, yaw] of [
      [69, 47, Math.PI / 2],
      [87, 47, -Math.PI / 2],
      [69, 59, Math.PI / 2],
      [87, 60, -Math.PI / 2],
      [78, 68, Math.PI],
    ]) {
      this.place(
        x === 87 ? "building_home_B_blue" : "building_home_A_green",
        x,
        z,
        6.8,
        yaw,
      );
      const end = [x + Math.sin(yaw) * 4, z + Math.cos(yaw) * 4];
      const path = { points: [[78, end[1]], end], width: 1.8 };
      this.paths.push(path);
      this.mesh(trailGeometry(path.points, path.width, valeWalk), driveways);
    }
    const marketPath = {
      points: [
        [78, 56],
        [92, 56],
      ],
      width: 2.2,
    };
    this.paths.push(marketPath);
    this.mesh(
      trailGeometry(marketPath.points, marketPath.width, valeWalk),
      driveways,
    );
    this.place("building_market_blue", 96, 56, 6.8, -Math.PI / 2);
    this.place("building_well_blue", 78, 39, 5);
    this.place("building_home_A_blue", -29, -44, 6.5, 0.5);
    this.place("building_home_A_green", -17, -46, 6.5, -0.5);
    this.place("sign", -20, -33, 3, 0);
    this.landmarks.push(
      {
        id: "brookside",
        name: "Brookside hamlet",
        x: 78,
        z: 52,
        description:
          "A little market, cottage gardens and the road back to Maker’s Meadow.",
      },
      {
        id: "foresters",
        name: "Foresters’ rest",
        x: -23,
        z: -38,
        description:
          "The foresters keep two cottages beside the old woodland trail.",
      },
    );
  }
  nearPath(x: number, z: number, extra = 0) {
    return this.paths.some((p) =>
      p.points
        .slice(1)
        .some(
          (b, i) => distanceSegment(x, z, p.points[i], b) < p.width / 2 + extra,
        ),
    );
  }
  private alderwick() {
    const road = this.regions[0].trailSurface,
      driveways = road.clone(),
      street = smoothTrail(ALDERWICK_ROADS[1].points);
    driveways.name = "Alderwick driveways";
    driveways.polygonOffset = true;
    driveways.polygonOffsetFactor = 1;
    driveways.polygonOffsetUnits = 1;
    this.materials.push(driveways);
    for (const [i, path] of ALDERWICK_ROADS.entries()) {
      const surface = road.clone();
      surface.name = "Alderwick road " + i;
      surface.polygonOffset = true;
      surface.polygonOffsetFactor = -1;
      surface.polygonOffsetUnits = -i - 1;
      this.materials.push(surface);
      const points = smoothTrail(path.points);
      this.paths.push({ points, width: path.width });
      this.mesh(trailGeometry(points, path.width, valeWalk), surface);
    }
    for (const p of ALDERWICK_BUILDINGS) {
      const root = this.place(p.asset, p.x, p.z, p.scale, p.yaw);
      root.userData.settlement = ALDERWICK.id;
      root.userData.asset = p.asset;
      if (p.asset === "building_market_blue") continue;
      const dx = Math.sin(p.yaw),
        dz = Math.cos(p.yaw),
        start = [p.x + dx * 3.4, p.z + dz * 3.4];
      const end =
        p.asset === "building_windmill_blue"
          ? [-157, -63]
          : closestTrailPoint(start, street);
      const path = { points: [start, end], width: 1.8 };
      this.paths.push(path);
      this.mesh(trailGeometry(path.points, path.width, valeWalk), driveways);
    }
    this.place("building_well_blue", -136, -58, 4.3);
    this.place("barrel", -126, -62, 3.8);
    this.place("crate_A_small", -125, -64, 3.8);
    this.place("wheelbarrow", -157, -66, 3.7, 0.5);
    this.landmarks.push({
      ...ALDERWICK,
      description:
        "Alderwick's market square joins a compact neighbourhood to cottage gardens and the mill lane. Follow the south road back to Willowmere. Look for an Enter prompt at cottage, town-house, inn and workshop entrances.",
    });
  }
  private reedbank() {
    const walk = (x: number, z: number) => valeWalk(x, z, this.layout),
      road = this.regions[0].trailSurface;
    for (const path of REEDBANK_ROADS) {
      const points = smoothTrail(path.points);
      this.paths.push({ points, width: path.width });
      this.mesh(trailGeometry(points, path.width, walk), road);
    }
    const street = smoothTrail(REEDBANK_ROADS[0].points);
    for (const p of REEDBANK_BUILDINGS) {
      const root = this.place(p.asset, p.x, p.z, p.scale, p.yaw);
      root.userData.settlement = REEDBANK.id;
      const b = this.library.bounds.get(p.asset)!,
        front = b.max.z * p.scale + 1;
      const start = [
        p.x + Math.sin(p.yaw) * front,
        p.z + Math.cos(p.yaw) * front,
      ];
      const points = [
        start,
        closestTrailPoint(
          start,
          p.asset === "building_blacksmith_blue"
            ? smoothTrail(REEDBANK_ROADS[1].points)
            : street,
        ),
      ];
      this.paths.push({ points, width: 1.7 });
      this.mesh(trailGeometry(points, 1.7, walk), road);
    }
    this.place("building_well_blue", 19, -58, 4.2);
    this.place("barrel", 21, -61, 3.8);
    this.place("crate_A_small", 22.3, -61, 3.5);
    this.place("wheelbarrow", -4, -51, 3.8, 0.6);
    this.place("sign", 12, -32, 2.6, -0.3);
    const bx = valeRivers(NORTH_CROSSING.z)[1],
      z = NORTH_CROSSING.z,
      bridge = fitBridge(this.library.create("building_bridge_A", 1), bx, z);
    this.group.add(bridge);
    this.obstacles.push(
      {
        minX: bx - 4.8,
        maxX: bx + 4.8,
        minZ: z - 2.2,
        maxZ: z - 1.9,
        height: 1.2,
        name: "north-bridge-rail",
      },
      {
        minX: bx - 4.8,
        maxX: bx + 4.8,
        minZ: z + 1.9,
        maxZ: z + 2.2,
        height: 1.2,
        name: "north-bridge-rail",
      },
    );
    this.paths.push({
      points: [
        [bx - 5, z],
        [bx + 5, z],
      ],
      width: 2.8,
    });
    this.landmarks.push({
      ...REEDBANK,
      description:
        "The mill hamlet gathers beside the northern footbridge. Cottage gardens, a smithy yard and the river lane connect the forest to the meadow without changing worlds.",
    });
  }
  private populate() {
    let seed = 31825;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const buckets = new Map<string, { id: string; matrices: T.Matrix4[] }>();
    const add = (id: string, x: number, z: number, scale: number) => {
      const key = id + ":" + Math.floor(x / 32) + ":" + Math.floor(z / 32);
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { id, matrices: [] }));
      b.matrices.push(
        new T.Matrix4().compose(
          new T.Vector3(x, valeGround(x, z), z),
          new T.Quaternion().setFromAxisAngle(
            new T.Vector3(0, 1, 0),
            random() * 6.28,
          ),
          new T.Vector3(scale, scale, scale),
        ),
      );
      this.instances++;
    };
    if (this.layout >= 5)
      for (const [gx, gz] of [
        ...ALDERWICK_GARDENS,
        ...(this.layout >= 6 ? REEDBANK_GARDENS : []),
      ])
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12,
            radius = 0.35 + (i % 3) * 0.3,
            x = gx + Math.cos(angle) * radius,
            z = gz + Math.sin(angle) * radius;
          if (!this.nearPath(x, z, 0.4) && !blocked(x, z, this.obstacles, 0.4))
            add(
              ["flower-purplea", "flower-yellowa", "plant-bushsmall"][i % 3],
              x,
              z,
              0.8 + (i % 3) * 0.1,
            );
        }
    for (let i = 0; i < 2300; i++) {
      const x = (random() - 0.5) * 358,
        z = (random() - 0.5) * 180;
      const town = x > -143 && x < -81 && z > -41 && z < 43,
        meadow = x > 75 && x < 136 && z > -30 && z < 31,
        camp = Math.hypot(x, z + 14) < 11;
      if (
        town ||
        meadow ||
        camp ||
        this.nearPath(x, z, 3.4) ||
        blocked(x, z, this.obstacles, 2.6) ||
        valeWater(x, z, this.layout)
      )
        continue;
      const id =
        x > -43 && x < 47
          ? random() > 0.22
            ? "tree-pinedefaulta"
            : "tree-pinedefaultb"
          : random() > 0.4
            ? "tree-oak"
            : "tree-detailed";
      const scale = 4.1 + random() * 2.5;
      add(id, x, z, scale);
      this.trees.push({ x, z, radius: scale * 0.3 });
      this.obstacles.push({
        minX: x - 0.22,
        maxX: x + 0.22,
        minZ: z - 0.22,
        maxZ: z + 0.22,
        height: valeGround(x, z) + scale * 1.55,
        name: "tree",
      });
      if (i % 3 === 0) add("plant-bush", x + 1.5, z + 0.6, 1 + random());
    }
    for (let i = 0; i < 2400; i++) {
      const x = (random() - 0.5) * 352,
        z = (random() - 0.5) * 174;
      if (
        !inWorld(x, z, "vale", 2) ||
        this.nearPath(x, z, 0.8) ||
        blocked(x, z, this.obstacles, 0.8) ||
        valeWater(x, z, this.layout) ||
        (x > 82 && x < 130 && z > -24 && z < 24)
      )
        continue;
      add(
        i % 11 === 0
          ? "rock-smalla"
          : i % 4 === 0
            ? "flower-yellowa"
            : i % 3 === 0
              ? "flower-purplea"
              : "grass-large",
        x,
        z,
        0.7 + random(),
      );
    }
    for (const { id, matrices } of buckets.values()) {
      this.cameraBodies.push(...this.library.cameraCanopies(id, matrices));
      const source = this.library.instancingSource(id);
      source.updateMatrixWorld(true);
      source.traverse((o) => {
        if (!(o instanceof T.Mesh)) return;
        const inst = new T.InstancedMesh(
          o.geometry,
          o.material,
          matrices.length,
        );
        inst.castShadow = id.startsWith("tree");
        inst.receiveShadow = true;
        for (let i = 0; i < matrices.length; i++)
          inst.setMatrixAt(
            i,
            new T.Matrix4().multiplyMatrices(matrices[i], o.matrixWorld),
          );
        inst.computeBoundingSphere();
        this.group.add(inst);
      });
    }
  }
  updateLodge(dt: number, player: { x: number; z: number }) {
    if (!this.lodge) return false;
    const changed = this.lodge.update(dt, player);
    if (changed) this.obstacles = [...this.permanent, this.lodge.doorBody()];
    return changed;
  }
  updateVisibility(camera: T.PerspectiveCamera, far: number, compact = true) {
    camera.updateMatrixWorld();
    if (compact) {
      this.projection.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      );
      this.frustum.setFromProjectionMatrix(this.projection);
    }
    for (const { mesh, sphere, culler } of this.visibility) {
      mesh.visible = fogDepthVisible(
        sphere.center,
        sphere.radius,
        camera.matrixWorldInverse.elements,
        far,
      );
      if (!compact) culler?.restore();
      else if (mesh.visible) culler?.update(this.frustum, camera, far);
      if (culler && culler.mesh.count === 0) mesh.visible = false;
    }
  }
  dispose() {
    this.group.removeFromParent();
    this.lodge?.dispose();
    for (const r of this.regions) r.dispose();
    this.group.traverse((o) => {
      if (o instanceof T.InstancedMesh) o.dispose();
    });
    for (const g of this.geometry) g.dispose();
    for (const m of this.materials) m.dispose();
    this.group.clear();
    this.visibility.length = 0;
    this.cameraBodies.length = 0;
  }
}
