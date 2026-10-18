export type DiffusionFrame = Float32Array;
export function reflectedUnit(x: number) {
  const q = ((x % 2) + 2) % 2;
  return q <= 1 ? q : 2 - q;
}
export function dyeHistory(count = 480, duration = 45, dt = 0.15, diffusivity = 0.022) {
  let seed = 52791;
  const random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return (seed + 0.5) / 4294967296;
    },
    normal = () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const frames: DiffusionFrame[] = [];
  let a = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    a[i * 2] = 0.5 + 0.012 * normal();
    a[i * 2 + 1] = Math.max(0.005, 0.035 + 0.012 * normal());
  }
  frames.push(a);
  const sigma = Math.sqrt(2 * diffusivity * dt);
  for (let k = 1; k <= Math.ceil(duration / dt); k++) {
    const b = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) b[i] = reflectedUnit(a[i] + sigma * normal());
    frames.push(b);
    a = b;
  }
  return frames;
}
export function dyeFrame(frames: DiffusionFrame[], time: number, dt = 0.15) {
  const f = Math.max(0, Math.min(frames.length - 1, time / dt)),
    i = Math.floor(f),
    p = f - i,
    a = frames[i],
    b = frames[Math.min(i + 1, frames.length - 1)];
  return Float32Array.from(a, (v, j) => v + (b[j] - v) * p);
}
export function dyeBins(frame: DiffusionFrame, columns = 8, rows = 6) {
  const bins = new Array<number>(columns * rows).fill(0);
  for (let i = 0; i < frame.length; i += 2) {
    const x = Math.min(columns - 1, Math.floor(frame[i] * columns)),
      y = Math.min(rows - 1, Math.floor(frame[i + 1] * rows));
    bins[y * columns + x]++;
  }
  return bins;
}
export function gasPositions(time: number, partition = false) {
  return Array.from({ length: 4 }, (_, i) => {
    const x = 0.08 + i * 0.1,
      y = 0.15 + i * 0.2,
      vx = [0.17, 0.23, -0.19, 0.29][i],
      vy = [0.13, -0.21, 0.17, -0.11][i],
      release = 4;
    const closedTime = partition ? time : Math.min(time, release),
      u = (x + vx * closedTime) * 2,
      closedX = 0.5 * reflectedUnit(u),
      direction = ((u % 2) + 2) % 2 < 1 ? 1 : -1;
    return {
      id: i,
      x:
        partition || time <= release
          ? closedX
          : reflectedUnit(closedX + vx * direction * (time - release)),
      y: reflectedUnit(y + vy * time),
    };
  });
}
export function fourParticleStates() {
  return Array.from({ length: 16 }, (_, mask) => {
    const sides = Array.from({ length: 4 }, (_, i) => (mask >> i) & 1);
    return { mask, sides, left: sides.filter((x) => x === 0).length };
  });
}
export function halfBoxProbability(n: number) {
  return { log10: -Math.max(0, n) * Math.log10(2), probability: 2 ** -Math.max(0, n) };
}
