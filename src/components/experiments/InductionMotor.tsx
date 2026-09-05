import { useEffect, useId, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import InductionMotorStudio from '../three/InductionMotorStudio';
import {
  MOTOR,
  motorAxes,
  motorShot,
  motorSample,
  motorCircuit,
  motorSteadySlip,
  motorStartup,
  motorSyncRpm,
  motorBreakdownSlip,
  type MotorShot,
} from '../../models/induction-motor';
import '../../styles/induction-motor.css';

const phaseColors = ['#b5623d', '#267f75', '#7870ad'];
const captions = [
  '三相电流错开三分之一个周期，合成磁场持续转向。',
  '这里是两极电机：50 Hz 的电源，对应每分钟 3000 转的磁场。',
  '磁场掠过静止铜条；电流沿导条与两端铜环闭合。',
  '电磁转矩先加速转子；转子接近磁场速度后，感应电流减小。',
  '把转子带到同步速度，转差为零，感应电流和电磁转矩也为零。',
  '比较稳定运行点：负载加大，转子稍慢，转差带来更大的转矩。',
  '停机后交换两相再启动，磁场和转子的方向一起反转。',
  '穿过气隙的功率，一部分变成机械功，一部分在转子里发热。',
];
const format = (n: number, d = 1) => (Math.abs(n) < 0.5 * 10 ** -d ? 0 : n).toFixed(d);
function FieldSlice({ shot }: { shot: MotorShot }) {
  const s = shot.state,
    id = useId().replace(/:/g, ''),
    cx = 150,
    cy = 113;
  const fieldScale = 11;
  return (
    <div className="indmotor-field-slice">
      <div className="indmotor-instrument-title">
        {t(shot.chapter === 2 ? '端环把电流接成回路' : '从轴端看合成磁场')}
      </div>
      <svg
        viewBox="0 0 300 226"
        role="img"
        aria-label={t('轴端截面：三相空间轴、合成磁场与每根导条的电流方向')}
      >
        <defs>
          <marker
            id={`${id}-tip`}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L8 4L0 8" fill="none" stroke="context-stroke" strokeWidth="1.5" />
          </marker>
        </defs>
        <circle cx={cx} cy={cy} r="101" fill="none" stroke="#cdd7cf" strokeWidth="17" />
        <circle
          cx={cx}
          cy={cy}
          r="72"
          fill="#e5e7dc"
          stroke="#b68d65"
          strokeWidth={shot.chapter === 2 ? 7 : 3}
        />
        {motorAxes.map((a, i) => (
          <g key={a}>
            <line
              x1={cx - 99 * Math.cos(a)}
              y1={cy + 99 * Math.sin(a)}
              x2={cx + 99 * Math.cos(a)}
              y2={cy - 99 * Math.sin(a)}
              stroke={phaseColors[i]}
              opacity=".25"
              strokeDasharray="4 5"
            />
            <text
              x={cx + 123 * Math.cos(a)}
              y={cy - 105 * Math.sin(a) + 6}
              textAnchor="middle"
              fill={phaseColors[i]}
              fontSize="20"
            >
              {['A', 'B', 'C'][i]}
            </text>
            {shot.chapter === 0 && (
              <path
                d={`M${cx} ${cy}l${s.magnetizingPhases[i] * fieldScale * Math.cos(a)} ${-s.magnetizingPhases[i] * fieldScale * Math.sin(a)}`}
                stroke={phaseColors[i]}
                strokeWidth="3"
                markerEnd={`url(#${id}-tip)`}
              />
            )}
          </g>
        ))}
        {Array.from({ length: MOTOR.bars }, (_, i) => {
          const a = (i * Math.PI * 2) / MOTOR.bars + s.rotorAngle,
            x = cx + 72 * Math.cos(a),
            y = cy - 72 * Math.sin(a),
            v = s.cage.bars[i];
          const color =
            shot.showBarCurrent && Math.abs(v) > 0.03 ? (v > 0 ? '#a95f34' : '#2f8297') : '#a99a83';
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={shot.chapter === 2 ? 5.3 : 3.3}
                fill="#f8f1df"
                stroke={color}
                strokeWidth="1.5"
              />
              {shot.chapter === 2 &&
                Math.abs(v) > 0.06 &&
                (v > 0 ? (
                  <circle cx={x} cy={y} r="1.8" fill={color} />
                ) : (
                  <path d={`M${x - 2} ${y - 2}l4 4m-4 0l4-4`} stroke={color} strokeWidth="1.5" />
                ))}
            </g>
          );
        })}
        {shot.chapter === 2 &&
          s.cage.front.map((current, i) => {
            const angle = ((i + 0.5) * Math.PI * 2) / MOTOR.bars + s.rotorAngle,
              x = cx + 72 * Math.cos(angle),
              y = cy - 72 * Math.sin(angle),
              sign = Math.sign(current);
            return Math.abs(current) > 0.25 && i % 3 === 0 ? (
              <path
                key={i}
                d={`M${x + Math.sin(angle) * 5 * sign} ${y + Math.cos(angle) * 5 * sign}l${-Math.sin(angle) * 10 * sign} ${-Math.cos(angle) * 10 * sign}`}
                stroke={current > 0 ? '#a95f34' : '#2f8297'}
                strokeWidth="2.3"
                markerEnd={`url(#${id}-tip)`}
              />
            ) : null;
          })}
        <path
          d={`M${cx - s.field.x * fieldScale * 0.62} ${cy + s.field.y * fieldScale * 0.62}L${cx + s.field.x * fieldScale} ${cy - s.field.y * fieldScale}`}
          stroke="#237a71"
          strokeWidth="4"
          markerEnd={`url(#${id}-tip)`}
        />
        <line
          x1={cx}
          y1={cy}
          x2={cx + 55 * Math.cos(s.rotorAngle)}
          y2={cy - 55 * Math.sin(s.rotorAngle)}
          stroke="#b7864d"
          strokeWidth="3"
        />
        <circle cx={cx} cy={cy} r="9" fill="#78878a" />
      </svg>
      {shot.chapter === 2 ? (
        <div className="indmotor-axis">
          <span>{t('⊙ 流向你')}</span>
          <span>{t('⊗ 流向背面')}</span>
        </div>
      ) : (
        <div className="indmotor-phase-values">
          {s.phases.map((v, i) => (
            <span key={i} style={{ color: phaseColors[i] }}>
              {['A', 'B', 'C'][i]} <b>{format(v)} A</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
function MotorPlot({ shot }: { shot: MotorShot }) {
  const s = shot.state,
    start = shot.focus === 'start',
    points = Array.from({ length: 151 }, (_, i) => {
      const x = i / 150;
      return start
        ? `${i ? 'L' : 'M'}${8 + x * 284},${148 - (motorStartup(x * 2).state.rpm / 3000) * 130}`
        : `${i ? 'L' : 'M'}${8 + (1 - x) * 284},${148 - (motorCircuit(x).torque / 30) * 130}`;
    }).join(' ');
  const dotX = start ? 8 + (shot.physicalTime / 2) * 284 : 8 + (1 - s.slip) * 284;
  const dotY = start ? 148 - (Math.abs(s.rpm) / 3000) * 130 : 148 - (Math.abs(s.torque) / 30) * 130;
  return (
    <div className="indmotor-plot">
      <div className="indmotor-instrument-title">
        {t(start ? '从静止开始的启动轨迹' : '转速与电磁转矩')}
      </div>
      <div className="indmotor-plot-unit">{start ? '|n| · 3000 rpm' : '30 N·m'}</div>
      <svg
        viewBox="0 0 300 160"
        role="img"
        aria-label={t(
          start ? '按惯量与转矩积分得到的启动转速曲线' : '低转差稳定运行支上的负载交点',
        )}
      >
        <path d="M8 14V148H292" fill="none" stroke="#b6c8bc" />
        {!start && (
          <rect
            x={8 + (1 - motorBreakdownSlip) * 284}
            y="14"
            width={motorBreakdownSlip * 284}
            height="134"
            fill="#277e7210"
          />
        )}
        {!start && <path d={`M8 ${dotY}H292`} stroke="#b58549" strokeDasharray="5 5" />}
        <path d={points} fill="none" stroke="#277e72" strokeWidth="3" />
        <path d={`M${dotX} 148V${dotY}`} stroke="#87a99a" strokeDasharray="3 4" />
        <circle cx={dotX} cy={dotY} r="5" fill="#a76c35" stroke="#faf6eb" strokeWidth="2" />
      </svg>
      <div className="indmotor-axis">
        <span>0</span>
        <span>{start ? '2 s' : '3000 rpm'}</span>
      </div>
      <p className="indmotor-instrument-note">
        {t(start ? '准稳态电路 + 转动惯量；负载 1 N·m' : '深色区：低转差稳定支；虚线：负载转矩')}
      </p>
    </div>
  );
}
function PowerSplit({ shot }: { shot: MotorShot }) {
  const s = shot.state;
  const rows = [
    { label: '机械功率', value: s.converted, color: '#448a7c' },
    { label: '转子铜耗', value: s.rotorCopper, color: '#ba844e' },
    { label: '定子铜耗', value: s.statorCopper, color: '#a58a77' },
  ];
  return (
    <div className="indmotor-power">
      <div className="indmotor-instrument-title">{t('功率没有凭空消失')}</div>
      <div className="indmotor-power-input">
        {t('电气输入')} <b>{format(s.inputPower, 0)} W</b>
      </div>
      {rows.map((row) => (
        <div className="indmotor-power-row" key={row.label}>
          <div>
            <span>{t(row.label)}</span>
            <b>{format(row.value, 0)} W</b>
          </div>
          <div className="indmotor-power-track">
            <i
              style={{
                width: `${s.inputPower ? (100 * row.value) / s.inputPower : 0}%`,
                background: row.color,
              }}
            />
          </div>
        </div>
      ))}
      <p>
        {t('转子铜耗 / 气隙功率')} = <b>{format(s.slip * 100, 1)}%</b>
      </p>
    </div>
  );
}
export default function InductionMotor() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null),
    id = useId();
  const [width, setWidth] = useState(800),
    [manualMode, setManualMode] = useState<'slip' | 'load'>('load');
  const [slip, setSlip] = useState(0.045),
    [load, setLoad] = useState(2),
    [phase, setPhase] = useState(100),
    [direction, setDirection] = useState<1 | -1>(1),
    [view, setView] = useState<'field' | 'load' | 'power'>('field');
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const automatic = motorShot(film.chapter, film.chapterProgress),
    actualSlip = manualMode === 'load' ? motorSteadySlip(load)! : slip;
  const shot: MotorShot = film.watch
    ? automatic
    : {
        ...automatic,
        chapter: 2,
        focus: view,
        load,
        state: motorSample(
          actualSlip,
          (phase * Math.PI) / 180,
          (direction * (1 - actualSlip) * phase * Math.PI) / 180,
          direction,
        ),
        showBarCurrent: true,
      };
  const s = shot.state,
    narrow = width < 620;
  const instrument =
    shot.focus === 'field' || shot.focus === 'cage' ? (
      <FieldSlice shot={shot} />
    ) : shot.focus === 'power' ? (
      <PowerSplit shot={shot} />
    ) : shot.focus === 'sync' ? (
      <div className="indmotor-sync-proof">
        <span>
          s = <b>{format(100 * s.slip, 2)}%</b>
        </span>
        <span>
          I₂′ = <b>{format(s.rotorCurrent, 2)} A</b>
        </span>
        <span>
          τ = <b>{format(s.torque, 2)} N·m</b>
        </span>
        <p>{t(s.slip < 1e-7 ? '转子中不再有变化的主磁通' : '外力设定转速，观察感应逐渐消失')}</p>
      </div>
    ) : (
      <MotorPlot shot={shot} />
    );
  return (
    <div
      ref={host}
      className="induction-motor"
      data-watch={film.watch}
      data-narrow={narrow}
      data-focus={shot.focus}
    >
      <div className="indmotor-stage">
        <div className="indmotor-machine">
          <div className="indmotor-heading">
            <span>{t('让磁场先走一步')}</span>
            <span>{t('两极 · 三相 · 鼠笼转子')}</span>
          </div>
          <div className="indmotor-object">
            <InductionMotorStudio key={narrow ? 'phone' : 'wide'} shot={shot} narrow={narrow} />
          </div>
          <div className="indmotor-speeds">
            <span>
              {t('磁场')} <b>{s.direction * motorSyncRpm} rpm</b>
            </span>
            <span>
              {t('转子')} <b>{format(s.rpm, 0)} rpm</b>
            </span>
          </div>
        </div>
        <div className="indmotor-proof">
          {instrument}
          {shot.focus !== 'sync' && shot.focus !== 'power' && (
            <div className="indmotor-slip-strip">
              <span>
                s <b>{format(s.slip * 100, 1)}%</b>
              </span>
              <span>
                f₂ <b>{format(s.rotorFrequency, 1)} Hz</b>
              </span>
            </div>
          )}
        </div>
        <p className="indmotor-caption">
          {film.watch
            ? t(captions[shot.chapter])
            : t('改变负载或直接设定转差，再停在一个电源相位观察电流。')}
        </p>
      </div>
      {!film.watch && (
        <div className="indmotor-explore">
          <div className="indmotor-switches">
            <button
              type="button"
              aria-pressed={manualMode === 'load'}
              onClick={() => setManualMode('load')}
            >
              {t('稳定负载')}
            </button>
            <button
              type="button"
              aria-pressed={manualMode === 'slip'}
              onClick={() => setManualMode('slip')}
            >
              {t('指定转差')}
            </button>
          </div>
          <label htmlFor={`${id}-work`}>
            <span>
              {t(manualMode === 'load' ? '负载转矩' : '转差率')}
              <output>
                {manualMode === 'load' ? `${format(load)} N·m` : `${format(slip * 100, 1)}%`}
              </output>
            </span>
            <input
              id={`${id}-work`}
              type="range"
              min="0"
              max={manualMode === 'load' ? 6 : 1}
              step={manualMode === 'load' ? 0.1 : 0.005}
              value={manualMode === 'load' ? load : slip}
              onChange={(e) =>
                manualMode === 'load'
                  ? setLoad(Number(e.target.value))
                  : setSlip(Number(e.target.value))
              }
            />
          </label>
          <label htmlFor={`${id}-phase`}>
            <span>
              {t('电源相位')}
              <output>{phase}°</output>
            </span>
            <input
              id={`${id}-phase`}
              type="range"
              min="0"
              max="360"
              step="1"
              value={phase}
              onChange={(e) => setPhase(Number(e.target.value))}
            />
          </label>
          <div className="indmotor-switches">
            <button type="button" aria-pressed={direction === 1} onClick={() => setDirection(1)}>
              A → B → C
            </button>
            <button type="button" aria-pressed={direction === -1} onClick={() => setDirection(-1)}>
              A → C → B
            </button>
          </div>
          <div className="indmotor-switches">
            {(['field', 'load', 'power'] as const).map((v) => (
              <button type="button" key={v} aria-pressed={view === v} onClick={() => setView(v)}>
                {t(v === 'field' ? '观察磁场' : v === 'load' ? '观察转矩' : '观察功率')}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setManualMode('load');
                setLoad(2);
                setSlip(0.045);
                setPhase(100);
                setDirection(1);
                setView('field');
              }}
            >
              {t('重置')}
            </button>
          </div>
        </div>
      )}
      <details className="indmotor-scope">
        <summary>{t('读图与模型边界')}</summary>
        <p>
          {t(
            '角运动统一慢放；启动曲线使用模型秒数。磁场来自三相等效磁化电流的矢量和，已计入转子反作用。',
          )}
        </p>
        <p>
          {t(
            '电流读数是折算到定子侧的有效值；三相 A、B、C 读数是瞬时值。铜条的颜色和箭头表示相对电流，不是电荷粒子。',
          )}
        </p>
        <p>
          {t(
            '采用线性每相等效电路，忽略铁耗、风摩耗与快速电磁暂态。直接指定转差是在比较运行点；反向启动从静止开始。',
          )}
        </p>
      </details>
    </div>
  );
}
