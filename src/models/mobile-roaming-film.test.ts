import { describe, expect, it } from 'vitest';
import { MR_BEATS, MR_VIEWS, mrSettled, mrShot, type MrLocale } from './mobile-roaming-film';

const locales: MrLocale[] = ['zh', 'en'];

describe('mobile roaming film director', () => {
  it('assigns one view per chapter and clamps the position', () => {
    expect(MR_VIEWS).toHaveLength(7);
    expect(mrShot(0, 0).view).toBe('select');
    expect(mrShot(6, 1, 'en').view).toBe('call');
    expect(mrShot(99, 2).view).toBe('call');
    expect(mrShot(-3, -1)).toMatchObject({ view: 'select', p: 0 });
    expect(() => mrShot(Number.NaN, 0)).toThrow(RangeError);
  });
  it('defines the same beats for both narration languages', () => {
    for (const view of MR_VIEWS)
      expect(Object.keys(MR_BEATS.en[view]).sort()).toEqual(Object.keys(MR_BEATS.zh[view]).sort());
  });
  for (const locale of locales) {
    it(`keeps ${locale} windows ordered and inside the chapter`, () => {
      for (const view of MR_VIEWS)
        for (const [a, b] of Object.values(MR_BEATS[locale][view])) {
          expect(a).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThanOrEqual(1);
          expect(b).toBeGreaterThan(a);
        }
    });
    it(`is deterministic, monotonic and complete at the chapter end (${locale})`, () => {
      for (let c = 0; c < MR_VIEWS.length; c++) {
        let previous = mrShot(c, 0, locale).beats;
        expect(Object.values(previous).every((v) => v === 0)).toBe(true);
        for (let i = 1; i <= 200; i++) {
          const now = mrShot(c, i / 200, locale).beats;
          for (const k of Object.keys(now)) expect(now[k]).toBeGreaterThanOrEqual(previous[k]);
          previous = now;
        }
        expect(previous).toEqual(mrSettled(MR_VIEWS[c]));
        expect(mrShot(c, 0.37, locale)).toEqual(mrShot(c, 0.37, locale));
      }
    });
    it(`orders messages causally inside each chapter (${locale})`, () => {
      const B = MR_BEATS[locale];
      expect(B.select.home[1]).toBeLessThanOrEqual(B.select.match[0]);
      expect(B.select.match[1]).toBeLessThanOrEqual(B.select.choose[0]);
      expect(B.identity.read[1]).toBeLessThanOrEqual(B.identity.split[0]);
      expect(B.identity.split[1]).toBeLessThanOrEqual(B.identity.realm[0]);
      expect(B.ask.air[1]).toBeLessThanOrEqual(B.ask.gen[0]);
      expect(B.ask.gen[1]).toBeLessThanOrEqual(B.ask.aia[0]);
      expect(B.prove.forward[1]).toBeLessThanOrEqual(B.prove.mac[0]);
      expect(B.prove.mac[1]).toBeLessThanOrEqual(B.prove.res[0]);
      expect(B.prove.res[1]).toBeLessThanOrEqual(B.prove.back[0]);
      expect(B.prove.back[1]).toBeLessThanOrEqual(B.prove.compare[0]);
      expect(B.prove.compare[1]).toBeLessThanOrEqual(B.prove.flip[0]);
      expect(B.record.write[0]).toBeGreaterThanOrEqual(B.record.ulr[1]);
      const call = Object.values(B.call);
      for (let i = 1; i < call.length; i++)
        expect(call[i][0]).toBeGreaterThanOrEqual(call[i - 1][1]);
    });
  }
  it('selects the English table by locale', () => {
    // At 70% of chapter 1 the Chinese film is still choosing A while English has chosen.
    expect(mrShot(0, 0.72, 'en').beats.choose).toBe(1);
    expect(mrShot(0, 0.72, 'zh').beats.choose).toBeLessThan(1);
  });
});
