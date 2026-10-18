import { useId, useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  slitMeasurement,
  inferWavelength,
  sensorArray,
  lloydMirror,
} from '../../models/double-slit-measurement-lab';
import '../../styles/modern-labs.css';
import '../../styles/double-slit-measurement-lab.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
export function SlitMeasureArtwork({
  mode = 0,
  phase = 0,
  progress = 1,
  wavelength = 589,
  separation = 0.18,
  cursor = 0,
  height = 0.3,
}: {
  mode?: number;
  phase?: number;
  progress?: number;
  wavelength?: number;
  separation?: number;
  cursor?: number;
  height?: number;
}) {
  const id = useId().replaceAll(':', ''),
    s = slitMeasurement(wavelength, separation),
    pixels = sensorArray(wavelength, separation),
    selected = Math.min(159, Math.floor(progress * 160)),
    y = 0.2 + Math.max(0, Math.min(1, (cursor + 9) / 9)),
    mirror = lloydMirror(y, height, wavelength);
  return (
    <svg
      className="slit-measure-art"
      viewBox="0 0 340 350"
      role="img"
      aria-label={tr(
        '光具座测量头、线阵传感器与洛埃镜',
        'Optical bench, linear detector and Lloyd mirror',
      )}
    >
      <defs>
        <clipPath id={id}>
          <circle cx="170" cy="243" r="83" />
        </clipPath>
      </defs>
      {mode === 0 ? (
        <>
          <path d="M20 106H318M30 106v20M306 106v20" stroke="#8a9b8b" strokeWidth="3" />
          <rect x="21" y="55" width="25" height="32" rx="5" fill="#b5c6b6" />
          <circle cx="43" cy="71" r="6" fill="#dfbb72" />
          <path d="M48 70H304" stroke="#b8945d" strokeWidth="2" opacity=".5" />
          <ellipse cx="69" cy="70" rx="5" ry="25" fill="#d1e4db" stroke="#8faa9a" />
          <path d="M100 47V95" stroke="#b7a478" strokeWidth="7" />
          <path d="M129 45v24m0 4v22M158 45v17m0 4v9m0 4v16" stroke="#6f8577" strokeWidth="7" />
          <path d="M176 48H290V92H176" fill="#9eb4a51f" stroke="#839f8e" />
          <path d="M286 51v38" stroke="#bccbc0" strokeWidth="4" />
          <rect x="293" y="59" width="26" height="25" rx="4" fill="#819a89" />
          {[
            [69, 'L'],
            [100, 'F'],
            [129, 'S'],
            [158, 'S₁S₂'],
          ].map(([x, l]) => (
            <text key={x} x={x} y="31" textAnchor="middle" fontSize="19" fill="#617d6a">
              {l}
            </text>
          ))}
          <text x="234" y="139" textAnchor="middle" fontSize="19" fill="#617d6a">
            L = 1.20 m
          </text>
          <circle cx="170" cy="243" r="90" fill="#9aaf9c" />
          <g clipPath={`url(#${id})`}>
            <rect x="85" y="158" width="170" height="170" fill="#25342c" />
            {Array.from({ length: 170 }, (_, j) => (
              <rect
                key={j}
                x={85 + j}
                y="158"
                width="1.1"
                height="170"
                fill="#dfc578"
                opacity={s.intensity((j / 170) * 40 - 20)}
              />
            ))}
            <path d={`M${85 + (cursor + 20) * 4.25} 158V328`} stroke="#f5f3d7" strokeWidth="1.5" />
            <path d="M85 243H255" stroke="#f5f3d7" strokeWidth=".8" />
          </g>
          <text x="170" y="350" textAnchor="middle" fontSize="20" fill="#617d6a">
            x = {cursor.toFixed(3)} mm
          </text>
        </>
      ) : mode === 1 ? (
        <>
          <path d="M36 32V205H310" fill="none" stroke="#8ba08e" strokeWidth="5" />
          <rect x="110" y="20" width="65" height="25" rx="5" fill="#9bb5a3" />
          <path d="M142 45V83" stroke="#c8a46b" />
          <path d="M91 85h42m4 0h10m4 0h43" stroke="#6e8978" strokeWidth="6" />
          <path d="M135 87L65 163M149 87L264 163" stroke="#d0ba83" opacity=".6" />
          <rect x="57" y="163" width="220" height="25" rx="4" fill="#a1b6a3" />
          {pixels.map((v, j) => (
            <rect
              key={j}
              x={64 + j * 1.25}
              y="168"
              width="1.15"
              height="13"
              fill="#d7bf75"
              opacity={v.value}
            />
          ))}
          <path d="M275 176H306V226H297" fill="none" stroke="#7c9682" strokeWidth="2" />
          <text x="170" y="229" textAnchor="middle" fontSize="19" fill="#617d6a">
            {tr('固定光敏单元阵列', 'Fixed detector array')}
          </text>
          <path d="M25 245V326H315" fill="none" stroke="#9eb09f" />
          <path
            d={pixels
              .map((v, j) => `${j ? 'L' : 'M'}${25 + (j * 290) / 159} ${326 - v.value * 72}`)
              .join(' ')}
            fill="none"
            stroke="#6a936e"
            strokeWidth="2"
          />
          <circle
            cx={25 + (selected * 290) / 159}
            cy={326 - pixels[selected].value * 72}
            r="5"
            fill="#b18e61"
          />
          <text x="170" y="350" textAnchor="middle" fontSize="19" fill="#617d6a">
            x = {pixels[selected].x.toFixed(2)} mm · I = {pixels[selected].value.toFixed(2)}
          </text>
        </>
      ) : (
        <>
          <path d="M28 150H288" stroke="#769487" strokeWidth="5" />
          <path d="M28 155H288" stroke="#c4cfc0" strokeWidth="4" />
          <circle cx="30" cy={150 - height * 100} r="5" fill="#b29660" />
          <circle
            cx="30"
            cy={150 + height * 100}
            r="5"
            fill="none"
            stroke="#b29660"
            strokeDasharray="2 2"
          />
          <path
            d={`M30 ${150 - height * 100}L310 ${150 - y * 100}M30 ${150 - height * 100}L${30 + (mirror.reflectionX / 1.2) * 280} 150L310 ${150 - y * 100}`}
            fill="none"
            stroke="#b79960"
            strokeWidth="2"
          />
          <path
            d={`M30 ${150 + height * 100}L${30 + (mirror.reflectionX / 1.2) * 280} 150`}
            stroke="#b79960"
            strokeDasharray="4 4"
          />
          <path d="M310 25V150" stroke="#8b9e8d" strokeWidth="4" />
          <text x="24" y="80" fontSize="20" fill="#617d6a">
            S
          </text>
          <text x="24" y="210" fontSize="20" fill="#617d6a">
            S′
          </text>
          <text x="170" y="235" textAnchor="middle" fontSize="19" fill="#617d6a">
            {tr('镜面反射增加半周相位', 'Reflection adds half a cycle')}
          </text>
          <rect x="25" y="260" width="290" height="58" fill="#26362c" />
          {Array.from({ length: 290 }, (_, j) => (
            <rect
              key={j}
              x={25 + j}
              y="260"
              width="1.1"
              height="58"
              fill="#d7bf75"
              opacity={lloydMirror((j / 290) * 10, height, wavelength).intensity}
            />
          ))}
          <text x="25" y="348" fontSize="19" fill="#617d6a">
            {tr('暗：y=0', 'Dark: y=0')}
          </text>
          <text x="315" y="348" textAnchor="end" fontSize="19" fill="#617d6a">
            10 mm
          </text>
        </>
      )}
    </svg>
  );
}
export default function DoubleSlitMeasurementLab() {
  const film = useShowcase(),
    ids = ['e1-double-slit-wavelength', 'e1-double-slit-light-sensor', 'e1-lloyd-mirror'],
    [which, setWhich] = useState(Math.max(0, ids.indexOf(film.variant ?? ''))),
    [wl, setWl] = useState(589),
    [gap, setGap] = useState(0.18),
    [cursor, setCursor] = useState(0),
    [height, setHeight] = useState(0.3),
    [first, setFirst] = useState<number | null>(null),
    [last, setLast] = useState<number | null>(null),
    [count, setCount] = useState(6);
  const mode = film.watch ? (film.chapter < 4 ? 0 : film.chapter < 6 ? 1 : 2) : which,
    phase = film.watch
      ? mode === 0
        ? film.chapter
        : mode === 1
          ? film.chapter - 4
          : film.chapter - 6
      : 0,
    p = film.watch ? film.chapterProgress : Math.max(0, Math.min(1, (cursor + 20) / 40)),
    w = film.watch && mode === 0 && phase === 3 ? 450 + 200 * p : film.watch ? 589 : wl,
    d = film.watch ? 0.18 : gap,
    s = slitMeasurement(w, d),
    x = film.watch
      ? mode === 0
        ? phase === 0
          ? 0
          : phase === 1
            ? -2 * s.spacing
            : phase === 2
              ? (-2 + 5 * Math.min(1, p * 1.4)) * s.spacing
              : 3 * s.spacing
        : mode === 1
          ? -20 + 40 * p
          : -9 + 9 * p
      : cursor,
    h = film.watch ? (mode === 2 && phase === 1 ? 0.15 + 0.45 * p : 0.3) : height,
    estimate = first !== null && last !== null ? inferWavelength(first, last, count, d, 1.2) : null;
  function change(v: number, kind: 'wl' | 'gap') {
    setFirst(null);
    setLast(null);
    kind === 'wl' ? setWl(v) : setGap(v);
  }
  return (
    <div className="modern-lab slit-measure-lab">
      {!film.watch && (
        <div className="modern-paths">
          {[
            tr('测量头', 'Eyepiece'),
            tr('光敏阵列', 'Detector array'),
            tr('洛埃镜', 'Lloyd mirror'),
          ].map((n, j) => (
            <button type="button" key={j} aria-pressed={mode === j} onClick={() => setWhich(j)}>
              {n}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {mode === 2
          ? `2h = ${(2 * h).toFixed(2)} mm · λ = ${w.toFixed(0)} nm`
          : `d = ${d.toFixed(2)} mm · λ = ${w.toFixed(0)} nm · Δx = ${s.spacing.toFixed(3)} mm`}
      </div>
      <SlitMeasureArtwork
        mode={mode}
        phase={phase}
        progress={p}
        wavelength={w}
        separation={d}
        cursor={x}
        height={h}
      />
      <p className="modern-key">
        {mode === 0
          ? tr(
              '6条亮纹之间只有5个间隔，先测总距离再求平均。',
              'Six bright centers span five intervals; measure the total distance before averaging.',
            )
          : mode === 1
            ? tr(
                '许多固定光敏单元同时接光，逐点读出空间强度。',
                'Many fixed detector elements receive light together and reveal spatial intensity.',
              )
            : tr(
                '镜像提供第二条相干路径，反射相位让零路程差处变暗。',
                'The virtual source supplies a second coherent path; reflection makes zero path difference dark.',
              )}
      </p>
      {!film.watch && (
        <div className="modern-explore">
          <Range
            label={tr('波长 / nm', 'Wavelength / nm')}
            value={wl}
            min={450}
            max={650}
            step={1}
            onChange={(v) => change(v, 'wl')}
          />
          {mode === 2 ? (
            <Range
              label={tr('光源离镜面 / mm', 'Source height / mm')}
              value={height}
              min={0.15}
              max={0.6}
              step={0.01}
              onChange={setHeight}
            />
          ) : (
            <>
              <div className="modern-paths">
                {[0.18, 0.36].map((v) => (
                  <button
                    type="button"
                    key={v}
                    aria-pressed={gap === v}
                    onClick={() => change(v, 'gap')}
                  >
                    d = {v} mm
                  </button>
                ))}
              </div>
              <Range
                label={tr('分划线或读出位置 / mm', 'Reticle or readout position / mm')}
                value={cursor}
                min={-20}
                max={20}
                step={0.01}
                onChange={setCursor}
              />
              {mode === 0 && (
                <>
                  <Range
                    label={tr('包含的亮纹条数', 'Number of included bright centers')}
                    value={count}
                    min={2}
                    max={10}
                    step={1}
                    onChange={setCount}
                  />
                  <div className="modern-paths">
                    <button type="button" onClick={() => setFirst(cursor)}>
                      {tr('记下第一条', 'Record first')}
                    </button>
                    <button type="button" onClick={() => setLast(cursor)}>
                      {tr('记下最后一条', 'Record last')}
                    </button>
                  </div>
                  <p>
                    {first === null ? 'x₁ = —' : `x₁ = ${first.toFixed(2)} mm`} ·{' '}
                    {last === null ? 'x₂ = —' : `x₂ = ${last.toFixed(2)} mm`} ·{' '}
                    {estimate === null
                      ? tr('对准后记录两次读数', 'Align and record both readings')
                      : `λ = ${estimate.toFixed(1)} nm`}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
