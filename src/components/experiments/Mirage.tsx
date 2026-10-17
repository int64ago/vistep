import { useId, useState } from 'react';
import { t } from '../../i18n';
import { mirageRay, mirageShot } from '../../models/mirage';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/mirage.css';
export default function Mirage() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [temp, setTemp] = useState(330),
    [angle, setAngle] = useState(-0.35),
    [eye, setEye] = useState(1.2),
    [close, setClose] = useState(false),
    [apparent, setApparent] = useState(true);
  const shot = film.watch
      ? mirageShot(film.chapter, film.chapterProgress)
      : { groundTemperature: temp, angle, eyeHeight: eye, close, apparent },
    s = mirageRay(shot),
    W = phone ? 340 : 760,
    H = phone ? 220 : 310,
    center = s.turnX ?? s.entry,
    minX = shot.close ? center - 12 : 0,
    maxX = shot.close ? center + 12 : 600,
    minY = shot.close ? -0.002 : 0,
    maxY = shot.close ? 0.022 : 2.6,
    x = (v: number) => 24 + ((v - minX) / (maxX - minX)) * (W - 48),
    y = (v: number) => H - 32 - ((v - minY) / (maxY - minY)) * (H - 54),
    points = shot.close
      ? Array.from({ length: 401 }, (_, i) => minX + ((maxX - minX) * i) / 400)
          .filter((v) => v >= 0 && v <= s.end)
          .map(s.at)
      : s.points;
  return (
    <section className="mirage-study" data-watch={film.watch}>
      <header>
        <span>
          {t(
            shot.close
              ? s.turns
                ? '近地2cm：光在空气中转向'
                : '近地2cm：这条光到达地面'
              : '沿眼睛接收到的方向追踪光路',
          )}
        </span>
        <b>{t('下蜃景的光路')}</b>
      </header>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t(
          shot.close
            ? '薄层内部连续曲率的近地局部，光线在真实地面处终止'
            : '热路面上方光路与眼睛视线的纵向放大剖面',
        )}
      >
        <defs>
          <linearGradient id={`${id}air`} x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#bdcfd1" />
            <stop offset="1" stopColor="#dca87b" />
          </linearGradient>
          <clipPath id={`${id}crop`}>
            <rect x="15" y="12" width={W - 30} height={H - 40} rx="8" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}crop)`}>
          <rect x="15" y="12" width={W - 30} height={H - 40} fill="#d5dfdb" />
          <rect
            x="15"
            y={y(s.H)}
            width={W - 30}
            height={Math.max(0, y(0) - y(s.H))}
            fill={`url(#${id}air)`}
          />
          <path d={`M15 ${y(0)}H${W - 15}`} stroke="#726b5b" strokeWidth="5" />
          <polyline
            points={points.map((p) => `${x(p.x)},${y(p.y)}`).join(' ')}
            fill="none"
            stroke="#417f96"
            strokeWidth="3"
          />
          {shot.apparent && !shot.close && (
            <path
              d={`M${x(0)} ${y(s.h)}L${x(Math.min(s.apparentGround, 600))} ${y(Math.max(0, s.h + s.m * 600))}`}
              stroke="#9b775a"
              strokeDasharray="5 5"
              strokeWidth="2"
            />
          )}
          {s.turns && s.turnX !== null && s.turnY !== null && (
            <circle
              cx={x(s.turnX)}
              cy={y(s.turnY)}
              r="5"
              fill="#417f96"
              stroke="#edf1e6"
              strokeWidth="2"
            />
          )}
          {s.groundX !== null && <circle cx={x(s.groundX)} cy={y(0)} r="5" fill="#99734e" />}
          {!shot.close && (
            <ellipse
              cx={x(0)}
              cy={y(s.h)}
              rx="9"
              ry="6"
              fill="#f1eee0"
              stroke="#607a73"
              strokeWidth="2"
            />
          )}
        </g>
        <text x="20" y="30" fontSize={phone ? 26 : 18} fill="#50676a">
          {shot.close ? '2 cm' : '2 m'}
        </text>
        <text x={W - 20} y={H - 3} textAnchor="end" fontSize={phone ? 26 : 18} fill="#50676a">
          {shot.close ? '24 m' : '600 m'}
        </text>
      </svg>
      <div className="mirage-legend">
        <span>
          <i style={{ background: '#417f96' }} />
          {t('真实光路')}
        </span>
        {shot.apparent && (
          <span>
            <i style={{ background: '#9b775a' }} />
            {t('视线直线延长')}
          </span>
        )}
        <span>{t('纵向放大')}</span>
      </div>
      <div className="mirage-readings">
        <span>
          {t('地面附近温度')}
          <b>{(s.Tg - 273.15).toFixed(1)}°C</b>
        </span>
        <span>
          {t('最低高度')}
          <b>{s.turns ? `${(s.turnY! * 100).toFixed(2)} cm` : t('到达地面')}</b>
        </span>
      </div>
      <p className="mirage-parameters">
        {t('视线角')} {s.angle.toFixed(2)}° · {t('眼高')} {s.h.toFixed(1)} m
      </p>
      {s.turns && s.turnX !== null && s.turnX > 600 && !shot.close && (
        <p className="mirage-parameters">{t('转折点在主图之外，可切换近地局部。')}</p>
      )}
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('薄层、视线与模型边界')}</summary>
          <p>
            {t(
              '以眼睛向远处反向追迹，真实光沿相反方向到达眼睛。上方空气均匀，近地2cm层内n²随高度线性变化；恒压下n−1近似与绝对温度成反比。剖面纵向夸大，局部镜头横向跟随该光线而尺度不变。只解释天空来光的方向偏移，不计算完整倒像、多重像、湍流闪烁、地球曲率或真实天气预测。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="mirage-controls">
          <Range
            label={t('近地空气温度')}
            value={temp}
            min={280}
            max={360}
            unit="K"
            onChange={setTemp}
          />
          <Range
            label={t('向下视线仰角')}
            value={angle}
            min={-0.65}
            max={-0.15}
            step={0.01}
            unit="°"
            onChange={setAngle}
          />
          <Range
            label={t('眼高')}
            value={eye}
            min={0.6}
            max={2.2}
            step={0.05}
            unit="m"
            onChange={setEye}
          />
          <button type="button" aria-pressed={close} onClick={() => setClose(!close)}>
            {t(close ? '看完整路面剖面' : '放大近地薄层')}
          </button>
          <button type="button" aria-pressed={apparent} onClick={() => setApparent(!apparent)}>
            {t(apparent ? '隐藏视线延长' : '比较视线延长')}
          </button>
        </div>
      )}
    </section>
  );
}
