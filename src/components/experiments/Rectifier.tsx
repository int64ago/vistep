import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import RectifierBridge from '../lab/RectifierBridge';
import {
  rectifierManualDefaults,
  rectifierReset,
  rectifierSample,
  rectifierShot,
  rectifierState,
  rectifierStatistics,
  rectifierTrace,
  type RectifierParameters,
  type RectifierShot,
} from '../../models/rectifier';
import '../../styles/rectifier.css';

const captions = [
  'A 端电压较高时，D1 和 D4 接通；电流从负载上端流入，下端流出。',
  '交流极性反转，换成 D2 和 D3 导通；流过负载的方向保持不变。',
  '两个半周都变成正向输出，但每次过零仍会下落：整流还不等于平滑。',
  '接入空电容后，只有源电压足够高时才充电；电容电压从零连续升起。',
  '源电压幅值超过电容电压与两只二极管压降之和，桥才导通；其余时间由电容供电。',
  '增大电容，同一负载下的电压下落变小；补充电荷仍集中在导通窗口里。',
  '负载加重会加快放电；把交流频率加倍，补充电荷的间隔变短，纹波又减小。',
  '在电压峰值接入空电容，会出现浪涌；增大源电阻能限制峰值，也会减慢充电。',
];
const titles = [
  '正半周的两只二极管',
  '换一条路，方向不变',
  '每周期得到两个脉冲',
  '第一次给电容充电',
  '不是整个半周都在充电',
  '电容改变纹波',
  '负载与频率的拉锯',
  '浪涌与源电阻',
];
const fmt = (v: number, digits = 2) => (Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v).toFixed(digits);

