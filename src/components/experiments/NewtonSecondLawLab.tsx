import { useEffect, useId, useRef, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  newtonCart,
  compensatedAngle,
  hangerForTension,
  newtonRigGeometry,
  cartForceSequence,
  balancedTrial,
  releaseTrial,
} from '../../models/newton-second-law-lab';
import '../../styles/newton-second-law-lab.css';

const modes = ['balanced', 'tension', 'force', 'mass', 'release', 'boundary'] as const;
type Mode = (typeof modes)[number];
type Say = (zh: string, en: string) => string;
const clamp01 = (p: number) => Math.max(0, Math.min(1, p));
// Presentation time follows measured bilingual cue anchors; physical equations stay unchanged.
function directedTime(chapter: number, progress: number) {
  const q = clamp01(progress);
  if (chapter === 4) {
    if (q < 0.09) return (q / 0.09) * 0.8;
    if (q < 0.49) return 0.8 + ((q - 0.09) / 0.4) * 1;
    return 1.8 + clamp01((q - 0.49) / 0.32) * 0.8;
  }
  if (chapter === 5) {
    return clamp01(q < 0.35 ? (q - 0.04) / 0.23 : (q - 0.37) / 0.23) * 0.42;
  }
  return (
    clamp01((q - 0.07) / (chapter === 2 || chapter === 3 ? 0.23 : 0.76)) * (chapter === 0 ? 1.5 : 1)
  );
}
const GREEN = '#427461',
  ORANGE = '#b46443',
  BLUE = '#426d91';

function Arrow({
  x,
  y,
  dx,
  dy = 0,
  color,
  width = 2.5,
}: {
  x: number;
  y: number;
  dx: number;
  dy?: number;
  color: string;
  width?: number;
}) {
  const length = Math.hypot(dx, dy);
  if (length < 0.8) return null;
  const ux = dx / length,
    uy = dy / length,
    head = Math.min(6, length * 0.45);
  return (
    <g stroke={color} strokeWidth={width} fill={color}>
      <path d={`M ${x} ${y} l ${dx} ${dy}`} />
      <path
        d={`M ${x + dx} ${y + dy} l ${-ux * head - uy * head * 0.5} ${-uy * head + ux * head * 0.5} l ${uy * head} ${-ux * head} Z`}
        strokeWidth="1"
      />
    </g>
  );
}

/** The wheel centres, rail contact, hook and string all use the same side-elevation basis. */
function CartBody({
  x,
  y,
  scale,
  angle = 0,
  mass,
  id,
  opacity = 1,
}: {
  x: number;
  y: number;
  scale: number;
  angle?: number;
  mass: number;
  id: string;
  opacity?: number;
}) {
  const blocks = Math.max(0, Math.min(4, Math.round((mass - 0.4) / 0.2)));
  return (
    <g transform={`translate(${x} ${y}) rotate(${(angle * 180) / Math.PI})`} opacity={opacity}>
      <rect
        x={-0.11 * scale}
        y={-0.105 * scale}
        width={0.22 * scale}
        height={0.065 * scale}
        rx={0.018 * scale}
        fill={`url(#${id}-body)`}
        stroke="#6f8871"
        strokeWidth="1.2"
      />
      <path
        d={`M ${-0.085 * scale} ${-0.087 * scale} H ${0.082 * scale}`}
        stroke="#eaf0da"
        strokeWidth="2"
        opacity=".8"
      />
      {[-0.065, 0.065].map((wheel) => (
        <g key={wheel}>
          <circle
            cx={wheel * scale}
            cy={-0.024 * scale}
            r={0.024 * scale}
            fill="#596259"
            stroke="#d8ddcb"
            strokeWidth="1.2"
          />
          <circle cx={wheel * scale} cy={-0.024 * scale} r={0.008 * scale} fill="#b5beaf" />
        </g>
      ))}
      {Array.from({ length: blocks }, (_, i) => (
        <rect
          key={i}
          x={-0.063 * scale}
          y={(-0.105 - (i + 1) * 0.022) * scale}
          width={0.126 * scale}
          height={0.021 * scale}
          rx="2"
          fill={i % 2 ? '#a5ad9a' : '#c4c7b7'}
          stroke="#89917f"
          strokeWidth=".7"
        />
      ))}
    </g>
  );
}
function Materials({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#dce8c5" />
        <stop offset=".55" stopColor="#bdcfa6" />
        <stop offset="1" stopColor="#90aa86" />
      </linearGradient>
    </defs>
  );
}

