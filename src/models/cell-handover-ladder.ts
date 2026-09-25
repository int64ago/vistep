/**
 * One X2/Xn handover as a message ladder and a downlink packet stream.
 *
 * The message order follows TS 36.300 §10.1.2.1.1 (and its NR counterpart TS 38.300 §9.2.3.2.1).
 * Latencies are disclosed illustrative values: 1 ms radio slots, 5 ms one-way backhaul, and a
 * handset interruption built from the TS 36.133 §5.1.2.1 form `Tsearch + TIU + 20 ms` for a known
 * target cell (Tsearch = 0, TIU = wait for the next random-access occasion, at most 30 ms).
 *
 * Every downlink packet keeps its identity. Packets the source receives after it has sent the
 * handover command are forwarded to the target; after the core switches the path, new packets go
 * straight to the target, which releases them only after the end marker so order is preserved.
 */

export type ChNode = 0 | 1 | 2 | 3; // handset, source, target, core
export const CH_NODES = ['手机', '源基站', '目标基站', '核心网'] as const;

export type ChMessage = {
  id: string;
  label: string;
  from: ChNode;
  to: ChNode;
  send: number;
  arrive: number;
};
export type ChPacket = {
  id: number;
  created: number;
  path: 'source' | 'forwarded' | 'direct';
  /** Arrival at the base station that will deliver it (after forwarding, if any). */
  atStation: number;
  delivered: number;
};

export const CH_LADDER = {
  airMs: 1,
  backhaulMs: 5,
  decisionMs: 2,
  admissionMs: 4,
  /** RRC processing + downlink sync allowance of the TS 36.133 formula. */
  fixedMs: 20,
  /** Wait for the next random-access occasion in this example (TIU ≤ 30 ms). */
  tiuMs: 4,
  coreSwitchMs: 2,
  packetEveryMs: 4,
  firstPacketMs: -18,
  lastPacketMs: 86,
  startMs: -20,
  endMs: 92,
} as const;

export function chLadder(tiuMs: number = CH_LADDER.tiuMs) {
  if (!Number.isFinite(tiuMs) || tiuMs < 0 || tiuMs > 30)
    throw new RangeError('TIU must be between 0 and 30 ms');
  const L = CH_LADDER,
    messages: ChMessage[] = [];
  const add = (id: string, label: string, from: ChNode, to: ChNode, send: number) => {
    const hop = from === 0 || to === 0 ? L.airMs : L.backhaulMs;
    const m = { id, label, from, to, send, arrive: send + hop };
    messages.push(m);
    return m;
  };
  const report = add('report', '测量报告', 0, 1, 0);
  const request = add('request', '切换请求', 1, 2, report.arrive + L.decisionMs);
  const ack = add('ack', '请求确认', 2, 1, request.arrive + L.admissionMs);
  const command = add('command', '切换命令', 1, 0, ack.arrive);
  add('status', '序号状态', 1, 2, command.send + 1);
  const access = add('access', '随机接入', 0, 2, command.arrive + L.fixedMs + tiuMs);
  const response = add('response', '接入响应', 2, 0, access.arrive + 2);
  const complete = add('complete', '切换完成', 0, 2, response.arrive + 1);
  const pathSwitch = add('path', '路径切换', 2, 3, complete.arrive + 1);
  const switchAt = pathSwitch.arrive + L.coreSwitchMs;
  const marker = add('marker', '结束标记', 3, 1, switchAt);
  const switchAck = add('switch-ack', '路径确认', 3, 2, switchAt + 1);
  const markerOn = add('marker-forward', '结束标记', 1, 2, marker.arrive);
  add('release', '释放旧资源', 2, 1, Math.max(switchAck.arrive, markerOn.arrive) + 1);

  const packets: ChPacket[] = [];
  let targetFree = complete.arrive,
    sourceFree = -Infinity;
  const count = Math.floor((L.lastPacketMs - L.firstPacketMs) / L.packetEveryMs) + 1;
  for (let k = 0; k < count; k++) {
    const created = L.firstPacketMs + k * L.packetEveryMs;
    if (created < switchAt) {
      const atSource = created + L.backhaulMs;
      if (atSource < command.send) {
        const delivered = Math.max(atSource + L.airMs, sourceFree + L.airMs);
        sourceFree = delivered;
        packets.push({ id: 101 + k, created, path: 'source', atStation: atSource, delivered });
        continue;
      }
      packets.push({
        id: 101 + k,
        created,
        path: 'forwarded',
        atStation: atSource + L.backhaulMs,
        delivered: 0,
      });
    } else
      packets.push({
        id: 101 + k,
        created,
        path: 'direct',
        atStation: created + L.backhaulMs,
        delivered: 0,
      });
  }
  // The target sends in sequence: forwarded packets first, direct ones after the end marker.
  for (const p of packets) {
    if (p.path === 'source') continue;
    const ready = p.path === 'direct' ? Math.max(p.atStation, markerOn.arrive) : p.atStation;
    p.delivered = Math.max(ready, targetFree) + L.airMs;
    targetFree = p.delivered;
  }
  const lastOld = Math.max(...packets.filter((p) => p.path === 'source').map((p) => p.delivered));
  const firstNew = Math.min(...packets.filter((p) => p.path !== 'source').map((p) => p.delivered));
  return {
    messages,
    packets,
    detachAt: command.arrive,
    attachAt: complete.arrive,
    switchAt,
    /** TS 36.133 interruption (command end → first random-access transmission). */
    interruptMs: access.send - command.arrive,
    /** What the handset notices: the gap between two consecutive delivered packets. */
    gapMs: firstNew - lastOld,
    lastOld,
    firstNew,
  };
}
export type ChLadderRun = ReturnType<typeof chLadder>;

/** Where a packet is at time t: queued at a node, travelling between two nodes, or delivered. */
export function chPacketAt(_ladder: ChLadderRun, p: ChPacket, t: number) {
  const L = CH_LADDER;
  if (!Number.isFinite(t)) throw new RangeError('Finite time required');
  if (t < p.created) return { state: 'waiting' as const };
  if (t >= p.delivered) return { state: 'delivered' as const };
  const legs: [ChNode, ChNode, number, number][] = [];
  if (p.path === 'source') {
    legs.push([3, 1, p.created, p.atStation], [1, 0, p.delivered - L.airMs, p.delivered]);
  } else if (p.path === 'forwarded') {
    legs.push(
      [3, 1, p.created, p.created + L.backhaulMs],
      [1, 2, p.atStation - L.backhaulMs, p.atStation],
      [2, 0, p.delivered - L.airMs, p.delivered],
    );
  } else legs.push([3, 2, p.created, p.atStation], [2, 0, p.delivered - L.airMs, p.delivered]);
  for (const [from, to, a, b] of legs)
    if (t >= a && t < b) return { state: 'moving' as const, from, to, u: (t - a) / (b - a) };
  // Between legs the packet is held at the node it last reached.
  let at: ChNode = 3;
  for (const [, to, , b] of legs) if (t >= b) at = to;
  return { state: 'held' as const, at };
}
