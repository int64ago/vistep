import { useId, useState } from 'react';
import { t } from '../../i18n';
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
    <div className="bio-evolution-fossil">
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
        <g stroke="#8d8069" strokeWidth="4" fill="none" strokeLinecap="round">
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
        <g stroke="#ad9d80" strokeWidth="1.8" opacity={0.28 + 0.72 * p}>
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
      <b>{t('赫氏近鸟龙：恐龙骨骼与羽毛特征相结合')}</b>
      <small>{t('证据位置示意，非原始化石照片；单个化石不证明其就是直接祖先。')}</small>
    </div>
  );
}
function Anatomy({ species, highlight }: { species: Limb; highlight: number }) {
  return (
    <div className="bio-evolution-anatomy">
      <div className="bio-evolution-limbs">
        {(['human', species] as Limb[]).map((s, i) => (
          <div key={`${s}-${i}`}>
            <svg
              viewBox="25 0 190 270"
              role="img"
              aria-label={t(
                { human: '人的上肢', bat: '蝙蝠的翼', whale: '鲸类的鳍', cat: '猫的前肢' }[s],
              )}
            >
              {limbBones(s).map((b) => (
                <g key={b.id} opacity={highlight < 0 || highlight === b.group ? 1 : 0.2}>
                  <path
                    d={`M${b.a[0]} ${b.a[1]}L${b.b[0]} ${b.b[1]}`}
                    stroke={boneColors[b.group]}
                    strokeWidth={b.width}
                    strokeLinecap="round"
                  />
                  <circle cx={b.a[0]} cy={b.a[1]} r={b.width * 0.56} fill={boneColors[b.group]} />
                  <circle cx={b.b[0]} cy={b.b[1]} r={b.width * 0.56} fill={boneColors[b.group]} />
                </g>
              ))}
            </svg>
            <b>
              {t({ human: '人的上肢', bat: '蝙蝠的翼', whale: '鲸类的鳍', cat: '猫的前肢' }[s])}
            </b>
          </div>
        ))}
      </div>
      <div className="bio-evolution-bone-key">
        {boneNames.map((n, i) => (
          <span key={n} style={{ opacity: highlight < 0 || highlight === i ? 1 : 0.35 }}>
            <i style={{ background: boneColors[i] }} />
            {t(n)}
          </span>
        ))}
      </div>
    </div>
  );
}
function Embryo({ human, focus }: { human: boolean; focus: boolean }) {
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
    <div className="bio-evolution-embryos">
      <div>
        <Embryo human={true} focus={p > 0.3} />
        <b>{t('人胚胎')}</b>
      </div>
      <div>
        <Embryo human={false} focus={p > 0.3} />
        <b>{t('鱼胚胎')}</b>
      </div>
      <small>{t('比较同源咽部结构，不是“人曾经长出能呼吸的鱼鳃”。')}</small>
    </div>
  );
}
function Molecular({ selected }: { selected: number }) {
  return (
    <div className="bio-evolution-molecular">
      <b>{t('与人的细胞色素c氨基酸差异数')}</b>
      {cytochromeDifferences.map(([species, diff], i) => (
        <div key={species} className={selected === i ? 'active' : ''}>
          <span>{t(species)}</span>
          <div>
            <i style={{ width: `${(diff / 44) * 100}%` }} />
          </div>
          <output>{diff}</output>
        </div>
      ))}
      <small>{t('教材提供的是差异个数；不虚构具体替换位点或直接换算分化年代。')}</small>
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
  return (
    <div className="bio-evolution-moths">
      <svg
        viewBox="0 0 350 250"
        role="img"
        aria-label={t('相同的SS、Ss、ss体色，在不同树皮背景中的可见度')}
      >
        <rect x="10" y="10" width="330" height="215" rx="35" fill={dark ? '#69695c' : '#b7bfaa'} />
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
        <Moth x={100} y={69} dark={true} />
        <Moth x={252} y={106} dark={true} />
        <Moth x={132} y={168} dark={false} />
        <g fontSize="22" fill={dark ? '#e7e8db' : '#4d5e50'}>
          <text x="78" y="117">
            SS
          </text>
          <text x="234" y="153">
            Ss
          </text>
          <text x="119" y="217">
            ss
          </text>
        </g>
      </svg>
      <p>{t('体色不随背景改写；教材将黑色设为显性。')}</p>
    </div>
  );
}
function Frequency({ change, light, year }: { change: number; light: number; year: number }) {
  const ys = selectionYears(change, light);
  const k = Math.max(0, Math.min(9, Math.floor(year)));
  const cur = ys[k];
  return (
    <div className="bio-evolution-frequency">
      <svg viewBox="0 0 360 220" role="img" aria-label={t('基因S和s的频率随模型年份变化')}>
        <path d="M40 20V185H335" fill="none" stroke="#9aa68e" />
        {[0, 0.5, 1].map((a) => (
          <g key={a}>
            <path d={`M40 ${185 - a * 160}H335`} stroke="#d5dacb" />
            <text x="33" y={191 - a * 160} textAnchor="end" fontSize="22" fill="#6e7b63">
              {a}
            </text>
          </g>
        ))}
        {(['S', 's'] as const).map((a, i) => (
          <g key={a}>
            <path
              d={ys
                .slice(0, k + 1)
                .map((r, j) => `${j ? 'L' : 'M'}${45 + j * 31} ${185 - r[a] * 160}`)
                .join(' ')}
              fill="none"
              stroke={i ? '#b09770' : '#718d83'}
              strokeWidth="4"
            />
            <circle
              cx={45 + k * 31}
              cy={185 - cur[a] * 160}
              r="6"
              fill={i ? '#b09770' : '#718d83'}
            />
          </g>
        ))}
        {[1, 5, 10].map((n) => (
          <text
            key={n}
            x={45 + (n - 1) * 31}
            y="211"
            textAnchor="middle"
            fontSize="22"
            fill="#6e7b63"
          >
            {n}
          </text>
        ))}
      </svg>
      <div className="bio-evolution-gene-readout">
        <b>
          {t('第')} {cur.year} {t('年')}
        </b>
        <span>S = {(cur.S * 100).toFixed(2)}%</span>
        <span>s = {(cur.s * 100).toFixed(2)}%</span>
      </div>
      <div className="bio-evolution-genotypes">
        {['SS', 'Ss', 'ss'].map((n, i) => (
          <span key={n}>
            {n}
            <b>{(cur.frequencies[i] * 100).toFixed(2)}%</b>
          </span>
        ))}
      </div>
      <small>{t('教材假设模型：各基因型数量逐年乘系数，再用当年总数归一化。')}</small>
    </div>
  );
}
function Plate({
  passage,
  preexisting,
  highlight = false,
}: {
  passage: number;
  preexisting: boolean;
  highlight?: boolean;
}) {
  const s = discSelection(passage, preexisting);
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
              r={inhibitionRadius(s.threshold * [1, 0.98, 1, 1.02][i])}
              fill="#e1e4cd"
            />
          )}
          <circle cx={d.x} cy={d.y} r="8" fill="#faf5dc" stroke="#afae8d" />
          <text x={d.x} y={d.y + 5} textAnchor="middle" fontSize="19" fill="#7a8169">
            {i + 1}
          </text>
          {d.drug && (
            <path
              d={`M${d.x - inhibitionRadius(s.threshold * [1, 0.98, 1, 1.02][i])} ${d.y}H${d.x + inhibitionRadius(s.threshold * [1, 0.98, 1, 1.02][i])}`}
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
          <text x="250" y="55" fontSize="19" fill="#456e5e" textAnchor="middle">
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
function Antibiotic({
  selection,
  p,
  preexisting,
  passage,
}: {
  selection: boolean;
  p: number;
  preexisting: boolean;
  passage: number;
}) {
  const result = discSelection(passage, preexisting);
  return (
    <div className="bio-evolution-antibiotic">
      {selection && (
        <div className="bio-evolution-transfer">
          <div>
            <svg viewBox="0 0 80 60" aria-hidden="true">
              <circle cx="30" cy="30" r="25" fill="#e1e4cd" stroke="#a6b294" />
              {preexisting && <path d="M45 23L50 28L45 33L40 28Z" fill="#587f6d" />}
            </svg>
            <b>{preexisting ? 'R-3' : t('未预置R-3')}</b>
          </div>
          <svg viewBox="0 0 160 60" aria-hidden="true">
            <path d="M5 30H150L141 23M150 30L141 37" stroke="#9aac91" strokeWidth="2" fill="none" />
            {preexisting && (
              <path d={`M${20 + 110 * ease(ramp(p, 0, 0.5))} 25l5 5 -5 5 -5 -5Z`} fill="#587f6d" />
            )}
          </svg>
          <b>{t('后代新平板')}</b>
        </div>
      )}
      <Plate
        passage={selection ? passage : 0}
        preexisting={preexisting}
        highlight={selection && p < 0.5}
      />
      <div className="bio-evolution-disc-legend">
        <span>① {t('空白纸片')}</span>
        <span>②–④ {t('同种抗生素纸片')}</span>
      </div>
      {selection && (
        <>
          <p>
            {t(
              result.selected
                ? '模型中选择已有R-3，后代阈值保持，不继续凭空提高。'
                : '该模型没有选出更耐受的克隆，抑菌圈不必缩小。',
            )}
          </p>
          <div className="bio-evolution-diameters">
            <span>
              {t('平均')}：{result.meanDiameter.toFixed(1)}
            </span>
            {result.diameters.map((d, i) => (
              <span key={i}>
                {i + 2}：{d.toFixed(1)}
              </span>
            ))}
          </div>
        </>
      )}
      <small>{t('归一化扩散与生长阈值模型，长度为模型单位；非药敏检测标准或实测数据。')}</small>
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
  compatible,
}: {
  p: number;
  reunion: boolean;
  compatible: boolean;
}) {
  const k = Math.floor(p * 15),
    seq = isolatedPopulations(k, 0).at(-1)!;
  return (
    <div className="bio-evolution-isolation">
      {!reunion ? (
        <>
          <svg
            viewBox="0 0 350 230"
            role="img"
            aria-label={t('河流地理屏障阻断交流，频率差异不是自动物种判定')}
          >
            <rect x="10" y="10" width="330" height="205" rx="32" fill="#d7ddbf" />
            <path
              d="M181 9Q150 80 181 129T180 216"
              fill="none"
              stroke="#adcac5"
              strokeWidth={2 + 34 * p}
            />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <Mouse
                  x={70 + (i % 2) * 49}
                  y={60 + i * 52}
                  color={i === 1 ? '#8f846b' : '#af9d78'}
                />
                <Mouse
                  x={241 + (i % 2) * 45}
                  y={63 + i * 52}
                  color={i === 1 ? '#8f846b' : '#af9d78'}
                  flip
                />
              </g>
            ))}
            <path
              d="M132 114H218"
              stroke="#809575"
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity={1 - ramp(p, 0, 0.15)}
            />
          </svg>
          <div className="bio-evolution-gene-readout">
            <span>A：{(seq.a * 100).toFixed(1)}%</span>
            <span>B：{(seq.b * 100).toFixed(1)}%</span>
          </div>
          <small>
            {t('两侧选择条件不同的假设；此处只计算一个等位基因，不预测新物种诞生时间。')}
          </small>
        </>
      ) : (
        <div className="bio-evolution-reunion">
          <p>{t('地理屏障移除后，比较两种待检验结果')}</p>
          {[true, false].map((fertile) => (
            <div key={String(fertile)} className={fertile === compatible ? 'active' : ''}>
              <svg
                viewBox="0 0 300 90"
                role="img"
                aria-label={t(fertile ? '有可育后代，仍可交流' : '无可育后代，存在生殖隔离')}
              >
                <Mouse x={45} y={30} color="#a89976" />
                <Mouse x={255} y={30} color="#847f69" flip />
                <path
                  d="M80 31H220"
                  stroke={geneFlow(false, !fertile) ? '#819c7d' : '#b29f88'}
                  strokeWidth="3"
                  strokeDasharray={fertile ? undefined : '4 5'}
                />
                {fertile ? (
                  <>
                    <Mouse x={150} y={66} color="#9b9476" />
                    <path d="M150 34V47" stroke="#819c7d" />
                  </>
                ) : (
                  <path d="M145 20L157 42M157 20L145 42" stroke="#a97460" strokeWidth="3" />
                )}
              </svg>
              <b>{t(fertile ? '可产生可育后代' : '不能产生可育后代')}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default function BioEvolutionEvidence() {
  const f = useShowcase();
  const [mode, setMode] = useState<Mode>((f.variant as Mode) || 'fossil');
  const [progress, setProgress] = useState(0.65);
  const [species, setSpecies] = useState<Limb>('bat');
  const [bone, setBone] = useState(-1);
  const [dark, setDark] = useState(true);
  const [strength, setStrength] = useState(0.1);
  const [preexisting, setPreexisting] = useState(true);
  const [passage, setPassage] = useState(1);
  const [compatible, setCompatible] = useState(false);
  const m = f.watch ? modes[Math.min(9, f.chapter)] : mode;
  const p = f.watch ? ease(ramp(f.chapterProgress, 0.08, 0.88)) : progress;
  const sp = f.watch ? (['bat', 'whale', 'cat'] as const)[p < 0.5 ? 0 : p < 0.8 ? 1 : 2] : species;
  const bg = f.watch ? -1 : bone;
  const pass = f.watch ? (p < 0.5 ? 0 : p < 0.8 ? 1 : 2) : passage;
  return (
    <div className={`bio-evolution-scene ${f.watch ? 'is-watch' : ''}`}>
      <div className="bio-evolution-stage">
        {m === 'fossil' ? (
          <Fossil p={p} />
        ) : m === 'anatomy' ? (
          <Anatomy species={sp} highlight={bg} />
        ) : m === 'embryo' ? (
          <Embryos p={p} />
        ) : m === 'molecular' ? (
          <Molecular selected={Math.min(9, Math.floor(p * 10))} />
        ) : m === 'moths' ? (
          <Moths dark={f.watch ? p > 0.3 : dark} p={p} />
        ) : m === 'frequency' ? (
          <Frequency
            change={f.watch ? 0.1 : dark ? strength : -strength}
            light={f.watch ? -0.1 : dark ? -strength : strength}
            year={p * 9}
          />
        ) : m === 'discs' || m === 'selection' ? (
          <Antibiotic
            selection={m === 'selection'}
            p={p}
            preexisting={f.watch || preexisting}
            passage={pass}
          />
        ) : (
          <Isolation p={p} reunion={m === 'reunion'} compatible={f.watch ? p < 0.5 : compatible} />
        )}
      </div>
      {!f.watch && (
        <div className="bio-evolution-controls">
          <label>
            {t('观察证据')}
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
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
                value={species}
                onChange={(v) => setSpecies(v as Limb)}
                options={(['bat', 'whale', 'cat'] as const).map((v, i) => ({
                  value: v,
                  label: t(['蝙蝠', '鲸类', '猫'][i]),
                }))}
              />
              <label>
                {t('跟踪同源骨骼')}
                <select value={bone} onChange={(e) => setBone(Number(e.target.value))}>
                  <option value="-1">{t('全部')}</option>
                  {boneNames.map((n, i) => (
                    <option key={n} value={i}>
                      {t(n)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : m === 'moths' || m === 'frequency' ? (
            <>
              <button onClick={() => setDark(!dark)}>
                {t(dark ? '深色树皮环境' : '浅色地衣环境')}
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
              <button onClick={() => setPreexisting(!preexisting)}>
                {t(preexisting ? '预存R-3：有' : '预存R-3：无')}
              </button>
              {m === 'selection' && (
                <Segments
                  label={t('新平板轮次')}
                  value={String(passage)}
                  onChange={(v) => setPassage(Number(v))}
                  options={[0, 1, 2].map((v) => ({ value: String(v), label: String(v) }))}
                />
              )}
            </>
          ) : m === 'reunion' ? (
            <button onClick={() => setCompatible(!compatible)}>
              {t(compatible ? '假设结果：可育' : '假设结果：不可育')}
            </button>
          ) : null}
          <Range
            label={t('过程进度')}
            value={progress}
            min={0}
            max={1}
            step={0.001}
            onChange={setProgress}
          />
        </div>
      )}
    </div>
  );
}