function Rig({
  state,
  mass,
  hanger,
  angle = compensatedAngle(),
  dense = false,
  boundary = false,
  vectorMax,
  say,
}: {
  state: ReturnType<typeof newtonCart>;
  mass: number;
  hanger: number;
  angle?: number;
  dense?: boolean;
  boundary?: boolean;
  vectorMax?: { tension: number; velocity: number };
  say: Say;
}) {
  const { host, width, compact } = useSignalWidth(),
    id = useId().replace(/:/g, '');
  const scale = Math.min((width - 58) / 1.1, dense ? 260 : 360),
    left = (width - scale * 1.1) / 2;
  const railY = dense ? 48 : compact ? 64 : 76;
  const g = newtonRigGeometry(state.position, angle),
    p = (q: { x: number; y: number }) => ({ x: left + q.x * scale, y: railY + q.y * scale });
  const hook = p(g.hook),
    entry = p(g.entry),
    exit = p(g.exit),
    pulley = p(g.pulley),
    end = p(g.hanger),
    center = p(g.onRail(g.cartStation));
  const radius = g.radius * scale,
    angleDeg = (angle * 180) / Math.PI;
  const forceScale = Math.min(
    boundary ? 32 : 170,
    (0.27 * scale - 5) / Math.max(0.3, vectorMax?.tension ?? state.tension),
  );
  const finalCenter = p(g.onRail(0.62));
  const velocityScale = Math.min(
    compact ? 130 : 190,
    (width - 20 - finalCenter.x) /
      Math.max(0.4, vectorMax?.velocity ?? Math.sqrt(2 * Math.max(0, state.acceleration) * 0.44)),
  );
  const weightScale = Math.cbrt(hanger / 0.02),
    weightWidth = 20 * weightScale,
    weightHeight = 9 * weightScale;
  const height = Math.max(
    railY + scale * (dense ? 0.34 : 0.35) + (boundary ? 58 : 24),
    end.y + 10 + (boundary ? state.hangerWeight * 24 : weightHeight) + 14,
  );
  return (
    <div className="newton-rig" ref={host}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={say(
          '小车沿轨道向右运动，连续绳路绕过定滑轮，槽码同步下降。蓝箭头表示速度，绿箭头表示拉力。',
          'The cart moves right while its hanging mass descends through an unbroken pulley string. Blue indicates velocity; green indicates tension.',
        )}
      >
        <Materials id={id} />
        <g transform={`translate(${left} ${railY}) rotate(${angleDeg})`}>
          <rect x="0" y="1" width={scale * 1.01} height="8" rx="4" fill="#d7cdb7" />
          <path d={`M 0 0 H ${scale * 1.01}`} stroke="#a7ae9e" strokeWidth="2" />
          {[0.1, 0.7].map((x) => (
            <path key={x} d={`M ${x * scale} 9 v 17`} stroke="#c4c8b8" strokeWidth="6" />
          ))}
          {[0, 0.1, 0.2, 0.3, 0.4]
            .filter((t) => t <= state.time)
            .map((t) => {
              const x = 0.18 + 0.5 * state.acceleration * t ** 2;
              return <circle key={t} cx={x * scale} cy="13" r="2" fill="#9aa997" />;
            })}
        </g>
        <path
          d={`M ${pulley.x} ${pulley.y} L ${pulley.x - 10} ${railY + 12}`}
          stroke="#a0a99b"
          strokeWidth="4"
        />
        <circle cx={pulley.x} cy={pulley.y} r={radius + 2} fill="#e8e5d8" stroke="#9ba591" />
        <circle cx={pulley.x} cy={pulley.y} r="2" fill="#75836e" />
        <path
          d={`M ${hook.x} ${hook.y} L ${entry.x} ${entry.y} A ${radius} ${radius} 0 0 1 ${exit.x} ${exit.y} L ${end.x} ${end.y}`}
          fill="none"
          stroke="#82795e"
          strokeWidth="1.8"
        />
        <CartBody x={center.x} y={center.y} scale={scale} angle={angle} mass={mass} id={id} />
        <circle cx={hook.x} cy={hook.y} r="2.5" fill="#82795e" />
        <g transform={`translate(${end.x} ${end.y})`}>
          <path
            d={`M 0 0 v 6 M ${-weightWidth / 2} 6 H ${weightWidth / 2}`}
            stroke="#8b8067"
            strokeWidth="2"
          />
          <rect
            x={-weightWidth / 2}
            y="7"
            width={weightWidth}
            height={weightHeight}
            rx="2"
            fill="#c9b183"
            stroke="#99865f"
          />
          <path d={`M ${-weightWidth / 2 + 2} 9 H ${weightWidth / 2 - 2}`} stroke="#e7d5ac" />
        </g>
        <Arrow
          x={center.x}
          y={Math.max(dense ? 9 : 16, center.y - scale * 0.2 - 8)}
          dx={state.velocity * velocityScale}
          color={BLUE}
        />
        <Arrow
          x={hook.x + 3}
          y={hook.y - 4}
          dx={state.tension * forceScale}
          dy={state.tension * forceScale * Math.tan(angle)}
          color={GREEN}
        />
        {boundary && (
          <>
            <Arrow x={end.x - 15} y={end.y + 10} dx={0} dy={-state.tension * 24} color={GREEN} />
            <Arrow
              x={end.x + 16}
              y={end.y + 10}
              dx={0}
              dy={state.hangerWeight * 24}
              color={ORANGE}
            />
          </>
        )}
      </svg>
    </div>
  );
}

