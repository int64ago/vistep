/** Atom coordinates in Å; iodine packing and separation are pedagogical.
 * Diamond: 1.54 Å nearest-neighbour bonds. Quartz: Kihara 298 K coordinates
 * as tabulated in Sutter et al., J. Appl. Cryst. 55 (2022), Tables 2–4. */
import {
  ice,
  shellIds,
  centralId,
  hydrogenLinks,
  add,
  mul,
  sub,
  length,
  unit,
  rotate,
  smooth,
  type V,
} from './chem-hydrogen-bond-network';
export { add, mul, sub, length, unit, rotate, smooth };
export type { V };
export type Element = 'I' | 'O' | 'H' | 'C' | 'Si';
export type Atom = { id: string; element: Element; p: V; level: number };
export type Bond = {
  a: string;
  b: string;
  kind: 'covalent' | 'intermolecular' | 'hydrogen';
  opacity?: number;
};
export type Structure = {
  atoms: Atom[];
  bonds: Bond[];
  focus: string;
  boundary?: Bond[];
  outside?: Atom[];
};
const key = (p: V) => [p.x, p.y, p.z].map((x) => x.toFixed(6)).join(':');
export const diamondA = (1.54 * 4) / Math.sqrt(3);
const fcc = [
  [0, 0, 0],
  [0, 0.5, 0.5],
  [0.5, 0, 0.5],
  [0.5, 0.5, 0],
];
export function diamondBulk(): Structure {
  const atoms: Atom[] = [];
  for (let i = -2; i <= 2; i++)
    for (let j = -2; j <= 2; j++)
      for (let k = -2; k <= 2; k++)
        for (const b of fcc)
          for (const d of [0, 0.25]) {
            const p = {
              x: (i + b[0] + d) * diamondA,
              y: (j + b[1] + d) * diamondA,
              z: (k + b[2] + d) * diamondA,
            };
            atoms.push({ id: key(p), element: 'C', p, level: 0 });
          }
  return { atoms, bonds: neighbourBonds(atoms, 1.539, 1.541), focus: '0.000000:0.000000:0.000000' };
}
const frac = (v: number) => ((v % 1) + 1) % 1;
const u = 0.4697,
  x = 0.4133,
  y = 0.2672,
  z = 0.1188;
