/** Thermonuclear fusion teaching model: binding energies, the Coulomb barrier, quantum
 * tunnelling, Maxwell–Boltzmann tails, D–T / D–D reactivity and inertial burn.
 *
 * Every function is an isolated textbook calculation. Nothing here describes the geometry,
 * materials or arrangement of any device; the "ignition" chapter only compares temperatures
 * and the density scaling of the reaction rate.
 *
 * Sources: AME2020 binding energies (IAEA/AMDC), Bosch & Hale, Nucl. Fusion 32 (1992) 611
 * (reactivity parametrisation, 0.2–100 keV), NRL Plasma Formulary (Gamow energies, sound
 * speed), Atzeni & Meyer-ter-Vehn, The Physics of Inertial Fusion (burn fraction).
 */

export const KEV_PER_KELVIN = 1 / 1.160451812e7; // 1 keV = 11.6 million kelvin
export const KELVIN_PER_KEV = 1.160451812e7;
export const COULOMB_MEV_FM = 1.439964; // e²/(4πε₀) in MeV·fm
const AMU_KEV = 931494.10242; // atomic mass unit in keV/c²
const FINE_STRUCTURE = 1 / 137.035999;

/** Total binding energies in MeV (AME2020, rounded to 0.1 keV). */
export const BINDING_MEV = {
  H1: 0,
  H2: 2.2246,
  H3: 8.4818,
  He3: 7.718,
  He4: 28.2957,
  Li6: 31.995,
  Li7: 39.2453,
  n: 0,
} as const;

/** Nuclear masses in u for reduced-mass calculations (AME2020 atomic masses minus electrons
 * is unnecessary at this precision; the reduced mass changes below 0.03%). */
export const MASS_U = { H2: 2.014102, H3: 3.016049, He4: 4.002603, n: 1.008665 } as const;

/** Representative binding energy per nucleon (MeV) along the curve; the light side is exact
 * per AME2020 while heavier points are chosen samples of the same table. */
export const BINDING_CURVE: { symbol: string; A: number; perNucleon: number }[] = [
  { symbol: '¹H', A: 1, perNucleon: 0 },
  { symbol: '²H', A: 2, perNucleon: 1.1123 },
  { symbol: '³H', A: 3, perNucleon: 2.8273 },
  { symbol: '³He', A: 3, perNucleon: 2.5727 },
  { symbol: '⁴He', A: 4, perNucleon: 7.0739 },
  { symbol: '⁶Li', A: 6, perNucleon: 5.3325 },
  { symbol: '⁷Li', A: 7, perNucleon: 5.6065 },
  { symbol: '⁹Be', A: 9, perNucleon: 6.4628 },
  { symbol: '¹¹B', A: 11, perNucleon: 6.9277 },
  { symbol: '¹²C', A: 12, perNucleon: 7.6801 },
  { symbol: '¹⁴N', A: 14, perNucleon: 7.4756 },
  { symbol: '¹⁶O', A: 16, perNucleon: 7.9762 },
  { symbol: '²⁰Ne', A: 20, perNucleon: 8.0322 },
  { symbol: '²⁴Mg', A: 24, perNucleon: 8.2607 },
  { symbol: '²⁸Si', A: 28, perNucleon: 8.4477 },
  { symbol: '⁴⁰Ca', A: 40, perNucleon: 8.5513 },
  { symbol: '⁵⁶Fe', A: 56, perNucleon: 8.7903 },
  { symbol: '⁶²Ni', A: 62, perNucleon: 8.7946 },
  { symbol: '⁸⁴Kr', A: 84, perNucleon: 8.7173 },
  { symbol: '¹⁰⁰Mo', A: 100, perNucleon: 8.6045 },
  { symbol: '¹²⁰Sn', A: 120, perNucleon: 8.5046 },
  { symbol: '¹⁴⁰Ce', A: 140, perNucleon: 8.3763 },
  { symbol: '¹⁶⁰Gd', A: 160, perNucleon: 8.1829 },
  { symbol: '¹⁸⁴W', A: 184, perNucleon: 8.0051 },
  { symbol: '²⁰⁸Pb', A: 208, perNucleon: 7.8675 },
  { symbol: '²³⁵U', A: 235, perNucleon: 7.5909 },
  { symbol: '²³⁸U', A: 238, perNucleon: 7.5701 },
];

