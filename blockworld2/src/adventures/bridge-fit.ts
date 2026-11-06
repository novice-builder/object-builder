import * as T from "three";
/** The supplied bridge is authored diagonally. Fit its actual long axis, not its enclosing X/Z box. */
export function fitBridge(source: T.Object3D, x: number, z: number) {
  source.updateMatrixWorld(true);
  const points: T.Vector3[] = [],
    p = new T.Vector3();
  source.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    const a = o.geometry.getAttribute("position"),
      ix = o.geometry.index;
    for (let i = 0; i < (ix?.count ?? a.count); i++) {
      p.fromBufferAttribute(a, ix ? ix.getX(i) : i).applyMatrix4(o.matrixWorld);
      points.push(p.clone());
    }
  });
  const centre = new T.Vector3();
  for (const v of points) centre.add(v);
  centre.multiplyScalar(1 / points.length);
  let xx = 0,
    zz = 0,
    xz = 0;
  for (const v of points) {
    const dx = v.x - centre.x,
      dz = v.z - centre.z;
    xx += dx * dx;
    zz += dz * dz;
    xz += dx * dz;
  }
  const angle = 0.5 * Math.atan2(2 * xz, xx - zz),
    rotation = new T.Matrix4().makeRotationY(angle),
    bounds = new T.Box3();
  for (const v of points) bounds.expandByPoint(v.applyMatrix4(rotation));
  const size = bounds.getSize(new T.Vector3()),
    mid = bounds.getCenter(new T.Vector3());
  source.rotation.y = angle;
  source.position.set(-mid.x, -bounds.min.y, -mid.z);
  const root = new T.Group();
  root.add(source);
  root.scale.set(10 / size.x, 3 / size.y, 4.2 / size.z);
  root.position.set(x, -2.45, z);
  root.userData.bridge = { axisAngle: angle, span: 10, width: 4.2 };
  return root;
}
