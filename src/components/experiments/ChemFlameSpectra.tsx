import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  ATOMIC_LINES,
  filteredFlux,
  wavelengthColour,
  flameScene,
  transitionEvent,
  identifyUnknown,
  unknownLines,
  FLAME_CHAPTER_SECONDS,
  type SpectrumElement,
  type TransitionId,
  type SpectralLine,
} from '../../models/chem-flame-spectra';
import '../../styles/chem-flame-spectra.css';
const say = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
type Line = SpectralLine & { observed?: number; id?: string; matched?: boolean };
export function FlameSpectrumStrip({
  lines,
  label,
  coarse = false,
  scale = true,
}: {
  lines: readonly Line[];
  label: string;
  coarse?: boolean;
  scale?: boolean;
}) {
  return (
    <div className="cfs-strip-wrap">
      <div className="cfs-row-label">{label}</div>
      <div className="cfs-strip" role="img" aria-label={label} data-coarse={coarse}>
        {lines
          .filter((l) => l.nm >= 390 && l.nm <= 780 && (!coarse || (l.nm >= 570 && l.nm <= 600)))
          .map((l, i) => (
            <i
              key={l.id ?? i}
              data-line-nm={l.nm}
              data-line-weight={l.observed ?? l.weight}
              data-match={l.matched}
              style={{
                left: `${((l.nm - 390) / 390) * 100}%`,
                background: wavelengthColour(l.nm),
                opacity: Math.min(1, l.observed ?? l.weight),
              }}
            />
          ))}
        {coarse && (
          <>
            <span className="cfs-range-mask" style={{ left: 0, width: `${(180 / 390) * 100}%` }} />
            <span className="cfs-range-mask" style={{ left: `${(210 / 390) * 100}%`, right: 0 }} />
          </>
        )}
      </div>
      {scale && (
        <div className="cfs-axis">
          <span>390</span>
          <span>{coarse ? '570–600 nm' : 'λ / nm'}</span>
          <span>780</span>
        </div>
      )}
    </div>
  );
}
function FlameBench({
  width,
  compact,
  element,
  filter,
  interference,
  active,
}: {
  width: number;
  compact: boolean;
  element: SpectrumElement;
  filter: boolean;
  interference: number;
  active: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    flux = filteredFlux(element, interference, filter),
    source = filteredFlux(element, interference, false),
    colour = (lines: typeof flux.lines) => {
      const yellow = lines
          .filter((x) => x.nm > 580 && x.nm < 600)
          .reduce((a, x) => a + x.observed, 0),
        violet = lines.filter((x) => x.nm < 450).reduce((a, x) => a + x.observed, 0),
        q = yellow / (yellow + violet + 0.0001);
      return !active
        ? '#8ebbc9'
        : element === 'Na'
          ? '#e5c47d'
          : `rgb(${Math.round(180 + q * 49)},${Math.round(156 + q * 40)},${Math.round(220 - q * 95)})`;
    },
    inputColour = colour(source.lines),
    outputColour = colour(flux.lines),
    h = compact ? 140 : 245,
    fx = width * 0.24,
    fy = h * 0.76,
    gx = width * 0.61,
    ey = fy - 34,
    ex = width - 23,
    brightness = active ? Math.min(1, flux.transmitted / 3.4) : 0.4;
  return (
    <div
      className="cfs-flame"
      data-source-energy={source.input}
      data-transmitted-energy={flux.transmitted}
    >
      <div className="cfs-head">
        {!active
          ? say('洁净金属丝对照', 'Clean-wire control')
          : element === 'Na'
            ? say('钠盐 · 黄色', 'Sodium salt · yellow')
            : say('钾盐 + 钠干扰', 'Potassium + sodium')}
      </div>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          '样品发光，经观察光路到达眼睛；玻璃只改变透过强度',
          'Sample light reaches the eye; glass changes transmission only',
        )}
      >
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor={inputColour} stopOpacity=".35" />
            <stop offset="1" stopColor={inputColour} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx={fx}
          cy={fy - 48}
          rx={compact ? 40 : 58}
          ry={compact ? 68 : 100}
          fill={`url(#${id}-glow)`}
        />
        <path
          d={`M${fx - 15} ${fy}Q${fx - 33} ${fy - 39} ${fx + 2} ${fy - (compact ? 100 : 155)}Q${fx - 6} ${fy - 61} ${fx + 17} ${fy - 39}Q${fx + 32} ${fy - 12} ${fx + 10} ${fy}Z`}
          fill={inputColour}
          opacity=".85"
        />
        <path
          d={`M${fx - 8} ${fy}Q${fx - 15} ${fy - 23} ${fx + 2} ${fy - 46}Q${fx} ${fy - 20} ${fx + 9} ${fy}Z`}
          fill="#9ec6dc"
          opacity=".7"
        />
        <rect x={fx - 12} y={fy} width="24" height="25" rx="5" fill="#7a978c" />
        <ellipse cx={fx} cy={fy + 27} rx="34" ry="5" fill="#617e74" />
        <path
          d={`M${fx + 14} ${fy - 62}Q${fx - 2} ${fy - 70} ${fx - 5} ${fy - 56}Q${fx - 6} ${fy - 46} ${fx + 5} ${fy - 48}Q${fx + 17} ${fy - 51} ${fx + 9} ${fy - 61}M${fx + 14} ${fy - 62}L${gx} ${fy - 103}`}
          stroke="#cfdbc6"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d={`M${gx - 4} ${fy - 100}l25 -16`}
          stroke="#b3946b"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M${fx + 16} ${ey}H${filter ? gx : ex - 17}`}
          stroke={inputColour}
          strokeWidth="3"
          opacity=".7"
        />
        {filter && (
          <>
            <rect
              x={gx - 8}
              y={ey - 28}
              width="20"
              height="56"
              rx="5"
              fill="#7f91cf"
              fillOpacity=".5"
              stroke="#a8b7dc"
            />
            <path
              d={`M${gx + 2} ${ey + 28}V${fy + 22}m-17 0h34`}
              stroke="#7e9996"
              strokeWidth="3"
            />
            <path
              d={`M${gx + 12} ${ey}H${ex - 17}`}
              stroke={outputColour}
              strokeWidth="3"
              opacity={brightness}
            />
          </>
        )}
        <path
          d={`M${ex - 16} ${ey}Q${ex} ${ey - 17} ${ex + 16} ${ey}Q${ex} ${ey + 15} ${ex - 16} ${ey}Z`}
          stroke="#bdcfba"
          fill="none"
        />
        <circle
          data-detector-brightness={brightness}
          cx={ex}
          cy={ey}
          r="5"
          fill={outputColour}
          opacity={brightness}
        />
      </svg>
      <FlameSpectrumStrip
        label={
          filter
            ? say('透过玻璃的光', 'Transmitted light')
            : say('选取谱线 · 空气波长', 'Selected air wavelengths')
        }
        lines={flux.lines.map((x) => ({ ...x, observed: active ? x.observed : 0 }))}
      />
    </div>
  );
}
function Photon({
  x,
  y,
  colour,
  uv = false,
}: {
  x: number;
  y: number;
  colour: string;
  uv?: boolean;
}) {
  return (
    <g className="cfs-photon" transform={`translate(${x} ${y})`} data-invisible-uv={uv}>
      <circle r="12" fill={colour} opacity=".10" />
      <path d="M-12 0q3 -7 6 0t6 0t6 0t6 0" fill="none" stroke={colour} strokeWidth="2.5" />
      {uv && <path d="M-11 10l22 -20" stroke={colour} strokeWidth="1" opacity=".7" />}
    </g>
  );
}
export function FlameStateExchange({
  width,
  compact,
  id,
  progress,
  kind,
  matched = true,
  populated = true,
  prediction = false,
  local = false,
}: {
  width: number;
  compact: boolean;
  id: TransitionId;
  progress: number;
  kind: 'emission' | 'absorption' | 'return';
  matched?: boolean;
  populated?: boolean;
  prediction?: boolean;
  local?: boolean;
}) {
  const e = transitionEvent(id, progress, kind, matched, populated),
    l = e.line,
    h = compact ? (id.startsWith('Li') ? 164 : 174) : 270,
    low = h - 55,
    upper = low - (l.gapEv / 4) * (compact ? 90 : 175),
    axisX = width * 0.1,
    endX = width * 0.47,
    atomX = width * 0.73,
    beamY = compact ? 95 : 143,
    startX = width * 0.56,
    detectorX = width - 14,
    tokenY = e.atomLevel === 'upper' ? upper : low,
    photonX =
      e.photonPhase === 'outgoing'
        ? atomX + e.flight * (detectorX - atomX)
        : matched && populated
          ? startX + (atomX - startX) * e.flight
          : startX + (detectorX - startX) * e.flight,
    photonY = kind === 'return' && e.emitted ? beamY - e.flight * (compact ? 65 : 100) : beamY,
    colour = wavelengthColour(e.photonVacuumNm),
    photonVisible = e.photonEv > 0 && !prediction;
  return (
    <div
      className="cfs-exchange"
      data-sample={e.sampleId}
      data-atom-ev={e.atomEv}
      data-photon-ev={e.photonEv}
      data-total-ev={e.totalEv}
      data-state={e.photonPhase}
    >
      {!id.startsWith('Li') && (
        <div className="cfs-head">
          {prediction
            ? say('能隙更大，λ 怎样变？', 'Larger gap: what happens to λ?')
            : local
              ? say('一条线 ← 一种能量差', 'One line ← one energy gap')
              : `${l.species} · ${l.upper} ↔ ${l.lower}`}
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${h}`}
        role="img"
        aria-label={say(
          '离散能态与光子分别记账，能量总和保持不变',
          'Discrete atomic states and a photon share a conserved energy account',
        )}
      >
        <path
          d={`M${axisX} 25V${low + 5}M${axisX} 25l-4 7m4 -7 4 7`}
          stroke="#8ca99b"
          fill="none"
        />
        <text x={axisX + 7} y="23">
          E
        </text>
        <path
          d={`M${axisX + 12} ${low}H${endX}M${axisX + 12} ${upper}H${endX}`}
          stroke="#bbcab3"
          strokeWidth="2"
        />
        <text x={endX} y={upper - 9} textAnchor="end">
          {l.upper}
        </text>
        <text x={endX} y={low + 23} textAnchor="end">
          {l.lower}
        </text>
        <path
          d={`M${width * 0.32} ${kind === 'emission' ? upper + 12 : low - 12}V${kind === 'emission' ? low - 12 : upper + 12}`}
          stroke={colour}
          strokeWidth="2"
          strokeDasharray="4 4"
          opacity=".55"
        />
        <circle
          data-atomic-level={e.atomLevel}
          cx={width * 0.32}
          cy={tokenY}
          r="6"
          fill="#f0d29b"
        />
        {!populated && (
          <>
            <path d={`M${width * 0.32 - 7} ${low - 7}l14 14m-14 0l14 -14`} stroke="#b5a29a" />
            <circle cx={width * 0.32} cy={low} r="8" fill="#1b3d39" />
            <text x={width * 0.29} y={low - 16} textAnchor="middle">
              ∅
            </text>
          </>
        )}
        <path
          d={`M${width * 0.52} 32V${h - 20}`}
          stroke="#718d81"
          strokeDasharray="2 6"
          opacity=".5"
        />
        <path
          d={`M${startX} ${beamY}H${detectorX - 7}`}
          stroke="#c2cbbc"
          strokeWidth="2"
          opacity=".25"
        />
        <circle
          cx={atomX}
          cy={beamY}
          r="12"
          fill="#e1c48c"
          fillOpacity={e.captured && !e.emitted ? 0.6 : 0.13}
          stroke="#bcab85"
        />
        <text x={atomX} y={beamY - 24} textAnchor="middle">
          {l.species}
        </text>
        <rect
          x={detectorX - 7}
          y={beamY - 19}
          width="11"
          height="38"
          rx="4"
          fill="#799b8c"
          opacity={e.captured ? 0.3 : 0.8}
        />
        {kind === 'return' && e.emitted && (
          <path
            d={`M${atomX} ${beamY}L${detectorX} ${beamY - (compact ? 65 : 100)}`}
            stroke={colour}
            opacity=".3"
          />
        )}
        {photonVisible && <Photon x={photonX} y={photonY} colour={colour} uv={!l.visible} />}
        <text x={width / 2} y={h - 4} textAnchor="middle">
          {prediction ? 'λ = ?' : `λ (vac) ${e.photonVacuumNm.toFixed(1)} nm`}
        </text>
        {!l.visible && !prediction && (
          <text x={width * 0.74} y={h - 30} textAnchor="middle">
            {say('紫外 · 不可见', 'UV · invisible')}
          </text>
        )}
      </svg>
      {local ? (
        <div className="cfs-local-spectrum" data-formed-line={l.airNm}>
          <span>
            {l.airNm.toFixed(1)} nm · {say('空气', 'air')}
          </span>
          <div className="cfs-formed-line">
            <i style={{ background: colour, opacity: e.emitted && e.flight >= 0.95 ? 1 : 0 }} />
          </div>
          <span>{say('发射的参考线', 'Emitted reference line')}</span>
        </div>
      ) : id.startsWith('Li') ? (
        <div className="cfs-local-spectrum" data-line-air-nm={l.airNm} data-absorbed={e.captured}>
          <span>
            {l.airNm.toFixed(1)} nm · {say('空气', 'air')}
          </span>
          <div
            role="img"
            aria-label={
              e.captured
                ? say(
                    '选定波长的光减少，出现暗线',
                    'Reduced light at the selected wavelength forms a dark line',
                  )
                : say(
                    '选定波长未被该跃迁吸收',
                    'This selected transition does not remove the light',
                  )
            }
            style={{
              background: `linear-gradient(90deg, ${wavelengthColour(l.airNm - 12)}, ${wavelengthColour(l.airNm)}, ${wavelengthColour(l.airNm + 12)})`,
            }}
          >
            <i style={{ opacity: e.captured ? 0.82 : 0 }} />
          </div>
          <span>{say('选定谱线示意', 'Selected line')}</span>
        </div>
      ) : (
        <div
          className="cfs-ledger"
          aria-label={say('能量账本，单位电子伏特', 'Energy account in electronvolts')}
        >
          <span>
            {say('原子', 'Atom')} <b>{e.atomEv.toFixed(2)}</b>
          </span>
          <span>
            + γ <b>{e.photonEv.toFixed(2)}</b>
          </span>
          <span>= {e.totalEv.toFixed(2)} eV</span>
        </div>
      )}
    </div>
  );
}
function Pattern({
  width,
  compact,
  candidate,
  coarse,
  mixture,
  bridge,
  progress,
}: {
  width: number;
  compact: boolean;
  candidate: SpectrumElement;
  coarse: boolean;
  mixture: boolean;
  bridge: boolean;
  progress: number;
}) {
  const result = identifyUnknown(candidate, mixture);
  return bridge ? (
    <FlameStateExchange
      width={width}
      compact={compact}
      id="Hg-546"
      progress={progress}
      kind="emission"
      local
    />
  ) : (
    <div className="cfs-pattern">
      <div className="cfs-head">
        {mixture
          ? say('另加钠：仍能由纯元素解释吗？', 'Add Na: still one pure element?')
          : coarse
            ? say('先只看黄光附近', 'First inspect the yellow region')
            : say('固定未知样 · 教学合成', 'Fixed unknown · synthetic')}
      </div>
      <FlameSpectrumStrip
        label={
          mixture
            ? say('新样本：原记录 + Na', 'New sample: record + Na')
            : say('未知样记录', 'Unknown record')
        }
        lines={unknownLines(mixture)}
        coarse={coarse}
        scale={false}
      />
      <div className="cfs-match-gap">
        {coarse
          ? '570–600 nm'
          : `${result.matchedCount} / ${result.total} ${say('位置吻合', 'positions match')}`}
      </div>
      <FlameSpectrumStrip
        label={`${say('参考', 'Reference')} · ${coarse ? '?' : candidate}`}
        lines={coarse ? [] : ATOMIC_LINES[candidate]}
      />
      <div className="cfs-result">
        {coarse
          ? say('有限观察范围', 'Restricted range')
          : result.supports
            ? say('支持这个候选', 'Supports this candidate')
            : mixture
              ? say('没有纯元素解释全部记录', 'No pure candidate explains all lines')
              : say('这组位置不吻合', 'These positions do not match')}
      </div>
    </div>
  );
}
export default function ChemFlameSpectra() {
  const film = useShowcase(),
    { host, width: measured, compact } = useSignalWidth(),
    width = Math.min(720, measured),
    initial = film.variant === 'levels' ? 3 : film.variant === 'spectra' ? 5 : 0,
    [chapter, setChapter] = useState(initial),
    [progress, setProgress] = useState(0.9),
    [sample, setSample] = useState<SpectrumElement>('Na'),
    [filter, setFilter] = useState('off'),
    [interference, setInterference] = useState(0.5),
    [transition, setTransition] = useState<TransitionId>('Na-D2'),
    [resonance, setResonance] = useState('match'),
    [candidate, setCandidate] = useState<SpectrumElement>('Hg'),
    [mixture, setMixture] = useState('pure'),
    [trial, setTrial] = useState('reference');
  const selected = film.watch ? film.chapter : chapter,
    d = flameScene(
      selected,
      film.watch ? film.chapterTime : progress * FLAME_CHAPTER_SECONDS[chapter],
      browserLocale(),
    ),
    tId = film.watch
      ? d.transition
      : chapter === 6
        ? trial === 'reference'
          ? 'Li-670'
          : 'Li-610'
        : transition,
    eventKind = film.watch
      ? d.kind
      : chapter === 4
        ? 'absorption'
        : chapter === 6
          ? trial === 'reference'
            ? 'return'
            : 'absorption'
          : 'emission',
    populated = film.watch ? d.populated : trial !== 'empty',
    isReference = tId === 'Li-670';
  return (
    <section className="cfs" data-watch={film.watch} data-chapter={selected} ref={host}>
      {selected < 3 ? (
        <FlameBench
          width={width}
          compact={compact}
          element={film.watch ? d.element : sample}
          interference={film.watch ? d.interference : interference}
          filter={film.watch ? d.filter : filter === 'on'}
          active={!film.watch || d.active}
        />
      ) : selected < 5 ? (
        <FlameStateExchange
          width={width}
          compact={compact}
          id={tId}
          progress={film.watch ? d.eventProgress : progress}
          kind={eventKind}
          matched={film.watch ? d.matched : resonance === 'match'}
          prediction={film.watch && d.prediction}
        />
      ) : selected === 5 ? (
        <Pattern
          width={width}
          compact={compact}
          candidate={film.watch ? d.candidate : candidate}
          coarse={film.watch && d.coarse}
          mixture={film.watch ? d.mixture : mixture === 'mixed'}
          bridge={film.watch && d.bridge}
          progress={d.eventProgress}
        />
      ) : (
        <div
          className="cfs-lithium"
          data-trial={
            isReference ? 'reference-ground' : populated ? 'separate-prepared' : 'separate-empty'
          }
        >
          <div className="cfs-trial">
            {isReference
              ? say('样本 A · 基态参考', 'Sample A · ground reference')
              : populated
                ? say('样本 C · 已准备 2p', 'Sample C · prepared 2p')
                : say('样本 B · 仅基态', 'Sample B · ground only')}
          </div>
          <FlameStateExchange
            width={width}
            compact={compact}
            id={tId}
            progress={film.watch ? d.eventProgress : progress}
            kind={eventKind}
            populated={populated}
          />
        </div>
      )}
      {!film.watch && (
        <div className="cfs-controls">
          <Segments
            label={say('观察问题', 'Explore')}
            value={String(chapter)}
            onChange={(v) => setChapter(Number(v))}
            options={[
              { value: '0', label: say('焰色', 'Flame') },
              { value: '3', label: say('能隙', 'Gaps') },
              { value: '4', label: say('吸收', 'Absorption') },
              { value: '5', label: say('辨认', 'Identity') },
              { value: '6', label: say('初态', 'Initial state') },
            ]}
          />
          {chapter < 3 ? (
            <>
              <Segments
                label={say('盐样品', 'Salt sample')}
                value={sample}
                onChange={(v) => setSample(v as SpectrumElement)}
                options={[
                  { value: 'Na', label: say('钠', 'Sodium') },
                  { value: 'K', label: say('钾', 'Potassium') },
                ]}
              />
              <Segments
                label={say('钴玻璃', 'Cobalt glass')}
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'off', label: say('移开', 'Removed') },
                  { value: 'on', label: say('放入', 'Inserted') },
                ]}
              />
              {sample === 'K' && (
                <Range
                  label={say('黄光干扰相对量', 'Relative sodium interference')}
                  min={0}
                  max={1}
                  step={0.05}
                  value={interference}
                  onChange={setInterference}
                />
              )}
            </>
          ) : chapter === 5 ? (
            <>
              <Segments
                label={say('参考候选', 'Reference candidate')}
                value={candidate}
                onChange={(v) => setCandidate(v as SpectrumElement)}
                options={['Li', 'He', 'Hg'].map((value) => ({ value, label: value }))}
              />
              <Segments
                label={say('固定记录样本', 'Fixed recorded sample')}
                value={mixture}
                onChange={setMixture}
                options={[
                  { value: 'pure', label: say('原样本', 'Original') },
                  { value: 'mixed', label: say('另加钠', 'Add sodium') },
                ]}
              />
            </>
          ) : (
            <>
              {chapter === 6 ? (
                <Segments
                  label={say('独立准备的试次', 'Separately prepared trials')}
                  value={trial}
                  onChange={setTrial}
                  options={[
                    { value: 'reference', label: say('A 基态', 'A ground') },
                    { value: 'empty', label: say('B 空 2p', 'B empty 2p') },
                    { value: 'populated', label: say('C 有 2p', 'C occupied 2p') },
                  ]}
                />
              ) : (
                <Segments
                  label={say('允许跃迁', 'Allowed transition')}
                  value={transition}
                  onChange={(v) => setTransition(v as TransitionId)}
                  options={[
                    { value: 'Na-D2', label: 'Na · 589 nm' },
                    { value: 'Na-UV', label: 'Na · 330 nm' },
                  ]}
                />
              )}
              {chapter === 4 && (
                <Segments
                  label={say('光子与能隙', 'Photon and gap')}
                  value={resonance}
                  onChange={setResonance}
                  options={[
                    { value: 'match', label: say('匹配', 'Matching') },
                    { value: 'miss', label: say('多 25% 能量', '25% more energy') },
                  ]}
                />
              )}
              <Range
                label={say('追踪一次事件', 'Trace one event')}
                min={0}
                max={1}
                step={0.01}
                value={progress}
                onChange={setProgress}
              />
            </>
          )}
        </div>
      )}
      <details className="cfs-limits">
        <summary>{say('模型边界', 'Model limits')}</summary>
        <p>
          {say(
            '选取的中性原子谱线使用 NIST 空气波长；能量账本由能态差计算，使用真空关系。能态标记只占据离散状态，虚线箭头不是电子轨道。亮度、线宽、火焰颜色和滤光曲线为教学近似。未知样是固定的教学合成记录，匹配限于显示的参考库。锂的 A、B、C 是分开准备的样本；610 nm 仅比较选定跃迁的弱探测初态，未模拟同一样本完整的吸收、受激发射和自发发射光谱。',
            'Selected neutral-atom lines use NIST air wavelengths; energy accounts use level differences and the vacuum relation. State markers occupy discrete states; dashed arrows are not electron orbits. Intensities, widths, flame colours and the filter are illustrative. The fixed unknown is synthetic and matches only this reference library. Lithium A, B and C are separately prepared samples. The 610 nm comparison is an initial-state weak probe of one selected pair, not a complete shared-sample spectrum including stimulated and spontaneous emission.',
          )}
        </p>
      </details>
    </section>
  );
}
