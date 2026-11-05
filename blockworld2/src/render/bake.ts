import * as T from "three";
/** Bake direct opaque asset parts into one vertex-colour draw; retain glass/moving children. */
export function bakeOpaqueParts(group: T.Group) {
  const positions: number[] = [],
    normals: number[] = [],
    colors: number[] = [],
    oldGeometry = new Set<T.BufferGeometry>(),
    oldMaterial = new Set<T.Material>();
  const v = new T.Vector3(),
    n = new T.Vector3(),
    normal = new T.Matrix3();
  for (const o of [...group.children]) {
    if (
      !(o instanceof T.Mesh) ||
      Array.isArray(o.material) ||
      o.material.transparent
    )
      continue;
    const m = o.material as T.MeshLambertMaterial;
    if (!m.color) continue;
    o.updateMatrix();
    normal.getNormalMatrix(o.matrix);
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry,
      p = g.attributes.position,
      ns = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrix);
      n.fromBufferAttribute(ns, i).applyMatrix3(normal).normalize();
      positions.push(v.x, v.y, v.z);
      normals.push(n.x, n.y, n.z);
      colors.push(m.color.r, m.color.g, m.color.b);
    }
    if (g !== o.geometry) g.dispose();
    oldGeometry.add(o.geometry);
    oldMaterial.add(m);
    o.removeFromParent();
  }
  if (positions.length) {
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    g.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
    g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    g.computeBoundingSphere();
    group.add(new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true })));
  }
  oldGeometry.forEach((g) => {
    if (!group.children.some((o) => o instanceof T.Mesh && o.geometry === g))
      g.dispose();
  });
  oldMaterial.forEach((m) => {
    if (!group.children.some((o) => o instanceof T.Mesh && o.material === m))
      m.dispose();
  });
}
