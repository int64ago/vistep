import { useId, useState } from 'react';
import { t } from '../../i18n';
import { descentPlot, descentTrace } from '../../models/gradient-descent';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/gradient-descent.css';
const fmt = (n: number) =>
  Math.abs(n) >= 1000 ? n.toExponential(1) : String(Math.round(n * 1000) / 1000);
const cases = [
  descentTrace(0.08, 18),
  descentTrace(0.22, 12),
  descentTrace(0.3, 4),
  descentTrace(0.25, 12),
];
export default function GradientDescent() {
  const d = useShowcase(),
    id = useId(),
    [rate, setRate] = useState(0.08),
    [step, setStep] = useState(1);
  const c = d.watch ? Math.min(5, d.chapter) : 1,
    p = d.watch ? d.chapterProgress : 1,
    q = d.watch ? cases[c < 3 ? 0 : c - 2] : descentTrace(rate, 20),
    index = d.watch
      ? c === 0
        ? 0
        : c === 1
          ? 1
          : Math.min(q.points.length - 1, Math.floor(p * (q.points.length - 1)))
      : Math.min(step, q.points.length - 1),
    current = q.points[index],
    plot = descentPlot(q.points),
    shown = q.points.slice(0, index + 1),
    path = shown
      .map((p, i) => {
        const pt = plot.point(p.x, p.y);
        return `${i ? 'L' : 'M'}${pt.x} ${pt.y}`;
      })
      .join(' '),
    dot = plot.point(current.x, current.y),
    start = q.points[0],
    arrowStart = plot.point(start.x, start.y),
    norm = Math.hypot(start.gx, start.gy),
    arrowEnd =
      c === 0
        ? plot.point(start.x - (0.8 * start.gx) / norm, start.y - (0.8 * start.gy) / norm)
        : plot.point(q.points[1].x, q.points[1].y),
    dx = arrowEnd.x - arrowStart.x,
    dy = arrowEnd.y - arrowStart.y,
    length = Math.hypot(dx, dy),
    arrowTip = { x: arrowEnd.x - (dx * 6) / length, y: arrowEnd.y - (dy * 6) / length },
    levels = Array.from(
      { length: Math.min(80, Math.ceil(Math.log2(plot.bound * plot.bound * 8)) + 2) },
      (_, i) => 0.5 * 2 ** i,
    ).filter((level) => Math.sqrt(level / 4) < plot.bound * 1.5);
  return (
    <section
      className="descent-study"
      data-watch={d.watch}
      aria-label={t('梯度下降与步长边界实验')}
    >
      <header>
        <span>DESCENT / CURVATURE</span>
        <b>η = {q.rate}</b>
      </header>
      <svg viewBox="0 0 360 280" role="img" aria-label={t('二次损失等高线与真实迭代路径')}>
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x="22" y="18" width="316" height="244" rx="14" />
          </clipPath>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="9"
            markerHeight="9"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10" />
          </marker>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          {levels.map((level) => (
            <ellipse
              key={level}
              cx="180"
              cy="140"
              rx={Math.sqrt(2 * level) * plot.scale}
              ry={Math.sqrt(level / 4) * plot.scale}
              className="descent-contour"
            />
          ))}
          <path d="M22 140H338M180 18V262" className="descent-axis" />
          <path d={path} className="descent-path" />
          {shown.map((point) => {
            const pt = plot.point(point.x, point.y);
            return (
              <circle key={point.step} cx={pt.x} cy={pt.y} r="3.5" className="descent-history" />
            );
          })}
          {d.watch && c < 2 && (
            <path
              d={`M${arrowStart.x} ${arrowStart.y}L${arrowTip.x} ${arrowTip.y}`}
              className="descent-arrow"
              markerEnd={`url(#${id}-arrow)`}
            />
          )}
          <circle cx={dot.x} cy={dot.y} r="6" className="descent-dot" />
        </g>
        <text x="286" y="166" textAnchor="middle">
          {fmt(plot.bound)}
        </text>
        <text x="74" y="166" textAnchor="middle">
          −{fmt(plot.bound)}
        </text>
        <text x="190" y="38">
          {fmt(plot.bound)}
        </text>
        <text x="190" y="254">
          −{fmt(plot.bound)}
        </text>
      </svg>
      <div className="descent-readout">
        <span>
          {t('步')} {current.step}
        </span>
        <span>
          (x,y) = ({fmt(current.x)}, {fmt(current.y)})
        </span>
        <strong>f = {fmt(current.loss)}</strong>
      </div>
      {c === 0 && d.watch ? (
        <p className="descent-rule">−∇f = (−x, −8y)</p>
      ) : c === 1 && d.watch ? (
        <p className="descent-rule">(x,y) ← (x,y) − η∇f</p>
      ) : null}
      {!d.watch && (
        <div className="descent-controls">
          <label htmlFor={`${id}-rate`}>
            {t('学习率')} η · {rate}
          </label>
          <input
            id={`${id}-rate`}
            type="range"
            min="0.02"
            max="0.3"
            step="0.01"
            value={rate}
            onChange={(e) => {
              setRate(+e.target.value);
              setStep(0);
            }}
          />
          <label htmlFor={`${id}-step`}>
            {t('迭代步数')} · {step}
          </label>
          <input
            id={`${id}-step`}
            type="range"
            min="0"
            max="20"
            value={step}
            onChange={(e) => setStep(+e.target.value)}
          />
        </div>
      )}
      <details>
        <summary>{t('下降方向，也需要合适的步长')}</summary>
        <p>
          {t(
            'f=(x²+8y²)/2，梯度为(x,8y)，两个方向曲率为1和8。固定步长要满足0<η<2/8才对任意起点收敛；η=0.25会让y反号但幅度不减。图按该组完整轨迹调整等比例坐标范围，不把越界点夹回画面。此严格凸例子有唯一最小值，不能推广为非凸损失总能找到全局最优。',
          )}
        </p>
      </details>
    </section>
  );
}
