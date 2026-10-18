export type MetalRoute =
  | 'mercury'
  | 'carbon-monoxide'
  | 'aluminium-reduction'
  | 'sodium'
  | 'magnesium'
  | 'aluminium-electrolysis';
export const metalRoutes: MetalRoute[] = [
  'mercury',
  'carbon-monoxide',
  'aluminium-reduction',
  'sodium',
  'magnesium',
  'aluminium-electrolysis',
];
type Species = { name: string; atoms: string[] };
const S = (name: string, atoms: string): Species => ({ name, atoms: atoms.split(' ') });
export const routes: Record<
  MetalRoute,
  {
    reactants: Species[];
    products: Species[];
    electrons: number;
    metal: string;
    oxidation: number;
    electrolytic: boolean;
    equation: string;
    donor: string;
  }
> = {
  mercury: {
    reactants: [S('HgO', 'Hg O'), S('HgO', 'Hg O')],
    products: [S('Hg', 'Hg'), S('Hg', 'Hg'), S('O₂', 'O O')],
    electrons: 4,
    metal: 'Hg',
    oxidation: 2,
    electrolytic: false,
    equation: '2HgO → 2Hg + O₂',
    donor: 'O(−II) → O(0)',
  },
  'carbon-monoxide': {
    reactants: [S('Fe₂O₃', 'Fe Fe O O O'), S('CO', 'C O'), S('CO', 'C O'), S('CO', 'C O')],
    products: [
      S('Fe', 'Fe'),
      S('Fe', 'Fe'),
      S('CO₂', 'O C O'),
      S('CO₂', 'O C O'),
      S('CO₂', 'O C O'),
    ],
    electrons: 6,
    metal: 'Fe',
    oxidation: 3,
    electrolytic: false,
    equation: 'Fe₂O₃ + 3CO → 2Fe + 3CO₂',
    donor: 'C(+II) → C(+IV)',
  },
  'aluminium-reduction': {
    reactants: [S('Fe₂O₃', 'Fe Fe O O O'), S('Al', 'Al'), S('Al', 'Al')],
    products: [S('Fe', 'Fe'), S('Fe', 'Fe'), S('Al₂O₃', 'Al Al O O O')],
    electrons: 6,
    metal: 'Fe',
    oxidation: 3,
    electrolytic: false,
    equation: 'Fe₂O₃ + 2Al → 2Fe + Al₂O₃',
    donor: 'Al(0) → Al(+III)',
  },
  sodium: {
    reactants: [S('NaCl', 'Na Cl'), S('NaCl', 'Na Cl')],
    products: [S('Na', 'Na'), S('Na', 'Na'), S('Cl₂', 'Cl Cl')],
    electrons: 2,
    metal: 'Na',
    oxidation: 1,
    electrolytic: true,
    equation: '2NaCl(l) → 2Na(l) + Cl₂(g)',
    donor: '2Cl⁻ → Cl₂ + 2e⁻',
  },
  magnesium: {
    reactants: [S('MgCl₂', 'Mg Cl Cl')],
    products: [S('Mg', 'Mg'), S('Cl₂', 'Cl Cl')],
    electrons: 2,
    metal: 'Mg',
    oxidation: 2,
    electrolytic: true,
    equation: 'MgCl₂(l) → Mg(l) + Cl₂(g)',
    donor: '2Cl⁻ → Cl₂ + 2e⁻',
  },
  'aluminium-electrolysis': {
    reactants: [
      S('Al₂O₃', 'Al Al O O O'),
      S('Al₂O₃', 'Al Al O O O'),
      S('C', 'C'),
      S('C', 'C'),
      S('C', 'C'),
    ],
    products: [
      S('Al', 'Al'),
      S('Al', 'Al'),
      S('Al', 'Al'),
      S('Al', 'Al'),
      S('CO₂', 'O C O'),
      S('CO₂', 'O C O'),
      S('CO₂', 'O C O'),
    ],
    electrons: 12,
    metal: 'Al',
    oxidation: 3,
    electrolytic: true,
    equation: '2Al₂O₃ + 3C → 4Al + 3CO₂',
    donor: 'C(0) → C(+IV)',
  },
};
const clamp = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);
export function metalExtraction(
  route: MetalRoute,
  progress: number,
  { heat = true, power = true, molten = true } = {},
) {
  const r = routes[route],
    gate = r.electrolytic ? power && molten : heat,
    p = gate ? clamp(progress) : 0;
  const count = (species: Species[]) =>
    species.reduce(
      (a, s) => {
        for (const e of s.atoms) a[e] = (a[e] ?? 0) + 1;
        return a;
      },
      {} as Record<string, number>,
    );
  return {
    route,
    ...r,
    extent: p,
    enabled: gate,
    heat,
    power,
    molten,
    inputAtoms: count(r.reactants),
    outputAtoms: count(r.products),
    electronsAccepted: r.electrons * p,
    electronsReleased: r.electrons * p,
    metalProduced: r.products.filter((s) => s.name === r.metal).length * p,
    reactantsRemaining: r.reactants.map(() => 1 - p),
    productsFormed: r.products.map(() => p),
  };
}
export function metalAtomMap(route: MetalRoute, progress: number) {
  const r = routes[route],
    p = clamp(progress),
    ease = p * p * (3 - 2 * p);
  const layout = (species: Species[]) =>
    species.flatMap((s, k) => {
      const cols = species.length > 4 ? 3 : 2,
        rows = Math.ceil(species.length / cols),
        cx =
          species.length === 1
            ? 160
            : species.length === 2
              ? 90 + k * 140
              : 55 + (k % cols) * (210 / (cols - 1)),
        cy = rows === 1 ? 135 : 70 + Math.floor(k / cols) * (150 / Math.max(1, rows - 1));
      return s.atoms.map((element, j) => {
        const angle = (j / s.atoms.length) * Math.PI * 2 - Math.PI / 2,
          rad = s.atoms.length === 1 ? 0 : s.atoms.length <= 3 ? 20 : 29;
        return {
          element,
          x: cx + (s.name === 'CO₂' ? (j - 1) * 34 : Math.cos(angle) * rad),
          y: cy + (s.name === 'CO₂' ? 0 : Math.sin(angle) * rad),
          species: s.name,
        };
      });
    });
  const starts = layout(r.reactants),
    ends = layout(r.products),
    available = ends.map((a, i) => ({ ...a, index: i })),
    used = new Set<number>();
  const atoms = starts.map((a, id) => {
    const b = available.find((b) => b.element === a.element && !used.has(b.index))!;
    used.add(b.index);
    return {
      id,
      element: a.element,
      x: a.x + (b.x - a.x) * ease,
      y: a.y + (b.y - a.y) * ease,
      from: a.species,
      to: b.species,
    };
  });
  // Label-aware display separation only: these paths are not molecular dynamics.
  for (let pass = 0; pass < 60; pass++)
    for (let i = 0; i < atoms.length; i++)
      for (let j = i + 1; j < atoms.length; j++) {
        const a = atoms[i],
          b = atoms[j],
          dx = b.x - a.x,
          dy = b.y - a.y,
          dist = Math.hypot(dx, dy);
        if (dist < 33) {
          const ux = dist > 1e-6 ? dx / dist : 1,
            uy = dist > 1e-6 ? dy / dist : 0,
            push = (33 - dist) / 2;
          a.x = Math.max(20, Math.min(300, a.x - ux * push));
          a.y = Math.max(20, Math.min(260, a.y - uy * push));
          b.x = Math.max(20, Math.min(300, b.x + ux * push));
          b.y = Math.max(20, Math.min(260, b.y + uy * push));
        }
      }
  return atoms;
}
export function metalDirector(chapter: number, p: number) {
  const c = Math.max(0, Math.min(6, Math.floor(Number.isFinite(chapter) ? chapter : 0))),
    progress = clamp(p);
  return {
    chapter: c,
    route: (c === 0 ? 'carbon-monoxide' : metalRoutes[c - 1]) as MetalRoute,
    progress: c === 0 ? 0 : clamp((progress - 0.12) / 0.46),
  };
}
