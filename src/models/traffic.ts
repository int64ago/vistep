export type Vehicle = { position: number; speed: number; brake: number };
export type TrafficParams = {
  length: number;
  desiredSpeed: number;
  headway: number;
  acceleration: number;
  deceleration: number;
};
export const defaultTraffic: TrafficParams = {
  length: 500,
  desiredSpeed: 22,
  headway: 1.2,
  acceleration: 0.8,
  deceleration: 1.5,
};
export function newTraffic(count: number, p: TrafficParams): Vehicle[] {
  const gap = p.length / count - 4.5;
  let low = 0,
    high = p.desiredSpeed;
  for (let i = 0; i < 40; i++) {
    const v = (low + high) / 2;
    const a = 1 - (v / p.desiredSpeed) ** 4 - ((2 + v * p.headway) / gap) ** 2;
    if (a > 0) low = v;
    else high = v;
  }
  return Array.from({ length: count }, (_, i) => ({
    position: (i * p.length) / count,
    speed: (low + high) / 2,
    brake: 0,
  }));
}
export function stepTraffic(cars: Vehicle[], dt: number, p: TrafficParams) {
  const n = cars.length,
    steps = Math.max(1, Math.ceil(dt / 0.04)),
    h = dt / steps;
  for (let k = 0; k < steps; k++) {
    const next = cars.map((c, i) => {
      const lead = cars[(i + 1) % n];
      const gap = Math.max(0.1, ((lead.position - c.position + p.length) % p.length) - 4.5),
        delta = c.speed - lead.speed;
      const desired =
        2 +
        Math.max(
          0,
          c.speed * p.headway +
            (c.speed * delta) / (2 * Math.sqrt(p.acceleration * p.deceleration)),
        );
      const acceleration =
        c.brake > 0
          ? -3
          : Math.max(
              -8,
              p.acceleration * (1 - (c.speed / p.desiredSpeed) ** 4 - (desired / gap) ** 2),
            );
      return {
        speed: Math.max(0, c.speed + acceleration * h),
        brake: Math.max(0, c.brake - h),
        gap,
      };
    });
    const moves = next.map((c) => c.speed * h);
    for (let i = 0; i < n; i++) {
      const movement = Math.min(moves[i], Math.max(0, next[i].gap + moves[(i + 1) % n] - 0.05));
      cars[i].position = (cars[i].position + movement) % p.length;
      cars[i].speed = movement / h;
      cars[i].brake = next[i].brake;
    }
  }
  return cars;
}
export function trafficGaps(cars: Vehicle[], length: number) {
  return cars.map(
    (c, i) => ((cars[(i + 1) % cars.length].position - c.position + length) % length) - 4.5,
  );
}
