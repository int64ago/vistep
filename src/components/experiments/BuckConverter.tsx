import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import BuckCircuit from '../lab/BuckCircuit';
import {
  buckDefaults,
  buckInstant,
  buckLoadStep,
  buckSample,
  buckShot,
  buckStatistics,
  buckSteady,
  type BuckFocus,
  type BuckParameters,
  type BuckShot,
} from '../../models/buck-converter';
import '../../styles/buck-converter.css';

const captions = [
  '开关节点在高低电压间切换；电感和电容把脉冲变成较平稳的输出。',
  '开关闭合，电源接入电感。电感两端电压为正，电流连续上升。',
  '开关断开，电感电流不会突然消失；二极管接上另一条闭合路径。',
  '周期稳态中，电感正负伏秒相抵；改变占空比，会改变新的平衡电压。',
  '电感电流超过负载需求时，电容充电；不足时补上差额。更大电容减小纹波。',
  '负载突然加重，电容先补电流缺口；电感电流随后改变。这里没有稳压反馈。',
  '负载变轻，电流降到零后，二极管阻止反向流动，出现第三段空闲时间。',
  '加入导通损耗，同一占空比的输出降低；输入能量分给负载、储能变化和热。',
];
const titles = [
  '脉冲怎样变成直流',
  '第一条路径：接通',
  '第二条路径：续流',
  '电感的伏秒平衡',
  '电容接住电流差',
  '负载突然加重',
  '第三段：电流归零',
  '每一份能量都有去向',
];
const fmt = (v: number, n = 2) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n);

