import { useEffect, useId, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import WirelessChargingStudio from '../three/WirelessChargingStudio';
import {
  wirelessDefaults,
  wirelessShot,
  wirelessState,
  wcAbs,
  wcInstant,
  wirelessCoilPoint,
  type WirelessShot,
} from '../../models/wireless-charging';
import '../../styles/wireless-charging.css';

const captions = [
  '发送端先建立交流电流；没有电线跨过线圈之间的间隙。',
  '共享磁链的变化感应出电压；磁链最大时，瞬时感应电压恰好为零。',
  '接收回路闭合以后，电流才流过交流负载，发送端也感受到这个负载。',
  '线圈靠近，共享耦合增强；在当前运行范围里，负载得到更多功率。',
  '侧向错开，即使距离不变，也会减少两个线圈共享的耦合。',
  '电容抵消线圈的感抗；接近调谐频率，电流与接收功率明显改变。',
  '移除铁氧体磁片，电感和互感一起改变，原来的调谐条件也随之改变。',
  '线圈电阻增加，铜耗占比上升；负载、线圈和源电阻的功率始终对得上。',
];
const fmt = (v: number, d = 2) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
function PhaseProof({ shot }: { shot: WirelessShot }) {
  const s = shot.state,
    induction = shot.focus === 'induction';
  const traces = induction
    ? [
        {
          label: 'λ₂←₁',
          unit: 'µWb·turn',
          phasor: s.linkedFlux,
          scale: 1e6,
          limit: 6,
          color: '#367e92',
        },
        { label: 'e₂', unit: 'V', phasor: s.induced, scale: 1, limit: 6, color: '#b07743' },
      ]
    : [
        { label: 'I₁', unit: 'A', phasor: s.i1, scale: 1, limit: 4, color: '#367e92' },
        { label: 'I₂', unit: 'A', phasor: s.i2, scale: 1, limit: 4, color: '#b07743' },
      ];
  const phase = ((s.input.phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    x = 8 + (phase / (2 * Math.PI)) * 284;
  return (
    <div className="wireless-phase-proof">
      {traces.map((trace) => (
        <div className="wireless-trace" key={trace.label}>
          <div>
            <span style={{ color: trace.color }}>
              {trace.label} <b>{fmt(wcInstant(trace.phasor, phase) * trace.scale)}</b> {trace.unit}
            </span>
            <span>±{trace.limit}</span>
          </div>
          <svg
            viewBox="0 0 300 76"
            role="img"
            aria-label={t(
              induction
                ? '同一取样相位的共享磁链和感应电压曲线'
                : '同一取样相位的发送电流与接收电流曲线',
            )}
          >
            <path d="M8 38H292" stroke="#b8c8cf" />
            <path
              d={Array.from(
                { length: 145 },
                (_, i) =>
                  `${i ? 'L' : 'M'}${8 + (i / 144) * 284},${38 - ((wcInstant(trace.phasor, (i / 144) * Math.PI * 2) * trace.scale) / trace.limit) * 30}`,
              ).join(' ')}
              fill="none"
              stroke={trace.color}
              strokeWidth="2.5"
            />
            <path d={`M${x} 6V70`} stroke="#a9b8bb" strokeDasharray="3 4" />
            <circle
              cx={x}
              cy={38 - ((wcInstant(trace.phasor, phase) * trace.scale) / trace.limit) * 30}
              r="3.5"
              fill={trace.color}
            />
          </svg>
        </div>
      ))}
      <div className="wireless-axis">
        <span>0°</span>
        <span>180°</span>
        <span>360°</span>
      </div>
    </div>
  );
}
function AlignmentProof({ shot }: { shot: WirelessShot }) {
  const draw = (shift: number) =>
    Array.from({ length: 769 }, (_, i) => {
      const p = wirelessCoilPoint(i / 768);
      return `${i ? 'L' : 'M'}${150 + p[0] * 2650},${72 + p[2] * 2650 + shift}`;
    }).join(' ');
  return (
    <div className="wireless-alignment">
      <svg
        viewBox="0 0 300 220"
        role="img"
        aria-label={t('俯视两只真实八匝线圈的横向错位；高度在这张图中省略')}
      >
        <path d={draw(0)} fill="none" stroke="#427b91" strokeWidth="1.8" />
        <path d={draw(shot.input.offset * 2650)} fill="none" stroke="#bd884c" strokeWidth="1.8" />
        <path
          d={`M232 72v${shot.input.offset * 2650}m-5 0h10M227 72h10`}
          stroke="#657d88"
          strokeWidth="1.5"
        />
        <path d="M150 5V212" stroke="#607b8626" strokeDasharray="4 6" />
      </svg>
      <div className="wireless-axis">
        <span>
          {t('横向偏移')} {fmt(shot.input.offset * 1000, 1)} mm
        </span>
        <span>k = {fmt(shot.state.coupling, 3)}</span>
      </div>
    </div>
  );
}
function TuningProof({ shot }: { shot: WirelessShot }) {
  const curve = (ferrite: boolean) =>
    Array.from({ length: 161 }, (_, i) => {
      const frequency = 60e3 + (i / 160) * 180e3,
        s = wirelessState({ ...shot.input, frequency, ferrite });
      return `${i ? 'L' : 'M'}${8 + (i / 160) * 284},${137 - (s.loadPower / 1.5) * 120}`;
    }).join(' ');
  const s = shot.state,
    x = 8 + ((shot.input.frequency - 60e3) / 180e3) * 284;
  return (
    <div className="wireless-tuning">
      <div className="wireless-instrument-title">
        <span>{t('接收功率随频率变化')}</span>
        <span>1.5 W</span>
      </div>
      <svg
        viewBox="0 0 300 145"
        role="img"
        aria-label={t('精确电路解得到的负载功率频率曲线；圆点是当前驱动频率')}
      >
        <path d="M8 9V137H292" fill="none" stroke="#b4c4ca" />
        {shot.focus === 'ferrite' && (
          <path
            d={curve(true)}
            fill="none"
            stroke="#b8a180"
            strokeDasharray="4 5"
            strokeWidth="2"
          />
        )}
        <path d={curve(shot.input.ferrite)} fill="none" stroke="#367e92" strokeWidth="2.8" />
        <path
          d={`M${x} 137V${137 - (s.loadPower / 1.5) * 120}`}
          stroke="#889ba2"
          strokeDasharray="3 4"
        />
        <circle cx={x} cy={137 - (s.loadPower / 1.5) * 120} r="4" fill="#b47d43" />
      </svg>
      <div className="wireless-axis">
        <span>60 kHz</span>
        <span>150</span>
        <span>240 kHz</span>
      </div>
      <div className="wireless-tune-readout">
        <span>f = {fmt(s.input.frequency / 1000, 0)} kHz</span>
        <span>f₀ = {fmt(s.resonance1 / 1000, 1)} kHz</span>
      </div>
      {shot.focus === 'ferrite' && (
        <div className="wireless-reference">
          <i />
          L₁ = L₂ = 6.8 µH
        </div>
      )}
    </div>
  );
}
function GapProof({ shot }: { shot: WirelessShot }) {
  const s = shot.state;
  return (
    <div className="wireless-gap-proof">
      <div className="wireless-gap-pair">
        <span>
          {t('线圈间距')}
          <b>
            {fmt(s.input.gap * 1000, 1)} <small>mm</small>
          </b>
        </span>
        <span>
          {t('互感')}
          <b>
            {fmt(s.m * 1e6)} <small>µH</small>
          </b>
        </span>
      </div>
      <div className="wireless-link-meter">
        <i style={{ width: `${(s.coupling / 0.22) * 100}%` }} />
      </div>
      <div className="wireless-axis">
        <span>k = {fmt(s.coupling, 3)}</span>
        <span>{t('耦合近似模型')}</span>
      </div>
    </div>
  );
}
function PowerProof({ shot }: { shot: WirelessShot }) {
  const s = shot.state,
    rows = [
      { label: '交流负载', value: s.loadPower, color: '#417f96' },
      { label: '发送线圈铜耗', value: s.txLoss, color: '#b37e4c' },
      { label: '接收线圈铜耗', value: s.rxLoss, color: '#c6a276' },
      { label: '源电阻损耗', value: s.sourceLoss, color: '#8a9ca7' },
    ];
  return (
    <div className="wireless-power-proof">
      <div className="wireless-instrument-title">
        <span>{t('源输入功率')}</span>
        <b>{fmt(s.inputPower)} W</b>
      </div>
      <div className="wireless-power-ribbon">
        {rows.map((row) => (
          <i
            key={row.label}
            style={{
              width: `${s.inputPower ? (row.value / s.inputPower) * 100 : 0}%`,
              background: row.color,
            }}
          />
        ))}
      </div>
      <div className="wireless-power-ledger">
        {rows.map((row) => (
          <div key={row.label}>
            <span>
              <i style={{ background: row.color }} />
              {t(row.label)}
            </span>
            <b>{fmt(row.value)} W</b>
          </div>
        ))}
      </div>
      <div className="wireless-power-resistance">
        R₁ = {fmt(s.circuit.r1)} Ω · R₂ = {fmt(s.circuit.r2)} Ω
      </div>
    </div>
  );
}
export default function WirelessCharging() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null),
    id = useId();
  const [width, setWidth] = useState(800),
    [gap, setGap] = useState(8),
    [offset, setOffset] = useState(0),
    [frequency, setFrequency] = useState(150),
    [load, setLoad] = useState(3),
    [lossScale, setLossScale] = useState(1),
    [phase, setPhase] = useState(45),
    [connected, setConnected] = useState(true),
    [ferrite, setFerrite] = useState(true),
    [view, setView] = useState<'induction' | 'tuning' | 'power'>('induction');
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const auto = wirelessShot(film.chapter, film.chapterProgress),
    input = {
      ...wirelessDefaults,
      gap: gap / 1000,
      offset: offset / 1000,
      frequency: frequency * 1000,
      load,
      lossScale,
      phase: (phase * Math.PI) / 180,
      connected,
      ferrite,
    };
  const shot: WirelessShot = film.watch
    ? auto
    : { ...auto, input, state: wirelessState(input), focus: view, showFlux: view === 'induction' };
  const s = shot.state,
    narrow = width < 620;
  const proof =
    shot.focus === 'offset' ? (
      <AlignmentProof shot={shot} />
    ) : shot.focus === 'gap' ? (
      <GapProof shot={shot} />
    ) : shot.focus === 'tuning' || shot.focus === 'ferrite' ? (
      <TuningProof shot={shot} />
    ) : shot.focus === 'power' ? (
      <PowerProof shot={shot} />
    ) : (
      <PhaseProof shot={shot} />
    );
  const reset = () => {
    setGap(8);
    setOffset(0);
    setFrequency(150);
    setLoad(3);
    setLossScale(1);
    setPhase(45);
    setConnected(true);
    setFerrite(true);
    setView('induction');
  };
  return (
    <div
      className="wireless-charging"
      ref={host}
      data-narrow={narrow}
      data-watch={film.watch}
      data-focus={shot.focus}
    >
      <div className="wireless-stage">
        <div className="wireless-title-line">
          <span>{t('电能跨过一道间隙')}</span>
          <span>{t('八匝发送 · 八匝接收')}</span>
        </div>
        <div className="wireless-object">
          <WirelessChargingStudio key={narrow ? 'phone' : 'wide'} shot={shot} narrow={narrow} />
        </div>
        <div className="wireless-circuit-readout">
          <span>
            {t('发送电流')} <b>{fmt(wcAbs(s.i1))} A</b>
          </span>
          <span>
            {t(s.input.connected ? '交流负载已接通' : '接收端开路')} <b>{fmt(s.loadPower)} W</b>
          </span>
        </div>
        <div className="wireless-evidence">{proof}</div>
        <p className="wireless-caption">
          {film.watch
            ? t(captions[shot.chapter])
            : t('固定一个取样相位，比较摆放、调谐与负载对同一电路的影响。')}
        </p>
      </div>
      {!film.watch && (
        <div className="wireless-explore">
          {[
            {
              key: 'gap',
              label: '线圈间距',
              value: gap,
              min: 2,
              max: 24,
              step: 0.5,
              unit: 'mm',
              set: setGap,
            },
            {
              key: 'offset',
              label: '横向偏移',
              value: offset,
              min: 0,
              max: 32,
              step: 0.5,
              unit: 'mm',
              set: setOffset,
            },
            {
              key: 'frequency',
              label: '驱动频率',
              value: frequency,
              min: 60,
              max: 240,
              step: 1,
              unit: 'kHz',
              set: setFrequency,
            },
            {
              key: 'load',
              label: '交流负载电阻',
              value: load,
              min: 0.5,
              max: 12,
              step: 0.1,
              unit: 'Ω',
              set: setLoad,
            },
            {
              key: 'loss',
              label: '线圈电阻倍率',
              value: lossScale,
              min: 1,
              max: 4,
              step: 0.1,
              unit: '×',
              set: setLossScale,
            },
            {
              key: 'phase',
              label: '取样相位',
              value: phase,
              min: 0,
              max: 360,
              step: 1,
              unit: '°',
              set: setPhase,
            },
          ].map((control) => (
            <label key={control.key} htmlFor={`${id}-${control.key}`}>
              <span>
                {t(control.label)}
                <output>
                  {fmt(control.value, control.step < 1 ? 1 : 0)} {control.unit}
                </output>
              </span>
              <input
                id={`${id}-${control.key}`}
                type="range"
                aria-label={t(control.label)}
                min={control.min}
                max={control.max}
                step={control.step}
                value={control.value}
                onChange={(e) => control.set(Number(e.target.value))}
              />
            </label>
          ))}
          <div className="wireless-buttons">
            <button type="button" aria-pressed={connected} onClick={() => setConnected((v) => !v)}>
              {t(connected ? '断开交流负载' : '接通交流负载')}
            </button>
            <button type="button" aria-pressed={ferrite} onClick={() => setFerrite((v) => !v)}>
              {t(ferrite ? '移除磁片' : '装回磁片')}
            </button>
            <button type="button" onClick={reset}>
              {t('重置')}
            </button>
          </div>
          <div className="wireless-buttons">
            {(['induction', 'tuning', 'power'] as const).map((v) => (
              <button type="button" key={v} aria-pressed={view === v} onClick={() => setView(v)}>
                {t(v === 'induction' ? '观察磁链' : v === 'tuning' ? '观察调谐' : '观察功率')}
              </button>
            ))}
          </div>
        </div>
      )}
      <details className="wireless-scope">
        <summary>{t('模型范围：交流负载与近似耦合')}</summary>
        <p>
          {t(
            '本片计算线性双线圈 RLC 电路。电流读数为有效值，波形读数为瞬时值；角相位慢放，真实驱动频率以 kHz 标出。',
          )}
        </p>
        <p>
          {t(
            '耦合系数随间距、偏移和磁片变化的关系是明确给定的教学近似，不是电磁场仿真或 Qi 产品标定。磁路曲线仅示意闭合返回路径。',
          )}
        </p>
        <p>
          {t(
            '接收端只计算交流电阻负载；整流、稳压、电池、通信和异物检测不在数值模型中。功率比不是手机充电效率。',
          )}
        </p>
        <p>
          {t(
            '移除磁片是在比较另一个稳态电路，没有模拟拆除过程中的快速暂态。谐振元件可以提高电压或循环电流，但不会产生额外能量。',
          )}
        </p>
      </details>
    </div>
  );
}
