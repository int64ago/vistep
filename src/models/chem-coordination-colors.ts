/** Qualitative observed copper phases, conditional AgCl equilibrium, and ligand geometry. */
export type V = { x: number; y: number; z: number };
export const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const mul = (a: V, k: number): V => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const sub = (a: V, b: V) => add(a, mul(b, -1));
export const length = (a: V) => Math.hypot(a.x, a.y, a.z);
export const unit = (a: V) => mul(a, 1 / (length(a) || 1));
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => {
  v = clamp(v);
  return v * v * (3 - 2 * v);
};
export function rotate(v: V, yaw: number, pitch: number) {
  const x = v.x * Math.cos(yaw) + v.z * Math.sin(yaw),
    z = -v.x * Math.sin(yaw) + v.z * Math.cos(yaw);
  return {
    x,
    y: v.y * Math.cos(pitch) - z * Math.sin(pitch),
    z: v.y * Math.sin(pitch) + z * Math.cos(pitch),
  };
}
export const salts = [
  { formula: 'CuSO₄', solid: '#f0eee1', copper: true },
  { formula: 'CuCl₂·2H₂O', solid: '#6e9475', copper: true },
  { formula: 'CuBr₂', solid: '#665345', copper: true },
  { formula: 'NaCl', solid: '#f4f0e4', copper: false },
  { formula: 'K₂SO₄', solid: '#f4f0e4', copper: false },
  { formula: 'KBr', solid: '#f4f0e4', copper: false },
];
export function copper(stage: 'precipitate' | 'ammine' | 'crystallize', p: number, reagent = true) {
  const q = smooth(p),
    a = stage === 'precipitate' ? 1 - (reagent ? q : 0) : 0,
    h =
      stage === 'precipitate' ? (reagent ? q : 0) : stage === 'ammine' ? 1 - (reagent ? q : 0) : 0;
  const crystal = stage === 'crystallize' && reagent ? 0.8 * q : 0;
  const complex = Math.max(0, 1 - a - h - crystal);
  return { aqua: a, hydroxide: h, complex, crystal, total: a + h + complex + crystal };
}
/** Free ammonia is externally specified, not total NH3 added. Fixed-volume,
 * ideal concentrations at 25 °C; excess Cl is a controlled background. */
export const Ksp = 1.8e-10,
  Kf = 1.7e7;
export function silver(freeNH3: number, totalAg = 0.003, backgroundCl = 0.05) {
  const ligand = Math.max(0, freeNH3),
    alpha = 1 + Kf * ligand ** 2;
  const sat = (2 * Ksp * alpha) / (backgroundCl + Math.sqrt(backgroundCl ** 2 + 4 * Ksp * alpha));
  const dissolved = Math.min(totalAg, sat),
    freeAg = dissolved / alpha,
    complex = dissolved - freeAg,
    solid = totalAg - dissolved;
  return {
    dissolved,
    freeAg,
    complex,
    solid,
    totalAg,
    chloride: backgroundCl + dissolved,
    freeNH3: ligand,
    fraction: dissolved / totalAg,
  };
}
export type Ligand = {
  id: string;
  element: 'O' | 'N';
  center: V;
  hydrogens: V[];
  bound: number;
  axial: boolean;
};
function molecule(
  id: string,
  element: 'O' | 'N',
  center: V,
  outward: V,
  bound: number,
  axial = false,
): Ligand {
  const n = unit(outward),
    u = unit(Math.abs(n.z) < 0.9 ? { x: -n.y, y: n.x, z: 0 } : { x: 1, y: 0, z: 0 }),
    v = { x: n.y * u.z - n.z * u.y, y: n.z * u.x - n.x * u.z, z: n.x * u.y - n.y * u.x };
  const hs: V[] = [];
  if (element === 'O') {
    const c = Math.cos((104.5 * Math.PI) / 360),
      s = Math.sin((104.5 * Math.PI) / 360);
    for (const sign of [-1, 1]) hs.push(add(center, mul(add(mul(n, c), mul(u, sign * s)), 0.96)));
  } else {
    const c = Math.sqrt((1 + 2 * Math.cos((107 * Math.PI) / 180)) / 3),
      s = Math.sqrt(1 - c * c);
    for (let j = 0; j < 3; j++)
      hs.push(
        add(
          center,
          mul(
            add(
              mul(n, c),
              add(
                mul(u, s * Math.cos((j * 2 * Math.PI) / 3)),
                mul(v, s * Math.sin((j * 2 * Math.PI) / 3)),
              ),
            ),
            1.01,
          ),
        ),
      );
  }
  return { id, element, center, hydrogens: hs, bound, axial };
}
export function copperLigands(progress: number): Ligand[] {
  const out: Ligand[] = [];
  for (let j = 0; j < 4; j++) {
    const q = smooth(progress * 4 - j),
      theta = (j * Math.PI) / 2;
    const angleW = theta + 0.44 * q,
      water = {
        x: (2 + 2.1 * q) * Math.cos(angleW),
        y: (2 + 2.1 * q) * Math.sin(angleW),
        z: 0.45 * q,
      };
    const arrival = smooth((q - 0.4) / 0.6),
      angleN = theta - 0.5 * (1 - arrival),
      r = 4.3 + (2.03 - 4.3) * arrival,
      n = { x: r * Math.cos(angleN), y: r * Math.sin(angleN), z: -0.5 * (1 - arrival) };
    out.push(
      molecule(`water-${j}`, 'O', water, water, 1 - q),
      molecule(`ammonia-${j}`, 'N', n, n, arrival),
    );
  }
  for (const sign of [-1, 1]) {
    const v = { x: 0, y: 0, z: sign * 2.33 };
    out.push(molecule(`axial-${sign}`, 'O', v, v, 1, true));
  }
  return out;
}
export function silverLigands(): Ligand[] {
  return [-1, 1].map((sign) => {
    const v = { x: 2.1 * sign, y: 0, z: 0 };
    return molecule(`silver-ammonia-${sign}`, 'N', v, v, 1);
  });
}
export function ironComparison(progress: number, thiocyanate = true) {
  const q = thiocyanate ? smooth(progress) : 0;
  return { freeIronRed: q, ferricyanideRed: 0, ferricyanideIntact: 1 };
}
