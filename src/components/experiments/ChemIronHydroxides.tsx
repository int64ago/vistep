import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ironHydroxides,
  hydroxideColour,
  hydroxideDirector,
  hydroxideIronSlots,
  hydroxideSectorPath,
} from '../../models/chem-iron-hydroxides';
import '../../styles/chem-iron-hydroxides.css';
export default function ChemIronHydroxides() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [oh, setOh] = useState<number | null>(null),
    [oxygen, setOxygen] = useState<number | null>(null),
    [extent, setExtent] = useState<number | null>(null),
    [view, setView] = useState<string | null>(null);
  const base = hydroxideDirector(
    film.chapter,
    film.chapterProgress,
    film.chapterTime,
    en ? 'en' : 'zh',
  );
  const d = film.watch
    ? base
    : {
        ...base,
        oh: oh ?? base.oh * base.add,
        oxygen: oxygen ?? base.oxygen,
        extent: extent ?? base.extent,
        add: 1,
        micro: view === null ? base.micro : view === 'micro',
        compare: view === null ? base.compare : false,
      };
  const m = ironHydroxides(d.oh, d.oxygen, d.extent, d.add);
  const slots = hydroxideIronSlots(d.oh, d.oxygen, d.extent, d.add);
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
    <section
      className="chem-iron-hydroxides"
      data-watch={film.watch}
      data-micro={d.micro}
      data-compare={d.compare}
      data-comparison={d.comparison}
      data-oh={m.hydroxide}
      data-oxidized={m.oxidized}
      data-oxygen={d.oxygen}
      data-oxygen-used={m.oxygenUsed}
      data-extent={d.extent}
    >
      {d.micro ? (
        <div className="chem-hydroxide-micro">
          <div className="chem-hydroxide-oxygen">
            {m.ferrousRemaining + m.oxidized === 0
              ? say('没有先生成沉淀', 'No precipitate formed')
              : d.comparison === 'limited-oxygen' && film.watch
                ? say('新对照 · ½ O₂', 'New case · ½ O₂')
                : 'O₂ + 2H₂O'}
            <div className="chem-hydroxide-share-label">
              {say('4份 × 0.25 mmol Fe', '4 shares × 0.25 mmol Fe')}
            </div>
          </div>
          <svg
            viewBox="0 -18 320 223"
            role="img"
            aria-label={say(
              '四个等份保留总铁1 mmol；扇区表示水相二价铁、二价沉淀和三价沉淀的物质的量',
              'Four equal shares retain 1 mmol total iron; sectors show aqueous Fe(II), solid Fe(II) and solid Fe(III) amounts',
            )}
          >
            {slots.map((slot, i) => {
              const present = slot.solidII + slot.solidIII,
                changed = slot.solidIII >= slot.capacity - 1e-12,
                pureII = slot.solidII >= slot.capacity - 1e-12,
                mixed = slot.solidIII > 1e-12 && !changed;
              return (
                <g
                  key={i}
                  data-iron-id={`Fe-${i}`}
                  data-solid={present > 0}
                  data-solid-amount={present}
                  data-solid-iii={slot.solidIII}
                  data-solid-ii={slot.solidII}
                  data-aqueous-ii={slot.aqueousII}
                  transform={`translate(${50 + (i % 2) * 150} ${45 + Math.floor(i / 2) * 100})`}
                >
                  <circle r="24" fill="#d7e4e5" stroke="#8f9a7f" />
                  {slot.sectors.map((sector) => (
                    <path
                      key={sector.phase}
                      data-phase={sector.phase}
                      data-amount={sector.amount}
                      d={hydroxideSectorPath(sector.start, sector.end)}
                      fill={
                        sector.phase === 'solidIII'
                          ? '#a15e3c'
                          : sector.phase === 'solidII'
                            ? '#d9e2ce'
                            : '#d7e4e5'
                      }
                    />
                  ))}
                  <text
                    y="6"
                    textAnchor="middle"
                    fontSize="26"
                    fill={changed ? '#fff7e8' : '#536149'}
                  >
                    {changed ? 'Fe³⁺' : mixed ? 'Fe' : 'Fe²⁺'}
                  </text>
                  {[0, 1, 2].slice(0, changed ? 3 : pureII ? 2 : 0).map((j) => (
                    <g key={j}>
                      <circle
                        cx={36 * Math.cos(j * 2.1 - 1.57)}
                        cy={36 * Math.sin(j * 2.1 - 1.57)}
                        r="14"
                        fill="#b9c8b1"
                      />
                      <text
                        x={36 * Math.cos(j * 2.1 - 1.57)}
                        y={36 * Math.sin(j * 2.1 - 1.57) + 4}
                        textAnchor="middle"
                        fontSize="24"
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
          <div
            className="chem-hydroxide-ledger"
            aria-label={say('总初始铁1 mmol的分配', 'Distribution of 1 mmol initial iron')}
          >
            {[
              { id: 'aqueousII', label: 'Fe²⁺(aq)', amount: m.ferrousDissolved },
              { id: 'solidII', label: 'Fe(OH)₂', amount: m.ferrousRemaining },
              { id: 'solidIII', label: 'Fe(OH)₃', amount: m.oxidized },
            ].map((row) => (
              <div key={row.id} data-inventory={row.id} data-amount={row.amount}>
                <span>{row.label}</span>
                <strong>{Number(row.amount.toPrecision(3))} mmol</strong>
              </div>
            ))}
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
            value={d.micro ? 'micro' : 'tubes'}
            options={[
              { value: 'tubes', label: say('试管', 'Test tubes') },
              { value: 'micro', label: say('铁的去向', 'Follow iron') },
            ]}
            onChange={setView}
          />
          <Range
            label={say('加入OH⁻（每管初始1 mmol铁）', 'OH⁻ added (1 mmol initial iron per tube)')}
            value={d.oh}
            min={0}
            max={4}
            step={0.1}
            unit="mmol"
            onChange={setOh}
          />
          <Range
            label={say('可参与反应的O₂', 'O₂ available to react')}
            value={d.oxygen}
            min={0}
            max={0.25}
            step={0.005}
            unit="mmol"
            onChange={setOxygen}
          />
          <Range
            label={say('氧化完成比例', 'Oxidation extent')}
            value={d.extent}
            min={0}
            max={1}
            step={0.01}
            onChange={setExtent}
          />
          {d.micro && (
            <p>
              {say(
                '扇区按物质的量分账，并非把一个原子切开；水相未沉淀的铁另计。OH组只标注整份为同一固相时的净组成，不表示晶体结构。',
                'Sectors allocate amounts, not pieces of one atom. Unprecipitated aqueous iron remains separate. OH groups mark net composition only for a share entirely in one solid phase, not crystal structure.',
              )}
            </p>
          )}
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