function StreetCart({
  state,
  mass,
  release,
  say,
}: {
  state: ReturnType<typeof cartForceSequence>;
  mass: number;
  release: boolean;
  say: Say;
}) {
  const { host, width } = useSignalWidth(),
    id = useId().replace(/:/g, '');
  const scale = Math.min((width - 44) / 1.02, 600),
    left = (width - scale) / 2,
    railY = 110;
  const x = left + (0.18 + state.position) * scale,
    bodyScale = Math.min(scale, 360);
  // After release the pusher stays behind, so the growing gap is visible evidence of no contact.
  const contact = !release || state.phase === 0,
    braking = release && state.phase === 2;
  const rear = x - bodyScale * 0.11;
  const releaseX = left + (0.18 + cartForceSequence(0.8, mass, 0, releaseTrial).position) * scale;
  const pusherX = contact ? rear : releaseX - bodyScale * 0.11 - 15;
  return (
    <div className="newton-street" ref={host}>
      <svg
        viewBox={`0 0 ${width} 168`}
        role="img"
        aria-label={say(
          '速度箭头跟随小车。推杆接触时施力，撤开后小车继续运动；制动片接触后减速。',
          'The velocity arrow follows the cart. A contacting pusher applies force; after release the cart keeps moving, then a contacting brake slows it.',
        )}
      >
        <Materials id={id} />
        <path
          d={`M ${left} ${railY + 2} H ${width - left}`}
          stroke="#c9cdbc"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={i}
            d={`M ${left + (i * scale) / 10} ${railY + 9} v ${i % 5 ? 4 : 8}`}
            stroke="#c3c9bc"
          />
        ))}
        {release &&
          [0.8, 1.3, 1.8]
            .filter((t) => t < state.time - 0.03)
            .map((t) => {
              const q = cartForceSequence(t, mass, 0, releaseTrial);
              return (
                <path
                  key={t}
                  d={`M ${left + (0.18 + q.position) * scale} ${railY + 18} v 8`}
                  stroke="#8ca994"
                  strokeWidth="2"
                />
              );
            })}
        <CartBody x={x} y={railY} scale={bodyScale} mass={mass} id={id} />
        <g
          opacity={contact ? 1 : 0.28}
          transform={`translate(${pusherX} ${railY - 0.075 * bodyScale})`}
        >
          <rect x="-29" y="-5" width="25" height="10" rx="5" fill="#d6c5a5" stroke="#a99b7f" />
          <path d="M -5 0 H 0" stroke="#8c947e" strokeWidth="3" />
          <path d="M 0 -7 V 7" stroke="#9aab88" strokeWidth="3" />
        </g>
        {(!release || braking) && (
          <rect
            x={x + 0.045 * bodyScale}
            y={railY - 0.053 * bodyScale}
            width={0.04 * bodyScale}
            height="5"
            rx="2"
            fill={ORANGE}
          />
        )}
        <Arrow x={x} y={37} dx={state.velocity * 220} color={BLUE} width={3} />
        {state.applied > 0 && (
          <Arrow x={x} y={railY - 0.13 * bodyScale} dx={state.applied * 220} color={GREEN} />
        )}
        {(state.resistance > 0 || braking) && (
          <Arrow
            x={x}
            y={railY - 0.13 * bodyScale + 14}
            dx={-(state.resistance || Math.abs(state.applied)) * 220}
            color={ORANGE}
          />
        )}
        <text x={left} y="157" fill="#657363" fontSize="16">
          {say(
            release ? '理想轨道：阻力忽略' : '推杆与阻力同时存在',
            release ? 'Resistance neglected' : 'Push + resistance',
          )}
        </text>
      </svg>
    </div>
  );
}

