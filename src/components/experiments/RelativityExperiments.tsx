import { useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  etherFringes,
  simultaneity,
  muonFlight,
  flightClock,
} from '../../models/relativity-experiments';
import '../../styles/modern-labs.css';
import '../../styles/astronomy-labs.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
export function RelativityArtwork({
  mode = 0,
  phase = 0,
  value = 0.5,
  beta = 0.995,
  height = 10000,
  direction = 1,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  beta?: number;
  height?: number;
  direction?: number;
}) {
  const angle = (value * Math.PI) / 2,
    shift = etherFringes(angle) - etherFringes(0),
    sim = simultaneity(0.6),
    t = value * sim.arrivalLeft,
    observer = 170 + sim.beta * t * 120,
    mu = muonFlight(beta, 10000, value),
    clock = flightClock(direction, height, 40 * value),
    orbitAngle = direction * value * Math.PI * 2;
  return (
    <svg
      className="astronomy-art relativity-art"
      viewBox="0 0 340 300"
      role="img"
      aria-label={tr(
        '相对论实验中的光路、事件与时钟比较',
        'Light paths, events and clock comparisons in relativity',
      )}
    >
      {mode === 0 && (
        <>
          <g transform={`rotate(${value * 90} 163 119)`}>
            <circle cx="163" cy="119" r="88" fill="#253c45" stroke="#58767d" />
            <path
              d="M90 119H163V45M163 119H237M163 119V190"
              fill="none"
              stroke="#d2bc85"
              strokeWidth="2"
            />
            <path d="M145 137L181 101" stroke="#adc4bd" strokeWidth="5" />
            <path d="M145 44H181M238 101V137" stroke="#bccac1" strokeWidth="5" />
            <rect x="72" y="111" width="18" height="16" rx="4" fill="#8ea89d" />
            <rect x="151" y="185" width="24" height="12" rx="4" fill="#9cb3aa" />
          </g>
          <path d="M281 38V184M276 177L281 184L286 177" fill="none" stroke="#70919b" />
          <text x="305" y="117" fill="#b8cac5" fontSize="20">
            v
          </text>
          {[0, 1].map((j) => (
            <g key={j}>
              <text x="16" y={238 + j * 39} fill="#c1d0c8" fontSize="18">
                {j === 0 ? tr('预期', 'Model') : tr('观测', 'Result')}
              </text>
              {Array.from({ length: 88 }, (_, i) => (
                <rect
                  key={i}
                  x={104 + i * 2.4}
                  y={220 + j * 39}
                  width="2.5"
                  height="25"
                  fill="#d5dfc4"
                  opacity={
                    0.12 +
                    (0.8 * (1 + Math.cos(2 * Math.PI * (i / 15 - (j === 0 ? shift : 0))))) / 2
                  }
                />
              ))}
            </g>
          ))}
        </>
      )}
      {mode === 1 && (
        <>
          <path d="M24 157H321M24 164H321" stroke="#6f898c" />
          {Array.from({ length: 17 }, (_, j) => (
            <path key={j} d={`M${27 + j * 18} 157v10`} stroke="#57777f" />
          ))}
          <g transform={`translate(${observer - 60} 0)`}>
            <rect x="0" y="104" width="120" height="43" rx="8" fill="#738e91" />
            {[10, 44, 78].map((x) => (
              <rect key={x} x={x} y="112" width="25" height="16" rx="3" fill="#b5c8c1" />
            ))}
            <circle cx="20" cy="149" r="7" fill="#374f59" stroke="#bed0c7" />
            <circle cx="101" cy="149" r="7" fill="#374f59" stroke="#bed0c7" />
          </g>
          <path d="M110 66V93M230 66V93" stroke="#b7c9c4" />
          <text x="110" y="55" fontSize="20" fill="#c6d5c8" textAnchor="middle">
            A
          </text>
          <text x="230" y="55" fontSize="20" fill="#c6d5c8" textAnchor="middle">
            B
          </text>
          {t <= sim.arrivalLeft && <circle cx={110 + 120 * t} cy="86" r="5" fill="#dfbd7e" />}
          {t <= sim.arrivalRight && <circle cx={230 - 120 * t} cy="86" r="5" fill="#dfbd7e" />}
          <path d={`M${observer} 87v36`} stroke="#d9e0c7" strokeWidth="2" />
          <circle cx={observer} cy="82" r="5" fill="#dce2cb" />
          {phase === 0 ? (
            <>
              <text x="170" y="220" textAnchor="middle" fontSize="20" fill="#c4d2ca">
                {tr('地面：同时发出', 'Ground: emitted together')}
              </text>
              <text x="170" y="260" textAnchor="middle" fontSize="20" fill="#c4d2ca">
                {t >= sim.arrivalRight
                  ? tr('B先到达乘客', 'B reaches the passenger first')
                  : tr('光速相同，路程不同', 'Same light speed, different distances')}
              </text>
            </>
          ) : (
            <>
              <path d="M37 234H306" stroke="#79949b" />
              <path d="M170 224V244" stroke="#a5bcb6" />
              <circle cx="109" cy="234" r="5" fill="#d6bd86" />
              <circle cx="231" cy="234" r="5" fill="#d6bd86" />
              <text x="109" y="214" textAnchor="middle" fontSize="20" fill="#c4d2ca">
                B
              </text>
              <text x="231" y="214" textAnchor="middle" fontSize="20" fill="#c4d2ca">
                A
              </text>
              <text x="170" y="280" textAnchor="middle" fontSize="20" fill="#c4d2ca">
                t′B = −0.375 · t′A = +0.375
              </text>
            </>
          )}
        </>
      )}
      {mode === 2 && (
        <>
          <path
            d="M21 43Q74 18 124 42T244 40T319 39"
            stroke="#789aa7"
            fill="none"
            strokeWidth="3"
          />
          <path d="M24 254L66 216L87 236L121 204L157 247H320" fill="#5e7c82" />
          <path
            d="M42 65V211M36 71L42 65L48 71M36 205L42 211L48 205"
            fill="none"
            stroke="#93b5b7"
          />
          <text x="57" y="143" fontSize="20" fill="#d0d8c8">
            10 km
          </text>
          <path d="M165 53V241" stroke="#839e9d" strokeDasharray="3 6" />
          <circle cx="165" cy={53 + value * 188} r="6" fill="#d8be8b" />
          <rect x="138" y="239" width="56" height="16" rx="4" fill="#acbfb1" />
          {Array.from({ length: 100 }, (_, j) => (
            <circle
              key={j}
              cx={235 + (j % 10) * 7.5}
              cy={73 + Math.floor(j / 10) * 13}
              r="2.7"
              fill={j / 100 < mu.survival ? '#d4c49a' : '#344e5b'}
            />
          ))}
          <text x="275" y="225" textAnchor="middle" fill="#cbd4c7" fontSize="20">
            {(mu.survival * 100).toFixed(1)}%
          </text>
          <text x="170" y="289" textAnchor="middle" fill="#cbd4c7" fontSize="20">
            {phase === 0
              ? `γ = ${mu.gamma.toFixed(2)}`
              : `L′ = ${(mu.contractedHeight / 1000).toFixed(2)} km`}
          </text>
        </>
      )}
      {mode === 3 && (
        <>
          <circle cx="108" cy="111" r="57" fill="#668d99" />
          <ellipse cx="108" cy="111" rx="59" ry="19" fill="none" stroke="#a2b4ae" />
          <circle cx="108" cy="111" r="75" fill="none" stroke="#6d8e98" strokeDasharray="3 5" />
          <g
            transform={`translate(${108 + 75 * Math.cos(orbitAngle)} ${111 - 75 * Math.sin(orbitAngle)}) rotate(${(-orbitAngle * 180) / Math.PI + (direction < 0 ? 180 : 0)})`}
          >
            <path d="M0 -10L3 -2L13 3L13 6L3 4L2 11H-2L-3 4L-13 6L-13 3L-3 -2Z" fill="#d7d6ba" />
          </g>
          <rect x="214" y="48" width="105" height="50" rx="12" fill="#344e58" stroke="#90aba7" />
          <text x="266" y="79" textAnchor="middle" fontSize="20" fill="#d0dcc7">
            {(value * 40).toFixed(1)} h
          </text>
          <text x="266" y="127" textAnchor="middle" fontSize="20" fill="#d0dcc7">
            {direction > 0 ? tr('向东', 'Eastbound') : tr('向西', 'Westbound')}
          </text>
          {[
            [clock.gravity, tr('高度', 'Height')],
            [clock.kinetic, tr('运动', 'Motion')],
            [clock.total, tr('合计', 'Total')],
          ].map(([v, label], j) => (
            <g key={j}>
              <text x="24" y={204 + j * 35} fontSize="18" fill="#c2d1c6">
                {label}
              </text>
              <path d={`M164 ${190 + j * 35}v22`} stroke="#577b85" />
              <rect
                x={164 + Math.min(0, Number(v) * 0.26)}
                y={193 + j * 35}
                width={Math.abs(Number(v) * 0.26)}
                height="15"
                rx="4"
                fill={j === 2 ? '#cfb98b' : '#8ba9a3'}
              />
              <text x="316" y={205 + j * 35} textAnchor="end" fontSize="17" fill="#c8d8cc">
                {Number(v).toFixed(0)}
              </text>
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
const ids = [
  'required-2-michelson-morley',
  'required-2-simultaneity',
  'required-2-muons',
  'required-2-atomic-clocks',
];
export default function RelativityExperiments() {
  const film = useShowcase(),
    [selected, setSelected] = useState(Math.max(0, ids.indexOf(film.variant ?? ''))),
    [manual, setManual] = useState(0.6),
    [beta, setBeta] = useState(0.995),
    [height, setHeight] = useState(10000),
    [direction, setDirection] = useState(1);
  const mode = film.watch ? Math.floor(film.chapter / 2) : selected,
    phase = film.watch ? film.chapter % 2 : 1,
    value = film.watch ? film.chapterProgress : manual,
    sign = film.watch ? (phase === 0 ? 1 : -1) : direction,
    effectiveBeta = film.watch ? 0.995 : beta,
    effectiveHeight = film.watch ? 10000 : height,
    mu = muonFlight(effectiveBeta, 10000, value),
    clock = flightClock(sign, effectiveHeight, 40 * value),
    names = [
      ['干涉仪检验', 'Interferometer'],
      ['同时性', 'Simultaneity'],
      ['μ子寿命', 'Muon survival'],
      ['飞行原子钟', 'Flying clocks'],
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
          ? `${tr('转角', 'Rotation')} ${(value * 90).toFixed(0)}° · ${tr('预期移动', 'Expected shift')} ${(etherFringes((value * Math.PI) / 2) - etherFringes(0)).toFixed(2)}`
          : mode === 1
            ? `${tr('地面同时发出', 'Simultaneous on the ground')} · v = 0.6c`
            : mode === 2
              ? `t = ${(mu.labTime * 1e6).toFixed(2)} μs · τ = ${(mu.properTime * 1e6).toFixed(2)} μs`
              : `Δτ = ${clock.total.toFixed(1)} ns`}
      </div>
      <RelativityArtwork
        mode={mode}
        phase={phase}
        value={value}
        beta={effectiveBeta}
        height={effectiveHeight}
        direction={sign}
      />
      <p className="modern-key">
        {
          [
            tr(
              '未观察到以太风模型预期的条纹移动；下栏是理想零结果示意。',
              'The expected ether-wind shift was absent; the lower strip illustrates an ideal null result.',
            ),
            tr(
              '接收时刻与发出时刻不同；洛伦兹变换比较的是同一对事件。',
              'Reception and emission times differ; the Lorentz transformation compares the same two events.',
            ),
            tr(
              '用μ子的固有寿命计算，到达地面的存活比例显著增加。',
              'Using the muon’s proper lifetime predicts much greater survival to the ground.',
            ),
            tr(
              '相对地面钟的差值，同时包含运动效应与高度效应。',
              'The difference from a ground clock includes both motion and altitude.',
            ),
          ][mode]
        }
      </p>
      {!film.watch && (
        <div className="modern-explore">
          <Range
            label={
              mode === 0
                ? tr('仪器转动进度', 'Instrument rotation')
                : tr('观察进度', 'Observation progress')
            }
            value={manual}
            min={0}
            max={1}
            step={0.005}
            onChange={setManual}
          />
          {mode === 2 && (
            <Range
              label={tr('μ子速度 / c', 'Muon speed / c')}
              value={beta}
              min={0.9}
              max={0.999}
              step={0.001}
              onChange={setBeta}
            />
          )}{' '}
          {mode === 3 && (
            <>
              <Range
                label={tr('飞行高度 / m', 'Flight altitude / m')}
                value={height}
                min={0}
                max={15000}
                step={100}
                onChange={setHeight}
              />
              <button type="button" onClick={() => setDirection(-direction)}>
                {tr('切换飞行方向', 'Reverse flight direction')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
