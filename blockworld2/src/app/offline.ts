import type { Session } from "./session";
export interface SaveGate {
  ready: boolean;
  blocked: boolean;
  save(): Promise<void>;
}
/** Activation is never sent before a committed save, including failed/stale tabs. */
export async function activateSavedUpdate(
  gate: SaveGate,
  worker: { postMessage(message: unknown): void },
  approve = () => {},
) {
  if (!gate.ready || gate.blocked)
    throw Error("Save or export your world before updating");
  await gate.save();
  if (gate.blocked) throw Error("Save failed; update is paused");
  approve();
  worker.postMessage({ type: "BW2_ACTIVATE" });
}
export async function startOffline(session: Session) {
  const output = document.createElement("output");
  output.id = "offlineState";
  output.setAttribute("aria-live", "polite");
  document.querySelector(".brand")!.append(output);
  if (
    document.documentElement.dataset.standalone === "true" ||
    location.protocol === "file:"
  ) {
    output.textContent = "Local HTML · keep portable backups";
    return;
  }
  if (!import.meta.env.PROD) {
    output.textContent = "Development server";
    return;
  }
  if (!("serviceWorker" in navigator)) {
    output.textContent = "Use portable backups on this browser";
    return;
  }
  output.textContent = "◌ Preparing offline play…";
  try {
    const registration = await navigator.serviceWorker.register("./sw.js", {
      scope: "./",
      updateViaCache: "none",
    });
    const button = document.createElement("button");
    button.id = "updateReady";
    button.hidden = true;
    button.textContent = "↻ Update";
    button.setAttribute("aria-label", "Save and update game");
    document.body.append(button);
    let approved = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (approved) location.reload();
    });
    const waiting = () => {
      button.hidden = !registration.waiting;
      button.disabled = !session.ready || session.blocked;
    };
    document.addEventListener("bw2-save-status", waiting);
    const readiness = async () => {
      try {
        const release = await fetch(
          new URL("release.json", registration.scope),
        ).then((r) => r.json());
        const key =
          "bw2:development:" +
          encodeURIComponent(registration.scope) +
          ":" +
          release.build;
        if (
          (await caches.has(key)) &&
          (await (
            await caches.open(key)
          ).match(new URL("index.html", registration.scope).href))
        )
          output.textContent =
            "✓ Offline ready · " + String(release.build).slice(0, 6);
        else output.textContent = "Open online once to prepare offline play";
      } catch {
        output.textContent = "Offline preparation unavailable · keep backups";
      }
    };
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed") setTimeout(waiting, 0);
        if (worker.state === "activated") void readiness();
      });
    });
    waiting();
    button.onclick = () => {
      void (async () => {
        button.disabled = true;
        try {
          const worker = registration.waiting;
          if (!worker) {
            waiting();
            return;
          }
          await activateSavedUpdate(session, worker, () => {
            approved = true;
          });
        } catch (e) {
          session.game.notice(String(e));
          approved = false;
        } finally {
          waiting();
        }
      })();
    };
    await navigator.serviceWorker.ready;
    await readiness();
  } catch {
    output.textContent = "Offline preparation unavailable · keep backups";
  }
}
