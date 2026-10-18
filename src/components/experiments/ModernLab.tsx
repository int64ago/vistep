import { useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import {
  photoelectric,
  oilDrop,
  electronBeam,
  thomsonTrajectory,
  lambQuenching,
  comptonShift,
  planckRadiance,
  wienPeakNM,
  balmerWavelength,
  electronWavelengthPM,
  braggAngle,
  rutherfordTrajectory,
  rutherfordAngle,
  finiteClamp,
} from '../../models/modern-labs';
import '../../styles/modern-labs.css';

export type ModernKind =
  | 'blackbody'
  | 'zinc'
  | 'photoelectric'
  | 'planck'
  | 'oil'
  | 'electron'
  | 'lenard'
  | 'rutherford'
  | 'compton'
  | 'hydrogen'
  | 'sodium'
  | 'solar'
  | 'lamb'
  | 'electron-diffraction';
const text = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const palette = ['#bd645f', '#69a6ad', '#8782b6', '#b1a0bf'];
const spectrum = (nm: number) =>
  nm > 600 ? '#ca7a65' : nm > 540 ? '#c7b878' : nm > 480 ? '#7ea59d' : '#8f91c0';
function line(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
}
function Wire({ d }: { d: string }) {
  return (
    <path
      d={d}
      stroke="#9daaa2"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export function ModernLabArtwork({
  kind,
  value = 0.6,
  intensity = 1,
  voltage = 0,
  progress = 0.6,
  phase = 3,
  cover = false,
  charges = 4,
}: {
  kind: ModernKind;
  value?: number;
  intensity?: number;
  voltage?: number;
  progress?: number;
  phase?: number;
  cover?: boolean;
  charges?: number;
}) {
  const id = useId().replace(/:/g, ''),
    p = finiteClamp(progress, 0, 1);
  const scatter = useMemo(() => [0.5, 2, 5, 10].map((b) => rutherfordTrajectory(b)), []);
  const density = kind === 'oil' ? oilDrop(0.8, charges, value * 600) : null;
  const frequency = kind === 'zinc' ? 600 + value * 900 : 400 + value * 600,
    photo = photoelectric(frequency, intensity, voltage, kind === 'zinc' ? 4.3 : 2.1);
  const electron = electronBeam(200, value * 2);
  const theta = value * Math.PI,
    temperature = 2500 + value * 5500;
  const scale = planckRadiance(wienPeakNM(8000), 8000);
  const beamB = 0.0001 + value * 0.0003;
  const beamE = electron.speed * beamB;
  const thomson = thomsonTrajectory(phase === 1 ? 0 : beamE, phase === 0 ? 0 : beamB);
  const oilY = density
    ? finiteClamp(140 + density.terminalDown * 100000 * (p - 0.5), 90, 190)
    : 140;
  const n = 3 + Math.floor(value * 3.999),
    lambda = balmerWavelength(n);
  const wavePM = electronWavelengthPM(100 + value * 900),
    angle = braggAngle(wavePM, 213);
  return (
    <svg
      className={`modern-apparatus modern-${kind}`}
      viewBox="0 0 340 276"
      role={cover ? undefined : 'img'}
      aria-hidden={cover || undefined}
      aria-label={
        cover
          ? undefined
          : text(
              '实验装置及由物理模型计算的观察结果',
              'Apparatus and observations calculated from the physical model',
            )
      }
    >
      <defs>
        <linearGradient id={`${id}-glass`}>
          <stop stopColor="#b7c9c1" stopOpacity=".65" />
          <stop offset=".3" stopColor="#fcfcf6" stopOpacity=".7" />
          <stop offset=".85" stopColor="#cad5cf" stopOpacity=".13" />
          <stop offset="1" stopColor="#a1b8af" stopOpacity=".65" />
        </linearGradient>
        <linearGradient id={`${id}-rainbow`}>
          <stop stopColor="#8c82b7" />
          <stop offset=".3" stopColor="#719dad" />
          <stop offset=".55" stopColor="#94ac8c" />
          <stop offset=".75" stopColor="#d6bb75" />
          <stop offset="1" stopColor="#c8796d" />
        </linearGradient>
      </defs>
      {kind === 'blackbody' && (
        <>
          <rect x="18" y="30" width="105" height="88" rx="35" fill="#806d63" />
          <ellipse
            cx="93"
            cy="74"
            rx="20"
            ry="26"
            fill={`hsl(${28 - value * 18} 45% ${24 + value * 38}%)`}
          />
          <ellipse cx="100" cy="74" rx="8" ry="14" fill="#443f3a" />
          <path d="M111 69L180 47V102L111 79" fill="#d9bb75" opacity=".3" />
          <path d="M167 39L198 96H142Z" fill={`url(#${id}-glass)`} stroke="#97aca4" />
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M184 ${65 + i * 2}L286 ${39 + i * 8}`}
              stroke={spectrum(390 + i * 42)}
              opacity=".65"
              strokeWidth="2"
            />
          ))}
          <rect x="291" y="28" width="13" height="91" rx="6" fill="#bdc9bf" />
          <circle cx="297" cy={35 + p * 73} r="8" fill="#9f8065" stroke="#faf8ee" strokeWidth="2" />
          <Wire d="M34 147V244H310" />
          {[3000, 5000, temperature].map((t, j) => (
            <path
              key={j}
              d={line(
                Array.from({ length: 101 }, (_, i) => ({
                  x: 36 + i * 2.7,
                  y: 241 - (87 * planckRadiance(200 + i * 18, t)) / scale,
                })),
              )}
              fill="none"
              stroke={j === 2 ? '#bc9366' : '#a6b5a9'}
              strokeWidth={j === 2 ? 3 : 1.2}
              opacity={j === 2 ? 1 : 0.5}
            />
          ))}
          <text x="34" y="141" fill="#708374" fontSize="18">
            Bλ
          </text>
          <text x="34" y="269" fill="#708374" fontSize="18">
            200
          </text>
          <text x="306" y="269" textAnchor="end" fill="#708374" fontSize="18">
            2000 nm
          </text>
          <path
            d={`M${36 + ((wienPeakNM(temperature) - 200) / 1800) * 270} 143V245`}
            stroke="#bc9366"
            strokeDasharray="3 4"
            opacity=".55"
          />
        </>
      )}
      {['photoelectric', 'planck', 'zinc'].includes(kind) && (
        <>
          {kind === 'zinc' ? (
            <>
              <rect
                x="129"
                y="102"
                width="84"
                height="122"
                rx="18"
                fill={`url(#${id}-glass)`}
                stroke="#a6b9af"
              />
              <Wire d="M170 84V168" />
              <path
                d={`M170 155L${170 - (photo.emitted ? 1 - Math.min(1, intensity * p) : 1) * 28} 204M170 155L${170 + (photo.emitted ? 1 - Math.min(1, intensity * p) : 1) * 28} 204`}
                stroke="#bcab70"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path d="M133 79H207" stroke="#8b9f9f" strokeWidth="9" strokeLinecap="round" />
              <path
                d="M55 37L157 75M71 25L172 75M85 17L188 75"
                stroke={photo.emitted ? '#978ac0' : '#c48b79'}
                opacity={0.45 * intensity}
                strokeWidth="3"
              />
              {photo.emitted &&
                Array.from({ length: Math.round(5 * intensity) }, (_, i) => (
                  <circle
                    key={i}
                    cx={145 + i * 10 + (p - 0.5) * 10}
                    cy={72 - ((p + i * 0.14) % 1) * 45}
                    r="2.5"
                    fill="#78999f"
                  />
                ))}
            </>
          ) : (
            <>
              <g transform={kind === 'planck' ? 'translate(35,-4) scale(.8,.68)' : undefined}>
                <rect
                  x="40"
                  y="30"
                  width="254"
                  height="142"
                  rx="60"
                  fill={`url(#${id}-glass)`}
                  stroke="#afc0b5"
                />
                <path d="M90 55Q56 100 90 146" fill="none" stroke="#ae9b75" strokeWidth="7" />
                <path d="M242 67V135" stroke="#849e9e" strokeWidth="5" />
                <Wire d="M74 110H23V217H111M242 101H314V217H223" />
                <path
                  d="M151 201V232M163 208V225M175 201V232M187 208V225"
                  stroke="#a6a382"
                  strokeWidth="2"
                />
                <Wire d="M111 217H151M187 217H223" />
                <path
                  d="M96 13L82 75M112 17L89 88M128 22L94 103"
                  stroke={spectrum(299792.458 / frequency)}
                  strokeWidth="3"
                  opacity={0.4 * intensity}
                />
                {photo.emitted &&
                  Array.from({ length: Math.round(5 * intensity) }, (_, i) => {
                    const t = (p + i * 0.17) % 1;
                    const energyFraction = (i + 0.5) / Math.max(1, Math.round(5 * intensity));
                    const reaches = voltage >= 0 || energyFraction * photo.excessEV + voltage > 0;
                    const position = reaches
                      ? t
                      : 4 *
                        t *
                        (1 - t) *
                        Math.min(
                          0.95,
                          (energyFraction * photo.excessEV) / Math.max(0.001, -voltage),
                        );
                    return (
                      <circle
                        key={i}
                        cx={90 + 152 * position}
                        cy={85 + Math.sin(i * 2) * 16}
                        r="3"
                        fill="#7899a4"
                      />
                    );
                  })}
                <circle cx="263" cy="217" r="20" fill="#f1f3eb" stroke="#a1b3a5" />
                <path
                  d={`M263 227L${263 + 14 * Math.sin(photo.current * 0.55)} ${227 - 19 * Math.cos(photo.current * 0.55)}`}
                  stroke="#6e8c7e"
                  strokeWidth="2"
                />
              </g>
              {kind === 'planck' && (
                <>
                  <path d="M58 181V257H300" fill="none" stroke="#a3b2a5" />
                  <path
                    d={`M${58 + (photo.thresholdTHz - 450) * 0.5} 253L283 ${253 - photoelectric(900, 1, 0).stoppingVoltage * 42}`}
                    fill="none"
                    stroke="#aa8e69"
                    strokeWidth="2"
                  />
                  {[580, 650, 720, 800, 900]
                    .filter((f) => phase > 0 || f <= frequency)
                    .map((f) => (
                      <circle
                        key={f}
                        cx={58 + (f - 450) * 0.5}
                        cy={253 - photoelectric(f, 1, 0).stoppingVoltage * 42}
                        r="3.5"
                        fill="#a78a64"
                      />
                    ))}
                  <text x="294" y="274" textAnchor="end" fill="#64776a" fontSize="18">
                    f / THz
                  </text>
                  <text x="39" y="182" fill="#64776a" fontSize="18">
                    Uₛ / V
                  </text>
                </>
              )}
            </>
          )}
        </>
      )}
      {kind === 'oil' && density && (
        <>
          <rect x="44" y="39" width="250" height="22" rx="7" fill="#b4c4bd" />
          <rect x="44" y="219" width="250" height="22" rx="7" fill="#9badac" />
          {density.electricForce > 1e-18 && (
            <>
              <text x="27" y="57" fontSize="18" fill="#a8886b">
                +
              </text>
              <text x="27" y="238" fontSize="18" fill="#789a99">
                −
              </text>
            </>
          )}
          {density.electricForce > 1e-18 &&
            [70, 110, 150, 190, 230, 270].map((x) => (
              <path
                key={x}
                d={`M${x} 73V206m-4-6 4 6 4-6`}
                stroke="#9bb0a6"
                opacity=".4"
                fill="none"
              />
            ))}
          <path d="M150 61V216" stroke="#d0b978" strokeDasharray="2 4" opacity=".4" />
          {Array.from({ length: 7 }, (_, i) => (
            <circle
              key={i}
              cx={75 + i * 29}
              cy={85 + ((i * 37) % 119)}
              r={2 + (i % 2)}
              fill="#c5ab74"
              opacity=".35"
            />
          ))}
          <circle cx="170" cy={oilY} r="7" fill="#c3a36c" stroke="#f4e6bf" strokeWidth="2" />
          <path d={`M170 ${oilY}v45m-5-8 5 8 5-8`} stroke="#b38c72" strokeWidth="2" fill="none" />
          {density.electricForce > 1e-18 && (
            <path
              d={`M170 ${oilY}v${-Math.min(62, (density.electricForce / density.effectiveWeight) * 45)}m-5 8 5-8 5 8`}
              stroke="#7c9d9b"
              strokeWidth="2"
              fill="none"
            />
          )}
          {Math.abs(density.terminalDown) > 1e-7 && (
            <path
              d={`M185 ${oilY}v${-Math.max(-45, Math.min(45, (1 - density.electricForce / density.effectiveWeight) * 45))}`}
              stroke="#a4b5a5"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          )}
          <path d="M294 49H320V230H294" fill="none" stroke="#a6b6aa" strokeWidth="2" />
        </>
      )}
      {kind === 'electron' && (
        <>
          <rect
            x="17"
            y="55"
            width="307"
            height="171"
            rx="50"
            fill={`url(#${id}-glass)`}
            stroke="#9db2a9"
          />
          <path
            d="M26 124H65M26 153H65"
            stroke={
              phase === 3
                ? ['#ae866b', '#a3b3b4', '#9ea59b'][Math.min(2, Math.floor(p * 3))]
                : '#a89b7d'
            }
            strokeWidth="5"
          />
          <path d="M66 139H78" stroke="#91a97c" strokeWidth="3" />
          <path d="M91 76H216M91 204H216" stroke="#a9b7ac" strokeWidth="8" strokeLinecap="round" />
          <path d="M300 70V211" stroke="#b4c29e" strokeWidth="7" strokeLinecap="round" />
          {phase !== 1 &&
            [110, 145, 180, 210].map((x) => (
              <path
                key={x}
                d={`M${x} 94V188m-4-7 4 7 4-7`}
                transform="translate(0,282) scale(1,-1)"
                stroke="#9dafa3"
                opacity=".6"
                fill="none"
              />
            ))}
          {phase !== 0 &&
            Array.from({ length: 12 }, (_, i) => (
              <g key={i} opacity=".5">
                <circle
                  cx={102 + (i % 4) * 31}
                  cy={106 + Math.floor(i / 4) * 33}
                  r="3"
                  stroke="#8a9db2"
                  fill="none"
                />
                <circle
                  cx={102 + (i % 4) * 31}
                  cy={106 + Math.floor(i / 4) * 33}
                  r=".8"
                  fill="#8a9db2"
                />
              </g>
            ))}
          <path
            d={line(thomson.points.map((q) => ({ x: 78 + q.x * 2200, y: 139 - q.y * 1800 })))}
            stroke="#8eaa79"
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx={78 + thomson.points.at(-1)!.x * 2200}
            cy={139 - thomson.points.at(-1)!.y * 1800}
            r="5"
            fill="#9dbd7c"
          />
          <path d="M91 236H215M91 231V241M215 231V241" stroke="#a6b5a2" />
        </>
      )}
      {kind === 'lenard' && (
        <>
          <rect
            x="18"
            y="61"
            width="155"
            height="145"
            rx="37"
            fill={`url(#${id}-glass)`}
            stroke="#a1b7ac"
          />
          <path d="M41 92V172M118 88V120M118 152V185" stroke="#a79574" strokeWidth="6" />
          <path d="M43 136H165" stroke="#90a87f" strokeWidth="3" />
          <rect x="165" y="96" width={4 + value * 8} height="81" rx="2" fill="#a8b4b4" />
          <path d="M183 92H310V184H183" fill="none" stroke="#c4d0c3" strokeDasharray="4 5" />
          <rect x="295" y="99" width="12" height="73" rx="5" fill="#6d8075" />
          {Array.from({ length: 12 }, (_, i) => {
            const passed = (i + 0.5) / 12 < Math.exp(-4 * value);
            const t = (p + i * 0.071) % 1;
            return passed ? (
              <g key={i}>
                <path d={`M173 136L297 ${111 + i * 4.5}`} stroke="#a9c28e" opacity=".22" />
                <circle
                  cx={173 + t * 124}
                  cy={136 + (111 + i * 4.5 - 136) * t}
                  r="2.5"
                  fill="#98b97a"
                />
                <circle cx="301" cy={111 + i * 4.5} r="3.5" fill="#c9d9a4" />
              </g>
            ) : null;
          })}
          <path d="M44 223H174M169 219l5 4-5 4" stroke="#9daf9b" fill="none" />
        </>
      )}
      {kind === 'rutherford' && (
        <>
          <rect x="17" y="94" width="36" height="70" rx="8" fill="#a5aaa1" />
          <rect x="151" y="24" width="5" height="228" fill="#c2a575" />
          <circle cx="154" cy="136" r="8" fill="#c3a36c" />
          <path d="M281 32A135 135 0 0 1 281 242" fill="none" stroke="#8eaaa0" strokeWidth="9" />
          {scatter.map((pts, i) => (
            <path
              key={i}
              d={line(pts.map((q) => ({ x: 154 + q.x * 3, y: 136 - q.y * 3 })))}
              fill="none"
              stroke={i === Math.floor(value * 3.99) ? '#ba8a65' : '#b4b4a1'}
              strokeWidth={i === Math.floor(value * 3.99) ? 2.5 : 1.3}
              opacity={i === Math.floor(value * 3.99) ? 1 : 0.4}
            />
          ))}
          {scatter.map((pts, i) => {
            const q = pts[Math.min(pts.length - 1, Math.floor(p * (pts.length - 1)))];
            return <circle key={i} cx={154 + q.x * 3} cy={136 - q.y * 3} r="3.2" fill="#ba8a65" />;
          })}
        </>
      )}
      {kind === 'compton' && (
        <>
          <rect x="20" y="120" width="42" height="36" rx="8" fill="#879b9b" />
          <path d="M62 138H164" stroke="#9ba6bc" strokeWidth="3" />
          <rect x="157" y="115" width="24" height="45" rx="4" fill="#777d77" />
          <path
            d={`M169 138L${169 + 115 * Math.cos(theta)} ${138 - 115 * Math.sin(theta)}`}
            stroke="#b7926c"
            strokeWidth="3"
          />
          <circle
            cx={169 + 115 * Math.cos(theta)}
            cy={138 - 115 * Math.sin(theta)}
            r="14"
            fill="#d4ddcf"
            stroke="#94aa9a"
          />
          {value > 0.01 && (
            <path
              d={`M169 138l${64 * Math.cos(comptonShift(value * 180).recoilAngle)} ${-64 * Math.sin(comptonShift(value * 180).recoilAngle)}`}
              stroke="#7c9c92"
              strokeWidth="2.5"
              strokeDasharray="3 4"
            />
          )}
          <path d="M72 255H309M72 255V193" stroke="#aebcae" fill="none" />
          {[71, comptonShift(value * 180).scatteredPM].map((nm, i) => (
            <path
              key={i}
              d={line(
                Array.from({ length: 121 }, (_, j) => {
                  const w = 69 + j * 0.075;
                  return { x: 74 + j * 1.9, y: 251 - 45 * Math.exp(-(((w - nm) / 0.2) ** 2)) };
                }),
              )}
              fill="none"
              stroke={i ? '#b7926c' : '#9ba6bc'}
              strokeWidth="2"
            />
          ))}
        </>
      )}
      {['hydrogen', 'sodium', 'solar'].includes(kind) &&
        (() => {
          const wavelengths =
            kind === 'sodium' ? [588.995, 589.5924] : [3, 4, 5, 6].map(balmerWavelength);
          const width = kind === 'sodium' ? 340 * (1 - value) + 3 * value : 340;
          const lo = kind === 'sodium' ? 380 * (1 - value) + 587.8 * value : 380;
          const at = (w: number) => 32 + ((w - lo) / width) * 274;
          return (
            <>
              {kind === 'sodium' ? (
                <>
                  <path d="M47 114Q17 70 48 19Q46 66 67 61Q83 88 47 114" fill="#cbb16d" />
                  <path d="M27 119H70L63 151H33Z" fill="#9caea4" />
                  <path d="M32 51L21 38H7" stroke="#909e91" strokeWidth="3" />
                </>
              ) : kind === 'solar' ? (
                <circle cx="48" cy="68" r="33" fill="#d6bb7c" />
              ) : (
                <>
                  <rect x="31" y="28" width="29" height="117" rx="14" fill="#c5a5b1" />
                  <path d="M45 36V139" stroke="#f5dfe2" strokeWidth="4" />
                  <path d="M45 28V17H13V154H45V145" stroke="#9caa9e" strokeWidth="2" fill="none" />
                </>
              )}
              <path d="M73 69H132" stroke="#ddcbaa" strokeWidth="5" opacity=".6" />
              <path d="M151 36L188 109H118Z" fill={`url(#${id}-glass)`} stroke="#91a9a7" />
              {wavelengths.map((w) => (
                <path
                  key={w}
                  d={`M174 79L288 ${35 + ((w - 380) / 340) * 118}`}
                  stroke={spectrum(w)}
                  strokeWidth="2.5"
                />
              ))}
              <rect x="282" y="21" width="16" height="136" rx="4" fill="#44585a" />
              {kind === 'solar' && (
                <rect
                  x="28"
                  y="165"
                  width="282"
                  height="27"
                  rx="4"
                  fill="#344547"
                  opacity={value}
                />
              )}
              <rect
                x="28"
                y="202"
                width="282"
                height="40"
                rx="6"
                fill={kind === 'solar' ? `url(#${id}-rainbow)` : '#344547'}
              />
              {wavelengths.map((w, i) => (
                <g key={i}>
                  <path
                    d={`M${at(w)} 205V239`}
                    stroke={kind === 'solar' ? '#394b4e' : spectrum(w)}
                    strokeWidth={kind === 'hydrogen' && w === lambda ? 5 : 2.2}
                  />
                  {kind === 'solar' && (
                    <>
                      <path
                        d={`M${at(w)} 168V189`}
                        stroke={spectrum(w)}
                        strokeWidth="2.2"
                        opacity={value}
                      />
                      <path
                        d={`M${at(w)} 192V204`}
                        stroke="#9bae98"
                        strokeDasharray="2 2"
                        opacity={value}
                      />
                    </>
                  )}
                </g>
              ))}
              <text x="29" y="267" fontSize="18" fill="#758673">
                {lo.toFixed(kind === 'sodium' ? 1 : 0)}
              </text>
              <text x="310" y="267" textAnchor="end" fontSize="18" fill="#758673">
                {(lo + width).toFixed(kind === 'sodium' ? 1 : 0)} nm
              </text>
            </>
          );
        })()}
      {kind === 'lamb' && (
        <>
          {phase === 0 ? (
            <>
              <path d="M28 71H137M204 58H312M204 96H312" stroke="#9eab9a" strokeWidth="4" />
              <path d="M172 64V92m-4-7 4 7 4-7" stroke="#b39269" fill="none" />
              <text x="29" y="50" fill="#718271" fontSize="18">
                2S · 2P
              </text>
              <text x="222" y="38" fill="#718271" fontSize="18">
                2S₁/₂
              </text>
              <text x="222" y="126" fill="#718271" fontSize="18">
                2P₁/₂
              </text>
            </>
          ) : (
            <>
              <rect x="17" y="68" width="45" height="74" rx="12" fill="#b2bcab" />
              <rect
                x="127"
                y="62"
                width="90"
                height="92"
                rx="13"
                fill={`url(#${id}-glass)`}
                stroke="#a3b5a7"
              />
              <path d="M170 154V174H240" stroke="#a69b81" strokeWidth="5" fill="none" />
              <rect x="286" y="67" width="20" height="78" rx="7" fill="#7f9a8a" />
              {Array.from({ length: 12 }, (_, i) => {
                const x = 58 + ((p + i / 12) % 1) * 230;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy="108"
                    r="3.2"
                    fill="#ab9071"
                    opacity={x > 217 ? lambQuenching(850 + 400 * value).survivingFraction : 1}
                  />
                );
              })}
              <path
                d={line(
                  Array.from({ length: 51 }, (_, i) => ({
                    x: 136 + i * 1.4,
                    y: 107 + 12 * Math.sin(i * 0.5),
                  })),
                )}
                stroke="#97a6b7"
                fill="none"
              />
            </>
          )}
          <path d="M35 190V248H307" stroke="#a6b4a2" fill="none" />
          <path
            d={line(
              Array.from({ length: 101 }, (_, i) => ({
                x: 38 + i * 2.65,
                y: 246 - 47 * lambQuenching(850 + i * 4).survivingFraction,
              })),
            )}
            stroke="#ae8e68"
            fill="none"
            strokeWidth="2.5"
          />
          <circle
            cx={38 + value * 265}
            cy={246 - 47 * lambQuenching(850 + 400 * value).survivingFraction}
            r="4"
            fill="#7b9e95"
          />
          <text x="34" y="273" fontSize="18" fill="#718271">
            850
          </text>
          <text x="309" y="273" textAnchor="end" fontSize="18" fill="#718271">
            1250 MHz
          </text>
        </>
      )}
      {kind === 'electron-diffraction' && (
        <>
          <path
            d="M18 118H108Q137 28 240 31Q326 43 326 139Q323 232 240 242Q135 247 108 156H18Z"
            fill={`url(#${id}-glass)`}
            stroke="#a6b9ac"
          />
          <path d="M35 135H152" stroke="#8fa482" strokeWidth="3" />
          <rect x="145" y="112" width="6" height="49" fill="#a5a69a" />
          <ellipse cx="284" cy="137" rx="31" ry="94" fill="#465b58" opacity=".65" />
          {[1, Math.sqrt(3), 2].map((m, i) => (
            <ellipse
              key={i}
              cx="284"
              cy="137"
              rx={8 + m * (angle ?? 0) * 20}
              ry={Math.min(84, m * (angle ?? 0) * 250)}
              fill="none"
              stroke="#ceda9f"
              strokeWidth="2"
              opacity=".75"
            />
          ))}
          <path
            d={`M151 137L282 ${137 - (angle ?? 0) * 240}M151 137L282 ${137 + (angle ?? 0) * 240}`}
            stroke="#b1c39a"
            strokeWidth="1"
            opacity=".6"
          />
        </>
      )}
    </svg>
  );
}

export default function ModernLab({ kind, scenePhase }: { kind: ModernKind; scenePhase?: number }) {
  const film = useShowcase(),
    [manual, setManual] = useState(0.6),
    [intensity, setIntensity] = useState(1),
    [voltage, setVoltage] = useState(0),
    [manualCharges, setCharges] = useState(4),
    [fieldMode, setFieldMode] = useState(1);
  const progress = film.watch ? film.chapterProgress : manual;
  const phase = film.watch ? (scenePhase ?? film.chapter) : kind === 'electron' ? fieldMode : 4;
  const charges =
    film.watch && kind === 'oil' && phase === 2
      ? 2 + Math.floor(Math.min(0.9999, progress) * 4)
      : film.watch
        ? 4
        : manualCharges;
  const oilBalance = oilDrop(0.8, charges, 0).balanceVoltage;
  const states: Partial<Record<ModernKind, number[]>> = {
    blackbody: [0.09, 0.09 + progress * 0.55, 0.64, 0.64 + progress * 0.36],
    zinc: [0.1, 0.8],
    photoelectric: [progress * 0.55, 0.5, 0.5],
    planck: [0.35 + progress * 0.55, 0.35 + progress * 0.55],
    oil: [0, (oilBalance / 600) * Math.min(1, progress * 1.4), oilBalance / 600],
    electron: [0.5, 0.5, 0.5, 0.5],
    lenard: [0.08, 0.08 + progress * 0.85],
    rutherford: [1, 1 - progress, 0],
    compton: [0, progress * 0.5, 0.5 + progress * 0.5],
    hydrogen: [0.05, progress],
    sodium: [0.05, progress],
    solar: [0.05, progress],
    lamb: [0.5195, progress, 0.5195],
    'electron-diffraction': [0.1, 0.1 + progress * 0.8],
  };
  const shots = states[kind] ?? [0.6];
  const value = film.watch ? shots[Math.min(phase, shots.length - 1)] : manual;
  const voiceIntensity = film.watch
    ? kind === 'photoelectric' && phase === 1
      ? 0.25 + progress * 1.75
      : 1
    : intensity;
  const frequency = kind === 'zinc' ? 600 + 900 * value : 400 + 600 * value;
  const stop = photoelectric(frequency, voiceIntensity, 0).stoppingVoltage;
  const voiceVoltage = film.watch
    ? kind === 'photoelectric' && phase === 2
      ? -Math.min(1.1, progress * 1.4)
      : kind === 'planck'
        ? -stop
        : 0
    : voltage;
  const photo = photoelectric(frequency, voiceIntensity, voiceVoltage, kind === 'zinc' ? 4.3 : 2.1);
  const oil = oilDrop(0.8, charges, value * 600);
  const readout =
    kind === 'blackbody'
      ? `${(2500 + value * 5500).toFixed(0)} K · λmax ${wienPeakNM(2500 + value * 5500).toFixed(0)} nm`
      : kind === 'oil'
        ? `U = ${(value * 600).toFixed(1)} V · |q| = ${charges}e · v↓ = ${(oil.terminalDown * 1e3).toFixed(3)} mm/s`
        : kind === 'electron'
          ? phase === 3
            ? `${text('阴极材料', 'Cathode')} ${[text('铜', 'copper'), text('铝', 'aluminium'), text('锌', 'zinc')][Math.min(2, Math.floor(progress * 3))]} · |e|/m = 1.759×10¹¹ C/kg`
            : `E = ${(phase === 1 ? 0 : electronBeam(200, 0).speed * (0.0001 + value * 0.0003)).toFixed(0)} V/m · B = ${(phase === 0 ? 0 : 0.1 + value * 0.3).toFixed(2)} mT`
          : kind === 'lenard'
            ? `${text('相对膜厚', 'Relative foil thickness')} ${value.toFixed(2)} · ${text('模型透过率', 'Model transmission')} ${(100 * Math.exp(-4 * value)).toFixed(0)}%`
            : kind === 'compton'
              ? `θ = ${(value * 180).toFixed(0)}° · Δλ = ${comptonShift(value * 180).shiftPM.toFixed(3)} pm`
              : kind === 'rutherford'
                ? `b/a = ${[0.5, 2, 5, 10][Math.floor(value * 3.99)]} · θ ≈ ${((rutherfordAngle([0.5, 2, 5, 10][Math.floor(value * 3.99)]) * 180) / Math.PI).toFixed(1)}°`
                : kind === 'lamb'
                  ? `ν = ${(850 + 400 * value).toFixed(1)} MHz · ${text('存活亚稳态比例', 'Surviving metastable fraction')} ${lambQuenching(850 + 400 * value).survivingFraction.toFixed(2)}`
                  : kind === 'hydrogen'
                    ? `n = ${3 + Math.floor(value * 3.999)} → 2 · λ = ${balmerWavelength(3 + Math.floor(value * 3.999)).toFixed(2)} nm`
                    : kind === 'sodium'
                      ? text(
                          '钠的黄色双线：约 589.0 与 589.6 nm',
                          'Sodium yellow doublet: about 589.0 and 589.6 nm',
                        )
                      : kind === 'solar'
                        ? text(
                            '同一元素：发射亮线与吸收暗线位置对应',
                            'One element: emission and absorption lines align',
                          )
                        : kind === 'electron-diffraction'
                          ? `U = ${(100 + value * 900).toFixed(0)} V · λ = ${electronWavelengthPM(100 + value * 900).toFixed(2)} pm`
                          : `f = ${(kind === 'zinc' ? 600 + value * 900 : 400 + value * 600).toFixed(0)} THz · ${text('遏止电压', 'Stopping voltage')} ${photo.stoppingVoltage.toFixed(2)} V · I/I₀ = ${photo.current.toFixed(2)}`;
  const parameter =
    kind === 'blackbody'
      ? text('炉温', 'Furnace temperature')
      : kind === 'lenard'
        ? text('相对金属膜厚度', 'Relative metal-foil thickness')
        : kind === 'oil'
          ? text('极板电压', 'Plate voltage')
          : kind === 'electron'
            ? text('场强对照', 'Field-strength comparison')
            : kind === 'rutherford'
              ? text('比较入射轨迹', 'Compare impact parameters')
              : kind === 'compton'
                ? text('散射角度', 'Scattering angle')
                : kind === 'hydrogen'
                  ? text('选择上能级', 'Select upper level')
                  : kind === 'electron-diffraction'
                    ? text('加速电压', 'Accelerating voltage')
                    : kind === 'sodium'
                      ? text('谱线观察范围', 'Spectral viewing range')
                      : kind === 'solar'
                        ? text('对照谱线显现', 'Reveal comparison lines')
                        : kind === 'lamb'
                          ? text('微波频率', 'Microwave frequency')
                          : text('入射光频率', 'Incident frequency');
  return (
    <div className={`modern-lab modern-lab-${kind}`} data-watch={film.watch}>
      <div className="modern-observation">
        <span>
          {text('根据模型重建的实验观察', 'Model reconstruction of an experimental observation')}
        </span>
        <p>{readout}</p>
      </div>
      <ModernLabArtwork
        kind={kind}
        value={value}
        intensity={voiceIntensity}
        voltage={voiceVoltage}
        progress={progress}
        phase={phase}
        charges={charges}
      />
      <p className="modern-key">
        {kind === 'lenard'
          ? text(
              '薄金属窗保留真空边界，部分电子能穿出管外',
              'A thin metal window preserves the vacuum boundary while transmitting some electrons',
            )
          : kind === 'oil'
            ? text(
                '平衡时电场力等于有效重力；运动时还存在空气黏滞阻力',
                'At balance electric force equals effective weight; moving drops also experience viscous drag',
              )
            : kind === 'blackbody'
              ? text(
                  '相同纵轴尺度；加热既提高强度，也移动峰值',
                  'One intensity scale: heating raises the curve and shifts its peak',
                )
              : kind === 'rutherford'
                ? text(
                    '单核相遇的放大图；四条轨迹不代表发生概率',
                    'Enlarged single-nucleus encounters; four paths do not represent probabilities',
                  )
                : kind === 'electron-diffraction'
                  ? text(
                      '电子波长变短，衍射环收缩',
                      'A shorter electron wavelength contracts the diffraction rings',
                    )
                  : kind === 'compton'
                    ? text(
                        '入射线与散射线的位置来自同一个波长公式',
                        'Incident and scattered peaks use the same wavelength model',
                      )
                    : ['zinc', 'photoelectric', 'planck'].includes(kind)
                      ? kind === 'planck'
                        ? text(
                            '改变频率，重复测量遏止电压',
                            'Repeat the stopping-voltage measurement at different frequencies',
                          )
                        : voiceVoltage < 0
                          ? `${text('阴极到阳极的电压', 'Collector potential relative to cathode')} ${voiceVoltage.toFixed(2)} V`
                          : voiceIntensity === 0
                            ? text(
                                '光已关闭，没有光电子发射',
                                'Light is off; no photoelectrons are emitted',
                              )
                            : photo.emitted
                              ? text(
                                  '超过截止频率，电子才能逸出',
                                  'Above threshold, electrons can escape',
                                )
                              : text(
                                  '尚未达到截止频率',
                                  'The light is below the threshold frequency',
                                )
                      : text(
                          kind === 'sodium'
                            ? '相邻的两条黄线，需要足够的分辨能力才能区分'
                            : kind === 'hydrogen'
                              ? '不同初始能级，都跃迁到第二能级'
                              : kind === 'solar'
                                ? '实验室亮线与太阳中的对应暗线对齐'
                                : kind === 'lamb'
                                  ? '共振改变内部状态，下游亚稳态信号减弱'
                                  : '相反方向的电场力和磁场力可以抵消',
                          kind === 'sodium'
                            ? 'Resolving power separates the two nearby yellow lines'
                            : kind === 'hydrogen'
                              ? 'Different upper levels share the same lower level'
                              : kind === 'solar'
                                ? 'Laboratory emission aligns with matching solar absorption'
                                : kind === 'lamb'
                                  ? 'Resonance changes the internal state and reduces the downstream signal'
                                  : 'Opposing electric and magnetic forces can balance',
                        )}
      </p>
      {!film.watch && (
        <div className="modern-explore">
          {kind === 'electron' && (
            <div className="modern-paths">
              {[
                [0, '电场', 'Electric field'],
                [1, '磁场', 'Magnetic field'],
                [2, '电场与磁场平衡', 'Balanced crossed fields'],
              ].map(([mode, zh, en]) => (
                <button
                  key={mode}
                  aria-pressed={fieldMode === mode}
                  onClick={() => setFieldMode(Number(mode))}
                >
                  {text(String(zh), String(en))}
                </button>
              ))}
            </div>
          )}
          {kind === 'oil' && (
            <Range
              label={text('油滴电荷量 / e', 'Drop charge / e')}
              value={manualCharges}
              min={1}
              max={8}
              step={1}
              onChange={setCharges}
            />
          )}
          {
            <Range
              label={parameter}
              value={manual}
              min={0}
              max={1}
              step={0.01}
              onChange={setManual}
              help={text(
                '归一化调节；上方显示对应的实际物理量。',
                'Normalized control; the actual physical quantity is shown above.',
              )}
            />
          }
          {['photoelectric', 'planck', 'zinc'].includes(kind) && (
            <>
              <Range
                label={text('相对光强', 'Relative light intensity')}
                value={intensity}
                min={0}
                max={2}
                step={0.05}
                onChange={setIntensity}
              />
              {kind !== 'zinc' && (
                <Range
                  label={text('收集电压', 'Collecting voltage')}
                  value={voltage}
                  min={-3}
                  max={2}
                  step={0.05}
                  unit="V"
                  onChange={setVoltage}
                />
              )}
            </>
          )}
          <p>
            {text(
              '本页是历史或课堂实验的教学模型。装置大小、粒子尺度与运动速度为可见性而调整；下方说明给出所用近似。',
              'This is a teaching model of a historical or classroom experiment. Apparatus dimensions, particle sizes and motion rates are adjusted for visibility; assumptions are explained below.',
            )}
          </p>
        </div>
      )}
    </div>
  );
}
