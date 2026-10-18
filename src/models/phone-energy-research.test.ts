import { describe, it, expect } from 'vitest';
import {
  phoneEnergy,
  phonePower,
  changedPhoneFactors,
  type PhoneTrial,
} from './phone-energy-research';
const base: PhoneTrial = { task: 'video', brightness: 0.3, volume: 0.2, radioFactor: 1 };
describe('phone research design', () => {
  it('energy matches independent numerical integration of time-varying power', () => {
    const duration = 103,
      dt = 0.01;
    let total = 0;
    for (let time = dt / 2; time < duration; time += dt) total += phonePower(base, time).total * dt;
    expect(phoneEnergy(base, duration).joules).toBeCloseTo(total, 5);
  });
  it('a brightness-only comparison changes only display energy', () => {
    const a = phoneEnergy(base, 300),
      b = phoneEnergy({ ...base, brightness: 0.8 }, 300);
    expect(b.components.cpu).toBe(a.components.cpu);
    expect(b.components.radio).toBe(a.components.radio);
    expect(b.components.audio).toBe(a.components.audio);
    expect(b.components.display).toBeGreaterThan(a.components.display);
  });
  it('volume does not affect a task with no audible output in this model', () => {
    expect(phoneEnergy({ ...base, task: 'browse', volume: 0 }, 300).joules).toBe(
      phoneEnergy({ ...base, task: 'browse', volume: 1 }, 300).joules,
    );
  });
  it('identifies confounds and zero-duration energy; rounded percent can conceal energy differences', () => {
    expect(changedPhoneFactors(base, { ...base, brightness: 0.8, radioFactor: 3 })).toEqual([
      'brightness',
      'radioFactor',
    ]);
    expect(phoneEnergy(base, 0).joules).toBe(0);
    const a = phoneEnergy(base, 10),
      b = phoneEnergy({ ...base, brightness: 0.8 }, 10);
    expect(b.joules).toBeGreaterThan(a.joules);
    expect(a.percentDisplay).toBe(b.percentDisplay);
  });
});
