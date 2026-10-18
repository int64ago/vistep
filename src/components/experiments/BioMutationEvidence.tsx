import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  smokingStudy,
  smokingAssociation,
  recessiveLethalTest,
  coldSteps,
  restitutionMitosis,
  chromosomeSets,
  structureSegments,
  countedChromosomes,
  type ChromosomeChange,
  type StructuralChange,
} from '../../models/bio-mutation-evidence';
import '../../styles/bio-mutation-evidence.css';
const modes = [
  'irradiate',
  'inherit',
  'association',
  'prepare',
  'spindle',
  'count',
  'number',
  'origin',
  'copies',
  'order',
] as const;
type Mode = (typeof modes)[number];
const names = [
  '射线处理与对照',
  '后代检出逻辑',
  '病例与对照的分母',
  '低温处理与固定装片',
  '复制后分离受阻',
  '在固定分裂象中计数',
  '个别变化与整组变化',
  '单倍体要看来源',
  '片段缺失与重复',
  '倒位与易位',
];
function FlyGlyph({ x, y, mutant = false }: { x: number; y: number; mutant?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M-5 0L-18 -10M-5 7L-21 5M-5 12L-16 25M5 0L18 -10M5 7L21 5M5 12L16 25"
        stroke="#84795f"
        strokeWidth="2"
      />
      <ellipse cy="15" rx="7" ry="17" fill="#aa9b74" stroke="#7c745d" />
      <path
        d="M-4 0Q-32 -12 -20 23Q-13 31 0 7M4 0Q32 -12 20 23Q13 31 0 7"
        fill="#d8dfd2"
        stroke="#a9b5a6"
      />
      <circle cy="-7" r="9" fill="#a99a73" />
      <circle cx="-7" cy="-8" r="4" fill={mutant ? '#eee3c8' : '#aa6a58'} />
      <circle cx="7" cy="-8" r="4" fill={mutant ? '#eee3c8' : '#aa6a58'} />
    </g>
  );
}
function Irradiate({ p }: { p: number }) {
  return (
    <div className="bio-mutation-irradiate">
      <div className="bio-mutation-vials">
        {[false, true].map((treated) => (
          <div key={String(treated)}>
            <b>{t(treated ? 'X射线处理' : '未照射对照')}</b>
            <svg
              viewBox="0 0 180 230"
              role="img"
              aria-label={t(treated ? '处理组果蝇培养瓶' : '对照果蝇培养瓶')}
            >
              <path
                d="M45 33V70L26 99V208Q90 223 154 208V99L135 70V33"
                fill="#edf0e5"
                stroke="#a4b0a0"
                strokeWidth="3"
              />
              <path d="M29 187Q90 178 151 187V207Q90 220 29 207Z" fill="#c4b69b" />
              <rect x="41" y="25" width="99" height="20" rx="7" fill="#c3bcaa" />
              <FlyGlyph x={89} y={129} />
              {treated && (
                <g opacity={ramp(p, 0, 0.3) * (1 - ramp(p, 0.7, 1))}>
                  <path
                    d="M15 55L64 105M42 47L77 101M73 46L90 99"
                    stroke="#ac9b76"
                    strokeWidth="3"
                    strokeDasharray="6 5"
                  />
                  <path d="M14 50L5 38H37L44 48Z" fill="#a89a80" />
                </g>
              )}
            </svg>
            <p>{t(treated ? '后代突变检出增加' : '建立自发突变基线')}</p>
          </div>
        ))}
      </div>
      <small>{t('教材定性比较；不显示虚构剂量、突变率或有利方向。')}</small>
    </div>
  );
}
function Inheritance({ lethal, p }: { lethal: boolean; p: number }) {
  const outcomes = recessiveLethalTest(lethal);
  return (
    <div className="bio-mutation-inherit">
      <div className="bio-mutation-cross">
        <b>♀ X* / X+ × ♂ X+ / Y</b>
        <span>{t('X*：被追踪的母系X染色体')}</span>
      </div>
      <div className="bio-mutation-offspring">
        {outcomes.map((o, i) => (
          <div key={o.id} style={{ opacity: 0.2 + 0.8 * ramp(p, i * 0.1, 0.4 + i * 0.1) }}>
            <b>
              {o.sex === 'male' ? '♂' : '♀'} {o.genotype}
            </b>
            <svg viewBox="0 0 100 90" aria-hidden="true">
              <g opacity={o.viable ? 1 : 0.2}>
                <FlyGlyph x={50} y={38} />
              </g>
              {!o.viable && <path d="M23 15L77 75M77 15L23 75" stroke="#a86e58" strokeWidth="3" />}
            </svg>
            <span>{t(o.viable ? '可存活' : '该类不能存活')}</span>
          </div>
        ))}
      </div>
      <small>{t('隐性致死检测的遗传逻辑示例，非缪勒完整历史筛选方案。')}</small>
    </div>
  );
}
function Association({ focus }: { focus: 'cases' | 'controls' }) {
  const a = smokingAssociation();
  return (
    <div className="bio-mutation-association">
      <div className="bio-mutation-bars">
        {(['cases', 'controls'] as const).map((g) => (
          <div key={g} className={focus === g ? 'active' : ''}>
            <b>{t(g === 'cases' ? '肺癌病例' : '健康对照')} · n = 1,303</b>
            <div>
              <span style={{ width: `${(smokingStudy[g].smoking / 1303) * 100}%` }} />
              <i style={{ width: `${(smokingStudy[g].notSmoking / 1303) * 100}%` }} />
            </div>
            <p>
              {t('吸烟者')} {smokingStudy[g].smoking} / 1,303 ={' '}
              {((smokingStudy[g].smoking / 1303) * 100).toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
      <p>
        <span className="bio-mutation-key" />
        {t('吸烟')}　<span className="bio-mutation-key pale" />
        {t('不吸烟')}
      </p>
      <p>
        {t('优势比')} = {a.oddsRatio.toFixed(2)} · {t('不是人群发病风险')}
      </p>
      <small>{t('单项病例对照资料支持关联；吸烟致癌的结论来自更广泛的证据。')}</small>
    </div>
  );
}
function Prepare({ step }: { step: number }) {
  const stage = coldSteps[step];
  return (
    <div className="bio-mutation-prepare">
      <div className="bio-mutation-protocol">
        {[
          '4 ℃ · 1周',
          '约25 ℃ · 根长约1 cm',
          '4 ℃ · 48–72 h',
          '固定 → 解离 → 漂洗 → 染色 → 制片',
        ].map((s, i) => (
          <span key={s} className={step === i ? 'active' : ''}>
            {t(s)}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 320 225" role="img" aria-label={t('蒜根尖低温诱导与固定装片示意')}>
        {step < 3 ? (
          <>
            <g opacity={step > 0 ? 1 : 0}>
              <path
                d="M49 91V207Q160 216 270 207V91"
                fill="#e1e9df"
                stroke="#a4b6aa"
                strokeWidth="3"
              />
              <path d="M51 108Q160 106 268 108V205Q160 213 51 205Z" fill="#bfd3d0" />
            </g>
            <path
              d="M112 81Q105 48 135 33Q151 16 164 31Q192 32 202 67Q202 91 175 103L133 104Z"
              fill="#ddd6bd"
              stroke="#aea68c"
              strokeWidth="2"
            />
            <path
              d="M136 35Q120 75 143 100M163 32Q147 74 159 103M183 41Q172 73 177 101"
              stroke="#beb497"
              fill="none"
              strokeWidth="2"
            />
            <path d="M133 104Q155 117 178 104" stroke="#9b977a" strokeWidth="5" />
            {step > 0 &&
              [0, 1, 2, 3, 4].map((i) => (
                <path
                  key={i}
                  d={`M${139 + i * 8} 108Q${134 + i * 9} 130 ${139 + i * 8} ${160 + (i % 3) * 14}`}
                  stroke="#eee8cf"
                  strokeWidth="3"
                  fill="none"
                />
              ))}
            <text x="245" y="49" fontSize="24" textAnchor="middle" fill="#698984">
              {stage.temperature} ℃
            </text>
          </>
        ) : (
          <>
            <rect
              x="40"
              y="75"
              width="240"
              height="95"
              rx="8"
              fill="#dce6df"
              stroke="#aabaae"
              strokeWidth="2"
            />
            <rect x="117" y="86" width="85" height="72" fill="#eaf0e7" stroke="#aabaae" />
            <path
              d="M144 105L151 144M163 103L168 140M180 108L176 145"
              stroke="#a79aaf"
              strokeWidth="8"
            />
            <text x="160" y="202" fontSize="20" textAnchor="middle" fill="#6f716d">
              {t('固定后细胞不再继续分裂')}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
function Mitosis({ blocked, p }: { blocked: boolean; p: number }) {
  const s = restitutionMitosis(p, blocked);
  return (
    <div className="bio-mutation-mitosis">
      <svg viewBox="0 0 320 225" role="img" aria-label={t('4条复制后染色体的简化分离与复原核模型')}>
        <rect
          x="20"
          y="14"
          width="280"
          height="195"
          rx="25"
          fill="#e1e7d8"
          stroke="#adbba5"
          strokeWidth="3"
        />
        {!blocked &&
          s.chromatids.map((c) => (
            <path
              key={c.id}
              d={`M${c.sister ? 279 : 41} 109L${c.x} ${c.y}`}
              stroke="#9daf93"
              opacity={1 - s.nuclei}
              strokeWidth="1.5"
            />
          ))}
        {blocked ? (
          <ellipse
            cx="160"
            cy="111"
            rx="56"
            ry="87"
            fill="#ccc8d5"
            fillOpacity={0.35 * s.nuclei}
            stroke="#a89eaf"
            strokeOpacity={s.nuclei}
          />
        ) : (
          <>
            {[78, 242].map((x) => (
              <ellipse
                key={x}
                cx={x}
                cy="111"
                rx="38"
                ry="83"
                fill="#ccc8d5"
                fillOpacity={0.35 * s.nuclei}
                stroke="#a89eaf"
                strokeOpacity={s.nuclei}
              />
            ))}
            <path
              d={`M160 ${111 - 97 * s.nuclei}V${111 + 97 * s.nuclei}`}
              stroke="#a5b59b"
              strokeWidth="4"
              opacity={s.nuclei}
            />
          </>
        )}
        {s.chromatids.map((c) => {
          const arm = c.sister ? 5 : -5;
          return (
            <g key={c.id}>
              <path
                d={`M${c.x - arm} ${c.y - 12}Q${c.x + arm} ${c.y - 4} ${c.x} ${c.y}Q${c.x - arm} ${c.y + 5} ${c.x + arm} ${c.y + 12}`}
                stroke={c.parent < 2 ? '#9a7f9c' : '#768f9a'}
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx={c.x} cy={c.y} r="3" fill="#e7dedb" />
            </g>
          );
        })}
      </svg>
      <div className="bio-mutation-chromcount">
        {t(blocked ? '分离受阻后的复原核示例' : '正常分离形成两个子细胞')} ·{' '}
        {p > 0.95 ? (blocked ? '8' : '4 + 4') : '4 → 8'}
      </div>
      <small>{t('机制缩减为2n = 4；真实蒜/洋葱本实验为2n = 16。')}</small>
    </div>
  );
}
function Field({ doubled, labels }: { doubled: boolean; labels: boolean }) {
  const list = countedChromosomes(doubled);
  return (
    <div className="bio-mutation-field">
      <svg
        viewBox="0 0 240 240"
        role="img"
        aria-label={t('固定细胞的染色体计数示意，不是显微照片')}
      >
        <circle cx="120" cy="120" r="116" fill="#ede6ef" stroke="#bdafc4" strokeWidth="3" />
        <path
          d="M38 30Q120 8 201 32L218 188Q129 226 35 194Z"
          fill="#e6dbe8"
          stroke="#d1c2d3"
          strokeWidth="2"
        />
        {list.map((c) => (
          <g key={c.id}>
            <g transform={`translate(${c.x} ${c.y}) rotate(${c.angle})`}>
              <path
                d="M-4 -9Q1 0 4 9M4 -9Q-1 0 -4 9"
                fill="none"
                stroke="#947098"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle r="2" fill="#d8bcca" />
            </g>
            {labels && (
              <text x={c.x} y={c.y + 17} fontSize="16" fill="#775779" textAnchor="middle">
                {c.id + 1}
              </text>
            )}
          </g>
        ))}
      </svg>
      <b>
        {doubled ? '32' : '16'} {t('条染色体')}
      </b>
      <small>{t('后续可辨识分裂象的计数示意；不代表全部处理细胞均加倍。')}</small>
    </div>
  );
}
const numberNames: Record<ChromosomeChange, string> = {
  normal: '二倍体示例',
  loss: '个别减少',
  gain: '个别增加',
  triploid: '三个完整组',
  tetraploid: '四个完整组',
  'haploid-diploid': '二倍体的配子发育成个体',
  'haploid-tetraploid': '四倍体的配子发育成个体',
};
function Sets({ kind }: { kind: ChromosomeChange }) {
  const list = chromosomeSets(kind);
  return (
    <div className="bio-mutation-sets">
      {kind.startsWith('haploid') && (
        <div className="bio-mutation-origin">
          <span>
            {t('原植株')}
            <b>
              {kind === 'haploid-diploid' ? 2 : 4} {t('组')}
            </b>
          </span>
          <i>→</i>
          <span>
            {t('配子')}
            <b>
              {kind === 'haploid-diploid' ? 1 : 2} {t('组')}
            </b>
          </span>
          <i>→</i>
          <span>
            {t('新个体')}
            <b>
              {kind === 'haploid-diploid' ? 1 : 2} {t('组')}
            </b>
          </span>
        </div>
      )}
      <svg viewBox="0 0 320 250" role="img" aria-label={t('按同源类型与完整染色体组比较数目')}>
        <rect
          x="21"
          y="15"
          width="278"
          height="220"
          rx="37"
          fill="#e2e7d9"
          stroke="#afbea6"
          strokeWidth="2"
        />
        {list.map((c) => (
          <g key={c.id} transform={`translate(${71 + c.type * 83} ${50 + c.set * 49})`}>
            <path
              d={`M-13 -13Q-5 -17 0 -6Q8 4 14 ${[18, 10, 3][c.type]}`}
              stroke={['#8e7e98', '#6f9097', '#b28d6b', '#8e9d75'][c.set]}
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            <circle cy="-6" r="3" fill="#ddd4d4" />
          </g>
        ))}
      </svg>
      <b>
        {t(numberNames[kind])} · {list.length} {t('条')}
      </b>
      <small>
        {t(
          kind.startsWith('haploid')
            ? '单倍体按配子来源判定，不一定只有一个染色体组。'
            : '此示例每组3条；增加一个成员不等于增加完整一组。',
        )}
      </small>
    </div>
  );
}
function Structure({ kind, p }: { kind: StructuralChange; p: number }) {
  const parts = structureSegments(kind, p);
  return (
    <div className="bio-mutation-structure">
      <svg viewBox="0 0 350 255" role="img" aria-label={t('可追踪染色体片段的数目与顺序变化')}>
        {parts.map((s) => (
          <g
            key={s.id}
            transform={`translate(${s.x} ${s.y}) rotate(${s.angle})`}
            opacity={s.opacity}
          >
            <path
              d="M-19 -11H12L20 0L12 11H-19Z"
              fill={s.chromosome ? '#75949a' : '#a186a1'}
              stroke={s.chromosome ? '#56787e' : '#806a83'}
              strokeWidth="1"
            />
            <text
              x="0"
              y="6"
              fontSize="23"
              textAnchor="middle"
              fill="white"
              transform={`rotate(${-s.angle})`}
            >
              {s.letter}
            </text>
          </g>
        ))}
      </svg>
      <b>
        {t(
          {
            deletion: '缺失：少了一个片段',
            duplication: '重复：同一片段增加拷贝',
            inversion: '倒位：顺序和方向改变',
            translocation: '易位：非同源染色体之间移接',
          }[kind],
        )}
      </b>
      <small>{t('字母代表大片段；示意结构结果，不模拟断裂修复的全部分子步骤。')}</small>
    </div>
  );
}
export default function BioMutationEvidence() {
  const f = useShowcase();
  const [mode, setMode] = useState<Mode>((f.variant as Mode) || 'irradiate');
  const [progress, setProgress] = useState(0.6);
  const [lethal, setLethal] = useState(true);
  const [blocked, setBlocked] = useState(true);
  const [doubled, setDoubled] = useState(true);
  const [labels, setLabels] = useState(false);
  const [number, setNumber] = useState<ChromosomeChange>('gain');
  const [structure, setStructure] = useState<StructuralChange>('deletion');
  const m = f.watch ? modes[Math.min(9, f.chapter)] : mode;
  const p = f.watch ? ease(ramp(f.chapterProgress, 0.08, 0.88)) : progress;
  const kind = f.watch
    ? m === 'copies'
      ? p < 0.5
        ? 'deletion'
        : 'duplication'
      : p < 0.5
        ? 'inversion'
        : 'translocation'
    : structure;
  const subp = f.watch ? (p < 0.5 ? p * 2 : (p - 0.5) * 2) : p;
  const nums = f.watch
    ? m === 'origin'
      ? p < 0.5
        ? 'haploid-diploid'
        : 'haploid-tetraploid'
      : (['normal', 'gain', 'triploid', 'tetraploid'] as const)[Math.min(3, Math.floor(p * 4))]
    : number;
  return (
    <div className="bio-mutation-scene">
      <div className="bio-mutation-stage">
        {m === 'irradiate' ? (
          <Irradiate p={p} />
        ) : m === 'inherit' ? (
          <Inheritance lethal={f.watch || lethal} p={p} />
        ) : m === 'association' ? (
          <Association focus={p < 0.5 ? 'cases' : 'controls'} />
        ) : m === 'prepare' ? (
          <Prepare step={Math.min(3, Math.floor(p * 4))} />
        ) : m === 'spindle' ? (
          <Mitosis blocked={f.watch || blocked} p={p} />
        ) : m === 'count' ? (
          <Field doubled={f.watch ? p > 0.4 : doubled} labels={!f.watch && labels} />
        ) : m === 'number' || m === 'origin' ? (
          <Sets kind={nums} />
        ) : (
          <Structure kind={kind} p={subp} />
        )}
      </div>
      {!f.watch && (
        <div className="bio-mutation-controls">
          <label>
            {t('观察证据')}
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              {modes.map((a, i) => (
                <option key={a} value={a}>
                  {t(names[i])}
                </option>
              ))}
            </select>
          </label>
          {m === 'inherit' ? (
            <button onClick={() => setLethal(!lethal)}>
              {t(lethal ? 'X*带隐性致死变异' : 'X*无该致死变异')}
            </button>
          ) : m === 'spindle' ? (
            <button onClick={() => setBlocked(!blocked)}>
              {t(blocked ? '纺锤体受抑制' : '正常纺锤体')}
            </button>
          ) : m === 'count' ? (
            <>
              <button onClick={() => setDoubled(!doubled)}>
                {t(doubled ? '观察加倍示例' : '观察正常示例')}
              </button>
              <button onClick={() => setLabels(!labels)}>
                {t(labels ? '隐藏计数标号' : '显示计数标号')}
              </button>
            </>
          ) : m === 'number' || m === 'origin' ? (
            <label>
              {t('数目状态')}
              <select
                value={number}
                onChange={(e) => setNumber(e.target.value as ChromosomeChange)}
              >
                {Object.entries(numberNames).map(([v, n]) => (
                  <option key={v} value={v}>
                    {t(n)}
                  </option>
                ))}
              </select>
            </label>
          ) : m === 'copies' || m === 'order' ? (
            <Segments
              label={t('结构变化')}
              value={structure}
              onChange={(v) => setStructure(v as StructuralChange)}
              options={(['deletion', 'duplication', 'inversion', 'translocation'] as const).map(
                (v, i) => ({ value: v, label: t(['缺失', '重复', '倒位', '易位'][i]) }),
              )}
            />
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
