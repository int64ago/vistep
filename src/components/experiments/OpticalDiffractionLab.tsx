import { useMemo, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  slitProfile,
  diffractionDisplayColor,
  fresnelCircle,
} from '../../models/optical-diffraction-lab';
import '../../styles/modern-labs.css';
import '../../styles/optical-diffraction-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
export function OpticalDiffractionArtwork({
  mode = 0,
  phase = 0,
  width = 150,
  radius = 0.6,
  wavelength = 550,
  white = false,
  progress = 1,
}: {
  mode?: number;
  phase?: number;
  width?: number;
  radius?: number;
  wavelength?: number;
  white?: boolean;
  progress?: number;
}) {
  const circular = mode === 1 || phase === 3,
    profiles = useMemo(
      () => (circular ? [] : slitProfile(width, white, wavelength)),
      [circular, width, white, wavelength],
    ),
    radial = useMemo(
      () =>
        circular
          ? Array.from({ length: 161 }, (_, j) => ({
              r: (j / 160) * 2.3,
              I: fresnelCircle((j / 160) * 2.3, radius, wavelength, 1, mode === 1),
            }))
          : [],
      [circular, radius, wavelength, mode],
    ),
    opening = 4 + (width / 800) * 35,
    meanIntensity = profiles.map((v) => v.values.reduce((a, b) => a + b, 0) / v.values.length),
    peakIntensity = Math.max(1e-12, ...meanIntensity);
  return (
    <svg
      className="optical-diffraction-art"
      viewBox="0 0 340 350"
      role="img"
      aria-label={tr(
        '狭缝与圆孔、圆盘的衍射装置和计算图样',
        'Slit, aperture and disk diffraction apparatus with calculated patterns',
      )}
    >
      {circular ? (
        <>
          <rect x="22" y="52" width="48" height="30" rx="6" fill="#a3b5a4" />
          <path d="M70 67H298" stroke="#b9cba0" strokeWidth="2" />
          <ellipse
            cx="156"
            cy="67"
            rx="12"
            ry={23 + radius * 20}
            fill={mode === 1 ? '#6c8370' : '#bccbbb'}
            stroke="#7e9682"
          />
          {mode === 0 && <ellipse cx="156" cy="67" rx="4" ry={radius * 12} fill="#ecf0de" />}
          <path d="M156 112V127M145 127h22" stroke="#8ea18c" />
          <path d="M298 26V112" stroke="#8fa38f" strokeWidth="5" />
          <text x="170" y="154" fontSize="19" textAnchor="middle" fill="#667f68">
            {mode === 1
              ? tr('不透明小圆盘', 'Opaque circular disk')
              : tr('圆形小孔', 'Circular aperture')}{' '}
            · z = 1 m
          </text>
          <circle cx="170" cy="246" r="80" fill="#18281f" />
          {[...radial].reverse().map((v, j) => (
            <circle
              key={j}
              cx="170"
              cy="246"
              r={Math.max(0.35, (v.r / 2.3) * 78)}
              fill={diffractionDisplayColor([v.I])}
            />
          ))}
          <text x="170" y="350" textAnchor="middle" fontSize="19" fill="#667f68">
            r = 2.3 mm
          </text>
        </>
      ) : (
        <>
          {phase === 4 ? (
            <>
              <path
                d={`M52 24L265 ${57 - opening / 2}L280 ${67 - opening / 2}L260 ${77 - opening / 2}L46 44Z`}
                fill="#cbb58b"
                stroke="#928267"
              />
              <path
                d={`M46 100L260 ${77 + opening / 2}L280 ${67 + opening / 2}L265 ${57 + opening / 2}L52 120Z`}
                fill="#cbb58b"
                stroke="#928267"
              />
              <path
                d={`M260 ${77 - opening / 2}L280 ${67 - opening / 2}L265 ${57 - opening / 2}M260 ${77 + opening / 2}L280 ${67 + opening / 2}L265 ${57 + opening / 2}`}
                fill="#7d7c69"
              />
              <text x="170" y="151" textAnchor="middle" fontSize="19" fill="#667f68">
                {tr('并排铅笔间的狭缝', 'Gap between two pencils')}
              </text>
            </>
          ) : phase === 5 ? (
            <>
              <path d="M45 35H298V47H45Z" fill="#b0bdb1" />
              <path
                d={`M143 35V${67 - opening / 2}h38v-9h-28V35M143 115V${67 + opening / 2}h38v9h-28v39`}
                fill="#a6b5a8"
                stroke="#728c7a"
              />
              <text x="170" y="151" textAnchor="middle" fontSize="19" fill="#667f68">
                {tr('卡脚缝隙 · 局部展开', 'Caliper gap · close-up')}
              </text>
            </>
          ) : (
            <>
              <rect x="22" y="52" width="45" height="30" rx="6" fill="#a4b6a5" />
              <path d="M67 67H300" stroke="#b9cba0" strokeWidth="2" />
              <path
                d={`M150 20V${67 - opening / 2}M150 ${67 + opening / 2}V119`}
                stroke="#79927d"
                strokeWidth="12"
              />
              <path d="M298 22V117" stroke="#8fa38f" strokeWidth="5" />
              <text x="170" y="151" fontSize="19" textAnchor="middle" fill="#667f68">
                a = {width.toFixed(0)} μm · z = 1 m
              </text>
            </>
          )}
          <rect x="20" y="177" width="300" height="56" rx="3" fill="#17271e" />
          {profiles.map((v, j) => (
            <rect
              key={j}
              x={20 + j}
              y="178"
              width="1.1"
              height="54"
              fill={diffractionDisplayColor(v.values)}
            />
          ))}
          <path d="M20 252V321H320" fill="none" stroke="#9eb09e" />
          <text x="20" y="250" fontSize="19" fill="#667f68">
            I / Imax
          </text>
          <text x="320" y="250" textAnchor="end" fontSize="19" fill="#667f68">
            Imax/I₀ = {peakIntensity.toFixed(3)}
          </text>
          <path
            d={profiles
              .map(
                (_, j) =>
                  `${j ? 'L' : 'M'}${20 + j} ${321 - (65 * meanIntensity[j]) / peakIntensity}`,
              )
              .join(' ')}
            fill="none"
            stroke="#729577"
            strokeWidth="2"
          />
          <text x="20" y="350" fontSize="19" fill="#667f68">
            −15 mm
          </text>
          <text x="320" y="350" textAnchor="end" fontSize="19" fill="#667f68">
            15 mm
          </text>
        </>
      )}
    </svg>
  );
}
export default function OpticalDiffractionLab() {
  const f = useShowcase(),
    [mode, setMode] = useState(f.variant === 'e1-poisson-spot' ? 1 : 0),
    [view, setView] = useState(0),
    [width, setWidth] = useState(100),
    [diskRadius, setDiskRadius] = useState(0.6),
    [apertureRadius, setApertureRadius] = useState(0.2),
    [wl, setWl] = useState(550),
    [white, setWhite] = useState(false);
  const m = f.watch ? (f.chapter >= 6 ? 1 : 0) : mode,
    phase = f.watch ? (m ? f.chapter - 6 : f.chapter) : view,
    p = f.watch ? f.chapterProgress : 1,
    a = f.watch
      ? Math.round(
          (phase === 0
            ? 800 - 550 * p
            : phase === 1
              ? 250 - 200 * p
              : phase === 4 || phase === 5
                ? 150 - 100 * p
                : 100) / 2,
        ) * 2
      : width,
    r = f.watch
      ? m
        ? phase === 0
          ? 0.6
          : 0.3 + 0.6 * p
        : 0.1 + 0.2 * p
      : m
        ? diskRadius
        : apertureRadius,
    w = f.watch ? 550 : wl,
    b = f.watch ? phase === 2 : white;
  return (
    <div className="modern-lab optical-diffraction-lab">
      {!f.watch && (
        <div className="modern-paths">
          {[tr('单缝与小孔', 'Slits and apertures'), tr('泊松亮斑', 'Poisson spot')].map((v, j) => (
            <button type="button" key={j} aria-pressed={m === j} onClick={() => setMode(j)}>
              {v}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {m
          ? `a = ${r.toFixed(2)} mm · I(0)/I₀ = 1`
          : phase === 3
            ? `${tr('孔半径', 'Aperture radius')} = ${r.toFixed(2)} mm`
            : b
              ? tr('白光 · 三波长显示', 'White light · three sampled wavelengths')
              : `λ = ${w} nm`}
      </div>
      <OpticalDiffractionArtwork
        mode={m}
        phase={phase}
        width={a}
        radius={Math.round(r * 100) / 100}
        wavelength={w}
        white={b}
        progress={p}
      />
      <p className="modern-key">
        {m
          ? tr(
              '亮点来自整个圆周波场的叠加，模型没有额外补一个亮点。',
              'The axial spot follows from the full diffracted field; no extra bright dot is added.',
            )
          : phase === 3
            ? tr(
                '圆孔衍射具有轴对称图样，不能直接套用单缝曲线。',
                'A circular aperture has radial symmetry and requires a different field integral.',
              )
            : tr(
                '狭缝越窄，远场中央条纹越宽，但透过的总光更少。',
                'A narrower slit broadens the far-field central band while transmitting less total light.',
              )}
      </p>
      {!f.watch && (
        <div className="modern-explore">
          {!m && (
            <div className="modern-paths">
              {[
                [0, tr('挡板', 'Jaws')],
                [3, tr('圆孔', 'Hole')],
                [4, tr('铅笔', 'Pencils')],
                [5, tr('卡尺', 'Calipers')],
              ].map(([j, n]) => (
                <button
                  type="button"
                  key={j}
                  aria-pressed={view === j}
                  onClick={() => setView(Number(j))}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          {m || phase === 3 ? (
            <Range
              label={tr('半径 / mm', 'Radius / mm')}
              value={m ? diskRadius : apertureRadius}
              min={m ? 0.3 : 0.1}
              max={m ? 1 : 0.4}
              step={0.01}
              onChange={m ? setDiskRadius : setApertureRadius}
            />
          ) : (
            <>
              <Range
                label={tr('缝宽 / μm', 'Slit width / μm')}
                value={width}
                min={30}
                max={800}
                step={2}
                onChange={setWidth}
              />
              <div className="modern-paths">
                <button type="button" aria-pressed={white} onClick={() => setWhite(!white)}>
                  {tr('白光对照', 'White-light comparison')}
                </button>
              </div>
            </>
          )}
          {(m || phase === 3 || !white) && (
            <Range
              label={tr('波长 / nm', 'Wavelength / nm')}
              value={wl}
              min={450}
              max={650}
              step={5}
              onChange={setWl}
            />
          )}
        </div>
      )}
    </div>
  );
}
