import { describe, expect, it } from 'vitest';
import { chFilmPlan, chShot } from './cell-handover-film';

describe('film director', () => {
  it('is deterministic and chapter-relative', () => {
    for (let c = 0; c < 7; c++)
      for (const p of [0, 0.03, 0.25, 0.5, 0.77, 1]) {
        const a = chShot(c, p, 3),
          b = chShot(c, p, 3);
        expect(a).toEqual(b);
        expect(a.phone).toBeGreaterThanOrEqual(0);
        expect(a.phone).toBeLessThanOrEqual(1);
        expect(a.phoneOpacity).toBeGreaterThanOrEqual(0);
        expect(a.phoneOpacity).toBeLessThanOrEqual(1);
      }
    expect(() => chShot(NaN, 0)).toThrow(RangeError);
    expect(chShot(99, 2).view).toBe('idle');
  });
  it('compares both settings on the same stretch of street', () => {
    const plan = chFilmPlan();
    const eager = chShot(4, 0.2),
      tuned = chShot(4, 0.7);
    expect(eager.run).toBe('eager');
    expect(tuned.run).toBe('tuned');
    for (const s of [chShot(4, 0.08), chShot(4, 0.52)])
      expect(s.phone).toBeCloseTo(plan.window.start, 6);
    expect(chShot(4, 0.9).phone).toBeCloseTo(plan.window.end, 6);
  });
  it('covers the whole handover timeline and the tracking-area update', () => {
    expect(chShot(5, 0).ladderMs).toBeLessThan(0);
    expect(chShot(5, 1).ladderMs).toBeGreaterThan(80);
    const plan = chFilmPlan();
    expect(plan.tauFraction).toBeGreaterThan(chShot(6, 0.1).phone);
    expect(plan.tauFraction).toBeLessThan(chShot(6, 0.6).phone);
  });
});

describe('facts the narration names', () => {
  it('match the model (update the speech if any of these change)', async () => {
    const { chAssign, chLayout, chUsers, CH } = await import('./cell-handover');
    const { chLadder } = await import('./cell-handover-ladder');
    const plan = chFilmPlan();
    const layout = plan.tuned.layout;
    expect(plan.tuned.handovers).toBe(8);
    expect(plan.window.eager).toHaveLength(9);
    expect(plan.window.tuned).toHaveLength(1);
    expect(layout.sites[plan.probe.nearest].name).toBe('G');
    expect(layout.cells[plan.probe.strongest].label).toBe('F1');
    const at = plan.tuned.route.at(plan.probeFraction * plan.tuned.route.length);
    const users = chUsers().map((u) => (u.id ? u : { id: 0, x: at.x, y: at.y }));
    const macro = chAssign(layout, users),
      dense = chAssign(chLayout(CH.isdM / 2), users);
    expect(layout.cells[macro.cellOf[0]].label).toBe('F1');
    expect(macro.members[macro.cellOf[0]]).toHaveLength(14);
    expect(dense.members[dense.cellOf[0]]).toHaveLength(7);
    expect(chLadder().gapMs).toBe(33);
    // The "nearest vs strongest" contrast must be visible: the strongest cell's mast is ≥ 1.3× as far.
    const d = (id: number) => Math.hypot(layout.sites[id].x - at.x, layout.sites[id].y - at.y);
    expect(
      d(layout.cells[plan.probe.strongest].site) / d(plan.probe.nearest),
    ).toBeGreaterThanOrEqual(1.3);
    expect(layout.cells.filter((c) => layout.sites[c.site].ta === 1)).toHaveLength(21);
    expect(plan.idle.updates).toHaveLength(1);
  });
});

describe('timing against the recorded narration', () => {
  it('reselects quietly under the second idle sentence and updates under the third', async () => {
    const plan = chFilmPlan();
    const pAt = (i: number) => {
      const fraction = i / (plan.tuned.count - 1);
      for (let p = 0.06; p <= 1; p += 0.002) if (chShot(6, p).phone >= fraction) return p;
      return 1;
    };
    const tau = plan.idle.updates[0].i;
    const quiet = plan.idle.reselections.filter((k) => k < tau).slice(-2);
    for (const k of quiet) {
      expect(pAt(k)).toBeGreaterThan(0.18);
      expect(pAt(k)).toBeLessThan(0.36);
    }
    expect(pAt(tau)).toBeGreaterThan(0.36);
    expect(pAt(tau)).toBeLessThan(0.5);
    expect(chShot(6, 0.5).paging).toBe(0);
    expect(chShot(6, 0.7).paging).toBeGreaterThan(0);
  });
  it('switches the path late in the ladder, under the closing sentence', async () => {
    const { chLadder } = await import('./cell-handover-ladder');
    const L = chLadder();
    const path = L.messages.find((m) => m.id === 'path')!;
    const command = L.messages.find((m) => m.id === 'command')!;
    expect(chShot(5, 0.74).ladderMs).toBeLessThan(path.send);
    expect(chShot(5, 0.8).ladderMs).toBeGreaterThan(path.send);
    expect(chShot(5, 0.35).ladderMs).toBeLessThan(command.send);
    expect(chShot(5, 0.4).ladderMs).toBeGreaterThan(command.send);
  });
});
