export type SpectrumElement = 'Na' | 'K' | 'Li' | 'He' | 'Hg';
export type SpectralLine = { nm: number; weight: number };
/** Selected neutral-atom AIR wavelengths in nm from NIST, not a complete line list. */
export const ATOMIC_LINES: Record<SpectrumElement, SpectralLine[]> = {
  Na: [
    { nm: 588.995, weight: 1 },
    { nm: 589.5924, weight: 0.5 },
  ],
  K: [
    { nm: 404.414, weight: 0.7 },
    { nm: 404.721, weight: 0.7 },
    { nm: 766.48991, weight: 1 },
    { nm: 769.89645, weight: 1 },
  ],
  Li: [
    { nm: 460.2898, weight: 0.15 },
    { nm: 610.3654, weight: 0.4 },
    { nm: 670.7775, weight: 0.5 },
    { nm: 670.7926, weight: 1 },
  ],
  He: [
    { nm: 447.1479, weight: 0.4 },
    { nm: 501.5678, weight: 0.2 },
    { nm: 587.56148, weight: 1 },
    { nm: 667.81517, weight: 0.4 },
    { nm: 706.51771, weight: 0.2 },
  ],
  Hg: [
    { nm: 404.6563, weight: 0.4 },
    { nm: 435.8328, weight: 1 },
    { nm: 546.0735, weight: 0.5 },
    { nm: 576.9598, weight: 0.15 },
    { nm: 579.0663, weight: 0.15 },
  ],
};
export const spectrumClamp = (value: number, low = 0, high = 1) =>
  Number.isFinite(value) ? Math.max(low, Math.min(high, value)) : low;
/** Vacuum wavelength only. Air reference lines are not substituted into exact ledgers. */
export const photonEnergyEv = (vacuumNm: number) =>
  (6.62607015e-34 * 299792458 * 1e9) / (1.602176634e-19 * spectrumClamp(vacuumNm, 1, 1e9));
/** Qualitative cobalt-glass passbands; not a measured commercial-filter calibration. */
export function cobaltTransmission(wavelength: number) {
  const nm = spectrumClamp(wavelength, 1, 1e9);
  return Math.min(
    1,
    0.02 + 0.75 * Math.exp(-(((nm - 430) / 70) ** 2)) + 0.4 * Math.exp(-(((nm - 760) / 75) ** 2)),
  );
}
export function flameLines(element: SpectrumElement, sodiumInterference = 0, filter = false) {
  element = Object.hasOwn(ATOMIC_LINES, element) ? element : 'Na';
  const extra =
    element === 'K'
      ? ATOMIC_LINES.Na.map((x) => ({
          ...x,
          weight: x.weight * spectrumClamp(sodiumInterference) * 5,
        }))
      : [];
  return [...ATOMIC_LINES[element], ...extra].map((x) => ({
    ...x,
    transmission: filter ? cobaltTransmission(x.nm) : 1,
    observed: x.weight * (filter ? cobaltTransmission(x.nm) : 1),
  }));
}
export function wavelengthColour(nm: number) {
  if (!Number.isFinite(nm) || nm < 380 || nm > 780) return '#bac4c0';
  if (nm < 440) return '#b79ce9';
  if (nm < 490) return '#87b8f1';
  if (nm < 530) return '#93d2bb';
  if (nm < 570) return '#c6d785';
  if (nm < 600) return '#edcf7c';
  if (nm < 640) return '#e8ae7f';
  return '#d58e91';
}
export function flameDirector(chapter: number, progress: number) {
  const p = spectrumClamp(progress);
  chapter = Math.round(spectrumClamp(chapter, 0, 6));
  return {
    mode: chapter < 3 ? 'flame' : chapter < 5 ? 'energy' : 'spectrum',
    element: (chapter === 0
      ? 'Na'
      : chapter < 3
        ? 'K'
        : chapter < 5
          ? 'Na'
          : (['Li', 'He', 'Hg'] as const)[Math.min(2, Math.floor(p * 3))]) as SpectrumElement,
    filter: chapter === 2,
    interference: chapter === 0 ? 0 : chapter === 1 ? 0.5 * p : 0.5,
    absorption: chapter === 4 || chapter === 6,
    progress: p,
  };
}

const H = 6.62607015e-34,
  C = 299792458,
  EV = 1.602176634e-19;
