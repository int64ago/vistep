import { describe, it, expect } from 'vitest';
import { stepPendulum, pendulumEnergy, smallAnglePeriod } from './pendulum';
import { dct, idct, sampleBlock, compressBlock } from './jpeg';
import { bicycleModel } from './bicycle';
import { effectivePhase, residualAmplitude } from './noise';
import { distance, locate } from './gps';
import { hypercube, sphereSlice } from './dimensions';
import { networkSteps } from './network';
import {
  newElevatorState,
  makeScenario,
  stepElevators,
  elevatorStats,
  compareElevators,
} from './elevator';
import { newTraffic, stepTraffic, trafficGaps, defaultTraffic } from './traffic';
import { TinyTransformer } from './transformer';

describe('pendulum physics', () => {
  it('conserves energy without damping and loses it with damping', () => {
    const initial = { angle: 0.7, velocity: 0, time: 0 };
    let free = { ...initial },
      damped = { ...initial };
    const e = (s: typeof initial) => {
      const v = pendulumEnergy(s, 1.4, 9.81, 1);
      return v.kinetic + v.potential;
    };
    for (let i = 0; i < 10000; i++) {
      free = stepPendulum(free, 0.004, 1.4, 9.81, 0);
      damped = stepPendulum(damped, 0.004, 1.4, 9.81, 0.1);
    }
    expect(Math.abs(e(free) - e(initial))).toBeLessThan(1e-6);
    expect(e(damped)).toBeLessThan(e(initial) * 0.05);
  });
  it('obeys square-root period scaling and energy scales with mass', () => {
    expect(smallAnglePeriod(2, 9.81) / smallAnglePeriod(0.5, 9.81)).toBeCloseTo(2, 12);
    const s = { angle: 0.4, velocity: 0.5, time: 0 };
    expect(pendulumEnergy(s, 1, 9.81, 2).potential).toBeCloseTo(
      2 * pendulumEnergy(s, 1, 9.81, 1).potential,
    );
  });
});
describe('JPEG transform', () => {
  it.each(['gradient', 'edge', 'texture'])('round-trips %s without quantization', (pattern) => {
    const block = sampleBlock(pattern),
      reconstructed = idct(dct(block));
    expect(Math.max(...block.map((v, i) => Math.abs(v - reconstructed[i])))).toBeLessThan(1e-10);
  });
  it('constant block has only DC and keeping DC makes a flat reconstruction', () => {
    const c = dct(Array(64).fill(180));
    expect(c[0]).toBeCloseTo(416);
    expect(Math.max(...c.slice(1).map(Math.abs))).toBeLessThan(1e-10);
    const result = compressBlock(sampleBlock('texture'), 35, 1);
    expect(new Set(result.reconstructed).size).toBe(1);
    expect(result.nonzero).toBeLessThanOrEqual(1);
  });
});
it('bicycle power accounts for the chosen transmission efficiency', () => {
  const m = bicycleModel(34, 24, 60, 5);
  expect(m.power * 0.96).toBeCloseTo((m.roadForce * m.speedKmh) / 3.6, 8);
  expect(bicycleModel(34, 34, 60, 5).pedalForce).toBeLessThan(m.pedalForce);
});
it('sound cancellation and delay follow phase addition', () => {
  expect(residualAmplitude(1, Math.PI)).toBeCloseTo(0);
  expect(residualAmplitude(1, 0)).toBeCloseTo(2);
  expect(effectivePhase(180, 500, 1)).toBeCloseTo(0);
  expect(residualAmplitude(0.5, Math.PI)).toBeCloseTo(0.5);
});
describe('pseudorange location', () => {
  it.each([2, 3])('recovers %iD position and a shared clock bias', (dim) => {
    const sats = [
      [120, 100, 250],
      [480, 90, 330],
      [520, 300, 180],
      [100, 310, 300],
    ].map((s) => s.slice(0, dim));
    const target = [300, 210, 0].slice(0, dim),
      ranges = sats.map((s) => distance(s, target) + 23);
    const sol = locate(
      sats,
      ranges,
      dim,
      true,
      target.map((n) => n + 5),
    );
    expect(sol).not.toBeNull();
    expect(distance(sol!.position, target)).toBeLessThan(1e-5);
    expect(sol!.clock).toBeCloseTo(23, 5);
  });
  it('reports insufficient and degenerate geometry', () => {
    expect(
      locate(
        [
          [0, 0],
          [2, 0],
        ],
        [1, 1],
        2,
        true,
      ),
    ).toBeNull();
    expect(
      locate(
        [
          [1, 1],
          [1, 1],
          [1, 1],
        ],
        [1, 1, 1],
        2,
        true,
      ),
    ).toBeNull();
  });
});
it('hypercube counts and sphere slices match geometry', () => {
  for (let d = 1; d <= 4; d++) {
    const g = hypercube(d);
    expect(g.vertices.length).toBe(2 ** d);
    expect(g.edges.length).toBe(d * 2 ** (d - 1));
    for (const [a, b] of g.edges) expect(distance(g.vertices[a], g.vertices[b])).toBe(2);
  }
  expect(sphereSlice(1, 0)).toBe(1);
  expect(sphereSlice(1, 1)).toBe(0);
  expect(sphereSlice(1, 1.1)).toBeNull();
});
it('fresh cache does not make network requests or connections', () => {
  const steps = networkSteps(300, false, false, true, true);
  expect(steps.slice(0, 4).every((s) => s.duration === 0)).toBe(true);
  expect(steps[4].duration).toBe(5);
});
describe('elevator conservation and fair comparison', () => {
  it.each(['morning', 'mixed'])('delivers all %s requests with each strategy', (mode) => {
    const requests = makeScenario(mode),
      before = JSON.stringify(requests);
    const results = compareElevators(requests);
    expect(results.every((r) => r.complete && r.done === requests.length)).toBe(true);
    expect(JSON.stringify(requests)).toBe(before);
    expect(compareElevators(requests)).toEqual(results);
  });
  it('never loses, duplicates, overfills, or boards a future request', () => {
    const s = newElevatorState(makeScenario('mixed'));
    for (let i = 0; i < 6000; i++) {
      stepElevators(s, 0.1, 'collective');
      const ids = s.cars.flatMap((c) => c.passengers);
      expect(new Set(ids).size).toBe(ids.length);
      expect(s.cars.every((c) => c.passengers.length <= 6)).toBe(true);
      expect(ids.length).toBe(s.requests.filter((r) => r.status === 'riding').length);
      expect(s.requests.every((r) => r.pickup === undefined || r.pickup >= r.arrival)).toBe(true);
    }
    expect(elevatorStats(s).done).toBe(s.requests.length);
  });
});
describe('traffic model', () => {
  it('maintains uniform equilibrium without a disturbance', () => {
    const cars = newTraffic(30, defaultTraffic),
      v = cars[0].speed;
    for (let i = 0; i < 600; i++) stepTraffic(cars, 0.1, defaultTraffic);
    expect(Math.max(...cars.map((c) => Math.abs(c.speed - v)))).toBeLessThan(1e-6);
  });
  it('conserves vehicles and avoids overlap after braking', () => {
    const cars = newTraffic(42, defaultTraffic);
    cars[0].brake = 1.5;
    for (let i = 0; i < 2400; i++) {
      stepTraffic(cars, 0.1, defaultTraffic);
      expect(cars).toHaveLength(42);
      expect(Math.min(...trafficGaps(cars, 500))).toBeGreaterThanOrEqual(0.049);
      expect(cars.every((c) => Number.isFinite(c.speed) && c.speed >= 0)).toBe(true);
    }
  });
});
describe('real miniature Transformer', () => {
  it('backpropagation matches a finite-difference attention gradient', () => {
    const m = new TinyTransformer(),
      p = m.q[0][0];
    const value = p.data,
      epsilon = 1e-5;
    const loss = m.loss(0);
    loss.backward();
    const analytic = p.grad;
    p.data = value + epsilon;
    const plus = m.loss(0).data;
    p.data = value - epsilon;
    const minus = m.loss(0).data;
    p.data = value;
    expect(analytic).toBeCloseTo((plus - minus) / (2 * epsilon), 5);
  });
  it('trains, masks future tokens, and freezes parameters during generation', () => {
    const m = new TinyTransformer(),
      initial = (m.loss(0).data + m.loss(1).data + m.loss(2).data) / 3;
    for (let i = 0; i < 180; i++) m.trainStep();
    const final = (m.loss(0).data + m.loss(1).data + m.loss(2).data) / 3;
    expect(final).toBeLessThan(initial * 0.4);
    const values = m.params.map((p) => p.data),
      inspection = m.inspect('猫爱吃');
    inspection.attention.forEach((row, i) => {
      expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
      row.forEach((v, j) => {
        if (j > i) expect(v).toBe(0);
      });
    });
    expect(m.sample('猫爱吃', 0)).toBe('鱼');
    m.sample('狗爱吃', 0.7);
    expect(m.params.map((p) => p.data)).toEqual(values);
  }, 30000);
});
