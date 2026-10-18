import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  IRON_PRACTICAL_CASES,
  IRON_PRACTICAL_EQUATIONS,
  ironPractical,
  ironPracticalDirector,
  type IronPracticalCase,
} from '../../models/chem-iron-practical';
import '../../styles/chem-iron-practical.css';
export default function ChemIronPractical() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [kind, setKind] = useState<IronPracticalCase>('iron-copper'),
    [extent, setExtent] = useState(0.5),
    [partner, setPartner] = useState(1),
    [test, setTest] = useState(true);
  const d = film.watch
    ? ironPracticalDirector(film.chapter, film.chapterProgress)
    : { kind, extent, partner, test, progress: extent };
  const m = ironPractical(d.kind, d.extent, d.partner, d.test);
  const names: Record<IronPracticalCase, [string, string]> = {
    'iron-copper': ['铁丝 + CuSO₄', 'Iron wire + CuSO₄'],
    'ferric-copper': ['铜片 + FeCl₃', 'Copper + FeCl₃'],
    'ferric-iodide': ['FeCl₃ + KI', 'FeCl₃ + KI'],
    'ferrous-zinc': ['锌片 + FeCl₂', 'Zinc + FeCl₂'],
    permanganate: ['酸性KMnO₄ + FeSO₄', 'Acidified KMnO₄ + FeSO₄'],
    'ferric-test': ['FeCl₃ + KSCN', 'FeCl₃ + KSCN'],
    'iron-test': ['FeCl₃ + 铁粉，再检验', 'FeCl₃ + iron, then test'],
  };
  const ferricOpacity = Math.min(0.5, m.fe3 * 0.45),
    copperOpacity = Math.min(0.55, m.cu2 * 0.5),
    purpleOpacity = Math.min(0.8, m.mn7 * 4),
    iodineOpacity = m.starch ? 0.85 : Math.min(0.6, m.iodine),
    label =
      d.kind === 'ferric-iodide'
        ? d.test
          ? say('已加入淀粉', 'Starch added')
          : 'KI'
        : m.diagnostic
          ? 'KSCN'
          : d.kind === 'permanganate' && d.test
            ? say('仍有MnO₄⁻，尚未显色检验', 'MnO₄⁻ remains; no SCN test yet')
            : '';
  return (
    <section className="chem-iron-practical" data-watch={film.watch}>
      <div className="chem-practical-label">{say(...names[d.kind])}</div>
      <div className="chem-practical-stage">
        <svg
          viewBox="0 0 320 300"
          role="img"
          aria-label={say(
            '当前铁实验的金属表面、溶液与显色证据',
            'Metal surface, solution and colour evidence for the current iron experiment',
          )}
        >
          <path
            d="M80 20V225a80 55 0 0 0 160 0V20"
            fill="#cdd9c82a"
            stroke="#95a58b"
            strokeWidth="2"
          />
          <path d="M84 100H236V225a76 51 0 0 1-152 0Z" fill="#d5e2c8" opacity=".35" />
          {[
            ['#d5b561', ferricOpacity],
            ['#73acc1', copperOpacity],
            ['#884c9b', purpleOpacity],
            [m.starch ? '#344b6c' : '#ae8b3f', iodineOpacity],
            ['#af4335', m.red * 0.85],
          ].map(([colour, opacity], i) => (
            <path
              key={i}
              d="M84 100H236V225a76 51 0 0 1-152 0Z"
              fill={String(colour)}
              opacity={Number(opacity)}
            />
          ))}
          <path
            d="M91 38V223q0 35 30 43"
            fill="none"
            stroke="white"
            strokeWidth="4"
            opacity=".45"
          />
          {d.kind === 'iron-copper' && (
            <>
              <path
                d="M155 25q-12 15 0 35V235"
                fill="none"
                stroke="#8d9692"
                strokeWidth={16 * Math.sqrt(m.fe0)}
              />
              {Array.from({ length: 22 }, (_, i) => (
                <ellipse
                  key={i}
                  cx={151 + (i % 3) * 4}
                  cy={115 + i * 5}
                  rx="5"
                  ry="3"
                  fill="#b9784e"
                  opacity={i / 22 < m.cu0 ? 0.85 : 0}
                />
              ))}
            </>
          )}
          {d.kind === 'ferric-copper' &&
            Array.from({ length: 3 }, (_, i) => (
              <path
                key={i}
                d={`M${120 + i * 35} ${205 + (i % 2) * 20}l${19 * Math.sqrt((m.cu0 * 2) / Math.max(0.001, d.partner))} -6l4 18l-18 6Z`}
                fill="#bb8158"
                stroke="#a96d49"
                opacity={m.cu0 > 1e-8 ? 1 : 0}
              />
            ))}
          {d.kind === 'ferrous-zinc' && (
            <>
              <path
                d={`M120 ${230 - (85 * m.zn0) / Math.max(0.001, d.partner)}l70-15v30l-70 15Z`}
                fill="#aeb7b2"
                stroke="#919f95"
                opacity={m.zn0 > 1e-8 ? 1 : 0}
              />
              {Array.from({ length: 24 }, (_, i) => (
                <circle
                  key={i}
                  cx={115 + ((i * 17) % 85)}
                  cy={220 + ((i * 7) % 30)}
                  r="3.5"
                  fill="#65736b"
                  opacity={i / 24 < m.fe0 ? 0.9 : 0}
                />
              ))}
            </>
          )}
          {d.kind === 'iron-test' &&
            Array.from({ length: 20 }, (_, i) => (
              <circle
                key={i}
                cx={110 + ((i * 19) % 100)}
                cy={238 + ((i * 7) % 25)}
                r="3.5"
                fill="#727e72"
                opacity={i / 20 < (m.fe0 * 2) / Math.max(0.001, d.partner) ? 0.8 : 0}
              />
            ))}
          {d.test && (m.diagnostic || d.kind === 'ferric-iodide') && (
            <path d="M159 5v43h6V5M162 66q-6 9 0 10t0-10" fill="#bdcbb4" stroke="#91a68c" />
          )}
        </svg>
        <div className="chem-practical-observation">
          <div className="chem-practical-reagent">{label}</div>
          <div className="chem-practical-valence">
            <span className={m.fe0 > 1e-9 ? 'active' : ''}>Fe⁰</span>
            <span className={m.fe2 > 1e-9 ? 'active' : ''}>Fe²⁺</span>
            <span className={m.fe3 > 1e-9 ? 'active' : ''}>Fe³⁺</span>
          </div>
          <p>
            {d.kind === 'ferric-test'
              ? say(
                  '显色改变配位，不改变铁的价态',
                  'Colour changes coordination, not the iron oxidation state',
                )
              : say('高亮表示当前存在的铁价态', 'Present oxidation states')}
          </p>
        </div>
      </div>
      <div className="chem-practical-equation">{IRON_PRACTICAL_EQUATIONS[d.kind]}</div>
      {!film.watch && (
        <div className="chem-practical-controls">
          <Segments
            label={say('实验子项', 'Sub-experiment')}
            value={kind}
            options={IRON_PRACTICAL_CASES.map((value) => ({ value, label: say(...names[value]) }))}
            onChange={(v) => setKind(v as IronPracticalCase)}
          />
          <Range
            label={say('反应完成比例', 'Reaction extent')}
            value={extent}
            min={0}
            max={1}
            step={0.01}
            onChange={setExtent}
          />
          {kind !== 'ferric-test' && (
            <Range
              label={say('另一反应物相对供给', 'Relative co-reactant supply')}
              value={partner}
              min={0}
              max={2}
              step={0.05}
              onChange={setPartner}
            />
          )}
          {['ferric-iodide', 'permanganate', 'ferric-test', 'iron-test'].includes(kind) && (
            <Segments
              label={say('后续显色试剂', 'Follow-up colour reagent')}
              value={test ? 'on' : 'off'}
              options={[
                { value: 'on', label: say('加入', 'Added') },
                { value: 'off', label: say('未加入', 'Not added') },
              ]}
              onChange={(v) => setTest(v === 'on')}
            />
          )}
          <p>
            Fe⁰ {m.fe0.toFixed(2)} · Fe²⁺ {m.fe2.toFixed(2)} · Fe³⁺ {m.fe3.toFixed(2)}
          </p>
          <p>
            {say(
              '采用理想净反应和定性颜色；忽略副反应、实际速率与颜色叠加的光谱计算。',
              'Ideal net reactions and qualitative colours omit side reactions, actual rates and spectral mixing.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
