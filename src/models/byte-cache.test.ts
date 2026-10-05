import { describe, expect, it } from 'vitest';
import { ByteCache } from './byte-cache';

describe('cache memory budget', () => {
  it('evicts the least recently used buffers until differently sized entries fit', () => {
    const cache = new ByteCache<string, Uint8Array>(100, (value) => value.byteLength);
    const a = new Uint8Array(40),
      b = new Uint8Array(30),
      c = new Uint8Array(50);
    cache.set('a', a);
    cache.set('b', b);
    expect(cache.get('a')).toBe(a);
    cache.set('c', c);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(a);
    expect(cache.get('c')).toBe(c);
    expect(cache.retainedBytes).toBe(90);
    cache.set('a', new Uint8Array(10));
    expect(cache.retainedBytes).toBe(60);
  });

  it('does not retain an oversized result or flush useful small results to make room for it', () => {
    const cache = new ByteCache<string, Uint8Array>(100, (value) => value.byteLength);
    const small = new Uint8Array(40);
    cache.set('small', small);
    cache.set('large', new Uint8Array(101));
    expect(cache.get('large')).toBeUndefined();
    expect(cache.get('small')).toBe(small);
    expect(cache.retainedBytes).toBe(40);
    cache.clear();
    expect(cache.retainedBytes).toBe(0);
    expect(cache.size).toBe(0);
  });
});
