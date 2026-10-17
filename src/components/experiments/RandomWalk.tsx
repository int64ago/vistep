import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { walkDistribution, walkPath } from '../../models/random-walk';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/random-walk.css';
const short = (x: number) => Number(x.toFixed(3)).toString();
export default function RandomWalk() {
  const d = useShowcase(),
    id = useId(),
    [steps, setSteps] = useState(32),
    [right, setRight] = useState(0.5),
    [seed, setSeed] = useState(7),
    [absorbing, setAbsorbing] = useState(false);
  const c = d.watch ? Math.min(6, d.chapter) : 2,
    progress = d.watch ? d.chapterProgress : 1;
  const n = d.watch
    ? c === 0
      ? 6
      : c === 1
        ? Math.min(32, 1 + Math.floor(progress * 32))
        : c === 3
          ? progress < 0.5
            ? 16
            : 64
          : c === 5
            ? progress < 0.5
              ? 31
              : 32
            : c === 6
              ? 64
              : 32
    : steps;
  const p = d.watch ? (c === 4 ? 0.7 : 0.5) : right,
    boundary = d.watch ? (c === 6 ? 4 : null) : absorbing ? 4 : null;
  const q = useMemo(() => walkDistribution(n, p, boundary), [n, p, boundary]);
  const path = useMemo(
    () => walkPath(64, p, d.watch ? 7 : seed, boundary),
    [p, d.watch, seed, boundary],
  );
  const samples = useMemo(
    () => [2, d.watch ? 7 : seed, 9].map((value) => walkPath(64, p, value, boundary)),
    [p, boundary, d.watch, seed],
  );
  const range = boundary ?? (d.watch && c === 3 ? 64 : Math.max(1, n)),
    x = (v: number) => 16 + ((v + range) / (2 * range)) * 328;
  const peak = Math.max(...q.items.map((v) => v.probability)) * 1.15;
  const pathRange = Math.max(2, ...path.positions.slice(0, 33).map(Math.abs));
  const pathY = (v: number) => 100 - (v / pathRange) * 78;
  return (
    <section className="walk-study" data-watch={d.watch} aria-label={t('随机游走的轨迹与分布实验')}>
      <header>
        <span>RANDOM WALK / ±1</span>
        <b>
          N = {n} · P(+1) = {p}
        </b>
      </header>
      {d.watch && c === 0 ? (
        <div className="walk-steps">
          <p>{t('每步只走一格，独立决定左或右。')}</p>
          <div>
            {path.moves.slice(0, 6).map((move, i) => (
              <span key={i}>
                <b>{move > 0 ? '+1' : '−1'}</b>
                <i>{path.positions[i + 1]}</i>
              </span>
            ))}
          </div>
        </div>
      ) : d.watch && c === 1 ? (
        <div className="walk-time" role="img" aria-label={t('一条轨迹，横轴为步数，纵轴为位置')}>
          <svg viewBox="0 0 360 200" preserveAspectRatio="none">
            <path className="walk-zero" d={`M12 ${pathY(0)}H348`} />
            <path
              className="walk-thread"
              d={path.positions
                .slice(0, n + 1)
                .map((v, i) => `${i ? 'L' : 'M'}${12 + (i / 32) * 336} ${pathY(v)}`)
                .join(' ')}
            />
            <circle cx={12 + (n / 32) * 336} cy={pathY(path.positions[n])} r="5" />
          </svg>
          <div>
            <span>{t('步数')} 0 → 32</span>
            <b>x = {path.positions[n]}</b>
          </div>
        </div>
      ) : (
        <div className="walk-density" role="img" aria-label={t('终点位置的精确概率分布')}>
          <svg viewBox="0 0 360 200" preserveAspectRatio="none">
            <path className="walk-zero" d="M16 176H344" />
            <path className="walk-origin" d={`M${x(0)} 15V176`} />
            <path className="walk-center" d={`M${x(q.mean)} 15V176`} />
            {q.items
              .filter((v) => v.probability > 0)
              .map((v) => (
                <rect
                  key={v.x}
                  x={x(v.x) - Math.min(10, 150 / range)}
                  y={176 - (v.probability / peak) * 150}
                  width={Math.min(20, 300 / range)}
                  height={(v.probability / peak) * 150}
                  rx="2"
                />
              ))}
            {(c === 2 || !d.watch) &&
              samples.map((s, i) => <circle key={i} cx={x(s.positions[n])} cy={188} r="4" />)}
          </svg>
          <div>
            <span>−{range}</span>
            <span>0</span>
            <span>+{range}</span>
          </div>
          <p>{t('终点位置 x')}</p>
        </div>
      )}
      {(c > 0 || !d.watch) && (
        <div className="walk-moments">
          <span>
            {t('均值')}
            <b>{short(q.mean)}</b>
          </span>
          <span>
            RMS<b>{short(q.rms)}</b>
          </span>
          <span>
            {t('标准差')}
            <b>{short(Math.sqrt(q.variance))}</b>
          </span>
        </div>
      )}
      {d.watch && c === 0 && <p className="walk-note">{t('下行是每步结束的位置。')}</p>}
      {c === 2 && <p className="walk-note">{t('柱是总体概率；金点只是三条样本末点。')}</p>}
      {c === 5 && <p className="walk-note">P(x=0) = {(q.returnProbability * 100).toFixed(1)}%</p>}
      {boundary !== null && (
        <p className="walk-note">
          {t('已在 ±4 吸收')} · {(q.absorbed * 100).toFixed(1)}%
        </p>
      )}
      {!d.watch && (
        <div className="walk-controls">
          <label htmlFor={`${id}-n`}>
            {t('步数')} · {steps}
          </label>
          <input
            id={`${id}-n`}
            type="range"
            min="0"
            max="64"
            value={steps}
            onChange={(e) => setSteps(+e.target.value)}
          />
          <label htmlFor={`${id}-p`}>P(+1) · {right}</label>
          <input
            id={`${id}-p`}
            type="range"
            min="0"
            max="1"
            step=".1"
            value={right}
            onChange={(e) => setRight(+e.target.value)}
          />
          <label htmlFor={`${id}-seed`}>
            {t('轨迹种子')} · {seed}
          </label>
          <input
            id={`${id}-seed`}
            type="range"
            min="1"
            max="9"
            value={seed}
            onChange={(e) => setSeed(+e.target.value)}
          />
          <button aria-pressed={absorbing} onClick={() => setAbsorbing(!absorbing)}>
            {t('切换 ±4 吸收边界')}
          </button>
        </div>
      )}
      <details>
        <summary>{t('均值为零，不是每条路都回到零')}</summary>
        <p>
          {t(
            '无限一维格点，每个独立步为 ±1。无边界时 E[x]=N(2p−1)、Var(x)=4Np(1−p)。公平时 RMS=√N；它是均方根，不是平均绝对位移，也不限制每条路径。偏置时 RMS 还包含均值漂移，不能当作围绕均值的标准差。吸收边界一旦触及就停留，仍保留概率质量；其后不再沿用无限格点公式。固定种子只为复现样本，总体分布由精确转移计算。',
          )}
        </p>
      </details>
    </section>
  );
}
