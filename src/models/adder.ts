export type Bit = 0 | 1;
export type LogicSignal = { value: Bit; ready: number };
export type GateKind = 'XOR' | 'AND' | 'OR';
const bit = (n: number): Bit => (n ? 1 : 0);
export const inputSignal = (value: Bit): LogicSignal => ({ value, ready: 0 });
/** Earliest guaranteed knowledge from initially unknown inputs; relative pedagogical delays. */
export function logicGate(kind: GateKind, a: LogicSignal, b: LogicSignal): LogicSignal {
  const delay = kind === 'XOR' ? 2 : 1;
  const value = bit(
    kind === 'XOR' ? a.value ^ b.value : kind === 'AND' ? a.value & b.value : a.value | b.value,
  );
  let ready = Math.max(a.ready, b.ready);
  if (kind === 'AND' && !value)
    ready = Math.min(a.value === 0 ? a.ready : Infinity, b.value === 0 ? b.ready : Infinity);
  if (kind === 'OR' && value)
    ready = Math.min(a.value === 1 ? a.ready : Infinity, b.value === 1 ? b.ready : Infinity);
  return { value, ready: ready + delay };
}
export function fullAdder(a: Bit, b: Bit, carry: LogicSignal = inputSignal(0)) {
  const A = inputSignal(a),
    B = inputSignal(b),
    p = logicGate('XOR', A, B),
    g = logicGate('AND', A, B);
  const h = logicGate('AND', p, carry),
    sum = logicGate('XOR', p, carry),
    cout = logicGate('OR', g, h);
  return { a: A, b: B, cin: carry, p, g, h, sum, cout };
}
export type AdderStage = ReturnType<typeof fullAdder>;
export function rippleAdder(a: number, b: number, width = 8) {
  if (!Number.isInteger(width) || width < 1 || width > 16)
    throw new RangeError('Width must be 1–16 bits.');
  const limit = 2 ** width;
  if (![a, b].every((v) => Number.isInteger(v) && v >= 0 && v < limit))
    throw new RangeError('Operands must fit the unsigned input width.');
  let carry = inputSignal(0),
    sum = 0;
  const stages: AdderStage[] = [];
  for (let i = 0; i < width; i++) {
    const stage = fullAdder(bit(a & (2 ** i)), bit(b & (2 ** i)), carry);
    stages.push(stage);
    carry = stage.cout;
    sum += stage.sum.value * 2 ** i;
  }
  const signed = (n: number) => (n >= limit / 2 ? n - limit : n);
  return {
    a,
    b,
    width,
    stages,
    sum,
    carry,
    complete: sum + carry.value * limit,
    signedA: signed(a),
    signedB: signed(b),
    signedSum: signed(sum),
    overflow: bit(stages[width - 1].cin.value ^ carry.value),
    settled: Math.max(carry.ready, ...stages.map((s) => s.sum.ready)),
  };
}
export function known(signal: LogicSignal, time: number) {
  return time >= signal.ready ? signal.value : null;
}
const ease = (value: number) => {
  const p = Math.min(1, Math.max(0, value));
  return p * p * (3 - 2 * p);
};
export function adderShot(chapter: number, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  let a = 1,
    b = 1,
    cin: Bit = 0,
    width = 2,
    view: 'columns' | 'half' | 'full' = 'columns',
    phase = p;
  if (chapter === 1) {
    const step = Math.min(3, Math.floor(p * 4));
    a = step >> 1;
    b = step & 1;
    view = 'half';
    phase = p * 4 - step;
  }
  if (chapter === 2) {
    a = 1;
    b = p > 0.65 ? 1 : 0;
    cin = p > 0.28 ? 1 : 0;
    view = 'full';
    phase = p <= 0.28 ? p / 0.28 : p <= 0.65 ? (p - 0.28) / 0.37 : (p - 0.65) / 0.35;
  }
  if (chapter === 3) {
    a = 5;
    b = 7;
    width = 4;
  }
  if (chapter === 4 || chapter === 5) {
    a = 255;
    b = 1;
    width = 8;
  }
  if (chapter === 6) {
    a = 127;
    b = 1;
    width = 8;
  }
  if (chapter === 7) {
    a = 42;
    b = 19;
    width = 8;
  }
  const model = rippleAdder(a, b, width),
    single = fullAdder(bit(a), bit(b), inputSignal(cin));
  const limit =
    view === 'columns'
      ? model.settled
      : view === 'half'
        ? Math.max(single.p.ready, single.g.ready)
        : Math.max(single.sum.ready, single.cout.ready);
  return {
    a,
    b,
    cin,
    width,
    view,
    model,
    single,
    time: chapter === 5 || chapter === 6 ? limit : ease((phase - 0.12) / 0.7) * limit,
    showCarry: chapter >= 4,
    signed: chapter === 6 && p > 0.48,
    compareSigned: chapter === 6,
    truncate: chapter === 5 && p > 0.55,
  };
}
