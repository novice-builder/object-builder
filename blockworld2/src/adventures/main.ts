import { WoodlandFox, loadFox } from "./wildlife";
import { FOX, foxBody } from "./foxglade-data";
import { bindButton } from "./button-press";
import * as T from "three";
import {
  buildingEntry,
  entryDistance,
  type BuildingEntry,
} from "./building-entry";
import { Interior, freshRoom } from "./interior";
import { moveCharacter, recoverCharacter } from "./character-controller";
import { checkpointFooting } from "./checkpoint-footing";
import { OutdoorCollision, meshBuilding } from "./outdoor-collision";
import { CollisionSpace } from "./mesh-collision";
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
import { cameraFraction, rayBoxDistance } from "./camera-collision";
import { groundTarget } from "./ground-target";
import { PREVIEW_VERSION } from "./version";
import "./style.css";
import { installUUIDFallback } from "./ids";
installUUIDFallback();
const $ = <E extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as E;
const app = $("app");
app.innerHTML = `
<canvas id="view" aria-label="BlockWorld Adventures. Drag to orbit the camera. Use WASD or the touch joystick to move." tabindex="0"></canvas>
<header id="hud"><div class="identity"><span class="brandmark">◇</span><div class="wordmark">BLOCKWORLD<span>ADVENTURES</span></div><span class="identity-divider"></span><div class="location"><strong id="placeName">Willowmere</strong><span id="placeTag">THE VILLAGE</span></div></div><nav><button id="places" title="Choose a place">⌂ <span>Places</span></button><button id="build" title="Build with premade assets">◇ <span>Build</span></button><button id="menu" aria-label="Open menu">☰</button></nav></header>
<div id="discoveryCount" class="smallPill">♧ <span>Little discoveries</span> <b id="discovered">0 / 5</b></div><div id="compass" aria-label="Camera direction">N <i>↑</i></div><button id="minimap" aria-label="Open world map" title="World map (M)"><canvas id="miniCanvas" aria-hidden="true"></canvas></button>
<div id="mapOverlay" hidden role="dialog" aria-modal="true" aria-labelledby="mapTitle"><header class="mapHeader"><div><small>THE LONG WAY HOME</small><h1 id="mapTitle">The Willow Vale</h1></div><button id="mapClose" aria-label="Close map">✕</button></header><canvas id="fullMap" tabindex="0" aria-label="World map. Drag to pan, pinch or use plus and minus to zoom. Tap a named place to travel. Keyboard arrows pan."></canvas><div class="mapTools"><button id="mapHome">⌂ Home</button><button id="mapFit" aria-label="Show whole world">⊡</button><button id="mapMinus" aria-label="Zoom map out">−</button><button id="mapPlus" aria-label="Zoom map in">+</button><select id="mapDestination" aria-label="Travel to a landmark"><option value="">Travel to…</option></select></div><p class="mapHint">Drag to explore · pinch to zoom · tap a place to travel</p></div>
<div id="joystick" role="group" aria-label="Touch movement joystick"><div id="knob"></div></div><button id="run" class="roundControl" aria-label="Use slower walking" aria-pressed="false">➟<span>Walk</span></button><button id="jump" class="roundControl" aria-label="Jump">↑<span>Jump</span></button>
<div id="context" hidden><span id="contextLabel"></span><button id="interact">Discover <kbd>E</kbd></button></div>
<div id="bottomHint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> run</span><span>drag to look</span><span><kbd>Space</kbd> jump</span></div><div id="touchHint">Left thumb to move · drag to look · tap ↑ to jump</div>
<output id="toast" role="status" aria-live="polite" hidden></output><output id="saveState" aria-live="polite">Preparing your world…</output><div id="stats" hidden></div>
<div id="editBar" hidden><span id="editName">Place object</span><button id="editRotate">↻ <span>Rotate</span></button><button id="editMove">✥ <span>Move</span></button><button id="editRemove">× <span>Remove</span></button><button id="editConfirm" class="primary">✓ <span>Place</span></button><button id="editCancel" aria-label="Cancel editing">✕</button></div>
<div id="modal" hidden role="dialog" aria-modal="true" aria-labelledby="modalTitle"></div>
<div id="welcome"><section><div class="eyebrow">A BLOCKWORLD ADVENTURE</div><h1>A little world.<br>A little wonder.</h1><p>Follow a cobbled lane. Find a quiet corner.<br>Make a place of your own.</p><button id="enter" class="primary" disabled>Preparing the valley… <span>→</span></button><div class="loadingTrack"><i id="loadingBar"></i></div><small id="loadingText">Unpacking the village</small><div class="welcomeFoot">FREE TO EXPLORE <span>•</span> SAVED ON YOUR DEVICE</div></section><div class="previewBadge">WILLOW VALE · DEVELOPMENT PREVIEW ${PREVIEW_VERSION}</div></div>
<div id="roomFade" hidden aria-live="polite"><span>Stepping inside…</span></div><div id="fatal" hidden role="alert"></div>`;
class AdventureGame {
  library = new AssetLibrary();
  wildlife: WoodlandFox | null = null;
  private wildlifeGeneration = 0;
  private pendingWildlife: Awaited<ReturnType<typeof loadFox>> | null = null;
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
  player = { x: 0, y: 0, z: 18, yaw: 0, pitch: 0.47, vy: 0, grounded: true };
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
  private placementAnchor: { x: number; z: number } | null = null;
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
  private interiorBodySource?: readonly Obstacle[];
  private outdoorCameraBodies: readonly Obstacle[] = [];
  private interiorCameraBodies: readonly Obstacle[] = [];
  private dirty = false;
  interior: Interior | null = null;
  private transitioning = false;
  private transitionToken = 0;
  private entryNear: BuildingEntry | null = null;
  private roomSpace?: CollisionSpace;
  private lastFooting?: { x: number; y: number; z: number };
  private jumpActive = false;
  private landingTime = 0;
  private upgradingJump = false;
  private outdoorSpace?: CollisionSpace;
  private outdoorCollision = new OutdoorCollision(this.library);
  private roomBodySource?: readonly Obstacle[];
  private get objects(): Placement[] {
    return this.data.inside
      ? this.data.rooms![this.data.inside.id].objects
      : this.data.objects;
  }
  private set objects(value: Placement[]) {
    if (this.data.inside) this.data.rooms![this.data.inside.id].objects = value;
    else this.data.objects = value;
  }
  private mapPose() {
    const p = this.data.inside?.outside || this.player;
    return {
      x: p.x,
      z: p.z,
      yaw: this.data.inside
        ? (this.data.inside.outside.facing ?? p.yaw + Math.PI)
        : this.actorYaw,
    };
  }
  private floorHeight(x: number, z: number) {
    if (this.interior) return this.pending?.y ?? (this.player.y > 1.5 ? 3 : 0);
    return walkHeight(x, z, this.data.scene, this.data.layout);
  }
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
        if (this.landscape) this.updateContext();
        if (!busy && this.worldMap && this.landscape)
          this.worldMap.update(this.mapPose(), performance.now(), true);
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
      (x, z, lx, ly, dt) => {
        if (this.worldMap?.open) {
          this.worldMap.transform?.pan(-x * dt * 280, -z * dt * 280);
          if (ly) this.worldMap.zoom(Math.exp(-ly * dt * 1.8));
          else if (x || z) this.worldMap.drawFull();
          return true;
        }
        return this.modalOpen;
      },
      (connected) => {
        if (!connected) this.velocity.set(0, 0);
        this.toast(
          connected
            ? "Controller connected. Controls are in the menu."
            : "Controller disconnected. Touch and keyboard are ready.",
        );
      },
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
    const preferences = readPreferences(
      this.preferenceStorage,
      typeof matchMedia === "function" &&
        matchMedia("(pointer: coarse)").matches,
    );
    this.controls.running = preferences.running;
    $("run").setAttribute("aria-pressed", String(!preferences.running));
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
    for (const name of ["Jump_Start", "Jump_Land"]) {
      const a = this.actions.get(name);
      if (a) {
        a.setLoop(T.LoopOnce, 1);
        a.clampWhenFinished = true;
      }
    }
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
    return (
      this.started &&
      !this.busy &&
      !this.transitioning &&
      !this.modalOpen &&
      !document.hidden
    );
  }
  snapshot() {
    const space = this.interior ? this.roomSpace : this.outdoorSpace;
    const footing =
      this.data.version >= 3 && space
        ? checkpointFooting(this.player, space, this.lastFooting)
        : this.player;
    if (!footing)
      throw Error(
        "No clear checkpoint footing. Return to a safe floor before saving.",
      );
    return makeSnapshot(this.data, {
      x: footing.x,
      y: footing.y,
      z: footing.z,
      yaw: this.cameraYaw,
      pitch: this.cameraPitch,
    });
  }
  apply(snapshot: Snapshot) {
    const data = validateAdventure(snapshot),
      candidate =
        data.scene === "vale"
          ? new ConnectedLandscape(
              this.library,
              data.layout === 9
                ? 9
                : data.layout === 8
                  ? 8
                  : data.layout === 7
                    ? 7
                    : data.layout === 6
                      ? 6
                      : data.layout === 5
                        ? 5
                        : data.layout === 4
                          ? 4
                          : 3,
              data.doors?.lodge,
            )
          : new Landscape(this.library, data.scene, data.layout);
    const candidateRoom = data.inside
      ? new Interior(this.library, data.rooms![data.inside.id].entry)
      : null;
    let roomArrival: null | { x: number; y: number; z: number } = null;
    if (candidateRoom) {
      roomArrival = this.prepareRoomPose(
        candidateRoom,
        data.rooms![data.inside!.id].objects,
        { ...snapshot.player },
      );
      if (!roomArrival) {
        candidateRoom.dispose();
        candidate.dispose();
        throw Error(
          "This interior has no clear footing. The current world is unchanged; import or recover a clear checkpoint.",
        );
      }
    }
    this.jumpActive = false;
    this.landingTime = 0;
    this.lastFooting = undefined;
    this.transitionToken++;
    this.transitioning = false;
    $("roomFade").hidden = true;
    $("roomFade").classList.remove("opaque");
    this.interior?.dispose();
    this.interior = null;
    this.wildlifeGeneration++;
    this.wildlife?.dispose();
    this.wildlife = null;
    this.pendingWildlife = null;
    // Prepare a complete replacement before retiring the old scene.
    const previous = this.landscape;
    this.landscape = candidate;
    this.data = data;
    this.scene.add(candidate.group);
    previous?.dispose();
    this.player.x = snapshot.player.x;
    this.player.z = snapshot.player.z;
    if (roomArrival) Object.assign(this.player, roomArrival);
    this.cameraYaw = snapshot.player.yaw;
    this.cameraPitch = T.MathUtils.clamp(snapshot.player.pitch, 0.18, 1.1);
    this.velocity.set(0, 0);
    this.cancelEdit(false);
    this.history = [];
    this.redoHistory = [];
    if (data.inside) {
      this.interior = candidateRoom!;
      this.scene.add(this.interior.group);
      candidate.group.visible = false;
    }
    this.renderObjects();
    this.prepareWildlife();
    if (this.interior) this.refreshMap(true);
    this.scene.background = new T.Color(this.interior ? 0xd9d0bb : 0xc6d9d4);
    this.distance = this.interior ? 8 : 12;
    this.player.y = data.inside
      ? roomArrival!.y
      : data.version >= 3
        ? (data.outdoorElevation ?? snapshot.player.y)
        : walkHeight(
            this.player.x,
            this.player.z,
            this.data.scene,
            this.data.layout,
          );
    this.safeSpawn();
    Object.assign(this.player, { vy: 0, grounded: true });
    this.lastFooting = { ...this.player };
    this.actor.position.set(this.player.x, this.player.y, this.player.z);
    this.contactShadow.position.set(
      this.player.x,
      this.player.y + 0.025,
      this.player.z,
    );
    this.cameraPosition.set(0, 0, 0);
    this.debugCamera = false;
    const world = WORLDS.find((w) => w.id === data.scene)!;
    $("placeName").textContent = this.interior?.entry.name || world.name;
    $("placeTag").textContent = this.interior
      ? "INSIDE · YOUR OWN ROOM"
      : world.tag;
    this.countDiscoveries();
    this.dirty = false;
    this.sun.shadow.needsUpdate = true;
  }
  private prepareWildlife() {
    if (this.data.scene !== "vale" || (this.data.layout || 1) < 8) return;
    const generation = this.wildlifeGeneration;
    void loadFox()
      .then((template) => {
        if (generation !== this.wildlifeGeneration) return;
        this.pendingWildlife = template;
        this.trySpawnWildlife();
      })
      .catch(() => {
        if (generation === this.wildlifeGeneration)
          this.toast("The clearing is ready, but wildlife could not load.");
      });
  }
  private trySpawnWildlife() {
    if (
      !this.pendingWildlife ||
      !(this.landscape instanceof ConnectedLandscape)
    )
      return;
    if (
      !this.interior &&
      Math.hypot(this.player.x - FOX.x, this.player.z - FOX.z) < 1.1
    )
      return;
    const body = foxBody(),
      volume = new T.Box3(
        new T.Vector3(body.minX - 0.3, 0, body.minZ - 0.4),
        new T.Vector3(body.maxX + 0.3, body.height, body.maxZ + 0.4),
      );
    const matrix = new T.Matrix4(),
      rotation = new T.Quaternion(),
      position = new T.Vector3(),
      scale = new T.Vector3();
    const occupied = this.data.objects.some((p) => {
      position.set(
        p.x,
        walkHeight(p.x, p.z, this.data.scene, this.data.layout),
        p.z,
      );
      rotation.setFromAxisAngle(new T.Vector3(0, 1, 0), p.yaw);
      scale.setScalar(p.scale);
      matrix.compose(position, rotation, scale);
      return this.library.bounds
        .get(p.asset)!
        .clone()
        .applyMatrix4(matrix)
        .intersectsBox(volume);
    });
    if (occupied) {
      this.pendingWildlife = null;
      return;
    }
    const fox = new WoodlandFox(
      this.pendingWildlife,
      walkHeight(FOX.x, FOX.z, this.data.scene, this.data.layout),
    );
    this.pendingWildlife = null;
    this.wildlife = fox;
    this.landscape.group.add(fox.group);
    this.landscape.installFoxBody();
    this.rebuildObstacles();
    this.sun.shadow.needsUpdate = true;
    this.renderScene();
  }
  private safeSpawn() {
    if (this.interior) {
      const safe = recoverCharacter(
        this.player,
        this.roomSpace!,
        this.interior.spawn,
        Math.hypot(this.interior.entry.width, this.interior.entry.depth),
      );
      if (safe) Object.assign(this.player, safe, { vy: 0, grounded: true });
      else
        this.toast(
          "No clear floor space. Use the map to return outside or recover a backup.",
        );
      return;
    }
    if (
      this.outdoorSpace!.supported(this.player) &&
      this.outdoorSpace!.valid(this.player.x, this.player.z) &&
      this.outdoorSpace!.clear(this.player)
    )
      return;
    const safe = (x: number, z: number) =>
      this.outdoorSpace!.clear({
        x,
        y: walkHeight(x, z, this.data.scene, this.data.layout) + 0.002,
        z,
      }) &&
      !waterBlocked(x, z, this.data.scene, this.data.layout) &&
      inWorld(x, z, this.data.scene);
    if (safe(this.player.x, this.player.z)) {
      Object.assign(this.player, {
        y: this.outdoorSpace!.ground(this.player.x, this.player.z) + 0.002,
        vy: 0,
        grounded: true,
      });
      return;
    }
    const origin = { x: this.player.x, z: this.player.z };
    const home = WORLDS.find((w) => w.id === this.data.scene)!.spawn;
    const clear = clearArrival(origin, safe) || clearArrival(home, safe, 32);
    if (clear) {
      Object.assign(this.player, clear, {
        y: this.outdoorSpace!.ground(clear.x, clear.z) + 0.002,
        vy: 0,
        grounded: true,
      });
      this.toast("Moved to the nearest clear ground");
    }
  }
  private prepareRoomPose(
    room: Interior,
    objects: Placement[],
    pose: { x: number; y: number; z: number; yaw: number },
  ) {
    const space = room.collision();
    const solids = [];
    for (const p of objects) {
      if (DEFINITIONS.get(p.asset)?.solid === false) continue;
      const root = this.library.create(p.asset, p.scale);
      root.position.set(p.x, p.y ?? 0, p.z);
      root.rotation.y = p.yaw;
      root.updateMatrixWorld(true);
      const b = new T.Box3().setFromObject(root);
      solids.push({
        minX: b.min.x + 0.08,
        maxX: b.max.x - 0.08,
        minZ: b.min.z + 0.08,
        maxZ: b.max.z - 0.08,
        minY: b.min.y,
        maxY: b.max.y,
      });
    }
    space.boxes = solids;
    return recoverCharacter(
      pose,
      space,
      room.spawn,
      Math.hypot(room.entry.width, room.entry.depth),
    );
  }
  private async roomTransition(
    label: string,
    commit: () => void,
    prepare?: () => Promise<void>,
  ) {
    if (this.transitioning || this.busy || this.session.busy) return;
    const token = ++this.transitionToken;
    this.transitioning = true;
    this.jumpActive = false;
    this.landingTime = 0;
    this.controls.clear();
    this.velocity.set(0, 0);
    this.cancelEdit();
    this.closeModal();
    this.closeWorldMap();
    this.updateContext();
    const fade = $("roomFade");
    fade.querySelector("span")!.textContent = label;
    try {
      // Persist the complete old location first. No half-transition state is ever captured.
      await this.session.save();
      if (prepare) await prepare();
      if (token !== this.transitionToken) return;
      fade.hidden = false;
      void fade.offsetWidth;
      fade.classList.add("opaque");
      await new Promise((r) => setTimeout(r, 190));
      if (token !== this.transitionToken) return;
      commit();
      this.velocity.set(0, 0);
      this.controls.clear();
      this.history = [];
      this.redoHistory = [];
      this.safeSpawn();
      this.lastFooting = { ...this.player };
      this.actor.position.set(this.player.x, this.player.y, this.player.z);
      this.contactShadow.position.set(
        this.player.x,
        this.player.y + 0.025,
        this.player.z,
      );
      this.cameraPosition.set(0, 0, 0);
      this.debugCamera = false;
      this.animate("Idle");
      this.cameraUpdate(1 / 60);
      this.worldMap.update(this.mapPose(), performance.now(), true);
      this.renderScene();
      this.dirty = true;
      await this.session.save();
    } catch (e) {
      this.toast(String(e));
    } finally {
      if (token === this.transitionToken) {
        fade.classList.remove("opaque");
        await new Promise((r) => setTimeout(r, 190));
        fade.hidden = true;
        this.transitioning = false;
        this.controls.clear();
        this.updateContext();
        $("view").focus();
      }
    }
  }
  private async enterRoom(entry: BuildingEntry) {
    if (
      this.interior ||
      this.transitioning ||
      this.busy ||
      entryDistance(entry, this.player) > 2.25
    )
      return;
    const outside = {
      y: this.player.y,
      x: this.player.x,
      z: this.player.z,
      yaw: this.cameraYaw,
      pitch: this.cameraPitch,
      facing: this.actorYaw,
    };
    const stored =
      this.data.rooms && Object.hasOwn(this.data.rooms, entry.id)
        ? this.data.rooms[entry.id]
        : null;
    const state = stored || freshRoom(entry, this.library);
    const requiredVersion =
      state.entry.profile === "compact-windmill"
        ? 4
        : state.entry.levels !== undefined
          ? 3
          : 2;
    // Construct geometry before retiring the exterior. Source models are already loaded.
    const room = new Interior(this.library, state.entry);
    const arrival = this.prepareRoomPose(room, state.objects, {
      ...room.spawn,
      yaw: 0,
    });
    if (!arrival) {
      room.dispose();
      this.toast(
        "This room has no clear floor space. Your outside world is unchanged.",
      );
      return;
    }
    await this.roomTransition(
      "Stepping inside…",
      () => {
        this.data.version =
          this.data.version >= requiredVersion
            ? this.data.version
            : requiredVersion;
        this.data.rooms ||= {};
        this.data.rooms[entry.id] = state;
        this.data.inside = { id: entry.id, outside };
        this.interior = room;
        this.scene.add(room.group);
        this.landscape.group.visible = false;
        this.scene.background = new T.Color(0xd9d0bb);
        Object.assign(this.player, arrival, { vy: 0, grounded: true });
        this.cameraYaw = 0;
        this.cameraPitch = 0.8;
        this.distance = 8;
        this.actorYaw = Math.PI;
        this.actor.rotation.y = this.actorYaw;
        this.renderObjects();
        $("placeName").textContent = entry.name;
        $("placeTag").textContent = "INSIDE · YOUR OWN ROOM";
      },
      async () => {
        if (this.data.version < requiredVersion) {
          await this.session.copyForRooms(requiredVersion);
          this.toast("Original world kept. Rooms are saved in a new copy.");
        }
      },
    );
    if (this.interior !== room) room.dispose();
  }
  private async leaveRoom(destination?: MapDestination) {
    if (!this.interior || !this.data.inside || this.transitioning || this.busy)
      return;
    const old = this.interior,
      outside = this.data.inside.outside;
    const bodies: Obstacle[] = [...this.landscape.obstacles];
    const outsideRoots = new Map<string, T.Object3D>();
    for (const p of this.data.objects) {
      const root = this.library.create(p.asset, p.scale);
      root.position.set(
        p.x,
        walkHeight(p.x, p.z, this.data.scene, this.data.layout),
        p.z,
      );
      root.rotation.y = p.yaw;
      const b = this.objectBox(root, p.asset);
      if (b) bodies.push({ ...b, name: p.asset });
      outsideRoots.set(p.id, root);
    }
    const space = this.outdoorCollision.create(
      this.landscape.group,
      outsideRoots,
      bodies,
      (x, z) => walkHeight(x, z, this.data.scene, this.data.layout),
      (x, z) =>
        inWorld(x, z, this.data.scene, 1) &&
        !waterBlocked(x, z, this.data.scene, this.data.layout),
      null,
    );
    const exact =
      !destination &&
      outside.y !== undefined &&
      space.supported({ ...outside, y: outside.y })
        ? { x: outside.x, y: outside.y, z: outside.z }
        : null;
    const target = destination || outside;
    const clear =
      exact &&
      space.valid(exact.x, exact.z) &&
      space.clear(exact) &&
      (exact.y > space.ground(exact.x, exact.z) + 0.05 ||
        !blocked(exact.x, exact.z, bodies, 0.42))
        ? exact
        : clearArrival(
            target,
            (x, z) =>
              inWorld(x, z, this.data.scene, 1) &&
              !waterBlocked(x, z, this.data.scene, this.data.layout) &&
              !blocked(x, z, bodies, 0.42),
            destination ? 14 : 3,
          );
    if (!clear) {
      this.toast(
        "The exit is blocked. Clear the ground outside before leaving.",
      );
      return;
    }
    await this.roomTransition("Stepping outside…", () => {
      delete this.data.inside;
      this.interior = null;
      old.dispose();
      this.landscape.group.visible = true;
      this.scene.background = new T.Color(0xc6d9d4);
      Object.assign(this.player, clear, {
        y:
          "y" in clear
            ? clear.y
            : walkHeight(clear.x, clear.z, this.data.scene, this.data.layout),
        vy: 0,
        grounded: true,
      });
      this.actorYaw = outside.facing ?? outside.yaw + Math.PI;
      this.actor.rotation.y = this.actorYaw;
      this.cameraYaw = outside.yaw;
      this.cameraPitch = outside.pitch;
      this.distance = 12;
      this.renderObjects();
      const w = WORLDS.find((w) => w.id === this.data.scene)!;
      $("placeName").textContent = w.name;
      $("placeTag").textContent = w.tag;
    });
  }
  private roomPlacementProblem(p: Placement, root: T.Object3D) {
    const room = this.interior!,
      w = room.entry.width / 2,
      d = room.entry.depth / 2,
      y = p.y ?? 0;
    if (Math.abs(this.player.y - y) > 1.2)
      return "Walk to that floor before decorating it";
    const box = new T.Box3().setFromObject(root);
    if (
      box.min.x < -w + 0.22 ||
      box.max.x > w - 0.22 ||
      box.min.z < -d + 0.22 ||
      box.max.z > d - 0.22 ||
      box.max.y > (room.upstairs ? 6 : 3) - 0.08
    )
      return "Keep furniture inside the room";
    if (box.max.z > d - 2.1 && box.min.x < 0.9 && box.max.x > -0.9 && y === 0)
      return "Keep the exit clear";
    const overlap = (a: {
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
    }) =>
      a.minX < box.max.x + 0.1 &&
      a.maxX > box.min.x - 0.1 &&
      a.minZ < box.max.z + 0.1 &&
      a.maxZ > box.min.z - 0.1;
    if (room.solids.some((b) => b.ramp && overlap(b)))
      return "Keep the stairs and landings clear";
    const floorSpace = room.collision(),
      solid = !!this.objectBox(root, p.asset);
    for (const x of [box.min.x, box.max.x])
      for (const z of [box.min.z, box.max.z]) {
        if (
          !floorSpace.floor(x, z, y + 0.03, y - 0.03) ||
          !floorSpace.clear(
            { x, y: y + 0.002, z },
            0.02,
            Math.max(0.1, box.max.y - y),
          )
        )
          return "Choose clear floor space";
      }
    if (
      solid &&
      this.obstacles().some(
        (b) => (b.base ?? 0) < box.max.y && b.height > y + 0.02 && overlap(b),
      )
    )
      return "Choose a clear spot";
    if (
      solid &&
      Math.abs(this.player.x - p.x) < (box.max.x - box.min.x) / 2 + 0.6 &&
      Math.abs(this.player.z - p.z) < (box.max.z - box.min.z) / 2 + 0.6 &&
      Math.abs(this.player.y - y) < 1.8
    )
      return "Move away from the object";
    return null;
  }
  private travelTo(destination: MapDestination) {
    if (this.busy || this.transitioning) return;
    if (this.interior) {
      void this.leaveRoom(destination);
      return;
    }
    this.cancelEdit();
    const safe = (x: number, z: number) =>
      inWorld(x, z, this.data.scene, 1) &&
      !waterBlocked(x, z, this.data.scene, this.data.layout) &&
      !blocked(x, z, this.obstacles(), 0.42);
    const arrival = clearArrival(destination, safe, 14);
    if (!arrival) {
      this.toast(
        "That place is blocked. Clear a little space before travelling there.",
      );
      return;
    }
    Object.assign(this.player, arrival, { vy: 0, grounded: true });
    this.jumpActive = false;
    this.landingTime = 0;
    this.player.y = walkHeight(
      arrival.x,
      arrival.z,
      this.data.scene,
      this.data.layout,
    );
    this.velocity.set(0, 0);
    this.actor.position.set(this.player.x, this.player.y, this.player.z);
    this.controls.clear();
    this.lastFooting = { ...this.player };
    this.animate("Idle");
    this.cameraPosition.set(0, 0, 0);
    this.debugCamera = false;
    this.dirty = true;
    this.closeWorldMap();
    this.cameraUpdate(1 / 60);
    this.updateContext();
    this.worldMap.update(this.mapPose(), performance.now(), true);
    this.renderScene();
    this.toast("Arrived at " + destination.name);
  }
  private refreshMap(force = false) {
    if (!this.worldMap || !this.landscape || (this.interior && !force)) return;
    const data = createMapData(this.data.scene, this.landscape);
    for (const p of this.data.objects) {
      let root = this.interior ? undefined : this.userRoots.get(p.id);
      if (!root) {
        root = this.library.create(p.asset, p.scale);
        root.position.set(
          p.x,
          walkHeight(p.x, p.z, this.data.scene, this.data.layout),
          p.z,
        );
        root.rotation.y = p.yaw;
      }
      if (root && p.asset.startsWith("building_")) {
        const body = this.objectBox(root, p.asset);
        if (body)
          (data.buildings as Obstacle[]).push({ ...body, name: p.asset });
      }
    }
    this.worldMap.setWorld(data);
  }
  private openWorldMap() {
    if (this.busy || this.transitioning || !this.started) return;
    this.closeModal();
    this.cancelEdit();
    this.modalOpen = true;
    this.controls.clear();
    this.updateContext();
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
    this.updateContext();
  }
  private objectBox(root: T.Object3D, id: string): Obstacle | null {
    if (
      DEFINITIONS.get(id)?.solid === false ||
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
      ...(this.interior ? { base: b.min.y } : {}),
    };
  }
  private rebuildObstacles() {
    this.ghostValidation = "";
    const built: OwnedObstacle[] = [];
    for (const p of this.objects) {
      const root = this.userRoots.get(p.id);
      if (root) {
        const body = this.objectBox(root, p.asset);
        if (body) built.push({ ...body, name: p.asset, ownerId: p.id });
      }
    }
    this.collisionCache.replace(
      this.interior?.obstacles || this.landscape?.obstacles || [],
      built,
    );
    this.roomBodySource = undefined;
    this.refreshRoomPhysics();
  }
  private refreshRoomPhysics() {
    const bodies = this.obstacles();
    if (this.roomBodySource === bodies) return;
    this.roomBodySource = bodies;
    if (!this.interior) {
      this.outdoorSpace = this.outdoorCollision.create(
        this.landscape.group,
        this.userRoots,
        bodies,
        (x, z) => walkHeight(x, z, this.data.scene, this.data.layout),
        (x, z) =>
          inWorld(x, z, this.data.scene) &&
          !waterBlocked(x, z, this.data.scene, this.data.layout),
        this.moving,
      );
      return;
    }
    this.roomSpace = this.interior.collision();
    this.roomSpace.boxes = bodies
      .filter((b) => b.name !== "room-wall")
      .map((b) => ({
        minX: b.minX,
        maxX: b.maxX,
        minZ: b.minZ,
        maxZ: b.maxZ,
        minY: b.base ?? 0,
        maxY: b.height,
        canStep: false,
        source: b.name,
      }));
  }
  obstacles() {
    return this.collisionCache.view(this.moving);
  }
  private renderObjects() {
    for (const root of this.userRoots.values()) root.removeFromParent();
    this.userRoots.clear();
    for (const p of this.objects) {
      const root = this.library.create(p.asset, p.scale);
      root.position.set(
        p.x,
        this.interior
          ? (p.y ?? 0)
          : walkHeight(p.x, p.z, this.data.scene, this.data.layout),
        p.z,
      );
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
    const fade =
      name.startsWith("Jump") || this.currentAnimation.startsWith("Jump")
        ? 0.1
        : 0.24;
    this.actions.get(this.currentAnimation)?.fadeOut(fade);
    action.reset().fadeIn(fade).play();
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
    if (
      !this.interior &&
      this.landscape instanceof ConnectedLandscape &&
      this.landscape.updateLodge(dt, this.player)
    ) {
      this.rebuildObstacles();
      this.sun.shadow.needsUpdate = true;
    }
    if (!this.interior) {
      this.trySpawnWildlife();
      this.wildlife?.update(dt);
    }
    this.refreshRoomPhysics();
    const previousX = this.player.x,
      previousZ = this.player.z,
      previousY = this.player.y,
      jump = this.controls.consumeJump();
    if (jump && this.player.grounded) this.jumpActive = true;
    moveCharacter(
      this.player,
      { vx: this.velocity.x, vz: this.velocity.y, jump },
      dt,
      (this.interior ? this.roomSpace : this.outdoorSpace)!,
    );
    if (this.player.grounded) this.lastFooting = { ...this.player };
    if (this.player.y !== previousY) this.dirty = true;
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
    if (this.jumpActive && this.player.grounded) {
      this.jumpActive = false;
      this.landingTime = 0.12;
    }
    const animation = this.jumpActive
      ? this.player.vy > 2
        ? "Jump_Start"
        : "Jump_Idle"
      : this.landingTime > 0 && !moving
        ? "Jump_Land"
        : moving
          ? input.run
            ? "Running_A"
            : "Walking_A"
          : "Idle";
    this.landingTime = Math.max(0, this.landingTime - dt);
    this.animate(animation);
    this.actions
      .get("Walking_A")
      ?.setEffectiveTimeScale(Math.max(0.7, travelledSpeed / 3.05));
    this.mixer.update(dt);
    if (this.pending && (!this.selection || this.moving)) this.updateGhost();
  }
  private cameraUpdate(dt: number) {
    if (this.debugCamera) return;
    const lodge =
      this.landscape instanceof ConnectedLandscape
        ? this.landscape.lodge
        : undefined;
    const inside = !!this.interior || !!lodge?.inside(this.player);
    if (this.interior?.cutaway(this.player, this.cameraYaw))
      this.sun.shadow.needsUpdate = true;
    if (this.interior) {
      for (const p of this.objects) {
        const root = this.userRoots.get(p.id);
        if (root)
          root.visible =
            p.id !== this.moving && ((p.y ?? 0) < 2 || this.player.y > 1.35);
      }
      if (
        this.selection &&
        !this.userRoots.get(this.selection)?.visible &&
        !this.pending
      )
        this.cancelEdit();
    }
    if (!this.interior) lodge?.setCutaway(this.player, this.cameraYaw);
    const pitch = inside ? Math.max(this.cameraPitch, 0.78) : this.cameraPitch;
    const target = new T.Vector3(
        this.interior ? this.player.x * 0.45 : this.player.x,
        this.player.y + 1.35,
        this.interior ? this.player.z * 0.65 : this.player.z,
      ),
      offset = new T.Vector3(
        Math.sin(this.cameraYaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(this.cameraYaw) * Math.cos(pitch),
      ).multiplyScalar(
        this.distance *
          (this.interior ? Math.max(1, 0.85 / this.camera.aspect) : 1),
      ),
      desired = target.clone().add(offset);
    const allBodies = this.obstacles();
    if (this.interiorBodySource !== allBodies) {
      this.interiorBodySource = allBodies;
      this.outdoorCameraBodies = [
        ...allBodies.filter((b) => !meshBuilding(b.name)),
        ...this.landscape.cameraBodies,
      ];
      this.interiorCameraBodies = this.outdoorCameraBodies.filter(
        (b) =>
          !b.name?.startsWith("lodge") && !b.name?.startsWith("furniture-"),
      );
    }
    const bodies = this.interior
      ? this.obstacles().filter(
          (b) =>
            b.name !== "room-wall" &&
            (b.base ?? 0) <= this.player.y + 1 &&
            b.height > this.player.y + 0.05,
        )
      : inside
        ? this.interiorCameraBodies
        : this.outdoorCameraBodies;
    const roof = lodge && !inside ? lodge.exteriorCameraBodies : [];
    const fraction = Math.min(
      cameraFraction(target, offset, bodies),
      cameraFraction(target, offset, roof),
      this.interior ? 1 : this.outdoorSpace!.cameraFraction(target, offset),
    );
    desired.copy(target).addScaledVector(offset, fraction);
    desired.y = Math.max(
      desired.y,
      (this.interior
        ? this.player.y
        : walkHeight(desired.x, desired.z, this.data.scene, this.data.layout)) +
        0.45,
    );
    if (this.cameraPosition.lengthSq() === 0) this.cameraPosition.copy(desired);
    else
      this.cameraPosition.lerp(
        desired,
        1 - Math.exp(-dt * (fraction < 1 ? 30 : 7)),
      );
    // Recheck the interpolated position: two clear endpoints can cut through a corner.
    const interpolated = this.cameraPosition.clone().sub(target),
      actualFraction = Math.min(
        cameraFraction(target, interpolated, bodies),
        cameraFraction(target, interpolated, roof),
        this.interior
          ? 1
          : this.outdoorSpace!.cameraFraction(target, interpolated),
      );
    if (actualFraction < 1)
      this.cameraPosition
        .copy(target)
        .addScaledVector(interpolated, actualFraction);
    this.camera.position.copy(this.cameraPosition);
    this.camera.lookAt(target);
    // A nearby wall or crown can pull the camera beside the face. Keep the view clear.
    this.actor.visible =
      Math.hypot(
        this.camera.position.x - this.player.x,
        this.camera.position.y - this.player.y - 1.35,
        this.camera.position.z - this.player.z,
      ) > 2.8;
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
    if (!this.interior && this.landscape instanceof ConnectedLandscape)
      this.landscape.updateVisibility(
        this.camera,
        (this.scene.fog as T.Fog).far,
        !this.renderer.shadowMap.enabled,
      );
    this.wildlife?.visibility(
      this.camera,
      (this.scene.fog as T.Fog).far,
      !this.interior,
    );
    this.renderer.render(this.scene, this.camera);
  }
  private frame(time: number) {
    const elapsed = (time - this.last) / 1000,
      dt = Math.min(0.05, elapsed);
    this.last = time;
    if (!document.hidden) {
      this.controls.pollGamepad(dt);
      if (!this.modalOpen) {
        this.update(dt);
        this.cameraUpdate(dt);
        this.renderScene();
      }
      this.worldMap.update(this.mapPose(), time);
      if (!this.modalOpen) {
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
      } else {
        this.frames = 0;
        this.statsTime = time;
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
      this.near = null;
      this.entryNear = null;
      $("context").hidden = true;
      return;
    }
    this.entryNear = null;
    if (this.interior) {
      this.near = null;
      const exit =
        this.player.y < 0.4 &&
        Math.hypot(
          this.player.x,
          this.player.z - this.interior.entry.depth / 2,
        ) < 2.3;
      $("context").hidden = !exit;
      $("contextLabel").textContent = "Back outside";
      $("interact").innerHTML = "Exit <kbd>E</kbd>";
      return;
    }
    const entries = [...this.landscape.entrances];
    for (const p of this.data.objects) {
      const root = this.userRoots.get(p.id);
      if (root) {
        const e = buildingEntry(this.library, p.asset, root, "placed:" + p.id);
        if (e) entries.push(e);
      }
    }
    this.entryNear =
      entries
        .filter(
          (e) =>
            entryDistance(e, this.player) < 2.25 &&
            !blocked(e.x, e.z, this.obstacles(), 0.34),
        )
        .sort(
          (a, b) =>
            Math.hypot(a.x - this.player.x, a.z - this.player.z) -
            Math.hypot(b.x - this.player.x, b.z - this.player.z),
        )[0] || null;
    if (this.entryNear) {
      this.near = null;
      $("context").hidden = false;
      $("contextLabel").textContent = this.entryNear.name;
      $("interact").innerHTML = "Enter <kbd>E</kbd>";
      return;
    }
    this.near =
      this.landscape.landmarks
        .filter(
          (l) =>
            Math.hypot(l.x - this.player.x, l.z - this.player.z) <
            (l.action ? 2.8 : 4.5),
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
        this.near.action === "door"
          ? `${this.landscape instanceof ConnectedLandscape && this.landscape.lodge?.open ? "Close" : "Open"} door <kbd>E</kbd>`
          : `${this.data.discoveries.includes(this.near.id) ? "Read" : "Discover"} <kbd>E</kbd>`;
    }
  }
  private discover() {
    if (!this.enabled()) return;
    this.updateContext();
    if (this.interior) {
      if (!$("context").hidden) void this.leaveRoom();
      return;
    }
    if (this.entryNear) {
      void this.enterRoom(this.entryNear);
      return;
    }
    if (!this.near) return;
    const l = this.near;
    if (
      l.action === "door" &&
      this.landscape instanceof ConnectedLandscape &&
      this.landscape.lodge
    ) {
      const error = this.landscape.lodge.toggle(
        this.player,
        this.obstacles().filter((o) => !!(o as OwnedObstacle).ownerId),
      );
      if (error) {
        this.toast(error);
        return;
      }
      this.data.doors = { lodge: this.landscape.lodge.open };
      this.dirty = true;
      this.rebuildObstacles();
      this.sun.shadow.needsUpdate = true;
      this.updateContext();
      return;
    }
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
      `${this.data.discoveries.length} / ${this.landscape.landmarks.filter((l) => !l.action).length}`;
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
    if (this.started && !this.busy && this.modalOpen && !this.worldMap.open)
      this.renderScene();
  }
  private bind() {
    $("minimap").onclick = () => this.openWorldMap();
    bindButton($("mapClose"), () => this.closeWorldMap());
    bindButton($("mapPlus"), () => this.worldMap.zoom(1.35));
    bindButton($("mapMinus"), () => this.worldMap.zoom(1 / 1.35));
    bindButton($("mapFit"), () => this.worldMap.fit());
    bindButton($("mapHome"), () => {
      const world = WORLDS.find((w) => w.id === this.data.scene)!;
      this.travelTo({ id: "home", name: world.name, ...world.spawn });
    });
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
      this.updateContext();
      this.toast("The world is yours to wander. Follow the old road.");
    };
    $("places").onclick = () => void this.places();
    $("menu").onclick = () => this.menu();
    $("build").onclick = () => this.catalogue();
    bindButton($("interact"), () => this.discover());
    $("run").onclick = () => {
      this.controls.running = !this.controls.running;
      $("run").setAttribute("aria-pressed", String(!this.controls.running));
      this.storePreferences();
    };
    $("jump").addEventListener("pointerdown", (e) => {
      e.preventDefault();
      void this.requestJump();
    });
    $("jump").onclick = (e) => {
      if (e.detail === 0) void this.requestJump();
    };
    $("editCancel").onclick = () => this.cancelEdit();
    $("editRotate").onclick = () => {
      if (this.pending) {
        this.pending.yaw += Math.PI / 4;
        this.ghost!.rotation.y = this.pending.yaw;
        this.validateGhost();
      } else if (this.selection) {
        const p = this.objects.find((p) => p.id === this.selection)!,
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
    $("editMove").onclick = () => {
      if (this.pending && this.placementAnchor) {
        this.placementAnchor = null;
        $("editMove").hidden = true;
        this.updateGhost();
      } else this.moveSelected();
    };
  }
  private async requestJump() {
    if (
      !this.enabled() ||
      this.pending ||
      this.upgradingJump ||
      !this.player.grounded
    )
      return;
    this.upgradingJump = true;
    try {
      if (this.data.version < 3) {
        await this.session.copyForRooms(3);
        this.data.version = 3;
        this.data.rooms ||= {};
        await this.session.save();
        this.toast(
          "Original world kept. Movement is saved in an updated copy.",
        );
      }
      this.controls.requestJump();
    } catch (e) {
      this.toast(`Jump copy could not be saved: ${(e as Error).message}`);
    } finally {
      this.upgradingJump = false;
    }
  }
  private key(code: string) {
    if (this.busy || this.transitioning) return;
    if (!this.started) {
      if (code === "Enter" && !$<HTMLButtonElement>("enter").disabled)
        $("enter").click();
      return;
    }
    if (code === "PadMenu") {
      this.worldMap.open
        ? this.closeWorldMap()
        : this.modalOpen
          ? this.closeModal()
          : this.menu();
      return;
    }
    if (code === "PadMap") {
      this.worldMap.open ? this.closeWorldMap() : this.openWorldMap();
      return;
    }
    if (code === "Space" || code === "PadJump") {
      void this.requestJump();
      return;
    }
    if (code === "PadRun") {
      if (this.enabled()) $("run").click();
      return;
    }
    if (
      code.startsWith("Pad") &&
      ["PadUp", "PadDown", "PadLeft", "PadRight"].includes(code)
    ) {
      this.padFocus(code);
      return;
    }
    if (code === "Enter") {
      if (!this.started) {
        if (!$<HTMLButtonElement>("enter").disabled) $("enter").click();
        return;
      }
      const focused = document.activeElement as HTMLElement;
      if (this.modalOpen || focused?.closest("#editBar")) {
        if (focused instanceof HTMLSelectElement) {
          if (focused.value)
            focused.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (
          (focused instanceof HTMLButtonElement ||
            focused.tagName === "SUMMARY") &&
          !(focused as HTMLButtonElement).disabled &&
          !focused.hidden
        )
          focused.click();
        return;
      }
      if (this.pending) this.confirmEdit();
      else if (
        this.near ||
        this.entryNear ||
        (this.interior && !$("context").hidden)
      )
        this.discover();
      else if (this.selection) this.moveSelected();
      else this.tap(innerWidth / 2, innerHeight / 2);
      return;
    }
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

    if (code === "KeyZ") this.undo();
  }
  private padFocus(code: string) {
    const root = this.worldMap.open
      ? $("mapOverlay")
      : this.modalOpen
        ? $("modal")
        : !$("editBar").hidden
          ? $("editBar")
          : null;
    if (!root) return;
    const focused = document.activeElement;
    if (
      focused instanceof HTMLSelectElement &&
      (code === "PadLeft" || code === "PadRight")
    ) {
      const n = focused.options.length;
      focused.selectedIndex =
        (focused.selectedIndex + (code === "PadRight" ? 1 : -1) + n) % n;
      return;
    }
    const items = [
      ...root.querySelectorAll<HTMLElement>(
        "button,select,input,textarea,summary",
      ),
    ].filter((e) => e.offsetParent !== null && !e.hasAttribute("disabled"));
    if (!items.length) return;
    const current = items.indexOf(focused as HTMLElement),
      delta = code === "PadUp" || code === "PadLeft" ? -1 : 1;
    items[
      current < 0 ? 0 : (current + delta + items.length) % items.length
    ].focus();
  }
  private openModal(content: string) {
    if (this.transitioning) return;
    if (this.worldMap.open) this.closeWorldMap();
    this.modalOpen = true;
    this.controls.clear();
    this.updateContext();
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
    this.updateContext();
  }
  async places() {
    if (this.transitioning) return;
    this.cancelEdit();
    try {
      await this.session.save();
      const records = (await this.session.store.list()).sort(
        (a, b) => b.updated - a.updated,
      );
      this.openModal(
        `<div class="eyebrow">TAKE THE LONG WAY HOME</div><h1 id="modalTitle">Where shall we go?</h1><p>Explore a saved valley, or start a fresh valley with Oakfield. Earlier scenery stays with its saved world.</p><div class="placeCards">${WORLDS.filter(
          (w) => w.id === "vale",
        )
          .map(
            (w) =>
              `<button class="placeCard ${w.id}" data-scene="${w.id}"><span class="sceneIcon">${w.icon}</span><small>${w.tag}</small><strong>${w.name}</strong><span>${w.description}</span><b>Explore →</b></button>`,
          )
          .join(
            "",
          )}</div><div class="savedWorlds"><h2>Your saved worlds & earlier previews</h2><div id="savedRows"></div></div><details class="newPlaces"><summary>Start a fresh place</summary><p>Fresh valleys include Oakfield’s garden village and Foxglade’s ranger cottage and woodland clearing, plus Miller’s End, Reedbank and Alderwick. Your saved valleys keep their scenery and buildings.</p><div id="newPlaceButtons"></div></details><p class="finePrint">Earlier independent places keep their original scenery and saves. Original BlockWorld worlds remain in the original game.</p>`,
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
        fresh.textContent = "New " + w.name + " · Oakfield";
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
        let scenery = "";
        try {
          const saved = validateAdventure(JSON.parse(r.current.json));
          if (saved.scene === "vale")
            scenery =
              saved.layout === 9
                ? " · Oakfield"
                : saved.layout === 8
                  ? " · Foxglade"
                  : saved.layout === 7
                    ? " · Miller’s End"
                    : saved.layout === 6
                      ? " · Reedbank"
                      : saved.layout === 5
                        ? " · Alderwick"
                        : " · earlier scenery";
        } catch {}
        button.textContent =
          (r.id === this.session.current?.id ? "● " : "") + r.name + scenery;
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
    if (this.transitioning) return;
    this.openModal(
      `<div class="eyebrow">BLOCKWORLD ADVENTURES</div><h1 id="modalTitle">Make yourself at home.</h1><p>Move with WASD or the left joystick. Drag the world to turn the camera. Running is the default. Tap Walk for a slower pace; hold Shift to run while walking. Press Space or tap Jump to jump. Scroll or pinch to change the camera distance.</p><div class="menuGrid"><button id="resume" class="primary">Back to the world →</button><button id="home">Return to a clear starting point</button><button id="backup">Export backup</button><label class="fileButton">Import backup<input id="import" type="file" accept=".bw2,.json,application/json"></label><button id="recover">Save a new copy</button><button id="undo">Undo last edit</button><button id="redo">Redo edit</button><button id="performance">Show performance</button></div><label class="qualityLabel">Graphics <select id="quality"><option value="gentle">Gentle · fewer pixels, no shadows</option><option value="balanced">Balanced · soft shadows</option><option value="high">High · sharper image</option></select></label><details id="controllerHelp"><summary>Xbox-style controller controls</summary><p>Press a controller button after your browser connects it. Left stick moves; right stick looks. A interacts, selects or places; B goes back. X opens Build; Y interacts; right bumper rotates; left-stick click toggles Walk; left bumper jumps. View opens the map and Menu opens this menu.</p><p>Use the D-pad to move between menu or building buttons, then A to choose. On the map, left stick pans and right stick up/down zooms. The Travel to list changes with D-pad left/right; A travels. Release sticks and buttons after opening a menu or reconnecting. Touch and keyboard remain available.</p></details><details><summary>Backup text and asset credits</summary><p>If a download is unavailable, copy this text to a file and keep it safe.</p><textarea id="backupText" readonly aria-label="Backup JSON text"></textarea><button id="copy">Copy backup text</button><p>Village & character: Kay Lousberg / KayKit. Nature & furniture: Kenney. Meadow Lodge modules: Quaternius (Standard FREE). CC0 public domain. Fox: PixelMannen (CC0 model); tomkranis (rig/animation), AsoboStudio/scurest (glTF conversion), CC BY 4.0. <a href="adventures/wildlife/PROVENANCE.md" target="_blank">Fox credits and licence</a>. <a href="adventures/PROVENANCE.md" target="_blank">Source and licence details</a>.</p><p>Development preview ${PREVIEW_VERSION}. Cottages, town houses, inns, workshops and millhouses have separate furnished rooms. Town houses, inns and millhouses have walkable stairs. New cottages and workshops have one floor. Older saved upper floors stay intact. Older saved worlds keep their original record when new features need an updated copy. New Oakfield worlds need Preview 16 or later. Earlier Foxglade worlds need Preview 14 or later. Compact windmill copies need Preview 13 or later. Existing older rooms stay as saved. The Meadow Lodge keeps its opening door. Physical tablet and iPhone performance has not been tested.</p></details><p id="menuError" role="alert"></p>`,
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
      a.download = `BlockWorld-Adventures-${this.data.scene}-preview${PREVIEW_VERSION}.bw2`;
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
    if (this.started && !this.busy && this.modalOpen && !this.worldMap.open)
      this.renderScene();
    this.storePreferences();
  }
  private catalogue() {
    if (this.transitioning) return;
    this.cancelEdit();
    this.openModal(
      `<div class="eyebrow">A PLACE OF YOUR OWN</div><h1 id="modalTitle">What will you make?</h1><p>Choose something, tap nearby ground to position it, then choose Place.</p><div class="catalogueFilters" role="group" aria-label="Filter building assets">${["All", ...new Set(BUILD_CHOICES.map((item) => item.group))].map((name, i) => `<button data-category="${name}" aria-pressed="${i === 0}">${name}</button>`).join("")}</div><div class="assetGrid">${BUILD_CHOICES.map((item) => `<button data-asset="${item.id}" data-group="${item.group}" aria-label="Place ${item.name}"><img src="${import.meta.env.BASE_URL}adventures/thumbnails/${item.id}.png" alt="" loading="lazy" width="256" height="192"><span class="assetLabel">${item.name}</span></button>`).join("")}</div><p class="finePrint">Walk or turn to aim ahead until you choose ground. Tap your own object to move, rotate or remove it.</p>`,
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
            (!!this.interior &&
              DEFINITIONS.get(asset.dataset.asset!)?.category !== "prop") ||
            (filter.dataset.category !== "All" &&
              asset.dataset.group !== filter.dataset.category);
      };
    for (const button of $("modal").querySelectorAll<HTMLButtonElement>(
      "[data-asset]",
    )) {
      if (
        this.interior &&
        DEFINITIONS.get(button.dataset.asset!)?.category !== "prop"
      )
        button.hidden = true;
      button.onclick = () => {
        this.closeModal();
        this.beginPlacement(button.dataset.asset!);
      };
    }
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
    if (this.transitioning) return;
    if (this.interior && DEFINITIONS.get(asset)?.category !== "prop") {
      this.toast("Choose furniture or a small prop for this room");
      return;
    }
    this.cancelEdit();
    if (!existing && this.objects.length >= 200) {
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
          ...(this.interior ? { y: this.player.y > 1.5 ? 3 : 0 } : {}),
        };
    this.moving = existing?.id || null;
    this.refreshRoomPhysics();
    this.sun.shadow.needsUpdate = true;
    if (existing) this.userRoots.get(existing.id)!.visible = false;
    this.ghost = this.library.create(asset, this.pending.scale);
    this.ghost.traverse((o) => {
      if (o instanceof T.Mesh) {
        const originals = Array.isArray(o.material) ? o.material : [o.material];
        this.originalMaterials.set(o, o.material);
        const previews = originals.map((m) => {
          const clone = m.clone();
          clone.transparent = true;
          clone.opacity = 0.55;
          clone.depthWrite = false;
          return clone;
        });
        o.material = Array.isArray(o.material) ? previews : previews[0];
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
    this.updateContext();
    this.toast("Tap nearby ground to position · Place to keep it");
  }
  private updateGhost() {
    if (!this.pending || !this.ghost) return;
    // Aim-ahead previews follow the current floor once the player reaches a landing.
    // Pinned previews retain their exact floor until Aim ahead is chosen again.
    if (this.interior && !this.placementAnchor) {
      if (this.player.y < 0.1) this.pending.y = 0;
      else if (this.player.y > 2.9) this.pending.y = 3;
    }
    const box = this.library.bounds.get(this.pending.asset)!,
      radius =
        (Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) *
          this.pending.scale) /
        2;
    const d = Math.max(
      this.pending.asset.startsWith("building")
        ? 9
        : this.pending.asset.startsWith("furniture-")
          ? 2.8
          : 4.5,
      radius + 0.9,
    );
    this.pending.x =
      this.placementAnchor?.x ??
      Math.round((this.player.x - Math.sin(this.cameraYaw) * d) * 2) / 2;
    this.pending.z =
      this.placementAnchor?.z ??
      Math.round((this.player.z - Math.cos(this.cameraYaw) * d) * 2) / 2;
    this.ghost.position.set(
      this.pending.x,
      this.floorHeight(this.pending.x, this.pending.z),
      this.pending.z,
    );
    this.ghost.rotation.y = this.pending.yaw;
    this.validateGhost();
  }
  private placementProblem(p: Placement, root: T.Object3D) {
    if (
      this.pending &&
      Math.hypot(p.x - this.player.x, p.z - this.player.z) >
        this.placementReach(p)
    )
      return "Move closer to the object";
    if (this.interior) return this.roomPlacementProblem(p, root);
    if (!inWorld(p.x, p.z, this.data.scene, 4))
      return "Keep inside the explored landscape";
    if (waterBlocked(p.x, p.z, this.data.scene, this.data.layout))
      return "Keep the water clear";
    if (
      this.landscape.nearPath(p.x, p.z, p.asset.startsWith("building") ? 4 : 1)
    )
      return "Keep paths and entrances clear";
    const b = this.objectBox(root, p.asset);
    if (b) {
      const groundError = footprintGroundProblem(b, root.position.y, {
        inside: (x, z) => inWorld(x, z, this.data.scene, 0.1),
        water: (x, z) => waterBlocked(x, z, this.data.scene, this.data.layout),
        path: (x, z) => this.landscape.nearPath(x, z, 0.35),
        height: (x, z) => walkHeight(x, z, this.data.scene, this.data.layout),
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
      this.pending.y ?? 0,
      this.interior ? this.player.y.toFixed(2) : "",
      this.placementAnchor ? this.player.x.toFixed(2) : "",
      this.placementAnchor ? this.player.z.toFixed(2) : "",
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
      this.objects = this.objects.filter((p) => p.id !== this.moving);
    this.objects.push({ ...this.pending });
    this.cancelEdit(false);
    this.renderObjects();
    this.dirty = true;
    this.toast("Placed. Tap your object to edit it.");
  }
  private cancelEdit(recoverOriginal = true) {
    const restoring = !!this.moving && recoverOriginal;
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
    this.placementAnchor = null;
    $("editMove").setAttribute("aria-label", "Move selected object");
    $("editMove").querySelector("span")!.textContent = "Move";
    this.moving = null;
    this.refreshRoomPhysics();
    this.sun.shadow.needsUpdate = true;
    if (restoring && this.landscape) {
      const before = { ...this.player };
      this.safeSpawn();
      if (
        before.x !== this.player.x ||
        before.y !== this.player.y ||
        before.z !== this.player.z
      ) {
        this.velocity.set(0, 0);
        this.actor?.position.set(this.player.x, this.player.y, this.player.z);
        this.contactShadow.position.set(
          this.player.x,
          this.player.y + 0.025,
          this.player.z,
        );
        this.cameraPosition.set(0, 0, 0);
        this.cameraUpdate(1 / 60);
        this.worldMap.update(this.mapPose(), performance.now(), true);
        this.renderScene();
        this.dirty = true;
      }
    }
    this.selection = null;
    this.selectionOutline.visible = false;
    document.body.classList.remove("editing");
    $("editBar").hidden = true;
    this.updateContext();
  }
  private tap(x: number, y: number) {
    const ray = new T.Raycaster();
    ray.setFromCamera(
      new T.Vector2((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2),
      this.camera,
    );
    if (this.pending) {
      this.targetPlacement(ray.ray);
      return;
    }
    const hit = ray.intersectObjects([...this.userRoots.values()], true)[0];
    if (hit && this.pickOccluded(ray.ray, hit.distance, false)) {
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
      this.objects.find((p) => p.id === this.selection)!.asset,
    );
    $("editMove").hidden = false;
    $("editRemove").hidden = false;
    $("editConfirm").hidden = true;
  }
  private placementReach(p: Placement) {
    const box = this.library.bounds.get(p.asset)!,
      radius =
        (Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) * p.scale) /
        2;
    return Math.max(p.asset.startsWith("building") ? 18 : 8, radius + 4);
  }
  private pickOccluded(ray: T.Ray, distance: number, includeBuilt: boolean) {
    const lodge =
        this.landscape instanceof ConnectedLandscape
          ? this.landscape.lodge
          : undefined,
      bodies = this.interior
        ? (includeBuilt ? this.obstacles() : this.interior.obstacles).filter(
            (b) =>
              b.name !== "room-wall" &&
              (b.base ?? 0) < this.player.y + 1 &&
              b.height > this.player.y + 0.05,
          )
        : includeBuilt
          ? this.obstacles()
          : this.landscape.obstacles,
      blocks = (body: Obstacle) => {
        if (lodge && !lodge.isVisibleOccluder(body)) return false;
        return (
          rayBoxDistance(ray.origin, ray.direction, body, 0.01) <
          distance - 0.05
        );
      };
    return bodies.some(blocks) || !!lodge?.exteriorCameraBodies.some(blocks);
  }
  private targetPlacement(ray: T.Ray) {
    if (!this.pending) return;
    const target = groundTarget(ray.origin, ray.direction, (x, z) =>
      this.floorHeight(x, z),
    );
    if (
      !target ||
      Math.hypot(target.x - this.player.x, target.z - this.player.z) >
        this.placementReach(this.pending)
    ) {
      this.toast("Choose nearby ground in view");
      return;
    }
    const distance = ray.origin.distanceTo(
      new T.Vector3(target.x, target.y, target.z),
    );
    if (this.pickOccluded(ray, distance, true)) {
      this.toast("Choose clear ground you can see");
      return;
    }
    const grid = this.pending.asset.startsWith("furniture-") ? 4 : 2;
    this.placementAnchor = {
      x: Math.round(target.x * grid) / grid,
      z: Math.round(target.z * grid) / grid,
    };
    $("editMove").hidden = false;
    $("editMove").setAttribute("aria-label", "Move object in front of me");
    $("editMove").querySelector("span")!.textContent = "Aim ahead";
    this.updateGhost();
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
    const p = this.objects.find((p) => p.id === this.selection)!;
    this.beginPlacement(p.asset, p);
  }
  private removeSelected() {
    if (!this.selection) return;
    this.checkpoint();
    this.objects = this.objects.filter((p) => p.id !== this.selection);
    this.cancelEdit();
    this.renderObjects();
    this.dirty = true;
    this.toast("Object removed. Undo is available in the menu.");
  }
  private checkpoint() {
    this.history.push(structuredClone(this.objects));
    if (this.history.length > 30) this.history.shift();
    this.redoHistory = [];
  }
  private undo() {
    const previous = this.history.pop();
    if (!previous) {
      this.toast("Nothing to undo");
      return;
    }
    this.redoHistory.push(structuredClone(this.objects));
    this.objects = previous;
    this.cancelEdit(false);
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
    this.history.push(structuredClone(this.objects));
    this.objects = next;
    this.cancelEdit(false);
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
      objects: this.objects.length,
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
        lodge: { position: [128, 5, -29], target: [128, 2, -42] },
        lodgeRoom: { position: [128, 3.2, -39.4], target: [128, 1.1, -43] },
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
