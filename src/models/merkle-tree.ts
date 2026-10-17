import { hashDigest, hashUtf8 } from './hash';
export type MerkleNode = {
  start: number;
  end: number;
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
};
export type MerkleProof = {
  index: number;
  size: number;
  steps: { hash: string; side: 'left' | 'right'; start: number; end: number }[];
};
export const MERKLE_DATA = ['alpha', 'beta', 'gamma', 'delta'];
const isHash = (s: string) => /^[0-9a-f]{64}$/i.test(s);
const bytes = (hex: string) => {
  if (!isHash(hex)) throw new RangeError('Expected SHA-256 digest');
  return Uint8Array.from(hex.match(/../g)!.map((v) => parseInt(v, 16)));
};
export const merkleLeaf = (text: string) => {
  const data = hashUtf8(text);
  if (data.length > 128) throw new RangeError('Leaf byte limit');
  return hashDigest(Uint8Array.from([0, ...data]));
};
export const merkleParent = (left: string, right: string) =>
  hashDigest(Uint8Array.from([1, ...bytes(left), ...bytes(right)]));
const split = (n: number) => {
  let k = 1;
  while (k * 2 < n) k *= 2;
  return k;
};
export function merkleTree(data: readonly string[]) {
  if (data.length > 32) throw new RangeError('Tree size limit');
  const build = (start: number, end: number): MerkleNode => {
    if (end === start) return { start, end, hash: hashDigest([]) };
    if (end - start === 1) return { start, end, hash: merkleLeaf(data[start]) };
    const mid = start + split(end - start),
      left = build(start, mid),
      right = build(mid, end);
    return { start, end, hash: merkleParent(left.hash, right.hash), left, right };
  };
  return { data: [...data], root: build(0, data.length) };
}
export function merkleProof(tree: ReturnType<typeof merkleTree>, index: number): MerkleProof {
  if (!Number.isInteger(index) || index < 0 || index >= tree.data.length)
    throw new RangeError('Invalid leaf index');
  const steps: MerkleProof['steps'] = [];
  const visit = (node: MerkleNode) => {
    if (!node.left || !node.right) return;
    const left = index < node.left.end,
      sibling = left ? node.right : node.left;
    visit(left ? node.left : node.right);
    steps.push({
      hash: sibling.hash,
      side: left ? 'right' : 'left',
      start: sibling.start,
      end: sibling.end,
    });
  };
  visit(tree.root);
  return { index, size: tree.data.length, steps };
}
export function merkleVerify(text: string, proof: MerkleProof, expectedRoot: string) {
  if (
    !Number.isInteger(proof.size) ||
    proof.size < 1 ||
    proof.size > 32 ||
    !Number.isInteger(proof.index) ||
    proof.index < 0 ||
    proof.index >= proof.size ||
    !isHash(expectedRoot)
  )
    throw new RangeError('Invalid proof position or root');
  const shape: { side: 'left' | 'right'; start: number; end: number }[] = [];
  const visit = (start: number, end: number) => {
    if (end - start <= 1) return;
    const mid = start + split(end - start);
    if (proof.index < mid) {
      visit(start, mid);
      shape.push({ side: 'right', start: mid, end });
    } else {
      visit(mid, end);
      shape.push({ side: 'left', start, end: mid });
    }
  };
  visit(0, proof.size);
  if (
    shape.length !== proof.steps.length ||
    shape.some(
      (expected, i) =>
        expected.side !== proof.steps[i].side ||
        expected.start !== proof.steps[i].start ||
        expected.end !== proof.steps[i].end ||
        !isHash(proof.steps[i].hash),
    )
  )
    throw new RangeError('Proof shape does not match index and tree size');
  let hash = merkleLeaf(text);
  const steps: { before: string; sibling: string; side: 'left' | 'right'; hash: string }[] = [];
  for (const sibling of proof.steps) {
    const before = hash;
    hash =
      sibling.side === 'left' ? merkleParent(sibling.hash, hash) : merkleParent(hash, sibling.hash);
    steps.push({ before, sibling: sibling.hash, side: sibling.side, hash });
  }
  return { root: hash, valid: hash === expectedRoot.toLowerCase(), steps };
}
export function merkleNodes(root: MerkleNode): MerkleNode[] {
  return [
    root,
    ...(root.left ? merkleNodes(root.left) : []),
    ...(root.right ? merkleNodes(root.right) : []),
  ];
}