export type FusionReaction = 'dt' | 'dd';

/** Q value of D + T → ⁴He + n from the binding energies alone. */
export const DT_Q_MEV = BINDING_MEV.He4 - BINDING_MEV.H2 - BINDING_MEV.H3;
/** Two-body kinematics from rest: the lighter neutron carries m_α/(m_α + m_n) of Q. */
export const DT_NEUTRON_MEV = (DT_Q_MEV * MASS_U.He4) / (MASS_U.He4 + MASS_U.n);
export const DT_ALPHA_MEV = DT_Q_MEV - DT_NEUTRON_MEV;
/** n + ⁶Li → T + ⁴He, the in-situ tritium supply of lithium deuteride fuel. */
export const LI6_BREEDING_Q_MEV = BINDING_MEV.H3 + BINDING_MEV.He4 - BINDING_MEV.Li6;
/** Reference fission release per nucleon used only for the binding-curve comparison:
 * about 200 MeV over 236 nucleons (OpenStax University Physics 3, 10.5). */
export const FISSION_MEV_PER_NUCLEON = 200 / 236;
export const DT_MEV_PER_NUCLEON = DT_Q_MEV / 5;

/** Nuclear radius R ≈ 1.2 A^{1/3} fm; the barrier top sits near the touching distance. */
export const nuclearRadiusFm = (A: number) => 1.2 * Math.cbrt(A);
export const DT_CONTACT_FM = nuclearRadiusFm(2) + nuclearRadiusFm(3);
/** Coulomb barrier height for Z₁ = Z₂ = 1 at contact (about 0.44 MeV). */
export const DT_BARRIER_MEV = COULOMB_MEV_FM / DT_CONTACT_FM;
/** Schematic well depth for the drawing only; the real D–T potential is not a square well. */
export const WELL_DEPTH_MEV = 30;

/** Potential energy (MeV) of two singly charged nuclei at separation r (fm). Inside the
 * contact distance the strong force dominates; a flat well marks that region schematically. */
export function coulombPotentialMeV(rFm: number, contactFm = DT_CONTACT_FM) {
  if (!Number.isFinite(rFm) || rFm <= 0) throw new RangeError('Separation must be positive');
  return rFm >= contactFm ? COULOMB_MEV_FM / rFm : -WELL_DEPTH_MEV;
}

/** Classical turning point r = e²/(4πε₀E) for centre-of-mass energy E (keV), in fm. */
export function turningPointFm(energyKeV: number) {
  if (!Number.isFinite(energyKeV) || energyKeV <= 0)
    throw new RangeError('Energy must be positive');
  return (COULOMB_MEV_FM * 1000) / energyKeV;
}

export const reducedMassU = (reaction: FusionReaction) =>
  reaction === 'dt'
    ? (MASS_U.H2 * MASS_U.H3) / (MASS_U.H2 + MASS_U.H3)
    : (MASS_U.H2 * MASS_U.H2) / (2 * MASS_U.H2);

/** Gamow energy E_G = 2 m_r c² (π α Z₁ Z₂)² in keV: 1182 keV for D–T, 986 keV for D–D. */
export function gamowEnergyKeV(reaction: FusionReaction = 'dt') {
  return 2 * reducedMassU(reaction) * AMU_KEV * (Math.PI * FINE_STRUCTURE) ** 2;
}

/** WKB barrier penetration exp(−√(E_G/E)) for a bare Coulomb barrier and E ≪ barrier. */
export function tunnellingProbability(energyKeV: number, reaction: FusionReaction = 'dt') {
  if (!Number.isFinite(energyKeV) || energyKeV <= 0)
    throw new RangeError('Energy must be positive');
  return Math.exp(-Math.sqrt(gamowEnergyKeV(reaction) / energyKeV));
}

