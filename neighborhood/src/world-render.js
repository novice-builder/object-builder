import * as T from "three";
import { WORLD } from "./world-config.js";
// Merge static geometry with vertex colors per spatial chunk. No LOD replacement:
// full geometry remains resident, and normal frustum culling skips unseen chunks.
export function batchStaticWorld(scene, excluded) {
  const chunks = new Map(),
    m = new T.Matrix4(),
    combined = new T.Matrix4(),
    v = new T.Vector3(),
    n = new T.Vector3(),
    normal = new T.Matrix3();
  const source = [...scene.children].filter(
    (o) => o.isMesh && !excluded.has(o),
  );
  const geometries = new Set(),
    materials = new Set();
  for (const mesh of source) {
    mesh.updateMatrixWorld(true);
    const g = mesh.geometry.index
      ? mesh.geometry.toNonIndexed()
      : mesh.geometry;
    const p = g.attributes.position,
      ns = g.attributes.normal,
      color = mesh.material.color;
    const count = mesh.isInstancedMesh ? mesh.count : 1;
    for (let i = 0; i < count; i++) {
      if (mesh.isInstancedMesh) {
        mesh.getMatrixAt(i, m);
        combined.multiplyMatrices(mesh.matrixWorld, m);
      } else combined.copy(mesh.matrixWorld);
      const x = combined.elements[12],
        z = combined.elements[14],
        key = `${Math.floor(x / WORLD.chunkSize)},${Math.floor(z / WORLD.chunkSize)}`;
      if (!chunks.has(key))
        chunks.set(key, { positions: [], normals: [], colors: [] });
      const c = chunks.get(key);
      normal.getNormalMatrix(combined);
      for (let j = 0; j < p.count; j++) {
        v.fromBufferAttribute(p, j).applyMatrix4(combined);
        n.fromBufferAttribute(ns, j).applyMatrix3(normal).normalize();
        c.positions.push(v.x, v.y, v.z);
        c.normals.push(n.x, n.y, n.z);
        c.colors.push(color.r, color.g, color.b);
      }
      // Preserve two-sided authored roof planes explicitly; closed boxes/trees
      // keep normal back-face culling instead of forcing double-sided rasterisation.
      if (mesh.material.side === T.DoubleSide)
        for (let tri = 0; tri < p.count; tri += 3)
          for (const j of [tri + 2, tri + 1, tri]) {
            v.fromBufferAttribute(p, j).applyMatrix4(combined);
            n.fromBufferAttribute(ns, j)
              .applyMatrix3(normal)
              .normalize()
              .negate();
            c.positions.push(v.x, v.y, v.z);
            c.normals.push(n.x, n.y, n.z);
            c.colors.push(color.r, color.g, color.b);
          }
    }
    if (g !== mesh.geometry) g.dispose();
    geometries.add(mesh.geometry);
    materials.add(mesh.material);
    if (mesh.isInstancedMesh) mesh.dispose();
    scene.remove(mesh);
  }
  const material = new T.MeshLambertMaterial({
    vertexColors: true,
    side: T.FrontSide,
  });
  const renderChunks = [];
  let triangles = 0;
  for (const [key, c] of chunks) {
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(c.positions, 3));
    g.setAttribute("normal", new T.Float32BufferAttribute(c.normals, 3));
    g.setAttribute("color", new T.Float32BufferAttribute(c.colors, 3));
    g.computeBoundingSphere();
    const mesh = new T.Mesh(g, material);
    mesh.name = `scenery ${key}`;
    scene.add(mesh);
    renderChunks.push(mesh);
    triangles += c.positions.length / 9;
  }
  // Some materials are still used by animated door meshes; keep those shared.
  const used = new Set();
  scene.traverse((o) => {
    if (o.isMesh) used.add(o.material);
  });
  for (const g of geometries) g.dispose();
  for (const mat of materials) if (!used.has(mat)) mat.dispose();
  return {
    chunks: chunks.size,
    triangles,
    hidden: 0,
    updateVisibility(camera, fogFar, enabled = true) {
      const inverse = camera.matrixWorldInverse.elements;
      let hidden = 0;
      for (const mesh of renderChunks) {
        const sphere = mesh.geometry.boundingSphere,
          c = sphere.center;
        const nearDepth =
          -(
            inverse[2] * c.x +
            inverse[6] * c.y +
            inverse[10] * c.z +
            inverse[14]
          ) - sphere.radius;
        // Three.js linear fog uses view-space depth. A 10 cm margin keeps
        // every partially fogged vertex, independent of heading or FOV.
        mesh.visible = !enabled || nearDepth <= fogFar + 0.1;
        if (!mesh.visible) hidden++;
      }
      this.hidden = hidden;
      return hidden;
    },
    showAll() {
      for (const mesh of renderChunks) mesh.visible = true;
      this.hidden = 0;
    },
  };
}
