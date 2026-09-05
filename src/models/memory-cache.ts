/** Read-only toy cache: 64 byte main memory, exact LRU, cold start.
 * Capacity counts DATA bytes only (tags/valid/LRU storage excluded).
 * Address decomposition: offset = a % B; set = floor(a/B) % S;
 * tag = floor(a/(B*S)); C = B*S*ways. No timing model is implied.
 */
export const CACHE_MEMORY = Object.freeze(
  Array.from({ length: 64 }, (_, a) => (a * 37 + 11) % 256),
);
export type CacheConfig = { capacity: number; lineBytes: number; ways: number };
export const CACHE_DEFAULT: CacheConfig = { capacity: 16, lineBytes: 4, ways: 1 };
export type CacheLine = {
  valid: boolean;
  tag: number;
  block: number | null;
  bytes: number[];
  lastUsed: number;
};
export type CacheAddress = {
  address: number;
  block: number;
  base: number;
  end: number;
  set: number;
  tag: number;
  offset: number;
  tagBits: string;
  setBits: string;
  offsetBits: string;
};
export type CacheAccess = CacheAddress & {
  id: number;
  hit: boolean;
  way: number;
  value: number;
  evicted: {
    block: number;
    base: number;
    end: number;
    bytes: number[];
    lastUsed: number;
    tag: number;
  } | null;
  candidates: { way: number; valid: boolean; tag: number; matches: boolean; lastUsed: number }[];
  fetched: number[];
};
export type CacheState = {
  config: CacheConfig;
  memory: readonly number[];
  sets: CacheLine[][];
  accesses: number;
  hits: number;
  misses: number;
  evictions: number;
  fetchedBytes: number;
  returned: number[];
  event: CacheAccess | null;
};
const powerOfTwo = (n: number) => Number.isInteger(n) && n > 0 && n <= 64 && (n & (n - 1)) === 0;
export function cacheGeometry(config: CacheConfig) {
  const { capacity, lineBytes, ways } = config;
  if (
    ![capacity, lineBytes, ways].every(powerOfTwo) ||
    lineBytes > capacity ||
    ways * lineBytes > capacity
  )
    throw new RangeError('Cache requires powers of two and enough capacity for all ways');
  const lines = capacity / lineBytes,
    sets = lines / ways;
  return {
    lines,
    sets,
    offsetWidth: Math.log2(lineBytes),
    setWidth: Math.log2(sets),
    tagWidth: 6 - Math.log2(lineBytes) - Math.log2(sets),
  };
}
const addressCheck = (a: number) => {
  if (!Number.isInteger(a) || a < 0 || a >= 64)
    throw new RangeError('Expected a byte address from 0 to 63');
};
export function cacheAddress(address: number, config: CacheConfig = CACHE_DEFAULT): CacheAddress {
  addressCheck(address);
  const g = cacheGeometry(config),
    block = Math.floor(address / config.lineBytes);
  const base = block * config.lineBytes,
    set = block % g.sets,
    tag = Math.floor(block / g.sets),
    offset = address - base;
  const bits = (value: number, width: number) =>
    width ? value.toString(2).padStart(width, '0') : '';
  return {
    address,
    block,
    base,
    end: base + config.lineBytes - 1,
    set,
    tag,
    offset,
    tagBits: bits(tag, g.tagWidth),
    setBits: bits(set, g.setWidth),
    offsetBits: bits(offset, g.offsetWidth),
  };
}
export function createCache(
  config: CacheConfig = CACHE_DEFAULT,
  memory: readonly number[] = CACHE_MEMORY,
): CacheState {
  const g = cacheGeometry(config);
  if (memory.length !== 64 || memory.some((b) => !Number.isInteger(b) || b < 0 || b > 255))
    throw new RangeError('Expected exactly 64 byte values');
  return {
    config: { ...config },
    memory: [...memory],
    sets: Array.from({ length: g.sets }, () =>
      Array.from({ length: config.ways }, () => ({
        valid: false,
        tag: 0,
        block: null,
        bytes: [],
        lastUsed: 0,
      })),
    ),
    accesses: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    fetchedBytes: 0,
    returned: [],
    event: null,
  };
}
/** One pure read. A miss installs the complete aligned line, never just the byte. */
export function readCache(previous: CacheState, address: number): CacheState {
  const part = cacheAddress(address, previous.config),
    id = previous.accesses + 1;
  const sets = previous.sets.map((set) => set.map((line) => ({ ...line, bytes: [...line.bytes] })));
  const candidates = previous.sets[part.set].map((line, way) => ({
    way,
    valid: line.valid,
    tag: line.tag,
    matches: line.valid && line.tag === part.tag,
    lastUsed: line.lastUsed,
  }));
  let way = candidates.findIndex((c) => c.matches);
  const hit = way !== -1;
  if (!hit) {
    way = candidates.findIndex((c) => !c.valid);
    if (way === -1)
      way = candidates.reduce(
        (victim, c) => (c.lastUsed < candidates[victim].lastUsed ? c.way : victim),
        0,
      );
  }
  const victim = sets[part.set][way];
  const evicted =
    !hit && victim.valid
      ? {
          block: victim.block!,
          base: victim.block! * previous.config.lineBytes,
          end: (victim.block! + 1) * previous.config.lineBytes - 1,
          bytes: [...victim.bytes],
          lastUsed: victim.lastUsed,
          tag: victim.tag,
        }
      : null;
  if (!hit)
    sets[part.set][way] = {
      valid: true,
      tag: part.tag,
      block: part.block,
      bytes: previous.memory.slice(part.base, part.end + 1),
      lastUsed: id,
    };
  else sets[part.set][way].lastUsed = id;
  const value = sets[part.set][way].bytes[part.offset];
  return {
    ...previous,
    sets,
    accesses: id,
    hits: previous.hits + Number(hit),
    misses: previous.misses + Number(!hit),
    evictions: previous.evictions + Number(!!evicted),
    fetchedBytes: previous.fetchedBytes + (hit ? 0 : previous.config.lineBytes),
    returned: [...previous.returned, value],
    event: {
      ...part,
      id,
      hit,
      way,
      value,
      evicted,
      candidates,
      fetched: hit
        ? []
        : Array.from({ length: previous.config.lineBytes }, (_, i) => part.base + i),
    },
  };
}
export function runCache(
  addresses: readonly number[],
  config: CacheConfig = CACHE_DEFAULT,
  memory: readonly number[] = CACHE_MEMORY,
) {
  if (addresses.length > 4096) throw new RangeError('Trace exceeds teaching bound');
  const frames = [createCache(config, memory)];
  for (const address of addresses) frames.push(readCache(frames.at(-1)!, address));
  return frames;
}
export function seekCache(
  addresses: readonly number[],
  reads: number,
  config: CacheConfig = CACHE_DEFAULT,
  memory: readonly number[] = CACHE_MEMORY,
) {
  if (!Number.isFinite(reads) || reads < 0 || addresses.length > 4096)
    throw new RangeError('Invalid trace position');
  let state = createCache(config, memory);
  for (const address of addresses.slice(0, Math.floor(reads))) state = readCache(state, address);
  return state;
}
/** Independent reference: ordered block lists per set, no tags, slots or timestamps. */
export function cacheReference(
  addresses: readonly number[],
  config: CacheConfig = CACHE_DEFAULT,
  memory: readonly number[] = CACHE_MEMORY,
) {
  createCache(config, memory);
  if (addresses.length > 4096) throw new RangeError('Trace exceeds teaching bound');
  const buckets: number[][] = Array.from(
    { length: config.capacity / (config.lineBytes * config.ways) },
    () => [],
  );
  const results: { address: number; hit: boolean; evictedBase: number | null; value: number }[] =
    [];
  for (const a of addresses) {
    addressCheck(a);
    const base = a - (a % config.lineBytes),
      bucket = buckets[(base / config.lineBytes) % buckets.length];
    const found = bucket.indexOf(base),
      hit = found >= 0;
    let evictedBase: number | null = null;
    if (hit) bucket.splice(found, 1);
    else if (bucket.length === config.ways) evictedBase = bucket.shift()!;
    bucket.push(base);
    results.push({ address: a, hit, evictedBase, value: memory[a] });
  }
  return results;
}
export type CacheTraceName = 'spatial' | 'temporal' | 'conflict' | 'replacement' | 'stride';
export const CACHE_TRACES: Record<CacheTraceName, readonly number[]> = {
  spatial: [0, 1, 2, 3, 4, 5, 6, 7],
  temporal: [0, 1, 2, 3, 0, 2, 0, 3],
  conflict: [0, 16, 0, 16, 0, 16],
  replacement: [0, 16, 0, 32, 16],
  stride: [0, 16, 32, 48, 0, 16, 32, 48],
};
export type CacheView = {
  state: CacheState;
  before: CacheState;
  event: CacheAccess | null;
  phase: 'lookup' | 'transfer' | 'hit' | 'return';
  progress: number;
  cursor: number;
};
/** Slow presentation phases expose one real atomic read. Counters only change on return. */
export function cacheView(
  frames: CacheState[],
  cursor: number,
  completedBoundary = false,
): CacheView {
  if (!frames.length || !Number.isFinite(cursor))
    throw new RangeError('Invalid cache presentation');
  const last = frames.length - 1,
    safe = Math.max(0, Math.min(last, cursor));
  if (safe === last || (completedBoundary && safe > 0 && Number.isInteger(safe)))
    return {
      state: frames[safe],
      before: frames[Math.max(0, safe - 1)],
      event: frames[safe].event,
      phase: 'return',
      progress: 1,
      cursor: safe,
    };
  const index = Math.floor(safe),
    progress = safe - index,
    event = frames[index + 1].event!;
  const phase =
    progress < 0.23 ? 'lookup' : progress < 0.72 ? (event.hit ? 'hit' : 'transfer') : 'return';
  return {
    state: phase === 'return' ? frames[index + 1] : frames[index],
    before: frames[index],
    event,
    phase,
    progress,
    cursor: safe,
  };
}
export function cachePhoneBases(event: CacheAccess | null) {
  // Retain actual request, eviction and candidate identities in the narrow address window.
  const base = Math.floor((event?.address ?? 0) / 4) * 4;
  const related = event
    ? event.candidates
        .filter((c) => c.valid)
        .map(
          (c) =>
            Math.floor(
              ((c.tag * 2 ** event.setBits.length + event.set) * (event.end - event.base + 1)) / 4,
            ) * 4,
        )
    : [];
  return [
    ...new Set([
      base,
      ...(event?.evicted ? [Math.floor(event.evicted.base / 4) * 4] : []),
      ...related,
      base ^ 4,
      base ^ 16,
      base ^ 16 ^ 4,
    ]),
  ]
    .slice(0, 4)
    .sort((a, b) => a - b);
}
export type CacheStory = ReturnType<typeof makeCacheStory>;
export function makeCacheStory() {
  const twoWay = { ...CACHE_DEFAULT, ways: 2 },
    byteLine = { ...CACHE_DEFAULT, lineBytes: 1 };
  return {
    opening: runCache([1]),
    decode: runCache([18]),
    spatial: runCache(CACHE_TRACES.spatial),
    temporal: runCache(CACHE_TRACES.temporal),
    conflict: runCache(CACHE_TRACES.conflict),
    associative: runCache(CACHE_TRACES.conflict, twoWay),
    replacement: runCache(CACHE_TRACES.replacement, twoWay),
    bytes: runCache(CACHE_TRACES.spatial, byteLine),
  };
}
export function cacheShot(chapter: number, progress: number, story: CacheStory) {
  const c = Math.max(0, Math.min(7, Number.isFinite(chapter) ? Math.floor(chapter) : 0));
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const ramp = (start = 0.08, end = 0.9) => Math.max(0, Math.min(1, (p - start) / (end - start)));
  const keys = [
    'opening',
    'decode',
    'spatial',
    'temporal',
    'conflict',
    'associative',
    'replacement',
    'spatial',
  ] as const;
  const frames = story[keys[c]];
  let cursor = ramp() * (frames.length - 1);
  if (c === 0)
    cursor =
      p < 0.2
        ? p * 0.75
        : p < 0.7
          ? 0.23 + ((p - 0.2) / 0.5) * 0.48
          : 0.72 + ((p - 0.7) / 0.3) * 0.28;
  if (c === 1) cursor = ramp(0.4, 0.88);
  if (c === 6) cursor = ramp(0.04, 0.95) * 5;
  const compare = c === 5 ? ('associativity' as const) : c === 7 ? ('line-size' as const) : null;
  const otherFrames = c === 5 ? story.conflict : c === 7 ? story.bytes : null;
  return {
    chapter: c,
    view: cacheView(frames, cursor),
    frames,
    cursor,
    comparison: otherFrames ? cacheView(otherFrames, cursor) : null,
    otherFrames,
    compare,
    addresses: frames.slice(1).map((f) => f.event!.address),
    showRecency: c === 6,
    conclusion: c === 7 && p > 0.88,
  };
}