/** Maxwell–Boltzmann density of relative energy, f(E) dE with ∫f = 1, in 1/keV. */
export function maxwellEnergyDensity(energyKeV: number, temperatureKeV: number) {
  if (!Number.isFinite(temperatureKeV) || temperatureKeV <= 0)
    throw new RangeError('Temperature must be positive');
  if (!Number.isFinite(energyKeV) || energyKeV < 0) throw new RangeError('Energy must be finite');
  return (
    ((2 * Math.sqrt(energyKeV / Math.PI)) / temperatureKeV ** 1.5) *
    Math.exp(-energyKeV / temperatureKeV)
  );
}

/** Fraction of pairs whose relative energy exceeds E: the upper incomplete gamma Γ(3/2, x)/Γ(3/2). */
export function maxwellTailFraction(energyKeV: number, temperatureKeV: number) {
  const x = energyKeV / temperatureKeV;
  if (!Number.isFinite(x) || x < 0) throw new RangeError('Invalid energy ratio');
  return erfc(Math.sqrt(x)) + 2 * Math.sqrt(x / Math.PI) * Math.exp(-x);
}

/** Complementary error function, Numerical Recipes erfcc (fractional error < 1.2e-7). */
export function erfc(x: number) {
  const z = Math.abs(x),
    t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}

/** Gamow peak energy E₀ = (E_G (kT)² / 4)^{1/3} and its 1/e width Δ = 4√(E₀ kT / 3). */
export function gamowPeak(temperatureKeV: number, reaction: FusionReaction = 'dt') {
  if (!Number.isFinite(temperatureKeV) || temperatureKeV <= 0)
    throw new RangeError('Temperature must be positive');
  const energyKeV = Math.cbrt((gamowEnergyKeV(reaction) * temperatureKeV ** 2) / 4);
  return { energyKeV, widthKeV: 4 * Math.sqrt((energyKeV * temperatureKeV) / 3) };
}

/** The unnormalised Gamow integrand exp(−E/kT − √(E_G/E)); its maximum is the Gamow peak. */
export function gamowIntegrand(
  energyKeV: number,
  temperatureKeV: number,
  reaction: FusionReaction = 'dt',
) {
  if (energyKeV <= 0) return 0;
  return Math.exp(-energyKeV / temperatureKeV - Math.sqrt(gamowEnergyKeV(reaction) / energyKeV));
}

type BoschHale = {
  bg: number;
  mrc2: number;
  c: [number, number, number, number, number, number, number];
  range: [number, number];
};
/** Bosch & Hale 1992, Table VII. Units: keV in, cm³/s out. */
const BOSCH_HALE: Record<string, BoschHale> = {
  dt: {
    bg: 34.3827,
    mrc2: 1124656,
    c: [1.17302e-9, 1.51361e-2, 7.51886e-2, 4.60643e-3, 1.35e-2, -1.0675e-4, 1.366e-5],
    range: [0.2, 100],
  },
  ddn: {
    bg: 31.397,
    mrc2: 937814,
    c: [5.4336e-12, 5.85778e-3, 7.68222e-3, 0, -2.964e-6, 0, 0],
    range: [0.2, 100],
  },
  ddp: {
    bg: 31.397,
    mrc2: 937814,
    c: [5.65718e-12, 3.41267e-3, 1.99167e-3, 0, 1.0506e-5, 0, 0],
    range: [0.2, 100],
  },
};
export const REACTIVITY_RANGE_KEV: [number, number] = [0.2, 100];

