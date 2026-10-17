import { describe, expect, it } from 'vitest';
import {
  astarLessonGrid,
  astarNeighbors,
  astarPathCost,
  astarTrace,
  type AstarGrid,
} from './astar-search';
const reference = (g: AstarGrid) => {
  const d = Array(g.cost.length).fill(Infinity);
  d[g.start] = 0;
  for (let pass = 0; pass < g.cost.length; pass++) {
    let changed = false;
    for (let v = 0; v < d.length; v++)
      if (!g.blocked.includes(v))
        for (const w of astarNeighbors(g, v))
          if (d[v] + g.cost[w] < d[w]) {
            d[w] = d[v] + g.cost[w];
            changed = true;
          }
    if (!changed) break;
  }
  return d[g.goal];
};
describe('A-star route search', () => {
  it('distinguishes a valid lower bound from a faster-looking suboptimal weighted route', () => {
    const grid = astarLessonGrid(),
      a = astarTrace(grid, 1),
      zero = astarTrace(grid, 0),
      bad = astarTrace(grid, 6);
    expect(a.cost).toBe(12);
    expect(zero.cost).toBe(12);
    expect(bad.cost).toBe(15);
    expect(a.guaranteed).toBe(true);
    expect(bad.guaranteed).toBe(false);
    expect(a.pops).toBeLessThan(zero.pops);
    expect(astarPathCost(grid, a.path)).toBe(a.cost);
    expect(astarPathCost(grid, bad.path)).toBe(bad.cost);
  });
  it('matches independent repeated relaxation on forty varied weighted grids', () => {
    for (let seed = 0; seed < 40; seed++) {
      const grid: AstarGrid = {
        width: 5,
        height: 4,
        start: 0,
        goal: 19,
        cost: Array.from({ length: 20 }, (_, i) => 1 + ((i * 7 + seed * 3) % 5)),
        blocked: Array.from({ length: 18 }, (_, i) => i + 1).filter(
          (i) => (i * 11 + seed) % 13 === 0,
        ),
      };
      for (const w of [0, 0.5, 1]) {
        const q = astarTrace(grid, w);
        expect(q.cost).toBe(reference(grid));
        if (q.found) expect(astarPathCost(grid, q.path)).toBe(q.cost);
      }
    }
  });
  it('selects the true minimum frontier f on each step and uses consistent unit-grid h', () => {
    const grid = astarLessonGrid(),
      q = astarTrace(grid);
    for (let i = 1; i < q.frames.length; i++) {
      expect(q.frames[i].current).toBe(q.frames[i - 1].open[0].id);
      for (const item of q.frames[i].open) expect(item.f).toBe(item.g + item.h);
    }
    for (let v = 0; v < grid.cost.length; v++)
      for (const w of astarNeighbors(grid, v)) {
        const h = (i: number) => Math.abs((i % 9) - 8) + Math.abs(Math.floor(i / 9) - 2);
        expect(h(v)).toBeLessThanOrEqual(grid.cost[w] + h(w));
      }
  });
  it('reports genuine unreachability, start=goal and invalid costs without invented paths', () => {
    expect(astarTrace(astarLessonGrid(true)).found).toBe(false);
    expect(astarTrace(astarLessonGrid(true)).path).toEqual([]);
    const same = { ...astarLessonGrid(), goal: 18 };
    expect(astarTrace(same).cost).toBe(0);
    expect(astarTrace(same).path).toEqual([18]);
    expect(() => astarTrace({ ...same, cost: Array(45).fill(0) })).toThrow();
    expect(() => astarTrace(same, Infinity)).toThrow();
  });
});
