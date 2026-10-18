import { describe, expect, it } from 'vitest';
import {
  photoelectric,
  oilDrop,
  electronBeam,
  thomsonTrajectory,
  comptonShift,
  planckRadiance,
  wienPeakNM,
  balmerWavelength,
  rutherfordTrajectory,
  lambQuenching,
} from './modern-labs';
import { electronWavelengthPM, powderRadii, planeIntensity, laueSpots } from './matter-wave-lab';
import { radiationTrack, expansionChamber, xrayCutoffPM } from './radiation-evidence';
import { carbonDate, tracerCompartments } from './decay-measurement';
import { nitrogenReaction, neutronRecoil, fissionBalance } from './nuclear-evidence';
import {
  captureRecoil,
  captureTransmission,
  invariantPair,
  pairEvidence,
  parityCounts,
} from './particle-evidence';

// Independent SI constants, rather than importing the constants used by the implementation.
// NIST 2022 CODATA: https://physics.nist.gov/cuu/pdf/all.pdf
const e = 1.602176634e-19,
  me = 9.1093837139e-31;
function rk4(y: number[], dt: number, derivative: (x: number[]) => number[]) {
  const a = derivative(y),
    b = derivative(y.map((x, j) => x + (a[j] * dt) / 2));
  const c = derivative(y.map((x, j) => x + (b[j] * dt) / 2));
  const d = derivative(y.map((x, j) => x + c[j] * dt));
  return y.map((x, j) => x + (dt * (a[j] + 2 * b[j] + 2 * c[j] + d[j])) / 6);
}

