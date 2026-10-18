import { useMemo, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  electronWavelengthPM,
  planeIntensity,
  powderRadii,
  laueSpots,
  interferenceHits,
  electronInterference,
} from '../../models/matter-wave-lab';
import '../../styles/modern-labs.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
export function MatterWaveArtwork({
  mode = 0,
  value = 0.6,
  progress = 0.6,
}: {
  mode?: number;
  value?: number;
  progress?: number;
}) {
  const theta = ((12 + value * 43) * Math.PI) / 180,
    lambda = electronWavelengthPM(100),
    i = planeIntensity(theta, lambda);
  const voltage = 2000 + value * 5000,
    rings = powderRadii(voltage),
    spots = useMemo(() => laueSpots((value - 0.5) * 1.2), [value]);
  const hits = useMemo(() => interferenceHits(voltage, 350), [voltage]);
  const path = Array.from({ length: 131 }, (_, j) => {
    const a = ((12 + (j / 130) * 43) * Math.PI) / 180;
    return `${j ? 'L' : 'M'}${30 + j * 2.15} ${249 - planeIntensity(a, lambda) * 65}`;
  }).join(' ');
  return (
    <svg
      className="modern-apparatus"
      viewBox="0 0 340 276"
      role="img"
      aria-label={tr(
        '由波长、晶格与相位计算的衍射实验',
        'Diffraction calculated from wavelength, lattice and phase',
      )}
    >
      {mode === 0 && (
        <>
          <path
            d={`M${170 - 118 * Math.cos(theta)} ${120 - 118 * Math.sin(theta)}L170 120`}
            stroke="#b5ac80"
            strokeWidth="3"
            fill="none"
          />
          <g
            transform={`translate(${170 - 125 * Math.cos(theta)} ${120 - 125 * Math.sin(theta)}) rotate(${(theta * 180) / Math.PI})`}
          >
            <rect x="-28" y="-12" width="40" height="24" rx="8" fill="#7c918a" />
          </g>
          <path d="M124 120H218M124 132H218M124 144H218" stroke="#a1b7af" strokeWidth="3" />
          {Array.from({ length: 24 }, (_, j) => (
            <circle
              key={j}
              cx={132 + (j % 8) * 11}
              cy={120 + Math.floor(j / 8) * 12}
              r="3"
              fill="#788e87"
            />
          ))}
          <path
            d={`M170 120L${170 + 118 * Math.cos(theta)} ${120 - 118 * Math.sin(theta)}`}
            stroke="#bd8c69"
            strokeWidth={1 + i * 3}
          />
          <g
            transform={`translate(${170 + 125 * Math.cos(theta)} ${120 - 125 * Math.sin(theta)}) rotate(${(-theta * 180) / Math.PI})`}
          >
            <rect x="-6" y="-15" width="12" height="30" rx="5" fill="#677d77" />
          </g>
          <path
            d={`M198 120A28 28 0 0 0 ${170 + 28 * Math.cos(theta)} ${120 - 28 * Math.sin(theta)}`}
            stroke="#82958b"
            fill="none"
          />
          <text x="216" y="133" fontSize="18" fill="#65786f">
            θ
          </text>
          <path d="M30 177V249H313" fill="none" stroke="#a9b5af" />
          <path d={path} fill="none" stroke="#a98165" strokeWidth="2" />
          <circle cx={30 + value * 279.5} cy={249 - i * 65} r="5" fill="#b58461" />
          <text x="31" y="271" fontSize="18" fill="#65786f">
            12°
          </text>
          <text x="272" y="271" fontSize="18" fill="#65786f">
            55°
          </text>
        </>
      )}
      {mode === 1 && (
        <>
          <rect x="18" y="40" width="304" height="95" rx="44" fill="#e9efea" stroke="#a8bbb0" />
          <rect x="39" y="74" width="55" height="25" rx="8" fill="#82978b" />
          <path
            d={`M94 86H182M182 86L287 ${86 - (105 * rings[1]) / 100}M182 86L287 ${86 + (105 * rings[1]) / 100}`}
            fill="none"
            stroke="#b7a480"
            strokeWidth="2"
          />
          <path d="M181 58V115" stroke="#899a90" strokeWidth="5" />
          <path d="M290 51V122" stroke="#6c8e81" strokeWidth="7" />
          <circle cx="228" cy="209" r="59" fill="#344f46" />
          {rings.map((r, j) => (
            <circle
              key={j}
              cx="228"
              cy="209"
              r={r * 2.4}
              fill="none"
              stroke="#c3dac0"
              strokeWidth="2"
              opacity=".9"
            />
          ))}
          <circle cx="228" cy="209" r="3" fill="#d6e3ba" />
          <text x="23" y="196" fontSize="18" fill="#687d72">
            λ = {electronWavelengthPM(voltage).toFixed(1)} pm
          </text>
          <text x="23" y="228" fontSize="18" fill="#687d72">
            U = {voltage.toFixed(0)} V
          </text>
        </>
      )}
      {mode === 2 && (
        <>
          <rect x="25" y="30" width="53" height="37" rx="13" fill="#7d938b" />
          <path
            d="M79 48H156M156 48L308 30M156 48L308 75"
            fill="none"
            stroke="#b5a47b"
            strokeWidth="2"
          />
          <path d="M156 25V73" stroke="#82978b" strokeWidth="2" />
          <text x="115" y="103" fontSize="18" fill="#65786f">
            {tr('电子双棱镜', 'Electron biprism')}
          </text>
          <rect x="28" y="123" width="284" height="86" rx="10" fill="#34483f" />
          {hits.slice(0, Math.max(1, Math.round(progress * 350))).map((h, j) => (
            <circle key={j} cx={170 + h.x * 26} cy={166 + h.y * 33} r="1.5" fill="#cfe0be" />
          ))}
          <path
            d={Array.from(
              { length: 151 },
              (_, j) =>
                `${j ? 'L' : 'M'}${40 + j * 1.73} ${263 - electronInterference(-5 + j / 15, voltage) * 42}`,
            ).join(' ')}
            fill="none"
            stroke="#8ba48b"
            strokeWidth="2"
          />
        </>
      )}
      {mode === 3 && (
        <>
          <path d="M26 68H161L256 43M161 68L256 93" stroke="#b8a983" fill="none" strokeWidth="2" />
          <rect x="20" y="51" width="60" height="34" rx="12" fill="#83968d" />
          <g transform={`translate(160 68) rotate(${((value - 0.5) * 1.2 * 180) / Math.PI})`}>
            {Array.from({ length: 9 }, (_, j) => (
              <circle
                key={j}
                cx={(j % 3) * 10 - 10}
                cy={Math.floor(j / 3) * 10 - 10}
                r="4"
                fill="#829c91"
              />
            ))}
          </g>
          <path d="M263 32V105" stroke="#a1b4aa" strokeWidth="5" />
          <rect x="104" y="125" width="155" height="145" rx="12" fill="#354a43" />
          {spots.map((s, j) => (
            <circle
              key={j}
              cx={181 + s.x * 61}
              cy={197 + s.y * 58}
              r="2.3"
              fill="#dfdfb7"
              opacity=".8"
            />
          ))}
          <circle cx="181" cy="197" r="5" fill="#24362e" stroke="#8a9b8b" />
          <text x="170" y="119" textAnchor="middle" fontSize="18" fill="#65786f">
            λ = 40–220 pm
          </text>
        </>
      )}
      {mode === 4 && (
        <>
          {[105, 153, 201].map((y) => (
            <g key={y}>
              <path d={`M25 ${y}H315`} stroke="#becac1" />
              {Array.from({ length: 8 }, (_, j) => (
                <circle key={j} cx={37 + j * 38} cy={y} r="5" fill="#92a99d" />
              ))}
            </g>
          ))}
          <path
            d="M30 32L153 105L278 32M30 80L153 153L278 80"
            stroke="#b39972"
            strokeWidth="3"
            fill="none"
          />
          <path d="M153 105V153" stroke="#7e9889" strokeWidth="2" strokeDasharray="4 4" />
          <text x="164" y="137" fontSize="18" fill="#65786f">
            d
          </text>
          <path
            d={Array.from(
              { length: 101 },
              (_, j) =>
                `${j ? 'L' : 'M'}${25 + j * 2.9} ${245 + 8 * Math.sin((j / 100) * Math.PI * 8)}`,
            ).join(' ')}
            stroke="#93a89d"
            fill="none"
          />
          <path
            d={Array.from(
              { length: 101 },
              (_, j) =>
                `${j ? 'L' : 'M'}${25 + j * 2.9} ${245 + 8 * Math.sin((j / 100) * Math.PI * 8 + value * Math.PI * 2)}`,
            ).join(' ')}
            stroke="#b99e78"
            fill="none"
          />
          <text x="29" y="25" fontSize="18" fill="#65786f">
            Δ = 2d sinθ
          </text>
        </>
      )}
    </svg>
  );
}
export default function MatterWaveLab() {
  const film = useShowcase();
  const xray = film.variant?.includes('xray');
  const [selected, setSelected] = useState(xray ? 3 : 0),
    [manual, setManual] = useState(0.5);
  const mode = film.watch ? ([0, 0, 1, 2, 3, 4, 3][film.chapter] ?? 0) : selected;
  const value = film.watch ? (mode === 4 ? 1 : mode === 2 ? 0 : film.chapterProgress) : manual;
  const names = [
    ['晶体反射', 'Crystal reflection'],
    ['薄膜衍射环', 'Foil diffraction rings'],
    ['干涉积累', 'Interference accumulation'],
    ['X射线斑点', 'X-ray spots'],
    ['晶面相位', 'Plane phases'],
  ];
  const readout =
    mode === 0
      ? `θ = ${(12 + value * 43).toFixed(1)}° · ${tr('相对强度', 'Relative intensity')} ${planeIntensity(((12 + value * 43) * Math.PI) / 180, electronWavelengthPM(100)).toFixed(2)}`
      : mode === 1 || mode === 2
        ? `λ = ${electronWavelengthPM(2000 + value * 5000).toFixed(2)} pm`
        : mode === 3
          ? tr('多色X射线 · 简单立方晶格', 'Polychromatic X-rays · Simple cubic lattice')
          : tr('相邻晶面的路程差决定相位差', 'Path difference sets the phase difference');
  return (
    <div className="modern-series modern-lab">
      {!film.watch && (
        <div className="modern-paths">
          {names.map((n, j) => (
            <button
              key={j}
              type="button"
              aria-pressed={selected === j}
              onClick={() => setSelected(j)}
            >
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">{readout}</div>
      <MatterWaveArtwork
        mode={mode}
        value={value}
        progress={film.watch ? film.chapterProgress : 0.8}
      />
      <p className="modern-key">
        {mode === 0
          ? tr(
              '同一波长，改变角度会改变晶面之间的相位差。',
              'At fixed wavelength, angle changes the phase difference between planes.',
            )
          : mode < 3
            ? tr(
                '电子的动量改变，条纹尺度随波长改变。',
                'Changing electron momentum changes the wavelength and pattern scale.',
              )
            : tr(
                '斑点由晶格方向与弹性散射条件共同决定。',
                'Lattice orientation and elastic scattering determine the spots.',
              )}
      </p>
      {!film.watch && (
        <div className="modern-controls">
          <Range
            label={
              mode === 0
                ? tr('掠射角', 'Grazing angle')
                : mode < 3
                  ? tr('加速电压', 'Accelerating voltage')
                  : mode === 3
                    ? tr('晶体转角', 'Crystal rotation')
                    : tr('相位差 / 2π', 'Phase difference / 2π')
            }
            value={manual}
            min={0}
            max={1}
            step={0.005}
            onChange={setManual}
          />
        </div>
      )}
    </div>
  );
}
