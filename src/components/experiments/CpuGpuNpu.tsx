import { useId, useMemo, useState, type CSSProperties } from 'react';
import { t } from '../../i18n';
import {
  COMPUTE_INPUT,
  COMPUTE_WEIGHTS,
  computeArrayCell,
  computeFrame,
  computeReference,
  computeShot,
  computeTrace,
  type ComputeEngine,
  type ComputeFrame,
  type ComputeMatrix,
} from '../../models/cpu-gpu-npu';
import { useShowcase } from '../lab/Showcase';
import '../../styles/cpu-gpu-npu.css';

const identity = (row: number, column: number) => `Y${row + 1}${column + 1}`;
const number = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
function Matrix({
  values,
  label,
  focus = [],
  selectable,
}: {
  values: (number | null)[][];
  label: string;
  focus?: number[];
  selectable?: (index: number) => void;
}) {
  return (
    <div className="cgn-matrix-wrap">
      <span className="cgn-matrix-name">{label}</span>
      <div className="cgn-matrix" role="group" aria-label={label}>
        {values.flatMap((row, i) =>
          row.map((v, j) => {
            const index = i * 4 + j,
              style = {
                '--cgn-value': v === null ? 0 : Math.min(1, Math.abs(v) / 5),
              } as CSSProperties;
            return selectable ? (
              <button
                type="button"
                key={index}
                style={style}
                data-focus={focus.includes(index)}
                onClick={() => selectable(index)}
                aria-label={`${identity(i, j)}: ${v === null ? t('尚未写入') : number(v)}`}
              >
                {v === null ? '·' : number(v)}
              </button>
            ) : (
              <span
                key={index}
                style={style}
                data-focus={focus.includes(index)}
                data-empty={v === null}
              >
                {v === null ? '·' : number(v)}
              </span>
            );
          }),
        )}
      </div>
    </div>
  );
}
function Problem({ input, weights }: { input: ComputeMatrix; weights: ComputeMatrix }) {
  return (
    <div className="cgn-problem">
      <div className="cgn-equation-heading">
        <span>{t('同一份数据，交给三种安排')}</span>
        <strong>Y = ReLU(XW)</strong>
      </div>
      <div className="cgn-problem-matrices">
        <Matrix values={input} label={t('输入 X')} focus={[0, 1, 2, 3]} />
        <b className="cgn-math-sign">×</b>
        <Matrix values={weights} label={t('权重 W')} focus={[0, 4, 8, 12]} />
      </div>
      <div className="cgn-first-dot">
        <span>{t('跟住 Y11')}</span>
        <strong>1 × 1 + 2 × 0 + 0 × (−1) + 1 × 1 = 2</strong>
        <p>{t('一行输入与一列权重相乘相加；负结果变为零。')}</p>
      </div>
      <div className="cgn-three-names">
        <span>
          <b>CPU</b>
          {t('灵活的控制')}
        </span>
        <span>
          <b>GPU</b>
          {t('成组的并行')}
        </span>
        <span>
          <b>NPU</b>
          {t('专用的数据流')}
        </span>
      </div>
    </div>
  );
}
function Dot({
  row,
  column,
  frame,
  input,
  weights,
}: {
  row: number;
  column: number;
  frame: ComputeFrame;
  input: ComputeMatrix;
  weights: ComputeMatrix;
}) {
  const op = frame.operations.find((p) => p.row === row && p.column === column);
  const current = op?.k ?? (frame.kind === 'ready' ? -1 : 3);
  return (
    <div className="cgn-dot">
      <header>
        <b>{identity(row, column)}</b>
        <span>{t('四次乘加，保留一个部分和')}</span>
      </header>
      <div className="cgn-products">
        {Array.from({ length: 4 }, (_, k) => (
          <div
            key={k}
            data-current={frame.kind === 'mac' && current === k}
            data-past={k < current || frame.kind !== 'mac'}
          >
            <span>
              {input[row][k]} × {weights[k][column]}
            </span>
            <b>{input[row][k] * weights[k][column]}</b>
          </div>
        ))}
      </div>
      <div className="cgn-accumulator">
        <span>Σ</span>
        <strong>{number(frame.sums[row][column])}</strong>
        <span>
          {frame.kind === 'mac'
            ? `${op?.before ?? 0} + ${op?.product ?? 0}`
            : `max(0, ${frame.sums[row][column]})`}
        </span>
        <b>
          {frame.kind === 'mac' ? t('部分和') : `${t('写入')} ${frame.output[row][column] ?? '·'}`}
        </b>
      </div>
    </div>
  );
}
function Cpu({
  frame,
  input,
  weights,
}: {
  frame: ComputeFrame;
  input: ComputeMatrix;
  weights: ComputeMatrix;
}) {
  const lane = frame.lanes[0] ?? { row: 0, column: 0 };
  return (
    <div className="cgn-cpu">
      <div className="cgn-chip-heading">
        <b>CPU</b>
        <span>{t('按程序决定下一步')}</span>
      </div>
      <div className="cgn-control-ribbon">
        <span data-active={frame.kind === 'ready'}>{t('读取')}</span>
        <i>→</i>
        <span data-active={frame.kind === 'mac'}>{t('乘加')}</span>
        <i>→</i>
        <span data-active={frame.kind === 'keep' || frame.kind === 'zero'}>{t('判断')}</span>
        <i>→</i>
        <span>{t('下一项')}</span>
      </div>
      <Dot row={lane.row} column={lane.column} frame={frame} input={input} weights={weights} />
      <div className="cgn-branch">
        <code>if (sum &lt; 0)</code>
        <span data-active={frame.kind === 'zero'}>{t('写入零')}</span>
        <span data-active={frame.kind === 'keep'}>{t('保留原值')}</span>
      </div>
      <div className="cgn-result-line">
        <Matrix
          values={frame.output}
          label={t('已写入的 Y')}
          focus={[lane.row * 4 + lane.column]}
        />
        <details>
          <summary>{t('CPU 教学简化')}</summary>
          <p>{t('此处只画一个标量执行通道。真实 CPU 也有多核、流水线与向量计算。')}</p>
        </details>
      </div>
    </div>
  );
}
function Gpu({ frame }: { frame: ComputeFrame }) {
  const row = frame.lanes[0]?.row ?? 0;
  const instruction =
    frame.kind === 'mac'
      ? `Σ += X × W · k=${(frame.operations[0]?.k ?? 0) + 1}`
      : frame.kind === 'keep'
        ? 'sum ≥ 0 → Y = sum'
        : frame.kind === 'zero'
          ? 'sum < 0 → Y = 0'
          : t('等待同一条指令');
  return (
    <div className="cgn-gpu">
      <div className="cgn-chip-heading">
        <b>GPU</b>
        <span>{t('一条指令，多个数据身份')}</span>
      </div>
      <div className="cgn-instruction-bus">
        <span>{t('共同指令')}</span>
        <code>{instruction}</code>
      </div>
      <div className="cgn-lanes">
        {Array.from({ length: 4 }, (_, column) => {
          const lane = frame.lanes.find((p) => p.column === column),
            op = frame.operations.find((p) => p.column === column),
            active = lane?.active ?? false;
          return (
            <div
              className="cgn-lane"
              key={column}
              data-active={active}
              data-masked={!!lane && !active}
            >
              <span className="cgn-lane-index">{identity(row, column)}</span>
              <div className="cgn-lane-link" />
              <div className="cgn-lane-core">
                <span>{op ? `${op.a} × ${op.b}` : active ? t('执行') : t('等待')}</span>
                <strong>{number(frame.sums[row][column])}</strong>
                <small>Σ</small>
              </div>
              <div className="cgn-lane-link" />
              <b className="cgn-lane-out">{frame.output[row][column] ?? '·'}</b>
              <span className="cgn-mask-label">{lane && !active ? t('掩蔽') : t('通道')}</span>
            </div>
          );
        })}
      </div>
      <div className="cgn-result-line">
        <Matrix
          values={frame.output}
          label={t('已写入的 Y')}
          focus={Array.from({ length: 4 }, (_, j) => row * 4 + j)}
        />
        <details>
          <summary>{t('GPU 教学简化')}</summary>
          <p>{t('只显示四条教学通道。GPU 能处理通用并行计算，也可含矩阵专用单元。')}</p>
        </details>
      </div>
    </div>
  );
}
function Npu({
  frame,
  phase,
  selected,
  setSelected,
}: {
  frame: ComputeFrame;
  phase: number;
  selected: [number, number];
  setSelected?: (cell: [number, number]) => void;
}) {
  const [row, column] = selected,
    op = frame.operations.find((p) => p.row === row && p.column === column);
  return (
    <div className="cgn-npu">
      <div className="cgn-chip-heading">
        <b>NPU</b>
        <span>{t('数据经过相邻单元，部分和留在原处')}</span>
      </div>
      <div className="cgn-array-caption">
        <span className="cgn-x-ink">X → {t('输入向右')}</span>
        <span className="cgn-w-ink">W ↓ {t('权重向下')}</span>
      </div>
      <div className="cgn-array">
        <svg className="cgn-array-wires" viewBox="0 0 400 400" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <g key={i}>
              <path d={`M0 ${computeArrayCell(i, 0).y} H400`} className="cgn-x-wire" />
              <path d={`M${computeArrayCell(0, i).x} 0 V400`} className="cgn-w-wire" />
            </g>
          ))}
          {frame.operations.flatMap((p) => [
            p.column < 3 && (
              <circle
                key={`x${p.row}${p.column}`}
                cx={computeArrayCell(p.row, p.column + phase).x}
                cy={computeArrayCell(p.row, p.column).y}
                r="5"
                className="cgn-x-dot"
              />
            ),
            p.row < 3 && (
              <circle
                key={`w${p.row}${p.column}`}
                cx={computeArrayCell(p.row, p.column).x}
                cy={computeArrayCell(p.row + phase, p.column).y}
                r="5"
                className="cgn-w-dot"
              />
            ),
          ])}
        </svg>
        <div className="cgn-array-grid">
          {frame.sums.flatMap((r, i) =>
            r.map((sum, j) => {
              const operation = frame.operations.find((p) => p.row === i && p.column === j),
                active = !!operation,
                done = frame.step >= i + j + 4;
              const props = {
                className: 'cgn-pe',
                'data-active': active,
                'data-selected': row === i && column === j,
                'data-complete': done,
              };
              const body = (
                <>
                  <small>{identity(i, j)}</small>
                  <strong>{frame.kind === 'activate' ? frame.output[i][j] : number(sum)}</strong>
                  <span>{active ? `${operation.a}×${operation.b}` : done ? '✓' : 'Σ'}</span>
                </>
              );
              return setSelected ? (
                <button
                  type="button"
                  {...props}
                  key={`${i}${j}`}
                  onClick={() => setSelected([i, j])}
                  aria-label={`${identity(i, j)}: ${sum}`}
                >
                  {body}
                </button>
              ) : (
                <div {...props} key={`${i}${j}`}>
                  {body}
                </div>
              );
            }),
          )}
        </div>
      </div>
      <div className="cgn-pe-receipt">
        <b>{identity(row, column)}</b>
        <span>
          {op
            ? `${op.before} + ${op.a} × ${op.b} = ${op.after}`
            : frame.kind === 'activate'
              ? `max(0, ${frame.sums[row][column]}) = ${frame.output[row][column]}`
              : `Σ = ${frame.sums[row][column]}`}
        </span>
        {op && (
          <small>{`X${row + 1}${op.k + 1}=${op.a} → · W${op.k + 1}${column + 1}=${op.b} ↓`}</small>
        )}
      </div>
      <p className="cgn-array-note">{t('输出驻留脉动阵列示例；NPU 并非都采用这套内部结构。')}</p>
    </div>
  );
}
function Flow({ step }: { step: number }) {
  const active = Math.min(3, Math.floor(step));
  return (
    <div className="cgn-flow">
      <div className="cgn-equation-heading">
        <span>{t('算得快，还要把数据送到')}</span>
        <strong>{t('计算图连接三种处理器')}</strong>
      </div>
      <div className="cgn-memory">
        <span>{t('内存中的同一组 X、W')}</span>
        <div className="cgn-memory-bars">
          {Array.from({ length: 16 }, (_, i) => (
            <i key={i} data-lit={active > 0} />
          ))}
        </div>
      </div>
      <div className="cgn-flow-link" data-active={active > 0}>
        <i>↓</i>
        <span>{t('准备、搬运与启动')}</span>
      </div>
      <div className="cgn-graph">
        <span data-active={active === 0}>
          <b>CPU</b>
          {t('组织程序')}
        </span>
        <i>→</i>
        <span data-active={active === 1}>
          <b>GPU</b>
          {t('批量并行')}
        </span>
        <i>→</i>
        <span data-active={active === 2}>
          <b>NPU</b>
          {t('受支持的张量算子')}
        </span>
        <i>→</i>
        <span data-active={active === 3}>
          <b>CPU</b>
          {t('接回结果')}
        </span>
      </div>
      <p>{t('这是一种协作示例，程序不会必须依次经过全部三种处理器。')}</p>
      <details className="cgn-flow-limits">
        <summary>{t('任务适配还要看什么')}</summary>
        <div className="cgn-flow-costs">
          <span>{t('形状与算子支持')}</span>
          <span>{t('数据搬运')}</span>
          <span>{t('精度与批量')}</span>
        </div>
      </details>
    </div>
  );
}
function Compare({ traces }: { traces: Record<ComputeEngine, ComputeFrame[]> }) {
  return (
    <div className="cgn-compare">
      <div className="cgn-equation-heading">
        <span>{t('逐项核对，不只核对总和')}</span>
        <strong>{t('三种安排，十六个结果相同')}</strong>
      </div>
      <div className="cgn-proof-matrices">
        {(['cpu', 'gpu', 'npu'] as const).map((engine) => (
          <Matrix
            key={engine}
            values={traces[engine].at(-1)!.output}
            label={engine.toUpperCase()}
          />
        ))}
      </div>
      <p className="cgn-proof-equality">CPU Y = GPU Y = NPU Y</p>
      <div className="cgn-three-names">
        <span>
          <b>CPU</b>
          {t('控制与通用任务')}
        </span>
        <span>
          <b>GPU</b>
          {t('大规模并行任务')}
        </span>
        <span>
          <b>NPU</b>
          {t('受支持的神经网络计算')}
        </span>
      </div>
      <p className="cgn-benchmark-note">
        {t('图中的步数是教学调度事件，不代表真实速度、功耗或优劣排名。')}
      </p>
    </div>
  );
}
export default function CpuGpuNpu() {
  const demo = useShowcase(),
    controlId = useId();
  const [engine, setEngine] = useState<ComputeEngine>('npu'),
    [manualStep, setManualStep] = useState(4),
    [inputMode, setInputMode] = useState<'original' | 'zero' | 'negative'>('original'),
    [selected, setSelected] = useState<[number, number]>([1, 1]);
  const story = useMemo(
    () => ({ cpu: computeTrace('cpu'), gpu: computeTrace('gpu'), npu: computeTrace('npu') }),
    [],
  );
  const input = useMemo(
    () =>
      COMPUTE_INPUT.map((r) =>
        r.map((v) => (inputMode === 'zero' ? 0 : inputMode === 'negative' ? -v : v)),
      ),
    [inputMode],
  );
  const manual = useMemo(
    () => ({
      cpu: computeTrace('cpu', input),
      gpu: computeTrace('gpu', input),
      npu: computeTrace('npu', input),
    }),
    [input],
  );
  const shot = computeShot(demo.chapter, demo.chapterProgress, story),
    view = demo.watch ? shot.view : engine,
    traces = demo.watch ? story : manual;
  const frame = computeFrame(
    traces[view === 'cpu' || view === 'gpu' ? view : 'npu'],
    demo.watch ? shot.step : manualStep,
  );
  const total = traces[engine].length - 1,
    focus = demo.watch ? shot.selected : selected;
  const updateEngine = (next: ComputeEngine) => {
    setEngine(next);
    setManualStep(0);
  };
  return (
    <section
      className="cgn-study"
      data-view={view}
      data-watch={demo.watch}
      data-moving={demo.watch && demo.playing}
      aria-label={t('CPU、GPU、NPU 的同题计算')}
    >
      <div className="cgn-stage">
        {view === 'problem' ? (
          <Problem input={COMPUTE_INPUT} weights={COMPUTE_WEIGHTS} />
        ) : view === 'flow' ? (
          <Flow step={shot.step} />
        ) : view === 'compare' ? (
          <Compare traces={traces} />
        ) : view === 'cpu' ? (
          <Cpu frame={frame} input={demo.watch ? COMPUTE_INPUT : input} weights={COMPUTE_WEIGHTS} />
        ) : view === 'gpu' ? (
          <Gpu frame={frame} />
        ) : (
          <Npu
            frame={frame}
            phase={demo.watch ? shot.step % 1 : 0}
            selected={focus}
            setSelected={demo.watch ? undefined : setSelected}
          />
        )}
      </div>
      {!demo.watch && (
        <div className="cgn-explore">
          <div className="cgn-choice" role="group" aria-label={t('选择教学调度')}>
            {(['cpu', 'gpu', 'npu'] as const).map((name) => (
              <button
                type="button"
                key={name}
                aria-pressed={engine === name}
                onClick={() => updateEngine(name)}
              >
                {name.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="cgn-step-controls">
            <button
              type="button"
              onClick={() => setManualStep(Math.max(0, manualStep - 1))}
              disabled={manualStep === 0}
            >
              {t('上一步')}
            </button>
            <label htmlFor={`${controlId}-step`}>
              {t('教学步')} {frame.step}/{total}
            </label>
            <button
              type="button"
              onClick={() => setManualStep(Math.min(total, manualStep + 1))}
              disabled={manualStep >= total}
            >
              {t('下一步')}
            </button>
          </div>
          <input
            id={`${controlId}-step`}
            type="range"
            min="0"
            max={total}
            step="1"
            value={Math.min(total, manualStep)}
            onChange={(e) => setManualStep(Number(e.target.value))}
          />
          <div className="cgn-choice" role="group" aria-label={t('改变共同输入')}>
            {(
              [
                ['original', '原始输入'],
                ['zero', '全零输入'],
                ['negative', '输入取负'],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={inputMode === value}
                onClick={() => {
                  setInputMode(value);
                  setManualStep(0);
                }}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <div className="cgn-explore-result">
            <Matrix values={computeReference(input).output} label={t('独立参考答案')} />
            <p>{t('改输入会从零重算。切换调度仍使用同一输入和固定权重；NPU 单元可点选查看。')}</p>
          </div>
        </div>
      )}
    </section>
  );
}
