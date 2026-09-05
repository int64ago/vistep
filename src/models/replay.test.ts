import { describe, expect, it } from 'vitest';
import { fixedReplay } from './replay';
import { newTraffic, stepTraffic, defaultTraffic, trafficGaps } from './traffic';
import {
  newElevatorState,
  makeScenario,
  stepElevators,
  elevatorStats,
  type Strategy,
} from './elevator';
import { jpegZigzag, chroma420 } from './jpeg';
import { TinyTransformer } from './transformer';
import { scalarTransition } from '../components/three/motion';

describe('directed replay', () => {
  it('reconstructs traffic history independently of playback cadence or backward seeks', () => {
    const create = () => newTraffic(36, defaultTraffic);
    const step = (s: ReturnType<typeof create>, dt: number, tick: number) => {
      if (tick === 360) s[0].brake = 1.5;
      stepTraffic(s, dt, defaultTraffic);
    };
    const a = fixedReplay(create, step),
      b = fixedReplay(create, step);
    for (let time = 0; time < 42; time += 0.071) a(time);
    expect(a(42)).toEqual(b(42));
    a(3);
    expect(a(42)).toEqual(b(42));
    expect(trafficGaps(a(42), 500).every((g) => g > 0)).toBe(true);
  });
  it('keeps every passenger and exact policy outcome after seeking', () => {
    const requests = makeScenario('mixed', 42)
      .slice(0, 10)
      .map((r, i) => ({ ...r, arrival: i * 0.8 }));
    for (const strategy of ['fcfs', 'nearest', 'collective'] as Strategy[]) {
      const replay = fixedReplay(
        () => newElevatorState(requests),
        (s, dt) => stepElevators(s, dt, strategy),
      );
      const final = structuredClone(replay(120));
      expect(elevatorStats(final).done).toBe(10);
      replay(9);
      expect(replay(120)).toEqual(final);
      expect(new Set(final.requests.map((r) => r.id)).size).toBe(10);
    }
  });
  it('settles a paused presentation target instead of leaving a closed cover on a later chapter', () => {
    const move = scalarTransition(0, 1);
    expect(move(1, 0, true)).toBe(1);
    expect(move(1, 0.016, false)).toBe(1);
    expect(move(0, 0.2, false)).toBeGreaterThan(0);
    expect(move(0, 0, true)).toBe(0);
  });
  it('uses the JPEG zigzag order and a real four-sample chroma average', () => {
    expect(jpegZigzag.slice(0, 10)).toEqual([0, 1, 8, 16, 9, 2, 3, 10, 17, 24]);
    expect(new Set(jpegZigzag).size).toBe(64);
    const { cb, sampled, y } = chroma420();
    expect(y).toHaveLength(16);
    expect(sampled).toHaveLength(4);
    expect(sampled[0]).toBeCloseTo((cb[0] + cb[1] + cb[4] + cb[5]) / 4, 12);
  });
  it('exposes genuine gradients and optimizer deltas while generation leaves parameters unchanged', () => {
    const model = new TinyTransformer();
    const before = model.q[0].map((v) => v.data);
    model.loss(0).backward();
    const inspected = model.inspect('猫爱吃');
    expect(inspected.gradients.some((n) => Math.abs(n) > 1e-9)).toBe(true);
    expect(inspected.weights).toEqual(before);
    model.trainStep();
    expect(model.inspect('猫爱吃').weightDeltas).toEqual(
      model.q[0].map((v, i) => v.data - before[i]),
    );
    const parameters = model.params.map((v) => v.data),
      step = model.step;
    model.sample('猫爱吃', 0);
    expect(model.params.map((v) => v.data)).toEqual(parameters);
    expect(model.step).toBe(step);
  });
});
