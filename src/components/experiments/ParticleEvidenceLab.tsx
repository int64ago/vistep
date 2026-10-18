import { useState } from 'react';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { browserLocale } from '../../i18n';
import {
  pairEvidence,
  captureRecoil,
  captureTransmission,
  invariantPair,
  parityCounts,
  resonanceBins,
} from '../../models/particle-evidence';
import '../../styles/modern-labs.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
export function ParticleArtwork({
  mode = 0,
  phase = 0,
  value = 0.6,
  progress = 0.6,
  signal = true,
}: {
  mode?: number;
  phase?: number;
  value?: number;
  progress?: number;
  signal?: boolean;
}) {
  const pair = pairEvidence(0.5 + value * 3, 1.5),
    parity = parityCounts(value),
    higgs = mode === 0,
    spectrum = resonanceBins(higgs ? 'higgs' : 'jpsi', 0.2 + value * 0.8, signal),
    max = higgs ? 48 : 48;
  return (
    <svg
      className="modern-apparatus"
      viewBox="0 0 340 276"
      role="img"
      aria-label={tr(
        '粒子物理实验的观测、重建和对照',
        'Particle observations, reconstruction and comparisons',
      )}
    >
      {(mode === 0 || mode === 5) && (
        <>
          {mode === 5 && phase === 0 ? (
            <>
              <path d="M18 66H113" stroke="#8ba494" strokeWidth="3" />
              <rect x="108" y="47" width="9" height="40" rx="3" fill="#b7ab8b" />
              <path
                d="M116 66Q177 26 265 24M116 66Q177 106 265 108"
                fill="none"
                stroke="#bc9873"
                strokeWidth="2"
              />
              {[38, 83].map((y, j) => (
                <path
                  key={y}
                  d={`M177 ${y - 12}L196 ${y - 15}L204 ${y + 11}L185 ${y + 15}Z`}
                  fill="#a2b59a"
                />
              ))}
              <path d="M267 10V42M267 93V125" stroke="#7d9780" strokeWidth="7" />
            </>
          ) : (
            <>
              {[60, 46, 31].map((r, j) => (
                <circle
                  key={r}
                  cx="171"
                  cy="72"
                  r={r}
                  fill="none"
                  stroke={['#b5c2a7', '#92aa96', '#d0d7c1'][j]}
                  strokeWidth={j === 0 ? 12 : 4}
                />
              ))}
              <path d="M25 72H163M179 72H317" stroke="#a5b79c" strokeWidth="2" />
              {higgs ? (
                <>
                  <path d="M171 72L211 31M171 72L131 113" stroke="#c6a674" strokeWidth="2" />
                  <path d="M201 22L221 39M121 103L141 122" stroke="#bd926d" strokeWidth="9" />
                </>
              ) : (
                <>
                  <path
                    d="M171 72Q203 50 223 26M171 72Q139 94 119 118"
                    stroke="#b49973"
                    strokeWidth="2"
                  />
                  <circle cx="210" cy="40" r="3" fill="#b3956f" />
                  <circle cx="131" cy="105" r="3" fill="#b3956f" />
                </>
              )}
              <circle cx="171" cy="72" r="4" fill="#b99d75" />
            </>
          )}
          <path d="M29 156V247H314" stroke="#aab8a1" fill="none" />
          {spectrum.map((b, j) => (
            <rect
              key={j}
              x={34 + j * 6}
              y={247 - (b.total / max) * 75}
              width="4.8"
              height={(b.total / max) * 75}
              rx="1.8"
              fill="#9bae8d"
            />
          ))}
          <path
            d={spectrum
              .map((b, j) => `${j ? 'L' : 'M'}${36 + j * 6} ${247 - (b.background / max) * 75}`)
              .join(' ')}
            stroke="#bb9d77"
            strokeWidth="2"
            fill="none"
            strokeDasharray="4 3"
          />
          <text x="30" y="272" fontSize="18" fill="#637c64">
            {higgs ? '110' : '2.9'}
          </text>
          <text x="208" y="272" fontSize="18" fill="#637c64">
            {higgs ? '140' : '3.3'} {mode === 5 && phase === 1 ? 'GeV' : 'GeV/c²'}
          </text>
          <text x="31" y="151" fontSize="18" fill="#728369">
            {tr('模型期望谱 · 非实验数据', 'Toy expectation · Not data')}
          </text>
        </>
      )}
      {mode === 1 && (
        <>
          <rect x="24" y="43" width="49" height="38" rx="10" fill="#8ca28d" />
          <path d="M73 62H153M177 62H291" stroke="#bfad83" strokeWidth="3" />
          <rect x="151" y="27" width="27" height="76" rx="7" fill="#a3ad9b" />
          <rect x="286" y="35" width="28" height="55" rx="8" fill="#899f87" />
          <text x="38" y="118" fontSize="18" fill="#667e67">
            T = {pair.transmission.toFixed(2)}
          </text>
          {phase === 0 ? (
            <>
              <text x="29" y="163" fontSize="18" fill="#677e68">
                {tr('仅基线 / 加入额外吸收', 'Baseline / Additional absorption')}
              </text>
              <rect x="33" y="181" width={270 * pair.baseline} height="21" rx="8" fill="#b7bba2" />
              <rect
                x="33"
                y="219"
                width={270 * pair.transmission}
                height="21"
                rx="8"
                fill="#97ad92"
              />
              <text x="29" y="270" fontSize="18" fill="#677e68">
                {tr('相对透射 · 教学模型', 'Relative transmission · Toy model')}
              </text>
            </>
          ) : (
            <>
              {' '}
              <path d="M31 205H145" fill="none" stroke="#c1ad81" strokeWidth="2" />
              <circle cx="145" cy="205" r="13" fill="#a6b59b" />
              {pair.pairTerm > 0 ? (
                <>
                  <path
                    d="M145 205L282 165M145 205L282 245"
                    stroke="#a78c70"
                    fill="none"
                    strokeWidth="2"
                  />
                  <circle
                    cx={145 + progress * 120}
                    cy={205 - progress * (120 / 137) * 40}
                    r="4"
                    fill="#ab896b"
                  />
                  <circle
                    cx={145 + progress * 120}
                    cy={205 + progress * (120 / 137) * 40}
                    r="4"
                    fill="#879e91"
                  />
                  <text x="291" y="176" fontSize="18" fill="#8b755e">
                    e⁻
                  </text>
                  <text x="291" y="244" fontSize="18" fill="#6c8c7a">
                    e⁺
                  </text>
                </>
              ) : (
                <text x="174" y="210" fontSize="18" fill="#6c8068">
                  E &lt; 2mc²
                </text>
              )}
              <text x="28" y="270" fontSize="18" fill="#677e68">
                {tr('核场中的成对产生 · 后来的解释', 'Pair creation in a nuclear field')}
              </text>
            </>
          )}
        </>
      )}
      {mode === 2 && (
        <>
          <circle cx="105" cy="87" r="39" fill="none" stroke="#bbc9b0" />
          <circle cx="105" cy="87" r="17" fill="#9eb192" />
          <circle cx="144" cy="87" opacity={1 - progress} r="4" fill="#809b91" />
          <path d="M125 87H286" stroke="#8da996" strokeDasharray="5 5" strokeWidth="2" />
          <text x="278" y="75" fontSize="22" fill="#708a74">
            ν
          </text>
          <path d="M83 87H45" stroke="#ad9172" strokeWidth="3" />
          <text x="37" y="130" fontSize="18" fill="#698069">
            ⁷Be + e⁻ → ⁷Li + ν
          </text>
          <rect x="39" y="164" width="263" height="71" rx="15" fill="#e4eade" stroke="#a7b99e" />
          <circle cx="74" cy="198" r="8" fill="#9cb08f" />
          <path
            d={phase === 1 && value * 80 > captureRecoil() ? 'M82 198H148L118 205' : 'M82 198H258'}
            stroke="#baa37b"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M147 175V221M174 175V221"
            stroke="#9bac93"
            strokeWidth="3"
            strokeDasharray="3 3"
          />
          <rect x="266" y="180" width="18" height="36" rx="5" fill="#819d83" />
          <text x="41" y="264" fontSize="18" fill="#677f68">
            {phase === 0
              ? tr('反冲离子 → 计数', 'Recoil ion → Count')
              : `U = ${(value * 80).toFixed(1)} V · T = ${captureTransmission(value * 80).toFixed(2)}`}
          </text>
        </>
      )}
      {mode === 3 && (
        <>
          <rect x="24" y="24" width="292" height="219" rx="18" fill="#dfe6da" stroke="#a9bba2" />
          <path
            d="M34 199L67 178M67 178L92 221M67 178L95 190"
            fill="none"
            stroke="#a8b49c"
            strokeWidth="1.5"
          />
          <path
            d="M67 178Q101 139 150 130"
            fill="none"
            stroke="#8f8f72"
            strokeWidth="3"
            strokeDasharray={`${progress * 100} 100`}
            pathLength="100"
            strokeDashoffset={0}
          />
          {phase === 1 && (
            <>
              <path
                d="M150 130Q172 84 216 64"
                fill="none"
                stroke="#9e987a"
                strokeWidth="2"
                strokeDasharray="2 3"
              />
              <path
                d="M150 130L247 166"
                fill="none"
                stroke="#9bad99"
                strokeWidth="1.5"
                strokeDasharray="6 5"
              />
              {Array.from({ length: 7 }, (_, j) => {
                const a = j * 2.4;
                return (
                  <path
                    key={j}
                    d={`M247 166Q${247 + 22 * Math.cos(a) + 5} ${166 + 22 * Math.sin(a)} ${247 + 48 * Math.cos(a)} ${166 + 48 * Math.sin(a)}`}
                    stroke="#a08d70"
                    fill="none"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                );
              })}
            </>
          )}
          <text x="51" y="164" fontSize="18" fill="#5e785f">
            O
          </text>
          <text x="136" y="117" fontSize="18" fill="#5e785f">
            A
          </text>
          {phase === 1 && (
            <text x="251" y="156" fontSize="18" fill="#5e785f">
              B
            </text>
          )}
          <text x="38" y="270" fontSize="18" fill="#677e68">
            {tr('示例拓扑 · 不复刻原始照片', 'Example topology · Not an original image')}
          </text>
        </>
      )}
      {mode === 4 && (
        <>
          <rect x="62" y="26" width="99" height="216" rx="28" fill="#e1e9dc" stroke="#a4b89d" />
          <rect x="88" y="43" width="47" height="30" rx="9" fill="#839f82" />
          <rect x="88" y="195" width="47" height="30" rx="9" fill="#839f82" />
          {[95, 109, 123, 137, 151, 165].map((y) => (
            <ellipse
              key={y}
              cx="111"
              cy={y}
              rx="37"
              ry="8"
              fill="none"
              stroke="#b9ac86"
              strokeWidth="2"
            />
          ))}
          <rect x="98" y="112" width="27" height="44" rx="8" fill="#a7ba98" />
          <path
            d="M111 145V118M105 125L111 118L117 125"
            fill="none"
            stroke="#607f60"
            strokeWidth="2"
          />
          <path
            d="M111 108V79M111 160V188"
            stroke="#b69371"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          {phase === 0 ? (
            <>
              {' '}
              <text x="191" y="74" fontSize="18" fill="#678267">
                I ↑
              </text>
              <text x="189" y="103" fontSize="18" fill="#678267">
                {tr('同向', 'Along')} {(parity.up * 100).toFixed(0)}%
              </text>
              <text x="189" y="175" fontSize="18" fill="#678267">
                {tr('反向', 'Opposite')} {(parity.down * 100).toFixed(0)}%
              </text>
              <rect x="188" y="114" width={115 * parity.up} height="17" rx="7" fill="#a3b696" />
              <rect x="188" y="186" width={115 * parity.down} height="17" rx="7" fill="#b4a07b" />
            </>
          ) : (
            <>
              <text x="186" y="67" fontSize="18" fill="#678267">
                {tr('原过程', 'Observed')}
              </text>
              <text x="186" y="101" fontSize="24" fill="#678267">
                I ↑ p ↓
              </text>
              <path d="M189 132H297" stroke="#c6cfbc" strokeDasharray="4 4" />
              <text x="186" y="168" fontSize="18" fill="#678267">
                {tr('空间反演', 'Parity image')}
              </text>
              <text x="186" y="202" fontSize="24" fill="#9b8668">
                I ↑ p ↑
              </text>
            </>
          )}
          <text x="39" y="270" fontSize="18" fill="#677e68">
            {tr('低温极化 · 计数不对称', 'Cold polarization · Asymmetric counts')}
          </text>
        </>
      )}
    </svg>
  );
}
const variants = [
  'e3-higgs-discovery',
  'e3-gamma-anomalous-absorption',
  'e3-electron-capture-recoil',
  'e3-antisigma-event',
  'e3-wu-parity',
  'e3-jpsi-discovery',
];
export default function ParticleEvidenceLab() {
  const film = useShowcase(),
    [manualMode, setMode] = useState(Math.max(0, variants.indexOf(film.variant ?? ''))),
    [manual, setManual] = useState(0.6),
    [phaseManual, setPhase] = useState(0),
    [signal, setSignal] = useState(true);
  const mode = film.watch ? Math.floor(film.chapter / 2) : manualMode,
    phase = film.watch ? film.chapter % 2 : phaseManual;
  const value = film.watch
    ? mode === 4
      ? phase === 0
        ? film.chapterProgress * 0.9
        : 0.9
      : mode === 1
        ? 0.15 + 0.7 * film.chapterProgress
        : film.chapterProgress
    : manual;
  const names = [
    ['希格斯', 'Higgs'],
    ['反常吸收', 'Anomalous absorption'],
    ['K俘获', 'Electron capture'],
    ['反超子径迹', 'Antihyperon tracks'],
    ['宇称检验', 'Parity test'],
    ['J/Ψ', 'J/ψ'],
  ];
  return (
    <div className="modern-lab modern-series">
      {!film.watch && (
        <div className="modern-paths">
          {names.map((n, i) => (
            <button key={i} type="button" aria-pressed={mode === i} onClick={() => setMode(i)}>
              {n[browserLocale() === 'en' ? 1 : 0]}
            </button>
          ))}
        </div>
      )}
      <div className="modern-readout">
        {mode === 0
          ? `mγγ = ${invariantPair(62.5, 62.5, Math.PI).toFixed(0)} GeV/c²`
          : mode === 1
            ? `Eγ = ${(0.5 + value * 3).toFixed(2)} MeV · ${tr('阈值', 'threshold')} 1.022 MeV`
            : mode === 2
              ? `${tr('所选基态支反冲', 'Selected ground-branch recoil')} ≈ ${captureRecoil().toFixed(1)} eV`
              : mode === 3
                ? 'Σ̄⁻ → n̄ + π⁻'
                : mode === 4
                  ? `P = ${value.toFixed(2)} · ${tr('计数不对称', 'Count asymmetry')} ${parityCounts(value).asymmetry.toFixed(2)}`
                  : phase === 0
                    ? 'm(e⁺e⁻) ≈ 3.097 GeV/c²'
                    : '√s ≈ 3.097 GeV'}
      </div>
      <ParticleArtwork
        mode={mode}
        phase={phase}
        value={value}
        progress={film.watch ? film.chapterProgress : manual}
        signal={film.watch || signal}
      />
      <p className="modern-key">
        {
          [
            tr(
              '单个候选事件不足以发现粒子，要比较许多事件与背景。',
              'One candidate is insufficient; compare many events with background.',
            ),
            tr(
              '早期异常是线索，成对产生是后来建立的解释。',
              'The early anomaly was a clue; pair creation was a later interpretation.',
            ),
            tr(
              '由反冲检验动量收支，并不是直接捕获中微子。',
              'Recoil tests momentum balance; it is not direct neutrino capture.',
            ),
            tr(
              '产生、衰变与湮灭的关联，比单独一条弯线更有力。',
              'Linked production, decay and annihilation constrain the interpretation.',
            ),
            tr(
              '空间反演会反转动量，但不反转自旋这一轴矢量。',
              'Spatial inversion reverses momentum but not axial-vector spin.',
            ),
            tr(
              '固定靶的电子对与对撞机能量扫描，给出互补证据。',
              'Fixed-target pairs and a collider energy scan provide complementary evidence.',
            ),
          ][mode]
        }
      </p>
      {!film.watch && (
        <div className="modern-explore">
          <Range
            label={
              mode === 4
                ? tr('极化程度', 'Polarization')
                : mode === 1
                  ? tr('光子能量', 'Photon energy')
                  : mode === 0 || mode === 5
                    ? tr('模拟观测积累', 'Model exposure')
                    : tr('观察进度', 'Observation progress')
            }
            value={manual}
            min={0}
            max={1}
            step={0.01}
            onChange={setManual}
          />
          <div className="modern-paths">
            {mode !== 0 && (
              <button type="button" onClick={() => setPhase(1 - phaseManual)}>
                {tr('切换证据视图', 'Switch evidence view')}
              </button>
            )}
            {(mode === 0 || mode === 5) && (
              <button type="button" aria-pressed={signal} onClick={() => setSignal(!signal)}>
                {signal
                  ? tr('信号与背景', 'Signal and background')
                  : tr('仅背景模型', 'Background-only model')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
