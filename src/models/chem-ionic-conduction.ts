export type IonicSample = 'nacl-solid' | 'kno3-solid' | 'water' | 'nacl' | 'kno3';
const CONDUCTANCE = { nacl: [50.1, 76.3], kno3: [73.5, 71.4] } as const;
/** Infinite-dilution approximation at 25 C; ideal 1 cm^-1 cell, short-time response. */
export function ionicConduction(
  sample: IonicSample,
  concentrationMilliMolar = 1,
  voltage = 3,
  connected = true,
) {
  const solid = sample.endsWith('solid');
  const salt = sample.startsWith('kno3') ? 'kno3' : 'nacl';
  const concentration = Math.max(0, Math.min(1, concentrationMilliMolar));
  // Water autoionization: [H+] = [OH-] = 1e-7 M, limiting ionic conductances 349.8 and 198.0.
  const waterMicroSiemensPerCm = (349.8 + 198.0) * 1e-4;
  const conductivityMicroSiemensPerCm = solid
    ? 0
    : waterMicroSiemensPerCm +
      (sample === 'water' ? 0 : (CONDUCTANCE[salt][0] + CONDUCTANCE[salt][1]) * concentration);
  const conductanceSiemens = conductivityMicroSiemensPerCm * 1e-6; // cell constant 1 cm^-1
  const appliedVoltage = connected ? Math.max(-3, Math.min(3, voltage)) : 0;
  const currentMicroAmp = conductanceSiemens * appliedVoltage * 1e6;
  return {
    solid,
    salt,
    concentration,
    conductivityMicroSiemensPerCm,
    currentMicroAmp,
    appliedVoltage,
    detected: Math.abs(currentMicroAmp) >= 10,
    cation: salt === 'nacl' ? 'Na⁺' : 'K⁺',
    anion: salt === 'nacl' ? 'Cl⁻' : 'NO₃⁻',
    cationShare: CONDUCTANCE[salt][0] / (CONDUCTANCE[salt][0] + CONDUCTANCE[salt][1]),
  };
}
export function ionicParticle(index: number, dissolved: number, drift: number) {
  const q = index % 2 === 0 ? 1 : -1,
    row = Math.floor(index / 4),
    col = index % 4;
  const lattice = { x: 139 + col * 25, y: 55 + row * 25 };
  const spread = { x: 66 + ((index * 67) % 226), y: 36 + ((index * 43) % 132) };
  const d = Math.max(0, Math.min(1, dissolved));
  return {
    charge: q,
    x: lattice.x * (1 - d) + spread.x * d + q * Math.max(-1, Math.min(1, drift)) * 14 * d,
    y: lattice.y * (1 - d) + spread.y * d,
  };
}
export function ionicDirector(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const sample: IonicSample =
    chapter === 0
      ? p < 0.5
        ? 'nacl-solid'
        : 'kno3-solid'
      : chapter === 1
        ? 'water'
        : chapter === 2 && p > 0.5
          ? 'kno3'
          : 'nacl';
  return {
    sample,
    dissolved: chapter < 2 ? 0 : chapter === 2 ? Math.min(1, (p % 0.5) * 4) : 1,
    drift: chapter === 3 ? Math.max(0, (p - 0.25) / 0.75) : 0,
    connected: chapter < 2 || (chapter === 3 && p > 0.25),
  };
}
