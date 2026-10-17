import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { hohmannCircle, hohmannPlan, hohmannState } from '../../models/orbital-transfer';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/orbital-transfer.css';
type Phase = 'before' | 'coast' | 'arrival' | 'after' | 'missed';
const number = (v: number) => v.toFixed(3),
  signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(3)}`;
export default function OrbitalTransfer() {
  const d = useShowcase(),
    id = useId().replace(/:/g, ''),
    [initial, setInitial] = useState(1),
    [target, setTarget] = useState(1.8),
    [phase, setPhase] = useState<Phase>('coast'),
    [fraction, setFraction] = useState(0.5),
    c = d.watch ? Math.min(6, d.chapter) : 2,
    p = d.watch ? d.chapterProgress : 1;
  const from = d.watch ? (c === 6 ? 1.8 : 1) : initial,
    to = d.watch ? (c === 6 ? 1 : 1.8) : target,
    plan = useMemo(() => hohmannPlan(from, to), [from, to]);
  const shot: Phase = d.watch
    ? c === 0 || (c === 1 && p < 0.3)
      ? 'before'
      : c === 3 || (c === 4 && p < 0.35)
        ? 'arrival'
        : c === 4
          ? 'after'
          : c === 5
            ? 'missed'
            : 'coast'
    : phase;
  const progress = d.watch
    ? c === 1
      ? 0
      : c === 2
        ? Math.min(1, p / 0.8)
        : c === 6
          ? Math.min(1, p / 0.8)
          : 1
    : fraction;
  const current =
    shot === 'before'
      ? hohmannCircle(from, d.watch && c === 0 ? (-Math.PI / 2) * (1 - Math.min(1, p / 0.6)) : 0)
      : shot === 'after'
        ? hohmannCircle(
            to,
            Math.PI + ((d.watch ? Math.max(0, (p - 0.5) / 0.5) : fraction) * Math.PI) / 3,
          )
        : hohmannState(
            shot === 'arrival'
              ? 1
              : shot === 'missed'
                ? 1 + (d.watch ? Math.min(1, p / 0.8) : fraction)
                : progress,
            plan,
          );
  const scale = 106 / Math.max(from, to),
    screen = (point: { x: number; y: number }) => ({
      x: 180 + point.x * scale,
      y: 130 - point.y * scale,
    }),
    ship = screen(current),
    vectorLength = 34,
    unit =
      current.speed > 0
        ? { x: current.vx / current.speed, y: -current.vy / current.speed }
        : { x: 0, y: 0 };
  const path = useMemo(
      () => Array.from({ length: 161 }, (_, i) => hohmannState(i / 80, plan)),
      [plan],
    ),
    line = (points: typeof path) =>
      points
        .map((point, i) => {
          const s = screen(point);
          return `${i ? 'L' : 'M'}${s.x} ${s.y}`;
        })
        .join(' '),
    displayPath =
      shot === 'missed'
        ? path.filter((v) => v.time <= current.time)
        : shot === 'coast'
          ? path.filter((v) => v.time <= current.time)
          : [];
  const comparison = shot === 'arrival' || shot === 'after' || c === 1,
    third = comparison ? Math.sqrt(1 / current.r) : current.energy;
  return (
    <section
      className="transfer-study"
      data-watch={d.watch}
      aria-label={t('霍曼转移的双脉冲与滑行实验')}
    >
      <header>
        <span>HOHMANN / TWO IMPULSES</span>
        <b>{t('μ = 1，归一化单位')}</b>
      </header>
      <div
        className="transfer-map"
        role="img"
        aria-label={t('由焦点几何与开普勒时间求得的真实转移轨迹')}
      >
        <svg viewBox="0 0 360 260">
          <defs>
            <marker
              id={`${id}-velocity`}
              markerUnits="userSpaceOnUse"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0L7 3.5L0 7Z" fill="#8a6d48" />
            </marker>
          </defs>
          <circle className="transfer-inner" cx="180" cy="130" r={from * scale} />
          <circle className="transfer-target" cx="180" cy="130" r={to * scale} />
          <path className="transfer-ellipse" d={line(path)} />
          {displayPath.length > 1 && (
            <path className="transfer-traveled" d={line([...displayPath, current])} />
          )}
          <circle className="transfer-body" cx="180" cy="130" r="12" />
          <path
            className="transfer-velocity"
            markerEnd={`url(#${id}-velocity)`}
            d={`M${ship.x + unit.x * 8} ${ship.y + unit.y * 8}L${ship.x + unit.x * (8 + current.speed * vectorLength)} ${ship.y + unit.y * (8 + current.speed * vectorLength)}`}
          />
          <circle className="transfer-ship" cx={ship.x} cy={ship.y} r="5" />
        </svg>
      </div>
      <div className="transfer-legend">
        <span>{t('初始圆')}</span>
        <span>{t('转移椭圆')}</span>
        <span>{t('目标圆')}</span>
      </div>
      <div className="transfer-state">
        <span>
          r<b>{number(current.r)}</b>
        </span>
        <span>
          v<b>{number(current.speed)}</b>
        </span>
        <span>
          {comparison ? t('圆轨道 v') : 'E'}
          <b>{number(third)}</b>
        </span>
      </div>
      <div className="transfer-burns">
        <span>
          Δv₁ <b>{signed(plan.burn1)}</b>
        </span>
        <span>
          Δv₂ <b>{shot === 'missed' ? t('未施加') : signed(plan.burn2)}</b>
        </span>
      </div>
      {!d.watch && (
        <div className="transfer-controls">
          <label htmlFor={`${id}-initial`}>
            {t('初始圆半径')} · {initial}
            <input
              id={`${id}-initial`}
              type="range"
              min=".6"
              max="3"
              step=".1"
              value={initial}
              onChange={(e) => setInitial(+e.target.value)}
            />
          </label>
          <label htmlFor={`${id}-target`}>
            {t('目标圆半径')} · {target}
            <input
              id={`${id}-target`}
              type="range"
              min=".6"
              max="3"
              step=".1"
              value={target}
              onChange={(e) => setTarget(+e.target.value)}
            />
          </label>
          <label htmlFor={`${id}-phase`}>{t('观察阶段')}</label>
          <select
            id={`${id}-phase`}
            value={phase}
            onChange={(e) => setPhase(e.target.value as Phase)}
          >
            <option value="before">{t('第一次点火前')}</option>
            <option value="coast">{t('椭圆滑行')}</option>
            <option value="arrival">{t('第二次点火前')}</option>
            <option value="after">{t('第二次点火后')}</option>
            <option value="missed">{t('省略第二次点火')}</option>
          </select>
          {phase !== 'before' && phase !== 'arrival' && (
            <label htmlFor={`${id}-fraction`}>
              {t('当前阶段进度')} · {Math.round(fraction * 100)}%
              <input
                id={`${id}-fraction`}
                type="range"
                min="0"
                max="1"
                step=".01"
                value={fraction}
                onChange={(e) => setFraction(+e.target.value)}
              />
            </label>
          )}
        </div>
      )}
      <details>
        <summary>{t('到达某个高度，不等于已经进入圆轨道')}</summary>
        <p>
          {t(
            '同一中心引力、共面同向圆轨道、两次瞬时切向脉冲、无推力滑行；μ=1 且半径、速度、时间归一化，不是飞行操作建议。a=(r₁+r₂)/2，滑行用开普勒方程而非匀速沿曲线走，满足 v²=μ(2/r−1/a)。升轨两次顺行加速，降轨两次逆行减速；滑行速度随半径改变。省略第二次点火会继续原椭圆，不自动停在目标圆。正负 Δv 取沿当时运动方向，不是画面上下；E 是单位质量能量。忽略有限点火、倾角、摄动、会合相位与燃料质量，不宣称任意任务下全局最优。',
          )}
        </p>
      </details>
    </section>
  );
}
