import { useId, useState } from 'react';
import { t } from '../../i18n';
import { keplerAt, keplerSector } from '../../models/kepler-orbits';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/kepler-orbits.css';
export default function KeplerOrbits() {
  const d = useShowcase(),
    id = useId(),
    [eccentricity, setEccentricity] = useState(0.65),
    [a, setA] = useState(1),
    [elapsed, setElapsed] = useState(0.35),
    [sectors, setSectors] = useState(true);
  const c = d.watch ? Math.min(5, d.chapter) : 3,
    p = d.watch ? d.chapterProgress : 1;
  const e = d.watch
    ? c === 0
      ? 0
      : c === 4
        ? 0.1 + 0.7 * (p * p * (3 - 2 * p))
        : 0.65
    : eccentricity;
  const size = d.watch ? (c === 5 ? 1.6 : 1) : a,
    period = size ** 1.5;
  const phase = d.watch
    ? c === 3
      ? -0.06 + 0.12 * p
      : c === 4
        ? 0.06
        : c === 5
          ? (2 * p) / period
          : p
    : elapsed / period;
  const q = keplerAt(e, size, phase),
    near = keplerAt(e, size, 0),
    far = keplerAt(e, size, 0.5);
  const duration = d.watch && c === 3 ? 0.12 * p : 0.12,
    showSectors = d.watch ? c === 3 || c === 4 : sectors;
  const startNear = d.watch ? -0.06 : phase - 0.12,
    startFar = d.watch ? 0.44 : phase + 0.5 - 0.12;
  const sweepNear = keplerSector(e, size, startNear, duration),
    sweepFar = keplerSector(e, size, startFar, duration),
    other = keplerAt(e, size, startFar + duration);
  const path = (points: { x: number; y: number }[]) =>
    `M0 0L${points.map((v) => `${v.x},${-v.y}`).join('L')}Z`;
  const expanded = !d.watch || c === 5;
  return (
    <section className="kepler-study" aria-label={t('开普勒轨道实验')} data-comparison={expanded}>
      <header>
        <span>KEPLER / TWO BODY</span>
        <span>e = {e.toFixed(2)}</span>
      </header>
      <div className="kepler-question">
        {t(
          c === 0 && d.watch
            ? '圆轨道是一个特例'
            : c === 5
              ? '同一个中心，不同轨道大小'
              : '相同时间，扫过相同面积',
        )}
      </div>
      <svg
        className="kepler-map"
        viewBox={expanded ? '-3.55 -2.05 5.6 4.1' : '-1.95 -1.25 3.4 2.5'}
        role="img"
        aria-label={t('焦点固定的椭圆轨道与等时面积')}
      >
        {c === 5 && d.watch && (
          <>
            <ellipse cx={-e} cy="0" rx="1" ry={Math.sqrt(1 - e * e)} className="kepler-reference" />
            <circle
              cx={keplerAt(e, 1, 2 * p).x}
              cy={-keplerAt(e, 1, 2 * p).y}
              r=".055"
              className="kepler-reference-dot"
            />
          </>
        )}
        <ellipse cx={-size * e} cy="0" rx={size} ry={q.b} className="kepler-orbit" />
        {d.watch && c === 1 && (
          <>
            <path
              d={`M${-size * e} -.12V.12M${-size * e - 0.12} 0H${-size * e + 0.12}`}
              className="kepler-center"
            />
            <line x1={-size * e} y1="0" x2="0" y2="0" className="kepler-focus-offset" />
          </>
        )}
        {showSectors && (
          <>
            <path d={path(sweepNear.points)} className="kepler-sector-near" />
            <path d={path(sweepFar.points)} className="kepler-sector-far" />
            <circle cx={other.x} cy={-other.y} r=".055" className="kepler-other" />
          </>
        )}
        <path d={`M0 0L${q.x} ${-q.y}`} className="kepler-radius" />
        {c === 2 && d.watch && (
          <>
            <circle cx={near.x} cy="0" r=".045" className="kepler-peri" />
            <circle cx={far.x} cy="0" r=".045" className="kepler-apo" />
          </>
        )}
        <circle cx="0" cy="0" r=".10" className="kepler-star-halo" />
        <circle cx="0" cy="0" r=".055" className="kepler-star" />
        <circle cx={q.x} cy={-q.y} r={expanded ? '.075' : '.055'} className="kepler-planet" />
      </svg>
      <div className="kepler-focus-key">
        <i />
        {t(d.watch && c === 1 ? '太阳在焦点，十字是椭圆中心' : '发光点是固定焦点')}
      </div>
      {showSectors ? (
        <div className="kepler-area-pair">
          <div>
            <i />
            {t(d.watch ? '近拱点扇形' : '时段 A')}
            <strong>{(sweepNear.fraction * 100).toFixed(1)}%</strong>
          </div>
          <div>
            <i />
            {t(d.watch ? '远拱点扇形' : '时段 B')}
            <strong>{(sweepFar.fraction * 100).toFixed(1)}%</strong>
          </div>
          <p>
            {t('各占该椭圆面积')} · Δt = {sweepNear.duration.toFixed(3)} {t('年')}
          </p>
        </div>
      ) : c === 5 && d.watch ? (
        <div className="kepler-periods">
          <span>
            a = 1 AU<b>T = 1 {t('年')}</b>
          </span>
          <span>
            a = 1.6 AU
            <b>
              T = {period.toFixed(2)} {t('年')}
            </b>
          </span>
          <p>
            {t('相同经过时间')}：{(2 * p).toFixed(2)} {t('年')}
          </p>
        </div>
      ) : (
        <div className="kepler-speed">
          <span>
            {t('距离焦点')}
            <b>{q.radius.toFixed(2)} AU</b>
          </span>
          <span>
            {t('速度 / 同轨道圆速')}
            <b>{q.relativeSpeed.toFixed(2)} ×</b>
          </span>
        </div>
      )}
      <p className="kepler-evidence" hidden={d.watch}>
        {t(
          c === 0 && d.watch
            ? '圆轨道上，等时间也对应等角度。'
            : c === 1 && d.watch
              ? '焦点偏离中心；半径随位置改变。'
              : c === 2 && d.watch
                ? '靠近焦点时快，远离焦点时慢。'
                : c === 5 && d.watch
                  ? '轨道放大到 1.6 倍，周期变为约 2.02 倍。'
                  : '等时面积相等，扇形的形状却不必一样。',
        )}
      </p>
      {!d.watch && (
        <div className="kepler-controls">
          <label htmlFor={`${id}-e`}>
            {t('偏心率')} · {eccentricity.toFixed(2)}
          </label>
          <input
            id={`${id}-e`}
            type="range"
            min="0"
            max="0.85"
            step="0.01"
            value={eccentricity}
            onChange={(ev) => setEccentricity(+ev.target.value)}
          />
          <label htmlFor={`${id}-a`}>
            {t('半长轴')} · {a.toFixed(1)} AU
          </label>
          <input
            id={`${id}-a`}
            type="range"
            min="0.6"
            max="1.8"
            step="0.1"
            value={a}
            onChange={(ev) => setA(+ev.target.value)}
          />
          <label htmlFor={`${id}-t`}>
            {t('从近拱点经过')} · {elapsed.toFixed(2)} {t('年')}
          </label>
          <input
            id={`${id}-t`}
            type="range"
            min="0"
            max="4"
            step="0.01"
            value={elapsed}
            onChange={(ev) => setElapsed(+ev.target.value)}
          />
          <button aria-pressed={sectors} onClick={() => setSectors(!sectors)}>
            {t(sectors ? '隐藏等时扇形' : '比较等时扇形')}
          </button>
          <p>
            T = {period.toFixed(3)} {t('年')} · a³ = T²
          </p>
        </div>
      )}
      <details>
        <summary>{t('理想两体模型')}</summary>
        <p>
          {t(
            '中心固定、天体视为质点；采用太阳单位标度。忽略其他天体、相对论与恒星反冲，不是现实天体的星历。面积沿实际椭圆弧积分，不以两个端点组成的三角形代替。',
          )}
        </p>
      </details>
    </section>
  );
}
