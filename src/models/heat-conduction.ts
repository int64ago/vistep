export type ConductionOptions = {
  conductivity?: number;
  length?: number;
  area?: number;
  heatCapacityVolume?: number;
  hot?: number;
  cold?: number;
  initial?: number;
  seconds?: number;
  nodes?: number;
};
/** Exact-in-time eigenmode solution of a 1D finite-volume lattice; fixed endpoint baths. */
export function conduction(options: ConductionOptions = {}) {
  const {
    conductivity: k = 20,
    length: L = 0.1,
    area: A = 0.0004,
    heatCapacityVolume: capacity = 2e6,
    hot = 90,
    cold = 20,
    initial = 20,
    seconds = 300,
    nodes = 25,
  } = options;
  if (
    ![k, L, A, capacity, hot, cold, initial, seconds].every(Number.isFinite) ||
    k <= 0 ||
    L <= 0 ||
    A <= 0 ||
    capacity <= 0 ||
    seconds < 0 ||
    !Number.isInteger(nodes) ||
    nodes < 3 ||
    nodes > 101
  )
    throw new RangeError('Invalid conduction parameters');
  const M = nodes - 1,
    dx = L / M,
    alpha = k / capacity;
  const temperature = Array.from({ length: nodes }, (_, i) => hot + ((cold - hot) * i) / M);
  const rates = Array(nodes).fill(0) as number[];
  for (let m = 1; m < M; m++) {
    let coefficient = 0;
    for (let i = 1; i < M; i++)
      coefficient +=
        (2 / M) * (initial - (hot + ((cold - hot) * i) / M)) * Math.sin((m * Math.PI * i) / M);
    const eigenvalue = ((-4 * alpha) / dx ** 2) * Math.sin((m * Math.PI) / (2 * M)) ** 2;
    const value = coefficient * Math.exp(eigenvalue * seconds);
    for (let i = 1; i < M; i++) {
      const mode = value * Math.sin((m * Math.PI * i) / M);
      temperature[i] += mode;
      rates[i] += eigenvalue * mode;
    }
  }
  const flux = temperature.slice(0, -1).map((T, i) => (k * (T - temperature[i + 1])) / dx);
  const energy =
    capacity * A * dx * temperature.slice(1, -1).reduce((sum, T) => sum + T - initial, 0);
  const energyRate = capacity * A * dx * rates.slice(1, -1).reduce((sum, v) => sum + v, 0);
  return {
    temperature,
    flux,
    energy,
    energyRate,
    inputPower: A * flux[0],
    outputPower: A * flux[M - 1],
    dx,
    alpha,
    k,
    L,
    A,
    hot,
    cold,
    seconds,
  };
}
export function conductionShot(chapter: number, progress: number): ConductionOptions {
  const p = Math.max(0, Math.min(1, progress));
  if (chapter === 0) return { seconds: p * 60 };
  if (chapter === 1) return { seconds: 80 + p * 300 };
  if (chapter === 2) return { seconds: 500 + p * 1800 };
  if (chapter === 3) return { seconds: 600, conductivity: p < 0.5 ? 5 : 20 };
  if (chapter === 4) return { seconds: 4000, length: p < 0.5 ? 0.1 : 0.2 };
  if (chapter === 5) return { seconds: 100, hot: 40, cold: 40, initial: 40 };
  return { seconds: 4000, hot: 20, cold: 90 };
}

export const conductionColor = (T: number) =>
  `hsl(${210 - ((T + 50) / 140) * 180} 42% ${42 + ((T + 50) / 140) * 13}%)`;
