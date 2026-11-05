import type { Game } from "../app/game";
export function applyControlPreferences(game: Game) {
  document.body.classList.toggle("leftHanded", game.leftHanded);
}
export function openControlMenu(game: Game) {
  game.paused = true;
  game.controls.clear();
  game.vertical = 0;
  const modal = document.querySelector<HTMLElement>("#modal")!;
  modal.hidden = false;
  modal.innerHTML =
    '<section><h1>🎮 Comfortable controls</h1><h2>Look speed</h2><div id="lookSpeeds"></div><button id="handed" aria-label="Swap control sides">↔ Swap hands</button><button id="closeControls">▶ Play</button></section>';
  for (const [value, label] of [
    [0.6, "🐢 Gentle"],
    [1, "🚶 Normal"],
    [1.4, "🐇 Quick"],
  ] as const) {
    const b = document.createElement("button");
    b.dataset.speed = String(value);
    b.textContent = label;
    b.setAttribute("aria-pressed", String(game.lookSpeed === value));
    b.onclick = () => {
      game.lookSpeed = value;
      game.onEdit();
      document
        .querySelectorAll<HTMLElement>("[data-speed]")
        .forEach((t) =>
          t.setAttribute(
            "aria-pressed",
            String(Number(t.dataset.speed) === value),
          ),
        );
    };
    document.querySelector("#lookSpeeds")!.append(b);
  }
  const handed = document.querySelector<HTMLButtonElement>("#handed")!;
  handed.setAttribute("aria-pressed", String(game.leftHanded));
  handed.onclick = () => {
    game.leftHanded = !game.leftHanded;
    applyControlPreferences(game);
    handed.setAttribute("aria-pressed", String(game.leftHanded));
    game.onEdit();
  };
  document.querySelector<HTMLButtonElement>("#closeControls")!.onclick = () => {
    modal.hidden = true;
    game.paused = false;
    game.controls.clear();
  };
}