function boschHale(fit: BoschHale, tKeV: number) {
  const [c1, c2, c3, c4, c5, c6, c7] = fit.c;
  const theta =
    tKeV /
    (1 - (tKeV * (c2 + tKeV * (c4 + tKeV * c6))) / (1 + tKeV * (c3 + tKeV * (c5 + tKeV * c7))));
  const xi = Math.cbrt(fit.bg ** 2 / (4 * theta));
  return c1 * theta * Math.sqrt(xi / (fit.mrc2 * tKeV ** 3)) * Math.exp(-3 * xi);
}

/** Maxwellian reactivity ⟨σv⟩ in cm³/s. Inside 0.2–100 keV this is the Bosch–Hale fit
 * (D–D sums both branches). Below 0.2 keV the non-resonant form
 * ⟨σv⟩ ∝ T^{−2/3} exp(−3E₀/kT), anchored at 0.2 keV, extrapolates for teaching only;
 * above 100 keV the value is held at the fit boundary. */
export function reactivity(temperatureKeV: number, reaction: FusionReaction = 'dt') {
  if (!Number.isFinite(temperatureKeV) || temperatureKeV <= 0)
    throw new RangeError('Temperature must be positive');
  const inRange = (t: number) =>
    reaction === 'dt'
      ? boschHale(BOSCH_HALE.dt, t)
      : boschHale(BOSCH_HALE.ddn, t) + boschHale(BOSCH_HALE.ddp, t);
  const [low, high] = REACTIVITY_RANGE_KEV;
  if (temperatureKeV >= low && temperatureKeV <= high) return inRange(temperatureKeV);
  if (temperatureKeV > high) return inRange(high);
  const tau = (t: number) => (3 * gamowPeak(t, reaction).energyKeV) / t;
  const anchor = inRange(low);
  return anchor * (temperatureKeV / low) ** (-2 / 3) * Math.exp(-(tau(temperatureKeV) - tau(low)));
}

export const reactivityIsExtrapolated = (temperatureKeV: number) =>
  temperatureKeV < REACTIVITY_RANGE_KEV[0] || temperatureKeV > REACTIVITY_RANGE_KEV[1];

/** Ion sound speed c_s = √(2 kT / m_i) for an equimolar D–T plasma with T_e = T_i, in cm/s. */
export function ionSoundSpeedCmPerS(temperatureKeV: number) {
  if (!Number.isFinite(temperatureKeV) || temperatureKeV <= 0)
    throw new RangeError('Temperature must be positive');
  const mi = 0.5 * (MASS_U.H2 + MASS_U.H3) * AMU_KEV; // keV/c²
  return 2.99792458e10 * Math.sqrt((2 * temperatureKeV) / mi);
}

/** Solid D–T fuel: public cryogenic mass density; the number density follows from the mean ion mass. */
export const SOLID_DT_G_PER_CM3 = 0.225;
export const DT_ION_MASS_G = 0.5 * (MASS_U.H2 + MASS_U.H3) * 1.66053907e-24;
export const SOLID_DT_ATOMS_PER_CM3 = SOLID_DT_G_PER_CM3 / DT_ION_MASS_G;

/** Burn-up parameter H_B = 8 m_i c_s / ⟨σv⟩ in g/cm² (Atzeni & Meyer-ter-Vehn, eq. 2.5;
 * about 7–9 g/cm² near 20–40 keV). */
export function burnParameterGPerCm2(temperatureKeV: number) {
  return (
    (8 * DT_ION_MASS_G * ionSoundSpeedCmPerS(temperatureKeV)) / reactivity(temperatureKeV, 'dt')
  );
}

/** Fraction of a D–T sphere that reacts before it disassembles: f = ρR / (ρR + H_B).
 * Derived from dN/dt = −N²⟨σv⟩/… with a confinement time R/(4c_s). Teaching simplification:
 * uniform temperature, no ignition physics, no alpha heating or radiation losses. */
export function burnFraction(rhoRGPerCm2: number, temperatureKeV: number) {
  if (!Number.isFinite(rhoRGPerCm2) || rhoRGPerCm2 < 0)
    throw new RangeError('ρR must be non-negative');
  const hb = burnParameterGPerCm2(temperatureKeV);
  return rhoRGPerCm2 / (rhoRGPerCm2 + hb);
}

