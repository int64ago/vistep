import { useEffect, useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range, Segments } from '../lab/Controls';
import {
  ALKALI_ATOMS,
  sodiumFilm,
  SODIUM_CHAPTER_SECONDS,
  sodiumClamp,
  surfaceExposure,
  oxidationGeometry,
  sodiumWaterAccount,
  waterAtomGeometry,
  dropletGeometry,
  immersedSphere,
  gasEscape,
  type SodiumForm,
} from '../../models/chem-sodium-reactions';
import '../../styles/chem-sodium-reactions.css';
type Say = (zh: string, en: string) => string;
type Common = { width: number; say: Say; uid: string };
const titles = [
  ['接触与表面', 'Contact and surface'],
  ['氧化物与过氧化物', 'Oxide and peroxide'],
  ['水面上的钠', 'Sodium on water'],
  ['追踪水中的氢', 'Follow water hydrogen'],
  ['追踪过氧化物中的氧', 'Follow peroxide oxygen'],
  ['同量钠的反例', 'An equal-sodium test'],
  ['钾与钠的共同点', 'Potassium and sodium'],
  ['剧烈程度与产物量', 'Vigour and yield'],
] as const;
function Dot({
  x,
  y,
  label,
  kind = 'Na',
  tracked = false,
}: {
  x: number;
  y: number;
  label: string;
  kind?: string;
  tracked?: boolean;
}) {
  const r = kind === 'H' ? 10 : kind === 'Na' ? 20 : 15;
  return (
    <g className="csr-dot">
      {tracked && <circle cx={x} cy={y} r={r + 4} fill="none" stroke="#bd8c37" strokeWidth="2" />}
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={kind === 'H' ? '#fcf5df' : kind === 'O' ? '#c2d6d1' : '#d2d7c6'}
        stroke={kind === 'O' ? '#7caaa0' : '#a8b39a'}
      />
      <text x={x} y={y + 5.5} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}
function MetalDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#fbfaf0" />
        <stop offset=".38" stopColor="#b9c6ba" />
        <stop offset=".53" stopColor="#e6ece1" />
        <stop offset="1" stopColor="#8fa694" />
      </linearGradient>
    </defs>
  );
}
function Surface({
  width: w,
  say,
  uid,
  layer,
  contact,
}: { layer: number; contact: boolean } & Common) {
  const cell = w / 2;
  return (
    <>
      <p className="csr-kicker">
        {contact
          ? say('干燥氧接触 · 截面对照', 'Dry O₂ · cross-section')
          : say('停止接触，旧层仍在', 'Contact off; layer remains')}
      </p>
      <svg
        viewBox={`0 0 ${w} 220`}
        data-layer={layer}
        data-oxygen-contact={contact}
        role="img"
        aria-label={say(
          '接触氧的表面改变，隔绝氧的表面仍明亮',
          'Exposed sodium changes while the oxygen-excluded face remains bright',
        )}
      >
        <MetalDefs uid={uid} />
        {[0, 1].map((i) => {
          const x = cell * i + cell * 0.17,
            ww = cell * 0.66;
          return (
            <g key={i}>
              <text x={cell * (i + 0.5)} y="22" textAnchor="middle">
                {i === 0 ? (contact ? 'O₂' : say('已隔绝', 'Excluded')) : say('无 O₂', 'No O₂')}
              </text>
              <path
                d={`M${x} 75l${ww * 0.75}-16 ${ww * 0.25} 19v71l${-ww * 0.75} 17 ${-ww * 0.25}-19Z`}
                fill={`url(#${uid}-metal)`}
                stroke="#9db099"
              />
              <path
                d={`M${x + ww * 0.25} 94l${8 * layer}-2v71l${-8 * layer} 2Z`}
                fill="#8d9e84"
                opacity={i === 0 ? layer * 0.92 : 0}
              />
              {i === 0 &&
                contact &&
                [0, 1].map((j) => (
                  <g key={j} opacity={0.4 + layer * 0.6}>
                    <path
                      d={`M${x + ww * (0.3 + 0.4 * j)} 38v27`}
                      stroke="#86aca3"
                      strokeWidth="1.5"
                      strokeDasharray="3 4"
                    />
                    <circle cx={x + ww * (0.3 + 0.4 * j) - 5} cy="40" r="5" fill="#a9c9c1" />
                    <circle cx={x + ww * (0.3 + 0.4 * j) + 5} cy="40" r="5" fill="#a9c9c1" />
                  </g>
                ))}
              <text x={cell * (i + 0.5)} y="194" textAnchor="middle">
                {i === 0 && layer > 0 ? 'Na₂O | Na' : say('金属 Na', 'Metal Na')}
              </text>
            </g>
          );
        })}
        <path
          d={`M${w * 0.24} 121h${w * 0.12}M${w * 0.64} 121h${w * 0.12}`}
          stroke="#f7f7e9"
          strokeWidth="3"
        />
      </svg>
      <p className="csr-account">{say('表层改变，内核保留', 'The metal core remains')}</p>
    </>
  );
}
function Burning({ width: w, say, uid, potassium = false }: { potassium?: boolean } & Common) {
  return (
    <>
      <p className="csr-kicker">
        {say('观察熔化、火焰与残留物', 'Observe melting, flame and residue')}
      </p>
      <svg
        viewBox={`0 0 ${w} 220`}
        role="img"
        aria-label={say(
          '金属在坩埚中燃烧，颜色不单独鉴定产物',
          'Metal burns in a crucible; colour alone does not identify its product',
        )}
      >
        <MetalDefs uid={uid} />
        <ellipse cx={w / 2} cy="192" rx={w * 0.31} ry="9" fill="#bdc6ad" opacity=".3" />
        <path
          d={`M${w * 0.22} 118Q${w * 0.25} 195 ${w * 0.5} 195Q${w * 0.75} 195 ${w * 0.78} 118Z`}
          fill="#ddd2b5"
          stroke="#b6af95"
        />
        <ellipse cx={w / 2} cy="118" rx={w * 0.28} ry="19" fill="#b3b49b" stroke="#dfdfc9" />
        <ellipse cx={w / 2} cy="120" rx="31" ry="10" fill={potassium ? '#d6c9b9' : '#ddd298'} />
        <path
          d={`M${w / 2 - 17} 122q-22-35 10-84q-2 31 20 47q18 25-7 39Z`}
          fill={potassium ? '#b49ac5' : '#e0b26a'}
          opacity=".8"
        />
        <path d={`M${w / 2 - 7} 121q-10-25 7-44q-1 24 12 38Z`} fill="#f7e6be" />
        <text x={w / 2} y="215" textAnchor="middle">
          {potassium
            ? say('氧化产物 · 不指定唯一式', 'Oxidation products')
            : say('教材产物：Na₂O₂', 'Textbook product: Na₂O₂')}
        </text>
      </svg>
    </>
  );
}
function Oxidation({
  width: w,
  say,
  form,
  progress,
  reveal,
  predict,
}: { predict: boolean; form: 'oxide' | 'peroxide'; progress: number; reveal: boolean } & Omit<
  Common,
  'uid'
>) {
  const p = sodiumClamp(progress),
    g = oxidationGeometry(form, w, p),
    a = g.account;
  if (reveal || predict)
    return (
      <>
        <p className="csr-kicker">
          {reveal
            ? say('同样 4 Na，耗氧量不同', 'Same 4 Na; different O₂ demand')
            : say('同样 4 Na：哪种更耗氧？', 'Same 4 Na: which needs more O₂?')}
        </p>
        <svg
          viewBox={`0 0 ${w} 200`}
          role="img"
          aria-label={
            reveal
              ? say(
                  '同样四个钠形成氧化物需一个氧分子，形成过氧化物需两个',
                  'Four sodium atoms need one oxygen molecule for oxide, two for peroxide',
                )
              : say(
                  '同样四个钠，哪一种产物需要更多氧气？',
                  'For the same four sodium atoms, which product needs more oxygen?',
                )
          }
        >
          {(['oxide', 'peroxide'] as const).map((f, i) => {
            const n = oxidationGeometry(f, w, 1).account.oxygenMolecules,
              y = 43 + i * 95;
            return (
              <g key={f}>
                <text x="8" y={y + 6}>
                  {f === 'oxide' ? 'Na₂O' : 'Na₂O₂'}
                </text>
                {reveal &&
                  Array.from({ length: n }, (_, j) => (
                    <g key={j}>
                      <Dot
                        x={w * (n === 1 ? 0.66 : 0.51 + j * 0.3) - 12}
                        y={y}
                        kind="O"
                        label="O"
                      />
                      <Dot
                        x={w * (n === 1 ? 0.66 : 0.51 + j * 0.3) + 12}
                        y={y}
                        kind="O"
                        label="O"
                      />
                    </g>
                  ))}
                <text x={w * 0.66} y={y + 36} textAnchor="middle">
                  {reveal ? `${n} O₂` : '?'}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="csr-scope">{say('原子与电子同时守恒', 'Atoms and electrons both balance')}</p>
      </>
    );
  return (
    <>
      <p className="csr-kicker">
        {reveal
          ? say('同样 4 Na：哪种更耗氧？', 'Same 4 Na: which needs more O₂?')
          : say('相同四个钠，氧的记账不同', 'Four Na; different oxygen states')}
      </p>
      <svg
        viewBox={`0 0 ${w} 220`}
        role="img"
        aria-label={say(
          '四个钠提供四份电子，氧化物和过氧化物按氧的数目分配',
          'Four sodium atoms supply four electron units allocated across oxide or peroxide oxygen',
        )}
      >
        {g.electrons.map((e) => (
          <g key={e.id}>
            <Dot x={e.donorX} y={35} label={p === 1 ? 'Na⁺' : 'Na'} />
            <path
              d={`M${e.donorX} 61Q${e.donorX} 101 ${e.targetX} 132`}
              fill="none"
              stroke="#d2c49d"
              strokeDasharray="2 5"
            />
            <circle data-electron={e.id} cx={e.x} cy={e.y} r="4" fill="#c4963d" />
          </g>
        ))}
        {g.oxygen
          .filter((_, i) => i % 2 === 0)
          .map((o, i) => (
            <line
              key={i}
              x1={o.x}
              x2={g.oxygen[i * 2 + 1].x}
              y1="151"
              y2="151"
              stroke="#7ba99d"
              strokeWidth="3"
              opacity={g.pairOpacity}
            />
          ))}
        {g.oxygen.map((o) => (
          <Dot
            key={o.id}
            x={o.x}
            y={o.y}
            kind="O"
            label={p === 1 && form === 'oxide' ? 'O²⁻' : 'O'}
          />
        ))}
        <text x={w / 2} y="195" textAnchor="middle">
          {form === 'oxide' ? '2 Na₂O · O: −II' : '2 [O–O]²⁻ · O: −I'}
        </text>
      </svg>
      <div className="csr-account">
        <span>4 e⁻ · {say('失去 = 得到', 'Lost = gained')}</span>
      </div>
    </>
  );
}
function WaterMotion({
  width: w,
  say,
  uid,
  extent,
  beat,
  potassium = false,
}: { extent: number; beat: string; potassium?: boolean } & Common) {
  const melt = beat !== 'float',
    g = dropletGeometry(w, extent, potassium ? 'K' : 'Na', melt ? 'sphere' : 'cube');
  return (
    <>
      <p className="csr-kicker">
        {beat === 'float'
          ? say('体积大部分在水下', 'Most of the volume is underwater')
          : beat === 'melt'
            ? say('放热使金属熔化', 'Reaction heat can melt the metal')
            : say('气体产生，金属逐渐消耗', 'Gas forms as metal is consumed')}
      </p>
      <svg
        viewBox={`0 0 ${w} 218`}
        role="img"
        aria-label={say(
          '金属浸入水的体积由密度比计算，大小跟随剩余量',
          'Submerged volume follows density ratio and size follows remaining metal',
        )}
      >
        <MetalDefs uid={uid} />
        <path
          d={`M14 49V159Q14 192 ${w / 2} 192T${w - 14} 159V49`}
          fill="#c7ded32b"
          stroke="#9bb9aa"
          strokeWidth="2"
        />
        <path
          d={`M16 ${g.level}V159Q16 190 ${w / 2} 190T${w - 16} 159V${g.level}Z`}
          fill="#c3d9ce"
          opacity=".55"
        />
        {g.radius > 0 && (
          <rect
            x={g.x - g.radius}
            y={g.y - g.radius}
            width={2 * g.radius}
            height={2 * g.radius}
            rx={melt ? g.radius : 5}
            fill={`url(#${uid}-metal)`}
            stroke="#91a98f"
          />
        )}
        <path d={`M15 ${g.level}H${w - 15}`} stroke="#8eae9e" strokeWidth="1.5" />
        {extent > 0 &&
          extent < 1 &&
          [0, 1, 2, 3].map((i) => {
            const b = gasEscape((extent * 2 + i * 0.21) % 1, g.level, g.level + 25);
            return (
              <g key={i} data-phase={b.phase}>
                <circle
                  cx={g.x + 22 + i * 5}
                  cy={b.y}
                  r={b.phase === 'liquid' ? 3 : 4}
                  fill="none"
                  stroke="#7ea999"
                  opacity={b.opacity}
                />
                {b.phase === 'gas' && i === 0 && (
                  <text x={g.x + 40} y={b.y + 5}>
                    H₂
                  </text>
                )}
              </g>
            );
          })}
        {beat === 'melt' && (
          <path d={`M${w * 0.17} 158v-37m-6 7 6-7 6 7`} stroke="#bd914f" strokeWidth="2" />
        )}
        <text x={w / 2} y="213" textAnchor="middle">
          {say('理想浮力 · 定性轨迹', 'Ideal buoyancy · model path')}
        </text>
      </svg>
      <p className="csr-account">
        {say('剩余金属', 'Metal left')}: {g.state.remainingMoles.toFixed(2)} ·{' '}
        {potassium ? 'K' : 'Na'}
      </p>
    </>
  );
}
function AtomAccount({
  width: w,
  say,
  kind,
  progress,
  highlightWater = false,
}: { highlightWater?: boolean; kind: SodiumForm; progress: number } & Omit<Common, 'uid'>) {
  const g = waterAtomGeometry(kind, w, progress),
    done = g.complete;
  return (
    <>
      <p className="csr-kicker">
        {highlightWater
          ? say('水里的氧也保留', 'Water oxygen is retained')
          : kind === 'metal'
            ? done
              ? say('这颗水中的氢进入 H₂', 'The marked water H enters H₂')
              : say('跟住金环标记的氢', 'Follow the gold-ringed hydrogen')
            : kind === 'oxide'
              ? say('水的质子转给氧化物', 'Water donates a proton to oxide')
              : done
                ? say('氧：−I → 0 与 −II', 'Oxygen: −I → 0 and −II')
                : g.gasComplete
                  ? say('氧对已成 O₂', 'The oxygen pair is now O₂')
                  : say('过氧化物：氧原来是 −I', 'Peroxide oxygen starts at −I')}
      </p>
      <svg
        viewBox={`0 0 ${w} ${g.height}`}
        role="img"
        aria-label={say(
          '净反应中每个原子的身份保持，金色环标出追踪对象',
          'Every atom retains its identity in this net allocation; gold rings mark the tracked atoms',
        )}
        data-atom-count={g.atoms.length}
        data-complete={done}
      >
        {g.bonds.map((b, i) => (
          <line
            key={i}
            x1={b.a.x}
            y1={b.a.y}
            x2={b.b.x}
            y2={b.b.y}
            stroke="#87aaa0"
            strokeWidth="3"
            opacity={b.opacity}
          />
        ))}
        {g.electronTransfers.map((e) => (
          <g key={e.id} opacity={e.opacity} data-ledger-electron={e.id}>
            <path
              d={`M${e.from.x} ${e.from.y}L${e.to.x} ${e.to.y}`}
              stroke="#cbb683"
              strokeDasharray="2 4"
            />
            <circle cx={e.x} cy={e.y} r="4" fill="#b68833" />
          </g>
        ))}
        {g.atoms.map((a) => (
          <g key={a.id} data-atom={a.id}>
            {highlightWater && a.id.startsWith('water-O') && (
              <circle cx={a.x} cy={a.y} r="21" fill="none" stroke="#4d8eae" strokeWidth="2" />
            )}
            <Dot x={a.x} y={a.y} kind={a.element} label={a.label} tracked={a.tracked} />
          </g>
        ))}
        {done && (
          <>
            <text x={w / 2} y={g.height - 4} textAnchor="middle">
              {kind === 'metal' ? 'H₂ + 2 OH⁻' : kind === 'oxide' ? '2 OH⁻ · 0 e⁻' : 'O₂ + 4 OH⁻'}
            </text>
          </>
        )}
        {kind === 'peroxide' && g.gasComplete && (
          <text x={w * 0.81} y={w < 560 ? 86 : 115} textAnchor="middle">
            O₂ · 0
          </text>
        )}
      </svg>
      <p className="csr-account">
        {kind === 'peroxide'
          ? 'Na 4 · O 6 · H 4'
          : kind === 'metal'
            ? 'Na 2 · O 2 · H 4'
            : 'Na 2 · O 2 · H 2'}
        {kind !== 'oxide' && <span> · {say('失 = 得', 'Lost = gained')} 2 e⁻</span>}
      </p>
      <p className="csr-scope">{say('净分配，不是逐步机理', 'Net allocation, not a mechanism')}</p>
    </>
  );
}
function AlkalineEvidence({ width: w, say }: Omit<Common, 'uid'>) {
  return (
    <>
      <p className="csr-kicker">{say('颜色支持碱性判断', 'Colour supports alkalinity')}</p>
      <svg
        viewBox={`0 0 ${w} 190`}
        role="img"
        aria-label={say(
          '酚酞在反应后溶液中显红，支持存在氢氧根的碱性判断；不用于鉴别氢气',
          'Phenolphthalein turns pink in the solution, supporting alkalinity from hydroxide; it does not identify hydrogen',
        )}
      >
        <path
          d={`M${w * 0.21} 28V123q0 29 ${w * 0.29} 29t${w * 0.29}-29V28`}
          fill="#f4dcde55"
          stroke="#b5a9aa"
          strokeWidth="2"
        />
        <path
          d={`M${w * 0.22} 71V123q0 27 ${w * 0.28} 27t${w * 0.28}-27V71Z`}
          fill="#df9bae"
          opacity=".55"
        />
        <path d={`M${w * 0.22} 71H${w * 0.78}`} stroke="#d193a6" />
        <text x={w / 2} y="112" textAnchor="middle">
          OH⁻
        </text>
        <text x={w / 2} y="181" textAnchor="middle">
          {say('酚酞', 'Phenolphthalein')}
        </text>
      </svg>
      <p className="csr-scope">{say('颜色不鉴别气体', 'Colour does not identify the gas')}</p>
    </>
  );
}
function PotassiumWater({ width: w, say, uid }: Common) {
  return (
    <>
      <p className="csr-kicker">{say('钠与钾：观察到的强烈程度', 'Na and K: observed vigour')}</p>
      <svg
        viewBox={`0 0 ${w} 218`}
        role="img"
        aria-label={say(
          '钠和钾都浮在水面，钾演示可出现燃烧；并非统一速率测量',
          'Sodium and potassium float; potassium can ignite in the demonstration. This is not a common rate measurement',
        )}
      >
        <MetalDefs uid={uid} />
        {(['Na', 'K'] as const).map((m, i) => {
          const x = w * (0.25 + 0.5 * i),
            r = 18,
            level = 116,
            y = level + r * (2 * immersedSphere(m === 'Na' ? 0.97 : 0.89) - 1);
          return (
            <g key={m}>
              <path
                d={`M${x - w * 0.2} 95V161q0 29 ${w * 0.2} 29t${w * 0.2}-29V95`}
                fill="#bfd4c12b"
                stroke="#96b4a1"
              />
              <path
                d={`M${x - w * 0.19} ${level}V160q0 28 ${w * 0.19} 28t${w * 0.19}-28V${level}Z`}
                fill="#bcd5c2"
                opacity=".55"
              />
              <circle cx={x} cy={y} r={r} fill={`url(#${uid}-metal)`} />
              <path d={`M${x - w * 0.2} ${level}H${x + w * 0.2}`} stroke="#95b39f" />
              {m === 'K' && (
                <path
                  d={`M${x - 12} ${level}q-12-25 10-53q-2 22 14 34q9 16-4 22Z`}
                  fill="#b49ac8"
                  opacity=".8"
                />
              )}
              <text x={x} y="213" textAnchor="middle">
                {m}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="csr-scope">{say('不是速率测量', 'Not a rate measurement')}</p>
    </>
  );
}
function PeroxideTest({ width: w, say, evidence }: { evidence: boolean } & Omit<Common, 'uid'>) {
  const cx = w * 0.34,
    level = 111;
  return (
    <>
      <p className="csr-kicker">
        {evidence
          ? say('气体、热、碱性是三个问题', 'Gas, heat and alkalinity are separate')
          : say('木条复燃，支持 O₂ 的判断', 'Relighting supports oxygen identification')}
      </p>
      <svg
        viewBox={`0 0 ${w} 218`}
        role="img"
        aria-label={say(
          '过氧化钠与水放氧，气体使带火星木条复燃；升温和试纸碱性分别呈现',
          'Peroxide releases oxygen; a glowing splint relights. Warming and alkaline paper are separate observations',
        )}
      >
        <path
          d={`M${cx - 32} 61V160a32 32 0 0 0 64 0V61`}
          fill="#bfd4c122"
          stroke="#8fac9f"
          strokeWidth="2"
        />
        <ellipse cx={cx} cy="61" rx="32" ry="7" fill="none" stroke="#8fac9f" />
        <path
          d={`M${cx - 30} ${level}V160a30 30 0 0 0 60 0V${level}Z`}
          fill="#c0d6c2"
          opacity=".6"
        />
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={cx - 12 + i * 11}
            cy={125 + i * 16}
            r={3 + i}
            fill="none"
            stroke="#8cad98"
          />
        ))}
        <path d={`M${cx} 14V73`} stroke="#ab8b60" strokeWidth="5" strokeLinecap="round" />
        <path d={`M${cx - 5} 77q-10-14 5-28q-2 13 7 20q7 10-5 11Z`} fill="#d5a759" />
        <text x={cx + 44} y="96">
          O₂ ↑
        </text>
        {evidence && (
          <g>
            <path
              d={`M${w * 0.72} 148v-32m-5 6 5-6 5 6`}
              fill="none"
              stroke="#b1894b"
              strokeWidth="2"
            />
            <text x={w * 0.72} y="173" textAnchor="middle">
              {say('升温', 'Warmer')}
            </text>
            <rect x={w * 0.83} y="123" width="14" height="27" rx="3" fill="#8ba3a2" />
            <text x={w * 0.85} y="200" textAnchor="middle">
              OH⁻
            </text>
          </g>
        )}
      </svg>
    </>
  );
}
function GasCompare({
  width: w,
  say,
  amount,
  reveal,
}: { amount: number; reveal: boolean } & Omit<Common, 'uid'>) {
  return (
    <>
      <p className="csr-kicker">
        {reveal
          ? say('同量钠，不同气体', 'Equal Na, different gases')
          : say('成碱，也一定放气吗？', 'Alkali: must gas form?')}
      </p>
      <svg
        viewBox={`0 0 ${w} 218`}
        data-sodium-amount={amount}
        data-revealed={reveal}
        role="img"
        aria-label={
          reveal
            ? say(
                '相同钠原子数下金属产氢、氧化物无气体、过氧化物产氧',
                'At equal sodium count: metal produces hydrogen, oxide no gas, peroxide oxygen',
              )
            : say('等待预测氧化物与水的气体产物', 'Predict the gas result for oxide and water')
        }
      >
        {(['metal', 'oxide', 'peroxide'] as const).map((f, i) => {
          const y = 32 + i * 72,
            a = sodiumWaterAccount(f, amount),
            label = f === 'metal' ? 'Na' : f === 'oxide' ? 'Na₂O' : 'Na₂O₂';
          return (
            <g key={f}>
              <text x="8" y={y + 5}>
                {label}
              </text>
              <path d={`M${w * 0.29} ${y}H${w * 0.41}`} stroke="#9daf94" />
              <text x={w * 0.45} y={y + 5}>
                {reveal
                  ? f === 'metal'
                    ? `${a.hydrogen} H₂`
                    : f === 'oxide'
                      ? say('无气体', 'No gas')
                      : `${a.oxygen} O₂`
                  : '?'}
              </text>
              {reveal && (
                <text x={w * 0.45} y={y + 29}>
                  {a.hydroxide} OH⁻
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="csr-account">
        {amount} mmol Na · {say('水过量', 'Water in excess')}
      </p>
    </>
  );
}
function Alkali({
  width: w,
  say,
  beat,
  reveal,
}: { beat: string; reveal: boolean } & Omit<Common, 'uid'>) {
  const energy = beat === 'energy' || beat === 'lithium';
  return (
    <>
      <p className="csr-kicker">
        {beat === 'amount'
          ? say('相同 mol，氢气是否相同？', 'Equal moles: equal hydrogen?')
          : energy
            ? say('孤立气态原子 · 第一电离能', 'Isolated gas atoms · first ionization')
            : say('最外层都只有一个电子', 'One outer electron in each')}
      </p>
      <svg
        viewBox={`0 0 ${w} 218`}
        role="img"
        aria-label={say(
          '钠和钾的一个价电子说明一价离子；电离能不是水中反应速率',
          'One valence electron supports singly charged ions; ionization energy is not an aqueous reaction rate',
        )}
      >
        {beat === 'amount'
          ? ['Na', 'K'].map((m, i) => (
              <g key={m}>
                <Dot x={w * 0.16} y={54 + i * 95} label={m} />
                <Dot x={w * 0.37} y={54 + i * 95} label={m} />
                <path d={`M${w * 0.5} ${54 + i * 95}H${w * 0.63}`} stroke="#98ad92" />
                {reveal ? (
                  <>
                    <Dot x={w * 0.77} y={54 + i * 95} label="H" kind="H" />
                    <Dot x={w * 0.87} y={54 + i * 95} label="H" kind="H" />
                    <path d={`M${w * 0.77} ${54 + i * 95}H${w * 0.87}`} stroke="#a4b897" />
                    <text x={w * 0.81} y={85 + i * 95}>
                      H₂
                    </text>
                  </>
                ) : (
                  <text x={w * 0.8} y={60 + i * 95}>
                    ?
                  </text>
                )}
              </g>
            ))
          : energy
            ? ALKALI_ATOMS.map((a, i) => {
                const y = 32 + i * 64;
                return (
                  <g key={a.symbol}>
                    <text x="7" y={y + 5}>
                      {a.symbol}
                    </text>
                    <rect
                      x={w * 0.2}
                      y={y - 11}
                      width={(w * 0.47 * a.ionizationEV) / 5.5}
                      height="18"
                      rx="9"
                      fill={a.symbol === 'Li' ? '#ced2bd' : '#b9cbb7'}
                    />
                    <text x={w * 0.72} y={y + 5}>
                      {a.ionizationEV.toFixed(3)}
                    </text>
                    <text x={w * 0.2} y={y + 28}>
                      {a.shells.length} {say('层电子', 'shells')}
                    </text>
                  </g>
                );
              })
            : ALKALI_ATOMS.slice(1).map((a, i) => (
                <g key={a.symbol}>
                  <text x={w * 0.12} y={48 + i * 89}>
                    {a.symbol}
                  </text>
                  <text x={w * 0.3} y={48 + i * 89}>
                    {a.shells.join(' · ')}
                  </text>
                  <circle cx={w * 0.8} cy={42 + i * 89} r="5" fill="#be943c" />
                  <text x={w * 0.7} y={77 + i * 89}>
                    → +1
                  </text>
                </g>
              ))}
        {energy && (
          <text x={w / 2} y="216" textAnchor="middle">
            {beat === 'lithium'
              ? say('Li：较缓和（预测）', 'Li: gentler (prediction)')
              : 'eV · NIST'}
          </text>
        )}
      </svg>
      <p className="csr-scope">
        {energy
          ? say('不是水中速率或电极电势', 'Not an aqueous rate or potential')
          : beat === 'limit'
            ? say('火焰不确定氧化物的唯一化学式', 'Flame ≠ one oxide formula')
            : beat === 'amount'
              ? say('这是计量，不是速率', 'Stoichiometry, not a reaction rate')
              : say('电子层占据示意', 'Shell-occupation schematic')}
      </p>
    </>
  );
}
export default function ChemSodiumReactions() {
  const film = useShowcase(),
    { host, width: measured, compact } = useSignalWidth(),
    uid = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say: Say = (a, b) => (en ? b : a);
  const start =
    film.variant === 'air'
      ? 1
      : film.variant === 'water'
        ? 3
        : film.variant === 'peroxide'
          ? 4
          : film.variant === 'potassium-air'
            ? 6
            : 0;
  const [chapter, setChapter] = useState(start),
    [progress, setProgress] = useState(0.5),
    [contact, setContact] = useState(true),
    [layer, setLayer] = useState(0.4),
    [amount, setAmount] = useState(4),
    [form, setForm] = useState<'oxide' | 'peroxide'>('peroxide'),
    [short, setShort] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(max-height:700px)');
    const change = () => setShort(m.matches);
    change();
    m.addEventListener('change', change);
    return () => m.removeEventListener('change', change);
  }, []);
  const w = Math.min(measured, 760),
    c = film.watch ? film.chapter : chapter,
    d = sodiumFilm(
      c,
      film.watch ? film.chapterTime : progress * SODIUM_CHAPTER_SECONDS[c],
      en ? 'en' : 'zh',
    ),
    a = film.watch ? 4 : amount;
  const oxideForm = film.watch ? d.oxideForm : form;
  const op = film.watch ? 1 : progress;
  return (
    <section
      ref={host}
      className="csr"
      data-watch={film.watch}
      data-short={compact && short}
      data-chapter={c}
      data-beat={d.beat}
    >
      {c === 0 && (
        <Surface
          width={w}
          uid={uid}
          say={say}
          layer={film.watch ? d.exposure : layer}
          contact={film.watch ? d.beat !== 'stop' : contact}
        />
      )}
      {c === 1 &&
        (d.beat === 'burn' ? (
          <Burning width={w} uid={uid} say={say} />
        ) : (
          <Oxidation
            width={w}
            say={say}
            form={oxideForm}
            progress={op}
            reveal={d.reveal}
            predict={d.beat === 'predict'}
          />
        ))}
      {c === 2 && (
        <WaterMotion
          width={w}
          uid={uid}
          say={say}
          extent={film.watch ? d.extent : progress}
          beat={d.beat}
        />
      )}
      {c === 3 &&
        (d.beat === 'amount' ? (
          <>
            <p className="csr-kicker">
              {d.reveal
                ? say('水过量：量加倍，产氢量也加倍', 'Excess water: double Na, double H₂')
                : say('钠的量加倍，H₂ 呢？', 'Double Na: how much H₂?')}
            </p>
            <svg
              viewBox={`0 0 ${w} 218`}
              role="img"
              aria-label={say(
                '先预测，再展示钠和氢气二比一的计量',
                'Predict before revealing the two-to-one sodium to hydrogen ratio',
              )}
            >
              {[2, a].map((n, i) => (
                <g key={i}>
                  <text x={w * 0.1} y={52 + i * 92}>
                    {n} Na
                  </text>
                  <path d={`M${w * 0.4} ${46 + i * 92}H${w * 0.58}`} stroke="#9dad93" />
                  <text x={w * 0.65} y={52 + i * 92}>
                    {d.reveal ? `${sodiumWaterAccount('metal', n).hydrogen} H₂` : '?'}
                  </text>
                </g>
              ))}
            </svg>
            <p className="csr-scope">mmol · {say('不是速率', 'Not a rate')}</p>
          </>
        ) : d.beat === 'evidence' ? (
          <AlkalineEvidence width={w} say={say} />
        ) : (
          <AtomAccount
            width={w}
            say={say}
            kind="metal"
            progress={d.beat === 'predict' ? 0 : film.watch ? d.transfer : progress}
          />
        ))}
      {c === 4 &&
        (d.beat === 'test' ? (
          <PeroxideTest width={w} say={say} evidence={false} />
        ) : (
          <AtomAccount
            width={w}
            say={say}
            kind="peroxide"
            highlightWater={d.highlightWater}
            progress={film.watch ? d.transfer : progress}
          />
        ))}
      {c === 5 &&
        (d.beat === 'evidence' ? (
          <PeroxideTest width={w} say={say} evidence />
        ) : d.beat === 'proton' ? (
          <AtomAccount
            width={w}
            say={say}
            kind="oxide"
            progress={film.watch ? d.transfer : progress}
          />
        ) : (
          <GasCompare width={w} say={say} amount={a} reveal={d.reveal} />
        ))}
      {c === 6 &&
        (d.beat === 'burn' ? (
          <Burning width={w} uid={uid} say={say} potassium />
        ) : (
          <Alkali width={w} say={say} beat={d.beat} reveal={d.reveal} />
        ))}
      {c === 7 &&
        (d.beat === 'motion' ? (
          <PotassiumWater width={w} uid={uid} say={say} />
        ) : (
          <Alkali width={w} say={say} beat={d.beat} reveal={d.reveal} />
        ))}
      {!film.watch && (
        <div className="csr-controls">
          <Segments
            label={say('解释镜头', 'Explanation')}
            value={String(chapter)}
            onChange={(v) => setChapter(Number(v))}
            options={titles.map((t, i) => ({ value: String(i), label: say(t[0], t[1]) }))}
          />
          {c === 0 ? (
            <>
              <button type="button" aria-pressed={contact} onClick={() => setContact(!contact)}>
                {say('氧接触', 'Oxygen contact')}: {contact ? say('开', 'On') : say('关', 'Off')}
              </button>
              <button type="button" onClick={() => setLayer(surfaceExposure(layer, contact, 0.2))}>
                {say('增加一次模型接触', 'Add model exposure')}
              </button>
              <button type="button" onClick={() => setLayer(0)}>
                {say('换新切面', 'Reset fresh face')}
              </button>
            </>
          ) : (
            <Range
              label={say('说明进度（非真实时间）', 'Explanation progress (not real time)')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}{' '}
          {c === 1 && (
            <Segments
              label={say('含氧产物', 'Oxygen product')}
              value={form}
              onChange={(v) => setForm(v === 'oxide' ? 'oxide' : 'peroxide')}
              options={[
                { value: 'oxide', label: 'Na₂O' },
                { value: 'peroxide', label: 'Na₂O₂' },
              ]}
            />
          )}{' '}
          {(c === 3 || c === 5) && (
            <Range
              label={say('钠原子总量 / mmol', 'Total sodium / mmol')}
              min={2}
              max={8}
              step={2}
              value={amount}
              onChange={setAmount}
            />
          )}
        </div>
      )}
      <details className="csr-details">
        <summary>{say('模型与证据的边界', 'Limits of model and evidence')}</summary>
        <p>
          {say(
            '表面控制只比较干燥氧接触；实际湿空气还可涉及水分和二氧化碳。教材条件对应氧化物或过氧化物，但不能仅用温度预测真实相组成。原子动画是守恒的净分配，并非同位素来源测量或逐步机理；过氧化物水反应可涉及过氧化氢。进度、轨迹、升温和火焰均非实测。电离能属于孤立气态原子，不是水反应速率或电极电势。',
            'The surface control isolates dry oxygen contact; humid air can involve water and carbon dioxide. The textbook conditions yield oxide or peroxide, but temperature alone does not predict real phase composition. Atom animation is a conserved net allocation, not isotope provenance or an elementary mechanism; peroxide water chemistry may involve hydrogen peroxide. Progress, paths, warming and flames are not measured. Ionization energy describes isolated gas atoms, not aqueous rates or electrode potentials.',
          )}
        </p>
      </details>
    </section>
  );
}
