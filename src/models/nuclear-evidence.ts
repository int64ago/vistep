import { finiteClamp } from './modern-labs';
/** Nonrelativistic two-body teaching kinematics, masses in u and energies in MeV.
 * The reaction Q accounts for the rest-energy change; exact mass defects are not reconstructed. */
export function nitrogenReaction(angleDegrees: number, alphaEnergy = 7.7) {
  const a = (finiteClamp(angleDegrees, 0, 160) * Math.PI) / 180,
    ea = finiteClamp(alphaEnergy, 2, 10),
    q = -1.191,
    pi = Math.sqrt(2 * 4 * ea);
  const A = 0.5 + 0.5 / 17,
    B = (-pi * Math.cos(a)) / 17,
    C = (pi * pi) / 34 - (ea + q);
  const p = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
  const proton = { x: p * Math.cos(a), y: p * Math.sin(a) },
    oxygen = { x: pi - proton.x, y: -proton.y };
  return {
    proton,
    oxygen,
    incoming: pi,
    protonEnergy: (p * p) / 2,
    oxygenEnergy: (oxygen.x ** 2 + oxygen.y ** 2) / 34,
    q,
    alphaEnergy: ea,
  };
}
export function neutronRecoil(targetMass: number, energyMeV = 5) {
  const m = finiteClamp(targetMass, 1, 40);
  return {
    fraction: (4 * m) / (1 + m) ** 2,
    maximumEnergy: ((4 * m) / (1 + m) ** 2) * finiteClamp(energyMeV, 0.1, 10),
  };
}
export function fissionBalance() {
  const input = [
      { a: 235, z: 92 },
      { a: 1, z: 0 },
    ],
    output = [
      { a: 141, z: 56 },
      { a: 92, z: 36 },
      { a: 1, z: 0 },
      { a: 1, z: 0 },
      { a: 1, z: 0 },
    ];
  return { input, output };
}
export function fragmentEvent(count: 3 | 4) {
  return count === 3
    ? [
        { x: 1, y: 0, mass: 110 },
        { x: -1.15, y: -0.4, mass: 122 },
        { x: 0.15, y: 0.4, mass: 4 },
      ]
    : [
        { x: 1, y: 0, mass: 110 },
        { x: -1, y: 0, mass: 118 },
        { x: 0.15, y: 0.4, mass: 4 },
        { x: -0.15, y: -0.4, mass: 4 },
      ];
}
export function chainExpectation(k: number, generation: number, initial = 32) {
  return initial * finiteClamp(k, 0.7, 1.3) ** finiteClamp(generation, 0, 12);
}
