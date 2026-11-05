import * as T from "three";
import { ITEMS, LEGACY, partsFor, expandPrefab, type Part } from "./registry";
import type { Block } from "./commands";
import { BuildChunks } from "../legacy06/build-chunks.js";
const cube = new T.BoxGeometry(1, 1, 1),
  wedge = new T.BufferGeometry();
wedge.setAttribute(
  "position",
  new T.Float32BufferAttribute(
    [
      -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
      0.5, -0.5, 0.5, 0.5, -0.5,
    ],
    3,
  ),
);
wedge.setIndex([
  0, 2, 1, 1, 2, 3, 0, 1, 4, 1, 5, 4, 0, 4, 2, 1, 3, 5, 2, 4, 3, 3, 4, 5,
]);
wedge.computeVertexNormals();
const textures = new Map<string, T.CanvasTexture>();
function texture(id: string, surface: string) {
  if (textures.has(id)) return textures.get(id);
  if (typeof document === "undefined") return undefined;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = "#ffffff";
  x.fillRect(0, 0, 128, 128);
  x.strokeStyle = "#c7c7c7";
  x.lineWidth = 3;
  if (
    [
      "parquet",
      "herringbone",
      "woven",
      "shingles",
      "corrugated",
      "river",
    ].includes(surface)
  ) {
    if (surface === "corrugated") {
      for (let i = 0; i < 128; i += 16) {
        x.fillStyle = "#b2b2b2";
        x.fillRect(i, 0, 4, 128);
        x.fillStyle = "#eeeeee";
        x.fillRect(i + 4, 0, 5, 128);
      }
    } else if (surface === "river") {
      for (let i = 0; i < 24; i++) {
        x.fillStyle = i % 2 ? "#cccccc" : "#eeeeee";
        x.beginPath();
        x.ellipse((i * 43) % 128, (i * 67) % 128, 13, 9, i, 0, Math.PI * 2);
        x.fill();
        x.stroke();
      }
    } else {
      const size = surface === "woven" ? 12 : 32;
      for (let y = 0; y < 128; y += size)
        for (let xx = 0; xx < 128; xx += size) {
          x.save();
          x.translate(xx + size / 2, y + size / 2);
          if (["parquet", "herringbone"].includes(surface))
            x.rotate(((xx + y) / size) % 2 ? Math.PI / 2 : 0);
          x.strokeRect(-size / 2, -size / 2, size, size);
          if (surface === "shingles") {
            x.beginPath();
            x.arc(0, -size / 2, size / 2, 0, Math.PI);
            x.stroke();
          } else
            for (let k = -size / 2; k < size / 2; k += size / 4) {
              x.beginPath();
              x.moveTo(k, -size / 2);
              x.lineTo(k, size / 2);
              x.stroke();
            }
          x.restore();
        }
    }
  } else if (
    ["brick", "tile", "checker", "mosaic", "metal"].includes(surface)
  ) {
    const size = surface === "mosaic" ? 16 : surface === "metal" ? 64 : 32;
    for (let y = 0; y < 128; y += size)
      for (let i = 0; i < 128; i += size) {
        const xx = i - (surface === "brick" && (y / size) % 2 ? size / 2 : 0);
        if (surface === "checker" && ((i + y) / size) % 2 === 0) {
          x.fillStyle = "#aaaaaa";
          x.fillRect(xx, y, size, size);
        }
        x.strokeRect(xx, y, size, size);
      }
  } else if (["wood", "bamboo", "log"].includes(surface)) {
    for (let i = 0; i < 8; i++) {
      x.beginPath();
      x.moveTo(i * 18, 0);
      x.lineTo(i * 18, 128);
      x.stroke();
    }
    if (surface === "log") {
      for (let r = 12; r < 64; r += 12) {
        x.beginPath();
        x.arc(64, 64, r, 0, Math.PI * 2);
        x.stroke();
      }
    }
  } else {
    for (let i = 0; i < 110; i++) {
      const xx = (i * 37) % 128,
        yy = (i * 67) % 128;
      x.fillStyle = i % 3 ? "#e1e1e1" : "#bdbdbd";
      x.fillRect(
        xx,
        yy,
        surface === "cobble" ? 15 : surface === "marble" ? 22 : 3,
        surface === "cobble" ? 12 : 2,
      );
    }
  }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.magFilter = T.NearestFilter;
  textures.set(id, t);
  return t;
}
const geometry = (p: Part) => (p.shape === "wedge" ? wedge : cube);
export function renderModel(b: Block, preview = false) {
  const group = new T.Group();
  group.position.set(b.x + 0.5, b.y, b.z + 0.5);
  group.rotation.y = ((b.rotation || 0) * Math.PI) / 180;
  const i = ITEMS.get(b.type);
  if (!i) {
    for (const child of expandPrefab(b))
      group.add(
        renderModel(
          {
            ...child,
            x: child.x - b.x - 0.5,
            y: child.y - b.y,
            z: child.z - b.z - 0.5,
          },
          preview,
        ),
      );
    group.rotation.y = 0;
    group.position.set(b.x + 0.5, b.y, b.z + 0.5);
    return group;
  }
  for (const p of partsFor(b)) {
    const mesh = new T.Mesh(
      geometry(p),
      new T.MeshLambertMaterial({
        color: p.color,
        map: i.surface ? texture(i.id, i.surface) || null : null,
        transparent: preview,
        opacity: preview ? 0.55 : 1,
      }),
    );
    mesh.position.set(p.x, p.y, p.z);
    mesh.scale.set(p.w, p.h, p.d);
    mesh.rotation.y = p.yaw || 0;
    mesh.userData.block = b;
    group.add(mesh);
  }
  return group;
}
export class RegistryChunks {
  legacy: any;
  private legacyGroup = new T.Group();
  private cells = new Map<string, Map<string, Block>>();
  groups = new Map<string, T.Group>();
  private materials = new Map<string, T.MeshLambertMaterial>();
  constructor(
    readonly parent: T.Group,
    g: T.BoxGeometry,
    m: any,
    decor: any,
  ) {
    parent.add(this.legacyGroup);
    this.legacy = new BuildChunks(this.legacyGroup, g, m, decor);
  }
  private key(b: Block) {
    return `${Math.floor(b.x / 16)},${Math.floor(b.z / 16)}`;
  }
  private anchor(b: Block) {
    return `${b.x},${b.y},${b.z}`;
  }
  clear() {
    this.legacy.clear();
    for (const g of this.groups.values()) {
      g.traverse((m: any) => {
        if (m.isInstancedMesh) m.dispose();
      });
      g.removeFromParent();
    }
    this.groups.clear();
    this.cells.clear();
  }
  reset(blocks: Block[]) {
    this.clear();
    this.legacy.reset(blocks.filter((b) => LEGACY.has(b.type)));
    for (const b of blocks.filter((b) => !LEGACY.has(b.type))) {
      const k = this.key(b);
      if (!this.cells.has(k)) this.cells.set(k, new Map());
      this.cells.get(k)!.set(this.anchor(b), b);
    }
    for (const k of this.cells.keys()) this.rebuild(k);
  }
  update(b: Block, present: boolean) {
    if (LEGACY.has(b.type)) {
      this.legacy.update(b, present);
      return;
    }
    const k = this.key(b);
    if (!this.cells.has(k)) this.cells.set(k, new Map());
    if (present) this.cells.get(k)!.set(this.anchor(b), b);
    else this.cells.get(k)!.delete(this.anchor(b));
    this.rebuild(k);
  }
  private rebuild(k: string) {
    const old = this.groups.get(k);
    if (old) {
      old.traverse((m: any) => {
        if (m.isInstancedMesh) m.dispose();
      });
      old.removeFromParent();
    }
    const group = new T.Group(),
      batches = new Map<string, { b: Block; p: Part; matrix: T.Matrix4 }[]>(),
      root = new T.Object3D(),
      part = new T.Object3D();
    for (const b of this.cells.get(k)?.values() || []) {
      root.position.set(b.x + 0.5, b.y, b.z + 0.5);
      root.rotation.y = ((b.rotation || 0) * Math.PI) / 180;
      root.updateMatrix();
      for (const p of partsFor(b)) {
        part.position.set(p.x, p.y, p.z);
        part.scale.set(p.w, p.h, p.d);
        part.rotation.y = p.yaw || 0;
        part.updateMatrix();
        const item = ITEMS.get(b.type)!,
          key = (p.shape || "box") + ":" + (item.surface ? item.id : "plain");
        if (!batches.has(key)) batches.set(key, []);
        batches.get(key)!.push({
          b,
          p,
          matrix: new T.Matrix4().multiplyMatrices(root.matrix, part.matrix),
        });
      }
    }
    for (const [key, parts] of batches) {
      const item = ITEMS.get(parts[0].b.type)!;
      if (!this.materials.has(key))
        this.materials.set(
          key,
          new T.MeshLambertMaterial({
            color: 0xffffff,
            map: item.surface ? texture(item.id, item.surface) || null : null,
          }),
        );
      const mesh = new T.InstancedMesh(
        geometry(parts[0].p),
        this.materials.get(key)!,
        parts.length,
      );
      parts.forEach((p, i) => {
        mesh.setMatrixAt(i, p.matrix);
        mesh.setColorAt(i, new T.Color(p.p.color));
      });
      mesh.userData.blocks = parts.map((p) => p.b);
      mesh.computeBoundingSphere();
      group.add(mesh);
    }
    this.parent.add(group);
    group.updateMatrixWorld(true);
    this.groups.set(k, group);
  }
  rayMeshes() {
    return [
      ...this.legacy.rayMeshes(),
      ...[...this.groups.values()].flatMap((g) => g.children as T.Mesh[]),
    ];
  }
}
let thumbRenderer: T.WebGLRenderer | undefined;
const thumbs = new Map<string, string>();
export function modelImage(model: T.Group, disposeGeometry = false) {
  if (!thumbRenderer) {
    thumbRenderer = new T.WebGLRenderer({ alpha: true, antialias: false });
    thumbRenderer.setSize(112, 96);
    thumbRenderer.setPixelRatio(1);
  }
  const scene = new T.Scene(),
    bounds = new T.Box3().setFromObject(model),
    center = bounds.getCenter(new T.Vector3()),
    size = bounds.getSize(new T.Vector3()),
    span = Math.max(size.x, size.y, size.z) * 0.8 + 0.25,
    camera = new T.OrthographicCamera(
      -span * 1.17,
      span * 1.17,
      span,
      -span,
      0.01,
      100,
    );
  camera.position
    .copy(center)
    .add(new T.Vector3(span * 2, span * 1.5, span * 2.4));
  camera.lookAt(center);
  scene.add(
    new T.HemisphereLight(0xffffff, 0x839a83, 2),
    new T.DirectionalLight(0xffffff, 1),
    model,
  );
  thumbRenderer.render(scene, camera);
  const url = thumbRenderer.domElement.toDataURL();
  model.traverse((o: any) => {
    if (o.isMesh) o.material.dispose();
  });
  if (disposeGeometry) {
    const owned = new Set<T.BufferGeometry>();
    model.traverse((o: any) => {
      if (o.isMesh) owned.add(o.geometry);
    });
    owned.forEach((g) => g.dispose());
  }
  return url;
}
export function thumbnail(id: string) {
  if (!thumbs.has(id))
    thumbs.set(id, modelImage(renderModel({ x: 0, y: 0, z: 0, type: id })));
  return thumbs.get(id)!;
}