/** Compress a fixed fuel mass: the same sphere at density ρ₀·C has radius R₀·C^{-1/3},
 * so ρR grows as C^{2/3}. This is scaling, not a device description. */
export function compressedFuel(
  compression: number,
  temperatureKeV: number,
  radius0Cm = 0.1,
  density0 = SOLID_DT_G_PER_CM3,
) {
  if (!Number.isFinite(compression) || compression < 1) throw new RangeError('Compression ≥ 1');
  const density = density0 * compression,
    radiusCm = radius0Cm / Math.cbrt(compression),
    rhoR = density * radiusCm,
    n = SOLID_DT_ATOMS_PER_CM3 * compression;
  const confinementS = radiusCm / (4 * ionSoundSpeedCmPerS(temperatureKeV));
  return {
    density,
    radiusCm,
    rhoR,
    numberDensity: n,
    confinementS,
    ratePerCm3: (n / 2) ** 2 * reactivity(temperatureKeV, 'dt'),
    burn: burnFraction(rhoR, temperatureKeV),
  };
}

/** Lawson-style comparison points for the confinement chart. Values are order-of-magnitude
 * public figures (NRL Plasma Formulary; JET/ITER and NIF public summaries). The Sun burns
 * the proton–proton chain, whose rate is ~10²³ times slower than D–T at the same conditions;
 * it appears for scale only. */
export const CONFINEMENT_EXAMPLES = [
  { id: 'sun', temperatureKeV: 1.3, densityPerM3: 6e31, confinementS: 3e17, reaction: 'pp' },
  { id: 'tokamak', temperatureKeV: 10, densityPerM3: 1e20, confinementS: 1, reaction: 'dt' },
  { id: 'inertial', temperatureKeV: 5, densityPerM3: 5e31, confinementS: 1e-10, reaction: 'dt' },
] as const;
/** Ignition-scale triple product n T τ ≈ 3×10²¹ keV·s/m³ for D–T near 10–20 keV. */
export const IGNITION_TRIPLE_PRODUCT = 3e21;
export const tripleProduct = (densityPerM3: number, temperatureKeV: number, confinementS: number) =>
  densityPerM3 * temperatureKeV * confinementS;

/** Reference temperatures used on the axis, in keV. */
export const TEMPERATURES = {
  chemicalFlameK: 3000,
  sunCoreK: 1.5e7,
  fissionFireballK: 1e8,
  ignitionK: 1.2e8,
} as const;
export const kelvinToKeV = (k: number) => k * KEV_PER_KELVIN;
export const keVToKelvin = (keV: number) => keV * KELVIN_PER_KEV;

export type FusionParameters = {
  temperatureKeV: number;
  compression: number;
  reaction: FusionReaction;
};
export const FUSION_DEFAULT: FusionParameters = {
  temperatureKeV: 10,
  compression: 1,
  reaction: 'dt',
};
export const FUSION_LIMITS = {
  temperatureKeV: [kelvinToKeV(3000), 100] as [number, number],
  compression: [1, 1000] as [number, number],
};

/** Ball-on-hill kinematics for the barrier drawing: separation over a normalised approach
 * phase u∈[0,1] with the turning point at u = 0.5. Uses energy conservation on the Coulomb
 * potential (uniform time sampling would spend almost all the time far away). */
export function approachSeparationFm(phase: number, energyKeV: number, farFm: number) {
  const u = Math.max(0, Math.min(1, phase));
  const turning = turningPointFm(energyKeV);
  if (!Number.isFinite(farFm) || farFm <= turning) return turning;
  // Symmetric path: log-linear motion reads well on the logarithmic separation axis.
  const s = 1 - Math.abs(2 * u - 1);
  const eased = s * s * (3 - 2 * s);
  return Math.exp(Math.log(farFm) + (Math.log(turning) - Math.log(farFm)) * eased);
}
