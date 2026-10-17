/** A deterministic, fictional .test hierarchy. Each referral is returned to the resolver;
 * authoritative servers never forward the query. Network transit time is omitted. */
export type DnsNode = 'client' | 'resolver' | 'root' | 'tld' | 'authority';
export type DnsRecord = {
  key: 'test NS' | 'orchid.test NS' | 'www.orchid.test A';
  value: string;
  expiresAt: number;
  ttl: number;
};
export type DnsEvent = {
  from: DnsNode;
  to: DnsNode;
  kind: 'query' | 'referral' | 'answer';
  text: string;
  record?: DnsRecord;
  recursive?: boolean;
};
export const DNS_NAME = 'www.orchid.test';
export function dnsRemaining(record: DnsRecord, now: number) {
  return Math.max(0, record.expiresAt - now);
}
export function dnsResolve({
  now = 0,
  cache = [],
  ttl = 60,
  address = '203.0.113.7',
}: { now?: number; cache?: readonly DnsRecord[]; ttl?: number; address?: string } = {}) {
  if (!Number.isFinite(now) || now < 0 || !Number.isInteger(ttl) || ttl < 0 || ttl > 3600)
    throw new RangeError('Invalid DNS time or TTL');
  const records = cache.filter((r) => dnsRemaining(r, now) > 0).map((r) => ({ ...r }));
  const events: DnsEvent[] = [
    { from: 'client', to: 'resolver', kind: 'query', text: `${DNS_NAME} A`, recursive: true },
  ];
  const find = (key: DnsRecord['key']) => records.find((r) => r.key === key);
  const save = (key: DnsRecord['key'], value: string, lifetime: number) => {
    const record = { key, value, expiresAt: now + lifetime, ttl: lifetime };
    const old = records.findIndex((r) => r.key === key);
    if (old >= 0) records.splice(old, 1);
    if (lifetime > 0) records.push(record);
    return record;
  };
  const hit = find('www.orchid.test A');
  if (hit) {
    events.push({
      from: 'resolver',
      to: 'client',
      kind: 'answer',
      text: hit.value,
      record: { ...hit, ttl: dnsRemaining(hit, now) },
    });
    return { events, cache: records, address: hit.value, hit: true, upstreamQueries: 0 };
  }
  if (!find('orchid.test NS')) {
    if (!find('test NS')) {
      events.push({
        from: 'resolver',
        to: 'root',
        kind: 'query',
        text: `${DNS_NAME} A`,
        recursive: false,
      });
      const record = save('test NS', 'ns.test', 3600);
      events.push({
        from: 'root',
        to: 'resolver',
        kind: 'referral',
        text: 'test NS → ns.test',
        record,
      });
    }
    events.push({
      from: 'resolver',
      to: 'tld',
      kind: 'query',
      text: `${DNS_NAME} A`,
      recursive: false,
    });
    const record = save('orchid.test NS', 'ns.orchid.test', 3600);
    events.push({
      from: 'tld',
      to: 'resolver',
      kind: 'referral',
      text: 'orchid.test NS → ns.orchid.test',
      record,
    });
  }
  events.push({
    from: 'resolver',
    to: 'authority',
    kind: 'query',
    text: `${DNS_NAME} A`,
    recursive: false,
  });
  const record = save('www.orchid.test A', address, ttl);
  events.push({ from: 'authority', to: 'resolver', kind: 'answer', text: address, record });
  events.push({ from: 'resolver', to: 'client', kind: 'answer', text: address, record });
  return {
    events,
    cache: records,
    address,
    hit: false,
    upstreamQueries: events.filter((e) => e.kind === 'query' && e.from === 'resolver').length,
  };
}
