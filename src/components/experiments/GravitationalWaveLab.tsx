import { useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  weberResponse,
  binaryPulsar,
  inspiral,
  interferometerStrain,
} from '../../models/gravitational-wave-lab';
import '../../styles/modern-labs.css';
import '../../styles/astronomy-labs.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const path = (ps: { x: number; y: number }[]) =>
  ps.map((p, j) => `${j ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
export function GravitationalArtwork({
  mode = 0,
  phase = 0,
  value = 0.5,
  frequency = 1660,
  common = true,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  frequency?: number;
  common?: boolean;
}) {
  const w = weberResponse(frequency),
    osc = (w.amplitude / 7.5e-16) * Math.sin(2 * Math.PI * value * 5),
    binary = binaryPulsar(value * 30, value * 3),
    chirp = inspiral(value * 0.295),
    arm = interferometerStrain(chirp.strain),
    deformX = arm.dx * 1e18,
    deformY = arm.dy * 1e18;
  return (
    <svg
      className="astronomy-art"
      viewBox="0 0 340 300"
      role="img"
      aria-label={tr(
        '共振棒、脉冲星计时与激光干涉仪',
        'Resonant bar, pulsar timing and laser interferometer',
      )}
    >
      {mode === 0 && (
        <>
          <path d="M90 21V55M250 21V55" stroke="#9ab4b1" />
          <rect
            x={54 - osc * 5}
            y="56"
            width={232 + osc * 10}
            height="66"
            rx="28"
            fill="#91a4a4"
            stroke="#c4d0c2"
          />
          <ellipse cx={69 - osc * 5} cy="89" rx="15" ry="31" fill="#b9c4b6" />
          <rect x="166" y="57" width="8" height="64" rx="3" fill="#cdbb94" />
          <path d="M170 121V145H283V172" fill="none" stroke="#bdc6b4" />
          <rect x="253" y="172" width="60" height="30" rx="8" fill="#2e4953" stroke="#95ada7" />
          <text x="170" y="158" textAnchor="middle" fontSize="19" fill="#c4d3c7">
            {frequency.toFixed(0)} Hz · Q=1000
          </text>
          {[0, 1].map((j) => (
            <g key={j}>
              <path d={`M28 ${219 + j * 45}H309`} stroke="#42636f" />
              <path
                d={path(
                  Array.from({ length: 181 }, (_, i) => {
                    const p = i / 180,
                      t = p * 5,
                      signal = common ? Math.exp(-3 * p) * Math.sin(t * 6.28) : 0,
                      noise = 0.14 * Math.sin(t * (j ? 4.3 : 7.1) + j);
                    return { x: 29 + p * 278, y: 219 + j * 45 - 17 * (signal + noise) };
                  }),
                )}
                fill="none"
                stroke={j ? '#8eb3b1' : '#d1bb8b'}
                strokeWidth="1.5"
              />
              <text x="14" y={224 + j * 45} fontSize="18" fill="#d0d9c8">
                {j ? 'B' : 'A'}
              </text>
            </g>
          ))}
        </>
      )}
      {mode === 1 && (
        <>
          <ellipse cx="84.08" cy="102" rx="42" ry="33.05" fill="none" stroke="#506e78" />
          <ellipse cx="137.15" cy="102" rx="44" ry="34.63" fill="none" stroke="#506e78" />
          <circle cx={110 + binary.x * 42} cy={102 - binary.y * 42} r="7" fill="#c9d8ca" />
          <circle cx={110 - binary.x * 44} cy={102 + binary.y * 44} r="6" fill="#90b3bc" />
          <path
            d={`M${110 + binary.x * 42} ${102 - binary.y * 42}L267 103`}
            stroke="#98b7b3"
            strokeDasharray="3 5"
          />
          <path d="M251 73Q276 85 290 111Q255 119 251 73Z" fill="#79949b" stroke="#bac8ba" />
          <path d="M278 108V147M260 147H297" stroke="#9aafa5" strokeWidth="3" />
          <text x="170" y="186" textAnchor="middle" fontSize="20" fill="#c6d4c7">
            {phase === 0
              ? `${binary.observedPulseMs.toFixed(3)} ms`
              : `dP/dt = ${(binary.pdot * 1e12).toFixed(3)}×10⁻¹²`}
          </text>
          <path d="M35 209H310M35 209V280" fill="none" stroke="#6c8d96" />
          <path
            d={path(
              Array.from({ length: 101 }, (_, j) => ({
                x: 35 + j * 2.7,
                y:
                  phase === 0
                    ? 245 - (binaryPulsar(0, j / 100).observedPulseMs - 59.03) * 240
                    : 210 - binaryPulsar(j * 0.3).advance * 1.6,
              })),
            )}
            stroke="#c5b187"
            fill="none"
            strokeWidth="2"
          />
          <text x="304" y="297" textAnchor="end" fontSize="18" fill="#c6d4c7">
            {phase === 0
              ? tr('轨道相位', 'Orbital phase')
              : tr('30年 · 理论预测', '30 years · GR prediction')}
          </text>
        </>
      )}
      {mode === 2 && (
        <>
          <path
            d={`M46 149H138V${42 - deformY}M138 149H${285 + deformX}M138 149V207`}
            stroke="#d6bd81"
            strokeWidth="2"
            fill="none"
          />
          <path
            d={`M122 ${42 - deformY}H154M${285 + deformX} 133V165M128 82H148M242 139V159M126 161L150 137`}
            stroke="#b5cbc5"
            strokeWidth="4"
          />
          <rect x="26" y="140" width="20" height="18" rx="5" fill="#93ada3" />
          <rect x="126" y="207" width="24" height="13" rx="4" fill="#91ada5" />
          <text x="168" y="75" fill="#c4d2c5" fontSize="19">
            4 km
          </text>
          <text x="211" y="181" fill="#c4d2c5" fontSize="19">
            4 km
          </text>
          <text x="170" y="25" textAnchor="middle" fill="#c4d2c5" fontSize="18">
            {tr('臂长变化已极度放大', 'Arm changes greatly magnified')}
          </text>
          {[0, 1].map((j) => (
            <path
              key={j}
              d={path(
                Array.from({ length: 240 }, (_, i) => {
                  const tt = (i / 239) * 0.295 - (phase === 1 && j === 1 ? 0.007 : 0),
                    h = tt < 0 ? 0 : inspiral(tt).strain * (phase === 0 && j === 1 ? -1 : 1);
                  return { x: 24 + (i / 239) * 292, y: 243 + j * 33 - (h / 1e-21) * 9 };
                }),
              )}
              stroke={j ? '#8bb5b2' : '#d2b98b'}
              strokeWidth="1.2"
              fill="none"
            />
          ))}
        </>
      )}
    </svg>
  );
}
const ids = ['required-1-weber-bar', 'required-1-binary-pulsar', 'required-2-ligo'];
export default function GravitationalWaveLab() {
  const film = useShowcase(),
    [selected, setSelected] = useState(
      film.variant === 'required-1-ligo-appendix'
        ? 2
        : Math.max(0, ids.indexOf(film.variant ?? '')),
    ),
    [manual, setManual] = useState(0.5),
    [freq, setFreq] = useState(1660),
    [common, setCommon] = useState(true);
  const mode = film.watch ? Math.floor(film.chapter / 2) : selected,
    phase = film.watch ? film.chapter % 2 : 1,
    value = film.watch ? film.chapterProgress : manual,
    f = film.watch ? (phase === 0 ? 1640 + value * 40 : 1660) : freq,
    chirp = inspiral(value * 0.295),
    dl = interferometerStrain(chirp.strain),
    names = [
      ['韦伯棒', 'Weber bar'],
      ['双星脉冲', 'Binary pulsar'],
      ['LIGO干涉仪', 'LIGO interferometer'],
    ];
  return (
    <div className="astronomy-lab">
      {!film.watch && (
        <div className="modern-paths">
          {names.map((n, j) => (
            <button type="button" key={j} aria-pressed={mode === j} onClick={() => setSelected(j)}>
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {mode === 0
          ? `${tr('示例响应', 'Illustrative response')} ${(weberResponse(f).amplitude * 1e15).toFixed(3)} fm`
          : mode === 1
            ? phase === 0
              ? `P = ${binaryPulsar(0, value * 3).observedPulseMs.toFixed(3)} ms`
              : `Δt = ${binaryPulsar(value * 30).advance.toFixed(2)} s`
            : `f = ${chirp.frequency.toFixed(0)} Hz · ΔL = ${(dl.difference * 1e18).toFixed(2)} am`}
      </div>
      <GravitationalArtwork
        mode={mode}
        phase={phase}
        value={value}
        frequency={f}
        common={film.watch ? true : common}
      />
      <p className="modern-key">
        {
          [
            tr(
              '韦伯提出的早期探测结果未获独立证实；两条曲线只是教学对照。',
              'Weber’s claimed detections were not independently confirmed; these traces are illustrative.',
            ),
            tr(
              '轨道周期持续缩短提供间接证据，曲线显示广义相对论预测。',
              'A shrinking orbital period provides indirect evidence; the curve is a GR prediction.',
            ),
            tr(
              '两臂的相反伸缩改变干涉信号，两站延迟帮助检验共同来源。',
              'Opposite arm changes affect interference; a two-site delay helps test a shared source.',
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
            step={0.002}
            onChange={setManual}
          />
          {mode === 0 && (
            <>
              <Range
                label={tr('驱动频率 / Hz', 'Drive frequency / Hz')}
                value={freq}
                min={1600}
                max={1720}
                step={1}
                onChange={setFreq}
              />
              <button type="button" aria-pressed={common} onClick={() => setCommon(!common)}>
                {common
                  ? tr('对照：去掉共同信号', 'Compare: remove common signal')
                  : tr('加入共同示例信号', 'Add a common illustrative signal')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
