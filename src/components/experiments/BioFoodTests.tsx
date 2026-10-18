import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  foodRamp,
  foodDirector,
  copperMapping,
  copperNetLedger,
  sugarGraph,
  graphFreeCenters,
  assayEvidence,
  dyeFilmState,
  dyeTracer,
  partitionFluxes,
  lipidGeometry,
  coarseCopperBinding,
  peptideMotif,
  type SugarCase,
  type Point,
} from '../../models/bio-food-tests';
import '../../styles/bio-food-tests.css';

const chapterNames = [
  '红色从哪里来？',
  '蔗糖为什么不变红？',
  '橙色去了哪里？',
  '洗淡了，为什么更清楚？',
  '紫色的铜，还是原来的价态吗？',
];
function Bond({
  a,
  b,
  color = '#6f8477',
  dashed = false,
}: {
  a: Point;
  b: Point;
  color?: string;
  dashed?: boolean;
}) {
  return (
    <path
      d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
      fill="none"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeDasharray={dashed ? '4 5' : undefined}
    />
  );
}
function Arrow({
  x1,
  x2,
  y,
  color = '#8c9d87',
}: {
  x1: number;
  x2: number;
  y: number;
  color?: string;
}) {
  const sign = Math.sign(x2 - x1);
  return (
    <path
      d={`M${x1} ${y}H${x2}m${-sign * 8} -5l${sign * 8} 5l${-sign * 8} 5`}
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
function Tube({
  positive = 0,
  protein = false,
  label,
  blank = false,
  uid,
}: {
  positive?: number;
  protein?: boolean;
  label: string;
  blank?: boolean;
  uid: string;
}) {
  return (
    <div className="bfp-tube">
      <svg viewBox="0 0 120 190" role="img" aria-label={t(label)}>
        <defs>
          <clipPath id={uid}>
            <path d="M34 20H86V144Q86 172 60 172Q34 172 34 144Z" />
          </clipPath>
          <linearGradient id={`${uid}-g`}>
            <stop stopColor="#aec7c2" stopOpacity=".4" />
            <stop offset=".4" stopColor="#fff" stopOpacity=".15" />
            <stop offset="1" stopColor="#829e9b" stopOpacity=".35" />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${uid})`}>
          <rect x="34" y="65" width="52" height="110" fill="#9cc9d1" />
          {protein && (
            <rect x="34" y="65" width="52" height="110" fill="#9771ad" opacity={positive} />
          )}
          <ellipse
            cx="60"
            cy="65"
            rx="26"
            ry="4"
            fill={protein && positive > 0.4 ? '#a58ab7' : '#b3d6db'}
          />
          {!protein && (
            <>
              <path
                d={`M34 ${168 - positive * 18}Q60 ${163 - positive * 18} 86 ${168 - positive * 18}V181H34Z`}
                fill="#b66c4b"
                opacity={positive}
              />
              {Array.from({ length: 14 }, (_, i) => (
                <circle
                  key={i}
                  cx={39 + ((i * 17) % 42)}
                  cy={90 + ((i * 23) % 65)}
                  r={1.5}
                  fill="#b56d48"
                  opacity={positive}
                />
              ))}
            </>
          )}
        </g>
        <path
          d="M31 19H89M34 20V144Q34 172 60 172Q86 172 86 144V20"
          fill={`url(#${uid}-g)`}
          stroke="#849f97"
          strokeWidth="2"
        />
        <path d="M41 29V142" stroke="#fff" opacity=".65" strokeWidth="2.5" />
        <path d="M27 177H93" stroke="#9eab92" strokeWidth="2" />
      </svg>
      <span>{t(label)}</span>
      <strong className={positive > 0.2 ? 'bfp-positive' : 'bfp-neutral'}>
        {t(
          positive > 0.2
            ? protein
              ? '紫色配合物'
              : '砖红色固体'
            : blank
              ? '空白对照'
              : '未见红色固体',
        )}
      </strong>
    </div>
  );
}
function PairedTubes({
  p,
  uid,
  protein = false,
  sucrose = false,
  hydrolyzed = false,
  valid = true,
}: {
  p: number;
  uid: string;
  protein?: boolean;
  sucrose?: boolean;
  hydrolyzed?: boolean;
  valid?: boolean;
}) {
  return (
    <div className="bfp-macro">
      <div className="bfp-condition">{t(protein ? '相同双缩脲条件' : '相同试剂与温水浴')}</div>
      <div className={`bfp-tube-pair ${protein ? '' : 'bfp-bath'}`}>
        <Tube
          uid={`${uid}-a`}
          positive={valid ? (sucrose && !hydrolyzed ? 0 : p) : 0}
          protein={protein}
          label={
            protein ? '蛋清样液' : sucrose ? (hydrolyzed ? '已水解蔗糖' : '未水解蔗糖') : '梨样液'
          }
        />
        <Tube
          uid={`${uid}-b`}
          positive={sucrose && valid ? p : 0}
          protein={protein}
          label={sucrose ? '葡萄糖对照' : '水空白'}
          blank={!sucrose}
        />
      </div>
      {!valid && <div className="bfp-interpretation">{t('阳性对照失效，暂不能判读。')}</div>}
    </div>
  );
}
function Copper({ p }: { p: number }) {
  const progress = foodRamp(p, 0.05, 0.9),
    ledger = copperNetLedger(progress);
  return (
    <div className="bfp-copper">
      <div className="bfp-diagram-labels">
        <span>{t('含铜蓝色试剂')}</span>
        <span>Cu₂O · {t('新固体')}</span>
      </div>
      <svg
        viewBox="0 0 360 190"
        role="img"
        aria-label={t('铜的净变化：同一批铜进入氧化亚铜固体，氧来自碱性体系')}
      >
        <rect x="16" y="27" width="109" height="148" rx="28" fill="#dceef0" />
        <path
          d="M203 34Q259 20 332 39L338 169Q269 181 204 168Z"
          fill="#ba795b"
          opacity={progress * 0.3}
        />
        <Arrow x1={136} x2={187} y={102} />
        {Array.from({ length: 6 }, (_, i) => {
          const q = copperMapping(i * 2, progress),
            alpha = foodRamp(q.phase, 0.45, 0.85);
          return (
            <g key={i}>
              <circle
                cx={209 + i * 22 + (q.oxygen.x - 209 - i * 22) * q.phase}
                cy={13 + (q.oxygen.y - 13) * q.phase}
                r="7"
                fill="#bd8679"
              />
              <path
                d={`M${q.oxygen.x - 13} ${q.oxygen.y + 6}L${q.oxygen.x + 13} ${q.oxygen.y - 6}`}
                fill="none"
                stroke="#997c69"
                opacity={alpha}
              />
            </g>
          );
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const q = copperMapping(i, progress);
          return (
            <g key={i} data-copper-id={i}>
              <circle
                cx={q.point.x}
                cy={q.point.y}
                r="8.5"
                fill="#669aa5"
                stroke={i === 0 ? '#293e3c' : '#eff6f1'}
                strokeWidth={i === 0 ? 3 : 1.5}
              />
              {i === 0 && (
                <circle
                  cx={q.point.x}
                  cy={q.point.y}
                  r="13"
                  fill="none"
                  stroke="#466f70"
                  strokeDasharray="3 4"
                />
              )}
            </g>
          );
        })}
        <text x="162" y="81" textAnchor="middle" className="bfp-symbol">
          e⁻
        </text>
      </svg>
      <div className="bfp-ledger">
        <span>Cu: +2 → +1</span>
        <span className="bfp-oxygen-key">
          <i />
          {t('氧来自含氧碱性体系')}
        </span>
      </div>
      <div className="bfp-qualifier">{t('净变化示意；不表示逐步机理')}</div>
      <span className="bfp-sr-only">
        {ledger.solidCopperI} / {ledger.totalCopper} Cu
      </span>
    </div>
  );
}
function SugarStructure({
  kind,
  hydrolysis = 0,
  opening = 0,
}: {
  kind: SugarCase;
  hydrolysis?: number;
  opening?: number;
}) {
  const g = sugarGraph(kind, hydrolysis, opening),
    free = graphFreeCenters(g),
    map = new Map(g.atoms.map((a) => [a.id, a]));
  const two = kind === 'sucrose' || kind === 'hydrolyzed';
  return (
    <div className="bfp-sugar">
      <div className="bfp-condition">
        {t(
          two
            ? hydrolysis > 0.1
              ? '先单独水解 · 净连接变化'
              : '蔗糖：两个反应中心被连接'
            : kind === 'glucose'
              ? '葡萄糖：保留可开环的中心'
              : '果糖：也可进入反应性形式',
        )}
      </div>
      <svg viewBox="0 0 360 190" role="img" aria-label={t('糖的骨架与异头中心连接，其他侧基省略')}>
        {g.bonds.map((b, i) => {
          const a = map.get(b.a)!,
            z = map.get(b.b)!;
          const length = Math.hypot(z.x - a.x, z.y - a.y),
            nx = ((z.y - a.y) / length) * 2,
            ny = (-(z.x - a.x) / length) * 2;
          return (
            <g key={i}>
              <Bond
                a={b.order === 2 ? { x: a.x + nx, y: a.y + ny } : a}
                b={b.order === 2 ? { x: z.x + nx, y: z.y + ny } : z}
                color={b.role === 'glycosidic' ? '#b28058' : '#7d9383'}
                dashed={b.role === 'hydrolysis'}
              />
              {b.order === 2 && (
                <Bond a={{ x: a.x - nx, y: a.y - ny }} b={{ x: z.x - nx, y: z.y - ny }} />
              )}
            </g>
          );
        })}
        {g.atoms.map((a) => (
          <g key={a.id} data-atom={a.id}>
            {g.anomeric.includes(a.id) && (
              <circle
                cx={a.x}
                cy={a.y}
                r="14"
                fill={free.includes(a.id) ? '#dce8c0' : '#f0dcc7'}
                stroke={free.includes(a.id) ? '#7c9d66' : '#ba9368'}
                strokeWidth="2"
              />
            )}
            {a.element === 'O' && (
              <>
                <circle cx={a.x} cy={a.y} r={a.label === 'OH' ? 16 : 10} fill="#f4f3e8" />
                <text x={a.x} y={a.y + 6} textAnchor="middle" className="bfp-atom">
                  {a.label || 'O'}
                </text>
              </>
            )}
            {a.element === 'H' && (
              <circle cx={a.x} cy={a.y} r="4" fill="#e9eee1" stroke="#9ca691" />
            )}
            {g.anomeric.includes(a.id) && (
              <text x={a.x} y={a.y + 5} textAnchor="middle" className="bfp-center-label">
                {a.id === 'G1' ? '1' : '2'}
              </text>
            )}
          </g>
        ))}
        {two && (
          <>
            <text x="87" y="179" textAnchor="middle">
              {t('葡萄糖部分')}
            </text>
            <text x="274" y="179" textAnchor="middle">
              {t('果糖部分')}
            </text>
          </>
        )}
        {!two && (
          <path
            d="M132 160q37 16 70 0m-8-4l8 4-7 7"
            fill="none"
            stroke="#80986d"
            strokeWidth="2.5"
          />
        )}
      </svg>
      <div className="bfp-structure-key">
        {t(
          two
            ? hydrolysis > 0.5
              ? '连接改变，反应性质也改变'
              : '两个中心均参与糖苷键'
            : '可开环，不等于所有分子都已开环',
        )}
      </div>
      <div className="bfp-qualifier">{t('骨架局部示意；其余侧基省略')}</div>
    </div>
  );
}
function DyeAffinity() {
  const ring = (cx: number, cy: number, r = 18) =>
    Array.from({ length: 6 }, (_, i) => ({
      x: cx + r * Math.cos((i * Math.PI) / 3),
      y: cy + r * Math.sin((i * Math.PI) / 3),
    }));
  return (
    <div className="bfp-affinity">
      <div className="bfp-condition">{t('苏丹Ⅲ：较大的疏水骨架')}</div>
      <svg
        viewBox="0 0 360 200"
        role="img"
        aria-label={t('苏丹Ⅲ的芳香骨架与脂肪的烃链，显示亲脂性结构基础')}
      >
        {[
          { x: 45, y: 60 },
          { x: 140, y: 60 },
          { x: 250, y: 60 },
          { x: 277, y: 75.588 },
        ].map((center, i) => (
          <g key={i}>
            <polygon
              points={ring(center.x, center.y)
                .map((q) => `${q.x},${q.y}`)
                .join(' ')}
              fill="#f2e4c6"
              stroke="#9a7950"
              strokeWidth="2"
            />
            <circle
              cx={center.x}
              cy={center.y}
              r="9.5"
              fill="none"
              stroke="#ae8e63"
              strokeWidth="1.5"
            />
          </g>
        ))}
        {[
          { a: 63, b: 78 },
          { a: 111, b: 122 },
          { a: 158, b: 178 },
        ].map((q, i) => (
          <path key={i} d={`M${q.a} 60H${q.b}`} fill="none" stroke="#9a7950" strokeWidth="2" />
        ))}
        {[
          [83, 106],
          [183, 207],
        ].map(([a, b]) => (
          <g key={a}>
            <path
              d={`M${a + 5} 57H${b - 5}M${a + 5} 63H${b - 5}`}
              fill="none"
              stroke="#7898a0"
              strokeWidth="1.8"
            />
            <circle cx={a} cy="60" r="5" fill="#7797a3" />
            <circle cx={b} cy="60" r="5" fill="#7797a3" />
          </g>
        ))}
        <path d="M212 62.3L241 75.588M232 60L219 42" fill="none" stroke="#9a7950" strokeWidth="2" />
        <text x="201" y="31">
          OH
        </text>
        <path
          d="M50 138l18-9 18 9 18-9 18 9 18-9 18 9 18-9 18 9 18-9 18 9 18-9 18 9M50 164l18-9 18 9 18-9 18 9 18-9 18 9 18-9 18 9 18-9 18 9 18-9 18 9"
          fill="none"
          stroke="#a4a66c"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="180" y="196" textAnchor="middle">
          {t('脂肪中的烃链')}
        </text>
      </svg>
      <div className="bfp-phase-fact">{t('不同环境，染料的溶解倾向不同')}</div>
      <div className="bfp-qualifier">{t('蓝点表示氮；骨架中的碳、氢简写')}</div>
    </div>
  );
}
function DyeView({
  time,
  rinse = false,
  close = true,
}: {
  time: number;
  rinse?: boolean;
  close?: boolean;
}) {
  const patternId = `bfp-hatch-${useId().replace(/:/g, '')}`;
  const state = dyeFilmState(time, rinse),
    flux = partitionFluxes(state, { q: rinse ? 1 : 0 }),
    L = lipidGeometry;
  const bathOpacity = Math.min(0.55, (state.bath / 60) * 0.65),
    lipidOpacity = Math.min(0.9, (state.lipid / 40) * 0.83);
  return (
    <div className="bfp-dye">
      <div className="bfp-diagram-labels">
        <span>{t(rinse ? '清洗液带走背景染料' : '周围染液')}</span>
        <span>{t('同一脂肪滴')}</span>
      </div>
      <svg
        viewBox="0 0 360 224"
        role="img"
        aria-label={t('染料在脂肪和周围液体之间双向交换，清洗液把染料带到出口')}
      >
        <defs>
          <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 8L8 0" stroke="#c5c7b5" strokeWidth="1" />
          </pattern>
        </defs>
        <path
          d="M13 24Q14 13 28 14H334Q346 14 347 28V150Q346 167 329 168H26Q12 167 13 150Z"
          fill="#edf0d9"
          stroke="#a8b691"
          strokeWidth="2"
        />
        <path
          d="M17 26Q19 19 32 19H329Q342 18 342 33V148Q341 163 328 163H29Q17 163 17 148Z"
          fill="#d8a95c"
          opacity={bathOpacity}
        />
        <ellipse
          cx={L.cx}
          cy={L.cy}
          rx={L.rx}
          ry={L.ry}
          fill="#e7d8a4"
          stroke="#adae78"
          strokeWidth="1.5"
        />
        <ellipse cx={L.cx} cy={L.cy} rx={L.rx} ry={L.ry} fill="#d68836" opacity={lipidOpacity} />
        <ellipse
          cx={L.cx}
          cy={L.cy}
          rx={L.rx + 3}
          ry={L.ry + 3}
          fill="none"
          stroke="#9caa7a"
          strokeDasharray={rinse ? '3 5' : undefined}
          opacity={rinse ? 0.8 : 0.15}
        />
        {close &&
          Array.from({ length: 36 }, (_, i) => {
            const a = dyeTracer(i, time, rinse);
            return (
              <path
                key={i}
                data-dye-id={i}
                d={`M${a.x - 3.5} ${a.y - 2}l4 1 3-2m-3 2l-1 4`}
                fill="none"
                stroke={i === 0 ? '#664a2c' : '#b86c2b'}
                strokeWidth={i === 0 ? 2.7 : 1.9}
                strokeLinecap="round"
              />
            );
          })}
        {!close && (
          <>
            <ellipse cx="91" cy="91" rx="27" ry="18" fill="#d38d3f" opacity={lipidOpacity} />
            <ellipse cx="136" cy="52" rx="15" ry="12" fill="#d38d3f" opacity={lipidOpacity} />
          </>
        )}
        {!rinse && (
          <>
            <Arrow x1={141} x2={194} y={76} />
            <Arrow x1={194} x2={141} y={114} />
          </>
        )}
        {rinse && (
          <>
            <path
              d="M32 165V185Q32 193 41 197M52 166V183Q53 190 62 195"
              fill="none"
              stroke="#aab8a0"
              strokeWidth="2"
            />
            <rect x="14" y="194" width="132" height="24" rx="7" fill={`url(#${patternId})`} />
            <path
              d="M19 204H139"
              fill="none"
              stroke="#bd874b"
              strokeWidth="13"
              opacity={Math.min(0.7, state.collected / 60)}
            />
            <text x="168" y="211">
              {t('流出的染料')}
            </text>
          </>
        )}
      </svg>
      {!rinse && <div className="bfp-qualifier">{t('染料身份未改变')}</div>}
      <div className="bfp-phase-fact">
        {t(
          rinse
            ? time > 8
              ? '延长清洗：染料也能离开脂肪'
              : '背景减少，脂滴边界不变'
            : Math.abs(flux.net) < 0.13
              ? '仍有双向交换，净转移趋近零'
              : '双向交换，脂相逐渐富集',
        )}
      </div>
    </div>
  );
}
function Peptide({ p, sites = 3 }: { p: number; sites?: number }) {
  const formed = foodRamp(p, 0.1, 0.85),
    m = peptideMotif(formed),
    binding = coarseCopperBinding(1, sites);
  return (
    <div className="bfp-peptide">
      <div className="bfp-diagram-labels">
        <span>{t('连续肽链')}</span>
        <span>{t('碱性条件')}</span>
      </div>
      <svg viewBox="0 0 360 205" role="img" aria-label={t('肽段上的供体与铜配位，铜仍是正二价')}>
        {m.donors.slice(0, 3).map((a, i) => {
          const ca = m.carbons[2 * i],
            c = m.carbons[2 * i + 1],
            n = m.donors[i + 1],
            o = m.oxygens[i];
          return (
            <g key={i}>
              <Bond a={a} b={ca} />
              <Bond a={ca} b={c} />
              <Bond a={c} b={n} />
              <Bond a={{ x: c.x - 2, y: c.y }} b={{ x: o.x - 2, y: o.y }} />
              <Bond a={{ x: c.x + 2, y: c.y }} b={{ x: o.x + 2, y: o.y }} />
              <circle cx={o.x} cy={o.y} r="10" fill="#f4f3e8" />
              <text x={o.x} y={o.y + 6} textAnchor="middle" className="bfp-atom">
                O
              </text>
              <path
                d={`M${ca.x} ${ca.y}l${i === 1 ? 18 : 0} ${i === 1 ? 0 : -17}`}
                fill="none"
                stroke="#aeb8a2"
                strokeWidth="2"
              />
            </g>
          );
        })}
        <path
          d={`M${m.donors[0].x} ${m.donors[0].y}l-17 20m${m.donors[3].x - m.donors[0].x + 17} ${m.donors[3].y - m.donors[0].y - 20}l17 20`}
          fill="none"
          stroke="#9cae96"
          strokeWidth="2"
          strokeDasharray="3 4"
        />
        {m.donors.map((a) => (
          <g key={a.id}>
            {formed > 0.2 && sites > 0 && (
              <path
                d={`M${a.x} ${a.y}L${m.copper.x} ${m.copper.y}`}
                fill="none"
                stroke="#9077a4"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity={formed * binding.bound}
              />
            )}
            <circle cx={a.x} cy={a.y} r="13" fill="#e4e9da" />
            <text x={a.x} y={a.y + 6} textAnchor="middle" className="bfp-atom">
              N
            </text>
          </g>
        ))}
        <circle
          cx={m.copper.x}
          cy={m.copper.y}
          r="23"
          fill="#cfebee"
          stroke="#88aab2"
          strokeWidth="2"
        />
        <circle
          cx={m.copper.x}
          cy={m.copper.y}
          r="23"
          fill="#c1a7cf"
          stroke="#9e84b0"
          strokeWidth="2"
          opacity={formed * binding.bound}
        />
        <text x={m.copper.x} y={m.copper.y + 6} textAnchor="middle" className="bfp-atom">
          Cu
        </text>
      </svg>
      <div className="bfp-charge">+2 → +2</div>
      <div className="bfp-phase-fact">
        {t(sites > 0 ? '配位环境改变；铜没有被还原' : '没有可用结合位点，不能形成该配位示意')}
      </div>
      <div className="bfp-qualifier">{t('肽段配位示意')}</div>
    </div>
  );
}
function ThreeCauses({ index }: { index: number }) {
  const titles = ['新物质：氧化亚铜', '原染料：重新分配', '新配位环境：铜仍为 +2'];
  return (
    <div className="bfp-causes" data-food-cause={index}>
      <div className="bfp-cause-dots" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <i key={i} className={index === i ? 'is-current' : ''} />
        ))}
      </div>
      {index === 0 ? <Copper p={1} /> : index === 1 ? <DyeView time={18} /> : <Peptide p={1} />}
      <div className="bfp-cause-name">{t(titles[index])}</div>
    </div>
  );
}
export default function BioFoodTests() {
  const f = useShowcase(),
    uid = useId().replace(/:/g, '');
  const [mode, setMode] = useState<string | null>(null),
    [progress, setProgress] = useState(0.7),
    [sugar, setSugar] = useState<SugarCase>('sucrose'),
    [valid, setValid] = useState(true),
    [rinse, setRinse] = useState(2),
    [sites, setSites] = useState(3);
  const chapter = f.watch || mode === null ? f.chapter : Number(mode),
    p = f.watch ? f.chapterProgress : progress,
    director = foodDirector(chapter, f.chapterTime, browserLocale());
  let content;
  if (chapter === 0) {
    content =
      f.watch && director.shot === 'sugar-observation' ? (
        <PairedTubes p={director.observationProgress} uid={uid} />
      ) : (
        <Copper p={f.watch ? director.copperProgress : progress} />
      );
  } else if (chapter === 1) {
    if (!f.watch) {
      content = (
        <>
          <SugarStructure kind={sugar} hydrolysis={sugar === 'hydrolyzed' ? progress : 0} />
          <div className="bfp-interpretation">
            {t(
              !valid
                ? '阳性对照失效，暂不能判读。'
                : assayEvidence(sugar, true, progress).result === 'positive'
                  ? '预计可呈还原糖阳性'
                  : '含糖，但本项检测为阴性',
            )}
          </div>
        </>
      );
    } else if (director.shot === 'sucrose-observation')
      content = <PairedTubes p={1} uid={uid} sucrose />;
    else if (director.shot === 'glucose')
      content = <SugarStructure kind="glucose" opening={director.glucoseOpening} />;
    else if (director.shot === 'sucrose') content = <SugarStructure kind="sucrose" />;
    else if (director.shot === 'hydrolysis')
      content = <SugarStructure kind="hydrolyzed" hydrolysis={director.hydrolysisProgress} />;
    else
      content = (
        <>
          <div className="bfp-condition">{t('水解完成后，恢复相同检测条件')}</div>
          <PairedTubes p={director.predictionProgress} uid={uid} sucrose hydrolyzed />
        </>
      );
  } else if (chapter === 2)
    content =
      f.watch && director.shot === 'dye-affinity' ? (
        <DyeAffinity />
      ) : (
        <DyeView time={f.watch ? director.dyeTime : 18 * progress} />
      );
  else if (chapter === 3) content = <DyeView time={f.watch ? director.rinseTime : rinse} rinse />;
  else
    content = !f.watch ? (
      <Peptide p={progress} sites={sites} />
    ) : director.shot === 'protein-observation' ? (
      <PairedTubes p={director.observationProgress} uid={uid} protein />
    ) : director.shot === 'three-causes' ? (
      <ThreeCauses index={director.causeIndex} />
    ) : (
      <Peptide p={director.peptideProgress} sites={3} />
    );
  return (
    <section className={`bfp-root ${f.watch ? 'bfp-watch' : 'bfp-explore'}`}>
      <div
        className="bfp-scene"
        data-food-chapter={chapter}
        data-food-progress={p}
        data-food-shot={f.watch ? director.shot : 'explore'}
      >
        {content}
      </div>
      {!f.watch && (
        <div className="bfp-controls">
          <Segments
            value={String(chapter)}
            onChange={setMode}
            label={t('观察主题')}
            options={chapterNames.map((label, i) => ({ value: String(i), label: t(label) }))}
          />
          <Range
            label={t('观察位置')}
            min={0}
            max={1}
            step={0.01}
            value={progress}
            onChange={setProgress}
          />
          {chapter === 1 && (
            <>
              <Segments
                value={sugar}
                onChange={(v) => setSugar(v as SugarCase)}
                label={t('糖的结构')}
                options={[
                  { value: 'glucose', label: t('葡萄糖') },
                  { value: 'fructose', label: t('果糖') },
                  { value: 'sucrose', label: t('蔗糖') },
                  { value: 'hydrolyzed', label: t('先水解蔗糖') },
                ]}
              />
              <button
                type="button"
                className="bfp-valid-button"
                aria-pressed={!valid}
                onClick={() => setValid(!valid)}
              >
                {t(valid ? '阳性对照有效' : '阳性对照失效')}
              </button>
            </>
          )}
          {chapter === 3 && (
            <Range
              label={t('清洗量（教学单位）')}
              min={0}
              max={20}
              step={0.1}
              value={rinse}
              onChange={setRinse}
            />
          )}
          {chapter === 4 && (
            <Range
              label={t('可参与配位的位置（示意）')}
              min={0}
              max={5}
              step={0.5}
              value={sites}
              onChange={setSites}
            />
          )}
          <p>{t('模型解释原因，不计算食品含量或真实反应时间。')}</p>
        </div>
      )}
    </section>
  );
}