const levelEv = (inverseCm: number) => (H * C * inverseCm * 100) / EV;
/** NIST persistent neutral-atom lines. Energies are wavenumber levels, not air-lambda estimates. */
export const TRANSITIONS = {
  'Na-D2': {
    species: 'Na',
    lower: '3s',
    upper: '3p',
    lowerCm: 0,
    upperCm: 16973.368,
    airNm: 588.995,
  },
  'Na-UV': {
    species: 'Na',
    lower: '3s',
    upper: '4p',
    lowerCm: 0,
    upperCm: 30272.58,
    airNm: 330.237,
  },
  'Li-670': {
    species: 'Li',
    lower: '2s',
    upper: '2p',
    lowerCm: 0,
    upperCm: 14903.957,
    airNm: 670.7775,
  },
  'Hg-546': {
    species: 'Hg',
    lower: '6s6p',
    upper: '6s7s',
    lowerCm: 44042.977,
    upperCm: 62350.456,
    airNm: 546.0735,
  },
  'Li-610': {
    species: 'Li',
    lower: '2p',
    upper: '3d',
    lowerCm: 14903.957,
    upperCm: 31283.053,
    airNm: 610.3654,
  },
} as const;
export type TransitionId = keyof typeof TRANSITIONS;
export function transitionEnergy(id: TransitionId) {
  const record = TRANSITIONS[id] ?? TRANSITIONS['Na-D2'],
    lowerEv = levelEv(record.lowerCm),
    upperEv = levelEv(record.upperCm),
    gapEv = upperEv - lowerEv;
  return {
    ...record,
    lowerEv,
    upperEv,
    gapEv,
    vacuumNm: (H * C * 1e9) / (gapEv * EV),
    visible: record.airNm >= 380 && record.airNm <= 780,
  };
}
const phase = (p: number, a: number, b: number) => spectrumClamp((p - a) / (b - a));
/** A selected event, not an absorption probability or atomic trajectory.
 * State populations and energy jump together at the event boundary. Photon flight is geometric.
 * Empty Li2p means a separately prepared ground-state atom, NOT the same ensemble's full spectrum. */
export function transitionEvent(
  id: TransitionId,
  progress: number,
  kind: 'emission' | 'absorption' | 'return',
  matched = true,
  populated = true,
) {
  const line = transitionEnergy(id),
    p = spectrumClamp(progress),
    initialAtomEv = kind === 'emission' ? line.upperEv : populated ? line.lowerEv : 0,
    incidentEv = kind === 'emission' ? 0 : line.gapEv * (matched ? 1 : 1.25),
    captured = kind !== 'emission' && matched && populated && p >= 0.45,
    emitted = kind === 'emission' ? p >= 0.25 : kind === 'return' && captured && p >= 0.76,
    atomEv = emitted ? line.lowerEv : captured ? line.upperEv : initialAtomEv,
    photonEv = emitted ? line.gapEv : captured ? 0 : incidentEv,
    photonPhase = emitted
      ? 'outgoing'
      : captured
        ? 'stored'
        : kind === 'emission'
          ? 'not-emitted'
          : 'incoming',
    flight = emitted
      ? phase(p, kind === 'emission' ? 0.25 : 0.76, 1)
      : captured
        ? 0
        : phase(p, 0, matched && populated ? 0.45 : 1),
    atomLevel =
      Math.abs(atomEv - line.upperEv) < 1e-9
        ? 'upper'
        : atomEv === line.lowerEv
          ? 'lower'
          : 'ground';
  return {
    id,
    line,
    p,
    initialAtomEv,
    incidentEv,
    atomEv,
    photonEv,
    totalEv: atomEv + photonEv,
    initialTotalEv: initialAtomEv + incidentEv,
    photonVacuumNm: line.vacuumNm / (kind === 'emission' || matched ? 1 : 1.25),
    photonPhase,
    flight,
    captured,
    emitted,
    atomLevel,
    matched,
    populated,
    packetId: `${id}-energy`,
    sampleId:
      id === 'Li-670'
        ? 'reference-2s'
        : id === 'Li-610'
          ? populated
            ? 'prepared-2p'
            : 'prepared-2s'
          : 'sodium-trial',
  };
}
/** Flux uses one fixed scale before/after the passive filter, never a plot renormalization. */
export function filteredFlux(element: SpectrumElement, interference = 0, filter = false) {
  const lines = flameLines(element, interference, filter),
    input = lines.reduce((n, x) => n + x.weight, 0),
    transmitted = lines.reduce((n, x) => n + x.observed, 0);
  return {
    lines,
    input,
    transmitted,
    removed: input - transmitted,
    transmission: input > 0 ? transmitted / input : 0,
  };
}
export const FIXED_UNKNOWN = Object.freeze(
  [435.8328, 546.0735, 579.0663].map((nm, i) =>
    Object.freeze({ id: `unknown-${i}`, nm, weight: [1, 0.5, 0.3][i] }),
  ),
);
export function unknownLines(addSodium = false) {
  return addSodium
    ? [...FIXED_UNKNOWN, ...ATOMIC_LINES.Na.map((r, i) => ({ ...r, id: `added-Na-${i}` }))]
    : [...FIXED_UNKNOWN];
}
/** Selected library comparison. An unknown line must match a reference within the stated tolerance;
 * absent reference lines do not disprove an element because this is a selected-line observation. */
