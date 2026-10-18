import { useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  nitrogenReaction,
  neutronRecoil,
  fragmentEvent,
  chainExpectation,
} from '../../models/nuclear-evidence';
import '../../styles/modern-labs.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
function Nucleus({
  x,
  y,
  r = 18,
  label,
  labelAbove = false,
}: {
  x: number;
  y: number;
  r?: number;
  label?: string;
  labelAbove?: boolean;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#adba9e" stroke="#7f9679" />
      {Array.from({ length: 9 }, (_, j) => (
        <circle
          key={j}
          cx={x + (Math.cos(j * 2.4) * Math.sqrt(j) * r) / 4}
          cy={y + (Math.sin(j * 2.4) * Math.sqrt(j) * r) / 4}
          r={r / 5}
          fill={j % 2 ? '#bd9c7d' : '#7c9d92'}
        />
      ))}
      {label && (
        <text
          x={x}
          y={labelAbove ? y - r - 10 : y + r + 23}
          textAnchor="middle"
          fontSize="18"
          fill="#5f7866"
        >
          {label}
        </text>
      )}
    </g>
  );
}
export function NuclearArtwork({
  mode = 0,
  phase = 0,
  value = 0.5,
  progress = 0.6,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  progress?: number;
}) {
  const reaction = nitrogenReaction(10 + value * 120),
    recoil = neutronRecoil(phase ? 14 : 1),
    count = phase ? 4 : 3,
    fragments = fragmentEvent(count),
    k = 0.7 + value * 0.6;
  return (
    <svg
      className="modern-apparatus"
      viewBox="0 0 340 276"
      role="img"
      aria-label={tr(
        '核反应实验装置与守恒关系',
        'Nuclear-reaction apparatus and conservation relations',
      )}
    >
      {mode === 0 && (
        <>
          <rect x="22" y="34" width="280" height="112" rx="19" fill="#e6ece3" stroke="#acbaa5" />
          <rect x="39" y="74" width="32" height="28" rx="8" fill="#8a9f85" />
          <path d="M71 88H154" stroke="#b99771" strokeWidth="2" />
          <Nucleus x={154} y={88} r={16} label="¹⁴N" />
          <path d="M171 88L272 68" stroke="#b89776" strokeWidth="2" />
          <rect x="258" y="43" width="5" height="83" fill="#b6c2ad" />
          <rect x="292" y="51" width="7" height="74" fill="#839b7a" />
          <circle cx="295" cy="64" r={3 + 3 * Math.sin(progress * Math.PI) ** 2} fill="#d3ca8c" />
          <path d="M25 213H137" stroke="#b99b74" strokeWidth="2" />
          <path
            d={`M137 213L${137 + reaction.proton.x * 22} ${213 - reaction.proton.y * 22}`}
            stroke="#b48868"
            strokeWidth="3"
          />
          <path
            d={`M137 213L${137 + reaction.oxygen.x * 6} ${213 - reaction.oxygen.y * 6}`}
            stroke="#829d8b"
            strokeWidth="5"
          />
          <Nucleus x={137} y={213} r={9} />
          <text x="28" y="173" fontSize="18" fill="#687e6b">
            {tr('所选事件 · 运动学放大图', 'Selected event · Kinematic view')}
          </text>
          <text x="27" y="274" fontSize="18" fill="#657a68">
            ¹⁴N + ⁴He → ¹⁷O + ¹H
          </text>
        </>
      )}
      {mode === 1 && (
        <>
          <rect x="19" y="67" width="35" height="46" rx="10" fill="#829a83" />
          <path d="M54 90H97" stroke="#bb9b74" strokeWidth="3" />
          <rect x="97" y="47" width="23" height="86" rx="5" fill="#99ad98" />
          <text x="96" y="155" fontSize="18" fill="#647d66">
            Be
          </text>
          <path d="M120 90H186" stroke="#8fa698" strokeWidth="2" strokeDasharray="5 5" />
          <rect x="186" y="52" width="34" height="81" rx="7" fill="#c7c5a8" />
          <text x="173" y="155" fontSize="18" fill="#647d66">
            {phase ? tr('氮靶', 'N target') : tr('石蜡', 'Paraffin')}
          </text>
          <path d={`M219 90L${224 + recoil.fraction * 70} 73`} stroke="#bc9c73" strokeWidth="3" />
          <rect x="264" y="43" width="60" height="91" rx="11" fill="#e5ece0" stroke="#9fb29b" />
          <path d="M273 58H315M273 118H315" stroke="#8ea58b" strokeWidth="3" />
          <circle cx={130 + progress * 51} cy="90" r="4" fill="#89a796" />
          <path d="M39 238H308" stroke="#b7c2af" />
          {[1, 4, 14, 28].map((m, j) => (
            <g key={m}>
              <rect
                x={53 + j * 64}
                y={238 - neutronRecoil(m).fraction * 60}
                width="32"
                height={neutronRecoil(m).fraction * 60}
                rx="4"
                fill="#a4b393"
              />
              <text x={69 + j * 64} y="262" textAnchor="middle" fontSize="18" fill="#6b806b">
                {m}
              </text>
            </g>
          ))}
        </>
      )}
      {mode === 2 && (
        <>
          {phase === 0 ? (
            <>
              <path d="M24 67H79" stroke="#8ca897" strokeDasharray="5 4" strokeWidth="2" />
              <Nucleus x={101} y={67} r={25} label="U" />
              <path d="M133 67H181" stroke="#b8c4ae" strokeWidth="2" />
              {[0, 1, 2].map((j) => (
                <g key={j}>
                  <path
                    d={`M${190 + j * 45} 37V93Q${190 + j * 45} 105 ${201 + j * 45} 105Q${213 + j * 45} 105 ${213 + j * 45} 93V37`}
                    fill="#e5eadc"
                    stroke="#9caf94"
                  />
                  <path
                    d={`M${194 + j * 45} 88H${209 + j * 45}`}
                    stroke={j === 1 ? '#b99d72' : '#a8b899'}
                    strokeWidth="8"
                  />
                </g>
              ))}
              <rect
                x="115"
                y="164"
                width="107"
                height="82"
                rx="15"
                fill="#e6ebd9"
                stroke="#9db18b"
              />
              <text x="132" y="188" fontSize="18" fill="#758567">
                56
              </text>
              <text x="169" y="222" textAnchor="middle" fontSize="32" fill="#65825d">
                Ba
              </text>
              <text x="24" y="139" fontSize="18" fill="#647d66">
                {tr('分离产物 → 鉴定钡', 'Separate products → identify barium')}
              </text>
            </>
          ) : (
            <>
              <Nucleus x={79} y={116} r={30} label="²³⁵U + n" />
              <path d="M113 116H149" stroke="#a7b79b" strokeWidth="2" />
              <Nucleus x={225 - progress * 24} y={75} r={23} label="¹⁴¹Ba" labelAbove />
              <Nucleus x={230 + progress * 25} y={176} r={19} label="⁹²Kr" />
              {[0, 1, 2].map((j) => (
                <circle
                  key={j}
                  cx={175 + progress * 65}
                  cy={115 + (j - 1) * progress * 27}
                  r="4"
                  fill="#7fa08c"
                />
              ))}
              <text x="35" y="263" fontSize="18" fill="#647d66">
                236 = 141 + 92 + 3
              </text>
            </>
          )}
        </>
      )}
      {mode === 3 && (
        <>
          <rect x="28" y="28" width="281" height="204" rx="16" fill="#e4e3d4" stroke="#aab398" />
          <path
            d="M44 64L102 100M230 191L290 174M69 202L100 182"
            stroke="#cacbb9"
            strokeWidth="2"
          />
          {fragments.map((f, j) => {
            const len = f.mass > 10 ? 80 : 65,
              angle = Math.atan2(f.y, f.x);
            return (
              <g key={j}>
                {Array.from({ length: 36 }, (_, i) => {
                  const t = i / 35;
                  return t <= progress ? (
                    <circle
                      key={i}
                      cx={168 + Math.cos(angle) * len * t}
                      cy={129 - Math.sin(angle) * len * t}
                      r={f.mass > 10 ? 2.5 : 1.2}
                      fill={f.mass > 10 ? '#7f8570' : '#a49a79'}
                    />
                  ) : null;
                })}
              </g>
            );
          })}
          <circle cx="168" cy="129" r="9" fill="none" stroke="#b0946e" strokeWidth="1.5" />
          <text x="40" y="260" fontSize="18" fill="#687e6b">
            {tr('共同顶点 · 两条重碎片径迹', 'Common vertex · Two heavy tracks')}
          </text>
        </>
      )}
      {mode === 4 && (
        <>
          {Array.from({ length: 28 }, (_, j) => (
            <rect
              key={j}
              x={28 + (j % 7) * 21}
              y={31 + Math.floor(j / 7) * 21}
              width="19"
              height="19"
              rx="4"
              fill={j % 3 ? '#a8b7a1' : '#7e9883'}
            />
          ))}
          <path d="M182 76H230V51H263" stroke="#a2b49a" strokeWidth="2" fill="none" />
          <rect x="246" y="30" width="78" height="50" rx="12" fill="#e4eadb" />
          <text x="255" y="62" fontSize="18" fill="#66805f">
            k = {k.toFixed(2)}
          </text>
          <path d="M34 157V252H311" fill="none" stroke="#abb9a1" />
          {Array.from({ length: 9 }, (_, j) => (
            <rect
              key={j}
              x={44 + j * 28}
              y={252 - Math.min(90, chainExpectation(k, j) / 3)}
              width="16"
              height={Math.min(90, chainExpectation(k, j) / 3)}
              rx="4"
              fill={j <= progress * 8 ? '#93ab88' : '#dde5d4'}
            />
          ))}
          <text x="170" y="145" textAnchor="middle" fontSize="18" fill="#687f66">
            {tr('各代期望计数', 'Expected counts')}
          </text>
          <text x="311" y="276" textAnchor="end" fontSize="18" fill="#687f66">
            {tr('代数', 'Generation')}
          </text>
        </>
      )}
    </svg>
  );
}
const variants = [
  'e3-rutherford-proton',
  'e3-chadwick-neutron',
  'e3-uranium-fission-discovery',
  'e3-uranium-multifragment-fission',
  'e3-fermi-controlled-chain-reaction',
];
export default function NuclearEvidenceLab() {
  const film = useShowcase(),
    [selected, setSelected] = useState(Math.max(0, variants.indexOf(film.variant ?? ''))),
    [manual, setManual] = useState(0.5),
    [phaseManual, setPhase] = useState(0);
  const mode = film.watch ? Math.floor(film.chapter / 2) : selected,
    phase = film.watch ? film.chapter % 2 : phaseManual;
  const value = film.watch
    ? mode === 4
      ? phase === 0
        ? 0.78
        : 0.5
      : mode === 0
        ? 0.25 + 0.4 * film.chapterProgress
        : film.chapterProgress
    : manual;
  const names = [
    ['质子证据', 'Proton evidence'],
    ['中子证据', 'Neutron evidence'],
    ['裂变发现', 'Fission discovery'],
    ['多碎片径迹', 'Multiple-fragment tracks'],
    ['链式反应', 'Chain reaction'],
  ];
  return (
    <div className="modern-lab modern-series">
      {!film.watch && (
        <div className="modern-paths">
          {names.map((n, j) => (
            <button key={j} type="button" aria-pressed={mode === j} onClick={() => setSelected(j)}>
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {mode === 0
          ? `Eₚ = ${nitrogenReaction(10 + value * 120).protonEnergy.toFixed(2)} MeV`
          : mode === 1
            ? `${tr('最大反冲能量比例', 'Maximum recoil fraction')} ${(neutronRecoil(phase ? 14 : 1).fraction * 100).toFixed(1)}%`
            : mode === 2
              ? tr('核子数与电荷数分别守恒', 'Nucleon number and charge are separately conserved')
              : mode === 3
                ? `${phase ? 4 : 3} ${tr('条带电碎片径迹', 'charged-fragment tracks')}`
                : `N₈/N₀ = ${((0.7 + value * 0.6) ** 8).toFixed(2)}`}
      </div>
      <NuclearArtwork
        mode={mode}
        phase={phase}
        value={value}
        progress={film.watch ? film.chapterProgress : manual}
      />
      <p className="modern-key">
        {
          [
            tr(
              '原实验由闪烁信号推断粒子；下图是后来建立的反应模型。',
              'Scintillations supplied evidence; the lower view is a reaction model.',
            ),
            tr(
              '中子不直接留下电离轨迹，由反冲核提供证据。',
              'Recoil nuclei provide evidence for otherwise untracked neutrons.',
            ),
            tr(
              '化学鉴定与核反应解释是两步证据。',
              'Chemical identification and the reaction interpretation are separate steps.',
            ),
            tr(
              '两条重径迹之外，寻找来自同一顶点的轻碎片。',
              'Look for light fragments sharing the vertex of two heavy tracks.',
            ),
            tr(
              '可控意味着各代平均规模稳定，单次事件仍有涨落。',
              'Control stabilizes the average across generations, not each individual event.',
            ),
          ][mode]
        }
      </p>
      {!film.watch && (
        <div className="modern-explore">
          {mode !== 0 && mode !== 4 && (
            <div className="modern-paths">
              <button type="button" onClick={() => setPhase(1 - phaseManual)}>
                {tr('切换对照状态', 'Switch comparison state')}
              </button>
            </div>
          )}
          {!(mode === 2 && phaseManual === 0) && (
            <Range
              label={
                mode === 4
                  ? tr('平均再生数', 'Mean reproduction factor')
                  : mode === 0
                    ? tr('出射角', 'Emission angle')
                    : tr('展开观察', 'Unfold the observation')
              }
              value={manual}
              min={0}
              max={1}
              step={0.01}
              onChange={setManual}
            />
          )}
        </div>
      )}
    </div>
  );
}
