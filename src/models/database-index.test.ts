import { describe, expect, it } from 'vitest';
import {
  diBuild,
  diCompare,
  diDataset,
  diEmpty,
  diFilm,
  diHeight,
  diInsert,
  diLeaves,
  diParse,
  diQuery,
  diShot,
  type DiEntry,
  type DiTree,
} from './database-index';
function invariants(tree: DiTree) {
  const seen = new Set<number>(),
    depths: number[] = [],
    ordered: DiEntry[] = [];
  function walk(id: number, depth: number): DiEntry[] {
    expect(seen.has(id)).toBe(false);
    seen.add(id);
    const p = tree.pages[id];
    expect(p.id).toBe(id);
    if (p.kind === 'leaf') {
      expect(p.entries.length).toBeLessThanOrEqual(3);
      if (id !== tree.root) expect(p.entries.length).toBeGreaterThanOrEqual(2);
      expect(p.entries).toEqual([...p.entries].sort((a, b) => a.key - b.key || a.rowId - b.rowId));
      ordered.push(...p.entries);
      depths.push(depth);
      return p.entries;
    }
    expect(p.children.length).toBeGreaterThanOrEqual(2);
    expect(p.children.length).toBeLessThanOrEqual(4);
    expect(p.keys.length).toBe(p.children.length - 1);
    const children = p.children.map((child) => walk(child, depth + 1));
    expect(p.keys).toEqual(children.slice(1).map((entries) => entries[0]));
    for (let i = 1; i < children.length; i++)
      expect(diCompare(children[i - 1].at(-1)!, children[i][0])).toBe(-1);
    return children.flat();
  }
  walk(tree.root, 1);
  expect(new Set(depths).size).toBe(1);
  expect(depths[0]).toBe(diHeight(tree));
  expect(seen.size).toBe(Object.keys(tree.pages).length);
  expect(diLeaves(tree).flatMap((l) => l.entries)).toEqual(ordered);
  expect(ordered).toEqual(
    tree.rows
      .map(({ key, rowId }) => ({ key, rowId }))
      .sort((a, b) => a.key - b.key || a.rowId - b.rowId),
  );
  expect(tree.rows.map((r) => r.rowId)).toEqual(
    Array.from({ length: tree.rows.length }, (_, i) => i + 1),
  );
  tree.rows.forEach((r, i) => expect(r.heap).toBe(Math.floor(i / 4) + 1));
}
function reference(tree: DiTree, lo: number, hi: number) {
  return tree.rows
    .filter((row) => row.key >= lo && row.key <= hi)
    .sort((a, b) => a.key - b.key || a.rowId - b.rowId);
}
describe('database-index exact B+ tree', () => {
  it('checks every committed insertion: ascending, descending, duplicates and seeded orders', () => {
    const sequences = [
      Array.from({ length: 120 }, (_, i) => i),
      Array.from({ length: 120 }, (_, i) => 119 - i),
      Array(90).fill(42),
      ...Array.from({ length: 12 }, (_, seed) => diDataset(seed)),
    ];
    for (const keys of sequences) {
      let tree = diEmpty();
      invariants(tree);
      for (const key of keys) {
        tree = diInsert(tree, key).tree;
        invariants(tree);
      }
      expect(diQuery(tree, -1, 130).rows).toEqual(reference(tree, -1, 130));
    }
  });
  it('independently filters every inclusive range and equality, including all duplicate row identities', () => {
    for (let seed = 0; seed < 8; seed++) {
      const tree = diBuild(diDataset(seed));
      for (let low = 0; low <= 100; low++)
        for (let high = low; high <= 100; high += 7) {
          const expected = reference(tree, low, high);
          expect(diQuery(tree, low, high).rows).toEqual(expected);
          expect(diQuery(tree, low, high, 'scan').rows).toEqual(expected);
        }
      expect(diQuery(tree, 42).rows.length).toBe(3);
    }
    const duplicate = diBuild(Array(50).fill(7));
    expect(diQuery(duplicate, 7).rows.map((r) => r.rowId)).toEqual(
      Array.from({ length: 50 }, (_, i) => i + 1),
    );
  });
  it('counts actual logged comparator calls and distinct index/heap pages, including back-to-table reads', () => {
    const tree = diBuild(diDataset());
    for (const [lo, hi] of [
      [63, 63],
      [38, 47],
      [0, 99],
      [0, 0],
      [99, 99],
    ])
      for (const plan of ['scan', 'index'] as const) {
        const q = diQuery(tree, lo, hi, plan);
        expect(q.comparisons).toBe(q.steps.filter((s) => s.kind === 'compare').length);
        for (const space of ['index', 'heap'] as const)
          expect(space === 'index' ? q.indexPages : q.heapPages).toBe(
            new Set(
              q.steps.filter((s) => s.kind === 'page' && s.space === space).map((s) => s.page),
            ).size,
          );
        q.steps.forEach((s, i) => {
          expect(s.comparisons).toBe(
            q.steps.slice(0, i + 1).filter((s) => s.kind === 'compare').length,
          );
          if (s.kind === 'link') {
            const p = tree.pages[s.page];
            expect(p.kind === 'inner' ? p.children.includes(s.target!) : p.next === s.target).toBe(
              true,
            );
          }
        });
        expect(q.steps.at(-1)?.found.length).toBe(q.rows.length);
      }
    const a = diQuery(tree, 63),
      b = diQuery(tree, 63, 63, 'scan');
    expect([a.indexPages, a.heapPages, a.comparisons]).toEqual([4, 1, 11]);
    expect([b.indexPages, b.heapPages, b.comparisons]).toEqual([0, 6, 33]);
    expect(a.rows).toEqual(b.rows);
    expect(diQuery(tree, 0, 99).indexPages + diQuery(tree, 0, 99).heapPages).toBeGreaterThan(
      diQuery(tree, 0, 99, 'scan').heapPages,
    );
  });
  it('copies a leaf separator, promotes an internal separator, and creates a new root', () => {
    const f = diFilm();
    expect(f.additions.length).toBe(13);
    const last = f.additions.at(-1)!;
    expect(last.changes.map((c) => c.kind)).toEqual([
      'insert',
      'leaf-split',
      'parent',
      'internal-split',
      'parent',
      'internal-split',
      'root',
    ]);
    expect(diHeight(f.base)).toBe(3);
    expect(diHeight(f.grown)).toBe(4);
    for (const a of f.additions) {
      invariants(a.tree);
      for (const c of a.changes)
        if (c.kind === 'leaf-split' || c.kind === 'internal-split') {
          const left = c.tree.pages[c.page],
            right = c.tree.pages[c.right!];
          if (left.kind === 'leaf' && right.kind === 'leaf') {
            expect([...left.entries, ...right.entries]).toEqual((c.before as typeof left).entries);
            expect(right.entries[0]).toEqual(c.separator);
            expect(left.next).toBe(right.id);
          } else if (left.kind === 'inner' && right.kind === 'inner') {
            expect([...left.children, ...right.children]).toEqual(
              (c.before as typeof left).children,
            );
            expect([...left.keys, c.separator, ...right.keys]).toEqual(
              (c.before as typeof left).keys,
            );
            expect([...left.keys, ...right.keys]).not.toContainEqual(c.separator);
          }
        }
    }
  });
  it('keeps input trees and every split snapshot independent of subsequent writes', () => {
    const original = diBuild([4, 1, 7]),
      saved = JSON.stringify(original),
      inserted = diInsert(original, 8);
    const eventBytes = JSON.stringify(inserted.changes);
    diInsert(inserted.tree, 9);
    expect(JSON.stringify(original)).toBe(saved);
    expect(JSON.stringify(inserted.changes)).toBe(eventBytes);
    inserted.tree.rows[0].payload = 'changed';
    expect(original.rows[0].payload).not.toBe('changed');
    expect(inserted.changes[0].tree.rows[0].payload).not.toBe('changed');
  });
  it('reconstructs direct, backwards, replay and reset views independently of visit history', () => {
    const f = diFilm();
    const initial = JSON.stringify(f);
    const probes = Array.from({ length: 8 }, (_, c) =>
      Array.from({ length: 21 }, (_, i) => [c, i / 20] as const),
    ).flat();
    const expected = probes.map(([c, p]) => JSON.stringify(diShot(f, c, p)));
    for (let i = probes.length - 1; i >= 0; i--)
      expect(JSON.stringify(diShot(f, ...probes[i]))).toBe(expected[i]);
    expect(JSON.stringify(diFilm())).toBe(initial);
    expect(diShot(f, -1, -2)).toEqual(diShot(f, 0, 0));
    expect(diShot(f, 99, 3)).toEqual(diShot(f, 7, 1));
    expect(diShot(f, NaN, NaN)).toEqual(diShot(f, 0, 0));
  });
  it('handles empty/missing/boundary keys, validates inputs, and never conflates row IDs', () => {
    expect(diQuery(diEmpty(), 0).rows).toEqual([]);
    const tree = diBuild([-1_000_000, 0, 1_000_000]);
    invariants(tree);
    expect(diQuery(tree, -1_000_000, 1_000_000).rows.length).toBe(3);
    for (const bad of [NaN, Infinity, 1.5, 1_000_001])
      expect(() => diInsert(tree, bad)).toThrow(RangeError);
    expect(() => diQuery(tree, 8, 2)).toThrow(RangeError);
    expect(diParse('0')).toBe(0);
    expect(diParse('99')).toBe(99);
    for (const bad of ['', '-1', '100', '2.5', '3x']) expect(diParse(bad)).toBeNull();
  });
});
