import {
  layoutMapTargets,
  pickMapDestination,
  type MapTarget,
} from "./map-targets";
import {
  MapTransform,
  type WorldMapData,
  type MapDestination,
} from "./map-data";
export interface MapPose {
  x: number;
  z: number;
  yaw: number;
}
export class AdventureMap {
  data: WorldMapData | null = null;
  transform: MapTransform | null = null;
  open = false;
  private base = document.createElement("canvas");
  private pose: MapPose = { x: 0, z: 0, yaw: 0 };
  private lastMini = 0;
  private drawnPose = "";
  private pointers = new Map<number, { x: number; y: number }>();
  private gesture = false;
  private down: { x: number; y: number } | null = null;
  private pinch = 0;
  private targets: MapTarget[] = [];
  private point(e: PointerEvent) {
    const r = this.full.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  constructor(
    readonly mini: HTMLCanvasElement,
    readonly full: HTMLCanvasElement,
    readonly travel: (d: MapDestination) => void,
  ) {
    full.addEventListener("pointerdown", (e) => {
      if (!this.open) return;
      full.setPointerCapture(e.pointerId);
      const at = this.point(e);
      this.pointers.set(e.pointerId, at);
      this.down = at;
      if (this.pointers.size > 1) {
        this.gesture = true;
        this.pinch = this.span();
      }
    });
    full.addEventListener("pointermove", (e) => {
      const old = this.pointers.get(e.pointerId);
      if (!old || !this.transform) return;
      const at = this.point(e),
        dx = at.x - old.x,
        dy = at.y - old.y;
      this.pointers.set(e.pointerId, at);
      if (this.pointers.size === 2) {
        const now = this.span(),
          p = [...this.pointers.values()];
        this.transform.zoom(
          now / Math.max(1, this.pinch),
          (p[0].x + p[1].x) / 2,
          (p[0].y + p[1].y) / 2,
        );
        this.pinch = now;
      } else {
        if (this.down && Math.hypot(at.x - this.down.x, at.y - this.down.y) > 7)
          this.gesture = true;
        if (this.gesture) this.transform.pan(dx, dy);
      }
      this.drawFull();
    });
    full.addEventListener("pointerup", (e) => {
      const at = this.point(e),
        owned = this.pointers.has(e.pointerId);
      if (
        owned &&
        this.open &&
        this.down &&
        Math.hypot(at.x - this.down.x, at.y - this.down.y) <= 7 &&
        !this.gesture &&
        this.pointers.size === 1 &&
        this.transform &&
        this.data
      ) {
        const rect = this.full.getBoundingClientRect();
        const picked = pickMapDestination(
          this.targets,
          at.x,
          at.y,
          rect.width,
          rect.height,
        );
        if (picked) this.travel(picked);
      }
      this.pointers.delete(e.pointerId);
      if (!this.pointers.size) {
        this.gesture = false;
        this.down = null;
      }
    });
    for (const event of ["pointercancel", "lostpointercapture"])
      full.addEventListener(event, (e) => {
        this.pointers.delete((e as PointerEvent).pointerId);
        if (!this.pointers.size) {
          this.gesture = false;
          this.down = null;
        }
      });
    full.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.transform?.zoom(
          Math.exp(-e.deltaY * 0.0015),
          e.offsetX,
          e.offsetY,
        );
        this.drawFull();
      },
      { passive: false },
    );
    full.addEventListener("keydown", (e) => {
      if (!this.transform) return;
      const arrows: Record<string, number[]> = {
        ArrowLeft: [40, 0],
        ArrowRight: [-40, 0],
        ArrowUp: [0, 40],
        ArrowDown: [0, -40],
      };
      if (arrows[e.key]) {
        e.preventDefault();
        this.transform.pan(...(arrows[e.key] as [number, number]));
        this.drawFull();
      }
      if (e.key === "+" || e.key === "=") this.zoom(1.3);
      if (e.key === "-") this.zoom(1 / 1.3);
    });
  }
  private span() {
    const [a, b] = [...this.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
  setWorld(data: WorldMapData) {
    this.data = data;
    this.targets = [];
    this.transform = null;
    this.drawnPose = "";
    this.makeBase();
  }
  private makeBase() {
    if (!this.data) return;
    const d = this.data,
      b = d.bounds,
      w = b.maxX - b.minX,
      h = b.maxZ - b.minZ;
    this.base.width = 1536;
    this.base.height = Math.ceil((1536 * h) / w);
    const c = this.base.getContext("2d")!,
      scale = 1536 / w;
    c.scale(scale, scale);
    c.translate(-b.minX, -b.minZ);
    c.fillStyle = "#acc08a";
    c.fillRect(b.minX, b.minZ, w, h);
    if (d.scene === "woodland" || d.scene === "vale") {
      const grad = c.createLinearGradient(b.minX, 0, b.maxX, 0);
      grad.addColorStop(0, "#a2b97b");
      grad.addColorStop(0.32, "#8fa970");
      grad.addColorStop(0.52, "#638963");
      grad.addColorStop(0.7, "#95b17d");
      grad.addColorStop(1, "#b2c691");
      c.fillStyle = grad;
      c.fillRect(b.minX, b.minZ, w, h);
    }
    for (const river of d.rivers) {
      c.strokeStyle = "#d3ce9f";
      c.lineWidth = 9;
      c.lineJoin = "round";
      this.line(c, river);
      c.strokeStyle = "#75b9bf";
      c.lineWidth = 5.8;
      this.line(c, river);
    }
    for (const t of d.trees) {
      c.fillStyle = "rgba(40,75,48,.17)";
      c.beginPath();
      c.arc(t.x + 0.8, t.z + 0.6, t.radius * 1.2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle =
        d.scene === "woodland" || (d.scene === "vale" && t.x > -43 && t.x < 47)
          ? "#3e704f"
          : "#6d9456";
      c.beginPath();
      c.arc(t.x, t.z, t.radius, 0, Math.PI * 2);
      c.fill();
    }
    for (const p of d.paths) {
      c.strokeStyle = "#8d9563";
      c.lineWidth = p.width + 0.5;
      c.lineJoin = "round";
      c.lineCap = "round";
      this.line(c, p.points);
      c.strokeStyle = "#e1d0a3";
      c.lineWidth = p.width;
      this.line(c, p.points);
    }
    for (const o of d.buildings) {
      c.fillStyle = "#456358";
      c.fillRect(o.minX + 0.6, o.minZ + 0.7, o.maxX - o.minX, o.maxZ - o.minZ);
      c.fillStyle = o.name?.includes("green") ? "#5e8d75" : "#548693";
      c.strokeStyle = "#385d55";
      c.lineWidth = 0.4;
      c.fillRect(o.minX, o.minZ, o.maxX - o.minX, o.maxZ - o.minZ);
      c.strokeRect(o.minX, o.minZ, o.maxX - o.minX, o.maxZ - o.minZ);
    }
  }
  private line(c: CanvasRenderingContext2D, points: number[][]) {
    c.beginPath();
    points.forEach(([x, z], i) => (i ? c.lineTo(x, z) : c.moveTo(x, z)));
    c.stroke();
  }
  update(pose: MapPose, time: number, force = false) {
    this.pose = pose;
    if (!force && time - this.lastMini < 80) return;
    const key = [
      pose.x.toFixed(2),
      pose.z.toFixed(2),
      pose.yaw.toFixed(2),
      this.mini.clientWidth,
    ].join(":");
    if (key !== this.drawnPose) {
      this.drawMini();
      this.drawnPose = key;
    }
    this.lastMini = time;
    if (this.open) this.drawFull();
  }
  private canvasSize(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect(),
      ratio = Math.min(devicePixelRatio, 2);
    if (
      canvas.width !== Math.round(rect.width * ratio) ||
      canvas.height !== Math.round(rect.height * ratio)
    ) {
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
    }
    const c = canvas.getContext("2d")!;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { c, w: rect.width, h: rect.height };
  }
  private background(
    c: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: MapTransform,
  ) {
    if (!this.data) return;
    const b = this.data.bounds,
      p = t.screen(b.minX, b.minZ);
    c.fillStyle = "#d7ddbd";
    c.fillRect(0, 0, w, h);
    c.drawImage(
      this.base,
      p.x,
      p.y,
      (b.maxX - b.minX) * t.scale,
      (b.maxZ - b.minZ) * t.scale,
    );
  }
  private player(c: CanvasRenderingContext2D, x: number, y: number, size = 8) {
    c.save();
    c.translate(x, y);
    c.rotate(Math.PI - this.pose.yaw);
    c.shadowBlur = 4;
    c.shadowColor = "#203c3a66";
    c.beginPath();
    c.moveTo(0, -size);
    c.lineTo(size * 0.65, size * 0.7);
    c.lineTo(0, size * 0.35);
    c.lineTo(-size * 0.65, size * 0.7);
    c.closePath();
    c.fillStyle = "#fcf7e8";
    c.strokeStyle = "#244b50";
    c.lineWidth = 2;
    c.fill();
    c.stroke();
    c.restore();
  }
  private drawMini() {
    if (!this.data) return;
    const { c, w, h } = this.canvasSize(this.mini);
    if (!w || !h) return;
    const t = new MapTransform(this.data.bounds, w, h);
    t.x = this.pose.x;
    t.z = this.pose.z;
    t.scale = w / 66;
    c.save();
    c.beginPath();
    c.arc(w / 2, h / 2, w / 2 - 1, 0, Math.PI * 2);
    c.clip();
    this.background(c, w, h, t);
    this.player(c, w / 2, h / 2, 9);
    c.restore();
    c.font = "600 11px system-ui";
    c.textAlign = "center";
    c.fillStyle = "#2a5148";
    c.fillText("N", w / 2, 16);
  }
  show() {
    this.open = true;
    this.resize();
    if (this.transform && this.full.clientWidth < 700) {
      this.transform.zoom(2.3);
      this.transform.x = this.pose.x;
      this.transform.z = this.pose.z;
      this.drawFull();
    }
    this.full.focus();
  }
  hide() {
    this.open = false;
    this.pointers.clear();
    this.gesture = false;
    this.down = null;
  }
  resize() {
    if (!this.open || !this.data) return;
    const { w, h } = this.canvasSize(this.full),
      old = this.transform;
    this.transform = new MapTransform(this.data.bounds, w, h);
    if (old) {
      this.transform.x = old.x;
      this.transform.z = old.z;
      this.transform.scale = old.scale;
    }
    this.drawFull();
  }
  zoom(factor: number) {
    this.transform?.zoom(factor);
    this.drawFull();
  }
  fit() {
    this.transform?.fit();
    this.drawFull();
  }
  drawFull() {
    if (!this.open || !this.data || !this.transform) return;
    const { c, w, h } = this.canvasSize(this.full),
      t = this.transform;
    this.background(c, w, h, t);
    c.textAlign = "center";
    c.textBaseline = "middle";
    this.targets = layoutMapTargets(
      this.data.destinations,
      t,
      w,
      h,
      (text, font) => {
        c.font = font;
        return c.measureText(text).width;
      },
    );
    for (const target of this.targets) {
      c.beginPath();
      c.arc(target.x, target.y, 7, 0, Math.PI * 2);
      c.fillStyle = "#fff9e8";
      c.fill();
      c.strokeStyle = "#3d6554";
      c.lineWidth = 2;
      c.stroke();
    }
    for (const { label } of this.targets) {
      c.font = label.font;
      for (let i = 0; i < label.lines.length; i++) {
        const x = label.x + label.width / 2,
          y = label.y + 4 + (i + 0.5) * label.lineHeight;
        c.lineWidth = 3;
        c.strokeStyle = "#f9f6e6";
        c.strokeText(label.lines[i], x, y);
        c.fillStyle = "#294b40";
        c.fillText(label.lines[i], x, y);
      }
    }
    const p = t.screen(this.pose.x, this.pose.z);
    this.player(c, p.x, p.y, 10);
  }
}
