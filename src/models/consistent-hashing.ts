/** Reproducible clockwise successor hashing. Uniform-looking hashes are teaching input,
 * not a cryptographic guarantee. Membership changes do not rehash existing tokens or keys. */
export function ringHash(text: string) {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text)) {
    h = Math.imul(h ^ byte, 0x01000193) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
export type RingToken = { node: string; replica: number; position: number };
export const RING_NODES = ['A', 'B', 'C'];
export const RING_KEYS = Array.from(
  { length: 32 },
  (_, i) => `key-${String(i + 1).padStart(2, '0')}`,
);
export function ringTokens(nodes: readonly string[], replicas = 1): RingToken[] {
  if (
    !nodes.length ||
    nodes.length > 16 ||
    new Set(nodes).size !== nodes.length ||
    !Number.isInteger(replicas) ||
    replicas < 1 ||
    replicas > 32
  )
    throw new RangeError('Distinct nonempty membership and 1–32 replicas required');
  return nodes
    .flatMap((node) =>
      Array.from({ length: replicas }, (_, replica) => ({
        node,
        replica,
        position: ringHash(`node:${node}:${replica}`) / 2 ** 32,
      })),
    )
    .sort(
      (a, b) => a.position - b.position || a.node.localeCompare(b.node) || a.replica - b.replica,
    );
}
export function ringOwner(position: number, tokens: readonly RingToken[]) {
  if (!Number.isFinite(position) || position < 0 || position >= 1 || !tokens.length)
    throw new RangeError('Position must be in [0,1) with nonempty ring');
  return tokens.find((t) => t.position >= position) ?? tokens[0];
}
export function ringBuild(
  nodes: readonly string[] = RING_NODES,
  replicas = 1,
  keys: readonly string[] = RING_KEYS,
) {
  const tokens = ringTokens(nodes, replicas),
    assignments = keys.map((key) => {
      const position = ringHash(`key:${key}`) / 2 ** 32;
      return {
        key,
        position,
        owner: ringOwner(position, tokens).node,
        token: ringOwner(position, tokens),
      };
    });
  const loads = Object.fromEntries(
    nodes.map((node) => [node, assignments.filter((a) => a.owner === node).length]),
  );
  return { nodes: [...nodes], replicas, tokens, assignments, loads };
}
export function ringCompare(
  before: ReturnType<typeof ringBuild>,
  after: ReturnType<typeof ringBuild>,
) {
  return before.assignments.map((a) => {
    const b = after.assignments.find((b) => b.key === a.key);
    if (!b || b.position !== a.position)
      throw new RangeError('Compare identical keys and hash positions');
    return {
      key: a.key,
      position: a.position,
      before: a.owner,
      after: b.owner,
      changed: a.owner !== b.owner,
    };
  });
}
export function ringPoint(position: number, radius = 110, center = 160) {
  const a = position * Math.PI * 2;
  return { x: center + Math.sin(a) * radius, y: center - Math.cos(a) * radius };
}
export function ringArc(from: number, to: number, radius = 110) {
  const span = (to - from + 1) % 1,
    a = ringPoint(from, radius),
    b = ringPoint(to, radius);
  return `M${a.x} ${a.y} A${radius} ${radius} 0 ${span > 0.5 ? 1 : 0} 1 ${b.x} ${b.y}`;
}
export function ringInterval(token: RingToken, tokens: readonly RingToken[]) {
  const i = tokens.indexOf(token);
  if (i < 0) throw new RangeError('Token not in ring');
  return { from: tokens[(i - 1 + tokens.length) % tokens.length].position, to: token.position };
}
export function moduloChanges(keys: readonly string[] = RING_KEYS) {
  return keys.map((key) => {
    const hash = ringHash(`key:${key}`);
    return {
      key,
      before: RING_NODES[hash % 3],
      after: [...RING_NODES, 'D'][hash % 4],
      changed: hash % 3 !== hash % 4,
    };
  });
}
