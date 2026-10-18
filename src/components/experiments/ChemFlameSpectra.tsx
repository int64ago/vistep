import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ATOMIC_LINES,
  flameLines,
  flameDirector,
  photonEnergyEv,
  wavelengthColour,
  type SpectrumElement,
} from '../../models/chem-flame-spectra';
import '../../styles/chem-flame-spectra.css';
export default function ChemFlameSpectra() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [mode, setMode] = useState(
      film.variant === 'levels' ? 'energy' : film.variant === 'spectra' ? 'spectrum' : 'flame',
    ),
    [element, setElement] = useState<SpectrumElement>(film.variant === 'spectra' ? 'Li' : 'Na'),
    [filter, setFilter] = useState('off'),
    [interference, setInterference] = useState(0.5),
    [absorption, setAbsorption] = useState('emission'),
    [progress, setProgress] = useState(0.7);
  const d = film.watch
    ? flameDirector(film.chapter, film.chapterProgress)
    : {
        mode,
        element: (mode === 'flame' ? (element === 'K' ? 'K' : 'Na') : element) as SpectrumElement,
        filter: filter === 'on',
        interference,
        absorption: absorption === 'absorption',
        progress,
      };
  const lines = flameLines(
      d.element,
      d.mode === 'flame' ? d.interference : 0,
      d.mode === 'flame' && d.filter,
    ),
    primary = ATOMIC_LINES[d.element][0],
    energy = photonEnergyEv(primary.nm);
  const active = !film.watch || film.chapter !== 0 || d.progress > 0.25;
  const appearance = (spectrum: typeof lines) => {
    const yellow = spectrum
        .filter((x) => x.nm > 580 && x.nm < 600)
        .reduce((a, x) => a + x.observed, 0),
      violet = spectrum.filter((x) => x.nm < 450).reduce((a, x) => a + x.observed, 0),
      yellowFraction = yellow / (yellow + violet + 0.0001);
    return !active
      ? '#8ebbc9'
      : d.element === 'Na'
        ? '#e5c47d'
        : d.element === 'K'
          ? `rgb(${Math.round(180 + yellowFraction * 49)},${Math.round(156 + yellowFraction * 40)},${Math.round(220 - yellowFraction * 95)})`
          : wavelengthColour(primary.nm);
  };
  const colour = appearance(lines),
    sourceColour = appearance(flameLines(d.element, d.interference, false));
  const bar = (element: SpectrumElement, absorb: boolean) => (
    <div className="chem-spectrum-row">
      <b>{element}</b>
      <div
        className={`chem-spectrum-strip ${absorb ? 'is-absorption' : ''}`}
        aria-label={say(
          `${element}的${absorb ? '吸收' : '发射'}谱线`,
          `${element} ${absorb ? 'absorption' : 'emission'} lines`,
        )}
      >
        {ATOMIC_LINES[element]
          .filter((x) => x.nm >= 390 && x.nm <= 780)
          .map((x, i) => (
            <i
              key={i}
              style={{
                left: `${((x.nm - 390) / 390) * 100}%`,
                background: absorb ? '#163c37' : wavelengthColour(x.nm),
                opacity: absorb ? 0.82 : 0.4 + x.weight * 0.6,
              }}
              title={`${x.nm.toFixed(3)} nm`}
            />
          ))}
      </div>
    </div>
  );
  return (
    <section className="chem-flame-spectra" data-watch={film.watch}>
      <header>
        <p>
          {say(
            d.mode === 'flame'
              ? '从焰色走向分开的谱线'
              : d.mode === 'energy'
                ? '能级差决定光子的能量'
                : '元素留下的是一组谱线',
            d.mode === 'flame'
              ? 'From flame colour to separate lines'
              : d.mode === 'energy'
                ? 'Energy gaps determine photon energies'
                : 'Each element has a pattern of lines',
          )}
        </p>
        <span>{say('选取谱线 · 教学图谱', 'Selected lines · Teaching reconstruction')}</span>
      </header>
      {d.mode === 'flame' ? (
        <div className="chem-flame-bench">
          <svg
            viewBox="0 0 440 280"
            role="img"
            aria-label={say(
              '盐样品在火焰中发光，钴玻璃改变透过光的组成',
              'A salt sample colours a flame; cobalt glass changes transmitted light',
            )}
          >
            <defs>
              <radialGradient id={`${id}flame`}>
                <stop stopColor={sourceColour} stopOpacity=".4" />
                <stop offset="1" stopColor={sourceColour} stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="136" cy="129" rx="67" ry="102" fill={`url(#${id}flame)`} />
            <path
              d="M111 207Q82 167 132 65Q127 129 151 148Q183 187 145 209Z"
              fill={sourceColour}
              opacity=".8"
            />
            <path d="M122 206Q115 178 136 142Q133 183 146 207Z" fill="#a1c4da" opacity=".65" />
            <rect x="117" y="210" width="31" height="40" rx="7" fill="#72968a" />
            <ellipse cx="132" cy="251" rx="47" ry="9" fill="#6e9282" />
            <path
              d="M166 137Q142 128 134 145Q130 158 143 158Q155 159 155 147M163 137L250 92"
              stroke="#c4d4bd"
              strokeWidth="3"
              fill="none"
            />
            <path d="M246 94L314 55" stroke="#a7906b" strokeWidth="10" strokeLinecap="round" />
            {d.filter && (
              <>
                <rect
                  x="278"
                  y="125"
                  width="45"
                  height="91"
                  rx="7"
                  fill="#6f87c1"
                  fillOpacity=".6"
                  stroke="#9fb0d7"
                />
                <path d="M139 182H278" stroke={sourceColour} opacity=".55" />
                <path d="M278 182H389" stroke={colour} opacity=".75" />
              </>
            )}
            <path d="M373 183Q389 163 405 183Q389 198 373 183Z" stroke="#b8cbb5" fill="none" />
            <circle cx="389" cy="182" r="5" fill={colour} />
          </svg>
          <div className="chem-flame-sample">
            <strong>
              {!active
                ? say('先检查金属丝是否洁净', 'First check the clean wire')
                : d.element === 'Na'
                  ? say('钠盐：黄色', 'Sodium salt: yellow')
                  : say('钾盐与钠黄光干扰', 'Potassium with sodium interference')}
            </strong>
            <span>
              <i
                className="chem-observed-colour"
                style={{ background: colour }}
                aria-hidden="true"
              />
              {d.filter
                ? say('透过蓝色钴玻璃', 'Through cobalt-blue glass')
                : say('直接观察', 'Direct observation')}
            </span>
          </div>
        </div>
      ) : d.mode === 'energy' ? (
        <div className="chem-energy-levels">
          <svg
            viewBox="0 0 430 250"
            role="img"
            aria-label={say(
              '两个能级之间吸收或释放与能级差相等的能量',
              'Absorption or emission between two energy levels',
            )}
          >
            <path d="M65 207V34m-5 7 5-7 5 7" stroke="#a9c4b5" strokeWidth="2" />
            <path d="M103 190H285M103 65H285" stroke="#d2d9b7" strokeWidth="3" />
            <path
              d={d.absorption ? 'M195 184V72m-6 8 6-8 6 8' : 'M195 72V184m-6-8 6 8 6-8'}
              stroke="#ddc28d"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="195"
              cy={
                d.absorption
                  ? 190 - 125 * Math.min(1, d.progress * 1.5)
                  : 65 + 125 * Math.min(1, d.progress * 1.5)
              }
              r="7"
              fill="#ebd6a0"
            />
            <path
              d={Array.from(
                { length: 51 },
                (_, i) => `${i ? 'L' : 'M'}${290 + i * 2} ${127 + Math.sin(i * 0.6) * 10}`,
              ).join(' ')}
              stroke={wavelengthColour(primary.nm)}
              strokeWidth="2"
              fill="none"
              opacity={d.absorption ? 1 - Math.min(1, d.progress) : Math.min(1, d.progress * 2)}
            />
          </svg>
          <div className="chem-energy-labels">
            <span>{say('低能级 ↔ 高能级', 'Lower ↔ upper level')}</span>
            <strong>ΔE ≈ {energy.toFixed(3)} eV</strong>
            <span>λ ≈ {primary.nm.toFixed(1)} nm</span>
            <p>
              {say(
                d.absorption ? '吸收：光子能量须匹配允许跃迁' : '发射：原子失去的能量由光子带走',
                d.absorption
                  ? 'Absorption: photon energy must match an allowed transition'
                  : 'Emission: the photon carries away the energy difference',
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="chem-spectrum-comparison">
          {(['Li', 'He', 'Hg'] as SpectrumElement[]).map((x) => (
            <div key={x} data-active={x === d.element}>
              {bar(x, d.absorption)}
            </div>
          ))}
          <div className="chem-spectrum-scale">
            <span>390 nm</span>
            <span>580 nm</span>
            <span>780 nm</span>
          </div>
        </div>
      )}
      {d.mode === 'flame' && (
        <div className="chem-flame-lines">
          <span>{say('同一波长轴上的选取谱线', 'Selected lines on one wavelength axis')}</span>
          <div className="chem-spectrum-strip">
            {lines
              .filter((x) => x.nm <= 780)
              .map((x, i) => (
                <i
                  key={i}
                  style={{
                    left: `${((x.nm - 390) / 390) * 100}%`,
                    background: wavelengthColour(x.nm),
                    opacity: active ? Math.min(1, x.observed) : 0,
                  }}
                />
              ))}
          </div>
          <div className="chem-spectrum-scale">
            <span>390 nm</span>
            <span>580 nm</span>
            <span>780 nm</span>
          </div>
        </div>
      )}
      {!film.watch && (
        <div className="chem-flame-controls">
          <Segments
            label={say('观察方式', 'View')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'flame', label: say('焰色', 'Flame') },
              { value: 'energy', label: say('能级', 'Levels') },
              { value: 'spectrum', label: say('图谱', 'Spectra') },
            ]}
          />
          {d.mode === 'flame' ? (
            <>
              <Segments
                label={say('盐样品', 'Salt sample')}
                value={element === 'K' ? 'K' : 'Na'}
                onChange={(v) => setElement(v as SpectrumElement)}
                options={[
                  { value: 'Na', label: say('钠', 'Sodium') },
                  { value: 'K', label: say('钾', 'Potassium') },
                ]}
              />
              <Segments
                label={say('钴玻璃', 'Cobalt glass')}
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'off', label: say('移开', 'Removed') },
                  { value: 'on', label: say('放入', 'Inserted') },
                ]}
              />
              {element === 'K' && (
                <Range
                  label={say('黄光干扰相对量', 'Relative yellow-light interference')}
                  value={interference}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={setInterference}
                />
              )}
            </>
          ) : (
            <>
              <Segments
                label={say('跃迁与光谱', 'Transition and spectrum')}
                value={absorption}
                onChange={setAbsorption}
                options={[
                  { value: 'emission', label: say('发射', 'Emission') },
                  { value: 'absorption', label: say('吸收', 'Absorption') },
                ]}
              />
              {d.mode === 'energy' && (
                <Range
                  label={say('跃迁示意进度', 'Transition illustration progress')}
                  value={progress}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setProgress}
                />
              )}
            </>
          )}
        </div>
      )}
      <details>
        <summary>{say('图谱与滤镜的边界', 'Spectra and filter limits')}</summary>
        <p>
          {say(
            '谱线位置来自NIST中性原子空气波长表，只选取若干线；宽度与亮度为显示放大，非实测强度。钴玻璃曲线仅模拟抑制黄光与保留部分紫/红光的作用。吸收谱示意同一组允许跃迁，下能级必须有原子占据；不同实验条件下并非所有发射线都会等强地变为暗线。能级画面不表示电子运动轨道。',
            'Line positions are selected neutral-atom air wavelengths from NIST. Widths and brightness are enlarged for visibility, not measured intensities. The cobalt-glass curve illustrates yellow suppression and partial violet/red transmission. Absorption represents the same allowed transitions with populated lower states; not every emission line becomes an equally strong dark line under all conditions. The level diagram is not an electron orbit.',
          )}
        </p>
      </details>
    </section>
  );
}
