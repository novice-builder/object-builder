import { WORLD, LANDMARKS } from "./world-config.js";
export function installMap(world, getPlayer) {
  const canvas = document.getElementById("mapCanvas"),
    ctx = canvas.getContext("2d"),
    size = 600,
    pad = 30,
    scale = (size - pad * 2) / (WORLD.halfSize * 2),
    px = (x) => pad + (x + WORLD.halfSize) * scale;
  canvas.width = canvas.height = size;
  function line(points, width, color) {
    ctx.beginPath();
    points.forEach((p, i) =>
      i ? ctx.lineTo(px(p[0]), px(p[1])) : ctx.moveTo(px(p[0]), px(p[1])),
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = width * scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  return {
    draw() {
      ctx.fillStyle = "#e7e6cf";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#a8bf87";
      ctx.fillRect(pad, pad, size - pad * 2, size - pad * 2);
      for (const l of world.trails) line(l, 2.4, "#e6d5ad");
      for (const l of world.roads) line(l, 7.4, "#d8c9aa");
      for (const l of world.roads) line(l, 5, "#7d8b87");
      for (const f of world.clearings) {
        ctx.fillStyle = "#c5d598";
        ctx.fillRect(
          px(f.x - f.w / 2),
          px(f.z - f.d / 2),
          f.w * scale,
          f.d * scale,
        );
      }
      ctx.fillStyle = "#72aebc";
      ctx.beginPath();
      ctx.ellipse(px(18), px(-101), 16 * scale, 10 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      for (const h of world.houses) {
        ctx.save();
        ctx.translate(px(h.x), px(h.z));
        ctx.rotate(-h.angle);
        ctx.fillStyle = "#" + h.roof.toString(16).padStart(6, "0");
        ctx.fillRect(
          (-h.w / 2) * scale,
          (-h.d / 2) * scale,
          h.w * scale,
          h.d * scale,
        );
        ctx.restore();
      }
      ctx.font = "bold 21px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const l of LANDMARKS) {
        ctx.fillStyle = "#fff5d9";
        ctx.beginPath();
        ctx.arc(px(l.x), px(l.z), 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#345e53";
        ctx.fillText(l.icon, px(l.x), px(l.z));
      }
      const p = getPlayer();
      ctx.save();
      ctx.translate(px(p.x), px(p.z));
      ctx.rotate(-p.yaw);
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(9, 8);
      ctx.lineTo(0, 4);
      ctx.lineTo(-9, 8);
      ctx.closePath();
      ctx.fillStyle = "#eab94f";
      ctx.strokeStyle = "#31594f";
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      document.getElementById("mapPosition").textContent =
        "The yellow arrow is you. Home ⌂ always takes you back.";
    },
  };
}
