import { useMemo, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import { caughtBalloon, crashTrace } from '../../models/impulse-contact-lab';
import '../../styles/modern-labs.css';
import '../../styles/impulse-contact-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
export function ImpulseArtwork({
  mode = 0,
  filled = true,
  duration = 0.3,
  speed = 3,
  progress = 0.5,
}: {
  mode?: number;
  filled?: boolean;
  duration?: number;
  speed?: number;
  progress?: number;
}) {
  const c = useMemo(() => crashTrace(duration, 50), [duration]),
    time = mode === 0 ? progress * duration : progress * 0.6,
    b = caughtBalloon(filled, speed, duration, time),
    sample = c.trace[Math.min(1200, Math.floor(time / 0.0005))],
    forceScale = mode === 0 ? 50 : 550000,
    trace =
      mode === 0
        ? Array.from({ length: 151 }, (_, j) => ({
            t: (j / 150) * duration,
            F: -caughtBalloon(filled, speed, duration, (j / 150) * duration).force,
          }))
        : c.trace.filter((_, j) => j % 8 === 0).map((s) => ({ t: s.t, F: -s.carForce })),
    span = 0.6,
    bodyX = 28 + sample.car.displacement * 48,
    front = bodyX + 140,
    wall = 28 + 140 + 1.4 * 48,
    px = mode === 0 ? 95 + b.displacement * 100 : bodyX + 75 + sample.q * 48,
    radius = filled ? 51 : 13,
    contactRadius = filled ? radius * (1 - 0.13 * Math.sin(Math.PI * progress)) : radius;
  return (
    <svg
      className="impulse-contact-art"
      viewBox="0 0 340 350"
      role="img"
      aria-label={tr(
        '投接充气与放气气球、汽车与理想乘员碰撞模型',
        'Catching inflated and empty balloons, vehicle and ideal occupant stop',
      )}
    >
      {mode === 0 ? (
        <>
          <path d="M23 176H316" stroke="#c3d0bd" />
          {filled ? (
            <ellipse
              cx={px}
              cy="102"
              rx={contactRadius}
              ry={radius / Math.sqrt(1 - 0.13 * Math.sin(Math.PI * progress))}
              fill="#c7d9bb"
              stroke="#7c9c72"
              strokeWidth="2"
            />
          ) : (
            <path
              d={`M${px - 15} 104q12-24 25-4l-7 20-17-4Z`}
              fill="#c7d9bb"
              stroke="#7c9c72"
              strokeWidth="2"
            />
          )}
          <path
            d={`M${px + contactRadius + 9} 70q-12 2-13 19v31q0 14 13 18m-3-54v35m10-42v40`}
            fill="none"
            stroke="#b59b7f"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {b.velocity > 0.02 && (
            <path d={`M${px} 44h${b.velocity * 22}m-7-4 7 4-7 4`} stroke="#8aa176" fill="none" />
          )}
          <text x="170" y="212" textAnchor="middle" fontSize="20" fill="#657d64">
            {tr('空气质量', 'Enclosed air')} = {b.airMass.toFixed(3)} kg
          </text>
        </>
      ) : (
        <>
          <path d={`M${wall} 25V185`} stroke="#8e9e8a" strokeWidth="9" />
          <path
            d={`M${bodyX} 128h18l22-45h62l38 30v42H${bodyX}Z`}
            fill="#bbccae"
            stroke="#789373"
            strokeWidth="2"
          />
          <path
            d={`M${front} 115L${wall - 5} 123v30H${front}Z`}
            fill="#a5b99b"
            stroke="#789373"
            strokeWidth="2"
          />
          <path d={`M${bodyX + 48} 88h45l24 29h-83Z`} fill="#e5eddd" stroke="#97af8b" />
          <circle cx={bodyX + 30} cy="157" r="16" fill="#6d8067" />
          <circle cx={bodyX + 121} cy="157" r="16" fill="#6d8067" />
          <path
            d={`M${bodyX + 70} 105v39h25M${bodyX + 70} 114L${px} 108`}
            fill="none"
            stroke="#899e7b"
            strokeWidth="6"
          />
          <circle cx={px} cy="99" r="9" fill="#b99e76" />
          <path
            d={`M${px} 109v20l17 9M${px} 114l19 5`}
            fill="none"
            stroke="#b99e76"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d={`M${bodyX + 71} 105L${px + 5} 124L${bodyX + 87} 145`}
            fill="none"
            stroke="#617e63"
            strokeWidth="2"
          />
          <path d="M20 178H317" stroke="#b6c7ac" />
          <text x="170" y="211" textAnchor="middle" fontSize="20" fill="#657d64">
            {tr('乘员约束力', 'Occupant restraint')} {Math.abs(sample.restraint).toFixed(0)} N
          </text>
        </>
      )}
      <path d="M25 239V319H315" fill="none" stroke="#afbea7" />
      <text x="30" y="238" fontSize="20" fill="#657d64">
        {mode ? '550 kN' : '50 N'}
      </text>
      <path
        d={trace
          .map(
            (s, j) => `${j ? 'L' : 'M'}${25 + (s.t / span) * 290} ${319 - (s.F / forceScale) * 70}`,
          )
          .join(' ')}
        fill="none"
        stroke="#849f76"
        strokeWidth="2"
      />
      <path d={`M${25 + (time / span) * 290} 239V319`} stroke="#b49b76" strokeDasharray="3 3" />
      <text x="25" y="350" fontSize="20" fill="#657d64">
        {mode ? tr('车受力 / N', 'Vehicle force / N') : tr('接触力 / N', 'Contact force / N')}
      </text>
      <text x="315" y="350" textAnchor="end" fontSize="20" fill="#657d64">
        {span.toFixed(2)} s
      </text>
    </svg>
  );
}
export default function ImpulseContactLab() {
  const f = useShowcase(),
    [mode, setMode] = useState(f.variant === 'e1-car-crash-test' ? 1 : 0),
    [filled, setFilled] = useState(true),
    [duration, setDuration] = useState(0.3),
    [crashDuration, setCrashDuration] = useState(0.1),
    [speed, setSpeed] = useState(3),
    [position, setPosition] = useState(0.5);
  const m = f.watch ? (f.chapter < 3 ? 0 : 1) : mode,
    phase = f.watch ? (m ? f.chapter - 3 : f.chapter) : 0,
    p = f.watch ? f.chapterProgress : position,
    ball = f.watch ? phase !== 1 : filled,
    T = m
      ? f.watch
        ? phase === 1
          ? 0.04 + 0.12 * p
          : 0.1
        : crashDuration
      : f.watch
        ? phase === 2
          ? 0.15 + 0.4 * p
          : 0.3
        : duration,
    progress = f.watch && !m && phase === 2 ? 0.5 : f.watch && m && phase === 1 ? 1 / 6 : p,
    effectiveSpeed = f.watch ? 3 : speed,
    b = caughtBalloon(ball, effectiveSpeed, T, progress * T);
  return (
    <div className="modern-lab impulse-contact-lab">
      {!f.watch && (
        <div className="modern-paths">
          {[tr('投接气球', 'Catch a balloon'), tr('碰撞试验', 'Crash experiment')].map((v, j) => (
            <button type="button" key={j} aria-pressed={m === j} onClick={() => setMode(j)}>
              {v}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {m
          ? `${tr('示例车质量', 'Example vehicle mass')} 1 000 kg · 50 km/h`
          : `m = ${b.mass.toFixed(3)} kg · v₀ = ${effectiveSpeed.toFixed(1)} m/s · |Δp| = ${(b.mass * effectiveSpeed).toFixed(2)} kg·m/s`}
      </div>
      <ImpulseArtwork
        mode={m}
        filled={ball}
        duration={T}
        speed={effectiveSpeed}
        progress={progress}
      />
      <p className="modern-key">
        {m
          ? tr(
              '车体受力与乘员受力分别计算，停得更缓不等于完成安全评价。',
              'Vehicle and occupant forces are computed separately; a gentler stop is not a safety rating.',
            )
          : tr(
              '相同接球速度下，封闭的空气也贡献惯性；接触时间又影响平均力。',
              'At equal catch speed, enclosed air adds inertia; contact duration also changes average force.',
            )}
      </p>
      {!f.watch && (
        <div className="modern-explore">
          {!m && (
            <>
              <div className="modern-paths">
                <button type="button" aria-pressed={filled} onClick={() => setFilled(!filled)}>
                  {filled
                    ? tr('充气，直径1 m', 'Inflated, 1 m diameter')
                    : tr('同一乳胶，已放气', 'Same latex, deflated')}
                </button>
              </div>
              <Range
                label={tr('接触前速度 / m/s', 'Speed before contact / m/s')}
                value={speed}
                min={1}
                max={4}
                step={0.1}
                onChange={setSpeed}
              />
            </>
          )}
          <Range
            label={tr('停止时间 / s', 'Stop duration / s')}
            value={m ? crashDuration : duration}
            min={m ? 0.04 : 0.1}
            max={m ? 0.16 : 0.5}
            step={0.005}
            onChange={m ? setCrashDuration : setDuration}
          />
          <Range
            label={tr('观察进度', 'Observation progress')}
            value={position}
            min={0}
            max={1}
            step={0.01}
            onChange={setPosition}
          />
        </div>
      )}
    </div>
  );
}
