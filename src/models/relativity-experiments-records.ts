/** Independently published records. No model/control function writes these objects.
 * Sources and transcription images: drafts/relativity-experiments/brief.md.
 */
function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
export const MUON_RECORDS = freeze({
  citation:
    'Frisch & Smith (1963), Measurement of the Relativistic Time Dilation Using μ-Mesons, American Journal of Physics 31, 342–355, DOI10.1119/1.1969508',
  table: 'Table I, printed348/PDF7',
  unit: 'counts per one-hour run',
  summit: [568, 554, 582, 527, 588, 559],
  cambridge: [412, 403, 436, 395, 393],
  reportedMeans: [563, 408],
  reportedErrors: [10, 9],
  reportedErrorType:
    'Paper statistical standard deviation of mean; do not recompute as population spread of listed hourly runs',
  heightDifferenceM: 1907,
  selectedSummitSpeedOverC: [0.995, 0.9954],
  reportedBackgroundCounts: [13, 11],
  backgroundEstimatedSystematicError: [2, 2],
  backgroundCorrectedCounts: [550, 397],
  publishedSurvivalRatio: 0.722,
  publishedRatioError: 0.021,
  inferredEffectiveGamma: 8.8,
  inferredGammaStatisticalError: 0.8,
  predictedEffectiveGamma: 8.4,
  predictedErrorEstimate: 2,
  limits: [
    'Theoretical ±2 is a rough author estimate, not Gaussian measurement SD. Observed ±.8 is statistical only; authors explicitly caution overall error is greater.',
    'Muon speed decreases in air. An effective γ from the historical angular/energy selection is not γ(.9952) at constant speed.',
    'Iron shielding was reduced at Cambridge to approximately compensate for atmospheric stopping; same apparatus moved between sites, not two event-matched detectors.',
    'Published 568→27→412 narrative is one-hour run plus recorded stopped-decay distribution, distinct from all-run means563/408; do not substitute a smooth exponential calculation and label it27.',
    'Stopped muons in plastic have capture/timing-window effects; finite 8.5μs acquisition and approximately0.5μs initial mask differ from free proper lifetime.',
    'The original film incorrectly says570 for sixth summit run; source Table I corrects it to559.',
    'Not the first historical muon evidence: paper explicitly repeats/modifies Rossi–Hall1941.',
  ],
});
export const CLOCK_RECORDS = freeze({
  citation: 'Hafele & Keating (1972), Science177,166–170, DOI10.1126/science.177.4044.166 and .168',
  predictedTable: 'Predicted paper Table1 p166',
  observedTable: 'Observed paper Table1 p168',
  unit: 'ns relative to MEAN(USNO)',
  clockSerials: [120, 361, 408, 447],
  observedEast: [-57, -74, -55, -51],
  observedWest: [277, 284, 266, 266],
  publishedMeanEast: -59,
  publishedSDEast: 10,
  publishedMeanWest: 273,
  publishedSDWest: 7,
  predicted: {
    east: {
      gravity: 144,
      gravityError: 14,
      kinematic: -184,
      kinematicError: 18,
      net: -40,
      netError: 23,
    },
    west: {
      gravity: 179,
      gravityError: 18,
      kinematic: 96,
      kinematicError: 10,
      net: 275,
      netError: 21,
    },
  },
  eastTrip: {
    start: '1971-10-04 19:30 UT',
    totalHours: 65.4,
    flightHours: 41.2,
    navigationIntervals: 125,
  },
  westTrip: {
    start: '1971-10-13 19:40 UT',
    totalHours: 80.3,
    flightHours: 48.6,
    navigationIntervals: 108,
  },
  limits: [
    'Same ensemble of four clocks, first east then west; do not animate two independent two-clock planes departing simultaneously. Textbook raw wording is retained separately.',
    'Observed table contains offsets extracted with correlated rate-change method; these are not untreated before/after counter differences.',
    'Published SD values remain verbatim statistical metadata; no re-estimated errors from rounded 4 rows.',
    'Prediction uncertainties are flight-data/theory estimates; observed bars are SD. Different meanings must remain visible in expanded explanation.',
    'Do not say every eastward flight must lose time: net sign depends on altitude, speed, route and duration.',
    'Do not make a constant250m/s40h circular toy trajectory complete one Earth circumference; historical flights and teaching interval model are distinct.',
  ],
  roundedTableArithmeticAudit: {
    eastMean: -59.25,
    westMean: 273.25,
    eastSampleSD: 10.1447851956888,
    westSampleSD: 8.845903006477066,
    scope:
      'Arithmetic on rounded printed rows does not exactly reproduce the publication SD metadata, especially west7ns. Preserve the original published mean±SD as reported; do not silently infer/recompute uncertainty from these four rounded values or call the author transcription an independent statistical reanalysis.',
  },
});
