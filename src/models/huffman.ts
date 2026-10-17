/** Binary Huffman coding. Tie order is deterministic, not part of the optimality claim. */
export type HuffmanNode = {
  id: number;
  weight: number;
  symbol?: string;
  left?: HuffmanNode;
  right?: HuffmanNode;
};
export type HuffmanMerge = {
  forest: HuffmanNode[];
  left: number;
  right: number;
  parent: HuffmanNode;
};
export const HUFFMAN_TEXT = 'BANANA_BANDANA';
export function huffman(text: string) {
  const symbols = Array.from(text);
  if (symbols.length > 80) throw new RangeError('Teaching trace is limited to 80 symbols');
  const counts = new Map<string, number>();
  symbols.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));
  let id = 0;
  const leaves = [...counts]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([symbol, weight]) => ({ id: id++, symbol, weight }) as HuffmanNode);
  const queue = [...leaves],
    merges: HuffmanMerge[] = [];
  const order = () => queue.sort((a, b) => a.weight - b.weight || a.id - b.id);
  order();
  while (queue.length > 1) {
    const forest = [...queue],
      left = queue.shift()!,
      right = queue.shift()!;
    const parent = { id: id++, weight: left.weight + right.weight, left, right };
    merges.push({ forest, left: left.id, right: right.id, parent });
    queue.push(parent);
    order();
  }
  const root = queue[0],
    codes: Record<string, string> = {};
  const visit = (n: HuffmanNode, path: string) => {
    if (n.symbol !== undefined) codes[n.symbol] = path || '0';
    else {
      visit(n.left!, path + '0');
      visit(n.right!, path + '1');
    }
  };
  if (root) visit(root, '');
  const bits = symbols.map((s) => codes[s]).join('');
  return {
    symbols,
    leaves,
    merges,
    root,
    codes,
    bits,
    fixedBits: symbols.length * Math.max(1, Math.ceil(Math.log2(leaves.length || 1))),
  };
}
export function huffmanDecode(bits: string, root: HuffmanNode | undefined) {
  if (!/^[01]*$/.test(bits)) throw new RangeError('Binary input required');
  if (!root) {
    if (bits) throw new RangeError('Missing tree');
    return '';
  }
  if (root.symbol !== undefined) {
    if (bits.includes('1')) throw new RangeError('Invalid single-symbol code');
    return root.symbol.repeat(bits.length);
  }
  let node = root,
    out = '';
  for (const bit of bits) {
    node = (bit === '0' ? node.left : node.right)!;
    if (!node) throw new RangeError('Invalid path');
    if (node.symbol !== undefined) {
      out += node.symbol;
      node = root;
    }
  }
  if (node !== root) throw new RangeError('Incomplete final symbol');
  return out;
}
export function huffmanLayout(root: HuffmanNode | undefined) {
  const nodes: { node: HuffmanNode; x: number; y: number; path: string }[] = [];
  let leaf = 0,
    maxDepth = 0;
  function walk(node: HuffmanNode, depth: number, path: string): number {
    maxDepth = Math.max(depth, maxDepth);
    const x =
      node.symbol !== undefined
        ? leaf++
        : (walk(node.left!, depth + 1, path + '0') + walk(node.right!, depth + 1, path + '1')) / 2;
    nodes.push({ node, x, y: depth, path });
    return x;
  }
  if (root) walk(root, 0, '');
  return nodes.map((n) => ({
    ...n,
    x: 10 + (n.x / Math.max(1, leaf - 1)) * 80,
    y: 8 + (n.y / Math.max(1, maxDepth)) * 80,
  }));
}
