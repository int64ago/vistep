import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Segments, Range } from '../lab/Controls';
import {
  proteinPopulation,
  proteinColour,
  proteinNitration,
  proteinSiteCounts,
  proteinBurnAccount,
  type ProteinColourSample,
  type AromaticResidue,
  proteinDirector,
  proteinMeasuredDirector,
  proteinSymbol,
  type ProteinTreatment,
} from '../../models/chem-protein-states';
import '../../styles/chem-protein-states.css';
type ProteinState = {
  chapter: number;
  progress: number;
  exposure: number;
  water: number;
  treatment: ProteinTreatment;
  sample: ProteinColourSample;
  residue: AromaticResidue;
  acid: boolean;
  warmed: boolean;
};
export default function ChemProteinStates() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const authored = (): ProteinState => {
    const d = proteinMeasuredDirector(film.chapter, film.chapterProgress, film.chapterTime, en);
    return {
      chapter: d.chapter,
      progress: d.progress,
      exposure: d.exposure,
      water: d.addedWater,
      treatment: d.chapter < 2 ? 'salt' : d.chapter === 5 ? 'lead' : 'heat',
      sample: 'many',
      residue: 'tyrosine',
      acid: true,
      warmed: true,
    };
  };
  const [manual, setManual] = useState<ProteinState | null>(null),
    [wasWatching, setWasWatching] = useState(film.watch);
  // Capture the first unedited Explore state as well as later edits. Watch/replay
  // has its own director and must never overwrite this saved experiment.
  if (wasWatching !== film.watch) {
    setWasWatching(film.watch);
    if (!film.watch && manual === null) setManual(authored());
  }
  const s = film.watch ? authored() : (manual ?? authored()),
    update = (patch: Partial<ProteinState>) => setManual({ ...s, ...patch }),
    m = proteinPopulation(s.treatment, s.exposure, s.water),
    n = proteinNitration(s.progress, s.sample, s.residue, s.acid, s.warmed);
  const labels = [
    ['盐浓度升高，蛋白质析出', 'High salt precipitates protein'],
    ['加水后重新分散', 'Water restores dispersion'],
    ['加热改变空间状态', 'Heat changes conformation'],
    ['相似浑浊，不同作用', 'Similar cloudiness, different causes'],
    ['变稀，不等于复溶', 'Dilution is not redissolution'],
    ['肽链还在，空间状态变了', 'Same chains, new shape'],
    [
      n.shot === 'precipitate'
        ? '先析出，再追问黄色'
        : n.shot === 'site'
          ? '黄色来自哪个位点？'
          : n.shot === 'compare'
            ? '等量蛋白质，会一样黄吗？'
            : '有苯环，就一定明显显色吗？',
      n.shot === 'precipitate'
        ? 'Precipitation comes first'
        : n.shot === 'site'
          ? 'Which site makes the colour?'
          : n.shot === 'compare'
            ? 'Equal protein, equal yellow?'
            : 'Every ring turns yellow?',
    ],
    ['灼烧改变了化学组成', 'Burning changes composition'],
  ];
  const modeLabel = (v: string) =>
    ({
      salt: '(NH₄)₂SO₄',
      heat: say('加热', 'Heat'),
      silver: 'AgNO₃',
      ethanol: 'C₂H₅OH',
      lead: 'Pb(CH₃COO)₂',
      colour: say('硝酸显色', 'Nitric-acid colour'),
      burn: say('灼烧', 'Burning'),
    })[v] ?? '';
  const view = s.chapter === 6 ? 'colour' : s.chapter === 7 ? 'burn' : s.treatment;
  return (
    <section
      className="chem-protein"
      data-protein-chapter={s.chapter}
      data-protein-progress={s.progress}
      data-protein-state={JSON.stringify(s)}
      data-protein-shot={s.chapter === 6 ? n.shot : 'population'}
    >
      <div className="chem-protein-title">{say(...(labels[s.chapter] as [string, string]))}</div>
      {s.chapter < 3 || s.chapter === 5 ? (
        <>
          <PopulationVessel model={m} />
          <div className="chem-protein-reagent">
            {modeLabel(s.treatment)}
            {s.water > 0 ? ' + H₂O' : ''}
          </div>
          <div className="chem-protein-note">
            {s.treatment === 'salt'
              ? say('同一批链，改变溶解状态', 'Same chains; changed solubility')
              : s.water > 0
                ? say('加水变稀，凝聚物仍在', 'Water dilutes; aggregates remain')
                : say('连续肽链，展开并聚集', 'Chains unfold and cluster')}
          </div>
        </>
      ) : null}
      {s.chapter === 3 ? (
        <>
          <div className="chem-protein-pair">
            {(['silver', 'ethanol'] as ProteinTreatment[]).map((t) => (
              <div key={t}>
                <MacroTube model={proteinPopulation(t, s.exposure, s.water)} />
                <span>{modeLabel(t)}</span>
              </div>
            ))}
          </div>
          <div className="chem-protein-note">
            {say('金属离子相互作用 · 溶剂环境改变', 'Ion interactions · changed solvent')}
          </div>
        </>
      ) : null}
      {s.chapter === 4 ? (
        <>
          <div className="chem-protein-three">
            {(['heat', 'silver', 'ethanol'] as ProteinTreatment[]).map((t) => (
              <div key={t}>
                <MacroTube model={proteinPopulation(t, 1, s.water)} />
                <span>{modeLabel(t)}</span>
              </div>
            ))}
          </div>
          <div className="chem-protein-reagent">+ H₂O</div>
          <div className="chem-protein-note">
            {say('这些处理条件下，凝聚物保留', 'Aggregates persist in these conditions')}
          </div>
        </>
      ) : null}
      {s.chapter === 6 ? <ColourMechanism state={s} model={n} /> : null}
      {s.chapter === 7 ? (
        <>
          {s.progress < 0.58 ? (
            <>
              <BurnFibres p={s.progress / 0.58} />
              <div className="chem-protein-pair-label">
                <span>{say('头发', 'Hair')}</span>
                <span>{say('蚕丝', 'Silk')}</span>
              </div>
            </>
          ) : (
            <BurnComposition progress={(s.progress - 0.58) / 0.42} />
          )}
          <div className="chem-protein-note">
            {say('热分解产生新物质；气味为教材记录', 'Textbook evidence: burnt-feather odour')}
          </div>
        </>
      ) : null}
      {!film.watch ? (
        <div className="chem-protein-controls">
          <div>
            <div className="chem-protein-control-label">
              {say('比较哪种变化', 'Choose a change')}
            </div>
            <Segments
              label={say('比较哪种变化', 'Choose a change')}
              value={view}
              onChange={(v) =>
                update({
                  chapter:
                    v === 'colour' ? 6 : v === 'burn' ? 7 : v === 'salt' ? 1 : v === 'lead' ? 5 : 2,
                  treatment: v === 'colour' || v === 'burn' ? 'heat' : (v as ProteinTreatment),
                })
              }
              options={['salt', 'heat', 'silver', 'ethanol', 'lead', 'colour', 'burn'].map((v) => ({
                value: v,
                label: modeLabel(v),
              }))}
            />
          </div>
          <Range
            label={say('过程进度', 'Process progress')}
            value={s.progress}
            onChange={(p) => {
              const next = proteinDirector(s.chapter, p);
              update({
                progress: p,
                exposure: next.exposure,
                water: [1, 4, 5].includes(s.chapter) ? next.addedWater : s.water,
              });
            }}
            min={0}
            max={1}
            step={0.01}
          />
          {s.chapter === 6 ? (
            <>
              <div>
                <div className="chem-protein-control-label">
                  {say('等量模型蛋白的可反应位点', 'Reactive sites in equal model protein')}
                </div>
                <Segments
                  label={say('等量模型蛋白的可反应位点', 'Reactive sites in equal model protein')}
                  value={s.sample}
                  onChange={(sample) => update({ sample })}
                  options={(['many', 'few', 'none'] as const).map((v, i) => ({
                    value: v,
                    label: say(['多', '少', '无'][i], ['Many', 'Few', 'None'][i]),
                  }))}
                />
              </div>
              <div>
                <div className="chem-protein-control-label">
                  {say('放大哪种侧链', 'Enlarged side chain')}
                </div>
                <Segments
                  label={say('放大哪种侧链', 'Enlarged side chain')}
                  value={s.residue}
                  onChange={(residue) => update({ residue })}
                  options={[
                    { value: 'tyrosine', label: say('酪氨酸', 'Tyrosine') },
                    { value: 'phenylalanine', label: say('苯丙氨酸', 'Phenylalanine') },
                  ]}
                />
              </div>
              {(['acid', 'warmed'] as const).map((key) => (
                <div key={key}>
                  <div className="chem-protein-control-label">
                    {key === 'acid'
                      ? say('浓硝酸', 'Concentrated nitric acid')
                      : say('加热条件', 'Warming condition')}
                  </div>
                  <Segments
                    label={
                      key === 'acid'
                        ? say('浓硝酸', 'Concentrated nitric acid')
                        : say('加热条件', 'Warming condition')
                    }
                    value={s[key] ? 'yes' : 'no'}
                    onChange={(v) => update({ [key]: v === 'yes' })}
                    options={[
                      { value: 'yes', label: say('有', 'Present') },
                      { value: 'no', label: say('无', 'None') },
                    ]}
                  />
                </div>
              ))}
              <div data-reacted-site-account={n.reacted}>
                {say('所选模型已反应位点', 'Reacted sites in selected model')}:{' '}
                {n.reacted.toFixed(2)} / {n.sites}
              </div>
              <p className="chem-protein-model-limit">
                {say(
                  '同量示意样品；未加热时不预测慢反应。颜色不是吸光度。',
                  'Equal illustrative samples; unheated slow reactions are not predicted. Colour is not absorbance.',
                )}
              </p>
            </>
          ) : s.chapter !== 7 ? (
            <>
              <Range
                label={say('加入水的示意体积', 'Added water model volume')}
                value={s.water}
                onChange={(water) => update({ water })}
                min={0}
                max={4}
                step={0.1}
              />
              <div>
                {say('析出或凝聚份额', 'Precipitated or aggregated')}:{' '}
                {(m.precipitatedFraction * 100).toFixed(0)}%<br />
                {say('蛋白质总量', 'Total protein')}: {m.total.toFixed(1)}{' '}
                {say('示意份', 'model unit')}
              </div>
            </>
          ) : null}
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
      viewBox="0 30 320 215"
      role="img"
      aria-label="The same eight symbolic protein chains remain present. Salt aggregation preserves folded symbols; denaturation unfolds and aggregates them. Added water dilutes without removing protein."
    >
      <path
        d="M31 38V198Q31 216 49 216H271Q289 216 289 198V38"
        fill="#f4f3e9"
        stroke="#bbc2ac"
        strokeWidth="2"
      />
      <path
        d={`M34 ${level}H286V198Q286 213 271 213H49Q34 213 34 198Z`}
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
      <text x="160" y="236" textAnchor="middle" fontSize="20" fill="#a6ad94">
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
      <text x="160" y="235" fontSize="20" textAnchor="middle" fill="#b1a684">
        Δ
      </text>
    </svg>
  );
}
function BurnFibres({ p }: { p: number }) {
  return (
    <svg
      className="chem-protein-svg"
      viewBox="0 30 320 210"
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

function ColourMechanism({
  state: s,
  model: n,
}: {
  state: ProteinState;
  model: ReturnType<typeof proteinNitration>;
}) {
  const en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  return (
    <div
      className="chem-protein-colour"
      data-colour-extent={n.extent}
      data-colour-sites={n.sites}
      data-colour-yellow={n.yellowFraction}
    >
      {n.shot === 'precipitate' ? (
        <>
          <ColourTube
            model={{ ...proteinColour(0), whitePrecipitate: n.whitePrecipitate, yellowFraction: 0 }}
          />
          <div className="chem-protein-note">
            {say('白色：析出。还不是黄色产物。', 'White comes before yellow')}
          </div>
        </>
      ) : n.shot === 'site' ? (
        <>
          <AromaticSite model={n} />
          <div className="chem-protein-note">
            {n.sites === 0
              ? say('该样品没有此类可反应位点', 'This sample has no such reactive sites')
              : s.residue === 'phenylalanine'
                ? say(
                    '缺少酚羟基，通常检验中不明显显色',
                    'Without phenolic OH, the usual test is weak',
                  )
                : n.extent < 0.01
                  ? say('酪氨酸侧链：酚羟基旁的环上 H', 'Tyrosine: ring H next to OH')
                  : n.extent < 1
                    ? say('追踪同一环：H 离开，NO₂ 接入', 'Ring H is replaced by NO₂')
                    : say('硝化后的芳香侧链参与黄色显现', 'Nitrated sites contribute yellow')}
          </div>
        </>
      ) : n.shot === 'compare' ? (
        <>
          <div className="chem-protein-sample-caption">
            {say('等量模型样品 · 相同条件', 'Equal model samples')}
          </div>
          <div className="chem-protein-samples">
            {(['many', 'few', 'none'] as const).map((sample, i) => {
              const m = proteinNitration(s.progress, sample, s.residue, s.acid, s.warmed);
              return (
                <div
                  className="chem-protein-sample"
                  key={sample}
                  data-sample={sample}
                  data-sites={m.sites}
                  data-yellow={m.yellowFraction}
                >
                  <span>
                    {String.fromCharCode(65 + i)} · {proteinSiteCounts[sample]}{' '}
                    {say('个位点', m.sites === 1 ? 'site' : 'sites')}
                  </span>
                  <svg
                    viewBox="0 0 180 58"
                    aria-label={say(
                      '同量链中的位点示意',
                      'Illustrative sites in an equal amount of chain',
                    )}
                  >
                    <path
                      d="M8 30Q32 0 55 30T101 30T147 30L165 30"
                      stroke="#a8b5a0"
                      strokeWidth="3"
                      fill="none"
                    />
                    {[32, 78, 124].map((x, j) => (
                      <circle
                        key={j}
                        cx={x}
                        cy={j % 2 ? 42 : 16}
                        r="8"
                        fill={
                          j < m.sites
                            ? `rgb(226,${211 - 28 * m.extent},${164 - 83 * m.extent})`
                            : '#d6ded0'
                        }
                        stroke={j < m.sites ? '#a48b40' : '#acbba8'}
                        strokeWidth="1.5"
                      />
                    ))}
                  </svg>
                  <div
                    className="chem-protein-colour-swatch"
                    style={{
                      background: `rgb(${247 - 12 * m.yellowFraction},${246 - 21 * m.yellowFraction},${232 - 111 * m.yellowFraction})`,
                    }}
                    aria-label={say('颜色示意', 'Illustrative colour')}
                  />
                </div>
              );
            })}
          </div>
          <div className="chem-protein-note">
            {say(
              '位点少，可以弱显色；蛋白质仍在',
              'Fewer sites can mean less colour; protein remains',
            )}
          </div>
        </>
      ) : (
        <>
          <div className="chem-protein-boundary">
            {(['tyrosine', 'phenylalanine'] as const).map((residue) => (
              <div key={residue}>
                <span>
                  {residue === 'tyrosine'
                    ? say('酪氨酸', 'Tyrosine')
                    : say('苯丙氨酸', 'Phenylalanine')}
                </span>
                <AromaticBoundary residue={residue} active={s.acid && s.warmed} />
                <span>
                  {!s.acid || !s.warmed
                    ? say('条件不足', 'Conditions absent')
                    : residue === 'tyrosine'
                      ? say('通常显色', 'Positive')
                      : say('通常弱响应', 'Weak')}
                </span>
              </div>
            ))}
          </div>
          <div className="chem-protein-note">
            {say('色氨酸也可参与显色', 'Tryptophan also responds')}
          </div>
        </>
      )}
      <div className="chem-protein-condition">
        {s.acid ? 'HNO₃' : say('未加硝酸', 'No nitric acid')} ·{' '}
        {s.warmed ? 'Δ' : say('未加热', 'Unheated')}
      </div>
    </div>
  );
}
function AromaticSite({ model: m }: { model: ReturnType<typeof proteinNitration> }) {
  const en = browserLocale() === 'en',
    present = m.sites > 0,
    e = present ? m.extent : 0;
  const points = m.ring.map((a) => `${a.x},${a.y}`).join(' '),
    c = m.ring[1];
  return (
    <svg
      className="chem-protein-site"
      viewBox="0 0 320 238"
      role="img"
      aria-label={
        en
          ? `${m.residue === 'tyrosine' ? 'Tyrosine side chain with a phenolic hydroxyl.' : 'Phenylalanine side chain without a phenolic hydroxyl.'} ${!present ? 'No such reactive site is present in the selected sample; the reference drawing is faded.' : e === 0 ? 'The ring hydrogen remains; no nitro substitution is shown under the current conditions and progress.' : e < 1 ? 'Net substitution is in progress: the ring hydrogen leaves and a nitro group approaches.' : 'An ortho ring hydrogen has been replaced by a nitro group.'} The ring and chain connection remain. Net correspondence, not an elementary reaction.`
          : `${m.residue === 'tyrosine' ? '带酚羟基的酪氨酸侧链。' : '不带酚羟基的苯丙氨酸侧链。'}${!present ? '所选样品没有此类可反应位点，参考结构淡化显示。' : e === 0 ? '当前条件与进度下，芳环氢保留，尚无硝基取代。' : e < 1 ? '净取代正在进行：芳环氢离开，硝基接近。' : '酚羟基邻位的芳环氢已被硝基取代。'}芳环与肽链连接保留。净对应，不是一步微观反应。`
      }
    >
      <g opacity={present ? 1 : 0.25} data-aromatic-present={present}>
        <polygon
          points={points}
          fill={`rgba(228,195,80,${e * 0.28})`}
          stroke="#7c8d76"
          strokeWidth="2.5"
        />
        <circle cx="145" cy="108" r="28" fill="none" stroke="#9ba68e" strokeWidth="1.8" />
        {m.ring.map((a) => (
          <circle key={a.id} data-atom-id={a.id} cx={a.x} cy={a.y} r="3.2" fill="#7c8d76" />
        ))}
        <path d="M145 60V43M145 156V172M145 198V214" stroke="#7c8d76" strokeWidth="2" />
        <text x="145" y="35" textAnchor="middle" fontSize="22" fill="#596e59">
          {m.residue === 'tyrosine' ? 'OH' : 'H'}
        </text>
        <text x="145" y="191" textAnchor="middle" fontSize="21" fill="#687c65">
          CH₂
        </text>
        <path
          d="M36 219Q68 201 92 220T145 219T195 220T250 219"
          stroke="#9aac90"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <line
          x1={c.x}
          y1={c.y}
          x2={m.aromaticHydrogen.x - 8}
          y2={m.aromaticHydrogen.y + 4}
          stroke="#a69d7e"
          strokeWidth="2"
          opacity={Math.max(0, 1 - 4 * e)}
        />
        <text
          data-atom-id={m.aromaticHydrogen.id}
          x={m.aromaticHydrogen.x}
          y={m.aromaticHydrogen.y + 7}
          textAnchor="middle"
          fontSize="22"
          fill="#8b7955"
        >
          H
        </text>
        <line
          x1={c.x}
          y1={c.y}
          x2={m.nitro.x - 23}
          y2={m.nitro.y + 8}
          stroke="#b08c35"
          strokeWidth="2.5"
          opacity={Math.max(0, (e - 0.75) * 4)}
        />
        <text
          data-atom-id={m.nitro.id}
          x={m.nitro.x}
          y={m.nitro.y + 8}
          textAnchor="middle"
          fontSize="22"
          fill="#a18331"
          opacity={e}
        >
          NO₂
        </text>
        {e > 0.98 ? (
          <text x="267" y="206" textAnchor="middle" fontSize="20" fill="#8b7955">
            → H₂O
          </text>
        ) : null}
        <circle
          cx={c.x}
          cy={c.y}
          r="10"
          fill="none"
          stroke="#c0a254"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </g>
    </svg>
  );
}
function AromaticBoundary({ residue, active }: { residue: AromaticResidue; active: boolean }) {
  const tyr = residue === 'tyrosine',
    yellow = tyr && active,
    en = browserLocale() === 'en';
  return (
    <svg
      viewBox="0 0 160 174"
      role="img"
      aria-label={
        !active
          ? en
            ? 'Required acid or warming condition absent; no nitro group is shown.'
            : '缺少所选酸或加热条件，未显示硝基取代。'
          : tyr
            ? en
              ? 'Tyrosine phenolic ring with an ortho nitro group under the test conditions.'
              : '检验条件下，酪氨酸酚羟基邻位带有硝基。'
            : en
              ? 'Phenylalanine has no phenolic hydroxyl group; the usual qualitative colour test is weak.'
              : '苯丙氨酸没有酚羟基，通常显色检验中响应较弱。'
      }
    >
      <path
        d="M65 48L100 68V108L65 128L30 108V68Z"
        fill={yellow ? '#e7d99b' : '#eef0e4'}
        stroke="#849478"
        strokeWidth="2"
      />
      <circle cx="65" cy="88" r="23" stroke="#a9b08f" strokeWidth="1.5" fill="none" />
      <path d="M65 48V31M65 128V145" stroke="#849478" strokeWidth="2" />
      <text x="65" y="25" textAnchor="middle" fontSize="22" fill="#60765b">
        {tyr ? 'OH' : 'H'}
      </text>
      <text x="65" y="166" textAnchor="middle" fontSize="22" fill="#60765b">
        CH₂–
      </text>
      {yellow ? (
        <>
          <path d="M100 68L114 56" stroke="#a88d3e" strokeWidth="2" />
          <text x="136" y="51" textAnchor="middle" fontSize="20" fill="#9c8138">
            NO₂
          </text>
        </>
      ) : null}
    </svg>
  );
}
function BurnComposition({ progress }: { progress: number }) {
  const m = proteinBurnAccount(progress),
    en = browserLocale() === 'en';
  return (
    <div className="chem-protein-composition" data-converted={m.converted}>
      <svg
        viewBox="0 0 320 210"
        role="img"
        aria-label={
          en
            ? 'A continuous chain separates into symbolic altered residue and volatile products; material is retained, but molecular identity changes.'
            : '连续链分成已改变的残留物和挥发产物符号；物质不凭空消失，但分子组成改变。'
        }
      >
        {Array.from({ length: 8 }, (_, i) => {
          const x = 45 + i * 32,
            y = 103 + Math.sin(i * 1.5) * 17;
          const tx = i < 4 ? 70 + i * 25 : 70 + (i - 4) * 50,
            ty = i < 4 ? 172 : 35;
          const nx = x + (tx - x) * m.converted,
            ny = y + (ty - y) * m.converted;
          return (
            <g key={i} data-material-piece={i}>
              {i < 7 ? (
                <path
                  d={`M${x} ${y}L${x + 32} ${103 + Math.sin((i + 1) * 1.5) * 17}`}
                  opacity={1 - m.converted}
                  stroke="#9aad8e"
                  strokeWidth="4"
                />
              ) : null}
              <circle
                cx={nx}
                cy={ny}
                r={8}
                fill={m.converted > 0.6 ? (i < 4 ? '#8c8875' : '#bbc0ae') : '#a8b898'}
              />
            </g>
          );
        })}
      </svg>
      <div className="chem-protein-composition-labels">
        <span>{en ? 'Volatile products' : '挥发产物'}</span>
        <span>{en ? 'Altered residue' : '已改变的残留物'}</span>
      </div>
    </div>
  );
}
