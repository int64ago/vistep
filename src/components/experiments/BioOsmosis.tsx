import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ramp, ease } from '../lab/FilmContext';
import {
  cellOsmosis,
  funnelOsmosis,
  transportState,
  transportParticle,
  redCellOutline,
  waterExchange,
  plantGeometry,
  particleWalk,
  aquaporinComparison,
  equilibriumTransportParticle,
  potentialDifference,
  osmosisMembrane,
} from '../../models/bio-osmosis';
import '../../styles/bio-osmosis.css';
type Mode =
  'diffusion' | 'funnel' | 'red-cell' | 'plant' | 'recovery' | 'aquaporin' | 'passive' | 'active';
const keys: Mode[] = [
  'diffusion',
  'funnel',
  'red-cell',
  'plant',
  'recovery',
  'aquaporin',
  'passive',
  'active',
];
const names = [
  '墨水扩散',
  '半透膜漏斗',
  '红细胞',
  '质壁分离',
  '质壁分离复原',
  '水通道证据',
  '被动运输',
  '主动运输',
];
const questions = [
  '一颗分子会往回走，墨水为什么仍会散开？',
  '液面停了，穿膜的水也停了吗？',
  '盐让细胞变瘪，离开细胞的是什么？',
  '壁和膜之间的空隙，是怎样出现的？',
  '换回清水，细胞会一直胀大吗？',
  '多一条水通道，就能逆势运水吗？',
  '有运输蛋白，就一定需要能量吗？',
  '已经更多的一侧，怎样继续得到物质？',
];
const dots = Array.from({ length: 8 }, (_, i) => ({
  x: Math.cos(i * 2.4) * (12 + i * 2),
  y: Math.sin(i * 2.4) * (12 + i * 2),
}));
function Arrow({
  x1,
  x2,
  y,
  width = 3,
  color = '#498f9d',
}: {
  x1: number;
  x2: number;
  y: number;
  width?: number;
  color?: string;
}) {
  const d = Math.sign(x2 - x1);
  return (
    <path
      d={`M${x1} ${y}H${x2}m${-d * 7} -5l${d * 7} 5l${-d * 7} 5`}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}
function Exchange({
  osmotic,
  pressure = 0,
  time,
  permeability = 0.2,
  channel = true,
  biological = true,
  outsideSolute = 0,
  insideSolute = 1.4,
  selective = true,
}: {
  osmotic: number;
  pressure?: number;
  time: number;
  permeability?: number;
  channel?: boolean;
  biological?: boolean;
  outsideSolute?: number;
  insideSolute?: number;
  selective?: boolean;
}) {
  const flow = waterExchange(osmotic, pressure, permeability),
    balanced = Math.abs(flow.net) < 0.004,
    membrane = osmosisMembrane;
  return (
    <div className="bo-exchange">
      <div className="bo-side-labels">
        <span>{t('外侧')}</span>
        <span className="bo-key">
          <i />
          {t('水')}
          <b />
          {t('溶质')}
        </span>
        <span>{t('内侧')}</span>
      </div>
      <svg
        viewBox="0 0 320 140"
        role="img"
        aria-label={t('放大膜：水分子无规则双向运动，不透膜溶质留在原侧')}
      >
        <rect x="2" y="2" width="316" height="136" rx="22" fill="#e7f2ed" />
        <path
          d={`M${membrane.left + 2} 4V${membrane.poreTop}M${membrane.right - 2} 4V${membrane.poreTop}M${membrane.left + 2} ${membrane.poreBottom}V136M${membrane.right - 2} ${membrane.poreBottom}V136`}
          stroke="#b7b990"
          strokeWidth="4"
          fill="none"
        />
        {!biological && (
          <path
            d={`M${membrane.left} 4H${membrane.right}V${membrane.poreTop}H${membrane.left}ZM${membrane.left} ${membrane.poreBottom}H${membrane.right}V136H${membrane.left}Z`}
            fill="#c6b28f"
            stroke="#a68f6d"
          />
        )}
        {biological &&
          Array.from({ length: 8 }, (_, i) => {
            const y = i < 3 ? 10 + i * 14 : 98 + (i - 3) * 8;
            return (
              <g key={i}>
                <path
                  d={`M153 ${y}l7 3m-7-3l7-3M167 ${y}l-7 3m7-3l-7-3`}
                  stroke="#b6ad84"
                  fill="none"
                />
                <circle cx={membrane.left + 2} cy={y} r="2" fill="#8b9f86" />
                <circle cx={membrane.right - 2} cy={y} r="2" fill="#8b9f86" />
              </g>
            );
          })}
        {biological && channel && (
          <path
            d={`M${membrane.left} 32Q160 27 ${membrane.right} 32V${membrane.poreTop}H${membrane.left}ZM${membrane.left} ${membrane.poreBottom}H${membrane.right}V108Q160 113 ${membrane.left} 108Z`}
            fill="#9a8da7"
          />
        )}
        {Array.from({ length: 12 }, (_, i) => {
          const q = particleWalk(i * 2 + 1, time, selective ? 'solute' : 'permeant');
          return (
            <rect
              key={i}
              x={(selective ? 175 + ((q.x - 175) * 1.6) / Math.max(0.05, insideSolute) : q.x) - 4}
              y={q.y - 4}
              width="8"
              height="8"
              rx="1.5"
              fill="#b38a54"
            />
          );
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const q = particleWalk(i * 2, time, selective ? 'solute' : 'permeant');
          return (
            <rect
              key={`ext-${i}`}
              x={(selective ? 145 + ((q.x - 145) * 1.6) / Math.max(0.05, outsideSolute) : q.x) - 4}
              opacity={outsideSolute > 0 ? 1 : 0}
              y={q.y - 4}
              width="8"
              height="8"
              rx="1.5"
              fill="#b38a54"
            />
          );
        })}
        {Array.from({ length: 30 }, (_, i) => {
          const q = particleWalk(i, time);
          return (
            <g key={i}>
              {i === 10 && (
                <path
                  d={q.trail.map((v, k) => `${k ? 'L' : 'M'}${v.x} ${v.y}`).join(' ')}
                  fill="none"
                  stroke="#b57846"
                  strokeWidth="1.5"
                  opacity=".6"
                />
              )}
              <circle
                cx={q.x}
                cy={q.y}
                r={i === 10 ? 4 : 3}
                fill={i === 10 ? '#c68138' : '#528f9d'}
              />
            </g>
          );
        })}
      </svg>
      <div className="bo-flow" aria-label={t('相对通量；箭头宽度表示统计流量')}>
        <span>{t('向内')}</span>
        <svg viewBox="0 0 150 36" aria-hidden="true">
          <Arrow x1={8} x2={142} y={11} width={2 + flow.inward * 6} />
          <Arrow x1={142} x2={8} y={27} width={2 + flow.outward * 6} color="#7886ad" />
        </svg>
        <span>{t('向外')}</span>
      </div>
      <p className="bo-result">
        {t(
          balanced
            ? '双向交换，净流量 ≈ 0'
            : flow.net > 0
              ? '净吸水：进入比离开多'
              : '净失水：离开比进入多',
        )}
      </p>
    </div>
  );
}
function Balance({ osmotic, pressure }: { osmotic: number; pressure: number }) {
  const scale = Math.max(1.2, osmotic, pressure);
  const width = (v: number) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;
  return (
    <div className="bo-balance">
      <div>
        <span>{t('渗透驱动')}</span>
        <i>
          <b style={{ width: width(osmotic) }} />
        </i>
      </div>
      <div>
        <span>{t('压力抵消')}</span>
        <i>
          <b style={{ width: width(pressure) }} />
        </i>
      </div>
    </div>
  );
}
function Plant({ volume, pressure, time }: { volume: number; pressure: number; time: number }) {
  const g = plantGeometry(volume),
    w = g.halfWidth,
    h = g.halfHeight;
  return (
    <svg
      viewBox="0 0 320 190"
      role="img"
      aria-label={t('水离开后液泡缩小，外液填入细胞壁与原生质层之间；吸水接触壁后建立膨压')}
    >
      <rect x="1" y="1" width="318" height="188" rx="24" fill="#dfebe4" />
      <rect
        x={160 - g.wallHalfWidth}
        y={94 - g.wallHalfHeight}
        width={g.wallHalfWidth * 2}
        height={g.wallHalfHeight * 2}
        rx="20"
        fill="#e6ead8"
        stroke="#94a579"
        strokeWidth="8"
      />
      <rect
        x={160 - g.wallHalfWidth + 3}
        y={94 - g.wallHalfHeight + 3}
        width={g.wallHalfWidth * 2 - 6}
        height={g.wallHalfHeight * 2 - 6}
        rx="17"
        fill="#d4e6df"
      />
      {g.gap > 4 &&
        Array.from({ length: 10 }, (_, i) => (
          <rect
            key={i}
            x={i < 5 ? 32 + (g.gap - 8) * 0.5 : 282 - (g.gap - 8) * 0.5}
            y={48 + (i % 5) * 20 + Math.sin(time + i) * 2}
            width="4"
            height="4"
            rx="1"
            fill="#ae935b"
            opacity=".75"
          />
        ))}
      <rect
        x={160 - w}
        y={94 - h}
        width={w * 2}
        height={h * 2}
        rx="24"
        fill="#d2c5d2"
        stroke="#8f7597"
        strokeWidth="2.5"
      />
      <rect
        x={160 - w * 0.86}
        y={94 - h * 0.77}
        width={w * 1.72}
        height={h * 1.54}
        rx="23"
        fill="#b88daf"
        fillOpacity={Math.min(0.9, 0.48 / volume)}
        stroke="#ac82a8"
        strokeWidth="1.5"
      />
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={160 + (d.x * w) / 40}
          cy={94 + (d.y * h) / 45}
          r="2.7"
          fill="#855b8f"
          opacity=".8"
        />
      ))}
      <ellipse cx={160 - w * 0.9} cy="94" rx="8" ry="12" fill="#8f7f9b" />
      {pressure > 0.02 && (
        <g opacity={Math.min(1, pressure * 2)}>
          <Arrow x1={160 - w - 15} x2={160 - w + 6} y={94} color="#ae8954" />
          <Arrow x1={160 + w + 15} x2={160 + w - 6} y={94} color="#ae8954" />
        </g>
      )}
      {g.gap > 8 && (
        <path
          d={`M${160 - w - 4} 32H${160 - g.wallHalfWidth + 4}m0-4v8m${g.gap - 8}-8v8`}
          stroke="#866f4c"
          fill="none"
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
}
function RedCell({ volume, lysed, id }: { volume: number; lysed: boolean; id: string }) {
  const scale = Math.cbrt(volume);
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-label={t('同样的胞内溶质保留下来，水的净流动改变红细胞体积')}
    >
      <defs>
        <radialGradient id={id}>
          <stop stopColor="#e9bbb0" />
          <stop offset={Math.max(0.05, 0.45 - (volume - 1) * 0.6)} stopColor="#d99b8c" />
          <stop offset=".8" stopColor="#bd786e" />
          <stop offset="1" stopColor="#a96d63" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="72" fill="#e5eeea" />
      <path
        d={redCellOutline(volume)}
        fill={`url(#${id})`}
        opacity={lysed ? 0.3 : 1}
        stroke="#b36f65"
        strokeWidth="2"
        strokeDasharray={lysed ? '5 9' : undefined}
      />
      {dots.map((q, i) => (
        <rect
          key={i}
          x={80 + q.x * scale - 2}
          y={80 + q.y * scale - 2}
          width="4"
          height="4"
          rx="1"
          fill="#855b61"
          opacity={lysed ? 0.2 : 0.8}
        />
      ))}
      {lysed &&
        [0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M${25 + i * 30} 60q8 10 0 30`}
            fill="none"
            stroke="#cb8a7b"
            opacity=".45"
          />
        ))}
    </svg>
  );
}
function Potential({
  inside,
  outside,
  pressure,
}: {
  inside: number;
  outside: number;
  pressure: number;
}) {
  const v = potentialDifference(inside, outside, pressure),
    min = Math.min(-1, v.outside, v.inside, v.mixingInside) - 0.05,
    max = Math.max(0.15, v.outside, v.inside, v.mixingInside),
    y = (potential: number) => 14 + ((max - potential) / (max - min)) * 100,
    outY = y(v.outside),
    inY = y(v.inside),
    mixY = y(v.mixingInside),
    balanced = Math.abs(v.inwardDrive) < 0.02;
  return (
    <div className="bo-potential">
      <p>{t('水势')}</p>
      <svg
        viewBox="0 0 180 126"
        role="img"
        aria-label={t('混合降低内侧水势，水柱压力再将它抬高；两侧相等时净流量为零')}
      >
        <path d="M12 14V116M8 19l4-5 4 5" stroke="#c0cabe" fill="none" />
        <path
          d={`M22 ${outY}H76`}
          stroke="#6f9e9f"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M106 ${mixY}H164`}
          stroke="#b79762"
          strokeWidth="3"
          strokeDasharray="4 4"
          fill="none"
        />
        <path
          d={`M106 ${inY}H164`}
          stroke="#758ab0"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {pressure > 0.025 && (
          <path
            d={`M151 ${mixY - 4}V${inY + 4}m-4 5l4-5 4 5`}
            stroke="#b79762"
            strokeWidth="2.5"
            fill="none"
          />
        )}
        <path
          d={`M88 ${y(0)}V${mixY}m-4-5 4 5 4-5`}
          stroke="#b8a98a"
          strokeWidth="1.5"
          fill="none"
        />
        {!balanced && (
          <path
            d={`M60 ${outY + 6}Q83 ${inY + 13} 115 ${inY + 7}m-6-3 6 3-4 5`}
            stroke="#598b99"
            strokeWidth="2"
            fill="none"
          />
        )}
        {balanced && (
          <path d={`M79 ${outY}H103`} stroke="#819980" strokeDasharray="3 3" fill="none" />
        )}
        <circle cx="47" cy={outY} r="4" fill="#6f9e9f" />
        <circle cx="134" cy={inY} r="4" fill="#758ab0" />
      </svg>
      <div className="bo-potential-sides">
        <span>{t('外侧')}</span>
        <span>{t('内侧')}</span>
      </div>
      <div className="bo-potential-causes">
        <span>{t('混合 ↓')}</span>
        <span>{t('压力 ↑')}</span>
      </div>
    </div>
  );
}
function Funnel({
  time,
  selective,
  outside,
  id,
}: {
  time: number;
  selective: boolean;
  outside: number;
  id: string;
}) {
  const state = funnelOsmosis(time, selective, outside),
    change = state.volume - 1,
    insideY = 130 - (change / 0.3) * 42,
    outsideY = 130 + (change / 6) * 42;
  return (
    <div className="bo-funnel">
      <svg
        viewBox="0 0 320 250"
        role="img"
        aria-label={t('蔗糖留在漏斗内；水柱抬升，压力逐渐抵消渗透驱动')}
      >
        <defs>
          <clipPath id={`${id}-funnel`}>
            <path d="M154 15H166V151L220 215H100L154 151Z" />
          </clipPath>
        </defs>
        <path
          d="M44 75V230Q44 239 54 239H266Q276 239 276 230V75"
          fill="#eef3ec"
          stroke="#8fa79c"
          strokeWidth="2"
        />
        <path d={`M46 ${outsideY}H274V230Q274 237 265 237H55Q46 237 46 230Z`} fill="#c8e2db" />
        <path d={`M46 ${outsideY}H274`} stroke="#93bab5" />
        {(!selective || outside > 0) &&
          Array.from({ length: 16 }, (_, i) => (
            <rect
              key={`mix-${i}`}
              x={54 + ((i * 37) % 207)}
              y={158 + ((i * 13) % 70)}
              width="4"
              height="4"
              rx="1"
              fill="#a88d58"
              opacity={selective ? outside * 0.55 : 0.5}
            />
          ))}
        <g clipPath={`url(#${id}-funnel)`}>
          <rect x="98" y={insideY} width="124" height="240" fill="#d5cba4" />
          {Array.from({ length: 16 }, (_, i) => (
            <rect
              key={i}
              x={123 + ((i * 37) % 73)}
              y={191 + ((i * 13) % 20) + Math.sin(time + i) * 1.5}
              width="4"
              height="4"
              rx="1"
              fill="#a88d58"
            />
          ))}
        </g>
        <path
          d="M154 15V151L100 215H220L166 151V15"
          fill="none"
          stroke="#819d94"
          strokeWidth="2.5"
        />
        <path
          d="M100 215H220"
          stroke="#a58b67"
          strokeWidth="4"
          strokeDasharray={selective ? undefined : '3 6'}
        />
        <path
          d={`M243 ${insideY}V${outsideY}M238 ${insideY}H248M238 ${outsideY}H248`}
          fill="none"
          stroke="#9d7f43"
          strokeWidth="2"
        />
        <circle cx="160" cy="215" r="18" fill="none" stroke="#ab8e5e" strokeDasharray="3 4" />
        <path d="M178 217L205 232H252" fill="none" stroke="#ab8e5e" strokeDasharray="3 4" />
      </svg>
      <Potential
        inside={state.insideConcentration}
        outside={state.outsideConcentration}
        pressure={state.hydrostatic}
      />
    </div>
  );
}
function Diffusion({ time }: { time: number }) {
  const particles = Array.from({ length: 110 }, (_, i) => particleWalk(i, time, 'dye')),
    tracked = particles[0],
    bins = Array.from(
      { length: 16 },
      (_, b) => particles.filter((q) => Math.floor(((q.x - 10) / 300) * 16) === b).length,
    );
  return (
    <div className="bo-diffusion">
      <svg
        viewBox="0 0 340 200"
        role="img"
        aria-label={t('追踪的金色染料分子来回运动，全部染料的分布逐渐摊开')}
      >
        <path
          d="M10 12V176Q10 188 22 188H318Q330 188 330 176V12"
          fill="#e2ece6"
          stroke="#92a69a"
          strokeWidth="2"
        />
        <path d="M13 30H327" stroke="#b0cbc2" />
        <g transform="translate(10 38)">
          {particles.map((q) => (
            <circle
              key={q.id}
              cx={q.x}
              cy={q.y}
              r={q.id === 0 ? 4.5 : 2.8}
              fill={q.id === 0 ? '#a96b27' : '#b96f71'}
              opacity={q.id === 0 ? 1 : 0.65}
            />
          ))}
          <path
            d={tracked.trail.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ')}
            fill="none"
            stroke="#a96b27"
            strokeWidth="1.8"
          />
        </g>
      </svg>
      <div className="bo-histogram" aria-label={t('同一批染料的位置分布，总数保持不变')}>
        {bins.map((v, i) => (
          <i key={i} style={{ height: `${Math.max(2, Math.sqrt(v / 110) * 100)}%` }} />
        ))}
      </div>
      <div className="bo-proof-labels">
        <span>
          <i className="bo-gold" />
          {t('一颗：来回走')}
        </span>
        <span>
          <i className="bo-rose" />
          {t('整体：分布摊开')}
        </span>
      </div>
    </div>
  );
}
function Transport({
  kind,
  time,
  atp,
  id,
}: {
  kind: 'simple' | 'carrier' | 'active';
  time: number;
  atp: boolean;
  id: string;
}) {
  const state = transportState(time, kind, atp),
    passive = kind !== 'active';
  return (
    <div className="bo-transport">
      <svg
        viewBox="0 0 250 230"
        role="img"
        aria-label={t('追踪同一物质穿过膜：被动运输减少浓度差，供能的泵可增加浓度差')}
      >
        <defs>
          <linearGradient id={id}>
            <stop stopColor="#e9f0e4" />
            <stop offset="1" stopColor="#e2ece8" />
          </linearGradient>
        </defs>
        <rect x="8" y="10" width="234" height="208" rx="22" fill={`url(#${id})`} />
        <path d="M18 109H232M18 141H232" fill="none" stroke="#9eae8a" strokeWidth="6" />
        <rect x="18" y="112" width="214" height="26" fill="#d3d6af" />
        {kind !== 'simple' && (
          <path
            d={`M110 96Q94 110 ${102 + Math.sin(time) * 3} 126Q94 151 113 155H138Q153 143 143 126Q156 108 137 96Z`}
            fill="#9b90aa"
          />
        )}{' '}
        {Array.from({ length: 24 }, (_, j) => {
          const q =
            kind === 'active'
              ? transportParticle(j, state.inside, kind)
              : equilibriumTransportParticle(j, time, kind);
          return (
            <circle
              key={j}
              cx={q.x}
              cy={q.y}
              r="4.5"
              fill={
                j === (kind === 'active' ? 18 : 0)
                  ? '#bf8a36'
                  : kind !== 'active' && j === 23
                    ? '#8c6c98'
                    : '#5b968d'
              }
            />
          );
        })}
        {passive && time > 15 && (
          <g opacity=".8">
            <path
              d={
                kind === 'carrier'
                  ? 'M119 99V151m-4-5 4 5 4-5M131 151V99m-4 5 4-5 4 5'
                  : 'M72 99V151m-5-6 5 6 5-6M185 151V99m-5 6 5-6 5 6'
              }
              stroke="#708e9e"
              strokeWidth="2"
              fill="none"
            />
          </g>
        )}
        {kind === 'active' && (
          <path
            d="M68 188L90 158L81 159L99 133"
            fill="none"
            stroke={atp ? '#bb8d36' : '#bbc3b6'}
            strokeWidth="4"
          />
        )}
      </svg>
      <p>
        {t(
          kind === 'simple'
            ? '直接穿脂质层'
            : kind === 'carrier'
              ? '经过载体'
              : atp
                ? 'ATP 供能'
                : '无 ATP',
        )}
      </p>
      <div className="bo-population">
        <span>{t('外')}</span>
        <i>
          <b style={{ width: `${(state.outside / 2) * 100}%` }} />
        </i>
        <i>
          <b style={{ width: `${(state.inside / 2) * 100}%` }} />
        </i>
        <span>{t('内')}</span>
      </div>
    </div>
  );
}
export default function BioOsmosis() {
  const f = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState<Mode>(
      keys.includes(f.variant as Mode) ? (f.variant as Mode) : 'plant',
    ),
    [progress, setProgress] = useState(0.7),
    [outside, setOutside] = useState(f.variant === 'funnel' ? 0 : 1.8),
    [selective, setSelective] = useState(true),
    [atp, setAtp] = useState(true),
    [reverse, setReverse] = useState(false);
  const m = f.watch ? keys[Math.min(7, f.chapter)] : mode,
    p = f.watch ? f.chapterProgress : progress,
    time = p < 0.68 ? ease(ramp(p, 0.06, 0.68)) * 3 : 3 + ease(ramp(p, 0.68, 0.9)) * 19,
    motionTime = p * 70,
    concentration = f.watch ? 1.8 : outside,
    before = cellOsmosis(concentration, 22, true),
    plant = cellOsmosis(
      m === 'recovery' ? 0.3 : concentration,
      time,
      true,
      0.35,
      m === 'recovery' ? before.volume : 1,
    ),
    funnelTime = f.watch && m === 'funnel' ? ease(ramp(p, 0.38, 0.64)) * 30 : time * 2,
    funnel = funnelOsmosis(funnelTime, f.watch ? true : selective, f.watch ? 0 : outside),
    predicted = f.watch ? p >= 0.5 : reverse,
    aqpOpacity = f.watch ? (p < 0.5 ? 1 - ease(ramp(p, 0.45, 0.5)) : ease(ramp(p, 0.5, 0.55))) : 1,
    aqpOutside = predicted ? 1.8 : 0.7,
    aqpTime = f.watch
      ? ease(ramp(p, predicted ? 0.55 : 0.05, predicted ? 0.9 : 0.42)) * 6
      : progress * 6;
  return (
    <section className={`bio-osmosis bo-mode-${m}`} data-osmosis-mode={m}>
      <p className="bo-question">{t(questions[keys.indexOf(m)])}</p>
      {m === 'diffusion' ? (
        <Diffusion time={motionTime} />
      ) : m === 'funnel' ? (
        <div className="bo-causal-pair">
          <Funnel
            time={funnelTime}
            selective={f.watch ? true : selective}
            outside={f.watch ? 0 : outside}
            id={id}
          />
          <Exchange
            biological={false}
            osmotic={funnel.osmotic}
            pressure={funnel.hydrostatic}
            time={motionTime}
            insideSolute={funnel.insideConcentration}
            outsideSolute={funnel.outsideConcentration}
            selective={f.watch ? true : selective}
          />
        </div>
      ) : m === 'red-cell' ? (
        <>
          <div className="bo-red-comparison">
            {[0.45, 1, 1.8].map((c, i) => {
              const cell = cellOsmosis(c, time);
              return (
                <div key={c}>
                  <p>{t(i === 0 ? '低渗' : i === 1 ? '等渗' : '高渗')}</p>
                  <RedCell volume={cell.volume} lysed={cell.lysed} id={`${id}-r-${i}`} />
                  <p>
                    {t(cell.lysed ? '破裂' : i === 0 ? '净吸水' : i === 1 ? '双向平衡' : '净失水')}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="bo-proof-labels">
            <span>
              <i className="bo-square" />
              {t('胞内溶质留下')}
            </span>
            <span>{t('水改变体积')}</span>
          </div>
        </>
      ) : m === 'plant' || m === 'recovery' ? (
        <div className="bo-causal-pair">
          <div className="bo-plant">
            <Plant volume={plant.volume} pressure={plant.pressure} time={motionTime} />
            <div className="bo-plant-labels">
              <span>
                <i className="bo-wall" />
                {t('细胞壁')}
              </span>
              <span>
                <i className="bo-membrane" />
                {t('原生质层')}
              </span>
              <span>
                <i className="bo-vacuole" />
                {t('液泡')}
              </span>
            </div>
            {m === 'recovery' ? (
              <Balance osmotic={plant.inside - 0.3} pressure={plant.pressure} />
            ) : (
              <p className="bo-detail">{t('空隙里是外液，细胞壁没有一起缩进去。')}</p>
            )}
          </div>
          <Exchange
            osmotic={plant.inside - (m === 'recovery' ? 0.3 : concentration)}
            pressure={plant.pressure}
            time={motionTime}
            permeability={0.35}
            insideSolute={plant.inside}
            outsideSolute={m === 'recovery' ? 0.3 : concentration}
          />
        </div>
      ) : m === 'aquaporin' ? (
        <>
          <p className="bo-evidence-tag">
            {t(predicted ? '新预测：另取相同起点，换成高渗' : '功能证据：相同低渗外液')}
          </p>
          <div className="bo-aqp-comparison" style={{ opacity: aqpOpacity }}>
            {aquaporinComparison(aqpTime, aqpOutside).map((cell, i) => (
              <div key={i}>
                <svg
                  viewBox="0 0 170 160"
                  role="img"
                  aria-label={t('水通道表达对照，改变速率但不改变由外液决定的方向')}
                >
                  <circle cx="85" cy="80" r="73" fill="#e1ebe6" />
                  <circle
                    cx="85"
                    cy="80"
                    r={43 * Math.cbrt(cell.volume)}
                    fill="#d9cba2"
                    stroke="#ac9c72"
                    strokeWidth="2.5"
                  />
                  {i === 1 &&
                    Array.from({ length: 8 }, (_, j) => {
                      const a = (j * Math.PI) / 4,
                        r = 43 * Math.cbrt(cell.volume);
                      return (
                        <rect
                          key={j}
                          x={81 + r * Math.cos(a)}
                          y={75 + r * Math.sin(a)}
                          width="8"
                          height="10"
                          rx="3"
                          fill="#8b81a1"
                          transform={`rotate(${j * 45} ${85 + r * Math.cos(a)} ${80 + r * Math.sin(a)})`}
                        />
                      );
                    })}
                  <circle
                    cx="85"
                    cy="80"
                    r="43"
                    fill="none"
                    stroke="#a79c7f"
                    strokeDasharray="3 4"
                    opacity=".5"
                  />
                  <Arrow
                    x1={predicted ? 29 : 12}
                    x2={predicted ? 12 : 29}
                    y={80}
                    width={i === 1 ? 4 : 1.5}
                  />
                  <Arrow
                    x1={predicted ? 141 : 158}
                    x2={predicted ? 158 : 141}
                    y={80}
                    width={i === 1 ? 4 : 1.5}
                  />
                </svg>
                <p>{t(i === 0 ? '对照：低通透性' : '表达水通道')}</p>
              </div>
            ))}
          </div>
          <p className="bo-result">
            {t(predicted ? '梯度反过来，通道也加快失水。' : '同样的方向，有通道的一组更快。')}
          </p>
        </>
      ) : (
        <>
          <div className="bo-transport-grid">
            {(m === 'active'
              ? (['active', 'active'] as const)
              : (['simple', 'carrier'] as const)
            ).map((kind, i) => (
              <Transport
                key={i}
                kind={kind}
                time={m === 'active' ? time * 2 : p * 120}
                atp={m === 'active' ? (f.watch ? i === 0 : atp && i === 0) : false}
                id={`${id}-t-${i}`}
              />
            ))}
          </div>
          <p className="bo-result">
            {t(
              m === 'active'
                ? '有无蛋白不是界线，逆势运输需要能量耦合。'
                : '平衡后仍有双向交换，不能自行重新建立浓度差。',
            )}
          </p>
        </>
      )}
      {!f.watch && (
        <div className="bio-osmosis-controls">
          <Segments
            value={mode}
            onChange={(v) => {
              setMode(v);
              setOutside(v === 'funnel' ? 0 : 1.8);
            }}
            label={t('选择观察')}
            options={keys.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('过程进度')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {(m === 'plant' || m === 'funnel') && (
            <Range
              label={t('外液相对浓度')}
              value={outside}
              min={m === 'funnel' ? 0 : 0.3}
              max={m === 'funnel' ? 1 : 2.5}
              step={0.1}
              onChange={setOutside}
            />
          )}{' '}
          {m === 'funnel' && (
            <button type="button" aria-pressed={selective} onClick={() => setSelective(!selective)}>
              {t(selective ? '半透膜：保留蔗糖' : '纱布：蔗糖可通过')}
            </button>
          )}
          {m === 'aquaporin' && (
            <button type="button" aria-pressed={reverse} onClick={() => setReverse(!reverse)}>
              {t(reverse ? '高渗预测' : '低渗对照')}
            </button>
          )}
          {m === 'active' && (
            <button type="button" aria-pressed={atp} onClick={() => setAtp(!atp)}>
              {t(atp ? 'ATP供应：有' : 'ATP供应：无')}
            </button>
          )}
          <p>{t('相对单位原理模型；蓝点是随机运动示意，箭头表示统计通量。')}</p>
        </div>
      )}
    </section>
  );
}
