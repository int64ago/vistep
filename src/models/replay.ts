/** Deterministic simulation clock. Seeking and playback evaluate exactly the same fixed steps. */
export function fixedReplay<S>(
  create: () => S,
  step: (state: S, dt: number, tick: number) => void,
  hz = 60,
) {
  let state = create(),
    tick = 0;
  return (seconds: number) => {
    const target = Math.max(0, Math.floor(seconds * hz + 1e-7));
    if (target < tick) {
      state = create();
      tick = 0;
    }
    while (tick < target) {
      step(state, 1 / hz, tick);
      tick++;
    }
    return state;
  };
}
