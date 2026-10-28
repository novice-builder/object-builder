// Shared render/collision transform. width is the actual leaf width, not its opening.
export function doorSolidAt(door, angle) {
  if (door.kind === "roller") {
    const c = Math.cos(door.baseAngle),
      s = Math.sin(door.baseAngle),
      halfW = door.width / 2,
      halfD = 0.055,
      cx = door.center.x,
      cz = door.center.z;
    const wx = Math.abs(c) * halfW + Math.abs(s) * halfD,
      dz = Math.abs(s) * halfW + Math.abs(c) * halfD;
    const fraction = Math.min(1, Math.max(0, angle / (Math.PI / 2)));
    return {
      minX: cx - wx,
      maxX: cx + wx,
      minZ: cz - dz,
      maxZ: cz + dz,
      minY: door.height * fraction,
      maxY: door.height,
      obb: { cx, cz, c, s, halfW, halfD },
      door: true,
    };
  }
  const a = door.baseAngle + angle,
    c = Math.cos(a),
    s = Math.sin(a),
    halfW = door.width / 2,
    halfD = 0.055;
  const cx = door.hinge.x + c * halfW,
    cz = door.hinge.z - s * halfW;
  const wx = Math.abs(c) * halfW + Math.abs(s) * halfD,
    dz = Math.abs(s) * halfW + Math.abs(c) * halfD;
  return {
    minX: cx - wx,
    maxX: cx + wx,
    minZ: cz - dz,
    maxZ: cz + dz,
    minY: 0,
    maxY: door.height ?? 2.3,
    obb: { cx, cz, c, s, halfW, halfD },
    door: true,
  };
}
export function doorBox(door, open, swing = door.swing ?? -1) {
  const angle =
    open === undefined
      ? (door.angle ?? (door.open ? (swing * Math.PI) / 2 : 0))
      : open
        ? (swing * Math.PI) / 2
        : 0;
  return doorSolidAt(door, angle);
}
