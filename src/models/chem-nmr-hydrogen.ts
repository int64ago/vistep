/** First-order illustrative 1H spectra; no claim of measured spectra or universal OH position. */
export type Molecule = 'ethanol' | 'ether';
export type Environment = {
  id: string;
  hydrogens: string[];
  shift: number;
  area: number;
  width: number;
  color: string;
  lines: { shift: number; area: number }[];
};
export const nmrColors = ['#b89a60', '#6c9a91', '#ae7f98'];
export function environments(
  molecule: Molecule,
  ohShift = 2.2,
  exchange = 0,
  resolved = false,
  couplingHz = 7,
): Environment[] {
  const make = (
    id: string,
    hydrogens: string[],
    shift: number,
    width: number,
    color: string,
    weights = [1],
    area = hydrogens.length,
  ) => ({
    id,
    hydrogens,
    shift,
    area,
    width,
    color,
    lines: weights.map((w, i) => ({
      shift: shift + ((i - (weights.length - 1) / 2) * couplingHz) / 400,
      area: (area * w) / weights.reduce((a, b) => a + b, 0),
    })),
  });
  if (molecule === 'ether')
    return [
      make(
        'ether',
        ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
        3.3,
        resolved ? 0.003 : 0.04,
        nmrColors[1],
      ),
    ];
  return [
    make(
      'methyl',
      ['H1', 'H2', 'H3'],
      1.2,
      resolved ? 0.0025 : 0.04,
      nmrColors[0],
      resolved ? [1, 2, 1] : [1],
    ),
    make(
      'methylene',
      ['H4', 'H5'],
      3.65,
      resolved ? 0.0025 : 0.04,
      nmrColors[1],
      resolved ? [1, 3, 3, 1] : [1],
    ),
    make(
      'hydroxyl',
      ['H6'],
      ohShift,
      0.1,
      nmrColors[2],
      [1],
      1 - Math.max(0, Math.min(1, exchange)),
    ),
  ];
}
export function lorentzian(x: number, center: number, width: number) {
  return width / Math.PI / ((x - center) ** 2 + width ** 2);
}
export function signal(x: number, groups: Environment[]) {
  return groups.reduce(
    (s, g) => s + g.lines.reduce((q, l) => q + l.area * lorentzian(x, l.shift, g.width), 0),
    0,
  );
}
export function integral(from: number, to: number, groups: Environment[]) {
  return groups.reduce(
    (s, g) =>
      s +
      g.lines.reduce(
        (q, l) =>
          q +
          (l.area * (Math.atan((to - l.shift) / g.width) - Math.atan((from - l.shift) / g.width))) /
            Math.PI,
        0,
      ),
    0,
  );
}
/** Rotating-frame complex FID, with the same exponential/absorption-Lorentzian parameters. */
export function fid(seconds: number, groups: Environment[], fieldMHz = 400, referencePpm = 3) {
  let real = 0,
    imag = 0;
  for (const g of groups)
    for (const l of g.lines) {
      const phase = 2 * Math.PI * (l.shift - referencePpm) * fieldMHz * seconds,
        decay = Math.exp(-2 * Math.PI * g.width * fieldMHz * seconds);
      real += l.area * decay * Math.cos(phase);
      imag += l.area * decay * Math.sin(phase);
    }
  return { real, imag };
}
export function hydrogenGeometry(m: Molecule) {
  const coords =
    m === 'ethanol'
      ? [
          [90, 90],
          [175, 135],
          [260, 90],
          [40, 50],
          [45, 130],
          [95, 25],
          [175, 200],
          [190, 65],
          [305, 125],
        ]
      : [
          [80, 125],
          [170, 80],
          [260, 125],
          [30, 90],
          [65, 190],
          [100, 55],
          [240, 55],
          [275, 190],
          [310, 90],
        ];
  const els =
    m === 'ethanol'
      ? ['C', 'C', 'O', 'H', 'H', 'H', 'H', 'H', 'H']
      : ['C', 'O', 'C', 'H', 'H', 'H', 'H', 'H', 'H'];
  const edges =
    m === 'ethanol'
      ? [
          [0, 1],
          [1, 2],
          [0, 3],
          [0, 4],
          [0, 5],
          [1, 6],
          [1, 7],
          [2, 8],
        ]
      : [
          [0, 1],
          [1, 2],
          [0, 3],
          [0, 4],
          [0, 5],
          [2, 6],
          [2, 7],
          [2, 8],
        ];
  return {
    atoms: coords.map(([x, y], i) => ({
      id: i < 3 ? `atom${i}` : `H${i - 2}`,
      element: els[i],
      x,
      y,
    })),
    edges,
  };
}
export function sampledSpectrum(groups: Environment[], lo = 0, hi = 6, n = 1200) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const delta = hi - ((hi - lo) * i) / n;
    return { delta, value: signal(delta, groups), integral: integral(delta, hi, groups) };
  });
}
