import {
  ITEMS,
  CHOICES,
  PREFABS,
  blockColliders,
  blockBounds,
  expandPrefab,
} from "../build/registry";
import { RegistryChunks, renderModel } from "../build/models";
import { BuildCollisionIndex } from "../build/collision-index";
import { openCatalogue, renderHotbar } from "../ui/catalogue";
import { Activity, carBox } from "../simulation/activity";
import { fly, followCamera } from "../player/modes";
import { createAvatar, disposeAvatar, APPEARANCES } from "../player/appearance";
import { openWardrobe } from "../ui/wardrobe";
import { openPetMenu } from "../ui/pet-menu";
import { openControlMenu } from "../ui/controls-menu";
import { openMap } from "../ui/map";
import { safeGround, safeStanding } from "../world/spawn";
import { chooseInteraction, type Interaction } from "./interactions";
import { PLAY, playPose, playDuration } from "../simulation/play";
import {
  syncProps,
  refreshProp,
  propSnapshot,
  type PropStates,
} from "../world/props";
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
    entry: { x: number; y: number; z: number; yaw: number; pitch?: number };
    height: number;
  } | null = null;
  playing: {
    kind: string;
    block: Block;
    entry: any;
    elapsed: number;
    model: T.Group | null;
    built: boolean;
    original?: T.Group;
  } | null = null;
  private contextTime = 0;
  appearance = "explorer";
  body = createAvatar();
  lookSpeed = 1;
  leftHanded = false;
  lightPool: T.PointLight[] = [];
  private dirtyBuilds: { block: Block; present: boolean }[] = [];
  gait = 0;
  walkAmount = 0;
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
  hotbar: string[] = [];
  repeatCount = 1;
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
  builds = new BuildCollisionIndex();
  clock = new FixedClock();
  ray = new T.Raycaster();
  geometry = new T.BoxGeometry(1, 1, 1);
  materials: Record<string, T.MeshLambertMaterial> = {};
  private decor = new Map<number, T.MeshLambertMaterial>();
  private noticeTimer = 0;
  onEdit = () => {};
  constructor() {
    document.querySelector("#app")!.innerHTML =
      `<canvas id="world" tabindex="-1" aria-label="Drag to look; tap to build; hold to remove"></canvas><div class="brand">BLOCKWORLD <b>2.0</b><small>Sunbeam Town · Development preview</small></div><nav id="top"><button id="home" aria-label="Return home">⌂</button><button id="doorMode" aria-label="Automatic doors" aria-pressed="true">🚪 Auto</button><button id="guard" aria-label="Edge protection" aria-pressed="true">🛡</button><button id="cameraMode" aria-label="Switch camera">👤</button><button id="flyMode" aria-label="Creative flight" aria-pressed="false">🪽</button><button id="mapButton" aria-label="World map">🗺</button><button id="catalogueButton" aria-label="Building catalogue">▦</button><button id="avatarButton" aria-label="Choose avatar">👕</button><button id="controlsButton" aria-label="Control settings">🎮</button><button id="worlds" aria-label="Worlds">🌍</button></nav><output id="status" role="status" aria-live="polite">Starting…</output><div id="crosshair">+</div><div id="joystick" aria-label="Move joystick"><div id="knob"></div></div><div id="actions"><button id="use" aria-label="Use nearby object">🚪</button><button id="undo" aria-label="Undo">↶</button><button id="redo" aria-label="Redo">↷</button><button id="jump" aria-label="Jump">↑</button></div><div id="palette" aria-label="Building hotbar"></div><button id="moveObject" aria-label="Move a built object">✥ Move</button><div id="flightControls" hidden><button id="flyUp" aria-label="Fly up">⇧</button><button id="flyDown" aria-label="Fly down">⇩</button></div><div id="previewControls" hidden><button id="cancel" aria-label="Cancel placement">✕</button><button id="lower" aria-label="Lower preview">⇩</button><button id="raise" aria-label="Raise preview">⇧</button><button id="rotate" aria-label="Rotate preview">↻</button><button id="confirm" aria-label="Confirm placement">✓</button></div><div id="modal" hidden></div>`;
    this.view = createRenderer(
      document.querySelector<HTMLCanvasElement>("#world")!,
    );
    this.view.scene.add(
      this.worldGroup,
      this.buildGroup,
      this.preview,
      this.body.group,
    );
    for (let i = 0; i < 3; i++) {
      const light = new T.PointLight(0xffdf95, 0, 8, 2);
      this.lightPool.push(light);
      this.view.scene.add(light);
    }
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
        this.dirtyBuilds.push({ block: b, present });
        this.builds.update(b, present);
      },
      () => {
        this.chunks.updateMany(this.dirtyBuilds.splice(0));
        this.refreshHistory();
        this.onEdit();
      },
    );
    this.load("sunbeam-county");
    this.controls = new Controls(
      document.querySelector("#world")!,
      () => !this.paused,
      {
        tap: (x, y) => this.tap(x, y),
        hold: (x, y) => this.removeAt(x, y),
        look: (dx, dy) => {
          this.player.yaw -= dx * 0.004 * this.lookSpeed;
          this.player.pitch = Math.max(
            -1.3,
            Math.min(1.3, this.player.pitch - dy * 0.0035 * this.lookSpeed),
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
    props?: PropStates,
    layout?: number,
  ) {
    const candidate = new T.Group(),
      world = createWorld(candidate, template, blocks, layout),
      index = new SpatialIndex();
    syncProps(world, props);
    for (const b of world.solids) index.add(b);
    if (
      blocks.some((b) =>
        [
          ...index.query(blockBounds(b)),
          ...(world.dynamicSolids?.() || []),
        ].some((s) =>
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
      (template === "home-square" ||
        template === "sunbeam-town" ||
        template === "sunbeam-region" ||
        template === "sunbeam-county") &&
      activity?.car &&
      [
        activity.car,
        ...(activity.vehicles || []).map((v: any) => ({
          ...v,
          ...(v.id === "bicycle" ? { kind: "bicycle" } : {}),
        })),
      ].some((c) =>
        [
          ...world.solids,
          ...(world.dynamicSolids?.() || []),
          ...blocks.flatMap(blockColliders),
        ].some((b) => overlaps(carBox(c), b)),
      )
    ) {
      this.clearGroup(candidate);
      throw Error(
        "Saved vehicle overlaps structures; active world is retained",
      );
    }
    this.endPlay(false);
    this.seated = null;
    this.activity?.dispose();
    this.activity = null;
    this.flying = false;
    this.vertical = 0;
    this.clearGroup(this.worldGroup);
    for (const child of [...candidate.children]) this.worldGroup.add(child);
    this.chunks.clear();
    this.template = template;
    document.querySelector(".brand small")!.textContent =
      `${TEMPLATES.find((t) => t.id === template)?.name} · Development preview`;
    this.world = world;
    this.index = index;
    if (
      template === "home-square" ||
      template === "sunbeam-town" ||
      template === "sunbeam-region" ||
      template === "sunbeam-county"
    ) {
      this.activity = new Activity(
        this.view.scene,
        this.world.activityRange || 47,
        (p, r) => this.querySolids(p, r),
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
    this.builds.reset(blocks);
    this.activity?.resolveHorses();
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
        if (!o.userData.sharedGeometry) gs.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          ms.add(m);
          if (m.map && !m.map.userData.shared) ts.add(m.map);
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
      ...(this.world.dynamicSolids?.() || []),
      ...this.waterHazards(),
      ...this.world.doors.map((d: any) => doorBox(d)),
      ...(this.activity?.entitySolids() || []),
    ];
  }
  waterHazards() {
    return (this.world.waterAreas || []).map((w: any) => ({
      minX: w.x - w.w / 2,
      maxX: w.x + w.w / 2,
      minZ: w.z - w.d / 2,
      maxZ: w.z + w.d / 2,
      minY: 0,
      maxY: 0.08,
    }));
  }
  querySolids(p: any, r: number) {
    return [
      ...this.index.query(around(p, r)),
      ...(this.world.dynamicSolids?.() || []).filter(
        (b: any) =>
          b.minX < p.x + r &&
          b.maxX > p.x - r &&
          b.minZ < p.z + r &&
          b.maxZ > p.z - r,
      ),
      ...this.builds.query(p, r),
      ...this.world.doors
        .filter(
          (d: any) => Math.hypot(d.center.x - p.x, d.center.z - p.z) < r + 3,
        )
        .map((d: any) => doorBox(d)),
      ...this.waterHazards().filter(
        (w: any) =>
          w.minX < p.x + r &&
          w.maxX > p.x - r &&
          w.minZ < p.z + r &&
          w.maxZ > p.z - r,
      ),
    ];
  }
  nearbySolids() {
    return [
      ...(this.activity?.entitySolids(true) || []),
      ...(this.world.dynamicSolids?.() || []),
      ...this.index.query(around(this.player, 3)),
      ...this.builds.query(this.player, 3),
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
          ...(this.activity?.entitySolids() || []),
          ...this.builds
            .query({ ...d.center, y: 0 }, 4)
            .map((s) => (s.ramp ? { ...s, ramp: null } : s)),
        ],
        blocks: [],
      }),
    );
    if (this.world.aircraft?.passenger) {
      const message = this.world.aircraft.update(
        dt,
        this.player,
        (p: any, r: number) => [
          ...this.querySolids(p, r),
          ...(this.activity?.entitySolids() || []),
        ],
      );
      this.activity?.update(dt, this.player, { forward: 0, right: 0 }, []);
      if (message) {
        this.notice(message);
        this.controls.clear();
        this.refreshModes();
        this.onEdit();
      }
      return;
    }
    const input = this.controls.movement(),
      solids = this.nearbySolids(),
      obstacles: any[] = [];
    this.walkAmount = Math.min(1, Math.hypot(input.forward, input.right));
    this.gait += dt * this.walkAmount * 6;
    this.contextTime += dt;
    if (this.contextTime > 0.2) {
      this.contextTime = 0;
      this.refreshModes();
      this.refreshLights();
    }
    if (this.playing) {
      if (Math.abs(input.forward) + Math.abs(input.right) > 0.2) this.endPlay();
      else {
        this.playing.elapsed += dt;
        Object.assign(
          this.player,
          playPose(this.playing.kind, this.playing.block, this.playing.elapsed),
        );
        this.animatePlay();
        if (this.playing.elapsed >= playDuration(this.playing.kind))
          this.endPlay();
      }
      this.activity?.update(
        dt,
        this.player,
        { forward: 0, right: 0 },
        obstacles,
      );
      return;
    }
    if (this.seated && Math.abs(input.forward) + Math.abs(input.right) > 0.2)
      this.stand();
    if (!this.activity?.controlled && !this.seated) {
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
    const water = (this.world.waterAreas || []).find(
      (w: any) =>
        Math.abs(this.player.x - w.x) < w.w / 2 &&
        Math.abs(this.player.z - w.z) < w.d / 2,
    );
    if (
      water &&
      !this.flying &&
      !this.activity?.controlled &&
      this.player.y < 0.25
    ) {
      Object.assign(
        this.player,
        safeGround(water.shore, [
          ...this.obstacles(),
          ...this.commands.blocks.flatMap(blockColliders),
        ]),
      );
      this.notice("💧 Back to the lakeside path");
    }
  }
  refreshLights() {
    const blocks = [
      ...this.builds.blocksNear(this.player, 12),
      ...(this.world.authoredProps || []).map((p: any) => p.block),
    ]
      .filter(
        (b: Block) =>
          ITEMS.get(b.type)?.interaction === "light" &&
          b.on !== false &&
          Math.hypot(b.x - this.player.x, b.z - this.player.z) < 12,
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - this.player.x, a.z - this.player.z) -
          Math.hypot(b.x - this.player.x, b.z - this.player.z),
      );
    this.lightPool.forEach((light, i) => {
      const b = blocks[i];
      light.intensity = b ? 2.5 : 0;
      if (b)
        light.position.set(b.x + 0.5, blockBounds(b).maxY - 0.1, b.z + 0.5);
    });
  }
  frame(now: number) {
    requestAnimationFrame((n) => this.frame(n));
    if (this.paused || document.hidden) {
      this.clock.reset(now);
      return;
    }
    this.clock.tick(now, (dt) => this.update(dt));
    this.updateCamera();
    this.world.staticRender.updateVisibility(this.view.camera, 155);
    this.view.renderer.render(this.view.scene, this.view.camera);
  }
  updateCamera() {
    this.body.group.scale.setScalar(
      this.activity?.driving
        ? this.activity.vehicleKind === "bicycle"
          ? 1
          : 0.72
        : this.activity?.riding
          ? 0.82
          : 1,
    );
    this.body.group.position.set(
      this.player.x,
      this.activity?.driving
        ? 0.22
        : this.seated
          ? this.seated.height - 0.65
          : this.player.y,
      this.player.z,
    );
    const sitting =
      this.seated ||
      this.playing ||
      this.activity?.controlled ||
      this.world.aircraft?.passenger;
    this.body.left.rotation.x = sitting
      ? -1.2
      : Math.sin(this.gait) * 0.25 * this.walkAmount;
    this.body.right.rotation.x = sitting
      ? -1.2
      : -Math.sin(this.gait) * 0.25 * this.walkAmount;
    this.body.arms.forEach(
      (arm, i) =>
        (arm.rotation.x = this.activity?.driving
          ? -1
          : sitting
            ? -0.1
            : Math.sin(this.gait + (i ? Math.PI : 0)) * 0.2 * this.walkAmount),
    );
    this.body.group.rotation.y = this.world.aircraft?.passenger
      ? this.world.aircraft.pose.yaw
      : this.player.yaw;
    this.body.group.visible = false;
    if (this.cameraMode === "third" && this.world.aircraft?.passenger) {
      const plane = this.world.aircraft.pose;
      this.body.group.visible = true;
      this.view.camera.position.set(
        plane.x + Math.sin(this.player.yaw) * 16,
        plane.y + 7,
        plane.z + Math.cos(this.player.yaw) * 16,
      );
      this.view.camera.lookAt(plane.x, plane.y + 1.5, plane.z);
      this.view.camera.updateMatrixWorld();
    } else if (this.cameraMode === "third") {
      this.body.group.visible = followCamera(this.view.camera, this.player, [
        ...this.index.query(around(this.player, 8)),
        ...(this.world.dynamicSolids?.() || []),
        ...this.world.doors.map((d: any) => doorBox(d)),
        ...this.builds.query(this.player, 8),
      ]);
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
        y:
          normal.y > 0.9
            ? Math.ceil(h.point.y * 100 - 1e-5) / 100
            : normal.y < -0.9
              ? Math.floor(h.point.y) - 1
              : target.y,
        z: Math.floor(p.z),
        type: this.selected,
      };
      if (!ITEMS.get(target.type)?.cube) {
        const axis = (["x", "y", "z"] as ("x" | "y" | "z")[]).sort(
          (a, b) => Math.abs(normal[b]) - Math.abs(normal[a]),
        )[0];
        if (axis !== "y") {
          aim = { ...target, type: this.selected };
          aim[axis] += Math.sign(normal[axis]);
        } else if (normal.y < 0) {
          aim.y = Math.floor(h.point.y) - 1;
        }
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
    if (this.playing) {
      this.notice("Tap Use to finish playing");
      return;
    }
    if (this.activity?.controlled || this.world.aircraft?.passenger) {
      this.notice("Walk before building");
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
    if (!ITEMS.get(this.selected)?.cube || this.repeatCount > 1) {
      this.pending = { ...h.aim, rotation: 0 };
      this.showPreview();
    } else this.notice(this.commands.place(h.aim) || "✓ Placed");
  }
  removeAt(x: number, y: number) {
    if (this.activity?.controlled || this.world.aircraft?.passenger) return;
    if (this.paused || this.playing) return;
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
    for (const b of this.planned(this.pending))
      this.preview.add(renderModel(b, true));
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
    if (this.activity?.controlled || this.world.aircraft?.passenger) {
      this.notice("Walk before building");
      return;
    }
    if (!this.pending) return;
    const reason =
      this.placementReason(this.pending) ||
      (this.moving
        ? this.commands.move(this.moving, this.pending)
        : this.commands.placeMany(this.planned(this.pending), false));
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
        safeStanding(this.seated.entry, [
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
  contextTarget(): Interaction | undefined {
    const targets: Interaction[] = [];
    const object = (block: Block, extra: any = {}) => {
      const interaction = ITEMS.get(block.type)?.interaction;
      if (!interaction) return;
      targets.push({
        id: extra.prop
          ? "prop:" + extra.prop.id
          : "build:" + `${block.x},${block.y},${block.z}`,
        kind: "object",
        x: block.x + 0.5,
        y: block.y,
        z: block.z + 0.5,
        range: 2.5,
        icon:
          interaction === "light"
            ? "💡"
            : interaction === "seat"
              ? "🪑"
              : PLAY.has(interaction)
                ? "🛝"
                : "🚪",
        label: ITEMS.get(block.type)!.label,
        data: { block, ...extra },
      });
    };
    for (const b of this.builds.blocksNear(this.player, 3))
      if (
        Math.abs(b.x - this.player.x) < 3 &&
        Math.abs(b.z - this.player.z) < 3
      )
        object(b, { built: true });
    for (const prop of this.world.authoredProps || [])
      object(prop.block, { prop });
    for (const b of this.world.activities || []) object(b, { static: true });
    for (const [i, s] of (this.world.seats || []).entries())
      targets.push({
        id: "seat:" + i,
        kind: "seat",
        x: s.x,
        y: s.y || 0,
        z: s.z,
        range: 2,
        icon: "🪑",
        label: "Sit",
        data: s,
      });
    for (const d of this.world.doors)
      targets.push({
        id: "door:" + d.id,
        kind: "door",
        x: d.center.x,
        y: 0,
        z: d.center.z,
        range: 3.2,
        icon: "🚪",
        label: "Door",
        data: d,
      });
    if (this.activity) {
      for (const [index, v] of this.activity.vehicles.entries())
        targets.push({
          id: "vehicle:" + index,
          kind: "vehicle",
          x: v.state.x,
          y: 0,
          z: v.state.z,
          range: 3,
          icon: v.icon,
          label: v.name,
          data: { index },
        });
      for (const [i, a] of this.activity.agents.entries())
        targets.push({
          id: "agent:" + i,
          kind: "agent",
          x: a.state.x,
          y: 0,
          z: a.state.z,
          range: 2.5,
          icon: a.species === "horse" ? "🐴" : a.animal ? "🐾" : "👋",
          label: a.species || "Neighbour",
          data: a,
        });
    }
    if (this.world.aircraft && !this.world.aircraft.passenger)
      targets.push(this.world.aircraft.target());
    return chooseInteraction(this.player, targets, (t) => {
      const origin = new T.Vector3(
          this.player.x,
          this.player.y + 1.3,
          this.player.z,
        ),
        end = new T.Vector3(t.x, t.y + 1.2, t.z),
        distance = origin.distanceTo(end),
        ray = new T.Ray(origin, end.sub(origin).normalize());
      const own = t.kind === "object" ? blockColliders(t.data.block) : [];
      const shapes = [
        ...(this.world.dynamicSolids?.() || []),
        ...this.index
          .query(around(this.player, 4))
          .filter(
            (s: any) =>
              s.owner !== t.id &&
              !own.some((b) =>
                ["minX", "maxX", "minY", "maxY", "minZ", "maxZ"].every(
                  (k) => Math.abs(b[k] - s[k]) < 1e-5,
                ),
              ),
          ),
        ...this.world.doors
          .filter((d: any) => t.id !== "door:" + d.id)
          .map((d: any) => doorBox(d)),
        ...this.commands.blocks
          .filter(
            (b) =>
              t.id !== "build:" + `${b.x},${b.y},${b.z}` &&
              Math.abs(b.x - this.player.x) < 4 &&
              Math.abs(b.z - this.player.z) < 4,
          )
          .flatMap(blockColliders),
        ...(this.activity?.vehicleSolids(
          t.kind === "vehicle" ? t.data.index : -1,
        ) || []),
      ];
      return !shapes.some((s) => rayBoxNear(ray, s) < distance - 0.2);
    });
  }
  private sit(seat: any) {
    this.seated = { entry: { ...this.player }, height: (seat.y || 0) + 0.4 };
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
  }
  private startPlay(kind: string, data: any) {
    const b = data.block as Block,
      entry = { ...this.player },
      own = blockColliders(b);
    const obstacles = [
      ...this.world.solids.filter(
        (s: any) =>
          s.owner !== "prop:" + data.prop?.id &&
          !own.some((box) =>
            ["minX", "maxX", "minY", "maxY", "minZ", "maxZ"].every(
              (k) => Math.abs(box[k] - s[k]) < 1e-5,
            ),
          ),
      ),
      ...this.world.doors.map((d: any) => doorBox(d)),
      ...this.commands.blocks
        .filter((x) => x.x !== b.x || x.y !== b.y || x.z !== b.z)
        .flatMap(blockColliders),
    ];
    for (let i = 0; i <= 24; i++)
      if (
        collides(playPose(kind, b, (playDuration(kind) * i) / 24), obstacles)
      ) {
        this.notice("Leave a little space around the play equipment");
        return;
      }
    let model: T.Group | null = null;
    if (!data.static) {
      model = renderModel(b);
      model.children.forEach(
        (o) => (o.userData.basePosition = o.position.clone()),
      );
      this.view.scene.add(model);
      if (data.built) this.chunks.update(b, false);
      if (data.prop) data.prop.model.visible = false;
    }
    this.playing = {
      kind,
      block: { ...b },
      entry,
      elapsed: 0,
      model,
      built: !!data.built,
      original: data.prop?.model,
    };
    this.flying = false;
    this.vertical = 0;
    this.controls.clear();
    Object.assign(this.player, playPose(kind, b, 0));
    this.refreshModes();
    this.notice("🛝 Playing · tap Use or move to finish");
    this.onEdit();
  }
  private animatePlay() {
    const p = this.playing;
    if (!p?.model) return;
    const wave = Math.sin(p.elapsed * 2);
    if (p.kind === "swing")
      p.model.children.slice(3).forEach((o) => {
        const base = o.userData.basePosition;
        o.position.z = base.z + wave * 0.4;
      });
    if (p.kind === "seesaw")
      p.model.children.slice(1).forEach((o) => {
        const base = o.userData.basePosition;
        o.position.y = base.y + base.x * wave * 0.17;
        o.rotation.z = wave * 0.17;
      });
    if (p.kind === "rock") p.model.rotation.x = wave * 0.08;
  }
  endPlay(exit = true) {
    const p = this.playing;
    if (!p) return true;
    if (exit)
      try {
        Object.assign(
          this.player,
          safeStanding(p.entry, [
            ...this.obstacles(),
            ...this.commands.blocks.flatMap(blockColliders),
          ]),
        );
      } catch (e) {
        this.notice(String(e));
        return false;
      }
    p.model?.traverse((o: any) => {
      if (o.isMesh) o.material.dispose();
    });
    p.model?.removeFromParent();
    if (p.built) this.chunks.update(p.block, true);
    if (p.original) p.original.visible = true;
    this.playing = null;
    this.controls?.clear();
    this.refreshModes();
    if (exit) this.onEdit();
    return true;
  }
  use() {
    if (this.world.aircraft?.passenger) {
      this.endFlight();
      return;
    }
    if (this.playing) {
      this.endPlay();
      return;
    }
    if (this.seated) {
      this.stand();
      return;
    }
    try {
      if (this.activity?.riding) {
        this.notice(
          this.activity.dismount(this.player, [
            ...this.querySolids(this.player, 15),
          ]) || "",
        );
        this.controls.clear();
        this.refreshModes();
        this.onEdit();
        return;
      }
      if (this.activity?.driving) {
        this.notice(
          this.activity.use(this.player, [
            ...this.obstacles(),
            ...this.commands.blocks.flatMap(blockColliders),
          ]) || "",
        );
        this.controls.clear();
        this.refreshModes();
        this.onEdit();
        return;
      }
      const target = this.contextTarget();
      if (!target) {
        this.notice("Walk closer to something to use");
        return;
      }
      if (target.kind === "object") {
        const { block, prop } = target.data,
          kind = ITEMS.get(block.type)!.interaction!;
        if (PLAY.has(kind)) {
          this.startPlay(kind, target.data);
          return;
        }
        if (kind === "seat") {
          this.sit({
            x: block.x + 0.5,
            y: block.y,
            z: block.z + 0.5,
            rotation: block.rotation,
          });
          return;
        }
        if (prop) {
          const commands = new Commands(
            () => [
              ...this.world.solids.filter(
                (s: any) => s.owner !== "prop:" + prop.id,
              ),
              ...this.world.doors.map((d: any) => doorBox(d)),
              ...this.commands.blocks.flatMap(blockColliders),
              ...(this.activity?.entitySolids() || []),
            ],
            () => this.player,
            () => {},
          );
          commands.reset([block]);
          const reason = commands.toggle(commands.blocks[0]);
          if (reason) {
            this.notice(reason);
            return;
          }
          prop.block = { ...commands.blocks[0] };
          refreshProp(prop);
          syncProps(this.world);
          this.index = new SpatialIndex();
          for (const s of this.world.solids) this.index.add(s);
          this.onEdit();
          this.notice("✓ Used");
        } else this.notice(this.commands.toggle(block) || "✓ Used");
      } else if (target.kind === "aircraft") {
        if (this.activity?.controlled) return;
        this.world.aircraft.board(this.player);
        this.flying = false;
        this.vertical = 0;
        this.cancel();
        this.controls.clear();
        this.refreshModes();
        this.notice("✈ Scenic flight · Use to return safely");
        this.onEdit();
      } else if (target.kind === "seat") this.sit(target.data);
      else if (target.kind === "agent") {
        const a = target.data;
        if (a.species === "horse") {
          this.notice(
            this.activity!.mount(a, this.player, this.querySolids(a.state, 4)),
          );
          if (this.activity!.riding) {
            this.flying = false;
            this.vertical = 0;
            this.cancel();
          }
          this.controls.clear();
          this.refreshModes();
          this.onEdit();
          return;
        }
        if (a.species === "dog") {
          openPetMenu(this);
          return;
        }
        a.greetUntil = this.activity!.time + 2;
        a.model.rotation.y = Math.atan2(
          this.player.x - a.state.x,
          this.player.z - a.state.z,
        );
        this.notice(
          a.animal ? `♡ Hello, ${a.species}!` : "👋 Hello, neighbour!",
        );
      } else if (target.kind === "vehicle") {
        this.notice(
          this.activity!.use(
            this.player,
            [
              ...this.obstacles(),
              ...this.commands.blocks.flatMap(blockColliders),
            ],
            target.data.index,
          ) || "",
        );
        this.flying = false;
        this.vertical = 0;
        this.controls.clear();
        this.refreshModes();
        this.onEdit();
      } else {
        const d = target.data,
          r = requestDoor(
            d,
            !d.targetOpen,
            this.player,
            [],
            [
              ...this.world.solids,
              ...this.commands.blocks
                .flatMap(blockColliders)
                .map((s) => (s.ramp ? { ...s, ramp: null } : s)),
              ...(this.activity?.entitySolids() || []),
            ],
            true,
          );
        this.notice(r.ok ? "🚪 Door" : r.message || "Clear the doorway");
        this.onEdit();
      }
    } catch (e) {
      this.notice(String(e));
    }
  }
  endFlight() {
    if (!this.world.aircraft?.passenger) return true;
    try {
      this.world.aircraft.returnToPark(this.player, [
        ...this.obstacles(),
        ...this.commands.blocks.flatMap(blockColliders),
      ]);
      this.controls.clear();
      this.refreshModes();
      this.notice("✈ Back at the airfield");
      this.onEdit();
      return true;
    } catch (e) {
      this.notice(String(e));
      return false;
    }
  }
  home() {
    if (!this.endFlight()) return;
    this.endPlay(false);
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
    if (this.activity) this.activity.stop();
    this.vertical = 0;
    this.refreshModes();
    this.controls?.clear();
    this.cancel();
  }
  jump() {
    if (this.world.aircraft?.passenger) {
      this.endFlight();
      return;
    }
    if (this.playing) {
      this.endPlay();
      return;
    }
    if (this.seated) {
      this.stand();
      return;
    }
    if (
      !this.paused &&
      !this.flying &&
      !this.activity?.controlled &&
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
    if (c === "KeyZ") this.endPlay() && this.commands.undo();
    if (c === "KeyY") this.endPlay() && this.commands.redo();
    if (c === "Escape") this.cancel();
  }
  ui() {
    const on = (id: string, fn: () => void) =>
      (document.querySelector<HTMLButtonElement>("#" + id)!.onclick = fn);
    on("cameraMode", () => {
      this.cameraMode = this.cameraMode === "first" ? "third" : "first";
      this.updateCamera();
      this.refreshModes();
      this.onEdit();
    });
    on("flyMode", () => {
      if (this.world.aircraft?.passenger) {
        this.notice("Land before flying");
        return;
      }
      if (this.playing && !this.endPlay()) return;
      if (this.seated && !this.stand()) return;
      if (this.activity?.controlled) {
        this.notice("Walk before flying");
        return;
      }
      this.controls.clear();
      this.vertical = 0;
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
    on("avatarButton", () => openWardrobe(this));
    on("controlsButton", () => openControlMenu(this));
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
    on("undo", () => this.endPlay() && this.commands.undo());
    on("redo", () => this.endPlay() && this.commands.redo());
    on("cancel", () => this.cancel());
    on("rotate", () => {
      if (this.pending) {
        this.pending.rotation = ((this.pending.rotation || 0) + 90) % 360;
        this.showPreview();
      }
    });
    for (const [id, sign] of [
      ["raise", 1],
      ["lower", -1],
    ] as const)
      on(id, () => {
        if (this.pending) {
          this.pending.y = Math.max(
            0,
            Math.min(
              23.75,
              Math.round((this.pending.y + sign * 0.25) * 100) / 100,
            ),
          );
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
  setAppearance(id: string) {
    if (!APPEARANCES.some((a) => a.id === id)) id = "explorer";
    disposeAvatar(this.body);
    this.appearance = id;
    this.body = createAvatar(id);
    this.view.scene.add(this.body.group);
    this.updateCamera();
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
  planned(b: Block): Block[] {
    if (this.moving) return [b];
    const expanded = expandPrefab(b);
    if (expanded.length > 1 || !ITEMS.get(b.type)?.cube) return expanded;
    const angle = ((b.rotation || 0) * Math.PI) / 180;
    return Array.from({ length: this.repeatCount }, (_, i) => ({
      ...b,
      x: b.x + i * Math.round(Math.cos(angle)),
      z: b.z - i * Math.round(Math.sin(angle)),
    }));
  }
  placementReason(b: Block) {
    if (this.moving) return this.commands.reason(b, true, this.moving);
    if (!PREFABS.some((p) => p.id === b.type) && this.repeatCount === 1)
      return this.commands.reason(b);
    if (
      Math.hypot(
        b.x + 0.5 - this.player.x,
        b.y - this.player.y,
        b.z + 0.5 - this.player.z,
      ) > 6
    )
      return "Move a little closer";
    const temporary = new Commands(
      () => this.obstacles(),
      () => this.player,
      () => {},
    );
    temporary.reset(this.commands.blocks);
    return temporary.placeMany(this.planned(b), false);
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
    document.querySelector("#use")!.textContent = this.world.aircraft?.passenger
      ? "🛬"
      : this.playing
        ? "🚶"
        : this.seated
          ? "🪑"
          : this.activity?.controlled
            ? "🚶"
            : this.contextTarget()?.icon || "✋";
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
    const savedPlayer = this.world.aircraft?.passenger
      ? this.world.aircraft.entry
      : this.playing?.entry ||
        this.seated?.entry ||
        this.activity?.savedPlayer(this.player) ||
        this.player;
    return {
      avatar: this.appearance,
      lookSpeed: this.lookSpeed,
      leftHanded: this.leftHanded,
      favourites: this.favourites,
      recent: this.recent,
      hotbar: this.hotbar,
      camera: this.cameraMode,
      flying: this.flying,
      activity: this.activity?.snapshot(),
      template: this.template,
      player: { ...savedPlayer },
      props: propSnapshot(this.world),
      layout: this.world.layout || 1,
      blocks: this.commands.blocks.map((b) => ({ ...b })),
      doors: Object.fromEntries(
        this.world.doors.map((d: any) => [d.id, d.targetOpen]),
      ),
      selected: this.selected,
    };
  }
}
