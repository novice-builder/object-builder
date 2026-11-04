export type EntityId = string;
export interface Box {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}
export interface Transform {
  x: number;
  y: number;
  z: number;
  yaw: number;
}
export interface Entity {
  id: EntityId;
  transform: Transform;
  collider?: Box;
  interaction?: "door" | "seat" | "vehicle" | "animal";
}
export interface System {
  update(dt: number): void;
  dispose?(): void;
}
