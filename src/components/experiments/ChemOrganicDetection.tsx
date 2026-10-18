import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  names,
  testSample,
  candidates,
  candidateGroups,
  aspirinEvidence,
  synthesisSteps,
  branchYield,
  esterAtoms,
  nmrPatterns,
  identificationDemo,
  type Sample,
  type Test,
} from '../../models/chem-organic-detection';
import '../../styles/chem-organic-detection.css';
const modes = [
  'retrosynthesis',
  'forward',
  'alkene',
  'halide',
  'phenol',
  'aldehyde',
  'identify',
  'aspirin',
  'nmr',
] as const;
type Mode = (typeof modes)[number];
const titles = [
  '逆推两个酯键',
  '分支合成路线',
  '碳碳双键的检验',
  '水解后检验卤素',
  '酚羟基的证据',
  '醛基的还原检验',
  '组合证据鉴别样品',
  '阿司匹林的两个官能团',
  '核磁共振作为补充证据',
];
const testNames: Record<Test, string> = {
  water: '与水混合',
  bromine: '溴水',
  permanganate: '酸性 KMnO₄',
  halide: '水解、酸化后加 AgNO₃',
  iron: 'FeCl₃',
  copper: '新制 Cu(OH)₂ / 加热',
};
const resultNames: Record<string, string> = {
  upper: '上层有机相',
  lower: '下层有机相',
  mixed: '与水互溶或水溶液',
  unchanged: '所示检验无该阳性',
  addition: '溴加成：褪色',
  substitution: '取代：白色三溴苯酚',
  oxidation: '醛被氧化也可褪色',
  partition: '萃取：颜色转移，未消耗',
  'nonspecific-oxidation': '氧化褪色，不专属于 C=C',
  'invalid-preparation': '未排除 OH⁻ 干扰',
  bromide: '浅黄色 AgBr',
  chloride: '白色 AgCl',
  phenolic: '酚类配合显色',
  aldehyde: '砖红色 Cu₂O',
};
function TestTube({
  sample,
  test,
  p,
  prepared = true,
}: {
  sample: Sample;
  test: Test;
  p: number;
  prepared?: boolean;
}) {
  const uid = useId().replace(/:/g, ''),
    r = testSample(sample, test, prepared),
    split = r.layer !== 'mixed' && (test === 'water' || test === 'bromine'),
    reaction = ['addition', 'substitution', 'oxidation', 'nonspecific-oxidation'].includes(
      r.result,
    ),
    color =
      test === 'bromine'
        ? reaction
          ? `rgba(190,150,86,${1 - p * 0.95})`
          : r.color
        : test === 'permanganate' && reaction
          ? `rgba(150,112,168,${1 - p * 0.95})`
          : r.color;
  return (
    <svg viewBox="0 0 170 240" role="img" aria-label={t(names[sample]) + ': ' + t(testNames[test])}>
      <defs>
        <clipPath id={uid}>
          <path d="M40 25V180Q40 218 85 218T130 180V25Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid})`}>
        <rect x="40" y="65" width="90" height="155" fill="#d5e2d7" />
        {split && (
          <rect
            x="40"
            y={r.layer === 'upper' ? 65 : 145}
            width="90"
            height={r.layer === 'upper' ? 80 : 75}
            fill={test === 'bromine' ? color : '#e4dcc0'}
          />
        )}
        <rect
          x="40"
          y={split && r.layer === 'upper' ? 145 : 65}
          width="90"
          height={split ? 80 : 155}
          fill={split && r.result === 'partition' ? '#d8d5ba' : color}
          opacity={test === 'water' ? 0.3 : 1}
        />
        {r.precipitate !== 'none' &&
          Array.from({ length: 28 }, (_, i) => (
            <ellipse
              key={i}
              cx={48 + ((i * 19) % 74)}
              cy={206 - (i % 5) * 6}
              rx="4"
              ry="2.5"
              fill={
                r.precipitate === 'red'
                  ? '#b67a55'
                  : r.precipitate === 'brown'
                    ? '#96775a'
                    : r.precipitate === 'cream'
                      ? '#e7d9a8'
                      : '#fcfaed'
              }
              stroke="#c4bd9e"
              strokeWidth=".5"
              opacity={p}
            />
          ))}{' '}
      </g>
      <path d="M36 21V180Q36 222 85 222T134 180V21" stroke="#98ac9a" strokeWidth="2" fill="none" />
      <path d="M47 37V180" stroke="#fff" strokeWidth="2.5" opacity=".7" />
    </svg>
  );
}
function Ester({ mobile, p }: { mobile: boolean; p: number }) {
  const a = esterAtoms(mobile, p);
  return (
    <svg
      className={mobile ? 'cod-mobile' : 'cod-desktop'}
      viewBox={mobile ? '0 0 260 330' : '0 0 560 220'}
      role="img"
      aria-label={t('乙二酸二乙酯逆推为乙二酸和两份乙醇')}
    >
      <g stroke="#91a28d" strokeWidth="2.5">
        {a.slice(1).map((v, i) => (
          <path
            key={i}
            d={`M${a[i].x} ${a[i].y}L${v.x} ${v.y}`}
            opacity={i === 2 || i === 4 ? 1 - p : 1}
          />
        ))}
        {[3, 4].map((i) => {
          const n = a[i],
            sg = i === 3 ? -1 : 1;
          return mobile ? (
            <path
              key={i}
              d={`M${n.x + 14} ${n.y - 3}H${n.x + 52}M${n.x + 14} ${n.y + 3}H${n.x + 52}`}
            />
          ) : (
            <path
              key={i}
              d={`M${n.x - 3} ${n.y + sg * 14}V${n.y + sg * 48}M${n.x + 3} ${n.y + sg * 14}V${n.y + sg * 48}`}
            />
          );
        })}
      </g>
      {a.map((n) => (
        <g key={n.id}>
          <rect x={n.x - 22} y={n.y - 14} width="44" height="27" rx="9" fill="#f5f2df" />
          <text
            x={n.x}
            y={n.y + 7}
            textAnchor="middle"
            fill={n.fragment === 'acid' ? '#ad8c5f' : '#729c86'}
          >
            {n.label}
          </text>
        </g>
      ))}
      {[3, 4].map((i) => {
        const n = a[i],
          sg = i === 3 ? -1 : 1;
        return (
          <g key={i}>
            <text
              x={mobile ? n.x + 67 : n.x}
              y={mobile ? n.y + 7 : n.y + sg * 61 + 7}
              textAnchor="middle"
              fill="#a17d68"
            >
              O
            </text>
            <g opacity={p}>
              <path
                d={
                  mobile
                    ? `M${n.x - 14} ${n.y}H${n.x - 50}`
                    : `M${n.x} ${n.y - sg * 14}V${n.y - sg * 45}`
                }
                stroke="#a89b7d"
                strokeWidth="2"
              />
              <text
                x={mobile ? n.x - 66 : n.x}
                y={mobile ? n.y + 7 : n.y - sg * 60 + 7}
                textAnchor="middle"
              >
                OH
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
function Aspirin({ hydrolysis, valid }: { hydrolysis: boolean; valid: boolean }) {
  const r = aspirinEvidence(hydrolysis, valid),
    nodes = Array.from({ length: 6 }, (_, i) => ({
      x: 100 + 48 * Math.cos(-Math.PI / 2 + (i * Math.PI) / 3),
      y: 100 + 48 * Math.sin(-Math.PI / 2 + (i * Math.PI) / 3),
    }));
  return (
    <div className="cod-aspirin">
      <svg viewBox="0 0 300 210" role="img" aria-label={t('阿司匹林的羧基保留，水解使酚羟基显露')}>
        <path
          d={nodes.map((v, i) => `${i ? 'L' : 'M'}${v.x} ${v.y}`).join(' ') + 'Z'}
          stroke="#8f9e83"
          fill="none"
          strokeWidth="3"
        />
        <circle cx="100" cy="100" r="27" stroke="#a5b394" fill="none" />
        <path d="M100 52V27M142 76H173" stroke="#8f9e83" strokeWidth="2.5" />
        <text x="100" y="22" textAnchor="middle">
          COOH
        </text>
        <text x="180" y="83">
          {hydrolysis ? 'OH' : 'OCOCH₃'}
        </text>
        <rect x="36" y="168" width="85" height="18" rx="5" fill="#b88d8e" />
        <circle cx="233" cy="160" r="23" fill={r.ironPositive ? '#9473a5' : '#d9deca'} />
      </svg>
      <div className="cod-aspirin-labels">
        <span>{t('另一水样：石蕊显酸性')}</span>
        <span>
          {t(
            !valid
              ? '过量酸未中和，不能作此判断'
              : r.ironPositive
                ? '水解后 FeCl₃ 阳性'
                : '原酚羟基被酯化保护',
          )}
        </span>
      </div>
    </div>
  );
}
export default function ChemOrganicDetection({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      modes.includes(variant as Mode) ? (variant as Mode) : 'retrosynthesis',
    ),
    [p0, setP] = useState(1),
    [sample, setSample] = useState<Sample>(
      variant === 'halide'
        ? 'bromobutane'
        : variant === 'phenol'
          ? 'phenol'
          : variant === 'aldehyde'
            ? 'ethanal'
            : 'hexene',
    ),
    [test, setTest] = useState<Test>(
      variant === 'halide'
        ? 'halide'
        : variant === 'phenol'
          ? 'iron'
          : variant === 'aldehyde'
            ? 'copper'
            : 'bromine',
    ),
    [prepared, setPrepared] = useState('yes'),
    [group, setGroup] = useState('0'),
    [observations, setObservations] = useState<{ test: Test; result: string }[]>([]),
    [hydrolyzed, setHydrolyzed] = useState('yes'),
    [neutralized, setNeutralized] = useState('yes'),
    [yieldStep, setYield] = useState(0.7),
    [nmr, setNmr] = useState('ethanol');
  const m = f.watch ? modes[Math.min(8, f.chapter)] : mode,
    p = f.watch ? f.chapterProgress : p0,
    q = f.watch ? ease(ramp(p, 0.1, 0.85)) : p0,
    defaults: Record<string, [Sample, Test]> = {
      alkene: ['hexene', p > 0.5 ? 'permanganate' : 'bromine'],
      halide: ['bromobutane', 'halide'],
      phenol: ['phenol', p > 0.5 ? 'iron' : 'bromine'],
      aldehyde: ['ethanal', 'copper'],
    },
    s = f.watch ? (defaults[m]?.[0] ?? 'hexene') : sample,
    tt = f.watch ? (defaults[m]?.[1] ?? 'water') : test,
    ng = f.watch ? Math.min(1, Math.floor(p * 2)) : Number(group),
    demo = identificationDemo(ng, Math.min(1, p * 2 - ng)),
    cs = candidates(ng, f.watch ? demo.observations : observations),
    hy = f.watch ? p > 0.42 : hydrolyzed === 'yes',
    ne = f.watch ? p > 0.7 : neutralized === 'yes',
    ny = f.watch ? 'ethanol' : nmr,
    pat = nmrPatterns[ny as keyof typeof nmrPatterns],
    by = branchYield(f.watch ? 0.7 : yieldStep);
  return (
    <div className={`cod ${f.watch ? 'is-watch' : ''}`}>
      <div className="cod-stage">
        {m === 'retrosynthesis' ? (
          <>
            <Ester mobile={false} p={q} />
            <Ester mobile p={q} />
            <p className="cod-plan-label">{t('逆推符号 ≠ 实际分解反应')}</p>
            <p className="cod-plan-label">{t('目标：乙二酸二乙酯 → 乙二酸 + 2 乙醇')}</p>
          </>
        ) : m === 'forward' ? (
          <>
            <div className="cod-current-formula">
              {
                [
                  'CH₂=CH₂ → CH₃CH₂OH',
                  'CH₂=CH₂ → ClCH₂CH₂Cl',
                  'ClCH₂CH₂Cl → HOCH₂CH₂OH',
                  'HOCH₂CH₂OH → HOOC—COOH',
                  'HOOC—COOH + 2 C₂H₅OH → C₂H₅OOC—COOC₂H₅',
                ][Math.min(4, Math.floor(p * 5))]
              }
            </div>
            <div className="cod-route">
              {synthesisSteps.map((a, i) => (
                <div
                  key={a.id}
                  className={[
                    i <= Math.floor(p * 5) ? 'active' : '',
                    i === Math.min(4, Math.floor(p * 5)) ? 'current' : '',
                  ].join(' ')}
                >
                  <b>{i + 1}</b>
                  <span>
                    {t(
                      {
                        hydrate: '乙烯 → 乙醇（支路）',
                        chlorinate: '乙烯 → 1,2-二氯乙烷',
                        hydrolyze: '1,2-二氯乙烷 → 乙二醇',
                        oxidize: '乙二醇 → 乙二酸',
                        esterify: '乙二酸 + 2 乙醇 → 目标酯',
                      }[a.id],
                    )}
                  </span>
                  <small>{t(a.condition)}</small>
                </div>
              ))}
            </div>
            <p className="cod-plan-label">
              {t('等步产率假设；按两条支路的受限物料合并')} <b>{(by.target * 100).toFixed(1)}%</b>
            </p>
          </>
        ) : m === 'aspirin' ? (
          <Aspirin hydrolysis={hy} valid={ne} />
        ) : m === 'nmr' ? (
          <div className="cod-nmr">
            <svg
              viewBox="0 0 500 225"
              role="img"
              aria-label={t('按氢环境与积分构造的示意谱，不是教材实测谱')}
            >
              <path d="M25 165H480" stroke="#93a38e" strokeWidth="2" />
              {Object.entries(nmrPatterns)
                .filter(([key]) => f.watch || key === ny)
                .map(([key, v], j) => (
                  <g
                    key={key}
                    transform={`translate(0 ${f.watch ? j * -48 : 0})`}
                    opacity={f.watch ? ease(ramp(p, j * 0.26, j * 0.26 + 0.18)) : 1}
                  >
                    {v.positions.map((shift, i) => {
                      const x = 470 - (shift / 12) * 430;
                      return (
                        <path
                          key={i}
                          d={`M${x - 5} 165Q${x - 2} ${165 - v.areas[i] * 12} ${x} ${165 - v.areas[i] * 16}Q${x + 2} ${165 - v.areas[i] * 12} ${x + 5} 165`}
                          stroke={['#829d8a', '#b39b70', '#9b86a8'][j]}
                          strokeWidth="2"
                          fill="none"
                        />
                      );
                    })}
                    <text x="30" y="156">
                      {key === 'ethanol' ? '①' : key === 'acetic' ? '②' : '③'}
                    </text>
                  </g>
                ))}
              {[0, 3, 6, 9, 12].map((v) => (
                <text key={v} x={470 - (v / 12) * 430} y="195" textAnchor="middle">
                  {v}
                </text>
              ))}
              <text x="480" y="222" textAnchor="end">
                δ / ppm
              </text>
            </svg>
            <p>
              ① {t('乙醇')} 3:2:1　② {t('乙酸')} 3:1　③ {t('乙酸乙酯')} 3:2:3
            </p>
          </div>
        ) : m === 'identify' ? (
          <div className="cod-identify">
            <div className="cod-candidates">
              {candidateGroups[ng].map((c) => (
                <span key={c} className={cs.includes(c) ? 'remaining' : 'excluded'}>
                  {t(names[c])}
                </span>
              ))}
            </div>
            {f.watch ? (
              <div className="cod-test-row cod-watch-test">
                <TestTube sample={demo.sample} test={demo.test} p={demo.reactionProgress} />
                <div>
                  <p>{t(testNames[demo.test])}</p>
                  <strong>{t(resultNames[testSample(demo.sample, demo.test).result])}</strong>
                </div>
              </div>
            ) : (
              <>
                <div className="cod-test-row">
                  <TestTube sample={s} test={tt} p={q} prepared={prepared === 'yes'} />
                  <p>{t(resultNames[testSample(s, tt, prepared === 'yes').result])}</p>
                </div>
                <button
                  className="cod-add"
                  disabled={tt === 'halide' && prepared !== 'yes'}
                  onClick={() =>
                    setObservations([
                      ...observations,
                      { test: tt, result: testSample(s, tt).result },
                    ])
                  }
                >
                  {t('将这次独立水样结果加入证据')}
                </button>
                <button className="cod-clear" onClick={() => setObservations([])}>
                  {t('清空证据')}
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="cod-test-row">
              <TestTube sample={s} test={tt} p={q} prepared={f.watch || prepared === 'yes'} />
              <div>
                <b>{t(names[s])}</b>
                <p>{t(testNames[tt])}</p>
                <strong>
                  {t(resultNames[testSample(s, tt, f.watch || prepared === 'yes').result])}
                </strong>
                {tt === 'halide' && <p>{t('水解 → 取水样 → HNO₃ → AgNO₃')}</p>}
              </div>
            </div>
          </>
        )}
      </div>
      {!f.watch && (
        <div className="cod-controls">
          <Segments
            label={t('学习环节')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(titles[i]) }))}
            onChange={(v) => {
              setMode(v as Mode);
              const d = defaults[v];
              if (d) {
                setSample(d[0]);
                setTest(d[1]);
              }
              setObservations([]);
            }}
          />
          <Range label={t('教学进程')} value={p0} min={0} max={1} step={0.01} onChange={setP} />
          {['alkene', 'halide', 'phenol', 'aldehyde', 'identify'].includes(m) && (
            <>
              <Segments
                label={t('候选样品')}
                value={sample}
                options={Object.entries(names)
                  .filter(
                    ([value]) => m !== 'identify' || candidateGroups[ng].includes(value as Sample),
                  )
                  .map(([value, label]) => ({
                    value,
                    label: t(label),
                  }))}
                onChange={(v) => {
                  setSample(v as Sample);
                  setObservations([]);
                }}
              />
              <Segments
                label={t('独立份样品的检验')}
                value={test}
                options={Object.entries(testNames).map(([value, label]) => ({
                  value,
                  label: t(label),
                }))}
                onChange={(v) => setTest(v as Test)}
              />
              {tt === 'halide' && (
                <Segments
                  label={t('水解并酸化')}
                  value={prepared}
                  options={[
                    { value: 'yes', label: t('完成') },
                    { value: 'no', label: t('未完成') },
                  ]}
                  onChange={setPrepared}
                />
              )}
            </>
          )}
          {m === 'identify' && (
            <Segments
              label={t('教材鉴别组')}
              value={group}
              options={[
                { value: '0', label: t('第一组') },
                { value: '1', label: t('第二组') },
              ]}
              onChange={(v) => {
                setGroup(v);
                setObservations([]);
                setSample(candidateGroups[Number(v)][0]);
              }}
            />
          )}
          {m === 'aspirin' && (
            <>
              <Segments
                label={t('酯基水解')}
                value={hydrolyzed}
                options={[
                  { value: 'yes', label: t('完成') },
                  { value: 'no', label: t('未完成') },
                ]}
                onChange={setHydrolyzed}
              />
              <Segments
                label={t('NaHCO₃ 中和过量硫酸')}
                value={neutralized}
                options={[
                  { value: 'yes', label: t('完成') },
                  { value: 'no', label: t('未完成') },
                ]}
                onChange={setNeutralized}
              />
            </>
          )}
          {m === 'forward' && (
            <Range
              label={t('每一步假设产率')}
              value={yieldStep}
              min={0.1}
              max={1}
              step={0.01}
              onChange={setYield}
            />
          )}{' '}
          {m === 'nmr' && (
            <Segments
              label={t('谱图候选')}
              value={nmr}
              options={[
                { value: 'ethanol', label: t('乙醇') },
                { value: 'acetic', label: t('乙酸') },
                { value: 'ester', label: t('乙酸乙酯') },
              ]}
              onChange={setNmr}
            />
          )}
        </div>
      )}
      <small className="cod-note">
        {t('有限候选集与条件化检验；单次阳性不能唯一证明所有未知物。')}
      </small>
    </div>
  );
}
