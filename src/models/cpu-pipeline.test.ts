import { describe, expect, it } from 'vitest';
import {
  CPU_PROGRAM,
  CPU_STAGES,
  cpuFrame,
  cpuReference,
  cpuSameResult,
  cpuShot,
  cpuTraces,
  createCpu,
  runCpu,
  seekCpu,
  stepCpu,
  type CpuInstruction,
} from './cpu-pipeline';

describe('five-stage instruction workshop', () => {
  it('finishes the identical program with the same architectural state and useful order', () => {
    for (const input of [-2147483648, -20, 0, 5, 11, 100, 2147483647]) {
      const traces = cpuTraces(input);
      const reference = cpuReference(CPU_PROGRAM, { memory: { 0: input, 4: 0, 8: 0 } });
      for (const trace of Object.values(traces)) {
        expect(cpuSameResult(trace.at(-1)!, reference)).toBe(true);
        expect(trace.at(-1)!.pc).toBe(reference.pc);
      }
    }
    const traces = cpuTraces();
    expect(traces.pipeline.at(-1)!.registers).toEqual([0, 4, 7, 11, 11, 22, 0, 23]);
    expect(traces.pipeline.at(-1)!.memory).toEqual({ 0: 11, 4: 0, 8: 22 });
    expect(traces.pipeline.at(-1)!.cycle).toBe(15);
    expect(traces.sequential.at(-1)!.cycle).toBe(40);
    expect(traces.pipeline.at(-1)!.retiredPcs).toEqual([0, 1, 2, 3, 4, 5, 8, 9]);
  });

  it('improves throughput while a hazard-free instruction still takes five stage cycles', () => {
    const program: CpuInstruction[] = Array.from({ length: 7 }, (_, k) => ({
      op: 'ADDI',
      rd: k + 1,
      rs1: 0,
      imm: k + 1,
    }));
    const pipeline = runCpu(program),
      sequential = runCpu(program, { mode: 'sequential' });
    expect(pipeline.at(-1)!.cycle).toBe(11);
    expect(sequential.at(-1)!.cycle).toBe(35);
    for (const trace of [pipeline, sequential]) {
      expect(
        trace.slice(1, 6).map((s) => CPU_STAGES[s.slots.findIndex((p) => p?.uid === 1)]),
      ).toEqual([...CPU_STAGES]);
      expect(trace[4].registers[1]).toBe(0);
      expect(trace[5].registers[1]).toBe(1);
    }
    expect(pipeline.slice(5).map((s) => s.retired.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('forwards both operands from distinct latches before the consumer writes back', () => {
    const frames = cpuTraces().pipeline;
    expect(frames[5].slots[2]?.result).toBe(11);
    expect(frames[5].registers[3]).toBe(0);
    expect(frames[5].events.filter((e) => e.type === 'forward')).toEqual([
      { type: 'forward', producer: 1, consumer: 3, register: 1, value: 4, from: 'WB' },
      { type: 'forward', producer: 2, consumer: 3, register: 2, value: 7, from: 'MEM' },
    ]);
  });

  it('holds IF and ID for one load-use cycle, inserts an EX bubble, and keeps older work moving', () => {
    const f = cpuTraces().pipeline;
    expect(f.at(-1)!.stalls).toBe(1);
    expect(f[7].slots[2]).toBe(null);
    for (const index of [0, 1]) expect(f[7].slots[index]?.uid).toBe(f[6].slots[index]?.uid);
    expect(f[7].pc).toBe(f[6].pc);
    expect(f[7].slots[3]?.instruction.op).toBe('LW');
    expect(f[8].slots[2]?.result).toBe(22);
    expect(f[8].events).toContainEqual({
      type: 'forward',
      producer: 4,
      consumer: 5,
      register: 4,
      value: 11,
      from: 'WB',
    });
  });

  it('waits for writeback when bypassing is disabled, without changing any result', () => {
    const traces = cpuTraces();
    expect(traces.waiting[5].slots[1]?.pc).toBe(2);
    expect(traces.waiting[6].slots[1]?.pc).toBe(2);
    expect(traces.waiting[7].slots[2]?.result).toBe(11);
    expect(traces.waiting.at(-1)!.stalls).toBeGreaterThan(1);
    expect(traces.waiting.flatMap((f) => f.events).some((e) => e.type === 'forward')).toBe(false);
  });

  it('squashes the actual two younger identities and blocks wrong-path memory writes', () => {
    const frames = cpuTraces().pipeline;
    expect(frames[9].events).toContainEqual({ type: 'flush', uids: [7, 8] });
    expect(frames[9].slots[1]?.squashed).toBe(true);
    expect(frames[9].slots[0]?.squashed).toBe(true);
    expect(frames[10].slots[0]?.pc).toBe(8);
    expect(frames[10].slots[1]).toBe(null);
    expect(frames[10].slots[2]).toBe(null);
    expect(frames.every((f) => f.memory[4] === 0)).toBe(true);
    expect(frames.at(-1)!.retired).not.toContain(7);
    expect(frames.at(-1)!.retired).not.toContain(8);
    const untaken = cpuTraces(5).pipeline.at(-1)!;
    expect(untaken.flushed).toEqual([]);
    expect(untaken.memory[4]).toBe(16);
    expect(untaken.retired).toHaveLength(10);
  });

  it('prioritizes the newest producer, treats r0 as zero, and forwards store data', () => {
    const program: CpuInstruction[] = [
      { op: 'ADDI', rd: 1, rs1: 0, imm: 1 },
      { op: 'ADDI', rd: 1, rs1: 1, imm: 1 },
      { op: 'ADD', rd: 2, rs1: 1, rs2: 1 },
      { op: 'SW', rs1: 0, rs2: 2, imm: 4 },
      { op: 'LW', rd: 0, rs1: 0, imm: 4 },
      { op: 'ADD', rd: 3, rs1: 0, rs2: 2 },
      { op: 'ADDI', rd: 0, rs1: 0, imm: 99 },
      { op: 'SUB', rd: 4, rs1: 3, rs2: 0 },
    ];
    const frames = runCpu(program);
    expect(frames[5].slots[2]?.result).toBe(4);
    expect(frames.at(-1)!.registers).toEqual([0, 2, 4, 4, 4, 0, 0, 0]);
    expect(frames.at(-1)!.memory[4]).toBe(4);
    expect(frames.at(-1)!.stalls).toBe(0);
    expect(cpuSameResult(frames.at(-1)!, cpuReference(program))).toBe(true);
  });

  it('handles load-to-store, load-to-branch, taken branch at the end, and backward refetch identities', () => {
    const programs: CpuInstruction[][] = [
      [
        { op: 'LW', rd: 1, rs1: 0, imm: 0 },
        { op: 'SW', rs1: 0, rs2: 1, imm: 4 },
      ],
      [
        { op: 'LW', rd: 1, rs1: 0, imm: 4 },
        { op: 'BEQ', rs1: 1, rs2: 0, target: 3 },
        { op: 'SW', rs1: 0, rs2: 1, imm: 8 },
      ],
      [
        { op: 'ADDI', rd: 1, rs1: 1, imm: 1 },
        { op: 'BEQ', rs1: 1, rs2: 2, target: 3 },
        { op: 'BEQ', rs1: 0, rs2: 0, target: 0 },
      ],
    ];
    for (const program of programs) {
      const options = { registers: [0, 0, 3, 0, 0, 0, 0, 0] };
      for (const forwarding of [true, false]) {
        const trace = runCpu(program, { ...options, forwarding });
        expect(cpuSameResult(trace.at(-1)!, cpuReference(program, options))).toBe(true);
        expect(new Set(trace.at(-1)!.retired).size).toBe(trace.at(-1)!.retired.length);
      }
    }
  });

  it('matches independent interpretation for 150 deterministic mixed dependency programs', () => {
    let seed = 1947;
    const random = (n: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % n;
    };
    for (let trial = 0; trial < 150; trial++) {
      const program: CpuInstruction[] = Array.from({ length: 18 }, (_, index) => {
        const rd = random(8),
          rs1 = random(8),
          rs2 = random(8);
        switch (random(6)) {
          case 0:
            return { op: 'ADDI', rd, rs1, imm: random(50) - 25 };
          case 1:
            return { op: 'ADD', rd, rs1, rs2 };
          case 2:
            return { op: 'SUB', rd, rs1, rs2 };
          case 3:
            return { op: 'LW', rd, rs1: 0, imm: random(3) * 4 };
          case 4:
            return { op: 'SW', rs1: 0, rs2, imm: random(3) * 4 };
          default:
            return { op: 'BEQ', rs1, rs2, target: Math.min(18, index + 3) };
        }
      });
      const expected = cpuReference(program);
      for (const options of [
        { forwarding: true },
        { forwarding: false },
        { mode: 'sequential' as const },
      ]) {
        const frames = runCpu(program, options),
          last = frames.at(-1)!;
        expect(cpuSameResult(last, expected)).toBe(true);
        for (const f of frames) {
          const uids = f.slots.filter((p) => p && !p.squashed).map((p) => p!.uid);
          expect(new Set(uids).size).toBe(uids.length);
          expect(f.registers[0]).toBe(0);
        }
      }
    }
  });

  it('reconstructs every continuous frame by direct seek, including backward and chapter jumps', () => {
    for (const options of [
      { forwarding: true },
      { forwarding: false },
      { mode: 'sequential' as const },
    ]) {
      const frames = runCpu(CPU_PROGRAM, options);
      const preserved = JSON.stringify(frames);
      for (let cycle = frames.length - 1; cycle >= 0; cycle--)
        expect(seekCpu(cycle + 0.2, CPU_PROGRAM, options)).toEqual(frames[cycle]);
      expect(JSON.stringify(frames)).toBe(preserved);
    }
    const traces = cpuTraces();
    for (let chapter = 7; chapter >= 0; chapter--)
      for (const p of [1, 0.75, 0.5, 0.25, 0]) {
        const shot = cpuShot(chapter, p, traces);
        expect(shot.state).toEqual(
          seekCpu(shot.cycle, CPU_PROGRAM, {
            mode: chapter === 0 ? 'sequential' : 'pipeline',
            forwarding: chapter !== 3,
          }),
        );
        expect(shot.reference).toEqual(cpuFrame(traces.sequential, shot.cycle));
      }
  });

  it('rejects malformed inputs and bounds nonterminating execution', () => {
    expect(createCpu([]).done).toBe(true);
    expect(runCpu([])).toHaveLength(1);
    expect(() => createCpu([{ op: 'ADDI', rd: 8, rs1: 0, imm: 1 }])).toThrow();
    expect(() => createCpu([{ op: 'ADDI', rd: 1, rs1: 0, imm: 2048 }])).toThrow();
    expect(() => createCpu(CPU_PROGRAM, { memory: { 2: 10 } })).toThrow();
    expect(() => seekCpu(NaN)).toThrow();
    expect(() => seekCpu(-1)).toThrow();
    expect(() => runCpu([{ op: 'LW', rd: 1, rs1: 0, imm: 2 }])).toThrow();
    expect(() => runCpu([{ op: 'BEQ', rs1: 0, rs2: 0, target: 0 }], {}, 20)).toThrow();
    const end = runCpu().at(-1)!;
    expect(stepCpu(end)).toBe(end);
  });
});
