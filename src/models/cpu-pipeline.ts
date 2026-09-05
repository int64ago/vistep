/** A deliberately small five-stage, single-issue, in-order teaching CPU.
 * Frames describe the occupants DURING a cycle and the values at its END.
 * WB writes before ID reads. EX/MEM and MEM/WB bypass into EX; a load-use
 * dependency waits one cycle. Branches resolve in EX, predict fall-through,
 * and squash the two younger occupants before they can have side effects.
 * No cache misses, exceptions, binary decoding, delay slots or speculation
 * beyond fetching fall-through. Memory is aligned, byte-addressed words.
 */
export const CPU_STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'] as const;
export type CpuStage = (typeof CPU_STAGES)[number];
export type CpuInstruction =
  | { op: 'ADDI'; rd: number; rs1: number; imm: number }
  | { op: 'ADD' | 'SUB'; rd: number; rs1: number; rs2: number }
  | { op: 'LW'; rd: number; rs1: number; imm: number }
  | { op: 'SW'; rs1: number; rs2: number; imm: number }
  | { op: 'BEQ'; rs1: number; rs2: number; target: number };
export type CpuMode = 'pipeline' | 'sequential';
export type CpuOptions = {
  mode?: CpuMode;
  forwarding?: boolean;
  registers?: readonly number[];
  memory?: Readonly<Record<number, number>>;
};
export type CpuToken = {
  uid: number;
  pc: number;
  instruction: CpuInstruction;
  operands: number[];
  result?: number;
  address?: number;
  storeValue?: number;
  taken?: boolean;
  squashed?: boolean;
};
export type CpuEvent =
  | {
      type: 'stall';
      consumer: number;
      producers: number[];
      registers: number[];
      reason: 'load-use' | 'writeback';
    }
  | {
      type: 'forward';
      producer: number;
      consumer: number;
      register: number;
      value: number;
      from: 'MEM' | 'WB';
    }
  | { type: 'branch'; uid: number; taken: boolean; target: number; values: number[] }
  | { type: 'flush'; uids: number[] }
  | { type: 'write'; uid: number; register: number; value: number }
  | { type: 'load' | 'store'; uid: number; address: number; value: number };
