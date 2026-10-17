import { useId, useState } from 'react';
import { t } from '../../i18n';
import { lunarEclipse } from '../../models/lunar-eclipse';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/lunar-eclipse.css';
export default function LunarEclipse() {
  const d = useShowcase(),
    id = useId().replace(/:/g, ''),
    [node, setNode] = useState(8),
    [inclination, setInclination] = useState(5.145),
    [distance, setDistance] = useState(384400),
    [atmosphere, setAtmosphere] = useState(false),
    c = d.watch ? Math.min(6, d.chapter) : 4,
    p = d.watch ? d.chapterProgress : 1;
  const angle = d.watch
      ? c < 2
        ? 35
        : c === 2
          ? 35 * (1 - Math.min(1, p / 0.65))
          : c === 5
            ? 0
            : c === 3
              ? 14
              : 8
      : node,
    tilt = d.watch ? (c === 1 ? 0 : 5.145) : inclination,
    range = d.watch ? (c === 6 ? (p < 0.5 ? 356500 : 405500) : 384400) : distance,
    q = lunarEclipse(angle, tilt, range),
    wide = !d.watch || c === 0 || c === 2,
    extent = wide ? 35000 : 11000,
    scale = 95 / extent,
    mx = 125,
    my = 120 - q.offset * scale,
    localScale = 45 / q.moonRadius,
    shade = d.watch
      ? c === 5
        ? Math.max(0, Math.min(1, (p - 0.3) / 0.4))
        : 0
      : atmosphere
        ? 1
        : 0;
  const umbraColor = `rgb(${Math.round(57 + shade * 81)},${Math.round(65 + shade * 21)},${Math.round(76 + shade * 2)})`,
    kind =
      q.kind === 'none'
        ? t('无月食')
        : q.kind === 'penumbral'
          ? t('半影月食')
          : q.kind === 'partial'
            ? t('月偏食')
            : t('月全食');
  return (
    <section
      className="lunar-study"
      data-watch={d.watch}
      aria-label={t('月食交点、影区与月面局部实验')}
    >
      <header>
        <span>LUNAR ECLIPSE / SHADOW</span>
        <b>
          i = {tilt}° · F = {Number(angle.toFixed(1))}°
        </b>
      </header>
      <div className="lunar-shadow">
        <svg viewBox="0 0 360 240" aria-hidden="true">
          <defs>
            <clipPath id={`${id}-moon`}>
              <circle cx="300" cy="145" r="45" />
            </clipPath>
          </defs>
          <circle className="lunar-penumbra" cx="125" cy="120" r={q.penumbra * scale} />
          <circle className="lunar-umbra" cx="125" cy="120" r={q.umbra * scale} />
          <path className="lunar-axis" d="M15 120H235M125 15V225" />
          <circle className="lunar-cross-moon" cx={mx} cy={my} r={q.moonRadius * scale} />
          <path className="lunar-zoom-link" d={`M${mx + q.moonRadius * scale} ${my}L255 145`} />
          <circle className="lunar-local-base" cx="300" cy="145" r="45" />
          <g clipPath={`url(#${id}-moon)`}>
            <circle
              cx="300"
              cy={145 + q.offset * localScale}
              r={q.penumbra * localScale}
              fill="#77777c"
              opacity=".24"
            />
            <circle
              cx="300"
              cy={145 + q.offset * localScale}
              r={q.umbra * localScale}
              fill={umbraColor}
            />
            <circle className="lunar-crater" cx="282" cy="131" r="7" />
            <circle className="lunar-crater" cx="313" cy="156" r="10" />
            <circle className="lunar-crater" cx="303" cy="124" r="4" />
          </g>
          <circle className="lunar-local-rim" cx="300" cy="145" r="45" />
        </svg>
        <b className="lunar-section-label">{t('影子截面')}</b>
        <span className="lunar-local-label">{t('月面局部')}</span>
      </div>
      <p className="lunar-scale-note">{t(wide ? '固定远景比例' : '固定近景比例')}</p>
      <div className="lunar-key">
        <span>{t('半影')}</span>
        <span>{t('本影')}</span>
        <span>{t('月球投影')}</span>
      </div>
      <div className="lunar-readout">
        <span>
          {kind}
          <b>{Math.round(range).toLocaleString('en-US')} km</b>
        </span>
        <span>
          {t('投影进入本影')}
          <b>{(q.umbraFraction * 100).toFixed(1)}%</b>
        </span>
      </div>
      {(c === 5 || !d.watch) && (
        <p className="lunar-light-note">
          {shade > 0 ? t('红色为大气余光示意，非亮度预测。') : t('月面明暗为示意，非亮度预测。')}
        </p>
      )}
      {!d.watch && (
        <div className="lunar-controls">
          <label htmlFor={`${id}-f`}>
            {t('满月距交点角 F')} · {node}°
            <input
              id={`${id}-f`}
              type="range"
              min="0"
              max="40"
              step=".1"
              value={node}
              onChange={(e) => setNode(+e.target.value)}
            />
          </label>
          <label htmlFor={`${id}-i`}>
            {t('轨道倾角 i')} · {inclination}°
            <input
              id={`${id}-i`}
              type="range"
              min="0"
              max="7"
              step=".001"
              value={inclination}
              onChange={(e) => setInclination(+e.target.value)}
            />
          </label>
          <label htmlFor={`${id}-d`}>
            {t('月地距离 km')} · {distance}
            <input
              id={`${id}-d`}
              type="range"
              min="356500"
              max="405500"
              step="500"
              value={distance}
              onChange={(e) => setDistance(+e.target.value)}
            />
          </label>
          <button aria-pressed={atmosphere} onClick={() => setAtmosphere(!atmosphere)}>
            {t('切换大气余光示意')}
          </button>
        </div>
      )}
      <details>
        <summary>{t('满月不等于月食；几何不等于亮度')}</summary>
        <p>
          {t(
            '在满月几何下扫描交点角，β=asin(sin i·sin F)，月心偏离影轴为 D sin β。用近轴相似三角形求地球本影/半影锥截面，与月球圆投影求交；百分比是投影面积，不是亮度。远景与近景使用固定比例，每章内不随月球位置改变。自由探索保留固定远景，局部月面单独放大。忽略大气增大影半径、折射光谱、地形、岁差与真实历表，不预测食的日期或持续时间。红色仅定性说明地球大气可把余光折射入本影，不是完全无光，也不是固定红色或辐射传输计算。',
          )}
        </p>
      </details>
    </section>
  );
}
