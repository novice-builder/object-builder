import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { FOX } from "./foxglade-data";
import { fogDepthVisible } from "./instance-culling";
let cached:
  | Promise<{
      scene: T.Group;
      animations: T.AnimationClip[];
      textureBefore: number;
      textureAfter: number;
    }>
  | undefined;
/** Download only for a layout containing wildlife; share the template/resources across switches. */
export function loadFox() {
  return (cached ||= new GLTFLoader()
    .loadAsync(`${import.meta.env.BASE_URL}adventures/wildlife/Fox.glb`)
    .then((gltf) => {
      let textureBefore = 0,
        textureAfter = 0;
      const seen = new Set<T.Texture>();
      gltf.scene.traverse((o) => {
        if (!(o instanceof T.Mesh)) return;
        for (const material of Array.isArray(o.material)
          ? o.material
          : [o.material]) {
          const texture = (material as T.MeshStandardMaterial).map;
          if (!texture || seen.has(texture)) continue;
          seen.add(texture);
          const image = texture.image as CanvasImageSource & {
            width: number;
            height: number;
            close?: () => void;
          };
          textureBefore = Math.max(textureBefore, image.width);
          if (image.width > 256 || image.height > 256) {
            const canvas = document.createElement("canvas");
            const scale = 256 / Math.max(image.width, image.height);
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);
            const context = canvas.getContext("2d")!;
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            texture.image = canvas;
            texture.needsUpdate = true;
            image.close?.();
          }
          textureAfter = Math.max(textureAfter, texture.image.width);
        }
      });
      return {
        scene: gltf.scene,
        animations: gltf.animations,
        textureBefore,
        textureAfter,
      };
    })
    .catch((e) => {
      cached = undefined;
      throw e;
    }));
}
export class WoodlandFox {
  group = new T.Group();
  private mixer: T.AnimationMixer;
  private model: T.Object3D;
  private sphere = new T.Sphere(new T.Vector3(), 1);
  private frustum = new T.Frustum();
  private projection = new T.Matrix4();
  readonly clip = "Survey";
  readonly height = FOX.height;
  readonly textureBefore: number;
  readonly textureAfter: number;
  constructor(template: Awaited<ReturnType<typeof loadFox>>, ground: number) {
    this.model = clone(template.scene);
    this.model.updateMatrixWorld(true);
    const bounds = new T.Box3().setFromObject(this.model),
      size = bounds.getSize(new T.Vector3()),
      center = bounds.getCenter(new T.Vector3());
    this.model.position.x -= center.x;
    this.model.position.y -= bounds.min.y;
    this.model.position.z -= center.z;
    const scale = FOX.height / size.y;
    const normalized = new T.Group();
    normalized.add(this.model);
    normalized.scale.setScalar(scale);
    this.group.add(normalized);
    this.group.position.set(FOX.x, ground + 0.002, FOX.z);
    this.group.rotation.y = FOX.yaw;
    this.model.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
      }
    });
    this.textureBefore = template.textureBefore;
    this.textureAfter = template.textureAfter;
    this.mixer = new T.AnimationMixer(this.model);
    const clip = T.AnimationClip.findByName(template.animations, this.clip);
    if (!clip) throw Error("Fox Survey animation is missing");
    this.mixer.clipAction(clip).play();
    this.mixer.update(0);
    this.sphere.center.set(FOX.x, ground + FOX.height / 2, FOX.z);
  }
  update(dt: number) {
    if (this.group.visible) this.mixer.update(Math.min(0.1, dt));
  }
  visibility(camera: T.PerspectiveCamera, far: number, outside: boolean) {
    camera.updateMatrixWorld();
    this.projection.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    this.frustum.setFromProjectionMatrix(this.projection);
    this.group.visible =
      outside &&
      fogDepthVisible(
        this.sphere.center,
        this.sphere.radius,
        camera.matrixWorldInverse.elements,
        far,
      ) &&
      this.frustum.intersectsSphere(this.sphere);
  }
  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
    // SkeletonUtils gives each instance its own GPU bone texture. Geometry,
    // materials and the colour map belong to the cached template instead.
    const skeletons = new Set<T.Skeleton>();
    this.model.traverse((o) => {
      if (o instanceof T.SkinnedMesh) skeletons.add(o.skeleton);
    });
    for (const skeleton of skeletons) skeleton.dispose();
    this.group.removeFromParent();
  }
}
