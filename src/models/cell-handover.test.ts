import { describe, expect, it } from 'vitest';
import {
  CH,
  CH_DEFAULT,
  CH_EAGER,
  CH_TTT_MS,
  chAntennaDb,
  chAssign,
  chCellColors,
  chCompareWindow,
  chContours,
  chFieldSet,
  chField,
  chIdle,
  chLayout,
  chNearestNotStrongest,
  chPathLossDb,
  chRoute,
  chRsrpAt,
  chShadow,
  chShadowAt,
  chSimulate,
  chSinrDb,
  chTextbookHex,
  chUsers,
} from './cell-handover';

describe('radio model', () => {
  it('uses the TR 36.814 horizontal pattern', () => {
    expect(chAntennaDb(0)).toBe(-0);
    expect(chAntennaDb(35)).toBeCloseTo(-3, 6);
    expect(chAntennaDb(180)).toBe(-25);
    expect(chAntennaDb(-35)).toBeCloseTo(chAntennaDb(325), 9);
    expect(() => chAntennaDb(NaN)).toThrow(RangeError);
  });
  it('follows the 2 GHz macro path-loss law over 3D distance', () => {
    const d3 = Math.hypot(1000, CH.mastHeightM - CH.handsetHeightM);
    expect(chPathLossDb(1000)).toBeCloseTo(128.1 + 37.6 * Math.log10(d3 / 1000), 9);
    expect(chPathLossDb(0)).toBe(chPathLossDb(CH.minDistanceM));
    expect(chPathLossDb(500) - chPathLossDb(250)).toBeGreaterThan(10);
    expect(() => chPathLossDb(-1)).toThrow(RangeError);
  });
  it('keeps RSRP along the route in a plausible reporting range', () => {
    const run = chSimulate(CH_DEFAULT);
    for (let i = 0; i < run.count; i += 7) {
      const s = run.serving[i];
      const v = run.truth[i * run.cells + s];
      expect(v).toBeGreaterThan(-110);
      expect(v).toBeLessThan(-44);
    }
  });
  it('has a unit-variance, spatially correlated shadowing field', () => {
    const sh = chShadow(13);
    const f = sh.fields[3];
    const mean = f.reduce((a, b) => a + b, 0) / f.length;
    const sd = Math.sqrt(f.reduce((a, b) => a + (b - mean) ** 2, 0) / f.length);
    expect(sd).toBeGreaterThan(0.85);
    expect(sd).toBeLessThan(1.15);
    const corr = (d: number) => {
      let sxy = 0,
        n = 0;
      for (let x = 100; x < 1800; x += 37)
        for (let y = 100; y < 1000; y += 41) {
          sxy += chShadowAt(sh, 3, x, y) * chShadowAt(sh, 3, x + d, y);
          n++;
        }
      return sxy / n;
    };
    expect(corr(10)).toBeGreaterThan(corr(50));
    expect(corr(50)).toBeGreaterThan(corr(250));
    expect(corr(250)).toBeLessThan(0.25);
    // Sectors of one site share a field; different sites correlate by about 0.5.
    let cross = 0,
      n = 0;
    for (let x = 0; x < 2000; x += 23)
      for (let y = 0; y < 1150; y += 29) {
        cross += chShadowAt(sh, 1, x, y) * chShadowAt(sh, 2, x, y);
        n++;
      }
    expect(cross / n).toBeGreaterThan(0.3);
    expect(cross / n).toBeLessThan(0.7);
  });
  it('reproduces textbook hexagons without shadowing, and breaks them with it', () => {
    const layout = chLayout();
    const inHex = (px: number, py: number, hex: [number, number][]) => {
      let inside = false;
      for (let a = 0, b = hex.length - 1; a < hex.length; b = a++) {
        const [xa, ya] = hex[a],
          [xb, yb] = hex[b];
        if (ya > py !== yb > py && px < ((xb - xa) * (py - ya)) / (yb - ya) + xa) inside = !inside;
      }
      return inside;
    };
    const agreement = (sigma: number) => {
      const f = chField(layout, sigma, 20);
      let hit = 0,
        total = 0;
      for (let j = 0; j < f.rows; j++)
        for (let i = 0; i < f.cols; i++) {
          const x = (i + 0.5) * 20,
            y = (j + 0.5) * 20;
          if (x < 300 || x > 1700 || y < 250 || y > 900) continue;
          total++;
          if (inHex(x, y, chTextbookHex(layout, layout.cells[f.best[j * f.cols + i]]))) hit++;
        }
      return hit / total;
    };
    const ideal = agreement(0);
    expect(ideal).toBeGreaterThan(0.9);
    expect(agreement(CH.shadowSigmaDb)).toBeLessThan(ideal - 0.1);
  });
  it('rejects invalid queries', () => {
    const layout = chLayout();
    expect(() => chRsrpAt(layout, NaN, 0, 6)).toThrow(RangeError);
    expect(() => chRsrpAt(layout, 0, 0, -1)).toThrow(RangeError);
    expect(() => chField(layout, 6, 0)).toThrow(RangeError);
    expect(() => chLayout(50)).toThrow(RangeError);
    expect(() => chSinrDb([-80, -90], 5)).toThrow(RangeError);
  });
  it('computes SINR over interference and noise', () => {
    expect(chSinrDb([-80, -80], 0)).toBeCloseTo(0, 1);
    expect(chSinrDb([-80, -200], 0)).toBeCloseTo(-80 - CH.noiseDbm, 3);
  });
  it('colours neighbouring cells differently', () => {
    const layout = chLayout(),
      colors = chCellColors(layout),
      r = layout.isdM / 3;
    const c = layout.cells.map((cell) => {
      const s = layout.sites[cell.site],
        a = (cell.azimuth * Math.PI) / 180;
      return [s.x + r * Math.cos(a), s.y + r * Math.sin(a)];
    });
    for (let a = 0; a < c.length; a++)
      for (let b = 0; b < a; b++)
        if (Math.hypot(c[a][0] - c[b][0], c[a][1] - c[b][1]) < 2 * r)
          expect(colors[a]).not.toBe(colors[b]);
  });
});