export function identifyUnknown(element: SpectrumElement, addSodium = false, toleranceNm = 0.8) {
  const tolerance = spectrumClamp(toleranceNm, 0, 10),
    lines = unknownLines(addSodium),
    reference = ATOMIC_LINES[element] ?? ATOMIC_LINES.Na,
    matches = lines.map((line) => ({
      ...line,
      matched: reference.some((r) => Math.abs(r.nm - line.nm) <= tolerance),
    }));
  return {
    element,
    matches,
    matchedCount: matches.filter((x) => x.matched).length,
    total: matches.length,
    supports: matches.every((x) => x.matched),
  };
}
export const FLAME_CHAPTER_SECONDS = [28, 28, 29, 36, 31, 36, 41] as const;
/** Piecewise event clock: travel is pedagogical; the atomic state stays discrete. */
function eventClock(t: number, keys: readonly (readonly [number, number])[]) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [b, y] = keys[i],
      [a, x] = keys[i - 1];
    if (t < b) return x + (y - x) * phase(t, a, b);
  }
  return keys.at(-1)![1];
}
/** Chapter-local cuts from final ZH/EN word times, including the 0.45s cue lead.
 * batch-6-timed-speech/chem-flame-spectra-{zh,en}-{0..6}.json.
 * Narration length is not rescaled; each decisive event has its own measured boundary. */
export function flameScene(chapter: number, time: number, locale: 'zh' | 'en' = 'zh') {
  const ch = Math.round(spectrumClamp(chapter, 0, 6)),
    t = spectrumClamp(time, 0, FLAME_CHAPTER_SECONDS[ch]),
    p = t / FLAME_CHAPTER_SECONDS[ch],
    en = locale === 'en';
  let transition: TransitionId = 'Na-D2',
    kind: 'emission' | 'absorption' | 'return' = 'emission',
    eventProgress = 0,
    matched = true,
    populated = true,
    prediction = false,
    coarse = false,
    candidate: SpectrumElement = 'Li',
    mixture = false,
    bridge = false;
  if (ch === 3) {
    const change = en ? 11.9 : 12.83,
      reveal = en ? 18.35 : 20.21;
    prediction = t >= change && t < reveal;
    transition = t >= change ? 'Na-UV' : 'Na-D2';
    eventProgress =
      t >= change
        ? eventClock(t, [
            [reveal, 0.25],
            [reveal + 3.1, 1],
          ])
        : eventClock(t, [
            [0, 0],
            [en ? 3.65 : 4, 0.25],
            [en ? 6.5 : 7.2, 1],
          ]);
    // While predicting, the higher atom still owns all the energy and no photon exists.
    if (prediction) eventProgress = 0;
  }
  if (ch === 4) {
    kind = 'absorption';
    matched = t >= (en ? 10.83 : 10.71);
    eventProgress = matched
      ? eventClock(t, [
          [en ? 10.83 : 10.71, 0],
          [en ? 13.5 : 13.1, 0.45],
          [16, 1],
        ])
      : phase(t, 3.1, 9.7);
  }
  if (ch === 5) {
    coarse = t < (en ? 7.67 : 6.95);
    candidate = t < (en ? 11.7 : 10.4) ? 'Li' : t < (en ? 13.8 : 13.4) ? 'He' : 'Hg';
    mixture = t >= (en ? 26.43 : 25.67);
    const begin = en ? 20.55 : 20.71;
    bridge = t >= begin && !mixture;
    eventProgress = eventClock(t, [
      [begin, 0],
      [begin + 0.8, 0.25],
      [begin + 3.1, 1],
    ]);
  }
  if (ch === 6) {
    const separate = en ? 15.25 : 15.87,
      prepared = 25.27;
    transition = t < separate ? 'Li-670' : 'Li-610';
    kind = t < separate ? 'return' : 'absorption';
    populated = t < separate || t >= prepared;
    eventProgress =
      t < separate
        ? eventClock(t, [
            [2.9, 0],
            [en ? 5.6 : 5.1, 0.45],
            [en ? 10.8 : 11.6, 0.76],
            [14.3, 1],
          ])
        : t < prepared
          ? phase(t, 19.3, 24.2)
          : eventClock(t, [
              [26.8, 0],
              [en ? 30 : 29.7, 0.45],
              [32, 1],
            ]);
  }
  return {
    ...flameDirector(ch, p),
    active: ch !== 0 || t >= (en ? 5.17 : 8.07),
    interference: ch === 0 ? 0 : ch === 1 ? 0.5 * phase(t, 2.2, 12.5) : 0.5,
    filter: ch === 2 && t >= 1.2,
    chapter: ch,
    time: t,
    transition,
    kind,
    eventProgress,
    matched,
    populated,
    prediction,
    coarse,
    candidate,
    mixture,
    bridge,
  };
}
