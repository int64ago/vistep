import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import {
  monteSample,
  monteStandardError,
  monteSummary,
  type MonteSample,
} from '../../models/monte-carlo';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/monte-carlo.css';

function AreaCloud({ sample, count }: { sample: MonteSample; count: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 600, 600);
    ctx.fillStyle = '#dce5d9';
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.lineTo(600, 600);
    ctx.arc(0, 600, 600, 0, -Math.PI / 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5d775a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 600, 600, 0, -Math.PI / 2, true);
    ctx.stroke();
    for (let i = 0; i < count; i++) {
      const point = sample.points[i];
      ctx.fillStyle = point.hit ? '#5d775a' : '#b17c67';
      ctx.beginPath();
      ctx.arc(600 * point.x, 600 * (1 - point.y), count < 64 ? 7 : 3.2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [sample, count]);
  return (
    <div className="monte-square">
      <canvas
        ref={ref}
        width="600"
        height="600"
        role="img"
        aria-label={t('单位正方形内的样本点与四分之一圆边界')}
      >
        {t('命中数量与估计值显示在图形下方。')}
      </canvas>
      <span>x²+y² ≤ 1</span>
      <i>0</i>
      <b>1</b>
    </div>
  );
}

const round = (v: number | null) => (v === null ? '—' : v.toFixed(3));
export default function MonteCarlo() {
  const d = useShowcase(),
    id = useId(),
    [seed, setSeed] = useState(7),
    [count, setCount] = useState(256),
    [biased, setBiased] = useState(false);
  const c = d.watch ? Math.min(6, d.chapter) : 2,
    p = d.watch ? d.chapterProgress : 1;
  const mode = d.watch ? (c === 5 ? 'biased' : 'uniform') : biased ? 'biased' : 'uniform';
  const sample = useMemo(() => monteSample(4096, d.watch ? 7 : seed, mode), [d.watch, seed, mode]);
  const n = d.watch
    ? c === 0
      ? 8
      : c === 1
        ? Math.min(32, 1 + Math.floor(p * 32))
        : c === 2
          ? Math.min(1024, 32 + Math.floor(Math.min(1, p / 0.75) * 992))
          : c === 3
            ? 256
            : c === 6
              ? p < 0.35
                ? 0
                : 1
              : 4096
    : count;
  const q = monteSummary(sample, n),
    uniform = useMemo(() => monteSample(4096, 7), []);
  const replicas = useMemo(
    () => [2, 4, 7, 9].map((value) => ({ seed: value, sample: monteSample(4096, value) })),
    [],
  );
  const comparison = [1024, 4096].map((value) => ({ count: value, se: monteStandardError(value) }));
  const traceLength = Math.max(0, Math.min(96, n - 15));
  const trace = Array.from({ length: traceLength }, (_, i) => {
    const k = Math.max(16, Math.round(16 + ((n - 16) * i) / Math.max(1, traceLength - 1)));
    return { count: k, value: monteSummary(sample, k).estimate! };
  });
  const low = Math.min(2.5, ...trace.map((v) => v.value)),
    high = Math.max(3.6, ...trace.map((v) => v.value));
  const traceY = (v: number) => 66 - ((v - low) / (high - low)) * 58;
  return (
    <section
      className="monte-study"
      data-watch={d.watch}
      data-shot={c}
      aria-label={t('蒙特卡洛面积与抽样偏差实验')}
    >
      <header>
        <span>MONTE CARLO / AREA</span>
        <b>{mode === 'biased' ? t('非均匀抽样：x = u²') : t('均匀抽样：x = u')}</b>
      </header>
      {d.watch && c === 3 ? (
        <div className="monte-replicas">
          <p>
            {t('相同样本量，不同固定种子')} · N = {n}
          </p>
          {replicas.map((r) => {
            const result = monteSummary(r.sample, n);
            return (
              <div key={r.seed}>
                <span>
                  {t('种子')} {r.seed}
                </span>
                <b>{round(result.estimate)}</b>
                <i style={{ width: `${(result.estimate! / 4) * 100}%` }} />
              </div>
            );
          })}
          <p>π ≈ 3.142</p>
        </div>
      ) : (
        <AreaCloud sample={sample} count={n} />
      )}
      {!(d.watch && c === 3) && (
        <div className="monte-results">
          <span>
            {t('命中')}{' '}
            <b>
              {q.hits}/{n}
            </b>
          </span>
          {(c > 0 || !d.watch) && (
            <span>
              4 × {t('命中')}/N <strong>{round(q.estimate)}</strong>
            </span>
          )}
        </div>
      )}
      {(c > 0 || !d.watch) && !(d.watch && c === 3) && (
        <p className="monte-reference">{t('已知基准')} π ≈ 3.142</p>
      )}
      {d.watch && c === 0 && (
        <p className="monte-reference">{t('均匀时，命中比例估计面积比例。')}</p>
      )}
      {(c === 2 || !d.watch) && n >= 16 && (
        <div className="monte-trace" role="img" aria-label={t('前缀估计曲线并不单调接近基准')}>
          <svg viewBox="0 0 360 74" preserveAspectRatio="none">
            <path className="monte-true" d={`M0 ${traceY(Math.PI)}H360`} />
            <path
              d={trace
                .map(
                  (v, i) =>
                    `${i ? 'L' : 'M'}${(i / Math.max(1, trace.length - 1)) * 360} ${traceY(v.value)}`,
                )
                .join(' ')}
            />
          </svg>
          <span>N = 16 → {n}</span>
        </div>
      )}
      {(c === 4 || c === 6 || !d.watch) && (
        <p className="monte-interval">
          {q.interval ? (
            <>
              {t('95% Wilson 区间')}
              <b>
                {round(q.interval[0])} – {round(q.interval[1])}
              </b>
            </>
          ) : n === 0 ? (
            t('N = 0，估计与区间未定义。')
          ) : (
            t('非均匀时，不把区间解释为 π 的区间。')
          )}
        </p>
      )}
      {d.watch && c === 4 && (
        <div className="monte-errors">
          {comparison.map((v) => (
            <div key={v.count}>
              <span>N = {v.count}</span>
              <b>SE ≈ {round(v.se)}</b>
            </div>
          ))}
        </div>
      )}
      {d.watch && c === 5 && (
        <div className="monte-bias">
          <span>
            {t('同种子均匀对照')}
            <b>{round(monteSummary(uniform, n).estimate)}</b>
          </span>
          <span>
            {t('x = u² 的错误面积估计')}
            <b>{round(q.estimate)}</b>
          </span>
        </div>
      )}
      {!d.watch && (
        <div className="monte-controls">
          <label htmlFor={`${id}-n`}>
            {t('样本量')} · {count}
          </label>
          <input
            id={`${id}-n`}
            type="range"
            min="0"
            max="4096"
            step="1"
            value={count}
            onChange={(e) => setCount(+e.target.value)}
          />
          <label htmlFor={`${id}-seed`}>
            {t('种子')} · {seed}
          </label>
          <input
            id={`${id}-seed`}
            type="range"
            min="1"
            max="9"
            value={seed}
            onChange={(e) => setSeed(+e.target.value)}
          />
          <button aria-pressed={biased} onClick={() => setBiased(!biased)}>
            {t('切换非均匀抽样 x = u²')}
          </button>
        </div>
      )}
      <details>
        <summary>{t('随机误差与抽样偏差要分开')}</summary>
        <p>
          {t(
            '单位正方形内独立均匀抽样时，命中四分之一圆的概率为 π/4；4×命中/N 估计 π。区间为命中比例的名义 95% Wilson 区间再乘四，不保证每次覆盖，也不是 π 随机变化的概率。SE 使用已知 π 的理论基准，按 1/√N 缩小。x=u² 会偏向左侧，未经加权的同一公式不再估计均匀面积。固定伪随机种子只为复现，不用于安全或认证随机性。',
          )}
        </p>
      </details>
    </section>
  );
}
