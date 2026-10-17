import { describe, expect, it } from 'vitest';
import { dnsRemaining, dnsResolve } from './dns-resolution';
describe('DNS resolution and independently aged records', () => {
  it('returns each referral to the resolver, never chains authoritative servers', () => {
    const run = dnsResolve();
    expect(run.upstreamQueries).toBe(3);
    expect(
      run.events.filter((e) => e.kind === 'query').map((e) => [e.from, e.to, e.recursive]),
    ).toEqual([
      ['client', 'resolver', true],
      ['resolver', 'root', false],
      ['resolver', 'tld', false],
      ['resolver', 'authority', false],
    ]);
    expect(run.address).toBe('203.0.113.7');
  });
  it('serves a live address with a decreasing TTL without refreshing its expiration', () => {
    const cold = dnsResolve(),
      warm = dnsResolve({ now: 20, cache: cold.cache, address: '203.0.113.9' });
    expect(warm.hit).toBe(true);
    expect(warm.events).toHaveLength(2);
    expect(warm.address).toBe('203.0.113.7');
    expect(warm.events[1].record?.ttl).toBe(40);
    expect(warm.cache.find((r) => r.key.endsWith(' A'))?.expiresAt).toBe(60);
  });
  it('expires at the exact boundary but retains the closer live delegation', () => {
    const cold = dnsResolve(),
      expired = dnsResolve({ now: 60, cache: cold.cache, address: '203.0.113.9' });
    expect(expired.hit).toBe(false);
    expect(expired.upstreamQueries).toBe(1);
    expect(expired.events[1].to).toBe('authority');
    expect(expired.address).toBe('203.0.113.9');
    expect(dnsResolve({ now: 3600, cache: cold.cache }).upstreamQueries).toBe(3);
  });
  it('TTL zero is usable for this answer and never stored for another lookup', () => {
    const cold = dnsResolve({ ttl: 0 });
    expect(cold.cache.some((r) => r.key.endsWith(' A'))).toBe(false);
    expect(dnsResolve({ now: 0, cache: cold.cache }).upstreamQueries).toBe(1);
    expect(dnsRemaining({ key: 'test NS', value: '', ttl: 1, expiresAt: 1 }, 2)).toBe(0);
    expect(() => dnsResolve({ ttl: -1 })).toThrow(RangeError);
  });
});
