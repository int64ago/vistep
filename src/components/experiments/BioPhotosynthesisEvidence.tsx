import { useState } from 'react';
import { browserLocale, t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  engelmannBacteria,
  hillReaction,
  oxygenIsotope,
  photosynthesisCoupling,
  leafDiscs,
  ACID_BASE_ATP,
  CALVIN_RECORDS,
  gradientCoupling,
  lightGradientEpisode,
  synthaseProton,
  SYNTHASE_GEOMETRY,
  carbonFixation,
  carrierPosition,
  photoDirector,
  PHOTO_CHAPTERS,
  PHOTO_PLANNED_SECONDS,
  type Illumination,
  type PhotoMode,
} from '../../models/bio-photosynthesis-evidence';
import { spectralColor } from '../../models/bio-leaf-pigments';
import '../../styles/bio-photosynthesis-evidence.css';
const names = [
  '光斑与细菌',
  '颜色与产氧',
  '无碳也放氧',
  '氧从哪里来',
  '梯度怎样做功',
  '能量载体往返',
  '追踪碳的去向',
  '先排除原有空气',
  '从下沉到上浮',
];
const clamp = (p: number) => Math.max(0, Math.min(1, p));
const blend = (a: number, b: number, p: number) => a + (b - a) * p;
function Chloroplast({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse rx="42" ry="24" fill="#c1d3a9" stroke="#7a9870" strokeWidth="2" />
      <ellipse rx="37" ry="20" fill="none" stroke="#98b486" />
      {[-23, 0, 23].map((cx) => (
        <g key={cx}>
          {[-7, -1, 5].map((cy) => (
            <rect key={cy} x={cx - 9} y={cy} width="18" height="4" rx="2" fill="#79945e" />
          ))}
        </g>
      ))}
      <path d="M-15 2H15" fill="none" stroke="#8aa36d" strokeWidth="2" />
    </g>
  );
}
function Alga({
  p,
  lighting,
  spot,
  expansion,
}: {
  p: number;
  lighting: Illumination;
  spot: number;
  expansion: number;
}) {
  const full = engelmannBacteria(1, 'full'),
    initial = engelmannBacteria(p, lighting, spot);
  return (
    <>
      <svg viewBox="0 0 300 205" role="img" aria-label={t('同一水绵外侧的细菌分布随产氧区域改变')}>
        <rect
          x="12"
          y="92"
          width="276"
          height="50"
          rx="12"
          fill="#dce4c2"
          stroke="#8da87b"
          strokeWidth="2"
        />
        {[66, 122, 178, 234].map((x) => (
          <path key={x} d={`M${x} 93V141`} stroke="#a0b68a" />
        ))}
        <path
          d={Array.from(
            { length: 139 },
            (_, i) =>
              `${i ? 'L' : 'M'}${12 + i * 2} ${117 + 16 * Math.sin((i / 138) * Math.PI * 10)}`,
          ).join(' ')}
          fill="none"
          stroke="#71965b"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {lighting === 'spectrum'
          ? Array.from({ length: 30 }, (_, i) => (
              <rect
                key={i}
                x={12 + i * 9.2}
                y="18"
                width="9.3"
                height="125"
                fill={spectralColor(400 + i * 10)}
                opacity=".25"
              />
            ))
          : lighting !== 'dark' && (
              <rect
                x={blend(12 + spot * 276 - 12, 12, expansion)}
                y="18"
                width={24 + 252 * expansion}
                height="125"
                rx="6"
                fill="#e5cd7e"
                opacity=".43"
              />
            )}
        {initial.map((b, i) => {
          const x = 12 + (blend(b.x, full[i].x, expansion) - 30) * 0.92,
            y = blend(b.y, full[i].y, expansion) - 12;
          return (
            <rect
              data-bacterium={b.id}
              key={b.id}
              x={x - 3}
              y={y - 1.5}
              width="6"
              height="3"
              rx="1.5"
              fill="#536f61"
              transform={`rotate(${(b.id * 37) % 150} ${x} ${y})`}
            />
          );
        })}
        {lighting === 'spectrum' ? (
          <>
            <text x="13" y="195">
              400 nm
            </text>
            <text x="287" y="195" textAnchor="end">
              700 nm
            </text>
          </>
        ) : (
          <text x="150" y="195" textAnchor="middle">
            {t(expansion > 0.8 ? '全面照光' : lighting === 'dark' ? '黑暗' : '局部光')}
          </text>
        )}
      </svg>
      <p className="bpe12-note">{t('短杆指示氧，不能直接测光。')}</p>
    </>
  );
}
function Hill({ p, light, acceptor }: { p: number; light: boolean; acceptor: boolean }) {
  return (
    <>
      <div className="bpe12-vials">
        {[true, false].map((on, i) => {
          const r = hillReaction(p, on && light, acceptor);
          return (
            <div key={i}>
              <p>{t(on ? '照光组' : '黑暗组')}</p>
              <svg
                viewBox="0 0 130 160"
                data-oxygen={r.oxygen}
                role="img"
                aria-label={t('同样无二氧化碳，照光与黑暗的离体叶绿体对照')}
              >
                <path
                  d="M22 18V129Q22 149 65 149Q108 149 108 129V18"
                  fill="#dfe8d2"
                  stroke="#8d9f83"
                  strokeWidth="2"
                />
                <rect x="19" y="10" width="92" height="13" rx="5" fill="#aab99d" />
                {on && light && <path d="M1 45L111 75L1 103Z" fill="#dec47b" opacity=".4" />}
                <path d="M24 60H106" stroke="#bdcbb1" />
                <Chloroplast x={65} y={116} scale={0.7} />
                {Array.from({ length: 6 }, (_, j) => (
                  <circle
                    key={j}
                    cx={40 + j * 9}
                    cy={94 - ((p + j / 6) % 1) * 48}
                    r="3"
                    fill="#f8fbef"
                    stroke="#9db4a0"
                    opacity={r.oxygen}
                  />
                ))}
              </svg>
              <p className={r.oxygen > 0.1 ? 'bpe12-positive' : ''}>
                {t(r.oxygen > 0.1 ? '检出氧气' : '未检出放氧')}
              </p>
            </div>
          );
        })}
      </div>
      <p className="bpe12-note">
        {t(acceptor ? '无 CO₂ · 有电子受体' : '缺少电子受体：持续放氧受限')}
      </p>
    </>
  );
}
function Isotopes({ p, swap }: { p: number; swap: boolean }) {
  return (
    <div className="bpe12-isotopes">
      {[!swap, swap].map((water, i) => {
        const s = oxygenIsotope(water, !water);
        return (
          <div key={i}>
            <p>{water ? 'H₂¹⁸O + CO₂' : 'H₂O + C¹⁸O₂'}</p>
            <svg
              viewBox="0 0 300 78"
              role="img"
              aria-label={t('只追踪氧：水的两个氧保持身份进入释放的氧气')}
            >
              <path d="M65 36H239" stroke="#c3cdb6" fill="none" strokeDasharray="4 5" />
              {s.oxygenAtoms.map((o, j) => {
                const x = blend(34 + j * 45, 222 + j * 39, p),
                  y = 36;
                return (
                  <g key={o.id} data-oxygen={`${i}-${o.id}`}>
                    <circle cx={x} cy={y} r="17" fill={o.mass === 18 ? '#b98455' : '#6d9788'} />
                    <text x={x} y={y + 6} textAnchor="middle" fill="#fff">
                      {o.mass}
                    </text>
                  </g>
                );
              })}
              <path
                d={`M${blend(34, 222, p) + 17} 36H${blend(79, 261, p) - 17}`}
                stroke="#749981"
                strokeWidth="3"
                opacity={p}
              />
              <text x="150" y="72" textAnchor="middle">
                {water ? '¹⁸O₂' : '¹⁶O₂'}
              </text>
            </svg>
          </div>
        );
      })}
      <p className="bpe12-note">{t('仅追踪氧原子；两组分别标记。')}</p>
    </div>
  );
}
function ATPRecord() {
  return (
    <div className="bpe12-record">
      <p>{t('1966 · 黑暗中的独立实验')}</p>
      <div className="bpe12-record-bars">
        {ACID_BASE_ATP.map((r) => (
          <div key={r.id}>
            <span>pH {r.acidPH.toFixed(1)}</span>
            <i style={{ height: `${(r.totalATP / 141) * 90}px` }} />
            <strong>{r.totalATP}</strong>
          </div>
        ))}
      </div>
      <p>{t('两组随后都转入 pH 8')}</p>
      <p className="bpe12-note">{t('ATP 总量 · nmol / mg 叶绿素')}</p>
    </div>
  );
}
function ATPMotor({
  time,
  leak,
  deltaPH,
  adp,
  phosphate,
}: {
  time: number;
  leak: number;
  deltaPH: number;
  adp: boolean;
  phosphate: boolean;
}) {
  const s = gradientCoupling(Math.max(0, time - 1), { leak, deltaPH, adp, phosphate }),
    h = synthaseProton(s.turns, clamp(time));
  const bind = clamp(s.atp / 0.65),
    release = clamp((s.atp - 1) / 0.6),
    gamma = clamp((s.atp - 0.65) / 0.35);
  const ax = blend(blend(22, 94, bind), 145, release),
    py = 204;
  return (
    <>
      <svg
        viewBox="0 0 300 255"
        data-atp={s.atp}
        data-gradient={s.q}
        data-productive-protons={s.passed}
        role="img"
        aria-label={t('质子沿入口、转子结合位点和独立出口移动，转轴耦联基质侧的ATP合成')}
      >
        <rect x="0" y="20" width="300" height="70" rx="18" fill="#e7d9b7" />
        <rect x="0" y="150" width="300" height="87" rx="18" fill="#e2eacb" />
        {[91, 149].map((y) => (
          <g key={y}>
            {Array.from({ length: 16 }, (_, i) => (
              <g key={i}>
                <circle cx={i * 20} cy={y} r="5" fill="#93ab78" />
                <path
                  d={`M${i * 20 - 2} ${y + (y === 91 ? 5 : -5)}v${y === 91 ? 18 : -18}m4 0v${y === 91 ? -18 : 18}`}
                  stroke="#a6b889"
                  strokeWidth="2"
                  fill="none"
                />
              </g>
            ))}
          </g>
        ))}
        <path
          d="M105 62Q62 69 66 129L64 170Q81 182 98 164L119 158H169Q195 135 186 101Q184 75 155 65Z"
          fill="#b8b8a0"
          stroke="#8d9786"
          strokeWidth="2"
        />
        <path
          d={SYNTHASE_GEOMETRY.entry}
          stroke="#f6f1d9"
          strokeWidth="13"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={SYNTHASE_GEOMETRY.exit}
          stroke="#e2eacb"
          strokeWidth="13"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="135" cy="120" r="35" fill="#c9a878" stroke="#9d825b" strokeWidth="3" />
        {Array.from({ length: 14 }, (_, i) => {
          const theta = -Math.PI / 2 + 0.2 + (i / 14) * Math.PI * 2 + s.turns * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={135 + 29 * Math.cos(theta)}
              cy={120 + 29 * Math.sin(theta)}
              r="4"
              fill={i === 0 ? '#fcf7e4' : '#9a8059'}
            />
          );
        })}
        <path d="M135 150V182" stroke="#9e845b" strokeWidth="9" />
        <path
          d={`M${135 + 7 * Math.cos(s.turns * Math.PI * 2)} 151L${135 + 7 * Math.cos(s.turns * Math.PI * 2 + 1)} 176M${135 - 7 * Math.cos(s.turns * Math.PI * 2)} 151L${135 - 7 * Math.cos(s.turns * Math.PI * 2 + 1)} 176`}
          stroke="#e9dbc3"
          strokeWidth="2"
          fill="none"
        />
        <ellipse
          cx="140"
          cy="202"
          rx="70"
          ry="29"
          fill="#d8c5a0"
          stroke="#a78d67"
          strokeWidth="2"
        />
        {adp && (
          <g>
            <path d={`M${ax} ${py}H${ax + 60}`} stroke="#777f6c" strokeWidth="3" />
            {[0, 1, 2].map((i) => (
              <g key={i} data-substrate={`ADP-${i}`}>
                <circle cx={ax + i * 30} cy={py} r="13" fill={i ? '#b79660' : '#a8b78b'} />
                <text x={ax + i * 30} y={py + 6} textAnchor="middle" fill="#fff">
                  {i ? 'P' : 'A'}
                </text>
              </g>
            ))}
          </g>
        )}
        {phosphate && (
          <g data-substrate="Pi">
            <path
              d={`M${ax + 73} ${py}H${ax + 77}`}
              stroke="#777f6c"
              strokeWidth="3"
              opacity={gamma}
            />
            <circle
              cx={blend(275, ax + 90, bind)}
              cy={blend(178, py, bind)}
              r="13"
              fill="#b79660"
            />
            <text
              x={blend(275, ax + 90, bind)}
              y={blend(178, py, bind) + 6}
              textAnchor="middle"
              fill="#fff"
            >
              P
            </text>
          </g>
        )}
        <circle
          data-proton="H-tracked"
          cx={h.x}
          cy={h.y}
          r="10"
          fill="#b16e4d"
          stroke="#fff8e7"
          strokeWidth="2"
        />
        <text x={h.x + 14} y={h.y + 6}>
          H⁺
        </text>
        <text x="10" y="24">
          {t('类囊体腔')}
        </text>
        <text x="290" y="173" textAnchor="end">
          {t('叶绿体基质')}
        </text>
        <text x="150" y="246" textAnchor="middle">
          {!adp ? '− ADP' : !phosphate ? '− Pi' : s.atp >= 1 ? 'ATP' : 'ADP + Pi'}
        </text>
        {leak > 0 && (
          <g>
            <path d="M248 88V151" stroke="#d7d9b2" strokeWidth="14" />
            <path d="M248 89V150m-6-10 6 10 6-10" stroke="#b16e4d" strokeWidth="2" fill="none" />
            <text x="248" y="73" textAnchor="middle">
              {t('旁路')}
            </text>
          </g>
        )}
      </svg>
      <div className="bpe12-energy">
        <span>
          {t('剩余梯度')}
          <i>
            <b style={{ width: `${s.initialQ ? (s.q / s.initialQ) * 100 : 0}%` }} />
          </i>
        </span>
        <span>{t(leak ? '同样初始梯度，另开旁路。' : '转轴连接催化头')}</span>
      </div>
    </>
  );
}
function Charge({ progress }: { progress: number }) {
  const s = lightGradientEpisode(progress);
  return (
    <>
      <svg
        viewBox="0 0 300 235"
        role="img"
        aria-label={t('光改变电子能量状态，耦联的膜内电子传递支持质子向类囊体腔积累')}
      >
        <rect x="0" y="20" width="300" height="70" rx="18" fill="#e7d9b7" />
        <rect x="0" y="160" width="300" height="70" rx="18" fill="#e2eacb" />
        {[95, 155].map((y) => (
          <path key={y} d={`M0 ${y}H300`} stroke="#9bb37e" strokeWidth="9" />
        ))}
        <rect
          x="32"
          y="87"
          width="48"
          height="82"
          rx="20"
          fill="#87a47e"
          stroke="#718f6e"
          strokeWidth="2"
        />
        <rect
          x="145"
          y="77"
          width="55"
          height="92"
          rx="23"
          fill="#a8b7a1"
          stroke="#839781"
          strokeWidth="2"
        />
        <path d="M55 140V110L215 140" fill="none" stroke="#a4b18b" strokeWidth="4" />
        <path d="M172 205V45m-6 9 6-9 6 9" fill="none" stroke="#b29161" strokeWidth="3" />
        <g transform={`translate(${s.photon.x} ${s.photon.y})`} opacity={s.photon.opacity}>
          <path d="M-6-15L4-7L-4 2L5 12" fill="none" stroke="#d4ad4f" strokeWidth="4" />
        </g>
        <circle
          data-electron={s.electron.id}
          cx={s.electron.x}
          cy={s.electron.y}
          r="10"
          fill={s.electron.excited > 0.5 ? '#c6a454' : '#7a9170'}
        />
        <text x={s.electron.x + 14} y={s.electron.y + 5}>
          e⁻
        </text>
        <circle data-proton={s.proton.id} cx={s.proton.x} cy={s.proton.y} r="10" fill="#b16e4d" />
        <text x={s.proton.x + 14} y={s.proton.y + 6}>
          H⁺
        </text>
        <text x="10" y="24">
          {t('类囊体腔')}
        </text>
        <text x="290" y="220" textAnchor="end">
          {t('叶绿体基质')}
        </text>
      </svg>
      <p className="bpe12-note">{t('光 → 电子传递 → 质子积累')}</p>
    </>
  );
}
function ATP({
  shot,
  time,
  leak,
  deltaPH,
  adp,
  phosphate,
}: {
  shot: string;
  time: number;
  leak: number;
  deltaPH: number;
  adp: boolean;
  phosphate: boolean;
}) {
  if (shot === 'record') return <ATPRecord />;
  if (shot === 'charge') return <Charge progress={time} />;
  if (shot === 'observation')
    return (
      <>
        <svg
          viewBox="0 0 300 220"
          role="img"
          aria-label={t('离体叶绿体在光下形成ATP的研究结果重构')}
        >
          <Chloroplast x={150} y={105} scale={1.9} />
          <path d="M55 20L120 65M151 10V53M245 20L186 65" stroke="#cfb36f" strokeWidth="5" />
          <text x="150" y="185" textAnchor="middle">
            ADP + Pi → ATP
          </text>
          <text x="150" y="208" textAnchor="middle">
            1954 · {t('结果重构')}
          </text>
        </svg>
        <p className="bpe12-note">{t('光怎样推动这一步？')}</p>
      </>
    );
  return <ATPMotor time={time} leak={leak} deltaPH={deltaPH} adp={adp} phosphate={phosphate} />;
}
function Coupling({ time, off, co2 }: { time: number; off: number; co2: boolean }) {
  const s = photosynthesisCoupling(time, off, co2);
  return (
    <>
      <svg
        viewBox="0 0 300 230"
        role="img"
        aria-label={t('ATP和NADPH连接类囊体与碳反应，熄灯后有限存量继续消耗')}
      >
        <ellipse
          cx="150"
          cy="112"
          rx="145"
          ry="101"
          fill="#e1e8c8"
          stroke="#93aa79"
          strokeWidth="2"
        />
        <ellipse cx="150" cy="112" rx="139" ry="95" fill="none" stroke="#bccba3" />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x="32"
            y={79 + i * 12}
            width="55"
            height="9"
            rx="4"
            fill="#9bb47e"
            stroke="#7d9a64"
          />
        ))}
        {s.light && (
          <path d="M28 22L50 65M66 18V62M100 25L83 66" stroke="#cfb36f" strokeWidth="4" />
        )}
        <circle cx="232" cy="112" r="39" fill="#cbd8b0" stroke="#90a372" strokeWidth="2" />
        <text x="232" y="106" textAnchor="middle">
          CO₂
        </text>
        <text x="232" y="132" textAnchor="middle">
          ↓ C₃
        </text>
        <path
          d="M90 91Q150 20 206 87M206 145Q145 205 88 140"
          fill="none"
          stroke="#a8b88d"
          strokeWidth="2"
        />
        {[0, 1].map((i) => {
          const q = carrierPosition(s.triose / 1.2, i);
          return (
            <g key={i} data-carrier={`carrier-${i}`}>
              <circle
                cx={q.x}
                cy={q.y}
                r="8"
                fill={i ? '#729383' : '#b49861'}
                stroke={q.loaded ? '#e5bc66' : '#c9d7bc'}
                strokeWidth="3"
              />
            </g>
          );
        })}
        <text x="150" y="30" textAnchor="middle">
          ATP · NADPH
        </text>
        <text x="150" y="221" textAnchor="middle">
          ADP + Pi · NADP⁺
        </text>
      </svg>
      <div className="bpe12-stocks">
        <span>
          ATP{' '}
          <i>
            <b style={{ width: `${(s.atp / 18) * 100}%` }} />
          </i>
        </span>
        <span>
          NADPH{' '}
          <i>
            <b style={{ width: `${(s.nadph / 12) * 100}%` }} />
          </i>
        </span>
      </div>
      <p className="bpe12-note">
        {t(s.light ? '膜上补给，基质中消耗。' : '熄灯后，先消耗已有存量。')}
      </p>
    </>
  );
}
function CarbonRecords({
  identity = false,
  prediction = false,
}: {
  identity?: boolean;
  prediction?: boolean;
}) {
  return (
    <>
      <div className="bpe12-sheets">
        {CALVIN_RECORDS.map((s, i) => (
          <div key={s.id}>
            <p>
              {s.exposureSeconds} s · {t('独立取样')}
            </p>
            <svg
              viewBox="0 0 140 143"
              role="img"
              aria-label={t('原发表色谱的部分特征重绘，斑点大小不是含量')}
            >
              <rect x="4" y="5" width="132" height="132" rx="4" fill="#f3efdd" stroke="#d2cdb5" />
              {s.spots.map(({ x, y, name }, j) => (
                <ellipse
                  key={j}
                  cx={12 + x * 116}
                  cy={13 + y * 110}
                  rx={j === 0 ? 11 : 6}
                  ry={j === 0 ? 8 : 4}
                  fill={identity && j === 0 ? '#af8059' : '#8d9a7c'}
                  opacity={identity && j !== 0 ? 0.3 : 0.8}
                />
              ))}
              {identity && (
                <text x="80" y="125" textAnchor="middle">
                  3-PGA
                </text>
              )}
            </svg>
          </div>
        ))}
      </div>
      <p className="bpe12-note">
        {t(
          prediction
            ? '更早终止：优先检验早期产物。'
            : identity
              ? '标准品与化学鉴定，才给斑点命名。'
              : '部分特征重绘；不是含量比较图。',
        )}
      </p>
    </>
  );
}
function Carbon({ shot, p }: { shot: string; p: number }) {
  if (shot !== 'map')
    return <CarbonRecords identity={shot !== 'records'} prediction={shot === 'prediction'} />;
  const s = carbonFixation(p);
  return (
    <>
      <svg
        viewBox="0 0 300 235"
        role="img"
        aria-label={t('六个碳保持身份，CO₂的标记碳进入一个3-PGA的羧基位置')}
      >
        <text x="150" y="24" textAnchor="middle">
          {s.split > 0.95 ? '2 × C₃' : 'CO₂ + C₅'}
        </text>
        {s.edges.map((e) => {
          const a = s.nodes.find((n) => n.id === e.a)!,
            b = s.nodes.find((n) => n.id === e.b)!;
          return (
            <path
              key={e.a + e.b}
              d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
              stroke="#8c9e80"
              strokeWidth="4"
              opacity={e.opacity}
              fill="none"
            />
          );
        })}
        {s.nodes.map((n) => (
          <g key={n.id} data-carbon={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r="18"
              fill={n.labeled ? '#b67d52' : '#7c9b7b'}
              stroke="#f5f3e3"
              strokeWidth="2"
            />
            <text x={n.x} y={n.y + 6} textAnchor="middle" fill="#fff">
              {n.labeled ? '¹⁴C' : n.id.slice(-1)}
            </text>
          </g>
        ))}
        {s.split > 0.8 && (
          <>
            <text x="196" y="95">
              3-PGA
            </text>
            <text x="35" y="195">
              3-PGA
            </text>
          </>
        )}
        <text x="150" y="224" textAnchor="middle">
          {t('碳骨架净映射')}
        </text>
      </svg>
      <p className="bpe12-note">{t('新碳进入羧基；循环仍需更多证据。')}</p>
    </>
  );
}
function Preparation({ pressure, water }: { pressure: number; water: number }) {
  return (
    <>
      <svg
        viewBox="0 0 300 230"
        role="img"
        aria-label={t('拉低压力使叶内空气排出，恢复压力后水进入间隙')}
      >
        <rect
          x="37"
          y="55"
          width="94"
          height="139"
          rx="10"
          fill="#dfe8d6"
          stroke="#9eafa0"
          strokeWidth="2"
        />
        <path d="M73 194V216H95V194M28 55H140" stroke="#9eafa0" strokeWidth="3" fill="none" />
        <path
          d={`M47 ${79 - pressure * 30}H121M84 ${79 - pressure * 30}V${24 - pressure * 16}M60 ${24 - pressure * 16}H108`}
          stroke="#8f9d86"
          strokeWidth="7"
          fill="none"
        />
        {Array.from({ length: 10 }, (_, i) => (
          <ellipse
            key={i}
            data-disc={`prep-${i}`}
            cx={49 + ((i * 23) % 69)}
            cy={111 + (i % 4) * 12 + water * 27}
            rx="6"
            ry="3"
            fill="#85a367"
          />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <circle
            key={i}
            cx={52 + i * 14}
            cy={119 - pressure * 55 - i * 5}
            r={3 + pressure * 3}
            fill="#f6f7e8"
            stroke="#9faf92"
            opacity={pressure}
          />
        ))}
        <path d="M135 142H158" stroke="#b5bfa6" strokeDasharray="3 4" />
        <ellipse
          cx="220"
          cy="133"
          rx="62"
          ry="70"
          fill="#d8e1bc"
          stroke="#a5b68e"
          strokeWidth="2"
        />
        {[
          [188, 101],
          [220, 88],
          [250, 104],
          [181, 137],
          [252, 142],
          [202, 174],
          [236, 177],
        ].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="15" ry="18" fill="#aac291" stroke="#849e72" />
        ))}
        <path
          d="M208 111Q220 101 230 113L239 151Q227 167 210 152L199 134Z"
          fill={water > 0.6 ? '#9fc4cb' : '#f4edc9'}
          stroke="#a5b29b"
          strokeWidth="2"
        />
        <text x="220" y="139" textAnchor="middle">
          {t(water > 0.6 ? '水' : '气')}
        </text>
        <text x="220" y="222" textAnchor="middle">
          {t('叶片间隙放大')}
        </text>
      </svg>
      <p className="bpe12-note">
        {t(
          water > 0.8
            ? '水替换空气，圆片先下沉。'
            : pressure > 0.2
              ? '减压：原有空气排出。'
              : '同样叶片，先排除原有空气。',
        )}
      </p>
    </>
  );
}
function Discs({
  time,
  intensity,
  infiltrated,
  co2,
}: {
  time: number;
  intensity: number;
  infiltrated: boolean;
  co2: boolean;
}) {
  return (
    <>
      <div className="bpe12-discgroups">
        {[1, intensity, 0.1].map((I, g) => {
          const s = leafDiscs(time, I, infiltrated, co2 ? 1 : 0);
          return (
            <div key={g}>
              <p>{t(['强光组', '中光组', '弱光组'][g])}</p>
              <svg
                viewBox="0 0 90 170"
                data-floating={s.floating}
                data-net-gas={s.discs[0].gas}
                role="img"
                aria-label={t('相同十片圆片，气体净积累越过上浮阈值')}
              >
                <path
                  d="M5 15V150Q5 162 17 162H73Q85 162 85 150V15"
                  fill="#d9e5d0"
                  stroke="#9daf8a"
                  strokeWidth="2"
                />
                <path d="M7 41H83" stroke="#b0c5aa" />
                {s.discs.map((d) => (
                  <g key={d.id} data-disc={`${g}-${d.id}`}>
                    <ellipse
                      cx={17 + ((d.id * 17) % 58)}
                      cy={144 - d.rise * (94 + (d.id % 3) * 3)}
                      rx="7"
                      ry="3"
                      fill="#799c5c"
                    />
                    <circle
                      cx={17 + ((d.id * 17) % 58)}
                      cy={139 - d.rise * (94 + (d.id % 3) * 3)}
                      r={Math.min(4, d.gas * 3)}
                      fill="#f2f5e7"
                      opacity={Math.min(1, d.gas)}
                    />
                  </g>
                ))}
              </svg>
              <p>{s.floating}/10</p>
            </div>
          );
        })}
      </div>
      <p className="bpe12-note">
        {t(
          !infiltrated
            ? '原有空气已足够上浮。'
            : !co2
              ? '缺 CO₂：净产氧受限。'
              : '产氧 − 呼吸消耗 → 净积气 → 上浮',
        )}
      </p>
    </>
  );
}
export default function BioPhotosynthesisEvidence() {
  const f = useShowcase(),
    locale = browserLocale(),
    [chosen, setChosen] = useState<PhotoMode | null>(null),
    [progress, setProgress] = useState(0.7),
    [illumination, setIllumination] = useState<Illumination>('spot'),
    [spot, setSpot] = useState(0.4),
    [light, setLight] = useState(true),
    [acceptor, setAcceptor] = useState(true),
    [swap, setSwap] = useState(false),
    [atpShot, setATPShot] = useState('motor'),
    [deltaPH, setDeltaPH] = useState(3),
    [leak, setLeak] = useState(false),
    [adp, setADP] = useState(true),
    [phosphate, setPhosphate] = useState(true),
    [carbonShot, setCarbonShot] = useState('map'),
    [infiltrated, setInfiltrated] = useState(true),
    [intensity, setIntensity] = useState(0.45),
    [co2, setCO2] = useState(true);
  const m = f.watch
      ? PHOTO_CHAPTERS[Math.min(f.chapter, 8)]
      : (chosen ?? PHOTO_CHAPTERS[Math.min(f.chapter, 8)]),
    c = PHOTO_CHAPTERS.indexOf(m),
    d = photoDirector(c, f.watch ? f.chapterTime : progress * PHOTO_PLANNED_SECONDS[c], locale),
    p = f.watch ? d.progress : progress;
  return (
    <section
      className={`bpe12 bpe12-${f.watch ? 'watch' : 'explore'} bpe12-mode-${m}`}
      data-photo-mode={m}
      data-photo-condition={
        f.watch && m === 'hill'
          ? d.hillAcceptor
            ? 'baseline'
            : 'no-acceptor'
          : f.watch && m === 'discs'
            ? d.discCase
            : undefined
      }
      data-photo-shot={
        m === 'atp'
          ? f.watch
            ? d.atpShot
            : atpShot
          : m === 'carbon'
            ? f.watch
              ? d.carbonShot
              : carbonShot
            : m
      }
    >
      <p className="bpe12-kind">
        {t(
          f.watch && m === 'hill' && !d.hillAcceptor
            ? '预测：缺受体新样本'
            : f.watch && m === 'discs' && d.discCase !== 'baseline'
              ? d.discCase === 'no-co2'
                ? '预测：缺 CO₂ 新样本'
                : '预测：保留空气新样本'
              : names[c],
        )}
      </p>
      <div className="bpe12-visual">
        {m === 'local' || m === 'spectrum' ? (
          <Alga
            p={p}
            lighting={m === 'spectrum' ? 'spectrum' : f.watch ? 'spot' : illumination}
            spot={f.watch ? 0.4 : spot}
            expansion={
              m === 'local' ? (f.watch ? d.expansion : illumination === 'full' ? 1 : 0) : 0
            }
          />
        ) : m === 'hill' ? (
          <Hill p={p} light={f.watch || light} acceptor={f.watch ? d.hillAcceptor : acceptor} />
        ) : m === 'isotope' ? (
          <Isotopes p={p} swap={!f.watch && swap} />
        ) : m === 'atp' ? (
          <ATP
            shot={f.watch ? d.atpShot : atpShot}
            time={
              f.watch
                ? d.atpShot === 'leak'
                  ? d.leakTime
                  : d.atpShot === 'charge'
                    ? d.chargeProgress
                    : d.motorTime
                : atpShot === 'charge'
                  ? progress
                  : progress * 24
            }
            leak={f.watch ? (d.atpShot === 'leak' ? 2 : 0) : leak ? 2 : 0}
            deltaPH={f.watch ? 3 : deltaPH}
            adp={f.watch || adp}
            phosphate={f.watch || phosphate}
          />
        ) : m === 'coupling' ? (
          <Coupling
            time={f.watch ? d.coupleTime : progress * 18}
            off={f.watch ? 7 : light ? Infinity : 0}
            co2={f.watch || co2}
          />
        ) : m === 'carbon' ? (
          <Carbon
            shot={f.watch ? d.carbonShot : carbonShot}
            p={f.watch ? d.carbonProgress : progress}
          />
        ) : m === 'prepare' ? (
          <Preparation pressure={d.prepPressure} water={d.prepWater} />
        ) : (
          <Discs
            time={f.watch ? d.discTime : p * 15}
            intensity={f.watch ? 0.45 : intensity}
            infiltrated={f.watch ? d.discCase !== 'trapped-air' : infiltrated}
            co2={f.watch ? d.discCase !== 'no-co2' : co2}
          />
        )}
      </div>
      {!f.watch && (
        <div className="bpe12-controls">
          <Segments
            label={t('研究主题')}
            value={m}
            onChange={(v) => setChosen(v as PhotoMode)}
            options={PHOTO_CHAPTERS.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('过程进度')}
            min={0}
            max={1}
            step={0.01}
            value={progress}
            onChange={setProgress}
          />
          {m === 'local' && (
            <>
              <Segments
                label={t('照明方式')}
                value={illumination}
                onChange={(v) => setIllumination(v as Illumination)}
                options={[
                  { value: 'spot', label: t('局部光') },
                  { value: 'full', label: t('全面照光') },
                  { value: 'dark', label: t('黑暗') },
                ]}
              />
              <Range
                label={t('光斑位置')}
                min={0.1}
                max={0.9}
                step={0.01}
                value={spot}
                onChange={setSpot}
              />
            </>
          )}
          {(m === 'hill' || m === 'coupling') && (
            <button type="button" aria-pressed={light} onClick={() => setLight(!light)}>
              {t(light ? '光源开启' : '光源关闭')}
            </button>
          )}
          {m === 'hill' && (
            <button type="button" aria-pressed={acceptor} onClick={() => setAcceptor(!acceptor)}>
              {t(acceptor ? '适宜电子受体：有' : '适宜电子受体：无')}
            </button>
          )}
          {m === 'isotope' && (
            <button type="button" onClick={() => setSwap(!swap)}>
              {t('交换两组标记')}
            </button>
          )}
          {m === 'atp' && (
            <>
              <Segments
                label={t('证据与解释')}
                value={atpShot}
                onChange={setATPShot}
                options={[
                  { value: 'record', label: t('原始记录') },
                  { value: 'charge', label: t('建立梯度') },
                  { value: 'motor', label: t('梯度模型') },
                ]}
              />
              {atpShot === 'motor' && (
                <>
                  <Range
                    label={t('初始 pH 差')}
                    value={deltaPH}
                    min={0}
                    max={5}
                    step={0.1}
                    onChange={setDeltaPH}
                  />
                  <button type="button" aria-pressed={leak} onClick={() => setLeak(!leak)}>
                    {t(leak ? '泄漏旁路：开' : '泄漏旁路：关')}
                  </button>
                  <button type="button" aria-pressed={adp} onClick={() => setADP(!adp)}>
                    {adp ? '+ ADP' : '− ADP'}
                  </button>
                  <button
                    type="button"
                    aria-pressed={phosphate}
                    onClick={() => setPhosphate(!phosphate)}
                  >
                    {phosphate ? '+ Pi' : '− Pi'}
                  </button>
                </>
              )}
            </>
          )}
          {m === 'carbon' && (
            <Segments
              label={t('证据与解释')}
              value={carbonShot}
              onChange={setCarbonShot}
              options={[
                { value: 'records', label: t('独立样本') },
                { value: 'identity', label: t('鉴定斑点') },
                { value: 'map', label: t('碳骨架模型') },
              ]}
            />
          )}
          {m === 'discs' && (
            <>
              <Range
                label={t('中间组相对光强')}
                value={intensity}
                min={0}
                max={1}
                step={0.01}
                onChange={setIntensity}
              />
              <button
                type="button"
                aria-pressed={infiltrated}
                onClick={() => setInfiltrated(!infiltrated)}
              >
                {t(infiltrated ? '叶片已去气' : '叶片未去气')}
              </button>
            </>
          )}
          {(m === 'discs' || m === 'coupling') && (
            <button type="button" aria-pressed={co2} onClick={() => setCO2(!co2)}>
              {t(co2 ? 'CO₂供应：有' : 'CO₂供应：无')}
            </button>
          )}
          <p className="bpe12-control-note">{t('模型参数改变解释模型，不改写历史记录。')}</p>
        </div>
      )}
    </section>
  );
}
