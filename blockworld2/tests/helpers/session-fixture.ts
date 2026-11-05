import "fake-indexeddb/auto";
import { Session } from "../../src/app/session";
import { WorldStore } from "../../src/persistence/store";
import { fromGame } from "../../src/persistence/schema";
export const raw = (x = 0) => ({
  template: "blank",
  blocks: [{ x, y: 0, z: 0, type: "wood" }],
  doors: {},
  selected: "hand",
  player: { x: 10, y: 0, z: 10, yaw: 0, pitch: 0 },
});
export function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
export async function sessionFixture() {
  const store = await WorldStore.open("run4-session-" + crypto.randomUUID()),
    a = await store.create("A", fromGame(raw(0))),
    b = await store.create("B", fromGame(raw(2)));
  await store.select(a.id);
  class Element extends EventTarget {
    hidden = false;
    innerHTML = "";
    textContent = "";
    id = "";
    style = {};
    classList = { toggle() {} };
    append() {}
    replaceChildren() {}
    setAttribute() {}
    remove() {}
    matches() {
      return false;
    }
  }
  const elements = new Map<string, Element>();
  for (const id of [
    "#worlds",
    "#palette",
    "#flightControls",
    "#modal",
    ".brand",
  ])
    elements.set(id, new Element());
  const doc = Object.assign(new EventTarget(), {
    hidden: false,
    body: new Element(),
    querySelector: (id: string) => elements.get(id) || null,
    querySelectorAll: () => [],
    createElement: () => new Element(),
  });
  const previous = {
    document: globalThis.document,
    addEventListener: globalThis.addEventListener,
    setInterval: globalThis.setInterval,
    open: WorldStore.open,
  };
  const intervals: (() => void)[] = [];
  Object.assign(globalThis, {
    document: doc,
    addEventListener() {},
    setInterval(fn: () => void) {
      intervals.push(fn);
      return 1;
    },
  });
  WorldStore.open = async () => store;
  const game: any = {
    state: raw(),
    appearance: "explorer",
    hotbar: [],
    recent: [],
    favourites: [],
    paused: false,
    controls: { clear() {} },
    snapshot() {
      return this.state;
    },
    load(
      template: any,
      blocks: any,
      player: any,
      doors: any,
      activity: any,
      props: any,
      layout: any,
    ) {
      this.state = {
        template,
        blocks,
        player,
        doors,
        activity,
        props,
        layout,
        selected: "hand",
      };
    },
    setAppearance(id: string) {
      this.appearance = id;
    },
    refreshModes() {},
    notice() {},
  };
  const session = new Session(game);
  for (let i = 0; i < 100 && !session.ready; i++)
    await new Promise((r) => setTimeout(r, 1));
  if (!session.ready) throw Error("Fixture did not initialise");
  WorldStore.open = previous.open;
  return {
    store,
    a,
    b,
    session,
    game,
    intervals,
    restore() {
      Object.assign(globalThis, {
        document: previous.document,
        addEventListener: previous.addEventListener,
        setInterval: previous.setInterval,
      });
      WorldStore.open = previous.open;
      store.db.close();
    },
  };
}
