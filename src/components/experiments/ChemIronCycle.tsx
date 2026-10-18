import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ironThiocyanate,
  ironRedox,
  ironCycleDirector,
  ironEquilibriumSamples,
} from '../../models/chem-iron-cycle';
import '../../styles/chem-iron-cycle.css';
export default function ChemIronCycle() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const initial =
    film.variant === 'equilibrium'
      ? 'equilibrium'
      : film.variant === 'coordination'
        ? 'coordination'
        : film.variant === 'redox'
          ? 'reduce'
          : 'test';
  const [mode, setMode] = useState(initial),
    [reduction, setReduction] = useState(1),
    [oxidation, setOxidation] = useState(0),
    [ligand, setLigand] = useState(0.0075),
    [remove, setRemove] = useState(1),
    [extra, setExtra] = useState(0.02),
    [decant, setDecant] = useState(0.7);
  const d = film.watch
      ? ironCycleDirector(film.chapter, film.chapterProgress)
      : { mode, reduction, oxidation, ligand, remove, extra, progress: decant },
    r = ironRedox(d.reduction, d.oxidation),
    equilibrium = d.mode === 'equilibrium',
    coordination = d.mode === 'coordination',
    redox = ['reduce', 'decant', 'oxidize'].includes(d.mode);
  const current = ironThiocyanate(redox ? r.fe3 : 0.0025, d.ligand),
    { reference, removed, added } = ironEquilibriumSamples(d.remove, d.extra);
  const tube = (red: number, fe2 = false, powder = false, portion = 1) => (
    <svg
      viewBox="55 28 120 252"
      role="img"
      aria-label={say('铁溶液的显色与残余铁粉', 'Iron solution colour and residual iron powder')}
    >
      <path d="M65 40V220a50 50 0 0 0 100 0V40" stroke="#9ca28c" strokeWidth="2" fill="#d3d8be18" />
      <ellipse cx="115" cy="40" rx="50" ry="8" fill="none" stroke="#9ca28c" />
      <path
        d={`M67 ${220 - portion * 100}H163V220a48 48 0 0 1-96 0Z`}
        fill={fe2 ? '#a7bd95' : '#c4ac65'}
        opacity=".2"
      />
      <path
        d={`M67 ${220 - portion * 100}H163V220a48 48 0 0 1-96 0Z`}
        fill="#9e3b35"
        opacity={red * 0.8}
      />
      {powder &&
        Array.from({ length: 10 }, (_, i) => (
          <ellipse
            key={i}
            cx={78 + ((i * 13) % 75)}
            cy={249 + (i % 3) * 4}
            rx="5"
            ry="3"
            fill="#777e6b"
          />
        ))}
    </svg>
  );
  return (
    <section className="chem-iron-cycle" data-mode={d.mode}>
      {coordination ? (
        <div className="chem-iron-coordination">
          <div className="chem-iron-complexdiagram">
            <span>Fe³⁺</span>
            <i>⇌</i>
            <div>
              <b>[Fe(SCN)]²⁺</b>
              <b>[Fe(SCN)₂]⁺</b>
            </div>
          </div>
          <div className="chem-iron-species">
            {[
              { name: 'Fe³⁺', amount: current.freeIron, c: '#c7b66d' },
              { name: '[Fe(SCN)]²⁺', amount: current.mono, c: '#ac5a4a' },
              { name: '[Fe(SCN)₂]⁺', amount: current.bis, c: '#8f3e3c' },
            ].map((v) => (
              <div key={v.name}>
                <span>{v.name}</span>
                <i
                  style={{ width: `${Math.max(1, (v.amount / 0.0025) * 100)}%`, background: v.c }}
                />
                <b>{(v.amount * 1000).toFixed(3)} mmol/L</b>
              </div>
            ))}
          </div>
          <p>
            {say(
              '红色来自配合物；铁的形式价态仍为+3。',
              'The red colour belongs to complexes; iron remains formally +3.',
            )}
          </p>
        </div>
      ) : d.mode === 'decant' ? (
        <div className="chem-iron-decant">
          <figure>
            {tube(0, true, true, 1 - 0.7 * d.progress)}
            <figcaption>{say('铁粉留在原管', 'Iron powder stays behind')}</figcaption>
          </figure>
          <div className="chem-iron-transferline">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path d="M8 50H92" fill="none" stroke="#99b495" strokeWidth="3" />
              <path d="M82 40L92 50L82 60" stroke="#99b495" fill="none" />
            </svg>
          </div>
          <figure>
            {tube(0, true, false, 0.7 * d.progress)}
            <figcaption>{say('上层清液另取一管', 'Supernatant in a separate tube')}</figcaption>
          </figure>
        </div>
      ) : (
        <div className={`chem-iron-tubes ${equilibrium ? 'is-three' : ''}`}>
          {equilibrium ? (
            <>
              <figure>
                {tube(reference.red)}
                <figcaption>
                  <b>a</b>
                  {say('原平衡参照', 'Reference')}
                </figcaption>
              </figure>
              <figure>
                {tube(removed.red, true, d.remove > 0)}
                <figcaption>
                  <b>b</b>
                  {say(
                    d.remove > 0 ? '加入铁粉' : '铁粉组',
                    d.remove > 0 ? 'Iron added' : 'Iron test',
                  )}
                </figcaption>
              </figure>
              <figure>
                {tube(added.red)}
                <figcaption>
                  <b>c</b>
                  {say(
                    d.extra > 0 ? '增加SCN⁻' : 'SCN⁻组',
                    d.extra > 0 ? 'SCN⁻ added' : 'SCN⁻ test',
                  )}
                </figcaption>
              </figure>
            </>
          ) : d.mode === 'test' ? (
            <>
              <figure>
                {tube(current.red)}
                <figcaption>Fe³⁺ + SCN⁻</figcaption>
              </figure>
              <figure>
                {tube(0, true)}
                <figcaption>Fe²⁺ + SCN⁻</figcaption>
              </figure>
            </>
          ) : (
            <figure>
              {tube(
                d.mode === 'reduce' && film.watch && d.progress < 0.75 ? 0 : current.red,
                r.fe2 > 0,
                d.mode === 'reduce',
              )}
              <figcaption>
                {d.mode === 'reduce'
                  ? say(
                      d.progress < 0.75 && film.watch ? '加入铁粉，充分反应' : '反应后加入KSCN检验',
                      d.progress < 0.75 && film.watch
                        ? 'Iron added; allow reaction'
                        : 'Test with KSCN after reaction',
                    )
                  : say('清液中Fe²⁺被氧化', 'Fe²⁺ oxidized in the supernatant')}
              </figcaption>
            </figure>
          )}
        </div>
      )}
      {redox && d.mode !== 'decant' && (
        <div className="chem-iron-redox">
          <span>{d.mode === 'reduce' ? '2Fe³⁺ + Fe → 3Fe²⁺' : '2Fe²⁺ + Cl₂ → 2Fe³⁺ + 2Cl⁻'}</span>
          <div>
            <b>Fe³⁺ {(r.fe3 * 1000).toFixed(2)}</b>
            <b>Fe²⁺ {(r.fe2 * 1000).toFixed(2)}</b>
            <small>mmol/L</small>
          </div>
        </div>
      )}
      {!film.watch && (
        <div className="chem-iron-controls">
          <Segments
            label={say('过程', 'Process')}
            value={mode}
            options={[
              { value: 'test', label: say('检验', 'Test') },
              { value: 'reduce', label: say('还原', 'Reduce') },
              { value: 'decant', label: say('清液', 'Decant') },
              { value: 'oxidize', label: say('氧化', 'Oxidize') },
              { value: 'equilibrium', label: say('平衡', 'Equilibrium') },
              { value: 'coordination', label: say('配合物', 'Complexes') },
            ]}
            onChange={(v) => {
              setMode(v);
              if (v === 'oxidize') setReduction(1);
            }}
          />
          {equilibrium ? (
            <>
              <Range
                label={say('b管Fe³⁺还原比例', 'Fe³⁺ reduced in tube b')}
                value={remove}
                min={0}
                max={1}
                step={0.01}
                onChange={setRemove}
              />
              <Range
                label={say('c管增加SCN⁻ / mol·L⁻¹', 'SCN⁻ added to tube c / mol·L⁻¹')}
                value={extra}
                min={0}
                max={0.04}
                step={0.001}
                onChange={setExtra}
              />
            </>
          ) : d.mode === 'decant' ? (
            <Range
              label={say('移取上清液的比例', 'Fraction of supernatant transferred')}
              value={decant}
              min={0}
              max={1}
              step={0.01}
              onChange={setDecant}
            />
          ) : redox ? (
            <>
              <Range
                label={say('铁粉还原完成比例', 'Reduction by iron')}
                value={reduction}
                min={0}
                max={1}
                step={0.01}
                onChange={setReduction}
              />
              {d.mode === 'oxidize' && (
                <Range
                  label={say('清液氧化完成比例', 'Oxidation of supernatant')}
                  value={oxidation}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setOxidation}
                />
              )}
            </>
          ) : (
            <Range
              label={say('SCN⁻总浓度 / mol·L⁻¹', 'Total SCN⁻ / mol·L⁻¹')}
              value={ligand}
              min={0}
              max={0.04}
              step={0.001}
              onChange={setLigand}
            />
          )}
          <p>
            {say(
              '数值使用两种配离子的理想稀溶液模型；颜色是相对示意，未拟合实际吸收度。',
              'Values use an ideal dilute two-complex model. Colour is relative and is not fitted to measured absorbance.',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
