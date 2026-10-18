export const investigationClamp = (x: number) =>
  Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
export const certificateExamples = [
  {
    id: 'MON87427',
    cropZh: '玉米',
    cropEn: 'Maize',
    number: '2024 / 065',
    use: 'processing',
    region: 'China',
    from: '2024-10-08',
    to: '2029-10-07',
    url: 'https://www.moa.gov.cn/ztzl/zjyqwgz/spxx/202410/P020241011735468898553.pdf',
  },
  {
    id: 'YK1601',
    cropZh: '番木瓜',
    cropEn: 'Papaya',
    number: '2024 / 220',
    use: 'production',
    region: 'South-China',
    from: '2024-10-08',
    to: '2029-10-07',
    url: 'https://www.moa.gov.cn/ztzl/zjyqwgz/spxx/202410/P020241011735470924167.pdf',
  },
] as const;
export function isoDay(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const n = Date.parse(date + 'T00:00:00Z');
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === date ? n : null;
}
export type DocumentQuery = { id: string; use: string; region: string; date: string };
export function compareCertificate(index: number, query: DocumentQuery) {
  const d = certificateExamples[index === 1 ? 1 : 0],
    day = isoDay(query.date);
  const checks = [
    { field: 'identity', match: query.id.trim() ? query.id.trim().toUpperCase() === d.id : null },
    { field: 'use', match: query.use ? query.use === d.use : null },
    {
      field: 'region',
      match: query.region
        ? (d.region === 'China' &&
            ['South-China', 'North-China', 'China'].includes(query.region)) ||
          query.region === d.region
        : null,
    },
    {
      field: 'period',
      match: day === null ? null : day >= isoDay(d.from)! && day <= isoDay(d.to)!,
    },
  ];
  return {
    document: d,
    checks,
    state: checks.some((a) => a.match === false)
      ? 'mismatch'
      : checks.some((a) => a.match === null)
        ? 'incomplete'
        : 'within-record',
  };
}
export type LabelObservation = 'gm-statement' | 'non-gm-claim' | 'not-recorded';
export type SurveyRow = {
  id: string;
  product: string;
  observation: LabelObservation;
  source: string;
  date: string;
};
export const trainingSample: SurveyRow[] = Array.from({ length: 8 }, (_, i) => ({
  id: 'T' + (i + 1),
  product: 'training-' + (i + 1),
  observation: i < 3 ? 'gm-statement' : i < 5 ? 'non-gm-claim' : 'not-recorded',
  source: i < 5 ? 'example-package' : '',
  date: '2026-10-18',
}));
export function surveySummary(rows: SurveyRow[]) {
  const entered = rows.filter((a) => a.product.trim()),
    unique = new Set(entered.map((a) => a.id));
  if (unique.size !== entered.length) throw new Error('Duplicate record identity');
  const labelled = entered.filter((a) => a.observation === 'gm-statement').length,
    claimed = entered.filter((a) => a.observation === 'non-gm-claim').length,
    unrecorded = entered.length - labelled - claimed;
  return {
    total: entered.length,
    labelled,
    claimed,
    unrecorded,
    recordedFraction: entered.length ? (labelled + claimed) / entered.length : null,
    documented: entered.filter((a) => a.source.trim() && isoDay(a.date) !== null).length,
  };
}
export function labelEvidence(
  category: 'soy-oil' | 'cotton-fibre' | 'unknown',
  provenance: 'gm' | 'non-gm' | 'unknown',
  statement: LabelObservation,
) {
  if (category === 'unknown' || provenance === 'unknown') return 'need-provenance';
  if (category === 'cotton-fibre') return 'outside-selected-catalogue';
  if (provenance === 'gm' && statement !== 'gm-statement') return 'need-label-review';
  return 'compare-wording-and-scope';
}
export function marketingInference(hasClaim: boolean, hasComparison: boolean) {
  return !hasClaim
    ? 'no-comparative-claim'
    : hasComparison
      ? 'inspect-comparison-design'
      : 'comparison-not-established';
}
export function planCompleteness(a: {
  audience: string;
  question: string;
  evidence: string;
  limits: string;
  format: string;
}) {
  return Object.entries(a)
    .filter(([, v]) => !v.trim())
    .map(([k]) => k);
}
