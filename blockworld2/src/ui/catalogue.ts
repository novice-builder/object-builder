import type { Game } from "../app/game";
import { CHOICES, CATALOGUE } from "../build/registry";
import { thumbnail } from "../build/models";
export function renderHotbar(game: Game) {
  const ids = [
      ...game.hotbar.filter((id) => CHOICES.some((i) => i.id === id)),
      ...game.recent.filter((id) => CHOICES.some((i) => i.id === id)),
      ...CATALOGUE.slice(0, 7).map((i) => i.id),
    ],
    unique = [...new Set(ids)].slice(0, 8);
  document.querySelector("#palette")!.innerHTML = unique
    .map((id) => {
      const i = CHOICES.find((i) => i.id === id)!;
      return `<button data-item="${i.id}" aria-label="Choose ${i.label}" title="${i.label}" aria-pressed="${game.selected === id}"><span>${i.icon}</span><small>${i.label}</small></button>`;
    })
    .join("");
}
export function openCatalogue(game: Game) {
  game.paused = true;
  game.controls.clear();
  game.vertical = 0;
  const modal = document.querySelector<HTMLElement>("#modal")!;
  modal.hidden = false;
  modal.innerHTML =
    '<section class="cataloguePanel"><h1>▦ Build anything</h1><input id="catalogueSearch" aria-label="Search catalogue" placeholder="Search (optional)"><div id="categories"></div><div id="catalogueGrid"></div><div class="cataloguePages"><button id="previousPage" aria-label="Previous catalogue page">◀</button><output id="catalogueCount"></output><button id="nextPage" aria-label="Next catalogue page">▶</button><button id="repeatBuild" aria-label="Pieces in a building row"></button><button id="closeCatalogue">▶ Play</button></div></section>';
  let category = "All",
    page = 0,
    generation = 0;
  const close = () => {
    generation++;
    modal.hidden = true;
    game.paused = false;
    game.controls.clear();
  };
  const draw = () => {
    generation++;
    const gen = generation,
      query = document
        .querySelector<HTMLInputElement>("#catalogueSearch")!
        .value.toLowerCase();
    const all = CHOICES.filter(
      (i) =>
        (category === "All" ||
          (category === "Favourites" && game.favourites.includes(i.id)) ||
          (category === "Recent" && game.recent.includes(i.id)) ||
          i.category === category) &&
        i.label.toLowerCase().includes(query),
    );
    page = Math.min(page, Math.max(0, Math.ceil(all.length / 24) - 1));
    const items = all.slice(page * 24, page * 24 + 24),
      grid = document.querySelector("#catalogueGrid")!;
    grid.replaceChildren();
    const tasks: (() => void)[] = [];
    for (const item of items) {
      const card = document.createElement("article");
      card.className = "catalogueCard";
      const button = document.createElement("button");
      button.dataset.catalogue = item.id;
      button.setAttribute("aria-label", "Choose " + item.label);
      const img = document.createElement("img");
      img.alt = item.label;
      img.width = 112;
      img.height = 96;
      const name = document.createElement("span");
      name.textContent = item.label;
      button.append(img, name);
      button.onclick = () => {
        game.choose(item.id);
        close();
      };
      const favourite = document.createElement("button");
      favourite.className = "favourite";
      favourite.textContent = game.favourites.includes(item.id) ? "★" : "☆";
      favourite.setAttribute("aria-label", "Favourite " + item.label);
      favourite.setAttribute(
        "aria-pressed",
        String(game.favourites.includes(item.id)),
      );
      favourite.onclick = () => {
        game.favourites = game.favourites.includes(item.id)
          ? game.favourites.filter((id) => id !== item.id)
          : [item.id, ...game.favourites].slice(0, 32);
        game.onEdit();
        draw();
      };
      const pin = document.createElement("button");
      pin.className = "pin";
      pin.textContent = "📌";
      pin.setAttribute("aria-label", "Pin " + item.label);
      pin.setAttribute("aria-pressed", String(game.hotbar.includes(item.id)));
      pin.onclick = () => {
        game.hotbar = game.hotbar.includes(item.id)
          ? game.hotbar.filter((id) => id !== item.id)
          : [item.id, ...game.hotbar].slice(0, 8);
        renderHotbar(game);
        game.onEdit();
        draw();
      };
      card.append(button, favourite, pin);
      grid.append(card);
      tasks.push(() => {
        if (gen === generation && img.isConnected) img.src = thumbnail(item.id);
      });
    }
    const next = () => {
      if (gen !== generation || modal.hidden) return;
      tasks.shift()?.();
      if (tasks.length) requestAnimationFrame(next);
    };
    requestAnimationFrame(next);
    document.querySelector("#catalogueCount")!.textContent =
      `${all.length} choices · ${page + 1}/${Math.max(1, Math.ceil(all.length / 24))}`;
    document.querySelector<HTMLButtonElement>("#previousPage")!.disabled =
      page === 0;
    document.querySelector<HTMLButtonElement>("#nextPage")!.disabled =
      (page + 1) * 24 >= all.length;
  };
  for (const name of [
    "All",
    "Favourites",
    "Recent",
    ...new Set(CHOICES.map((i) => i.category)),
  ]) {
    const b = document.createElement("button");
    b.textContent =
      name === "Favourites"
        ? "★ Favourites"
        : name === "Recent"
          ? "◷ Recent"
          : name;
    b.dataset.category = name;
    const icons: Record<string, string> = {
      All: "▦",
      Materials: "🧱",
      Shapes: "△",
      Openings: "🚪",
      Furniture: "🪑",
      Kitchen: "🍳",
      Bathroom: "🛁",
      Workshop: "🛠",
      Garden: "🌿",
      Lighting: "💡",
      Play: "🧸",
      Street: "🚏",
      Farm: "🐾",
      Presets: "⌂",
    };
    if (icons[name]) b.textContent = icons[name] + " " + name;
    b.onclick = () => {
      category = name;
      page = 0;
      document
        .querySelectorAll<HTMLElement>("[data-category]")
        .forEach((t) =>
          t.setAttribute(
            "aria-pressed",
            String(t.dataset.category === category),
          ),
        );
      draw();
    };
    document.querySelector("#categories")!.append(b);
  }
  document.querySelector<HTMLInputElement>("#catalogueSearch")!.oninput =
    () => {
      page = 0;
      draw();
    };
  document.querySelector<HTMLButtonElement>("#nextPage")!.onclick = () => {
    page++;
    draw();
  };
  document.querySelector<HTMLButtonElement>("#previousPage")!.onclick = () => {
    page--;
    draw();
  };
  document.querySelector<HTMLButtonElement>("#closeCatalogue")!.onclick = close;
  const repeat = document.querySelector<HTMLButtonElement>("#repeatBuild")!;
  const showRepeat = () => (repeat.textContent = `▦ ×${game.repeatCount}`);
  repeat.onclick = () => {
    game.repeatCount =
      game.repeatCount === 1 ? 3 : game.repeatCount === 3 ? 5 : 1;
    showRepeat();
  };
  showRepeat();
  draw();
}
