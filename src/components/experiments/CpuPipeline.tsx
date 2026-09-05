import { Fragment, useId, useMemo, useState, type CSSProperties } from 'react';
import { t } from '../../i18n';
import {
  CPU_PROGRAM,
  CPU_STAGES,
  cpuAssembly,
  cpuDestination,
  cpuFrame,
  cpuIdentity,
  cpuSameResult,
  cpuShot,
  cpuTraces,
  type CpuState,
  type CpuToken,
} from '../../models/cpu-pipeline';
import { useShowcase } from '../lab/Showcase';
import '../../styles/cpu-pipeline.css';

const stageNames = ['取指', '译码', '执行', '访存', '写回'];
const inks = [
  '#9b543b',
  '#326c71',
  '#766195',
  '#986b25',
  '#316f5b',
  '#8b536f',
  '#5d6672',
  '#896947',
  '#37667e',
  '#736638',
];
const tokenStyle = (pc: number, slot = 0) =>
  ({ '--cpu-ink': inks[pc % inks.length], '--cpu-slot': slot }) as CSSProperties;

function tokenDetail(token: CpuToken, stage: number) {
  const i = token.instruction;
  if (token.squashed) return t('已清除');
  if (stage === 0) return cpuIdentity(token.pc);
  if (stage === 1)
    return token.operands
      .map((n, j) => `r${j === 0 ? i.rs1 : 'rs2' in i ? i.rs2 : i.rs1}=${n}`)
      .join(' · ');
  if (i.op === 'BEQ')
    return token.taken === undefined
      ? t('等待比较')
      : `${token.operands[0]} ${token.taken ? '=' : '≠'} ${token.operands[1]}`;
  if (i.op === 'SW') return `M[${token.address}] ← ${token.storeValue}`;
  if (i.op === 'LW' && stage < 4)
    return stage === 2 ? `M[${token.address}] → ?` : `M[${token.address}] → ${token.result}`;
  const rd = cpuDestination(i);
  return rd === null ? t('无寄存器写入') : `r${rd} ${stage === 4 ? '←' : '⇢'} ${token.result}`;
}

