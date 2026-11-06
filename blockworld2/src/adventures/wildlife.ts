import { FoxWander } from "./fox-wander";
import type { CollisionSpace } from "./mesh-collision";
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
  readonly motion = new FoxWander();
  private actions = new Map<string, T.AnimationAction>();
  private currentClip = "Survey";
  private ownedGeometry: T.BufferGeometry[] = [];
  private ownedMaterials: T.Material[] = [];
  get clip() {
    return this.currentClip;
  }
  readonly height = FOX.height;
  readonly textureBefore: number;
  readonly textureAfter: number;
  constructor(
    template: Awaited<ReturnType<typeof loadFox>>,
    ground: number,
    contactMap: T.Texture | null = null,
  ) {
    for (const name of ["Survey", "Walk"])
      if (!T.AnimationClip.findByName(template.animations, name))
        throw Error(`Fox ${name} animation is missing`);
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
        o.castShadow = false;
        o.receiveShadow = true;
        o.frustumCulled = false;
      }
    });
    this.textureBefore = template.textureBefore;
    this.textureAfter = template.textureAfter;
    this.mixer = new T.AnimationMixer(this.model);
    for (const name of ["Survey", "Walk"])
      this.actions.set(
        name,
        this.mixer.clipAction(
          T.AnimationClip.findByName(template.animations, name)!,
        ),
      );
    this.actions.get("Survey")!.play();
    this.mixer.update(0);
    if (contactMap) {
      const geometry = new T.PlaneGeometry(0.65, 1.05),
        material = new T.MeshBasicMaterial({
          map: contactMap,
          transparent: true,
          depthWrite: false,
          opacity: 0.45,
          // Match the existing player contact material to share its shader.
          toneMapped: true,
        }),
        shadow = new T.Mesh(geometry, material);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.024;
      this.group.add(shadow);
      this.ownedGeometry.push(geometry);
      this.ownedMaterials.push(material);
    }
    this.sphere.center.set(FOX.x, ground + FOX.height / 2, FOX.z);
  }
  private animate(name: string) {
    if (name === this.currentClip) return;
    const next = this.actions.get(name)!,
      previous = this.actions.get(this.currentClip)!;
    next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
    previous.crossFadeTo(next, 0.18, false);
    this.currentClip = name;
  }
  update(
    dt: number,
    space?: CollisionSpace,
    player?: { x: number; z: number },
    enabled = true,
  ) {
    if (!this.group.visible) return false;
    let changed = false;
    if (space && player && enabled) {
      const clear = (x: number, z: number, yaw: number) => {
        if (Math.hypot(x - FOX.x, z - FOX.z) > 3.12 || !space.valid(x, z))
          return false;
        const ground = space.ground(x, z),
          sin = Math.sin(yaw),
          cos = Math.cos(yaw);
        for (const offset of [-0.34, 0, 0.34]) {
          const px = x + sin * offset,
            pz = z + cos * offset;
          if (
            !space.valid(px, pz) ||
            Math.abs(space.ground(px, pz) - ground) > 0.04 ||
            space.contact(
              { x: px, y: ground + 0.002, z: pz },
              0.24,
              0.65,
              "wildlife-fox",
            )
          )
            return false;
        }
        return true;
      };
      changed = this.motion.update(dt, clear, player);
      if (changed) {
        this.group.position.set(
          this.motion.x,
          space.ground(this.motion.x, this.motion.z) + 0.002,
          this.motion.z,
        );
        this.group.rotation.y = this.motion.yaw;
      }
    } else this.motion.pause();
    this.animate(this.motion.clip);
    this.mixer.update(Math.min(0.1, Math.max(0, dt)));
    return changed;
  }
  visibility(camera: T.PerspectiveCamera, far: number, outside: boolean) {
    this.sphere.center.copy(this.group.position);
    this.sphere.center.y += FOX.height / 2;
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
    for (const geometry of this.ownedGeometry) geometry.dispose();
    for (const material of this.ownedMaterials) material.dispose();
    this.group.removeFromParent();
  }
}
