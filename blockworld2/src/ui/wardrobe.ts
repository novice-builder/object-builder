import type { Game } from "../app/game";
import { APPEARANCES, createAvatar } from "../player/appearance";
import { modelImage } from "../build/models";
const previews = new Map<string, string>();
export function openWardrobe(game: Game) {
  game.paused = true;
  game.controls.clear();
  game.vertical = 0;
  const modal = document.querySelector<HTMLElement>("#modal")!;
  modal.hidden = false;
  modal.innerHTML =
    '<section class="wardrobe"><h1>👤 Choose your look</h1><div id="avatarGrid"></div><button id="closeWardrobe">▶ Play</button></section>';
  let active = true;
  const tasks: (() => void)[] = [];
  for (const look of APPEARANCES) {
    const button = document.createElement("button");
    button.dataset.avatar = look.id;
    button.setAttribute("aria-label", "Wear " + look.name);
    button.setAttribute("aria-pressed", String(game.appearance === look.id));
    const img = document.createElement("img");
    img.alt = look.name;
    img.width = 112;
    img.height = 96;
    const name = document.createElement("span");
    name.textContent = look.name;
    button.append(img, name);
    button.onclick = () => {
      game.setAppearance(look.id);
      game.onEdit();
      document
        .querySelectorAll<HTMLElement>("[data-avatar]")
        .forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.avatar === look.id)),
        );
    };
    document.querySelector("#avatarGrid")!.append(button);
    tasks.push(() => {
      if (!active) return;
      if (!previews.has(look.id)) {
        const preview = createAvatar(look.id).group;
        preview.rotation.y = Math.PI;
        previews.set(look.id, modelImage(preview, true));
      }
      img.src = previews.get(look.id)!;
    });
  }
  const next = () => {
    if (!active) return;
    tasks.shift()?.();
    if (tasks.length) requestAnimationFrame(next);
  };
  requestAnimationFrame(next);
  document.querySelector<HTMLButtonElement>("#closeWardrobe")!.onclick = () => {
    active = false;
    modal.hidden = true;
    game.paused = false;
    game.controls.clear();
  };
}
