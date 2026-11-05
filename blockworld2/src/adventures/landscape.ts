import * as T from "three";
import { valeGround, valeWalk, valeWater } from "./vale-data";
import { trailGeometry } from "./trail-geometry";
export type SceneLayout = 1 | 2 | 3 | 4;
export const LATEST_LAYOUT: SceneLayout = 4;
import { AssetLibrary, DEFINITIONS } from "./assets";
export type RegionId = "village" | "woodland" | "meadow";
export type SceneId = RegionId | "vale";
export interface Placement {
  id: string;
  asset: string;
  x: number;
  z: number;
  yaw: number;
  scale: number;
}
export interface Landmark {
  id: string;
  name: string;
  x: number;
  z: number;
  description: string;
  action?: "door";
}
export interface Obstacle {
  base?: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  name?: string;
}
export const WORLDS = [
  {
    id: "vale" as SceneId,
    name: "The Willow Vale",
    tag: "A CONNECTED WORLD",
    description:
      "Willowmere lanes, whispering pines and a meadow of your own, connected by the old road.",
    icon: "♧",
    spawn: { x: -105, z: 18 },
    yaw: 0,
  },
  {
    id: "village" as SceneId,
    name: "Willowmere",
    tag: "THE VILLAGE",
    description:
      "Blue rooftops, winding lanes and a little market by the brook.",
    icon: "⌂",
    spawn: { x: 0, z: 18 },
    yaw: 0,
  },
  {
    id: "woodland" as SceneId,
    name: "Whispering Wood",
    tag: "THE WILDERNESS",
    description: "Follow the water to a quiet camp beneath the pines.",
    icon: "♧",
    spawn: { x: 0, z: 28 },
    yaw: 0,
  },
  {
    id: "meadow" as SceneId,
    name: "Maker’s Meadow",
    tag: "YOUR OWN PLACE",
    description: "An open green, a few supplies and room for your next idea.",
    icon: "◇",
    spawn: { x: 0, z: 16 },
    yaw: 0,
  },
];
export const riverX = (z: number) => 30 + Math.sin(z * 0.055) * 2.5;
const clamp = T.MathUtils.clamp;
export function groundHeight(x: number, z: number, scene: SceneId) {
  if (scene === "vale") return valeGround(x, z);
  const edge = clamp((Math.hypot(x * 0.85, z) - 43) / 30, 0, 1);
  let h =
    edge *
    (2.2 + Math.sin(x * 0.09 + z * 0.035) * 1.5 + Math.cos(z * 0.11) * 1.3);
  if (scene === "woodland") h += Math.sin(x * 0.055) * Math.sin(z * 0.06) * 1.6;
  if (scene !== "meadow")
    h -= Math.max(0, 1 - Math.abs(x - riverX(z)) / 5) * 1.65;
  return h;
}
export function walkHeight(
  x: number,
  z: number,
  scene: SceneId,
  layout: SceneLayout = 1,
) {
  if (scene === "vale") return valeWalk(x, z, layout);
  if (
    scene !== "meadow" &&
    Math.abs(z - 8) < 2.1 &&
    Math.abs(x - riverX(z)) < 5
  )
    return 0.02 + Math.max(0, 1 - Math.abs(x - riverX(z)) / 5) * 0.4;
  return groundHeight(x, z, scene);
}
export function waterBlocked(x: number, z: number, scene: SceneId) {
  if (scene === "vale") return valeWater(x, z);
  return (
    scene !== "meadow" &&
    Math.abs(x - riverX(z)) < 2.65 &&
    Math.abs(z - 8) > 2.0
  );
}
export function blocked(
  x: number,
  z: number,
  obstacles: readonly Obstacle[],
  radius = 0.34,
) {
  return obstacles.some((b) => {
    const qx = clamp(x, b.minX, b.maxX),
      qz = clamp(z, b.minZ, b.maxZ);
    return (x - qx) ** 2 + (z - qz) ** 2 < radius ** 2;
  });
}
export const distanceSegment = (
  x: number,
  z: number,
  a: number[],
  b: number[],
) => {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1);
  return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
};
let seed = 1;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
function paving() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#ada28b";
  c.fillRect(0, 0, 256, 256);
  for (let row = -1; row < 9; row++)
    for (let col = -1; col < 5; col++) {
      const x = col * 64 + (row % 2) * 32,
        y = row * 32;
      c.fillStyle = ["#c7bca4", "#d0c5ad", "#beb59e", "#d6ccb4"][
        (row * 7 + col + 100) % 4
      ];
      c.beginPath();
      if (typeof c.roundRect === "function")
        c.roundRect(x + 2, y + 2, 60, 28, 5);
      else {
        c.moveTo(x + 7, y + 2);
        c.lineTo(x + 57, y + 2);
        c.quadraticCurveTo(x + 62, y + 2, x + 62, y + 7);
        c.lineTo(x + 62, y + 25);
        c.quadraticCurveTo(x + 62, y + 30, x + 57, y + 30);
        c.lineTo(x + 7, y + 30);
        c.quadraticCurveTo(x + 2, y + 30, x + 2, y + 25);
        c.lineTo(x + 2, y + 7);
        c.quadraticCurveTo(x + 2, y + 2, x + 7, y + 2);
      }
      c.fill();
      c.fillStyle = "#e1d7c1";
      c.fillRect(x + 8, y + 3, 43, 1);
    }
  const t = new T.CanvasTexture(canvas);
  t.colorSpace = T.SRGBColorSpace;
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(0.6, 0.6);
  t.anisotropy = 4;
  return t;
}
function earthTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#b5a17d";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 650; i++) {
    const x = (i * 73) % 128,
      y = (i * 31 + Math.floor(i / 128) * 17) % 128;
    ctx.fillStyle = i % 3 === 0 ? "#bca986" : "#aa9674";
    ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, 1);
  }
  const texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(0.45, 0.45);
  texture.anisotropy = 4;
  return texture;
}
export function smoothTrail(points: number[][], spacing = 1.3) {
  const closed =
    points.length > 3 &&
    points[0][0] === points[points.length - 1][0] &&
    points[0][1] === points[points.length - 1][1];
  const controls = (closed ? points.slice(0, -1) : points).map(
    ([x, z]) => new T.Vector3(x, 0, z),
  );
  const curve = new T.CatmullRomCurve3(controls, closed, "centripetal");
  return curve
    .getSpacedPoints(Math.max(2, Math.ceil(curve.getLength() / spacing)))
    .map((p) => [p.x, p.z]);
}
export interface LandscapeOptions {
  terrain?: boolean;
  populate?: boolean;
  ground?: (x: number, z: number) => number;
  walk?: (x: number, z: number) => number;
  fullSizeTents?: boolean;
}
export class Landscape {
  group = new T.Group();
  obstacles: Obstacle[] = [];
  landmarks: Landmark[] = [];
  instances = 0;
  // Resource ownership: only generated buffers/materials/textures belong to this scene.
  private geometries: T.BufferGeometry[] = [];
  private materials: T.Material[] = [];
  private ownedTextures: T.Texture[] = [];
  private buckets = new Map<string, { id: string; matrices: T.Matrix4[] }>();
  paths: { points: number[][]; width: number }[] = [];
  private pathMaterial: T.MeshStandardMaterial;
  private trailMaterial: T.MeshStandardMaterial;
  private assetRoots: T.Object3D[] = [];
  constructor(
    readonly library: AssetLibrary,
    readonly id: SceneId,
    readonly layout: SceneLayout = 1,
    readonly options: LandscapeOptions = {},
  ) {
    seed = id === "village" ? 5678 : id === "woodland" ? 22111 : 9976;
    const texture = paving();
    this.ownedTextures.push(texture);
    this.pathMaterial = this.material(
      new T.MeshStandardMaterial({
        color: 0xd7ccb5,
        map: texture,
        roughness: 1,
      }),
    );
    const earth = earthTexture();
    this.ownedTextures.push(earth);
    this.trailMaterial = this.material(
      new T.MeshStandardMaterial({ map: earth, roughness: 1, color: 0xe2d8bb }),
    );
    if (options.terrain !== false) this.terrain();
    if (id === "village") this.village();
    else if (id === "woodland") this.woodland();
    else this.meadow();
    if (options.populate !== false) this.surroundings();
    if (this.layout >= 2) this.plantedClearings();
    this.flushInstances();
    this.group.updateMatrixWorld(true);
  }
  get trailSurface() {
    return this.trailMaterial;
  }
  private ground(x: number, z: number) {
    return this.options.ground?.(x, z) ?? groundHeight(x, z, this.id);
  }
  private walk(x: number, z: number) {
    return this.options.walk?.(x, z) ?? walkHeight(x, z, this.id);
  }
  private material<M extends T.Material>(m: M) {
    this.materials.push(m);
    return m;
  }
  private mesh(g: T.BufferGeometry, m: T.Material) {
    this.geometries.push(g);
    const mesh = new T.Mesh(g, m);
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }
  private terrain() {
    const geo =
      this.layout >= 2
        ? new T.PlaneGeometry(360, 360, 144, 144)
        : new T.PlaneGeometry(190, 190, 95, 95);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.getAttribute("position"),
      colors = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getZ(i),
        h = this.ground(x, z);
      const distant =
        this.layout >= 2
          ? Math.max(0, Math.hypot(x * 0.9, z) - 85) *
            0.18 *
            (1 + 0.3 * Math.sin(x * 0.045) * Math.cos(z * 0.035))
          : 0;
      pos.setY(i, h + distant);
      const noise =
        Math.sin(x * 0.27 + z * 0.17) * 0.018 +
        Math.cos(x * 0.13 - z * 0.21) * 0.017;
      const c = new T.Color(this.id === "woodland" ? 0x527844 : 0x799756);
      c.offsetHSL(noise, 0.01, noise);
      const bank = 1 - clamp(Math.abs(x - riverX(z)) / 5, 0, 1);
      if (this.id !== "meadow") c.lerp(new T.Color(0xc1b592), bank * 0.8);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    this.mesh(
      geo,
      this.material(
        new T.MeshStandardMaterial({
          vertexColors: true,
          roughness: 1,
          flatShading: true,
        }),
      ),
    );
    if (this.id !== "meadow") {
      const v: number[] = [],
        indices: number[] = [];
      for (let i = 0; i <= 90; i++) {
        const z = -95 + (i * 190) / 90,
          x = riverX(z);
        v.push(x - 2.9, -0.58, z, x + 2.9, -0.58, z);
        if (i < 90) {
          const a = i * 2;
          indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(v, 3));
      g.setIndex(indices);
      g.computeVertexNormals();
      this.mesh(
        g,
        this.material(
          new T.MeshStandardMaterial({
            color: 0x69afb5,
            roughness: 0.25,
            metalness: 0.1,
            transparent: true,
            opacity: 0.92,
            side: T.DoubleSide,
          }),
        ),
      );
    }
  }
  private trail(points: number[][], width = 2.2) {
    if (this.layout === 1) {
      this.path(points, width);
      return;
    }
    this.path(
      points.length > 2 ? smoothTrail(points) : points,
      width,
      this.trailMaterial,
    );
  }
  private path(points: number[][], width = 3.2, material = this.pathMaterial) {
    this.paths.push({ points, width });
    if (this.layout >= 3) {
      this.mesh(
        trailGeometry(
          points,
          width,
          (x, z) => this.walk(x, z),
          this.id === "meadow" ? undefined : riverX(8),
        ),
        material,
      );
      return;
    }
    const v: number[] = [],
      uv: number[] = [],
      ix: number[] = [];
    let length = 0;
    for (let j = 0; j < points.length - 1; j++) {
      const a = points[j],
        b = points[j + 1],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        n = Math.hypot(dx, dz),
        nx = ((-dz / n) * width) / 2,
        nz = ((dx / n) * width) / 2,
        steps = Math.ceil(n / 1.5);
      const stops = Array.from({ length: steps + 1 }, (_, k) => k / steps);
      if (
        this.id !== "meadow" &&
        Math.abs(a[1] - 8) < 0.001 &&
        Math.abs(b[1] - 8) < 0.001
      ) {
        for (const edge of [-5, 5]) {
          const t = (riverX(8) + edge - a[0]) / dx;
          if (t > 0 && t < 1) stops.push(t);
        }
        stops.sort((a, b) => a - b);
      }
      for (let k = 0; k < stops.length - 1; k++) {
        const d0 = stops[k],
          d1 = stops[k + 1],
          mid = (d0 + d1) / 2;
        // The premade bridge supplies the deck; paving stops exactly at its ends.
        if (
          this.id !== "meadow" &&
          Math.abs(a[1] + dz * mid - 8) < 0.01 &&
          Math.abs(a[0] + dx * mid - riverX(8)) < 5
        )
          continue;
        const base = v.length / 3;
        for (const [t, side] of [
          [d0, -1],
          [d0, 1],
          [d1, 1],
          [d1, -1],
        ]) {
          const x = a[0] + dx * t + nx * side,
            z = a[1] + dz * t + nz * side;
          v.push(x, this.walk(x, z) + 0.045, z);
          uv.push(((side + 1) * width) / 2, length + t * n);
        }
        ix.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
      length += n;
    }
    // Rounded, terrain-following caps close the wedges at bends and junctions.
    for (const [x, z] of points) {
      if (
        this.id !== "meadow" &&
        Math.abs(z - 8) < 2.2 &&
        Math.abs(x - riverX(8)) < 5
      )
        continue;
      const start = v.length / 3;
      v.push(x, this.walk(x, z) + 0.049, z);
      uv.push(x, z);
      for (let i = 0; i <= 20; i++) {
        const a = (i / 20) * Math.PI * 2,
          px = x + (Math.sin(a) * width) / 2,
          pz = z + (Math.cos(a) * width) / 2;
        v.push(px, this.walk(px, pz) + 0.049, pz);
        uv.push(px, pz);
        if (i < 20) ix.push(start, start + i + 1, start + i + 2);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(v, 3));
    geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(ix);
    geo.computeVertexNormals();
    this.mesh(geo, material);
  }
  private disc(x: number, z: number, r: number, color: number, stones = false) {
    const geometry = new T.CircleGeometry(r, 48);
    if (stones) {
      const p = geometry.getAttribute("position"),
        uv = geometry.getAttribute("uv");
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getY(i));
    }
    const mesh = this.mesh(
      geometry,
      stones
        ? this.pathMaterial
        : this.material(new T.MeshStandardMaterial({ color, roughness: 1 })),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, this.ground(x, z) + 0.055, z);
    return mesh;
  }
  place(
    id: string,
    x: number,
    z: number,
    scale = DEFINITIONS.get(id)?.scale ?? 1,
    yaw = 0,
    solid = false,
    y?: number,
  ) {
    if (id === "tent-smallopen" && this.options.fullSizeTents) {
      scale = 5.5;
      yaw += Math.PI;
    }
    const root = this.library.create(id, scale);
    root.position.set(x, y ?? this.walk(x, z), z);
    root.rotation.y = yaw;
    this.group.add(root);
    this.assetRoots.push(root);
    root.updateMatrixWorld(true);
    if (solid) {
      const b = new T.Box3().setFromObject(root);
      const inset = id.startsWith("building_") ? 0.45 : 0.08;
      this.obstacles.push({
        minX: b.min.x + inset,
        maxX: b.max.x - inset,
        minZ: b.min.z + inset,
        maxZ: b.max.z - inset,
        height: b.max.y,
        name: id,
      });
    }
    return root;
  }
  private instance(
    id: string,
    x: number,
    z: number,
    scale: number,
    yaw = 0,
    y?: number,
  ) {
    const key = `${id}:${Math.floor(x / 48)}:${Math.floor(z / 48)}`;
    let b = this.buckets.get(key);
    if (!b) this.buckets.set(key, (b = { id, matrices: [] }));
    const matrix = new T.Matrix4().compose(
      new T.Vector3(x, y ?? this.ground(x, z), z),
      new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), yaw),
      new T.Vector3(scale, scale, scale),
    );
    b.matrices.push(matrix);
    this.instances++;
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
  private garden(x: number, z: number) {
    if (this.layout < 3) this.disc(x, z, 1.7, 0x77865a);
    for (let i = 0; i < 16; i++) {
      const a = random() * Math.PI * 2,
        r = Math.sqrt(random()) * 1.6;
      this.instance(
        ["flower-purplea", "flower-yellowa", "flower-reda"][i % 3],
        x + Math.sin(a) * r,
        z + Math.cos(a) * r,
        0.8 + random() * 0.7,
        random() * 6.28,
      );
    }
    this.instance("plant-bush", x, z, 1.4);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      this.instance(
        "rock-smalla",
        x + Math.sin(a) * 1.7,
        z + Math.cos(a) * 1.7,
        0.6 + random() * 0.2,
        a,
      );
    }
  }
  private village() {
    this.path(
      [
        [0, 54],
        [0, 12],
        [0, -30],
      ],
      5.2,
    );
    this.path(
      [
        [-37, 8],
        [0, 8],
        [39, 8],
      ],
      4.2,
    );
    this.path(
      [
        [-20, 28],
        [-20, -29],
        [0, -29],
        [20, -29],
        [20, 28],
      ],
      3.1,
    );
    this.path(
      [
        [-20, -9],
        [20, -9],
      ],
      3,
    );
    this.path(
      [
        [-20, 27],
        [20, 27],
      ],
      3.3,
    );
    this.disc(0, 0, 8.6, 0xc8c1a9, true);
    this.place("building_well_blue", 0, -1, 6, 0, true);
    this.landmarks.push({
      id: "well",
      name: "The wishing well",
      x: 0,
      z: 3,
      description:
        "They say the brook remembers every wish. Welcome to Willowmere.",
    });
    const houses: [string, number, number, number][] = [
      ["building_home_A_blue", -10, -10, Math.PI / 2],
      ["building_home_B_green", -11, 10, Math.PI / 2],
      ["building_home_A_green", 11, -11, -Math.PI / 2],
      ["building_home_B_blue", 12, 13, -Math.PI / 2],
      ["building_home_A_blue", -28, -11, Math.PI / 2],
      ["building_home_A_green", -28, 9, Math.PI / 2],
      ["building_home_B_blue", -11, 34, Math.PI],
      ["building_home_A_blue", 12, 34, Math.PI],
      ["building_home_A_green", -28, 29, Math.PI / 2],
    ];
    for (const [asset, x, z, yaw] of houses) {
      this.place(asset, x, z, 7.2, yaw, true);
      const dx = Math.sin(yaw),
        dz = Math.cos(yaw);
      this.path(
        [
          [x + dx * 3.4, z + dz * 3.4],
          [x + dx * 6.5, z + dz * 6.5],
        ],
        1.8,
      );
      this.garden(
        x + Math.cos(yaw) * 3.7 + dx * 4,
        z - Math.sin(yaw) * 3.7 + dz * 4,
      );
    }
    this.place("building_tavern_blue", 0, -23, 8.8, 0, true);
    this.place("building_church_blue", -27, -32, 8, Math.PI / 2, true);
    this.place("building_blacksmith_blue", 19, -20, 7, -Math.PI / 2, true);
    this.place("building_market_blue", 14, 0, 7.2, -Math.PI / 2, true);
    this.place("building_windmill_blue", -39, 24, 8, Math.PI / 2, true);
    this.path(
      [
        [-37, 8],
        [-39, 17],
      ],
      2.8,
    );
    this.landmarks.push(
      {
        id: "inn",
        name: "The Bluebird Inn",
        x: 0,
        z: -16,
        description:
          "A place for travellers and tall tales. These prefab buildings have decorative closed doors; interiors are not included.",
      },
      {
        id: "market",
        name: "Willowmere market",
        x: 8,
        z: 0,
        description:
          "Fresh apples, warm bread, and something for the road. Follow the lane east to the woodland bridge.",
      },
      {
        id: "mill",
        name: "Old Willow Windmill",
        x: -33,
        z: 24,
        description:
          "The village’s oldest landmark, standing watch over the meadow.",
      },
    );
    this.bridge();
    this.trail(
      [
        [39, 8],
        [47, 0],
        [56, -4],
        [64, 2],
        [66, 18],
        [57, 27],
        [46, 21],
        [39, 8],
      ],
      2.2,
    );
    this.trail(
      [
        [56, -4],
        [56, -8.5],
      ],
      1.7,
    );
    this.place("tent-smallopen", 56, -10, 2.5, 0, true);
    this.place("campfire-stones", 54, -4, 1.7, 0, true);
    this.garden(54, 12);
    this.place("log", 60, 14, 2.5, 1, true);
    this.place("stump-round", 54, 16, 1.7, 0, true);
    this.landmarks.push({
      id: "camp",
      name: "The woodland camp",
      x: 54,
      z: -1,
      description:
        "A quiet resting place at the edge of the forest. The trail loops back to the bridge.",
    });
    for (const [x, z] of [
      [-5, 7],
      [5, 7],
      [-5, -8],
      [5, -8],
    ])
      this.garden(x, z);
    for (const [x, z, yaw] of [
      [-4, -15, 0],
      [5, 11, 1],
      [7, -4, 0],
      [-17, 22, 1],
    ]) {
      this.place("barrel", x, z, 4, yaw, true);
      this.place("crate_A_small", x + 1, z + 0.4, 4.2, yaw, true);
    }
    this.place("wheelbarrow", 17, -14, 4, 1.5, true);
  }
  private bridge() {
    // The original arched bridge is scaled across the bank; walkable deck has an analytic profile.
    const root = this.place(
      "building_bridge_A",
      riverX(8),
      8,
      1,
      0,
      false,
      0.0,
    );
    root.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(root),
      size = box.getSize(new T.Vector3());
    root.scale.set(4.2 / size.x, 3.0 / size.y, 10 / size.z);
    root.rotation.y = Math.PI / 2;
    root.position.y = -2.45;
    const bx = riverX(8);
    this.obstacles.push(
      { minX: bx - 4.8, maxX: bx + 4.8, minZ: 5.8, maxZ: 6.1, height: 1.2 },
      { minX: bx - 4.8, maxX: bx + 4.8, minZ: 9.9, maxZ: 10.2, height: 1.2 },
    );
    this.landmarks.push({
      id: "bridge",
      name: "Willowbrook bridge",
      x: 24,
      z: 8,
      description:
        "Beyond the bridge, wildflowers give way to the pines. The water stays safely below the footpath.",
    });
  }
  private woodland() {
    this.trail(
      [
        [0, 38],
        [0, 22],
        [-9, 8],
        [-7, -9],
        [2, -24],
        [18, -27],
        [22, -13],
        [22, 8],
        [12, 17],
        [0, 22],
      ],
      2.6,
    );
    if (this.layout === 1)
      this.path(
        [
          [22, 8],
          [39, 8],
          [46, 8],
          [58, -3],
          [60, -24],
        ],
        2.3,
      );
    else {
      this.path(
        [
          [22, 8],
          [39, 8],
          [46, 8],
        ],
        2.3,
        this.trailMaterial,
      );
      this.trail(
        [
          [46, 8],
          [58, -3],
          [60, -24],
        ],
        2.3,
      );
    }

    this.bridge();
    this.place("tent-smallopen", -9, -17, 3.2, 0.5, true);
    this.place("campfire-stones", 0, -14, 2, 0, true);
    this.place("log", -1, -8, 2.6, 1, true);
    this.place("stump-round", 3, -10, 2, 0, true);
    this.place("rock-largeb", 15, -30, 4, 1, true);
    this.place("rock-largea", 17, -33, 3, 0, true);
    this.landmarks.push(
      {
        id: "camp",
        name: "The explorer’s camp",
        x: -4,
        z: -7,
        description:
          "The fire has gone quiet. Take the winding trail, find the old stones, and listen to the brook.",
      },
      {
        id: "stones",
        name: "The old stones",
        x: 13,
        z: -27,
        description:
          "Moss and time have softened every edge. A good place to stop for a while.",
      },
      {
        id: "view",
        name: "Pinewater lookout",
        x: 59,
        z: -24,
        description:
          "The trail ends above the water. Turn back for the camp, or travel to the village from Places.",
      },
    );
  }
  private meadow() {
    if (this.layout >= 3) {
      this.trail(
        [
          [0, 25],
          [0, 15],
          [-4, 6],
          [-9, -1],
          [-12, -9],
        ],
        2.8,
      );
      this.trail(
        [
          [-12, -9],
          [-4, -11],
          [5, -11],
          [14, -11],
        ],
        2.4,
      );
      this.trail(
        [
          [-12, -9],
          [-15, -9],
          [-15, -11],
        ],
        1.8,
      );
      this.trail(
        [
          [0, 25],
          [9, 27],
          [19, 26],
          [26, 18],
        ],
        1.8,
      );
    } else {
      this.path(
        [
          [-19, -9],
          [0, -9],
          [19, -9],
        ],
        3,
      );
      this.path(
        [
          [0, 25],
          [0, -9],
          [0, -30],
        ],
        3.2,
      );
      this.disc(0, 0, 7, 0xa0b77b);
    }
    this.place("building_home_A_green", -15, -15, 7, 0, true);
    this.place("building_well_blue", 14, -15, 5, 0, true);
    this.place("wheelbarrow", -9, -8, 4, 0, true);
    for (let i = 0; i < 3; i++) {
      this.place(
        "crate_A_small",
        (this.layout >= 3 ? -16 : -10) + i * 1.2,
        this.layout >= 3 ? -3 : -5,
        4,
        0,
        true,
      );
      this.place(
        "barrel",
        (this.layout >= 3 ? -17 : -13) + i,
        this.layout >= 3 ? -6 : -8,
        4,
        0,
        true,
      );
    }
    this.landmarks.push({
      id: "makers",
      name: "Make yourself at home",
      x: 0,
      z: 6,
      description:
        "Open Build to place premade trees, flowers, supplies and cottages. Tap an object to select it; move, rotate or remove it. Your meadow saves separately.",
    });
    this.garden(7, 10);
    this.garden(-7, 10);
    if (this.layout >= 3) {
      for (const z of [-6, -3.6, -1.2, 1.2, 3.6])
        this.place("fence_wood_straight", -19, z, 2.4, 0, true);
      this.place("sign", -3, 20, 1.7, 0.3, true);
      this.landmarks.push({
        id: "orchard",
        name: "The meadow edge",
        x: 24,
        z: 18,
        description:
          "A sheltered corner for a garden. The wide green beside the lane is yours to build on.",
      });
    }
  }
  private surroundings() {
    const village = this.id === "village";
    for (let i = 0; i < 700; i++) {
      const x = (random() - 0.5) * 172,
        z = (random() - 0.5) * 172;
      if (
        this.nearPath(x, z, 2.8) ||
        blocked(x, z, this.obstacles, 2.8) ||
        waterBlocked(x, z, this.id)
      )
        continue;
      const central =
        this.id === "woodland"
          ? Math.hypot(x, z) < 9
          : this.id === "meadow"
            ? Math.abs(x) < 32 && Math.abs(z) < 35
            : x > -35 && x < 23 && z > -40 && z < 43;
      if (central) continue;
      const s = 4.1 + random() * 2.7;
      const id =
        x > 38 || this.id === "woodland"
          ? random() > 0.25
            ? "tree-pinedefaulta"
            : "tree-pinedefaultb"
          : random() > 0.4
            ? "tree-oak"
            : "tree-detailed";
      this.instance(id, x, z, s, random() * 6.28);
      this.obstacles.push({
        minX: x - 0.2,
        maxX: x + 0.2,
        minZ: z - 0.2,
        maxZ: z + 0.2,
        height: 6,
        name: "tree",
      });
      if (i % 3 === 0)
        this.instance(
          "plant-bush",
          x + 1.8,
          z + 0.5,
          1 + random(),
          random() * 6.28,
        );
    }
    for (let i = 0; i < 1000; i++) {
      const x = (random() - 0.5) * 158,
        z = (random() - 0.5) * 158;
      if (
        this.nearPath(x, z, 0.8) ||
        blocked(x, z, this.obstacles, 0.8) ||
        waterBlocked(x, z, this.id) ||
        (village && Math.hypot(x, z) < 8)
      )
        continue;
      if (this.id === "meadow" && Math.abs(x) < 25 && Math.abs(z) < 25)
        continue;
      const id =
        i % 13 === 0
          ? "rock-smalla"
          : i % 5 === 0
            ? "flower-yellowa"
            : i % 4 === 0
              ? "flower-purplea"
              : "grass-large";
      this.instance(id, x, z, 0.65 + random() * 1.2, random() * 6.28);
    }
    if (this.id !== "meadow")
      for (let i = 0; i < 55; i++) {
        const z = -84 + i * 3,
          x = riverX(z) + (i % 2 ? -3.8 : 3.8);
        if (Math.abs(z - 8) < 4) continue;
        this.instance("plant-bushsmall", x, z, 1 + random(), random() * 6.28);
        if (i % 3 === 0) this.instance("rock-largea", x + 1, z, 1 + random());
      }
    // Intentional village trees occupy generous clear beds outside building footprints.
    if (village)
      for (const [x, z] of [
        [-8, 21],
        [8, 22],
        [-8, -34],
        [7, -35],
        [-36, -1],
        [20, 29],
      ]) {
        if (!blocked(x, z, this.obstacles, 2)) {
          this.instance("tree-oak", x, z, 4.6, 0);
          this.obstacles.push({
            minX: x - 0.22,
            maxX: x + 0.22,
            minZ: z - 0.22,
            maxZ: z + 0.22,
            height: 6,
          });
        }
      }
  }
  private plantedClearings() {
    if (this.id === "meadow" && this.layout < 3) return;
    const patches =
      this.id === "meadow"
        ? [
            [-20, 6],
            [-22, -14],
            [-8, 24],
            [9, 29],
            [23, 21],
            [25, 8],
          ]
        : this.id === "woodland"
          ? [
              [-12, -12],
              [-4, -20],
              [5, -8],
              [11, -25],
              [18, 15],
              [52, 1],
              [60, -17],
            ]
          : [
              [45, 17],
              [51, -7],
              [62, -5],
              [61, 20],
              [54, 15],
            ];
    for (const [cx, cz] of patches)
      for (let i = 0; i < 38; i++) {
        const angle = random() * Math.PI * 2,
          r = Math.sqrt(random()) * 3.2,
          x = cx + Math.cos(angle) * r,
          z = cz + Math.sin(angle) * r;
        if (
          this.nearPath(x, z, 0.75) ||
          blocked(x, z, this.obstacles, 0.65) ||
          waterBlocked(x, z, this.id)
        )
          continue;
        const asset =
          i % 7 === 0
            ? "plant-bushsmall"
            : i % 5 === 0
              ? "mushroom-red"
              : i % 3 === 0
                ? "flower-yellowa"
                : i % 2 === 0
                  ? "flower-purplea"
                  : "grass-large";
        this.instance(asset, x, z, 0.9 + random() * 0.7, random() * 6.28);
      }
    if (this.id === "meadow") return;
    for (let i = 0; i < 45; i++) {
      const z = -70 + i * 3.1;
      if (Math.abs(z - 8) < 6) continue;
      const x = riverX(z) + (i % 2 ? 3.55 : -3.55);
      if (this.nearPath(x, z, 0.8) || blocked(x, z, this.obstacles, 0.7))
        continue;
      this.instance("waterplant_A", x, z, 3.1 + random(), random() * 6.28);
    }
  }
  private flushInstances() {
    for (const { id, matrices } of this.buckets.values()) {
      const source = this.library.models.get(id)!;
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
        if (this.layout >= 2 && id.startsWith("tree"))
          for (let i = 0; i < matrices.length; i++) {
            const p = new T.Vector3().setFromMatrixPosition(matrices[i]),
              v = 0.83 + (Math.sin(p.x * 13.7 + p.z * 7.3) * 0.5 + 0.5) * 0.22;
            inst.setColorAt(i, new T.Color(v, v + 0.015, v - 0.02));
          }
        inst.computeBoundingSphere();
        this.group.add(inst);
      });
    }
    this.buckets.clear();
  }
  dispose() {
    this.group.removeFromParent();
    this.group.traverse((o) => {
      if (o instanceof T.InstancedMesh) o.dispose();
    });
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    for (const t of this.ownedTextures) t.dispose();
    this.group.clear();
    this.assetRoots.length = 0;
    this.obstacles.length = 0;
  }
}