export const quartzBasis: [Element, number, number, number][] = [
  ['Si', u, 0, 0],
  ['Si', 0, u, 2 / 3],
  ['Si', -u, -u, 1 / 3],
  ['O', x, y, z],
  ['O', -y, x - y, z + 2 / 3],
  ['O', y - x, -x, z + 1 / 3],
  ['O', x - y, -y, -z],
  ['O', -x, y - x, -z + 1 / 3],
  ['O', y, x, -z + 2 / 3],
].map(([e, a, b, c]) => [
  e,
  frac(a as number),
  frac(b as number),
  frac(c as number),
]) as typeof quartzBasis;
export const quartzCell = { a: 4.9137, c: 5.4047 };
export function quartzBulk(): Structure {
  const atoms: Atom[] = [];
  for (let i = -2; i <= 2; i++)
    for (let j = -2; j <= 2; j++)
      for (let k = -2; k <= 2; k++)
        quartzBasis.forEach(([element, a, b, c], n) => {
          const p = {
            x: quartzCell.a * (i + a - (j + b) / 2),
            y: ((quartzCell.a * Math.sqrt(3)) / 2) * (j + b),
            z: quartzCell.c * (k + c),
          };
          atoms.push({ id: `${i}:${j}:${k}:${n}`, element, p, level: 0 });
        });
  return { atoms, bonds: neighbourBonds(atoms, 1.5, 1.75, true), focus: '0:0:0:0' };
}
function neighbourBonds(atoms: Atom[], lo: number, hi: number, different = false): Bond[] {
  const bonds: Bond[] = [];
  for (let i = 0; i < atoms.length; i++)
    for (let j = i + 1; j < atoms.length; j++) {
      if (different && atoms[i].element === atoms[j].element) continue;
      const d = length(sub(atoms[i].p, atoms[j].p));
      if (d > lo && d < hi) bonds.push({ a: atoms[i].id, b: atoms[j].id, kind: 'covalent' });
    }
  return bonds;
}
export function shell(s: Structure, depth: number): Structure {
  const levels = new Map([[s.focus, 0]]);
  for (let level = 0; level < depth + 1; level++)
    for (const b of s.bonds) {
      if (levels.get(b.a) === level && !levels.has(b.b)) levels.set(b.b, level + 1);
      if (levels.get(b.b) === level && !levels.has(b.a)) levels.set(b.a, level + 1);
    }
  const center = s.atoms.find((a) => a.id === s.focus)!.p;
  const at = (a: Atom) => ({ ...a, p: sub(a.p, center), level: levels.get(a.id)! });
  const atoms = s.atoms.filter((a) => (levels.get(a.id) ?? Infinity) <= depth).map(at);
  const set = new Set(atoms.map((a) => a.id));
  const boundary = s.bonds.filter((b) => set.has(b.a) !== set.has(b.b));
  return {
    atoms,
    bonds: s.bonds.filter((b) => set.has(b.a) && set.has(b.b)),
    focus: s.focus,
    boundary,
    outside: s.atoms.filter((a) => levels.get(a.id) === depth + 1).map(at),
  };
}
export const diamond = shell(diamondBulk(), 3);
export const quartz = shell(quartzBulk(), 5);
export function components(s: Structure, excluded: Bond[] = []): string[][] {
  const remaining = new Set(s.atoms.map((a) => a.id)),
    out: string[][] = [];
  const ex = new Set(excluded.map((b) => `${b.a}|${b.b}`));
  while (remaining.size) {
    const first = remaining.values().next().value as string;
    remaining.delete(first);
    const c = [first];
    for (let i = 0; i < c.length; i++)
      for (const b of s.bonds) {
        if (b.kind !== 'covalent' || ex.has(`${b.a}|${b.b}`)) continue;
        const n = b.a === c[i] ? b.b : b.b === c[i] ? b.a : null;
        if (n && remaining.delete(n)) c.push(n);
      }
    out.push(c);
  }
  return out;
}
export function iodine(separation: number): Structure {
  const atoms: Atom[] = [],
    bonds: Bond[] = [];
  const q = smooth(separation);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const id = `${i}:${j}`,
        c = { x: (i - 1) * 4, y: (j - 1) * 4, z: 0 };
      const move = id === '2:0' ? { x: 3 * q, y: -2 * q, z: 0 } : { x: 0, y: 0, z: 0 };
      const angle = (i + j) % 2 ? Math.PI / 3 : -Math.PI / 3;
      for (let h = 0; h < 2; h++)
        atoms.push({
          id: `${id}:${h}`,
          element: 'I',
          p: add(add(c, move), {
            x: (h - 0.5) * 2.666 * Math.cos(angle),
            y: (h - 0.5) * 2.666 * Math.sin(angle),
            z: 0,
          }),
          level: id === '2:0' ? 0 : 2,
        });
      bonds.push({ a: `${id}:0`, b: `${id}:1`, kind: 'covalent' });
    }
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (const [di, dj] of [
        [1, 0],
        [0, 1],
      ])
        if (i + di < 3 && j + dj < 3) {
          const ids = [`${i}:${j}`, `${i + di}:${j + dj}`];
          let best = [atoms[0], atoms[1]],
            d = Infinity;
          for (let a = 0; a < 2; a++)
            for (let b = 0; b < 2; b++) {
              const p = atoms.find((v) => v.id === `${ids[0]}:${a}`)!,
                r = atoms.find((v) => v.id === `${ids[1]}:${b}`)!;
              const dist = length(sub(p.p, r.p));
              if (dist < d) {
                d = dist;
                best = [p, r];
              }
            }
          bonds.push({
            a: best[0].id,
            b: best[1].id,
            kind: 'intermolecular',
            opacity: ids.includes('2:0') ? 1 - q : 1,
          });
        }
  return { atoms, bonds, focus: '2:0:0' };
}
export function waterShell(): Structure {
  const ws = ice.filter((w) => shellIds.includes(w.id)),
    center = ws.find((w) => w.id === centralId)!.o;
  const atoms: Atom[] = ws.flatMap((w) => [
    { id: w.id, element: 'O' as const, p: sub(w.o, center), level: w.id === centralId ? 0 : 2 },
    ...w.h.map((h, i) => ({
      id: `${w.id}:h${i}`,
      element: 'H' as const,
      p: sub(h, center),
      level: w.id === centralId ? 1 : 2,
    })),
  ]);
  const bonds: Bond[] = ws.flatMap((w) =>
    w.h.map((_, i) => ({ a: w.id, b: `${w.id}:h${i}`, kind: 'covalent' as const })),
  );
  for (const h of hydrogenLinks(ws))
    bonds.push({ a: `${h.from}:h${h.h}`, b: h.to, kind: 'hydrogen' });
  return { atoms, bonds, focus: centralId };
}
export const water = waterShell();
export const cleavageNormal = unit({ x: 1, y: 1, z: 1 });
const side = (p: V) => (p.x + p.y + p.z > 0.7 ? 1 : -1);
export const cutBonds = diamond.bonds.filter(
  (b) =>
    side(diamond.atoms.find((a) => a.id === b.a)!.p) !==
    side(diamond.atoms.find((a) => a.id === b.b)!.p),
);
export function cleave(progress: number) {
  const faded = smooth(progress / 0.4),
    gap = 1.7 * smooth((progress - 0.4) / 0.6);
  const atoms = diamond.atoms.map((a) => ({
    ...a,
    p: add(a.p, mul(cleavageNormal, side(a.p) * gap)),
  }));
  return {
    structure: {
      ...diamond,
      atoms,
      outside: diamond.outside?.map((a) => ({
        ...a,
        p: add(a.p, mul(cleavageNormal, side(a.p) * gap)),
      })),
      boundary: diamond.boundary?.filter(
        (b) =>
          faded < 1 ||
          side(
            diamond.atoms.find((a) => a.id === b.a)?.p ??
              diamond.outside!.find((a) => a.id === b.a)!.p,
          ) ===
            side(
              diamond.atoms.find((a) => a.id === b.b)?.p ??
                diamond.outside!.find((a) => a.id === b.b)!.p,
            ),
      ),
      bonds: diamond.bonds.map((b) => ({ ...b, opacity: cutBonds.includes(b) ? 1 - faded : 1 })),
    },
    gap,
    broken: faded === 1 ? cutBonds.length : 0,
    cutBonds,
  };
}
export const atomicRadius: Record<Element, number> = {
  I: 0.42,
  O: 0.24,
  H: 0.13,
  C: 0.23,
  Si: 0.32,
};
export const atomColor: Record<Element, string> = {
  I: '#86769c',
  O: '#bb7770',
  H: '#faf6e8',
  C: '#566d70',
  Si: '#bcad76',
};