function EventReceipt({ state }: { state: CpuState }) {
  const identity = (uid: number) => {
    const token = state.slots.find((p) => p?.uid === uid);
    return token ? cpuIdentity(token.pc) : `#${uid}`;
  };
  const flush = state.events.find((e) => e.type === 'flush');
  const branch = state.events.find((e) => e.type === 'branch');
  const stall = state.events.find((e) => e.type === 'stall');
  const forwards = state.events.filter((e) => e.type === 'forward');
  const memory = state.events.find((e) => e.type === 'load' || e.type === 'store');
  const execute = state.slots[2];
  let title = t('每拍推进一个工位'),
    detail = t('空位没有指令；编号跟随同一条指令。'),
    kind = 'plain';
  if (flush) {
    title = t('分支成立，清除错误路径');
    detail = `${flush.uids.map(identity).join(' + ')} → ${t('不写寄存器，也不写内存')}`;
    kind = 'flush';
  } else if (stall) {
    title = t(stall.reason === 'load-use' ? '数据还没读出，等一拍' : '前递关闭，等待写回');
    detail = `${identity(stall.consumer)} · ${stall.registers.map((r) => `r${r}`).join(', ')} · ${t('取指和译码保持，执行级留空')}`;
    kind = 'stall';
  } else if (forwards.length) {
    title = t('已算出的值，直接送到执行级');
    detail = forwards
      .map(
        (e) =>
          `${identity(e.producer)} ${e.from} → ${identity(e.consumer)} EX · r${e.register}=${e.value}`,
      )
      .join(' / ');
    kind = 'forward';
  } else if (branch) {
    title = t(branch.taken ? '分支成立，跳转目标' : '分支不成立，继续顺序执行');
    detail = `${branch.values[0]} ${branch.taken ? '=' : '≠'} ${branch.values[1]} → ${branch.taken ? cpuIdentity(branch.target) : t('下一条指令')}`;
  } else if (memory && 'address' in memory) {
    title = t(memory.type === 'load' ? '访存级读到真实数据' : '访存级写入真实数据');
    detail = `${identity(memory.uid)} · M[${memory.address}] ${memory.type === 'load' ? '→' : '←'} ${memory.value}`;
  } else if (execute && ['ADD', 'ADDI', 'SUB'].includes(execute.instruction.op)) {
    title = t('执行级算出结果，稍后才写回');
    const i = execute.instruction;
    detail = `${cpuIdentity(execute.pc)} · ${execute.operands[0]} ${i.op === 'SUB' ? '−' : '+'} ${i.op === 'ADDI' ? i.imm : execute.operands[1]} = ${execute.result}`;
  } else if (state.done) {
    title = t('流水线已排空');
    detail = t('有效指令已全部完成，结果保存在寄存器与内存。');
  } else if (state.mode === 'sequential') {
    title = t('一条完成，下一条才开始');
    detail = t('同样五个工位，同样每级一拍。');
  }
  return (
    <div className="cpu-receipt" data-kind={kind}>
      <span className="cpu-receipt-mark" aria-hidden="true">
        {kind === 'flush' ? '×' : kind === 'stall' ? 'Ⅱ' : kind === 'forward' ? '↶' : '→'}
      </span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function Workshop({ state, focus }: { state: CpuState; focus: number[] }) {
  const stall = state.events.some((e) => e.type === 'stall');
  return (
    <div className="cpu-workshop" aria-label={t('当前五个工位中的指令')}>
      <div className="cpu-stations">
        {CPU_STAGES.map((stage, index) => (
          <div key={stage} className="cpu-station">
            <header>
              <b>{stage}</b>
              <span>{t(stageNames[index])}</span>
            </header>
            <span className="cpu-vacancy">
              {!state.slots[index] ? t(index === 2 && stall ? '等待气泡' : '空闲') : ''}
            </span>
          </div>
        ))}
      </div>
      <div className="cpu-moving-instructions">
        {state.slots.map(
          (token, slot) =>
            token && (
              <div
                key={token.uid}
                className="cpu-ticket"
                style={tokenStyle(token.pc, slot)}
                data-focus={focus.includes(token.pc)}
                data-squashed={!!token.squashed}
              >
                <div className="cpu-ticket-heading">
                  <b>{cpuIdentity(token.pc)}</b>
                  <span>{token.instruction.op}</span>
                </div>
                <span className="cpu-ticket-detail">{tokenDetail(token, slot)}</span>
              </div>
            ),
        )}
      </div>
      <svg
        className="cpu-bypass-lines"
        viewBox="0 0 1000 64"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {state.events
          .filter((e) => e.type === 'forward')
          .map((e, i) => {
            const source = e.from === 'MEM' ? 700 : 900;
            return (
              <g key={`${e.register}-${i}`}>
                <path d={`M${source} 0 C${source} ${36 + i * 15},500 ${36 + i * 15},500 0`} />
                <path d="m493 10 7-9 7 9" />
              </g>
            );
          })}
      </svg>
    </div>
  );
}

function TimingPaper({
  trace,
  cycle,
  focus,
  compact = false,
  all = false,
}: {
  trace: CpuState[];
  cycle: number;
  focus: number[];
  compact?: boolean;
  all?: boolean;
}) {
  const count = compact ? 4 : 9,
    end = Math.max(count, cycle),
    start = end - count + 1;
  const ticks = Array.from({ length: count }, (_, i) => start + i);
  const rows = all && !compact ? CPU_PROGRAM.map((_, i) => i) : focus;
  return (
    <div className={`cpu-timing-paper ${compact ? 'cpu-timing-phone' : 'cpu-timing-desktop'}`}>
      <div className="cpu-paper-heading">
        <span>{t('留下每一拍的足迹')}</span>
        <span>{t('拍数')} →</span>
      </div>
      <div
        className="cpu-timing-grid"
        role="table"
        aria-label={t('指令时序轨迹')}
        style={{ '--cpu-columns': count } as CSSProperties}
      >
        <div className="cpu-timing-row" role="row">
          <span role="columnheader">{compact ? '#' : t('指令')}</span>
          {ticks.map((tick) => (
            <span role="columnheader" key={tick} data-current={tick === cycle}>
              {tick}
            </span>
          ))}
        </div>
        {rows.map((pc) => (
          <div
            className="cpu-timing-row"
            role="row"
            key={pc}
            style={tokenStyle(pc)}
            data-focus={focus.includes(pc)}
          >
            <b role="rowheader">
              {cpuIdentity(pc)}
              <small>{compact ? '' : CPU_PROGRAM[pc].op}</small>
            </b>
            {ticks.map((tick) => {
              const frame = tick <= cycle ? trace[tick] : undefined;
              const slot = frame?.slots.findIndex((p) => p?.pc === pc) ?? -1;
              const token = slot < 0 ? null : frame!.slots[slot];
              const held = slot < 2 && !!token && trace[tick - 1]?.slots[slot]?.uid === token.uid;
              return (
                <span
                  role="cell"
                  key={tick}
                  data-current={tick === cycle}
                  data-occupied={!!token}
                  data-held={held}
                  data-flushed={!!token?.squashed}
                  title={
                    token
                      ? `${cpuIdentity(pc)} · ${CPU_STAGES[slot]}${held ? ` · ${t('保持')}` : ''}${token.squashed ? ` · ${t('已清除')}` : ''}`
                      : undefined
                  }
                >
                  {token?.squashed ? '×' : held ? 'Ⅱ' : token ? CPU_STAGES[slot] : '·'}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="cpu-paper-legend">
        Ⅱ {t('保持')} <span>× {t('已清除')}</span> <span>· {t('空闲')}</span>
      </p>
    </div>
  );
}

function RegisterStrip({ state }: { state: CpuState }) {
  const demo = useShowcase();
  const focusedRegisters = [[1], [1, 2, 3], [7], [1, 2, 3], [1, 2, 3], [3, 4], [5], [7]][
    demo.chapter
  ] ?? [1, 2, 3];
  const focusedMemory =
    demo.chapter === 5
      ? [0]
      : demo.chapter === 6
        ? [4]
        : demo.chapter === 2 || demo.chapter === 7
          ? [4, 8]
          : [];
  return (
    <div className="cpu-register-strip" aria-label={t('本拍结束后的架构状态')}>
      {[1, 2, 3, 4, 5, 7].map((r) => (
        <span
          key={r}
          data-mobile-focus={focusedRegisters.includes(r)}
          data-write={state.events.some((e) => e.type === 'write' && e.register === r)}
        >
          <small>r{r}</small>
          <b>{state.registers[r]}</b>
        </span>
      ))}
      {[0, 4, 8].map((a) => (
        <span
          key={`m${a}`}
          data-mobile-focus={focusedMemory.includes(a)}
          data-write={state.events.some((e) => e.type === 'store' && e.address === a)}
        >
          <small>M[{a}]</small>
          <b>{state.memory[a] ?? 0}</b>
        </span>
      ))}
    </div>
  );
}

function Comparison({
  pipeline,
  reference,
  total,
  verify,
}: {
  pipeline: CpuState;
  reference: CpuState;
  total: number;
  verify: boolean;
}) {
  const equal = pipeline.done && reference.done && cpuSameResult(pipeline, reference);
  return (
    <div className="cpu-comparison">
      <p className="cpu-comparison-premise">{t('同一份程序 · 同一初始数据 · 同样每级一拍')}</p>
      {[pipeline, reference].map((state, index) => (
        <div className="cpu-comparison-lane" key={index}>
          <div className="cpu-lane-heading">
            <h3>
              <span className="cpu-lane-title-full">
                {t(index === 0 ? '五级重叠执行' : '五级逐条执行')}
              </span>
              <span className="cpu-lane-title-short">
                {t(index === 0 ? '流水执行' : '逐条执行')}
              </span>
            </h3>
            <span>
              <b>{state.cycle}</b> {t('拍')} · {state.retired.length} {t('条完成')}
            </span>
          </div>
          <div className="cpu-duration-rail">
            <div style={{ width: `${(100 * state.cycle) / total}%` }} />
            <span>{state.done ? t('完成') : t('进行中')}</span>
          </div>
          <div className="cpu-output-tape" aria-label={t('已完成的有效指令')}>
            {state.retiredPcs.map((pc, k) => (
              <span key={k} style={tokenStyle(pc)}>
                {cpuIdentity(pc)}
                <small>✓</small>
              </span>
            ))}
            {!state.retired.length && <i>{t('第一条仍在经过五个工位')}</i>}
          </div>
          <p className="cpu-latency-note">
            I1 · IF → WB · <b>5 {t('拍')}</b>
          </p>
        </div>
      ))}
      <div className="cpu-equality" data-equal={equal}>
        <b>{equal ? '=' : '…'}</b>
        <div>
          <strong>{t(equal ? '结果一致，完成时间不同' : '等待两种方式完成后核对')}</strong>
          <p>
            {t(equal ? '全部寄存器、内存和有效指令顺序均相同。' : '只把真正完成的指令记在下方。')}
          </p>
        </div>
      </div>
      {verify && (
        <div className="cpu-proof">
          <span>{t('实算周期分解')}</span>
          <p>
            <b>{pipeline.cycle}</b> = {pipeline.retired.length} + 4 + {pipeline.stalls} +{' '}
            {pipeline.flushed.length}
          </p>
          <small>{t('有效指令 + 填充排空 + 数据停顿 + 分支空位')}</small>
        </div>
      )}
      <RegisterStrip state={pipeline} />
    </div>
  );
}

export default function CpuPipeline() {
  const demo = useShowcase();
  const controlId = useId();
  const [input, setInput] = useState(11),
    [forwarding, setForwarding] = useState(true),
    [manualCycle, setManualCycle] = useState(5);
  const storyTraces = useMemo(() => cpuTraces(), []);
  const exploration = useMemo(() => cpuTraces(input), [input]);
  const shot = cpuShot(demo.chapter, demo.chapterProgress, storyTraces);
  const trace = demo.watch ? shot.trace : forwarding ? exploration.pipeline : exploration.waiting;
  const state = demo.watch ? shot.state : cpuFrame(trace, manualCycle);
  const focus = demo.watch
    ? shot.focus
    : state.slots
        .filter((p) => p && !p.squashed)
        .slice(-3)
        .map((p) => p!.pc);
  const cycle = state.cycle;
  const comparison = demo.watch && shot.compare;
  const currentTitle = comparison
    ? '重叠带来吞吐量'
    : state.mode === 'sequential'
      ? '跟住一条指令'
      : state.forwarding
        ? '让五个工位同时工作'
        : '等待正确的数据';
  return (
    <section
      className="cpu-study"
      data-playing={demo.watch && demo.playing}
      data-watch={demo.watch}
      data-view={comparison ? 'compare' : 'workshop'}
      aria-label={t('CPU 指令流水线')}
    >
      <div className="cpu-masthead">
        <span>INSTRUCTION WORKSHOP</span>
        <span>{t('五级顺序教学模型')}</span>
      </div>
      <div className="cpu-headline">
        <h2>{t(currentTitle)}</h2>
        <div className="cpu-clock">
          <span>{t('第 {0} 拍', comparison ? shot.cycle : cycle)}</span>
          <b>{String(comparison ? shot.cycle : cycle).padStart(2, '0')}</b>
        </div>
      </div>
      {comparison ? (
        <Comparison
          pipeline={shot.state}
          reference={shot.reference}
          total={storyTraces.sequential.length - 1}
          verify={shot.verify}
        />
      ) : (
        <>
          <Workshop state={state} focus={focus} />
          <EventReceipt state={state} />
          <TimingPaper trace={trace} cycle={cycle} focus={focus} all={!demo.watch} />
          <TimingPaper
            trace={trace}
            cycle={cycle}
            focus={focus.length ? focus : [0, 1, 2]}
            compact
          />
          <RegisterStrip state={state} />
        </>
      )}
      {!demo.watch && (
        <div className="cpu-explore">
          <div className="cpu-step-controls">
            <button disabled={cycle === 0} onClick={() => setManualCycle(Math.max(0, cycle - 1))}>
              {t('上一拍')}
            </button>
            <button disabled={state.done} onClick={() => setManualCycle(cycle + 1)}>
              {t('下一拍')}
            </button>
            <button onClick={() => setManualCycle(0)}>{t('回到第零拍')}</button>
            <button onClick={() => setManualCycle(trace.length - 1)}>{t('运行到完成')}</button>
          </div>
          <label className="cpu-range" htmlFor={`${controlId}-cycle`}>
            <span>
              {t('逐拍查看')}{' '}
              <output>
                {cycle} / {trace.length - 1}
              </output>
            </span>
            <input
              id={`${controlId}-cycle`}
              type="range"
              min={0}
              max={trace.length - 1}
              step={1}
              value={cycle}
              onChange={(e) => setManualCycle(Number(e.target.value))}
            />
          </label>
          <div className="cpu-experiment-inputs">
            <label className="cpu-range" htmlFor={`${controlId}-input`}>
              <span>
                {t('初始内存 M[0]')} <output>{input}</output>
              </span>
              <input
                id={`${controlId}-input`}
                type="range"
                min={-20}
                max={30}
                step={1}
                value={input}
                onChange={(e) => {
                  setInput(Number(e.target.value));
                  setManualCycle(0);
                }}
              />
            </label>
            <label className="cpu-forward-toggle">
              <input
                type="checkbox"
                checked={forwarding}
                onChange={(e) => {
                  setForwarding(e.target.checked);
                  setManualCycle(0);
                }}
              />
              <span>{t('启用数据前递')}</span>
            </label>
          </div>
          <p>{t('M[0] 等于 11 时分支成立；改成其他数，观察 I7、I8 保留下来。')}</p>
          <div className="cpu-manual-result" role="status">
            {state.done
              ? t(
                  cpuSameResult(state, exploration.sequential.at(-1)!)
                    ? '与顺序参考结果一致。'
                    : '结果不一致。',
                )
              : t('逐拍推进，检查数据何时可用。')}{' '}
            <span>{t('停顿 {0} 拍，清除 {1} 条。', state.stalls, state.flushed.length)}</span>
          </div>
        </div>
      )}
      <details className="cpu-program">
        <summary>{t('打开这份程序与模型约定')}</summary>
        <div className="cpu-program-body">
          <ol>
            {CPU_PROGRAM.map((instruction, index) => (
              <li key={index} style={tokenStyle(index)}>
                <b>{cpuIdentity(index)}</b>
                <code>{cpuAssembly(instruction)}</code>
              </li>
            ))}
          </ol>
          <div>
            <p>{t('工位显示本拍工作；数值是本拍结束后的状态。')}</p>
            <p>
              {t('指令语义参考 RISC-V，使用八个 32 位寄存器。r0 恒为零，分支目标写成指令编号。')}
            </p>
            <p>{t('指令与数据存储分开，访存固定一拍；不模拟缓存、异常或乱序执行。')}</p>
            <p>{t('关闭前递时，译码等待写回；开启时，加载后的紧邻使用仍需一拍停顿。')}</p>
            <p>{t('逐条参考也经过五个等长工位，比较不代表真实芯片的频率或性能倍数。')}</p>
            <dl className="cpu-full-registers">
              {state.registers.map((value, r) => (
                <Fragment key={r}>
                  <dt>r{r}</dt>
                  <dd>{value}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        </div>
      </details>
    </section>
  );
}
