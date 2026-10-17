import { useId, useState } from 'react';
import { t } from '../../i18n';
import { pcaData, pcaFit, pcaProject } from '../../models/principal-components';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/principal-components.css';
const fmt = (v: number) => String(Math.round(v * 1000) / 1000);
export default function PrincipalComponents() {
  const d = useShowcase(),
    id = useId(),
    [angle, setAngle] = useState(30),
    [scaleX, setScaleX] = useState(1),
    [isotropic, setIsotropic] = useState(false);
  const c = d.watch ? Math.min(6, d.chapter) : 4,
    p = d.watch ? d.chapterProgress : 1,
    sx = d.watch ? (c === 5 && p >= 0.35 ? 10 : 1) : scaleX,
    fit = pcaFit(pcaData(d.watch ? c === 6 : isotropic), sx),
    theta = d.watch
      ? c === 2
        ? 0
        : c === 3
          ? fit.angle * Math.min(1, p / 0.45)
          : c === 6
            ? p * Math.PI
            : fit.angle
      : (angle * Math.PI) / 180,
    projection = pcaProject(fit, theta),
    raw = d.watch && c < 2,
    amount = c === 1 ? Math.min(1, p / 0.6) : 0,
    bound = Math.max(
      2,
      Math.ceil(Math.max(...fit.centered.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)])) * 1.15),
    ),
    factor = 106 / bound,
    toPlot = (x: number, y: number) =>
      raw
        ? { x: 112.75 + x * 27.5, y: 181.25 - y * 27.5 }
        : { x: 180 + x * factor, y: 140 - y * factor },
    origin = toPlot(0, 0),
    points = raw
      ? fit.data.map((point) => ({
          x: point.x - amount * fit.mean.x,
          y: point.y - amount * fit.mean.y,
        }))
      : fit.centered,
    mean = toPlot(fit.mean.x * (1 - amount), fit.mean.y * (1 - amount)),
    a = toPlot(-projection.direction.x * bound * 1.4, -projection.direction.y * bound * 1.4),
    b = toPlot(projection.direction.x * bound * 1.4, projection.direction.y * bound * 1.4),
    ratio = fit.total > 0 ? projection.variance / fit.total : null;
  return (
    <section
      className="pca-study"
      data-watch={d.watch}
      aria-label={t('主成分的方差保留与重建实验')}
    >
      <header>
        <span>PCA / PROJECTION</span>
        <b>{raw ? `${fit.data.length} ${t('个点')}` : `θ = ${fmt((theta * 180) / Math.PI)}°`}</b>
      </header>
      <svg viewBox="0 0 360 280" role="img" aria-label={t('原始点、正交投影与重建残差')}>
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x="16" y="16" width="328" height="248" rx="16" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          <path d={`M16 ${origin.y}H344M${origin.x} 16V264`} className="pca-axes" />
          {!raw && <path d={`M${a.x} ${a.y}L${b.x} ${b.y}`} className="pca-direction" />}
          {!raw &&
            projection.items.map((item) => {
              const from = toPlot(item.point.x, item.point.y),
                to = toPlot(item.reconstruction.x, item.reconstruction.y);
              return (
                <g key={item.index}>
                  <path d={`M${from.x} ${from.y}L${to.x} ${to.y}`} className="pca-residual" />
                  <circle cx={to.x} cy={to.y} r="5" className="pca-projected" />
                </g>
              );
            })}
          {points.map((point, i) => {
            const pos = toPlot(point.x, point.y);
            return <circle key={i} cx={pos.x} cy={pos.y} r="5" className="pca-observation" />;
          })}
          {raw && (
            <g>
              <path
                d={`M${mean.x - 9} ${mean.y}h18M${mean.x} ${mean.y - 9}v18`}
                className="pca-centroid"
              />
              <text x={mean.x + 12} y={mean.y - 12}>
                μ
              </text>
            </g>
          )}
        </g>
        {!raw && (
          <>
            <text x="286" y="165" textAnchor="middle">
              {bound}
            </text>
            <text x="74" y="165" textAnchor="middle">
              −{bound}
            </text>
          </>
        )}
      </svg>
      {raw ? (
        <p className="pca-mean">
          μ = ({fmt(fit.mean.x * (1 - amount))}, {fmt(fit.mean.y * (1 - amount))})
        </p>
      ) : (
        <div className="pca-variance">
          <div>
            <span>{t('保留方差')}</span>
            <b>{fmt(projection.variance)}</b>
          </div>
          <div>
            <span>{t('重建误差')}</span>
            <b>{fmt(projection.error)}</b>
          </div>
          <div>
            <span>{t('保留比例')}</span>
            <b>{ratio === null ? '—' : `${fmt(ratio * 100)}%`}</b>
          </div>
        </div>
      )}
      {d.watch && c === 4 && (
        <div className="pca-scores" aria-label={t('一维投影坐标')}>
          {projection.items.map((item) => (
            <div key={item.index}>
              <span>#{item.index + 1}</span>
              <b>{fmt(item.score)}</b>
            </div>
          ))}
        </div>
      )}
      {d.watch && c === 5 && (
        <p className="pca-caution">
          x × {sx} · {t('单位改变，协方差度量也改变。')}
        </p>
      )}
      {fit.degenerate && <p className="pca-caution">{t('两个方向方差相同，第一方向不唯一。')}</p>}
      {!d.watch && (
        <div className="pca-controls">
          <label htmlFor={`${id}-angle`}>
            {t('投影轴角度')} · {angle}°
          </label>
          <input
            id={`${id}-angle`}
            type="range"
            min="0"
            max="180"
            value={angle}
            onChange={(e) => setAngle(+e.target.value)}
          />
          <button
            disabled={fit.degenerate}
            onClick={() => setAngle(((fit.angle * 180) / Math.PI + 180) % 180)}
          >
            {t('对齐第一主成分')}
          </button>
          <label htmlFor={`${id}-scale`}>
            {t('x 单位倍率')} · {scaleX}
          </label>
          <input
            id={`${id}-scale`}
            type="range"
            min="1"
            max="10"
            value={scaleX}
            onChange={(e) => {
              const next = +e.target.value;
              setScaleX(next);
              setAngle(((pcaFit(pcaData(isotropic), next).angle * 180) / Math.PI + 180) % 180);
            }}
          />
          <label>
            <input
              type="checkbox"
              checked={isotropic}
              onChange={(e) => {
                setIsotropic(e.target.checked);
                setScaleX(1);
                setAngle(0);
              }}
            />
            {t('改用各方向等方差数据')}
          </label>
        </div>
      )}
      <details>
        <summary>{t('保留变化，不代表找到因果')}</summary>
        <p>
          {t(
            '先按列减均值，再寻找最大投影方差的单位方向；同一条件也最小化正交平方重建误差。这里协方差与误差均除以点数 n。坐标单位会改变度量，符号反向是等价主轴；重复特征值使方向不唯一。PCA 不自动识别因果或最适合预测的特征。',
          )}
        </p>
      </details>
    </section>
  );
}
