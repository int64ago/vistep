import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  chargedHair,
  electroSmooth,
  electroscopeState,
  electrostaticModeForVariant,
  foilAngle,
  inductionProtocol,
  type ElectrostaticMode,
} from '../../models/electrostatic-induction';
import '../../styles/electrostatic-induction.css';

function Sign({
  x,
  y,
  positive,
  opacity = 1,
}: {
  x: number;
  y: number;
  positive: boolean;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <circle r="5.8" fill={positive ? '#b89165' : '#668c9b'} />
      <path
        d={positive ? 'M-2.8 0H2.8M0 -2.8V2.8' : 'M-2.8 0H2.8'}
        stroke="#fffdf4"
        strokeWidth="1.2"
      />
    </g>
  );
}
function SurfaceCharge({
  x,
  y,
  charge,
  radius = 32,
}: {
  x: number;
  y: number;
  charge: number;
  radius?: number;
}) {
  const amount = Math.min(1, Math.abs(charge) / 0.16e-9);
  return (
    <g>
      {Array.from({ length: 6 }, (_, i) => (
        <Sign
          key={i}
          x={x + radius * Math.cos((i * Math.PI) / 3)}
          y={y + radius * Math.sin((i * Math.PI) / 3)}
          positive={charge > 0}
          opacity={amount}
        />
      ))}
    </g>
  );
}
function Foils({
  x,
  y,
  charge,
  length = 37,
}: {
  x: number;
  y: number;
  charge: number;
  length?: number;
}) {
  const a = foilAngle(charge),
    dx = length * Math.sin(a),
    dy = length * Math.cos(a);
  return (
    <g>
      <path
        d={`M${x} ${y}l${-dx} ${dy}M${x} ${y}l${dx} ${dy}`}
        stroke="#bda86c"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d={`M${x} ${y}l${-dx} ${dy}M${x} ${y}l${dx} ${dy}`}
        stroke="#ede0a6"
        strokeWidth="1.6"
      />
    </g>
  );
}
function Pair({ progress, polarity, id }: { progress: number; polarity: number; id: string }) {
  const s = inductionProtocol(progress, polarity),
    ax = 170,
    bx = 272 + s.gap * 56,
    cy = 104;
  const rodX = 15 + s.approach * 68;
  return (
    <>
      <svg
        className="electro-apparatus electro-pair"
        viewBox="0 0 440 260"
        role="img"
        aria-label={t('绝缘支柱上的两个导体、外部带电棒与电荷转移')}
      >
        <defs>
          <linearGradient
            id={`${id}-metal`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="73"
            x2="0"
            y2="135"
          >
            <stop stopColor="#a3b7b1" />
            <stop offset=".35" stopColor="#f4f5df" />
            <stop offset="1" stopColor="#829b96" />
          </linearGradient>
        </defs>
        <ellipse cx="254" cy="240" rx="150" ry="8" fill="#526858" opacity=".07" />
        {[ax, bx].map((x, i) => (
          <g key={i}>
            <path d={`M${x} 142V218`} stroke="#acbeb2" strokeWidth="12" />
            <path d={`M${x - 22} 224h44`} stroke="#6c8175" strokeWidth="9" strokeLinecap="round" />
            <path
              d={`M${x - 20} ${cy}H${x + 20}`}
              stroke={`url(#${id}-metal)`}
              strokeWidth="62"
              strokeLinecap="round"
            />
            <path d={`M${x - 32} 91H${x + 30}`} stroke="#fffdf3" strokeWidth="3" opacity=".7" />
            <path d={`M${x} 136v18`} stroke="#91a697" strokeWidth="3" />
            <Foils x={x} y={154} charge={i === 0 ? s.a : s.b} />
          </g>
        ))}
        <g opacity={Math.min(1, s.approach * 4)}>
          <rect
            x={rodX - 10}
            y="57"
            width="20"
            height="93"
            rx="10"
            fill={polarity > 0 ? '#dec09a' : '#a6c2cc'}
            stroke="#b9b9a3"
          />
          {[72, 99, 126].map((y) => (
            <Sign key={y} x={rodX} y={y} positive={polarity > 0} />
          ))}
        </g>
        <SurfaceCharge x={ax} y={cy} charge={s.a} />
        <SurfaceCharge x={bx} y={cy} charge={s.b} />
        {s.connected && progress > 0 && progress < 1 && (
          <g opacity={Math.sin(progress * Math.PI)}>
            <path
              d={`M${bx - 20} 106H${ax + 5}`}
              stroke="#6d95a2"
              strokeWidth="2"
              strokeDasharray="3 5"
            />
            <path d={`M${ax + 12} 101l-7 5 7 5`} fill="none" stroke="#6d95a2" strokeWidth="2" />
          </g>
        )}
        <text x={ax} y="42" textAnchor="middle">
          A
        </text>
        <text x={bx} y="42" textAnchor="middle">
          B
        </text>
      </svg>
      <div className="electro-charge-pair">
        <span>A {(s.a * 1e9).toFixed(2)} nC</span>
        <span>B {(s.b * 1e9).toFixed(2)} nC</span>
      </div>
      <div className="electro-observation">
        <b>{t(s.connected ? '两导体相连' : '两导体已分开')}</b>
        <span>Qₐ + Qᵦ = {((s.a + s.b) * 1e9).toFixed(2)} nC</span>
      </div>
    </>
  );
}
function Jar({ proximity, precharge, id }: { proximity: number; precharge: number; id: string }) {
  const s = electroscopeState(proximity, precharge),
    rodX = 160 + proximity * 69;
  return (
    <>
      <svg
        className="electro-apparatus electro-jar"
        viewBox="0 0 440 278"
        role="img"
        aria-label={t('玻璃瓶验电器的金属球、导杆和两片金属箔')}
      >
        <defs>
          <linearGradient id={`${id}-jar`}>
            <stop stopColor="#c8dcd6" stopOpacity=".5" />
            <stop offset=".5" stopColor="#f9fcf5" stopOpacity=".1" />
            <stop offset="1" stopColor="#94b5a9" stopOpacity=".45" />
          </linearGradient>
        </defs>
        <path
          d="M145 107Q132 115 132 137V243Q220 263 308 243V137Q308 115 295 107Z"
          fill={`url(#${id}-jar)`}
          stroke="#aac1b5"
          strokeWidth="1.5"
        />
        <ellipse cx="220" cy="108" rx="75" ry="12" fill="#9caa91" />
        <path d="M220 67V174" stroke="#a0b4aa" strokeWidth="7" />
        <circle cx="220" cy="65" r="25" fill="#c0d0bd" stroke="#91aa9a" />
        <Foils x={220} y={174} charge={s.leaves} length={60} />
        <SurfaceCharge x={220} y={65} charge={s.top} radius={18} />
        <g transform={`translate(${rodX - 116} 22)`} opacity={proximity}>
          <rect width="100" height="17" rx="8" fill="#ddbd92" />
          {[20, 50, 80].map((x) => (
            <Sign key={x} x={x} y={8.5} positive />
          ))}
        </g>
        <path d="M142 140V235" stroke="#fff" strokeWidth="4" opacity=".7" />
      </svg>
      <div className="electro-observation">
        <b>
          {t('验电器总电荷')} {(s.netCharge * 1e9).toFixed(2)} nC
        </b>
        <span>
          {t('箔片半张角')} {((s.angle * 180) / Math.PI).toFixed(1)}°
        </span>
      </div>
    </>
  );
}
function Friction({ progress }: { progress: number }) {
  const p = electroSmooth(progress),
    q = 0.6 * p;
  return (
    <>
      <svg
        className="electro-apparatus electro-friction"
        viewBox="0 0 440 260"
        role="img"
        aria-label={t('玻璃棒与丝绸之间的电子转移')}
      >
        <path
          d="M84 125Q115 98 153 120L269 158Q302 175 332 156L340 206Q299 226 260 211L139 180Q103 169 80 187Z"
          fill="#d4bcaa"
          stroke="#af9785"
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${96 + i * 42} ${131 + i * 8}l-4 49`} stroke="#bfa493" opacity=".65" />
        ))}
        <g transform={`translate(${Math.sin(progress * Math.PI * 4) * (1 - p) * 18} 0)`}>
          <path d="M96 93L334 147" stroke="#94b5b0" strokeWidth="28" strokeLinecap="round" />
          <path d="M98 87L332 141" stroke="#eaf0e2" strokeWidth="5" strokeLinecap="round" />
          {[142, 196, 250, 304].map((x, i) => (
            <Sign key={i} x={x} y={103 + (x - 142) * 0.226} positive opacity={p} />
          ))}
        </g>
        {[0, 1, 2, 3].map((i) => {
          const a = electroSmooth(Math.min(1, progress * 1.5 - i * 0.13));
          return (
            <Sign
              key={i}
              x={150 + i * 45}
              y={110 + i * 10 + a * 66}
              positive={false}
              opacity={Math.max(0.2, a)}
            />
          );
        })}
      </svg>
      <div className="electro-observation">
        <b>
          {t('玻璃棒')} +{q.toFixed(2)} nC
        </b>
        <span>
          {t('丝绸')} −{q.toFixed(2)} nC
        </span>
      </div>
    </>
  );
}
function Hair({ amount }: { amount: number }) {
  const hairs = useMemo(() => chargedHair(amount * 1.6e-9), [amount]);
  const sx = (x: number) => 220 + x * 1050,
    sy = (y: number) => 190 + y * 1050;
  return (
    <>
      <svg
        className="electro-apparatus electro-hair"
        viewBox="0 0 440 290"
        role="img"
        aria-label={t('同号带电细丝在排斥力与弹性作用下张开')}
      >
        <ellipse cx="220" cy="190" rx="52" ry="52" fill="#c5b097" />
        <path d="M202 234v20h36v-20" fill="#c5b097" />
        <path
          d="M178 270Q220 235 262 270"
          stroke="#97aea4"
          strokeWidth="26"
          strokeLinecap="round"
        />
        {hairs.map((h, i) => (
          <g key={i}>
            <path
              d={`M${sx(h.root.x)} ${sy(h.root.y)}Q${sx(h.root.x + (h.tip.x - h.root.x) * 0.25)} ${sy(h.root.y + (h.tip.y - h.root.y) * 0.55)} ${sx(h.tip.x)} ${sy(h.tip.y)}`}
              fill="none"
              stroke="#70695d"
              strokeWidth="2.5"
            />
            <Sign x={sx(h.tip.x)} y={sy(h.tip.y)} positive opacity={amount} />
          </g>
        ))}
        <path
          d="M204 196q5 -4 10 0M230 196q5 -4 10 0"
          fill="none"
          stroke="#8a7864"
          strokeWidth="2"
        />
      </svg>
      <div className="electro-observation">
        <b>{t('同种电荷互相排斥')}</b>
        <span>
          {t('细丝电荷')} +{(amount * 1.6).toFixed(2)} nC
        </span>
      </div>
    </>
  );
}
export default function ElectrostaticInduction() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [mode, setMode] = useState<ElectrostaticMode>(() =>
      electrostaticModeForVariant((film as typeof film & { variant?: string }).variant),
    ),
    [progress, setProgress] = useState(0.7),
    [polarity, setPolarity] = useState('positive'),
    [precharge, setPrecharge] = useState('0');
  const c = film.chapter,
    p = electroSmooth((film.chapterProgress - 0.12) / 0.7);
  const active = film.watch
    ? c === 0
      ? 'friction'
      : c <= 3
        ? 'induction'
        : c <= 5
          ? 'electroscope'
          : 'hair'
    : mode;
  const stage = film.watch ? (c === 1 ? p : c === 2 ? 1 + p * 2 : 3 + p) : progress * 4;
  const proximity = film.watch ? (c === 4 ? Math.sin(p * Math.PI) : p) : progress;
  const net = film.watch ? (c === 5 ? -0.1e-9 : 0) : Number(precharge) * 1e-9;
  const amount = film.watch ? p : progress;
  return (
    <section
      className="electro-film"
      data-watch={film.watch || undefined}
      data-chapter={film.chapter}
    >
      <div className="electro-kicker">
        {t(
          active === 'induction'
            ? '追踪同一组导体中的电荷'
            : active === 'electroscope'
              ? '张开不等于净电荷增加'
              : active === 'friction'
                ? '电荷转移，电荷总量不变'
                : '电荷相同，细丝向外张开',
        )}
      </div>
      {active === 'friction' ? (
        <Friction progress={amount} />
      ) : active === 'induction' ? (
        <Pair
          progress={stage}
          polarity={film.watch ? 1 : polarity === 'positive' ? 1 : -1}
          id={id}
        />
      ) : active === 'electroscope' ? (
        <Jar proximity={proximity} precharge={net} id={id} />
      ) : (
        <Hair amount={amount} />
      )}
      <div className="electro-key">
        <span>
          <i className="electro-positive" />
          {t('正电荷：缺少电子')}
        </span>
        <span>
          <i className="electro-negative" />
          {t('负电荷：多余电子')}
        </span>
      </div>
      {!film.watch && (
        <div className="electro-controls">
          <Segments
            label={t('选择静电实验')}
            value={mode}
            options={[
              { value: 'friction', label: t('摩擦起电') },
              { value: 'induction', label: t('感应起电') },
              { value: 'electroscope', label: t('验电器') },
              { value: 'hair', label: t('带电细丝') },
            ]}
            onChange={(v) => setMode(v as ElectrostaticMode)}
          />
          {mode === 'induction' && (
            <Segments
              label={t('外部带电体')}
              value={polarity}
              options={[
                { value: 'positive', label: t('带正电') },
                { value: 'negative', label: t('带负电') },
              ]}
              onChange={setPolarity}
            />
          )}{' '}
          {mode === 'electroscope' && (
            <Segments
              label={t('验电器预先带电')}
              value={precharge}
              options={[
                { value: '0', label: t('原先中性') },
                { value: '.1', label: t('预先带正电') },
                { value: '-.1', label: t('预先带负电') },
              ]}
              onChange={setPrecharge}
            />
          )}
          <Range
            label={t(
              mode === 'induction'
                ? '移近 → 分开 → 移走 → 重接'
                : mode === 'electroscope'
                  ? '带电棒靠近程度'
                  : '电荷转移程度',
            )}
            value={progress * 100}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => setProgress(v / 100)}
          />
        </div>
      )}
      <details className="electro-notes">
        <summary>{t('静电模型与实验条件')}</summary>
        <p>
          {t(
            '图示中的正负号表示净电荷，不是完整的原子图。两导体使用等势与电荷守恒近似求解；金属箔用尖端电荷与重力平衡估算张角，细丝计入静电排斥和弹性回复。忽略漏电、空气击穿及真实表面电荷细节，读数是教学参数，不是器材标定。',
          )}
        </p>
      </details>
    </section>
  );
}
