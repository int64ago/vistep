import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  respirationChapters,
  respirationDirector,
  phosphorylTransfer,
  carbonGeometry,
  glycolysisLedger,
  carrierCycle,
  trioseOxidation,
  membraneTrajectories,
  oxygenInventory,
  terminalOxygenEvent,
  synthaseTurnover,
  respirationGasPaths,
  gasPathPosition,
  type RespirationChapter,
} from '../../models/bio-respiration';
import '../../styles/bio-respiration.css';
const names = [
  'ATP的受体',
  '气体的来源',
  '有限的氧',
  '检测与证据',
  '碳与载体',
  '膜上的耦联',
  '载体的回来',
];
const C = ['#a16f51', '#537f72'];
function Note({ children }: { children: React.ReactNode }) {
  return <p className="br10-note">{children}</p>;
}
function Flask({
  x,
  y = 0,
  kind,
  id,
  cloud = 0,
  bubbles = 0,
}: {
  x: number;
  y?: number;
  kind: 'yeast' | 'scrub' | 'detector';
  id: string;
  cloud?: number;
  bubbles?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={id}>
          <path d="M-14 10H14V42L39 130Q43 143 30 143H-30Q-43 143-39 130L-14 42Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect
          x="-45"
          y="85"
          width="90"
          height="65"
          fill={kind === 'yeast' ? '#c8b98c' : '#d4ded4'}
        />
        <rect
          x="-45"
          y="85"
          width="90"
          height="65"
          fill="#faf8e9"
          opacity={kind === 'detector' ? cloud : 0}
        />
        {kind === 'yeast' &&
          Array.from({ length: 16 }, (_, i) => (
            <ellipse
              key={i}
              cx={-25 + ((i * 17) % 50)}
              cy={100 + ((i * 13) % 35)}
              rx="3"
              ry="5"
              fill="#958664"
            />
          ))}
        {bubbles > 0 &&
          Array.from({ length: 5 }, (_, i) => (
            <circle
              key={i}
              cx={-7 + ((i * 5) % 14)}
              cy={132 - ((bubbles * 0.5 + i * 0.19) % 1) * 42}
              r="2.6"
              fill="#eff4df"
              stroke="#8f9f8f"
            />
          ))}
      </g>
      <path
        d="M-14 10H14V42L39 130Q43 143 30 143H-30Q-43 143-39 130L-14 42Z"
        fill="#eef3e6"
        fillOpacity=".12"
        stroke="#8c9e8d"
        strokeWidth="2"
      />
      <path d="M-26 90L-33 124" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="3" />
      <rect x="-17" y="5" width="34" height="10" rx="3" fill="#aaa080" />
    </g>
  );
}
function TwoCultures({ id }: { id: string }) {
  return (
    <>
      <div className="br10-kicker">{t('教材结果示意')}</div>
      <svg viewBox="0 0 300 180" role="img" aria-label={t('两种条件都可能产气')}>
        <Flask x={75} y={20} id={id + 'A'} kind="yeast" bubbles={0.8} />
        <Flask x={225} y={20} id={id + 'B'} kind="yeast" bubbles={0.8} />
        <path
          d="M68 130V15H18M82 50V10H125M232 50V10H275"
          fill="none"
          stroke="#839a89"
          strokeWidth="3"
        />
        <text x="75" y="20" textAnchor="middle">
          A · O₂
        </text>
        <text x="225" y="20" textAnchor="middle">
          B
        </text>
        <text x="135" y="90" textAnchor="middle">
          CO₂
        </text>
        <text x="282" y="90" textAnchor="middle">
          CO₂
        </text>
      </svg>
      <Note>{t('两种条件都可能产气')}</Note>
    </>
  );
}
function GasSource({
  time,
  shot,
  scrubber,
  id,
}: {
  time: number;
  shot: string;
  scrubber: boolean;
  id: string;
}) {
  const inlet = shot === 'incoming',
    a = inlet ? 'scrub' : 'yeast',
    b = inlet ? 'yeast' : 'detector';
  const q = (time * 0.18) % 1,
    tracer = gasPathPosition(respirationGasPaths.transfer, q),
    contaminant = gasPathPosition(respirationGasPaths.transfer, (q + 0.43) % 1);
  return (
    <>
      <div className="br10-kicker">
        {t(!scrubber ? '吸收步骤缺失' : inlet ? '外来CO₂' : '新生成CO₂')}
      </div>
      <svg viewBox="0 0 300 205" role="img" aria-label={t('进气通到液下，出气来自瓶口')}>
        <Flask x={70} y={35} kind={a} id={id + 'g1'} bubbles={time} />
        <Flask
          x={228}
          y={35}
          kind={b}
          id={id + 'g2'}
          bubbles={time}
          cloud={inlet ? 0 : scrubber ? 0.65 : 0.9}
        />
        <path
          d={Object.values(respirationGasPaths)
            .map((ps) => ps.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' '))
            .join(' ')}
          fill="none"
          stroke="#849b8a"
          strokeWidth="4"
        />
        {inlet && (
          <>
            <rect x="20" y="13" width="16" height="14" rx="3" fill="#b28a5a" />
            <text x="42" y="57">
              CO₂
            </text>
            <circle cx={62} cy={60 + q * 85} r="7" fill="#b28a5a" opacity={scrubber ? 1 - q : 1} />
            <circle cx={tracer.x} cy={tracer.y} r="6" fill="#718eaa" />
            {!scrubber && <circle cx={contaminant.x} cy={contaminant.y} r="7" fill="#b28a5a" />}
            <text x="132" y="55">
              O₂
            </text>
          </>
        )}
        {!inlet && (
          <>
            <circle cx={tracer.x} cy={tracer.y} r="7" fill="#537f72" />
            {!scrubber && <circle cx={contaminant.x} cy={contaminant.y} r="7" fill="#b28a5a" />}
            <text x="130" y="55">
              CO₂
            </text>
          </>
        )}
      </svg>
      <div className="br10-labels">
        <span>{t(inlet ? (scrubber ? '空气CO₂被吸收' : '吸收步骤缺失') : '酵母培养液')}</span>
        <span>{t(inlet ? '氧继续通入' : '澄清石灰水')}</span>
      </div>
      <Note>
        {t(!scrubber ? '变浑的来源仍有歧义' : inlet ? '先辨别气体来源' : '来自培养物的新CO₂')}
      </Note>
    </>
  );
}
function Sealed({ time, id }: { time: number; id: string }) {
  const s = oxygenInventory(time * 0.8),
    connection = Math.min(1, Math.max(0, (time - 12.5) / 1.5));
  return (
    <>
      <div className="br10-kicker">B · {t('有限氧储量')}</div>
      <svg viewBox="0 0 300 200" role="img" aria-label={t('密闭瓶原有的氧逐渐用尽')}>
        <Flask x={88} y={25} kind="yeast" id={id + 'sealed'} bubbles={time} />
        <Flask
          x={241}
          y={25}
          kind="detector"
          id={id + 'sealedd'}
          cloud={connection * Math.min(1, s.laterGas / 2)}
          bubbles={connection === 1 ? time : 0}
        />
        <path
          d="M96 58V15H233V145M249 55V15H288"
          fill="none"
          stroke="#849b8a"
          strokeWidth="4"
          opacity={connection}
        />
        {Array.from({ length: 6 }, (_, i) => (
          <circle
            key={i}
            cx={67 + (i % 3) * 20}
            cy={67 + Math.floor(i / 3) * 22}
            r="6"
            fill="#718eaa"
            opacity={Math.min(1, Math.max(0, s.remaining * 6 - i))}
          />
        ))}
        <text x="148" y="79">
          O₂
        </text>
        <rect x="147" y="92" width="39" height="12" rx="6" fill="#d3dbd0" />
        <rect x="147" y="92" width={39 * s.remaining} height="12" rx="6" fill="#718eaa" />
        {connection === 1 && (
          <circle cx={110 + ((time * 0.18) % 1) * 118} cy={15} r="7" fill="#537f72" />
        )}
      </svg>
      <Note>{t(s.depleted ? '氧已耗尽，仍有新CO₂' : '密闭不等于已经无氧')}</Note>
    </>
  );
}
function Tube({ x, label, color }: { x: number; label: string; color: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path
        d="M-23 27V130Q-23 153 0 153Q23 153 23 130V27"
        fill="none"
        stroke="#879d8e"
        strokeWidth="2"
      />
      <path d="M-20 82H20V130Q20 150 0 150Q-20 150-20 130Z" fill={color} />
      <path d="M-14 43V117" stroke="#fff" strokeOpacity=".7" fill="none" />
      <text x="0" y="184" textAnchor="middle">
        {label}
      </text>
    </g>
  );
}
function Assays({ shot, progress }: { shot: string; progress: number }) {
  const interference = shot === 'interference',
    gas = shot === 'gas',
    boundary = shot === 'boundary',
    question = shot === 'question';
  return (
    <>
      <div className="br10-kicker">
        {t(interference ? '同一试剂，两种原因' : boundary ? '高糖酵母的边界' : '教材结果示意')}
      </div>
      {question ? (
        <>
          <svg viewBox="0 0 300 180" role="img" aria-label={t('追踪碳和载体')}>
            <path d="M40 90H260" stroke="#b2bea9" strokeWidth="3" fill="none" />
            {[1, 2, 3, 4, 5, 6].map((n, i) => (
              <g key={n}>
                <circle cx={40 + i * 44} cy="90" r="18" fill={n < 4 ? C[0] : C[1]} />
                <text x={40 + i * 44} y="97" textAnchor="middle" fill="white">
                  {n}
                </text>
              </g>
            ))}
          </svg>
          <Note>{t('碳去哪了？ATP从何而来？')}</Note>
        </>
      ) : (
        <>
          <svg viewBox="0 0 300 200" role="img" aria-label={t('检测结果需要与条件一起判断')}>
            <Tube
              x={80}
              label={interference ? t('乙醇') : boundary ? 'O₂ +' : 'A'}
              color={gas ? '#eeeede' : interference || boundary ? '#929f82' : '#d6a45e'}
            />
            <Tube
              x={220}
              label={interference ? t('葡萄糖') : 'B'}
              color={gas ? '#eeeede' : interference && progress < 0.6 ? '#d6a45e' : '#929f82'}
            />
          </svg>
          <Note>
            {t(
              gas
                ? '两种条件都可能产气'
                : interference
                  ? '葡萄糖也能干扰显色'
                  : boundary
                    ? '有氧，也可能生成乙醇'
                    : '排除残余葡萄糖后再判断',
            )}
          </Note>
        </>
      )}
    </>
  );
}
function Transfer({
  progress,
  donor,
  shot,
}: {
  progress: number;
  donor: 'ATP' | 'Pi';
  shot: string;
}) {
  const s = phosphorylTransfer(progress, donor),
    at = (id: string) => s.atoms.find((x) => x.id === id)!;
  return (
    <>
      <div className="br10-kicker">{t('磷酰基净转移')}</div>
      <svg viewBox="0 0 300 250" role="img" aria-label={t('同一磷原子转给葡萄糖原来的氧')}>
        <path
          d="M15 32Q5 12 36 8H218Q243 8 240 32V105Q228 114 218 104L206 90Q195 78 189 103L190 140Q197 158 215 147Q242 132 248 163L281 228Q286 245 262 245H40Q14 245 14 220Z"
          fill="#d9e1ce"
          fillOpacity=".65"
        />
        {s.bonds
          .filter((b) => b.weight > 0.01)
          .map((b) => {
            const a = at(b.from),
              z = at(b.to),
              dx = z.x - a.x,
              dy = z.y - a.y,
              d = Math.hypot(dx, dy) || 1;
            return (
              <path
                key={b.from + b.to}
                d={`M${a.x + (dx / d) * 13} ${a.y + (dy / d) * 13}L${z.x - (dx / d) * 13} ${z.y - (dy / d) * 13}`}
                fill="none"
                stroke={b.to === 'Pgamma' ? '#b58b34' : '#8fa08e'}
                strokeWidth={b.to === 'Pgamma' ? 4 : 2.5}
                opacity={b.weight}
              />
            );
          })}
        {s.atoms.map((a) => (
          <g key={a.id} data-atom-id={a.id}>
            <circle
              cx={a.x}
              cy={a.y}
              r="14"
              fill={a.id === 'Pgamma' ? '#ead7a8' : a.id === 'O6' ? '#d4e4d8' : '#f2f3e8'}
            />
            <text
              x={a.x}
              y={a.y + 7}
              textAnchor="middle"
              fill={a.element === 'O' ? '#a3624f' : a.element === 'P' ? '#8b6825' : '#496452'}
            >
              {a.id === 'H6' && s.progress > 0.8 ? 'H⁺' : a.element}
            </text>
          </g>
        ))}
        <text x="8" y="182">
          …
        </text>
        {donor === 'ATP' && (
          <text x="8" y="72">
            …
          </text>
        )}
        {donor === 'ATP' && s.progress > 0.8 && (
          <text x="264" y="200" textAnchor="middle">
            {t('缓冲液')}
          </text>
        )}
      </svg>
      <Note>
        {t(
          donor === 'Pi'
            ? '游离磷酸不能替代这里的ATP'
            : progress > 0.98
              ? 'ADP与磷酸化的糖同时形成'
              : shot === 'bind'
                ? '供体和受体进入同一酶'
                : '糖的原有氧，接上转来的磷',
        )}
      </Note>
    </>
  );
}
function CarbonPath({
  route,
  progress,
}: {
  route: 'pyruvate' | 'ethanol' | 'lactate' | 'aerobic';
  progress: number;
}) {
  const atoms = carbonGeometry(route, progress),
    at = (group: number, slot: number) => atoms.find((a) => a.group === group && a.slot === slot)!;
  const separated = progress > 0.48;
  return (
    <>
      <div className="br10-kicker">{t('碳编号对应原葡萄糖')}</div>
      <svg viewBox="0 0 300 240" role="img" aria-label={t('六个原碳保持身份')}>
        {[0, 1].map((group) => (
          <g key={group}>
            {[0, 1].map((slot) => {
              const a = at(group, slot),
                z = at(group, slot + 1);
              return (
                <path
                  key={slot}
                  d={`M${a.x} ${a.y}L${z.x} ${z.y}`}
                  fill="none"
                  stroke="#9ba68c"
                  strokeWidth="3"
                  opacity={
                    route === 'aerobic'
                      ? 1 - progress
                      : slot === 1 && route === 'ethanol'
                        ? 1 - Math.max(0, (progress - 0.48) / 0.52)
                        : 1
                  }
                />
              );
            })}
            {separated && route !== 'aerobic' && (
              <>
                <path
                  d={`M${at(group, 1).x - 3} ${at(group, 1).y - 17}V${at(group, 1).y - 35}M${at(group, 1).x + 3} ${at(group, 1).y - 17}V${at(group, 1).y - 35}`}
                  fill="none"
                  stroke="#ab8170"
                  strokeWidth="2"
                  opacity={route === 'lactate' ? 0 : 1}
                />
                <text x={at(group, 1).x} y={at(group, 1).y - 43} textAnchor="middle" fill="#a3624f">
                  {route === 'lactate' ? 'OH' : 'O'}
                </text>
                {route === 'lactate' && (
                  <path
                    d={`M${at(group, 1).x} ${at(group, 1).y - 17}V${at(group, 1).y - 35}`}
                    fill="none"
                    stroke="#ab8170"
                    strokeWidth="2"
                  />
                )}
                {(route === 'pyruvate' || route === 'lactate') && (
                  <>
                    <path
                      d={`M${at(group, 2).x - 3} ${at(group, 2).y - 17}V${at(group, 2).y - 35}M${at(group, 2).x + 3} ${at(group, 2).y - 17}V${at(group, 2).y - 35}M${at(group, 2).x + 17} ${at(group, 2).y}H${at(group, 2).x + 32}`}
                      fill="none"
                      stroke="#ab8170"
                      strokeWidth="2"
                    />
                    <text
                      x={at(group, 2).x}
                      y={at(group, 2).y - 43}
                      textAnchor="middle"
                      fill="#a3624f"
                    >
                      O
                    </text>
                    <text
                      x={at(group, 2).x + 48}
                      y={at(group, 2).y + 7}
                      textAnchor="middle"
                      fill="#a3624f"
                    >
                      O⁻
                    </text>
                  </>
                )}
              </>
            )}
          </g>
        ))}
        {atoms.map((a) => (
          <g key={a.id} data-carbon={a.position}>
            {a.product === 'CO₂' && progress > 0.6 && (
              <>
                <path
                  d={`M${a.x - 30} ${a.y}H${a.x + 30}`}
                  fill="none"
                  stroke="#bda58e"
                  strokeWidth="2"
                />
                <circle cx={a.x - 29} cy={a.y} r="10" fill="#c8d3c0" />
                <circle cx={a.x + 29} cy={a.y} r="10" fill="#c8d3c0" />
              </>
            )}
            <circle cx={a.x} cy={a.y} r="17" fill={C[a.group]} />
            <text x={a.x} y={a.y + 7} textAnchor="middle" fill="#fff">
              {a.position}
            </text>
          </g>
        ))}
      </svg>
      <Note>
        {route === 'aerobic'
          ? '6 C → 6 CO₂'
          : route === 'ethanol'
            ? '6 C → 2 × 2 C + 2 CO₂'
            : route === 'lactate'
              ? t('三个碳保留，不生成CO₂')
              : t('两个丙酮酸，此时没有CO₂')}
      </Note>
    </>
  );
}
function Ledger({ progress }: { progress: number }) {
  const s = glycolysisLedger(progress);
  return (
    <>
      <div className="br10-kicker">{t('ATP与磷的独立收支')}</div>
      <div className="br10-ledger">
        {s.adenosineIds.map((id, i) => (
          <div key={id} className="br10-nucleotide">
            <b>{i < s.ATP ? 'ATP' : 'ADP'}</b>
            <div>
              {Array.from({ length: i < s.ATP ? 3 : 2 }, (_, j) => (
                <span key={j}>P</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="br10-account">
        <span>Pᵢ × {s.Pi}</span>
        <span>
          {t('糖上磷基')} × {s.organicP}
        </span>
      </div>
      <Note>
        {t(
          s.stage === 0
            ? '先投入2ATP'
            : s.stage === 1
              ? '两份磷基先接到糖上'
              : s.stage === 2
                ? '两份无机磷酸也参与'
                : '4生成 − 2投入 = 净得2ATP',
        )}
      </Note>
    </>
  );
}
function Carrier({ id, x, y, reduced }: { id: string; x: number; y: number; reduced: number }) {
  return (
    <g transform={`translate(${x} ${y})`} data-carrier-id={id} data-reduced={reduced}>
      <path
        d="M0-25L23-12V12L0 25L-23 12V-12Z"
        fill={reduced > 0.5 ? '#d0ba8c' : '#d7e3d2'}
        stroke="#869d89"
        strokeWidth="2"
      />
      <text y="7" textAnchor="middle">
        {id}
      </text>
      <circle cx="-5" cy="-34" r="3" fill="#a8773d" opacity={reduced} />
      <circle cx="5" cy="-34" r="3" fill="#a8773d" opacity={reduced} />
      <text y="53" textAnchor="middle">
        {reduced > 0.5 ? 'NADH' : 'NAD⁺'}
      </text>
    </g>
  );
}
function Carriers({
  time,
  recycle,
  chapter,
}: {
  time: number;
  recycle: boolean;
  chapter: 'glycolysis' | 'fermentation';
}) {
  const s = carrierCycle(time, recycle),
    oxidation = trioseOxidation(time, recycle),
    ret = s.carriers[0].returnProgress,
    fermentation = chapter === 'fermentation' && time < 12;
  return (
    <>
      <div className="br10-kicker">
        {t(
          fermentation
            ? '乙醛 → 乙醇'
            : oxidation.batch === 2
              ? '下一批三碳底物'
              : '回看三碳氧化步',
        )}
      </div>
      <svg
        viewBox="0 0 300 270"
        data-carrier-waiting={s.waiting}
        data-carrier-atp={s.netATP}
        role="img"
        aria-label={t('载体再生决定下一批反应能否继续')}
      >
        {s.carriers.map((c, i) => {
          const y = 60 + i * 124,
            ids = i === 0 ? [1, 2, 3] : [6, 5, 4];
          return (
            <g key={c.id}>
              <Carrier id={c.id} x={43} y={y} reduced={c.reduced} />
              {fermentation && (
                <path
                  d={`M90 ${y}H${fermentation ? 208 : 245}`}
                  fill="none"
                  stroke="#9caa94"
                  strokeWidth="3"
                />
              )}
              {fermentation &&
                ids.slice(0, 2).map((n, j) => (
                  <g key={n}>
                    <circle cx={115 + j * 58} cy={y} r="16" fill={C[i]} />
                    <text x={115 + j * 58} y={y + 7} fill="#fff" textAnchor="middle">
                      {n}
                    </text>
                  </g>
                ))}
              {fermentation ? (
                <>
                  <path
                    d={`M190 ${y - 3}H225M190 ${y + 3}H225`}
                    fill="none"
                    stroke="#ab8170"
                    strokeWidth="2"
                    opacity={1 - ret}
                  />
                  <path
                    d={`M190 ${y}H225`}
                    fill="none"
                    stroke="#ab8170"
                    strokeWidth="2"
                    opacity={ret}
                  />
                  <text x="251" y={y + 7} textAnchor="middle" fill="#a3624f">
                    {ret > 0.8 ? 'OH' : 'O'}
                  </text>
                  <path
                    d={`M66 ${y - 28}Q125 ${y - 55} 173 ${y - 20}`}
                    fill="none"
                    stroke="#bb9854"
                    strokeWidth="2"
                    strokeDasharray="4 5"
                  />
                  {ret > 0 &&
                    ret < 1 &&
                    [0, 1].map((n) => (
                      <circle
                        key={n}
                        cx={66 + ret * 107 + n * 8}
                        cy={y - 28 - Math.sin(ret * Math.PI) * 20}
                        r="4"
                        fill="#a8773d"
                      />
                    ))}
                </>
              ) : (
                <>
                  <path
                    d={`M112 ${y}H192M112 ${y + 16}V${y + 21}M112 ${y + 39}V${y + 45}M152 ${y - 16}V${y - 26}`}
                    fill="none"
                    stroke="#9caa94"
                    strokeWidth="3"
                  />
                  {ids.map((n, j) => (
                    <g key={n}>
                      <circle cx={112 + j * 40} cy={y} r="16" fill={C[i]} />
                      <text x={112 + j * 40} y={y + 7} fill="#fff" textAnchor="middle">
                        {n}
                      </text>
                    </g>
                  ))}
                  <text x="112" y={y + 37} textAnchor="middle" fill="#a3624f">
                    O
                  </text>
                  <text x="112" y={y + 65} textAnchor="middle" fill="#ab884b">
                    P
                  </text>
                  <text x="152" y={y - 30} textAnchor="middle" fill="#a3624f">
                    OH
                  </text>
                  <path
                    d={`M189 ${y - 17}V${y - 28}M195 ${y - 17}V${y - 28}`}
                    fill="none"
                    stroke="#ab8170"
                    strokeWidth="2"
                  />
                  <text x="192" y={y - 30} textAnchor="middle" fill="#a3624f">
                    O
                  </text>
                  <g opacity={oxidation.aldehyde}>
                    <path d={`M208 ${y}H220`} stroke="#ab8170" strokeWidth="2" />
                    <text x="232" y={y + 7} textAnchor="middle">
                      H
                    </text>
                  </g>
                  <path
                    d={`M209 ${y}H219`}
                    stroke="#ab8170"
                    strokeWidth="2"
                    opacity={oxidation.acylPhosphate}
                  />
                  <path
                    d={`M${oxidation.incomingO.x + 10} ${y + oxidation.incomingO.y}L${oxidation.pi.x - 12} ${y + oxidation.pi.y}`}
                    stroke="#ab8170"
                    strokeWidth="2"
                  />
                  <text
                    x={oxidation.incomingO.x}
                    y={y + oxidation.incomingO.y + 7}
                    textAnchor="middle"
                    fill="#a3624f"
                  >
                    O
                  </text>
                  <circle
                    cx={oxidation.pi.x}
                    cy={y + oxidation.pi.y}
                    r="14"
                    fill="#eee2bf"
                    stroke="#b49b62"
                  />
                  <text
                    x={oxidation.pi.x}
                    y={y + oxidation.pi.y + 7}
                    textAnchor="middle"
                    fill="#83672f"
                  >
                    P
                  </text>
                  <path
                    d={`M194 ${y - 46}Q125 ${y - 58} 58 ${y - 28}`}
                    fill="none"
                    stroke="#bb9854"
                    strokeWidth="2"
                    strokeDasharray="4 5"
                  />
                  {oxidation.progress > 0 &&
                    oxidation.progress < 1 &&
                    [0, 1].map((n) => (
                      <circle
                        key={n}
                        cx={194 - 136 * oxidation.progress + n * 8}
                        cy={
                          y -
                          46 -
                          10 * Math.sin(oxidation.progress * Math.PI) +
                          18 * oxidation.progress
                        }
                        r="3"
                        fill="#a8773d"
                      />
                    ))}
                </>
              )}
            </g>
          );
        })}
      </svg>
      <Note>
        {t(
          s.waiting
            ? '缺少NAD⁺，下一批受限'
            : chapter === 'glycolysis'
              ? 'Pi参与，NAD⁺接受还原当量'
              : fermentation && ret > 0.95
                ? '不新增ATP'
                : time >= 12
                  ? '原载体回来，下一批可继续'
                  : '同一载体，再次参加反应',
        )}
      </Note>
    </>
  );
}
function Membrane({ time, stopped, cut = 22 }: { time: number; stopped: boolean; cut?: number }) {
  const s = membraneTrajectories(time, stopped ? cut : Infinity),
    e = s.electronPosition,
    terminal = terminalOxygenEvent(time),
    turnover = synthaseTurnover(time, stopped ? cut : Infinity);
  return (
    <>
      <div className="br10-kicker">{t('内膜外侧')}</div>

      <svg
        viewBox="0 0 300 250"
        data-gradient={s.gradient}
        data-synthase={s.synthase}
        data-oxygen={s.oxygen}
        role="img"
        aria-label={t('电子传递建立差异，质子回流推动ATP合成')}
      >
        <rect x="12" y="72" width="276" height="43" rx="8" fill="#e0d0aa" />
        {Array.from({ length: 20 }, (_, i) => (
          <g key={i}>
            <circle cx={17 + i * 14} cy="75" r="5" fill="#b89b68" />
            <circle cx={17 + i * 14} cy="111" r="5" fill="#b89b68" />
            <path
              d={`M${17 + i * 14} 80v12M${17 + i * 14} 105V95`}
              stroke="#c3aa79"
              strokeWidth="2"
              fill="none"
            />
          </g>
        ))}
        <rect x="35" y="65" width="38" height="58" rx="16" fill="#9db3a3" />
        <rect x="107" y="62" width="39" height="61" rx="16" fill="#b29b77" />
        <rect x="195" y="65" width="40" height="59" rx="15" fill="#8caa98" />
        <path
          d="M215 110V160M187 162Q215 141 243 162V178Q215 199 187 178Z"
          fill="#a9c1ad"
          stroke="#6d8d77"
          strokeWidth="3"
        />
        <path
          d="M118 50Q92 68 54 65M54 94H125M125 116L155 149"
          fill="none"
          stroke="#a17f54"
          strokeWidth="3"
        />
        <circle
          cx={54 + Math.min(1, e * 1.5) * 71}
          cy={94 + Math.max(0, e - 0.66) * 150}
          r="5"
          fill="#ac7c33"
        />
        <circle
          cx={63 + Math.min(1, e * 1.5) * 71}
          cy={94 + Math.max(0, e - 0.66) * 150}
          r="5"
          fill="#ac7c33"
        />
        {terminal.carriers.map((n, i) => (
          <text key={n.id} x="8" y={25 + i * 28}>
            {n.id} · {s.carrierReduced > 0.7 || n.reduced > 0.5 ? 'NADH' : 'NAD⁺'}
          </text>
        ))}
        <path d="M98 131Q138 115 181 135V190Q140 205 98 190Z" fill="#e4dec8" />
        {terminal.progress < 0.9 && (
          <path
            d={`M${terminal.atoms[0].x} ${terminal.atoms[0].y}L${terminal.atoms[1].x} ${terminal.atoms[1].y}`}
            fill="none"
            stroke="#b78b70"
            strokeWidth="3"
            opacity={1 - terminal.progress}
          />
        )}
        {terminal.progress > 0.1 &&
          [
            [0, 2],
            [0, 3],
            [1, 4],
            [1, 5],
          ].map(([o, h]) => (
            <path
              key={h}
              d={`M${terminal.atoms[o].x} ${terminal.atoms[o].y}L${terminal.atoms[h].x} ${terminal.atoms[h].y}`}
              fill="none"
              stroke="#b59e7e"
              strokeWidth="2"
              opacity={terminal.progress}
            />
          ))}
        {terminal.atoms.map((a) => (
          <circle
            key={a.id}
            data-oxygen-event-atom={a.id}
            cx={a.x}
            cy={a.y}
            r={a.element === 'O' ? 9 : 5}
            fill={a.element === 'O' ? '#b78b70' : '#d6b66e'}
          />
        ))}
        <text x="140" y="202" textAnchor="middle">
          {terminal.progress > 0.9 ? '2 H₂O' : 'O₂ + 4 H⁺'}
        </text>
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} opacity={Math.min(1, Math.max(0, s.gradient * 5 - i))}>
            <circle cx={155 + (i % 4) * 30} cy={24 + Math.floor(i / 4) * 27} r="7" fill="#d6b66e" />
            <text x={155 + (i % 4) * 30} y={31 + Math.floor(i / 4) * 27} textAnchor="middle">
              +
            </text>
          </g>
        ))}
        {s.pump > 0 && (
          <circle cx="126" cy={144 - ((time * 0.65) % 1) * 110} r="6" fill="#d6b66e" />
        )}
        {s.protons
          .filter((_, i) => i % 2 === 0)
          .map((h) => h.visible && <circle key={h.id} cx={h.x} cy={h.y} r="5" fill="#d6b66e" />)}
        <text x="58" y="230" textAnchor="middle">
          {t('基质侧')}
        </text>
        <path
          d="M204 170H236"
          transform={`translate(0 ${43 * Math.max(0, (turnover.progress - 0.6) / 0.4)})`}
          fill="none"
          stroke="#b39560"
          strokeWidth="2"
          opacity={turnover.formed ? 1 : 0.5}
        />
        {turnover.phosphates.map((a) => (
          <circle key={a.id} data-synthase-p={a.id} cx={a.x} cy={a.y} r="6" fill="#ad8a43" />
        ))}
        <text x="264" y="128" textAnchor="middle">
          Pᵢ
        </text>
        <text x="220" y="240" textAnchor="middle">
          {turnover.label}
        </text>
      </svg>
      <Note>
        {t(
          stopped
            ? s.synthase > 0.15
              ? '停止供氧，储存差异仍在'
              : '储存差异消耗，合成减慢'
            : '质子回流，推动ATP合成',
        )}
      </Note>
    </>
  );
}
function Prediction() {
  return (
    <>
      <div className="br10-kicker">{t('等量糖的路径比较')}</div>
      <div className="br10-predict">
        <div>
          <b>{t('酒精发酵')}</b>
          <span>CO₂ × 2</span>
          <strong>ATP + 2</strong>
        </div>
        <div>
          <b>{t('同型乳酸发酵')}</b>
          <span>CO₂ × 0</span>
          <strong>ATP + 2</strong>
        </div>
      </div>
      <Note>{t('无CO₂，也可得ATP')}</Note>
    </>
  );
}
export default function BioRespiration() {
  const f = useShowcase(),
    id = useId().replace(/:/g, ''),
    locale = browserLocale(),
    [manual, setManual] = useState<RespirationChapter | null>(null),
    [time, setTime] = useState(20),
    [donor, setDonor] = useState<'ATP' | 'Pi'>('ATP'),
    [scrubber, setScrubber] = useState(true),
    [recycle, setRecycle] = useState(true),
    [route, setRoute] = useState<'ethanol' | 'lactate'>('ethanol'),
    [stop, setStop] = useState(false);
  const current = respirationChapters[Math.min(f.chapter, 6)],
    m = f.watch ? current : (manual ?? current),
    clock = f.watch ? f.chapterTime : time,
    d = respirationDirector(m, clock, locale);
  return (
    <section className="br10" data-shot={d.shot} data-mode={m} data-watch={f.watch}>
      {m === 'atp' ? (
        <Transfer
          progress={d.progress}
          shot={d.shot}
          donor={f.watch ? (d.shot === 'donor' ? 'Pi' : 'ATP') : donor}
        />
      ) : m === 'air' ? (
        d.shot === 'both' ? (
          <TwoCultures id={id} />
        ) : (
          <GasSource
            time={clock}
            shot={d.shot}
            scrubber={f.watch ? d.shot !== 'ambiguous' : scrubber}
            id={id}
          />
        )
      ) : m === 'sealed' ? (
        <Sealed time={f.watch ? d.time : clock} id={id} />
      ) : m === 'assay' ? (
        <Assays shot={d.shot} progress={d.progress} />
      ) : m === 'glycolysis' ? (
        d.shot === 'carbons' ? (
          <CarbonPath route="pyruvate" progress={d.progress} />
        ) : d.shot === 'ledger' ? (
          <Ledger progress={d.progress} />
        ) : (
          <Carriers
            chapter="glycolysis"
            time={f.watch ? d.time : clock - 17}
            recycle={f.watch ? false : recycle}
          />
        )
      ) : m === 'aerobic' ? (
        d.shot === 'oxidation' ? (
          <CarbonPath route="aerobic" progress={d.progress} />
        ) : (
          <Membrane
            time={f.watch ? d.time : Math.max(0, clock - 7)}
            stopped={f.watch ? d.shot === 'off' : stop}
            cut={f.watch ? d.cut : 12}
          />
        )
      ) : !f.watch && route === 'lactate' ? (
        <CarbonPath route="lactate" progress={Math.min(1, clock / 12)} />
      ) : d.shot === 'decarboxylation' ? (
        <CarbonPath route={f.watch ? 'ethanol' : route} progress={0.48 + d.progress * 0.52} />
      ) : d.shot === 'recycle' || d.shot === 'resume' || d.shot === 'noextra' ? (
        <Carriers
          chapter="fermentation"
          time={f.watch ? d.time : clock - 5}
          recycle={f.watch || recycle}
        />
      ) : d.shot === 'lactate' ? (
        <CarbonPath route="lactate" progress={1} />
      ) : (
        <Prediction />
      )}
      {!f.watch && (
        <div className="br10-controls">
          <Segments
            label={t('观察层次')}
            value={m}
            onChange={(v) => setManual(v as RespirationChapter)}
            options={respirationChapters.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('观察时间')}
            value={time}
            min={0}
            max={42}
            step={0.1}
            onChange={setTime}
          />
          {m === 'atp' && (
            <Segments
              label={t('磷酰基供体')}
              value={donor}
              onChange={(v) => setDonor(v as 'ATP' | 'Pi')}
              options={[
                { value: 'ATP', label: 'ATP' },
                { value: 'Pi', label: t('游离无机磷酸') },
              ]}
            />
          )}{' '}
          {m === 'air' && (
            <button onClick={() => setScrubber((v) => !v)} aria-pressed={scrubber}>
              {t(scrubber ? '空气CO₂被吸收' : '吸收步骤缺失')}
            </button>
          )}
          {(m === 'glycolysis' || (m === 'fermentation' && route === 'ethanol')) && (
            <button onClick={() => setRecycle((v) => !v)} aria-pressed={recycle}>
              {t(recycle ? '阻断载体再生' : '恢复载体再生')}
            </button>
          )}
          {m === 'fermentation' && (
            <Segments
              label={t('发酵路径')}
              value={route}
              onChange={(v) => setRoute(v as 'ethanol' | 'lactate')}
              options={[
                { value: 'ethanol', label: t('酒精发酵') },
                { value: 'lactate', label: t('同型乳酸发酵') },
              ]}
            />
          )}{' '}
          {m === 'aerobic' && (
            <button
              onClick={() => {
                setStop((v) => !v);
                if (!stop) setTime(Math.max(time, 21));
              }}
              aria-pressed={stop}
            >
              {t(stop ? '对照：持续供氧' : '改为中途停氧')}
            </button>
          )}
          <p>{t('教学时间与净收支示意，不是实测速率。')}</p>
        </div>
      )}
    </section>
  );
}
