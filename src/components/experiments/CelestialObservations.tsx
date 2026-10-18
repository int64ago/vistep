import { useMemo, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  marsObservation,
  jupiterMoons,
  halleyOrbit,
  uranusHistory,
} from '../../models/textbook-astronomy';
import '../../styles/modern-labs.css';
import '../../styles/astronomy-labs.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
// A fixed residual scale preserves the visible effect of changing the perturbing mass.
const uranusResidualScale =
  45 / Math.max(1, ...uranusHistory(2).map((p) => Math.abs(p.residualArcsec)));
const path = (ps: { x: number; y: number }[]) =>
  ps.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
export function CelestialArtwork({
  mode = 0,
  phase = 0,
  value = 0.5,
  mass = 1,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  mass?: number;
}) {
  const record = marsObservation(-90 + value * 180),
    circular = marsObservation(-90 + value * 180, 0),
    moons = jupiterMoons(value * 16),
    uranus = useMemo(() => uranusHistory(mass), [mass]),
    u = uranus[Math.min(200, Math.floor(value * 200))],
    comet = halleyOrbit(value);
  const project = (x: number, y: number) => ({
    x: 170 + (x + comet.a * comet.e) * Math.cos(0.5) * 8 - y * Math.sin(0.5) * 8,
    y: 142 - (x + comet.a * comet.e) * Math.sin(0.5) * 8 - y * Math.cos(0.5) * 8,
  });
  const neptuneAngle = Math.atan2(u.ny, u.nx),
    residualScale = uranusResidualScale;
  const sun = project(0, 0),
    cp = project(comet.x, comet.y);
  return (
    <svg
      className="astronomy-art"
      viewBox="0 0 340 300"
      role="img"
      aria-label={tr(
        '天体位置、观测记录与预测检验',
        'Celestial positions, observation records and prediction tests',
      )}
    >
      {Array.from({ length: 38 }, (_, j) => (
        <circle
          key={j}
          cx={15 + ((j * 73) % 310)}
          cy={14 + ((j * 47) % 275)}
          r={j % 7 === 0 ? 1.2 : 0.65}
          fill="#d7e0d6"
          opacity={0.2 + (j % 3) * 0.1}
        />
      ))}
      {mode === 0 && (
        <>
          <path d="M25 100H316" stroke="#506874" />
          <path
            d={path(
              Array.from({ length: 60 }, (_, j) => {
                const p = marsObservation(-90 + (j * 180) / 59);
                return { x: 170 + p.longitude * 112, y: 86 };
              }),
            )}
            stroke="#c2ad81"
            fill="none"
            strokeWidth="1.5"
          />
          <circle cx={170 + record.longitude * 112} cy="86" r="5" fill="#ceac82" />
          <circle
            cx={170 + circular.longitude * 112}
            cy="86"
            r="7"
            fill="none"
            stroke="#7fa6af"
            strokeDasharray="2 2"
          />
          <path d="M83 234A78 78 0 0 1 163 156V234Z" fill="#334a53" stroke="#9eaa94" />
          {Array.from({ length: 10 }, (_, j) => {
            const a = (j * Math.PI) / 18;
            return (
              <path
                key={j}
                d={`M${163 - 78 * Math.cos(a)} ${234 - 78 * Math.sin(a)}L${163 - 71 * Math.cos(a)} ${234 - 71 * Math.sin(a)}`}
                stroke="#a5b39e"
              />
            );
          })}
          <path
            d={`M163 234L${163 - 94 * Math.cos(0.65 + record.longitude * 0.4)} ${234 - 94 * Math.sin(0.65 + record.longitude * 0.4)}`}
            stroke="#c0ad87"
            strokeWidth="4"
          />
          <path d="M163 234V272M139 272H187" stroke="#a0a68f" strokeWidth="4" />
          <path d="M211 161V254H316" stroke="#55727e" fill="none" />
          <path
            d={path(
              Array.from({ length: 61 }, (_, j) => {
                const t = -90 + j * 3,
                  r = marsObservation(t),
                  c = marsObservation(t, 0);
                return { x: 214 + j * 1.6, y: 207 - (r.longitude - c.longitude) * 130 };
              }),
            )}
            stroke="#c2ad81"
            fill="none"
            strokeWidth="2"
          />
          <path d="M212 207H314" stroke="#6f8c96" strokeDasharray="3 4" />
          <text x="212" y="280" fontSize="18" fill="#c1d0ca">
            {tr('模型残差', 'Residual')}
          </text>
        </>
      )}
      {mode === 1 && (
        <>
          <rect x="20" y="25" width="300" height="89" rx="19" fill="#10222d" stroke="#47606b" />
          {moons
            .filter((m) => !m.hidden && m.z < 0)
            .map((m, j) => (
              <circle key={j} cx={170 + m.x * 5.1} cy="70" r="2.2" fill="#d2d9c5" />
            ))}
          <circle cx="170" cy="70" r="5.1" fill="#c6b18f" />
          <path d="M166 67H174M166 73H174" stroke="#9b8672" strokeWidth="1.5" />
          {moons
            .filter((m) => !m.hidden && m.z >= 0)
            .map((m, j) => (
              <circle key={j} cx={170 + m.x * 5.1} cy="70" r="2.2" fill="#d2d9c5" />
            ))}
          {phase === 0 ? (
            <>
              <path d="M62 190H269V235H62Z" fill="#788785" />
              <ellipse cx="62" cy="212" rx="7" ry="25" fill="#b0c4bf" />
              <path
                d="M262 190Q252 212 262 235M275 190Q265 212 275 235"
                fill="#aac1ba"
                stroke="#d7e0cb"
              />
              {[-17, 17].map((y) => (
                <path
                  key={y}
                  d={`M24 ${212 + y}H62L263 ${212 + y * 0.2}H310`}
                  stroke="#d9c08d"
                  fill="none"
                  strokeWidth="1.5"
                />
              ))}
              <path d="M180 236V275M151 275H208" stroke="#a2ae99" strokeWidth="5" />
            </>
          ) : (
            <>
              {[0, 1, 2, 3, 4].map((j) => (
                <g key={j}>
                  <path d={`M54 ${147 + j * 29}H309`} stroke="#3a5661" />
                  <circle cx="179" cy={147 + j * 29} r="4.6" fill="#bba98c" />
                  {jupiterMoons(j + value * 4)
                    .filter((m) => !m.hidden)
                    .map((m, i) => (
                      <circle
                        key={i}
                        cx={179 + m.x * 4.6}
                        cy={147 + j * 29}
                        r="2.2"
                        fill="#d0d9c5"
                      />
                    ))}
                  <text x="23" y={153 + j * 29} fontSize="18" fill="#c4d2ca">
                    {j + 1}
                  </text>
                </g>
              ))}
            </>
          )}
        </>
      )}
      {mode === 2 && (
        <>
          {[68, 105].map((r) => (
            <circle key={r} cx="146" cy="124" r={r} stroke="#526d77" fill="none" />
          ))}
          <circle cx="146" cy="124" r="5" fill="#d0b079" />
          <path
            d={`M146 124L${146 + u.nx * 3.49} ${124 - u.ny * 3.49}`}
            stroke="#627c83"
            strokeDasharray="4 4"
          />
          <circle cx={146 + u.x * 3.49} cy={124 - u.y * 3.49} r="5" fill="#a9c4bc" />
          <circle cx={146 + u.nx * 3.49} cy={124 - u.ny * 3.49} r="6" fill="#779db0" />
          {phase === 0 ? (
            <>
              <path d="M34 235H309" stroke="#68838d" />
              <path
                d={path(
                  uranus.map((p, j) => ({
                    x: 34 + j * 1.35,
                    y: 235 - p.residualArcsec * residualScale,
                  })),
                )}
                stroke="#c2ae83"
                fill="none"
                strokeWidth="2"
              />
              <circle
                cx={34 + value * 270}
                cy={235 - u.residualArcsec * residualScale}
                r="4"
                fill="#d4bd8e"
              />
            </>
          ) : (
            <>
              <rect
                x="247"
                y="31"
                width="72"
                height="105"
                rx="14"
                fill="#10232e"
                stroke="#617983"
              />
              <circle cx="270" cy="58" r="2" fill="#c4d2c4" />
              <circle cx="296" cy="102" r="2" fill="#c4d2c4" />
              <circle
                cx={283 + 25 * Math.cos(neptuneAngle)}
                cy={80 - 25 * Math.sin(neptuneAngle)}
                r="3.5"
                fill="#94bac0"
              />
              <text x="247" y="162" fontSize="18" fill="#c4d2ca">
                {tr('方向投影', 'Direction')}
              </text>
            </>
          )}
          <text x="31" y="283" fontSize="18" fill="#c4d2ca">
            {tr('示例轨道 · 非1846年星历', 'Illustrative orbits')}
          </text>
        </>
      )}
      {mode === 3 && (
        <>
          <path
            d={path(
              Array.from({ length: 181 }, (_, j) => {
                const p = halleyOrbit(j / 180);
                return project(p.x, p.y);
              }),
            )}
            stroke="#728f97"
            fill="none"
            strokeWidth="1.5"
          />
          <circle cx={sun.x} cy={sun.y} r="6" fill="#d3b27b" />
          <path
            d={`M${cp.x} ${cp.y}l${((cp.x - sun.x) / Math.max(1, Math.hypot(cp.x - sun.x, cp.y - sun.y))) * Math.min(42, 24 / comet.r)} ${((cp.y - sun.y) / Math.max(1, Math.hypot(cp.x - sun.x, cp.y - sun.y))) * Math.min(42, 24 / comet.r)}`}
            stroke="#c6d1b9"
            strokeWidth="5"
            opacity=".35"
          />
          <circle cx={cp.x} cy={cp.y} r="3.5" fill="#d8dfc4" />
          <path d="M33 258H307" stroke="#7a8e91" />
          {['1531', '1607', '1682', '1758'].map((date, j) => (
            <g key={date}>
              <circle cx={48 + j * 79} cy="258" r="4" fill={j === 3 ? '#d6bc83' : '#a1b7ac'} />
              <text x={48 + j * 79} y="287" textAnchor="middle" fontSize="18" fill="#c4d2ca">
                {date}
              </text>
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
const variants = [
  'required-2-tycho-observations',
  'required-2-jupiter-moons',
  'required-2-neptune',
  'required-2-halley',
];
export default function CelestialObservations() {
  const film = useShowcase(),
    [selected, setSelected] = useState(
      film.variant === 'required-1-galileo-telescope'
        ? 1
        : Math.max(0, variants.indexOf(film.variant ?? '')),
    ),
    [manual, setManual] = useState(0.5),
    [mass, setMass] = useState(1);
  const mode = film.watch ? Math.floor(film.chapter / 2) : selected,
    phase = film.watch ? film.chapter % 2 : 1,
    value = film.watch ? film.chapterProgress : manual;
  const names = [
    ['第谷观测', 'Tycho’s observations'],
    ['木星卫星', 'Jupiter’s moons'],
    ['海王星预测', 'Neptune prediction'],
    ['哈雷回归', 'Halley’s return'],
  ];
  return (
    <div className="astronomy-lab">
      {!film.watch && (
        <div className="modern-paths">
          {names.map((n, j) => (
            <button key={j} type="button" aria-pressed={mode === j} onClick={() => setSelected(j)}>
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {mode === 0
          ? `${tr('所选记录日', 'Model day')} ${(-90 + value * 180).toFixed(0)} · Δθ ${(((marsObservation(-90 + value * 180).longitude - marsObservation(-90 + value * 180, 0).longitude) * 180) / Math.PI).toFixed(2)}°`
          : mode === 1
            ? `${tr('连续观察', 'Repeated observations')} · ${(value * 16).toFixed(1)} ${tr('天', 'days')}`
            : mode === 2
              ? `${tr('教学积分时间', 'Model integration time')} ${(value * 80).toFixed(1)} ${tr('年', 'years')}`
              : `r = ${halleyOrbit(value).r.toFixed(2)} AU · T ≈75.3 ${tr('年', 'years')}`}
      </div>
      <CelestialArtwork mode={mode} phase={phase} value={value} mass={film.watch ? 1 : mass} />
      <p className="modern-key">
        {
          [
            tr(
              '位置记录约束轨道模型，残差揭示模型不足。',
              'Position records constrain an orbit; residuals expose its limits.',
            ),
            tr(
              '几颗光点反复围绕木星换位，形成连续证据。',
              'Repeated changes around Jupiter provide a connected set of observations.',
            ),
            tr(
              '轨道偏差提供线索，独立观测检验预言。',
              'An orbital discrepancy suggests a cause; observation tests the prediction.',
            ),
            tr(
              '相似的多次记录，最终接受未来回归的检验。',
              'Similar past records lead to a prediction tested by a future return.',
            ),
          ][mode]
        }
      </p>
      {!film.watch && (
        <div className="modern-explore">
          <Range
            label={tr('观察时间', 'Observation time')}
            value={manual}
            min={0}
            max={1}
            step={0.005}
            onChange={setManual}
          />
          {mode === 2 && (
            <Range
              label={tr('远方行星质量 / 示例海王星质量', 'Perturber mass / example Neptune mass')}
              value={mass}
              min={0}
              max={2}
              step={0.05}
              onChange={setMass}
            />
          )}
        </div>
      )}
    </div>
  );
}
