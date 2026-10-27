import * as T from "three";
import {
  COMMON,
  SPECIAL,
  ITEMS,
  HOME,
  HEIGHT,
  MAX_BLOCKS,
  clamp,
  key,
  cellBox,
  bodyBox,
  overlaps,
  collides,
  freshState,
  movePlayer,
  placementReason,
  validateSave,
  BuildHistory,
} from "./core.js";
import { makeWorld, doorBox } from "./world.js";
import { icons, names } from "./icons.js";
import { Voice } from "./dialogue.js";
import { blockTexture } from "./textures.js";
import { installTouchButtons } from "./touch-buttons.js";
const $ = (id) => document.getElementById(id),
  SAVE_KEY = "blockworld.neighborhood.01",
  bootStart = performance.now();
function fail(message) {
  $("fatal").hidden = false;
  $("fatalMessage").textContent = message;
  $("welcome").hidden = true;
}
let renderer;
try {
  renderer = new T.WebGLRenderer({
    canvas: $("world"),
    antialias: false,
    powerPreference: "low-power",
  });
} catch (e) {
  fail(
    "This browser could not start WebGL. Try opening the downloaded HTML in recent Chrome.",
  );
  throw e;
}
const scene = new T.Scene();
scene.background = new T.Color(0xb5d9df);
scene.fog = new T.Fog(0xb5d9df, 42, 93);
scene.add(new T.HemisphereLight(0xfff7df, 0x6a8970, 2.3));
const sun = new T.DirectionalLight(0xffe5b1, 1.9);
sun.position.set(-25, 40, 18);
scene.add(sun);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.setPixelRatio(Math.min(devicePixelRatio, 1));
renderer.setSize(innerWidth, innerHeight);
const camera = new T.PerspectiveCamera(67, innerWidth / innerHeight, 0.06, 110);
camera.rotation.order = "YXZ";
const world = makeWorld(scene);
let state = freshState(),
  player = { ...HOME, vy: 0, grounded: true },
  history = new BuildHistory(),
  started = false,
  modal = "welcome",
  building = false,
  target = null,
  aim = null,
  saveOK = true,
  dirty = false,
  lastSave = 0,
  lastRebuild = 0,
  lastStats = {},
  highQuality = false;
let saveTimer;
const keys = new Set(),
  stick = { x: 0, y: 0 };
let joyPointer = null,
  lookPointer = null,
  lastLook = null,
  totalLook = 0,
  returnFocus = null;
