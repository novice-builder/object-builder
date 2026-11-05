import * as T from "three";
import type { AssetLibrary } from "./assets";
export const BUILD_CHOICES = [
  { id: "furniture-table", name: "Timber table", group: "Furniture" },
  { id: "furniture-chair", name: "Wooden chair", group: "Furniture" },
  { id: "furniture-bookcaseopen", name: "Open bookcase", group: "Furniture" },
  { id: "furniture-rugrectangle", name: "Meadow rug", group: "Furniture" },
  { id: "building_home_A_blue", name: "Blue-roof cottage", group: "Homes" },
  { id: "building_home_A_green", name: "Green-roof cottage", group: "Homes" },
  { id: "building_home_B_blue", name: "Blue-roof townhouse", group: "Homes" },
  { id: "tree-oak", name: "Oak tree", group: "Garden & woodland" },
  { id: "tree-pinedefaulta", name: "Pine tree", group: "Garden & woodland" },
  { id: "plant-bush", name: "Leafy bush", group: "Garden & woodland" },
  {
    id: "flower-purplea",
    name: "Purple wildflowers",
    group: "Garden & woodland",
  },
  {
    id: "flower-yellowa",
    name: "Yellow wildflowers",
    group: "Garden & woodland",
  },
  { id: "flower-reda", name: "Red wildflowers", group: "Garden & woodland" },
  { id: "barrel", name: "Wooden barrel", group: "Village supplies" },
  { id: "crate_A_small", name: "Supply crate", group: "Village supplies" },
  { id: "wheelbarrow", name: "Wheelbarrow", group: "Village supplies" },
  { id: "rock-largea", name: "Boulder", group: "Garden & woodland" },
  { id: "log", name: "Fallen log", group: "Garden & woodland" },
  { id: "tent-smallopen", name: "Explorer’s tent", group: "Village supplies" },
] as const;
export const buildLabel = (id: string) =>
  BUILD_CHOICES.find((item) => item.id === id)?.name;
/** Build-time capture using the real imported model; no extra renderer/context on mobile. */
export function renderCatalogueThumbnail(
  renderer: T.WebGLRenderer,
  library: AssetLibrary,
  id: string,
) {
  const scene = new T.Scene(),
    root = library.create(id),
    target = new T.WebGLRenderTarget(256, 192, { samples: 4 });
  target.texture.colorSpace = T.SRGBColorSpace;
  scene.add(root, new T.HemisphereLight(0xe5f0ec, 0x7d8065, 1.6));
  const sun = new T.DirectionalLight(0xffedce, 2.5);
  sun.position.set(-3, 6, 4);
  scene.add(sun);
  root.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(root),
    centre = bounds.getCenter(new T.Vector3()),
    radius = bounds.getSize(new T.Vector3()).length() / 2;
  const camera = new T.PerspectiveCamera(40, 256 / 192, 0.01, 1000),
    distance = (radius / Math.sin(T.MathUtils.degToRad(20))) * 1.08;
  camera.position
    .copy(centre)
    .addScaledVector(new T.Vector3(1, 0.65, 1.3).normalize(), distance);
  camera.near = Math.max(0.001, distance / 100);
  camera.far = distance * 10;
  camera.updateProjectionMatrix();
  camera.lookAt(centre);
  const previous = renderer.getRenderTarget(),
    clear = renderer.getClearColor(new T.Color()),
    alpha = renderer.getClearAlpha(),
    shadows = renderer.shadowMap.enabled;
  try {
    renderer.shadowMap.enabled = false;
    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    const pixels = new Uint8Array(256 * 192 * 4);
    renderer.readRenderTargetPixels(target, 0, 0, 256, 192, pixels);
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 192;
    const context = canvas.getContext("2d")!,
      image = context.createImageData(256, 192);
    for (let row = 0; row < 192; row++)
      image.data.set(
        pixels.subarray((191 - row) * 256 * 4, (192 - row) * 256 * 4),
        row * 256 * 4,
      );
    context.putImageData(image, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    renderer.setRenderTarget(previous);
    renderer.setClearColor(clear, alpha);
    renderer.shadowMap.enabled = shadows;
    target.dispose();
    scene.clear();
  }
}