export type CpuState = {
  program: readonly CpuInstruction[];
  mode: CpuMode;
  forwarding: boolean;
  cycle: number;
  pc: number;
  nextUid: number;
  slots: (CpuToken | null)[];
  registers: number[];
  memory: Record<number, number>;
  retired: number[];
  retiredPcs: number[];
  stalls: number;
  flushed: number[];
  events: CpuEvent[];
  done: boolean;
};
export const CPU_PROGRAM: readonly CpuInstruction[] = [
  { op: 'ADDI', rd: 1, rs1: 0, imm: 4 },
  { op: 'ADDI', rd: 2, rs1: 0, imm: 7 },
  { op: 'ADD', rd: 3, rs1: 1, rs2: 2 },
  { op: 'LW', rd: 4, rs1: 0, imm: 0 },
  { op: 'ADD', rd: 5, rs1: 4, rs2: 3 },
  { op: 'BEQ', rs1: 4, rs2: 3, target: 8 },
  { op: 'SW', rs1: 0, rs2: 5, imm: 4 },
  { op: 'ADDI', rd: 7, rs1: 0, imm: 99 },
  { op: 'SW', rs1: 0, rs2: 5, imm: 8 },
  { op: 'ADDI', rd: 7, rs1: 5, imm: 1 },
];
export const cpuSources = (i: CpuInstruction) => ('rs2' in i ? [i.rs1, i.rs2] : [i.rs1]);
export const cpuDestination = (i: CpuInstruction) => ('rd' in i && i.rd !== 0 ? i.rd : null);
export const cpuIdentity = (pc: number) => `I${pc + 1}`;
export function cpuAssembly(i: CpuInstruction) {
  if (i.op === 'ADDI') return `ADDI r${i.rd}, r${i.rs1}, ${i.imm}`;
  if (i.op === 'LW') return `LW r${i.rd}, ${i.imm}(r${i.rs1})`;
  if (i.op === 'SW') return `SW r${i.rs2}, ${i.imm}(r${i.rs1})`;
  if (i.op === 'BEQ') return `BEQ r${i.rs1}, r${i.rs2}, ${cpuIdentity(i.target)}`;
  return `${i.op} r${i.rd}, r${i.rs1}, r${i.rs2}`;
}
function word(value: number) {
  if (!Number.isInteger(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)
    throw new RangeError('Expected a finite integer');
  return value | 0;
}
function address(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 0x7ffffffc || value % 4)
    throw new RangeError('Expected a nonnegative aligned word address');
  return value;
}
export function createCpu(
  program: readonly CpuInstruction[] = CPU_PROGRAM,
  options: CpuOptions = {},
): CpuState {
  if (program.length > 256) throw new RangeError('Teaching program exceeds 256 instructions');
  for (const i of program) {
    if (!['ADDI', 'ADD', 'SUB', 'LW', 'SW', 'BEQ'].includes(i.op))
      throw new RangeError('Unknown opcode');
    for (const r of [...cpuSources(i), ...('rd' in i ? [i.rd] : [])])
      if (!Number.isInteger(r) || r < 0 || r > 7)
        throw new RangeError('Expected register r0 through r7');
    if ('imm' in i && (!Number.isInteger(i.imm) || i.imm < -2048 || i.imm > 2047))
      throw new RangeError('Immediate exceeds signed 12-bit range');
    if (
      i.op === 'BEQ' &&
      (!Number.isInteger(i.target) || i.target < 0 || i.target > program.length)
    )
      throw new RangeError('Invalid instruction-index branch target');
  }
  if (options.registers && options.registers.length !== 8)
    throw new RangeError('Expected eight registers');
  const registers = options.registers ? options.registers.map(word) : Array<number>(8).fill(0);
  registers[0] = 0;
  const memory: Record<number, number> = {};
  for (const [key, value] of Object.entries(options.memory ?? { 0: 11, 4: 0, 8: 0 }))
    memory[address(Number(key))] = word(value);
  return {
    program: program.map((i) => ({ ...i })),
    mode: options.mode ?? 'pipeline',
    forwarding: options.forwarding ?? true,
    cycle: 0,
    pc: 0,
    nextUid: 1,
    slots: Array(5).fill(null),
    registers,
    memory,
    retired: [],
    retiredPcs: [],
    stalls: 0,
    flushed: [],
    events: [],
    done: program.length === 0,
  };
}
const copyToken = (token: CpuToken | null) =>
  token && !token.squashed ? { ...token, operands: [...token.operands] } : null;