function RectifierWave({ shot, current }: { shot: RectifierShot; current: boolean }) {
  const { trace, sample, focus } = shot;
  const threshold = focus === 'threshold' && !current;
  const points = useMemo(
    () =>
      trace.points.map((point) => ({
        time: point.time,
        state: rectifierState(trace.parameters, point.time, point.y[0]),
      })),
    [trace],
  );
  const voltageLimit = Math.max(12, trace.parameters.peak * 1.1);
  const high = current
    ? Math.max(focus === 'inrush' ? 18 : 0.6, shot.statistics.peakCurrent * 1.05)
    : voltageLimit;
  const low = current || threshold || trace.parameters.capacitor ? 0 : -voltageLimit;
  const x = (time: number) => 8 + (284 * time) / trace.duration,
    y = (value: number) => 127 - ((value - low) / (high - low)) * 119;
  const path = (which: 'source' | 'output' | 'bridgeCurrent' | 'loadCurrent' | 'threshold') =>
    points
      .map(
        (p, i) =>
          `${i ? 'L' : 'M'}${x(p.time)},${y(which === 'source' && trace.parameters.capacitor ? Math.abs(p.state.source) : p.state[which])}`,
      )
      .join(' ');
  const first = current ? 'bridgeCurrent' : 'source',
    second = current ? 'loadCurrent' : 'output';
  return (
    <div className="rectifier-wave">
      <div className="rectifier-wave-legend">
        <span className="rectifier-source-color">
          {t(current ? '桥电流' : trace.parameters.capacitor ? '源电压幅值' : '交流电压')}
        </span>
        <span className="rectifier-output-color">{t(current ? '负载电流' : '输出电压')}</span>
        {threshold && (
          <span className="rectifier-cap-color">
            v<sub>C</sub> + 2V<sub>F</sub>
          </span>
        )}
      </div>
      <svg
        viewBox="0 0 300 142"
        role="img"
        aria-label={t(
          current
            ? '同一时间轴上的桥电流脉冲和负载电流'
            : '同一时间轴上的交流源与整流输出；竖线表示当前时刻',
        )}
      >
        <path d={`M8 ${y(0)}H292`} stroke="#65808a" strokeDasharray="3 5" />
        <path d={path(first)} stroke="#ffc08a" strokeWidth="2.5" fill="none" />
        <path d={path(second)} stroke="#a1e0c5" strokeWidth="2.7" fill="none" />
        {threshold && (
          <path
            d={path('threshold')}
            stroke="#c5b8f1"
            strokeWidth="2"
            strokeDasharray="5 4"
            fill="none"
          />
        )}
        <path d={`M${x(sample.time)} 3V134`} stroke="#dbe9ec" strokeWidth="1" />
        <circle cx={x(sample.time)} cy={y(sample.state[second])} r="3.5" fill="#a1e0c5" />
        {trace.events
          .filter((event) => event.conducting)
          .map((event) => (
            <circle key={event.time} cx={x(event.time)} cy="138" r="2.5" fill="#ffc08a" />
          ))}
      </svg>
      <div className="rectifier-wave-axis">
        <span>
          {fmt(low, 0)} … {fmt(high, 1)} {current ? 'A' : 'V'}
        </span>
        <span>0 … {fmt(trace.duration * 1000, 0)} ms</span>
      </div>
    </div>
  );
}
function RectifierReadout({ shot }: { shot: RectifierShot }) {
  const p = shot.sample.parameters,
    s = shot.sample.state,
    q = shot.statistics;
  if (shot.focus === 'positive' || shot.focus === 'negative' || shot.focus === 'full-wave')
    return (
      <div className="rectifier-readout">
        <span>{t(q.peakCurrent > 1e-12 ? '输出极性保持为正' : '四只二极管均截止')}</span>
        <b>{q.peakCurrent > 1e-12 ? 2 * p.frequency : 0} Hz</b>
        <span>{t('输出脉冲频率')}</span>
      </div>
    );
  if (shot.focus === 'threshold')
    return (
      <div className="rectifier-readout rectifier-threshold">
        <span>
          |v<sub>AC</sub>| {fmt(Math.abs(s.source))} V
        </span>
        <b>{s.mode === 'blocked' ? '≤' : '>'}</b>
        <span>
          v<sub>C</sub> + 2V<sub>F</sub> {fmt(s.threshold)} V
        </span>
      </div>
    );
  if (shot.focus === 'inrush')
    return (
      <div className="rectifier-readout">
        <span>Rₛ = {p.sourceResistance} Ω</span>
        <b>{fmt(q.peakCurrent)} A</b>
        <span>{t('本次接入的桥电流峰值')}</span>
      </div>
    );
  if (shot.focus === 'first-charge')
    return (
      <div className="rectifier-readout">
        <span>
          Q = C v<sub>C</sub>
        </span>
        <b>{fmt(p.capacitance * s.output * 1000)} mC</b>
        <span>{t('从零开始的储存电荷')}</span>
      </div>
    );
  return (
    <div className="rectifier-readout">
      <span>
        {Math.round(p.capacitance * 1e6)} µF · {p.load} Ω · {p.frequency} Hz
      </span>
      <b>{fmt(q.ripple)} V</b>
      <span>{t('稳态峰峰纹波')}</span>
    </div>
  );
}
export default function Rectifier() {
  const showcase = useShowcase(),
    compact = useCompact(),
    id = useId();
  const [manual, setManual] = useState(rectifierManualDefaults);
  const manualTrace = useMemo(
    () => rectifierTrace(manual.parameters, manual.startup),
    [manual.parameters, manual.startup],
  );
  const directed = useMemo(
    () => rectifierShot(showcase.chapter, showcase.chapterProgress),
    [showcase.chapter, showcase.chapterProgress],
  );
  const shot: RectifierShot = showcase.watch
    ? directed
    : {
        trace: manualTrace,
        sample: rectifierSample(manualTrace, manual.time * manualTrace.duration),
        focus: manual.startup
          ? 'first-charge'
          : manual.parameters.capacitor
            ? 'threshold'
            : 'full-wave',
        statistics: rectifierStatistics(manualTrace),
        variant: 0,
      };
  const current = showcase.watch ? shot.focus === 'inrush' : manual.view === 'current';
  const chapter = Math.max(0, Math.min(7, showcase.chapter));
  const ranges: {
    key: keyof Pick<
      RectifierParameters,
      'peak' | 'frequency' | 'capacitance' | 'load' | 'sourceResistance'
    >;
    label: string;
    min: number;
    max: number;
    step: number;
    scale: number;
    unit: string;
  }[] = [
    { key: 'peak', label: '交流峰值电压', min: 1, max: 18, step: 0.5, scale: 1, unit: 'V' },
    { key: 'frequency', label: '交流频率', min: 25, max: 100, step: 5, scale: 1, unit: 'Hz' },
    {
      key: 'capacitance',
      label: '平滑电容',
      min: 100,
      max: 2200,
      step: 100,
      scale: 1e6,
      unit: 'µF',
    },
    { key: 'load', label: '整流负载电阻', min: 50, max: 300, step: 10, scale: 1, unit: 'Ω' },
    {
      key: 'sourceResistance',
      label: '交流源串联电阻',
      min: 0.5,
      max: 8,
      step: 0.5,
      scale: 1,
      unit: 'Ω',
    },
  ];
  return (
    <section
      className="rectifier-scene"
      data-watch={showcase.watch}
      aria-label={t('单相桥式整流与电容储能')}
    >
      <div className="rectifier-film">
        <div className="rectifier-heading">
          <span>{t('四只二极管，一种输出方向')}</span>
          <span>{t('低压教学模型 · 交流慢放')}</span>
        </div>
        <h2>{t(showcase.watch ? titles[chapter] : '沿桥路自由取样')}</h2>
        <p className="rectifier-caption">
          {t(
            showcase.watch
              ? captions[chapter]
              : '改变元件后重新求解；拖动时间，检查导通的二极管和电容电流。',
          )}
        </p>
        <RectifierBridge sample={shot.sample} compact={compact} />
        <div className="rectifier-proof">
          <RectifierWave shot={shot} current={current} />
          <RectifierReadout shot={shot} />
        </div>
        <div className="rectifier-footer">
          <span className="rectifier-desktop-only">
            {t('有限源电阻 · 每只二极管压降')} {shot.sample.parameters.diodeDrop} V
          </span>
          <span>
            {t('交流慢放')} · {shot.sample.parameters.frequency} Hz
          </span>
        </div>
      </div>
      {!showcase.watch && (
        <div className="rectifier-explore">
          <div className="rectifier-control-heading">
            <label htmlFor={`${id}-time`}>{t('整流电路取样时间')}</label>
            <output>{fmt(manual.time * manualTrace.duration * 1000)} ms</output>
          </div>
          <input
            id={`${id}-time`}
            aria-label={t('整流电路取样时间')}
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={manual.time}
            onChange={(e) => setManual((v) => ({ ...v, time: Number(e.target.value) }))}
          />
          <div className="rectifier-controls">
            {ranges.map((range) => (
              <div key={range.key}>
                <div className="rectifier-control-heading">
                  <label htmlFor={`${id}-${range.key}`}>{t(range.label)}</label>
                  <output>
                    {fmt(
                      manual.parameters[range.key] * range.scale,
                      range.key === 'peak' || range.key === 'sourceResistance' ? 1 : 0,
                    )}{' '}
                    {range.unit}
                  </output>
                </div>
                <input
                  id={`${id}-${range.key}`}
                  aria-label={t(range.label)}
                  type="range"
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={manual.parameters[range.key] * range.scale}
                  disabled={range.key === 'capacitance' && !manual.parameters.capacitor}
                  onChange={(e) =>
                    setManual((v) => ({
                      ...v,
                      parameters: {
                        ...v.parameters,
                        [range.key]: Number(e.target.value) / range.scale,
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="rectifier-buttons">
            <button
              type="button"
              aria-pressed={manual.parameters.capacitor}
              onClick={() =>
                setManual((v) => ({
                  ...v,
                  startup: v.parameters.capacitor ? false : v.startup,
                  parameters: { ...v.parameters, capacitor: !v.parameters.capacitor },
                }))
              }
            >
              {t('接入平滑电容')}
            </button>
            <button
              type="button"
              disabled={!manual.parameters.capacitor}
              aria-pressed={manual.startup}
              onClick={() => setManual((v) => ({ ...v, startup: !v.startup, time: 0 }))}
            >
              {t('从空电容开始')}
            </button>
            <button
              type="button"
              disabled={!manual.parameters.capacitor}
              aria-pressed={manual.startup && manual.parameters.phase !== 0}
              onClick={() =>
                setManual((v) => ({
                  ...v,
                  startup: true,
                  parameters: {
                    ...v.parameters,
                    phase: v.startup && v.parameters.phase !== 0 ? 0 : Math.PI / 2,
                  },
                  time: 0,
                }))
              }
            >
              {t('在交流峰值接入')}
            </button>
            <button
              type="button"
              aria-pressed={manual.view === 'current'}
              onClick={() =>
                setManual((v) => ({ ...v, view: v.view === 'current' ? 'voltage' : 'current' }))
              }
            >
              {t('查看桥电流脉冲')}
            </button>
            <button type="button" onClick={() => setManual(rectifierReset())}>
              {t('重置整流实验')}
            </button>
          </div>
          <p>
            {t(
              '这是低压单相桥式整流的教学电路，不是市电接线或搭建指南；未模拟变压器、反向恢复和保护电路。',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
