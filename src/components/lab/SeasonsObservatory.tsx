import { useId } from 'react';
import { t } from '../../i18n';
import {
  seasonDailyCurve,
  seasonBeam,
  seasonClipRay,
  seasonClipBeam,
  seasonFieldPoint,
  seasonOrbit,
  type SeasonsState,
} from '../../models/seasons';

const pair = (p: { x: number; y: number }) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;

/** Plan view of the same one-metre post; only the displayed shadow is clipped. */
export function SeasonsShadowDial({ state: s }: { state: SeasonsState }) {
  const shadow = s.solar.shadow,
    ratio = shadow ? Math.min(1, 3.1 / (shadow.length || 1)) : 0,
    x = 125 + (shadow?.east ?? 0) * ratio * 17,
    y = 92 - (shadow?.north ?? 0) * ratio * 17,
    horizontal = Math.hypot(s.solar.east, s.solar.north),
    sunX = 125 + (horizontal ? s.solar.east / horizontal : 0) * 66,
    sunY = 92 - (horizontal ? s.solar.north / horizontal : 0) * 66;
  return (
    <svg
      className="seasons-shadow-dial"
      viewBox="0 0 250 190"
      role="img"
      aria-label={t('一米立杆的影子俯视图')}
    >
      <circle cx="125" cy="92" r="55" fill="#29464b" stroke="#71958e" />
      {[17, 34, 51].map((r) => (
        <circle key={r} cx="125" cy="92" r={r} fill="none" stroke="#afc4b6" strokeOpacity=".2" />
      ))}
      <path d="M70 92H180M125 37V147" stroke="#afc4b6" strokeOpacity=".2" />
      {shadow && (
        <>
          <path d={`M${sunX} ${sunY}L125 92`} stroke="#efcd8c" strokeDasharray="3 4" opacity=".6" />
          <circle cx={sunX} cy={sunY} r="4" fill="#efcd8c" />
          <path d={`M125 92L${x} ${y}`} stroke="#071b27" strokeWidth="9" strokeLinecap="round" />
          <circle
            cx={x}
            cy={y}
            r="3"
            fill="none"
            stroke="#efcd8c"
            strokeDasharray={shadow.length > 3.1 ? '2 2' : undefined}
          />
        </>
      )}
      <circle cx="125" cy="92" r="5" fill="#edcd8d" stroke="#f5e4c1" />
      <text x="125" y="16" textAnchor="middle">
        N
      </text>
      <text x="125" y="184" textAnchor="middle">
        S
      </text>
      <text x="212" y="98">
        E
      </text>
      <text x="38" y="98" textAnchor="end">
        W
      </text>
    </svg>
  );
}
export function SeasonsOrbit({ state: s, compact }: { state: SeasonsState; compact: boolean }) {
  const width = compact ? 250 : 460,
    cx = width / 2,
    cy = compact ? 140 : 158,
    rx = compact ? 82 : 155,
    rz = compact ? 65 : 90;
  const pos = (longitude: number) => {
    const o = seasonOrbit(longitude, s.tilt);
    return { x: cx + o.earth.x * rx, y: cy + o.earth.z * rz };
  };
  const earth = pos(s.longitude),
    axis = { x: s.axis.x, y: s.axis.y * Math.sqrt(1 - (rz / rx) ** 2) };
  return (
    <svg
      className="seasons-apparatus seasons-orbit"
      viewBox={`0 0 ${width} ${compact ? 280 : 310}`}
      role="img"
      aria-label={t('圆轨道中的固定地轴与四个季节点')}
    >
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={rz}
        fill="none"
        stroke="#829296"
        strokeOpacity=".48"
        strokeWidth="1.2"
      />
      <line
        x1={cx}
        y1={cy}
        x2={earth.x}
        y2={earth.y}
        stroke="#d4b779"
        strokeWidth="1.5"
        strokeDasharray="3 6"
      />
      <circle cx={cx} cy={cy} r="21" fill="#f1ca82" />
      <circle cx={cx} cy={cy} r="30" fill="#f1ca82" opacity=".07" />
      {[0, 90, 180, 270].map((l) => {
        const p = pos(l);
        return (
          <g key={l} opacity=".52">
            <circle cx={p.x} cy={p.y} r="10" fill="#284956" stroke="#a6c6bc" />
            <path
              d={`M${p.x - axis.x * 23},${p.y + axis.y * 23}L${p.x + axis.x * 23},${p.y - axis.y * 23}`}
              stroke="#f2d18e"
              strokeWidth="1.8"
            />
          </g>
        );
      })}
      <circle cx={earth.x} cy={earth.y} r="15" fill="#629d97" stroke="#cee4d5" strokeWidth="1.5" />
      <path
        d={`M${earth.x - axis.x * 30},${earth.y + axis.y * 30}L${earth.x + axis.x * 30},${earth.y - axis.y * 30}`}
        stroke="#f6d48f"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={earth.x + axis.x * 30} cy={earth.y - axis.y * 30} r="3" fill="#fff1c2" />
      {compact && (
        <g fill="none" stroke="#829296" strokeOpacity=".45" strokeWidth="1">
          <path d={`M${pos(90).x - 15} ${pos(90).y}H18V222`} />
          <path d={`M${pos(270).x + 15} ${pos(270).y}H232V222`} />
        </g>
      )}
      <text x={cx} y="28" textAnchor="middle">
        180°
      </text>
      <text x={compact ? 8 : 15} y={compact ? 245 : cy + 7}>
        90°
      </text>
      <text x={width - (compact ? 8 : 15)} y={compact ? 245 : cy + 7} textAnchor="end">
        270°
      </text>
      <text x={cx} y={compact ? 270 : 291} textAnchor="middle">
        0°
      </text>
    </svg>
  );
}