/** Pure clock edge: never mutate an earlier frame, including latched operands. */
export function stepCpu(previous: CpuState): CpuState {
  if (previous.done) return previous;
  const state: CpuState = {
    ...previous,
    cycle: previous.cycle + 1,
    slots: Array(5).fill(null),
    registers: [...previous.registers],
    memory: { ...previous.memory },
    retired: [...previous.retired],
    retiredPcs: [...previous.retiredPcs],
    flushed: [...previous.flushed],
    events: [],
  };
  const old = previous.slots.map(copyToken);
  const waiting = old[1];
  const blockers =
    waiting && previous.mode === 'pipeline'
      ? [old[2], old[3]].filter((p): p is CpuToken => {
          if (!p) return false;
          const rd = cpuDestination(p.instruction);
          return (
            rd !== null &&
            cpuSources(waiting.instruction).includes(rd) &&
            (!previous.forwarding || (p === old[2] && p.instruction.op === 'LW'))
          );
        })
      : [];
  const stalled = blockers.length > 0;
  state.slots[4] = old[3];
  state.slots[3] = old[2];
  state.slots[2] = stalled ? null : old[1];
  state.slots[1] = stalled ? old[1] : old[0];
  if (stalled) {
    state.slots[0] = old[0];
    state.stalls++;
    state.events.push({
      type: 'stall',
      consumer: waiting!.uid,
      producers: blockers.map((p) => p.uid),
      registers: [...new Set(blockers.map((p) => cpuDestination(p.instruction)!))],
      reason: previous.forwarding ? 'load-use' : 'writeback',
    });
  } else if (
    state.pc < state.program.length &&
    (state.mode === 'pipeline' || old.slice(0, 4).every((p) => !p))
  ) {
    state.slots[0] = {
      uid: state.nextUid++,
      pc: state.pc,
      instruction: state.program[state.pc],
      operands: [],
    };
    state.pc++;
  }
  const [fetch, decode, execute, memory, writeback] = state.slots;
  if (writeback) {
    const rd = cpuDestination(writeback.instruction);
    if (rd !== null) {
      if (writeback.result === undefined) throw new Error('Missing writeback value');
      state.registers[rd] = writeback.result;
      state.events.push({
        type: 'write',
        uid: writeback.uid,
        register: rd,
        value: writeback.result,
      });
    }
    state.retired.push(writeback.uid);
    state.retiredPcs.push(writeback.pc);
  }
  if (execute) {
    const i = execute.instruction;
    execute.operands = cpuSources(i).map((r, index) => {
      if (r === 0) return 0;
      if (state.forwarding) {
        for (const [source, stage] of [
          [memory, 'MEM'],
          [writeback, 'WB'],
        ] as const) {
          if (source && cpuDestination(source.instruction) === r) {
            if (stage === 'MEM' && source.instruction.op === 'LW')
              throw new Error('Unresolved load-use hazard');
            if (source.result === undefined) throw new Error('Missing forwarded value');
            state.events.push({
              type: 'forward',
              producer: source.uid,
              consumer: execute.uid,
              register: r,
              value: source.result,
              from: stage,
            });
            return source.result;
          }
        }
      }
      return execute.operands[index];
    });
    const [a, b] = execute.operands;
    switch (i.op) {
      case 'ADDI':
        execute.result = word(a + i.imm);
        break;
      case 'ADD':
        execute.result = word(a + b);
        break;
      case 'SUB':
        execute.result = word(a - b);
        break;
      case 'LW':
        execute.address = address(word(a + i.imm));
        break;
      case 'SW':
        execute.address = address(word(a + i.imm));
        execute.storeValue = b;
        break;
      case 'BEQ': {
        execute.taken = a === b;
        state.events.push({
          type: 'branch',
          uid: execute.uid,
          taken: execute.taken,
          target: i.target,
          values: [a, b],
        });
        if (execute.taken) {
          const victims = [decode, fetch].filter((p): p is CpuToken => p !== null);
          victims.forEach((p) => {
            p.squashed = true;
          });
          state.flushed.push(...victims.map((p) => p.uid));
          if (victims.length) state.events.push({ type: 'flush', uids: victims.map((p) => p.uid) });
          state.pc = i.target;
        }
        break;
      }
    }
  }
  if (memory?.instruction.op === 'LW') {
    memory.result = state.memory[memory.address!] ?? 0;
    state.events.push({
      type: 'load',
      uid: memory.uid,
      address: memory.address!,
      value: memory.result,
    });
  } else if (memory?.instruction.op === 'SW') {
    state.memory[memory.address!] = memory.storeValue!;
    state.events.push({
      type: 'store',
      uid: memory.uid,
      address: memory.address!,
      value: memory.storeValue!,
    });
  }
  if (decode && !decode.squashed)
    decode.operands = cpuSources(decode.instruction).map((r) => state.registers[r]);
  state.done =
    state.pc >= state.program.length && state.slots.slice(0, 4).every((p) => !p || p.squashed);
  return state;
}

