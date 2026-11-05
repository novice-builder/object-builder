import * as T from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AssetLibrary, DEFINITIONS } from "./assets";
import {
  Landscape,
  WORLDS,
  blocked,
  waterBlocked,
  walkHeight,
  type Placement,
  type SceneId,
  type Landmark,
  type Obstacle,
} from "./landscape";
import { footprintGroundProblem } from "./placement-ground";
import { AdventureMap } from "./world-map";
import { createMapData, type MapDestination } from "./map-data";
import { clearArrival } from "./safe-position";
import { ConnectedLandscape } from "./connected-landscape";
import { inWorld } from "./vale-data";
import { AdventureControls } from "./controls";
import {
  AdventureSession,
  makeSnapshot,
  validateAdventure,
  type AdventureData,
} from "./save";
import type { Snapshot } from "../persistence/schema";
import {
  BUILD_CHOICES,
  buildLabel,
  renderCatalogueThumbnail,
} from "./catalogue";
import { readPreferences, writePreferences, type Quality } from "./preferences";
import { CollisionCache, type OwnedObstacle } from "./collision-cache";
import { cameraFraction } from "./camera-collision";
import "./style.css";
import { installUUIDFallback } from "./ids";
installUUIDFallback();
const $ = <E extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as E;
const app = $("app");
app.innerHTML = `
<canvas id="view" aria-label="BlockWorld Adventures. Drag to orbit the camera. Use WASD or the touch joystick to walk." tabindex="0"></canvas>
<header id="hud"><div class="identity"><span class="brandmark">◇</span><div class="wordmark">BLOCKWORLD<span>ADVENTURES</span></div><span class="identity-divider"></span><div class="location"><strong id="placeName">Willowmere</strong><span id="placeTag">THE VILLAGE</span></div></div><nav><button id="places" title="Choose a place">⌂ <span>Places</span></button><button id="build" title="Build with premade assets">◇ <span>Build</span></button><button id="menu" aria-label="Open menu">☰</button></nav></header>
<div id="discoveryCount" class="smallPill">♧ <span>Little discoveries</span> <b id="discovered">0 / 5</b></div><div id="compass" aria-label="Camera direction">N <i>↑</i></div><button id="minimap" aria-label="Open world map" title="World map (M)"><canvas id="miniCanvas" aria-hidden="true"></canvas></button>
<div id="mapOverlay" hidden role="dialog" aria-modal="true" aria-labelledby="mapTitle"><header class="mapHeader"><div><small>THE LONG WAY HOME</small><h1 id="mapTitle">The Willow Vale</h1></div><button id="mapClose" aria-label="Close map">✕</button></header><canvas id="fullMap" tabindex="0" aria-label="World map. Drag to pan, pinch or use plus and minus to zoom. Tap a named place to travel. Keyboard arrows pan."></canvas><div class="mapTools"><button id="mapHome">⌂ Home</button><button id="mapFit" aria-label="Show whole world">⊡</button><button id="mapMinus" aria-label="Zoom map out">−</button><button id="mapPlus" aria-label="Zoom map in">+</button><select id="mapDestination" aria-label="Travel to a landmark"><option value="">Travel to…</option></select></div><p class="mapHint">Drag to explore · pinch to zoom · tap a place to travel</p></div>
<div id="joystick" role="group" aria-label="Touch movement joystick"><div id="knob"></div></div><button id="run" class="roundControl" aria-label="Toggle running" aria-pressed="false">➟<span>Run</span></button>
<div id="context" hidden><span id="contextLabel"></span><button id="interact">Discover <kbd>E</kbd></button></div>
<div id="bottomHint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk</span><span>drag to look</span><span><kbd>Shift</kbd> run</span></div><div id="touchHint">Left thumb to walk · drag the world to look</div>
<output id="toast" role="status" aria-live="polite" hidden></output><output id="saveState" aria-live="polite">Preparing your world…</output><div id="stats" hidden></div>
<div id="editBar" hidden><span id="editName">Place object</span><button id="editRotate">↻ <span>Rotate</span></button><button id="editMove">✥ <span>Move</span></button><button id="editRemove">× <span>Remove</span></button><button id="editConfirm" class="primary">✓ <span>Place</span></button><button id="editCancel" aria-label="Cancel editing">✕</button></div>
<div id="modal" hidden role="dialog" aria-modal="true" aria-labelledby="modalTitle"></div>
<div id="welcome"><section><div class="eyebrow">A BLOCKWORLD ADVENTURE</div><h1>A little world.<br>A little wonder.</h1><p>Follow a cobbled lane. Find a quiet corner.<br>Make a place of your own.</p><button id="enter" class="primary" disabled>Preparing the valley… <span>→</span></button><div class="loadingTrack"><i id="loadingBar"></i></div><small id="loadingText">Unpacking the village</small><div class="welcomeFoot">FREE TO EXPLORE <span>•</span> SAVED ON YOUR DEVICE</div></section><div class="previewBadge">WILLOW VALE · DEVELOPMENT PREVIEW 03</div></div>
<div id="fatal" hidden role="alert"></div>`;
class AdventureGame {
  library = new AssetLibrary();
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(48, innerWidth / innerHeight, 0.12, 220);
  renderer: T.WebGLRenderer;
  landscape!: Landscape | ConnectedLandscape;
  controls: AdventureControls;
  worldMap: AdventureMap;
  session: AdventureSession;
  data: AdventureData = {
    version: 1,
    scene: "village",
    objects: [],
    discoveries: [],
  };
  player = { x: 0, y: 0, z: 18, yaw: 0, pitch: 0.47 };
  cameraYaw = 0;
  cameraPitch = 0.47;
  distance = 12;
  velocity = new T.Vector2();
  actor!: T.Object3D;
  mixer!: T.AnimationMixer;
  actions = new Map<string, T.AnimationAction>();
  currentAnimation = "";
  actorYaw = 0;
  private last = performance.now();
  private started = false;
  private busy = true;
  private modalOpen = false;
  private toastTimer = 0;
  private fpsSamples: number[] = [];
  private statsTime = 0;
  private frames = 0;
  private fps = 0;
  private quality: Quality = "balanced";
  private preferenceStorage: Storage | null = null;
  private selectionOutline = new T.Box3Helper(new T.Box3(), 0xffd28b);
  private collisionCache = new CollisionCache();
  private userGroup = new T.Group();
  private userRoots = new Map<string, T.Object3D>();
  private selection: string | null = null;
  private ghost: T.Object3D | null = null;
  private pending: Placement | null = null;
  private moving: string | null = null;
  private ghostValidation = "";
  private originalMaterials = new Map<T.Mesh, T.Material | T.Material[]>();
  private history: Placement[][] = [];
  private redoHistory: Placement[][] = [];
  private near: Landmark | null = null;
  private contextFrame = 0;
  private debugCamera = false;
  private sun: T.DirectionalLight;
  private contactShadow: T.Mesh;
  private cameraPosition = new T.Vector3();
  private dirty = false;
  constructor() {
    this.renderer = new T.WebGLRenderer({
      canvas: $<HTMLCanvasElement>("view"),
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.scene.background = new T.Color(0xc6d9d4);
    this.scene.fog = new T.Fog(0xc6d9d4, 70, 150);
    this.scene.add(new T.HemisphereLight(0xe5f0ec, 0x7d8065, 1.2));
    this.sun = new T.DirectionalLight(0xffedce, 2.5);
    this.sun.position.set(-30, 55, 30);
    this.sun.castShadow = true;
    this.sun.shadow.autoUpdate = false;
    this.sun.shadow.needsUpdate = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, {
      left: -45,
      right: 45,
      top: 45,
      bottom: -45,
      near: 1,
      far: 150,
    });
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.035;
    this.scene.add(this.sun, this.sun.target, this.userGroup);
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 64;
    const sc = shadowCanvas.getContext("2d")!,
      gradient = sc.createRadialGradient(32, 32, 2, 32, 32, 32);
    gradient.addColorStop(0, "#0009");
    gradient.addColorStop(1, "#0000");
    sc.fillStyle = gradient;
    sc.fillRect(0, 0, 64, 64);
    this.contactShadow = new T.Mesh(
      new T.PlaneGeometry(1.5, 1.15),
      new T.MeshBasicMaterial({
        map: new T.CanvasTexture(shadowCanvas),
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      }),
    );
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.contactShadow);
    this.session = new AdventureSession(
      () => this.snapshot(),
      (s) => this.apply(s),
      (t, e) => this.saveStatus(t, e),
      (busy) => {
        this.busy = busy;
        this.controls?.clear();
        $("modal").inert = busy;
        $("hud").inert = busy;
      },
    );
    this.controls = new AdventureControls(
      $("view"),
      () => this.enabled(),
      (dx, dy) => {
        this.debugCamera = false;
        this.cameraYaw -= dx * 0.004;
        this.cameraPitch = T.MathUtils.clamp(
          this.cameraPitch + dy * 0.003,
          0.18,
          1.1,
        );
        this.dirty = true;
      },
      (d) => {
        this.distance = T.MathUtils.clamp(this.distance + d, 5, 22);
      },
      (x, y) => this.tap(x, y),
      (code) => this.key(code),
    );
    this.worldMap = new AdventureMap(
      $<HTMLCanvasElement>("miniCanvas"),
      $<HTMLCanvasElement>("fullMap"),
      (d) => this.travelTo(d),
    );
    this.selectionOutline.visible = false;
    this.selectionOutline.renderOrder = 20;
    const selectionMaterial = this.selectionOutline
      .material as T.LineBasicMaterial;
    selectionMaterial.depthTest = false;
    selectionMaterial.transparent = true;
    selectionMaterial.opacity = 0.95;
    this.scene.add(this.selectionOutline);
    try {
      this.preferenceStorage = localStorage;
    } catch {}
    const preferences = readPreferences(this.preferenceStorage);
    this.controls.running = preferences.running;
    $("run").setAttribute("aria-pressed", String(preferences.running));
    this.setQuality(preferences.quality);
    this.bind();
    document.addEventListener("keydown", (e) => {
      if (e.code !== "Tab" || !this.modalOpen) return;
      const items = [
        ...$(
          this.worldMap.open ? "mapOverlay" : "modal",
        ).querySelectorAll<HTMLElement>(
          "button,input,select,textarea,summary,a,canvas[tabindex]",
        ),
      ].filter((n) => !n.hasAttribute("disabled") && n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    addEventListener("resize", () => this.resize());
    $("view").addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.busy = true;
      void this.session.save().catch(() => {});
      this.fail(
        "Graphics were interrupted. Reopen this preview to continue from your last saved checkpoint.",
      );
    });
    void this.init().catch((e) => this.fail(String(e)));
  }
  async init() {
    await this.library.load((d, t) => {
      $("loadingBar").style.width = `${(d / t) * 100}%`;
      $("loadingText").textContent = `Preparing models · ${d} / ${t}`;
    });
    this.actor = cloneSkeleton(this.library.character.scene);
    this.actor.scale.setScalar(0.8);
    this.actor.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.castShadow = false;
        o.receiveShadow = true;
      }
    });
    this.scene.add(this.actor);
    this.mixer = new T.AnimationMixer(this.actor);
    for (const clip of this.library.character.animations)
      this.actions.set(clip.name, this.mixer.clipAction(clip));
    this.animate("Idle");
    this.actorYaw = Math.PI;
    this.actor.rotation.y = Math.PI;
    await this.session.init();
    this.busy = false;
    $<HTMLButtonElement>("enter").disabled = false;
    $("enter").innerHTML =
      `Enter ${WORLDS.find((w) => w.id === this.data.scene)!.name} <span>→</span>`;
    $("loadingText").textContent = "Your next small adventure is ready";
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
    setInterval(() => {
      if (this.started && !this.busy && this.dirty) {
        this.dirty = false;
        void this.session.save().catch(() => {});
      }
    }, 2500);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.started)
        void this.session.save().catch(() => {});
    });
    addEventListener("blur", () => {
      if (this.started) void this.session.save().catch(() => {});
    });
    if (new URLSearchParams(location.search).get("test") === "1")
      Object.assign(window, {
        adventure: {
          game: this,
          session: this.session,
          ready: true,
          stats: () => this.stats(),
          thumbnail: (id: string) =>
            renderCatalogueThumbnail(this.renderer, this.library, id),
          snapshot: () => this.snapshot(),
          view: (name: string) => this.qaView(name),
        },
      });
  }
  private fail(message: string) {
    $("fatal").hidden = false;
    $("fatal").innerHTML =
      "<h2>The adventure could not continue</h2><p></p><button>Reload preview</button>";
    $("fatal").querySelector("p")!.textContent = message;
    $("fatal").querySelector("button")!.onclick = () => location.reload();
    $("welcome").hidden = true;
    console.error(message);
  }
  enabled() {
    return this.started && !this.busy && !this.modalOpen && !document.hidden;
  }
  snapshot() {
    return makeSnapshot(this.data, {
      x: this.player.x,
      z: this.player.z,
      yaw: this.cameraYaw,
      pitch: this.cameraPitch,
    });
  }
  apply(snapshot: Snapshot) {
    const data = validateAdventure(snapshot),
      candidate =
        data.scene === "vale"
          ? new ConnectedLandscape(this.library)
          : new Landscape(this.library, data.scene, data.layout);
    // Prepare a complete replacement before retiring the old scene.
    const previous = this.landscape;
    this.landscape = candidate;
    this.data = data;
    this.scene.add(candidate.group);
    previous?.dispose();
    this.player.x = snapshot.player.x;
    this.player.z = snapshot.player.z;
    this.cameraYaw = snapshot.player.yaw;
    this.cameraPitch = T.MathUtils.clamp(snapshot.player.pitch, 0.18, 1.1);
    this.velocity.set(0, 0);
    this.cancelEdit();
    this.history = [];
    this.redoHistory = [];
    this.renderObjects();
    this.safeSpawn();
    this.player.y = walkHeight(this.player.x, this.player.z, this.data.scene);
    this.actor.position.set(this.player.x, this.player.y, this.player.z);
    this.contactShadow.position.set(
      this.player.x,
      this.player.y + 0.025,
      this.player.z,
    );
    this.cameraPosition.set(0, 0, 0);
    this.debugCamera = false;
    const world = WORLDS.find((w) => w.id === data.scene)!;
    $("placeName").textContent = world.name;
    $("placeTag").textContent = world.tag;
    this.countDiscoveries();
    this.dirty = false;
    this.sun.shadow.needsUpdate = true;
  }
  private safeSpawn() {
    const safe = (x: number, z: number) =>
      !blocked(x, z, this.obstacles()) &&
      !waterBlocked(x, z, this.data.scene) &&
      inWorld(x, z, this.data.scene);
    if (safe(this.player.x, this.player.z)) return;
    const origin = { x: this.player.x, z: this.player.z };
    const home = WORLDS.find((w) => w.id === this.data.scene)!.spawn;
    const clear = clearArrival(origin, safe) || clearArrival(home, safe, 32);
    if (clear) {
      Object.assign(this.player, clear);
      this.toast("Moved to the nearest clear ground");
    }
  }
  private travelTo(destination: MapDestination) {
    if (this.busy) return;
    this.cancelEdit();
    const safe = (x: number, z: number) =>
      inWorld(x, z, this.data.scene, 1) &&
      !waterBlocked(x, z, this.data.scene) &&
      !blocked(x, z, this.obstacles(), 0.42);
    const arrival = clearArrival(destination, safe, 14);
    if (!arrival) {
      this.toast(
        "That place is blocked. Clear a little space before travelling there.",
      );
      return;
    }
    Object.assign(this.player, arrival);
    this.player.y = walkHeight(arrival.x, arrival.z, this.data.scene);
    this.velocity.set(0, 0);
    this.actor.position.set(this.player.x, this.player.y, this.player.z);
    this.controls.clear();
    this.animate("Idle");
    this.cameraPosition.set(0, 0, 0);
    this.debugCamera = false;
    this.dirty = true;
    this.closeWorldMap();
    this.cameraUpdate(1 / 60);
    this.toast("Arrived at " + destination.name);
  }
  private refreshMap() {
    if (!this.worldMap || !this.landscape) return;
    const data = createMapData(this.data.scene, this.landscape);
    for (const p of this.data.objects) {
      const root = this.userRoots.get(p.id);
      if (root && p.asset.startsWith("building_")) {
        const body = this.objectBox(root, p.asset);
        if (body)
          (data.buildings as Obstacle[]).push({ ...body, name: p.asset });
      }
    }
    this.worldMap.setWorld(data);
  }
  private openWorldMap() {
    if (this.busy || !this.started) return;
    this.closeModal();
    this.cancelEdit();
    this.modalOpen = true;
    this.controls.clear();
    $("mapOverlay").hidden = false;
    $("mapTitle").textContent = WORLDS.find(
      (w) => w.id === this.data.scene,
    )!.name;
    const select = $<HTMLSelectElement>("mapDestination");
    select.innerHTML = '<option value="">Travel to…</option>';
    for (const d of this.worldMap.data?.destinations || []) {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      select.append(o);
    }
    this.worldMap.show();
  }
  private closeWorldMap() {
    $("mapOverlay").hidden = true;
    this.worldMap.hide();
    this.modalOpen = false;
    this.controls.clear();
    $("view").focus();
  }
  private objectBox(root: T.Object3D, id: string): Obstacle | null {
    if (
      id.startsWith("flower") ||
      id.startsWith("grass") ||
      id === "lily-small"
    )
      return null;
    root.updateMatrixWorld(true);
    const b = new T.Box3().setFromObject(root);
    if (id.startsWith("tree")) {
      const p = root.position;
      return {
        minX: p.x - 0.22,
        maxX: p.x + 0.22,
        minZ: p.z - 0.22,
        maxZ: p.z + 0.22,
        height: b.max.y,
      };
    }
    return {
      minX: b.min.x + 0.08,
      maxX: b.max.x - 0.08,
      minZ: b.min.z + 0.08,
      maxZ: b.max.z - 0.08,
      height: b.max.y,
    };
  }
  private rebuildObstacles() {
    this.ghostValidation = "";
    const built: OwnedObstacle[] = [];
    for (const p of this.data.objects) {
      const root = this.userRoots.get(p.id);
      if (root) {
        const body = this.objectBox(root, p.asset);
        if (body) built.push({ ...body, ownerId: p.id });
      }
    }
    this.collisionCache.replace(this.landscape?.obstacles || [], built);
  }
  obstacles() {
    return this.collisionCache.view(this.moving);
  }
  private renderObjects() {
    for (const root of this.userRoots.values()) root.removeFromParent();
    this.userRoots.clear();
    for (const p of this.data.objects) {
      const root = this.library.create(p.asset, p.scale);
      root.position.set(p.x, walkHeight(p.x, p.z, this.data.scene), p.z);
      root.rotation.y = p.yaw;
      root.userData.placementId = p.id;
      this.userGroup.add(root);
      this.userRoots.set(p.id, root);
    }
    this.rebuildObstacles();
    this.sun.shadow.needsUpdate = true;
    this.refreshSelection();
    this.refreshMap();
  }
  private animate(name: string) {
    if (this.currentAnimation === name) return;
    const action = this.actions.get(name);
    if (!action) return;
    this.actions.get(this.currentAnimation)?.fadeOut(0.24);
    action.reset().fadeIn(0.24).play();
    this.currentAnimation = name;
  }
  update(dt: number, input = this.controls.movement()) {
    if (!this.enabled() || this.debugCamera) {
      this.mixer?.update(dt);
      return;
    }
    const len = Math.hypot(input.x, input.z),
      speed = input.run ? 6 : 3.05,
      n = Math.max(1, len),
      sin = Math.sin(this.cameraYaw),
      cos = Math.cos(this.cameraYaw);
    const targetX = ((input.x / n) * cos + (input.z / n) * sin) * speed,
      targetZ = ((-input.x / n) * sin + (input.z / n) * cos) * speed;
    this.velocity.lerp(new T.Vector2(targetX, targetZ), 1 - Math.exp(-dt * 11));
    if (this.velocity.length() < 0.025) this.velocity.set(0, 0);
    const previousX = this.player.x,
      previousZ = this.player.z;
    const obs = this.obstacles(),
      steps = Math.ceil(dt / (1 / 60)),
      step = dt / steps;
    for (let i = 0; i < steps; i++) {
      const dx = this.velocity.x * step,
        dz = this.velocity.y * step;
      const valid = (x: number, z: number) =>
        inWorld(x, z, this.data.scene) &&
        !waterBlocked(x, z, this.data.scene) &&
        !blocked(x, z, obs) &&
        Math.abs(walkHeight(x, z, this.data.scene) - this.player.y) < 0.5;
      if (valid(this.player.x + dx, this.player.z)) this.player.x += dx;
      if (valid(this.player.x, this.player.z + dz)) this.player.z += dz;
      this.player.y = walkHeight(this.player.x, this.player.z, this.data.scene);
    }
    this.actor.position.set(this.player.x, this.player.y, this.player.z);
    this.contactShadow.position.set(
      this.player.x,
      this.player.y + 0.025,
      this.player.z,
    );
    const travelledSpeed =
      Math.hypot(this.player.x - previousX, this.player.z - previousZ) /
      Math.max(dt, 0.00001);
    const moving = travelledSpeed > 0.12;
    if (moving) {
      const target = Math.atan2(this.velocity.x, this.velocity.y),
        delta = Math.atan2(
          Math.sin(target - this.actorYaw),
          Math.cos(target - this.actorYaw),
        );
      this.actorYaw += delta * (1 - Math.exp(-dt * 13));
      this.actor.rotation.y = this.actorYaw;
      this.dirty = true;
    }
    this.animate(moving ? (input.run ? "Running_A" : "Walking_A") : "Idle");
    this.actions
      .get("Walking_A")
      ?.setEffectiveTimeScale(Math.max(0.7, travelledSpeed / 3.05));
    this.mixer.update(dt);
    if (this.pending && (!this.selection || this.moving)) this.updateGhost();
  }
  private cameraUpdate(dt: number) {
    if (this.debugCamera) return;
    const target = new T.Vector3(
        this.player.x,
        this.player.y + 1.35,
        this.player.z,
      ),
      offset = new T.Vector3(
        Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
        Math.sin(this.cameraPitch),
        Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch),
      ).multiplyScalar(this.distance),
      desired = target.clone().add(offset);
    const bodies = this.obstacles();
    const fraction = cameraFraction(target, offset, bodies);
    desired.copy(target).addScaledVector(offset, fraction);
    desired.y = Math.max(
      desired.y,
      walkHeight(desired.x, desired.z, this.data.scene) + 0.45,
    );
    if (this.cameraPosition.lengthSq() === 0) this.cameraPosition.copy(desired);
    else
      this.cameraPosition.lerp(
        desired,
        1 - Math.exp(-dt * (fraction < 1 ? 30 : 7)),
      );
    // Recheck the interpolated position: two clear endpoints can cut through a corner.
    const interpolated = this.cameraPosition.clone().sub(target),
      actualFraction = cameraFraction(target, interpolated, bodies);
    if (actualFraction < 1)
      this.cameraPosition
        .copy(target)
        .addScaledVector(interpolated, actualFraction);
    this.camera.position.copy(this.cameraPosition);
    this.camera.lookAt(target);
    this.actor.visible = this.camera.position.distanceTo(target) > 1.1;
    const focus = this.sun.target.position,
      nx = Math.round(this.player.x / 16) * 16,
      nz = Math.round(this.player.z / 16) * 16;
    if (focus.x !== nx || focus.z !== nz) {
      focus.set(nx, 0, nz);
      this.sun.shadow.needsUpdate = true;
    }
    this.sun.position.copy(focus).add(new T.Vector3(-30, 55, 30));
    $("compass").style.transform = `rotate(${-this.cameraYaw}rad)`;
  }
  private renderScene() {
    if (this.landscape instanceof ConnectedLandscape)
      this.landscape.updateVisibility(
        this.camera.position,
        (this.scene.fog as T.Fog).far,
      );
    this.renderer.render(this.scene, this.camera);
  }
  private frame(time: number) {
    const elapsed = (time - this.last) / 1000,
      dt = Math.min(0.05, elapsed);
    this.last = time;
    if (!document.hidden) {
      if (!this.worldMap.open) {
        this.update(dt);
        this.cameraUpdate(dt);
        this.renderScene();
      }
      this.worldMap.update(
        { x: this.player.x, z: this.player.z, yaw: this.actorYaw },
        time,
      );
      this.fpsSamples.push(elapsed * 1000);
      if (this.fpsSamples.length > 240) this.fpsSamples.shift();
      this.frames++;
      if (time - this.statsTime > 1000) {
        this.fps = Math.round((this.frames * 1000) / (time - this.statsTime));
        this.frames = 0;
        this.statsTime = time;
        if (!$("stats").hidden)
          $("stats").textContent = JSON.stringify(this.stats(), null, 2);
      }
      if (time - this.contextFrame > 120) {
        this.contextFrame = time;
        this.updateContext();
      }
    }
    requestAnimationFrame((t) => this.frame(t));
  }
  private updateContext() {
    if (!this.enabled() || this.pending) {
      $("context").hidden = true;
      return;
    }
    this.near =
      this.landscape.landmarks
        .filter(
          (l) => Math.hypot(l.x - this.player.x, l.z - this.player.z) < 4.5,
        )
        .sort(
          (a, b) =>
            Math.hypot(a.x - this.player.x, a.z - this.player.z) -
            Math.hypot(b.x - this.player.x, b.z - this.player.z),
        )[0] || null;
    $("context").hidden = !this.near;
    if (this.near) {
      $("contextLabel").textContent = this.near.name;
      $("interact").innerHTML =
        `${this.data.discoveries.includes(this.near.id) ? "Read" : "Discover"} <kbd>E</kbd>`;
    }
  }
  private discover() {
    if (!this.near) return;
    const l = this.near;
    if (!this.data.discoveries.includes(l.id)) {
      this.data.discoveries.push(l.id);
      this.dirty = true;
      this.countDiscoveries();
    }
    this.openModal(
      `<div class="eyebrow">A LITTLE DISCOVERY</div><h1 id="modalTitle">${l.name}</h1><p>${l.description}</p><button id="backToWorld" class="primary">Keep exploring →</button>`,
    );
    $("backToWorld").onclick = () => this.closeModal();
    this.animate("Interact");
  }
  private countDiscoveries() {
    $("discovered").textContent =
      `${this.data.discoveries.length} / ${this.landscape.landmarks.length}`;
  }
  private saveStatus(text: string, error = false) {
    $("saveState").textContent = (error ? "! " : "◦ ") + text;
    $("saveState").classList.toggle("saveError", error);
    if (error) {
      $("saveState").onclick = () => this.menu();
    } else $("saveState").onclick = null;
  }
  toast(text: string) {
    clearTimeout(this.toastTimer);
    $("toast").textContent = text;
    $("toast").hidden = false;
    this.toastTimer = window.setTimeout(() => ($("toast").hidden = true), 3500);
  }
  private resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.worldMap.resize();
  }
  private bind() {
    $("minimap").onclick = () => this.openWorldMap();
    $("mapClose").onclick = () => this.closeWorldMap();
    $("mapPlus").onclick = () => this.worldMap.zoom(1.35);
    $("mapMinus").onclick = () => this.worldMap.zoom(1 / 1.35);
    $("mapFit").onclick = () => this.worldMap.fit();
    $("mapHome").onclick = () => {
      const world = WORLDS.find((w) => w.id === this.data.scene)!;
      this.travelTo({ id: "home", name: world.name, ...world.spawn });
    };
    $<HTMLSelectElement>("mapDestination").onchange = (e) => {
      const d = this.worldMap.data?.destinations.find(
        (d) => d.id === (e.target as HTMLSelectElement).value,
      );
      if (d) this.travelTo(d);
    };
    $("enter").onclick = () => {
      this.started = true;
      document.body.classList.add("playing");
      $("welcome").hidden = true;
      $("view").focus();
      this.toast("The world is yours to wander. Follow the old road.");
    };
    $("places").onclick = () => void this.places();
    $("menu").onclick = () => this.menu();
    $("build").onclick = () => this.catalogue();
    $("interact").onclick = () => this.discover();
    $("run").onclick = () => {
      this.controls.running = !this.controls.running;
      $("run").setAttribute("aria-pressed", String(this.controls.running));
      this.storePreferences();
    };
    $("editCancel").onclick = () => this.cancelEdit();
    $("editRotate").onclick = () => {
      if (this.pending) {
        this.pending.yaw += Math.PI / 4;
        this.ghost!.rotation.y = this.pending.yaw;
        this.validateGhost();
      } else if (this.selection) {
        const p = this.data.objects.find((p) => p.id === this.selection)!,
          root = this.userRoots.get(p.id)!;
        const next = p.yaw + Math.PI / 4;
        root.rotation.y = next;
        root.updateMatrixWorld(true);
        this.moving = p.id;
        const error = this.placementProblem({ ...p, yaw: next }, root);
        this.moving = null;
        root.rotation.y = p.yaw;
        root.updateMatrixWorld(true);
        if (error) this.toast(error);
        else {
          this.checkpoint();
          p.yaw = next;
          root.rotation.y = next;
          this.rebuildObstacles();
          this.refreshSelection();
          this.refreshMap();
          this.sun.shadow.needsUpdate = true;
          this.dirty = true;
        }
      }
    };
    $("editConfirm").onclick = () => this.confirmEdit();
    $("editRemove").onclick = () => this.removeSelected();
    $("editMove").onclick = () => this.moveSelected();
  }
  private key(code: string) {
    if (code === "Escape" && this.worldMap.open) {
      this.closeWorldMap();
      return;
    }
    if (code === "KeyM") {
      this.openWorldMap();
      return;
    }
    if (code === "Escape") {
      this.modalOpen
        ? this.closeModal()
        : this.pending || this.selection
          ? this.cancelEdit()
          : this.menu();
    }
    if (code === "KeyE") this.discover();
    if (code === "KeyB") this.catalogue();
    if (code === "KeyR") $("editRotate").click();
    if (code === "Enter") this.confirmEdit();
    if (code === "KeyZ") this.undo();
  }
  private openModal(content: string) {
    if (this.worldMap.open) this.closeWorldMap();
    this.modalOpen = true;
    this.controls.clear();
    this.velocity.set(0, 0);
    this.animate("Idle");
    $("modal").innerHTML =
      `<section><button class="closeModal" aria-label="Close dialog">✕</button>${content}</section>`;
    $("modal").hidden = false;
    $("modal").querySelector<HTMLButtonElement>(".closeModal")!.onclick = () =>
      this.closeModal();
    $("modal")
      .querySelector<HTMLElement>("button:not(.closeModal),input,select")
      ?.focus();
  }
  private closeModal() {
    this.modalOpen = false;
    $("modal").hidden = true;
    this.controls.clear();
    $("view").focus();
  }
  async places() {
    this.cancelEdit();
    try {
      await this.session.save();
      const records = (await this.session.store.list()).sort(
        (a, b) => b.updated - a.updated,
      );
      this.openModal(
        `<div class="eyebrow">TAKE THE LONG WAY HOME</div><h1 id="modalTitle">Where shall we go?</h1><p>One valley. Take the old road from village to forest and meadow.</p><div class="placeCards">${WORLDS.filter(
          (w) => w.id === "vale",
        )
          .map(
            (w) =>
              `<button class="placeCard ${w.id}" data-scene="${w.id}"><span class="sceneIcon">${w.icon}</span><small>${w.tag}</small><strong>${w.name}</strong><span>${w.description}</span><b>Explore →</b></button>`,
          )
          .join(
            "",
          )}</div><div class="savedWorlds"><h2>Your saved worlds & earlier previews</h2><div id="savedRows"></div></div><details class="newPlaces"><summary>Start a fresh place</summary><p>Your saved worlds & earlier previews stay here. Fresh places use the latest scenery.</p><div id="newPlaceButtons"></div></details><p class="finePrint">Earlier independent places keep their original scenery and saves. Original BlockWorld worlds remain in the original game.</p>`,
      );
      for (const w of WORLDS.filter((w) => w.id === "vale")) {
        const button = $("modal").querySelector<HTMLButtonElement>(
          `[data-scene="${w.id}"]`,
        )!;
        button.onclick = () => {
          void (async () => {
            const record = records.find((r) => {
              try {
                return (
                  validateAdventure(JSON.parse(r.current.json)).scene === w.id
                );
              } catch {
                return false;
              }
            });
            if (record) await this.session.open(record.id);
            else await this.session.create(w.id);
            this.closeModal();
            this.toast(`Welcome to ${w.name}`);
          })().catch((e) => this.toast(String(e)));
        };
      }
      for (const w of WORLDS.filter((w) => w.id === "vale")) {
        const fresh = document.createElement("button");
        fresh.textContent = "New " + w.name;
        fresh.dataset.newScene = w.id;
        fresh.onclick = () =>
          void this.session
            .create(w.id)
            .then(() => {
              this.closeModal();
              this.toast("A fresh " + w.name + " is ready");
            })
            .catch((e) => this.toast(String(e)));
        $("newPlaceButtons").append(fresh);
      }
      for (const r of records) {
        const button = document.createElement("button");
        button.textContent =
          (r.id === this.session.current?.id ? "● " : "") + r.name;
        button.onclick = () =>
          void this.session
            .open(r.id)
            .then(() => this.closeModal())
            .catch((e) => this.toast(String(e)));
        $("savedRows").append(button);
      }
    } catch (e) {
      this.toast(String(e));
    }
  }
  private menu() {
    this.openModal(
      `<div class="eyebrow">BLOCKWORLD ADVENTURES</div><h1 id="modalTitle">Make yourself at home.</h1><p>Walk with WASD or the left joystick. Drag the world to turn the camera. Hold Shift or tap Run to move faster. Scroll or pinch to change the camera distance.</p><div class="menuGrid"><button id="resume" class="primary">Back to the world →</button><button id="home">Return to a clear starting point</button><button id="backup">Export backup</button><label class="fileButton">Import backup<input id="import" type="file" accept=".bw2,.json,application/json"></label><button id="recover">Save a new copy</button><button id="undo">Undo last edit</button><button id="redo">Redo edit</button><button id="performance">Show performance</button></div><label class="qualityLabel">Graphics <select id="quality"><option value="gentle">Gentle · fewer pixels, no shadows</option><option value="balanced">Balanced · soft shadows</option><option value="high">High · sharper image</option></select></label><details><summary>Backup text and asset credits</summary><p>If a download is unavailable, copy this text to a file and keep it safe.</p><textarea id="backupText" readonly aria-label="Backup JSON text"></textarea><button id="copy">Copy backup text</button><p>Village & character: Kay Lousberg / KayKit. Nature: Kenney. CC0 public domain. <a href="adventures/PROVENANCE.md" target="_blank">Source and licence details</a>.</p><p>Development preview 03. Closed prefab houses have no interiors. Physical tablet and iPhone performance has not been tested.</p></details><p id="menuError" role="alert"></p>`,
    );
    $("resume").onclick = () => this.closeModal();
    $("home").onclick = () => {
      const w = WORLDS.find((w) => w.id === this.data.scene)!;
      this.closeModal();
      this.travelTo({ id: "home", name: w.name, ...w.spawn });
    };
    $("backup").onclick = () => this.exportBackup();
    $("recover").onclick = () =>
      void this.session
        .recover()
        .then(() => this.toast("A separate recovery copy was saved"))
        .catch((e) => ($("menuError").textContent = String(e)));
    $("undo").onclick = () => this.undo();
    $("redo").onclick = () => this.redo();
    $("performance").onclick = () => {
      $("stats").hidden = !$("stats").hidden;
      this.closeModal();
    };
    $<HTMLSelectElement>("quality").value = this.quality;
    $<HTMLSelectElement>("quality").onchange = (e) =>
      this.setQuality((e.target as HTMLSelectElement).value);
    $<HTMLInputElement>("import").onchange = () => {
      void (async () => {
        const f = $<HTMLInputElement>("import").files?.[0];
        if (!f) return;
        if (f.size > 12_000_000) throw Error("Backup exceeds 12 MB");
        await this.session.import(await f.text());
        this.closeModal();
        this.toast("Imported as a separate saved adventure");
      })().catch((e) => {
        $("menuError").textContent = String(e);
      });
    };
    $("copy").onclick = () => {
      const text = this.session.export();
      $<HTMLTextAreaElement>("backupText").value = text;
      const fallback = () => {
        $<HTMLTextAreaElement>("backupText").select();
        this.toast("Select and copy the backup text");
      };
      if (navigator.clipboard?.writeText)
        void navigator.clipboard
          .writeText(text)
          .then(() => this.toast("Backup text copied"))
          .catch(fallback);
      else fallback();
    };
  }
  private exportBackup() {
    try {
      const text = this.session.export();
      $<HTMLTextAreaElement>("backupText").value = text;
      const blob = new Blob([text], { type: "application/json" }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = `BlockWorld-Adventures-${this.data.scene}-preview03.bw2`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      this.toast("Backup requested. The text is also available below.");
    } catch (e) {
      this.toast(String(e));
    }
  }
  private storePreferences() {
    writePreferences(this.preferenceStorage, {
      quality: this.quality,
      running: this.controls.running,
    });
  }
  private setQuality(value: string) {
    if (!["gentle", "balanced", "high"].includes(value)) return;
    if (this.quality === value) return;
    this.quality = value as Quality;
    this.renderer.setPixelRatio(
      Math.min(
        devicePixelRatio,
        value === "gentle" ? 1 : value === "high" ? 2 : 1.5,
      ),
    );
    this.renderer.shadowMap.enabled = value !== "gentle";
    this.sun.shadow.mapSize.set(
      value === "high" ? 2048 : 1024,
      value === "high" ? 2048 : 1024,
    );
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;
    this.sun.shadow.needsUpdate = true;
    this.renderer.setSize(innerWidth, innerHeight);
    this.storePreferences();
  }
  private catalogue() {
    this.cancelEdit();
    this.openModal(
      `<div class="eyebrow">A PLACE OF YOUR OWN</div><h1 id="modalTitle">What will you make?</h1><p>Choose something for your world, then walk to a clear spot and place it.</p><div class="catalogueFilters" role="group" aria-label="Filter building assets">${["All", "Homes", "Garden & woodland", "Village supplies"].map((name, i) => `<button data-category="${name}" aria-pressed="${i === 0}">${name}</button>`).join("")}</div><div class="assetGrid">${BUILD_CHOICES.map((item) => `<button data-asset="${item.id}" data-group="${item.group}" aria-label="Place ${item.name}"><img src="${import.meta.env.BASE_URL}adventures/thumbnails/${item.id}.png" alt="" loading="lazy" width="256" height="192"><span class="assetLabel">${item.name}</span></button>`).join("")}</div><p class="finePrint">Tap your own object to select it. Move, rotate or remove it from the selection bar.</p>`,
    );
    for (const filter of $("modal").querySelectorAll<HTMLButtonElement>(
      "[data-category]",
    ))
      filter.onclick = () => {
        for (const button of $("modal").querySelectorAll<HTMLButtonElement>(
          "[data-category]",
        ))
          button.setAttribute("aria-pressed", String(button === filter));
        for (const asset of $("modal").querySelectorAll<HTMLElement>(
          "[data-asset]",
        ))
          asset.hidden =
            filter.dataset.category !== "All" &&
            asset.dataset.group !== filter.dataset.category;
      };
    for (const button of $("modal").querySelectorAll<HTMLButtonElement>(
      "[data-asset]",
    ))
      button.onclick = () => {
        this.closeModal();
        this.beginPlacement(button.dataset.asset!);
      };
  }
  private assetName(id: string) {
    return (
      buildLabel(id) ||
      id
        .replace("building_", "")
        .replace("home_A", "Cottage")
        .replace("home_B", "Tall cottage")
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .replace(/a$/, "")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    );
  }
  private beginPlacement(asset: string, existing?: Placement) {
    this.cancelEdit();
    if (!existing && this.data.objects.length >= 200) {
      this.toast(
        "This place has 200 objects. Remove one before adding another.",
      );
      return;
    }
    this.pending = existing
      ? { ...existing }
      : {
          id: crypto.randomUUID(),
          asset,
          x: 0,
          z: 0,
          yaw: 0,
          scale: DEFINITIONS.get(asset)!.scale,
        };
    this.moving = existing?.id || null;
    if (existing) this.userRoots.get(existing.id)!.visible = false;
    this.ghost = this.library.create(asset, this.pending.scale);
    this.ghost.traverse((o) => {
      if (o instanceof T.Mesh) {
        const originals = Array.isArray(o.material) ? o.material : [o.material];
        this.originalMaterials.set(o, o.material);
        o.material = originals.map((m) => {
          const clone = m.clone();
          clone.transparent = true;
          clone.opacity = 0.55;
          clone.depthWrite = false;
          return clone;
        });
      }
    });
    this.scene.add(this.ghost);
    this.selection = null;
    $("editBar").hidden = false;
    document.body.classList.add("editing");
    $("editName").textContent = this.assetName(asset);
    $("editMove").hidden = true;
    $("editRemove").hidden = true;
    $("editConfirm").hidden = false;
    this.updateGhost();
  }
  private updateGhost() {
    if (!this.pending || !this.ghost) return;
    const d = this.pending.asset.startsWith("building") ? 9 : 4.5;
    this.pending.x =
      Math.round((this.player.x - Math.sin(this.cameraYaw) * d) * 2) / 2;
    this.pending.z =
      Math.round((this.player.z - Math.cos(this.cameraYaw) * d) * 2) / 2;
    this.ghost.position.set(
      this.pending.x,
      walkHeight(this.pending.x, this.pending.z, this.data.scene),
      this.pending.z,
    );
    this.ghost.rotation.y = this.pending.yaw;
    this.validateGhost();
  }
  private placementProblem(p: Placement, root: T.Object3D) {
    if (!inWorld(p.x, p.z, this.data.scene, 4))
      return "Keep inside the explored landscape";
    if (waterBlocked(p.x, p.z, this.data.scene)) return "Keep the water clear";
    if (
      this.landscape.nearPath(p.x, p.z, p.asset.startsWith("building") ? 4 : 1)
    )
      return "Keep paths and entrances clear";
    const b = this.objectBox(root, p.asset);
    if (b) {
      const groundError = footprintGroundProblem(b, root.position.y, {
        inside: (x, z) => inWorld(x, z, this.data.scene, 0.1),
        water: (x, z) => waterBlocked(x, z, this.data.scene),
        path: (x, z) => this.landscape.nearPath(x, z, 0.35),
        height: (x, z) => walkHeight(x, z, this.data.scene),
      });
      if (groundError) return groundError;
      const test = {
        ...b,
        minX: b.minX - 0.3,
        maxX: b.maxX + 0.3,
        minZ: b.minZ - 0.3,
        maxZ: b.maxZ + 0.3,
      };
      if (
        this.obstacles().some(
          (o) =>
            o.minX < test.maxX &&
            o.maxX > test.minX &&
            o.minZ < test.maxZ &&
            o.maxZ > test.minZ,
        )
      )
        return "Choose a clear spot";
      if (blocked(this.player.x, this.player.z, [test], 0.55))
        return "Move away from the object";
    }
    return null;
  }
  private validateGhost() {
    if (!this.pending || !this.ghost) return;
    const pose = [
      this.pending.id,
      this.pending.x,
      this.pending.z,
      this.pending.yaw,
      this.pending.scale,
    ].join(":");
    if (this.ghostValidation === pose) return;
    this.ghostValidation = pose;
    this.ghost.updateMatrixWorld(true);
    const error = this.placementProblem(this.pending, this.ghost);
    $<HTMLButtonElement>("editConfirm").disabled = !!error;
    $("editName").textContent = error || this.assetName(this.pending.asset);
    this.ghost.traverse((o) => {
      if (o instanceof T.Mesh)
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          const mat = m as T.MeshStandardMaterial;
          mat.emissive?.set(error ? 0xa23020 : 0x1c643d);
          mat.emissiveIntensity = 0.25;
        }
    });
  }
  private confirmEdit() {
    if (!this.pending || !this.ghost) return;
    const error = this.placementProblem(this.pending, this.ghost);
    if (error) {
      this.toast(error);
      return;
    }
    this.checkpoint();
    if (this.moving)
      this.data.objects = this.data.objects.filter((p) => p.id !== this.moving);
    this.data.objects.push({ ...this.pending });
    this.cancelEdit();
    this.renderObjects();
    this.dirty = true;
    this.toast("Placed. Tap your object to edit it.");
  }
  private cancelEdit() {
    if (this.ghost) {
      this.ghost.removeFromParent();
      this.ghost.traverse((o) => {
        if (o instanceof T.Mesh) {
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            m.dispose();
        }
      });
    }
    this.ghost = null;
    this.ghostValidation = "";
    this.originalMaterials.clear();
    if (this.moving) this.userRoots.get(this.moving)!.visible = true;
    this.pending = null;
    this.moving = null;
    this.selection = null;
    this.selectionOutline.visible = false;
    document.body.classList.remove("editing");
    $("editBar").hidden = true;
  }
  private tap(x: number, y: number) {
    if (this.pending) return;
    const ray = new T.Raycaster();
    ray.setFromCamera(
      new T.Vector2((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2),
      this.camera,
    );
    const hit = ray.intersectObjects([...this.userRoots.values()], true)[0];
    if (
      hit &&
      this.landscape.obstacles.some((b) => {
        const box = new T.Box3(
          new T.Vector3(b.minX, -3, b.minZ),
          new T.Vector3(b.maxX, b.height, b.maxZ),
        );
        const obstruction = ray.ray.intersectBox(box, new T.Vector3());
        return (
          !!obstruction &&
          this.camera.position.distanceTo(obstruction) < hit.distance - 0.05
        );
      })
    ) {
      this.cancelEdit();
      return;
    }
    if (!hit) {
      this.cancelEdit();
      return;
    }
    let root: T.Object3D | null = hit.object;
    while (root && !root.userData.placementId) root = root.parent;
    if (!root) return;
    this.selection = root.userData.placementId;
    this.refreshSelection();
    document.body.classList.add("editing");
    $("editBar").hidden = false;
    $("editName").textContent = this.assetName(
      this.data.objects.find((p) => p.id === this.selection)!.asset,
    );
    $("editMove").hidden = false;
    $("editRemove").hidden = false;
    $("editConfirm").hidden = true;
  }
  private refreshSelection() {
    const root = this.selection ? this.userRoots.get(this.selection) : null;
    this.selectionOutline.visible = !!root;
    if (root) {
      root.updateMatrixWorld(true);
      this.selectionOutline.box.setFromObject(root).expandByScalar(0.04);
    }
  }
  private moveSelected() {
    if (!this.selection) return;
    const p = this.data.objects.find((p) => p.id === this.selection)!;
    this.beginPlacement(p.asset, p);
  }
  private removeSelected() {
    if (!this.selection) return;
    this.checkpoint();
    this.data.objects = this.data.objects.filter(
      (p) => p.id !== this.selection,
    );
    this.cancelEdit();
    this.renderObjects();
    this.dirty = true;
    this.toast("Object removed. Undo is available in the menu.");
  }
  private checkpoint() {
    this.history.push(structuredClone(this.data.objects));
    if (this.history.length > 30) this.history.shift();
    this.redoHistory = [];
  }
  private undo() {
    const previous = this.history.pop();
    if (!previous) {
      this.toast("Nothing to undo");
      return;
    }
    this.redoHistory.push(structuredClone(this.data.objects));
    this.data.objects = previous;
    this.cancelEdit();
    this.renderObjects();
    this.safeSpawn();
    this.dirty = true;
    this.toast("Last edit undone");
  }
  private redo() {
    const next = this.redoHistory.pop();
    if (!next) {
      this.toast("Nothing to redo");
      return;
    }
    this.history.push(structuredClone(this.data.objects));
    this.data.objects = next;
    this.cancelEdit();
    this.renderObjects();
    this.safeSpawn();
    this.dirty = true;
  }
  stats() {
    const r = this.renderer.info,
      sorted = [...this.fpsSamples].sort((a, b) => a - b);
    return {
      fps: this.fps,
      frameP95Ms: +(sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(1),
      drawCalls: r.render.calls,
      triangles: r.render.triangles,
      geometries: r.memory.geometries,
      textures: r.memory.textures,
      pixelRatio: this.renderer.getPixelRatio(),
      scene: this.data.scene,
      natureInstances: this.landscape?.instances,
      objects: this.data.objects.length,
      quality: this.quality,
    };
  }
  qaView(name: string) {
    this.started = true;
    document.body.classList.add("playing");
    $("welcome").hidden = true;
    this.closeModal();
    this.actor.visible = true;
    const views: Record<string, { position: number[]; target: number[] }> = {
      centre: { position: [-17, 18, 30], target: [0, 2, -3] },
      street: { position: [-19, 7, 21], target: [-16, 3, -12] },
      forest: { position: [44, 8, 24], target: [56, 2, 4] },
      bridge: { position: [23, 5, 16], target: [32, 0, 8] },
      entrance: { position: [-1, 5, -12], target: [0, 3, -23] },
      overview: { position: [-55, 65, 65], target: [0, 0, 0] },
      player: {
        position: [this.player.x + 1, 6, this.player.z + 11],
        target: [this.player.x, 1.5, this.player.z - 2],
      },
    };
    if (this.data.scene === "vale") {
      for (const key of [
        "centre",
        "street",
        "entrance",
        "overview",
        "bridge",
      ]) {
        views[key].position[0] -= 105;
        views[key].target[0] -= 105;
      }
      Object.assign(views, {
        woodland: { position: [-17, 18, 30], target: [0, 2, -3] },
        meadow: { position: [88, 18, 30], target: [105, 2, -3] },
        hamlet: { position: [62, 14, 73], target: [79, 2, 52] },
        road: { position: [-57, 6, 30], target: [-37, 1, 13] },
        campScale: { position: [-5, 4, -10], target: [-9, 1.5, -17] },
      });
    }
    const v = views[name] || views.centre;
    this.debugCamera = true;
    this.camera.position.fromArray(v.position);
    this.camera.lookAt(new T.Vector3().fromArray(v.target));
    this.renderScene();
    return this.stats();
  }
}
try {
  new AdventureGame();
} catch (error) {
  $("fatal").hidden = false;
  $("fatal").textContent = `Could not start the preview: ${String(error)}`;
  console.error(error);
}