export function SeasonsField({ state: s, compact }: { state: SeasonsState; compact: boolean }) {
  const id = useId().replace(/:/g, ''),
    width = compact ? 340 : 460;
  const p = (e: number, n: number, u = 0) => seasonFieldPoint(e, n, u, compact);
  const path = (points: { x: number; y: number }[]) => `M${points.map(pair).join('L')}`;
  const ring = (r: number) =>
    Array.from({ length: 97 }, (_, i) =>
      p(r * Math.cos((i * Math.PI) / 48), r * Math.sin((i * Math.PI) / 48)),
    );
  const origin = p(0, 0),
    tip = p(0, 0, 1),
    shadow = s.solar.shadow;
  const clipped = !!shadow && shadow.length > 3.1;
  const ratio = shadow ? Math.min(1, 3.1 / (shadow.length || 1)) : 1;
  const end = shadow ? p(shadow.east * ratio, shadow.north * ratio) : origin;
  const solarCurve = seasonDailyCurve(s.latitude, s.declination);
  let arc = '';
  let last = false;
  solarCurve.forEach((sun) => {
    if (sun.above) {
      arc += `${last ? 'L' : 'M'}${pair(p(sun.east * 3.05, sun.north * 3.05, sun.up * 3.05))}`;
    }
    last = sun.above;
  });
  const sun = p(s.solar.east * 3.05, s.solar.north * 3.05, s.solar.up * 3.05);
  return (
    <svg
      className="seasons-apparatus"
      viewBox={`0 0 ${width} 310`}
      role="img"
      aria-label={t('一米立杆的日影与地平线上方的太阳轨迹')}
    >
      <defs>
        <radialGradient id={`${id}-floor`}>
          <stop stopColor="#4b6060" />
          <stop offset="1" stopColor="#203c45" />
        </radialGradient>
      </defs>
      <path
        d={path(ring(3.2)) + 'Z'}
        fill={`url(#${id}-floor)`}
        stroke="#7b9894"
        strokeOpacity=".4"
      />
      {[1, 2, 3].map((r) => (
        <path key={r} d={path(ring(r)) + 'Z'} fill="none" stroke="#b7c6b8" strokeOpacity=".2" />
      ))}
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 4;
        return (
          <path
            key={i}
            d={`M${pair(p(3.2 * Math.cos(a), 3.2 * Math.sin(a)))}L${pair(p(-3.2 * Math.cos(a), -3.2 * Math.sin(a)))}`}
            stroke="#afbeb0"
            strokeOpacity=".16"
          />
        );
      })}
      <path
        d={arc}
        fill="none"
        stroke="#efca85"
        strokeOpacity=".45"
        strokeWidth="1.5"
        strokeDasharray="3 5"
      />
      {s.solar.above && (
        <>
          <path
            d={`M${pair(origin)}L${pair(end)}`}
            stroke="#071b27"
            strokeWidth="10"
            strokeLinecap="round"
            opacity=".65"
          />
          <path
            d={`M${pair(origin)}L${pair(end)}`}
            stroke="#071b27"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={`M${pair(sun)}L${pair(origin)}`}
            stroke="#eecb85"
            strokeWidth="1.1"
            strokeOpacity=".55"
            strokeDasharray="3 5"
          />
          <circle cx={sun.x} cy={sun.y} r="15" fill="#eecb85" fillOpacity=".08" />
          <circle cx={sun.x} cy={sun.y} r="7" fill="#f3d492" />
          <circle
            cx={end.x}
            cy={end.y}
            r="3"
            fill="none"
            stroke="#e8c685"
            strokeDasharray={clipped ? '2 2' : undefined}
          />
        </>
      )}
      <ellipse cx={origin.x} cy={origin.y} rx="9" ry="4" fill="#899181" stroke="#d6c397" />
      <path
        d={`M${pair(origin)}L${pair(tip)}`}
        stroke="#907d56"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d={`M${origin.x - 1.5},${origin.y}L${tip.x - 1.5},${tip.y}`}
        stroke="#e6d1a0"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx={tip.x} cy={tip.y} r="4.5" fill="#f0d79e" />
      <text x={tip.x + 13} y={tip.y + 7}>
        1 m
      </text>
      {[
        [0, 3.6, 'N'],
        [3.6, 0, 'E'],
        [0, -3.6, 'S'],
        [-3.6, 0, 'W'],
      ].map(([e, n, label]) => {
        const q = p(Number(e), Number(n));
        return (
          <text key={label} x={q.x} y={q.y + 5} textAnchor="middle">
            {label}
          </text>
        );
      })}
      {!s.solar.above && (
        <text x={width / 2} y="48" textAnchor="middle">
          {t(s.day.regime === 'horizon' ? '太阳中心停在地平线' : '太阳在地平线下')}
        </text>
      )}
    </svg>
  );
}

