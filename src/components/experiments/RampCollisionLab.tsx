import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  rampCollisionSetup,
  rampCollisionState,
  rampBallPath,
} from '../../models/ramp-collision-lab';
import '../../styles/ramp-collision-lab.css';
export default function RampCollisionLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', ''),
    [mode, setMode] = useState('collision'),
    [height, setHeight] = useState(0.12),
    [reference, setReference] = useState(0.12),
    [mass, setMass] = useState(0.02),
    [elastic, setElastic] = useState(0.9),
    [clock, setClock] = useState(1.4),
    c = film.chapter,
    p = Math.min(1, film.chapterProgress / 0.8),
    h = film.watch ? (c === 5 ? 0.075 : 0.12) : height,
    href = film.watch ? 0.12 : reference,
    m = film.watch ? 0.02 : mass,
    e = film.watch ? 0.9 : elastic,
    s = useMemo(() => rampCollisionSetup(h, href, m, e), [h, href, m, e]),
    baseline = film.watch ? c === 1 : mode === 'reference',
    compare = film.watch ? c >= 3 : mode === 'compare',
    visualRamp = baseline ? s.reference : s.ramp,
    duration = baseline
      ? s.reference.duration + (2 * s.radius) / s.reference.speed + s.flightTime
      : s.endTime,
    tm = film.watch ? (c === 0 ? 0 : compare ? duration : duration * p) : Math.min(clock, duration),
    state = rampCollisionState(s, tm, !baseline),
    S = 270,
    ox = 153,
    oy = 143,
    floor = oy + (s.drop + s.radius) * S,
    P = (q: { x: number; y: number }) => ({ x: ox + q.x * S, y: oy + q.y * S }),
    ball1 = P(state.incident),
    ball2 = P(state.target),
    r = s.radius * S,
    showReference =
      compare ||
      (!baseline && (film.watch ? c >= 2 : mode === 'compare')) ||
      (baseline && state.incident.landed),
    matched = Math.abs(h - href) < 1e-7,
    curve = (speed: number, progress = 1) =>
      rampBallPath(s, speed, progress)
        .map((q, i) => {
          const a = P(q);
          return `${i ? 'L' : 'M'}${a.x} ${a.y}`;
        })
        .join(' '),
    trackPath = (depth: number) =>
      visualRamp.trace
        .map((q, i) => {
          const slope = (-2 * visualRamp.height * q.x) / visualRamp.length ** 2,
            n = Math.hypot(1, slope),
            a = P({ x: q.x - 2 * s.radius - (depth * slope) / n, y: q.y + depth / n });
          return `${i ? 'L' : 'M'}${a.x} ${a.y}`;
        })
        .join(' ') + `L${ox} ${oy + depth * S}`,
    before = s.before,
    after = s.after;
  // Spread labels, never the computed landing points. Close marks share a fan of leaders.
  const landingMarks = [
    { label: 'O', distance: 0, visible: true },
    { label: 'M', distance: s.M, visible: !baseline && (compare || state.incident.landed) },
    { label: 'P', distance: s.P, visible: showReference },
    { label: 'N', distance: s.N, visible: !baseline && (compare || state.target.landed) },
  ]
    .filter((mark) => mark.visible)
    .map((mark) => ({ ...mark, x: ox + mark.distance * S, labelX: ox + mark.distance * S }))
    .sort((a, b) => a.x - b.x);
  for (let first = 0; first < landingMarks.length;) {
    let end = first + 1;
    while (end < landingMarks.length && landingMarks[end].x - landingMarks[end - 1].x < 36) end++;
    const group = landingMarks.slice(first, end),
      halfWidth = ((group.length - 1) * 36) / 2,
      center = Math.max(
        20 + halfWidth,
        Math.min(420 - halfWidth, group.reduce((sum, mark) => sum + mark.x, 0) / group.length),
      );
    group.forEach((mark, index) => {
      mark.labelX = center - halfWidth + index * 36;
    });
    first = end;
  }
  return (
    <section className="ramp-collision-lab">
      <header>
        <p>
          {t(
            c === 5 && film.watch
              ? '释放高度变了，比较就失去同一基准'
              : baseline
                ? '先拿走靶球，记录入射球的落点P'
                : compare
                  ? '用同一铅垂原点，比较三个水平距离'
                  : '同样大小的两球，在水平出口发生正碰',
          )}
        </p>
        <span>{t('深色入射球40g · 浅色靶球更轻 · 模型示例记录')}</span>
      </header>
      <div className="ramp-collision-stage">
        <svg
          viewBox="0 0 440 400"
          role="img"
          aria-label={t('重球沿斜槽滚下，与同直径轻球碰撞；铅垂线确定O点，地面纸张记录M、P、N落点')}
        >
          <defs>
            <radialGradient id={`${id}-heavy`} cx=".3" cy=".25">
              <stop stopColor="#dacba6" />
              <stop offset="1" stopColor="#a8936c" />
            </radialGradient>
            <radialGradient id={`${id}-light`} cx=".3" cy=".25">
              <stop stopColor="#edf0db" />
              <stop offset="1" stopColor="#b9cba5" />
            </radialGradient>
            <clipPath id={`${id}-detail`}>
              <rect x="282" y="28" width="128" height="96" rx="28" />
            </clipPath>
          </defs>
          <path d="M52 57V325M23 327H105" stroke="#aabb9f" strokeWidth="6" strokeLinecap="round" />
          <path d={`M52 ${oy - visualRamp.height * S + 17}h22`} stroke="#a8ba9a" strokeWidth="5" />
          <path
            d={trackPath(s.radius + 4 / S)}
            stroke="#bccca9"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path d={trackPath(s.radius + 1 / S)} stroke="#dbe3c9" strokeWidth="2" fill="none" />
          <path
            d={`M${ox} ${oy + 13}V${floor - 5}`}
            stroke="#a7b49b"
            strokeDasharray="3 4"
            strokeWidth="1.3"
          />
          <path d={`M${ox} ${floor - 12}l-4 7h8Z`} fill="#a9997c" />
          <path
            d={`M${ox - 16} ${floor}Q270 ${floor - 3} 419 ${floor}v27q-145-5-282 0Z`}
            fill="#efe9d5"
            stroke="#d8d9be"
          />
          <path d={`M${ox - 16} ${floor + 3}H418`} stroke="#c9bea0" opacity=".6" />
          <path
            d={`M${ox - 110} ${oy - href * S}h28`}
            stroke="#bda579"
            strokeWidth="1.6"
            strokeDasharray="3 3"
          />
          <path d={`M${ox - 80} ${oy - href * S}V${oy}`} stroke="#bda579" strokeWidth="1" />
          <path d={`M${ox + 12} ${oy + 6}h20v-3`} stroke="#a4b794" fill="none" />
          <circle cx={ox + 22} cy={oy + 5} r="1.5" fill="#8da17c" />
          {!compare && !baseline && Math.abs(tm - state.impact) < 0.13 && (
            <g>
              <rect
                x="282"
                y="28"
                width="128"
                height="96"
                rx="28"
                fill="#f0eddb"
                stroke="#d5dec3"
              />
              <g clipPath={`url(#${id}-detail)`}>
                <path
                  d={`M282 ${70 + r * 3}H${350 + s.radius * S * 3}`}
                  stroke="#c3d0af"
                  strokeWidth="4"
                />
                {[state.incident, state.target].map((q, i) => (
                  <circle
                    key={i}
                    cx={350 + (q.x + s.radius) * S * 3}
                    cy={70 + q.y * S * 3}
                    r={r * 3}
                    fill={`url(#${id}-${i ? 'light' : 'heavy'})`}
                    stroke={i ? '#a2b78e' : '#a38c66'}
                  />
                ))}
              </g>
              <text x="346" y="155" textAnchor="middle" fontSize="24" fill="#9daa87">
                ×3
              </text>
            </g>
          )}
          {showReference && (
            <path
              d={curve(s.reference.speed)}
              fill="none"
              stroke="#a7b998"
              strokeWidth="1.5"
              strokeDasharray="4 5"
            />
          )}
          {(compare || state.collided) && !baseline && (
            <>
              <path
                d={curve(s.v1, compare ? 1 : state.incident.time / s.flightTime)}
                fill="none"
                stroke="#b4a17a"
                strokeWidth="1.8"
              />
              <path
                d={curve(s.v2, compare ? 1 : state.target.time / s.flightTime)}
                fill="none"
                stroke="#b5c8a1"
                strokeWidth="1.8"
              />
            </>
          )}
          {!compare && (
            <>
              <circle
                cx={ball1.x}
                cy={ball1.y}
                r={r}
                fill={`url(#${id}-heavy)`}
                stroke="#a08d69"
                strokeWidth=".9"
              />
              {!baseline && (
                <circle
                  cx={ball2.x}
                  cy={ball2.y}
                  r={r}
                  fill={`url(#${id}-light)`}
                  stroke="#9cb68b"
                  strokeWidth=".9"
                />
              )}
            </>
          )}
          {landingMarks.map(({ label, x, labelX }) => (
            <g key={label}>
              <circle
                cx={x}
                cy={floor}
                r="2.7"
                fill={label === 'P' ? '#93a783' : label === 'M' ? '#ad9671' : '#aec29b'}
              />
              <path
                d={`M${x} ${floor + 2}V${floor + 12}L${labelX} ${floor + 28}V${floor + 32}`}
                stroke="#b3c0a2"
                fill="none"
              />
              <text x={labelX} y={floor + 53} textAnchor="middle" fontSize="24" fill="#8b9d76">
                {label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="ramp-collision-settings">
        <span>m₁ = 40 g</span>
        <span>m₂ = {(m * 1000).toFixed(0)} g</span>
        <span>
          {t('单球释放高度')} {href.toFixed(3)} m
        </span>
        <span>
          {t('碰撞释放高度')} {h.toFixed(3)} m
        </span>
      </div>
      {compare && (
        <>
          <div className="ramp-collision-distances">
            <span>OP = {s.P.toFixed(3)} m</span>
            <span>OM = {s.M.toFixed(3)} m</span>
            <span>ON = {s.N.toFixed(3)} m</span>
          </div>
          <div className="ramp-collision-equation">m₁·OP {matched ? '=' : '≠'} m₁·OM + m₂·ON</div>
          <div className="ramp-collision-weighted">
            <div>
              <span>m₁·OP</span>
              <b>{(before * 1000).toFixed(2)} g·m</b>
              <i style={{ width: '100%' }} />
            </div>
            <div>
              <span>m₁·OM + m₂·ON</span>
              <b>{(after * 1000).toFixed(2)} g·m</b>
              <i style={{ width: `${Math.min(1, after / before) * 100}%` }} />
            </div>
          </div>
        </>
      )}
      <p className="ramp-collision-cause">
        {t(
          !matched
            ? '两次释放高度不同，P已不能代表本次碰撞前速度；真实碰撞动量仍守恒。'
            : baseline
              ? '从同一高度反复释放，P记录碰撞前的水平速度基准。'
              : '相同下落高度、相同初始竖直速度，飞行时间相同；射程可以替代速度比。',
        )}
      </p>
      {!film.watch && (
        <div className="ramp-collision-controls">
          <Segments
            label={t('操作步骤')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'reference', label: t('拿走靶球') },
              { value: 'collision', label: t('放回靶球') },
              { value: 'compare', label: t('比较落点') },
            ]}
          />
          <Range
            label={t('单球释放高度')}
            value={reference}
            min={0.06}
            max={0.18}
            step={0.005}
            unit="m"
            onChange={setReference}
          />
          <Range
            label={t('碰撞释放高度')}
            value={height}
            min={0.06}
            max={0.18}
            step={0.005}
            unit="m"
            onChange={setHeight}
          />
          <Range
            label={t('靶球质量')}
            value={mass}
            min={0.012}
            max={0.035}
            step={0.001}
            unit="kg"
            onChange={setMass}
          />
          <Range
            label={t('恢复系数')}
            value={elastic}
            min={0.65}
            max={1}
            step={0.01}
            onChange={setElastic}
          />
          {!compare && (
            <Range
              label={t('模型时间')}
              value={Math.min(clock, duration)}
              min={0}
              max={duration}
              step={0.01}
              unit="s"
              onChange={setClock}
            />
          )}
        </div>
      )}
      <p className="ramp-collision-note">
        {t(
          '接触时球心相距一个直径；入射球随后经过极短水平托口，两球从同一出口起飞。忽略托口摩擦、空气阻力和碰撞时的外部水平冲量。',
        )}
      </p>
    </section>
  );
}
