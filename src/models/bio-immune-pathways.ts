export const immuneClamp = (v: number, a = 0, b = 1) =>
  Math.min(b, Math.max(a, Number.isFinite(v) ? v : a));
/** Declared, ordered teaching states for a selected T-dependent immune pathway. */
export function adaptiveImmunity(progress: number, match = true, helper = true) {
  const p = immuneClamp(progress),
    presentation = immuneClamp((p - 0.05) / 0.15),
    help = match && helper ? immuneClamp((p - 0.2) / 0.15) : 0,
    activation = match && helper ? immuneClamp((p - 0.35) / 0.12) : 0;
  const expansion = activation === 1 ? immuneClamp((p - 0.47) / 0.18) : 0;
  const antibodies = Array.from({ length: 6 }, (_, id) => ({
    id,
    progress: activation === 1 ? immuneClamp((p - 0.65 - id * 0.025) / 0.18) : 0,
  }));
  const bound = antibodies.filter((a) => a.progress === 1).length;
  return {
    p,
    presentation,
    help,
    activation,
    expansion,
    cloneCount: 1 + Math.floor(expansion * 7),
    antibodies,
    bound,
    entryFraction: 1 - bound / 6,
    memory: activation === 1 && p > 0.85,
  };
}
export function cytotoxicResponse(progress: number, match = true, help = true) {
  const p = immuneClamp(progress),
    contact = immuneClamp(p / 0.3),
    recognition = contact === 1 && match && help;
  return { contact, recognition, apoptosis: recognition ? immuneClamp((p - 0.5) / 0.4) : 0 };
}
export function immuneRecall(progress: number, sameAntigen = true, memory = true) {
  const p = immuneClamp(progress),
    recall = sameAntigen && memory,
    delay = recall ? 0.1 : 0.4;
  return p <= delay ? 0 : 1 - Math.exp(-(p - delay) * (recall ? 8 : 4));
}
export function meningealLymphEvidence(progress: number, identityMarkers = true, csfTracer = true) {
  const p = immuneClamp(progress);
  return {
    identitySupported: identityMarkers,
    transportSupported: csfTracer && p > 0.75,
    tracerProgress: csfTracer ? p : 0,
    markers: ['LYVE-1', 'PROX1'],
    tracerIdentity: 'CSF QDot655',
    bloodLabel: 'intravenous lectin',
  };
}