describe('vector boundaries', () => {
  it('trace sub-sample contours between different cells only', () => {
    const layout = chLayout();
    const f = chField(layout, 0, 20);
    const seg = chContours(f);
    expect(seg.length % 4).toBe(0);
    expect(seg.length).toBeGreaterThan(400);
    for (let k = 0; k < seg.length; k += 4) {
      // Every segment is short (inside one grid square) and finite.
      expect(Math.hypot(seg[k + 2] - seg[k], seg[k + 3] - seg[k + 1])).toBeLessThanOrEqual(
        20 * Math.SQRT2 + 1e-3,
      );
      expect([...seg.slice(k, k + 4)].every(Number.isFinite)).toBe(true);
    }
    // Without shadowing, points on a boundary are where two cells tie (within a small tolerance).
    const out = new Float64Array(layout.cells.length);
    let near = 0;
    for (let k = 0; k < seg.length; k += 40) {
      chRsrpAt(layout, seg[k], seg[k + 1], 0, out);
      const sorted = [...out].sort((a, b) => b - a);
      if (sorted[0] - sorted[1] < 3) near++;
    }
    expect(near / Math.ceil(seg.length / 40)).toBeGreaterThan(0.85);
  });
  it('groups cells into tracking areas with a shorter border', () => {
    const set = chFieldSet(CH.isdM, CH.shadowSigmaDb, 20);
    expect(set.taEdges.length).toBeGreaterThan(0);
    expect(set.taEdges.length).toBeLessThan(set.cellEdges.length / 3);
  });
});

