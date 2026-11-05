/** A small step onto a matching landing while already on a stair ramp.
 * The body reaches the landing before its centre reaches the ramp's exact top.
 * Never permits generic wall stepping or a rise greater than nine centimetres. */
export function joinRampLanding(p, solids, rampHeight, bodyBox, collides) {
  if (!p.grounded || !solids.some(b => b.ramp && rampHeight(b, p.x, p.z) !== null)) return;
  const body = bodyBox(p);
  for (const b of solids) {
    if (b.ramp || b.maxY <= p.y || b.maxY - p.y > .09 ||
        body.minX >= b.maxX || body.maxX <= b.minX ||
        body.minZ >= b.maxZ || body.maxZ <= b.minZ) continue;
    const raised = {...p, y:b.maxY};
    if (!collides(raised, solids)) p.y = raised.y;
  }
}
