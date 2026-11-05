import { renderModel } from "../build/models";
import { blockColliders } from "../build/registry";
import type { AuthoredProp } from "./authoring";
export type PropStates = Record<string, { open?: boolean; on?: boolean }>;
export function refreshProp(prop: AuthoredProp) {
  const parent = prop.model.parent;
  prop.model.traverse((o: any) => {
    if (o.isMesh) o.material.dispose();
  });
  prop.model.removeFromParent();
  prop.model = renderModel(prop.block);
  parent?.add(prop.model);
}
export function syncProps(world: any, states?: PropStates) {
  if (!world.authoredProps) return;
  for (const p of world.authoredProps as AuthoredProp[])
    if (states?.[p.id]) {
      Object.assign(p.block, states[p.id]);
      refreshProp(p);
    }
  world.solids = [
    ...world.staticSolids,
    ...world.authoredProps.flatMap((p: AuthoredProp) =>
      blockColliders(p.block).map((s) => ({ ...s, owner: "prop:" + p.id })),
    ),
  ];
}
export function propSnapshot(world: any): PropStates {
  return Object.fromEntries(
    (world.authoredProps || []).map((p: AuthoredProp) => [
      p.id,
      {
        ...(p.block.open !== undefined ? { open: p.block.open } : {}),
        ...(p.block.on !== undefined ? { on: p.block.on } : {}),
      },
    ]),
  );
}
