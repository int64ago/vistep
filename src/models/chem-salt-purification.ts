/** Stoichiometric teaching inventory. Amounts are arbitrary molar units, not a recipe or solubility prediction. */
export type SaltRoute = 'textbook' | 'acid-first' | 'no-carbonate' | 'too-little-barium';
export type SaltIon = 'Na' | 'Cl' | 'Ca' | 'Mg' | 'Ba' | 'SO4' | 'OH' | 'CO3' | 'H';
export type SaltSolid = 'BaSO4' | 'MgOH2' | 'CaCO3' | 'BaCO3' | 'sand';
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(x) ? x : 0));
const emptySolid = (): Record<SaltSolid, number> => ({
  BaSO4: 0,
  MgOH2: 0,
  CaCO3: 0,
  BaCO3: 0,
  sand: 0,
});
export function saltPurification(step: number, progress = 1, route: SaltRoute = 'textbook') {
  const chapter = Math.floor(clamp(step, 0, 7)),
    p = clamp(progress);
  const ions: Record<SaltIon, number> = {
    Na: 21.6,
    Cl: 24,
    Ca: 1,
    Mg: 1,
    Ba: 0,
    SO4: 0.8,
    OH: 0,
    CO3: 0,
    H: 0,
  };
  const solids = emptySolid(),
    removed = emptySolid();
  solids.sand = 0.3;
  let bariumAdded = 0,
    baseAdded = 0,
    carbonateAdded = 0,
    acidAdded = 0,
    CO2 = 0,
    waterFormed = 0;
  const phase = (n: number) => (chapter > n ? 1 : chapter === n ? p : 0);
  bariumAdded = (route === 'too-little-barium' ? 0.55 : 1) * phase(1);
  ions.Ba += bariumAdded;
  ions.Cl += 2 * bariumAdded;
  const sulfate = Math.min(ions.Ba, ions.SO4);
  ions.Ba -= sulfate;
  ions.SO4 -= sulfate;
  solids.BaSO4 += sulfate;
  baseAdded = 2.4 * phase(3);
  ions.Na += baseAdded;
  ions.OH += baseAdded;
  const magnesium = Math.min(ions.Mg, ions.OH / 2);
  ions.Mg -= magnesium;
  ions.OH -= 2 * magnesium;
  solids.MgOH2 = magnesium;
  carbonateAdded = (route === 'no-carbonate' ? 0 : 1.6) * phase(4);
  ions.Na += 2 * carbonateAdded;
  ions.CO3 += carbonateAdded;
  // Order only resolves the visual teaching path during dosing; final excess removes both.
  for (const [ion, solid] of [
    ['Ca', 'CaCO3'],
    ['Ba', 'BaCO3'],
  ] as const) {
    const n = Math.min(ions[ion], ions.CO3);
    ions[ion] -= n;
    ions.CO3 -= n;
    solids[solid] = n;
  }
  const filter = (f: number) => {
    for (const key of Object.keys(solids) as SaltSolid[]) {
      removed[key] += solids[key] * f;
      solids[key] *= 1 - f;
    }
  };
  const acid = (f: number) => {
    const freeOH = ions.OH * f,
      freeCarbonate = ions.CO3 * f;
    ions.OH -= freeOH;
    ions.CO3 -= freeCarbonate;
    CO2 += freeCarbonate;
    waterFormed += freeOH + freeCarbonate;
    acidAdded += freeOH + 2 * freeCarbonate;
    for (const [solid, ion, isCarbonate] of [
      ['MgOH2', 'Mg', false],
      ['CaCO3', 'Ca', true],
      ['BaCO3', 'Ba', true],
    ] as const) {
      const n = solids[solid] * f;
      solids[solid] -= n;
      ions[ion] += n;
      acidAdded += 2 * n;
      if (isCarbonate) {
        CO2 += n;
        waterFormed += n;
      } else waterFormed += 2 * n;
    }
    ions.Cl += acidAdded;
  };
  if (route === 'acid-first') {
    // At the filtering chapter, this counterfactual has already acidified the suspension to the same endpoint.
    if (chapter >= 5) acid(chapter === 5 ? p : 1);
    if (chapter >= 6) filter(phase(6));
  } else {
    if (chapter >= 5) filter(phase(5));
    if (chapter >= 6) acid(phase(6));
  }
  const waterRemaining = chapter === 7 ? 1 - 0.96 * p : 1;
  const contamination = ions.Ca + ions.Mg + ions.Ba + ions.SO4;
  const charge =
    ions.Na +
    ions.H +
    2 * (ions.Ca + ions.Mg + ions.Ba) -
    ions.Cl -
    ions.OH -
    2 * (ions.SO4 + ions.CO3);
  const total = (s: SaltSolid) => solids[s] + removed[s];
  const balances = {
    Ca: ions.Ca + total('CaCO3'),
    Mg: ions.Mg + total('MgOH2'),
    Ba: ions.Ba + total('BaSO4') + total('BaCO3'),
    S: ions.SO4 + total('BaSO4'),
    C: ions.CO3 + total('CaCO3') + total('BaCO3') + CO2,
    Na: ions.Na,
    Cl: ions.Cl,
  };
  return {
    chapter,
    progress: p,
    ions,
    solids,
    removed,
    bariumAdded,
    baseAdded,
    carbonateAdded,
    acidAdded,
    CO2,
    waterFormed,
    waterRemaining,
    contamination,
    charge,
    balances,
    pureSaltEligible: contamination < 1e-9 && ions.OH < 1e-9 && ions.CO3 < 1e-9,
    filtration: route === 'acid-first' ? phase(6) : phase(5),
  };
}
export function sulfateCompletionProbe(sulfateLeft: number, probeBarium = 0.08) {
  return Math.min(Math.max(0, sulfateLeft), Math.max(0, probeBarium));
}
export const saltIonLabels: Record<SaltIon, string> = {
  Na: 'Na⁺',
  Cl: 'Cl⁻',
  Ca: 'Ca²⁺',
  Mg: 'Mg²⁺',
  Ba: 'Ba²⁺',
  SO4: 'SO₄²⁻',
  OH: 'OH⁻',
  CO3: 'CO₃²⁻',
  H: 'H⁺',
};
export const saltSolidLabels: Record<SaltSolid, string> = {
  BaSO4: 'BaSO₄',
  MgOH2: 'Mg(OH)₂',
  CaCO3: 'CaCO₃',
  BaCO3: 'BaCO₃',
  sand: 'SiO₂',
};
export function saltDirector(chapter: number, progress: number) {
  return { chapter: Math.floor(clamp(chapter, 0, 7)), progress: clamp(progress) };
}
