import * as T from "three";
// Small original procedural swatches; no downloaded art or runtime requests.
export function blockTexture(type) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const c = canvas.getContext("2d");
  const colors = {
    wood: ["#c49a6b", "#9c744c"],
    brick: ["#cb8668", "#f0c7a0"],
    stone: ["#a4b0ab", "#879790"],
    glass: ["#a4d1d4", "#d5eeeb"],
  };
  const [base, line] = colors[type];
  c.fillStyle = base;
  c.fillRect(0, 0, 64, 64);
  c.strokeStyle = line;
  c.lineWidth = 2;
  if (type === "wood") {
    for (let y = 0; y < 64; y += 16) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(64, y);
      c.stroke();
      c.fillStyle = "#ad845920";
      c.fillRect(((y * 3) % 48) + 4, y + 5, 20, 2);
    }
  }
  if (type === "brick") {
    for (let y = 0; y <= 64; y += 16) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(64, y);
      c.stroke();
      for (let x = (y / 16) % 2 ? 16 : 0; x < 64; x += 32) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + 16);
        c.stroke();
      }
    }
  }
  if (type === "stone") {
    c.fillStyle = "#8b9c9144";
    for (let i = 0; i < 17; i++) c.fillRect((i * 23) % 60, (i * 37) % 60, 4, 2);
  }
  if (type === "glass") {
    c.lineWidth = 3;
    c.strokeRect(2, 2, 60, 60);
    c.beginPath();
    c.moveTo(14, 41);
    c.lineTo(41, 14);
    c.moveTo(25, 49);
    c.lineTo(49, 25);
    c.stroke();
  }
  c.strokeStyle = type === "glass" ? "#79a9ad" : "#735d4238";
  c.lineWidth = 1;
  c.strokeRect(0.5, 0.5, 63, 63);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = T.NearestFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  return texture;
}
