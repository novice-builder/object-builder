import { WORLD, LANDMARKS } from "./world-config.js";
export function installMap(initialWorld, getPlayer) {
  const canvas = document.getElementById("mapCanvas"),
    ctx = canvas.getContext("2d"),
    mini = document.getElementById("minimapCanvas"),
    mc = mini.getContext("2d");
  const size = 1024,
    cache = document.createElement("canvas"),
    c = cache.getContext("2d"),
    pad = 24,
    scale = (size - 2 * pad) / (WORLD.halfSize * 2),
    px = (x) => pad + (x + WORLD.halfSize) * scale;
  cache.width = cache.height = size;
  canvas.width = canvas.height = 600;
  mini.width = mini.height = 192;
  let world = initialWorld,
    builds = 0,
    draws = 0,
    last = -Infinity,
    lastPose = "";
  document.getElementById("mapLegend").innerHTML = LANDMARKS.map(
    (l) => `<span>${l.icon} ${l.name}</span>`,
  ).join("");
  function line(points, width, color) {
    c.beginPath();
    points.forEach((p, i) =>
      i ? c.lineTo(px(p[0]), px(p[1])) : c.moveTo(px(p[0]), px(p[1])),
    );
    c.strokeStyle = color;
    c.lineWidth = width * scale;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.stroke();
  }
  function rebuild(next = world) {
    world = next;
    builds++;
    c.fillStyle = "#e7e6cf";
    c.fillRect(0, 0, size, size);
    c.fillStyle = "#a8bf87";
    c.fillRect(pad, pad, size - 2 * pad, size - 2 * pad);
    for (const t of world.treePositions || []) {
      c.fillStyle = "#729761";
      c.beginPath();
      c.arc(px(t.x), px(t.z), 2.5 * scale, 0, Math.PI * 2);
      c.fill();
    }
    for (const f of world.clearings) {
      c.fillStyle = "#c2d397";
      c.fillRect(
        px(f.x - f.w / 2),
        px(f.z - f.d / 2),
        f.w * scale,
        f.d * scale,
      );
    }
    for (const d of world.drives) line(d.points, d.w, "#c5bea7");
    for (const l of world.trails) line(l, 2.4, "#e6d5ad");
    for (const l of world.roads) line(l, 7.4, "#d8c9aa");
    for (const l of world.roads) line(l, 5, "#7d8b87");
    c.fillStyle = "#72aebc";
    for (const p of world.ponds) {
      c.beginPath();
      c.ellipse(
        px(p.x),
        px(p.z),
        p.rx * scale,
        p.rz * scale,
        0,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    for (const h of world.houses) {
      c.save();
      c.translate(px(h.x), px(h.z));
      c.rotate(-h.angle);
      c.fillStyle = "#" + h.roof.toString(16).padStart(6, "0");
      c.fillRect(
        (-h.w / 2) * scale,
        (-h.d / 2) * scale,
        h.w * scale,
        h.d * scale,
      );
      if (h.garage)
        c.fillRect(
          (-h.w / 2 - 4.2) * scale,
          (h.d / 2 - 5.4) * scale,
          4.2 * scale,
          5.4 * scale,
        );
      c.restore();
    }
    c.font = "bold 24px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    for (const l of LANDMARKS) {
      c.fillStyle = "#fff5d9";
      c.beginPath();
      c.arc(px(l.x), px(l.z), 15, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#345e53";
      c.fillText(l.icon, px(l.x), px(l.z));
    }
    lastPose = "";
  }
  function arrow(target, x, y, yaw, r = 12) {
    target.save();
    target.translate(x, y);
    target.rotate(-yaw);
    target.beginPath();
    target.moveTo(0, -r);
    target.lineTo(r * 0.7, r * 0.65);
    target.lineTo(0, r * 0.25);
    target.lineTo(-r * 0.7, r * 0.65);
    target.closePath();
    target.fillStyle = "#f5bd42";
    target.strokeStyle = "#254a42";
    target.lineWidth = 3;
    target.fill();
    target.stroke();
    target.restore();
  }
  rebuild();
  return {
    rebuild,
    stats: () => ({ cacheBuilds: builds, minimapDraws: draws, pose: lastPose }),
    draw() {
      ctx.drawImage(cache, 0, 0, 600, 600);
      const p = getPlayer();
      arrow(ctx, (px(p.x) * 600) / size, (px(p.z) * 600) / size, p.yaw);
      document.getElementById("mapPosition").textContent =
        "The yellow arrow is you. Home ⌂ always takes you back.";
    },
    update(now, visible = true) {
      if (!visible || now - last < 100) return;
      last = now;
      const p = getPlayer(),
        signature = [p.x.toFixed(1), p.z.toFixed(1), p.yaw.toFixed(2)].join(
          ",",
        );
      if (signature === lastPose) return;
      lastPose = signature;
      draws++;
      mc.clearRect(0, 0, 192, 192);
      mc.save();
      mc.beginPath();
      mc.arc(96, 96, 94, 0, Math.PI * 2);
      mc.clip();
      mc.fillStyle = "#e7e6cf";
      mc.fillRect(0, 0, 192, 192);
      const radius = 48,
        span = radius * 2 * scale;
      mc.drawImage(
        cache,
        px(p.x) - span / 2,
        px(p.z) - span / 2,
        span,
        span,
        0,
        0,
        192,
        192,
      );
      arrow(mc, 96, 96, p.yaw, 13);
      mc.fillStyle = "#254a42";
      mc.font = "bold 16px sans-serif";
      mc.textAlign = "center";
      mc.fillText("N", 96, 20);
      mc.restore();
    },
  };
}