export function runCpu(
  program: readonly CpuInstruction[] = CPU_PROGRAM,
  options: CpuOptions = {},
  maxCycles = 2048,
) {
  if (!Number.isInteger(maxCycles) || maxCycles < 0 || maxCycles > 10000)
    throw new RangeError('Invalid execution bound');
  const frames = [createCpu(program, options)];
  while (!frames.at(-1)!.done && frames.at(-1)!.cycle < maxCycles)
    frames.push(stepCpu(frames.at(-1)!));
  if (!frames.at(-1)!.done) throw new RangeError('Program exceeded cycle budget');
  return frames;
}
/** Direct seek is bounded replay from the same initial state; no elapsed timers. */
export function seekCpu(
  cycle: number,
  program: readonly CpuInstruction[] = CPU_PROGRAM,
  options: CpuOptions = {},
) {
  if (!Number.isFinite(cycle) || cycle < 0 || cycle > 10000)
    throw new RangeError('Invalid seek cycle');
  let state = createCpu(program, options);
  while (state.cycle < Math.floor(cycle) && !state.done) state = stepCpu(state);
  return state;
}
/** Independent ISA interpreter: no stage or forwarding implementation is reused. */
export function cpuReference(
  program: readonly CpuInstruction[] = CPU_PROGRAM,
  options: CpuOptions = {},
  maxInstructions = 2048,
) {
  const start = createCpu(program, options);
  const registers = [...start.registers],
    memory = { ...start.memory },
    retiredPcs: number[] = [];
  let pc = 0;
  while (pc < program.length) {
    if (retiredPcs.length >= maxInstructions)
      throw new RangeError('Reference exceeded instruction budget');
    const i = program[pc],
      a = registers[i.rs1];
    retiredPcs.push(pc);
    let next = pc + 1;
    switch (i.op) {
      case 'ADDI':
        if (i.rd) registers[i.rd] = (a + i.imm) | 0;
        break;
      case 'ADD':
        if (i.rd) registers[i.rd] = (a + registers[i.rs2]) | 0;
        break;
      case 'SUB':
        if (i.rd) registers[i.rd] = (a - registers[i.rs2]) | 0;
        break;
      case 'LW': {
        const value = memory[address((a + i.imm) | 0)] ?? 0;
        if (i.rd) registers[i.rd] = value;
        break;
      }
      case 'SW':
        memory[address((a + i.imm) | 0)] = registers[i.rs2];
        break;
      case 'BEQ':
        if (a === registers[i.rs2]) next = i.target;
        break;
    }
    pc = next;
  }
  return { registers, memory, retiredPcs, pc };
}
export function cpuSameResult(
  a: Pick<CpuState, 'registers' | 'memory' | 'retiredPcs'>,
  b: Pick<CpuState, 'registers' | 'memory' | 'retiredPcs'>,
) {
  const addresses = new Set([...Object.keys(a.memory), ...Object.keys(b.memory)].map(Number));
  return (
    a.registers.every((v, r) => v === b.registers[r]) &&
    [...addresses].every((k) => (a.memory[k] ?? 0) === (b.memory[k] ?? 0)) &&
    a.retiredPcs.length === b.retiredPcs.length &&
    a.retiredPcs.every((v, i) => v === b.retiredPcs[i])
  );
}
export type CpuTraces = { pipeline: CpuState[]; sequential: CpuState[]; waiting: CpuState[] };
export function cpuTraces(input = 11): CpuTraces {
  const memory = { 0: word(input), 4: 0, 8: 0 };
  return {
    pipeline: runCpu(CPU_PROGRAM, { memory }),
    sequential: runCpu(CPU_PROGRAM, { memory, mode: 'sequential' }),
    waiting: runCpu(CPU_PROGRAM, { memory, forwarding: false }),
  };
}
export function cpuFrame(frames: CpuState[], cycle: number) {
  return frames[Math.max(0, Math.min(frames.length - 1, Math.floor(cycle)))];
}
/** Each chapter independently reconstructs the same program, including prior writes. */
export function cpuShot(chapter: number, progress: number, traces: CpuTraces) {
  const c = Math.max(0, Math.min(7, Number.isFinite(chapter) ? Math.floor(chapter) : 0));
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const sweep = (start: number, end: number, begin = 0.12, finish = 0.82) =>
    Math.round(start + (end - start) * Math.max(0, Math.min(1, (p - begin) / (finish - begin))));
  const sequence = (values: number[]) =>
    values[Math.min(values.length - 1, Math.floor(p * values.length))];
  const key = c === 0 ? 'sequential' : c === 3 ? 'waiting' : 'pipeline';
  const cycles = [
    sweep(1, 5),
    sweep(1, 6),
    sweep(0, traces.sequential.length - 1),
    sequence([3, 4, 5, 5, 6, 6, 7, 8]),
    sequence([3, 4, 5, 5, 5, 5, 6, 7]),
    sequence([5, 6, 7, 7, 7, 8, 8, 9]),
    sequence([8, 9, 9, 9, 10, 11, 12, 12]),
    sweep(0, traces.sequential.length - 1, 0.05, 0.55),
  ];
  const cycle = cycles[c];
  return {
    chapter: c,
    cycle,
    trace: traces[key],
    state: cpuFrame(traces[key], cycle),
    reference: cpuFrame(traces.sequential, cycle),
    compare: c === 2 || c === 7,
    verify: c === 7 && p >= 0.55,
    focus:
      c === 0
        ? [0]
        : c <= 2
          ? [0, 1, 2]
          : c <= 4
            ? [0, 1, 2]
            : c === 5
              ? [3, 4, 5]
              : c === 6
                ? [5, 6, 7, 8]
                : [4, 8, 9],
  };
}
