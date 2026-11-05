import * as T from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
/** Bake opaque untextured primitives into one draw, retaining their linear colours and transforms. */
export function bakeNature(
  source: T.Object3D,
  material: T.MeshStandardMaterial,
): T.Group | null {
  source.updateMatrixWorld(true);
  const meshes: T.Mesh[] = [];
  let supported = true;
  source.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    if (Array.isArray(o.material)) {
      supported = false;
      return;
    }
    const m = o.material as T.MeshStandardMaterial;
    if (
      !m.isMeshStandardMaterial ||
      m.map ||
      m.transparent ||
      m.opacity !== 1 ||
      m.emissive.getHex() !== 0 ||
      m.normalMap ||
      m.roughness !== 1 ||
      m.metalness !== 0 ||
      m.side !== T.FrontSide
    ) {
      supported = false;
      return;
    }
    meshes.push(o);
  });
  if (!supported || !meshes.length) return null;
  const indexed = meshes.every((o) => o.geometry.index !== null);
  const parts = meshes.map((o) => {
    const copy = o.geometry.clone(),
      g = !indexed && copy.index ? copy.toNonIndexed() : copy;
    if (g !== copy) copy.dispose();
    g.applyMatrix4(o.matrixWorld);
    const p = g.getAttribute("position"),
      colors = new Float32Array(p.count * 3),
      existing = g.getAttribute("color"),
      color = (o.material as T.MeshStandardMaterial).color;
    for (let i = 0; i < p.count; i++) {
      colors[i * 3] = color.r * (existing ? existing.getX(i) : 1);
      colors[i * 3 + 1] = color.g * (existing ? existing.getY(i) : 1);
      colors[i * 3 + 2] = color.b * (existing ? existing.getZ(i) : 1);
    }
    for (const name of Object.keys(g.attributes))
      if (!["position", "normal"].includes(name)) g.deleteAttribute(name);
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    g.setAttribute("color", new T.BufferAttribute(colors, 3));
    g.clearGroups();
    return g;
  });
  const geometry = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!geometry) return null;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const group = new T.Group();
  group.add(new T.Mesh(geometry, material));
  return group;
}
/** Fully fogged bounds can be skipped without cutting a visible canopy or shadow near the player. */
export function fogVisible(
  center: { x: number; y: number; z: number },
  radius: number,
  camera: { x: number; y: number; z: number },
  far: number,
) {
  const dx = center.x - camera.x,
    dy = center.y - camera.y,
    dz = center.z - camera.z;
  return dx * dx + dy * dy + dz * dz <= (far + radius) * (far + radius);
}
