const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : 0));
export type AmmoniumSalt = 'chloride' | 'nitrate' | 'sulfate';
/** Formula-unit inventory; thermal release is a separate extent, not a claim that cold base cannot react. */
export function ammoniumLiberation(salt: AmmoniumSalt, base = 2, extent = 1, releasedFraction = 1) {
  const ammonium = salt === 'sulfate' ? 2 : 1,
    oh = clamp(base, 0, 4),
    reacted = Math.min(ammonium, oh) * clamp(extent),
    released = reacted * clamp(releasedFraction);
  return {
    ammoniumInitial: ammonium,
    ammoniumRemaining: ammonium - reacted,
    hydroxideRemaining: oh - reacted,
    ammoniaGas: released,
    ammoniaAqueous: reacted - released,
    waterFormed: reacted,
    spectator: salt,
  };
}
export function litmusEvidence(gasAmount: number, moist = true, alkaliContact = false) {
  return {
    blue: alkaliContact || (moist && gasAmount > 1e-8),
    validGasEvidence: !alkaliContact && moist && gasAmount > 1e-8,
    cause: alkaliContact
      ? 'liquid-alkali'
      : moist && gasAmount > 1e-8
        ? 'gas-in-water'
        : 'no-aqueous-evidence',
  };
}
export function solidAmmoniaPreparation(chloride = 2, calciumHydroxide = 1, extent = 1) {
  const a = clamp(chloride, 0, 4),
    b = clamp(calciumHydroxide, 0, 3),
    reaction = Math.min(a / 2, b) * clamp(extent);
  return {
    ammoniumChloride: a - 2 * reaction,
    calciumHydroxide: b - reaction,
    calciumChloride: reaction,
    ammonia: 2 * reaction,
    water: 2 * reaction,
  };
}
/** 20 cells, inlet at the closed upper end via the delivery tube, displaced gas exits below.
 * Finite-volume upwind mixing, independent dimensionless input volume. */
export function ammoniaCollection(inputVolume: number) {
  const n = 20,
    dx = 1 / n,
    q = clamp(inputVolume, 0, 3),
    cells = new Float64Array(n);
  let introduced = 0,
    escaped = 0;
  while (introduced < q - 1e-12) {
    const dq = Math.min(0.5 * dx, q - introduced),
      courant = dq / dx;
    escaped += cells[n - 1] * dq;
    for (let i = n - 1; i >= 0; i--)
      cells[i] += courant * ((i === 0 ? 1 : cells[i - 1]) - cells[i]);
    introduced += dq;
  }
  const retained = cells.reduce((a, b) => a + b, 0) * dx;
  return {
    cells,
    introduced,
    retained,
    escaped,
    mouthFraction: cells[n - 1],
    airRemaining: 1 - retained,
  };
}
/** Conceptual water uptake: a shallow funnel rim exposes an air break before water fills its cone. */
export function ammoniaAbsorber(demand: number, airBreak = true) {
  const radius = 0.025,
    coneHeight = 0.03,
    reservoirArea = 0.01,
    rimDepth = airBreak ? 0.0005 : 0.005;
  const coneCapacity = ((Math.PI * radius * radius * coneHeight) / 3) * 1e6,
    airBreakAt = reservoirArea * rimDepth * 1e6,
    requested = clamp(demand, 0, 40),
    water = Math.min(airBreakAt, requested, coneCapacity);
  return {
    water,
    requested,
    airAdmitted: airBreakAt < coneCapacity && requested > airBreakAt,
    stemReached: coneCapacity < airBreakAt && requested >= coneCapacity,
    coneFill: water / coneCapacity,
    waterHeight: coneHeight * (1 - Math.cbrt(1 - water / coneCapacity)),
    reservoirDrop: water / 1e6 / reservoirArea,
    coneCapacity,
    airBreakAt,
    rimDepth,
  };
}
export function ammoniumDirector(chapter: number, progress: number) {
  const c = Math.max(0, Math.min(6, chapter)),
    p = clamp(progress);
  return {
    chapter: c,
    progress: p,
    view:
      c < 2
        ? 'three-tests'
        : c === 2
          ? 'litmus-conditions'
          : c === 3
            ? 'generator'
            : c < 6
              ? 'collection'
              : 'absorber',
    extent: c === 0 ? 0 : c === 1 ? p : 0.8,
    release: c === 1 ? p : 1,
    collection: c === 3 ? 0.5 * p : c === 4 ? p * 1.4 : c === 5 ? 0.65 + p * 0.35 : 0,
    wet: c !== 2 || p < 0.45,
    alkaliContact: c === 2 && p > 0.7,
    demand: c === 6 ? p * 30 : 0,
  };
}
