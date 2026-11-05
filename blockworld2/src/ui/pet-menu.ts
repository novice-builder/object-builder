import type { Game } from "../app/game";
export function openPetMenu(game: Game) {
  const pet = game.activity?.pet;
  if (!pet) return;
  game.paused = true;
  game.controls.clear();
  game.vertical = 0;
  const modal = document.querySelector<HTMLElement>("#modal")!;
  modal.hidden = false;
  modal.innerHTML =
    '<section><h1>🐕 Your friend</h1><p style="font-size:72px;margin:8px">🐕 ♡</p><div id="petChoices"></div><button id="closePet">▶ Play</button></section>';
  const close = () => {
    modal.hidden = true;
    game.paused = false;
    game.controls.clear();
  };
  for (const [mode, icon, label] of [
    ["follow", "🐾", "Follow"],
    ["stay", "✋", "Stay"],
    ["home", "⌂", "Home"],
  ] as const) {
    const b = document.createElement("button");
    b.dataset.petMode = mode;
    b.textContent = icon + " " + label;
    b.setAttribute("aria-pressed", String(game.activity!.petMode === mode));
    b.onclick = () => {
      game.activity!.setPetMode(mode);
      game.onEdit();
      close();
      game.notice("🐕 " + icon + " " + label);
    };
    document.querySelector("#petChoices")!.append(b);
  }
  document.querySelector<HTMLButtonElement>("#closePet")!.onclick = close;
}
