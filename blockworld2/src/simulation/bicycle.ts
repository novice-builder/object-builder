import * as T from "three";
/** Original low-poly step-through bicycle; no external assets. */
export function bicycleModel() {
  const g = new T.Group(),
    cube = new T.BoxGeometry(1, 1, 1),
    metal = new T.MeshLambertMaterial({ color: 0x718f98 }),
    dark = new T.MeshLambertMaterial({ color: 0x475b57 });
  const bar = (a: T.Vector3, b: T.Vector3, width = 0.065) => {
    const m = new T.Mesh(cube, metal);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.scale.set(width, a.distanceTo(b), width);
    m.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    );
    g.add(m);
  };
  const p = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
  for (const z of [-0.65, 0.65]) {
    const w = new T.Mesh(new T.TorusGeometry(0.32, 0.06, 5, 16), dark);
    w.rotation.y = Math.PI / 2;
    w.position.set(0, 0.38, z);
    g.add(w);
  }
  bar(p(0, 0.38, 0.65), p(0, 0.7, 0.1));
  bar(p(0, 0.7, 0.1), p(0, 0.42, 0));
  bar(p(0, 0.42, 0), p(0, 0.38, 0.65));
  bar(p(0, 0.42, 0), p(0, 0.95, -0.55));
  bar(p(0, 0.95, -0.55), p(0, 0.7, 0.1));
  bar(p(0, 0.95, -0.55), p(0, 0.38, -0.65));
  bar(p(0, 0.95, -0.55), p(0, 1.12, -0.5));
  bar(p(-0.38, 1.12, -0.5), p(0.38, 1.12, -0.5));
  bar(p(0, 0.42, 0), p(0, 0.87, 0.1));
  const seat = new T.Mesh(cube, dark);
  seat.position.set(0, 0.9, 0.15);
  seat.scale.set(0.34, 0.1, 0.3);
  g.add(seat);
  for (const x of [-0.2, 0.2]) {
    const pedal = new T.Mesh(cube, dark);
    pedal.position.set(x, 0.4, 0);
    pedal.scale.set(0.2, 0.08, 0.16);
    g.add(pedal);
  }
  return g;
}