describe('independent units, conservation and edge checks for modern experiments', () => {
  it('separates the frequency threshold from photon flux and checks millivolt/eV conversion', () => {
    expect(photoelectric(800, 0, 1).emitted).toBe(false);
    expect(photoelectric(800, 0, 1).current).toBe(0);
    expect(photoelectric(400, 2, 1).emitted).toBe(false);
    expect(photoelectric(800, 1, 0).stoppingVoltage).toBeCloseTo(1.208534157539087, 12);
    for (const intensity of [0.05, 1, 2]) {
      expect(photoelectric(800, intensity, -1.209).current).toBe(0);
      expect(photoelectric(800, intensity, 0).current).toBe(intensity);
    }
  });

  it('matches independently calculated oil-drop SI scales at the actual UI radius', () => {
    const drop = oilDrop(0.8, 4, 0);
    expect(drop.effectiveWeight / 1e-14).toBeCloseTo(1.80494527588, 10);
    expect(drop.balanceVoltage).toBeCloseTo(140.8197789788763, 9);
    expect(drop.terminalDown * 1e6).toBeCloseTo(66.12936525475751, 9);
    for (const charge of [1, 8]) {
      expect(oilDrop(0.8, charge, 600).terminalDown).toBeLessThan(0);
      expect(oilDrop(0.8, charge, 0).terminalDown).toBeGreaterThan(0);
    }
  });

  it('integrates blackbody spectral radiance back to Stefan–Boltzmann power per steradian', () => {
    // Integrate B_lambda d(lambda) on a logarithmic grid, spanning the full thermal spectrum.
    // The public model is intentionally limited to 50..20000 nm, so account for that same window
    // with a separately integrated dimensionless Planck distribution over x = hc/(lambda kT).
    for (const t of [2500, 5800, 8000]) {
      const n = 12000,
        lo = Math.log(50e-9),
        hi = Math.log(20000e-9),
        ds = (hi - lo) / n;
      let power = 0;
      for (let j = 0; j < n; j++) {
        const lambda = Math.exp(lo + (j + 0.5) * ds);
        power += planckRadiance(lambda * 1e9, t) * lambda * ds;
      }
      const hcOverK = 0.014387768775039337;
      const xmin = hcOverK / (20000e-9 * t),
        xmax = hcOverK / (50e-9 * t);
      const dx = (xmax - xmin) / n;
      let fraction = 0;
      for (let j = 0; j < n; j++) {
        const x = xmin + (j + 0.5) * dx;
        fraction += ((x ** 3 / Math.expm1(x)) * dx * 15) / Math.PI ** 4;
      }
      const expected = ((5.670374419e-8 * t ** 4) / Math.PI) * fraction;
      expect(power / expected).toBeCloseTo(1, 6);
      const peak = wienPeakNM(t);
      expect(planckRadiance(peak, t)).toBeGreaterThan(planckRadiance(peak * 0.999, t));
      expect(planckRadiance(peak, t)).toBeGreaterThan(planckRadiance(peak * 1.001, t));
    }
  });

  it('checks the crossed-field screen independently with a Lorentz-force RK4 integration', () => {
    const v = 8387657.619092468;
    expect(electronBeam(200, 1).radius).toBeCloseTo(0.04768911872243057, 12);
    for (const [electric, magnetic] of [
      [0, 0.0001],
      [0, 0.0004],
      [v * 0.0001, 0],
      [v * 0.0004, 0],
      [v * 0.0004, 0.0004],
    ]) {
      const dt = 1e-12;
      let state = [0, 0, v, 0],
        exit = state;
      for (let j = 0; j < 40000; j++) {
        const next = rk4(state, dt, ([x, , vx, vy]) => {
          const within = x < 0.06;
          return [
            vx,
            vy,
            (-e / me) * vy * (within ? magnetic : 0),
            (-e / me) * ((within ? electric : 0) - vx * (within ? magnetic : 0)),
          ];
        });
        if (next[0] >= 0.1 || Math.abs(next[1]) >= 0.04) {
          const f = Math.min(
            next[0] >= 0.1 ? (0.1 - state[0]) / (next[0] - state[0]) : 1,
            Math.abs(next[1]) >= 0.04
              ? (Math.sign(next[1]) * 0.04 - state[1]) / (next[1] - state[1])
              : 1,
          );
          exit = state.map((x, i) => x + f * (next[i] - x));
          break;
        }
        state = next;
      }
      const result = thomsonTrajectory(electric, magnetic).points.at(-1)!;
      expect(Math.hypot(result.x - exit[0], result.y - exit[1])).toBeLessThan(3e-6);
    }
  });

  it('checks repulsive trajectories against an independently stepped RK4 solution', () => {
    for (const impact of [0.5, 2, 5, 10]) {
      const points = rutherfordTrajectory(impact);
      let state = [-35, impact, 1, 0],
        worst = 0;
      for (let index = 1; index < points.length; index++) {
        for (let j = 0; j < 100; j++) {
          state = rk4(state, 0.002, ([x, y, vx, vy]) => {
            const r3 = Math.hypot(x, y) ** 3;
            return [vx, vy, x / r3, y / r3];
          });
        }
        worst = Math.max(worst, Math.hypot(state[0] - points[index].x, state[1] - points[index].y));
      }
      expect(worst).toBeLessThan(0.002);
    }
  });

  it('matches Compton shifts and recoil energy in pm and eV', () => {
    expect(comptonShift(0).recoilEnergyEV).toBe(0);
    expect(comptonShift(90).shiftPM).toBeCloseTo(2.4263102353803165, 12);
    expect(comptonShift(180).shiftPM).toBeCloseTo(4.852620470760634, 12);
    expect(comptonShift(180).recoilEnergyEV).toBeCloseTo(1117.1557545980613, 8);
  });

  it('checks hydrogen wavelengths and a MHz rather than optical-frequency Lamb resonance', () => {
    expect(balmerWavelength(3)).toBeCloseTo(656.469626700370303575, 6);
    expect(balmerWavelength(4)).toBeCloseTo(486.2737975558298545, 6);
    expect(lambQuenching(1057.8).survivingFraction).toBeCloseTo(0.2, 12);
    expect(lambQuenching(1007.8).response).toBeCloseTo(0.5, 12);
    expect(lambQuenching(1107.8).response).toBeCloseTo(0.5, 12);
  });

  it('checks electron wavelength and ring radii using independent endpoint values', () => {
    expect(electronWavelengthPM(2000)).toBeCloseTo(27.396924159085355, 10);
    expect(electronWavelengthPM(7000)).toBeCloseTo(14.60864966037385, 10);
    expect(powderRadii(2000)[1]).toBeCloseTo(22.698422943691888, 10);
    expect(powderRadii(7000)[1]).toBeCloseTo(11.94020556414332, 10);
    const lambda = electronWavelengthPM(100);
    expect(planeIntensity(Math.asin(lambda / (2 * 213)), lambda)).toBeCloseTo(1, 12);
    expect(planeIntensity(Math.asin(lambda / (2 * 213 * 8)), lambda)).toBeCloseTo(0, 12);
    for (const rotation of [-0.6, 0, 0.6]) {
      for (const spot of laueSpots(rotation)) {
        // Reconstruct outgoing wavevector from the screen direction; compare with independently
        // rotated reciprocal indices. This checks units and screen projection, not stored residual.
        const z = 1 / Math.hypot(spot.x, spot.y, 1);
        const k = [spot.x * z, spot.y * z, z].map((v) => v / spot.wavelengthPM);
        const hx = spot.h * Math.cos(0.17) - spot.k * Math.sin(0.17);
        expect(k[0]).toBeCloseTo((hx * Math.cos(rotation) + spot.l * Math.sin(rotation)) / 400, 12);
        expect(k[1]).toBeCloseTo((spot.h * Math.sin(0.17) + spot.k * Math.cos(0.17)) / 400, 12);
        expect(k[2] - 1 / spot.wavelengthPM).toBeCloseTo(
          (-hx * Math.sin(rotation) + spot.l * Math.cos(rotation)) / 400,
          12,
        );
      }
    }
  });

  it('checks relativistic alpha/beta track scales and magnetic-field reversal', () => {
    expect(radiationTrack('alpha', 0.3).radius).toBeCloseTo(1.0736814304694229, 12);
    expect(radiationTrack('beta', 0.3).radius).toBeCloseTo(0.027335065531975497, 12);
    for (const kind of ['alpha', 'beta', 'gamma'] as const) {
      const a = radiationTrack(kind, 0.3),
        b = radiationTrack(kind, -0.3);
      a.points.forEach((p, i) => {
        expect(p.x).toBeCloseTo(b.points[i].x, 12);
        expect(p.y).toBeCloseTo(-b.points[i].y, 12);
      });
      expect(radiationTrack(kind, 0).points.every((p) => p.y === 0)).toBe(true);
    }
    expect(expansionChamber(1).supersaturation).toBeCloseTo(0.9, 12);
    expect(expansionChamber(1.25).temperature).toBeCloseTo(268.1179519449914369, 5);
    expect(expansionChamber(1.25).supersaturation).toBeGreaterThan(3);
    expect(xrayCutoffPM(12)).toBeCloseTo(103.32016536100021, 9);
  });

  it('solves tracer compartments independently as coupled differential equations', () => {
    const lambda = Math.log(2) / 14.268;
    let state = [1, 0, 0];
    for (let day = 1; day <= 20; day++) {
      for (let j = 0; j < 100; j++)
        state = rk4(state, 0.01, ([s, r, l]) => [
          -(0.2 + lambda) * s,
          0.2 * s - (0.1 + lambda) * r,
          0.1 * r - lambda * l,
        ]);
      const model = tracerCompartments(day);
      [model.soil, model.root, model.leaf].forEach((x, i) => expect(x).toBeCloseTo(state[i], 11));
      expect(model.total).toBeCloseTo(
        state.reduce((a, b) => a + b),
        11,
      );
    }
    expect(carbonDate(5730, 0).measured).toBe(0.5);
    expect(carbonDate(11460, 0.1).measured).toBeCloseTo(0.325, 12);
    expect(carbonDate(11460, 0.1).apparentYears).toBeCloseTo(9291.1283987561281742, 6);
  });

  it('checks nuclear kinematics with energy and vector momentum, including extreme angles', () => {
    for (const angle of [0, 10, 90, 130, 160])
      for (const energy of [2, 7.7, 10]) {
        const r = nitrogenReaction(angle, energy);
        expect(r.protonEnergy + r.oxygenEnergy).toBeCloseTo(energy - 1.191, 12);
        expect(r.proton.x + r.oxygen.x).toBeCloseTo(Math.sqrt(8 * energy), 12);
        expect(r.proton.y + r.oxygen.y).toBe(0);
      }
    expect(neutronRecoil(1, 5).maximumEnergy).toBe(5);
    expect(neutronRecoil(14, 5).maximumEnergy).toBeCloseTo(1.2444444444444445, 12);
    const balance = fissionBalance();
    for (const key of ['a', 'z'] as const)
      expect(balance.input.reduce((s, p) => s + p[key], 0)).toBe(
        balance.output.reduce((s, p) => s + p[key], 0),
      );
  });

  it('checks MeV/GeV/eV conversions and the independently integrated parity asymmetry', () => {
    expect(pairEvidence(1.021, 1).pairTerm).toBe(0);
    expect(pairEvidence(2, 1).kineticEach).toBeCloseTo(0.48900105, 12);
    expect(captureRecoil()).toBeCloseTo(56.951456350032906, 10);
    expect(captureTransmission(0)).toBe(1);
    expect(captureTransmission(56.952)).toBe(0);
    expect(captureTransmission(56.951456350032906 / 4)).toBeCloseTo(0.5, 12);
    expect(invariantPair(62.5, 62.5, Math.PI)).toBe(125);
    expect(invariantPair(62.5, 62.5, 0)).toBe(0);
    let upper = 0,
      lower = 0;
    for (let i = 0; i < 1000; i++) {
      const cosine = (i + 0.5) / 1000;
      upper += (1 - 0.7 * 0.9 * cosine) / 2000;
      lower += (1 + 0.7 * 0.9 * cosine) / 2000;
    }
    expect(parityCounts(0.9).up).toBeCloseTo(upper, 12);
    expect(parityCounts(0.9).down).toBeCloseTo(lower, 12);
  });
});
