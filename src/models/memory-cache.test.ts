import { describe, expect, it } from 'vitest';
import {
  CACHE_DEFAULT,
  CACHE_MEMORY,
  CACHE_TRACES,
  cacheAddress,
  cacheGeometry,
  cachePhoneBases,
  cacheReference,
  cacheShot,
  cacheView,
  createCache,
  makeCacheStory,
  readCache,
  runCache,
  seekCache,
  type CacheConfig,
} from './memory-cache';

describe('memory address atlas and deterministic cache', () => {
  it('round-trips every six-bit address under every supported power-of-two geometry', () => {
    for (const capacity of [4, 8, 16, 32, 64])
      for (const lineBytes of [1, 2, 4, 8, 16])
        for (const ways of [1, 2, 4, 8]) {
          if (lineBytes * ways > capacity) continue;
          const config = { capacity, lineBytes, ways },
            g = cacheGeometry(config);
          expect(g.lines * lineBytes).toBe(capacity);
          for (let address = 0; address < 64; address++) {
            const part = cacheAddress(address, config);
            expect((part.tag * g.sets + part.set) * lineBytes + part.offset).toBe(address);
            expect(parseInt(part.tagBits + part.setBits + part.offsetBits, 2)).toBe(address);
            expect(part.end - part.base + 1).toBe(lineBytes);
          }
        }
    expect(cacheAddress(18)).toMatchObject({
      tag: 1,
      set: 0,
      offset: 2,
      base: 16,
      end: 19,
      tagBits: '01',
      setBits: '00',
      offsetBits: '10',
    });
  });

  it('requires valid AND matching tag, and loads every byte of the aligned line', () => {
    const cold = createCache(),
      read = readCache(cold, 1);
    expect(cold.sets[0][0].tag).toBe(0);
    expect(read.event?.hit).toBe(false);
    expect(read.event?.fetched).toEqual([0, 1, 2, 3]);
    expect(read.sets[0][0]).toMatchObject({
      valid: true,
      tag: 0,
      block: 0,
      bytes: CACHE_MEMORY.slice(0, 4),
    });
    expect(read.returned).toEqual([CACHE_MEMORY[1]]);
    expect(cold.sets[0][0].valid).toBe(false);
    expect(readCache(read, 2).event?.hit).toBe(true);
  });

  it('exposes spatial and temporal locality without changing address identities', () => {
    const spatial = runCache(CACHE_TRACES.spatial),
      temporal = runCache(CACHE_TRACES.temporal);
    expect(spatial.slice(1).map((s) => s.event!.hit)).toEqual([
      false,
      true,
      true,
      true,
      false,
      true,
      true,
      true,
    ]);
    expect(spatial.at(-1)).toMatchObject({ hits: 6, misses: 2, fetchedBytes: 8, evictions: 0 });
    expect(temporal.at(-1)).toMatchObject({ hits: 7, misses: 1, fetchedBytes: 4 });
    expect(spatial.at(-1)!.returned).toEqual(CACHE_TRACES.spatial.map((a) => CACHE_MEMORY[a]));
    expect(temporal.at(-1)!.returned).toEqual(CACHE_TRACES.temporal.map((a) => CACHE_MEMORY[a]));
  });

  it('compares the SAME conflict trace and capacity with exact evictions', () => {
    const direct = runCache(CACHE_TRACES.conflict),
      twoWay = runCache(CACHE_TRACES.conflict, { ...CACHE_DEFAULT, ways: 2 });
    expect(direct.at(-1)).toMatchObject({ hits: 0, misses: 6, evictions: 5, fetchedBytes: 24 });
    expect(twoWay.at(-1)).toMatchObject({ hits: 4, misses: 2, evictions: 0, fetchedBytes: 8 });
    expect(direct.at(-1)!.returned).toEqual(twoWay.at(-1)!.returned);
    expect(direct.slice(2).map((f) => f.event!.evicted!.base)).toEqual([0, 16, 0, 16, 0]);
    expect(
      direct
        .at(-1)!
        .sets.flat()
        .filter((l) => l.valid),
    ).toHaveLength(1);
    expect(direct[1].config.capacity).toBe(twoWay[1].config.capacity);
  });

  it('replaces the least RECENTLY used line, not the earliest inserted line', () => {
    const frames = runCache(CACHE_TRACES.replacement, { ...CACHE_DEFAULT, ways: 2 });
    expect(frames[3].event!.hit).toBe(true);
    expect(frames[4].event!.evicted).toMatchObject({ base: 16, lastUsed: 2 });
    expect(frames[5].event!.evicted).toMatchObject({ base: 0, lastUsed: 3 });
    expect(frames.at(-1)).toMatchObject({ hits: 1, misses: 4, evictions: 2 });
  });

  it('keeps data capacity fixed when comparing line sizes and counts actual byte traffic', () => {
    const config = { ...CACHE_DEFAULT, lineBytes: 1 };
    for (const addresses of [CACHE_TRACES.spatial, CACHE_TRACES.stride]) {
      const bytes = runCache(addresses, config).at(-1)!,
        lines = runCache(addresses).at(-1)!;
      expect(bytes.config.capacity).toBe(lines.config.capacity);
      expect(bytes.returned).toEqual(lines.returned);
      expect(bytes.fetchedBytes).toBe(bytes.misses * config.lineBytes);
      expect(lines.fetchedBytes).toBe(lines.misses * CACHE_DEFAULT.lineBytes);
    }
    expect(runCache(CACHE_TRACES.spatial, config).at(-1)).toMatchObject({
      hits: 0,
      misses: 8,
      fetchedBytes: 8,
    });
    expect(runCache(CACHE_TRACES.stride).at(-1)).toMatchObject({
      hits: 0,
      misses: 8,
      fetchedBytes: 32,
    });
    expect(runCache(CACHE_TRACES.stride, config).at(-1)).toMatchObject({
      hits: 0,
      misses: 8,
      fetchedBytes: 8,
    });
  });

  it('matches an independent queue-based LRU reference on 240 varied traces', () => {
    let seed = 7727;
    const next = (max: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return (seed >>> 8) % max;
    };
    for (let test = 0; test < 240; test++) {
      const capacity = [4, 8, 16, 32][next(4)],
        lineBytes = [1, 2, 4][next(3)];
      const choices = [1, 2, 4].filter((w) => w * lineBytes <= capacity);
      const config: CacheConfig = { capacity, lineBytes, ways: choices[next(choices.length)] };
      const addresses = Array.from({ length: 70 }, (_, i) => (i % 3 ? next(64) : (i * 16) % 64));
      const expected = cacheReference(addresses, config),
        frames = runCache(addresses, config);
      expect(
        frames.slice(1).map((s) => ({
          address: s.event!.address,
          hit: s.event!.hit,
          evictedBase: s.event!.evicted?.base ?? null,
          value: s.event!.value,
        })),
      ).toEqual(expected);
      for (const state of frames) {
        expect(state.hits + state.misses).toBe(state.accesses);
        expect(state.fetchedBytes).toBe(state.misses * lineBytes);
        const valid = state.sets.flat().filter((l) => l.valid);
        expect(new Set(valid.map((l) => l.block)).size).toBe(valid.length);
        expect(valid.length * lineBytes).toBeLessThanOrEqual(capacity);
        for (const line of valid)
          expect(line.bytes).toEqual(
            CACHE_MEMORY.slice(line.block! * lineBytes, (line.block! + 1) * lineBytes),
          );
      }
    }
  });

  it('rebuilds every earlier state by direct seek without mutating history', () => {
    for (const ways of [1, 2, 4]) {
      const config = { ...CACHE_DEFAULT, ways },
        frames = runCache(CACHE_TRACES.replacement, config),
        original = JSON.stringify(frames);
      for (let i = frames.length - 1; i >= 0; i--)
        expect(seekCache(CACHE_TRACES.replacement, i, config)).toEqual(frames[i]);
      expect(JSON.stringify(frames)).toBe(original);
    }
    const story = makeCacheStory();
    for (let chapter = 7; chapter >= 0; chapter--)
      for (const p of [1, 0.9, 0.72, 0.4, 0]) {
        const shot = cacheShot(chapter, p, story),
          s = shot.view.state;
        expect(s).toEqual(seekCache(shot.addresses, s.accesses, s.config));
        expect(shot.view.event?.value).toBe(CACHE_MEMORY[shot.view.event!.address]);
      }
  });

  it('keeps transfer presentation and metrics consistent, including phone address windows', () => {
    const frames = runCache([18, 19]);
    expect(cacheView(frames, 0.1).phase).toBe('lookup');
    expect(cacheView(frames, 0.5).phase).toBe('transfer');
    expect(cacheView(frames, 0.5).state.misses).toBe(0);
    expect(cacheView(frames, 0.8).state.misses).toBe(1);
    expect(cacheView(frames, 1.5).phase).toBe('hit');
    expect(cacheView(frames, 2).state.hits).toBe(1);
    expect(cacheView(frames, 1, true)).toMatchObject({
      phase: 'return',
      state: { accesses: 1 },
      event: { id: 1, address: 18 },
    });
    expect(
      cachePhoneBases(runCache(CACHE_TRACES.replacement, { ...CACHE_DEFAULT, ways: 2 })[4].event),
    ).toEqual([0, 16, 32, 36]);
    for (let a = 0; a < 64; a++) {
      const event = readCache(createCache(), a).event,
        bases = cachePhoneBases(event);
      expect(bases).toHaveLength(4);
      expect(bases).toContain(a - (a % 4));
      expect(bases.every((b) => b >= 0 && b <= 60 && b % 4 === 0)).toBe(true);
    }
  });

  it('validates inputs and supports empty traces, address boundaries and one-set caches', () => {
    expect(runCache([])).toHaveLength(1);
    for (const address of [-1, 64, 0.5, NaN, Infinity])
      expect(() => readCache(createCache(), address)).toThrow();
    for (const c of [
      { capacity: 12, lineBytes: 4, ways: 1 },
      { capacity: 16, lineBytes: 4, ways: 8 },
      { capacity: 16, lineBytes: 0, ways: 1 },
    ])
      expect(() => createCache(c)).toThrow();
    expect(() => createCache(CACHE_DEFAULT, [0])).toThrow();
    expect(() => createCache(CACHE_DEFAULT, Array(64).fill(256))).toThrow();
    expect(() => seekCache([], NaN)).toThrow();
    expect(() => runCache(Array(4097).fill(0))).toThrow();
    expect(cacheAddress(63, { capacity: 16, lineBytes: 4, ways: 4 }).setBits).toBe('');
    expect(runCache([63, 60], { capacity: 16, lineBytes: 4, ways: 4 }).at(-1)!.hits).toBe(1);
  });
});
