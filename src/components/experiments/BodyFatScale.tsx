import { useEffect, useId, useRef, useState } from 'react';
import { t } from '../../i18n';
import {
  BFS,
  BFS_DEFAULT,
  bfsShot,
  bfsState,
  bfsWave,
  type BfsShot,
  type BfsView,
} from '../../models/body-fat-scale';
import { useShowcase } from '../lab/Showcase';
import BodyFatScaleStudio from '../three/BodyFatScaleStudio';
import '../../styles/body-fat-scale.css';
const gold = '#b77b32',
  teal = '#467f8a',
  goldText = '#8b5e24',
  tealText = '#376771';
const names: Record<BfsView, string> = {
  object: '看秤体',
  weight: '看称重',
  route: '看四电极',
  wave: '看信号',
  cell: '看细胞等效',
  estimate: '看估算',
  compare: '只改变水分',
};
function Bridge({ shot, width }: { shot: BfsShot; width: number }) {
  const cell = shot.cells[0],
    w = width,
    cx = w / 2;
  return (
    <div className="bfs-bridge">
      <div className="bfs-instrument-title">{t('一角测力梁的等效电桥')}</div>
      <svg viewBox={`0 0 ${w} 72`} role="img" aria-label={t('同一载荷的应变放大一千倍')}>
        <path
          d={`M${cx - 67} 26H${cx + 67}`}
          stroke="#adbab0"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <rect
          x={cx - 35 * (1 + cell.strain * 1000)}
          y="19"
          width={70 * (1 + cell.strain * 1000)}
          height="14"
          rx="4"
          fill="#bd8d4f"
        />
        <text x={cx} y="50" textAnchor="middle" fontSize="16" fill="#52674f">
          ε = {(cell.strain * 1e6).toFixed(0)} με
        </text>
        <text x={cx} y="70" textAnchor="middle" fontSize="16" fill="#52674f">
          {t('放大 1000 倍')}
        </text>
      </svg>
      <svg
        viewBox={`0 0 ${w} 158`}
        role="img"
        aria-label={t('拉伸与压缩应变改变电阻，电桥输出微小电压')}
      >
        <path
          d={`M${cx} 18L${cx + 62} 65L${cx} 112L${cx - 62} 65Z`}
          fill="none"
          stroke="#829d8c"
          strokeWidth="2"
        />
        {[
          [cx - 31, 41],
          [cx + 31, 41],
          [cx - 31, 89],
          [cx + 31, 89],
        ].map(([x, y], i) => (
          <rect
            key={i}
            x={x - 17}
            y={y - 7}
            width="34"
            height="14"
            rx="4"
            fill={i === 0 || i === 3 ? '#bb8946' : '#70998c'}
            transform={`rotate(${[-45, 45, 45, -45][i]} ${x} ${y})`}
          />
        ))}
        <path
          d={`M${cx - 62} 65H${cx - 18}M${cx + 18} 65H${cx + 62}`}
          stroke={teal}
          strokeWidth="2"
        />
        <text x={cx} y="71" textAnchor="middle" fontSize="16" fill={tealText}>
          ΔV
        </text>
        <text x={cx} y="144" textAnchor="middle" fontSize="19" fill="#365b4f">
          {(cell.bridgeV * 1000).toFixed(3)} mV
        </text>
      </svg>
      <div className="bfs-gauge-resistance">
        <span>R+ {cell.resistancePlus.toFixed(2)} Ω</span>
        <span>R− {cell.resistanceMinus.toFixed(2)} Ω</span>
      </div>
      <p>{t('称重链测力，不用人体阻抗。')}</p>
    </div>
  );
}
function Waves({ shot, width }: { shot: BfsShot; width: number }) {
  const w = width,
    h = 284,
    voltageRange = Math.max(200, Math.ceil((Math.SQRT2 * shot.voltageRmsV * 1000) / 50) * 50),
    left = 16,
    right = w - 16,
    range = w - 32;
  const points = Array.from({ length: 241 }, (_, i) => ({
    x: left + (i / 240) * range,
    ...bfsWave(shot, i / 240),
  }));
  const draw = (kind: 'currentMicroA' | 'voltageMilliV', center: number, max: number) =>
    'M' +
    points.map((p) => `${p.x.toFixed(2)},${(center - (p[kind] / max) * 40).toFixed(2)}`).join(' L');
  const cursor = left + ((shot.phaseCycles % 2) / 2) * range;
  return (
    <div className="bfs-waves">
      <div className="bfs-wave-labels">
        <span style={{ color: goldText }}>
          {t('已知电流')} {Math.round(shot.currentRmsA * 1e6)} μA RMS
        </span>
        <span style={{ color: tealText }}>
          {t('采样电压')} {(shot.voltageRmsV * 1000).toFixed(1)} mV RMS
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={t('同一测量的电流与滞后电压，两周期共用时间轴')}
      >
        {[70, 182].map((y) => (
          <path key={y} d={`M${left} ${y}H${right}`} stroke="#a9bbb0" strokeWidth="1" />
        ))}
        <path d={draw('currentMicroA', 70, 400)} stroke={gold} fill="none" strokeWidth="2.8" />
        <path
          d={draw('voltageMilliV', 182, voltageRange)}
          stroke={teal}
          fill="none"
          strokeWidth="2.8"
        />
        <path d={`M${cursor} 25V238`} stroke="#687b6e" strokeOpacity=".35" />
        <text x="16" y="22" fontSize="16" fill={goldText}>
          I · ±400 μA
        </text>
        <text x="16" y="135" fontSize="16" fill={tealText}>
          V · ±{voltageRange} mV
        </text>
        <text x={w / 2} y="266" textAnchor="middle" fontSize="16" fill="#52674f">
          {t('两周期')} · {((2 / shot.frequencyHz) * 1e6).toFixed(0)} μs
        </text>
      </svg>
      <div className="bfs-signal-result" data-valid={shot.contact}>
        <span>|Z| = {shot.measured ? shot.measured.magnitude.toFixed(1) : '—'} Ω</span>
        <span>
          {t('电压滞后')} {shot.measured ? Math.abs(shot.measured.phaseDegrees).toFixed(1) : '—'}°
        </span>
      </div>
      <div className="bfs-resolved-impedance">
        R = {shot.measured ? shot.measured.resistance.toFixed(1) : '—'} Ω · X ={' '}
        {shot.measured ? shot.measured.reactance.toFixed(1) : '—'} Ω
      </div>
      <p>{t('波形各用自己的量程；幅比与相位共同给出阻抗。')}</p>
    </div>
  );
}
function Cell({ shot, width }: { shot: BfsShot; width: number }) {
  const w = width,
    l = 24,
    r = w - 24,
    c = w / 2;
  const top = shot.body.extracellularFraction,
    bottom = shot.body.intracellularFraction;
  return (
    <div className="bfs-cell">
      <div className="bfs-frequency">
        {(shot.frequencyHz / 1000).toFixed(1)} <span>kHz</span>
      </div>
      <svg
        viewBox={`0 0 ${w} 246`}
        role="img"
        aria-label={t('细胞外电阻并联细胞膜电容与细胞内电阻')}
      >
        <ellipse
          cx={c}
          cy="167"
          rx={(w - 66) / 2}
          ry="72"
          fill="#87b4b3"
          fillOpacity=".12"
          stroke="#71999a"
          strokeWidth="2"
          strokeDasharray="3 5"
        />
        <path
          d={`M${l} 63H${c - 35}M${c + 35} 63H${r}`}
          stroke={gold}
          strokeWidth={1 + top * 5}
          fill="none"
        />
        <rect x={c - 35} y="55" width="70" height="16" rx="5" fill="#d4ae70" />
        <path
          d={`M${l} 63V170H${w * 0.32 - 6}M${w * 0.32 + 6} 170H${w * 0.67 - 25}M${w * 0.67 + 25} 170H${r}V63`}
          stroke={gold}
          strokeWidth={1 + bottom * 5}
          opacity={0.35 + bottom}
          fill="none"
        />
        <path
          d={`M${w * 0.32 - 6} 148V192M${w * 0.32 + 6} 148V192`}
          stroke={teal}
          strokeWidth="3"
        />
        <rect x={w * 0.67 - 25} y="162" width="50" height="16" rx="4" fill="#88aaa5" />
        {[l, r].map((x) => (
          <circle key={x} cx={x} cy="63" r="4" fill={gold} />
        ))}
        <text x={c} y="38" textAnchor="middle" fontSize="16" fill="#52674f">
          Rₑ · {t('细胞外液')}
        </text>
        <text x={w * 0.32} y="217" textAnchor="middle" fontSize="16" fill={tealText}>
          Cₘ
        </text>
        <text x={w * 0.67} y="217" textAnchor="middle" fontSize="16" fill={tealText}>
          Rᵢ
        </text>
      </svg>
      <div className="bfs-circuit-label">{t('膜电容与细胞内液串联')}</div>
      <p>{t('线宽仅示意支路幅值；不是人体电流分布图。')}</p>
    </div>
  );
}
function Estimate({ shot }: { shot: BfsShot }) {
  const values = [
    shot.measured?.resistance.toFixed(1),
    shot.estimate?.waterL.toFixed(2),
    shot.estimate?.leanKg.toFixed(2),
    shot.estimate?.fatKg.toFixed(2),
  ];
  const labels = [
      shot.frequencyHz === BFS.referenceHz ? '50 kHz 电阻' : '当前频率电阻',
      '估计水分',
      '估计去脂体重',
      '估计脂肪质量',
    ],
    units = ['Ω', 'L', 'kg', 'kg'];
  const operations = ['幅比 + 相位', '教学 k × 身高² / R', '水分 / 0.73', '总重 − 去脂体重'];
  return (
    <div className="bfs-estimate">
      <div className="bfs-person-reference">
        {t('同一模型对象')} · {BFS.heightM.toFixed(2)} m · {shot.massKg.toFixed(1)} kg
      </div>
      <div className="bfs-estimate-flow">
        {labels.map((label, i) => (
          <div className="bfs-estimate-step" data-shown={shot.reveal >= i * 0.95} key={label}>
            <span>{t(label)}</span>
            <strong>
              {shot.reveal >= i * 0.95 ? (values[i] ?? '—') : '…'} <small>{units[i]}</small>
            </strong>
            <em>{t(operations[i])}</em>
          </div>
        ))}
      </div>
      <p className="bfs-disclosure">
        {t('教学系数未标定，0.73 是假设；这些数值不能测定个人脂肪。')}
      </p>
    </div>
  );
}
function Compare({ shot }: { shot: BfsShot }) {
  const estimated = shot.estimate;
  return (
    <div className="bfs-compare">
      <div className="bfs-water-change">
        <span>{t('只改变组织含水量')}</span>
        <strong>
          {shot.waterDeltaL > 0 ? '+' : ''}
          {shot.waterDeltaL.toFixed(1)} L
        </strong>
      </div>
      <div className="bfs-composition-key">
        <span>
          <i style={{ background: '#6b9faa' }} />
          {t('水分')}
        </span>
        <span>
          <i style={{ background: '#99ad9d' }} />
          {t('干瘦组织')}
        </span>
        <span>
          <i style={{ background: '#c19a60' }} />
          {t('脂肪')}
        </span>
      </div>
      {[
        [shot.waterL, BFS.dryLeanKg, shot.fatKg],
        [
          estimated?.waterL ?? 0,
          estimated ? estimated.leanKg - estimated.waterL : 0,
          estimated?.fatKg ?? 0,
        ],
      ].map((parts, i) => (
        <div className="bfs-composition" key={i}>
          <div className="bfs-composition-label">
            <span>{t(i ? '教学估计组成' : '模型真实组成')}</span>
            <span>{shot.massKg.toFixed(1)} kg</span>
          </div>
          <div className="bfs-mass-lane">
            {parts.map((v, j) => (
              <span
                key={j}
                style={{
                  width: `${(v / 73) * 100}%`,
                  background: ['#6b9faa', '#99ad9d', '#c19a60'][j],
                }}
              />
            ))}
            <i style={{ left: `${((shot.massKg - BFS.fatKg) / 73) * 100}%` }} />
          </div>
          <div className="bfs-fat-line">
            <span>{t(i ? '估计脂肪质量' : '真实脂肪质量')}</span>
            <strong>{i ? (estimated?.fatKg.toFixed(2) ?? '—') : shot.fatKg.toFixed(2)} kg</strong>
            <span>
              {i ? (estimated?.fatPercent.toFixed(2) ?? '—') : shot.trueFatPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      ))}
      <p>{t('脂肪质量固定，总重随水分改变；真实百分比的分母也会改变。')}</p>
    </div>
  );
}
export default function BodyFatScale() {
  const film = useShowcase(),
    id = useId(),
    host = useRef<HTMLElement>(null),
    [width, setWidth] = useState(700);
  const [view, setView] = useState<BfsView>('object'),
    [waterDeltaL, setWater] = useState(0),
    [frequencyHz, setFrequency] = useState<number>(BFS.referenceHz),
    [contact, setContact] = useState(true),
    [phaseCycles, setPhase] = useState(0);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, Math.round(entry.contentRect.width))),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const shot: BfsShot = film.watch
    ? bfsShot(film.chapter, film.chapterProgress)
    : {
        ...bfsState({ ...BFS_DEFAULT, waterDeltaL, frequencyHz, contact, phaseCycles }),
        view,
        reveal: 4,
        loadFraction: 1,
        explode: 0,
        routeReveal: 1,
        progress: 0,
      };
  const compact = width < 600,
    physical = ['object', 'weight', 'route'].includes(shot.view);
  return (
    <section
      className="bfs-study"
      ref={host}
      data-view={shot.view}
      data-watch={film.watch}
      data-contact={shot.contact}
      data-bfs-water={shot.waterL}
      data-bfs-fat={shot.fatKg}
    >
      <header className="bfs-heading">
        <span>BIOIMPEDANCE</span>
        <b>{t('先测信号，再作估计')}</b>
      </header>
      {physical && (
        <div className={`bfs-physical-layout ${shot.view === 'weight' ? 'bfs-weight-layout' : ''}`}>
          <div className="bfs-physical">
            <BodyFatScaleStudio
              shot={shot}
              width={shot.view === 'weight' && !compact ? ((width - 22) * 1.12) / 2.12 : width}
            />
            {shot.view === 'object' && (
              <output className="bfs-scale-readout">
                {shot.massKg.toFixed(1)} <small>kg</small>
              </output>
            )}
          </div>
          {shot.view === 'weight' && (
            <Bridge shot={shot} width={compact ? width : (width - 22) / 2.12} />
          )}
        </div>
      )}
      {shot.view === 'route' && (
        <div className="bfs-route-key">
          <span style={{ color: goldText }}>
            I+ {shot.contact ? '→' : '×'} I− · {t(shot.contact ? '闭合电流' : '电流已断开')}
          </span>
          <span style={{ color: tealText }}>V+ − V− · {t('高阻采样')}</span>
          <p>{t('交流放慢示意；路径不等于全身电流分布。')}</p>
        </div>
      )}
      {shot.view === 'wave' && <Waves shot={shot} width={width} />}
      {shot.view === 'cell' && <Cell shot={shot} width={width} />}
      {shot.view === 'estimate' && <Estimate shot={shot} />}
      {shot.view === 'compare' && <Compare shot={shot} />}
      {!shot.contact && (
        <p className="bfs-open-status" role="status">
          {t('接触断开：体重仍可显示，阻抗与脂肪估计不可用。')}
        </p>
      )}
      {shot.status === 'frequency' && ['estimate', 'compare'].includes(shot.view) && (
        <p className="bfs-open-status">
          {t('本教学估算只定义在 50 kHz；其他频率仅比较电学响应。')}
        </p>
      )}
      {!film.watch && (
        <details className="bfs-explore" open>
          <summary>{t('改变模型条件')}</summary>
          <div className="bfs-view-options" role="group" aria-label={t('体脂秤观察方式')}>
            {(Object.keys(names) as BfsView[]).map((v) => (
              <button type="button" key={v} aria-pressed={v === view} onClick={() => setView(v)}>
                {t(names[v])}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-water`}>
            {t('组织水分变化')}{' '}
            <output>
              {waterDeltaL > 0 ? '+' : ''}
              {waterDeltaL.toFixed(1)} L
            </output>
          </label>
          <input
            id={`${id}-water`}
            type="range"
            min="-3"
            max="3"
            step=".1"
            value={waterDeltaL}
            onChange={(e) => setWater(Number(e.target.value))}
          />
          <label htmlFor={`${id}-frequency`}>
            {t('交流频率')} <output>{(frequencyHz / 1000).toFixed(0)} kHz</output>
          </label>
          <input
            id={`${id}-frequency`}
            type="range"
            min="2000"
            max="200000"
            step="1000"
            value={frequencyHz}
            onChange={(e) => setFrequency(Number(e.target.value))}
          />
          <button
            type="button"
            className="bfs-reference-frequency"
            onClick={() => setFrequency(BFS.referenceHz)}
          >
            {t('回到 50 kHz')}
          </button>
          <label htmlFor={`${id}-phase`}>
            {t('放慢后的观察相位')}{' '}
            <output>
              {phaseCycles.toFixed(2)} {t('周期')}
            </output>
          </label>
          <input
            id={`${id}-phase`}
            type="range"
            min="0"
            max="2"
            step=".01"
            value={phaseCycles}
            onChange={(e) => setPhase(Number(e.target.value))}
          />
          <label className="bfs-contact">
            <input
              type="checkbox"
              checked={contact}
              onChange={(e) => setContact(e.target.checked)}
            />
            {t('双脚接触四个电极')}
          </label>
          <p>{t('水分变化是假想组织状态，不代表喝水后立即出现相同读数。')}</p>
        </details>
      )}
    </section>
  );
}
