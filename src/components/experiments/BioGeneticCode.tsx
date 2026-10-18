import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  shiftedSequence,
  polyUControls,
  textbookPolyU,
  transcription,
  translation,
  codeRna,
  rnaComplement,
  codeTemplate,
} from '../../models/bio-genetic-code';
import '../../styles/bio-genetic-code.css';
const modes = [
  'frame',
  'restore',
  'poly-u',
  'counts',
  'transcribe',
  'rna',
  'initiate',
  'elongate',
  'release',
] as const;
type Mode = (typeof modes)[number];
const names = [
  '三联体与阅读框',
  '恢复框架不等于恢复序列',
  '多聚U与氨基酸',
  '原文标记掺入对照',
  '沿模板合成RNA',
  'RNA携带互补信息',
  '起始与反密码子',
  '肽链转移与移动',
  '终止与肽链释放',
];
const baseColors: Record<string, string> = {
  A: '#bf8369',
  U: '#8c9a79',
  G: '#9987a2',
  C: '#6e94a6',
  T: '#9b9b70',
};
function Frame({ delta, p }: { delta: number; p: number }) {
  const s = shiftedSequence(delta);
  const d = s.modified;
  return (
    <div className="bio-code-frame">
      <div className="bio-code-ribbon" aria-label={t('原序列，按三个碱基分组')}>
        {s.original.map((b, i) => (
          <span
            key={b.id}
            className={i % 3 === 2 ? 'end' : ''}
            style={{ background: baseColors[b.base] }}
          >
            {b.base}
          </span>
        ))}
      </div>
      <div className="bio-code-mutation" style={{ opacity: 0.3 + 0.7 * p }}>
        {delta > 0 ? `+${delta}` : delta}
      </div>
      <div className="bio-code-ribbon" aria-label={t('改变后序列，从同一起点分组')}>
        {d.map((b, i) => (
          <span
            key={b.id}
            className={`${i % 3 === 2 ? 'end' : ''} ${b.original < 0 ? 'insert' : ''}`}
            style={{
              background: baseColors[b.base],
              outline:
                b.original >= 3 && i % 3 !== b.original % 3 ? '2px solid #b46b57' : undefined,
            }}
          >
            {b.base}
          </span>
        ))}
      </div>
      <div className="bio-code-aa">
        {s.protein.map((a, i) => (
          <span key={i}>{a}</span>
        ))}
      </div>
      <p>
        {t(
          s.frameRestored
            ? '后方阅读框保持；局部序列仍可能改变，不能据此保证功能。'
            : '插入或缺失使后方三联体分组错位。',
        )}
      </p>
      <small>{t('字母序列为教学示例，不是T4噬菌体原序列。')}</small>
    </div>
  );
}
function PolyU({
  rna,
  ribosomes,
  p,
  original,
}: {
  rna: boolean;
  ribosomes: boolean;
  p: number;
  original: boolean;
}) {
  return original ? (
    <div className="bio-code-counts">
      <p>{t('原文Table 6：¹⁴C-Phe掺入蛋白质')}</p>
      {polyUControls.map((c) => (
        <div key={c.id} className="bio-code-count">
          <b>{c.polymer}</b>
          <div>
            <i style={{ width: `${Math.max(0.3, (c.counts / 39800) * 100 * p)}%` }} />
          </div>
          <output>{c.counts.toLocaleString()}</output>
        </div>
      ))}
      <small>{t('计数 / 分钟 / 毫克蛋白质；同一实验的实测结果。')}</small>
    </div>
  ) : (
    <div className="bio-code-assay">
      <p>{t('教材简化：比较不同氨基酸条件')}</p>
      <div className="bio-code-tubes">
        {['Tyr', 'Ser', 'Phe', 'Cys'].map((aa) => {
          const result = textbookPolyU(aa, rna, ribosomes);
          return (
            <div key={aa}>
              <svg viewBox="0 0 70 160" role="img" aria-label={aa}>
                <path
                  d="M13 15V123Q13 147 35 147Q57 147 57 123V15"
                  fill="#e7e6d9"
                  stroke="#a5ada1"
                  strokeWidth="2"
                />
                <path d="M15 71H55V123Q55 145 35 145Q15 145 15 123Z" fill="#c9d6cb" />
                <g fill="#758e93">
                  {Array.from({ length: 5 }, (_, i) => (
                    <path
                      key={i}
                      d={`M${23 + (i % 2) * 21} ${82 + i * 10}q-7 -7 0 -10q9 1 3 10Z`}
                    />
                  ))}
                </g>
                {result.polymer.map((_, i) => (
                  <rect
                    key={i}
                    x={20 + (i % 3) * 12}
                    y={107 + Math.floor(i / 3) * 15}
                    width="10"
                    height="10"
                    rx="3"
                    fill="#b78269"
                    opacity={ramp(p, i * 0.09, 0.4 + i * 0.09)}
                  />
                ))}
              </svg>
              <b>{aa}</b>
            </div>
          );
        })}
      </div>
      <p>
        {t(
          rna && ribosomes
            ? '多聚U条件下，Phe连接成多聚苯丙氨酸。'
            : '缺少多聚U或完整核糖体，示例产物不能形成。',
        )}
      </p>
    </div>
  );
}
function Transcribe({ p, active, completed }: { p: number; active: boolean; completed: boolean }) {
  const s = transcription(p, active);
  const coding = rnaComplement(codeTemplate).replaceAll('U', 'T');
  return (
    <div className="bio-code-transcribe">
      <svg viewBox="0 0 360 275" role="img" aria-label={t('DNA模板3′到5′被读取，RNA5′到3′延长')}>
        <defs>
          <marker
            id="bio-code-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#697c86" />
          </marker>
        </defs>
        <path d="M40 73H310" stroke="#8296a2" strokeWidth="3" />
        <path
          d={`M${s.template.map((b) => `${b.x},${b.y}`).join('L')}`}
          stroke="#8296a2"
          strokeWidth="3"
          fill="none"
        />
        <g fontSize="24" textAnchor="middle" fill="#4e616c">
          {coding.split('').map((b, i) => (
            <text key={i} x={45 + i * 18} y="68">
              {b}
            </text>
          ))}
          {s.template.map((b, i) => (
            <text key={i} x={b.x} y={b.y + 19}>
              {b.base}
            </text>
          ))}
        </g>
        <g fontSize="24" fill="#53697b">
          <text x="7" y="75">
            5′
          </text>
          <text x="321" y="75">
            3′
          </text>
          <text x="7" y="120">
            3′
          </text>
          <text x="321" y="120">
            5′
          </text>
        </g>
        {active && (
          <g opacity={1 - ease(ramp(p, 0.94, 1))} transform={`translate(${s.headX} 106)`}>
            <path
              d="M-28 -40Q0 -56 28 -28L23 69Q-3 83 -29 57L-36 -4Z"
              fill="#d0bda2"
              fillOpacity=".75"
              stroke="#ad967a"
            />
            <path d="M-22 17Q0 24 23 8" fill="none" stroke="#b69775" strokeWidth="5" />
          </g>
        )}
        {s.rna.slice(1).map((b, i) => (
          <path
            key={b.id}
            d={`M${s.rna[i].x} ${s.rna[i].y}L${b.x} ${b.y}`}
            stroke="#a9725c"
            strokeWidth="3"
            opacity={b.visible}
          />
        ))}
        {s.rna.map((b) => (
          <g key={b.id} opacity={b.visible}>
            <rect
              x={b.x - 8.5}
              y={b.y - 12}
              width="17"
              height="23"
              rx="6"
              fill={baseColors[b.base]}
            />
            <text x={b.x} y={b.y + 5} fontSize="24" textAnchor="middle" fill="#fff">
              {b.base}
            </text>
          </g>
        ))}
        <g fontSize="24" fill="#8e624f">
          <text x="8" y="225" opacity={s.rna[0].visible}>
            5′
          </text>
          <text x="322" y={s.rna[14].y + 5} opacity={s.rna[14].visible}>
            3′
          </text>
        </g>
        <path d="M111 254H246" stroke="#697c86" strokeWidth="2" markerEnd="url(#bio-code-arrow)" />
      </svg>
      <p>
        {t(
          completed
            ? 'RNA与模板互补，方向相反；编码链仅将T对应为U。'
            : 'RNA聚合酶沿模板3′到5′读取，在RNA的3′端加入新单位。',
        )}
      </p>
    </div>
  );
}
function Translate({ time, charged }: { time: number; charged: boolean }) {
  const s = translation(time, charged);
  return (
    <div className="bio-code-translate">
      <svg viewBox="0 0 350 270" role="img" aria-label={t('反密码子识别、肽链转移及释放因子终止')}>
        <defs>
          <clipPath id="bio-code-window">
            <rect x="5" y="15" width="340" height="235" rx="16" />
          </clipPath>
        </defs>
        <g clipPath="url(#bio-code-window)">
          <path
            d="M50 190Q40 146 72 132Q76 76 130 74Q169 49 202 79Q260 65 278 112Q305 142 276 191Z"
            fill="#ddd2bb"
            stroke="#b4a186"
            strokeWidth="2"
          />
          <path
            d="M59 205Q86 245 178 240Q264 245 285 205Z"
            fill="#c3ccc3"
            stroke="#91a69d"
            strokeWidth="2"
          />
          <path d="M0 199H350" stroke="#8c7766" strokeWidth="3" />
          {codeRna.split('').map((b, i) => (
            <g key={i} transform={`translate(${100 + i * 30 - s.shift * 90} 199)`}>
              <rect x="-13" y="-12" width="26" height="25" rx="5" fill={baseColors[b]} />
              <text textAnchor="middle" y="6" fontSize="22" fill="#fff">
                {b}
              </text>
            </g>
          ))}
          {s.trnas.map((tr) => (
            <g key={tr.id} transform={`translate(${tr.x} ${tr.y})`} opacity={tr.opacity}>
              <path
                d="M-28 175Q-42 161 -23 150L-10 143L-11 115Q-17 101 -1 99L12 99L12 132L27 152Q42 164 28 175Z"
                fill="#f2eee0"
                stroke="#8c9a91"
                strokeWidth="3"
              />
              <path d="M16 100V130L31 151" fill="none" stroke="#8c9a91" strokeWidth="2" />
              <text x="32" y="115" fontSize="22" fill="#5e7267">
                3′
              </text>
              {tr.anticodon.split('').map((b, i) => (
                <g key={i}>
                  <path d={`M${-30 + i * 30} 179V186`} stroke="#9b9584" strokeDasharray="2 2" />
                  <text x={-30 + i * 30} y="176" textAnchor="middle" fontSize="22" fill="#4d6767">
                    {b}
                  </text>
                </g>
              ))}
              {tr.id > 0 && tr.charged && (
                <g>
                  <rect x="8" y="93" width="20" height="15" rx="5" fill="#ae7862" />
                  <text x="18" y="83" fontSize="22" textAnchor="middle" fill="#845d4d">
                    {tr.aa}
                  </text>
                </g>
              )}
            </g>
          ))}
          {s.releaseFactor > 0 && (
            <g
              opacity={s.releaseFactor}
              transform={`translate(220 ${-40 * (1 - s.releaseFactor)})`}
            >
              <path
                d="M-23 167L-13 116Q0 96 13 119L25 168L0 185Z"
                fill="#94a7ad"
                stroke="#627e86"
              />
              <text x="0" y="148" textAnchor="middle" fontSize="22" fill="#fff">
                RF
              </text>
            </g>
          )}
          <g>
            {s.chain.map((aa, i) => {
              const x = s.chainX - (s.chain.length - 1 - i) * 20;
              return (
                <g key={i}>
                  {i > 0 && (
                    <path d={`M${x - 20} ${s.chainY}H${x}`} stroke="#925f4b" strokeWidth="3" />
                  )}
                  <rect x={x - 9} y={s.chainY - 7} width="18" height="14" rx="4" fill="#b58269" />
                </g>
              );
            })}
          </g>
        </g>
        <g fontSize="24" fill="#5d706a">
          <text x="40" y="262">
            E
          </text>
          <text x="124" y="262">
            P
          </text>
          <text x="214" y="262">
            A
          </text>
          <text x="6" y="222">
            5′
          </text>
          <text x="325" y="222">
            3′
          </text>
        </g>
      </svg>
      <div className="bio-code-peptide">N — {s.chain.join(' · ')} — C</div>
      <p>
        {t(
          s.cycle === 4
            ? '终止密码子由释放因子识别，没有“终止tRNA”。'
            : '镜头跟随核糖体：mRNA向后经过，肽链从N端向C端增长。',
        )}
      </p>
    </div>
  );
}
export default function BioGeneticCode() {
  const f = useShowcase();
  const [mode, setMode] = useState<Mode>((f.variant as Mode) || 'frame');
  const [delta, setDelta] = useState(1);
  const [progress, setProgress] = useState(0.7);
  const [rna, setRna] = useState(true);
  const [ribosomes, setRibosomes] = useState(true);
  const [charged, setCharged] = useState(true);
  const m = f.watch ? modes[Math.min(8, f.chapter)] : mode;
  const p = f.watch ? ease(ramp(f.chapterProgress, 0.08, 0.85)) : progress;
  const index = modes.indexOf(m);
  const d = f.watch ? (m === 'frame' ? 1 : p < 0.5 ? 2 : 3) : delta;
  const time = m === 'initiate' ? p : m === 'elongate' ? 1 + p * 3 : 4 + p;
  return (
    <div className={`bio-code-scene ${f.watch ? 'is-watch' : ''}`}>
      <div className="bio-code-stage">
        {index < 2 ? (
          <Frame delta={d} p={p} />
        ) : index < 4 ? (
          <PolyU
            rna={f.watch || rna}
            ribosomes={f.watch || ribosomes}
            p={p}
            original={m === 'counts'}
          />
        ) : index < 6 ? (
          <Transcribe
            p={m === 'rna' ? 0.9 + 0.1 * p : 0.9 * p}
            active={f.watch || ribosomes}
            completed={m === 'rna'}
          />
        ) : (
          <Translate time={time} charged={f.watch || charged} />
        )}
      </div>
      {!f.watch && (
        <div className="bio-code-controls">
          <label>
            {t('观察过程')}
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              {modes.map((v, i) => (
                <option key={v} value={v}>
                  {t(names[i])}
                </option>
              ))}
            </select>
          </label>
          {index < 2 ? (
            <Segments
              label={t('碱基增减')}
              value={String(delta)}
              onChange={(v) => setDelta(Number(v))}
              options={[-3, -2, -1, 0, 1, 2, 3].map((x) => ({
                value: String(x),
                label: x > 0 ? `+${x}` : String(x),
              }))}
            />
          ) : index === 2 ? (
            <>
              <button onClick={() => setRna(!rna)}>{t(rna ? '多聚U：有' : '多聚U：无')}</button>
              <button onClick={() => setRibosomes(!ribosomes)}>
                {t(ribosomes ? '核糖体：完整' : '核糖体：缺失')}
              </button>
            </>
          ) : index < 6 && index > 3 ? (
            <button onClick={() => setRibosomes(!ribosomes)}>
              {t(ribosomes ? 'RNA聚合酶：有' : 'RNA聚合酶：无')}
            </button>
          ) : index > 5 ? (
            <button onClick={() => setCharged(!charged)}>
              {t(charged ? '携氨基酸tRNA：有' : '携氨基酸tRNA：无')}
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
