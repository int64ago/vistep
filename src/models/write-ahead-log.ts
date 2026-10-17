export type WalRecord = { lsn: number; tx: 'A'; kind: 'set' | 'commit'; value?: number };
export type WalState = {
  records: WalRecord[];
  durable: number;
  memory: { value: number; lsn: number } | null;
  page: { value: number; lsn: number };
  acknowledged: boolean;
  crashed: boolean;
};
export type WalAction =
  | 'edit'
  | 'commit-record'
  | 'flush-update'
  | 'flush-log'
  | 'ack'
  | 'flush-page'
  | 'crash'
  | 'recover';
export const walInitial = (): WalState => ({
  records: [],
  durable: 0,
  memory: { value: 7, lsn: 0 },
  page: { value: 7, lsn: 0 },
  acknowledged: false,
  crashed: false,
});
const copy = (s: WalState): WalState => ({
  ...s,
  records: s.records.map((r) => ({ ...r })),
  memory: s.memory ? { ...s.memory } : null,
  page: { ...s.page },
});
export function walStep(input: WalState, action: WalAction, value = 11) {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 1000 ||
    !Number.isSafeInteger(input.durable) ||
    input.durable < 0 ||
    input.durable > input.records.length ||
    input.records.some((r, i) => r.lsn !== i + 1) ||
    input.page.lsn < 0
  )
    throw new RangeError('Invalid WAL state');
  const s = copy(input),
    committed = () => s.records.slice(0, s.durable).some((r) => r.kind === 'commit');
  if (s.crashed && action !== 'recover') throw new RangeError('Recover before operating');
  switch (action) {
    case 'edit':
      if (s.records.length) throw new RangeError('One transaction only');
      s.records.push({ lsn: 1, tx: 'A', kind: 'set', value });
      s.memory = { value, lsn: 1 };
      break;
    case 'commit-record':
      if (s.records.length !== 1) throw new RangeError('Edit before commit record');
      s.records.push({ lsn: 2, tx: 'A', kind: 'commit' });
      break;
    case 'flush-update':
      if (!s.records.length) throw new RangeError('No log record');
      s.durable = Math.max(s.durable, 1);
      break;
    case 'flush-log':
      s.durable = s.records.length;
      break;
    case 'ack':
      if (!committed())
        throw new RangeError('Commit record must be durable before acknowledgement');
      s.acknowledged = true;
      break;
    case 'flush-page':
      if (!s.memory || s.memory.lsn > s.durable) throw new RangeError('WAL before data page');
      if (!committed()) throw new RangeError('No-steal model forbids uncommitted page writes');
      s.page = { ...s.memory };
      break;
    case 'crash':
      s.memory = null;
      s.records = s.records.slice(0, s.durable);
      s.crashed = true;
      break;
    case 'recover':
      if (!s.crashed) throw new RangeError('No crash to recover');
      if (committed())
        for (const r of s.records.slice(0, s.durable))
          if (r.kind === 'set' && r.lsn > s.page.lsn) s.page = { value: r.value!, lsn: r.lsn };
      s.memory = { ...s.page };
      s.crashed = false;
      break;
    default:
      throw new RangeError('Unknown WAL action');
  }
  return s;
}
export function walScenario(
  point: 'buffer' | 'update-only' | 'commit-no-ack' | 'ack' | 'page' = 'ack',
  value = 11,
) {
  const actions: WalAction[] = ['edit', 'commit-record'];
  if (point === 'update-only') actions.push('flush-update');
  if (['commit-no-ack', 'ack', 'page'].includes(point)) actions.push('flush-log');
  if (['ack', 'page'].includes(point)) actions.push('ack');
  if (point === 'page') actions.push('flush-page');
  actions.push('crash', 'recover');
  let s = walInitial();
  const frames: { state: WalState; action: WalAction | null }[] = [{ state: s, action: null }];
  for (const action of actions) {
    s = walStep(s, action, value);
    frames.push({ state: s, action });
  }
  return { frames, state: s };
}
