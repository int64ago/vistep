import { useId, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  mechanicalPolarizer,
  observedPolarization,
  dielectricReflection,
} from '../../models/polarization-evidence-lab';
import '../../styles/modern-labs.css';
import '../../styles/polarization-evidence-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const sources = ['window', 'glass', 'table', 'lcd'] as const;
export function PolarEvidenceArtwork({
  mode = 0,
  longitudinal = false,
  angle = 0,
  time = 0.3,
  source = 0,
  incidence = 56.31,
}: {
  mode?: number;
  longitudinal?: boolean;
  angle?: number;
  time?: number;
  source?: number;
  incidence?: number;
}) {
  const id = useId().replaceAll(':', ''),
    project = (x: number, y: number, z: number) => ({
      x: 170 + x * 135 + z * 14,
      y: 105 - y * 25 + z * 13,
    }),
    u = (angle * Math.PI) / 180,
    a = project(0, 1.5 * Math.cos(u), 1.5 * Math.sin(u)),
    b = project(0, -1.5 * Math.cos(u), -1.5 * Math.sin(u)),
    light = observedPolarization(sources[source], angle, incidence),
    color = Math.round(30 + 205 * Math.sqrt(light.intensity));
  const rope = (start: number, end: number) =>
    Array.from({ length: 141 }, (_, j) => {
      const x = start + ((end - start) * j) / 140,
        s = mechanicalPolarizer(x, time, angle, longitudinal),
        p = project(s.x, s.y, s.z);
      return `${j ? 'L' : 'M'}${p.x} ${p.y}`;
    }).join(' ');
  const spring = Array.from({ length: 481 }, (_, j) => {
    const x = -0.95 + (j / 480) * 1.9,
      s = mechanicalPolarizer(x, time, angle, true),
      p = project(
        s.x,
        0.28 * Math.sin((j / 480) * 2 * Math.PI * 26),
        0.28 * Math.cos((j / 480) * 2 * Math.PI * 26),
      );
    return `${j ? 'L' : 'M'}${p.x} ${p.y}`;
  }).join(' ');
  return (
    <svg
      className="polar-evidence-art"
      viewBox="0 0 340 350"
      role="img"
      aria-label={tr(
        '机械波通过旋转狭缝与自然光源偏振观察',
        'Mechanical slit polarization and real-light-source comparison',
      )}
    >
      <defs>
        <clipPath id={id}>
          <circle cx="170" cy="251" r="80" />
        </clipPath>
      </defs>
      {mode === 0 ? (
        <>
          <path d="M137 54L190 65L204 157L149 146Z" fill="#c2ccb68c" stroke="#899b7f" />
          <path
            d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
            stroke="#f5f5e9"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {longitudinal ? (
            <path d={spring} fill="none" stroke="#749078" strokeWidth="2" />
          ) : (
            <>
              <path d={rope(-0.95, 0)} fill="none" stroke="#78977b" strokeWidth="3" />
              <path d={rope(0, 0.95)} fill="none" stroke="#b2956a" strokeWidth="3" />
            </>
          )}
          <path d="M40 184H300m-8-5 8 5-8 5" stroke="#9caf9a" fill="none" />
          <text x="170" y="218" textAnchor="middle" fontSize="20" fill="#607a64">
            {tr('波的传播方向', 'Propagation direction')}
          </text>
          <circle cx="170" cy="285" r="43" fill="#e5eadd" stroke="#b0bfa7" />
          <path
            d={`M${170 - 35 * Math.sin(u)} ${285 - 35 * Math.cos(u)}L${170 + 35 * Math.sin(u)} ${285 + 35 * Math.cos(u)}`}
            stroke="#879d80"
            strokeWidth="7"
          />
          {longitudinal ? (
            <circle cx="170" cy="285" r="6" fill="#b29668" />
          ) : (
            <path
              d="M170 261V309m-5-6 5 6 5-6m-10-36 5-6 5 6"
              fill="none"
              stroke="#b29668"
              strokeWidth="2"
            />
          )}
          <text x="170" y="350" textAnchor="middle" fontSize="20" fill="#607a64">
            {longitudinal
              ? tr('纵向振动不被方位筛选', 'Longitudinal: no axis selection')
              : tr('端视：比较振动与狭缝', 'End view: motion and slit')}
          </text>
        </>
      ) : (
        <>
          {source === 0 ? (
            <>
              <rect
                x="99"
                y="22"
                width="142"
                height="100"
                rx="4"
                fill="#dbe6d4"
                stroke="#90aa90"
                strokeWidth="5"
              />
              <path d="M170 25V120M102 70H239" stroke="#90aa90" strokeWidth="5" />
              <path d="M58 49L95 60M54 79H94M62 111L95 92" stroke="#b6c49f" strokeWidth="2" />
            </>
          ) : source === 3 ? (
            <>
              <rect x="129" y="13" width="82" height="122" rx="14" fill="#7f9583" />
              <rect x="135" y="26" width="70" height="94" rx="5" fill="#dbe5cd" />
              <text x="170" y="81" textAnchor="middle" fontSize="24" fill="#647b64">
                ABC
              </text>
            </>
          ) : (
            <>
              <path
                d="M65 117H282L303 138H46Z"
                fill={source === 1 ? '#d1e0d6' : '#bda981'}
                stroke="#8aa18f"
              />
              <path
                d={`M${170 - 80 * Math.sin((incidence * Math.PI) / 180)} ${117 - 80 * Math.cos((incidence * Math.PI) / 180)}L170 117L${170 + 80 * Math.sin((incidence * Math.PI) / 180)} ${117 - 80 * Math.cos((incidence * Math.PI) / 180)}`}
                fill="none"
                stroke="#c0a676"
                strokeWidth="2"
              />
              <path d="M170 40V120" stroke="#a8b9a1" strokeDasharray="4 4" />
              <text x="170" y="29" textAnchor="middle" fontSize="20" fill="#607a64">
                i = {incidence.toFixed(1)}°
              </text>
            </>
          )}
          <circle cx="170" cy="251" r="85" fill="#7a937a" />
          <circle
            cx="170"
            cy="251"
            r="80"
            fill={`rgb(${color},${Math.min(255, color + 10)},${Math.max(20, color - 12)})`}
          />
          <g clipPath={`url(#${id})`}>
            {source === 3 ? (
              <text
                x="170"
                y="264"
                textAnchor="middle"
                fontSize="40"
                fill={`rgb(${Math.round(color * 0.28)},${Math.round(color * 0.35)},${Math.round(color * 0.28)})`}
              >
                ABC
              </text>
            ) : source === 0 ? (
              <path d="M170 170V332M86 251H254" stroke="#779170" strokeWidth="9" opacity=".5" />
            ) : (
              <path
                d="M90 270L250 220M90 284L250 234"
                stroke="#f0edcf"
                strokeWidth="12"
                opacity={light.intensity}
              />
            )}
          </g>
          <path
            d={`M${170 + 82 * Math.cos(u)} ${251 + 82 * Math.sin(u)}L${170 + 99 * Math.cos(u)} ${251 + 99 * Math.sin(u)}`}
            stroke="#b69d70"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <text x="170" y="350" textAnchor="middle" fontSize="20" fill="#607a64">
            {tr('透过旋转偏振片', 'Through a rotating analyzer')}
          </text>
        </>
      )}
    </svg>
  );
}
export default function PolarizationEvidenceLab() {
  const f = useShowcase(),
    [which, setWhich] = useState(f.variant === 'e1-polarization-real-sources' ? 1 : 0),
    [angle, setAngle] = useState(0),
    [source, setSource] = useState(0),
    [longitudinal, setLongitudinal] = useState(false),
    [incidence, setIncidence] = useState(56.31);
  const mode = f.watch ? (f.chapter < 3 ? 0 : 1) : which,
    phase = f.watch ? (mode ? f.chapter - 3 : f.chapter) : 0,
    p = f.watch ? f.chapterProgress : 0.3,
    theta = f.watch ? (mode ? 180 * p : phase === 0 ? 0 : 90 * p) : angle,
    long = f.watch ? mode === 0 && phase === 2 : longitudinal,
    src = f.watch ? phase : source,
    activeIncidence = f.watch ? 56.31 : incidence,
    light = observedPolarization(sources[Math.min(3, src)], theta, activeIncidence);
  return (
    <div className="modern-lab polar-evidence-lab">
      {!f.watch && (
        <div className="modern-paths">
          {[tr('绳与弹簧', 'Rope and spring'), tr('生活中的光', 'Everyday light')].map((v, j) => (
            <button type="button" key={j} aria-pressed={mode === j} onClick={() => setWhich(j)}>
              {v}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {mode
          ? `${tr('相对入片光强', 'Fraction of incident analyzer light')} = ${(light.intensity * 100).toFixed(1)}%`
          : `θ = ${theta.toFixed(0)}° · ${tr('透过能流比例', 'Transmitted power')} = ${(100 * (long ? 1 : Math.cos((theta * Math.PI) / 180) ** 2)).toFixed(1)}%`}
      </div>
      <PolarEvidenceArtwork
        mode={mode}
        longitudinal={long}
        angle={theta}
        time={p * 4}
        source={Math.min(3, src)}
        incidence={activeIncidence}
      />
      <p className="modern-key">
        {mode
          ? src === 0
            ? tr(
                '理想自然光各方向平均相同，转动一片偏振片不改变明暗。',
                'Ideal unpolarized light has equal transverse averages, so rotating one analyzer does not change brightness.',
              )
            : src === 3
              ? tr(
                  '液晶屏出射光常有明显偏振，转动偏振片可使文字与背景一起变暗。',
                  'LCD output is often strongly polarized; rotating an analyzer dims both text and background.',
                )
              : tr(
                  '光滑介质反射对两个偏振分量不同，明暗随偏振片方向改变。',
                  'Smooth dielectric reflection treats polarization components differently, making analyzer orientation visible.',
                )
          : long
            ? tr(
                '纵波位移沿传播轴，转动横向狭缝不筛选该方向。',
                'Longitudinal motion follows the propagation axis and is not selected by transverse slit orientation.',
              )
            : tr(
                '沿狭缝的横向分量透过，垂直分量被反射。',
                'The transverse component along the slit passes; the blocked component reflects.',
              )}
      </p>
      {!f.watch && (
        <div className="modern-explore">
          {mode ? (
            <div className="modern-paths">
              {[
                tr('窗中自然光', 'Window'),
                tr('玻璃反射', 'Glass'),
                tr('光滑桌面', 'Glossy table'),
                tr('液晶屏', 'LCD'),
              ].map((v, j) => (
                <button
                  type="button"
                  key={j}
                  aria-pressed={source === j}
                  onClick={() => setSource(j)}
                >
                  {v}
                </button>
              ))}
            </div>
          ) : (
            <div className="modern-paths">
              <button
                type="button"
                aria-pressed={longitudinal}
                onClick={() => setLongitudinal(!longitudinal)}
              >
                {longitudinal
                  ? tr('纵波弹簧', 'Longitudinal spring')
                  : tr('横波绳', 'Transverse rope')}
              </button>
            </div>
          )}
          <Range
            label={tr('转动角度 / °', 'Rotation / °')}
            value={angle}
            min={0}
            max={180}
            step={1}
            onChange={setAngle}
          />
          {mode && (source === 1 || source === 2) && (
            <Range
              label={tr('反射入射角 / °', 'Reflection incidence / °')}
              value={incidence}
              min={0}
              max={80}
              step={0.1}
              onChange={setIncidence}
            />
          )}
        </div>
      )}
    </div>
  );
}
