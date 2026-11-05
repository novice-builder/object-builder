import {
  ITEMS,
  CHOICES,
  PREFABS,
  blockColliders,
  blockBounds,
  expandPrefab,
} from "../build/registry";
import { RegistryChunks, renderModel } from "../build/models";
import { openCatalogue, renderHotbar } from "../ui/catalogue";
import { Activity, carBox } from "../simulation/activity";
import { fly, avatar, followCamera } from "../player/modes";
import { openMap } from "../ui/map";
import { safeGround } from "../world/spawn";
import { rayBoxNear } from "../build/picking";
import * as T from "three";
import { createRenderer } from "../render/renderer";
import { FixedClock } from "./clock";
import { Controls } from "../input/controls";
import { Commands, type Block } from "../build/commands";
import { CATALOGUE } from "../build/catalogue";
import { createWorld, TEMPLATES, type TemplateId } from "../world/templates";
import { movePlayer, cellBox, collides, overlaps } from "../player/physics.js";
import { SpatialIndex, around } from "../legacy06/spatial.js";
import {
  initializeDoor,
  requestDoor,
  updateDoors as legacyUpdateDoors,
} from "../legacy06/doors.js";
import { doorBox } from "../legacy06/door-geometry.js";
import { BuildChunks } from "../legacy06/build-chunks.js";
import { detailedPiece } from "../legacy06/pieces.js";
const updateDoors = legacyUpdateDoors as (...args: any[]) => boolean;
export class Game {
  activity: Activity | null = null;
  seated: {
    entry: { x: number; z: number; yaw: number };
    height: number;
  } | null = null;
  body = avatar();
  cameraMode: "first" | "third" = "first";
  flying = false;
  vertical = 0;
  view;
  world: any;
  worldGroup = new T.Group();
  buildGroup = new T.Group();
  preview = new T.Group();
  player: any = { ...TEMPLATES[0].spawn, vy: 0, grounded: true };
  selected = "hand";
  favourites: string[] = [];
  recent: string[] = [];
  pending: Block | null = null;
  moving: Block | null = null;
  pickingMove = false;
  automatic = true;
  guard = true;
  paused = false;
  template: TemplateId = "legacy-06";
  controls: Controls;
  commands: Commands;
  chunks: any;
  index = new SpatialIndex();
  clock = new FixedClock();
  ray = new T.Raycaster();
  geometry = new T.BoxGeometry(1, 1, 1);
  materials: Record<string, T.MeshLambertMaterial> = {};
  private decor = new Map<number, T.MeshLambertMaterial>();
  private noticeTimer = 0;
  onEdit = () => {};
  constructor() {
    document.querySelector("#app")!.innerHTML =
      `<canvas id="world" tabindex="-1" aria-label="Drag to look; tap to build; hold to remove"></canvas><div class="brand">BLOCKWORLD <b>2.0</b><small>Sunbeam Town · Development preview</small></div><nav id="top"><button id="home" aria-label="Return home">⌂</button><button id="doorMode" aria-label="Automatic doors" aria-pressed="true">🚪 Auto</button><button id="guard" aria-label="Edge protection" aria-pressed="true">🛡</button><button id="cameraMode" aria-label="Switch camera">👤</button><button id="flyMode" aria-label="Creative flight" aria-pressed="false">🪽</button><button id="mapButton" aria-label="World map">🗺</button><button id="catalogueButton" aria-label="Building catalogue">▦</button><button id="worlds" aria-label="Worlds">🌍</button></nav><output id="status" role="status" aria-live="polite">Starting…</output><div id="crosshair">+</div><div id="joystick" aria-label="Move joystick"><div id="knob"></div></div><div id="actions"><button id="use" aria-label="Use nearby object">🚪</button><button id="undo" aria-label="Undo">↶</button><button id="redo" aria-label="Redo">↷</button><button id="jump" aria-label="Jump">↑</button></div><div id="palette" aria-label="Building hotbar"></div><button id="moveObject" aria-label="Move a built object">✥ Move</button><div id="flightControls" hidden><button id="flyUp" aria-label="Fly up">⇧</button><button id="flyDown" aria-label="Fly down">⇩</button></div><div id="previewControls" hidden><button id="cancel" aria-label="Cancel placement">✕</button><button id="rotate" aria-label="Rotate preview">↻</button><button id="confirm" aria-label="Confirm placement">✓</button></div><div id="modal" hidden></div>`;
    this.view = createRenderer(
      document.querySelector<HTMLCanvasElement>("#world")!,
    );
    this.view.scene.add(
      this.worldGroup,
      this.buildGroup,
      this.preview,
      this.body.group,
    );
    for (const i of CATALOGUE)
      this.materials[i.id] = new T.MeshLambertMaterial({ color: i.color });
    this.chunks = new RegistryChunks(
      this.buildGroup,
      this.geometry,
      this.materials,
      (color: number) => {
        if (!this.decor.has(color))
          this.decor.set(color, new T.MeshLambertMaterial({ color }));
        return this.decor.get(color)!;
      },
    );
    this.commands = new Commands(
      () => this.obstacles(),
      () => this.player,
      (b, present) => {
        this.chunks.update(b, present);
        this.refreshHistory();
        this.onEdit();
      },
    );
    this.load("sunbeam-town");
    this.controls = new Controls(
      document.querySelector("#world")!,
      () => !this.paused,
      {
        tap: (x, y) => this.tap(x, y),
        hold: (x, y) => this.removeAt(x, y),
        look: (dx, dy) => {
          this.player.yaw -= dx * 0.004;
          this.player.pitch = Math.max(
            -1.3,
            Math.min(1.3, this.player.pitch - dy * 0.0035),
          );
        },
        action: (code) => this.key(code),
        pose: () => this.player,
      },
    );
    this.ui();
    this.clock.reset(performance.now());
    requestAnimationFrame((now) => this.frame(now));
    this.notice("Ready · choose a picture to build");
  }
  load(
    template: TemplateId,
    blocks: Block[] = [],
    pose?: any,
    doors: Record<string, boolean> = {},
    activity?: any,
  ) {
    const candidate = new T.Group(),
      world = createWorld(candidate, template, blocks),
      index = new SpatialIndex();
    for (const b of world.solids) index.add(b);
    if (
      blocks.some((b) =>
        index
          .query(blockBounds(b))
          .some((s) =>
            blockColliders(b).some((shape) =>
              overlaps(shape, s.ramp ? { ...s, ramp: null } : s),
            ),
          ),
      )
    ) {
      this.clearGroup(candidate);
      throw Error(
        "Saved objects overlap permanent structures; active progress is unchanged",
      );
    }
    if (
      (template === "home-square" || template === "sunbeam-town") &&
      activity?.car &&
      [...world.solids, ...blocks.flatMap(blockColliders)].some((b) =>
        overlaps(carBox(activity.car), b),
      )
    ) {
      this.clearGroup(candidate);
      throw Error(
        "Saved vehicle overlaps structures; active world is retained",
      );
    }
    this.seated = null;
    this.activity?.dispose();
    this.activity = null;
    this.flying = false;
    this.vertical = 0;
    this.clearGroup(this.worldGroup);
    for (const child of [...candidate.children]) this.worldGroup.add(child);
    this.chunks.clear();
    this.template = template;
    this.world = world;
    this.index = index;
    if (template === "home-square" || template === "sunbeam-town") {
      this.activity = new Activity(
        this.view.scene,
        this.world.activityRange || 47,
      );
      this.activity.load(activity);
    }
    for (const d of this.world.doors)
      initializeDoor(d, doors[d.id] === true, -1);
    this.player = {
      ...(TEMPLATES.find((t) => t.id === template)?.spawn ||
        TEMPLATES[0].spawn),
      ...pose,
      vy: 0,
      grounded: true,
    };
    this.commands.reset(blocks);
    this.chunks.reset(blocks);
    this.cancel();
    if (collides(this.player, this.nearbySolids())) this.home();
    this.refreshHistory();
    this.updateCamera();
  }
  private clearGroup(group: T.Group) {
    const gs = new Set<T.BufferGeometry>(),
      ms = new Set<T.Material>(),
      ts = new Set<T.Texture>();
    group.traverse((o: any) => {
      if (o.isSprite) {
        ms.add(o.material);
        if (o.material.map) ts.add(o.material.map);
      }
      if (o.isMesh) {
        gs.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          ms.add(m);
          if (m.map) ts.add(m.map);
        }
        if (o.isInstancedMesh) o.dispose();
      }
    });
    gs.forEach((g) => g.dispose());
    ms.forEach((m) => m.dispose());
    ts.forEach((t) => t.dispose());
    group.clear();
  }
  obstacles() {
    return [
      ...this.world.solids,
      ...this.world.doors.map((d: any) => doorBox(d)),
      ...(this.activity ? [carBox(this.activity.car)] : []),
    ];
  }
  nearbySolids() {
    return [
      ...(this.activity && !this.activity.driving
        ? [carBox(this.activity.car)]
        : []),
      ...this.index.query(around(this.player, 3)),
      ...this.commands.blocks
        .filter(
          (b) =>
            Math.abs(b.x - this.player.x) < 4 &&
            Math.abs(b.z - this.player.z) < 4,
        )
        .flatMap(blockColliders),
      ...this.world.doors
        .filter(
          (d: any) =>
            Math.hypot(d.center.x - this.player.x, d.center.z - this.player.z) <
            6,
        )
        .map((d: any) => doorBox(d)),
    ];
  }
  update(dt: number) {
    updateDoors(
      this.world.doors,
      this.player,
      this.commands.blocks,
      this.world.solids,
      this.automatic,
      performance.now() / 1000,
      dt,
      (d: any) => ({
        solids: [
          ...this.index.query(around({ ...d.center, y: 0 }, 4)),
          ...(this.activity ? [carBox(this.activity.car)] : []),
          ...this.commands.blocks
            .filter((b) => Math.hypot(b.x - d.center.x, b.z - d.center.z) < 6)
            .flatMap(blockColliders)
            .map((s) => (s.ramp ? { ...s, ramp: null } : s)),
        ],
        blocks: [],
      }),
    );
    const input = this.controls.movement(),
      solids = this.nearbySolids(),
      obstacles = [
        ...this.world.solids,
        ...this.world.doors.map((d: any) => doorBox(d)),
        ...this.commands.blocks.flatMap(blockColliders),
      ];
    if (this.seated && Math.abs(input.forward) + Math.abs(input.right) > 0.2)
      this.stand();
    if (!this.activity?.driving && !this.seated) {
      if (this.flying)
        fly(
          this.player,
          input,
          this.vertical +
            +this.controls.keys.has("Space") -
            +(
              this.controls.keys.has("ShiftLeft") ||
              this.controls.keys.has("ShiftRight")
            ),
          dt,
          solids,
        );
      else
        movePlayer(
          this.player,
          { ...input, edgeProtection: this.guard, walkSpeed: "normal" },
          dt,
          solids,
        );
    }
    this.activity?.update(dt, this.player, input, obstacles);
  }
  frame(now: number) {
    requestAnimationFrame((n) => this.frame(n));
    if (this.paused || document.hidden) this.clock.reset(now);
    else this.clock.tick(now, (dt) => this.update(dt));
    this.updateCamera();
    this.world.staticRender.updateVisibility(this.view.camera, 155);
    this.view.renderer.render(this.view.scene, this.view.camera);
  }
  updateCamera() {
    this.body.group.position.set(
      this.player.x,
      this.seated ? this.seated.height - 0.65 : this.player.y,
      this.player.z,
    );
    this.body.left.rotation.x = this.body.right.rotation.x = this.seated
      ? -1.2
      : 0;
    this.body.group.rotation.y = this.player.yaw;
    this.body.group.visible = false;
    if (this.cameraMode === "third") {
      this.body.group.visible =
        followCamera(this.view.camera, this.player, [
          ...this.index.query(around(this.player, 8)),
          ...this.world.doors.map((d: any) => doorBox(d)),
          ...this.commands.blocks
            .filter(
              (b) =>
                Math.abs(b.x - this.player.x) < 8 &&
                Math.abs(b.z - this.player.z) < 8,
            )
            .flatMap(blockColliders),
        ]) && !this.activity?.driving;
    } else {
      this.view.camera.position.set(
        this.player.x,
        this.seated ? this.seated.height + 0.9 : this.player.y + 1.53,
        this.player.z,
      );
      this.view.camera.rotation.set(this.player.pitch, this.player.yaw, 0);
      this.view.camera.updateMatrixWorld();
    }
  }
  private hit(x = innerWidth / 2, y = innerHeight / 2) {
    this.updateCamera();
    this.view.scene.updateMatrixWorld(true);
    this.ray.setFromCamera(
      new T.Vector2((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2),
      this.view.camera,
    );
    const h = this.ray.intersectObjects(
      [...this.chunks.rayMeshes(), this.world.ground],
      false,
    )[0];
    if (!h || h.distance > 8) return null;
    for (const b of [
      ...this.index.query(around(this.player, 9)),
      ...this.world.doors.map((d: any) => doorBox(d)),
    ]) {
      if (rayBoxNear(this.ray.ray, b) < h.distance - 0.02) return null;
    }
    const data = h.object.userData,
      target =
        data.faceBlocks?.[h.faceIndex!] ||
        data.blocks?.[h.instanceId!] ||
        data.block;
    let aim: Block;
    if (target) {
      const normal = h
        .face!.normal.clone()
        .transformDirection(h.object.matrixWorld);
      if ((h.object as any).isInstancedMesh) {
        const m = new T.Matrix4();
        (h.object as T.InstancedMesh).getMatrixAt(h.instanceId!, m);
        normal
          .copy(h.face!.normal)
          .transformDirection(m)
          .transformDirection(h.object.matrixWorld);
      }
      const p = h.point.clone().addScaledVector(normal, 0.015);
      aim = {
        x: Math.floor(p.x),
        y: Math.floor(p.y),
        z: Math.floor(p.z),
        type: this.selected,
      };
      if (!ITEMS.get(target.type)?.cube) {
        const axis = (["x", "y", "z"] as ("x" | "y" | "z")[]).sort(
          (a, b) => Math.abs(normal[b]) - Math.abs(normal[a]),
        )[0];
        aim = { ...target, type: this.selected };
        aim[axis] += Math.sign(normal[axis]);
      }
    } else
      aim = {
        x: Math.floor(h.point.x),
        y: 0,
        z: Math.floor(h.point.z),
        type: this.selected,
      };
    return { target, aim };
  }
  tap(x: number, y: number) {
    if (this.paused) return;
    if (this.activity?.driving) {
      this.notice("Park before building");
      return;
    }
    const picked = this.hit(x, y);
    if (this.pickingMove) {
      if (!picked?.target) {
        this.notice("Tap an object you built");
        return;
      }
      this.moving = { ...picked.target };
      this.pending = { ...picked.target };
      this.pickingMove = false;
      this.showPreview();
      this.notice("Tap its new spot, turn it, then confirm");
      return;
    }
    if (this.moving && picked) {
      this.pending = {
        ...picked.aim,
        type: this.moving.type,
        rotation: this.pending?.rotation || 0,
      };
      this.showPreview();
      return;
    }
    if (this.selected === "hand") {
      this.use();
      return;
    }
    const h = picked;
    if (!h) {
      this.notice("Move closer to a clear space");
      return;
    }
    const reason = this.placementReason(h.aim);
    if (reason) {
      this.notice(reason);
      return;
    }
    if (!ITEMS.get(this.selected)?.cube) {
      this.pending = { ...h.aim, rotation: 0 };
      this.showPreview();
    } else this.notice(this.commands.place(h.aim) || "✓ Placed");
  }
  removeAt(x: number, y: number) {
    if (this.paused) return;
    const h = this.hit(x, y);
    if (h?.target) {
      this.cancel();
      this.commands.remove(h.target);
      this.notice("↶ Removed — Undo brings it back");
    }
  }
  showPreview() {
    this.preview.traverse((o: any) => {
      if (o.isMesh) o.material.dispose();
    });
    this.preview.clear();
    if (!this.pending) return;
    this.preview.add(renderModel(this.pending, true));
    document.querySelector<HTMLElement>("#previewControls")!.hidden = false;
    document.querySelector<HTMLButtonElement>("#confirm")!.disabled =
      !!this.placementReason(this.pending);
  }
  cancel() {
    this.pending = null;
    this.moving = null;
    this.pickingMove = false;
    this.preview.traverse((o: any) => {
      if (o.isMesh) o.material.dispose();
    });
    this.preview.clear();
    const p = document.querySelector<HTMLElement>("#previewControls");
    if (p) p.hidden = true;
  }
  confirm() {
    if (!this.pending) return;
    const reason = this.moving
      ? this.commands.move(this.moving, this.pending)
      : this.commands.placeMany(expandPrefab(this.pending));
    if (reason) this.notice(reason);
    else {
      this.cancel();
      this.notice("✓ Placed");
    }
  }
  stand() {
    if (!this.seated) return true;
    try {
      Object.assign(
        this.player,
        safeGround(this.seated.entry, [
          ...this.obstacles(),
          ...this.commands.blocks.flatMap(blockColliders),
        ]),
      );
      this.seated = null;
      this.refreshModes();
      this.onEdit();
      return true;
    } catch (error) {
      this.notice(String(error));
      return false;
    }
  }
  use() {
    if (this.seated) {
      this.stand();
      return;
    }

    const built = this.commands.blocks
      .filter(
        (b) =>
          ["door", "light"].includes(ITEMS.get(b.type)?.interaction || "") &&
          Math.hypot(b.x + 0.5 - this.player.x, b.z + 0.5 - this.player.z) <
            2.4 &&
          Math.abs(b.y - this.player.y) < 2,
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - this.player.x, a.z - this.player.z) -
          Math.hypot(b.x - this.player.x, b.z - this.player.z),
      )[0];
    if (built) {
      this.notice(this.commands.toggle(built) || "✓ Used");
      return;
    }

    const seats = [
      ...(this.world.seats || []),
      ...this.commands.blocks
        .filter((b) => ITEMS.get(b.type)?.interaction === "seat")
        .map((b) => ({
          x: b.x + 0.5,
          z: b.z + 0.5,
          y: b.y,
          rotation: b.rotation || 0,
        })),
    ];
    const seat = seats
      .filter(
        (s: any) =>
          Math.abs((s.y || 0) - this.player.y) < 1.2 &&
          Math.hypot(s.x - this.player.x, s.z - this.player.z) < 2,
      )
      .sort(
        (a: any, b: any) =>
          Math.hypot(a.x - this.player.x, a.z - this.player.z) -
          Math.hypot(b.x - this.player.x, b.z - this.player.z),
      )[0];
    if (seat) {
      const origin = new T.Vector3(
          this.player.x,
          this.player.y + 1.3,
          this.player.z,
        ),
        target = new T.Vector3(seat.x, (seat.y || 0) + 1.2, seat.z),
        distance = origin.distanceTo(target),
        ray = new T.Ray(origin, target.sub(origin).normalize());
      if (
        ![
          ...this.obstacles(),
          ...this.commands.blocks.flatMap(blockColliders),
        ].some((b) => rayBoxNear(ray, b) < distance - 0.2)
      ) {
        this.seated = {
          entry: { x: this.player.x, z: this.player.z, yaw: this.player.yaw },
          height: (seat.y || 0) + 0.4,
        };
        Object.assign(this.player, {
          x: seat.x,
          y: seat.y || 0,
          z: seat.z,
          yaw: ((seat.rotation || 0) * Math.PI) / 180,
          vy: 0,
          grounded: true,
        });
        this.flying = false;
        this.vertical = 0;
        this.controls.clear();
        this.refreshModes();
        this.notice("🪑 Sitting · move or tap Use to stand");
        this.onEdit();
        return;
      }
    }
    if (this.activity) {
      try {
        const message = this.activity.use(this.player, [
          ...this.obstacles(),
          ...this.commands.blocks.flatMap(blockColliders),
        ]);
        if (message) {
          this.flying = false;
          this.vertical = 0;
          this.refreshModes();
          this.controls.clear();
          this.notice(message);
          this.onEdit();
          return;
        }
      } catch (e) {
        this.notice(String(e));
        return;
      }
    }
    const d = this.world.doors
      .filter(
        (d: any) =>
          Math.abs(this.player.y) < 2.3 &&
          Math.hypot(d.center.x - this.player.x, d.center.z - this.player.z) <
            3.2,
      )
      .sort(
        (a: any, b: any) =>
          Math.hypot(a.center.x - this.player.x, a.center.z - this.player.z) -
          Math.hypot(b.center.x - this.player.x, b.center.z - this.player.z),
      )[0];
    if (!d) {
      this.notice("Walk closer to a door");
      return;
    }
    const r = requestDoor(
      d,
      !d.targetOpen,
      this.player,
      this.commands.blocks,
      [
        ...this.world.solids,
        ...(this.activity ? [carBox(this.activity.car)] : []),
      ],
      true,
    );
    this.notice(r.ok ? "🚪 Door" : r.message || "Clear the doorway");
    this.onEdit();
  }
  home() {
    Object.assign(
      this.player,
      safeGround(
        TEMPLATES.find((t) => t.id === this.template)?.spawn ||
          TEMPLATES[0].spawn,
        [...this.obstacles(), ...this.commands.blocks.flatMap(blockColliders)],
      ),
    );
    this.seated = null;
    this.flying = false;
    if (this.activity) this.activity.driving = false;
    this.vertical = 0;
    this.refreshModes();
    this.controls?.clear();
    this.cancel();
  }
  jump() {
    if (this.seated) {
      this.stand();
      return;
    }
    if (
      !this.paused &&
      !this.flying &&
      !this.activity?.driving &&
      this.player.grounded
    ) {
      this.player.vy = 6;
      this.player.grounded = false;
    }
  }
  key(c: string) {
    if (c === "Space") this.jump();
    if (c === "KeyE") this.use();
    if (c === "KeyF") this.tap(innerWidth / 2, innerHeight / 2);
    if (c === "KeyR") {
      if (this.pending) {
        this.pending.rotation = ((this.pending.rotation || 0) + 90) % 360;
        this.showPreview();
      } else this.removeAt(innerWidth / 2, innerHeight / 2);
    }
    if (c === "Enter") this.confirm();
    if (c === "KeyZ") this.commands.undo();
    if (c === "KeyY") this.commands.redo();
    if (c === "Escape") this.cancel();
  }
  ui() {
    const on = (id: string, fn: () => void) =>
      (document.querySelector<HTMLButtonElement>("#" + id)!.onclick = fn);
    on("cameraMode", () => {
      this.cameraMode = this.cameraMode === "first" ? "third" : "first";
      this.refreshModes();
      this.onEdit();
    });
    on("flyMode", () => {
      if (this.seated && !this.stand()) return;
      if (this.activity?.driving) {
        this.notice("Leave the car before flying");
        return;
      }
      this.flying = !this.flying;
      this.player.vy = 0;
      document.querySelector<HTMLElement>("#flightControls")!.hidden =
        !this.flying;
      document
        .querySelector("#flyMode")!
        .setAttribute("aria-pressed", String(this.flying));
      this.onEdit();
    });
    on("mapButton", () => openMap(this));
    on("catalogueButton", () => this.catalogue());
    for (const [id, value] of [
      ["flyUp", 1],
      ["flyDown", -1],
    ] as const) {
      const b = document.querySelector<HTMLButtonElement>("#" + id)!;
      b.onpointerdown = (e) => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        this.vertical = value;
      };
      for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
        b.addEventListener(name, () => (this.vertical = 0));
    }
    addEventListener("blur", () => (this.vertical = 0));
    on("moveObject", () => {
      if (this.paused) return;
      this.cancel();
      this.pickingMove = true;
      this.notice("Tap an object you built to move it");
    });
    document.addEventListener("visibilitychange", () => (this.vertical = 0));
    on("home", () => this.home());
    on("jump", () => this.jump());
    on("use", () => this.use());
    on("undo", () => this.commands.undo());
    on("redo", () => this.commands.redo());
    on("cancel", () => this.cancel());
    on("rotate", () => {
      if (this.pending) {
        this.pending.rotation = ((this.pending.rotation || 0) + 90) % 360;
        this.showPreview();
      }
    });
    on("confirm", () => this.confirm());
    on("doorMode", () => {
      this.automatic = !this.automatic;
      document
        .querySelector("#doorMode")!
        .setAttribute("aria-pressed", String(this.automatic));
    });
    on("guard", () => {
      this.guard = !this.guard;
      document
        .querySelector("#guard")!
        .setAttribute("aria-pressed", String(this.guard));
    });
    renderHotbar(this);
    document.querySelector("#palette")!.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>(
        "[data-item]",
      );
      if (!b || this.paused) return;
      this.choose(b.dataset.item!, true);
    });
  }
  catalogue() {
    openCatalogue(this);
  }
  choose(id: string, toggle = false) {
    this.selected = toggle && this.selected === id ? "hand" : id;
    this.recent = [id, ...this.recent.filter((x) => x !== id)].slice(0, 8);
    this.cancel();
    renderHotbar(this);
    this.refreshSelection();
    this.onEdit();
  }
  placementReason(b: Block) {
    if (this.moving) return this.commands.reason(b, true, this.moving);
    if (!PREFABS.some((p) => p.id === b.type)) return this.commands.reason(b);
    const temporary = new Commands(
      () => this.obstacles(),
      () => this.player,
      () => {},
    );
    temporary.reset(this.commands.blocks);
    return temporary.placeMany(expandPrefab(b));
  }
  refreshSelection() {
    document
      .querySelectorAll<HTMLButtonElement>("[data-item]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.item === this.selected),
        ),
      );
  }
  refreshModes() {
    this.refreshSelection();
    document.querySelector<HTMLElement>("#flightControls")!.hidden =
      !this.flying;
    document
      .querySelector("#flyMode")!
      .setAttribute("aria-pressed", String(this.flying));
    document
      .querySelector("#cameraMode")!
      .setAttribute("aria-pressed", String(this.cameraMode === "third"));
    document.querySelector("#use")!.textContent = this.seated
      ? "🪑"
      : this.activity?.driving
        ? "🚶"
        : "✋";
  }
  refreshHistory() {
    const u = document.querySelector<HTMLButtonElement>("#undo"),
      r = document.querySelector<HTMLButtonElement>("#redo");
    if (u) u.disabled = !this.commands.canUndo;
    if (r) r.disabled = !this.commands.canRedo;
  }
  notice(text: string) {
    const s = document.querySelector("#status")!;
    s.textContent = text;
    clearTimeout(this.noticeTimer);
    this.noticeTimer = window.setTimeout(() => (s.textContent = ""), 5000);
  }
  snapshot() {
    return {
      favourites: this.favourites,
      recent: this.recent,
      camera: this.cameraMode,
      flying: this.flying,
      activity: this.activity?.snapshot(),
      template: this.template,
      player: { ...this.player },
      blocks: this.commands.blocks.map((b) => ({ ...b })),
      doors: Object.fromEntries(
        this.world.doors.map((d: any) => [d.id, d.targetOpen]),
      ),
      selected: this.selected,
    };
  }
}
