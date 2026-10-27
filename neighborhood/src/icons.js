const wrap = (s) =>
  `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
const stroke = (s) =>
  wrap(
    `<g stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${s}</g>`,
  );
export const icons = {
  home: stroke('<path d="M5 22L24 6l19 16M10 20v22h28V20M20 42V28h9v14"/>'),
  speaker: stroke(
    '<path d="M6 19h9L26 9v30L15 29H6zM33 16q9 8 0 16M38 10q15 14 0 28"/>',
  ),
  menu: stroke('<path d="M8 12h32M8 24h32M8 36h32"/>'),
  build: stroke('<path d="M10 39l21-24M22 9l6-6 15 13-6 7-7-5M8 36l6 6"/>'),
  undo: stroke('<path d="M16 9L5 20l11 10M6 20h22q17 0 12 17"/>'),
  remove: stroke('<path d="M12 24h24"/>'),
  place: stroke('<path d="M24 10v28M10 24h28"/>'),
  jump: stroke('<path d="M10 23L24 9l14 14M24 10v29M10 41h28"/>'),
  door: stroke('<path d="M9 43V5h28v38M15 42V10l17 5v28zM27 27h1"/>'),
  table: stroke(
    '<path d="M6 14h36v9H6zM10 23v20M38 23v20M16 14V6h16v8M14 32h20"/>',
  ),
  wood: wrap(
    '<path d="M7 9h34v33H7z" fill="#bd905e" stroke="#855d3c" stroke-width="2"/><path d="M8 20h32M8 32h32M17 10v10M30 20v12M19 32v9" stroke="#94683f" stroke-width="2"/>',
  ),
  brick: wrap(
    '<path d="M7 9h34v33H7z" fill="#c7785a" stroke="#9b523e" stroke-width="2"/><path d="M7 20h34M7 31h34M24 9v11M15 20v11M33 20v11M24 31v11" stroke="#f2c29a" stroke-width="2"/>',
  ),
  stone: wrap(
    '<path d="M7 9h34v33H7z" fill="#9ca6a4" stroke="#718080" stroke-width="2"/><path d="M9 23l12-4 7 10 12-3M21 19l3-10M28 29l-4 12" stroke="#748483" stroke-width="2"/>',
  ),
  glass: wrap(
    '<path d="M7 9h34v33H7z" fill="#a4d1d4" stroke="#6c9ca2" stroke-width="2"/><path d="M12 28l16-14M20 35l16-14" stroke="#eaffed" stroke-width="4"/>',
  ),
  flowers: wrap(
    '<path d="M24 35V18m0 12l-9-5m9 9l9-7" stroke="#628758" stroke-width="3"/><path d="M12 32h24l-4 13H16z" fill="#be8157"/><circle cx="24" cy="14" r="11" fill="#e49b84"/><circle cx="24" cy="14" r="5" fill="#f5d37a"/>',
  ),
  lantern: wrap(
    '<path d="M18 10V6h12v4M13 13h22v27H13z" stroke="#637268" stroke-width="3"/><path d="M17 17h14v19H17z" fill="#f4c969"/><path d="M10 11h28M10 42h28" stroke="#637268" stroke-width="4"/>',
  ),
  bench: wrap(
    '<path d="M6 10h36v17H6zM6 29h36v6H6z" fill="#ad7b4f"/><path d="M10 35v10M38 35v10M6 18h36" stroke="#6b6d55" stroke-width="3"/>',
  ),
};
export const names = {
  wood: "Wood",
  brick: "Brick",
  stone: "Stone",
  glass: "Glass",
  flowers: "Flowers",
  lantern: "Lantern",
  bench: "Bench",
};
