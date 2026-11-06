/** Layout 6's northern crossing. Older saved layouts keep the river closed here. */
export const NORTH_CROSSING = { z: -52, halfWidth: 2, halfLength: 5 };

/** Centre deck samples of the actual axis-fitted KayKit bridge (metres), retained as plain simulation data. */
const DECK: readonly [number, number][] = [
  [0, 0.43],
  [2.25, 0.43],
  [2.5, 0.4131],
  [2.75, 0.396],
  [3, 0.3586],
  [3.25, 0.3156],
  [3.5, 0.2659],
  [3.75, 0.1992],
  [4, 0.1325],
  [4.25, 0.0392],
  [4.5, -0.0579],
  [4.75, -0.1172],
  [5, -0.14],
];
export function fittedBridgeHeight(offset: number) {
  const x = Math.abs(offset);
  for (let i = 1; i < DECK.length; i++) {
    const [a, y] = DECK[i - 1],
      [b, z] = DECK[i];
    if (x <= b) return y + ((z - y) * (x - a)) / (b - a);
  }
  return DECK.at(-1)![1];
}
