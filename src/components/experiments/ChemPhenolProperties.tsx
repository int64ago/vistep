import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  phenolBalance,
  carbonDioxide,
  bromination,
  ring,
  substitutedSites,
  ferricTest,
  acidSolution,
  comparisonGeometry,
  comparisonMarker,
  line,
  acidComparison,
  historyEvidence,
  type Acid,
} from '../../models/chem-phenol-properties';
import '../../styles/chem-phenol-properties.css';
const modes = [
  'base',
  'acid-return',
  'co2',
  'bromination',
  'iron',
  'history',
  'carboxyl',
  'comparison',
  'control',
] as const;
type Mode = (typeof modes)[number];
const names = [
  '苯酚与碱',
  '加酸恢复苯酚',
  '二氧化碳使苯酚析出',
  '邻对位溴代',
  '铁盐显色',
  '利斯特的防腐证据',
  '羧酸的酸性',
  '一次性酸性比较',
  '去除乙酸的干扰',
];
function Tube({
  cloud = 0,
  purple = 0,
  bromine = 0,
  precipitate = 0,
}: {
  cloud?: number;
  purple?: number;
  bromine?: number;
  precipitate?: number;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 155 230" role="img" aria-label={t('试管内的溶液、分散相与沉淀')}>
      <defs>
        <clipPath id={uid}>
          <path d="M38 23V177Q38 211 77 211T116 177V23Z" />
        </clipPath>
        <linearGradient id={uid + 'g'}>
          <stop stopColor="#a4b8aa" stopOpacity=".35" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".05" />
          <stop offset="1" stopColor="#a4b8aa" stopOpacity=".3" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${uid})`}>
        <rect x="38" y="65" width="78" height="150" fill="#d5e3d9" />
        <rect x="38" y="65" width="78" height="150" fill="#8e6da2" opacity={purple * 0.85} />
        <rect
          x="38"
          y="65"
          width="78"
          height="150"
          fill="#b89358"
          opacity={Math.min(0.8, bromine * 0.25)}
        />
        <rect x="38" y="65" width="78" height="150" fill="#f6f5df" opacity={cloud * 0.7} />
        {Array.from({ length: 26 }, (_, i) => (
          <ellipse
            key={i}
            cx={43 + ((i * 17) % 68)}
            cy={cloud ? 78 + ((i * 23) % 119) : 203 - (i % 5) * 5}
            rx={3 + (i % 2)}
            ry="2"
            fill="#fffdf0"
            stroke="#d8d6b9"
            strokeWidth=".6"
            opacity={Math.max(cloud, precipitate)}
          />
        ))}
      </g>
      <path
        d="M34 20V177Q34 215 77 215T120 177V20"
        fill={`url(#${uid}g)`}
        stroke="#91a79b"
        strokeWidth="2"
      />
      <ellipse cx="77" cy="20" rx="43" ry="6" fill="none" stroke="#91a79b" />
      <path d="M45 37V176Q45 195 55 201" fill="none" stroke="#fff" strokeWidth="3" opacity=".7" />
    </svg>
  );
}
function Molecule({
  phenolate = false,
  substitute = 0,
}: {
  phenolate?: boolean;
  substitute?: number;
}) {
  return (
    <svg
      className="cpp-ring"
      viewBox="35 0 235 235"
      role="img"
      aria-label={t('羟基连在苯环上，2、4、6 位接受取代')}
    >
      <path
        d={ring.map((v, i) => `${i ? 'L' : 'M'}${v.x} ${v.y}`).join(' ') + 'Z'}
        stroke="#879c86"
        strokeWidth="3"
        fill="none"
      />
      <circle cx="150" cy="115" r="35" fill="none" stroke="#a2b18d" strokeWidth="2" />
      <path d="M150 57V30" stroke="#9b9181" strokeWidth="3" />
      <text x="150" y="23" textAnchor="middle" fill="#a37e6d">
        {phenolate ? 'O⁻' : 'OH'}
      </text>
      {substitutedSites().map((a) => (
        <g key={a.id}>
          <path
            d={`M${a.x} ${a.y}L${a.end.x} ${a.end.y}`}
            stroke="#b69a72"
            strokeWidth="3"
            opacity={substitute}
          />
          <text x={a.end.x} y={a.end.y + 8} textAnchor="middle" opacity={substitute} fill="#aa825b">
            Br
          </text>
          <text
            x={150 + (a.x - 150) * 0.74}
            y={115 + (a.y - 115) * 0.74 + 5}
            textAnchor="middle"
            className="cpp-site"
          >
            {a.id}
          </text>
        </g>
      ))}
    </svg>
  );
}
function Train({
  mobile,
  p,
  washed,
  co2,
  acid,
}: {
  mobile: boolean;
  p: number;
  washed: boolean;
  co2: boolean;
  acid: boolean;
}) {
  const g = comparisonGeometry(mobile),
    a = acidComparison(co2, acid, washed),
    q = ramp(p, 0.8, 0.98);
  return (
    <svg
      className={mobile ? 'cpp-mobile' : 'cpp-desktop'}
      viewBox={mobile ? '0 0 300 350' : '0 0 540 285'}
      role="img"
      aria-label={t('乙酸制二氧化碳，经饱和碳酸氢钠净化后进入苯酚钠')}
    >
      {[g.gen, g.wash].map((v, i) => (
        <g key={i}>
          <path
            d={`M${v.x - 22} ${v.y - 58}V${v.y - 33}Q${v.x - 38} ${v.y - 30} ${v.x - 38} ${v.y - 17}V${v.y + 47}Q${v.x - 38} ${v.y + 56} ${v.x - 27} ${v.y + 56}H${v.x + 27}Q${v.x + 38} ${v.y + 56} ${v.x + 38} ${v.y + 47}V${v.y - 17}Q${v.x + 38} ${v.y - 30} ${v.x + 22} ${v.y - 33}V${v.y - 58}Z`}
            fill="#eff2e4"
            fillOpacity=".25"
            stroke="#96ada0"
            strokeWidth="2"
          />
          <path
            d={`M${v.x - 34} ${v.y + 3}H${v.x + 34}V${v.y + 44}Q${v.x + 34} ${v.y + 52} ${v.x + 24} ${v.y + 52}H${v.x - 24}Q${v.x - 34} ${v.y + 52} ${v.x - 34} ${v.y + 44}Z`}
            fill={i === 0 ? '#d9d5b8' : '#c9dbd0'}
            opacity={i === 1 && !washed ? 0.15 : 0.8}
          />
          <path
            d={`M${v.x - 25} ${v.y - 55}H${v.x + 25}`}
            stroke="#b1a187"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <text
            x={mobile && i === 0 ? v.x - 45 : v.x}
            y={v.y + (mobile && i === 0 ? 64 : 82)}
            textAnchor="middle"
          >
            {i === 0 ? '①' : '②'}
          </text>
        </g>
      ))}
      <path
        d={`M${g.gen.x - 12} ${g.gen.y - 80}V${g.gen.y + 22}`}
        stroke="#96ada0"
        strokeWidth="5"
      />
      <ellipse
        cx={g.gen.x - 12}
        cy={g.gen.y - 69}
        rx="12"
        ry="13"
        fill="#e3dfc6"
        stroke="#96ada0"
      />
      <path
        d={`M${g.test.x - 28} ${g.test.y - 55}V${g.test.y + 30}Q${g.test.x - 28} ${g.test.y + 56} ${g.test.x} ${g.test.y + 56}T${g.test.x + 28} ${g.test.y + 30}V${g.test.y - 55}`}
        fill="none"
        stroke="#96ada0"
        strokeWidth="2"
      />
      <path
        d={`M${g.test.x - 24} ${g.test.y}H${g.test.x + 24}V${g.test.y + 30}Q${g.test.x + 24} ${g.test.y + 52} ${g.test.x} ${g.test.y + 52}T${g.test.x - 24} ${g.test.y + 30}Z`}
        fill="#c9dbd0"
      />
      {a.turbid && (
        <path
          d={`M${g.test.x - 24} ${g.test.y}H${g.test.x + 24}V${g.test.y + 30}Q${g.test.x + 24} ${g.test.y + 52} ${g.test.x} ${g.test.y + 52}T${g.test.x - 24} ${g.test.y + 30}Z`}
          fill="#faf8e7"
          opacity={q * 0.9}
        />
      )}
      <text x={g.test.x} y={g.test.y + 82} textAnchor="middle">
        ③
      </text>
      {[g.feed, g.out].map((path, i) => (
        <g key={i}>
          <path
            d={line(path)}
            fill="none"
            stroke="#aabdb1"
            strokeWidth="9"
            strokeLinejoin="round"
          />
          <path
            d={line(path)}
            fill="none"
            stroke="#f8f8eb"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
        </g>
      ))}
      {[...(co2 ? [false] : []), ...(acid ? [true] : [])].map((ac) => {
        const v = comparisonMarker(mobile, Math.max(0, p - (ac ? 0.07 : 0)), ac, washed);
        return (
          <circle
            key={String(ac)}
            cx={v.x}
            cy={v.y}
            r="5.5"
            fill={ac ? '#b99263' : '#6b9c85'}
            stroke="#fff"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}
function History({ stage }: { stage: number }) {
  return (
    <div className="cpp-history">
      <svg viewBox="0 0 520 205" role="img" aria-label={t('手术器械、敷料与病例记录的历史示意')}>
        <g transform="translate(35 20)" opacity={stage >= 0 ? 1 : 0.2}>
          <path
            d="M18 30L92 145Q99 158 108 151L43 27Z"
            fill="#c9d4c8"
            stroke="#96aa9a"
            strokeWidth="2"
          />
          <path d="M15 26Q-1 0 20 5L43 27" fill="#b3bcac" />
          <path
            d="M17 110Q35 72 60 74M24 115Q42 82 64 83"
            stroke="#90a18b"
            fill="none"
            strokeWidth="3"
          />
        </g>
        <g transform="translate(195 57)" opacity={stage >= 1 ? 1 : 0.25}>
          <path
            d="M0 0Q45-12 90 4L84 105Q43 90 3 102Z"
            fill="#f6efd9"
            stroke="#c1bea1"
            strokeWidth="2"
          />
          {Array.from({ length: 7 }, (_, i) => (
            <path
              key={i}
              d={`M7 ${12 + i * 12}Q45 ${5 + i * 12} 83 ${13 + i * 12}`}
              stroke="#c9c3a7"
              strokeWidth="1"
            />
          ))}
        </g>
        <g transform="translate(345 18)" opacity={stage >= 2 ? 1 : 0.25}>
          <path
            d="M0 0Q58-7 130 0V164Q62 155 0 164Z"
            fill="#f7efd8"
            stroke="#c4b48f"
            strokeWidth="2"
          />
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} d={`M18 ${50 + i * 16}H110`} stroke="#beb596" strokeWidth="2" />
          ))}
          <text x="65" y="30" textAnchor="middle">
            1867
          </text>
        </g>
      </svg>
      <div className="cpp-history-line">
        {historyEvidence.map((h, i) => (
          <span key={h.id} className={i === stage ? 'active' : ''}>
            {t(h.title)}
          </span>
        ))}
      </div>
      <p>{t(historyEvidence[stage].claim)}</p>
    </div>
  );
}
export default function ChemPhenolProperties({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(modes.includes(variant as Mode) ? (variant as Mode) : 'base'),
    [p0, setP] = useState(1),
    [dose, setDose] = useState(3),
    [sample, setSample] = useState('phenol'),
    [medium, setMedium] = useState('valid'),
    [acid, setAcid] = useState<Acid>('formic'),
    [wash, setWash] = useState('yes'),
    [input, setInput] = useState('both'),
    [history, setHistory] = useState('0');
  const m = f.watch ? modes[Math.min(8, f.chapter)] : mode,
    p = f.watch ? f.chapterProgress : p0,
    q = f.watch ? ease(ramp(p, 0.12, 0.86)) : p0,
    b = phenolBalance(m === 'base' ? 1.1 * q : 1.1, m === 'acid-return' ? 1.1 * q : 0),
    c = carbonDioxide(q),
    br = bromination(f.watch ? 3 : dose, q),
    violet = ferricTest(
      f.watch || sample === 'phenol',
      true,
      f.watch || medium === 'valid',
      q,
    ).violet,
    selected = f.watch
      ? (['formic', 'benzoic', 'oxalic'] as Acid[])[Math.min(2, Math.floor(p * 3))]
      : acid,
    as = acidSolution(selected),
    isTrain = m === 'comparison' || m === 'control',
    washed = f.watch ? (m === 'control' ? p > 0.52 : true) : wash === 'yes',
    hasCO2 = f.watch ? (m === 'control' ? false : true) : input !== 'acid',
    hasAcid = f.watch || input !== 'co2',
    cp =
      f.watch && m === 'control'
        ? ease(ramp(p > 0.52 ? (p - 0.52) / 0.48 : p / 0.52, 0.05, 0.9))
        : q,
    ce = acidComparison(hasCO2, hasAcid, washed),
    hs = f.watch ? Math.min(2, Math.floor(p * 3)) : Number(history);
  return (
    <div className={`cpp ${f.watch ? 'is-watch' : ''}`}>
      <div className="cpp-stage">
        {m === 'history' ? (
          <History stage={hs} />
        ) : isTrain ? (
          <>
            <Train mobile={false} p={cp} washed={washed} co2={hasCO2} acid={hasAcid} />
            <Train mobile p={cp} washed={washed} co2={hasCO2} acid={hasAcid} />
            <div className="cpp-apparatus-key">
              <span>① {t('乙酸 + Na₂CO₃')}</span>
              <span>② {t(washed ? '饱和 NaHCO₃' : '空管：乙酸未去除')}</span>
              <span>③ {t('苯酚钠')}</span>
            </div>
            <p className="cpp-legend">
              ● {t(hasCO2 ? 'CO₂ 与乙酸蒸气标记' : '只有乙酸蒸气的反例')}
            </p>
            {!f.watch && (
              <b className="cpp-conclusion">
                {t(
                  ce.validCarbonicEvidence
                    ? '净化后支持碳酸强于苯酚'
                    : ce.turbid
                      ? '浑浊不能排除乙酸干扰'
                      : '乙酸被截留，末管保持澄清',
                )}
              </b>
            )}
          </>
        ) : m === 'carboxyl' ? (
          <div className="cpp-acids">
            <div className="cpp-formula">{as.formula}</div>
            <div className="cpp-acid-observation">
              <svg viewBox="0 0 300 185" role="img" aria-label={t('酸性水样与碳酸氢盐放气比较')}>
                <path
                  d="M60 20V145Q60 170 90 170T120 145V20"
                  stroke="#95aa99"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M64 75H116V145Q116 166 90 166T64 145Z" fill="#d7e2d4" />
                {as.co2Equivalent > 0 &&
                  Array.from({ length: 6 }, (_, i) => (
                    <circle
                      key={i}
                      cx={80 + (i % 3) * 11}
                      cy={150 - ((q * 130 + i * 19) % 90)}
                      r={3 + (i % 2)}
                      fill="none"
                      stroke="#7ca28d"
                      opacity={q}
                    />
                  ))}
                <rect
                  x="184"
                  y="45"
                  width="38"
                  height="115"
                  rx="5"
                  fill={as.pH < 4.5 ? '#b98b89' : '#b4a6b7'}
                />
                <text x="205" y="185" textAnchor="middle">
                  pH {as.pH.toFixed(2)}
                </text>
              </svg>
              <span>
                {t(as.co2Equivalent > 0 ? 'NaHCO₃：释放 CO₂' : 'NaHCO₃：本条件下无明显放气')}
              </span>
            </div>
            <small>{t('0.010 mol/L 理想酸溶液；指示颜色为示意。')}</small>
          </div>
        ) : (
          <>
            <div className="cpp-pair">
              <div className="cpp-tube">
                <Tube
                  cloud={
                    m === 'base' || m === 'acid-return'
                      ? b.separated / 0.6164
                      : m === 'co2'
                        ? c.separated / 0.4
                        : 0
                  }
                  purple={m === 'iron' ? violet : 0}
                  bromine={m === 'bromination' ? br.br2 : 0}
                  precipitate={m === 'bromination' ? br.product : 0}
                />
              </div>
              {m === 'iron' ? (
                <div className="cpp-iron">
                  <b>Fe³⁺ + {t(f.watch || sample === 'phenol' ? '酚类配体' : '乙醇对照')}</b>
                  <div
                    className="cpp-optical"
                    style={{ background: `rgba(142,109,162,${violet * 0.7})` }}
                  />
                  <strong>{t(violet > 0 ? '紫色配合物证据' : '没有所示紫色阳性')}</strong>
                </div>
              ) : (
                <Molecule
                  phenolate={
                    m === 'base' || m === 'acid-return'
                      ? b.anion > b.total / 2
                      : m === 'co2'
                        ? q < 0.55
                        : false
                  }
                  substitute={m === 'bromination' ? br.product : 0}
                />
              )}
            </div>
            <div className="cpp-readout">
              {m === 'base' || m === 'acid-return' ? (
                <>
                  <span>
                    {t('溶解的苯酚根')} <b>{((100 * b.anion) / b.total).toFixed(0)}%</b>
                  </span>
                  <span>
                    {t('分离的中性苯酚')} <b>{((100 * b.separated) / b.total).toFixed(0)}%</b>
                  </span>
                </>
              ) : m === 'co2' ? (
                <p>C₆H₅O⁻ + CO₂ + H₂O → C₆H₅OH + HCO₃⁻</p>
              ) : m === 'bromination' ? (
                <>
                  <p>C₆H₅OH + 3 Br₂ → C₆H₂Br₃OH↓ + 3 HBr</p>
                  <span>
                    {t('剩余溴')}{' '}
                    <b>
                      {br.br2.toFixed(1)} {t('当量')}
                    </b>
                  </span>
                </>
              ) : (
                <p>{t('显色是条件化证据，并非所有酚都呈同一种紫色。')}</p>
              )}
            </div>
          </>
        )}
      </div>
      {!f.watch && (
        <div className="cpp-controls">
          <Segments
            label={t('观察环节')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {m === 'history' ? (
            <Segments
              label={t('历史证据')}
              value={history}
              options={historyEvidence.map((h, i) => ({ value: String(i), label: t(h.title) }))}
              onChange={setHistory}
            />
          ) : (
            <Range label={t('教学进程')} value={p0} min={0} max={1} step={0.01} onChange={setP} />
          )}{' '}
          {m === 'bromination' && (
            <Range
              label={t('加入溴的相对当量')}
              value={dose}
              min={0}
              max={5}
              step={0.1}
              onChange={setDose}
            />
          )}{' '}
          {m === 'iron' && (
            <>
              <Segments
                label={t('有机样品')}
                value={sample}
                options={[
                  { value: 'phenol', label: t('苯酚') },
                  { value: 'ethanol', label: t('乙醇') },
                ]}
                onChange={setSample}
              />
              <Segments
                label={t('显色条件')}
                value={medium}
                options={[
                  { value: 'valid', label: t('适当介质') },
                  { value: 'invalid', label: t('条件不适用') },
                ]}
                onChange={setMedium}
              />
            </>
          )}
          {m === 'carboxyl' && (
            <Segments
              label={t('酸的种类')}
              value={acid}
              options={[
                { value: 'formic', label: t('甲酸') },
                { value: 'benzoic', label: t('苯甲酸') },
                { value: 'oxalic', label: t('乙二酸') },
                { value: 'phenol', label: t('苯酚对照') },
              ]}
              onChange={(v) => setAcid(v as Acid)}
            />
          )}{' '}
          {isTrain && (
            <>
              <Segments
                label={t('饱和碳酸氢钠洗气')}
                value={wash}
                options={[
                  { value: 'yes', label: t('保留洗气') },
                  { value: 'no', label: t('取消洗气') },
                ]}
                onChange={setWash}
              />
              <Segments
                label={t('输入气体')}
                value={input}
                options={[
                  { value: 'both', label: t('CO₂ 与乙酸') },
                  { value: 'co2', label: t('只有 CO₂') },
                  { value: 'acid', label: t('只有乙酸蒸气') },
                ]}
                onChange={setInput}
              />
            </>
          )}
        </div>
      )}
      <small className="cpp-note">
        {t('室温、理想平衡与条件化反应；画面进程不预测真实速率。')}
      </small>
    </div>
  );
}
