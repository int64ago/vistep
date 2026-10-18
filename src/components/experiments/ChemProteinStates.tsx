import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Segments, Range } from '../lab/Controls';
import {
  proteinPopulation,
  proteinColour,
  proteinDirector,
  proteinSymbol,
  type ProteinTreatment,
} from '../../models/chem-protein-states';
import '../../styles/chem-protein-states.css';
export default function ChemProteinStates() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState(
      film.variant === 'nitric-colour'
        ? 'colour'
        : film.variant === 'salt-redissolve'
          ? 'salt'
          : film.variant === 'required-protein-tests'
            ? 'lead'
            : 'heat',
    ),
    [exposure, setExposure] = useState(0.8),
    [water, setWater] = useState(0),
    [reactive, setReactive] = useState(1);
  const d = film.watch
    ? proteinDirector(film.chapter, film.chapterProgress)
    : {
        chapter: view === 'colour' ? 6 : view === 'salt' ? 1 : view === 'lead' ? 5 : 2,
        progress: exposure,
        exposure,
        addedWater: water,
      };
  const mode: ProteinTreatment = film.watch
    ? d.chapter < 2
      ? 'salt'
      : d.chapter === 5
        ? 'lead'
        : 'heat'
    : view === 'colour'
      ? 'heat'
      : (view as ProteinTreatment);
  const m = proteinPopulation(mode, d.exposure, d.addedWater),
    colour = proteinColour(d.progress, film.watch ? 1 : reactive);
  const labels = [
    ['盐浓度升高，蛋白质析出', 'High salt precipitates protein'],
    ['加水后重新分散', 'Water restores dispersion'],
    ['加热改变蛋白质状态', 'Heating changes the protein state'],
    ['两种试剂，同看变性', 'Compare two denaturing agents'],
    ['加水后，凝聚物仍在', 'Aggregates remain after dilution'],
    ['铅盐使蛋白质凝聚', 'Lead salt causes aggregation'],
    ['先白色沉淀，后黄色', 'White precipitation, then yellow'],
    ['灼烧改变了物质组成', 'Burning changes composition'],
  ];
  const modeLabel = (v: string) =>
    ({
      salt: '(NH₄)₂SO₄',
      heat: say('加热', 'Heat'),
      silver: 'AgNO₃',
      ethanol: 'C₂H₅OH',
      lead: 'Pb(CH₃COO)₂',
      colour: 'HNO₃',
    })[v] ?? '';
  return (
    <section className="chem-protein">
      <div className="chem-protein-title">
        {film.watch ? say(labels[d.chapter][0], labels[d.chapter][1]) : modeLabel(view)}
      </div>
      {d.chapter < 3 || d.chapter === 5 ? (
        <>
          <PopulationVessel model={m} />
          <div className="chem-protein-reagent">
            {modeLabel(mode)}
            {d.addedWater > 0 ? ' + H₂O' : ''}
          </div>
          <div className="chem-protein-note">
            {mode === 'salt'
              ? say('同一批蛋白质，主要改变溶解状态', 'Same protein population; solubility changes')
              : say('肽链仍在，空间状态改变', 'Peptide chains remain; their conformation changes')}
          </div>
        </>
      ) : null}
      {d.chapter === 3 ? (
        <>
          <div className="chem-protein-pair">
            {(['silver', 'ethanol'] as ProteinTreatment[]).map((t) => (
              <div key={t}>
                <MacroTube model={proteinPopulation(t, d.exposure)} />
                <span>{modeLabel(t)}</span>
              </div>
            ))}
          </div>
          <div className="chem-protein-note">
            {say('鸡蛋清样品分别处理', 'Separate egg-white samples')}
          </div>
        </>
      ) : null}
      {d.chapter === 4 ? (
        <>
          <div className="chem-protein-three">
            {(['heat', 'silver', 'ethanol'] as ProteinTreatment[]).map((t) => (
              <div key={t}>
                <MacroTube model={proteinPopulation(t, 1, d.addedWater)} />
                <span>{modeLabel(t)}</span>
              </div>
            ))}
          </div>
          <div className="chem-protein-reagent">+ H₂O</div>
          <div className="chem-protein-note">
            {say('变稀，不等于复溶', 'Dilution is not redissolution')}
          </div>
        </>
      ) : null}
      {d.chapter === 6 ? (
        <>
          <ColourTube model={colour} />
          <div className="chem-protein-reagent">HNO₃, Δ</div>
          <div className="chem-protein-note">
            {say('与可反应的芳香族残基有关', 'Depends on reactive aromatic residues')}
          </div>
        </>
      ) : null}
      {d.chapter === 7 ? (
        <>
          <BurnFibres p={d.progress} />
          <div className="chem-protein-pair-label">
            <span>{say('头发', 'Hair')}</span>
            <span>{say('蚕丝', 'Silk')}</span>
          </div>
          <div className="chem-protein-note">
            {say('教材记录焦羽毛气味', 'The textbook records a burnt-feather odour')}
          </div>
        </>
      ) : null}
      {!film.watch ? (
        <div className="chem-protein-controls">
          <Segments
            label={say('处理', 'Treatment')}
            value={view}
            onChange={setView}
            options={['salt', 'heat', 'silver', 'ethanol', 'lead', 'colour'].map((v) => ({
              value: v,
              label: modeLabel(v),
            }))}
          />
          <Range
            label={say('处理进度', 'Treatment progress')}
            value={exposure}
            onChange={setExposure}
            min={0}
            max={1}
            step={0.01}
          />
          {view === 'colour' ? (
            <Range
              label={say('可显色位点示意比例', 'Reactive aromatic-site fraction')}
              value={reactive}
              onChange={setReactive}
              min={0}
              max={1}
              step={0.05}
            />
          ) : (
            <>
              <Range
                label={say('加入水的示意体积', 'Added water model volume')}
                value={water}
                onChange={setWater}
                min={0}
                max={4}
                step={0.1}
              />
              <div>
                {say('析出或凝聚份额', 'Precipitated or aggregated')}:{' '}
                {(100 * m.precipitatedFraction).toFixed(0)}%<br />
                {say('蛋白质总量', 'Total protein')}: {m.total.toFixed(1)}{' '}
                {say('示意份', 'model unit')}
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
function PopulationVessel({ model: m }: { model: ReturnType<typeof proteinPopulation> }) {
  const level = 113 - 11 * (m.volume - 1);
  return (
    <svg
      className="chem-protein-svg"
      viewBox="0 0 320 245"
      role="img"
      aria-label="The same eight symbolic protein chains remain present. Salt aggregation preserves folded symbols; denaturation unfolds and aggregates them. Added water dilutes without removing protein."
    >
      <path
        d="M31 38V208Q31 226 49 226H271Q289 226 289 208V38"
        fill="#f4f3e9"
        stroke="#bbc2ac"
        strokeWidth="2"
      />
      <path
        d={`M34 ${level}H286V208Q286 223 271 223H49Q34 223 34 208Z`}
        fill="#e3e8d5"
        opacity=".8"
      />
      {Array.from({ length: 8 }, (_, i) => {
        const a = proteinSymbol(i, m.precipitatedFraction, m.unfoldedFraction),
          path = a.points.map(([x, y], j) => `${j ? 'L' : 'M'}${x} ${y}`).join(' ');
        return (
          <g key={i}>
            <path
              d={path}
              fill="none"
              stroke="#fdfcf1"
              strokeWidth={6 + 4 * a.aggregated}
              opacity=".8"
              strokeLinecap="round"
            />
            <path
              d={path}
              fill="none"
              stroke={m.unfoldedFraction > 0.2 ? '#baa88c' : '#aeb999'}
              strokeWidth="2.2"
              opacity={0.85 - 0.2 * a.aggregated}
              strokeLinecap="round"
            />
          </g>
        );
      })}
      {m.treatment === 'heat' ? (
        <text x="160" y="29" textAnchor="middle" fontSize="24" fill="#8b856b">
          Δ
        </text>
      ) : (
        <path
          d="M152 3H168V20L162 34H158L152 20Z"
          fill="#e6ecd9"
          stroke="#b8c2a8"
          strokeWidth="2"
        />
      )}
      <text x="160" y="242" textAnchor="middle" fontSize="20" fill="#a6ad94">
        {browserLocale() === 'en' ? 'Protein-chain schematic' : '蛋白质链示意'}
      </text>
    </svg>
  );
}
function MacroTube({ model: m }: { model: ReturnType<typeof proteinPopulation> }) {
  const clip = useId();
  const level = 98 - 9 * (m.volume - 1);
  return (
    <svg
      viewBox="0 0 100 210"
      role="img"
      aria-label="Egg-white solution retains visible aggregates after the selected treatment and dilution."
    >
      <defs>
        <clipPath id={clip}>
          <path d="M19 18V164Q19 196 50 196T81 164V18Z" />
        </clipPath>
      </defs>
      <path
        d="M16 18V164Q16 199 50 199T84 164V18"
        fill="#f1f3e7"
        stroke="#b9c1a9"
        strokeWidth="1.7"
      />
      <path d={`M19 ${level}H81V164Q81 196 50 196T19 164Z`} fill="#dce5cd" />
      <g clipPath={`url(#${clip})`}>
        {Array.from({ length: 7 }, (_, i) => (
          <path
            key={i}
            d={`M${28 + (i % 3) * 20} ${128 + Math.floor(i / 3) * 23}q-13-10-17 3t18 8q14 5 10-6t-11-5`}
            fill="#fcfaf0"
            stroke="#eeeadd"
            opacity={m.precipitatedFraction}
          />
        ))}
      </g>
    </svg>
  );
}
function ColourTube({ model: m }: { model: ReturnType<typeof proteinColour> }) {
  return (
    <svg
      className="chem-protein-svg"
      viewBox="0 0 320 245"
      role="img"
      aria-label="Nitric acid first precipitates protein; heating produces yellow colour as reactive aromatic sites are modified."
    >
      <path
        d="M124 26V180Q124 221 160 221T196 180V26"
        fill="#f4f3e7"
        stroke="#b8c1a8"
        strokeWidth="2"
      />
      <path d="M127 118H193V180Q193 218 160 218T127 180Z" fill="#dfe5d2" />
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={`M${143 + (i % 2) * 30} ${140 + Math.floor(i / 2) * 18}q-12-9-15 3t18 8q12 4 7-6t-10-5`}
          fill={`rgb(${248 - 13 * m.yellowFraction},${246 - 27 * m.yellowFraction},${231 - 89 * m.yellowFraction})`}
          opacity={m.whitePrecipitate}
        />
      ))}
      <path
        d="M223 15V221M208 221H239M223 63H198q-7 7 0 13H223"
        stroke="#aab99d"
        strokeWidth="2"
        fill="none"
      />
      <path d="M76 227H245" stroke="#c6c9b6" />
      <text x="160" y="244" fontSize="20" textAnchor="middle" fill="#b1a684">
        Δ
      </text>
    </svg>
  );
}
function BurnFibres({ p }: { p: number }) {
  return (
    <svg
      className="chem-protein-svg"
      viewBox="0 0 320 250"
      role="img"
      aria-label="Separate hair and silk fibres curl, darken and decompose on burning; smell is documented in the textbook rather than reproduced by the screen."
    >
      {[80, 240].map((x, i) => (
        <g key={i}>
          <path
            d={`M${x - 45} 46L${x - 10} 79M${x - 41} 40L${x - 7} 73`}
            stroke="#abb49b"
            strokeWidth="3"
          />
          <path
            d={
              i === 0
                ? `M${x - 9} 76q${22 - 15 * p} 17 ${10 + 15 * p} 33t${-19 * p} ${28 - 15 * p}`
                : `M${x - 9} 76q25 8 30 27l-26 25q-18-28-4-52Z`
            }
            fill={i === 0 ? 'none' : `rgb(${211 - 95 * p},${203 - 89 * p},${176 - 73 * p})`}
            stroke={`rgb(${157 - 59 * p},${145 - 50 * p},${116 - 24 * p})`}
            strokeWidth={i === 0 ? 3 : 2}
          />
          <path d={`M${x} 165q-22-20 1-54-3 19 12 28 10 20-13 26Z`} fill="#bac6bd" opacity=".75" />
          <path d={`M${x - 16} 191q-8 16 0 24h32q8-8 0-24Z`} fill="#d9caa4" />
          <path d={`M${x} 191V164`} stroke="#a69e80" strokeWidth="4" />
          {p > 0.25 ? (
            <path
              d={`M${x + 17} 113q-18-16-6-30t-6-30`}
              stroke="#b8bcae"
              strokeWidth="2"
              fill="none"
              opacity={p * 0.6}
            />
          ) : null}
        </g>
      ))}
    </svg>
  );
}
