import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ironHydroxides,
  hydroxideColour,
  hydroxideDirector,
} from '../../models/chem-iron-hydroxides';
import '../../styles/chem-iron-hydroxides.css';
export default function ChemIronHydroxides() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [oh, setOh] = useState(3),
    [oxygen, setOxygen] = useState(0.25),
    [extent, setExtent] = useState(0.6),
    [view, setView] = useState('tubes');
  const d = film.watch
    ? hydroxideDirector(film.chapter, film.chapterProgress)
    : { oh, oxygen, extent, add: 1, micro: view === 'micro', compare: false, progress: extent };
  const m = ironHydroxides(d.oh, d.oxygen, d.extent, d.add);
  const tube = (ferric: boolean, control = false) => {
    const amount = ferric ? m.ferricSolid : m.ferrousRemaining + m.oxidized,
      fraction = ferric ? 1 : control ? 0 : m.fraction;
    return (
      <div className="chem-hydroxide-specimen">
        <div className="chem-hydroxide-label">
          {ferric ? 'FeCl₃' : control ? say('FeSO₄ · 隔绝O₂', 'FeSO₄ · without O₂') : 'FeSO₄'}
        </div>
        <svg
          viewBox="0 0 180 270"
          aria-label={ferric ? 'Fe(III) hydroxide precipitation' : 'Fe(II) hydroxide oxidation'}
          role="img"
        >
          <path
            d="M48 30V215a42 42 0 0 0 84 0V30"
            fill="#d4ded122"
            stroke="#8c9d87"
            strokeWidth="2"
          />
          <path d="M51 120H129V215a39 39 0 0 1-78 0Z" fill={ferric ? '#ddcb8880' : '#c3d4b366'} />
          <ellipse cx="90" cy="120" rx="39" ry="5" fill="#dce6d166" stroke="#a5b49c" />
          <path
            d="M56 40V212q0 29 19 34"
            fill="none"
            stroke="white"
            strokeWidth="4"
            opacity=".45"
          />
          {d.add < 1 && (
            <>
              <path d="M87 0v43h8V0" fill="#c8d3c2" stroke="#9bab90" />
              <path d={`M91 ${60 + d.add * 45}q-9 14 0 14t0-14`} fill="#adbf9c" />
            </>
          )}
          {Array.from({ length: 40 }, (_, i) => {
            const visible = i / 40 < amount;
            const rise = 1 - d.add;
            return (
              <ellipse
                key={i}
                cx={60 + ((i * 17) % 61)}
                cy={170 + ((i * 19) % 62) - rise * 50}
                rx={6 + (i % 3)}
                ry={3 + (i % 2)}
                fill={ferric ? '#a15e3c' : hydroxideColour(fraction)}
                stroke={ferric ? '#915d43' : '#86967a'}
                strokeWidth=".5"
                opacity={visible ? 0.7 : 0}
              />
            );
          })}
          {!ferric && !control && d.oxygen > 0 && d.extent > 0 && (
            <g opacity=".8">
              <path
                d="M156 58q-34 13-39 52"
                fill="none"
                stroke="#8babb3"
                strokeWidth="2"
                strokeDasharray="4 5"
              />
              <path d="M112 103l5 8 7-6" fill="none" stroke="#8babb3" strokeWidth="2" />
              <text x="139" y="46" textAnchor="middle" fontSize="31" fill="#617e88">
                O₂
              </text>
            </g>
          )}
        </svg>
        <div className="chem-hydroxide-result">
          {amount === 0
            ? say('未生成沉淀', 'No precipitate')
            : ferric
              ? 'Fe(OH)₃'
              : fraction > 0.99
                ? 'Fe(OH)₃'
                : fraction === 0
                  ? 'Fe(OH)₂'
                  : say('氧化中的沉淀', 'Oxidizing precipitate')}
        </div>
      </div>
    );
  };
  return (
    <section className="chem-iron-hydroxides">
      {d.micro ? (
        <div className="chem-hydroxide-micro">
          <div className="chem-hydroxide-oxygen">O₂ + 2H₂O</div>
          <svg
            viewBox="0 0 320 205"
            role="img"
            aria-label={say(
              '四个铁中心从二价变为三价，铁原子数保持四个',
              'Four iron centres change from Fe(II) to Fe(III), conserving four iron atoms',
            )}
          >
            {[0, 1, 2, 3].map((i) => {
              const changed = m.fraction > (i + 0.5) / 4;
              return (
                <g
                  key={i}
                  transform={`translate(${50 + (i % 2) * 150} ${45 + Math.floor(i / 2) * 100})`}
                >
                  <circle r="24" fill={changed ? '#a15e3c' : '#d9e2ce'} stroke="#8f9a7f" />
                  <text
                    y="6"
                    textAnchor="middle"
                    fontSize="26"
                    fill={changed ? '#fff7e8' : '#536149'}
                  >
                    {changed ? 'Fe³⁺' : 'Fe²⁺'}
                  </text>
                  {[0, 1, 2].slice(0, changed ? 3 : 2).map((j) => (
                    <g key={j}>
                      <circle
                        cx={36 * Math.cos(j * 2.1 - 1.57)}
                        cy={36 * Math.sin(j * 2.1 - 1.57)}
                        r="11"
                        fill="#b9c8b1"
                      />
                      <text
                        x={36 * Math.cos(j * 2.1 - 1.57)}
                        y={36 * Math.sin(j * 2.1 - 1.57) + 4}
                        textAnchor="middle"
                        fontSize="20"
                        fill="#4e5e48"
                      >
                        OH
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
          <div className="chem-hydroxide-micro-note">
            {say('计量示意 · 非真实晶体结构', 'Stoichiometric diagram · not a crystal structure')}
          </div>
        </div>
      ) : (
        <div className="chem-hydroxide-pair">
          {d.compare ? tube(false, true) : tube(true)}
          {tube(false)}
        </div>
      )}
      <div className="chem-hydroxide-equation">
        {d.micro || d.compare || d.extent > 0
          ? '4Fe(OH)₂ + O₂ + 2H₂O → 4Fe(OH)₃'
          : 'Fe³⁺ + 3OH⁻ → Fe(OH)₃↓'}
      </div>
      {!film.watch && (
        <div className="chem-hydroxide-controls">
          <Segments
            label={say('观察层次', 'Observation')}
            value={view}
            options={[
              { value: 'tubes', label: say('试管', 'Test tubes') },
              { value: 'micro', label: say('铁的去向', 'Follow iron') },
            ]}
            onChange={setView}
          />
          <Range
            label={say('加入OH⁻（每管初始1 mmol铁）', 'OH⁻ added (1 mmol initial iron per tube)')}
            value={oh}
            min={0}
            max={4}
            step={0.1}
            unit="mmol"
            onChange={setOh}
          />
          <Range
            label={say('可参与反应的O₂', 'O₂ available to react')}
            value={oxygen}
            min={0}
            max={0.25}
            step={0.01}
            unit="mmol"
            onChange={setOxygen}
          />
          <Range
            label={say('氧化完成比例', 'Oxidation extent')}
            value={extent}
            min={0}
            max={1}
            step={0.01}
            onChange={setExtent}
          />
          <p>
            Fe²⁺ → Fe³⁺: {m.oxidized.toFixed(2)} mmol · O₂: {m.oxygenUsed.toFixed(3)} mmol
          </p>
          <p>
            {say(
              '颜色为教材现象示意；灰绿色不代表一个由本模型鉴定出的纯物相。',
              'Colours illustrate the textbook observation; grey-green does not identify a pure phase in this model.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
