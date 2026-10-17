/** RTT-binned, ACK-clocked AIMD teaching model. Each bin delivers up to C packets;
 * all feedback is resolved at the bin boundary. Not a packet-level TCP implementation.
 * Loss response shows the post-recovery window, omitting Reno's temporary inflation. */
export type CongestionConfig = {
  capacity: number;
  buffer: number;
  rounds: number;
  initial: number;
  threshold: number;
  responsive: boolean;
};
export type CongestionRound = {
  round: number;
  before: number;
  after: number;
  threshold: number;
  phase: 'slow-start' | 'avoidance' | 'loss' | 'unresponsive';
  sent: number[];
  accepted: number[];
  dropped: number[];
  served: number[];
  queueBefore: number[];
  queue: number[];
  flight: number;
  queueDelay: number;
};
export const congestionDefaults = (): CongestionConfig => ({
  capacity: 4,
  buffer: 8,
  rounds: 28,
  initial: 1,
  threshold: 16,
  responsive: true,
});
export function congestionRun(config: CongestionConfig = congestionDefaults()) {
  const { capacity, buffer, rounds, initial, responsive } = config;
  if (
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > 12 ||
    !Number.isInteger(buffer) ||
    buffer < capacity ||
    buffer > 64 ||
    !Number.isInteger(rounds) ||
    rounds < 1 ||
    rounds > 100 ||
    !Number.isFinite(initial) ||
    initial < 1 ||
    initial > 64 ||
    !Number.isFinite(config.threshold) ||
    config.threshold < 2 ||
    config.threshold > 128
  )
    throw new RangeError('Invalid round-model bounds');
  let window = initial,
    threshold = config.threshold,
    id = 0;
  const queue: number[] = [],
    history: CongestionRound[] = [];
  for (let round = 0; round < rounds; round++) {
    const before = window,
      queueBefore = [...queue],
      sent: number[] = [],
      accepted: number[] = [],
      dropped: number[] = [];
    const count = Math.max(0, Math.floor(window) - queue.length);
    for (let i = 0; i < count; i++) {
      const packet = id++;
      sent.push(packet);
      if (queue.length < buffer) {
        queue.push(packet);
        accepted.push(packet);
      } else dropped.push(packet);
    }
    const flight = queueBefore.length + sent.length,
      served = queue.splice(0, capacity);
    let phase: CongestionRound['phase'] = responsive
      ? window < threshold
        ? 'slow-start'
        : 'avoidance'
      : 'unresponsive';
    if (responsive) {
      if (dropped.length) {
        threshold = Math.max(flight / 2, 2);
        window = threshold;
        phase = 'loss';
      } else for (const _ of served) window += window < threshold ? 1 : 1 / window;
    }
    history.push({
      round,
      before,
      after: window,
      threshold,
      phase,
      sent,
      accepted,
      dropped,
      served,
      queueBefore,
      queue: [...queue],
      flight,
      queueDelay: queue.length / capacity,
    });
  }
  return {
    config,
    history,
    sent: history.reduce((n, r) => n + r.sent.length, 0),
    delivered: history.reduce((n, r) => n + r.served.length, 0),
    dropped: history.reduce((n, r) => n + r.dropped.length, 0),
  };
}
export function congestionAt(run: ReturnType<typeof congestionRun>, round: number) {
  return run.history[Math.max(0, Math.min(run.history.length - 1, Math.floor(round)))];
}
