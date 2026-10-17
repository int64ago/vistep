import { useId, useState } from 'react';
import { t } from '../../i18n';
import { dewSaturation, dewState, dewShot } from '../../models/dew-point';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/dew-point.css';
export default function DewPoint() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [air, setAir] = useState(30),
    [humidity, setHumidity] = useState(0.5),
    [temperature, setTemperature] = useState(30),
    [parcel, setParcel] = useState(false);
  const shot = film.watch
      ? dewShot(film.chapter, film.chapterProgress)
      : { air, humidity, temperature, parcel },
    s = dewState(shot),
    W = phone ? 340 : 760,
    H = phone ? 300 : 340,
    L = phone ? 44 : 65,
    R = W - 20,
    top = 20,
    bottom = phone ? 173 : 220,
    x = (v: number) => L + ((R - L) * v) / 40,
    y = (v: number) => bottom - ((bottom - top) * v) / 8000,
    curve = Array.from({ length: 161 }, (_, i) => `${x(i / 4)},${y(dewSaturation(i / 4))}`).join(
      ' ',
    ),
    actual = shot.parcel ? s.parcelVapor : s.vapor,
    plateY = phone ? 240 : 283,
    plateLeft = phone ? 45 : 115,
    plateWidth = phone ? 270 : 530,
    drops = s.condenses ? Math.min(18, Math.ceil((s.vapor - s.saturation) / 180)) : 0;
  return (
    <section className="dew-study">
      <header>
        {t(
          shot.parcel
            ? '水汽 + 液水：缓慢冷却与复热的同一本水账'
            : '冷镜面降到露点，水汽才开始净凝结',
        )}
      </header>
      <svg
        className="dew-diagram"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('饱和蒸气压曲线、水汽分压线与温度游标，及镜面结露条件或气液质量分配')}
      >
        <defs>
          <linearGradient id={`${id}mirror`} x2="0" y2="1">
            <stop stopColor="#d6dfdb" />
            <stop offset=".5" stopColor="#8babb1" />
            <stop offset="1" stopColor="#c1ceca" />
          </linearGradient>
        </defs>
        {[2000, 4000, 6000].map((p) => (
          <g key={p}>
            <path d={`M${L} ${y(p)}H${R}`} stroke="#b1c2c5" opacity=".18" />
            <text x={L - 8} y={y(p) + 7} textAnchor="end" fill="#c4d4d3" fontSize={phone ? 26 : 20}>
              {p / 1000}
            </text>
          </g>
        ))}
        <path d={`M${L} ${top}V${bottom}H${R}`} fill="none" stroke="#a5b9ba" opacity=".6" />
        {[0, 20, 40].map((v) => (
          <text
            key={v}
            x={x(v)}
            y={bottom + 27}
            textAnchor="middle"
            fill="#c4d4d3"
            fontSize={phone ? 26 : 20}
          >
            {v}°
          </text>
        ))}
        <polyline points={curve} fill="none" stroke="#9bbfc7" strokeWidth="3" />
        <path
          d={`M${L} ${y(s.vapor)}H${R}`}
          stroke="#e0b97c"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <path
          d={`M${x(s.point)} ${y(s.vapor) - 18}V${bottom}`}
          stroke="#e0b97c"
          strokeDasharray="3 5"
          opacity=".65"
        />
        <circle cx={x(s.point)} cy={y(s.vapor)} r="5" fill="#e0b97c" />
        <path d={`M${x(s.temperature)} ${top}V${bottom}`} stroke="#d4e0da" opacity=".6" />
        <circle
          cx={x(s.temperature)}
          cy={y(actual)}
          r="6"
          fill={shot.parcel && s.liquid > 0 ? '#b7d4d5' : '#e5d5b4'}
          stroke="#223a4c"
          strokeWidth="1.5"
        />
        {shot.parcel ? (
          <>
            <rect x={plateLeft} y={plateY} width={plateWidth} height="24" rx="9" fill="#8baeb9" />
            <path
              d={`M${plateLeft + (plateWidth * s.gas) / s.total} ${plateY}h${(plateWidth * s.liquid) / s.total}v24h${(-plateWidth * s.liquid) / s.total}Z`}
              fill="#e2bb7e"
            />
            <path
              d={`M${plateLeft + (plateWidth * s.gas) / s.total} ${plateY - 5}v34`}
              stroke="#e9ded0"
              strokeWidth="2"
            />
          </>
        ) : (
          <>
            <rect
              x={plateLeft}
              y={plateY}
              width={plateWidth}
              height="22"
              rx="8"
              fill={`url(#${id}mirror)`}
            />
            <path
              d={`M${plateLeft + 12} ${plateY + 6}H${plateLeft + plateWidth - 12}`}
              stroke="#edf2e8"
              opacity=".6"
            />
            {Array.from({ length: drops }, (_, i) => {
              const cx = plateLeft + 12 + ((i % 9) * (plateWidth - 24)) / 8,
                cy = plateY + 10 + Math.floor(i / 9) * 9;
              return (
                <ellipse
                  key={i}
                  cx={cx}
                  cy={cy}
                  rx="4"
                  ry="2.7"
                  fill="#deeeea"
                  stroke="#698d9e"
                  strokeWidth=".8"
                />
              );
            })}
          </>
        )}
      </svg>
      <div className="dew-legend">
        <span>
          <i />
          {t('饱和蒸气压曲线（kPa）')}
        </span>
        <span>
          <i />
          {t('原始水汽分压与露点')}
        </span>
      </div>
      <div className="dew-numbers">
        <div>
          <b>{s.temperature.toFixed(1)} °C</b>
          <span>{t(shot.parcel ? '当前空气温度' : '镜面温度')}</span>
        </div>
        <div>
          <b>{s.point.toFixed(1)} °C</b>
          <span>{t('原始空气露点')}</span>
        </div>
      </div>
      <div className="dew-waterline">
        {shot.parcel ? (
          <>
            <span>
              {t('水汽')} {(s.gas * 1000).toFixed(2)} + {t('液水')} {(s.liquid * 1000).toFixed(2)} ={' '}
              {(s.total * 1000).toFixed(2)} g/kg
            </span>
            <span>
              RH {(s.parcelHumidity * 100).toFixed(1)}% · {t('每千克干空气')}
            </span>
          </>
        ) : (
          <>
            <span>
              {t('环境空气')} {s.air.toFixed(1)} °C · RH {(s.humidity * 100).toFixed(0)}%
            </span>
            <span>{t(s.condenses ? '低于露点：出现净凝结' : '高于或等于露点：无净凝结')}</span>
          </>
        )}
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('冷镜面与封闭空气水账的区别')}</summary>
          <p>
            {t(
              '冷镜面模式的环境空气是恒温恒湿大库，比较镜面饱和蒸气压与环境水汽分压，只判断结露条件；液滴数量不预测质量或速率。空气水账模式把一千克干空气缓慢定压冷却，水汽和液水合计守恒，凝结液保留以便复热时再蒸发。达到相平衡时，气相分压不会超过饱和值。饱和压采用液水IAPWS公式；忽略冰、盐、过饱和成核、温度梯度与非理想增强因子。不把空气当作装水容器；相对湿度是分压比。液水色条显示质量比例，不是气液体积比例。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="dew-controls">
          <Range
            label={t('原始空气温度')}
            value={air}
            min={20}
            max={35}
            step={1}
            unit="°C"
            onChange={setAir}
          />
          <Range
            label={t('原始相对湿度')}
            value={humidity * 100}
            min={30}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => setHumidity(v / 100)}
          />
          <Range
            label={t(parcel ? '冷却或复热后的温度' : '镜面温度')}
            value={temperature}
            min={0}
            max={40}
            step={0.5}
            unit="°C"
            onChange={setTemperature}
          />
          <button type="button" aria-pressed={parcel} onClick={() => setParcel(!parcel)}>
            {t(parcel ? '观察冷镜面条件' : '查看空气水分总账')}
          </button>
        </div>
      )}
    </section>
  );
}