describe('connected-mode handover', () => {
  it('is deterministic for the same inputs', () => {
    const a = chSimulate({ ...CH_DEFAULT, hysDb: 2.5 });
    const b = chSimulate({ ...CH_DEFAULT, hysDb: 2.5 });
    expect(a).toBe(b); // cached
    const route = chRoute();
    expect(route.length).toBeGreaterThan(1800);
    expect(a.count).toBe(Math.floor(route.length / ((CH_DEFAULT.speedKmh / 3.6) * CH.stepS)) + 1);
  });
  it('makes eager settings ping-pong and tuned settings hand over cleanly', () => {
    const eager = chSimulate(CH_EAGER),
      tuned = chSimulate(CH_DEFAULT);
    expect(eager.handovers).toBeGreaterThanOrEqual(3 * tuned.handovers);
    expect(eager.pingPongs).toBeGreaterThan(5);
    expect(tuned.pingPongs).toBe(0);
    expect(tuned.failures).toBe(0);
    const w = chCompareWindow(eager, tuned)!;
    expect(w.eager.length).toBeGreaterThanOrEqual(5);
    expect(w.tuned.filter((e) => e.kind === 'handover')).toHaveLength(1);
    expect(w.pair).toHaveLength(2);
    expect(w.end).toBeGreaterThan(w.start);
  });
  it('fails the link when triggering is far too late', () => {
    const late = chSimulate({ ...CH_DEFAULT, hysDb: 10, tttMs: 5120, speedKmh: 60 });
    expect(late.failures).toBeGreaterThan(0);
    expect(late.events.some((e) => e.kind === 'reestablish')).toBe(true);
  });
  it('only hands over to a neighbour that satisfied A3 for the whole TTT', () => {
    const run = chSimulate({ ...CH_DEFAULT, tttMs: 640 });
    const n = run.cells,
      hold = Math.round(0.64 / run.dt);
    for (const e of run.events.filter((x) => x.kind === 'report')) {
      for (let k = e.i - hold; k <= e.i; k++)
        expect(run.filtered[k * n + e.to] - run.params.hysDb).toBeGreaterThan(
          run.filtered[k * n + e.from],
        );
    }
  });
  it('filters measurements with the 200 ms-referenced L3 coefficient', () => {
    const run = chSimulate(CH_DEFAULT);
    const a = 1 - 0.5 ** (CH.stepS / 0.2);
    // The filtered trace moves by exactly a fraction a of the step towards each new measurement:
    // it must be smoother than the long-term truth plus fluctuation, but not lag by seconds.
    let rough = 0,
      smooth = 0;
    for (let i = 1; i < run.count; i++) {
      smooth += Math.abs(run.filtered[i * run.cells] - run.filtered[(i - 1) * run.cells]);
      rough += Math.abs(run.truth[i * run.cells] - run.truth[(i - 1) * run.cells]);
    }
    expect(a).toBeCloseTo(0.1294, 3);
    expect(smooth).toBeGreaterThan(rough * 0.5);
    expect(smooth).toBeLessThan(rough * 6);
  });
  it('accepts every standard TTT and extreme speeds, rejects invalid ones', () => {
    for (const ttt of CH_TTT_MS) expect(chValid(ttt)).toBe(true);
    expect(() => chSimulate({ ...CH_DEFAULT, tttMs: 300 })).toThrow(RangeError);
    expect(() => chSimulate({ ...CH_DEFAULT, speedKmh: 0 })).toThrow(RangeError);
    expect(() => chSimulate({ ...CH_DEFAULT, hysDb: -1 })).toThrow(RangeError);
    expect(chSimulate({ ...CH_DEFAULT, speedKmh: 200 }).count).toBeGreaterThan(100);
    expect(chSimulate({ ...CH_DEFAULT, sigmaDb: 0 }).pingPongs).toBe(0);
  });
  it('finds a place where the nearest site is not the strongest', () => {
    const p = chNearestNotStrongest(chSimulate(CH_DEFAULT))!;
    const layout = chLayout();
    expect(layout.cells[p.strongest].site).not.toBe(p.nearest);
    expect(layout.cells[p.nearestCell].site).toBe(p.nearest);
    expect(p.margin).toBeGreaterThanOrEqual(4);
  });
});

function chValid(ttt: number) {
  try {
    chSimulate({ ...CH_DEFAULT, tttMs: ttt });
    return true;
  } catch {
    return false;
  }
}

describe('idle mode and capacity', () => {
  it('reselects silently and updates location only on a new tracking area', () => {
    const run = chSimulate(CH_DEFAULT),
      idle = chIdle(run);
    expect(idle.reselections.length).toBeGreaterThan(2);
    expect(idle.updates).toHaveLength(1);
    const taOf = (c: number) => run.layout.sites[run.layout.cells[c].site].ta;
    for (let i = 1; i < run.count; i++)
      if (idle.registeredTa[i] !== idle.registeredTa[i - 1])
        expect(idle.updates.some((u) => u.i === i)).toBe(true);
    expect(taOf(idle.camped[run.count - 1])).toBe(idle.registeredTa[run.count - 1]);
    expect(() => chIdle(run, -1)).toThrow(RangeError);
  });
  it('shares one carrier among fewer people when sites are denser', () => {
    const users = chUsers();
    const macro = chAssign(chLayout(), users),
      dense = chAssign(chLayout(CH.isdM / 2), users);
    const total = (a: typeof macro) => a.members.reduce((s, m) => s + m.length, 0);
    expect(total(macro)).toBe(users.length);
    expect(total(dense)).toBe(users.length);
    const busiest = (a: typeof macro) => Math.max(...a.members.map((m) => m.length));
    expect(busiest(dense)).toBeLessThan(busiest(macro));
    expect(macro.prbsPerUser(macro.cellOf[0])).toBeCloseTo(
      CH.prbs / macro.members[macro.cellOf[0]].length,
      9,
    );
  });
});
