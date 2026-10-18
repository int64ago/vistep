import { useMemo, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  moonEarthTest,
  torsionBalance,
  cannonOrbit,
  EARTH_RADIUS,
} from '../../models/gravity-measurements';
import '../../styles/modern-labs.css';
import '../../styles/astronomy-labs.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const path = (p: { x: number; y: number }[]) =>
  p.map((a, i) => `${i ? 'L' : 'M'}${a.x} ${a.y}`).join(' ');
export function GravityArtwork({
  mode = 0,
  phase = 0,
  value = 0.5,
  speed = 7.73,
  mass = 158,
  side = 1,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  speed?: number;
  mass?: number;
  side?: number;
}) {
  const moon = moonEarthTest(),
    torsion = torsionBalance(side, mass, value * 6000),
    orbit = useMemo(() => cannonOrbit(speed), [speed]),
    p =
      orbit.points[
        Math.min(orbit.points.length - 1, Math.floor(value * (orbit.points.length - 1)))
      ],
    scale = 84 / Math.max(EARTH_RADIUS, ...orbit.points.map((p) => p.r)),
    project = (x: number, y: number) => ({ x: 170 + x * scale, y: 151 - y * scale }),
    cp = project(p.x, p.y),
    displayTheta = torsion.theta;
  return (
    <svg
      className="astronomy-art gravity-art"
      viewBox="0 0 340 300"
      role="img"
      aria-label={tr(
        '月地检验、扭秤和绕地飞行',
        'Moon–Earth comparison, torsion balance and orbital flight',
      )}
    >
      {mode === 0 && (
        <>
          <circle cx="78" cy="94" r="32" fill="#769a9d" />
          <path d="M59 68Q86 79 74 90T99 113" stroke="#aec1a0" strokeWidth="8" fill="none" />
          <circle cx="280" cy="83" r="9" fill="#d2cbb5" />
          <path d="M122 94H256M248 89L256 94L248 99" stroke="#c3ae86" />
          <text x="166" y="68" textAnchor="middle" fontSize="20" fill="#d0d6c9">
            r ≈60 R
          </text>
          <path d="M58 160H113V251H58ZM230 160H285V251H230Z" fill="#1b323d" stroke="#69868b" />
          {[0, 1, 2, 3, 4].map((j) => (
            <g key={j}>
              <path d={`M52 ${170 + j * 18}H58M285 ${170 + j * 18}H291`} stroke="#8aa39d" />
            </g>
          ))}
          <circle cx="85" cy={173 + 68 * value ** 2} r="5" fill="#d3b78a" />
          <circle cx="257" cy={173 + 68 * value ** 2} r="5" fill="#d3b78a" />
          <text x="85" y="284" textAnchor="middle" fontSize="20" fill="#d0d6c9">
            1 s · 4.91 m
          </text>
          <text x="257" y="284" textAnchor="middle" fontSize="20" fill="#d0d6c9">
            60 s · {((moon.predicted * 60 ** 2) / 2).toFixed(2)} m
          </text>
          {phase === 1 && <path d="M116 206H226" stroke="#c3ae86" strokeDasharray="3 4" />}
        </>
      )}
      {mode === 1 && (
        <>
          <rect x="30" y="35" width="280" height="215" rx="22" fill="#213942" stroke="#6c878a" />
          <path d="M170 15V77" stroke="#c2baa4" strokeWidth="2" />
          <ellipse cx="170" cy="144" rx="124" ry="77" fill="#1a3039" stroke="#789391" />
          {[-1, 1].map((s) => (
            <g key={s}>
              <circle
                cx={170 + s * 92}
                cy={144 - s * side * 23.5}
                r={15 * Math.cbrt(mass / 158)}
                fill="#8c9c99"
                stroke="#d3d6c3"
              />
              <path
                d={`M${170 + s * 92} ${144 - s * side * 23.5}L${170 + s * 92} 248`}
                stroke="#536c71"
                strokeDasharray="2 5"
              />
            </g>
          ))}
          <g transform={`rotate(${(-displayTheta * 180) / Math.PI} 170 144)`}>
            <path d="M77 144H263" stroke="#c5bda4" strokeWidth="3" />
            <circle cx="77" cy="144" r="4" fill="#d7bc86" />
            <circle cx="263" cy="144" r="4" fill="#d7bc86" />
          </g>
          <circle cx="170" cy="144" r="4" fill="#d0d3be" />
          <path d="M170 77V144" stroke="#c2baa4" strokeWidth="1.5" />
          {Array.from({ length: 21 }, (_, j) => (
            <path key={j} d={`M${75 + j * 9.5} 262v${j % 5 === 0 ? 10 : 5}`} stroke="#92aaa2" />
          ))}
          <path d={`M${170 + torsion.theta * 4500} 250v27`} stroke="#dfc18a" strokeWidth="2" />
          <text x="170" y="296" fontSize="19" fill="#ccd6c6" textAnchor="middle">
            {tr('下方读数放大显示', 'Readout enlarged below')}
          </text>
        </>
      )}
      {mode === 2 && (
        <>
          <circle cx="170" cy="151" r={EARTH_RADIUS * scale} fill="#658d98" />
          <path d={path(orbit.points.map((p) => project(p.x, p.y)))} stroke="#4f7781" fill="none" />
          <path
            d={path(
              orbit.points
                .slice(0, Math.floor(value * (orbit.points.length - 1)) + 1)
                .map((p) => project(p.x, p.y)),
            )}
            stroke="#d0bb8d"
            fill="none"
            strokeWidth="2.5"
          />
          <circle cx={cp.x} cy={cp.y} r="4.5" fill="#eee0b5" />
          <path
            d={`M${cp.x} ${cp.y}L${cp.x + (170 - cp.x) * 0.25} ${cp.y + (151 - cp.y) * 0.25}`}
            stroke="#8cbfb7"
            strokeWidth="2"
          />
          <path
            d={`M168 ${151 - (EARTH_RADIUS + 3e5) * scale}h15`}
            stroke="#e0cab0"
            strokeWidth="5"
          />
          <text x="170" y="264" textAnchor="middle" fontSize="20" fill="#cad7c9">
            {orbit.hit
              ? tr('轨迹与地面相交', 'Surface intercept')
              : tr('持续自由落体', 'Continuous free fall')}
          </text>
          <text x="170" y="290" textAnchor="middle" fontSize="18" fill="#a8bdb8">
            {tr('无空气 · 发射高度300 km', 'Vacuum · launch altitude 300 km')}
          </text>
        </>
      )}
    </svg>
  );
}
const ids = ['required-2-moon-earth-test', 'required-2-cavendish', 'required-2-newton-cannon'];
export default function GravityMeasurements() {
  const film = useShowcase(),
    [selected, setSelected] = useState(Math.max(0, ids.indexOf(film.variant ?? ''))),
    [manual, setManual] = useState(0.6),
    [mass, setMass] = useState(158),
    [side, setSide] = useState(1),
    [speed, setSpeed] = useState(7.73);
  const mode = film.watch ? Math.floor(film.chapter / 2) : selected,
    phase = film.watch ? film.chapter % 2 : 1,
    value = film.watch ? film.chapterProgress : manual,
    v = film.watch ? (phase === 0 ? 4 : cannonOrbit().circularSpeed) : speed,
    sign = film.watch ? (phase === 0 ? 1 : -1) : side,
    effectiveMass = film.watch ? 158 : mass,
    t = torsionBalance(sign, effectiveMass, value * 6000),
    names = [
      ['月地检验', 'Moon–Earth test'],
      ['卡文迪许扭秤', 'Cavendish balance'],
      ['牛顿大炮', 'Newton’s cannon'],
    ];
  return (
    <div className="astronomy-lab">
      {!film.watch && (
        <div className="modern-paths">
          {names.map((n, i) => (
            <button type="button" key={i} aria-pressed={mode === i} onClick={() => setSelected(i)}>
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {mode === 0
          ? `a = ${moonEarthTest().predicted.toFixed(5)} m/s² · 4π²r/T² = ${moonEarthTest().observed.toFixed(5)}`
          : mode === 1
            ? `θ = ${(t.theta * 1e3).toFixed(2)} mrad · M = ${effectiveMass} kg`
            : `v₀ = ${v.toFixed(2)} km/s`}
      </div>
      <GravityArtwork
        mode={mode}
        phase={phase}
        value={value}
        mass={effectiveMass}
        side={sign}
        speed={v}
      />
      <p className="modern-key">
        {
          [
            tr(
              '按距离平方减弱的地球引力，与月球所需向心加速度接近。',
              'Inverse-square Earth gravity agrees approximately with the Moon’s centripetal acceleration.',
            ),
            tr(
              '微弱引力使细丝扭转，扭转力矩逐渐平衡引力力矩。',
              'Weak gravitational torque twists the fibre until restoring torque balances it.',
            ),
            tr(
              '足够快的横向运动，使自由落体不断绕过地表。',
              'Sufficient tangential speed lets free fall continue around Earth.',
            ),
          ][mode]
        }
      </p>
      {!film.watch && (
        <div className="modern-explore">
          <Range
            label={tr('观察进度', 'Observation progress')}
            value={manual}
            min={0}
            max={1}
            step={0.005}
            onChange={setManual}
          />
          {mode === 1 && (
            <>
              <Range
                label={tr('吸引球质量 / kg', 'Attractor mass / kg')}
                value={mass}
                min={79}
                max={200}
                step={1}
                onChange={setMass}
              />
              <button type="button" onClick={() => setSide(-side)}>
                {tr('把大球换到另一侧', 'Move attractors to the other side')}
              </button>
            </>
          )}
          {mode === 2 && (
            <Range
              label={tr('初速度 / km/s', 'Initial speed / km/s')}
              value={speed}
              min={0}
              max={10.5}
              step={0.01}
              onChange={setSpeed}
            />
          )}
        </div>
      )}
    </div>
  );
}
