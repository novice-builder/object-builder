import { renderHotbar } from "../ui/catalogue";
import type { Game } from "./game";
import { WorldStore, type WorldRecord } from "../persistence/store";
import { fromGame, encode } from "../persistence/schema";
import { TEMPLATES, type TemplateId } from "../world/templates";
export class Session {
  store!: WorldStore;
  current: WorldRecord | null = null;
  blocked = false;
  ready = false;
  private flight: Promise<void> | null = null;
  private last = "";
  constructor(readonly game: Game) {
    game.paused = true;
    document.querySelector<HTMLButtonElement>("#worlds")!.onclick = () =>
      void this.menu();
    game.onEdit = () => {
      if (this.ready) void this.save().catch(() => {});
    };
    void this.init();
  }
  private async init() {
    try {
      this.store = await WorldStore.open();
      const list = await this.store.list();
      const id = await this.store.last();
      const record =
        list.find((r) => r.id === id) ||
        list[0] ||
        (await this.store.create(
          "My neighbourhood",
          fromGame(this.game.snapshot()),
        ));
      await this.open(record.id);
      this.ready = true;
      setInterval(() => {
        if (!this.game.paused && !document.hidden)
          void this.save().catch(() => {});
      }, 1500);
      addEventListener("blur", () => {
        void this.save().catch(() => {});
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) void this.save().catch(() => {});
      });
    } catch (error) {
      this.ready = false;
      this.game.paused = false;
      this.failure(error);
    }
  }
  async open(id: string) {
    if (this.flight) await this.flight;
    const loaded = await this.store.load(id);
    const s = loaded.snapshot;
    this.game.load(
      s.template,
      s.world.blocks,
      s.player,
      s.world.doors,
      s.world.activity,
    );
    this.game.selected = s.preferences.selected;
    this.game.favourites = Array.isArray(s.preferences.favourites)
      ? (s.preferences.favourites as string[])
      : [];
    this.game.recent = Array.isArray(s.preferences.recent)
      ? (s.preferences.recent as string[])
      : [];
    this.game.hotbar = Array.isArray(s.preferences.hotbar)
      ? (s.preferences.hotbar as string[]).slice(0, 8)
      : [];
    renderHotbar(this.game);
    this.game.cameraMode = s.preferences.camera === "third" ? "third" : "first";
    this.game.flying = !!s.preferences.flying;
    document.querySelector<HTMLElement>("#flightControls")!.hidden =
      !this.game.flying;
    this.game.refreshModes();
    this.current = loaded.record;
    this.last = encode(fromGame(this.game.snapshot())).json;
    this.blocked = loaded.recovered;
    await this.store.select(id);
    this.game.paused = false;
    if (loaded.recovered)
      this.failure(
        Error(
          "An older checkpoint was recovered. The damaged original is retained. Save a new copy before continuing.",
        ),
      );
    else this.game.notice("✓ World ready · saved on this device");
  }
  async save(): Promise<void> {
    if (!this.current || !this.store) return;
    if (this.flight) {
      await this.flight;
      return this.save();
    }
    if (this.blocked) throw Error("Save blocked; export or save a new copy");
    let snapshot: ReturnType<typeof fromGame>;
    let hash: string;
    try {
      snapshot = fromGame(this.game.snapshot());
      hash = encode(snapshot).json;
    } catch (error) {
      this.failure(error);
      throw error;
    }
    if (hash === this.last) return;
    const record = this.current;
    this.flight = (async () => {
      try {
        this.current = await this.store.save(
          record.id,
          record.revision,
          snapshot,
        );
        this.last = hash;
      } catch (error) {
        this.failure(error);
        throw error;
      }
    })();
    try {
      await this.flight;
    } finally {
      this.flight = null;
    }
  }
  async newWorld(template: TemplateId) {
    await this.save();
    const t = TEMPLATES.find((t) => t.id === template)!;
    const snapshot = fromGame({
      template,
      blocks: [],
      doors: {},
      player: t.spawn,
      selected: "hand",
    });
    const record = await this.store.create(t.name, snapshot);
    await this.open(record.id);
    this.close();
    return record;
  }
  exportCurrent() {
    const record =
      this.current || ({ name: "Unsaved recovered world" } as WorldRecord);
    const text = this.store
      ? this.store.export(record, fromGame(this.game.snapshot()))
      : JSON.stringify(
          {
            format: "blockworld2",
            version: 1,
            name: record.name,
            checkpoint: encode(fromGame(this.game.snapshot())),
          },
          null,
          2,
        );
    const url = URL.createObjectURL(
        new Blob([text], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "BlockWorld2-backup.bw2";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return text;
  }
  private failure(error: unknown) {
    this.blocked = true;
    let alert = document.querySelector<HTMLElement>("#saveAlert");
    if (!alert) {
      alert = document.createElement("aside");
      alert.id = "saveAlert";
      alert.setAttribute("role", "alert");
      document.body.append(alert);
    }
    alert.replaceChildren();
    const text = document.createElement("p");
    text.textContent = "Progress remains in memory. " + String(error);
    alert.append(text);
    const button = (label: string, fn: () => void) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.onclick = fn;
      alert!.append(b);
    };
    button("Export unsaved work", () => {
      try {
        this.exportCurrent();
      } catch (e) {
        text.textContent = String(e);
      }
    });
    button("Save as new copy", () => {
      void (async () => {
        try {
          if (!this.store) this.store = await WorldStore.open();
          const record = await this.store.create(
            (this.current?.name || "Recovered world") + " recovered",
            fromGame(this.game.snapshot()),
          );
          this.current = record;
          await this.store.select(record.id);
          this.last = record.current.json;
          this.blocked = false;
          this.ready = true;
          alert!.remove();
          this.game.notice("✓ Recovered copy saved");
        } catch (e) {
          text.textContent = String(e);
        }
      })();
    });
  }
  close() {
    document.querySelector<HTMLElement>("#modal")!.hidden = true;
    this.game.paused = false;
    this.game.controls.clear();
  }
  async menu() {
    try {
      await this.save();
      this.game.paused = true;
      this.game.controls.clear();
      const modal = document.querySelector<HTMLElement>("#modal")!;
      modal.hidden = false;
      modal.innerHTML =
        '<section><h1>🌍 Your worlds</h1><div id="worldList"></div><h2>Create another</h2><div id="templates"></div><div class="backupActions"><button id="export">⇩ Backup</button><label class="fileButton">⇧ Import<input id="import" type="file" accept=".bw2,.json,application/json"></label><button id="resume">▶ Play</button></div><p id="worldError" role="alert"></p></section>';
      const guard = (fn: () => Promise<unknown>) => {
        void fn().catch((e) => {
          document.querySelector("#worldError")!.textContent = String(e);
        });
      };
      for (const r of await this.store.list()) {
        const row = document.createElement("div");
        row.className = "worldRow";
        const play = document.createElement("button");
        play.textContent = (r.id === this.current?.id ? "▶ " : "") + r.name;
        play.dataset.world = r.id;
        play.onclick = () =>
          guard(async () => {
            await this.open(r.id);
            this.close();
          });
        const name = document.createElement("input");
        name.value = r.name;
        name.setAttribute("aria-label", "World name");
        const rename = document.createElement("button");
        rename.textContent = "✎";
        rename.setAttribute("aria-label", "Rename " + r.name);
        rename.onclick = () =>
          guard(async () => {
            const next = await this.store.rename(r.id, r.revision, name.value);
            if (this.current?.id === r.id) this.current = next;
            await this.menu();
          });
        const copy = document.createElement("button");
        copy.textContent = "⧉";
        copy.setAttribute("aria-label", "Duplicate " + r.name);
        copy.onclick = () =>
          guard(async () => {
            await this.store.duplicate(r.id);
            await this.menu();
          });
        row.append(play, name, rename, copy);
        document.querySelector("#worldList")!.append(row);
      }
      for (const t of TEMPLATES) {
        const b = document.createElement("button");
        b.dataset.template = t.id;
        b.textContent = t.icon + " " + t.name;
        b.onclick = () => guard(() => this.newWorld(t.id));
        document.querySelector("#templates")!.append(b);
      }
      document.querySelector<HTMLButtonElement>("#resume")!.onclick = () =>
        this.close();
      document.querySelector<HTMLButtonElement>("#export")!.onclick = () =>
        this.exportCurrent();
      document.querySelector<HTMLInputElement>("#import")!.onchange = (e) =>
        guard(async () => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (!f) return;
          if (f.size > 12_000_000) throw Error("Backup exceeds 12 MB");
          const record = await this.store.import(await f.text());
          await this.open(record.id);
          this.close();
        });
    } catch (error) {
      this.failure(error);
    }
  }
}
