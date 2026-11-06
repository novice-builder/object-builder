import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

interface Tread {
  minX: number;
  maxX: number;
  back: number;
  front: number;
  y: number;
  uv: T.Vector2;
  material: T.Material | T.Material[];
}
export interface StepFlight {
  treads: Tread[];
}
export function entranceFlight(f: StepFlight, scale: number) {
  const first = f.treads[0],
    last = f.treads.at(-1)!,
    width = (first.maxX - first.minX) * scale;
  return (
    first.y * scale <= 0.65 &&
    last.y * scale <= 2.4 &&
    width >= 0.8 &&
    width <= 4
  );
}
const EPS = 0.00005;
/** Recognise rectangular, connected, ascending front treads from the actual source triangles. */
export function modelFlights(source: T.Object3D): StepFlight[] {
  source.updateWorldMatrix(true, true);
  const candidates: Tread[] = [];
  source.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    const geometry = o.geometry,
      p = geometry.getAttribute("position"),
      uv = geometry.getAttribute("uv"),
      index = geometry.index;
    const faces: { points: T.Vector3[]; uv: T.Vector2 }[] = [];
    for (let i = 0; i < (index?.count ?? p.count); i += 3) {
      const ids = [0, 1, 2].map((k) => (index ? index.getX(i + k) : i + k)),
        points = ids.map((k) =>
          new T.Vector3().fromBufferAttribute(p, k).applyMatrix4(o.matrixWorld),
        );
      const normal = new T.Triangle(
        ...(points as [T.Vector3, T.Vector3, T.Vector3]),
      ).getNormal(new T.Vector3());
      if (normal.y < 0.999 || points[0].y < EPS || points[0].y > 1) continue;
      faces.push({
        points,
        uv: uv
          ? new T.Vector2().fromBufferAttribute(uv, ids[0])
          : new T.Vector2(),
      });
    }
    for (let i = 0; i < faces.length; i++)
      for (let j = i + 1; j < faces.length; j++) {
        const a = faces[i],
          b = faces[j];
        if (Math.abs(a.points[0].y - b.points[0].y) > EPS) continue;
        const points = [...a.points, ...b.points],
          unique = new Map(
            points.map((p) => [
              [p.x, p.y, p.z].map((n) => n.toFixed(5)).join(),
              p,
            ]),
          );
        if (unique.size !== 4) continue;
        const box = new T.Box3().setFromPoints(points),
          w = box.max.x - box.min.x,
          d = box.max.z - box.min.z;
        if (w < 0.12 || d < 0.02 || d > w * 1.1) continue;
        if (
          [...unique.values()].some(
            (p) =>
              Math.min(Math.abs(p.x - box.min.x), Math.abs(p.x - box.max.x)) >
                EPS ||
              Math.min(Math.abs(p.z - box.min.z), Math.abs(p.z - box.max.z)) >
                EPS,
          )
        )
          continue;
        const key = [box.min.x, box.max.x, box.min.z, box.max.z, box.min.y]
          .map((n) => n.toFixed(5))
          .join();
        if (
          candidates.some(
            (t) =>
              [t.minX, t.maxX, t.back, t.front, t.y]
                .map((n) => n.toFixed(5))
                .join() === key,
          )
        )
          continue;
        candidates.push({
          minX: box.min.x,
          maxX: box.max.x,
          back: box.min.z,
          front: box.max.z,
          y: box.min.y,
          uv: a.uv,
          material: o.material,
        });
      }
  });
  const flights: StepFlight[] = [],
    used = new Set<Tread>();
  for (const first of candidates.sort((a, b) => a.y - b.y)) {
    if (used.has(first)) continue;
    const treads = [first];
    for (let i = 0; i < 8; i++) {
      const last = treads.at(-1)!,
        next = candidates.find(
          (t) =>
            !treads.includes(t) &&
            !used.has(t) &&
            Math.abs(t.minX - first.minX) < EPS &&
            Math.abs(t.maxX - first.maxX) < EPS &&
            Math.abs(t.front - last.back) < EPS &&
            Math.abs(t.y - last.y - first.y) < 0.002,
        );
      if (!next) break;
      treads.push(next);
    }
    if (treads.length >= 3) {
      treads.forEach((t) => used.add(t));
      flights.push({ treads });
    }
  }
  return flights;
}
export function stepPattern(
  flights: StepFlight[],
  scale: number,
  maxStep = 0.3,
) {
  return flights.map((f) => {
    if (!entranceFlight(f, scale)) return 0;
    const rise = f.treads.at(-1)!.y,
      count = f.treads.length;
    return (rise * scale) / count > maxStep + 0.001
      ? count * Math.ceil((rise * scale) / count / maxStep)
      : 0;
  });
}
/** Re-cut recognised oversized treads INSIDE the original envelope. No ramp or enlarged collision box. */
export function fitModelSteps(
  source: T.Group,
  flights: StepFlight[],
  counts: number[],
) {
  const model = source.clone(true),
    changed = flights
      .map((f, i) => ({ f, count: counts[i] }))
      .filter((p) => p.count > 0);
  if (!changed.length) return model;
  model.updateWorldMatrix(true, true);
  model.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    const g = o.geometry,
      p = g.getAttribute("position"),
      index = g.index,
      kept: number[] = [];
    for (let i = 0; i < (index?.count ?? p.count); i += 3) {
      const ids = [0, 1, 2].map((k) => (index ? index.getX(i + k) : i + k)),
        points = ids.map((k) =>
          new T.Vector3().fromBufferAttribute(p, k).applyMatrix4(o.matrixWorld),
        );
      const remove = changed.some(({ f }) => {
        const first = f.treads[0],
          last = f.treads.at(-1)!;
        return (
          points.every(
            (p) =>
              p.x >= first.minX - EPS &&
              p.x <= first.maxX + EPS &&
              p.y >= -EPS &&
              p.y <= last.y + EPS &&
              p.z >= last.back - EPS &&
              p.z <= first.front + EPS,
          ) && !points.every((p) => Math.abs(p.z - last.back) < EPS)
        );
      });
      if (!remove) kept.push(...ids);
    }
    if (kept.length !== (index?.count ?? p.count)) {
      o.geometry = g.clone();
      o.geometry.setIndex(kept);
      o.userData.ownedStepGeometry = true;
    }
  });
  for (const { f, count } of changed) {
    const first = f.treads[0],
      last = f.treads.at(-1)!,
      rise = last.y / count,
      depth = (first.front - last.back) / count,
      geometries: T.BufferGeometry[] = [];
    for (let i = 0; i < count; i++) {
      const height = (i + 1) * rise,
        geometry = new T.BoxGeometry(first.maxX - first.minX, height, depth);
      geometry.translate(
        (first.minX + first.maxX) / 2,
        height / 2,
        first.front - (i + 0.5) * depth,
      );
      const uv = geometry.getAttribute("uv");
      for (let j = 0; j < uv.count; j++) uv.setXY(j, first.uv.x, first.uv.y);
      geometries.push(geometry);
    }
    const geometry = mergeGeometries(geometries)!,
      mesh = new T.Mesh(geometry, first.material);
    geometries.forEach((g) => g.dispose());
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.ownedStepGeometry = true;
    mesh.name = "Fitted source stair treads";
    model.add(mesh);
  }
  return model;
}
