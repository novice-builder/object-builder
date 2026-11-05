import * as T from "three";
import { renderModel } from "../build/models";
import { blockColliders, ITEMS } from "../build/registry";
import type { Block } from "../build/commands";
import { batchStaticWorld } from "../legacy06/world-render.js";
export interface AuthoredProp {
  id: string;
  block: Block;
  model: T.Group;
}
/** Small authoring helper, shared by region geometry and interactive props. */
export class TownAuthor {
  group = new T.Group();
  solids: any[] = [];
  seats: any[] = [];
  props: AuthoredProp[] = [];
  labels: T.Sprite[] = [];
  geometry = new T.BoxGeometry(1, 1, 1);
  materials = new Map<number, T.MeshLambertMaterial>();
  constructor(parent: T.Group) {
    parent.add(this.group);
  }
  material = (color: number) => {
    if (!this.materials.has(color))
      this.materials.set(color, new T.MeshLambertMaterial({ color }));
    return this.materials.get(color)!;
  };
  box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number,
    solid = false,
    angle = 0,
  ) => {
    const mesh = new T.Mesh(this.geometry, this.material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.rotation.y = angle;
    this.group.add(mesh);
    if (solid) {
      const c = Math.cos(angle),
        s = Math.sin(angle),
        wx = (Math.abs(c) * w + Math.abs(s) * d) / 2,
        wz = (Math.abs(s) * w + Math.abs(c) * d) / 2;
      this.solids.push({
        minX: x - wx,
        maxX: x + wx,
        minY: y - h / 2,
        maxY: y + h / 2,
        minZ: z - wz,
        maxZ: z + wz,
        obb: { cx: x, cz: z, c, s, halfW: w / 2, halfD: d / 2 },
      });
    }
    return mesh;
  };
  object(type: string, x: number, z: number, rotation = 0, y = 0, id?: string) {
    const block = { x: x - 0.5, y, z: z - 0.5, type, rotation },
      model = renderModel(block);
    if (id) {
      this.group.add(model);
      this.props.push({ id, block, model });
    } else {
      model.updateMatrixWorld(true);
      model.traverse((o: any) => {
        if (o.isMesh)
          this.group.add(
            new T.Mesh(
              o.geometry.clone().applyMatrix4(o.matrixWorld),
              o.material,
            ),
          );
      });
      this.solids.push(...blockColliders(block));
    }
    if (ITEMS.get(type)?.interaction === "seat" || type === "bench")
      this.seats.push({ x, y, z, rotation });
    return block;
  }
  label = (
    text: string,
    x: number,
    y: number,
    z: number,
    _angle = 0,
    width = 5.5,
  ) => {
    if (typeof document === "undefined") return;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const c = canvas.getContext("2d")!;
    c.fillStyle = "#fff1d5";
    c.fillRect(0, 0, 512, 96);
    c.fillStyle = "#315d52";
    c.font = "bold 34px sans-serif";
    c.textAlign = "center";
    c.fillText(text, 256, 62);
    const sprite = new T.Sprite(
      new T.SpriteMaterial({ map: new T.CanvasTexture(canvas) }),
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(width, 1, 1);
    this.labels.push(sprite);
    this.group.add(sprite);
  };
  finish(doors: any[]) {
    return batchStaticWorld(
      this.group,
      new Set([...doors.map((d) => d.pivot), ...this.labels]),
    );
  }
}
