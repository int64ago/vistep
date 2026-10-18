import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  atomicDirector,
  bohrHydrogen,
  ORBITAL_SAMPLES,
  orbitalRadius,
  projectOrbital,
  type HydrogenOrbital,
} from '../../models/chem-atomic-models';
import '../../styles/chem-atomic-models.css';
export default function ChemAtomicModels() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [mode, setMode] = useState(film.variant === 'model-history' ? 'dalton' : 'quantum'),
    [orbital, setOrbital] = useState<HydrogenOrbital>('1s'),
    [probability, setProbability] = useState(0.9),
    [count, setCount] = useState(900),
    [level, setLevel] = useState(2),
    [pAxis, setPAxis] = useState<'x' | 'y' | 'z'>('y');
  const d = film.watch
    ? atomicDirector(film.chapter, film.chapterProgress)
    : {
        chapter:
          mode === 'dalton'
            ? 0
            : mode === 'thomson'
              ? 1
              : mode === 'nuclear'
                ? 2
                : mode === 'bohr'
                  ? 3
                  : orbital === '2p'
                    ? 7
                    : orbital === '2s'
                      ? 6
                      : 5,
        progress: 1,
        orbital,
        probability,
        count,
        contour: true,
        bohrN: level,
      };
  const activeAxis = film.watch
    ? (['x', 'y', 'z'] as const)[Math.min(2, Math.floor(d.progress * 3))]
    : pAxis;
  const bohr = bohrHydrogen(d.bohrN),
    displayedLevels = Math.max(2, bohr.n),
    orbitScale = 108 / displayedLevels ** 2,
    radius = orbitalRadius(d.orbital, d.probability);
  const cloud = (o: HydrogenOrbital, axis: 'x' | 'y' | 'z' = 'y', small = false) => {
    const size = small ? 180 : 320,
      mid = size / 2,
      extent = d.chapter === 6 ? 22 : o === '1s' ? 6.5 : o === '2s' ? 22 : 20,
      scale = (mid - 12) / extent,
      rr = orbitalRadius(o, d.probability);
    return (
      <svg
        className={small ? 'chem-atom-small' : 'chem-atom-cloud'}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${o} hydrogen probability density projection${o === '2p' ? axis : ''}`}
      >
        {d.contour && o !== '2p' && (
          <circle
            cx={mid}
            cy={mid}
            r={rr * scale}
            fill="#acb9940c"
            stroke="#98aa7d"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
        )}
        {ORBITAL_SAMPLES[o].slice(0, d.count).map((p, i) => {
          const q = projectOrbital(p, axis);
          return (
            <circle
              key={i}
              cx={mid + q.x * scale}
              cy={mid - q.y * scale}
              r={small ? 1.1 : 1.5}
              fill={d.contour && p.r > rr ? '#a9b3a2' : '#768b56'}
              opacity={d.contour && p.r > rr ? 0.2 : 0.55}
            />
          );
        })}
        <circle cx={mid} cy={mid} r={small ? 2 : 3} fill="#b67d54" />
        {o === '2p' && (
          <>
            <path
              d={`M${mid - 42} ${mid + 30}L${mid + 42} ${mid - 30}M${mid} ${mid - 52}V${mid + 52}`}
              fill="none"
              stroke="#a7b59b"
              opacity=".35"
            />
          </>
        )}
      </svg>
    );
  };
  const names: [string, string][] = [
    ['1803 · 道尔顿', '1803 · Dalton'],
    ['1904 · 汤姆孙', '1904 · Thomson'],
    ['1911 · 卢瑟福', '1911 · Rutherford'],
    ['1913 · 玻尔', '1913 · Bohr'],
  ];
  return (
    <section className="chem-atomic-models">
      {d.chapter < 4 ? (
        <>
          <div className="chem-atom-heading">{say(...names[d.chapter])}</div>
          <svg
            className="chem-atom-historical"
            viewBox="0 0 320 290"
            role="img"
            aria-label={say(
              '明确标注的历史原子模型示意',
              'Explicitly labelled historical atomic model',
            )}
          >
            {d.chapter === 0 ? (
              <>
                <circle cx="160" cy="145" r="100" fill="#aaba91" />
                <circle cx="132" cy="113" r="67" fill="#bfcca6" opacity=".45" />
              </>
            ) : d.chapter === 1 ? (
              <>
                <circle cx="160" cy="145" r="100" fill="#cfbd8e" opacity=".45" />
                {Array.from({ length: 12 }, (_, i) => {
                  const angle = i * 2.4,
                    r = 25 + Math.sqrt(i / 12) * 60;
                  return (
                    <g
                      key={i}
                      transform={`translate(${160 + Math.cos(angle) * r} ${145 + Math.sin(angle) * r})`}
                    >
                      <circle r="10" fill="#879b78" />
                      <path d="M-4 0H4" stroke="#f4f5e9" strokeWidth="2" />
                    </g>
                  );
                })}
                {[0, 1, 2, 3, 4].map((i) => (
                  <text
                    key={i}
                    x={107 + ((i * 31) % 98)}
                    y={87 + ((i * 37) % 120)}
                    fontSize="20"
                    fill="#a78a55"
                  >
                    +
                  </text>
                ))}
              </>
            ) : (
              <>
                <circle cx="160" cy="145" r={d.chapter === 2 ? 8 : 4} fill="#bc8761" />
                {d.chapter === 2 ? (
                  <ellipse
                    cx="160"
                    cy="145"
                    rx="115"
                    ry="75"
                    fill="none"
                    stroke="#a6b69a"
                    strokeWidth="2"
                  />
                ) : (
                  Array.from({ length: displayedLevels }, (_, i) => i + 1).map((n) => (
                    <circle
                      key={n}
                      cx="160"
                      cy="145"
                      r={n * n * orbitScale}
                      fill="none"
                      stroke="#a6b69a"
                      strokeWidth={d.bohrN === n ? 2 : 1}
                      opacity={d.bohrN === n ? 1 : 0.45}
                    />
                  ))
                )}
                <circle
                  cx={
                    160 +
                    (d.chapter === 2 ? 115 : bohr.radius * orbitScale) *
                      Math.cos(d.progress * Math.PI * 2)
                  }
                  cy={
                    145 +
                    (d.chapter === 2 ? 75 : bohr.radius * orbitScale) *
                      Math.sin(d.progress * Math.PI * 2)
                  }
                  r="6"
                  fill="#7f946b"
                />
              </>
            )}
          </svg>
          <div className="chem-atom-note">
            {d.chapter === 0
              ? say('不可再分的实心球假说', 'Indivisible solid-sphere hypothesis')
              : d.chapter === 1
                ? say('弥散正电荷中嵌入电子', 'Electrons embedded in diffuse positive charge')
                : d.chapter === 2
                  ? say(
                      '正电荷与主要质量集中在核',
                      'Positive charge and most mass concentrated in a nucleus',
                    )
                  : `n = ${bohr.n} · E = ${bohr.energy.toFixed(2)} eV`}
          </div>
        </>
      ) : d.chapter === 7 ? (
        <>
          <div className="chem-atom-heading">H · 2p</div>
          <div className="chem-atom-p-orientations">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} data-active={axis === activeAxis}>
                {cloud('2p', axis, true)}
                <span>
                  2p<sub>{axis}</sub>
                </span>
              </div>
            ))}
          </div>
          <div className="chem-atom-p-labels">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <span key={axis} data-active={axis === activeAxis}>
                2p<sub>{axis}</sub>
              </span>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="chem-atom-heading">H · {d.orbital}</div>
          {d.chapter === 6 ? (
            <div className="chem-atom-s-comparison">
              <div>
                {cloud('1s', 'y', true)}
                <span>1s</span>
              </div>
              <div>
                {cloud('2s', 'y', true)}
                <span>2s</span>
              </div>
            </div>
          ) : (
            cloud(d.orbital)
          )}
          <div className="chem-atom-note">
            {d.chapter === 4
              ? say(`${d.count}个采样点`, `${d.count} probability samples`)
              : d.chapter === 5
                ? `${(d.probability * 100).toFixed(0)}% · r = ${radius.toFixed(2)} a₀`
                : say('共用同一长度标尺', 'One shared length scale')}
          </div>
        </>
      )}
      {!film.watch && (
        <div className="chem-atom-controls">
          {mode === 'quantum' && orbital === '2p' && (
            <Segments
              label={say('取向', 'Orientation')}
              value={pAxis}
              onChange={(v) => setPAxis(v as 'x' | 'y' | 'z')}
              options={['x', 'y', 'z'].map((value) => ({ value, label: `2p${value}` }))}
            />
          )}
          <Segments
            label={say('模型', 'Model')}
            value={mode}
            options={[
              { value: 'dalton', label: say('道尔顿', 'Dalton') },
              { value: 'thomson', label: say('汤姆孙', 'Thomson') },
              { value: 'nuclear', label: say('核式', 'Nuclear') },
              { value: 'bohr', label: say('玻尔', 'Bohr') },
              { value: 'quantum', label: say('概率分布', 'Probability') },
            ]}
            onChange={setMode}
          />
          {mode === 'quantum' ? (
            <>
              <Segments
                label={say('氢原子状态', 'Hydrogen state')}
                value={orbital}
                options={(['1s', '2s', '2p'] as const).map((value) => ({ value, label: value }))}
                onChange={(v) => setOrbital(v as HydrogenOrbital)}
              />
              <Range
                label={say('采样点数量', 'Number of sample dots')}
                value={count}
                min={1}
                max={900}
                step={1}
                onChange={setCount}
              />
              {orbital !== '2p' && (
                <Range
                  label={say('球内累计概率', 'Cumulative probability inside sphere')}
                  value={probability}
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  onChange={setProbability}
                />
              )}
            </>
          ) : mode === 'bohr' ? (
            <Range label="n" value={level} min={1} max={2} step={1} onChange={setLevel} />
          ) : null}
          <p>
            {say(
              '历史图不是实测原子照片；核与电子尺寸夸大。电子云使用氢原子非相对论概率模型，三维采样投影没有连续运动轨迹。',
              'Historical views are not atomic photographs; nucleus and electron sizes are exaggerated. Clouds project samples of nonrelativistic hydrogen probability, without a continuous trajectory.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
