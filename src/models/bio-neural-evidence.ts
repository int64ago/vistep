const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : a));
/** Declared error-correction learning model, not Pavlov's measured salivary volumes. */
export function conditioningEvidence(
  training = 12,
  extinction = 0,
  paired = true,
  learning = 0.25,
) {
  const train = Math.floor(clamp(training, 0, 24)),
    ext = Math.floor(clamp(extinction, 0, 24)),
    alpha = clamp(learning, 0, 1);
  let association = 0;
  const records = [{ trial: 0, association, reinforced: false }];
  for (let i = 0; i < train + ext; i++) {
    const reinforced = i < train && paired;
    association += alpha * ((reinforced ? 1 : 0) - association);
    records.push({ trial: i + 1, association, reinforced });
  }
  return {
    association,
    foodResponse: 1,
    soundResponse: association,
    records,
    training: train,
    extinction: ext,
  };
}
export type MotorSite = 'leg' | 'hand' | 'face';
export function motorMapping(site: MotorSite, hemisphere: 'left' | 'right' = 'left') {
  const locations = {
    leg: { x: 159, y: 36, r: 13 },
    hand: { x: 151, y: 91, r: 23 },
    face: { x: 141, y: 146, r: 18 },
  };
  return {
    site,
    cortex: locations[site],
    hemisphere,
    bodySide: hemisphere === 'left' ? 'right' : 'left',
  } as const;
}
export type LanguageCase = 'S' | 'H';
/** The two textbook case profiles; not a patient diagnostic classifier. */
export function languageEvidence(caseId: LanguageCase) {
  return {
    caseId,
    fluentProduction: caseId === 'H',
    spokenComprehension: caseId === 'S',
    hearing: true,
    vocalOrgans: true,
    lesion: caseId === 'S' ? { x: 96, y: 133 } : { x: 211, y: 139 },
  };
}
export const lateralBrainOutline =
  'M25 134C2 102 21 61 58 41C84 9 132 9 157 24C202 2 254 27 272 60C307 79 307 119 279 142C281 174 243 190 208 180C180 205 145 184 119 182C70 194 35 171 25 134Z';
