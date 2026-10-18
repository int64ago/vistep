import { expect, it } from 'vitest';
import {
  replicationGeneration,
  densityBands,
  bandProfile,
  replicationFork,
  forkTop,
  forkBottom,
} from './bio-dna-replication';
it('tracks both original strands without creating heavy material and derives distinct bands', () => {
  for (let g = 0; g <= 5; g++) {
    const x = replicationGeneration(g);
    expect(x).toHaveLength(2 ** g);
    const strands = x.flatMap((m) => m.strands);
    expect(strands.filter((s) => s.id === 'H-A')).toHaveLength(1);
    expect(strands.filter((s) => s.id === 'H-B')).toHaveLength(1);
    expect(strands.reduce((n, s) => n + s.heavyFraction, 0)).toBe(2);
    expect(new Set(strands.map((s) => s.id)).size).toBe(strands.length);
  }
  expect(densityBands(1).map((b) => b.heavyFraction)).toEqual([0.5]);
  expect(densityBands(2).map((b) => b.fraction)).toEqual([0.5, 0.5]);
  expect(densityBands(1, 'conservative').map((b) => b.heavyFraction)).toEqual([0, 1]);
  expect(densityBands(2, 'dispersive').map((b) => b.heavyFraction)).toEqual([0.25]);
  for (const mode of ['semiconservative', 'conservative', 'dispersive'] as const)
    for (let g = 0; g < 5; g++)
      expect(
        replicationGeneration(g, mode)
          .flatMap((m) => m.strands)
          .reduce((n, s) => n + s.heavyFraction, 0),
      ).toBe(2);
});
it('band areas sum to one and intermediate density is not a heavy/light mixture in separate molecules', () => {
  let sum = 0;
  for (let y = 0; y < 290; y += 0.1) sum += bandProfile(2, 'semiconservative', y) * 0.1;
  expect(sum).toBeCloseTo(1, 4);
  expect(densityBands(1)).toHaveLength(1);
  expect(densityBands(1, 'conservative')).toHaveLength(2);
});
it('opens only ahead of extension, builds opposite chemical directions and requires primer and enzyme', () => {
  const complementary: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
  for (let k = 0; k <= 1000; k++) {
    const s = replicationFork(k / 100);
    for (const b of [...s.leading, ...s.lagging]) {
      expect(b.base).toBe(complementary[b.template]);
      if (b.visible > 0) expect(b.x).toBeLessThan(s.forkX);
    }
  }
  expect(replicationFork(2.8).lagging[1].visible).toBe(1);
  expect(replicationFork(2.8).lagging[0].visible).toBe(0);
  expect(replicationFork(1.8).leading[0].visible).toBe(1);
  expect(replicationFork(1.8).leading[1].visible).toBe(0);
  const done = replicationFork(10);
  expect(done.complete).toBe(true);
  expect(done.leading.map((b) => b.base).join('')).toBe(forkBottom);
  expect(done.lagging.map((b) => b.base).join('')).toBe(forkTop);
  expect([...done.leading, ...done.lagging].every((b) => b.replacement === 1 && !b.rna)).toBe(true);
  expect(replicationFork(10, false).complete).toBe(false);
  const withoutPolymerase = replicationFork(10, false);
  expect(withoutPolymerase.leading[0]).toMatchObject({ visible: 1, rna: true, replacement: 0 });
  expect(withoutPolymerase.leading.slice(1).every((b) => b.visible === 0)).toBe(true);
  expect(
    withoutPolymerase.lagging
      .filter((b) => b.index % 2 === 1)
      .every((b) => b.visible === 1 && b.rna),
  ).toBe(true);
  for (let g = 0; g <= 5; g++)
    for (const m of replicationGeneration(g, 'dispersive'))
      for (const strand of m.strands)
        expect(strand.segments.reduce((a, b) => a + b, 0) / strand.segments.length).toBe(
          strand.heavyFraction,
        );
  expect(replicationFork(10, true, false).leading.every((b) => !b.visible)).toBe(true);
});
