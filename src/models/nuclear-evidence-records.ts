/** Source records are independent of every displayed kinematic candidate.
 * Qualitative records do not encode invented event counts or separation yields. */
export const RECOIL_RECORDS = Object.freeze({
  textbook: Object.freeze({
    hydrogen: 3.3e7,
    nitrogen: 4.4e6,
    label: 'PEP elective 1 p24 exercise4',
    kind: 'rounded textbook exercise',
    unit: 'm/s',
  }),
  chadwick: Object.freeze({
    hydrogen: 3.7e7,
    nitrogen: 4.7e6,
    label: 'Chadwick Nobel lecture p342',
    kind: 'approximate velocities inferred from measured ranges',
    unit: 'm/s',
  }),
});
export const BARIUM_RECORDS = Object.freeze([
  Object.freeze({
    id: 'artificial',
    sample: 'neutron-irradiated uranium product',
    carrier: 'barium',
    result: 'not-separated',
    evidence: 'Hahn Nobel lecture pp58–59; no enrichment away from barium carrier',
  }),
  Object.freeze({
    id: 'radium-control',
    sample: 'known natural radium isotope at similarly weak activity',
    carrier: 'barium',
    result: 'enriched-early',
    evidence: 'Hahn Nobel lecture p58; enriched in first fractions',
  }),
  Object.freeze({
    id: 'mixed-control',
    sample: 'known radium mixed with artificial product',
    carrier: 'barium',
    result: 'different-behaviour',
    evidence: 'Hahn Nobel lecture p58; radium separated, artificial product did not',
  }),
]);
export const BLACKETT_RECORD = Object.freeze({
  photographs: 23000,
  examinedTracksLowerBound: 400000,
  anomalousForks: 8,
  outgoingTracks: 2,
  source: 'Blackett Nobel lecture pp100–101',
  caveat: 'Historical observation; does not fix the teaching event angle or proton energy.',
});
