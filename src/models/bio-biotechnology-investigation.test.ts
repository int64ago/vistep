import { it, expect } from 'vitest';
import {
  certificateExamples,
  isoDay,
  compareCertificate,
  trainingSample,
  surveySummary,
  labelEvidence,
  marketingInference,
  planCompleteness,
} from './bio-biotechnology-investigation';
it('keeps archived evidence identity and purpose distinct', () => {
  const q = { id: 'MON87427', use: 'processing', region: 'South-China', date: '2026-10-18' };
  expect(compareCertificate(0, q).state).toBe('within-record');
  expect(compareCertificate(0, { ...q, use: 'production' }).state).toBe('mismatch');
  expect(compareCertificate(0, { ...q, id: 'maize' }).state).toBe('mismatch');
  expect(compareCertificate(0, { ...q, region: 'USA' }).state).toBe('mismatch');
  expect(certificateExamples[0].number).toBe('2024 / 065');
  expect(
    compareCertificate(1, { id: 'YK1601', use: 'production', region: 'North-China', date: q.date })
      .state,
  ).toBe('mismatch');
});
it('requires real dates and includes the actual record endpoints without inferring renewals', () => {
  const q = { id: 'YK1601', use: 'production', region: 'South-China', date: '2024-10-08' };
  expect(compareCertificate(1, q).state).toBe('within-record');
  expect(compareCertificate(1, { ...q, date: '2029-10-07' }).state).toBe('within-record');
  expect(compareCertificate(1, { ...q, date: '2029-10-08' }).state).toBe('mismatch');
  expect(compareCertificate(1, { ...q, date: '' }).state).toBe('incomplete');
  expect(isoDay('2026-02-30')).toBeNull();
  expect(isoDay('2024-02-29')).not.toBeNull();
});
it('does not turn missing observations into non-GM findings', () => {
  const s = surveySummary(trainingSample);
  expect(s).toEqual({
    total: 8,
    labelled: 3,
    claimed: 2,
    unrecorded: 3,
    recordedFraction: 5 / 8,
    documented: 5,
  });
  expect(surveySummary([]).recordedFraction).toBeNull();
  expect(surveySummary([{ ...trainingSample[0], product: '' }]).total).toBe(0);
  expect(() => surveySummary([trainingSample[0], trainingSample[0]])).toThrow('Duplicate');
});
it('label and safety reasoning retain missing-evidence states', () => {
  expect(labelEvidence('soy-oil', 'gm', 'not-recorded')).toBe('need-label-review');
  expect(labelEvidence('soy-oil', 'unknown', 'gm-statement')).toBe('need-provenance');
  expect(labelEvidence('cotton-fibre', 'gm', 'not-recorded')).toBe('outside-selected-catalogue');
  expect(marketingInference(true, false)).toBe('comparison-not-established');
  expect(marketingInference(true, true)).toBe('inspect-comparison-design');
  expect(
    planCompleteness({ audience: '', question: '', evidence: '', limits: '', format: '' }),
  ).toHaveLength(5);
});
