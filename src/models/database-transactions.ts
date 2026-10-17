export type ReservationMode = 'unchecked' | 'validate';
export type ReservationEvent = {
  tx: string;
  action: 'begin' | 'read' | 'stage' | 'commit' | 'rollback';
};
export type ReservationTx = {
  status: 'active' | 'staged' | 'committed' | 'aborted' | 'rolled-back' | 'rejected';
  read: number | null;
  version: number | null;
  proposed: number | null;
};
export type ReservationState = {
  initial: number;
  remaining: number;
  version: number;
  orders: string[];
  transactions: Record<string, ReservationTx>;
};
const clone = (s: ReservationState): ReservationState => ({
  ...s,
  orders: [...s.orders],
  transactions: Object.fromEntries(
    Object.entries(s.transactions).map(([id, tx]) => [id, { ...tx }]),
  ),
});
export function reservationTrace(
  events: readonly ReservationEvent[],
  mode: ReservationMode = 'validate',
  initial = 1,
) {
  if (
    !Number.isSafeInteger(initial) ||
    initial < 0 ||
    initial > 100 ||
    events.length > 128 ||
    !['unchecked', 'validate'].includes(mode)
  )
    throw new RangeError('Invalid reservation run');
  let state: ReservationState = {
    initial,
    remaining: initial,
    version: 0,
    orders: [],
    transactions: {},
  };
  const frames: { state: ReservationState; event: ReservationEvent | null }[] = [
    { state: clone(state), event: null },
  ];
  for (const event of events) {
    state = clone(state);
    let tx = state.transactions[event.tx];
    if (!event.tx || event.tx.length > 20) throw new RangeError('Invalid transaction ID');
    if (event.action === 'begin') {
      if (tx) throw new RangeError('Duplicate transaction');
      tx = { status: 'active', read: null, version: null, proposed: null };
      state.transactions[event.tx] = tx;
    } else {
      if (!tx) throw new RangeError('Transaction must begin first');
      if (event.action === 'read') {
        if (tx.status !== 'active' || tx.read !== null) throw new RangeError('Invalid read');
        tx.read = state.remaining;
        tx.version = state.version;
      } else if (event.action === 'stage') {
        if (tx.status !== 'active' || tx.read === null) throw new RangeError('Read before staging');
        if (tx.read === 0) tx.status = 'rejected';
        else {
          tx.proposed = tx.read - 1;
          tx.status = 'staged';
        }
      } else if (event.action === 'rollback') {
        if (!['active', 'staged'].includes(tx.status)) throw new RangeError('Invalid rollback');
        tx.status = 'rolled-back';
        tx.proposed = null;
      } else if (event.action === 'commit') {
        if (tx.status === 'rejected') {
          /* COMMIT has no staged changes after application refusal. */
        } else if (tx.status !== 'staged') throw new RangeError('Nothing to commit');
        else if (mode === 'validate' && tx.version !== state.version) {
          tx.status = 'aborted';
          tx.proposed = null;
        } else {
          state.remaining = tx.proposed!;
          state.orders.push(event.tx);
          state.version++;
          tx.status = 'committed';
        }
      } else throw new RangeError('Unknown action');
    }
    frames.push({ state: clone(state), event: { ...event } });
  }
  return { frames, state };
}
export function reservationLesson(
  schedule: 'overlap' | 'serial' | 'rollback' = 'overlap',
  mode: ReservationMode = 'validate',
  initial = 1,
  retry = false,
) {
  const e = (tx: string, action: ReservationEvent['action']) => ({ tx, action });
  let events: ReservationEvent[];
  if (schedule === 'overlap')
    events = [
      e('T1', 'begin'),
      e('T1', 'read'),
      e('T2', 'begin'),
      e('T2', 'read'),
      e('T1', 'stage'),
      e('T2', 'stage'),
      e('T1', 'commit'),
      e('T2', 'commit'),
    ];
  else if (schedule === 'serial')
    events = ['T1', 'T2'].flatMap((tx) =>
      (['begin', 'read', 'stage', 'commit'] as const).map((action) => e(tx, action)),
    );
  else events = (['begin', 'read', 'stage', 'rollback'] as const).map((action) => e('T1', action));
  if (retry)
    events.push(
      ...(['begin', 'read', 'stage', 'commit'] as const).map((action) => e('T2′', action)),
    );
  return reservationTrace(events, mode, initial);
}
export const reservationInvariant = (s: ReservationState) =>
  s.remaining >= 0 && s.remaining + s.orders.length === s.initial;