function Wave({ shot, kind }: { shot: BuckShot; kind: 'i' | 'sw' | 'vl' | 'ic' | 'vo' }) {
  const { trace, sample } = shot;
  const values = useMemo(
    () =>
      trace.points.map((point) => {
        const s = buckInstant(
          { ...trace.parameters, resistance: point.resistance },
          point.y,
          point.mode,
        );
        return { time: point.time, value: kind === 'i' ? s.i : s[kind] };
      }),
    [trace, kind],
  );
  const minimum = Math.min(...values.map((p) => p.value)),
    maximum = Math.max(...values.map((p) => p.value));
  // Both capacitor shots share ±80 mV around their mean: a smaller ripple must
  // look smaller, not be expanded back to the previous picture's height.
  const capSpan = Math.max(
    0.08,
    Math.ceil(
      Math.max(maximum - shot.statistics.meanVoltage, shot.statistics.meanVoltage - minimum) / 0.08,
    ) * 0.08,
  );
  const capView = kind === 'vo' && shot.focus === 'capacitor';
  const lo = capView
    ? shot.statistics.meanVoltage - capSpan
    : kind === 'vo'
      ? minimum - Math.max(0.015, (maximum - minimum) * 0.18)
      : Math.min(0, minimum * 1.15);
  const hi = capView
    ? shot.statistics.meanVoltage + capSpan
    : kind === 'vo'
      ? maximum + Math.max(0.015, (maximum - minimum) * 0.18)
      : Math.max(0.1, maximum * 1.15);
  const x = (time: number) => 10 + (time / trace.duration) * 280;
  const y = (v: number) => 92 - ((v - lo) / (hi - lo)) * 82;
  const path = values.map((p, i) => `${i ? 'L' : 'M'}${x(p.time)},${y(p.value)}`).join(' ');
  const value = kind === 'i' ? sample.state.i : sample.state[kind];
  const label = {
    i: '电感电流',
    sw: '开关节点电压',
    vl: '电感两端电压',
    ic: '电容电流',
    vo: '输出电压',
  }[kind];
  const color = kind === 'vo' || kind === 'ic' ? '#78689a' : kind === 'sw' ? '#b56334' : '#287887';
  const signed = kind === 'vl' || kind === 'ic';
  const area = (positive: boolean) =>
    `M10 ${y(0)}${values.map((p) => `L${x(p.time)},${y(positive ? Math.max(0, p.value) : Math.min(0, p.value))}`).join('')}L290 ${y(0)}Z`;
  return (
    <div className="buck-wave">
      <div className="buck-wave-heading">
        <span>{t(label)}</span>
        <span style={{ color }}>
          {fmt(value)} {kind === 'i' || kind === 'ic' ? 'A' : 'V'}
        </span>
      </div>
      <svg
        viewBox="0 0 300 104"
        role="img"
        aria-label={`${t(label)} · ${t('实线为完整计算，竖线为当前时刻')}`}
      >
        {sample.mode === 'idle' && kind === 'i' && (
          <rect x="10" y="89" width="280" height="7" rx="3" fill="#e5deed" />
        )}
        {signed && (
          <>
            <path d={area(true)} fill="#d6e6df" />
            <path d={area(false)} fill="#eadbca" />
          </>
        )}
        {lo <= 0 && hi >= 0 && (
          <path d={`M10 ${y(0)}H290`} stroke="#bcc8c8" strokeDasharray="3 4" />
        )}
        {trace.loadStepAt !== undefined && (
          <path d={`M${x(trace.loadStepAt)} 6V98`} stroke="#b56334" strokeDasharray="4 3" />
        )}
        <path d={path} stroke={color} strokeWidth="2.5" strokeLinejoin="round" fill="none" />
        <path d={`M${x(sample.time)} 4V99`} stroke="#415c66" strokeWidth="1.25" />
        <circle
          cx={x(sample.time)}
          cy={y(value)}
          r="4"
          fill={color}
          stroke="#fff"
          strokeWidth="1.5"
        />
      </svg>
      <div className="buck-wave-axis">
        <span>
          {fmt(lo, kind === 'vo' ? 3 : 2)} … {fmt(hi, kind === 'vo' ? 3 : 2)}{' '}
          {kind === 'i' || kind === 'ic' ? 'A' : 'V'}
        </span>
        <span>{fmt(trace.duration * 1e6, 0)} µs</span>
      </div>
    </div>
  );
}
function Evidence({ shot }: { shot: BuckShot }) {
  const q = shot.statistics,
    p = shot.sample.parameters,
    focus = shot.focus;
  if (focus === 'balance')
    return (
      <div className="buck-balance">
        <span>+{fmt(q.positiveVoltSeconds * 1e6, 1)} V·µs</span>
        <b>+</b>
        <span>{fmt(q.negativeVoltSeconds * 1e6, 1)} V·µs</span>
        <b>≈ 0</b>
      </div>
    );
  if (focus === 'capacitor')
    return (
      <div>
        <div className="buck-measure">
          <span>C = {Math.round(p.capacitance * 1e6)} µF</span>
          <strong>{fmt(q.ripple * 1000, 1)} mV</strong>
          <span>{t('输出峰峰纹波')}</span>
        </div>
        <div className="buck-charge">
          Q: +{fmt(q.positiveCharge * 1e6, 1)} / {fmt(q.negativeCharge * 1e6, 1)} µC
        </div>
      </div>
    );
  if (focus === 'discontinuous')
    return (
      <div className="buck-measure">
        <span>R = {p.resistance} Ω</span>
        <strong>{fmt(q.idleFraction * 100, 1)}%</strong>
        <span>{t('一周期内的零电流时间')}</span>
      </div>
    );
  if (focus === 'losses') {
    const segments = [
      { value: q.loadEnergy, label: '负载能量', color: '#287887' },
      { value: q.diodeEnergy, label: '二极管热耗', color: '#b56334' },
      {
        value: q.switchEnergy + q.inductorEnergy + q.capacitorEnergy,
        label: '其余导通热耗',
        color: '#a18a65',
      },
    ];
    return (
      <div className="buck-energy">
        <div>
          E<sub>in</sub> = {fmt(q.inputEnergy * 1e6, 1)} µJ / T
        </div>
        <div className="buck-energy-bar">
          {segments.map((row) => (
            <span
              key={row.label}
              style={{ width: `${(row.value / q.inputEnergy) * 100}%`, background: row.color }}
            />
          ))}
        </div>
        <div className="buck-energy-legend">
          {segments.map((row) => (
            <span key={row.label}>
              <i style={{ background: row.color }} />
              {t(row.label)} {fmt(row.value * 1e6, 1)} µJ
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (focus === 'transient')
    return (
      <div className="buck-measure">
        <span>R: 8 → 3 Ω</span>
        <strong>{fmt(shot.sample.state.vo)} V</strong>
        <span>{t('固定占空比，不含反馈控制')}</span>
      </div>
    );
  return (
    <div className="buck-measure">
      <span>D = {fmt(p.duty * 100, 0)}%</span>
      <strong>{fmt(shot.sample.state.i)} A</strong>
      <span>{t('电感电流始终连续')}</span>
    </div>
  );
}
export default function BuckConverter() {
  const showcase = useShowcase(),
    compact = useCompact(),
    id = useId();
  const [manual, setManual] = useState(buckDefaults),
    [phase, setPhase] = useState(0.2),
    [comparison, setComparison] = useState(false);
  const [focus, setFocus] = useState<BuckFocus>('switching');
  const manualTrace = useMemo(
    () => (comparison ? buckLoadStep({ ...manual, resistance: 8 }) : buckSteady(manual)),
    [manual, comparison],
  );
  const directed = useMemo(
    () => buckShot(showcase.chapter, showcase.chapterProgress),
    [showcase.chapter, showcase.chapterProgress],
  );
  const shot: BuckShot = showcase.watch
    ? directed
    : {
        trace: manualTrace,
        sample: buckSample(manualTrace, phase * manualTrace.duration),
        focus: comparison ? 'transient' : focus,
        variant: 0,
        statistics: buckStatistics(manualTrace),
      };
  const currentChapter = Math.max(0, Math.min(7, showcase.chapter));
  const p = shot.sample.parameters;
  const secondary: 'sw' | 'vl' | 'ic' | 'vo' =
    shot.focus === 'balance' || shot.focus === 'on' || shot.focus === 'diode'
      ? 'vl'
      : shot.focus === 'capacitor'
        ? 'ic'
        : shot.focus === 'switching'
          ? 'sw'
          : 'vo';
  const primary: 'i' | 'vo' = shot.focus === 'capacitor' || shot.focus === 'transient' ? 'vo' : 'i';
  const ranges: {
    key: keyof Pick<
      BuckParameters,
      'duty' | 'inductance' | 'capacitance' | 'resistance' | 'frequency'
    >;
    label: string;
    min: number;
    max: number;
    step: number;
    scale: number;
    unit: string;
  }[] = [
    { key: 'duty', label: '开关占空比', min: 20, max: 70, step: 1, scale: 100, unit: '%' },
    { key: 'inductance', label: '滤波电感', min: 75, max: 300, step: 25, scale: 1e6, unit: 'µH' },
    { key: 'capacitance', label: '滤波电容', min: 22, max: 220, step: 1, scale: 1e6, unit: 'µF' },
    { key: 'resistance', label: '负载电阻', min: 2, max: 60, step: 1, scale: 1, unit: 'Ω' },
    { key: 'frequency', label: '开关频率', min: 10, max: 40, step: 1, scale: 1e-3, unit: 'kHz' },
  ];
  const reset = () => {
    setManual(buckDefaults());
    setPhase(0.2);
    setComparison(false);
    setFocus('switching');
  };
  return (
    <section
      className="buck-scene"
      data-watch={showcase.watch}
      aria-label={t('降压变换器的开关、电流与能量')}
    >
      <div className="buck-film">
        <div className="buck-kicker">
          <span>{t('脉冲的两条回路')}</span>
          <span>
            {Math.round(p.frequency / 1000)} kHz · {t('画面慢放')}
          </span>
        </div>
        <h2>{t(showcase.watch ? titles[currentChapter] : '逐点检查一个开关周期')}</h2>
        <p className="buck-caption">
          {t(
            showcase.watch
              ? captions[currentChapter]
              : '拖动时间，沿高亮回路观察电流；改变参数会重新求解电路。',
          )}
        </p>
        <BuckCircuit sample={shot.sample} compact={compact} />
        <div className="buck-instruments">
          {!(compact && shot.focus === 'losses') && (
            <div className="buck-traces">
              {compact && shot.focus === 'balance' ? (
                <Wave shot={shot} kind="vl" />
              ) : (
                <Wave shot={shot} kind={primary} />
              )}
              {!compact && <Wave shot={shot} kind={secondary} />}
            </div>
          )}
          <Evidence shot={shot} />
        </div>
        <div className="buck-conditions">
          <span>
            {t(p.nonideal ? '含导通损耗' : '理想器件')} · D {fmt(p.duty * 100, 0)}% · {p.resistance}{' '}
            Ω
          </span>
          <span>
            {compact ? (
              <>
                {Math.round(p.frequency / 1000)} kHz · {t('画面慢放')}
              </>
            ) : (
              <>
                {t('物理时间')} {fmt(shot.sample.time * 1e6, 1)} µs
              </>
            )}
          </span>
        </div>
      </div>
      {!showcase.watch && (
        <div className="buck-explore">
          <div className="buck-time-label">
            <label htmlFor={`${id}-phase`}>{t('电路取样时间')}</label>
            <output>{fmt(phase * manualTrace.duration * 1e6, 1)} µs</output>
          </div>
          <input
            id={`${id}-phase`}
            aria-label={t('电路取样时间')}
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={phase}
            onChange={(e) => setPhase(Number(e.target.value))}
          />
          <div className="buck-explore-grid">
            {ranges.map((range) => (
              <div className="buck-control" key={range.key}>
                <div>
                  <label htmlFor={`${id}-${range.key}`}>{t(range.label)}</label>
                  <output>
                    {fmt(manual[range.key] * range.scale, 0)} {range.unit}
                  </output>
                </div>
                <input
                  id={`${id}-${range.key}`}
                  aria-label={t(range.label)}
                  type="range"
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={manual[range.key] * range.scale}
                  disabled={comparison && range.key === 'resistance'}
                  onChange={(e) =>
                    setManual((v) => ({ ...v, [range.key]: Number(e.target.value) / range.scale }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="buck-buttons">
            <button
              type="button"
              aria-pressed={manual.nonideal}
              onClick={() => setManual((v) => ({ ...v, nonideal: !v.nonideal }))}
            >
              {t('加入导通损耗')}
            </button>
            <button
              type="button"
              aria-pressed={comparison}
              onClick={() => {
                setComparison((v) => !v);
                setPhase(0);
              }}
            >
              {t('施加 8 Ω → 3 Ω 负载阶跃')}
            </button>
            <button type="button" onClick={reset}>
              {t('重置全部实验参数')}
            </button>
          </div>
          <div className="buck-buttons">
            {(
              [
                { key: 'switching', label: '观察开关波形' },
                { key: 'balance', label: '观察伏秒平衡' },
                { key: 'capacitor', label: '观察电容纹波' },
                { key: 'discontinuous', label: '观察零电流时间' },
                { key: 'losses', label: '观察能量分配' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={comparison}
                aria-pressed={focus === item.key}
                onClick={() => setFocus(item.key)}
              >
                {t(item.label)}
              </button>
            ))}
          </div>
          <p>
            {t(
              '这是固定占空比的异步降压电路。只计算导通损耗，不含开关边沿、磁芯、驱动和控制器损耗。',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