const dynamicGroup = new T.Group();
scene.add(dynamicGroup);
let dynamicRayMeshes = [];
const commonGeometry = new T.BoxGeometry(1, 1, 1);
const paletteColors = {
  wood: 0xbd9567,
  brick: 0xc78264,
  stone: 0x9ca9a5,
  glass: 0x9bcbd0,
  flowers: 0xdd9b83,
  lantern: 0xe9be66,
  bench: 0xab7a50,
};
const buildMaterials = Object.fromEntries(
  ITEMS.map((t) => [
    t,
    new T.MeshLambertMaterial(
      COMMON.includes(t)
        ? { map: blockTexture(t) }
        : { color: paletteColors[t] },
    ),
  ]),
);
const decorMaterials = new Map();
function decorMat(c) {
  if (!decorMaterials.has(c))
    decorMaterials.set(c, new T.MeshLambertMaterial({ color: c }));
  return decorMaterials.get(c);
}
function notice(text) {
  $("toast").textContent = text;
  $("toast").style.opacity = 1;
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => ($("toast").style.opacity = 0), 3600);
}
const voice = new Voice(notice);
function syncPlayer() {
  state.player = {
    x: player.x,
    y: player.y,
    z: player.z,
    yaw: player.yaw,
    pitch: player.pitch,
  };
  for (const d of world.doors) state.doors[d.id] = d.open;
}
function save() {
  clearTimeout(saveTimer);
  syncPlayer();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    saveOK = true;
    $("saved").textContent = "Saved ✓";
    $("saveStatus").textContent =
      "Progress saved on this browser. Export a backup to keep it safe.";
  } catch {
    saveOK = false;
    $("saved").textContent = "Export to save";
    $("saveStatus").textContent =
      "This browser cannot save here. Use Export save before closing.";
  }
  dirty = false;
  lastSave = performance.now();
  return saveOK;
}
function scheduleSave() {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 350);
}
let solidCache = [];
function rebuildSolids() {
  solidCache = [
    ...world.solids,
    ...world.doors.map((d) => doorBox(d)),
    ...state.blocks.map(cellBox),
  ];
}
function applyState(next) {
  state = next;
  player = { ...state.player, vy: 0, grounded: state.player.y === 0 };
  for (const d of world.doors) {
    d.open = state.doors[d.id] === true;
    d.pivot.rotation.y = d.baseAngle + (d.open ? -Math.PI / 2 : 0);
  }
  history = new BuildHistory();
  rebuildSolids();
  if (collides(player, solidCache)) player = { ...HOME, vy: 0, grounded: true };
  rebuildPieces();
  updatePalette();
}
function restore() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    saveOK = false;
  }
  if (raw) {
    try {
      applyState(validateSave(JSON.parse(raw), world.solids));
    } catch {
      notice(
        "The last save could not be read. Your exported backups can still be imported.",
      );
      applyState(freshState());
    }
  } else applyState(state);
}
function rebuildPieces() {
  const start = performance.now();
  dynamicGroup.traverse((m) => {
    if (m.isInstancedMesh) m.dispose();
  });
  dynamicGroup.clear();
  dynamicRayMeshes = [];
  // One cube draw call per material. Geometry/materials are shared, never rebuilt per frame.
  const dummy = new T.Object3D();
  for (const type of COMMON) {
    const blocks = state.blocks.filter((b) => b.type === type);
    if (!blocks.length) continue;
    const mesh = new T.InstancedMesh(
      commonGeometry,
      buildMaterials[type],
      blocks.length,
    );
    blocks.forEach((b, i) => {
      dummy.position.set(b.x + 0.5, b.y + 0.5, b.z + 0.5);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.userData.blocks = blocks;
    mesh.computeBoundingSphere();
    dynamicGroup.add(mesh);
    dynamicRayMeshes.push(mesh);
  }
  for (const b of state.blocks.filter((b) => SPECIAL.includes(b.type))) {
    const group = new T.Group();
    group.position.set(b.x, b.y, b.z);
    dynamicGroup.add(group);
    const box = (x, y, z, w, h, d, c) => {
      const mesh = new T.Mesh(commonGeometry, decorMat(c));
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      mesh.userData.block = b;
      group.add(mesh);
      dynamicRayMeshes.push(mesh);
    };
    if (b.type === "flowers") {
      box(0.5, 0.16, 0.5, 0.6, 0.32, 0.6, 0xb47a50);
      box(0.5, 0.48, 0.5, 0.06, 0.64, 0.06, 0x568859);
      box(0.5, 0.78, 0.5, 0.46, 0.18, 0.46, 0xdd9b83);
      box(0.5, 0.89, 0.5, 0.18, 0.06, 0.18, 0xf5d47b);
    }
    if (b.type === "lantern") {
      box(0.5, 0.06, 0.5, 0.55, 0.12, 0.55, 0x5f746e);
      box(0.5, 0.46, 0.5, 0.4, 0.7, 0.4, 0xf6ce73);
      box(0.5, 0.87, 0.5, 0.6, 0.12, 0.6, 0x5f746e);
      for (const x of [0.27, 0.73])
        for (const z of [0.27, 0.73])
          box(x, 0.46, z, 0.06, 0.75, 0.06, 0x5f746e);
    }
    if (b.type === "bench") {
      box(0.5, 0.47, 0.5, 0.94, 0.12, 0.64, 0xad7c50);
      box(0.5, 0.77, 0.77, 0.94, 0.4, 0.1, 0xad7c50);
      for (const x of [0.12, 0.88])
        for (const z of [0.25, 0.72]) box(x, 0.22, z, 0.1, 0.44, 0.1, 0x66766a);
    }
  }
  dynamicGroup.updateMatrixWorld(true);
  rebuildSolids();
  lastRebuild = performance.now() - start;
}
const ghost = new T.Mesh(
  new T.BoxGeometry(1.015, 1.015, 1.015),
  new T.MeshBasicMaterial({
    color: 0xe7df8e,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  }),
);
scene.add(ghost);
ghost.visible = false;
const outline = new T.LineSegments(
  new T.EdgesGeometry(new T.BoxGeometry(1.025, 1.025, 1.025)),
  new T.LineBasicMaterial({ color: 0xfff4c9 }),
);
scene.add(outline);
outline.visible = false;
const ray = new T.Raycaster(),
  center = new T.Vector2();
ray.far = 7;
function updateCamera() {
  camera.position.set(player.x, player.y + 1.53, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
  camera.updateMatrixWorld();
}
function targetAt(ndc = center) {
  updateCamera();
  scene.updateMatrixWorld();
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects([...dynamicRayMeshes, world.ground], false);
  target = null;
  aim = null;
  for (const hit of hits) {
    // Static walls/doors occlude building rays even though they cannot be removed.
    if (
      world.solids.some((s) => rayBoxNear(ray.ray, s) < hit.distance - 0.02) ||
      world.doors.some(
        (d) => rayBoxNear(ray.ray, doorBox(d)) < hit.distance - 0.02,
      )
    )
      break;
    const b =
      hit.object.userData.blocks?.[hit.instanceId] || hit.object.userData.block;
    if (b) {
      target = b;
      const normal = hit.face.normal
        .clone()
        .transformDirection(hit.object.matrixWorld);
      if (hit.object.isInstancedMesh) {
        /* cube instances have translation only */
      }
      const point = hit.point.clone().addScaledVector(normal, 0.015);
      aim = {
        x: Math.floor(point.x),
        y: Math.floor(point.y),
        z: Math.floor(point.z),
        type: state.selected,
      };
      // Detailed pieces occupy one cell, so extending them snaps from the cell face.
      if (SPECIAL.includes(b.type)) {
        const ax = ["x", "y", "z"].sort(
          (a, c) => Math.abs(normal[c]) - Math.abs(normal[a]),
        )[0];
        aim = { ...b, type: state.selected };
        aim[ax] += Math.sign(normal[ax]);
      }
    } else {
      aim = {
        x: Math.floor(hit.point.x),
        y: 0,
        z: Math.floor(hit.point.z),
        type: state.selected,
      };
    }
    break;
  }
  return { target, aim };
}
const tempBox = new T.Box3(),
  tempHit = new T.Vector3();
function rayBoxNear(r, b) {
  tempBox.min.set(b.minX, b.minY, b.minZ);
  tempBox.max.set(b.maxX, b.maxY, b.maxZ);
  const p = r.intersectBox(tempBox, tempHit);
  return p ? r.origin.distanceTo(p) : Infinity;
}
function place(ndc) {
  if (!building || modal) return false;
  targetAt(ndc);
  const reason = placementReason(
    aim,
    state,
    [...world.solids, ...world.doors.map((d) => doorBox(d))],
    player,
  );
  if (reason) {
    notice(reason);
    return false;
  }
  const b = { ...aim };
  state.blocks.push(b);
  if (SPECIAL.includes(b.type)) state.inventory[b.type]--;
  history.record({ kind: "place", block: b });
  rebuildPieces();
  updatePalette();
  scheduleSave();
  voice.play("placed");
  notice("✓ " + names[b.type] + " placed");
  return true;
}
function remove() {
  if (!building || modal) return false;
  targetAt();
  if (!target) {
    notice("Point at one of your pieces");
    return false;
  }
  const b = { ...target };
  state.blocks = state.blocks.filter((a) => key(a) !== key(b));
  if (SPECIAL.includes(b.type)) state.inventory[b.type]++;
  history.record({ kind: "remove", block: b });
  rebuildPieces();
  updatePalette();
  scheduleSave();
  notice("Piece put away");
  return true;
}
function undo() {
  if (modal) return false;
  const result = history.undo(state, player, [
    ...world.solids,
    ...world.doors.map((d) => doorBox(d)),
  ]);
  if (result) {
    rebuildPieces();
    updatePalette();
    scheduleSave();
    voice.play("undo");
    notice("↶ Last building step undone");
  } else
    notice(
      history.past.length
        ? "Step away from that space, then undo"
        : "Your building steps will appear here",
    );
  return result;
}
function updatePalette() {
  $("palette").innerHTML = ITEMS.map(
    (t) =>
      `<button data-item="${t}" aria-label="Choose ${names[t]}${SPECIAL.includes(t) ? ", " + state.inventory[t] + " available" : ", unlimited"}" aria-pressed="${state.selected === t}">${icons[t]}<small>${names[t]}</small><span class="count">${COMMON.includes(t) ? "∞" : state.inventory[t]}</span></button>`,
  ).join("");
  $("undo").disabled = history.past.length === 0;
}
function toggleBuild(force) {
  building = force ?? !building;
  $("buildHud").hidden = !building;
  $("place").hidden = !building;
  $("remove").hidden = !building;
  $("build").setAttribute("aria-pressed", String(building));
  $("lookHint").textContent = building
    ? "Drag to aim · tap a space to build"
    : "Drag to look";
  if (building) voice.play("build");
}
function jump() {
  if (started && !modal && player.grounded) {
    player.vy = 6;
    player.grounded = false;
  }
}
let nearby = null;
function nearestUse() {
  // Short range and line of sight, so crafting cannot be opened through a wall.
  const eye = new T.Vector3(player.x, player.y + 1.2, player.z),
    table = new T.Vector3(world.table.x, 0.9, world.table.z),
    dist = eye.distanceTo(table);
  if (dist < 2.65) {
    const delta = table.clone().sub(eye).normalize(),
      r = new T.Ray(eye, delta);
    if (
      ![...world.solids, ...world.doors.map((d) => doorBox(d))].some(
        (b) => rayBoxNear(r, b) < dist - 0.8,
      )
    )
      return { kind: "table" };
  }
  let best = null,
    range = 2.6;
  for (const d of world.doors) {
    const dist = Math.hypot(player.x - d.center.x, player.z - d.center.z);
    if (dist < range) {
      range = dist;
      best = d;
    }
  }
  return best ? { kind: "door", door: best } : null;
}
function toggleDoor(d) {
  const next = doorBox(d, !d.open);
  if (
    overlaps(bodyBox(player), next) ||
    state.blocks.some((b) => overlaps(cellBox(b), next))
  ) {
    notice("Make a little room for the door");
    return false;
  }
  d.open = !d.open;
  state.doors[d.id] = d.open;
  d.pivot.rotation.y = d.baseAngle + (d.open ? -Math.PI / 2 : 0);
  rebuildSolids();
  scheduleSave();
  if (d.open) voice.play("home");
  else notice("Door closed");
  return true;
}
function use() {
  if (modal) return;
  nearby = nearestUse();
  if (nearby?.kind === "table") {
    openModal("craft");
    voice.play("craft");
  } else if (nearby?.kind === "door") toggleDoor(nearby.door);
}
function craft(type) {
  if (!SPECIAL.includes(type) || modal !== "craft") return false;
  if (state.inventory[type] >= 99) {
    notice("There are plenty ready to use");
    return false;
  }
  state.inventory[type]++;
  state.selected = type;
  closeModal();
  toggleBuild(true);
  updatePalette();
  scheduleSave();
  voice.play("made");
  return true;
}
function home() {
  if (modal) return;
  player = { ...HOME, vy: 0, grounded: true };
  const blockers = state.blocks.filter((b) =>
    overlaps(cellBox(b), bodyBox(player)),
  );
  if (blockers.length) {
    // Never destroy a build to rescue the player: search safe ground near home.
    let found = false;
    for (let radius = 1; radius < 15 && !found; radius++)
      for (let x = -radius; x <= radius && !found; x++)
        for (const z of [-radius, radius]) {
          const p = { ...player, x: HOME.x + x, z: HOME.z + z };
          if (!collides(p, solidCache)) {
            player = p;
            found = true;
            break;
          }
        }
    if (!found) {
      notice("Home is surrounded. Remove a few blocks first");
      return;
    }
  }
  scheduleSave();
  notice("⌂ Back home");
}
function clearInput() {
  keys.clear();
  stick.x = stick.y = 0;
  joyPointer = null;
  lookPointer = null;
  lastLook = null;
  $("knob").style.transform = "none";
}
function openModal(id) {
  returnFocus = document.activeElement;
  modal = id;
  clearInput();
  $(id).hidden = false;
  if (started) save();
  const focus = $(id).querySelector("button");
  focus?.focus();
}
function closeModal() {
  if (modal === "welcome" || modal === "fatal") return;
  if (modal) $(modal).hidden = true;
  modal = null;
  clearInput();
  returnFocus?.focus();
}
function start() {
  started = true;
  modal = null;
  $("welcome").hidden = true;
  clearInput();
  voice.play("welcome");
  if (!saveOK)
    notice("Use the grown-up menu to export your progress before closing");
  $("world").focus();
}
function setupUI() {
  for (const id of [
    "home",
    "speaker",
    "menu",
    "build",
    "undo",
    "remove",
    "place",
    "jump",
  ])
    $(id).innerHTML =
      icons[id] +
      (["build", "undo", "remove", "place", "jump"].includes(id)
        ? `<small>${{ build: "Build", undo: "Undo", remove: "Away", place: "Place", jump: "Jump" }[id]}</small>`
        : "");
  $("recipes").innerHTML = SPECIAL.map(
    (t) =>
      `<button data-recipe="${t}" aria-label="Craft ${names[t]}">${icons[t]}<b>${names[t]}</b><small>${t === "lantern" ? "Stone + wood" : t === "flowers" ? "A little garden" : "Wood + wood"}<br>∞ → ${names[t]}</small></button>`,
  ).join("");
  $("play").onclick = start;
  $("home").onclick = home;
  $("speaker").onclick = () => voice.replay();
  $("menu").onclick = () => openModal("settings");
  $("resume").onclick = closeModal;
  document
    .querySelectorAll("[data-close]")
    .forEach((b) => (b.onclick = closeModal));
  $("build").onclick = () => toggleBuild();
  $("jump").onclick = jump;
  $("place").onclick = () => place();
  $("remove").onclick = remove;
  $("undo").onclick = undo;
  $("use").onclick = use;
  $("palette").onclick = (e) => {
    const b = e.target.closest("[data-item]");
    if (!b) return;
    state.selected = b.dataset.item;
    updatePalette();
    scheduleSave();
    if (SPECIAL.includes(state.selected) && !state.inventory[state.selected])
      notice(
        "Make " +
          names[state.selected].toLowerCase() +
          " at your crafting table",
      );
  };
  $("recipes").onclick = (e) => {
    const b = e.target.closest("[data-recipe]");
    if (b) craft(b.dataset.recipe);
  };
  $("export").onclick = () => {
    save();
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(state, null, 2)], {
          type: "application/json",
        }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "Little-Block-Lane-save.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  $("import").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 250000) throw Error("That file is too large");
      const next = validateSave(JSON.parse(await file.text()), world.solids);
      applyState(next);
      save();
      $("importError").textContent = "Save opened. Your neighborhood is ready.";
    } catch (err) {
      $("importError").textContent = "Could not open save: " + err.message;
    }
    e.target.value = "";
  };
  $("fullscreen").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else
        $("importError").textContent =
          "Use your browser full-screen option on this device.";
    } catch {
      $("importError").textContent =
        "Use your browser full-screen option on this device.";
    }
  };
  $("diagnostics").onclick = () => {
    $("stats").hidden = !$("stats").hidden;
  };
  $("quality").onclick = () => {
    highQuality = !highQuality;
    renderer.setPixelRatio(Math.min(devicePixelRatio, highQuality ? 1.5 : 1));
    $("quality").textContent = "Quality: " + (highQuality ? "crisp" : "gentle");
  };
  $("subtitles").onclick = () => {
    voice.subtitles = !voice.subtitles;
    $("subtitles").textContent = "Hints: " + (voice.subtitles ? "on" : "off");
  };
}
setupUI();
installTouchButtons();
restore();
const joystick = $("joystick");
function moveJoy(e) {
  const r = joystick.getBoundingClientRect(),
    radius = r.width * 0.33,
    x = (e.clientX - r.left - r.width / 2) / radius,
    y = (e.clientY - r.top - r.height / 2) / radius,
    n = Math.max(1, Math.hypot(x, y));
  stick.x = x / n;
  stick.y = y / n;
  $("knob").style.transform =
    `translate(${stick.x * radius}px,${stick.y * radius}px)`;
}
joystick.addEventListener("pointerdown", (e) => {
  if (modal || joyPointer !== null) return;
  e.preventDefault();
  joyPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  moveJoy(e);
});
joystick.addEventListener("pointermove", (e) => {
  if (e.pointerId === joyPointer) moveJoy(e);
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  joystick.addEventListener(type, (e) => {
    if (e.pointerId === joyPointer) {
      joyPointer = null;
      stick.x = stick.y = 0;
      $("knob").style.transform = "none";
    }
  });
const canvas = $("world");
canvas.tabIndex = -1;
canvas.addEventListener("pointerdown", (e) => {
  if (modal || lookPointer !== null) return;
  e.preventDefault();
  lookPointer = e.pointerId;
  canvas.setPointerCapture(e.pointerId);
  lastLook = { x: e.clientX, y: e.clientY, start: performance.now() };
  totalLook = 0;
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerId !== lookPointer || !lastLook) return;
  const dx = e.clientX - lastLook.x,
    dy = e.clientY - lastLook.y;
  totalLook += Math.abs(dx) + Math.abs(dy);
  player.yaw -= dx * 0.004;
  player.pitch = clamp(player.pitch - dy * 0.0035, -1.3, 1.3);
  lastLook.x = e.clientX;
  lastLook.y = e.clientY;
});
canvas.addEventListener("pointerup", (e) => {
  if (e.pointerId !== lookPointer || !lastLook) return;
  if (building && totalLook < 9 && performance.now() - lastLook.start < 500)
    place(
      new T.Vector2(
        (e.clientX / innerWidth) * 2 - 1,
        1 - (e.clientY / innerHeight) * 2,
      ),
    );
  lookPointer = null;
  lastLook = null;
  scheduleSave();
});
for (const type of ["pointercancel", "lostpointercapture"])
  canvas.addEventListener(type, (e) => {
    if (e.pointerId === lookPointer) {
      lookPointer = null;
      lastLook = null;
    }
  });
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
addEventListener("keydown", (e) => {
  if (modal) {
    if (e.code === "Escape") {
      e.preventDefault();
      closeModal();
    }
    if (e.code === "Tab") {
      const root = $(modal),
        items = [...root.querySelectorAll("button,input")].filter(
          (b) => !b.disabled && b.offsetParent !== null,
        );
      if (items.length) {
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
    return;
  }
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code,
    )
  )
    e.preventDefault();
  keys.add(e.code);
  if (e.repeat) return;
  const fn = {
    Space: jump,
    KeyE: use,
    KeyB: () => toggleBuild(),
    KeyF: () => place(),
    KeyR: remove,
    KeyZ: undo,
    Escape: () => openModal("settings"),
  };
  fn[e.code]?.();
  if (/^Digit[1-7]$/.test(e.code)) {
    state.selected = ITEMS[Number(e.code.at(-1)) - 1];
    updatePalette();
    scheduleSave();
  }
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => {
  clearInput();
  if (started) save();
});
document.addEventListener("visibilitychange", () => {
  clearInput();
  if (document.hidden && started) save();
});
addEventListener("pagehide", () => {
  if (started) save();
});
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  if (started) save();
  clearInput();
  modal = "fatal";
  fail(
    "The graphics context was lost. Progress was saved when possible. Close and reopen the game to continue.",
  );
});
let previous = performance.now(),
  stamp = previous,
  frames = 0,
  frameTimes = [],
  loadedMs = 0,
  lastTarget = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = now - previous,
    dt = Math.min(0.08, elapsed / 1000);
  previous = now;
  if (started && !modal && !document.hidden) {
    const forward =
      (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
      (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
      stick.y;
    const right =
      (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) +
      stick.x;
    movePlayer(player, { forward, right }, dt, solidCache);
    if (forward || right || player.vy) dirty = true;
    if (dirty && now - lastSave > 2200) save();
  }
  updateCamera();
  if (started && !modal && now - lastTarget > 70) {
    lastTarget = now;
    nearby = nearestUse();
    $("use").disabled = !nearby;
    if (nearby)
      $("use").innerHTML =
        nearby.kind === "table"
          ? icons.table + "<span>Make something</span>"
          : icons.door +
            `<span>${nearby.door.open ? "Close" : "Open"} door</span>`;
    if (building) {
      targetAt();
      const reason = placementReason(
        aim,
        state,
        [...world.solids, ...world.doors.map((d) => doorBox(d))],
        player,
      );
      ghost.visible = !!aim;
      outline.visible = !!target;
      if (aim) {
        ghost.position.set(aim.x + 0.5, aim.y + 0.5, aim.z + 0.5);
        ghost.material.color.set(reason ? 0xdb7566 : 0xe9e2a0);
      }
      if (target)
        outline.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
    }
  }
  if (!building || modal) {
    ghost.visible = false;
    outline.visible = false;
  }
  if (modal) $("use").disabled = true;
  renderer.render(scene, camera);
  if (!loadedMs) loadedMs = performance.now() - bootStart;
  frames++;
  if (started && !modal) frameTimes.push(elapsed);
  if (frameTimes.length > 240) frameTimes.shift();
  if (now - stamp >= 1000) {
    const info = renderer.info,
      sorted = [...frameTimes].sort((a, b) => a - b);
    lastStats = {
      fps: Math.round((frames * 1000) / (now - stamp)),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      heapMB: performance.memory
        ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1)
        : null,
      rebuildMs: +lastRebuild.toFixed(2),
      firstFrameMs: Math.round(loadedMs),
      frameP95: sorted.length
        ? +sorted[Math.floor((sorted.length - 1) * 0.95)].toFixed(1)
        : null,
      blocks: state.blocks.length,
    };
    $("stats").textContent =
      `${lastStats.fps} fps · p95 ${lastStats.frameP95 ?? "—"} ms\n${lastStats.drawCalls} calls · ${lastStats.triangles.toLocaleString()} triangles\n${lastStats.geometries} geometries · ${lastStats.textures} textures\nJS heap ${lastStats.heapMB ?? "unavailable"} MB (not GPU memory)\nLast build ${lastStats.rebuildMs} ms\nFirst frame ${lastStats.firstFrameMs} ms\nPieces ${state.blocks.length} / ${MAX_BLOCKS}\n${saveOK ? "Browser save available" : "Export needed to keep progress"}\nGentle quality: ${highQuality ? "off" : "on"}`;
    frames = 0;
    stamp = now;
  }
}
requestAnimationFrame(frame);
// Deliberate read-only inspection plus development-only controls for smoke tests and screenshots.
// ?test=1 is local automation convenience, not a gameplay dependency.
window.blockworld = {
  snapshot: () => structuredClone({ ...state, player: { ...player } }),
  stats: () => ({ ...lastStats }),
  ready: true,
};
if (new URLSearchParams(location.search).get("test") === "1")
  window.blockworld.test = {
    setPlayer(p) {
      Object.assign(player, p);
      updateCamera();
    },
    setLook(yaw, pitch = 0) {
      player.yaw = yaw;
      player.pitch = pitch;
      updateCamera();
    },
    world: () => ({
      houses: world.houses,
      doors: world.doors.map((d) => ({
        id: d.id,
        open: d.open,
        box: doorBox(d),
        center: d.center,
        baseAngle: d.baseAngle,
      })),
      solids: world.solids,
      road: world.road,
      drives: world.drives,
    }),
    target: () => {
      targetAt();
      return { target, aim };
    },
    place,
    remove,
    undo,
    home,
    save,
    openCraft() {
      openModal("craft");
    },
    craft,
    add(b) {
      const reason = placementReason(b, state, world.solids, player, false);
      if (reason) return reason;
      state.blocks.push({ ...b });
      history.record({ kind: "place", block: { ...b } });
      rebuildPieces();
      updatePalette();
      scheduleSave();
      return "";
    },
    overview(x = 35, y = 31, z = 42, tx = 0, ty = 0, tz = 1) {
      camera.position.set(x, y, z);
      camera.lookAt(tx, ty, tz);
      camera.updateMatrixWorld();
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL("image/png");
    },
    lookAt(x, y, z) {
      updateCamera();
      camera.lookAt(x, y, z);
      const e = new T.Euler().setFromQuaternion(camera.quaternion, "YXZ");
      player.yaw = e.y;
      player.pitch = e.x;
    },
    fresh() {
      applyState(freshState());
      save();
    },
    getBuilding: () => building,
    getModal: () => modal,
  };
