import { useId, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  symmetricFilm,
  soapThickness,
  wedgeThickness,
  wedgeSpacing,
  filmColor,
} from '../../models/thin-film-lab';
import '../../styles/modern-labs.css';
import '../../styles/thin-film-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
export function ThinFilmArtwork({
  mode = 0,
  phase = 0,
  progress = 1,
  drain = 1,
  sheets = 2,
  wavelength = 589,
  white = false,
}: {
  mode?: number;
  phase?: number;
  progress?: number;
  drain?: number;
  sheets?: number;
  wavelength?: number;
  white?: boolean;
}) {
  const id = useId().replaceAll(':', ''),
    d = mode === 0 ? soapThickness(0.45, drain) : wedgeThickness(1, sheets),
    R = symmetricFilm(d, wavelength, mode === 0 ? 1.333 : 1, mode === 0 ? 1 : 1.5),
    phaseShift = (4 * Math.PI * (mode === 0 ? 1.333 : 1) * d) / wavelength + Math.PI;
  return (
    <svg
      className="thin-film-art"
      viewBox="0 0 340 350"
      role="img"
      aria-label={tr('肥皂膜反射条纹与空气劈尖', 'Reflected soap-film fringes and an air wedge')}
    >
      <defs>
        <clipPath id={id}>
          <circle cx="206" cy="112" r="78" />
        </clipPath>
      </defs>
      {mode === 0 ? (
        <>
          <path d="M41 174Q30 164 34 147H85Q89 164 78 174Z" fill="#b9cabd" stroke="#708e80" />
          <path d="M55 147v-21h9v21" fill="#9b876a" />
          <path
            d="M60 126Q39 110 58 75Q60 95 68 101Q80 118 60 126"
            fill={white ? '#ece4ce' : '#e4ba5f'}
          />
          <path d="M60 127L130 83M60 127L130 129" stroke="#c9b277" opacity=".5" />
          <circle cx="206" cy="112" r="80" fill="#26362e" stroke="#7f9d88" strokeWidth="5" />
          <g clipPath={`url(#${id})`}>
            {Array.from({ length: 157 }, (_, j) => (
              <rect
                key={j}
                x="128"
                y={34 + j}
                width="156"
                height="1.2"
                fill={filmColor(soapThickness(j / 156, drain), white, wavelength)}
              />
            ))}
          </g>
          <path d="M206 193V214" stroke="#7f9d88" strokeWidth="5" />
          <text x="60" y="199" textAnchor="middle" fontSize="19" fill="#6d806f">
            {white ? tr('白光', 'White') : `${wavelength} nm`}
          </text>
          <text x="206" y="239" textAnchor="middle" fontSize="19" fill="#6d806f">
            {tr('反射像 · 正视展开', 'Reflection · front view')}
          </text>
          <path d="M128 104H283" stroke="#ecdfb8" strokeDasharray="3 4" />
        </>
      ) : (
        <>
          <text x="170" y="25" textAnchor="middle" fill="#617d6a" fontSize="20">
            {tr('前4 mm的反射条纹', 'Reflection: first 4 mm')}
          </text>
          <rect x="25" y="45" width="290" height="65" rx="5" fill="#29382f" />
          {Array.from({ length: 290 }, (_, j) => (
            <rect
              key={j}
              x={25 + j}
              y="45"
              width="1.1"
              height="65"
              fill={filmColor(wedgeThickness((4 * j) / 290, sheets), false, wavelength, 1, 1.5)}
            />
          ))}
          <path d="M25 118v5h290v-5" fill="none" stroke="#8fa394" />
          <text x="170" y="148" textAnchor="middle" fontSize="19" fill="#617d6a">
            Δx = {wedgeSpacing(wavelength, sheets).toFixed(3)} mm
          </text>
          <path d="M25 206H315V218H25Z" fill="#d2e0d5" stroke="#7d9a87" />
          <path
            d={`M25 204L315 ${204 - 20 * sheets}v-10L25 194Z`}
            fill="#d2e0d5"
            stroke="#7d9a87"
          />
          {Array.from({ length: Math.ceil(sheets) }, (_, j) => (
            <rect
              key={j}
              x="292"
              y={204 - 20 * (j + 1)}
              width="17"
              height="19"
              rx="1"
              fill="#c6af83"
              opacity={j === 1 ? sheets - 1 : 1}
            />
          ))}
          <text x="170" y="244" textAnchor="middle" fontSize="19" fill="#617d6a">
            {tr('侧视 · 夹角放大', 'Side view · angle enlarged')}
          </text>
        </>
      )}
      <path d="M25 276H315M25 319H315" stroke="#c5d0c2" />
      {[0, 1].map((k) => (
        <path
          key={k}
          d={Array.from(
            { length: 146 },
            (_, j) =>
              `${j ? 'L' : 'M'}${25 + j * 2} ${k === 0 ? 278 + 12 * Math.sin(j * 0.2 - progress * 4) : 319 + 12 * Math.sin(j * 0.2 - progress * 4 + phaseShift)}`,
          ).join(' ')}
          fill="none"
          stroke={k ? '#b38c67' : '#76977c'}
          strokeWidth="2"
        />
      ))}
      <text x="170" y="348" textAnchor="middle" fontSize="19" fill="#617d6a">
        {tr('反射相位对照', 'Reflected phase')} · R = {(R * 100).toFixed(1)}%
      </text>
    </svg>
  );
}
export default function ThinFilmLab() {
  const film = useShowcase(),
    [which, setWhich] = useState(film.variant === 'e1-wedge-interference' ? 1 : 0),
    [drain, setDrain] = useState(1),
    [sheets, setSheets] = useState(2),
    [wl, setWl] = useState(589),
    [white, setWhite] = useState(false);
  const mode = film.watch ? (film.chapter < 3 ? 0 : 1) : which,
    phase = film.watch ? (mode === 0 ? film.chapter : film.chapter - 3) : 0,
    p = film.watch ? film.chapterProgress : 1,
    D = film.watch ? (phase === 1 ? 1 - 0.65 * p : 0.8) : drain,
    comparingWedges = film.watch && mode === 1 && phase === 1,
    blend = Math.max(0, Math.min(1, (p - 0.35) / 0.3)),
    S = film.watch ? 2 : sheets,
    W = film.watch ? 589 : wl,
    B = film.watch ? mode === 0 && phase === 2 : white;
  return (
    <div className="modern-lab thin-film-lab">
      {!film.watch && (
        <div className="modern-paths">
          {[tr('肥皂膜', 'Soap film'), tr('空气劈尖', 'Air wedge')].map((s, j) => (
            <button type="button" aria-pressed={mode === j} key={j} onClick={() => setWhich(j)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {mode === 0
          ? B
            ? tr('白光 · 三波长色彩示意', 'White light · three-color approximation')
            : `λ = ${W} nm · n = 1.333`
          : `${tr('纸片厚度', 'Spacer thickness')} = ${comparingWedges ? '80 → 40' : (40 * S).toFixed(0)} μm · L = 80 mm`}
      </div>
      {comparingWedges ? (
        <div className="thin-film-comparison">
          {[2, 1].map((count, index) => (
            <div
              key={count}
              style={{ opacity: index ? blend : 1 - blend }}
              aria-hidden={index ? blend < 0.5 : blend >= 0.5}
            >
              <ThinFilmArtwork mode={1} progress={p} sheets={count} wavelength={W} />
            </div>
          ))}
        </div>
      ) : (
        <ThinFilmArtwork
          mode={mode}
          phase={phase}
          progress={p}
          drain={D}
          sheets={S}
          wavelength={W}
          white={B}
        />
      )}
      <p className="modern-key">
        {mode === 0
          ? tr(
              '前后两界面反射的光，在同一厚度处相长或相消。',
              'Reflections from both interfaces reinforce or cancel at each film thickness.',
            )
          : tr(
              '抽去一张相同纸片，空气层斜率减半，条纹间距加倍。',
              'Removing one of two identical sheets halves the air-gap slope and doubles fringe spacing.',
            )}
      </p>
      {!film.watch && (
        <div className="modern-explore">
          {mode === 0 ? (
            <>
              <Range
                label={tr('相对膜厚', 'Relative thickness')}
                value={drain}
                min={0.15}
                max={1.2}
                step={0.01}
                onChange={setDrain}
              />
              <div className="modern-paths">
                <button type="button" aria-pressed={white} onClick={() => setWhite(!white)}>
                  {tr('白光对照', 'White-light comparison')}
                </button>
              </div>
              {!white && (
                <Range
                  label={tr('波长 / nm', 'Wavelength / nm')}
                  value={wl}
                  min={450}
                  max={650}
                  step={1}
                  onChange={setWl}
                />
              )}
            </>
          ) : (
            <div className="modern-paths">
              {[2, 1].map((n) => (
                <button
                  type="button"
                  key={n}
                  aria-pressed={sheets === n}
                  onClick={() => setSheets(n)}
                >
                  {n} {tr('张纸片', 'sheets')}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
