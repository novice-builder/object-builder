import * as T from "three";
/** A continuous ribbon: adjacent strips share their edge, avoiding stacked discs at bends. */
export function trailGeometry(
  points: number[][],
  width: number,
  height: (x: number, z: number) => number,
  bridgeX?: number,
) {
  const samples: number[][] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length < 0.0001) continue;
    const stops = Array.from(
      { length: Math.ceil(length / 1.3) },
      (_, k) => k / Math.ceil(length / 1.3),
    );
    if (bridgeX !== undefined && a[1] === 8 && b[1] === 8)
      for (const edge of [-5, 5]) {
        const t = (bridgeX + edge - a[0]) / (b[0] - a[0]);
        if (t > 0 && t < 1) stops.push(t);
      }
    for (const t of [...new Set(stops)].sort((a, b) => a - b))
      samples.push([
        T.MathUtils.lerp(a[0], b[0], t),
        T.MathUtils.lerp(a[1], b[1], t),
      ]);
  }
  samples.push(points[points.length - 1]);
  const v: number[] = [],
    uv: number[] = [],
    ix: number[] = [];
  const closed =
    samples.length > 2 &&
    Math.hypot(
      samples[0][0] - samples.at(-1)![0],
      samples[0][1] - samples.at(-1)![1],
    ) < 0.001;
  const normal = (a: number[], b: number[]) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [-(b[1] - a[1]) / d, (b[0] - a[0]) / d];
  };
  let length = 0;
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i],
      before = samples[i - 1] || (closed ? samples.at(-2)! : p),
      after = samples[i + 1] || (closed ? samples[1] : p);
    const n0 = i === 0 && !closed ? normal(p, after) : normal(before, p);
    const n1 = i === samples.length - 1 && !closed ? n0 : normal(p, after);
    const sum = Math.hypot(n0[0] + n1[0], n0[1] + n1[1]);
    const nx = sum > 0.001 ? (n0[0] + n1[0]) / sum : n1[0],
      nz = sum > 0.001 ? (n0[1] + n1[1]) / sum : n1[1];
    const half = width / 2 / Math.max(0.55, nx * n1[0] + nz * n1[1]);
    if (i) length += Math.hypot(p[0] - before[0], p[1] - before[1]);
    for (const side of [-1, 1]) {
      const x = p[0] + nx * half * side,
        z = p[1] + nz * half * side;
      v.push(x, height(x, z) + 0.045, z);
      uv.push(((side + 1) * width) / 2, length);
    }
    if (i < samples.length - 1) {
      const midX = (p[0] + after[0]) / 2,
        midZ = (p[1] + after[1]) / 2;
      if (
        bridgeX !== undefined &&
        Math.abs(midZ - 8) < 0.01 &&
        Math.abs(midX - bridgeX) < 5
      )
        continue;
      const j = i * 2;
      ix.push(j, j + 1, j + 3, j, j + 3, j + 2);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(v, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setIndex(ix);
  g.computeVertexNormals();
  return g;
}