function VelocityTrace({
  sample,
  time,
  duration,
  say,
  release = false,
}: {
  sample: (t: number) => number;
  time: number;
  duration: number;
  say: Say;
  release?: boolean;
}) {
  const { host, width } = useSignalWidth(),
    left = 44,
    right = width - 20,
    bottom = 75;
  const maxVelocity = Math.max(
    0.5,
    ...Array.from({ length: 51 }, (_, i) => sample((duration * i) / 50)),
  );
  const x = (t: number) => left + (t / duration) * (right - left),
    y = (v: number) => bottom - (v / maxVelocity) * 53;
  const end = Math.min(time, duration),
    path = Array.from({ length: 81 }, (_, i) => {
      const t = (end * i) / 80;
      return `${i ? 'L' : 'M'} ${x(t)} ${y(sample(t))}`;
    }).join(' ');
  return (
    <div className="newton-velocity-trace" ref={host}>
      <svg
        viewBox={`0 0 ${width} 109`}
        role="img"
        aria-label={say(
          '速度—时间图，曲线斜率表示加速度',
          'Velocity–time trace: its slope is acceleration',
        )}
      >
        {release && (
          <rect x={x(0.8)} y="15" width={x(1.8) - x(0.8)} height="60" rx="6" fill="#e7eee1" />
        )}
        <path d={`M ${left} 13 V ${bottom} H ${right}`} stroke="#bec7b5" fill="none" />
        <text x="4" y="18" fontSize="16" fill={BLUE}>
          m/s
        </text>
        <text x="16" y={bottom + 5} fontSize="16" fill="#6c7866">
          0
        </text>
        <text x={right} y="101" textAnchor="end" fontSize="16" fill="#6c7866">
          {duration.toFixed(1)} s
        </text>
        <path d={path} stroke={BLUE} strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx={x(end)} cy={y(sample(end))} r="4" fill={BLUE} />
        <path
          d={`M ${x(end)} ${y(sample(end)) + 7} V ${bottom}`}
          stroke="#9eafa6"
          strokeDasharray="3 4"
        />
        {release && (
          <text x={(x(0.8) + x(1.8)) / 2} y="100" textAnchor="middle" fontSize="16" fill={GREEN}>
            F = 0
          </text>
        )}
      </svg>
    </div>
  );
}

