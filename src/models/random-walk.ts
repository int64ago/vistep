function check(steps: number, right: number, boundary: number | null) {
  if (
    !Number.isInteger(steps) ||
    steps < 0 ||
    steps > 128 ||
    !Number.isFinite(right) ||
    right < 0 ||
    right > 1 ||
    (boundary !== null && (!Number.isInteger(boundary) || boundary < 1 || boundary > 32))
  )
    throw new RangeError('Invalid walk parameters');
}
export function walkDistribution(steps = 32, right = 0.5, boundary: number | null = null) {
  check(steps, right, boundary);
  let mass = new Map<number, number>([[0, 1]]);
  for (let n = 0; n < steps; n++) {
    const next = new Map<number, number>();
    const add = (x: number, p: number) => next.set(x, (next.get(x) ?? 0) + p);
    for (const [x, p] of mass) {
      if (boundary !== null && Math.abs(x) === boundary) add(x, p);
      else {
        add(x + 1, p * right);
        add(x - 1, p * (1 - right));
      }
    }
    mass = next;
  }
  const items = [...mass]
    .sort((a, b) => a[0] - b[0])
    .map(([x, probability]) => ({ x, probability }));
  const mean = items.reduce((v, x) => v + x.x * x.probability, 0),
    second = items.reduce((v, x) => v + x.x * x.x * x.probability, 0);
  return {
    items,
    mean,
    variance: Math.max(0, second - mean * mean),
    rms: Math.sqrt(second),
    returnProbability: mass.get(0) ?? 0,
    absorbed: boundary === null ? 0 : (mass.get(boundary) ?? 0) + (mass.get(-boundary) ?? 0),
  };
}
export function walkPath(steps = 32, right = 0.5, seed = 7, boundary: number | null = null) {
  check(steps, right, boundary);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new RangeError('Invalid seed');
  let state = seed >>> 0,
    x = 0;
  const positions = [0],
    moves: number[] = [];
  for (let n = 0; n < steps; n++) {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = Math.imul(state ^ (state >>> 15), 1 | state);
    z ^= z + Math.imul(z ^ (z >>> 7), 61 | z);
    const u = ((z ^ (z >>> 14)) >>> 0) / 4294967296,
      move = boundary !== null && Math.abs(x) === boundary ? 0 : u < right ? 1 : -1;
    x += move;
    moves.push(move);
    positions.push(x);
  }
  return { positions, moves };
}
