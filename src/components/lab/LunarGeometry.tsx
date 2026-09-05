import { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { LUNAR, lunarMonths, phaseDiskPath, type LunarState } from '../../models/moon';
export default function LunarGeometry({
  state,
  view,
}: {
  state: LunarState;
  view: 'orbit' | 'spin' | 'shadow' | 'months';
}) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = matchMedia('(max-width:760px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const width = mobile ? 340 : 620,
    height = mobile ? 284 : 340,
    cx = mobile ? 136 : 270,
    cy = mobile ? 142 : 170,
    orbit = mobile ? 96 : 148,
    earth = mobile ? 21 : 27;
  const s = state,
    angle = (s.earthAngle * 180) / Math.PI;
  const mx = cx + s.moonDirection.x * orbit,
    my = cy - s.moonDirection.y * orbit;
  const orbitalPath =
    Array.from({ length: 181 }, (_, i) => {
      const u = (i / 180) * Math.PI * 2,
        node = (s.nodeDegrees * Math.PI) / 180,
        tilt = (s.inclination * Math.PI) / 180;
      const x = Math.cos(node) * Math.cos(u) - Math.sin(node) * Math.sin(u) * Math.cos(tilt);
      const y = Math.sin(node) * Math.cos(u) + Math.cos(node) * Math.sin(u) * Math.cos(tilt);
      return `${i ? 'L' : 'M'}${cx + x * orbit},${cy - y * orbit}`;
    }).join('') + 'Z';
  const month = lunarMonths(s.days);
  if (view === 'shadow') {
    const ex = mobile ? 40 : 120,
      moonX = mobile ? 278 : 480,
      sy = mobile ? 142 : 180,
      er = mobile ? 17 : 22;
    const scale = er / LUNAR.earthRadius,
      y = sy - s.shadowOffset * scale,
      mr = LUNAR.moonRadius * scale,
      ur = s.umbraRadius * scale,
      pr = s.penumbraRadius * scale,
      endUmbra = er + ((ur - er) * (moonX + 16 - ex)) / (moonX - ex),
      endPenumbra = er + ((pr - er) * (moonX + 16 - ex)) / (moonX - ex);
    return (
      <div className="lunar-geometry lunar-shadow">
        <div className="lunar-diagram-heading">
          <span>{t('月食需要对准影子')}</span>
          <b>
            {(s.umbraFraction * 100).toFixed(0)}%<small>{t('月面投影进入本影')}</small>
          </b>
        </div>
        <svg
          viewBox={`0 0 ${width} ${mobile ? 270 : 320}`}
          role="img"
          aria-label={t('地球本影与月球位置的横截面')}
        >
          <path
            d={`M${ex} ${sy - er}L${moonX + 16} ${sy - endPenumbra}V${sy + endPenumbra}L${ex} ${sy + er}Z`}
            fill="#3b4760"
            fillOpacity=".4"
          />
          <path
            d={`M${ex} ${sy - er}L${moonX + 16} ${sy - endUmbra}V${sy + endUmbra}L${ex} ${sy + er}Z`}
            fill="#050b16"
            stroke="#647085"
            strokeWidth=".6"
          />
          {[-12, 0, 12].map((offset) => (
            <path
              key={offset}
              d={`M${mobile ? 4 : 38} ${sy + offset}H${ex - er - 6}m-4 -3 4 3-4 3`}
              fill="none"
              stroke="#d4b176"
              strokeWidth="1"
            />
          ))}
          <circle cx={ex} cy={sy} r={er} fill="#607d93" />
          <path d={`M${ex} ${sy - er}A${er} ${er} 0 0 1 ${ex} ${sy + er}Z`} fill="#162638" />
          <path d={`M${moonX} ${sy}V${y}`} stroke="#8b9fb5" strokeWidth="1" strokeDasharray="3 5" />
          <circle cx={moonX} cy={y} r={mr} fill="#d9d6c7" stroke="#b8b6a8" strokeWidth=".7" />
          <defs>
            <clipPath id="lunar-shadow-section">
              <circle cx={moonX} cy={y} r={mr} />
            </clipPath>
          </defs>
          <circle cx={moonX} cy={sy} r={ur} fill="#0b101a" clipPath="url(#lunar-shadow-section)" />
          <circle cx={moonX} cy={y} r={mr + 7} fill="none" stroke="#c1a57b" strokeWidth=".7" />
          <text x={ex} y={sy + 52} textAnchor="middle">
            {t('地球')}
          </text>
          <text x={(ex + moonX) / 2} y={sy + 42} textAnchor="middle">
            {t('本影')}
          </text>
          <text x={moonX} y={Math.max(22, y - 22)} textAnchor="middle">
            {t('月球')}
          </text>
          <path
            d={`M${ex} ${sy + 88}H${moonX}M${ex} ${sy + 82}v12M${moonX} ${sy + 82}v12`}
            stroke="#53637a"
          />
          <text x={(ex + moonX) / 2} y={sy + 118} textAnchor="middle">
            384,400 km
          </text>
        </svg>
        <p>{t('横向距离压缩；纵向保留地球与月球的比例。')}</p>
      </div>
    );
  }
  if (view === 'months') {
    const r1 = mobile ? 96 : 135,
      r2 = mobile ? 74 : 106,
      reach = mobile ? 174 : 245;
    const points = (turns: number, r: number) =>
      Array.from({ length: 101 }, (_, i) => {
        const a = (Math.PI * 2 * turns * i) / 100;
        return `${i ? 'L' : 'M'}${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`;
      }).join('');
    return (
      <div className="lunar-geometry lunar-months">
        <div className="lunar-diagram-heading">
          <span>{t('参照方向不同')}</span>
          <b>
            {s.days.toFixed(2)}
            <small>{t('经过天数')}</small>
          </b>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t('恒星月与朔望月的角度差')}>
          <circle cx={cx} cy={cy} r={r1} fill="none" stroke="#516078" strokeWidth=".7" />
          <circle cx={cx} cy={cy} r={r2} fill="none" stroke="#516078" strokeWidth=".7" />
          <path d={`M${cx} ${cy}H${width - 35}`} stroke="#7486a1" strokeDasharray="3 6" />
          <path
            d={`M${cx} ${cy}L${cx + reach * Math.cos(s.earthAngle)} ${cy - reach * Math.sin(s.earthAngle)}`}
            stroke="#ceab73"
            strokeWidth="1"
          />
          <path d={points(month.siderealTurns, r1)} stroke="#ccd5db" fill="none" strokeWidth="3" />
          <path d={points(month.synodicTurns, r2)} stroke="#b49872" fill="none" strokeWidth="3" />
          <path
            d={`M${cx} ${cy}L${cx + r1 * Math.cos(s.moonAngle)} ${cy - r1 * Math.sin(s.moonAngle)}`}
            stroke="#b2bbc9"
            strokeWidth="1"
          />
          <circle
            cx={cx + r1 * Math.cos(s.moonAngle)}
            cy={cy - r1 * Math.sin(s.moonAngle)}
            r="6"
            fill="#e0ded0"
          />
          <circle cx={cx} cy={cy} r={mobile ? 15 : 19} fill="#64829a" />
          <text x={width - 27} y={cy + 6}>
            ✦
          </text>
          <text x={width - 8} y={mobile ? 27 : cy - 67} textAnchor="end" fill="#d8b981">
            {t('太阳方向')}
          </text>
        </svg>
        <div className="lunar-month-values">
          <span>
            {t('相对恒星')}
            <b>{(month.siderealTurns * 360).toFixed(1)}°</b>
          </span>
          <span>
            {t('相对太阳')}
            <b>{(month.synodicTurns * 360).toFixed(1)}°</b>
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="lunar-geometry">
      <div className="lunar-diagram-heading">
        <span>{t(view === 'spin' ? '同一面朝向地球' : '从黄道北侧俯看')}</span>
        <b>
          {view === 'spin'
            ? ((s.days / LUNAR.siderealDays) * 360).toFixed(0) + '°'
            : ((s.longitude * 180) / Math.PI).toFixed(0) + '°'}
          <small>{t(view === 'spin' ? '转过的角度' : '日月黄经差')}</small>
        </b>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('日照方向、月球轨道与地球视线')}
      >
        <path d={orbitalPath} fill="none" stroke="#7e8da3" strokeOpacity=".45" strokeWidth="1" />
        <g
          transform={`rotate(${-angle} ${cx} ${cy})`}
          stroke="#cbae77"
          strokeOpacity=".55"
          strokeWidth="1"
        >
          {[mobile ? -40 : -65, 0, mobile ? 40 : 65].map((y) => (
            <g key={y}>
              <path d={`M${width - 20} ${cy + y}H${cx + orbit + 23}`} />
              <path d={`m${cx + orbit + 30} ${cy - 4 + y}-7 4 7 4`} fill="none" />
            </g>
          ))}
        </g>
        <path
          d={`M${cx} ${cy}L${mx} ${my}`}
          stroke="#acb7c4"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        <circle cx={cx} cy={cy} r={earth} fill="#182b40" stroke="#779cb1" strokeWidth=".7" />
        <path
          d={phaseDiskPath(0, earth)}
          fill="#69889e"
          transform={`translate(${cx} ${cy}) rotate(${-angle})`}
        />
        <circle
          cx={mx}
          cy={my}
          r={(earth * LUNAR.moonRadius) / LUNAR.earthRadius}
          fill="#131c2b"
          stroke="#adaca5"
          strokeWidth=".7"
        />
        <path
          d={phaseDiskPath(0, (earth * LUNAR.moonRadius) / LUNAR.earthRadius)}
          fill="#d9d7cb"
          transform={`translate(${mx} ${my}) rotate(${-angle})`}
        />
        {view === 'spin' && (
          <>
            <path
              d={`M${mx} ${my}L${mx - s.moonDirection.x * 13} ${my + s.moonDirection.y * 13}`}
              stroke="#dcb47a"
              strokeWidth="2"
            />
            <circle
              cx={mx - (s.moonDirection.x * earth * LUNAR.moonRadius) / LUNAR.earthRadius}
              cy={my + (s.moonDirection.y * earth * LUNAR.moonRadius) / LUNAR.earthRadius}
              r="2.8"
              fill="#ebbc79"
            />
          </>
        )}
        <text x={cx} y={cy + earth + 22} textAnchor="middle">
          {t('地球')}
        </text>
        <text x={mx} y={my > cy + orbit - 28 ? my - 23 : my + 29} textAnchor="middle">
          {t('月球')}
        </text>
        <text x={mobile ? 285 : 520} y={height - 22} textAnchor="middle" fill="#d0b784">
          {t('太阳光')}
        </text>
      </svg>
      <p>{t('日照与位置共用模型；地月距离压缩。')}</p>
    </div>
  );
}
