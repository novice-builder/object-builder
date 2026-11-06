import * as T from "three";
/** Three's fog shader uses forward view depth, not radial distance at the sides of a wide view. */
export function fogDepthVisible(
  center: { x: number; y: number; z: number },
  radius: number,
  view: readonly number[],
  far: number,
) {
  const depth = -(
    view[2] * center.x +
    view[6] * center.y +
    view[10] * center.z +
    view[14]
  );
  return depth - radius <= far;
}

/** Static, opaque scenery only. Keep source data so culling never changes world geometry or colours. */
export class StaticInstanceCuller {
  private matrices: Float32Array;
  private colors: Float32Array | null;
  private bounds: Float32Array;
  private kept: number[] = [];
  private next: number[] = [];
  private sphere = new T.Sphere();
  readonly count: number;
  constructor(readonly mesh: T.InstancedMesh) {
    this.count = mesh.count;
    this.matrices = new Float32Array(mesh.instanceMatrix.array);
    this.colors = mesh.instanceColor
      ? new Float32Array(mesh.instanceColor.array)
      : null;
    this.bounds = new Float32Array(this.count * 4);
    mesh.geometry.computeBoundingSphere();
    const matrix = new T.Matrix4(),
      world = new T.Matrix4();
    for (let i = 0; i < this.count; i++) {
      matrix.fromArray(this.matrices, i * 16);
      world.multiplyMatrices(mesh.matrixWorld, matrix);
      this.sphere.copy(mesh.geometry.boundingSphere!).applyMatrix4(world);
      this.bounds.set(
        [
          this.sphere.center.x,
          this.sphere.center.y,
          this.sphere.center.z,
          this.sphere.radius,
        ],
        i * 4,
      );
      this.kept.push(i);
    }
  }
  /** No uploads for stationary views, even though visibility is checked after every camera update. */
  update(frustum: T.Frustum, camera: T.PerspectiveCamera, far: number) {
    this.next.length = 0;
    for (let i = 0; i < this.count; i++) {
      const at = i * 4;
      this.sphere.center.fromArray(this.bounds, at);
      this.sphere.radius = this.bounds[at + 3];
      if (
        fogDepthVisible(
          this.sphere.center,
          this.sphere.radius,
          camera.matrixWorldInverse.elements,
          far,
        ) &&
        frustum.intersectsSphere(this.sphere)
      )
        this.next.push(i);
    }
    if (
      this.next.length === this.kept.length &&
      this.next.every((index, i) => index === this.kept[i])
    )
      return;
    this.write(this.next);
    const old = this.kept;
    this.kept = this.next;
    this.next = old;
  }
  /** Shadow modes retain all casters, including those outside the main camera frustum. */
  restore() {
    if (this.mesh.count === this.count) return;
    this.next.length = 0;
    for (let i = 0; i < this.count; i++) this.next.push(i);
    this.write(this.next);
    const old = this.kept;
    this.kept = this.next;
    this.next = old;
  }
  private write(indices: readonly number[]) {
    const matrices = this.mesh.instanceMatrix.array,
      colors = this.mesh.instanceColor?.array;
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      for (let j = 0; j < 16; j++)
        matrices[i * 16 + j] = this.matrices[index * 16 + j];
      if (colors && this.colors)
        for (let j = 0; j < 3; j++)
          colors[i * 3 + j] = this.colors[index * 3 + j];
    }
    this.mesh.count = indices.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    // The original full bounding sphere stays conservative; never recompute it from a compacted subset.
  }
  get retainedBytes() {
    return (
      this.matrices.byteLength +
      (this.colors?.byteLength || 0) +
      this.bounds.byteLength
    );
  }
}