export default function NewtonSecondLawLab() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say: Say = (zh, english) => (en ? english : zh);
  const [mode, setMode] = useState<Mode>('tension'),
    [mass, setMass] = useState(0.6),
    [force, setForce] = useState(0.12),
    [hanger, setHanger] = useState(0.02),
    [time, setTime] = useState(0.7);
  const [tilt, setTilt] = useState((compensatedAngle() * 180) / Math.PI);
  const previousWatch = useRef(film.watch);
  useEffect(() => {
    if (previousWatch.current && !film.watch) {
      const chapter = Math.min(5, film.chapter),
        q = film.chapterProgress;
      setMode(modes[chapter]);
      setMass(chapter === 3 ? 0.4 : 0.6);
      setForce(chapter === 3 ? 0.16 : 0.12);
      setHanger(
        chapter === 5
          ? q >= 0.35
            ? 0.2
            : 0.02
          : chapter === 1
            ? hangerForTension(0.6, 0.18)
            : 0.02,
      );
      setTime(directedTime(chapter, q));
    }
    previousWatch.current = film.watch;
  }, [film.watch, film.chapter, film.chapterProgress]);
  const c = film.watch ? Math.min(5, film.chapter) : modes.indexOf(mode);
  const paired = c === 2 || c === 3,
    street = c === 0 || c === 4;
  const duration = c === 0 ? 1.5 : c === 4 ? 2.6 : c === 5 ? 0.42 : 1;
  const physical = film.watch ? directedTime(c, film.chapterProgress) : Math.min(time, duration);
  const M = film.watch ? (c === 3 ? 0.4 : 0.6) : mass;
  const trial = film.watch && c === 5 && film.chapterProgress >= 0.35 ? 1 : 0;
  const rigTime = physical;
  const F = film.watch ? (c === 3 ? 0.16 : c === 2 ? 0.12 : 0.18) : force;
  const settings = paired
    ? [
        { M, T: F },
        { M: c === 3 ? M * 2 : M, T: c === 2 ? F * 2 : F },
      ]
    : [{ M, T: F }];
  const states = settings.map((item) => {
    const m =
      c === 5
        ? film.watch
          ? trial
            ? 0.2
            : 0.02
          : hanger
        : !film.watch && c === 1
          ? hanger
          : hangerForTension(item.M, item.T);
    return {
      ...item,
      m,
      state: newtonCart(rigTime, { cartMass: item.M, hangerMass: m, distance: 0.44 }),
    };
  });
  const sequence = c === 0 ? balancedTrial : releaseTrial,
    initialVelocity = c === 0 ? 0.24 : 0;
  const streetState = cartForceSequence(physical, M, initialVelocity, sequence);
  const compensation = {
    cartMass: mass,
    hangerMass: 0,
    initialVelocity: 0.24,
    incline: (tilt * Math.PI) / 180,
    distance: 0.44,
  };
  const compensationState = newtonCart(0.7, compensation);
  const tapePositions = Array.from(
    { length: 5 },
    (_, i) => newtonCart(i * 0.1, compensation).position,
  );
  const titles = [
    say('有推力，却没有变快', 'A push, yet no gain in speed'),
    say('拉起来，看速度怎样变', 'Pull — then follow the changing speed'),
    say('同一质量，合力翻倍', 'Same mass, twice the net force'),
    say('重车为什么难加速？', 'Why does extra mass slow the gain?'),
    say('撤力，车会立即停下吗？', 'Remove the force: does the cart stop?'),
    say('绳子的拉力就是重力吗？', 'Is tension the hanging weight?'),
  ];
  const choose = (value: Mode) => {
    setMode(value);
    setTime(value === 'release' ? 1.4 : value === 'boundary' ? 0.35 : 0.7);
  };
  return (
    <section className="newton-cart-lab" data-watch={film.watch} data-view={modes[c]}>
      <header className="newton-question">
        <p>{titles[c]}</p>
        <span>
          {street
            ? say('观察速度怎样变化', 'Follow the change in velocity')
            : say('轨道已补偿阻力', 'Rail resistance compensated')}
        </span>
      </header>
      {street ? (
        <>
          <div className="newton-force-balance">
            <span className="newton-green">
              {say(
                c === 4 && streetState.phase === 2 ? '制动力' : '推力',
                c === 4 && streetState.phase === 2 ? 'Brake' : 'Push',
              )}{' '}
              {Math.abs(streetState.applied).toFixed(2)} N
            </span>
            {c === 0 && (
              <span className="newton-orange">
                {say('阻力', 'Resistance')} {streetState.resistance.toFixed(2)} N
              </span>
            )}
            <strong>
              F{say('合', 'net')} ={' '}
              {Math.abs(streetState.netForce) < 1e-10 ? '0' : streetState.netForce.toFixed(2)} N
            </strong>
          </div>
          <StreetCart state={streetState} mass={M} release={c === 4} say={say} />
          <div className="newton-observation">
            <span className="newton-blue">v = {streetState.velocity.toFixed(2)} m/s</span>
            <strong>a = {streetState.acceleration.toFixed(2)} m/s²</strong>
          </div>
          <VelocityTrace
            sample={(t) => cartForceSequence(t, M, initialVelocity, sequence).velocity}
            time={physical}
            duration={duration}
            release={c === 4}
            say={say}
          />
          {c === 4 && (
            <div
              className="newton-phase-strip"
              aria-label={say('连续运动阶段', 'Continuous motion phases')}
            >
              {[say('推', 'Push'), say('撤力', 'Coast'), say('制动', 'Brake')].map((label, i) => (
                <span key={i} data-active={streetState.phase === i}>
                  {label}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="newton-cart-trials" data-paired={paired}>
            {states.map(({ M: cartMass, m, state }, i) => (
              <div className="newton-cart-trial" key={i}>
                <div className="newton-cart-trial-heading">
                  <strong>
                    {paired ? `${i ? 'B' : 'A'} · ` : ''}
                    {cartMass.toFixed(2)} kg
                  </strong>
                  <span className="newton-green">
                    F{say('合', 'net')} = T = {state.tension.toFixed(2)} N
                  </span>
                </div>
                <Rig
                  state={state}
                  mass={cartMass}
                  hanger={m}
                  dense={paired}
                  boundary={c === 5}
                  vectorMax={{
                    tension: Math.max(...states.map((s) => s.state.tension)),
                    velocity: Math.max(
                      ...states.map((s) => Math.sqrt(2 * Math.max(0, s.state.acceleration) * 0.44)),
                    ),
                  }}
                  say={say}
                />
                <div className="newton-observation">
                  <span className="newton-blue">v = {state.velocity.toFixed(2)} m/s</span>
                  <span>a = {state.acceleration.toFixed(2)} m/s²</span>
                </div>
                {c === 5 && (
                  <div className="newton-tension-evidence">
                    <span>m = {(m * 1000).toFixed(1)} g</span>
                    <span className="newton-orange">mg = {state.hangerWeight.toFixed(2)} N</span>
                    <strong>mg − T = {(state.hangerWeight - state.tension).toFixed(2)} N</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="newton-result">
            <span>
              {say('同一计时', 'Same clock')} · {states[0].state.time.toFixed(2)} s
            </span>
            <strong>
              {c === 2
                ? 'F × 2 → a × 2'
                : c === 3
                  ? !film.watch || film.chapterProgress >= 0.43
                    ? say('F合 = Ma', 'Fnet = Ma')
                    : 'M × 2 → a ÷ 2'
                  : c === 5
                    ? 'mg − T = ma'
                    : 'a = Δv / Δt'}
            </strong>
          </div>
          {c === 1 && (
            <VelocityTrace
              sample={(t) =>
                newtonCart(t, { cartMass: M, hangerMass: states[0].m, distance: 0.44 }).velocity
              }
              time={states[0].state.time}
              duration={1}
              say={say}
            />
          )}
          {c === 3 && !film.watch && (
            <p className="newton-condition">
              {say('略调槽码，保持两车T相同。', 'Adjusted hanging masses keep T equal.')}
            </p>
          )}
          {c === 5 && !film.watch && (
            <p className="newton-condition">
              {say('把mg当T，高估', 'mg as T: +')} {((states[0].m / M) * 100).toFixed(1)}%
            </p>
          )}
        </>
      )}
      {!film.watch && (
        <div className="newton-cart-controls">
          <Segments
            label={say('要检验的想法', 'Choose a claim to test')}
            value={mode}
            onChange={choose}
            options={modes.map((value, i) => ({
              value,
              label: [
                say('匀速也有力', 'Balanced forces'),
                say('拉力与变速', 'Pull and speed'),
                say('合力翻倍', 'Double force'),
                say('质量翻倍', 'Double mass'),
                say('撤力与制动', 'Release and brake'),
                say('槽码的边界', 'Tension limit'),
              ][i],
            }))}
          />
          <Range
            label={say('模型时间', 'Model time')}
            value={Math.min(time, duration)}
            min={0}
            max={duration}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
          <Range
            label={say(paired ? 'A车质量' : '小车质量', paired ? 'Cart A mass' : 'Cart mass')}
            value={mass}
            min={0.4}
            max={1}
            step={0.05}
            unit="kg"
            onChange={setMass}
          />
          {paired && (
            <Range
              label={say('A车实际合力', 'Actual net force on A')}
              value={force}
              min={0.06}
              max={0.16}
              step={0.01}
              unit="N"
              onChange={setForce}
            />
          )}
          {(c === 1 || c === 5) && (
            <Range
              label={say('槽码质量', 'Hanging mass')}
              value={hanger}
              min={0.005}
              max={0.2}
              step={0.005}
              unit="kg"
              onChange={setHanger}
            />
          )}
          <p className="newton-condition">
            {say(
              '蓝色：速度；绿色：推力或拉力；橙色：阻力或槽码重力。',
              'Blue: velocity. Green: push or tension. Orange: resistance or hanging weight.',
            )}
          </p>
          <details className="newton-method">
            <summary>
              {say(
                '教材中的纸带、补偿与位移比',
                'Textbook evidence: tape, compensation and displacement',
              )}
            </summary>
            <p>
              {say(
                '先不挂槽码，带着纸带给小车一个初速度。调整木板，让沿板的重力分量补偿阻力；匀速才说明补偿成立。下面的倾角直接改变计算。',
                'Remove the hanging mass and give the cart an initial speed with its tape attached. Tilt the rail until downhill gravity balances resistance. Constant velocity is the check; the angle below changes the model.',
              )}
            </p>
            <Range
              label={say('木板倾角', 'Rail angle')}
              value={tilt}
              min={0}
              max={3}
              step={0.01}
              unit="°"
              onChange={setTilt}
            />
            <p>
              {say('补偿检验', 'Compensation check')}: a ={' '}
              {compensationState.acceleration.toFixed(3)} m/s²
            </p>
            <p>
              {say(
                '纸带上的等时间点记录位置；相邻两段位移之差给出加速度。两车从静止在同一时刻释放、同一时刻截取，位移比也等于加速度比。',
                'Equal-time tape dots record position; the change between consecutive displacements gives acceleration. Two carts released from rest and measured for the same duration also give a displacement ratio equal to their acceleration ratio.',
              )}
            </p>
            <div
              className="newton-tape-dots"
              aria-label={say('等时间纸带点', 'Equal-time tape dots')}
            >
              {tapePositions.map((x, i) => (
                <span
                  key={i}
                  style={{
                    left: `${5 + (x / Math.max(0.00001, tapePositions[4])) * 90}%`,
                  }}
                />
              ))}
            </div>
            <p>
              {say(
                '此处计数点间隔0.10秒，是从更密的打点中选点；不是10赫兹电源。',
                'The displayed counting interval is 0.10 s, selected from a denser tape record; it does not mean a 10 Hz supply.',
              )}
            </p>
          </details>
          <p className="newton-condition">
            {say(
              '理想不可伸长轻绳、无摩擦轻滑轮。牵引实验已补偿阻力；到测量终点定格，不模拟碰撞。数值是模型预测，不能代替实测。',
              'Ideal light inextensible string and frictionless light pulley. Resistance is compensated in the hanging-mass trials. The measurement freezes at the rail limit; collisions are not simulated. Values are model predictions, not measured data.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
