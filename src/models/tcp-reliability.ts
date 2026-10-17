/** Deterministic byte-stream teaching model: cumulative ACK, bounded send/receive windows,
 * out-of-order buffering, one retransmission timer and duplicate suppression.
 * No handshake, SACK, congestion controller, RTT estimator or sequence wraparound. */
export type TcpConfig = {
  count: number;
  window: number;
  drop: number;
  reorder: boolean;
  loseAck: boolean;
  rto: number;
};
export const tcpDefaults = (): TcpConfig => ({
  count: 6,
  window: 4,
  drop: 1,
  reorder: false,
  loseAck: false,
  rto: 2,
});
export type TcpTransmission = {
  id: number;
  segment: number;
  seq: number;
  endSeq: number;
  sent: number;
  arrives: number;
  lost: boolean;
  retransmit: boolean;
};
export type TcpAck = { at: number; arrives: number; next: number; lost: boolean };
export type TcpState = {
  at: number;
  kind: 'send' | 'receive' | 'ack' | 'timeout';
  segment: number;
  next: number;
  base: number;
  sent: number;
  buffer: number[];
  delivered: number[];
  ack?: number;
  duplicate: boolean;
};
export function tcpSimulate(config: TcpConfig = tcpDefaults()) {
  const { count, window, drop, reorder, loseAck, rto } = config;
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 12 ||
    !Number.isInteger(window) ||
    window < 1 ||
    window > 6 ||
    !Number.isInteger(drop) ||
    drop < -1 ||
    drop >= count ||
    !Number.isFinite(rto) ||
    rto < 1 ||
    rto > 8
  )
    throw new RangeError('Invalid teaching configuration');
  type Event = {
    at: number;
    kind: 'send' | 'arrival' | 'ack' | 'timeout';
    segment: number;
    generation?: number;
    retransmit?: boolean;
    order: number;
  };
  const events: Event[] = [],
    transmissions: TcpTransmission[] = [],
    acks: TcpAck[] = [],
    states: TcpState[] = [];
  const received = new Set<number>(),
    delivered: number[] = [];
  let base = 0,
    sent = 0,
    queued = 0,
    wireReady = 0,
    next = 0,
    order = 0,
    generation = 0,
    timer = false,
    dropped = false,
    ackLost = false;
  const record = (
    at: number,
    kind: TcpState['kind'],
    segment = -1,
    duplicate = false,
    ack?: number,
  ) =>
    states.push({
      at,
      kind,
      segment,
      next,
      base,
      sent,
      buffer: [...received].sort((a, b) => a - b),
      delivered: [...delivered],
      duplicate,
      ack,
    });
  const schedule = (e: Omit<Event, 'order'>) => events.push({ ...e, order: order++ });
  const startTimer = (at: number) => {
    if (base < sent) {
      timer = true;
      schedule({ at: at + rto, kind: 'timeout', segment: base, generation: ++generation });
    }
  };
  const send = (segment: number, at: number, retransmit = false) => {
    const lost = segment === drop && !dropped;
    if (lost) dropped = true;
    const arrives = at + 0.5 + (!retransmit && reorder && segment === 1 ? 0.65 : 0);
    sent = Math.max(sent, segment + 1);
    transmissions.push({
      id: transmissions.length,
      segment,
      seq: 1000 + segment * 100,
      endSeq: 1100 + segment * 100,
      sent: at,
      arrives,
      lost,
      retransmit,
    });
    if (!lost) schedule({ at: arrives, kind: 'arrival', segment });
    record(at, 'send', segment);
    if (!timer) startTimer(at);
  };
  const queueSend = (segment: number, at: number, retransmit = false) => {
    const when = Math.max(at, wireReady);
    wireReady = when + 0.08;
    schedule({ at: when, kind: 'send', segment, retransmit });
  };
  const fill = (at: number) => {
    while (queued < count && queued < base + window) queueSend(queued++, at);
  };
  record(0, 'ack');
  fill(0);
  for (let guard = 0; events.length && guard < 1000; guard++) {
    events.sort((a, b) => a.at - b.at || a.order - b.order);
    const e = events.shift()!;
    if (e.kind === 'send') {
      send(e.segment, e.at, e.retransmit);
    } else if (e.kind === 'arrival') {
      const duplicate = e.segment < next || received.has(e.segment);
      if (e.segment >= next) received.add(e.segment);
      while (received.has(next)) {
        received.delete(next);
        delivered.push(next++);
      }
      record(e.at, 'receive', e.segment, duplicate);
      const lost = loseAck && !ackLost;
      if (lost) ackLost = true;
      acks.push({ at: e.at, arrives: e.at + 0.5, next, lost });
      if (!lost) schedule({ at: e.at + 0.5, kind: 'ack', segment: next });
    } else if (e.kind === 'ack') {
      if (e.segment > base) {
        base = e.segment;
        timer = false;
        ++generation;
        fill(e.at);
        if (!timer) startTimer(e.at);
      }
      record(e.at, 'ack', -1, false, e.segment);
    } else if (e.generation === generation && base < sent) {
      timer = false;
      record(e.at, 'timeout', base);
      queueSend(base, e.at, true);
    }
  }
  const end = Math.max(...states.map((s) => s.at), 0);
  return { config, transmissions, acks, states, end, bytes: count * 100 };
}
export function tcpAt(run: ReturnType<typeof tcpSimulate>, time: number) {
  return run.states.findLast((s) => s.at <= Math.max(0, time)) ?? run.states[0];
}
export const tcpSeq = (index: number) => 1000 + index * 100;
