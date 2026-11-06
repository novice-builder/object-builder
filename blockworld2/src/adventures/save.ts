import type { RoomState } from "./interior";
import { inWorld } from "./vale-data";
import { WorldStore, type WorldRecord } from "../persistence/store";
import { type Snapshot, encode, decode } from "../persistence/schema";
import { DEFINITIONS } from "./assets";
import {
  WORLDS,
  LATEST_LAYOUT,
  type SceneLayout,
  type Placement,
  type SceneId,
} from "./landscape";
export interface AdventureData {
  version: 1 | 2;
  scene: SceneId;
  /** Missing in preview 01: retain its original permanent scene layout. */
  layout?: SceneLayout;
  objects: Placement[];
  discoveries: string[];
  doors?: { lodge?: boolean };
  rooms?: Record<string, RoomState>;
  inside?: { id: string; outside: AdventurePose };
}
export interface AdventurePose {
  x: number;
  y?: number;
  z: number;
  yaw: number;
  pitch: number;
  facing?: number;
}
export const DATABASE = "blockworld-adventures-assets-v1";
export function validateAdventure(s: Snapshot): AdventureData {
  const a = s.world.adventure as AdventureData;
  if (
    !a ||
    ![1, 2].includes(a.version) ||
    (a.version === 1 && (a.rooms !== undefined || a.inside !== undefined)) ||
    (a.layout !== undefined &&
      a.layout !== 1 &&
      a.layout !== 2 &&
      a.layout !== 3 &&
      a.layout !== 4 &&
      a.layout !== 5 &&
      a.layout !== 6) ||
    !WORLDS.some((w) => w.id === a.scene) ||
    (a.scene === "vale" &&
      a.layout !== 3 &&
      a.layout !== 4 &&
      a.layout !== 5 &&
      a.layout !== 6) ||
    (a.scene !== "vale" && (a.layout === 5 || a.layout === 6)) ||
    (a.doors !== undefined &&
      (!a.doors ||
        typeof a.doors !== "object" ||
        Array.isArray(a.doors) ||
        Object.entries(a.doors).some(
          ([k, v]) => k !== "lodge" || typeof v !== "boolean",
        ))) ||
    !Array.isArray(a.objects) ||
    a.objects.length > 200 ||
    !Array.isArray(a.discoveries) ||
    a.discoveries.length > 50 ||
    a.discoveries.some((d) => typeof d !== "string" || d.length > 80)
  )
    throw Error(
      "This is not a supported Adventures preview backup. Existing saves are unchanged.",
    );
  const ids = new Set<string>();
  for (const o of a.objects) {
    if (
      !o ||
      typeof o.id !== "string" ||
      o.id.length > 80 ||
      ids.has(o.id) ||
      !DEFINITIONS.has(o.asset) ||
      ![o.x, o.z, o.yaw, o.scale].every(Number.isFinite) ||
      !inWorld(o.x, o.z, a.scene, -0.001) ||
      o.scale < 0.2 ||
      o.scale > 14 ||
      o.y !== undefined
    )
      throw Error("Invalid imported object. Existing saves are unchanged.");
    ids.add(o.id);
  }
  if (a.version === 2) validateRooms(a, s);
  if (!a.inside && !inWorld(s.player.x, s.player.z, a.scene, -0.001))
    throw Error("Player outside the preview boundary.");
  return { ...structuredClone(a), layout: a.layout ?? 1 };
}
function validateRooms(a: AdventureData, s: Snapshot) {
  const rooms = a.rooms;
  if (
    !rooms ||
    typeof rooms !== "object" ||
    Array.isArray(rooms) ||
    Object.keys(rooms).length > 512
  )
    throw Error("Unsupported interior records. Existing saves are unchanged.");
  let total = 0;
  for (const [id, room] of Object.entries(rooms)) {
    const e = room?.entry;
    if (
      !id ||
      id.length > 120 ||
      ["__proto__", "constructor", "prototype"].includes(id) ||
      !e ||
      e.id !== id ||
      !["cottage", "townhouse", "inn", "workshop", "mill"].includes(e.kind) ||
      typeof e.name !== "string" ||
      e.name.length > 80 ||
      ![e.x, e.z, e.yaw, e.width, e.depth].every(Number.isFinite) ||
      !inWorld(e.x, e.z, a.scene) ||
      e.width < 5.8 ||
      e.width > 10 ||
      e.depth < 6.8 ||
      e.depth > 12 ||
      (e.threshold !== undefined &&
        (!e.threshold ||
          ![e.threshold.x, e.threshold.y, e.threshold.z].every(
            Number.isFinite,
          ) ||
          !inWorld(e.threshold.x, e.threshold.z, a.scene) ||
          e.threshold.y < 0 ||
          e.threshold.y > 6)) ||
      !Array.isArray(room.objects) ||
      room.objects.length > 200
    )
      throw Error("Invalid saved interior.");
    const ids = new Set<string>();
    for (const p of room.objects) {
      const def = DEFINITIONS.get(p?.asset);
      if (
        !p ||
        typeof p.id !== "string" ||
        p.id.length > 80 ||
        ids.has(p.id) ||
        !def ||
        def.category !== "prop" ||
        ![p.x, p.z, p.y ?? 0, p.yaw, p.scale].every(Number.isFinite) ||
        Math.abs(p.x) > e.width / 2 ||
        Math.abs(p.z) > e.depth / 2 ||
        ![0, 3].includes(p.y ?? 0) ||
        (e.kind === "workshop" && (p.y ?? 0) !== 0) ||
        p.scale < 0.2 ||
        p.scale > 14
      )
        throw Error("Invalid room furnishing.");
      ids.add(p.id);
      total++;
    }
  }
  if (total > 4000)
    throw Error("Interior furnishings exceed this preview's save budget.");
  if (a.inside) {
    const active = a.inside,
      room = Object.hasOwn(rooms, active.id) ? rooms[active.id] : null,
      p = active.outside;
    if (
      !room ||
      !p ||
      ![p.x, p.z, p.yaw, p.pitch].every(Number.isFinite) ||
      (p.y !== undefined && (!Number.isFinite(p.y) || p.y < 0 || p.y > 26)) ||
      !inWorld(p.x, p.z, a.scene) ||
      (p.facing !== undefined && !Number.isFinite(p.facing)) ||
      Math.abs(s.player.x) > room.entry.width / 2 ||
      Math.abs(s.player.z) > room.entry.depth / 2 ||
      s.player.y < 0 ||
      s.player.y > 3.05
    )
      throw Error("Invalid saved interior location.");
  }
}
export function makeSnapshot(
  data: AdventureData,
  pose: AdventurePose,
): Snapshot {
  return {
    schema: 3,
    template: "blank",
    world: {
      blocks: [],
      doors: {},
      layout: 1,
      adventure: structuredClone(data),
    },
    player: { ...pose, y: data.inside ? (pose.y ?? 0) : 0 },
    preferences: { selected: "hand", avatar: "explorer", camera: "third" },
  };
}
export class AdventureSession {
  store!: WorldStore;
  current: WorldRecord | null = null;
  blocked = false;
  busy = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private last = "";
  constructor(
    readonly capture: () => Snapshot,
    readonly apply: (snapshot: Snapshot) => void,
    readonly status: (text: string, error?: boolean) => void,
    readonly pause: (busy: boolean) => void,
  ) {}
  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const job = this.queue.then(operation);
    this.queue = job.catch(() => {});
    return job;
  }
  async init() {
    this.store = await WorldStore.open(DATABASE);
    const list = await this.store.list(),
      id = await this.store.last();
    let record = list.find((w) => w.id === id) || list[0];
    if (!record) {
      const w = WORLDS[0];
      record = await this.store.create(
        w.name,
        makeSnapshot(
          {
            version: 1,
            scene: w.id,
            layout: w.id === "vale" ? LATEST_LAYOUT : 3,
            objects: [],
            discoveries: [],
          },
          { ...w.spawn, yaw: w.yaw, pitch: 0.47 },
        ),
      );
    }
    await this.open(record.id);
  }
  private async flush() {
    if (!this.current || !this.store) return;
    if (this.blocked)
      throw Error("Saving is paused. Export your work or save a new copy.");
    const owner = this.current,
      snapshot = this.capture();
    validateAdventure(snapshot);
    const hash = encode(snapshot).json;
    if (hash === this.last) return;
    this.status("Saving…");
    try {
      const saved = await this.store.save(owner.id, owner.revision, snapshot);
      if (this.current?.id === owner.id) {
        this.current = saved;
        this.last = hash;
      }
      this.status("Saved on this device");
    } catch (e) {
      this.blocked = true;
      this.status(String(e), true);
      throw e;
    }
  }
  save() {
    return this.serial(() => this.flush());
  }
  private change<T>(operation: () => Promise<T>) {
    this.busy++;
    this.pause(true);
    return this.serial(operation).finally(() => {
      if (--this.busy === 0) this.pause(false);
    });
  }
  open(id: string) {
    return this.change(async () => {
      await this.flush();
      const loaded = await this.store.load(id);
      validateAdventure(loaded.snapshot);
      await this.flush();
      this.apply(loaded.snapshot);
      this.current = loaded.record;
      this.last = encode(loaded.snapshot).json;
      this.blocked = loaded.recovered;
      await this.store.select(id);
      this.status(
        loaded.recovered
          ? "An older checkpoint was recovered. Export it or save a new copy before continuing."
          : "Saved on this device",
        loaded.recovered,
      );
    });
  }
  create(scene: SceneId) {
    return this.change(async () => {
      await this.flush();
      const w = WORLDS.find((w) => w.id === scene)!;
      const snapshot = makeSnapshot(
        {
          version: 1,
          scene,
          layout: w.id === "vale" ? LATEST_LAYOUT : 3,
          objects: [],
          discoveries: [],
        },
        { ...w.spawn, yaw: w.yaw, pitch: 0.47 },
      );
      const records = await this.store.list();
      const used = new Set(records.map((r) => r.name));
      let name = w.name,
        index = 2;
      while (used.has(name)) name = w.name + " " + index++;
      const record = await this.store.create(name, snapshot);
      this.apply(snapshot);
      this.current = record;
      this.last = encode(snapshot).json;
      await this.store.select(record.id);
      this.status("Saved on this device");
      return record;
    });
  }
  import(text: string) {
    return this.change(async () => {
      await this.flush();
      if (text.length > 12_000_000) throw Error("Backup exceeds 12 MB");
      const data = JSON.parse(text);
      if (data.format !== "blockworld2" || data.version !== 1)
        throw Error(
          "Use an Adventures .bw2 backup. Original game backups belong in the original game.",
        );
      const snapshot = decode(data.checkpoint);
      validateAdventure(snapshot);
      const record = await this.store.create(
        typeof data.name === "string" ? data.name : "Imported adventure",
        snapshot,
      );
      this.apply(snapshot);
      this.current = record;
      this.last = encode(snapshot).json;
      await this.store.select(record.id);
      this.status("Backup imported as a new world");
    });
  }
  export() {
    return this.store.export(
      this.current || ({ name: "Unsaved adventure" } as WorldRecord),
      this.capture(),
    );
  }
  /** First interior entry forks an independently stored copy; the version-1 source stays readable by old previews. */
  copyForRooms() {
    return this.change(async () => {
      await this.flush();
      const snapshot = this.capture();
      validateAdventure(snapshot);
      if ((snapshot.world.adventure as AdventureData).version !== 1) return;
      const base = `${this.current?.name || "Adventure"} · interiors`,
        used = new Set((await this.store.list()).map((r) => r.name));
      let name = base,
        index = 2;
      while (used.has(name)) name = base + " " + index++;
      const record = await this.store.create(name, snapshot);
      await this.store.select(record.id);
      this.current = record;
      this.last = encode(snapshot).json;
      this.blocked = false;
      this.status("Original world kept · interior copy ready");
    });
  }
  recover() {
    return this.change(async () => {
      const snapshot = this.capture();
      validateAdventure(snapshot);
      const record = await this.store.create(
        `${this.current?.name || "Adventure"} recovered`,
        snapshot,
      );
      await this.store.select(record.id);
      this.current = record;
      this.last = encode(snapshot).json;
      this.blocked = false;
      this.status("Recovered copy saved");
    });
  }
}
