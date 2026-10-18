import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  expressionEvidence,
  chickenCells,
  linariaState,
  agoutiState,
  vestigialEvidence,
  wingOutline,
  type ChickenCell,
  type CoatState,
} from '../../models/bio-gene-expression';
import '../../styles/bio-gene-expression.css';
const modes = [
  'dna',
  'rna',
  'flower',
  'methyl',
  'inherit',
  'mice',
  'temperature',
  'offspring',
] as const;
type Mode = (typeof modes)[number];
const modeNames = [
  '相同的DNA检测结果',
  '不同的mRNA检测结果',
  '柳穿鱼的两种花型',
  '甲基化不替换碱基',
  '花型的后代证据',
  '同基因型小鼠的毛色',
  '幼虫培养温度的影响',
  '后代回到25 ℃',
];
const cellNames = { oviduct: '输卵管细胞', erythrocyte: '鸡红细胞（有核）', islet: '胰岛细胞' };
const colors = ['#b58a65', '#a77780', '#6c9999'];
function Cell({ cell, assay }: { cell: ChickenCell; assay: 'DNA' | 'mRNA' }) {
  const idx = chickenCells.indexOf(cell);
  return (
    <svg viewBox="0 0 220 200" role="img" aria-label={t(cellNames[cell])}>
      {cell === 'erythrocyte' ? (
        <ellipse cx="110" cy="96" rx="89" ry="57" fill="#d6aaa6" stroke="#ab7f82" strokeWidth="3" />
      ) : cell === 'oviduct' ? (
        <path
          d="M51 20Q105 10 166 21L174 168Q114 182 44 169Z"
          fill="#e0cfaa"
          stroke="#ad9d79"
          strokeWidth="3"
        />
      ) : (
        <path
          d="M49 28Q106 5 164 31L192 86L170 159Q118 187 54 163L27 102Z"
          fill="#c3d4cc"
          stroke="#85a497"
          strokeWidth="3"
        />
      )}
      {cell !== 'erythrocyte' &&
        Array.from({ length: 12 }, (_, i) => (
          <circle
            key={i}
            cx={65 + (i % 4) * 30}
            cy={31 + Math.floor(i / 4) * 17}
            r="4"
            fill={cell === 'islet' ? '#79a29c' : '#b99d68'}
          />
        ))}
      <ellipse cx="110" cy="111" rx="44" ry="32" fill="#b6b6bb" stroke="#9296a2" strokeWidth="2" />
      {colors.map((c, i) => (
        <g key={c}>
          <path
            d={`M83 ${94 + i * 16}Q95 ${86 + i * 16} 110 ${94 + i * 16}T136 ${94 + i * 16}`}
            fill="none"
            stroke={c}
            strokeWidth="5"
          />
          <path
            d={`M83 ${99 + i * 16}Q95 ${91 + i * 16} 110 ${99 + i * 16}T136 ${99 + i * 16}`}
            fill="none"
            stroke={c}
            strokeWidth="2"
          />
        </g>
      ))}
      {assay === 'mRNA' && (
        <path
          d="M119 119Q166 115 159 147Q140 158 172 170"
          fill="none"
          stroke={colors[idx]}
          strokeWidth="5"
          strokeDasharray="8 3"
        />
      )}
    </svg>
  );
}
function Detection({ cell, assay }: { cell: ChickenCell; assay: 'DNA' | 'mRNA' }) {
  return (
    <div className="bio-expression-detection">
      <div className="bio-expression-cell">
        <Cell cell={cell} assay={assay} />
        <b>{t(cellNames[cell])}</b>
      </div>
      <div className="bio-expression-table">
        <b>
          {t('教材定性检测结果')} · {assay}
        </b>
        <table>
          <thead>
            <tr>
              <th></th>
              {['Oval', 'Glob', 'Ins'].map((s, i) => (
                <th key={s} style={{ color: colors[i] }}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chickenCells.map((c) => (
              <tr key={c} className={c === cell ? 'active' : ''}>
                <th>{t(cellNames[c])}</th>
                {expressionEvidence(c, assay).map((e) => (
                  <td key={e.gene}>{e.detected ? '+' : '−'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p>{t('Oval：卵清蛋白；Glob：珠蛋白；Ins：胰岛素。')}</p>
        <small>{t('“−”表示未检出，不代表所有相关分子绝对为零。')}</small>
      </div>
    </div>
  );
}
function Flower({ plant }: { plant: 'A' | 'B' }) {
  const s = linariaState(plant);
  return (
    <svg
      viewBox="0 0 200 230"
      role="img"
      aria-label={t(plant === 'A' ? 'A：两侧对称，一条距' : 'B：辐射对称，多条距')}
    >
      <path d="M100 166Q96 204 108 228" fill="none" stroke="#869876" strokeWidth="5" />
      <path
        d="M99 180Q63 168 58 188Q82 197 99 190M102 196Q137 182 145 201Q127 213 103 205"
        fill="#9ca785"
      />
      {s.spurs === 5 ? (
        [-2, -1, 0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M${94 + i * 7} 102Q${101 + i * 18} 139 ${100 + i * 35} ${176 - Math.abs(i) * 12}Q${100 + i * 18} 137 ${106 + i * 7} 107Z`}
            fill="#c4cb91"
            stroke="#aeb97d"
          />
        ))
      ) : (
        <path d="M91 112Q79 161 76 192Q94 171 107 121Z" fill="#c4cb91" stroke="#aeb97d" />
      )}
      <path
        d="M78 77Q72 119 98 153Q127 120 125 78Z"
        fill="#dce1aa"
        stroke="#b8c48f"
        strokeWidth="2"
      />
      {plant === 'A' ? (
        <>
          <path
            d="M95 83Q58 79 63 30Q64 9 79 17Q96 27 100 73Q101 28 121 17Q140 15 134 39Q131 73 110 84Z"
            fill="#f0eed2"
            stroke="#d7d9af"
          />
          <path
            d="M79 82Q49 76 48 94Q45 113 76 112Q78 135 101 122Q127 139 132 112Q159 113 151 91Q143 78 119 83Z"
            fill="#f0e9b5"
            stroke="#d6d19a"
          />
          <path d="M76 87Q102 63 128 88Q116 108 99 109Q85 108 76 87Z" fill="#d2a447" />
        </>
      ) : (
        <g transform="translate(100 78)">
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              transform={`rotate(${i * 72})`}
              d="M-13 0Q-34 -22 -17 -36Q0 -46 17 -36Q34 -22 13 0Z"
              fill="#efe9b4"
              stroke="#d6d19a"
            />
          ))}
          <path d="M-17 -11Q0 -25 19 -10L20 8Q0 26 -20 8Z" fill="#d5a748" />
          <ellipse cx="0" cy="0" rx="12" ry="9" fill="#a78435" />
        </g>
      )}
    </svg>
  );
}
function CpG({ methylated, gene }: { methylated: boolean | number[]; gene: string }) {
  return (
    <div className="bio-expression-cpg">
      <b>{gene}</b>
      <svg viewBox="0 0 300 110" role="img" aria-label={t('甲基附着在胞嘧啶上，碱基字母保留')}>
        <path d="M35 40H266M35 80H266" stroke="#85958b" strokeWidth="3" />
        {'CGCGCGCG'.split('').map((b, i) => (
          <g key={i}>
            <text x={42 + i * 30} y="46" textAnchor="middle" fontSize="20" fill="#587e7a">
              {b}
            </text>
            <text x={42 + i * 30} y="86" textAnchor="middle" fontSize="20" fill="#83776d">
              {b === 'C' ? 'G' : 'C'}
            </text>
            {(Array.isArray(methylated) ? methylated.includes(i / 2) : methylated) && b === 'C' && (
              <g>
                <path d={`M${42 + i * 30} 27V20`} stroke="#ae7a64" />
                <rect x={25 + i * 30} y="1" width="34" height="20" rx="10" fill="#bc8d71" />
                <text x={42 + i * 30} y="16" textAnchor="middle" fontSize="21" fill="#fff">
                  CH₃
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
      <p>
        {t(
          (Array.isArray(methylated) ? methylated.length > 0 : methylated)
            ? '标记改变，碱基序列不变。'
            : '相同的示意碱基序列。',
        )}
      </p>
    </div>
  );
}
function Mouse({ coat }: { coat: CoatState }) {
  const uid = useId().replace(/:/g, '');
  const fill = coat === 'yellow' ? '#ceb06d' : coat === 'dark' ? '#736658' : '#ba9d70';
  return (
    <svg
      viewBox="0 0 210 160"
      role="img"
      aria-label={t(
        coat === 'yellow' ? '黄色毛色' : coat === 'dark' ? '深色拟野生型毛色' : '斑驳过渡毛色',
      )}
    >
      <defs>
        <clipPath id={uid}>
          <path d="M41 102Q26 42 87 31Q141 25 164 68L194 105Q202 122 181 125L146 126Q111 151 67 129Z" />
        </clipPath>
      </defs>
      <path
        d="M44 106Q4 119 12 71Q17 30 43 32"
        fill="none"
        stroke="#bd9c87"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M41 102Q26 42 87 31Q141 25 164 68L194 105Q202 122 181 125L146 126Q111 151 67 129Z"
        fill={fill}
        stroke="#817563"
        strokeWidth="2"
      />
      {coat === 'mottled' && (
        <g clipPath={`url(#${uid})`} fill="#796a55">
          {Array.from({ length: 14 }, (_, i) => (
            <ellipse
              key={i}
              cx={35 + ((i * 43) % 125)}
              cy={40 + ((i * 29) % 95)}
              rx={10 + (i % 3) * 4}
              ry={8 + (i % 4) * 3}
              transform={`rotate(${i * 47} ${35 + ((i * 43) % 125)} ${40 + ((i * 29) % 95)})`}
            />
          ))}
        </g>
      )}
      <ellipse cx="149" cy="61" rx="20" ry="26" fill={fill} stroke="#817563" strokeWidth="2" />
      <ellipse cx="150" cy="61" rx="12" ry="17" fill="#bd9d89" />
      <circle cx="173" cy="96" r="4" fill="#373d39" />
      <circle cx="196" cy="115" r="4" fill="#a37b6c" />
      <path
        d="M177 118L204 125M177 118L208 112M72 134L62 143H85M143 130L135 143H158"
        fill="none"
        stroke="#987969"
        strokeWidth="2"
      />
    </svg>
  );
}
function Fly({ long }: { long: boolean }) {
  const l = long ? 1 : 0.32;
  return (
    <svg
      viewBox="0 0 260 215"
      role="img"
      aria-label={t(long ? '部分成虫翅长接近正常' : '残翅成虫')}
    >
      <g stroke="#756c58" strokeWidth="3" fill="none">
        <path d="M120 97L76 72L56 77M119 107L70 114L46 134M119 121L83 155L67 183M140 97L184 72L204 77M141 107L190 114L214 134M141 121L177 155L193 183" />
      </g>
      <ellipse cx="130" cy="140" rx="24" ry="48" fill="#a39673" stroke="#736b57" strokeWidth="2" />
      {[125, 138, 151, 164].map((y) => (
        <path
          key={y}
          d={`M110 ${y}Q130 ${y + 8} 150 ${y}`}
          fill="none"
          stroke="#746b56"
          strokeWidth="5"
        />
      ))}
      <ellipse cx="130" cy="96" rx="23" ry="32" fill="#a5956d" stroke="#736b57" strokeWidth="2" />
      {[-1, 1].map((side) => (
        <g key={side}>
          <path
            d={wingOutline(l, side as -1 | 1)}
            fill="#e4e4d7"
            fillOpacity=".86"
            stroke="#a8b2a8"
            strokeWidth="2"
          />
          <path
            d={`M${130 + side * 12} 100Q${130 + side * 45 * l} ${125 + 15 * l} ${130 + side * 68 * l} ${140 + 42 * l}M${130 + side * 12} 100L${130 + side * 67 * l} ${122 + 30 * l}`}
            stroke="#b9beb2"
            fill="none"
          />
        </g>
      ))}
      <ellipse cx="130" cy="60" rx="22" ry="20" fill="#a2936e" stroke="#736b57" />
      <ellipse cx="112" cy="61" rx="10" ry="14" fill="#a46251" />
      <ellipse cx="148" cy="61" rx="10" ry="14" fill="#a46251" />
      <path d="M122 44L116 31M138 44L144 31" stroke="#6e6856" strokeWidth="2" />
    </svg>
  );
}
export default function BioGeneExpression() {
  const f = useShowcase();
  const [mode, setMode] = useState<Mode>((f.variant as Mode) || 'dna');
  const [cell, setCell] = useState<ChickenCell>('oviduct');
  const [plant, setPlant] = useState<'A' | 'B'>('B');
  const [coat, setCoat] = useState<CoatState>('mottled');
  const [temperature, setTemperature] = useState<25 | 31>(31);
  const m = f.watch ? modes[Math.min(7, f.chapter)] : mode;
  const p = f.watch ? ease(ramp(f.chapterProgress, 0.1, 0.85)) : 1;
  const c = f.watch ? chickenCells[Math.min(2, Math.floor(p * 3))] : cell;
  const pl = f.watch ? (p < 0.5 ? 'A' : 'B') : plant;
  const co = f.watch
    ? (['yellow', 'mottled', 'dark'] as const)[Math.min(2, Math.floor(p * 3))]
    : coat;
  const ev = vestigialEvidence(
    f.watch ? 31 : temperature,
    m === 'offspring' ? 'offspring' : 'parent',
  );
  return (
    <div className={`bio-expression-scene ${f.watch ? 'is-watch' : ''}`}>
      <div className="bio-expression-stage">
        {m === 'dna' || m === 'rna' ? (
          <Detection cell={c} assay={m === 'dna' ? 'DNA' : 'mRNA'} />
        ) : m === 'flower' ? (
          <div className="bio-expression-flowers">
            {(['A', 'B'] as const).map((a) => (
              <div key={a}>
                <Flower plant={a} />
                <b>
                  {a} · {t(a === 'A' ? 'Lcyc表达' : 'Lcyc受抑制')}
                </b>
              </div>
            ))}
          </div>
        ) : m === 'methyl' ? (
          <div className="bio-expression-methyl">
            <Flower plant={pl} />
            <CpG methylated={linariaState(pl).methylated} gene="Lcyc" />
          </div>
        ) : m === 'inherit' ? (
          <div className="bio-expression-inherit">
            <div>
              <b>P：A × B</b>
              <div className="bio-expression-parentflowers">
                <Flower plant="A" />
                <Flower plant="B" />
              </div>
            </div>
            <span>→</span>
            <div>
              <b>F₁</b>
              <Flower plant="A" />
            </div>
            <span>→</span>
            <div>
              <b>F₂</b>
              <p>{t('大多数似A，少数似B')}</p>
              <div className="bio-expression-parentflowers">
                <Flower plant="A" />
                <Flower plant="B" />
              </div>
            </div>
          </div>
        ) : m === 'mice' ? (
          <div className="bio-expression-mice">
            <div>
              <Mouse coat={co} />
              <b>Aᵛʸ/a · {t(co === 'yellow' ? '黄色' : co === 'mottled' ? '斑驳' : '深色')}</b>
            </div>
            <div>
              <CpG methylated={agoutiState(co).methylatedSites} gene={t('Aᵛʸ上游')} />
              <p>
                {t(
                  co === 'yellow'
                    ? '上游异位表达较高'
                    : co === 'mottled'
                      ? '组织中的修饰与表达呈镶嵌'
                      : '上游异位表达受抑制',
                )}
              </p>
              <small>{t('毛色为定性状态，非甲基化百分比的颜色标尺。')}</small>
            </div>
          </div>
        ) : (
          <div className="bio-expression-temperature">
            <div className="bio-expression-cohort">
              <b>
                {t(m === 'offspring' ? '后代幼虫培养' : '亲代幼虫培养')} ·{' '}
                {ev.developmentTemperature} ℃
              </b>
              <div className="bio-expression-larva">
                <svg viewBox="0 0 160 55" aria-hidden="true">
                  <path
                    d="M15 36Q17 13 44 16L121 22Q146 25 139 39Q100 49 56 46Q28 47 15 36Z"
                    fill="#e1d8b7"
                    stroke="#bcb38e"
                    strokeWidth="2"
                  />
                  {[40, 55, 70, 85, 100, 115].map((x) => (
                    <path key={x} d={`M${x} 21Q${x - 6} 33 ${x} 43`} stroke="#c1b998" fill="none" />
                  ))}
                  <circle cx="137" cy="31" r="2" fill="#7c735e" />
                </svg>
              </div>
              <span>{t('发育后观察')}</span>
            </div>
            <div>
              <Fly long={ev.phenotype === 'some-near-normal'} />
              <b>
                {t(ev.phenotype === 'some-near-normal' ? '部分成虫翅长接近正常' : '成虫仍为残翅')}
              </b>
              <p>vg/vg</p>
            </div>
            {m === 'offspring' && <small>{t('这是下一代，不是把上一代成虫的翅缩短。')}</small>}
          </div>
        )}
      </div>
      {!f.watch && (
        <div className="bio-expression-controls">
          <label>
            {t('观察证据')}
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              {modes.map((a, i) => (
                <option key={a} value={a}>
                  {t(modeNames[i])}
                </option>
              ))}
            </select>
          </label>
          {m === 'dna' || m === 'rna' ? (
            <Segments
              label={t('细胞类型')}
              value={cell}
              onChange={(v) => setCell(v as ChickenCell)}
              options={chickenCells.map((v) => ({ value: v, label: t(cellNames[v]) }))}
            />
          ) : m === 'methyl' ? (
            <Segments
              label={t('植株')}
              value={plant}
              onChange={(v) => setPlant(v as 'A' | 'B')}
              options={['A', 'B'].map((v) => ({ value: v, label: v }))}
            />
          ) : m === 'mice' ? (
            <Segments
              label={t('同基因型毛色')}
              value={coat}
              onChange={(v) => setCoat(v as CoatState)}
              options={(['yellow', 'mottled', 'dark'] as const).map((v, i) => ({
                value: v,
                label: t(['黄色', '斑驳', '深色'][i]),
              }))}
            />
          ) : m === 'temperature' ? (
            <Segments
              label={t('幼虫培养温度')}
              value={String(temperature)}
              onChange={(v) => setTemperature(Number(v) as 25 | 31)}
              options={[25, 31].map((v) => ({ value: String(v), label: `${v} ℃` }))}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
