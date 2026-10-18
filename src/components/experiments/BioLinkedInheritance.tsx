import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  xLinkedCross,
  inferTextbookPedigree,
  textbookPedigree,
  pedigreeFamilies,
  summarizeSurvey,
  surveySample,
  teachingPopulation,
  groupSurveySamples,
  type XFemale,
  type XMale,
  type XGenotype,
} from '../../models/bio-linked-inheritance';
import '../../styles/bio-linked-inheritance.css';
type Mode = 'parents' | 'f2' | 'test' | 'reciprocal' | 'dalton' | 'pedigree' | 'survey' | 'pooling';
const modes: Mode[] = [
  'parents',
  'f2',
  'test',
  'reciprocal',
  'dalton',
  'pedigree',
  'survey',
  'pooling',
];
const names = [
  '果蝇亲本杂交',
  'F2按性别分组',
  '白眼测交',
  '交换亲本性别',
  '比较色觉观察记录',
  '教材三代系谱',
  '人群抽样与分母',
  '汇总、加权与去重',
];
const crosses: Record<string, [XFemale, XMale]> = {
  parents: ['BB', 'bY'],
  f2: ['Bb', 'BY'],
  test: ['Bb', 'bY'],
  reciprocal: ['bb', 'BY'],
};
const gene = (g: string, fly = false) =>
  [...g]
    .map((a) => (a === 'Y' ? 'Y' : `X${a === 'B' ? (fly ? 'ᵂ' : 'ᴮ') : fly ? 'ʷ' : 'ᵇ'}`))
    .join('');
