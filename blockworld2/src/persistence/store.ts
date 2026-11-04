import {
  encode,
  decode,
  type Snapshot,
  type Envelope,
  parseBackup,
} from "./schema";
export interface WorldRecord {
  id: string;
  name: string;
  template: string;
  revision: number;
  updated: number;
  current: Envelope;
  previous: Envelope[];
  importSource?: string;
}
export class ConflictError extends Error {
  constructor() {
    super(
      "This world changed in another tab. Your unsaved work is still here; export or save a new copy.",
    );
  }
}
const request = <T>(r: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error || Error("Storage request failed"));
  });
const complete = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || Error("Storage transaction aborted"));
    tx.onerror = () => {};
  });
export class WorldStore {
  constructor(readonly db: IDBDatabase) {}
  static open(name = "blockworld2-development") {
    return new Promise<WorldStore>((resolve, reject) => {
      const r = indexedDB.open(name, 1);
      r.onupgradeneeded = () => {
        for (const s of ["worlds", "meta"])
          if (!r.result.objectStoreNames.contains(s))
            r.result.createObjectStore(s, {
              keyPath: s === "worlds" ? "id" : "key",
            });
      };
      r.onsuccess = () => {
        r.result.onversionchange = () => r.result.close();
        resolve(new WorldStore(r.result));
      };
      r.onerror = () => reject(r.error);
      r.onblocked = () =>
        reject(Error("Close another BlockWorld tab to open saves"));
    });
  }
  private async read<T>(store: string, key: IDBValidKey) {
    const tx = this.db.transaction(store, "readonly");
    return request(tx.objectStore(store).get(key)) as Promise<T | undefined>;
  }
  async list() {
    const tx = this.db.transaction("worlds", "readonly");
    return request<WorldRecord[]>(tx.objectStore("worlds").getAll());
  }
  async last() {
    return (await this.read<{ key: string; value: string }>("meta", "last"))
      ?.value;
  }
  async select(id: string) {
    const tx = this.db.transaction("meta", "readwrite"),
      done = complete(tx);
    tx.objectStore("meta").put({ key: "last", value: id });
    await done;
  }
  async create(name: string, snapshot: Snapshot, source?: string) {
    const current = encode(snapshot),
      record: WorldRecord = {
        id: crypto.randomUUID(),
        name: name.trim().slice(0, 60) || "My world",
        template: snapshot.template,
        revision: 0,
        updated: Date.now(),
        current,
        previous: [],
        ...(source ? { importSource: source } : {}),
      };
    const tx = this.db.transaction("worlds", "readwrite"),
      done = complete(tx);
    tx.objectStore("worlds").add(record);
    await done;
    return record;
  }
  async load(id: string) {
    const record = await this.read<WorldRecord>("worlds", id);
    if (!record) throw Error("World was not found");
    try {
      return { record, snapshot: decode(record.current), recovered: false };
    } catch (error) {
      for (const e of record.previous || []) {
        try {
          return { record, snapshot: decode(e), recovered: true };
        } catch {}
      }
      throw Error(
        "No valid checkpoint. Original data is retained; import a backup or choose another world.",
      );
    }
  }
  async save(id: string, revision: number, snapshot: Snapshot) {
    const current = encode(snapshot),
      tx = this.db.transaction("worlds", "readwrite"),
      done = complete(tx);
    try {
      const store = tx.objectStore("worlds"),
        old = await request<WorldRecord | undefined>(store.get(id));
      if (!old) throw Error("World no longer exists");
      if (old.revision !== revision) throw new ConflictError();
      decode(old.current);
      const next = {
        ...old,
        revision: revision + 1,
        current,
        previous: [old.current, ...old.previous].slice(0, 3),
        updated: Date.now(),
      };
      store.put(next);
      await done;
      return next;
    } catch (error) {
      try {
        tx.abort();
      } catch {}
      await done.catch(() => {});
      throw error;
    }
  }
  async rename(id: string, revision: number, name: string) {
    const tx = this.db.transaction("worlds", "readwrite"),
      done = complete(tx);
    try {
      const store = tx.objectStore("worlds"),
        old = await request<WorldRecord | undefined>(store.get(id));
      if (!old || old.revision !== revision) throw new ConflictError();
      const next = {
        ...old,
        name: name.trim().slice(0, 60) || old.name,
        revision: revision + 1,
        updated: Date.now(),
      };
      store.put(next);
      await done;
      return next;
    } catch (error) {
      try {
        tx.abort();
      } catch {}
      await done.catch(() => {});
      throw error;
    }
  }
  async duplicate(id: string) {
    const { record, snapshot, recovered } = await this.load(id);
    if (recovered)
      throw Error("Recover this world to a new copy before duplicating");
    return this.create(record.name + " copy", snapshot, record.importSource);
  }
  async import(text: string) {
    const parsed = parseBackup(text);
    return this.create(parsed.name, parsed.snapshot, parsed.source);
  }
  export(record: WorldRecord, snapshot?: Snapshot) {
    return JSON.stringify(
      {
        format: "blockworld2",
        version: 1,
        name: record.name,
        ...(record.importSource ? { legacySource: record.importSource } : {}),
        checkpoint: snapshot ? encode(snapshot) : record.current,
      },
      null,
      2,
    );
  }
}
