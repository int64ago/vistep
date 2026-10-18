/** Millikan1913 TableIV, DropNo6, printed124. Raw readings and author-corrected column5 are distinct. No n or n-prime is supplied to the model. */
export const OIL_HISTORICAL_SOURCE = Object.freeze({
  title: 'On the Elementary Electrical Charge and the Avogadro Constant',
  doi: '10.1103/PhysRev.2.109',
  page: 124,
  drop: 6,
  printedMeanFallSeconds: 11.88,
  travelMeters: 0.01021,
  plateGapMeters: 0.016,
  initialVoltage: 5088.8,
  finalVoltage: 5081.2,
});
export const OIL_HISTORICAL_FALL_SECONDS: readonly number[] = Object.freeze([
  11.848, 11.89, 11.908, 11.904, 11.882, 11.906, 11.838, 11.816, 11.776, 11.84, 11.904, 11.87,
  11.952, 11.86, 11.846, 11.912, 11.91, 11.918, 11.87, 11.888, 11.894, 11.878,
]);
export const OIL_HISTORICAL_RISE = Object.freeze([
  Object.freeze({ id: 1, rawSeconds: Object.freeze([80.708]), correctedInverseSeconds: 0.01236 }),
  Object.freeze({
    id: 2,
    rawSeconds: Object.freeze([22.366, 22.39, 22.368]),
    correctedInverseSeconds: 0.0447,
  }),
  Object.freeze({ id: 3, rawSeconds: Object.freeze([140.565]), correctedInverseSeconds: 0.007192 }),
  Object.freeze({ id: 4, rawSeconds: Object.freeze([79.6]), correctedInverseSeconds: 0.01254 }),
  Object.freeze({
    id: 5,
    rawSeconds: Object.freeze([34.748, 34.762, 34.846]),
    correctedInverseSeconds: 0.0287,
  }),
  Object.freeze({
    id: 6,
    rawSeconds: Object.freeze([29.286, 29.236]),
    correctedInverseSeconds: 0.03414,
  }),
  Object.freeze({ id: 7, rawSeconds: Object.freeze([137.308]), correctedInverseSeconds: 0.007268 }),
  Object.freeze({ id: 8, rawSeconds: Object.freeze([34.638]), correctedInverseSeconds: 0.02884 }),
  Object.freeze({
    id: 9,
    rawSeconds: Object.freeze([22.104, 22.268]),
    correctedInverseSeconds: 0.04507,
  }),
  Object.freeze({ id: 10, rawSeconds: Object.freeze([500.1]), correctedInverseSeconds: 0.002 }),
  Object.freeze({
    id: 11,
    rawSeconds: Object.freeze([19.704, 19.668]),
    correctedInverseSeconds: 0.05079,
  }),
  Object.freeze({
    id: 12,
    rawSeconds: Object.freeze([77.63, 77.806]),
    correctedInverseSeconds: 0.01285,
  }),
  Object.freeze({ id: 13, rawSeconds: Object.freeze([42.302]), correctedInverseSeconds: 0.02364 }),
]);
/** Col6 has at least one printed arithmetic inconsistency. Product changes are recomputed from fixed col5, not copied from col6. */
export const OIL_HISTORICAL_LIMITS = Object.freeze({
  corrected: 'Column5 applies the original author’s timing corrections; not simply1/mean(raw).',
  precision: 'Printed numerals retained; no independent uncertainty estimates invented.',
  range:
    'Historical changes constrain a repeated increment. Finite observations alone also admit finer submultiples.',
  absolute: 'This table alone is not a fresh precision reconstruction of elementary charge.',
});
