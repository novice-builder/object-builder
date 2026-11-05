import * as T from "three";
import { bakeNature } from "./nature-batch";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";

export interface AssetDefinition {
  id: string;
  path: string;
  scale: number;
  category: "building" | "nature" | "prop";
  radius?: number;
}
const village = (
  id: string,
  scale = 8,
  category: AssetDefinition["category"] = "building",
): AssetDefinition => ({ id, path: `village/${id}.glb`, scale, category });
const nature = (id: string, scale = 1): AssetDefinition => ({
  id,
  path: `nature/${id}.glb`,
  scale,
  category: "nature",
});
export const ASSETS: AssetDefinition[] = [
  ...[
    "building_home_A_blue",
    "building_home_A_green",
    "building_home_B_blue",
    "building_home_B_green",
    "building_tavern_blue",
    "building_market_blue",
    "building_windmill_blue",
    "building_church_blue",
    "building_blacksmith_blue",
    "building_watermill_blue",
  ].map((id) => village(id, 8)),
  village("building_well_blue", 5, "prop"),
  village("building_bridge_A", 9, "prop"),
  village("fence_wood_straight", 5, "prop"),
  village("barrel", 5, "prop"),
  village("crate_A_small", 5, "prop"),
  village("sack", 5, "prop"),
  village("wheelbarrow", 5, "prop"),
  village("waterplant_A", 3, "nature"),
  nature("tree-oak", 2.7),
  nature("tree-detailed", 2.8),
  nature("tree-pinedefaulta", 3.1),
  nature("tree-pinedefaultb", 3),
  nature("plant-bush", 1.5),
  nature("plant-bushsmall", 1.3),
  nature("flower-purplea", 1),
  nature("flower-yellowa", 1),
  nature("flower-reda", 1),
  nature("grass-large", 1),
  nature("rock-largea", 1.8),
  nature("rock-largeb", 2),
  nature("rock-smalla", 1.2),
  nature("stump-round", 1.4),
  nature("log", 2),
  nature("mushroom-red", 1),
  nature("tent-smallopen", 2),
  nature("campfire-stones", 1.4),
  nature("sign", 1.5),
  nature("lily-small", 1.2),
];
export const DEFINITIONS = new Map(ASSETS.map((a) => [a.id, a]));
export class AssetLibrary {
  models = new Map<string, T.Group>();
  private batchSources = new Map<string, T.Group>();
  private natureMaterial = new T.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
  });
  instancingSource(id: string) {
    let cached = this.batchSources.get(id);
    if (cached) return cached;
    const original = this.models.get(id)!;
    cached = bakeNature(original, this.natureMaterial) || original;
    this.batchSources.set(id, cached);
    return cached;
  }
  bounds = new Map<string, T.Box3>();
  character!: GLTF;
  textures = new Map<string, T.Texture>();
  async load(progress: (done: number, total: number) => void) {
    const loader = new GLTFLoader();
    let done = 0;
    const jobs = [
      ...ASSETS.map((def) => async () => {
        const gltf = await loader.loadAsync(
          `${import.meta.env.BASE_URL}adventures/${def.path}`,
        );
        const root = gltf.scene;
        root.updateMatrixWorld(true);
        const box = new T.Box3().setFromObject(root);
        const center = box.getCenter(new T.Vector3());
        // Keep a reusable, grounded and horizontally centred model. Source geometry stays shared.
        const group = new T.Group();
        root.position.x -= center.x;
        root.position.y -= box.min.y;
        root.position.z -= center.z;
        group.add(root);
        group.updateMatrixWorld(true);
        group.traverse((o) => {
          if (o instanceof T.Mesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            for (const m of Array.isArray(o.material)
              ? o.material
              : [o.material]) {
              const mat = m as T.MeshStandardMaterial;
              mat.roughness = 1;
              mat.metalness = 0;
              const palette: Record<string, number> = {
                leafsGreen: 0x527c43,
                leafsDark: 0x335e3c,
                leafsLight: 0x719448,
                woodBark: 0x806044,
                woodBarkDark: 0x614c37,
                grass: 0x718e43,
                grassGreen: 0x718e43,
                wood: 0x806044,
                woodInner: 0xbf9e73,
              };
              if (def.category === "nature" && palette[mat.name] !== undefined)
                mat.color.set(palette[mat.name]);
              if (
                def.id === "tent-smallopen" &&
                mat.name.startsWith("colorRed")
              )
                mat.color.set(mat.name === "colorRed" ? 0xbaa276 : 0x8e7851);
              if (mat.map) {
                const image = mat.map.image;
                const key = def.path.startsWith("village/")
                  ? "village-atlas"
                  : `nature-${image?.width}-${image?.height}`;
                // Only share the known identical village atlas; nature files may use different palettes.
                if (key === "village-atlas") {
                  const shared = this.textures.get(key);
                  if (shared) {
                    mat.map.dispose();
                    mat.map = shared;
                  } else this.textures.set(key, mat.map);
                }
                mat.map.anisotropy = 2;
              }
            }
          }
        });
        this.models.set(def.id, group);
        this.bounds.set(def.id, new T.Box3().setFromObject(group));
      }),
      async () => {
        this.character = await loader.loadAsync(
          `${import.meta.env.BASE_URL}adventures/character/Explorer.glb`,
        );
      },
    ];
    let next = 0;
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        while (next < jobs.length) {
          const job = jobs[next++];
          await job();
          progress(++done, jobs.length);
        }
      }),
    );
  }
  create(id: string, scale = DEFINITIONS.get(id)?.scale ?? 1) {
    const model = this.models.get(id);
    if (!model) throw Error(`Unknown asset ${id}`);
    const root = model.clone(true);
    root.scale.setScalar(scale);
    return root;
  }
}
