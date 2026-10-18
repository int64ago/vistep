/** Stoichiometric teaching accounts, not kinetic or microscopic pathways. */
const clamp = (x: number, max = 1) => (Number.isFinite(x) ? Math.max(0, Math.min(max, x)) : 0);
const smooth = (x: number) => {
  const p = clamp(x);
  return p * p * (3 - 2 * p);
};
export function copperAlcoholCycle(time: number, air = true, ethanol = true) {
  const t = clamp(time, 4);
  let oxide = 0,
    oxygenAtoms = 0,
    aldehyde = 0;
  for (let i = 0; i < Math.ceil(t); i++) {
    const phase = clamp(t - i);
    const oxidized = air ? (1 - oxide) * smooth((phase - 0.15) / 0.3) : 0;
    oxide += oxidized;
    oxygenAtoms += oxidized;
    const reduced = ethanol ? oxide * smooth((phase - 0.6) / 0.4) : 0;
    oxide -= reduced;
    aldehyde += reduced;
  }
  const phase = t > 0 && t === Math.floor(t) ? 1 : t % 1;
  const travel = phase < 0.15 ? 1 - smooth(phase / 0.15) : smooth((phase - 0.45) / 0.15);
  return {
    time: t,
    phase,
    copper: 1 - oxide,
    oxide,
    oxygen: oxygenAtoms / 2,
    ethanolUsed: aldehyde,
    aldehyde,
    water: aldehyde,
    x: 80 + 140 * travel,
    y: 150 + 35 * travel,
    heating: phase >= 0.15 && phase <= 0.45,
    copperTotal: 1,
  };
}
export function dichromateAlcohol(progress: number, ethanol = 3, dichromate = 2, acid = 16) {
  const e = clamp(ethanol, 10),
    d = clamp(dichromate, 10),
    h = clamp(acid, 100);
  const extent = Math.min(e / 3, d / 2, h / 16) * clamp(progress);
  const remainingDichromate = d - 2 * extent,
    chromiumIII = 4 * extent;
  const fraction = d ? chromiumIII / (2 * d) : 0;
  const color = d
    ? [214 + (113 - 214) * fraction, 156 + (150 - 156) * fraction, 82 + (113 - 82) * fraction].map(
        Math.round,
      )
    : [223, 232, 222];
  return {
    initial: { ethanol: e, dichromate: d, acid: h },
    extent,
    ethanol: e - 3 * extent,
    dichromate: remainingDichromate,
    acid: h - 16 * extent,
    aceticAcid: 3 * extent,
    chromiumIII,
    water: 11 * extent,
    electrons: 12 * extent,
    fraction,
    color: `rgb(${color.join(',')})`,
  };
}
export function alcoholOxidationDirector(chapter: number, progress: number) {
  const c = Math.floor(clamp(chapter, 5)),
    p = clamp(progress);
  return {
    chapter: c,
    progress: p,
    cycleTime: c === 0 ? 0.15 + 0.3 * p : c === 1 ? 0.45 + 0.55 * p : c === 2 ? 1 + 2 * p : 1,
    oxidationProgress: c === 4 ? smooth(p) : c === 5 ? p : 0,
  };
}
