import type { Game } from "../app/game";
import { safeGround } from "../world/spawn";
import { cellBox } from "../legacy06/core.js";
export function openMap(game: Game) {
  const modal = document.querySelector<HTMLElement>("#modal")!;
  game.paused = true;
  game.controls.clear();
  modal.hidden = false;
  modal.innerHTML =
    '<section><h1>🗺 Let’s explore</h1><canvas id="mapCanvas" width="560" height="420" aria-label="Drag map; choose a landmark to travel"></canvas><div id="mapPlaces"></div><div><button id="zoomIn" aria-label="Zoom in">＋</button><button id="zoomOut" aria-label="Zoom out">−</button><button id="closeMap">▶ Play</button></div><p id="mapMessage">Drag to look around. Choose a picture to travel.</p></section>';
  const canvas = document.querySelector<HTMLCanvasElement>("#mapCanvas")!,
    ctx = canvas.getContext("2d")!;
  let zoom = game.template === "home-square" ? 4 : 0.8,
    ox = 280,
    oy = 210,
    drag: { x: number; y: number } | null = null;
  const draw = () => {
    ctx.fillStyle = "#c4d39e";
    ctx.fillRect(0, 0, 560, 420);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(zoom, zoom);
    ctx.fillStyle = "#859995";
    if (game.template === "home-square") {
      for (const z of [-36, 4, 36]) ctx.fillRect(-43, z - 3, 86, 6);
      for (const x of [-40, 8, 40]) ctx.fillRect(x - 3, -39, 6, 78);
    }
    for (const h of game.world.houses) {
      ctx.fillStyle = "#b88361";
      ctx.fillRect(h.x - h.w / 2, h.z - h.d / 2, h.w, h.d);
    }
    ctx.fillStyle = "#edb447";
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.z, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  draw();
  canvas.onpointerdown = (e) => {
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY };
  };
  canvas.onpointermove = (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    ox += ((e.clientX - drag.x) * 560) / r.width;
    oy += ((e.clientY - drag.y) * 420) / r.height;
    drag = { x: e.clientX, y: e.clientY };
    draw();
  };
  canvas.onpointerup = canvas.onpointercancel = () => {
    drag = null;
  };
  document.querySelector<HTMLButtonElement>("#zoomIn")!.onclick = () => {
    zoom = Math.min(10, zoom * 1.3);
    draw();
  };
  document.querySelector<HTMLButtonElement>("#zoomOut")!.onclick = () => {
    zoom = Math.max(0.3, zoom / 1.3);
    draw();
  };
  const close = () => {
    modal.hidden = true;
    game.paused = false;
    game.controls.clear();
  };
  document.querySelector<HTMLButtonElement>("#closeMap")!.onclick = close;
  const places = game.world.landmarks || [
    {
      name: "Home",
      icon: "⌂",
      ...{
        x: game.template === "blank" ? 0 : -14.4,
        z: game.template === "blank" ? 8 : -1.2,
      },
    },
  ];
  for (const place of places) {
    const b = document.createElement("button");
    b.textContent = place.icon + " " + place.name;
    b.dataset.place = place.name;
    b.onclick = () => {
      try {
        const p = safeGround(place, [
          ...game.obstacles(),
          ...game.commands.blocks.map(cellBox),
        ]);
        Object.assign(game.player, p);
        game.flying = false;
        if (game.activity) game.activity.driving = false;
        game.vertical = 0;
        game.refreshModes();
        game.cancel();
        game.onEdit();
        close();
      } catch (e) {
        document.querySelector("#mapMessage")!.textContent = String(e);
      }
    };
    document.querySelector("#mapPlaces")!.append(b);
  }
}
