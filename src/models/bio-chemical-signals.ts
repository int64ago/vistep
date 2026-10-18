const clamp = (x: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, Number.isFinite(x) ? x : min));
/** A, B and the transit tubing are explicit fluid compartments. Marker amount is arbitrary units;
 * all transfer, dilution and disappearance share these same amounts. */
export function heartTransfer(
  progress: number,
  stimulated = true,
  transferred = true,
  fraction = 0.4,
) {
  const p = clamp(progress),
    q = clamp(fraction, 0, 0.8),
    release = stimulated ? 1 : 0;
  const transferTime = 0.45,
    moved = transferred ? clamp((p - transferTime) / 0.2) * q : 0,
    arrived = transferred ? clamp((p - transferTime - 0.06) / 0.2) * q : 0,
    inTransit = moved - arrived;
  const decay = Math.exp(-Math.max(0, p - 0.18) * 0.8);
  const before = release * (p >= 0.18 ? 1 : 0) * decay;
  const amountA = before * (1 - moved),
    amountB = before * arrived,
    amountPath = before * inTransit;
  const volumeA = 1 - moved,
    volumeB = 1 + arrived,
    volumePath = inTransit;
  const concentrationA = amountA / volumeA,
    concentrationB = amountB / volumeB;
  const rateA = 1 / (1 + 2 * concentrationA),
    rateB = 1 / (1 + 2 * concentrationB);
  return {
    progress: p,
    moved,
    arrived,
    amountPath,
    volumePath,
    amountA,
    amountB,
    volumeA,
    volumeB,
    concentrationA,
    concentrationB,
    rateA,
    rateB,
    initialAmount: release * (p >= 0.18 ? 1 : 0),
    remainingAmount: before,
    cleared: release * (p >= 0.18 ? 1 : 0) - before,
  };
}
export type SecretinCondition = 'gut' | 'blood-acid' | 'denervated' | 'extract';
export function secretinEvidence(condition: SecretinCondition, progress: number) {
  const p = clamp(progress),
    mucosa = condition === 'gut' || condition === 'denervated',
    chemicalSource = mucosa || condition === 'extract',
    nerve = condition !== 'denervated';
  const signal = chemicalSource ? clamp((p - 0.25) / 0.35) : 0;
  const secretion = chemicalSource ? clamp((p - 0.6) / 0.4) : 0;
  return {
    condition,
    progress: p,
    mucosa,
    nerve,
    chemicalSource,
    signal,
    secretion,
    injection:
      condition === 'blood-acid'
        ? 'acid-blood'
        : condition === 'extract'
          ? 'extract-blood'
          : 'acid-lumen',
  };
}

/** Integrate the changing rate so the beat never jumps phase when the fluid moves. */
export function heartBeatPhase(
  progress: number,
  stimulated = true,
  transferred = true,
  fraction = 0.4,
) {
  const p = clamp(progress),
    n = 160,
    dt = p / n;
  let a = 0,
    b = 0;
  for (let i = 0; i < n; i++) {
    const f = heartTransfer((i + 0.5) * dt, stimulated, transferred, fraction);
    a += f.rateA * dt * 12;
    b += f.rateB * dt * 12;
  }
  return { a, b };
}

export type PathPoint = { x: number; y: number };
/** Arc-length interpolation keeps markers on the very polyline rendered as tubing. */
export function signalPathPoint(points: PathPoint[], progress: number): PathPoint {
  if (!points.length) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  const lengths = points.slice(1).map((q, i) => Math.hypot(q.x - points[i].x, q.y - points[i].y));
  let remaining = clamp(progress) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] ? remaining / lengths[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * f,
        y: points[i].y + (points[i + 1].y - points[i].y) * f,
      };
    }
    remaining -= lengths[i];
  }
  return points[points.length - 1];
}
export function heartTransferMarkers(
  progress: number,
  stimulated = true,
  transferred = true,
  fraction = 0.4,
) {
  const p = clamp(progress),
    q = clamp(fraction, 0, 0.8);
  return Array.from({ length: 20 }, (_, id) => {
    const selected = transferred && id < q * 20,
      departure = 0.45 + ((id + 0.5) / Math.max(q * 20, 1)) * 0.2;
    return {
      id,
      phase: selected ? clamp((p - departure) / 0.06) : 0,
      opacity: stimulated && p >= 0.18 ? Math.exp(-(p - 0.18) * 0.8) : 0,
    };
  });
}
export function secretinMarkerPhases(condition: SecretinCondition, progress: number) {
  const p = clamp(progress),
    gut = condition === 'gut' || condition === 'denervated';
  return Array.from({ length: 6 }, (_, id) => ({
    id,
    input: clamp((p - id * 0.025) / 0.2),
    signal: clamp((p - (gut ? 0.25 : 0) - id * 0.025) / (gut ? 0.35 : 0.55)),
    visible: p >= id * 0.025,
    chemical: gut || condition === 'extract',
  }));
}

/** The final directed chapter reconstructs two independent negative controls. */
export function heartFilmCondition(chapter: number, progress: number) {
  const p = clamp(progress);
  if (chapter === 2)
    return {
      stimulated: p < 0.5,
      transferred: p >= 0.5,
      progress: p < 0.5 ? p * 2 : (p - 0.5) * 2,
      label: p < 0.5 ? 'no-transfer' : 'no-stimulation',
    } as const;
  return {
    stimulated: true,
    transferred: true,
    progress: chapter === 0 ? p * 0.35 : 0.35 + p * 0.4,
    label: 'positive',
  } as const;
}
