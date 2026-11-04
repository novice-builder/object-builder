import * as T from "three";
// Bake door decorations/slats once. The complete animated leaf is one draw call.
// Identical doors share the same vertex-colored geometry; physics uses doorSolidAt.
export function batchDoorLeaves(doors) {
  const cache = new Map(),
    material = new T.MeshLambertMaterial({ vertexColors: true }),
    matrix = new T.Matrix4(),
    point = new T.Vector3(),
    normal = new T.Vector3(),
    normalMatrix = new T.Matrix3();
  let before = 0;
  for (const d of doors) {
    const root = d.leaf || d.pivot,
      parts = [...root.children].filter((o) => o.isMesh);
    before += parts.length;
    const signature = JSON.stringify(
      parts.map((o) => [
        o.geometry.parameters,
        o.position.toArray(),
        o.rotation.toArray(),
        o.scale.toArray(),
        o.material.color.getHex(),
      ]),
    );
    let geometry = cache.get(signature),
      panelVertices = 0;
    if (!geometry) {
      const positions = [],
        normals = [],
        colors = [];
      for (const [i, part] of parts.entries()) {
        part.updateMatrix();
        matrix.copy(part.matrix);
        normalMatrix.getNormalMatrix(matrix);
        const g = part.geometry.index
            ? part.geometry.toNonIndexed()
            : part.geometry,
          p = g.attributes.position,
          n = g.attributes.normal,
          c = part.material.color;
        if (i === 0) panelVertices = p.count;
        for (let j = 0; j < p.count; j++) {
          point.fromBufferAttribute(p, j).applyMatrix4(matrix);
          normal
            .fromBufferAttribute(n, j)
            .applyMatrix3(normalMatrix)
            .normalize();
          positions.push(point.x, point.y, point.z);
          normals.push(normal.x, normal.y, normal.z);
          colors.push(c.r, c.g, c.b);
        }
        if (g !== part.geometry) g.dispose();
      }
      geometry = new T.BufferGeometry();
      geometry.setAttribute(
        "position",
        new T.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
      geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
      geometry.computeBoundingSphere();
      geometry.userData.panelVertices = panelVertices;
      cache.set(signature, geometry);
    }
    for (const part of parts) {
      root.remove(part);
      part.geometry.dispose();
    }
    const mesh = new T.Mesh(geometry, material);
    mesh.name = d.id + " leaf";
    root.add(mesh);
  }
  return {
    partsBefore: before,
    meshesAfter: doors.length,
    sharedGeometries: cache.size,
  };
}
