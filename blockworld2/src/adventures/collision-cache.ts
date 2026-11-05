import type { Obstacle } from "./landscape";
export interface OwnedObstacle extends Obstacle {
  ownerId?: string;
}
/** Static scene/object footprints change only when the world or an edit changes. */
export class CollisionCache {
  private all: OwnedObstacle[] = [];
  private current: OwnedObstacle[] = [];
  private excluded: string | null | undefined;
  replace(permanent: readonly Obstacle[], built: readonly OwnedObstacle[]) {
    this.all = [...permanent, ...built];
    this.current = [];
    this.excluded = undefined;
  }
  view(exclude: string | null = null): readonly OwnedObstacle[] {
    if (this.excluded !== exclude) {
      this.excluded = exclude;
      this.current = exclude
        ? this.all.filter((b) => b.ownerId !== exclude)
        : this.all;
    }
    return this.current;
  }
}