export function SeasonsBeam({ state: s, compact }: { state: SeasonsState; compact: boolean }) {
  const id = useId().replace(/:/g, '');
  const width = compact ? 340 : 460,
    cx = width / 2,
    ground = compact ? 218 : 236,
    unit = compact ? 43 : 57;
  const a = (s.solar.altitude * Math.PI) / 180;
  const beam = seasonBeam(s.solar.altitude);
  const project = (point: { x: number; y: number }) => ({
    x: cx + point.x * unit,
    y: ground - point.y * unit,
  });
  const segment = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const clipped = seasonClipRay(a, b);
    return clipped ? `M${pair(project(clipped[0]))}L${pair(project(clipped[1]))}` : undefined;
  };
  const polygon = beam
    ? seasonClipBeam([beam.rays[0].top, beam.rays[4].top, beam.rays[4].ground, beam.rays[0].ground])
    : [];
  return (
    <svg
      className="seasons-apparatus"
      viewBox={`0 0 ${width} 310`}
      role="img"
      aria-label={t('同一宽度的平行光束在水平面上铺开的长度')}
    >
      <defs>
        <clipPath id={`${id}-beam-clip`}>
          <rect x={cx - 3.2 * unit} y="48" width={6.4 * unit} height={ground - 45} />
        </clipPath>
      </defs>
      <path d={`M18,${ground}H${width - 18}`} stroke="#8caaa4" strokeWidth="2" />
      <path d={`M18,${ground + 1}H${width - 18}V${ground + 14}H18Z`} fill="#496565" opacity=".35" />
      {s.solar.above && beam ? (
        <>
          <g clipPath={`url(#${id}-beam-clip)`}>
            <path
              d={`M${polygon.map((p) => pair(project(p))).join('L')}Z`}
              fill="#e6c079"
              fillOpacity=".12"
            />
            {beam.rays.map((ray, index) => {
              return (
                <path
                  key={index}
                  d={segment(ray.top, ray.ground)}
                  stroke="#edc987"
                  strokeWidth={index === 2 ? 2 : 1}
                  strokeOpacity=".75"
                />
              );
            })}
            <path
              d={segment(beam.rays[0].top, beam.rays[4].top)}
              stroke="#f6d994"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d={segment(beam.rays[0].ground, beam.rays[4].ground)}
              stroke="#f6d994"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
          {a > 0.02 && (
            <path
              d={`M${cx - 38},${ground}A38 38 0 0 1 ${cx - 38 * Math.cos(a)},${ground - 38 * Math.sin(a)}`}
              fill="none"
              stroke="#d8d5b6"
            />
          )}
          <text x={cx + 10} y={ground - 22}>
            {s.solar.altitude.toFixed(1)}°
          </text>
          <text x={width / 2} y="35" textAnchor="middle">
            {t('光束宽度保持为 1')}
          </text>
          <text x={cx} y={ground + 42} textAnchor="middle">
            {t('铺开长度')} {s.solar.footprint! > 6.4 ? '6.4+' : s.solar.footprint!.toFixed(2)} ×
          </text>
        </>
      ) : (
        <text x={cx} y="135" textAnchor="middle">
          {t('太阳在地平线下')}
        </text>
      )}
    </svg>
  );
}
