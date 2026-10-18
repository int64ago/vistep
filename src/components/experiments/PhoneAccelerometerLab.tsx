import { useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  phoneSensor,
  phoneSensorSamples,
  phoneElectrodes,
  phoneCausalShot,
  phoneForceMeter,
  phoneWorldGeometry,
  PHONE_G,
  type PhoneTrial,
  type PhoneView,
  type PhoneMeterStage,
} from '../../models/phone-accelerometer-lab';
import '../../styles/phone-accelerometer-lab.css';

type Say = (zh: string, en: string) => string;
type Sensor = ReturnType<typeof phoneSensor>;
const GREEN = '#386b60',
  GOLD = '#aa753b',
  BLUE = '#4c7393',
  INK = '#37544c';
const clamp = (p: number) => Math.max(0, Math.min(1, p));
const number = (v: number, digits = 1) => (Math.abs(v) < 0.00005 ? 0 : v).toFixed(digits);
function Arrow({ x, y, length, color }: { x: number; y: number; length: number; color: string }) {
  if (Math.abs(length) < 0.5) return null;
  const end = y + length,
    sign = Math.sign(length);
  return (
    <path
      d={`M ${x} ${y} V ${end} m -4 ${-6 * sign} l 4 ${6 * sign} l 4 ${-6 * sign}`}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
function Handset({
  x,
  y,
  palm = true,
  chip = false,
  palmOffset = 0,
}: {
  x: number;
  y: number;
  palm?: boolean;
  chip?: boolean;
  palmOffset?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {palm && (
        <g transform={`translate(${palmOffset} 0)`}>
          <path
            d="M -83 25 Q -60 12 -36 12 H 43 Q 66 12 80 34 L 54 49 H -47 Z"
            fill="#dec6a6"
            stroke="#bda17d"
          />
          <path d="M -45 23 H 41" stroke="#c4a582" />
        </g>
      )}
      <rect
        x="-79"
        y="-10"
        width="158"
        height="22"
        rx="8"
        fill="#6f8b80"
        stroke="#365e52"
        strokeWidth="1.5"
      />
      <rect x="-70" y="-7" width="140" height="7" rx="3" fill="#d8e4dc" />
      <path d="M -63 6 H 18 M 29 6 H 61" stroke="#a5bab0" strokeWidth="2" />
      <rect x="19" y="1" width="12" height="8" rx="1" fill={GOLD} stroke="#866138" />
      {chip && (
        <>
          <path d="M 25 1 V -29 H 63" fill="none" stroke={GOLD} />
          <circle cx="25" cy="5" r="11" fill="none" stroke={GOLD} />
        </>
      )}
    </g>
  );
}
function Flexure({ side, shift }: { side: number; shift: number }) {
  const points = Array.from({ length: 13 }, (_, i) => {
    const u = i / 12,
      x = side * (94 - u * 62);
    const y = shift * u + (i === 0 || i === 12 ? 0 : i % 2 ? -5 : 5);
    return `${i ? 'L' : 'M'} ${x} ${y}`;
  }).join(' ');
  return <path d={points} fill="none" stroke="#8e9d8c" strokeWidth="2.5" strokeLinejoin="round" />;
}
function Cutaway({
  width,
  state,
  say,
  id,
  showGap = true,
}: {
  width: number;
  state: Sensor;
  say: Say;
  id: string;
  showGap?: boolean;
}) {
  const compact = width < 480;
  const e = phoneElectrodes(state.q),
    scale = compact ? 7e6 : 11.25e6,
    cy = compact ? 90 : 130,
    shift = -state.q * scale;
  const plateHalf = ((e.massTop - e.massBottom) * scale) / 2;
  const top = -e.topElectrode * scale,
    bottom = -e.bottomElectrode * scale;
  return (
    <g transform={`translate(${width / 2} ${cy})`}>
      <defs>
        <linearGradient id={`${id}-mass`} x2="0" y2="1">
          <stop stopColor="#d8d4ba" />
          <stop offset="1" stopColor="#b8b692" />
        </linearGradient>
      </defs>
      <rect
        x="-113"
        y={compact ? -56 : -86}
        width="226"
        height={compact ? 114 : 175}
        rx="18"
        fill="#f2f3e9"
        stroke="#bccbc0"
        strokeWidth="2"
      />
      <path d="M -108 -5 H 108" stroke="#cbd3c8" strokeDasharray="3 5" transform="translate(0 5)" />
      <path
        d={`M -113 ${top - 4} H 0 V ${top} M -113 ${bottom + 4} H 0 V ${bottom}`}
        stroke="#a7b5ab"
        fill="none"
      />
      <rect x="-29" y={top - 6} width="58" height="6" rx="2" fill={BLUE} />
      <rect x="-29" y={bottom} width="58" height="6" rx="2" fill={BLUE} />
      {[-1, 1].map((side) => (
        <g key={side}>
          <rect x={side < 0 ? -105 : 94} y="-10" width="11" height="20" rx="2" fill="#7c9184" />
          <Flexure side={side} shift={shift} />
        </g>
      ))}
      <rect
        data-sensor-mass="true"
        x="-32"
        y={shift - plateHalf}
        width="64"
        height={plateHalf * 2}
        rx="4"
        fill={`url(#${id}-mass)`}
        stroke="#94946d"
        strokeWidth="1.5"
      />
      <circle cx="0" cy={shift} r="4" fill={GOLD} />
      <Arrow x={-54} y={shift} length={-state.elasticPerMass * 1.7} color={GREEN} />
      <Arrow x={55} y={shift} length={PHONE_G * 1.7} color={GOLD} />
      <text x="0" y={compact ? -69 : -99} textAnchor="middle">
        {say('固定电极', 'Fixed electrodes')}
      </text>
      <path d={`M 45 ${compact ? -64 : -92} H 42 V ${top - 3} H 30`} stroke={BLUE} fill="none" />
      <text x="0" y={compact ? 94 : 115} textAnchor="middle">
        {say('质量块', 'Proof mass')} · {number(state.q * 1e6, 2)} μm
      </text>
      {showGap && (
        <>
          <path
            d={`M 38 ${top} H 42 V ${shift - plateHalf} H 38 M 38 ${shift + plateHalf} H 42 V ${bottom} H 38`}
            stroke={BLUE}
            fill="none"
          />
          <text x="-100" y={compact ? 50 : 78} fill={BLUE}>
            {say('间隙', 'Gaps')} {number(e.topGap * 1e6, 1)} / {number(e.bottomGap * 1e6, 1)} μm
          </text>
        </>
      )}
    </g>
  );
}
function World({
  width,
  state,
  trial,
  catchView,
  say,
}: {
  width: number;
  state: Sensor;
  trial: PhoneTrial;
  catchView?: boolean;
  say: Say;
}) {
  const compact = width < 480,
    h = compact ? 196 : 270;
  const cx = width / 2,
    world = phoneWorldGeometry(trial, state.t, compact);
  const { phoneY } = world,
    liftY = world.cabinY;
  const falling = state.phase === 'falling';
  return (
    <>
      {trial === 'lift' ? (
        <>
          <path
            d={`M ${cx - 91} 10 V ${h - 20} M ${cx + 91} 10 V ${h - 20}`}
            stroke="#c8d2cb"
            strokeWidth="3"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M ${cx - 106} ${16 + (i * (h - 35)) / 4} h 11 M ${cx + 95} ${16 + (i * (h - 35)) / 4} h 11`}
              stroke="#b8c7bc"
            />
          ))}
          <g data-lift-assembly="true" transform={`translate(${cx} ${liftY})`}>
            <rect
              x="-79"
              y="0"
              width="158"
              height={compact ? 112 : 136}
              rx="12"
              fill="#e8eee7"
              stroke="#a5b9ac"
              strokeWidth="2"
            />
            <path
              d={
                compact
                  ? 'M -66 12 V 99 H 66 V 12 M -76 106 H 76'
                  : 'M -66 12 V 123 H 66 V 12 M -76 130 H 76'
              }
              fill="none"
              stroke="#b4c7b8"
              strokeWidth="2"
            />
            <g transform={`translate(0 ${compact ? 53 : 74}) scale(.65)`}>
              <Handset x={0} y={0} />
            </g>
            <path
              d={
                compact
                  ? 'M -27 82 V 100 M 27 82 V 100 M -41 82 H 41'
                  : 'M -27 101 V 124 M 27 101 V 124 M -41 101 H 41'
              }
              stroke="#a5b7aa"
              strokeWidth="3"
            />
          </g>
          <text x={cx} y={h - 5} textAnchor="middle">
            {say('同一轿厢、同一手机', 'Same cabin, same phone')}
          </text>
        </>
      ) : (
        <>
          <path d={`M ${cx - 103} 25 V ${h - 45}`} stroke="#cdd7ce" />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M ${cx - 108} ${25 + (i * (h - 70)) / 3} h 10`} stroke="#c2cec4" />
          ))}
          {state.t < 0.43 && (
            <g transform={`translate(${cx + world.supportHandX} ${world.supportHandY})`}>
              <path
                d="M -83 25 Q -60 12 -36 12 H 43 Q 66 12 80 34 L 54 49 H -47 Z"
                fill="#dec6a6"
                stroke="#bda17d"
              />
            </g>
          )}
          {state.t >= 0.4 && (
            <g
              data-catching-hand="true"
              transform={`translate(${cx + world.catchHandX} ${world.catchHandY})`}
            >
              <path
                d="M -83 25 Q -60 12 -36 12 H 43 Q 66 12 80 34 L 54 49 H -47 Z"
                fill="#dec6a6"
                stroke="#bda17d"
              />
            </g>
          )}
          <Handset x={cx} y={phoneY} palm={false} chip={!catchView && state.t < 0.4} />
          {state.t < 0.4 && (
            <text x={cx} y="30" textAnchor="middle">
              {say('芯片藏在这里', 'The chip is inside')}
            </text>
          )}
          {falling && (
            <>
              <Arrow x={cx + 54} y={phoneY + 19} length={24} color={GOLD} />
              <text x={cx + 64} y={phoneY + 36} fill={GOLD}>
                g
              </text>
            </>
          )}
          {state.t >= 0.4 && (
            <>
              <Arrow x={cx - 92} y={phoneY} length={-state.v * 22} color={BLUE} />
              <Arrow x={cx + 94} y={phoneY} length={-state.a * 2.1} color={GREEN} />
              <text x={cx} y={h - 27} textAnchor="middle" fill={BLUE}>
                v = {number(state.v, 2)} m/s
              </text>
              <text x={cx} y={h - 9} textAnchor="middle" fill={GREEN}>
                a = {number(state.a, 2)} m/s²
              </text>
            </>
          )}
        </>
      )}
    </>
  );
}
function Trace({
  width,
  trial,
  state,
  say,
  detail = false,
}: {
  width: number;
  trial: PhoneTrial;
  state: Sensor;
  say: Say;
  detail?: boolean;
}) {
  const compact = width < 480,
    h = compact ? 196 : 270;
  const from = detail ? 0.7 : 0,
    to = detail ? 0.7035 : state.duration;
  // A recorded trace is retained while the same-clock cursor selects a sample.
  const samples = phoneSensorSamples(trial).filter((s) => s.t >= from && s.t <= to);
  const x = (t: number) => 30 + ((t - from) / (to - from)) * (width - 48);
  const y = (v: number) => (compact ? 128 : 157) - v * (compact ? 2.6 : 3.1);
  const path = (key: 'raw' | 'corrected') =>
    samples.map((s, i) => `${i ? 'L' : 'M'} ${x(s.t)} ${y(s[key])}`).join(' ');
  return (
    <>
      <text x="8" y="22">
        {detail
          ? say('接住后的毫秒响应', 'Catch response, enlarged')
          : say('同一时刻的两种输出', 'Two outputs, one clock')}
      </text>
      <path d={`M 30 38 V ${h - 43} H ${width - 12}`} stroke="#b8c9bc" fill="none" />
      {[0, 9.8, -9.8].map((v) => (
        <g key={v}>
          <path d={`M 30 ${y(v)} H ${width - 12}`} stroke="#d4ddd1" strokeDasharray="3 4" />
          <text x="25" y={y(v) + 5} textAnchor="end">
            {v === 0 ? '0' : v > 0 ? 'g' : '−g'}
          </text>
        </g>
      ))}
      <path d={path('raw')} fill="none" stroke={GREEN} strokeWidth="2.5" />
      <path d={path('corrected')} fill="none" stroke={GOLD} strokeWidth="2.5" />
      <path d={`M ${x(state.t)} 38 V ${h - 43}`} stroke={BLUE} strokeDasharray="2 4" />
      <circle cx={x(state.t)} cy={y(state.raw)} r="4" fill={GREEN} />
      <circle cx={x(state.t)} cy={y(state.corrected)} r="4" fill={GOLD} />
      <text x="30" y={h - 20}>
        {detail ? '0 ms' : '0 s'}
      </text>
      <text x={width - 12} y={h - 20} textAnchor="end">
        {detail ? '3.5 ms' : `${number(state.duration)} s`}
      </text>
      <text x={width / 2} y={h - 9} textAnchor="middle">
        {say('f − g，固定朝向', 'f − g, fixed orientation')}
      </text>
    </>
  );
}
function Meter({
  width,
  state,
  stage,
  say,
}: {
  width: number;
  state: Sensor;
  stage: PhoneMeterStage;
  say: Say;
}) {
  const compact = width < 480;
  const meter = phoneForceMeter(state.a),
    length = 22 + meter.extension * 280;
  const pair = ['unknown', 'sum', 'difference', 'ratio', 'answer'].includes(stage),
    formula = stage === 'ratio' || stage === 'answer',
    showSum = stage !== 'unknown',
    showDifference = stage === 'difference',
    cx = pair ? width / 2 : width / 2 - 42;
  if (stage === 'readings')
    return (
      <>
        <text x={width / 2} y={compact ? 24 : 32} textAnchor="middle">
          0.20 kg
        </text>
        {[
          [say('上行加速', 'Rising, speeding'), 1],
          [say('上行匀速', 'Rising, steady'), 0],
          [say('上行制动', 'Rising, braking'), -1],
        ].map(([label, a], i) => (
          <g key={String(label)}>
            <text x="16" y={(compact ? 69 : 90) + i * (compact ? 43 : 60)}>
              {label}
            </text>
            <text
              x={width - 16}
              y={(compact ? 69 : 90) + i * (compact ? 43 : 60)}
              textAnchor="end"
              fill={GREEN}
            >
              {number(phoneForceMeter(Number(a)).force, 2)} N
            </text>
          </g>
        ))}
      </>
    );
  if (pair)
    return (
      <>
        <text x={width / 2} y={compact ? 19 : 24} textAnchor="middle">
          {say('同一重物，稳定示数', 'Same mass, settled readings')}
        </text>
        <g fill={GREEN}>
          <text x="16" y={compact ? 51 : 68}>
            {say('加速', 'Speeding')} · G₁
          </text>
          <text x={width - 16} y={compact ? 51 : 68} textAnchor="end">
            2.16 N
          </text>
        </g>
        <g fill={BLUE}>
          <text x="16" y={compact ? 82 : 105}>
            {say('制动', 'Braking')} · G₂
          </text>
          <text x={width - 16} y={compact ? 82 : 105} textAnchor="end">
            1.76 N
          </text>
        </g>
        <path d={`M 16 ${compact ? 96 : 122} H ${width - 16}`} stroke="#cbd8cc" />
        <text x={cx} y={compact ? 120 : 152} textAnchor="middle">
          {say('等幅加减速', 'Equal acceleration magnitudes')}
        </text>
        <text x={cx} y={compact ? 151 : 187} textAnchor="middle">
          {formula
            ? 'a = g (G₁ − G₂)/(G₁ + G₂)'
            : showSum
              ? 'G₁ + G₂ = 3.92 N = 2mg'
              : say('质量 m 未知', 'Mass m is unknown')}
        </text>
        <text
          x={cx}
          y={compact ? 184 : 225}
          textAnchor="middle"
          className={formula ? 'phone-sensor-answer' : undefined}
        >
          {stage === 'answer'
            ? '1.00 m/s²'
            : formula
              ? '?'
              : showDifference
                ? 'G₁ − G₂ = 0.40 N = 2ma'
                : ''}
        </text>
      </>
    );
  return (
    <>
      <path
        d={`M ${cx - 64} 31 V 14 H ${cx + 64} V 31`}
        stroke="#7d9588"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx} 14 V 23 Q ${cx + 9} 33 ${cx} 36 Q ${cx - 8} 34 ${cx - 5} 28`}
        fill="none"
        stroke="#6a8476"
        strokeWidth="2.5"
      />
      <rect x={cx - 28} y="35" width="56" height="78" rx="9" fill="#e7ede1" stroke="#b1c1ad" />
      <path
        d={Array.from(
          { length: 19 },
          (_, i) =>
            `${i ? 'L' : 'M'} ${cx + (i === 0 || i === 18 ? 0 : i % 2 ? 10 : -10)} ${44 + (i / 18) * length}`,
        ).join(' ')}
        stroke="#849571"
        fill="none"
        strokeWidth="2"
      />
      <path d={`M ${cx} ${44 + length} V ${72 + length}`} stroke="#72856d" strokeWidth="2" />
      <rect
        x={cx - 18}
        y={72 + length}
        width="36"
        height="29"
        rx="5"
        fill="#879c76"
        stroke="#657e5c"
      />
      <text x={cx + 48} y="76" fill={GREEN}>
        {number(meter.force, 2)} N
      </text>
      <text x={cx + 48} y="108">
        0.20 kg
      </text>
      <text x={width / 2} y={compact ? 166 : 218} textAnchor="middle">
        {stage === 'known'
          ? 'F − mg = ma'
          : say('同一重物，略去初始振动', 'Same mass; omit initial vibration')}
      </text>
      <text x={width / 2} y={compact ? 190 : 251} textAnchor="middle">
        {stage === 'known'
          ? `${number(meter.force, 2)}/0.20 − 9.8 = ${number(state.a, 1)} m/s²`
          : ''}
      </text>
    </>
  );
}

export default function PhoneAccelerometerLab() {
  const film = useShowcase(),
    locale = browserLocale(),
    say: Say = (zh, en) => (locale === 'en' ? en : zh);
  const { host, width } = useSignalWidth();
  const compact = width < 480,
    height = compact ? 196 : 270;
  const id = useId().replace(/:/g, '');
  const [trial, setTrial] = useState<PhoneTrial>(() =>
    film.variant?.includes('elevator') ? 'lift' : 'drop',
  );
  const [time, setTime] = useState(() => (film.variant?.includes('elevator') ? 4 : 0.2));
  const [manualView, setManualView] = useState<PhoneView>('sensor');
  const [meterPhase, setMeterPhase] = useState('speeding');
  const [reveal, setReveal] = useState(false);
  const shot = phoneCausalShot(film.chapter, film.chapterProgress, locale, film.chapterTime);
  const mode = film.watch ? shot.trial : trial;
  const liftDetail = film.watch && compact && shot.liftDetail;
  const view = liftDetail ? 'sensor' : film.watch ? shot.view : manualView;
  const meterTime = meterPhase === 'speeding' ? 2 : meterPhase === 'cruising' ? 4 : 6;
  const now = film.watch ? shot.time : view === 'meter' ? meterTime : time;
  const state = useMemo(() => phoneSensor(mode, now), [mode, now]);
  const meterStage = film.watch ? shot.meterStage : reveal ? 'answer' : 'known';
  const prediction = film.watch && shot.prediction;
  const phase =
    state.phase === 'held'
      ? say('托住，静止', 'Supported, at rest')
      : state.phase === 'falling'
        ? say('自由下落', 'Free fall')
        : state.phase === 'catching'
          ? say('接住，减速', 'Catch and slow')
          : state.phase === 'speeding'
            ? say('上行加速', 'Rising, speeding')
            : state.phase === 'cruising'
              ? say('上行匀速', 'Rising, steady')
              : state.phase === 'braking'
                ? say('上行减速', 'Rising, braking')
                : say('静止', 'At rest');
  const clock =
    film.watch && shot.slowed
      ? `${say('响应慢镜头', 'Response slowed')} · ${number((state.t - (film.chapter === 1 ? 0.4 : 0.7)) * 1000, 2)} ms`
      : `${phase} · ${number(state.t, 2)} s`;
  const conversion = view === 'conversion';
  const showCorrected = view === 'trace' || conversion;
  const meter = view === 'meter';
  return (
    <section
      className="phone-sensor-lab"
      ref={host}
      data-view={view}
      data-physical-time={state.t}
      data-meter-stage={meterStage}
      data-trace-detail={film.watch && shot.traceDetail}
    >
      <header className="phone-sensor-clock">
        {meter ? say('稳定阶段取样', 'Settled-stage samples') : clock}
      </header>
      <svg
        className="phone-sensor-stage"
        viewBox={`0 0 ${width} ${height}`}
        style={{ height }}
        role="img"
        aria-label={say(
          '外壳、悬挂质量块与同一时刻的加速度计输出',
          'Casing, suspended proof mass and the sensor output at one instant',
        )}
      >
        {view === 'sensor' && <Cutaway width={width} state={state} say={say} id={id} />}
        {(view === 'handset' || view === 'catch' || view === 'lift') &&
          (view === 'lift' && !compact ? (
            <>
              <World width={240} state={state} trial={mode} say={say} />
              <g transform={`translate(${width - 300} 0)`}>
                <Cutaway width={300} state={state} say={say} id={`${id}-lift`} />
              </g>
            </>
          ) : (
            <World
              width={width}
              state={state}
              trial={mode}
              catchView={view === 'catch'}
              say={say}
            />
          ))}
        {view === 'trace' && (
          <Trace
            width={width}
            state={state}
            trial={mode}
            say={say}
            detail={film.watch && shot.traceDetail}
          />
        )}
        {meter && <Meter width={width} state={state} stage={meterStage} say={say} />}
        {conversion && (
          <>
            <text x={width / 2} y="28" textAnchor="middle">
              {phase}
            </text>
            <text x={width / 2} y={compact ? 58 : 74} textAnchor="middle" fill={BLUE}>
              v = +{number(state.v)} m/s ↑
            </text>
            <text x={width / 2} y={compact ? 95 : 126} textAnchor="middle" fill={GREEN}>
              {number(state.raw)} m/s²
            </text>
            <path
              d={`M ${width / 2} ${compact ? 105 : 142} V ${compact ? 130 : 171} l -4 -6 m 4 6 l 4 -6`}
              stroke={GOLD}
              fill="none"
            />
            <text x={width / 2 + 16} y={compact ? 123 : 163} fill={GOLD}>
              − 9.8
            </text>
            <text
              x={width / 2}
              y={compact ? 157 : 210}
              textAnchor="middle"
              fill={GOLD}
              className="phone-sensor-answer"
            >
              {prediction ? '?' : `${number(state.corrected)} m/s²`}
            </text>
            <text x={width / 2} y={compact ? 190 : 250} textAnchor="middle">
              {prediction
                ? say('仍在上行，加速度朝哪边？', 'Still rising. Which way is a?')
                : say('方向不同，并不矛盾', 'Different directions are possible')}
            </text>
          </>
        )}
      </svg>
      {!meter && !conversion && (
        <div className="phone-sensor-readouts">
          <p>
            <span>{say('传感器读数', 'Sensor signal')}</span>
            <strong>
              {number(state.raw)} <small>m/s²</small>
            </strong>
          </p>
          <p>
            <span>
              {showCorrected
                ? say('校正信号', 'Corrected signal')
                : view === 'sensor'
                  ? say('弹力 / 重力', 'Elastic / gravity')
                  : say('竖直速度', 'Vertical velocity')}
            </span>
            <strong className="phone-sensor-secondary">
              {showCorrected ? (
                prediction ? (
                  '?'
                ) : (
                  number(state.corrected)
                )
              ) : view === 'sensor' ? (
                <>
                  <i style={{ background: GREEN }} /> ↑ <i style={{ background: GOLD }} /> ↓
                </>
              ) : (
                number(state.v, 2)
              )}
              {view !== 'sensor' && <small> {showCorrected ? 'm/s²' : 'm/s'}</small>}
            </strong>
          </p>
        </div>
      )}
      {!film.watch && (
        <div className="phone-sensor-controls">
          <Segments
            label={say('运动情境', 'Motion')}
            value={trial}
            onChange={(v) => {
              setTrial(v);
              setTime(v === 'lift' ? 4 : 0.2);
              setManualView('sensor');
              setReveal(false);
            }}
            options={[
              { value: 'drop', label: say('释放与接住', 'Release and catch') },
              { value: 'lift', label: say('电梯', 'Lift') },
            ]}
          />
          <Segments
            label={say('观察对象', 'View')}
            value={manualView}
            onChange={(v) => {
              setManualView(v as PhoneView);
              setReveal(false);
            }}
            options={[
              { value: 'sensor', label: say('传感器内部', 'Inside the sensor') },
              {
                value: trial === 'lift' ? 'lift' : 'handset',
                label: say('外部运动', 'External motion'),
              },
              { value: 'trace', label: say('同刻曲线', 'Same-time traces') },
              ...(trial === 'lift'
                ? [{ value: 'meter', label: say('测力计', 'Force meter') }]
                : []),
            ]}
          />
          {view === 'meter' ? (
            <>
              <Segments
                label={say('稳定阶段', 'Settled stage')}
                value={meterPhase}
                onChange={setMeterPhase}
                options={[
                  { value: 'speeding', label: say('加速', 'Speeding') },
                  { value: 'cruising', label: say('匀速', 'Cruising') },
                  { value: 'braking', label: say('制动', 'Braking') },
                ]}
              />
              <button className="phone-sensor-predict" onClick={() => setReveal(!reveal)}>
                {reveal
                  ? say('回到测力计', 'Return to meter')
                  : say('不知道质量，能求加速度吗？', 'Can two readings eliminate mass?')}
              </button>
            </>
          ) : (
            <>
              <Range
                label={say('运动时刻', 'Physical time')}
                value={Math.min(time, state.duration)}
                min={0}
                max={state.duration}
                step={0.0001}
                unit="s"
                onChange={setTime}
              />
              {trial === 'drop' && (
                <Segments
                  label={say('查看释放响应', 'Inspect release response')}
                  value={String(time)}
                  onChange={(v) => setTime(Number(v))}
                  options={[
                    { value: '0.4', label: '0 ms' },
                    { value: '0.4006366197723676', label: '0.64 ms' },
                    { value: '0.4035', label: '3.50 ms' },
                  ]}
                />
              )}
            </>
          )}
          <details>
            <summary>
              {say('这个等效模型如何计算？', 'How is this equivalent model calculated?')}
            </summary>
            <p>
              {say(
                '微米位移已放大；示意单轴悬挂质量块与差动电容，不对应某款手机的实际芯片。弹力箭头只表示弹性项，阻尼另计；阻尼会使瞬时悬挂合力与位移读数不同。',
                'Micrometre displacement is magnified. This single-axis spring and differential capacitor represent a mechanism, not a particular phone chip. The elastic arrow excludes damping; total suspension force and displacement signal differ during a transient.',
              )}
            </p>
            <p>
              q = {number(state.q * 1e6, 3)} μm ·{' '}
              {say('悬挂合力 / 质量', 'Total suspension / mass')} ={' '}
              {number(state.suspensionPerMass, 3)} m/s²
            </p>
            <p>
              C↑/C₀ = {number(phoneElectrodes(state.q).topCapacitance, 3)} · C↓/C₀ ={' '}
              {number(phoneElectrodes(state.q).bottomCapacitance, 3)}
            </p>
            <p>
              {say(
                '向上为正，朝向固定。动态读数 f = −ω²q，校正读数为 f − g；只有稳定后才接近外壳的运动加速度。忽略质量块对外壳的反作用、旋转和噪声。',
                'Upward is positive and orientation stays fixed. The dynamic signal is f = −ω²q; its corrected signal is f − g and approaches casing acceleration only after settling. Proof-mass back-reaction, rotation and noise are omitted.',
              )}
            </p>
            <p>
              {say(
                '测力计只比较稳定阶段。用两读数消去质量还要求加速和制动的加速度大小相等。',
                'The force meter compares settled stages. Eliminating mass with two readings also requires equal acceleration and braking magnitudes.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
