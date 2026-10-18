import { useEffect, useMemo, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import { browserLocale } from '../../i18n';
import { jupiterMoons, halleyOrbit } from '../../models/textbook-astronomy';
import {
  jupiterObservation,
  jupiterRecordProgress,
  HALLEY_RECORD_YEARS,
  cometEvidenceStage,
  type CometEvidenceStage,
  MARS_RECORDS,
  MARS_FITS,
  marsDirection,
  marsComparison,
  URANUS_CANDIDATES,
  URANUS_BEST,
  differentialGravity,
  NEPTUNE_RECORDS,
  NEPTUNE_LONGITUDE,
  localSky,
  neptuneLinearPrediction,
  celestialEvidenceShot,
  type OrbitCandidate,
} from '../../models/celestial-evidence';
import '../../styles/modern-labs.css';
import '../../styles/astronomy-labs.css';
import '../../styles/celestial-observations.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const path = (ps: { x: number; y: number }[]) =>
  ps.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
export function CelestialArtwork({
  mode = 0,
  phase = 0,
  value = 0.5,
  cometEvidence = 'observed',
}: {
  mode?: number;
  phase?: number;
  value?: number;
  mass?: number;
  cometEvidence?: CometEvidenceStage;
}) {
  const observation = jupiterObservation(value),
    moons = phase === 0 ? jupiterMoons(value * 16) : observation.moons,
    comet = halleyOrbit(value);
  const project = (x: number, y: number) => ({
    x: 170 + (x + comet.a * comet.e) * Math.cos(0.5) * 8 - y * Math.sin(0.5) * 8,
    y: 142 - (x + comet.a * comet.e) * Math.sin(0.5) * 8 - y * Math.cos(0.5) * 8,
  });
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
      {mode === 1 && (
        <g data-moon-observation-day={phase === 0 ? value * 16 : observation.day}>
          <rect x="20" y="25" width="300" height="89" rx="19" fill="#10222d" stroke="#47606b" />
          {moons
            .filter((m) => !m.hidden && m.z < 0)
            .map((m, j) => (
              <circle
                key={j}
                data-live-moon-x={m.x}
                cx={170 + m.x * 5.1}
                cy="70"
                r="2.2"
                fill="#d2d9c5"
              />
            ))}
          <circle cx="170" cy="70" r="5.1" fill="#c6b18f" />
          <path d="M166 67H174M166 73H174" stroke="#9b8672" strokeWidth="1.5" />
          {moons
            .filter((m) => !m.hidden && m.z >= 0)
            .map((m, j) => (
              <circle
                key={j}
                data-live-moon-x={m.x}
                cx={170 + m.x * 5.1}
                cy="70"
                r="2.2"
                fill="#d2d9c5"
              />
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
              {observation.records.map((record) => (
                <g key={record.day} data-moon-record-day={record.day}>
                  <path d={`M54 ${147 + record.day * 29}H309`} stroke="#3a5661" />
                  <circle cx="179" cy={147 + record.day * 29} r="4.6" fill="#bba98c" />
                  {record.moons
                    .filter((m) => !m.hidden)
                    .map((m) => (
                      <circle
                        key={m.id}
                        data-record-moon-id={m.id}
                        cx={179 + m.x * 4.6}
                        cy={147 + record.day * 29}
                        r="2.2"
                        fill="#d0d9c5"
                      />
                    ))}
                  <text x="14" y={153 + record.day * 29} fontSize="18" fill="#c4d2ca">
                    {record.day}d
                  </text>
                </g>
              ))}
            </>
          )}
        </g>
      )}
      {mode === 3 && (
        <g data-comet-evidence={cometEvidence}>
          <text x="170" y="30" textAnchor="middle" fontSize="18" fill="#c4d2ca">
            {cometEvidence === 'past'
              ? tr('历史记录', 'Past records')
              : cometEvidence === 'prediction'
                ? tr('等待回归检验', 'Return predicted')
                : tr('回归已被观察到', 'Return observed')}
          </text>
          <g data-comet-orbit="kepler">
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
          </g>
          <path d={cometEvidence === 'past' ? 'M33 258H224' : 'M33 258H307'} stroke="#7a8e91" />
          {HALLEY_RECORD_YEARS.slice(0, cometEvidence === 'observed' ? 4 : 3).map((date, j) => (
            <g key={date} data-comet-record-year={date}>
              <circle cx={48 + j * 79} cy="258" r="4" fill={j === 3 ? '#d6bc83' : '#a1b7ac'} />
              <text x={48 + j * 79} y="287" textAnchor="middle" fontSize="18" fill="#c4d2ca">
                {date}
              </text>
            </g>
          ))}
          {cometEvidence === 'prediction' && (
            <g data-comet-prediction="pending">
              <circle cx="285" cy="258" r="6" fill="none" stroke="#d6bc83" strokeWidth="2" />
              <text x="285" y="287" textAnchor="middle" fontSize="18" fill="#d6bc83">
                ?
              </text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

type PlotProps = { width: number; height: number; locked: boolean; revealed: boolean };
function PlotLegend() {
  return (
    <div className="celestial-evidence-legend">
      <span>
        <i />
        {tr('固定记录', 'Fixed record')}
      </span>
      <span>
        <i className="celestial-evidence-ring" />
        {tr('模型预测', 'Prediction')}
      </span>
    </div>
  );
}
function MarsRecords({
  width,
  height,
  count,
  overlay,
}: {
  width: number;
  height: number;
  count: number;
  overlay: boolean;
}) {
  const x = (deg: number) => 68 + ((width - 88) * deg) / 45,
    top = 20,
    gap = (height - 55) / 5;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={tr(
        '不随候选模型改变的五条合成方向记录',
        'Five fixed synthetic direction records',
      )}
    >
      {[0, 20, 40].map((deg) => (
        <g key={deg}>
          <path d={`M${x(deg)} 16V${height - 29}`} className="celestial-evidence-grid" />
          <text x={x(deg)} y={height - 7} textAnchor="middle">
            {deg}°
          </text>
        </g>
      ))}
      {MARS_RECORDS.slice(0, count)
        .filter((r) => r.training)
        .map((r, i) => {
          const predicted = MARS_FITS.circle.records[i].predictionDegrees,
            y = top + i * gap + 8;
          return (
            <g key={r.id}>
              <text x="5" y={y + 5}>
                {r.day} d
              </text>
              <path d={`M${x(0)} ${y}H${x(42)}`} className="celestial-evidence-grid" />
              {overlay && (
                <>
                  <path
                    d={`M${x(r.longitudeDegrees)} ${y}H${x(predicted)}`}
                    className="celestial-evidence-gap"
                  />
                  <circle
                    data-prediction={r.id}
                    cx={x(predicted)}
                    cy={y}
                    r="7"
                    className="celestial-evidence-prediction"
                  />
                </>
              )}
              <circle
                data-record-id={r.id}
                data-record-value={r.longitudeDegrees}
                cx={x(r.longitudeDegrees)}
                cy={y}
                r="4.5"
                className="celestial-evidence-record"
              />
            </g>
          );
        })}
    </svg>
  );
}
function MarsPlot({
  width,
  height,
  locked,
  revealed,
  candidate,
  phase,
}: PlotProps & { candidate: OrbitCandidate; phase: number }) {
  const compact = width < 560,
    left = compact ? 43 : 60,
    right = width - 18,
    top = 17,
    bottom = height - 32,
    x = (day: number) => left + ((day + 80) / 240) * (right - left),
    y = (angle: number) => bottom - ((angle + 25) / 105) * (bottom - top),
    comparison = marsComparison(candidate, phase),
    end = locked ? 160 : 80;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={tr(
        '同一坐标上的方向记录与候选预测',
        'Fixed direction records and candidate predictions on common axes',
      )}
    >
      <rect
        x={x(100)}
        y={top}
        width={right - x(100)}
        height={bottom - top}
        rx="10"
        fill="#43616b"
        opacity=".18"
      />
      {[-20, 30, 80].map((v) => (
        <g key={v}>
          <path d={`M${left} ${y(v)}H${right}`} className="celestial-evidence-grid" />
          <text x={left - 8} y={y(v) + 5} textAnchor="end">
            {v}°
          </text>
        </g>
      ))}
      {[-80, 0, 80, 160].map((d) => (
        <text key={d} x={x(d)} y={height - 8} textAnchor={d === 160 ? 'end' : 'middle'}>
          {d}
          {d === 160 ? ' d' : ''}
        </text>
      ))}
      <path d={`M${x(100)} ${top}V${bottom}`} className="celestial-evidence-divider" />
      <path
        d={path(
          Array.from({ length: 121 }, (_, i) => {
            const day = -80 + ((end + 80) * i) / 120;
            return {
              x: x(day),
              y: y((marsDirection(day, candidate, phase).longitude * 180) / Math.PI),
            };
          }),
        )}
        className="celestial-evidence-model-line"
      />
      {comparison.records.map((r) => (
        <g key={r.id}>
          {r.training && (
            <path
              d={`M${x(r.day)} ${y(r.longitudeDegrees)}V${y(r.predictionDegrees)}`}
              className="celestial-evidence-gap"
            />
          )}
          {!r.training && locked && (
            <circle
              data-prediction={r.id}
              cx={x(r.day)}
              cy={y(r.predictionDegrees)}
              r="7"
              className="celestial-evidence-prediction"
            />
          )}
          {(r.training || revealed) && (
            <circle
              data-record-id={r.id}
              data-record-value={r.longitudeDegrees}
              cx={x(r.day)}
              cy={y(r.longitudeDegrees)}
              r="4.5"
              className="celestial-evidence-record"
            />
          )}
        </g>
      ))}
    </svg>
  );
}
function UranusPlot({
  width,
  height,
  locked,
  revealed,
  choice,
}: PlotProps & { choice: typeof URANUS_BEST }) {
  const left = width < 560 ? 50 : 66,
    right = width - 18,
    top = 18,
    bottom = height - 32,
    x = (year: number) => left + (year / 80) * (right - left),
    y = (arc: number) => top + ((400 - arc) / 1000) * (bottom - top);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={tr(
        '冻结的合成偏差与额外引力候选',
        'Fixed synthetic residuals and an extra-gravity candidate',
      )}
    >
      <rect
        x={x(55)}
        y={top}
        width={right - x(55)}
        height={bottom - top}
        rx="10"
        fill="#43616b"
        opacity=".18"
      />
      {[300, 0, -300, -600].map((v) => (
        <g key={v}>
          <path d={`M${left} ${y(v)}H${right}`} className="celestial-evidence-grid" />
          <text x={left - 7} y={y(v) + 5} textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      <text x={left} y="26">
        ″
      </text>
      {[0, 40, 80].map((v) => (
        <text key={v} x={x(v)} y={height - 8} textAnchor={v === 80 ? 'end' : 'start'}>
          {v}
          {v === 80 ? tr(' 年', ' yr') : ''}
        </text>
      ))}
      <path d={`M${x(55)} ${top}V${bottom}`} className="celestial-evidence-divider" />
      <path
        d={path(
          choice.history
            .filter((r) => r.year <= (locked ? 80 : 50))
            .map((r) => ({ x: x(r.year), y: y(r.residualArcsec) })),
        )}
        className="celestial-evidence-model-line"
      />
      {choice.records.map((r) => (
        <g key={r.id}>
          {!r.training && locked && (
            <circle
              data-prediction={r.id}
              cx={x(r.year)}
              cy={y(r.predictionArcsec)}
              r="7"
              className="celestial-evidence-prediction"
            />
          )}
          {(r.training || revealed) && (
            <circle
              data-record-id={r.id}
              data-record-value={r.residualArcsec}
              cx={x(r.year)}
              cy={y(r.residualArcsec)}
              r="4.5"
              className="celestial-evidence-record"
            />
          )}
        </g>
      ))}
    </svg>
  );
}
function ForceView({
  width,
  height,
  mass,
  phase,
}: {
  width: number;
  height: number;
  mass: number;
  phase: number;
}) {
  const state =
      URANUS_CANDIDATES.find((c) => c.massScale === mass && c.phase === phase) ?? URANUS_BEST,
    u = state.history[0],
    g = differentialGravity(u, 0, mass, phase),
    scale = Math.min((width - 54) / 34, (height - 55) / 45),
    ox = width / 2 - 14.5 * scale,
    oy = height * 0.65,
    pt = (v: { x: number; y: number }) => ({ x: ox + v.x * scale, y: oy - v.y * scale }),
    S = { x: ox, y: oy },
    U = pt(u),
    N = pt(g.neptune),
    aScale =
      50 /
      Math.max(
        1e-12,
        ...URANUS_CANDIDATES.flatMap((c) => {
          const gravity = differentialGravity(c.history[0], 0, c.massScale, c.phase);
          return [gravity.direct, gravity.solar, gravity.relative].map((v) => Math.hypot(v.x, v.y));
        }),
      ),
    arrow = (p: { x: number; y: number }, v: { x: number; y: number }, kind: string) => {
      const x = p.x + v.x * aScale,
        y = p.y - v.y * aScale,
        angle = Math.atan2(y - p.y, x - p.x);
      if (Math.hypot(v.x, v.y) < 1e-15) return null;
      return (
        <g className={kind}>
          <path d={`M${p.x} ${p.y}L${x} ${y}`} />
          <path
            d={`M${x - 6 * Math.cos(angle - 0.4)} ${y - 6 * Math.sin(angle - 0.4)}L${x} ${y}L${x - 6 * Math.cos(angle + 0.4)} ${y - 6 * Math.sin(angle + 0.4)}`}
          />
        </g>
      );
    };
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={tr(
        '远方行星同时吸引太阳与天王星，比较两者加速度之差',
        'The perturber pulls both the Sun and Uranus; compare their accelerations',
      )}
    >
      <path
        d={`M${S.x} ${S.y}L${N.x} ${N.y}L${U.x} ${U.y}`}
        className="celestial-evidence-divider"
      />
      <circle cx={S.x} cy={S.y} r="8" fill="#d8b873" />
      <circle cx={U.x} cy={U.y} r="7" fill="#c0d6cd" />
      <circle cx={N.x} cy={N.y} r="8" fill="#85b2c6" />
      {arrow(S, g.solar, 'celestial-evidence-force')}
      {arrow(U, g.direct, 'celestial-evidence-force')}
      {arrow(U, g.relative, 'celestial-evidence-relative')}
      <text x={S.x - 11} y={S.y + 24} textAnchor="end">
        {tr('太阳', 'Sun')}
      </text>
      <text x={U.x - 11} y={U.y - 9} textAnchor="end">
        {tr('天王星', 'Uranus')}
      </text>
      <text x={N.x + 12} y={N.y + 5}>
        {tr('候选N', 'Body N')}
      </text>
      <text x={width / 2} y={height - 5} textAnchor="middle">
        {tr('金色：相对加速度', 'Gold: relative acceleration')}
      </text>
    </svg>
  );
}
function LongitudeView({ width, height }: { width: number; height: number }) {
  const { predictionDegrees: p, observationDegrees: o } = NEPTUNE_LONGITUDE,
    x = (deg: number) => 25 + ((deg - 324.5) / 2) * (width - 50),
    y = height * 0.52,
    xp = x(p),
    xo = x(o);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={tr(
        '同一历元地心黄经的计算值与观测值相差54.75角分',
        'Same-epoch geocentric longitudes differ by54.75 arcminutes',
      )}
    >
      <path d={`M25 ${y}H${width - 25}`} className="celestial-evidence-grid" />
      <path d={`M${xp} ${y + 12}V${y + 30}H${xo}V${y + 12}`} className="celestial-evidence-gap" />
      <text x={(xp + xo) / 2} y={y + 53} textAnchor="middle">
        54.75′
      </text>
      <circle
        data-prediction="encke-longitude"
        cx={xp}
        cy={y}
        r="8"
        className="celestial-evidence-prediction"
      />
      <circle
        data-record-id="encke-longitude"
        data-record-value={o}
        cx={xo}
        cy={y}
        r="5"
        className="celestial-evidence-record"
      />
      <text x="22" y="26">
        {tr('计算', 'Calculated')} 324°58′
      </text>
      <path d={`M${xp} 37V${y - 12}`} className="celestial-evidence-divider" />
      <text x={width - 22} y={height - 9} textAnchor="end">
        {tr('观测', 'Observed')} 325°52.75′
      </text>
    </svg>
  );
}
function HistoricalSky({ width, height, count, locked, revealed }: PlotProps & { count: number }) {
  const scale = Math.min((width - 64) / 175, (height - 55) / 80),
    ox = (width + 140 * scale) / 2,
    oy = 28,
    xy = (p: { x: number; y: number }) => ({ x: ox + p.x * scale, y: oy - p.y * scale }),
    pred = xy(neptuneLinearPrediction().sky),
    records = NEPTUNE_RECORDS.map((r) => ({ ...r, point: xy(localSky(r.ra, r.dec)) }));
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={tr(
        '三夜历史坐标与事后课堂外推；横向已乘cos赤纬',
        'Three historical positions and retrospective classroom extrapolation; RA offsets include cos declination',
      )}
    >
      {[0, -60, -120].map((v) => (
        <g key={v}>
          <path
            d={`M${xy({ x: v, y: 8 }).x} 18V${height - 30}`}
            className="celestial-evidence-grid"
          />
          <text x={xy({ x: v, y: 8 }).x} y={height - 8} textAnchor="middle">
            {v}″
          </text>
        </g>
      ))}
      {[0, -30, -60].map((v) => (
        <path
          key={v}
          d={`M22 ${xy({ x: 0, y: v }).y}H${width - 18}`}
          className="celestial-evidence-grid"
        />
      ))}
      {count >= 2 && (
        <path
          d={path(records.slice(0, 2).map((r) => r.point))}
          className="celestial-evidence-gap"
        />
      )}
      {locked && (
        <>
          <path
            d={path([records[1].point, pred])}
            className="celestial-evidence-model-line"
            strokeDasharray="4 5"
          />
          <circle
            data-prediction="night 25-moving"
            cx={pred.x}
            cy={pred.y}
            r="8"
            className="celestial-evidence-prediction"
          />
          <circle
            data-prediction="night 25-stationary"
            cx={records[0].point.x}
            cy={records[0].point.y}
            r="11"
            className="celestial-evidence-stationary"
          />
        </>
      )}
      {records.slice(0, revealed ? 3 : Math.min(count, 2)).map((r, i) => (
        <g key={r.id}>
          <circle
            data-record-id={r.id}
            data-record-value={`${r.ra},${r.dec}`}
            cx={r.point.x}
            cy={r.point.y}
            r="4.5"
            className="celestial-evidence-record"
          />
          <text
            x={r.point.x + (i === 0 ? -13 : 0)}
            y={r.point.y + (i === 0 ? 5 : -16)}
            textAnchor={i === 0 ? 'end' : 'middle'}
          >
            {23 + i}
          </text>
        </g>
      ))}
      {locked && !revealed && (
        <text x={pred.x} y={pred.y + 26} textAnchor="middle">
          25?
        </text>
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
    { host, width: measured, compact } = useSignalWidth(),
    [selected, setSelected] = useState(
      film.variant === 'required-1-galileo-telescope'
        ? 1
        : Math.max(0, variants.indexOf(film.variant ?? '')),
    ),
    [manual, setManual] = useState(0.5),
    [subview, setSubview] = useState<'compare' | 'cause' | 'history'>('compare'),
    [orbit, setOrbit] = useState<OrbitCandidate>('circle'),
    [orientation, setOrientation] = useState(MARS_FITS.circle.phase),
    [mass, setMass] = useState(0),
    [nphase, setNphase] = useState(0.6),
    [locked, setLocked] = useState(false),
    [revealed, setRevealed] = useState(false),
    [night, setNight] = useState(1),
    [shortViewport, setShortViewport] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(max-height:700px)'),
      fn = () => setShortViewport(m.matches);
    fn();
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, []);
  const mode = film.watch ? Math.floor(film.chapter / 2) : selected,
    legacyPhase = film.watch ? film.chapter % 2 : 1,
    value = film.watch ? film.chapterProgress : manual,
    artworkValue =
      mode === 1 && legacyPhase === 1 && film.watch
        ? jupiterRecordProgress(film.chapterTime, browserLocale())
        : value,
    moonDay = legacyPhase === 0 ? value * 16 : jupiterObservation(artworkValue).day,
    width = Math.min(800, measured),
    height = compact ? (shortViewport ? 180 : 250) : 320,
    d = celestialEvidenceShot(film.chapter, film.chapterTime, browserLocale()),
    evidence = mode === 0 || mode === 2,
    view = film.watch
      ? d.view
      : mode === 0
        ? 'mars'
        : subview === 'history'
          ? 'sky'
          : subview === 'cause'
            ? 'force'
            : 'uranus',
    activeLocked = film.watch ? d.locked : locked,
    activeRevealed = film.watch ? d.revealed : revealed,
    activeOrbit = film.watch ? ('candidate' in d ? (d.candidate ?? 'circle') : 'circle') : orbit,
    activeOrientation = film.watch ? MARS_FITS[activeOrbit].phase : orientation,
    activeMass = film.watch ? ('mass' in d ? (d.mass ?? 1) : 1) : mass,
    activePhase = film.watch ? 0.6 : nphase,
    choice = useMemo(
      () =>
        URANUS_CANDIDATES.find((c) => c.massScale === activeMass && c.phase === activePhase) ??
        URANUS_BEST,
      [activeMass, activePhase],
    ),
    comparison = useMemo(
      () => marsComparison(activeOrbit, activeOrientation),
      [activeOrbit, activeOrientation],
    ),
    count = film.watch ? d.count : night;
  const reset = () => {
      setLocked(false);
      setRevealed(false);
    },
    changeOrbit = (c: OrbitCandidate) => {
      setOrbit(c);
      setOrientation(MARS_FITS[c].phase);
      reset();
    },
    names = [
      ['第谷观测', 'Tycho’s observations'],
      ['木星卫星', 'Jupiter’s moons'],
      ['海王星预测', 'Neptune prediction'],
      ['哈雷回归', 'Halley’s return'],
    ],
    provenance =
      mode === 0
        ? tr('固定合成记录 · 非第谷实测', 'Fixed teaching data · not Tycho’s')
        : view === 'sky' || view === 'longitude'
          ? tr('1846 · Encke 观测记录', '1846 · Encke observation report')
          : tr('固定合成记录 · 非1846星历', 'Fixed teaching data · not 1846'),
    title =
      view === 'records'
        ? 'overlay' in d && d.overlay
          ? tr('圆模型接受同一组记录检验', 'The circle faces the same records')
          : tr('先固定每次观察的方向', 'Fix each observed direction first')
        : view === 'mars'
          ? `${activeOrbit === 'circle' ? tr('圆轨道', 'Circle') : tr('椭圆轨道', 'Ellipse')} · ${activeLocked ? (activeRevealed ? tr('揭晓新记录', 'New records revealed') : tr('预测已锁定', 'Prediction locked')) : tr('只比较前5次', 'Compare first 5 only')}`
          : view === 'force'
            ? tr('太阳也受到远方行星的吸引', 'The distant body also pulls the Sun')
            : view === 'longitude'
              ? tr('同历元 · 地心黄经', 'Same epoch · geocentric longitude')
              : view === 'sky'
                ? activeLocked
                  ? tr('课堂外推 · 非当年反演', 'Classroom test · not 1846 inversion')
                  : tr('光点固定，还是在移动？', 'Fixed point, or a moving body?')
                : `${tr('额外质量', 'Extra mass')} ${activeMass.toFixed(1)} · ${activeLocked ? (activeRevealed ? tr('揭晓后3次', 'Last 3 revealed') : tr('预测已锁定', 'Prediction locked')) : tr('前5次记录', 'First 5 records')}`;
  return (
    <div
      className={evidence ? 'celestial-evidence' : 'astronomy-lab'}
      ref={host}
      data-evidence-view={view}
      data-locked={activeLocked}
      data-revealed={activeRevealed}
    >
      {!film.watch && (
        <div className="celestial-evidence-tabs">
          {names.map((n, j) => (
            <button
              key={j}
              type="button"
              aria-pressed={mode === j}
              onClick={() => {
                setSelected(j);
                setSubview('compare');
                reset();
                setNight(1);
              }}
            >
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      {evidence ? (
        <>
          <p className="celestial-evidence-provenance">{provenance}</p>
          <div className="celestial-evidence-surface">
            <p className="celestial-evidence-title">{title}</p>
            {view === 'records' && (
              <MarsRecords
                width={width}
                height={height}
                count={count}
                overlay={'overlay' in d && Boolean(d.overlay)}
              />
            )}
            {view === 'mars' && (
              <MarsPlot
                width={width}
                height={height}
                candidate={activeOrbit}
                phase={activeOrientation}
                locked={activeLocked}
                revealed={activeRevealed}
              />
            )}
            {view === 'uranus' && (
              <UranusPlot
                width={width}
                height={height}
                choice={choice}
                locked={activeLocked}
                revealed={activeRevealed}
              />
            )}
            {view === 'force' && (
              <ForceView width={width} height={height} mass={activeMass} phase={activePhase} />
            )}
            {view === 'longitude' && <LongitudeView width={width} height={height} />}
            {view === 'sky' && (
              <HistoricalSky
                width={width}
                height={height}
                count={count}
                locked={activeLocked}
                revealed={activeRevealed}
              />
            )}
            {view !== 'force' && <PlotLegend />}
          </div>
          <p className="celestial-evidence-stat" data-view={view}>
            {view === 'mars'
              ? `${tr('前5次均方根偏差', 'First 5 RMS error')} ${comparison.trainingRMSE.toFixed(2)}′`
              : view === 'uranus'
                ? `${tr('前5次均方根偏差', 'First 5 RMS error')} ${choice.trainingRMSE.toFixed(2)}″`
                : view === 'longitude'
                  ? '1846-09-23.5'
                  : view === 'sky'
                    ? activeRevealed
                      ? tr('第3夜：接近运动预测', 'Night 3: near the moving prediction')
                      : activeLocked
                        ? tr('空心：已锁定的第3夜预测', 'Hollow: locked prediction for night 3')
                        : count === 1
                          ? tr('23日 · 第一条记录', '23 Sept · first record')
                          : tr('24日 · 光点已换位置', '24 Sept · the point has moved')
                    : view === 'force'
                      ? tr(
                          '相对摄动 = 天王星所受 − 太阳所受',
                          'Relative perturbation = Uranus pull − Sun pull',
                        )
                      : tr(
                          '角度相对同一个固定参考方向',
                          'Angles use one fixed reference direction',
                        )}
          </p>
          {!film.watch && (
            <div className="celestial-evidence-controls">
              {mode === 2 && (
                <Segments
                  label={tr('证据视图', 'Evidence view')}
                  value={subview}
                  onChange={(v) => {
                    setSubview(v);
                    reset();
                    setNight(1);
                  }}
                  options={[
                    { value: 'compare', label: tr('合成记录', 'Teaching records') },
                    { value: 'cause', label: tr('引力原因', 'Gravity cause') },
                    { value: 'history', label: tr('历史三夜', 'Three historical nights') },
                  ]}
                />
              )}
              {mode === 0 && (
                <>
                  <Segments
                    label={tr('轨道候选', 'Orbit candidate')}
                    value={orbit}
                    onChange={changeOrbit}
                    options={[
                      { value: 'circle', label: tr('圆轨道', 'Circle') },
                      { value: 'ellipse', label: tr('椭圆轨道', 'Ellipse') },
                    ]}
                  />
                  <Range
                    label={tr('初相位 / rad', 'Initial phase / rad')}
                    min={-0.08}
                    max={0.32}
                    step={0.0005}
                    value={orientation}
                    onChange={(v) => {
                      setOrientation(v);
                      reset();
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOrientation(MARS_FITS[orbit].phase);
                      reset();
                    }}
                  >
                    {tr('只用前5次拟合', 'Fit first 5 only')}
                  </button>
                </>
              )}
              {mode === 2 && subview !== 'history' && (
                <>
                  <Segments
                    label={tr('示例质量倍数', 'Example mass scale')}
                    value={String(mass)}
                    onChange={(v) => {
                      setMass(Number(v));
                      reset();
                    }}
                    options={[0, 0.5, 1, 1.5].map((v) => ({ value: String(v), label: String(v) }))}
                  />
                  <Segments
                    label={tr('候选初相位 / rad', 'Candidate phase / rad')}
                    value={String(nphase)}
                    onChange={(v) => {
                      setNphase(Number(v));
                      reset();
                    }}
                    options={[-0.4, 0.6, 1.6].map((v) => ({ value: String(v), label: String(v) }))}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMass(URANUS_BEST.massScale);
                      setNphase(URANUS_BEST.phase);
                      setSubview('compare');
                      reset();
                    }}
                  >
                    {tr('比较12个候选：只用前5次', 'Compare 12 candidates: first 5 only')}
                  </button>
                </>
              )}
              {mode === 2 && subview === 'history' ? (
                <div className="celestial-evidence-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setNight(1);
                      reset();
                    }}
                  >
                    {tr('回到第一夜', 'Reset to night 1')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNight(2);
                      reset();
                    }}
                  >
                    {tr('查看第二夜', 'Show night 2')}
                  </button>
                  <button
                    type="button"
                    disabled={night < 2}
                    onClick={() => {
                      setLocked(true);
                      setRevealed(false);
                    }}
                  >
                    {tr('锁定第3夜预测', 'Lock night 3 prediction')}
                  </button>
                  <button
                    type="button"
                    disabled={!locked}
                    onClick={() => {
                      setRevealed(true);
                      setNight(3);
                    }}
                  >
                    {tr('揭晓第三夜', 'Reveal night 3')}
                  </button>
                </div>
              ) : (
                subview !== 'cause' && (
                  <div className="celestial-evidence-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setLocked(true);
                        setRevealed(false);
                      }}
                    >
                      {tr('锁定预测', 'Lock prediction')}
                    </button>
                    <button type="button" disabled={!locked} onClick={() => setRevealed(true)}>
                      {tr('揭晓保留记录', 'Reveal unused records')}
                    </button>
                    <button type="button" onClick={reset}>
                      {tr('重新比较', 'Compare again')}
                    </button>
                  </div>
                )
              )}
              <details>
                <summary>{tr('数据来源、单位与模型边界', 'Data, units and model limits')}</summary>
                <p>
                  {tr(
                    '火星与天王星表是预先冻结的合成教材例，不是历史实测。只用前5次记录比较；锁定后才揭开余下记录。天王星为日心方向差，质量和初相位仅在给定候选中比较，其他初始条件固定。',
                    'The Mars and Uranus tables are frozen synthetic teaching examples. Only the first 5 records are used for comparison; the remaining records are revealed after locking. Uranus residuals are heliocentric, with other initial conditions fixed and a limited mass/phase grid.',
                  )}
                </p>
                <p>
                  {tr(
                    '1846三夜坐标来自Encke原始报告，保留柏林平时。局部天图横向为赤经差乘平均赤纬余弦；第三夜线性外推是事后课堂检验，不是勒维耶的计算。',
                    'The three 1846 positions come from Encke’s original report, retaining mean Berlin time. The local chart multiplies RA differences by the cosine of mean declination. The third-night linear extrapolation is a retrospective classroom test, not Le Verrier’s calculation.',
                  )}
                </p>
              </details>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="modern-readout">
            {mode === 1
              ? `${tr('连续观察', 'Repeated observations')} · ${moonDay.toFixed(1)} ${tr('天', 'days')}`
              : `r = ${halleyOrbit(value).r.toFixed(2)} AU · T ≈75.3 ${tr('年', 'years')}`}
          </div>
          <CelestialArtwork
            mode={mode}
            phase={legacyPhase}
            value={artworkValue}
            cometEvidence={cometEvidenceStage(
              film.chapter,
              film.chapterTime,
              browserLocale(),
              film.watch,
            )}
          />
          <p className="modern-key">
            {mode === 1
              ? tr(
                  '几颗光点反复围绕木星换位，形成连续证据。',
                  'Repeated changes around Jupiter provide a connected set of observations.',
                )
              : tr(
                  '相似的多次记录，最终接受未来回归的检验。',
                  'Similar past records lead to a prediction tested by a future return.',
                )}
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
