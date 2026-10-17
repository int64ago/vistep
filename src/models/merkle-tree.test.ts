import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  MERKLE_DATA,
  merkleLeaf,
  merkleNodes,
  merkleParent,
  merkleProof,
  merkleTree,
  merkleVerify,
} from './merkle-tree';
const digest = (b: Uint8Array) => createHash('sha256').update(b).digest();
const reference = (data: readonly string[]): Buffer => {
  if (!data.length) return digest(new Uint8Array());
  if (data.length === 1)
    return digest(Buffer.concat([Buffer.from([0]), Buffer.from(data[0], 'utf8')]));
  let k = 1;
  while (k * 2 < data.length) k *= 2;
  return digest(
    Buffer.concat([Buffer.from([1]), reference(data.slice(0, k)), reference(data.slice(k))]),
  );
};
describe('ordered SHA-256 Merkle inclusion proofs', () => {
  it('matches independent Node SHA-256 recursive roots for every size0–32, including odd trees', () => {
    for (let n = 0; n <= 32; n++) {
      const data = Array.from({ length: n }, (_, i) => `entry-${i}-树`),
        tree = merkleTree(data);
      expect(tree.root.hash).toBe(reference(data).toString('hex'));
      if (n > 1) {
        let power = 1;
        while (power * 2 < n) power *= 2;
        expect(tree.root.left!.end).toBe(power);
      }
    }
    expect(merkleTree([]).root.hash).toBe(createHash('sha256').digest('hex'));
  });
  it('verifies every index for1–32 leaves, binding index, tree size and sibling order', () => {
    for (let n = 1; n <= 32; n++) {
      const data = Array.from({ length: n }, (_, i) => `item-${i}`),
        tree = merkleTree(data);
      for (let i = 0; i < n; i++) {
        const proof = merkleProof(tree, i),
          q = merkleVerify(data[i], proof, tree.root.hash);
        expect(q.valid).toBe(true);
        expect(proof.steps.length).toBeLessThanOrEqual(Math.ceil(Math.log2(n)));
        expect(merkleVerify(data[i] + '!', proof, tree.root.hash).valid).toBe(false);
      }
    }
    const tree = merkleTree(MERKLE_DATA),
      proof = merkleProof(tree, 2);
    expect(proof.steps.map((x) => [x.start, x.end, x.side])).toEqual([
      [3, 4, 'right'],
      [0, 2, 'left'],
    ]);
    expect(() => merkleVerify('gamma', { ...proof, index: 1 }, tree.root.hash)).toThrow(/shape/);
  });
  it('changes only the ancestors of an edited leaf and exposes why an untrusted replacement root is insufficient', () => {
    const original = merkleTree(MERKLE_DATA),
      changed = merkleTree(['alpha', 'beta', 'Gamma', 'delta']),
      a = merkleNodes(original.root),
      b = merkleNodes(changed.root);
    expect(a.filter((node, i) => node.hash !== b[i].hash).map((n) => [n.start, n.end])).toEqual([
      [0, 4],
      [2, 4],
      [2, 3],
    ]);
    const proof = merkleProof(original, 2);
    expect(merkleVerify('Gamma', proof, original.root.hash).valid).toBe(false);
    expect(merkleVerify('Gamma', proof, changed.root.hash).valid).toBe(true);
  });
  it('separates leaf/internal domains, hashes raw child bytes and rejects malformed proofs or bounds', () => {
    const a = merkleLeaf('a'),
      b = merkleLeaf('b');
    expect(merkleParent(a, b)).toBe(
      digest(
        Buffer.concat([Buffer.from([1]), Buffer.from(a, 'hex'), Buffer.from(b, 'hex')]),
      ).toString('hex'),
    );
    expect(merkleParent(a, b)).not.toBe(merkleParent(b, a));
    expect(() => merkleTree(Array(33).fill('x'))).toThrow();
    expect(() => merkleLeaf('a'.repeat(129))).toThrow();
    expect(() => merkleLeaf('\ud800')).toThrow();
    expect(() => merkleProof(merkleTree([]), 0)).toThrow();
    const tree = merkleTree(MERKLE_DATA),
      proof = merkleProof(tree, 2);
    expect(() =>
      merkleVerify('gamma', { ...proof, steps: proof.steps.slice(1) }, tree.root.hash),
    ).toThrow();
    expect(() => merkleParent('aa', b)).toThrow();
  });
});
