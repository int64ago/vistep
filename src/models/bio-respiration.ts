export type RespirationRoute = 'aerobic' | 'ethanol' | 'lactate';
export function respirationBalance(route: RespirationRoute, glucose = 1) {
  const g = Math.max(0, glucose);
  return {
    glucose: g,
    oxygen: route === 'aerobic' ? 6 * g : 0,
    carbonDioxide: route === 'aerobic' ? 6 * g : route === 'ethanol' ? 2 * g : 0,
    ethanol: route === 'ethanol' ? 2 * g : 0,
    lactate: route === 'lactate' ? 2 * g : 0,
    netGlycolyticATP: 2 * g,
    waterNet: route === 'aerobic' ? 6 * g : 0,
  };
}
/** Carbon atom identities are preserved; this is a pathway allocation, not kinetics. */
export function carbonDestinations(route: RespirationRoute) {
  return Array.from({ length: 6 }, (_, id) => ({
    id,
    product:
      route === 'aerobic'
        ? 'CO₂'
        : route === 'ethanol'
          ? id % 3 === 2
            ? 'CO₂'
            : 'ethanol'
          : 'lactate',
    group: route === 'aerobic' ? id : Math.floor(id / 3),
  }));
}
export function yeastAssay(
  progress: number,
  oxygen: boolean,
  scrubber = true,
  connectedAfterDepletion = true,
) {
  const p = Math.min(1, Math.max(0, progress));
  const glucoseRemaining = Math.max(0, 1 - p * 1.25),
    converted = 1 - glucoseRemaining;
  const balance = respirationBalance(oxygen ? 'aerobic' : 'ethanol', converted);
  const airContamination = oxygen && !scrubber ? 0.6 : 0;
  return {
    ...balance,
    glucoseRemaining,
    detectedCO2: balance.carbonDioxide + airContamination,
    ethanolColorValid: glucoseRemaining < 0.001,
    anaerobicConditionValid: oxygen || connectedAfterDepletion,
    cloudiness: 1 - Math.exp(-(balance.carbonDioxide + airContamination) / 3),
  };
}
export function atpCoupling(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return { boundPhosphates: 3 - p, freePhosphate: p, atp: 1 - p, adp: p };
}
