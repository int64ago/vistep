import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  cytochromeDifferences,
  selectionYears,
  limbBones,
  diskCenters,
  discSelection,
  inhibitionRadius,
  isolatedPopulations,
  geneFlow,
  concentration,
  alleleAccounting,
  mothRepresentatives,
  cloneTransfer,
  reunionFamily,
  evolutionDirector,
  limbComparison,
  type Limb,
} from '../../models/bio-evolution-evidence';
import '../../styles/bio-evolution-evidence.css';
const modes = [
  'fossil',
  'anatomy',
  'embryo',
  'molecular',
  'moths',
  'frequency',
  'discs',
  'selection',
  'barrier',
  'reunion',
] as const;
type Mode = (typeof modes)[number];
const names = [
  '化石的组合特征',
  '前肢的同源结构',
  '胚胎中的咽部与尾部',
  '分子差异的比较',
  '环境改变选择条件',
  '由基因型算基因频率',
  '纸片与抑菌圈对照',
  '跟踪被选择的克隆',
  '地理屏障与基因交流',
  '重遇后是否产生可育后代',
];
const boneColors = ['#c1a25e', '#b48c9d', '#8d94ac', '#b59c73', '#9e7477', '#648da0'];
const boneNames = ['肱骨', '桡骨', '尺骨', '腕骨', '掌骨', '指骨'];
function Fossil({ p }: { p: number }) {
  return (
    <div className="bee16-fossil">
      <svg viewBox="0 0 370 265" role="img" aria-label={t('近鸟龙的骨架与前后肢羽毛位置示意')}>
        <path
          d="M28 22L319 12L351 43L343 236L286 251L33 239L12 198Z"
          fill="#ddd4c0"
          stroke="#b6aa90"
          strokeWidth="2"
        />
        {Array.from({ length: 27 }, (_, i) => (
          <path
            key={i}
            d={`M${20 + ((i * 73) % 310)} ${20 + ((i * 41) % 220)}l${20 + (i % 5) * 5} -3`}
            stroke="#c7bba4"
            strokeWidth="1"
          />
        ))}
        <g
          opacity={p < 0.18 || p > 0.72 ? 1 : p < 0.46 ? 1 : 0.32}
          stroke="#8d8069"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M92 60Q112 58 117 78L135 92L161 106L184 119Q228 144 280 134L333 115" />
          <path d="M134 93L118 126L64 138L46 157M64 138L42 151M64 138L49 168" />
          <path d="M183 118L212 148L201 197L231 219M201 197L218 221M201 197L243 213" />
          <path d="M132 95Q125 134 176 142Q195 129 179 117" />
          <path d="M145 101Q135 123 165 133M156 108Q148 125 178 132" />
        </g>
        <path
          d="M95 47Q69 43 56 59L83 69L102 62Z"
          fill="#c7b79a"
          stroke="#8d8069"
          strokeWidth="3"
        />
        <circle cx="82" cy="56" r="3" fill="#7f745e" />
        <g stroke="#ad9d80" strokeWidth="1.8" opacity={p < 0.46 ? 0.3 : 1}>
          {Array.from({ length: 13 }, (_, i) => (
            <g key={i}>
              <path
                d={`M${63 + i * 4.2} ${138 - i * 0.9}Q${47 + i * 3.5} ${161 + i * 0.6} ${28 + i * 5.5} ${177 + i * 2}`}
                fill="none"
              />
              <path
                d={`M${211 - i * 0.8} ${151 + i * 3.4}Q${180 - i * 1.2} ${158 + i * 4.4} ${161 - i * 0.3} ${171 + i * 4.1}`}
                fill="none"
              />
            </g>
          ))}
        </g>
        <g fill="#8c715d" opacity={ramp(p, 0.45, 0.9)}>
          <circle cx="76" cy="147" r="5" />
          <circle cx="202" cy="180" r="5" />
        </g>
      </svg>
      <div className="bee16-evidence-id">LPM-B00169 · {t('同一件化石')}</div>
      <p className="bee16-note">
        {t(p < 0.46 ? '骨架与羽毛，是否能同时出现？' : '同一件标本：骨骼与羽毛的组合。')}
      </p>
      <span className="bee16-qualifier">{t('位置示意，非原始照片')}</span>
    </div>
  );
}
function Anatomy({
  species,
  highlight,
  revealed,
}: {
  species: Limb;
  highlight: number;
  revealed: boolean;
}) {
  const observation = limbComparison(species, revealed);
  return (
    <div
      className="bee16-anatomy"
      data-observation={observation.observed ? 'revealed' : 'concealed'}
    >
      <div className="bee16-limbs">
        {(['human', species] as Limb[]).map((sp, i) => (
          <div key={`${sp}-${i}`}>
            <svg
              viewBox="25 0 190 270"
              role="img"
              aria-label={t(i && !revealed ? '暂不揭晓鲸的内部骨骼' : '同源前肢连接示意')}
            >
              {i && !revealed ? (
                <>
                  <path
                    d="M100 16Q46 65 61 145Q70 223 100 257Q145 224 151 143Q154 61 100 16Z"
                    fill="#ccd9d5"
                    stroke="#a3bcb6"
                  />
                  <text x="105" y="137" textAnchor="middle" fontSize="42" fill="#708e88">
                    ?
                  </text>
                </>
              ) : (
                limbBones(sp).map((b) => (
                  <g
                    key={b.id}
                    data-bone={b.id}
                    opacity={highlight < 0 || highlight === b.group ? 1 : 0.25}
                  >
                    <path
                      d={`M${b.a[0]} ${b.a[1]}L${b.b[0]} ${b.b[1]}`}
                      fill="none"
                      stroke={boneColors[b.group]}
                      strokeWidth={b.width}
                      strokeLinecap="round"
                    />
                    <circle cx={b.a[0]} cy={b.a[1]} r={b.width * 0.56} fill={boneColors[b.group]} />
                    <circle cx={b.b[0]} cy={b.b[1]} r={b.width * 0.56} fill={boneColors[b.group]} />
                  </g>
                ))
              )}
            </svg>
            <b>
              {t({ human: '人的上肢', bat: '蝙蝠的翼', whale: '鲸类的鳍', cat: '猫的前肢' }[sp])}
            </b>
          </div>
        ))}
      </div>
      <p className="bee16-note">
        {t(
          !revealed ? '先预测：鳍里会保留哪些连接？' : '功能不同，一骨—两骨—腕掌指的连接仍可对应。',
        )}
      </p>
      {!revealed ? (
        <span className="bee16-qualifier">{t('课堂遮盖，随后揭示教材观察')}</span>
      ) : (
        <div className="bee16-bone-key">
          {boneNames.map((n, i) => (
            <span key={n}>
              <i style={{ background: boneColors[i] }} />
              {t(n)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
function Embryo({ human, focus, tail }: { human: boolean; focus: boolean; tail: boolean }) {
  return (
    <svg
      viewBox="0 0 200 230"
      role="img"
      aria-label={t(human ? '人胚胎咽部结构和尾部示意' : '鱼胚胎咽部结构和尾部示意')}
    >
      <path
        d={
          human
            ? 'M116 31Q166 56 148 98Q130 117 136 142Q141 175 109 190Q87 202 94 214Q59 207 65 176Q37 157 42 119Q43 96 55 83Q47 48 80 29Q101 17 116 31Z'
            : 'M122 37Q164 53 153 91Q149 114 136 132Q129 156 150 182Q176 206 193 211Q154 218 123 192Q97 169 84 146Q64 123 65 100Q45 66 71 42Q99 25 122 37Z'
        }
        fill="#dfbfad"
        stroke="#b48e81"
        strokeWidth="2"
      />
      <path
        d={
          human
            ? 'M111 43Q140 64 126 96Q95 125 115 158Q115 174 92 181'
            : 'M115 47Q137 66 123 97Q105 136 135 174L174 202'
        }
        fill="none"
        stroke="#bc9688"
        strokeWidth="5"
      />
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          d={human ? `M${74 - i * 0.7} ${111 + i * 8}l19 5` : `M${93 + i * 6} ${115 + i * 9}l12 -9`}
          stroke="#c4a18c"
          strokeWidth="2"
        />
      ))}
      <circle cx={human ? 84 : 91} cy="65" r="10" fill="#ba9c94" />
      <circle cx={human ? 84 : 91} cy="65" r="5" fill="#857479" />
      <g stroke={focus ? '#9a695c' : '#c69e87'} strokeWidth={focus ? 5 : 3} fill="none">
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${91 + i * 6} ${85 + i * 9}q-23 3 -22 14`} />
        ))}
      </g>
      {tail && (
        <path
          d={human ? 'M104 185Q83 201 94 214' : 'M136 177Q165 205 193 211'}
          fill="none"
          stroke="#688c7b"
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      {human && (
        <>
          <path d="M63 137Q38 136 47 154L65 155" fill="#d7b49e" stroke="#b48e81" />
          <path d="M103 177Q94 200 82 190L85 178" fill="#d7b49e" stroke="#b48e81" />
        </>
      )}
    </svg>
  );
}
function Embryos({ p }: { p: number }) {
  return (
    <div className="bee16-embryos">
      <div>
        <Embryo human={true} focus={p < 0.55} tail={p >= 0.35} />
        <b>{t('人胚胎')}</b>
      </div>
      <div>
        <Embryo human={false} focus={p < 0.55} tail={p >= 0.35} />
        <b>{t('鱼胚胎')}</b>
      </div>
      <p className="bee16-note">
        {t(
          p < 0.55 ? '比较咽弓与咽囊，并非能呼吸的鱼鳃。' : '同源区域支持共同历史；胚胎并不相同。',
        )}
      </p>
    </div>
  );
}
function Molecular({ page }: { page: number }) {
  const rows = cytochromeDifferences.slice(page * 4, page * 4 + 4);
  return (
    <div className="bee16-molecular">
      <b>{t('与人的细胞色素c差异数')}</b>
      <div className="bee16-scale">
        <span>0</span>
        <span>{t('氨基酸差异')} · 44</span>
      </div>
      {rows.map(([species, diff]) => (
        <div className="bee16-molecular-row" key={species}>
          <span>{t(species)}</span>
          <div>
            <i style={{ width: `${(diff / 44) * 100}%` }} />
          </div>
          <output>{diff}</output>
        </div>
      ))}
      <p className="bee16-note">
        {t(page === 0 ? '同一种蛋白，按同一把尺比较。' : '这是差异总数，不是分化年代表。')}
      </p>
      <span className="bee16-qualifier">
        {t('固定教材数据')} · {page + 1}/3
      </span>
    </div>
  );
}
function Moth({ x, y, dark }: { x: number; y: number; dark: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill={dark ? '#55534b' : '#c8ccbc'} />
          <circle cx="1" cy="2" r={dark ? 0.5 : 1.1} fill={dark ? '#737568' : '#747a6a'} />
          <path d="M4 6l2 -2" stroke={dark ? '#696c5f' : '#8b9180'} strokeWidth="1" />
        </pattern>
      </defs>
      <path
        d="M-3 -3Q-26 -29 -49 -15L-28 18Q-39 34 -14 33L0 10L14 33Q39 34 28 18L49 -15Q26 -29 3 -3Z"
        fill={`url(#${id})`}
        stroke={dark ? '#484d42' : '#9ea594'}
        strokeWidth="1.5"
      />
      <path
        d="M0 -10V27"
        stroke={dark ? '#484c42' : '#9da58f'}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M-1 -10L-10 -21M1 -10L10 -21" stroke="#626958" fill="none" />
    </g>
  );
}
function Moths({ dark, p }: { dark: boolean; p: number }) {
  const barkClip = useId().replace(/:/g, '');
  return (
    <div className="bee16-moths">
      <svg
        viewBox="0 0 350 250"
        role="img"
        aria-label={t('相同的SS、Ss、ss体色，在不同树皮背景中的可见度')}
      >
        <defs>
          <clipPath id={barkClip}>
            <rect x="10" y="10" width="330" height="215" rx="35" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${barkClip})`}>
          <rect
            x="10"
            y="10"
            width="330"
            height="215"
            rx="35"
            fill={dark ? '#69695c' : '#b7bfaa'}
          />
          {Array.from({ length: 15 }, (_, i) => (
            <path
              key={i}
              d={`M${28 + i * 22} 12Q${10 + i * 25} 101 ${28 + i * 22} 223`}
              stroke={dark ? '#4f5549' : '#9ca68e'}
              strokeWidth={3 + (i % 3)}
              fill="none"
            />
          ))}
          {!dark &&
            Array.from({ length: 17 }, (_, i) => (
              <ellipse
                key={i}
                cx={30 + ((i * 47) % 285)}
                cy={22 + ((i * 59) % 190)}
                rx="22"
                ry="12"
                fill="#cdd2c1"
                opacity=".75"
              />
            ))}
        </g>
        <g data-individual="M-SS">
          <Moth x={100} y={69} dark={true} />
        </g>
        <g data-individual="M-Ss">
          <Moth x={252} y={106} dark={true} />
        </g>
        <g data-individual="M-ss">
          <Moth x={132} y={168} dark={false} />
        </g>
        <g fontSize="22" fill={dark ? '#e7e8db' : '#4d5e50'}>
          <text x="78" y="117" style={{ fill: dark ? '#f2f4e8' : '#394f3e' }}>
            SS
          </text>
          <text x="234" y="153" style={{ fill: dark ? '#f2f4e8' : '#394f3e' }}>
            Ss
          </text>
          <text x="119" y="217" style={{ fill: dark ? '#f2f4e8' : '#394f3e' }}>
            ss
          </text>
        </g>
      </svg>
      <p className="bee16-note">{t('同三只蛾：背景变了，基因型没有变。')}</p>
    </div>
  );
}
function Frequency({
  change,
  light,
  year,
  showCurve,
  countStage = 5,
}: {
  change: number;
  light: number;
  year: number;
  showCurve: boolean;
  countStage?: number;
}) {
  const ys = selectionYears(change, light),
    k = Math.max(0, Math.min(9, Math.floor(year))),
    cur = ys[k],
    a = alleleAccounting(cur.counts);
  const number = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  return (
    <div className="bee16-frequency" data-year={cur.year} data-alleles={a.copies}>
      <div className="bee16-evidence-id">
        {t('教材假设模型')} · {t('模型年份')} {cur.year}
      </div>
      {showCurve ? (
        <svg
          className="bee16-curve"
          viewBox="0 0 350 160"
          aria-label={t('同一模型中S的频率变化')}
          role="img"
        >
          <path d="M40 14V125H328" stroke="#99ac9c" fill="none" />
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <path d={`M40 ${125 - v * 105}H328`} stroke="#d5ded0" />
              <text x="33" y={132 - v * 105} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          <path
            d={ys
              .slice(0, k + 1)
              .map((r, i) => `${i ? 'L' : 'M'}${44 + i * 30} ${125 - r.S * 105}`)
              .join(' ')}
            fill="none"
            stroke="#537e71"
            strokeWidth="4"
          />
          <circle cx={44 + k * 30} cy={125 - cur.S * 105} r="5" fill="#537e71" />
          {[1, 5, 10].map((v) => (
            <text key={v} x={44 + (v - 1) * 30} y="154" textAnchor="middle">
              {v}
            </text>
          ))}
        </svg>
      ) : (
        <div className="bee16-counts">
          {mothRepresentatives.map((r, i) => (
            <div key={r.id} data-id={r.id}>
              <b>{r.genotype}</b>
              <div className="bee16-alleles">
                {r.alleles.map((al, j) => (
                  <span key={j} className={al === 'S' ? 'dominant' : ''}>
                    {al}
                  </span>
                ))}
              </div>
              <output>× {number(cur.counts[i])}</output>
            </div>
          ))}
        </div>
      )}
      <div className="bee16-equation" data-count-stage={countStage}>
        <b>{countStage < 4 ? 'N(S)' : 'f(S)'}</b>
        <span>=</span>
        {countStage < 4 ? (
          <span className="bee16-count-sum">
            {countStage === 0
              ? '?'
              : countStage === 1
                ? `${number(cur.counts[0])} × 2 + …`
                : `${number(cur.counts[0])} × 2 + ${number(cur.counts[1])} × 1${countStage === 3 ? ` = ${number(a.S)}` : ''}`}
          </span>
        ) : (
          <>
            <span className="bee16-fraction">
              <span>{number(a.S)}</span>
              <span>{number(a.copies)}</span>
            </span>
            <span>{countStage >= 5 ? `= ${(cur.S * 100).toFixed(2)}%` : '= ?'}</span>
          </>
        )}
      </div>
      <p className="bee16-note">
        {t(showCurve ? '改变增减假设，预测也会改变。' : '深色个体并不都带两份S。每个个体计两份。')}
      </p>
    </div>
  );
}
function Plate({
  passage,
  preexisting,
  highlight = false,
  source = 1,
}: {
  passage: number;
  preexisting: boolean;
  highlight?: boolean;
  source?: number;
}) {
  const s = discSelection(passage, preexisting, source);
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label={t('一个空白纸片与三个抗生素纸片的虚拟平板')}>
      <circle cx="150" cy="150" r="142" fill="#ccd7b5" stroke="#96ab91" strokeWidth="3" />
      <circle cx="150" cy="150" r="134" fill="#adbe91" />
      {Array.from({ length: 130 }, (_, i) => {
        const a = i * 2.4,
          r = 130 * Math.sqrt((i + 0.5) / 130);
        return (
          <circle
            key={i}
            cx={150 + Math.cos(a) * r}
            cy={150 + Math.sin(a) * r}
            r="1.3"
            fill="#859e75"
            opacity=".35"
          />
        );
      })}
      <path d="M15 150H285M150 15V285" stroke="#82957a" opacity=".4" />
      {diskCenters.map((d, i) => (
        <g key={d.id}>
          {d.drug && (
            <circle
              cx={d.x}
              cy={d.y}
              r={inhibitionRadius(s.threshold * [1, 0.98, 1, 1.02][i], source)}
              fill="#e1e4cd"
            />
          )}
          <circle cx={d.x} cy={d.y} r="8" fill="#faf5dc" stroke="#afae8d" />
          <text x={d.x} y={d.y + 5} textAnchor="middle" fontSize="22" fill="#7a8169">
            {i + 1}
          </text>
          {d.drug && (
            <path
              d={`M${d.x - inhibitionRadius(s.threshold * [1, 0.98, 1, 1.02][i], source)} ${d.y}H${d.x + inhibitionRadius(s.threshold * [1, 0.98, 1, 1.02][i], source)}`}
              stroke="#8c9d7a"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}
        </g>
      ))}
      {preexisting && passage === 0 && (
        <>
          <path d="M234 94L238 98L234 102L230 98Z" fill="#587f6d" />
          <path d="M233 92L249 61" stroke="#587f6d" />
          <text x="250" y="55" fontSize="22" fill="#456e5e" textAnchor="middle">
            R-3
          </text>
          {highlight && (
            <circle cx="234" cy="98" r="12" fill="none" stroke="#587f6d" strokeWidth="2" />
          )}
        </>
      )}
    </svg>
  );
}
function DiscCloseup({ source, threshold }: { source: number; threshold: number }) {
  const r = inhibitionRadius(threshold, source),
    radialX = (distance: number) => 40 + (distance / 64) * 248,
    paperEdge = radialX(8),
    haloEnd = radialX(r),
    pts = Array.from(
      { length: 81 },
      (_, i) => `${i ? 'L' : 'M'}${radialX(i * 0.8)} ${159 - concentration(i * 0.8, source) * 110}`,
    ).join(' ');
  return (
    <div className="bee16-disc-closeup">
      <svg viewBox="0 0 350 215" role="img" aria-label={t('局部浓度与生长阈值的交点决定抑菌边界')}>
        <rect x="40" y="8" width="248" height="35" rx="15" fill="#c5d3b2" />
        <rect
          data-radial-halo
          x={paperEdge}
          y="8"
          width={haloEnd - paperEdge}
          height="35"
          rx="8"
          fill="#ebeada"
        />
        <rect
          data-radial-paper
          x="40"
          y="10"
          width={paperEdge - 40}
          height="31"
          rx="5"
          fill="#fef9e7"
          stroke="#a59f86"
        />
        <path d="M40 53V159H295" fill="none" stroke="#8da191" />
        <path d={pts} fill="none" stroke="#9b836a" strokeWidth="3" />
        <path
          d={`M40 ${159 - threshold * 110}H288`}
          stroke="#557e6b"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        {r > 8 && (
          <>
            <path d={`M${haloEnd} 8V159`} stroke="#7a9588" strokeDasharray="4 4" />
            <circle cx={haloEnd} cy={159 - threshold * 110} r="5" fill="#557e6b" />
          </>
        )}
        <text x="42" y="200">
          {t('离纸片距离（模型单位）')}
        </text>
        <text x="46" y="74">
          {t('浓度')}
        </text>
        <text x="289" y={Math.max(87, 151 - threshold * 110)} textAnchor="end">
          {t('生长阈值')}
        </text>
      </svg>
      <p className="bee16-note">
        {t(source === 0 ? '撤掉药物源，模型不再产生抑菌圈。' : '浓度降到阈值以下，细菌才可生长。')}
      </p>
    </div>
  );
}
function Clone({ p, preexisting, source }: { p: number; preexisting: boolean; source: number }) {
  const s = cloneTransfer(p, preexisting),
    original = discSelection(0, preexisting, source),
    desc = discSelection(s.arrived ? 1 : 0, preexisting, source);
  return (
    <div className="bee16-clone" data-lineage={s.root} data-generation={s.generation}>
      <div className="bee16-plate-titles">
        <b>{t(preexisting ? '原群体' : '独立普通对照')}</b>
        <b>{t('所选克隆的后代')}</b>
      </div>
      <svg viewBox="0 0 360 210" role="img" aria-label={t('带身份的克隆转移并分裂，耐受阈值保持')}>
        {[85, 275].map((cx, i) => (
          <g key={cx}>
            <circle
              cx={cx}
              cy="105"
              r="70"
              fill={i === 0 || s.generation > 0 ? '#b5c69c' : '#e3e7d2'}
              stroke="#99ad8f"
              strokeWidth="2"
            />
            {(i === 0 || s.generation > 0) && (
              <circle cx={cx} cy="105" r={i ? desc.radius : original.radius} fill="#eae9d5" />
            )}
            <circle cx={cx} cy="105" r="8" fill="#fff9df" />
            {(i === 0 || s.generation > 0) &&
              Array.from({ length: 28 }, (_, j) => {
                const angle = j * 2.4,
                  r = 48 + (14 * (j % 3)) / 2;
                return (
                  <circle
                    key={j}
                    cx={cx + Math.cos(angle) * r}
                    cy={105 + Math.sin(angle) * r}
                    r="1.5"
                    fill="#829c71"
                  />
                );
              })}
          </g>
        ))}
        <path
          d={Array.from({ length: 31 }, (_, i) => {
            const r = cloneTransfer(0.13 + (0.36 * i) / 30, preexisting).rootPosition;
            return `${i ? 'L' : 'M'}${r.x} ${r.y + 5}`;
          }).join(' ')}
          stroke="#9baa90"
          strokeDasharray="4 5"
          fill="none"
        />
        {s.active.map((x) => (
          <g
            key={x.id}
            data-clone={x.id}
            data-parent={x.parentId || ''}
            transform={`translate(${x.x} ${x.y + 5})`}
          >
            <path
              d="M0 -5L5 0L0 5L-5 0Z"
              fill={preexisting ? '#3c7968' : '#b39569'}
              stroke="#f9f7e6"
              strokeWidth="1"
            />
          </g>
        ))}
        <text x="180" y="26" textAnchor="middle">
          {s.root}
        </text>
        <text x="85" y="202" textAnchor="middle">
          {original.meanDiameter.toFixed(1)}
        </text>
        <text x="275" y="202" textAnchor="middle">
          {s.generation > 0 ? desc.meanDiameter.toFixed(1) : '—'}
        </text>
      </svg>
      <p className="bee16-note">
        {t(
          p < 0.56
            ? '跟住同一个克隆，进入新的平板。'
            : preexisting
              ? '选择已有R-3：后代继承阈值，不逐轮升级。'
              : '未预置耐受克隆：选择不会凭空创造R-3。',
        )}
      </p>
      <span className="bee16-qualifier">{t('圈径为模型单位')}</span>
    </div>
  );
}
function Antibiotic({
  selection,
  p,
  preexisting,
  source,
  local,
  detail = false,
}: {
  selection: boolean;
  p: number;
  preexisting: boolean;
  source: number;
  local: boolean;
  detail?: boolean;
}) {
  if (selection) return <Clone p={p} preexisting={preexisting} source={source} />;
  return (
    <div className="bee16-antibiotic">
      {local ? (
        <DiscCloseup source={source} threshold={0.12} />
      ) : (
        <>
          <Plate passage={0} preexisting={detail && preexisting} source={source} />
          <div className="bee16-disc-legend">
            <span>① {t('空白纸片')}</span>
            <span>②–④ {t('同种药物')}</span>
          </div>
          {detail && (
            <div className="bee16-diameters">
              <span>② {discSelection(0, true, source).diameters[0].toFixed(1)}</span>
              <span>③ {discSelection(0, true, source).diameters[1].toFixed(1)}</span>
              <span>④ {discSelection(0, true, source).diameters[2].toFixed(1)}</span>
              <span>
                {t('平均')} {discSelection(0, true, source).meanDiameter.toFixed(1)}
              </span>
            </div>
          )}
          <p className="bee16-note">
            {t(detail ? '长度是模型单位，R-3是预设克隆。' : '为什么只有药物纸片周围形成空圈？')}
          </p>
        </>
      )}
    </div>
  );
}
function Mouse({
  x,
  y,
  color,
  flip = false,
}: {
  x: number;
  y: number;
  color: string;
  flip?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path d="M-13 6Q-40 14 -33 -4" stroke="#b1a18b" strokeWidth="3" fill="none" />
      <ellipse rx="18" ry="10" fill={color} />
      <path d="M12 -6L29 2L15 10Z" fill={color} />
      <circle cx="15" cy="-7" r="6" fill={color} stroke="#9a8973" />
      <circle cx="24" cy="1" r="1.7" fill="#464b40" />
    </g>
  );
}
function Isolation({
  p,
  reunion,
  migration,
  compatible,
}: {
  p: number;
  reunion: boolean;
  migration: number;
  compatible: boolean;
}) {
  const seq = isolatedPopulations(Math.floor(p * 15), migration).at(-1)!;
  if (reunion)
    return (
      <div className="bee16-reunion">
        <span className="bee16-qualifier">{t('两种假设结果，需观察检验')}</span>
        {[true, false].map((fertile) => {
          const fam = reunionFamily(fertile, p);
          return (
            <div
              key={String(fertile)}
              className={fertile === compatible ? 'active' : ''}
              data-family={fam.branch}
            >
              <div className="bee16-family-generations">
                <span>A × B</span>
                <span>F₁</span>
                <span>F₂</span>
              </div>
              <svg
                viewBox="0 0 350 66"
                role="img"
                aria-label={t(
                  fertile ? 'F1可育并产生F2，基因可继续交流' : 'F1不育，没有F2，存在生殖隔离',
                )}
              >
                <Mouse x={25} y={20} color="#a89976" />
                <Mouse x={58} y={48} color="#847f69" flip />
                <path d="M84 34H122M220 34H264" stroke="#a0ac96" fill="none" strokeWidth="2" />
                {fam.first.map((x, i) => (
                  <g key={x.id} data-individual={x.id}>
                    <Mouse x={153 + i * 39} y={i ? 48 : 20} color="#a19878" />
                  </g>
                ))}
                {fam.second.map((x, i) => (
                  <g key={x.id} data-individual={x.id}>
                    <Mouse x={285 + i * 35} y={i ? 48 : 20} color="#a29875" />
                  </g>
                ))}
                {fam.tested && !fertile && (
                  <path d="M282 18L314 50M314 18L282 50" stroke="#b38470" strokeWidth="3" />
                )}
              </svg>
              <b>
                {t(
                  !fam.tested
                    ? '再观察：子代能否繁殖？'
                    : fertile
                      ? '可育后代：交流能够延续'
                      : '子代不育：生殖隔离',
                )}
              </b>
            </div>
          );
        })}
      </div>
    );
  return (
    <div className="bee16-isolation">
      <svg
        viewBox="0 0 350 210"
        role="img"
        aria-label={t('A和B在不同选择下分化，迁移会改变频率差异')}
      >
        <rect x="10" y="8" width="330" height="195" rx="32" fill="#d7ddbf" />
        <path
          d="M181 9Q150 80 181 129T180 203"
          stroke="#adcac5"
          strokeWidth={2 + 32 * Math.min(1, p * 4) * (1 - migration)}
          fill="none"
        />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <g data-population={`A-${i}`}>
              <Mouse
                x={65 + (i % 2) * 45}
                y={55 + i * 52}
                color={i === 1 ? '#8f846b' : '#af9d78'}
              />
            </g>
            <g data-population={`B-${i}`}>
              <Mouse
                x={239 + (i % 2) * 45}
                y={55 + i * 52}
                color={i === 1 ? '#8f846b' : '#af9d78'}
                flip
              />
            </g>
          </g>
        ))}
        <text x="50" y="33">
          A
        </text>
        <text x="285" y="33">
          B
        </text>
        {migration > 0 && (
          <path
            d="M130 110H220M220 110L212 104M220 110L212 116M130 110L138 104M130 110L138 116"
            stroke="#668d78"
            strokeWidth="3"
            fill="none"
          />
        )}
      </svg>
      <div className="bee16-gene-readout">
        <span>A {(seq.a * 100).toFixed(1)}%</span>
        <span>B {(seq.b * 100).toFixed(1)}%</span>
      </div>
      <p className="bee16-note">{t('一个等位基因的差异，还不能判定新物种。')}</p>
    </div>
  );
}
export default function BioEvolutionEvidence() {
  const f = useShowcase(),
    d = evolutionDirector(f.chapter, f.chapterTime, browserLocale());
  const [mode, setMode] = useState<Mode | null>(null),
    [progress, setProgress] = useState<number | null>(null),
    [species, setSpecies] = useState<Limb | null>(null),
    [bone, setBone] = useState<number | null>(null),
    [revealed, setRevealed] = useState<boolean | null>(null),
    [dark, setDark] = useState<boolean | null>(null),
    [strength, setStrength] = useState(0.1),
    [preexisting, setPreexisting] = useState<boolean | null>(null),
    [source, setSource] = useState(1),
    [migration, setMigration] = useState(0),
    [compatible, setCompatible] = useState(true),
    [page, setPage] = useState<number | null>(null),
    [local, setLocal] = useState<boolean | null>(null);
  const m = f.watch ? d.mode : (mode ?? d.mode),
    inheritsCurrentShot = m === d.mode,
    watchProgress =
      d.mode === 'selection'
        ? d.cloneProgress
        : d.mode === 'frequency'
          ? d.year / 9
          : d.mode === 'reunion'
            ? d.reunionProgress
            : d.progress,
    // Only the current mode inherits its directed shot. Selecting another evidence
    // starts that mode's stable initial condition; explicit user values still win.
    p = f.watch ? watchProgress : (progress ?? (inheritsCurrentShot ? watchProgress : 0)),
    activeSpecies = f.watch
      ? (d.limb as Limb)
      : (species ?? (inheritsCurrentShot ? (d.limb as Limb) : 'whale')),
    activeBone = f.watch ? d.boneFocus : (bone ?? (inheritsCurrentShot ? d.boneFocus : -1)),
    activeRevealed = f.watch
      ? d.limbRevealed
      : (revealed ?? (inheritsCurrentShot ? d.limbRevealed : false)),
    activeDark = f.watch
      ? d.dark
      : (dark ?? (m === 'frequency' ? true : inheritsCurrentShot ? d.dark : false)),
    activePreexisting = f.watch
      ? m === 'selection'
        ? !d.cloneControl
        : true
      : (preexisting ?? (inheritsCurrentShot && m === 'selection' ? !d.cloneControl : true)),
    activePage = f.watch ? d.molecularPage : (page ?? (inheritsCurrentShot ? d.molecularPage : 0)),
    activeLocal = f.watch ? d.localDisc : (local ?? (inheritsCurrentShot ? d.localDisc : false)),
    activeDetail = f.watch
      ? d.discDetail
      : local !== null
        ? !local
        : inheritsCurrentShot
          ? d.discDetail
          : false,
    activeShowCurve = f.watch
      ? d.showCurve
      : progress !== null
        ? p > 0.8
        : inheritsCurrentShot
          ? d.showCurve
          : false,
    activeCountStage = f.watch
      ? d.countStage
      : progress !== null
        ? 5
        : inheritsCurrentShot
          ? d.countStage
          : 0;
  return (
    <div className={`bee16 ${f.watch ? 'is-watch' : ''}`} data-mode={m}>
      <div className="bee16-stage">
        {m === 'fossil' ? (
          <Fossil p={p} />
        ) : m === 'anatomy' ? (
          <Anatomy species={activeSpecies} highlight={activeBone} revealed={activeRevealed} />
        ) : m === 'embryo' ? (
          <Embryos p={p} />
        ) : m === 'molecular' ? (
          <Molecular page={activePage} />
        ) : m === 'moths' ? (
          <Moths dark={activeDark} p={p} />
        ) : m === 'frequency' ? (
          <Frequency
            change={f.watch ? 0.1 : activeDark ? strength : -strength}
            light={f.watch ? -0.1 : activeDark ? -strength : strength}
            year={f.watch ? d.year : p * 9}
            showCurve={activeShowCurve}
            countStage={activeCountStage}
          />
        ) : m === 'discs' || m === 'selection' ? (
          <Antibiotic
            selection={m === 'selection'}
            p={p}
            preexisting={activePreexisting}
            source={f.watch ? 1 : source}
            local={activeLocal}
            detail={activeDetail}
          />
        ) : (
          <Isolation
            p={f.watch && m === 'reunion' ? d.reunionProgress : p}
            reunion={m === 'reunion'}
            migration={f.watch ? 0 : migration}
            compatible={f.watch ? true : compatible}
          />
        )}
      </div>
      {!f.watch && (
        <div className="bee16-controls">
          <label>
            {t('观察证据')}
            <select value={m} onChange={(e) => setMode(e.target.value as Mode)}>
              {modes.map((v, i) => (
                <option key={v} value={v}>
                  {t(names[i])}
                </option>
              ))}
            </select>
          </label>
          {m === 'anatomy' ? (
            <>
              <Segments
                label={t('比较对象')}
                value={activeSpecies}
                onChange={(v) => setSpecies(v as Limb)}
                options={(['bat', 'whale', 'cat'] as const).map((value, i) => ({
                  value,
                  label: t(['蝙蝠', '鲸类', '猫'][i]),
                }))}
              />
              <button onClick={() => setRevealed(!activeRevealed)}>
                {t(activeRevealed ? '重新遮盖观察' : '揭示独立观察')}
              </button>
              <label>
                {t('跟踪同源骨骼')}
                <select value={activeBone} onChange={(e) => setBone(Number(e.target.value))}>
                  <option value="-1">{t('全部')}</option>
                  {boneNames.map((n, i) => (
                    <option key={n} value={i}>
                      {t(n)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : m === 'molecular' ? (
            <Segments
              label={t('教材记录页')}
              value={String(activePage)}
              onChange={(v) => setPage(Number(v))}
              options={[0, 1, 2].map((v) => ({ value: String(v), label: `${v + 1}/3` }))}
            />
          ) : m === 'moths' || m === 'frequency' ? (
            <>
              <button onClick={() => setDark(!activeDark)}>
                {t(activeDark ? '深色树皮环境' : '浅色地衣环境')}
              </button>
              {m === 'frequency' && (
                <Range
                  label={t('模型选择强度')}
                  value={strength}
                  min={0}
                  max={0.3}
                  step={0.01}
                  onChange={setStrength}
                />
              )}
            </>
          ) : m === 'discs' || m === 'selection' ? (
            <>
              {m === 'selection' ? (
                <button onClick={() => setPreexisting(!activePreexisting)}>
                  {t(activePreexisting ? '预存R-3：有' : '预存R-3：无')}
                </button>
              ) : (
                <button onClick={() => setLocal(!activeLocal)}>
                  {t(activeLocal ? '查看整张平板' : '查看浓度与阈值')}
                </button>
              )}
              <Range
                label={t('归一化药物源')}
                value={source}
                min={0}
                max={1}
                step={0.05}
                onChange={setSource}
              />
            </>
          ) : m === 'barrier' ? (
            <Range
              label={t('每代交换比例')}
              value={migration}
              min={0}
              max={0.5}
              step={0.01}
              onChange={setMigration}
            />
          ) : null}
          <Range
            label={t('过程进度')}
            value={p}
            min={0}
            max={1}
            step={0.001}
            onChange={setProgress}
          />
          <p className="bee16-note">{t('模型参数用于比较假设，不是历史测量。')}</p>
        </div>
      )}
    </div>
  );
}
