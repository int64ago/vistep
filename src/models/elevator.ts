export type Strategy = 'fcfs' | 'nearest' | 'collective';
export type Request = {
  id: number;
  from: number;
  to: number;
  arrival: number;
  status: 'future' | 'waiting' | 'riding' | 'done';
  pickup?: number;
  dropoff?: number;
  car?: number;
};
export type Car = {
  id: number;
  position: number;
  target: number | null;
  direction: number;
  door: number;
  passengers: number[];
};
export type ElevatorState = { time: number; requests: Request[]; cars: Car[] };
export function seededRandom(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
export function makeScenario(mode = 'morning', seed = 42): Request[] {
  const random = seededRandom(seed);
  return Array.from({ length: 32 }, (_, i) => {
    const from = mode === 'morning' ? 0 : Math.floor(random() * 8);
    let to = Math.floor(random() * 8);
    if (to === from) to = (to + 1) % 8;
    return { id: i, from, to, arrival: i * 2.8, status: 'future' };
  });
}
export function newElevatorState(requests: Request[]): ElevatorState {
  return {
    time: 0,
    requests: requests.map((r) => ({
      id: r.id,
      from: r.from,
      to: r.to,
      arrival: r.arrival,
      status: 'future',
    })),
    cars: [
      { id: 0, position: 0, target: null, direction: 1, door: 0, passengers: [] },
      { id: 1, position: 7, target: null, direction: -1, door: 0, passengers: [] },
    ],
  };
}
export function stepElevators(s: ElevatorState, dt: number, strategy: Strategy) {
  s.time += dt;
  for (const r of s.requests)
    if (r.status === 'future' && r.arrival <= s.time) r.status = 'waiting';
  for (const c of s.cars) {
    if (c.door > 0) {
      c.door = Math.max(0, c.door - dt);
      continue;
    }
    if (c.target === null) {
      const riders = c.passengers.map((id) => s.requests.find((r) => r.id === id)!).filter(Boolean);
      if (riders.length) {
        if (strategy === 'fcfs') c.target = riders[0].to;
        else {
          const ahead = riders.filter((r) => (r.to - c.position) * c.direction > 0);
          const pool = strategy === 'collective' && ahead.length ? ahead : riders;
          c.target = pool
            .slice()
            .sort(
              (a, b) => Math.abs(a.to - c.position) - Math.abs(b.to - c.position) || a.id - b.id,
            )[0].to;
        }
      } else {
        const reserved = s.cars
          .filter((o) => o.id !== c.id && o.target !== null)
          .map((o) => o.target);
        const waiting = s.requests.filter(
          (r) => r.status === 'waiting' && !reserved.includes(r.from),
        );
        if (waiting.length) {
          const first = waiting
            .slice()
            .sort((a, b) =>
              strategy === 'fcfs'
                ? a.arrival - b.arrival || a.id - b.id
                : Math.abs(a.from - c.position) - Math.abs(b.from - c.position) ||
                  a.arrival - b.arrival,
            )[0];
          c.target = first.from;
        }
      }
      if (c.target !== null && c.target !== c.position)
        c.direction = Math.sign(c.target - c.position);
    }
    if (c.target === null) continue;
    const delta = c.target - c.position;
    if (Math.abs(delta) > dt) {
      c.position += Math.sign(delta) * dt;
      if (strategy === 'collective' && c.passengers.length < 6) {
        const floor = Math.round(c.position);
        if (
          Math.abs(c.position - floor) < dt * 0.52 &&
          s.requests.some(
            (r) =>
              r.status === 'waiting' && r.from === floor && Math.sign(r.to - floor) === c.direction,
          )
        )
          c.target = floor;
      }
      continue;
    }
    c.position = c.target;
    c.target = null;
    const exiting = c.passengers.filter(
      (id) => s.requests.find((r) => r.id === id)!.to === c.position,
    );
    for (const id of exiting) {
      const r = s.requests.find((r) => r.id === id)!;
      r.status = 'done';
      r.dropoff = s.time;
    }
    c.passengers = c.passengers.filter((id) => !exiting.includes(id));
    const waiting = s.requests
      .filter((r) => r.status === 'waiting' && r.from === c.position)
      .sort((a, b) => a.arrival - b.arrival || a.id - b.id);
    if (!c.passengers.length && waiting.length) c.direction = Math.sign(waiting[0].to - c.position);
    for (const r of waiting) {
      if (c.passengers.length >= 6) break;
      if (strategy === 'collective' && Math.sign(r.to - c.position) !== c.direction) continue;
      r.status = 'riding';
      r.pickup = s.time;
      r.car = c.id;
      c.passengers.push(r.id);
    }
    c.door = 1.5;
  }
  return s;
}
export function elevatorStats(s: ElevatorState) {
  const boarded = s.requests.filter((r) => r.pickup !== undefined),
    done = s.requests.filter((r) => r.status === 'done');
  return {
    waiting: s.requests.filter((r) => r.status === 'waiting').length,
    riding: s.requests.filter((r) => r.status === 'riding').length,
    done: done.length,
    boarded: boarded.length,
    meanWait: boarded.length
      ? boarded.reduce((sum, r) => sum + r.pickup! - r.arrival, 0) / boarded.length
      : 0,
    meanRide: done.length
      ? done.reduce((sum, r) => sum + r.dropoff! - r.pickup!, 0) / done.length
      : 0,
  };
}
export function compareElevators(requests: Request[]) {
  return (['fcfs', 'nearest', 'collective'] as Strategy[]).map((strategy) => {
    const s = newElevatorState(requests);
    while (s.time < 1800 && s.requests.some((r) => r.status !== 'done'))
      stepElevators(s, 1 / 60, strategy);
    return {
      strategy,
      ...elevatorStats(s),
      complete: s.requests.every((r) => r.status === 'done'),
      time: s.time,
    };
  });
}
