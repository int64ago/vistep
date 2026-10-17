import { useId, useState } from 'react';
import { t } from '../../i18n';
import { cltDistribution, cltNormalDensity } from '../../models/central-limit-theorem';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/central-limit-theorem.css';
const num = (v: number) => Number(v.toFixed(3)).toString();
export default function CentralLimitTheorem() {
  const d = useShowcase(),
    id = useId(),
    [size, setSize] = useState(8),
    [chance, setChance] = useState(0.5),
    [copied, setCopied] = useState(false),
    [axis, setAxis] = useState<'sum' | 'standard' | 'mean'>('standard');
  const c = d.watch ? Math.min(6, d.chapter) : 3,
    progress = d.watch ? d.chapterProgress : 1;
  const n = d.watch
    ? c === 0
      ? 1
      : c === 1
        ? 2
        : c === 2 || c === 5
          ? 8
          : c === 4 && progress < 0.5
            ? 8
            : 32
    : size;
  const p = d.watch ? (c === 5 ? 0.05 : 0.5) : chance,
    dependence = d.watch ? c === 6 : copied;
  const q = cltDistribution(n, p, dependence),
    mode = d.watch ? (c === 3 || c === 5 ? 'standard' : c === 4 ? 'mean' : 'sum') : axis;
  const kind = mode === 'standard' && q.sigma === 0 ? 'sum' : mode;
  const delta = kind === 'standard' ? 1 / q.sigma : kind === 'mean' ? 1 / n : 1;
  const xValue = (k: number) =>
    kind === 'standard' ? (k - q.mean) / q.sigma : kind === 'mean' ? k / n : k;
  const low = Math.min(kind === 'standard' ? -4 : -delta / 2, xValue(0) - delta / 2),
    high = Math.max(kind === 'standard' ? 4 : xValue(n) + delta / 2, xValue(n) + delta / 2);
  const x = (v: number) => 8 + ((v - low) / (high - low)) * 344;
  const center = kind === 'standard' ? 0 : kind === 'mean' ? p : q.mean,
    spread = kind === 'standard' ? 1 : kind === 'mean' ? q.sigma / n : q.sigma;
  const normal = Array.from({ length: 100 }, (_, i) => {
    const value = low + ((high - low) * i) / 99;
    return { x: value, y: spread > 0 ? cltNormalDensity((value - center) / spread) / spread : 0 };
  });
  const showNormal = !dependence && q.sigma > 0 && (c >= 2 || !d.watch);
  const top =
    Math.max(
      ...q.items.map((v) => v.probability / delta),
      ...(showNormal ? normal.map((v) => v.y) : [0]),
    ) * 1.12;
  const y = (v: number) => 194 - (v / top) * 174;
  return (
    <section className="clt-study" data-watch={d.watch} aria-label={t('中央极限定理与前提实验')}>
      <header>
        <span>SUMS / LIMITS</span>
        <b>
          N = {n} · p = {p}
        </b>
      </header>
      <div className="clt-plot" role="img" aria-label={t('精确和分布与正态近似')}>
        <svg viewBox="0 0 360 210" preserveAspectRatio="none">
          <path className="clt-baseline" d="M8 194H352" />
          {q.items
            .filter((v) => v.probability > 0)
            .map((v) => (
              <rect
                key={v.k}
                x={x(xValue(v.k) - delta / 2)}
                y={y(v.probability / delta)}
                width={x(low + delta) - x(low)}
                height={194 - y(v.probability / delta)}
                stroke="#e8e5ef"
                strokeWidth="0.8"
              />
            ))}
          {showNormal && (
            <path
              className="clt-normal"
              d={normal.map((v, i) => `${i ? 'L' : 'M'}${x(v.x)} ${y(v.y)}`).join(' ')}
            />
          )}
        </svg>
        <div className="clt-ticks">
          <span>{num(low)}</span>
          <span style={{ left: `${(x(center) / 360) * 100}%` }}>{num(center)}</span>
          <span>{num(high)}</span>
        </div>
      </div>
      <p className="clt-axis">
        {kind === 'standard'
          ? t('标准化的和 z = (S−Np)/σS')
          : kind === 'mean'
            ? t('样本均值 S/N')
            : t('成功次数 S')}
      </p>
      <div className="clt-legend">
        <span>{t('精确分布')}</span>
        {showNormal && <span>{t('正态近似')}</span>}
      </div>
      {d.watch && c === 1 ? (
        <div className="clt-pairs">
          <span>00 · ¼</span>
          <b>01 + 10 · ½</b>
          <span>11 · ¼</span>
        </div>
      ) : (
        <div className="clt-moments">
          <span>
            {t('和的均值')}
            <b>{num(q.mean)}</b>
          </span>
          <span>
            {t('和的方差')}
            <b>{num(q.variance)}</b>
          </span>
        </div>
      )}
      {c === 4 && (
        <p className="clt-note">
          {t('均值的标准差')} = {num(Math.sqrt(q.meanVariance))}
        </p>
      )}
      {c === 5 && <p className="clt-note">P(S=0) = {(q.items[0].probability * 100).toFixed(1)}%</p>}
      {dependence && <p className="clt-note">{t('同一次 0/1 结果复制 N 份，只剩 0 与 N。')}</p>}
      {mode === 'standard' && q.sigma === 0 && (
        <p className="clt-note">{t('方差为零，不能做标准化除法。')}</p>
      )}
      {!d.watch && (
        <div className="clt-controls">
          <label htmlFor={`${id}-n`}>
            {t('相加次数')} · {size}
          </label>
          <input
            id={`${id}-n`}
            type="range"
            min="1"
            max="64"
            value={size}
            onChange={(e) => setSize(+e.target.value)}
          />
          <label htmlFor={`${id}-p`}>
            {t('单次成功概率')} · {chance}
          </label>
          <input
            id={`${id}-p`}
            type="range"
            min="0"
            max="1"
            step=".05"
            value={chance}
            onChange={(e) => setChance(+e.target.value)}
          />
          <label htmlFor={`${id}-axis`}>{t('横轴')}</label>
          <select
            id={`${id}-axis`}
            value={axis}
            onChange={(e) => setAxis(e.target.value as typeof axis)}
          >
            <option value="sum">{t('成功次数 S')}</option>
            <option value="standard">{t('标准化的和')}</option>
            <option value="mean">{t('样本均值 S/N')}</option>
          </select>
          <button aria-pressed={copied} onClick={() => setCopied(!copied)}>
            {t('把独立抽样改成复制同一次结果')}
          </button>
        </div>
      )}
      <details>
        <summary>{t('近似的是标准化的和，不是任意原始数据')}</summary>
        <p>
          {t(
            '本片用独立同分布 0/1 变量的精确卷积。p 固定且 0<p<1，随 N 增大，(S−Np)/√(Np(1−p)) 的分布趋近标准正态；有限 N 仍离散。柱高按横轴格宽换算，柱面积才是概率；曲线是近似密度而非每个点的概率。小成功概率可能需更大 N。完全相关的复制不满足独立前提，均值方差不会按 1/N 减少。零方差不能标准化。',
          )}
        </p>
      </details>
    </section>
  );
}
