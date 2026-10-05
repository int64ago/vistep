/** Consumer RSP teaching state machine: GSMA SGP.21 v2.6 and SGP.22 v2.2.2.
 * It enforces protocol/lifecycle dependencies; it does not implement production cryptography.
 * All identifiers are symbolic. Eight visual segments are not a real profile size or APDU count.
 */
export type EsimFault = 'none' | 'server' | 'recipient' | 'integrity' | 'offline';
export type EsimProfileId = 'home' | 'travel';
export type EsimAction =
  | 'locate'
  | 'authenticate-server'
  | 'authenticate-chip'
  | 'bind'
  | 'receive'
  | 'install'
  | 'enable'
  | 'network-auth';
export const ESIM_SEGMENTS = 8;
export const ESIM_ACTIONS: readonly EsimAction[] = [
  'locate',
  'authenticate-server',
  'authenticate-chip',
  'bind',
  'receive',
  'install',
  'enable',
  'network-auth',
];
export type EsimState = {
  chip: 'A';
  located: boolean;
  serverVerified: boolean;
  chipVerified: boolean;
  boundTo: 'A' | null;
  received: number;
  installed: EsimProfileId[];
  active: EsimProfileId;
  networkAuthenticated: boolean;
  error: EsimFault | 'order' | null;
  history: EsimAction[];
};
export const esimInitial = (): EsimState => ({
  chip: 'A',
  located: false,
  serverVerified: false,
  chipVerified: false,
  boundTo: null,
  received: 0,
  installed: ['home'],
  active: 'home',
  networkAuthenticated: false,
  error: null,
  history: [],
});
/** QR/activation-code fields locate a download. They contain no IMSI or network K.
 * This deliberately incomplete, non-operational sample cannot activate a subscription. */
export const ESIM_ACTIVATION = { server: 'profile.example.invalid', token: '〈示意取件编号〉' };
export function esimAdvance(
  previous: EsimState,
  action: EsimAction,
  fault: EsimFault = 'none',
  segments = ESIM_SEGMENTS,
): EsimState {
  if (
    !ESIM_ACTIONS.includes(action) ||
    !['none', 'server', 'recipient', 'integrity', 'offline'].includes(fault)
  )
    throw new RangeError('Unknown protocol input');
  if (!Number.isInteger(segments) || segments < 0 || segments > ESIM_SEGMENTS)
    throw new RangeError('Invalid teaching segment count');
  // A failed transaction never installs or enables a partial incoming profile.
  if (previous.error) return previous;
  const next = { ...previous, installed: [...previous.installed], history: [...previous.history] };
  const reject = (reason: NonNullable<EsimState['error']>) => ({ ...next, error: reason });
  switch (action) {
    case 'locate':
      if (fault === 'offline') return reject('offline');
      next.located = true;
      break;
    case 'authenticate-server':
      if (!previous.located) return reject('order');
      if (fault === 'server') return reject('server');
      next.serverVerified = true;
      break;
    case 'authenticate-chip':
      if (!previous.serverVerified) return reject('order');
      next.chipVerified = true;
      break;
    case 'bind':
      if (!previous.serverVerified || !previous.chipVerified) return reject('order');
      next.boundTo = 'A';
      break;
    case 'receive':
      if (!previous.boundTo) return reject('order');
      if (fault === 'recipient') return reject('recipient');
      if (fault === 'integrity') return reject('integrity');
      next.received = Math.max(previous.received, segments);
      break;
    case 'install':
      if (previous.received !== ESIM_SEGMENTS || !previous.serverVerified || !previous.chipVerified)
        return reject('order');
      if (!next.installed.includes('travel')) next.installed.push('travel');
      // Installation is disabled. Existing service remains selected until enable is requested.
      break;
    case 'enable':
      if (!previous.installed.includes('travel')) return reject('order');
      next.active = 'travel';
      next.networkAuthenticated = false;
      break;
    case 'network-auth':
      if (!previous.installed.includes(previous.active)) return reject('order');
      next.networkAuthenticated = true;
      break;
  }
  next.history.push(action);
  return next;
}
export function esimReplay(
  actions: readonly EsimAction[],
  fault: EsimFault = 'none',
  segments = ESIM_SEGMENTS,
): EsimState {
  return actions.reduce(
    (state, action) => esimAdvance(state, action, fault, segments),
    esimInitial(),
  );
}
/** Local single-port selection. This model permits one enabled profile; MEP/dual-eSIM
 * devices have additional ports/capabilities and are explicitly outside this diagram. */
