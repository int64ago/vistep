import { useId, useState } from 'react';
import { t } from '../../i18n';
import { eclipseFrame, eclipseShot, ECLIPSE, type EclipseInput } from '../../models/solar-eclipse';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/solar-eclipse.css';
type Frame = ReturnType<typeof eclipseFrame>;
const labels = { none: '未相交', partial: '日偏食', total: '日全食', annular: '日环食' };

function Sky({ s, compact, width }: { s: Frame; compact: boolean; width: number }) {
  const id = useId().replaceAll(':', ''),
    w = Math.min(720, width),
    h = compact ? 290 : 360,
    cx = w / 2,
    cy = h / 2 - 12,
    r = compact ? 68 : 110,
    scale = r / s.sunAngular;
  const x = cx + s.sky.x * scale,
    y = cy - s.sky.y * scale,
    mr = s.moonAngular * scale;
  const outside = y + mr < 18 || y - mr > h - 30 || x + mr < 8 || x - mr > w - 8;
  return (
    <div className="eclipse-sky">
      <div className="eclipse-subheading">{t('同一观测点的天空')}</div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={t('由视半径与角距离计算的太阳月球圆面')}
      >
        <defs>
          <radialGradient id={`${id}-sun`}>
            <stop stopColor="#ffe7a7" />
            <stop offset=".85" stopColor="#ecc282" />
            <stop offset="1" stopColor="#d09c58" />
          </radialGradient>
          <radialGradient id={`${id}-halo`}>
            <stop offset=".58" stopColor="#f3d8a5" stopOpacity=".12" />
            <stop offset="1" stopColor="#f3d8a5" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${id}-field`}>
            <rect x="6" y="6" width={w - 12} height={h - 28} rx="24" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-field)`}>
          <path d={`M${cx} 12V${h - 22}M12 ${cy}H${w - 12}`} stroke="#b0c0d0" strokeOpacity=".08" />
          <circle cx={cx} cy={cy} r={r * 1.65} fill={`url(#${id}-halo)`} />
          <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-sun)`} />
          <circle
            cx={x}
            cy={y}
            r={mr}
            fill="#0d1c29"
            stroke="#7d8b98"
            strokeOpacity=".35"
            strokeWidth=".8"
          />
          {s.kind === 'total' && (
            <circle
              cx={cx}
              cy={cy}
              r={r + 2}
              fill="none"
              stroke="#eed5ad"
              strokeOpacity=".35"
              strokeWidth="2"
            />
          )}
        </g>
        <path d={`M${cx - r} ${h - 12}H${cx + r}`} stroke="#b1a48b" />
        <path d={`M${cx - r} ${h - 17}V${h - 7}M${cx + r} ${h - 17}V${h - 7}`} stroke="#b1a48b" />
      </svg>
      <div className="eclipse-sky-readout">
        <span>{t(labels[s.kind])}</span>
        <span>
          {t('遮挡面积')} {(s.obscured * 100).toFixed(1)}%
        </span>
      </div>
      <p className="eclipse-small">
        {t('角直径')} {((s.sunAngular * 360) / Math.PI).toFixed(3)}° · {t('均匀亮度圆面模型')}
      </p>
      {outside && (
        <p className="eclipse-small">
          {t('月球已离开此视场')} · {((s.separation * 180) / Math.PI).toFixed(2)}°
        </p>
      )}
    </div>
  );
}
function Alignment({ s, compact, width }: { s: Frame; compact: boolean; width: number }) {
  const w = Math.min(720, width),
    h = compact ? 300 : 340,
    left = 24,
    right = w - 24,
    base = h * 0.61,
    amp = 100;
  const x = (a: number) => left + ((a + 90) / 180) * (right - left);
  const y = (a: number) =>
    base -
    ((Math.sin((a * Math.PI) / 180) *
      Math.sin((s.input.inclination * Math.PI) / 180) *
      s.input.distance) /
      35000) *
      amp;
  const curve = Array.from({ length: 121 }, (_, i) => {
    const a = -90 + i * 1.5;
    return `${i ? 'L' : 'M'}${x(a)},${y(a)}`;
  }).join('');
  return (
    <div className="eclipse-alignment">
      <div className="eclipse-subheading">{t('轨道高度：交点附近')}</div>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={t('月球轨道在交点处穿过黄道面')}>
        <path d={`M${left} ${base}H${right}`} stroke="#e0bc81" strokeOpacity=".6" />
        <path d={`M${w / 2} 34V${h - 30}`} stroke="#a7c3cd" strokeDasharray="3 5" opacity=".4" />
        <path d={curve} fill="none" stroke="#93b4c5" strokeWidth="3" />
        <circle cx={w / 2} cy={base} r="6" fill="#e8c48a" />
        <circle
          cx={x(s.input.nodeAngle)}
          cy={y(s.input.nodeAngle) + 2}
          r="13"
          fill="#05151f"
          opacity=".5"
        />
        <circle
          cx={x(s.input.nodeAngle)}
          cy={y(s.input.nodeAngle)}
          r="11"
          fill="#aebec8"
          stroke="#dbe6e9"
        />
        <path
          d={`M${x(s.input.nodeAngle)} ${base}V${y(s.input.nodeAngle)}`}
          stroke="#a8bcc9"
          strokeDasharray="3 4"
        />
        {[-90, 0, 90].map((a) => (
          <text
            key={a}
            x={x(a)}
            y={h - 8}
            textAnchor={a < 0 ? 'start' : a > 0 ? 'end' : 'middle'}
            fill="#bccbd2"
            fontSize={compact ? 19 : 21}
          >
            {a}°
          </text>
        ))}
      </svg>
      <div className="eclipse-sky-readout">
        <span>
          {t('轨道倾角')} {s.input.inclination.toFixed(3)}°
        </span>
        <span>
          {t('离黄道面')} {Math.abs(s.moon.z).toFixed(0)} km
        </span>
      </div>
      <p className="eclipse-small">{t('金线：黄道面；圆点：轨道交点。横轴是轨道角，不是距离。')}</p>
    </div>
  );
}
function Shadow({ s, compact, width }: { s: Frame; compact: boolean; width: number }) {
  const w = Math.min(720, width),
    h = 320,
    moonX = compact ? 47 : 100,
    earthX = w - (compact ? 38 : 80),
    cy = 156,
    sy = 0.017;
  const u = s.umbra * sy,
    p = s.penumbra * sy,
    m = ECLIPSE.moonRadius * sy;
  return (
    <div className="eclipse-shadow">
      <div className="eclipse-subheading">{t('沿影轴的剖面')}</div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={t('本影与半影边界由太阳月球的公切线推导')}
      >
        <path
          d={`M8 ${cy - 75}H${moonX - 40}M8 ${cy}H${moonX - 40}M8 ${cy + 75}H${moonX - 40}`}
          stroke="#dfbd85"
          strokeWidth="1.5"
          opacity=".65"
        />
        <path
          d={`M${moonX} ${cy - m}L${earthX} ${cy - p}V${cy + p}L${moonX} ${cy + m}Z`}
          fill="#c1b389"
          fillOpacity=".13"
          stroke="#beaa82"
          strokeOpacity=".45"
        />
        <path
          d={`M${moonX} ${cy - m}L${earthX} ${cy - u}L${earthX} ${cy + u}L${moonX} ${cy + m}Z`}
          fill="#060e19"
          fillOpacity=".9"
          stroke="#92a2b1"
          strokeOpacity=".6"
        />
        <path
          d={`M${moonX} ${cy}H${earthX}`}
          stroke="#b7c5ce"
          strokeOpacity=".2"
          strokeDasharray="3 5"
        />
        <path d={`M${earthX} 28V276`} stroke="#8cabbc" strokeOpacity=".6" strokeWidth="3" />
        <circle cx={moonX} cy={cy} r={m} fill="#a2b1bb" stroke="#dbe0dc" />
        {s.miss * sy <= 120 && (
          <circle cx={earthX} cy={cy - s.miss * sy} r="6" fill="#edc789" stroke="#fff0cd" />
        )}
        <path d={`M${moonX} ${h - 21}H${earthX}`} stroke="#8097a6" />
        <text
          x={(moonX + earthX) / 2}
          y={h - 29}
          fill="#c1cbd0"
          textAnchor="middle"
          fontSize={compact ? 19 : 21}
        >
          {s.input.distance.toFixed(0)} km
        </text>
      </svg>
      <div className="eclipse-sky-readout">
        <span>
          {t('本影半径')} {s.umbra.toFixed(0)} km
        </span>
        <span>
          {t('到影轴距离')} {s.miss.toFixed(0)} km
        </span>
      </div>
      <p className="eclipse-small">{t('纵横比例不同；负本影半径表示越过锥尖，进入伪本影。')}</p>
      {s.miss * sy > 120 && (
        <p className="eclipse-small">{t('观测点超出剖面范围，距离仍保留完整计算。')}</p>
      )}
    </div>
  );
}
export default function SolarEclipse() {
  const demo = useShowcase(),
    { host, width: measuredWidth, compact } = useSignalWidth();
  const [distance, setDistance] = useState(360000),
    [longitude, setLongitude] = useState(0),
    [nodeAngle, setNodeAngle] = useState(0),
    [inclination, setInclination] = useState(ECLIPSE.inclination),
    [observerOffset, setObserverOffset] = useState(0);
  const [view, setView] = useState('sky');
  const shot = eclipseShot(demo.chapter, demo.chapterProgress),
    input: EclipseInput = demo.watch
      ? shot.input
      : { distance, longitude, nodeAngle, inclination, observerOffset },
    s = eclipseFrame(input),
    v = demo.watch ? shot.view : view;
  return (
    <div ref={host} className="eclipse-study" data-chapter={demo.chapter}>
      <div className="eclipse-kicker">
        <span>{t('日食几何观测室')}</span>
        <span>
          {t('角距')} {((s.separation * 180) / Math.PI).toFixed(3)}°
        </span>
      </div>
      {v === 'alignment' ? (
        <Alignment s={s} compact={compact} width={measuredWidth} />
      ) : v === 'shadow' ? (
        <Shadow s={s} compact={compact} width={measuredWidth} />
      ) : (
        <Sky s={s} compact={compact} width={measuredWidth} />
      )}
      {v === 'shadow' && (
        <div className="eclipse-shadow-verdict">
          <span>{t('同一观测点')}</span>
          <strong>{t(labels[s.kind])}</strong>
          <span>{(s.obscured * 100).toFixed(1)}%</span>
        </div>
      )}
      {!demo.watch && (
        <div className="eclipse-explore">
          <div className="eclipse-switch">
            {[
              ['sky', '天空'],
              ['alignment', '轨道高度'],
              ['shadow', '影锥剖面'],
            ].map(([id, label]) => (
              <button type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}>
                {t(label)}
              </button>
            ))}
          </div>
          <Range
            label={t('地月中心距离')}
            value={distance}
            min={350000}
            max={410000}
            step={100}
            unit="km"
            onChange={setDistance}
          />
          <Range
            label={t('合朔前后角度')}
            value={longitude}
            min={-1}
            max={1}
            step={0.01}
            unit="°"
            onChange={setLongitude}
          />
          <Range
            label={t('距轨道交点的角度')}
            value={nodeAngle}
            min={-90}
            max={90}
            step={1}
            unit="°"
            onChange={setNodeAngle}
          />
          <Range
            label={t('轨道倾角')}
            value={inclination}
            min={0}
            max={10}
            step={0.001}
            unit="°"
            onChange={setInclination}
          />
          <Range
            label={t('观测点偏移')}
            value={observerOffset}
            min={-6371}
            max={6371}
            step={1}
            unit="km"
            onChange={setObserverOffset}
          />
        </div>
      )}
      <details className="eclipse-method">
        <summary>{t('圆面、影锥与模型边界')}</summary>
        <p>
          {t(
            '理想球体、均匀太阳亮度、真空几何；天象圆面采用小角度圆形近似。忽略月缘地形、大气与真实轨道历表，不预测日期或地面路径。',
          )}
        </p>
        <p>
          {t(
            '观测点在地心附近的横向平面移动，保留视差，但不模拟球面地平线。影锥剖面位于轴线上；偏离交点时，轨道高度图承担错过地球的解释。',
          )}
        </p>
      </details>
    </div>
  );
}