function Fly({ male, white }: { male: boolean; white: boolean }) {
  return (
    <svg viewBox="0 0 120 135" aria-hidden="true">
      <g fill="none" stroke="#8d8872" strokeWidth="2.2">
        {[-1, 1].map((side) => (
          <g key={side}>
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M${60 + side * 10} ${51 + i * 12}L${60 + side * 31} ${44 + i * 17}L${60 + side * 40} ${35 + i * 26}`}
              />
            ))}
          </g>
        ))}
      </g>
      <path
        d={
          male
            ? 'M43 70Q35 97 49 112Q60 123 73 110Q84 94 77 70Z'
            : 'M43 70Q35 95 60 128Q85 95 77 70Z'
        }
        fill={male ? '#8a8070' : '#b2a789'}
        stroke="#8d846d"
      />
      <path d="M43 84H77M44 95H76M50 107H70" stroke="#776f61" strokeWidth="3" />
      <ellipse
        cx="42"
        cy="76"
        rx="15"
        ry="39"
        transform="rotate(27 42 76)"
        fill="#e8e7d7"
        fillOpacity=".75"
        stroke="#b7bdab"
      />
      <ellipse
        cx="78"
        cy="76"
        rx="15"
        ry="39"
        transform="rotate(-27 78 76)"
        fill="#e8e7d7"
        fillOpacity=".75"
        stroke="#b7bdab"
      />
      <path d="M26 108L53 46M94 108L67 46" stroke="#c3c5b5" fill="none" />
      <ellipse cx="60" cy="56" rx="15" ry="22" fill="#aaa285" />
      <ellipse cx="60" cy="29" rx="19" ry="15" fill="#b8ac90" />
      <ellipse
        cx="46"
        cy="28"
        rx="9"
        ry="11"
        fill={white ? '#f3edda' : '#ab626c'}
        stroke="#9f8073"
      />
      <ellipse
        cx="74"
        cy="28"
        rx="9"
        ry="11"
        fill={white ? '#f3edda' : '#ab626c'}
        stroke="#9f8073"
      />
      <path d="M54 15L48 6M66 15L72 6" stroke="#8b826c" strokeWidth="2" />
    </svg>
  );
}
const inferred = inferTextbookPedigree();
function PedigreeNode({
  id,
  x,
  y,
  focus,
  reveal,
  shortLabel = false,
  labelSize = 17,
}: {
  id: string;
  x: number;
  y: number;
  focus: string;
  reveal: boolean;
  shortLabel?: boolean;
  labelSize?: number;
}) {
  const person = textbookPedigree.find((p) => p.id === id)!,
    carrier = reveal && inferred[id].length === 1 && inferred[id][0] === 'Bb';
  return (
    <g>
      <g transform={`translate(${x} ${y})`}>
        {person.sex === 'male' ? (
          <rect
            x="-13"
            y="-13"
            width="26"
            height="26"
            rx="2"
            fill={person.affected ? '#9c818e' : '#f1eedf'}
            stroke={id === focus ? '#705e76' : '#a1a18c'}
            strokeWidth={id === focus ? 3 : 1.5}
          />
        ) : (
          <circle
            r="13"
            fill={person.affected ? '#9c818e' : '#f1eedf'}
            stroke={id === focus ? '#705e76' : '#a1a18c'}
            strokeWidth={id === focus ? 3 : 1.5}
          />
        )}{' '}
        {carrier && <circle r="4" fill="#9c818e" />}
      </g>
      <text x={x} y={y + 31} textAnchor="middle" fontSize={labelSize} fill="#737967">
        {shortLabel ? person.number : id}
      </text>
    </g>
  );
}
function Pedigree({
  compact,
  branch,
  focus,
  reveal,
}: {
  compact: boolean;
  branch: number;
  focus: string;
  reveal: boolean;
}) {
  const family = pedigreeFamilies[branch + 1],
    proband = ['II-2', 'II-3', 'II-5'][branch];
  if (compact) {
    const childXs = family.children.map((_, i) => 30 + ((i + 0.5) * 240) / family.children.length);
    return (
      <svg
        viewBox="0 0 300 275"
        role="img"
        aria-label={t('保留教材家系关系，实心表示观察到的受影响表型，圆点表示推断携带者')}
      >
        <path
          d="M103 34H197M150 34V76H100V111M113 124H187M150 124V185"
          fill="none"
          stroke="#b1b39a"
          strokeWidth="1.5"
        />
        <path
          d={`M${childXs[0]} 206V185H${childXs.at(-1)}V206`}
          fill="none"
          stroke="#b1b39a"
          strokeWidth="1.5"
        />
        {childXs.map((x) => (
          <path key={x} d={`M${x} 185V206`} stroke="#b1b39a" />
        ))}
        <PedigreeNode id="I-1" x={90} y={34} focus={focus} reveal={reveal} labelSize={20} />
        <PedigreeNode id="I-2" x={210} y={34} focus={focus} reveal={reveal} labelSize={20} />
        <PedigreeNode id={proband} x={100} y={124} focus={focus} reveal={reveal} labelSize={20} />
        <PedigreeNode
          id={proband === family.mother ? family.father : family.mother}
          x={200}
          y={124}
          focus={focus}
          reveal={reveal}
          labelSize={20}
        />
        {family.children.map((id, i) => (
          <PedigreeNode
            key={id}
            id={id}
            x={childXs[i]}
            y={220}
            focus={focus}
            reveal={reveal}
            labelSize={20}
            shortLabel
          />
        ))}
        <text x="8" y="269" fontSize="20" fill="#858a74">
          III
        </text>
      </svg>
    );
  }
  const positions: Record<string, [number, number]> = {
    'I-1': [300, 35],
    'I-2': [390, 35],
    'II-1': [75, 135],
    'II-2': [135, 135],
    'II-3': [285, 135],
    'II-4': [345, 135],
    'II-5': [495, 135],
    'II-6': [555, 135],
  };
  [
    [25, 75, 125, 175],
    [275, 355],
    [435, 475, 515, 555, 595, 635],
  ].forEach((xs, b) =>
    xs.forEach((x, i) => (positions[pedigreeFamilies[b + 1].children[i]] = [x, 245])),
  );
  return (
    <svg viewBox="0 0 670 290" role="img" aria-label={t('教材P35完整系谱：三代二十人')}>
      <path
        d="M313 35H377M345 35V84H135V122M345 84H495V122M285 84V122"
        fill="none"
        stroke="#b1b39a"
        strokeWidth="1.5"
      />
      {pedigreeFamilies.slice(1).map((fam, i) => {
        const a = positions[fam.mother],
          b = positions[fam.father],
          mid = (a[0] + b[0]) / 2,
          xs = fam.children.map((id) => positions[id][0]);
        return (
          <g key={i}>
            <path
              d={`M${a[0]} 135H${b[0]}M${mid} 135V195M${xs[0]} 232V195H${xs.at(-1)}V232`}
              fill="none"
              stroke="#b1b39a"
              strokeWidth="1.5"
            />
            {xs.map((x) => (
              <path key={x} d={`M${x} 195V232`} stroke="#b1b39a" />
            ))}
          </g>
        );
      })}
      {textbookPedigree.map((person) => (
        <PedigreeNode
          key={person.id}
          id={person.id}
          x={positions[person.id][0]}
          y={positions[person.id][1]}
          focus={focus}
          reveal={reveal}
        />
      ))}
    </svg>
  );
}
export default function BioLinkedInheritance() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      modes.includes(f.variant as Mode) ? (f.variant as Mode) : 'parents',
    ),
    [progress, setProgress] = useState(0.7),
    [mother, setMother] = useState<XFemale>('Bb'),
    [father, setFather] = useState<XMale>('BY'),
    [custom, setCustom] = useState(false),
    [person, setPerson] = useState('III-6'),
    [branch, setBranch] = useState(1),
    [sampleSize, setSampleSize] = useState(80),
    [biased, setBiased] = useState(false),
    [seed, setSeed] = useState(23),
    [sex, setSex] = useState<'all' | 'female' | 'male'>('all'),
    [duplicates, setDuplicates] = useState(false);
  const m = f.watch ? modes[Math.min(7, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.04, 0.9)) : progress,
    pair = !f.watch && custom ? ([mother, father] as [XFemale, XMale]) : (crosses[m] ?? crosses.f2),
    outcomes = xLinkedCross(...pair),
    index = Math.min(outcomes.length - 1, Math.floor(p * outcomes.length)),
    outcome = outcomes[index],
    q = p === 1 ? 1 : p * outcomes.length - index,
    focus = f.watch ? (p < 0.3 ? 'I-1' : p < 0.65 ? 'II-3' : 'III-6') : person,
    reveal = f.watch ? p > 0.35 : p > 0.35,
    activeBranch = f.watch ? 1 : branch,
    selection = surveySample(
      f.watch ? Math.floor(20 + p * 180) : sampleSize,
      f.watch ? false : biased,
      f.watch ? 23 : seed,
    ),
    selectedIds = new Set(selection.map((r) => r.id)),
    summary = summarizeSurvey(selection, f.watch ? 'all' : sex),
    pooledRecords = [
      ...groupSurveySamples.flat(),
      ...(!f.watch && duplicates ? groupSurveySamples[0].slice(0, 5) : []),
    ],
    pooled = summarizeSurvey(pooledRecords, f.watch ? 'all' : sex);
  return (
    <section className="bio-linked" data-watch={f.watch} data-mode={m}>
      <p className="bio-linked-kind">{t(names[modes.indexOf(m)])}</p>
      {['parents', 'f2', 'test', 'reciprocal'].includes(m) ? (
        <>
          <div className="bio-linked-parents">
            <div>
              <Fly male={false} white={pair[0] === 'bb'} />
              <span>♀ {gene(pair[0], true)}</span>
            </div>
            <b>×</b>
            <div>
              <Fly male white={pair[1] === 'bY'} />
              <span>♂ {gene(pair[1], true)}</span>
            </div>
          </div>
          <div className="bio-linked-transfer">
            <span>
              {t('母方配子')} {gene(outcome.maternal, true)}
            </span>
            <span>
              {t('父方配子')} {gene(outcome.paternal, true)}
            </span>
          </div>
          <svg className="bio-linked-gamete-path" viewBox="0 0 330 95" aria-hidden="true">
            <path
              d="M85 15Q85 64 149 78M245 15Q245 64 181 78"
              fill="none"
              stroke="#c3c3ab"
              strokeWidth="1.5"
            />
            {[0, 1].map((side) => {
              const allele = side ? outcome.paternal : outcome.maternal,
                x = side ? 245 - 64 * ease(q) : 85 + 64 * ease(q),
                y = 15 + 63 * ease(q);
              return (
                <g key={side}>
                  <path
                    d={`M${x} ${y - 10}V${y + (allele === 'Y' ? 4 : 10)}`}
                    stroke={side ? '#8e9f7d' : '#ac869e'}
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {allele !== 'Y' && (
                    <circle
                      cx={x}
                      cy={y - 3}
                      r="3"
                      fill={allele === 'B' ? '#ad606a' : '#f4ecdb'}
                      stroke="#9a7d70"
                    />
                  )}
                </g>
              );
            })}
          </svg>
          <div className="bio-linked-offspring">
            {outcomes.map((c, i) => (
              <div key={`${c.maternal}-${c.paternal}`} data-active={i === index}>
                <Fly male={c.sex === 'male'} white={c.affected} />
                <span>
                  {c.sex === 'male' ? '♂' : '♀'} {gene(c.genotype, true)}
                </span>
                <strong>{(c.probability * 100).toFixed(0)}%</strong>
                <span>{t(c.affected ? '白眼' : '红眼')}</span>
              </div>
            ))}
          </div>
          <p className="bio-linked-note">{t('典型二倍体果蝇的X连锁模型；百分比为理论预测。')}</p>
        </>
      ) : m === 'dalton' ? (
        <>
          <div className="bio-linked-flower-observation">
            <svg viewBox="0 0 180 210" aria-hidden="true">
              <path
                d="M90 195V95M90 163Q43 131 49 165Q62 179 90 163"
                fill="#a7b68d"
                stroke="#91a174"
                strokeWidth="3"
              />
              {Array.from({ length: 5 }, (_, i) => (
                <ellipse
                  key={i}
                  cx="90"
                  cy="64"
                  rx="23"
                  ry="39"
                  transform={`rotate(${i * 72} 90 95)`}
                  fill="#c8a4b2"
                  stroke="#af8b9c"
                />
              ))}
              <circle cx="90" cy="95" r="14" fill="#c5b47d" />
            </svg>
            <div>
              <div className="bio-linked-lights">
                <span data-active={p < 0.5}>☀ {t('日光')}</span>
                <span data-active={p >= 0.5}>◐ {t('烛光')}</span>
              </div>
              <dl>
                <dt>{t('道尔顿与弟弟')}</dt>
                <dd>{t('报告两种照明下颜色不同')}</dd>
                <dt>{t('其他观察者')}</dt>
                <dd>{t('报告粉红色')}</dd>
              </dl>
            </div>
          </div>
          <p className="bio-linked-note">{t('比较历史观察记录；花朵图不模拟某个人的精确色觉。')}</p>
        </>
      ) : m === 'pedigree' ? (
        <>
          <div className="bio-linked-pedigree-wide">
            <Pedigree compact={false} branch={activeBranch} focus={focus} reveal={reveal} />
          </div>
          <div className="bio-linked-pedigree-small">
            <Pedigree compact branch={activeBranch} focus={focus} reveal={reveal} />
          </div>
          <div className="bio-linked-genotype">
            <strong>{focus}</strong>
            <span>{inferred[focus].map((g) => gene(g)).join(' / ')}</span>
            <span>
              {t(inferred[focus].length > 1 ? '现有资料不能唯一确定' : '在本模型假设下可确定')}
            </span>
          </div>
          <div className="bio-linked-legend">
            <span>■ / ● {t('观察到受影响表型')}</span>
            <span>⊙ {t('由家系推断携带者')}</span>
          </div>
        </>
      ) : m === 'survey' ? (
        <>
          <svg
            className="bio-linked-population"
            viewBox="0 0 330 225"
            role="img"
            aria-label={t('固定合成人群中选取样本，以被调查人数作为分母')}
          >
            {teachingPopulation.map((r) => {
              const x = 18 + (r.id % 20) * 15.4,
                y = 18 + Math.floor(r.id / 20) * 21;
              return (
                <g key={r.id} opacity={selectedIds.has(r.id) ? 1 : 0.2}>
                  {r.sex === 'male' ? (
                    <rect
                      x={x - 4.5}
                      y={y - 4.5}
                      width="9"
                      height="9"
                      rx="1.5"
                      fill={r.affected ? '#a58093' : '#bcc8a8'}
                    />
                  ) : (
                    <circle cx={x} cy={y} r="4.5" fill={r.affected ? '#a58093' : '#bcc8a8'} />
                  )}
                </g>
              );
            })}
          </svg>
          <div className="bio-linked-survey-result">
            <span>
              {t('受影响人数')} {summary.affected}
            </span>
            <span>
              {t('被调查人数')} {summary.total}
            </span>
            <strong>
              {summary.proportion === null ? '—' : (summary.proportion * 100).toFixed(2) + '%'}
            </strong>
          </div>
          <p className="bio-linked-note">{t('200人的合成练习资料，不是任何真实人群的患病率。')}</p>
        </>
      ) : (
        <>
          <div className="bio-linked-pooling">
            {groupSurveySamples.map((sample, i) => {
              const s = summarizeSurvey(sample, f.watch ? 'all' : sex);
              return (
                <div key={i} style={{ opacity: f.watch && i === 1 ? 0.25 + 0.75 * p : 1 }}>
                  <span>{t(i ? '第二组' : '第一组')}</span>
                  <strong>
                    {s.affected} / {s.total}
                  </strong>
                  <span>{(s.proportion! * 100).toFixed(2)}%</span>
                </div>
              );
            })}
            <div className="bio-linked-pooled">
              <span>{t('合并唯一受访者')}</span>
              <strong>
                {pooled.affected} / {pooled.total}
              </strong>
              <span>{(pooled.proportion! * 100).toFixed(2)}%</span>
            </div>
          </div>
          <p className="bio-linked-note">
            {t('按总人数加权，并先去除重复登记。')}{' '}
            {pooled.duplicatesRemoved > 0 && `${t('去重人数')} ${pooled.duplicatesRemoved}`}
          </p>
        </>
      )}
      {!f.watch && (
        <div className="bio-linked-controls">
          <Segments
            label={t('证据类型')}
            value={mode}
            onChange={setMode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          {!['survey', 'pooling'].includes(m) && (
            <Range
              label={t('过程进度')}
              value={progress}
              min={0}
              max={1}
              step={0.001}
              onChange={setProgress}
            />
          )}{' '}
          {['parents', 'f2', 'test', 'reciprocal'].includes(m) && (
            <>
              <button type="button" aria-pressed={custom} onClick={() => setCustom(!custom)}>
                {t(custom ? '使用自定义亲本' : '使用教材亲本')}
              </button>
              {custom && (
                <>
                  <Segments
                    label={t('母本基因型')}
                    value={mother}
                    onChange={setMother}
                    options={(['BB', 'Bb', 'bb'] as const).map((value) => ({
                      value,
                      label: gene(value, true),
                    }))}
                  />
                  <Segments
                    label={t('父本基因型')}
                    value={father}
                    onChange={setFather}
                    options={(['BY', 'bY'] as const).map((value) => ({
                      value,
                      label: gene(value, true),
                    }))}
                  />
                </>
              )}
            </>
          )}
          {m === 'pedigree' && (
            <>
              <Segments
                label={t('手机展示支系')}
                value={String(branch)}
                onChange={(value) => {
                  setBranch(Number(value));
                  setPerson(['II-2', 'II-3', 'II-5'][Number(value)]);
                }}
                options={[
                  { value: '0', label: 'II-2' },
                  { value: '1', label: 'II-3' },
                  { value: '2', label: 'II-5' },
                ]}
              />
              <label>
                {t('读取个体的可能基因型')}
                <select
                  value={person}
                  onChange={(e) => {
                    const id = e.target.value;
                    setPerson(id);
                    const b = pedigreeFamilies
                      .slice(1)
                      .findIndex(
                        (fam) =>
                          fam.children.includes(id) || fam.mother === id || fam.father === id,
                      );
                    if (b >= 0) setBranch(b);
                  }}
                >
                  {textbookPedigree.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {(m === 'survey' || m === 'pooling') && (
            <Segments
              label={t('统计分母')}
              value={sex}
              onChange={setSex}
              options={[
                { value: 'all', label: t('全体') },
                { value: 'male', label: t('男性') },
                { value: 'female', label: t('女性') },
              ]}
            />
          )}{' '}
          {m === 'survey' && (
            <>
              <Range
                label={t('抽样人数')}
                value={sampleSize}
                min={10}
                max={200}
                step={10}
                onChange={setSampleSize}
              />
              <button type="button" aria-pressed={biased} onClick={() => setBiased(!biased)}>
                {t(biased ? '只选已有受影响成员的家庭' : '从整个人群抽样')}
              </button>
              <button type="button" onClick={() => setSeed(seed + 1)}>
                {t('重新抽样')}
              </button>
            </>
          )}
          {m === 'pooling' && (
            <button
              type="button"
              aria-pressed={duplicates}
              onClick={() => setDuplicates(!duplicates)}
            >
              {t(duplicates ? '含5条重复登记' : '没有重复登记')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