export function esimSwitch(state: EsimState, profile: EsimProfileId): EsimState {
  if (!state.installed.includes(profile)) return { ...state, error: 'order' };
  return { ...state, active: profile, networkAuthenticated: false };
}
export const ESIM_VIEWS = [
  'hardware',
  'address',
  'trust',
  'delivery',
  'storage',
  'network',
] as const;
export type EsimView = (typeof ESIM_VIEWS)[number];
const unit = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (p: number) => {
  const q = unit(p);
  return q * q * (3 - 2 * q);
};
const ramp = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
/** Deterministic chapter-relative reconstruction, independent of playback speed/seek order. */
export function esimShot(
  chapter: number,
  progress: number,
  fault: EsimFault = 'none',
  manualProfile?: EsimProfileId,
) {
  if (![chapter, progress].every(Number.isFinite))
    throw new RangeError('Finite film position required');
  const c = Math.max(0, Math.min(5, Math.floor(chapter))),
    p = unit(progress);
  const actions: EsimAction[] = [];
  if (c > 1 || (c === 1 && p >= 0.5)) actions.push('locate');
  if (c > 2 || (c === 2 && p >= 0.35)) actions.push('authenticate-server');
  if (c > 2 || (c === 2 && p >= 0.7)) actions.push('authenticate-chip');
  if (c > 3 || (c === 3 && p >= 0.12)) actions.push('bind');
  const transfer = c < 3 ? 0 : c > 3 ? 1 : ramp(p, 0.2, 0.56);
  if (c > 3 || (c === 3 && p >= 0.2)) actions.push('receive');
  if (c > 4 || (c === 4 && p >= 0.35)) actions.push('install');
  if (c > 4 || (c === 4 && p >= 0.75)) actions.push('enable');
  if (c === 5 && p >= 0.35) actions.push('network-auth');
  let state = esimReplay(actions, fault, Math.floor(transfer * ESIM_SEGMENTS));
  const selected: EsimProfileId = manualProfile ?? (c === 5 && p >= 0.7 ? 'home' : state.active);
  const switched = !state.error && selected !== state.active && state.installed.includes(selected);
  if (switched) {
    state = esimSwitch(state, selected);
    if (c === 5 && p >= 0.86) state = esimAdvance(state, 'network-auth');
  }
  return {
    view: ESIM_VIEWS[c],
    chapter: c,
    progress: p,
    state,
    // The attempted delivery can target another chip without changing chip A's
    // local profiles or the prepared package's authenticated binding to A.
    recipient: fault === 'recipient' ? ('B' as const) : ('A' as const),
    reveal: c === 0 ? ramp(p, 0.12, 0.65) : 1,
    transfer,
    copyProbe: c === 3 && p >= 0.67,
    proof: c === 2 ? ramp(p, 0.04, 0.28) : 1,
    networkReady: c === 5 && !state.error,
    reply: c === 5 && !state.error ? (switched ? ramp(p, 0.72, 0.86) : ramp(p, 0.12, 0.35)) : 0,
    switching: c === 5 && switched,
    copiedAccepted: false as const,
  };
}
export type EsimShot = ReturnType<typeof esimShot>;
/** Shared physical proportions for scene and covers. Enlarged eUICC is a conceptual inset. */
export const ESIM_OBJECT = {
  phoneWidth: 150,
  phoneHeight: 278,
  board: { x: 18, y: 45, w: 114, h: 160 },
  chip: { x: 80, y: 155, w: 27, h: 27 },
  antenna: { x: 20, y: 28, w: 110 },
};
export function esimPackageBits(count = 48) {
  if (!Number.isInteger(count) || count < 1 || count > 256)
    throw new RangeError('Invalid illustration length');
  return Array.from({ length: count }, (_, i) => (i * 73 + (i >> 2) * 19 + 41) % 11 < 5);
}
