/** Deterministic toy coexistence schedule: Bluetooth Classic-like 1 MHz channels, not protocol emulation. */
export function coexistenceSchedule({
  bluetooth = true,
  adaptive = false,
  wifi5 = false,
  duty = 0.7,
  slots = 160,
}: {
  bluetooth?: boolean;
  adaptive?: boolean;
  wifi5?: boolean;
  duty?: number;
  slots?: number;
} = {}) {
  const channels = Array.from({ length: 79 }, (_, i) => 2402 + i).filter(
    (f) => !adaptive || wifi5 || Math.abs(f - 2437) > 12,
  );
  const hash = (i: number) => {
    let n = ((i + 17) * 2654435761) >>> 0;
    n ^= n >>> 13;
    n = Math.imul(n, 1597334677);
    return (n >>> 0) / 4294967296;
  };
  const events = Array.from({ length: Math.max(0, Math.floor(slots)) }, (_, i) => {
    const frequency = channels[Math.floor(hash(i) * channels.length)],
      active = bluetooth && hash(i + 431) < Math.max(0, Math.min(1, duty)),
      wifi = i % 4 < 2;
    return {
      slot: i,
      frequency,
      active,
      wifi,
      collision: active && wifi && !wifi5 && Math.abs(frequency - 2437) < 10.5,
    };
  });
  const packets = Array.from({ length: Math.floor(events.length / 4) }, (_, i) => ({
    index: i,
    collision: events.slice(i * 4, i * 4 + 2).some((e) => e.collision),
  }));
  const lost = packets.filter((p) => p.collision).length;
  return {
    events,
    packets,
    lost,
    delivered: packets.length - lost,
    relativeDelivery: packets.length ? (packets.length - lost) / packets.length : 1,
    channels,
  };
}
export function summarizeRepeated(values: number[]) {
  const finite = values.filter((v) => Number.isFinite(v) && v >= 0),
    n = finite.length;
  const mean = n ? finite.reduce((a, b) => a + b, 0) / n : 0;
  const spread =
    n > 1 ? Math.sqrt(finite.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1)) : 0;
  return { count: n, mean, spread };
}
