import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  vinylGeometry,
  condensation,
  esterLink,
  resinRings,
  resinEdges,
  ringVertex,
  resinState,
  absorb,
  gelNodes,
  gelLinks,
  decantGeometry,
} from '../../models/chem-polymer-networks';
import '../../styles/chem-polymer-networks.css';
const modes = ['addition', 'condensation', 'acid', 'base', 'network', 'uptake', 'weigh'] as const;
type Mode = (typeof modes)[number];
const names = [
  '加聚：单体成为链段',
  '缩聚：连接与副产物',
  '酸催化酚醛树脂',
  '碱催化与继续交联',
  '吸水而不溶解的网络',
  '同质量材料吸水对比',
  '倾出余水，再扣除皮重',
];
const line = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  `M${a.x} ${a.y} L${b.x} ${b.y}`;
function Addition({ p }: { p: number }) {
  const atoms = vinylGeometry(p);
  return (
    <>
      <svg
        className="cpn-molecule"
        viewBox="0 0 320 250"
        role="img"
        aria-label={t('八个碳和四个氯在加聚前后保持身份')}
      >
        {[0, 2, 4, 6].map((i) => (
          <g key={i}>
            <path d={line(atoms[i], atoms[i + 1])} stroke="#828b71" strokeWidth="3" />
            <path
              d={line(
                { x: atoms[i].x, y: atoms[i].y + 7 },
                { x: atoms[i + 1].x, y: atoms[i + 1].y + 7 },
              )}
              stroke="#a98155"
              strokeWidth="3"
              opacity={1 - p}
            />
          </g>
        ))}
        {[1, 3, 5].map((i) => (
          <path
            key={i}
            d={line(atoms[i], atoms[i + 1])}
            stroke="#b58753"
            strokeWidth="3"
            opacity={p}
          />
        ))}
        <path
          d={`M${atoms[0].x - 28} ${atoms[0].y} L${atoms[0].x} ${atoms[0].y} M${atoms[7].x} ${atoms[7].y} L${atoms[7].x - 28} ${atoms[7].y}`}
          stroke="#828b71"
          strokeWidth="3"
          opacity={p}
        />
        {atoms.map((a, i) => (
          <g key={a.id}>
            {a.chlorine && (
              <>
                <path
                  d={`M${a.x} ${a.y} V${a.y + a.side * 34}`}
                  stroke="#79948a"
                  strokeWidth="2.5"
                />
                <text x={a.x} y={a.y + a.side * 42 + 7} fill="#567f72">
                  Cl
                </text>
              </>
            )}
            <rect
              x={a.x - 21}
              y={a.y - 13}
              width="42"
              height="27"
              rx="9"
              fill={i % 2 ? '#ece7ca' : '#f5f0dc'}
            />
            <text x={a.x} y={a.y + 7}>
              {i % 2 ? 'CH' : 'CH₂'}
            </text>
          </g>
        ))}
      </svg>
      <div className="cpn-equation">8 C · 4 Cl → 8 C · 4 Cl</div>
      <p className="cpn-sub">{t('氯乙烯链段；端基省略，副产物为零')}</p>
    </>
  );
}
function Condense({ p, n }: { p: number; n: number }) {
  const a = esterLink(p),
    c = condensation(n);
  return (
    <>
      <svg
        className="cpn-molecule"
        viewBox="0 0 320 225"
        role="img"
        aria-label={t('羧酸羟基氧进入水，醇氧保留在酯键中')}
      >
        <path d="M38 75 H68 M77 60 V40 M83 60 V40" stroke="#8e8d72" strokeWidth="3" />
        <text x="23" y="82">
          R
        </text>
        <text x="80" y="82">
          C
        </text>
        <text x="80" y="35">
          O
        </text>
        <path d={line(a.carbon, a.acidO)} opacity={1 - p} stroke="#aa8a63" strokeWidth="3" />
        <path d={line(a.carbon, a.alcoholO)} opacity={p} stroke="#aa8a63" strokeWidth="3" />
        <path d={line(a.alcoholO, a.alcoholH)} opacity={1 - p} stroke="#939b86" strokeWidth="2" />
        <path d={line(a.acidO, a.alcoholH)} opacity={p} stroke="#939b86" strokeWidth="2" />
        <path d={line(a.acidO, a.acidH)} stroke="#939b86" strokeWidth="2" />
        <path d={line(a.alcoholO, a.alcoholR)} stroke="#939b86" strokeWidth="3" />
        {Object.entries(a)
          .filter(([k]) => !['carbon', 'carbonyl'].includes(k))
          .map(([k, v]) => (
            <g key={k}>
              <circle cx={v.x} cy={v.y} r="11" fill="#f3eed9" />
              <text
                x={v.x}
                y={v.y + 7}
                fill={k === 'acidO' ? '#b4815d' : k === 'alcoholO' ? '#648d7e' : undefined}
              >
                {k.endsWith('H') ? 'H' : k.endsWith('R') ? 'R′' : 'O'}
              </text>
            </g>
          ))}
      </svg>
      <div className="cpn-equation">
        {c.monomers} {t('双官能团单体')} → {c.water} H₂O
      </div>
      <p className="cpn-sub">{t('一条开链：两端保留，连接数 = 2n − 1')}</p>
    </>
  );
}
function Bath({ p, base }: { p: number; base: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className="cpn-bath"
      viewBox="0 0 160 210"
      role="img"
      aria-label={t('反应试管在水浴中加热')}
    >
      <defs>
        <clipPath id={id}>
          <path d="M56 15 V135 Q56 155 80 155 Q104 155 104 135 V15 Z" />
        </clipPath>
      </defs>
      <path
        d="M12 63 V170 Q12 180 22 180 H138 Q148 180 148 170 V63"
        fill="#d4e3df"
        fillOpacity=".5"
        stroke="#8eaaa6"
        strokeWidth="2"
      />
      <path d="M15 95 Q40 90 65 95 T145 95" stroke="#9fbfc1" fill="none" />
      <g clipPath={`url(#${id})`}>
        <rect x="56" y="78" width="48" height="80" fill="#e6cb91" />
        <rect
          x="56"
          y={135 - 42 * p}
          width="48"
          height="70"
          fill={base ? '#8f6e47' : '#b99a63'}
          opacity={p * 0.8}
        />
        <path d="M73 -5 L86 144" stroke="#b8c0ac" strokeWidth="4" opacity={base ? 0 : 1} />
      </g>
      <path
        d="M54 12 V135 Q54 158 80 158 Q106 158 106 135 V12"
        fill="none"
        stroke="#8fa09b"
        strokeWidth="2.5"
      />
      <path d="M8 184 H152 Q156 184 156 192 V199 H4 V192 Q4 184 8 184" fill="#c5cbb9" />
      <path d="M20 190 H48" stroke="#bf9773" strokeWidth="3" />
    </svg>
  );
}
function Resin({ p, base, excess }: { p: number; base: boolean; excess: boolean }) {
  const s = resinState(base, excess, p);
  return (
    <>
      <div className="cpn-resin-label">
        {base
          ? excess
            ? t('碱催化 · 甲醛过量 · 继续反应')
            : t('碱催化 · 未满足甲醛过量条件')
          : t('酸催化 · 等物质的量的教材模型')}
      </div>
      <div className="cpn-resin">
        <Bath p={p} base={base} />
        <svg
          className="cpn-rings"
          viewBox="0 0 330 265"
          role="img"
          aria-label={t('亚甲基连接苯酚的邻位或对位，羟基保留')}
        >
          {resinEdges.map((e, i) => {
            const a = ringVertex(e.a, e.av),
              b = ringVertex(e.b, e.bv),
              x = (a.x + b.x) / 2,
              y = (a.y + b.y) / 2,
              opacity = e.cross ? s.crosslink : s.linear;
            return (
              <g key={i} opacity={opacity}>
                <path d={line(a, b)} stroke={e.cross ? '#a5754e' : '#8d9b81'} strokeWidth="3" />
                <rect x={x - 23} y={y - 14} width="46" height="27" rx="10" fill="#ece8d3" />
                <text x={x} y={y + 7}>
                  CH₂
                </text>
              </g>
            );
          })}
          {resinRings.map((r, i) => {
            const vertices = Array.from({ length: 6 }, (_, v) => ringVertex(i, v));
            return (
              <g key={r.id}>
                <polygon
                  points={vertices.map((v) => `${v.x},${v.y}`).join(' ')}
                  fill="#f5efda"
                  stroke="#8c9b7f"
                  strokeWidth="2"
                />
                <circle cx={r.x} cy={r.y} r="12" fill="none" stroke="#8c9b7f" strokeWidth="1.5" />
                <path
                  d={`M${vertices[0].x} ${vertices[0].y} V${r.y + (i < 3 ? -32 : 32)}`}
                  stroke="#8c9b7f"
                  strokeWidth="2"
                />
                <text x={r.x} y={r.y + (i < 3 ? -38 : 48)}>
                  OH
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {!excess && base && <p className="cpn-sub">{t('缺少甲醛过量条件：本模型不形成交联网')}</p>}
    </>
  );
}
function Gel({ p }: { p: number }) {
  const a = gelNodes(p);
  return (
    <>
      <svg
        className="cpn-gel"
        viewBox="0 0 320 270"
        role="img"
        aria-label={t('水进入带亲水基团的交联网，原来的连接保留')}
      >
        <rect x="4" y="6" width="312" height="255" rx="35" fill="#d6e5e3" />
        {gelLinks.map(([i, j], k) => (
          <path
            key={k}
            d={`M${a[i].x} ${a[i].y} Q${(a[i].x + a[j].x) / 2} ${(a[i].y + a[j].y) / 2 + 8} ${a[j].x} ${a[j].y}`}
            fill="none"
            stroke={j - i === 6 ? '#aa8158' : '#80967f'}
            strokeWidth={j - i === 6 ? 4 : 3}
          />
        ))}
        {a.map((n) => (
          <circle key={n.id} cx={n.x} cy={n.y} r="4" fill="#799781" />
        ))}
        {[2, 9, 15, 22].map((i, k) => (
          <g key={i}>
            <path d={`M${a[i].x} ${a[i].y} V${a[i].y - 15}`} stroke="#7a9384" strokeWidth="2" />
            <text x={a[i].x} y={a[i].y - 21}>
              COO⁻
            </text>
          </g>
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <circle
            key={i}
            cx={24 + (i % 3) * 130 + (160 - (24 + (i % 3) * 130)) * 0.6 * p}
            cy={30 + Math.floor(i / 3) * 98 + (135 - (30 + Math.floor(i / 3) * 98)) * 0.6 * p}
            r="4"
            fill="#79a8b7"
            opacity=".7"
          />
        ))}
      </svg>
      <div className="cpn-key">
        <span>
          <i />
          {t('亲水链段')}
        </span>
        <span>
          <i className="cross" />
          {t('少量交联')}
        </span>
        <span>
          <i className="water" />
          {t('水')}
        </span>
      </div>
    </>
  );
}
function Sample({
  resin,
  uptake,
  drain,
  capacity,
  water,
  tare,
  weigh,
}: {
  resin: boolean;
  uptake: number;
  drain: number;
  capacity: number;
  water: number;
  tare: number;
  weigh: boolean;
}) {
  const s = absorb(1, water, capacity, uptake, drain, tare),
    id = useId().replace(/:/g, ''),
    g = decantGeometry(drain),
    h = 18 + Math.min(75, s.bound) * 1.05,
    waterH = s.residual * 1.05;
  return (
    <div className="cpn-sample">
      <b>{resin ? t('树脂') : t('脱脂棉')}</b>
      <svg viewBox="-8 0 216 242" role="img" aria-label={t('烧杯中湿材料与未吸收的水分别计量')}>
        <defs>
          <clipPath id={id}>
            <path
              transform={`rotate(${g.angle} 100 140)`}
              d="M55 40 V160 Q55 168 65 168 H135 Q145 168 145 160 V40 Z"
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          <rect
            x="-8"
            y={168 - h - waterH}
            width="216"
            height={h + waterH}
            fill="#a9cad2"
            opacity=".5"
          />
          <g transform={`rotate(${g.angle} 100 140)`}>
            <path
              d={`M56 166 V${166 - h} Q76 ${156 - h} 95 ${166 - h} T144 ${166 - h} V166 Z`}
              fill={resin ? '#d5d7a7' : '#ede7d3'}
              fillOpacity=".95"
            />
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`M60 ${163 - (i * h) / 6} Q90 ${150 - (i * h) / 6} 140 ${162 - (i * h) / 6}`}
                fill="none"
                stroke={resin ? '#a7b594' : '#d0c6a7'}
                strokeWidth="1.5"
              />
            ))}
          </g>
        </g>
        <path
          transform={`rotate(${g.angle} 100 140)`}
          d="M51 36 V160 Q51 172 65 172 H135 Q149 172 149 160 V36"
          fill="none"
          stroke="#8aaca8"
          strokeWidth="2.8"
        />
        <path
          d={`M${g.lip.x} ${g.lip.y} Q${g.lip.x - 15} 130 23 192`}
          stroke="#8ebac7"
          strokeWidth="4"
          opacity={g.stream * (s.free > 0 ? 1 : 0)}
          fill="none"
        />
        <path
          d="M3 177 V196 Q3 202 10 202 H39 Q46 202 46 196 V177"
          stroke="#a3b6ab"
          fill="#e7ede4"
        />
        <rect
          x="6"
          y={198 - (20 * s.drained) / 70}
          width="37"
          height={(20 * s.drained) / 70}
          fill="#a8cbd2"
        />
        <path d="M57 178 H157 L170 210 H44 Z" fill="#d1d6c4" />
        <rect x="63" y="211" width="89" height="27" rx="7" fill="#eff1dc" stroke="#afb99e" />
        <text x="107" y="231">
          {(weigh ? s.gross : s.dry + s.water + s.tare).toFixed(1)} g
        </text>
      </svg>
      <div className="cpn-mass">
        {weigh ? (
          <>
            {t('皮重')} <span className="cpn-number">{tare} g</span>
            <br />
            {t('湿样')} <span className="cpn-number">{(s.wet + s.residual).toFixed(1)} g</span>
          </>
        ) : (
          <>
            {t('吸收水')} {s.bound.toFixed(1)} g<br />
            {t('剩余游离水')} {s.residual.toFixed(1)} g
          </>
        )}
      </div>
      {weigh && <strong className="cpn-ratio">{s.apparentRatio.toFixed(1)} g/g</strong>}
    </div>
  );
}
export default function ChemPolymerNetworks({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      variant === 'resin' ? 'acid' : variant === 'absorption' ? 'network' : 'addition',
    ),
    [progress, setProgress] = useState(0.5),
    [pairs, setPairs] = useState(2),
    [excess, setExcess] = useState('yes'),
    [cap, setCap] = useState(50),
    [water, setWater] = useState(70),
    [tare, setTare] = useState(43);
  const m = f.watch ? modes[Math.min(6, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.12, 0.82)) : progress;
  return (
    <div className={`cpn ${f.watch ? 'is-watch' : ''}`}>
      <div className="cpn-stage">
        {m === 'addition' ? (
          <Addition p={p} />
        ) : m === 'condensation' ? (
          <Condense p={p} n={f.watch ? 2 : pairs} />
        ) : m === 'acid' || m === 'base' ? (
          <Resin p={p} base={m === 'base'} excess={f.watch || excess === 'yes'} />
        ) : m === 'network' ? (
          <Gel p={p} />
        ) : (
          <>
            <p className="cpn-sample-note">{t('相同干质量 1.0 g · 假设样本数据')}</p>
            <div className="cpn-samples">
              {[true, false].map((resin) => (
                <Sample
                  key={String(resin)}
                  resin={resin}
                  uptake={m === 'uptake' ? p : 1}
                  drain={m === 'weigh' ? p : 0}
                  capacity={resin ? (f.watch ? 50 : cap) : 12}
                  water={f.watch ? 70 : water}
                  tare={f.watch ? 43 : tare}
                  weigh={m === 'weigh'}
                />
              ))}
            </div>
            {m === 'weigh' && <div className="cpn-equation">(m₂ − m₁) / m₁</div>}
          </>
        )}
      </div>
      {!f.watch && (
        <div className="cpn-controls">
          <Segments
            label={t('合成、结构与测量')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          <Range
            label={t('教学进程')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {m === 'condensation' && (
            <Range
              label={t('二酸与二醇各自分子数 n')}
              value={pairs}
              min={1}
              max={6}
              step={1}
              onChange={setPairs}
            />
          )}{' '}
          {m === 'base' && (
            <Segments
              label={t('甲醛配比条件')}
              value={excess}
              options={[
                { value: 'yes', label: t('过量') },
                { value: 'no', label: t('未满足过量条件') },
              ]}
              onChange={setExcess}
            />
          )}{' '}
          {(m === 'uptake' || m === 'weigh') && (
            <>
              <Range
                label={t('假设树脂容量（g/g）')}
                value={cap}
                min={0}
                max={100}
                step={1}
                onChange={setCap}
              />
              <Range
                label={t('初始水质量（g）')}
                value={water}
                min={0}
                max={70}
                step={1}
                onChange={setWater}
              />
              {m === 'weigh' && (
                <Range
                  label={t('烧杯皮重（g）')}
                  value={tare}
                  min={20}
                  max={70}
                  step={1}
                  onChange={setTare}
                />
              )}
            </>
          )}
        </div>
      )}
      <small className="cpn-note">
        {t('拓扑、净连接及称量守恒模型；吸水容量是假设数据，非材料性能预测。')}
      </small>
    </div>
  );
}
