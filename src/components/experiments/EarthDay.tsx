import { useId, useState } from 'react';
import { t } from '../../i18n';
import { earthDayClock, earthDayModel, earthDayState } from '../../models/earth-day';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/earth-day.css';
const deg = (angle: number) => Number(((angle * 180) / Math.PI).toFixed(2));
export default function EarthDay() {
  const d = useShowcase(),
    id = useId().replace(/:/g, ''),
    [year, setYear] = useState(12),
    [hours, setHours] = useState(22),
    [orbit, setOrbit] = useState(true),
    [retro, setRetro] = useState(false),
    c = d.watch ? Math.min(5, d.chapter) : 1,
    p = d.watch ? d.chapterProgress : 1;
  const y = d.watch ? (c === 4 ? 365.256 : 12) : year,
    o = d.watch ? c !== 3 : orbit,
    backward = d.watch ? c === 5 : retro,
    m = earthDayModel(y, o, backward),
    now = d.watch
      ? c === 0
        ? 0
        : c === 1
          ? m.siderealHours * Math.min(1, p / 0.65)
          : c === 2
            ? m.siderealHours + (m.solarHours - m.siderealHours) * Math.min(1, p / 0.55)
            : c === 3
              ? m.siderealHours
              : c === 4
                ? p < 0.5
                  ? m.siderealHours
                  : m.solarHours
                : m.solarHours * Math.min(1, p / 0.65)
      : hours;
  const q = earthDayState(now, y, o, backward),
    point = (angle: number, radius: number) => ({
      x: 180 + radius * Math.cos(angle),
      y: 150 - radius * Math.sin(angle),
    }),
    marker = point(q.marker, 60),
    label = point(q.marker, 82),
    sun = point(q.sunDirection, 150),
    arcStart = point(Math.PI, 79),
    arcEnd = point(Math.PI + q.orbital, 79);
  return (
    <section
      className="day-study"
      data-watch={d.watch}
      aria-label={t('恒星日与太阳日的相对转动实验')}
    >
      <header>
        <span>DAY / TWO REFERENCES</span>
        <b>{y === 365.256 ? t('地球近似比例') : t('放大模型：一年 {0}×24h', y)}</b>
      </header>
      <div className="day-view">
        <svg viewBox="0 0 360 270" aria-hidden="true">
          <defs>
            <clipPath id={`${id}-planet`}>
              <circle r="60" />
            </clipPath>
          </defs>
          <g transform="translate(305 45)">
            <circle className="day-orbit" r="25" />
            <circle className="day-mini-sun" r="6" />
            <circle
              className="day-mini-planet"
              cx={25 * Math.cos(q.orbital)}
              cy={-25 * Math.sin(q.orbital)}
              r="4"
            />
          </g>
          <path className="day-star-line" d="M10 150H180" />
          <path className="day-star" d="M10 143V157M3 150H17M5 145L15 155M5 155L15 145" />
          <path className="day-sun-line" d={`M${sun.x} ${sun.y}L180 150`} />
          <circle className="day-sun" cx={sun.x} cy={sun.y} r="14" />
          <g transform="translate(180 150)">
            <circle className="day-night" r="60" />
            <g clipPath={`url(#${id}-planet)`} transform={`rotate(${-deg(q.sunDirection)})`}>
              <path className="day-lit" d="M0 -60A60 60 0 0 1 0 60Z" />
            </g>
            <circle className="day-outline" r="60" />
            <circle className="day-pole" r="3" />
          </g>
          <path className="day-city-line" d={`M180 150L${marker.x} ${marker.y}`} />
          <circle className="day-city" cx={marker.x} cy={marker.y} r="5" />
          {q.orbital > 0.001 && q.orbital < Math.PI && (
            <path
              className="day-extra"
              d={`M${arcStart.x} ${arcStart.y}A79 79 0 0 0 ${arcEnd.x} ${arcEnd.y}`}
            />
          )}
        </svg>
        <b style={{ left: `${(label.x / 360) * 100}%`, top: `${(label.y / 270) * 100}%` }}>P</b>
      </div>
      <div className="day-legend">
        <span>{t('恒星参照')}</span>
        <span>{t('太阳方向')}</span>
        <span>{t('观察点 P')}</span>
      </div>
      <p className="day-now">
        t = {earthDayClock(now)} · {t('离正午方向')} {Math.abs(deg(q.noonError))}°
      </p>
      <div className="day-clocks">
        <span>
          {t('恒星日')}
          <b>{earthDayClock(m.siderealHours)}</b>
        </span>
        <span>
          {t('太阳日')}
          <b>{earthDayClock(m.solarHours)}</b>
        </span>
      </div>
      {c === 4 && <p className="day-note">{t('恒星日结束时，太阳方向差约 0.98°。')}</p>}
      {!d.watch && (
        <div className="day-controls">
          <label htmlFor={`${id}-year`}>
            {t('公转周期，单位 24h')} · {year}
            <input
              id={`${id}-year`}
              type="range"
              min="12"
              max="720"
              step=".001"
              value={year}
              onChange={(e) => setYear(+e.target.value)}
            />
          </label>
          <button onClick={() => setYear(year === 365.256 ? 12 : 365.256)}>
            {t('切换放大与地球近似比例')}
          </button>
          <label htmlFor={`${id}-hours`}>
            {t('经过小时')} · {hours}
            <input
              id={`${id}-hours`}
              type="range"
              min="0"
              max="26"
              step=".01"
              value={hours}
              onChange={(e) => setHours(+e.target.value)}
            />
          </label>
          <button aria-pressed={orbit} onClick={() => setOrbit(!orbit)}>
            {t('切换公转，保持自转角速度')}
          </button>
          <button aria-pressed={retro} onClick={() => setRetro(!retro)}>
            {t('反转自转方向')}
          </button>
          <button onClick={() => setHours(m.siderealHours)}>{t('跳到一个恒星日')}</button>
          <button onClick={() => setHours(m.solarHours)}>{t('跳到一个太阳日')}</button>
        </div>
      )}
      <details>
        <summary>{t('平均太阳日与真实太阳日要分开')}</summary>
        <p>
          {t(
            '从初始正午开始，圆轨道、匀速自转，轴垂直轨道面，取远恒星方向不变。放大模型一年为 12×24h；地球比例用一年 365.256×24h 推得约 23:56:04，不是高精度地球定向算法。太阳相对角速度等于自转减公转；反向自转时用绝对周期，太阳日可短于恒星日。关闭公转保持原自转。日长不含椭圆轨道、轴倾斜、岁差与均时差，图中大小和轨道并非同一比例；24h 是理想平均基准，不表示真实每日正午间隔都相同。',
          )}
        </p>
      </details>
    </section>
  );
}
