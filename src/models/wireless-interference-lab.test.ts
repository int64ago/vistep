import { describe, expect, it } from 'vitest';
import { coexistenceSchedule, summarizeRepeated } from './wireless-interference-lab';
describe('controlled wireless coexistence study', () => {
  it('requires overlap in frequency and time and actual Bluetooth activity', () => {
    expect(coexistenceSchedule({ bluetooth: false }).lost).toBe(0);
    expect(coexistenceSchedule({ duty: 0 }).lost).toBe(0);
    expect(coexistenceSchedule({ wifi5: true }).lost).toBe(0);
    const a = coexistenceSchedule();
    expect(a.lost).toBeGreaterThan(0);
    expect(
      a.events
        .filter((x) => x.collision)
        .every((x) => x.active && x.wifi && Math.abs(x.frequency - 2437) < 10.5),
    ).toBe(true);
  });
  it('avoids occupied frequencies using the same deterministic random inputs', () => {
    expect(coexistenceSchedule({ adaptive: true }).lost).toBe(0);
    expect(coexistenceSchedule()).toEqual(coexistenceSchedule());
    expect(coexistenceSchedule({ duty: 1 }).lost).toBeGreaterThanOrEqual(
      coexistenceSchedule({ duty: 0.1 }).lost,
    );
  });
  it('reports repeated observations without inventing a measurement', () => {
    expect(summarizeRepeated([10, 12, 14])).toEqual({ count: 3, mean: 12, spread: 2 });
    expect(summarizeRepeated([]).count).toBe(0);
  });
});
