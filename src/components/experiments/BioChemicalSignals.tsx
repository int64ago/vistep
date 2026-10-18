import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  heartTransfer,
  heartFilmCondition,
  heartTransferMarkers,
  signalPathPoint,
  secretinMarkerPhases,
  heartBeatPhase,
  secretinEvidence,
  type SecretinCondition,
} from '../../models/bio-chemical-signals';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-chemical-signals.css';
export default function BioChemicalSignals() {
  const film = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    id = useId(),
    en = browserLocale() === 'en',
    s = (a: string, b: string) => (en ? b : a);
  const [chosen, setChosen] = useState(film.variant === 'bio-elective-1-045-1' ? 1 : 0),
    [time, setTime] = useState(0.7),
    [stimulate, setStimulate] = useState(true),
    [transfer, setTransfer] = useState(true),
    [fraction, setFraction] = useState(0.4),
    [condition, setCondition] = useState<SecretinCondition>('gut');
  const mode = film.watch ? (film.chapter < 3 ? 0 : 1) : chosen,
    p = film.watch ? film.chapterProgress : time;
  const control = heartFilmCondition(film.chapter, p),
    hp = film.watch ? control.progress : p,
    actualStim = film.watch ? control.stimulated : stimulate,
    actualTransfer = film.watch ? control.transferred : transfer;
  const f = heartTransfer(hp, actualStim, actualTransfer, film.watch ? 0.4 : fraction);
  const cond = film.watch
    ? film.chapter === 3
      ? p < 0.5
        ? 'gut'
        : 'blood-acid'
      : film.chapter === 4
        ? 'denervated'
        : 'extract'
    : condition;
  const e = secretinEvidence(
    cond,
    film.watch ? (film.chapter === 3 ? (p < 0.5 ? p * 2 : (p - 0.5) * 2) : p) : p,
  );
  const h = mode === 0 ? (compact ? 410 : 430) - (film.watch ? 20 : 0) : compact ? 350 : 370,
    cx = [w * 0.27, w * 0.73],
    vesselW = Math.min(130, w * 0.35),
    heartY = 235;
  const beatPhase = heartBeatPhase(hp, actualStim, actualTransfer, film.watch ? 0.4 : fraction);
  const phase = (i: number) => Math.sin((i ? beatPhase.b : beatPhase.a) * Math.PI * 2);
  const labels = [s('蛙心 A', 'Heart A'), s('蛙心 B', 'Heart B')];
  const condNames = [
    s('酸进入小肠', 'Acid in gut'),
    s('酸进入血液', 'Acid in blood'),
    s('去神经的小肠', 'Denervated gut'),
    s('黏膜提取液入血', 'Mucosal extract in blood'),
  ];
  const intakeX = cx[0] + vesselW * 0.32,
    outletX = cx[1] - vesselW * 0.32;
  const markers = heartTransferMarkers(hp, actualStim, actualTransfer, film.watch ? 0.4 : fraction);
  const gutX = w * 0.25,
    bloodX = w * 0.55,
    pancreasX = w * 0.8;
  const inputX = e.injection === 'acid-lumen' ? gutX : bloodX,
    inputY = e.injection === 'acid-lumen' ? 130 : 230;
  const inputStart = { x: inputX, y: inputY - 46 };
  const signalRoute =
    e.injection === 'extract-blood'
      ? [
          inputStart,
          { x: inputX, y: 230 },
          { x: pancreasX + 10, y: 230 },
          { x: pancreasX + 10, y: 172 },
        ]
      : [
          { x: gutX + 25, y: 150 },
          { x: gutX + 42, y: 150 },
          { x: gutX + 42, y: 230 },
          { x: pancreasX + 10, y: 230 },
          { x: pancreasX + 10, y: 172 },
        ];
  const markerPhases = secretinMarkerPhases(cond, e.progress);
  return (
    <div ref={host} className="bio-chemical" data-watch={film.watch}>
      <div className="bio-chemical-head">
        <span>
          {mode === 0
            ? s('蛙心灌流回路重建', 'Reconstructed heart perfusion')
            : s('改变路径，辨认化学信号', 'Change the route; identify chemical signaling')}
        </span>
        <b>{s('历史实验', 'Historical evidence')}</b>
      </div>
      {mode === 0 ? (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={s('蛙心营养液转移比较', 'Frog-heart fluid-transfer comparison')}
        >
          <defs>
            <linearGradient id={`${id}-glass`} x2="1">
              <stop stopColor="#faf9f1" />
              <stop offset=".6" stopColor="#f6f6ec" stopOpacity=".3" />
              <stop offset="1" stopColor="#c8d7cd" stopOpacity=".6" />
            </linearGradient>
          </defs>
          {cx.map((x, i) => {
            const vol = i ? f.volumeB : f.volumeA,
              rate = i ? f.rateB : f.rateA,
              level = 157 - vol * 46,
              beat = 1 - phase(i) * 0.035;
            return (
              <g key={i}>
                <path
                  d={`M${x - vesselW / 2} 60V153q0 8 8 8h${vesselW - 16}q8 0 8-8V60`}
                  fill={`url(#${id}-glass)`}
                />
                <path
                  d={`M${x - vesselW / 2} 60V153q0 8 8 8H${x - 20}M${x - 8} 161h16M${x + 20} 161H${x + vesselW / 2 - 8}q8 0 8-8V60`}
                  fill="none"
                  stroke="#afc0b4"
                  strokeWidth="2"
                />
                <path
                  d={`M${x - vesselW / 2 + 4} ${level}h${vesselW - 8}V149q0 8-8 8H${x - vesselW / 2 + 12}q-8 0-8-8Z`}
                  fill="#c9d8bd"
                  opacity=".55"
                />
                <path
                  d={`M${x - 14} 153V195Q${x - 14} 204 ${x - 14 * beat} ${heartY - 21 * beat}M${x + 14} 153V194Q${x + 14} 205 ${x + 7 * beat} ${heartY - 18 * beat}`}
                  stroke="#a5b5aa"
                  strokeWidth="9"
                  fill="none"
                />
                <path
                  d={`M${x - 14} 153V195Q${x - 14} 204 ${x - 14 * beat} ${heartY - 21 * beat}M${x + 14} 153V194Q${x + 14} 205 ${x + 7 * beat} ${heartY - 18 * beat}`}
                  stroke="#d4dec7"
                  strokeWidth="5"
                  fill="none"
                />
                <path
                  d={`M${x - 14} 180v10m-3-4 3 4 3-4M${x + 14} 188v-10m-3 4 3-4 3 4`}
                  stroke="#8fa580"
                  strokeWidth="1.5"
                  fill="none"
                />
                <g transform={`translate(${x} ${heartY}) scale(${beat})`}>
                  <ellipse cx="-14" cy="-12" rx="15" ry="13" fill="#bc8c85" stroke="#966d66" />
                  <ellipse cx="14" cy="-12" rx="15" ry="13" fill="#c39890" stroke="#966d66" />
                  <path
                    d="M-22 0Q-21 24 0 40Q21 24 22 0Q0-12-22 0Z"
                    fill="#b98580"
                    stroke="#956d66"
                    strokeWidth="2"
                  />
                  <path
                    d="M-14-21v10q0 10 11 13M7-18v15q0 9-7 15"
                    stroke="#dfb6a4"
                    strokeWidth="5"
                    fill="none"
                  />
                </g>
                <text x={x} y="30" textAnchor="middle">
                  {labels[i]}
                </text>
                <text x={x} y="294" textAnchor="middle">
                  {s('相对频率', 'Relative rate')}
                </text>
                <text x={x} y="318" textAnchor="middle">
                  {rate.toFixed(2)}
                </text>
              </g>
            );
          })}
          <path
            d={`M${cx[0] - vesselW * 0.42} 175Q${cx[0] - vesselW * 0.4} 203 ${cx[0] - 22} 226`}
            stroke="#b8b681"
            strokeWidth="5"
            fill="none"
          />
          <path
            d={`M${intakeX} 153V49H${outletX}V153`}
            fill="none"
            stroke="#a7b7ab"
            strokeWidth="7"
            strokeLinejoin="round"
            opacity=".7"
          />
          <path
            d={`M${intakeX} 153V49H${outletX}V153`}
            fill="none"
            stroke="#d9e2cc"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx={w / 2} cy="49" r="12" fill="#edf1e6" stroke="#a7b7ab" />
          <path
            d={`M${w / 2 - 6} 49h12m-4-4 4 4-4 4`}
            fill="none"
            stroke="#9e8b68"
            strokeWidth="2"
          />
          {markers.map((m) => {
            const ax = cx[0] - vesselW * 0.3 + (m.id % 5) * vesselW * 0.12,
              bx = cx[1] - vesselW * 0.3 + (m.id % 5) * vesselW * 0.12,
              y = 151 + Math.floor(m.id / 5) * 1.4;
            const position = signalPathPoint(
              [
                { x: ax, y },
                { x: intakeX, y: 153 },
                { x: intakeX, y: 49 },
                { x: outletX, y: 49 },
                { x: outletX, y: 153 },
                { x: bx, y },
              ],
              m.phase,
            );
            return (
              <circle
                key={m.id}
                data-marker={m.id}
                cx={position.x}
                cy={position.y}
                r="2.5"
                fill="#ab834d"
                opacity={m.opacity}
              />
            );
          })}
          {!film.watch && (
            <text x={w / 2} y="343" textAnchor="middle">
              {s('管内液量', 'Fluid in transit')} {f.volumePath.toFixed(2)}
            </text>
          )}
          <text x={w / 2} y={film.watch ? 343 : 369} textAnchor="middle">
            {!actualStim && !actualTransfer
              ? s('不刺激 · 不转移', 'No stimulation · no transfer')
              : !actualStim
                ? s('不刺激 · 转移液体', 'Transfer · no stimulation')
                : !actualTransfer
                  ? s('刺激 A · 不转移', 'Stimulate A · no transfer')
                  : s('刺激 A，再转移', 'Stimulate A, then transfer')}
          </text>
          <text x={w / 2} y={h - 24} textAnchor="middle">
            {s('B 没有连接 A 的神经', 'No nerve connects A to B')}
          </text>
        </svg>
      ) : (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={s(
            '促胰液素实验的条件与路径',
            'Conditions and routes in the secretin experiment',
          )}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {condNames[(['gut', 'blood-acid', 'denervated', 'extract'] as const).indexOf(cond)]}
          </text>
          <rect x={gutX - 32} y="93" width="64" height="101" rx="24" fill="#c99983" />
          <rect x={gutX - 20} y="88" width="40" height="110" rx="19" fill="#f5e8d6" />
          {e.mucosa && (
            <rect
              x={gutX - 18}
              y="119"
              width="36"
              height="74"
              rx="16"
              fill="#85aab8"
              opacity={Math.min(0.22, Math.max(0, e.progress - 0.12))}
            />
          )}
          <text x={gutX} y="216" textAnchor="middle">
            {s('肠腔', 'Lumen')}
          </text>
          <path
            d={`M${w * 0.12} 230H${w * 0.93}M${gutX + 42} 150V230M${pancreasX + 10} 230V172`}
            fill="none"
            stroke="#bd8b85"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M${w * 0.12} 230H${w * 0.93}M${gutX + 42} 150V230M${pancreasX + 10} 230V172`}
            fill="none"
            stroke="#f1d9cf"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d={`M${pancreasX - 14} 125q31-2 31 22t-25 36q-24-7-20-31t14-27Z`}
            fill="#c8ba8d"
            stroke="#a49368"
            strokeWidth="2"
          />
          <text x={pancreasX} y="113" textAnchor="middle">
            {s('胰腺', 'Pancreas')}
          </text>
          <path
            d={
              e.nerve
                ? `M${gutX + 28} 103L${w * 0.52} 66H${w * 0.64}L${pancreasX} 124`
                : `M${gutX + 28} 103L${w * 0.52} 66H${w * 0.56}M${w * 0.6} 66H${w * 0.64}L${pancreasX} 124`
            }
            stroke="#b5b27b"
            strokeWidth="3"
            fill="none"
          />
          {!e.nerve && (
            <path d={`M${w * 0.58 - 5} 60l10 12m0-12-10 12`} stroke="#b08073" strokeWidth="2" />
          )}
          <circle cx={gutX + 25} cy="150" r="7" fill={e.mucosa ? '#aa895b' : '#d3b59c'} />
          <path
            d={`M${inputX - 7} ${inputY - 80}h14v27l-7 7-7-7Z`}
            fill={e.injection === 'extract-blood' ? '#d9c49e' : '#b5cbd2'}
            stroke="#879b9b"
          />
          <text x={inputX} y={inputY - 87} textAnchor="middle">
            {e.injection === 'extract-blood' ? s('提取物', 'Extract') : 'H⁺'}
          </text>
          {markerPhases.map((m) => {
            const acidPosition = signalPathPoint(
              [
                inputStart,
                { x: inputX, y: inputY },
                ...(e.injection === 'acid-blood' ? [{ x: w * 0.92, y: 230 }] : []),
              ],
              m.input,
            );
            const signalPosition = signalPathPoint(signalRoute, m.signal);
            return (
              <g key={m.id}>
                {e.injection !== 'extract-blood' && (
                  <circle
                    cx={acidPosition.x + (m.id % 2) * 3}
                    cy={acidPosition.y}
                    r="3"
                    fill="#6d98aa"
                    opacity={
                      m.visible
                        ? e.progress > 0.8
                          ? Math.max(0, 1 - (e.progress - 0.8) * 5)
                          : 1
                        : 0
                    }
                  />
                )}
                {m.chemical && (
                  <circle
                    data-secretin={m.id}
                    cx={signalPosition.x}
                    cy={signalPosition.y + (m.id % 2) * 3}
                    r="3"
                    fill="#a67d46"
                    opacity={
                      e.injection === 'extract-blood' ? (m.visible ? 1 : 0) : m.signal > 0 ? 1 : 0
                    }
                  />
                )}
              </g>
            );
          })}
          <path
            d={`M${pancreasX - 14} 177V245Q${pancreasX - 14} 253 ${w * 0.7} 253V266`}
            fill="none"
            stroke="#9b9b6a"
            strokeWidth="3"
          />
          <rect
            x={w * 0.7 - 23}
            y="264"
            width="46"
            height="45"
            rx="6"
            fill="#f8f7ee"
            stroke="#b7b49b"
          />
          <rect
            x={w * 0.7 - 20}
            y={306 - e.secretion * 36}
            width="40"
            height={e.secretion * 36}
            rx="4"
            fill="#d4cc9f"
          />
          <text x={w * 0.2} y="273" textAnchor="middle">
            {s('血液', 'Blood')}
          </text>
          <text x={w / 2} y={h - 15} textAnchor="middle">
            {e.secretion > 0.05
              ? s('胰液分泌增加', 'Pancreatic secretion increases')
              : s('尚无增加', 'No increase yet')}
          </text>
        </svg>
      )}
      {!film.watch && (
        <p className="bio-chemical-note">
          {mode === 0
            ? s(
                '棕色示踪物随液体转移，并在两份营养液中衰减。',
                'Brown signal markers move with the fluid and disappear through clearance.',
              )
            : s(
                '保留血液通路；去掉神经后仍有分泌增加。',
                'The blood route remains; secretion can rise without that nerve connection.',
              )}
        </p>
      )}
      {!film.watch && (
        <div className="bio-chemical-controls">
          <div className="bio-chemical-buttons">
            {[s('蛙心转移', 'Heart transfer'), s('促胰液素', 'Secretin')].map((label, i) => (
              <button key={label} aria-pressed={chosen === i} onClick={() => setChosen(i)}>
                {label}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-t`}>
            {s('证据过程', 'Evidence sequence')}
            <input
              id={`${id}-t`}
              type="range"
              min="0"
              max="1"
              step=".01"
              value={time}
              onChange={(ev) => setTime(+ev.target.value)}
            />
          </label>
          {mode === 0 ? (
            <>
              <div className="bio-chemical-buttons">
                <button aria-pressed={stimulate} onClick={() => setStimulate(!stimulate)}>
                  {s('刺激 A 的神经', 'Stimulate nerve A')}
                </button>
                <button aria-pressed={transfer} onClick={() => setTransfer(!transfer)}>
                  {s('转移营养液', 'Transfer fluid')}
                </button>
              </div>
              <label htmlFor={`${id}-f`}>
                {s('转移 A 初始液体的比例', 'Fraction of initial A fluid transferred')} ·{' '}
                {fraction.toFixed(2)}
                <input
                  id={`${id}-f`}
                  type="range"
                  min="0"
                  max=".8"
                  step=".05"
                  value={fraction}
                  onChange={(ev) => setFraction(+ev.target.value)}
                />
              </label>
            </>
          ) : (
            <div className="bio-chemical-buttons">
              {(['gut', 'blood-acid', 'denervated', 'extract'] as const).map((c, i) => (
                <button key={c} aria-pressed={c === condition} onClick={() => setCondition(c)}>
                  {condNames[i]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <details>
        <summary>{s('证据与推断边界', 'Evidence and its limits')}</summary>
        <p>
          {s(
            '灌流回路与导液管是解释路径的教学重建，并非历史器材的复刻。蛙心模型核对A、B及管内的体积与示踪量，再以饱和抑制关系演示相对心率；数值不是原始实验数据。转移现象支持可溶性化学信号，单凭这一幕不能鉴定它的分子身份。促胰液素画面重建干预与观察关系，分泌量仅为归一化示意；它证明化学调节存在，不排除神经也参与消化调节。',
            'The tubing is a teaching reconstruction of the transfer route. The model accounts for A, B and fluid in transit, then uses a saturating inhibition law for relative rate; these are not original measurements. Transfer supports a soluble signal but does not alone identify its molecule. Secretin interventions use normalized outcomes; chemical control does not exclude additional neural control.',
          )}
        </p>
      </details>
    </div>
  );
}
