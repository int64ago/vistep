import { describe, expect, it } from 'vitest';
import { siphonShot, siphonTrial, tubeArea } from '../../models/siphon';
import { siphonOutletFlow } from './siphonBranchFlow';

const at = (seconds: number) => siphonShot(5, (seconds - 110) / 22);

describe('siphon branch discharge display', () => {
  it('agrees with both retreating wet intervals and conserved reservoir increments', () => {
    let receiver = 0,
      source = 0;
    // Midpoints avoid derivative knots. Integrate every segment of the prescribed drain.
    for (let i = 1188; i < 1268; i++) {
      const before = at(i / 10).state,
        after = at((i + 1) / 10).state,
        shot = at((i + 0.5) / 10),
        rates = shot.branchFlow!;
      expect(rates.receiver * 0.1).toBeCloseTo(after.receiverVolume - before.receiverVolume, 14);
      expect(rates.source * 0.1).toBeCloseTo(after.sourceVolume - before.sourceVolume, 14);
      expect(rates.receiver * 0.1).toBeCloseTo((after.wet[1][0] - before.wet[1][0]) * tubeArea, 14);
      expect(rates.source * 0.1).toBeCloseTo((before.wet[0][1] - after.wet[0][1]) * tubeArea, 14);
      expect(shot.state.flow).toBe(0);
      expect(shot.state.velocity).toBe(0);
      receiver += rates.receiver * 0.1;
      source += rates.source * 0.1;
    }
    const start = at(118.8).state,
      end = at(126.8).state;
    expect(receiver).toBeCloseTo(start.wet[1][1] * tubeArea - start.wet[1][0] * tubeArea, 14);
    expect(receiver).toBeCloseTo(end.receiverVolume - start.receiverVolume, 14);
    expect(source + receiver).toBeCloseTo(start.tubeVolume - end.tubeVolume, 14);
  });

  it('connects the actual free outlet to the current receiving surface only during discharge', () => {
    for (const time of [119, 119.9, 124.3, 126.7, 126.79]) {
      const shot = at(time),
        flow = siphonOutletFlow(shot);
      expect(flow.kind).toBe('branch');
      expect(flow.sustained).toBe(0);
      expect(flow.branch).toBeGreaterThan(0);
      expect(flow.branchReading).not.toBe('0.000');
      expect(flow.outletWet).toBe(true);
      expect(flow.jet!.from.x).toBeCloseTo(shot.state.geometry.outlet.x, 13);
      expect(flow.jet!.from.y).toBeCloseTo(shot.state.geometry.outlet.y, 13);
      expect(flow.jet!.to).toEqual({
        x: shot.state.geometry.outlet.x,
        y: shot.state.receiverLevel,
      });
      expect(flow.jet!.from.y).toBeGreaterThan(flow.jet!.to.y);
    }
    for (const time of [126.8, 127, 132]) {
      const flow = siphonOutletFlow(at(time));
      expect(flow.branch).toBe(0);
      expect(flow.branchReading).toBe('0.000');
      expect(flow.outletWet).toBe(false);
      expect(flow.jet).toBeNull();
    }
  });

  it('keeps static vented trials and stopped full columns distinct from transient drainage', () => {
    for (const state of [
      siphonTrial({ vented: true, seconds: 150 }),
      siphonTrial({ primed: false }),
      siphonTrial({ top: 11.5 }),
      siphonTrial({ angle: 0.7 }),
    ]) {
      const flow = siphonOutletFlow({ state, view: 'apparatus', focus: 0, comparison: false });
      expect(flow.branch).toBe(0);
      expect(flow.jet).toBeNull();
    }
    const full = siphonOutletFlow(siphonShot(2, 0.5));
    expect(full.kind).toBe('sustained');
    expect(full.sustained).toBeGreaterThan(0);
    expect(full.branch).toBe(0);
  });

  it('reconstructs identical rates, water state and contacts after out-of-order seeks', () => {
    const times = [118.8, 119.9, 124.3, 126.79, 126.8, 132];
    const first = times.map((time) => ({ shot: at(time), flow: siphonOutletFlow(at(time)) }));
    for (const time of [130, 112, 118, 124, 0]) siphonShot(5, (time - 110) / 22);
    for (const [i, time] of times.entries()) {
      expect(at(time)).toEqual(first[i].shot);
      expect(siphonOutletFlow(at(time))).toEqual(first[i].flow);
    }
  });
});
