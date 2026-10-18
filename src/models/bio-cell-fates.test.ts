import { it, expect } from 'vitest';
import {
  cultureRemaining,
  carrotCulture,
  textbookNuclearSwap,
  wormCellFates,
  illustrativeLineage,
} from './bio-cell-fates';
it('keeps the textbook range and never turns generations into ages', () => {
  expect(cultureRemaining(0)[2]).toMatchObject({
    min: 2,
    max: 4,
    remainingMin: 2,
    remainingMax: 4,
  });
  expect(cultureRemaining(3)[2]).toMatchObject({ remainingMin: 0, remainingMax: 1 });
  expect(cultureRemaining(100).every((c) => c.remainingMax === 0)).toBe(true);
});
it('requires suitable culture conditions and limits the nuclear swap inference', () => {
  expect(carrotCulture(1).shoot).toBe(1);
  expect(carrotCulture(1, false).shoot).toBe(0);
  expect(textbookNuclearSwap(true, false)).toMatchObject({
    textbookProliferation: 'vigorous',
    generalizes: false,
  });
});
it('conserves the canonical somatic lineage count and separates execution from division', () => {
  const end = wormCellFates(1);
  expect(end.retained).toBe(959);
  expect(end.dead).toBe(131);
  expect(wormCellFates(1, false).retained).toBe(1090);
  expect(wormCellFates(1, true, false).retained).toBe(1090);
  for (const p of [0, 0.3, 1]) {
    const s = wormCellFates(p);
    expect(s.dead + s.retained).toBe(s.formed);
  }
  expect(illustrativeLineage.slice(1).every((c) => c.parent !== null && c.parent < c.id)).toBe(
    true,
  );
});
