import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  adaptiveImmunity,
  cytotoxicResponse,
  immuneRecall,
  meningealLymphEvidence,
  immuneClamp,
} from '../../models/bio-immune-pathways';
import { signalPathPoint } from '../../models/bio-chemical-signals';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-immune-pathways.css';
export default function BioImmunePathways() {
  const film = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    id = useId(),
    s = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
  const [chosen, setChosen] = useState(film.variant === 'bio-elective-1-mechanism-18' ? 1 : 0),
    [time, setTime] = useState(0.85),
    [markers, setMarkers] = useState(true),
    [tracer, setTracer] = useState(true),
    [match, setMatch] = useState(true),
    [help, setHelp] = useState(true),
    [memory, setMemory] = useState(true);
  const mode = film.watch
      ? film.chapter < 2
        ? 0
        : film.chapter < 5
          ? 1
          : film.chapter === 5
            ? 2
            : 3
      : chosen,
    p = film.watch ? film.chapterProgress : time;
  const immuneP = film.watch
      ? film.chapter === 2
        ? p * 0.35
        : film.chapter === 3
          ? 0.35 + p * 0.3
          : 0.65 + p * 0.35
      : p,
    state = adaptiveImmunity(immuneP, film.watch ? true : match, film.watch ? true : help),
    cyto = cytotoxicResponse(p, film.watch ? true : match, film.watch ? true : help),
    lymph = meningealLymphEvidence(
      p,
      film.watch ? true : markers,
      film.watch ? film.chapter === 1 : tracer,
    );
  const phase = film.watch ? film.chapter - 2 : immuneP < 0.35 ? 0 : immuneP < 0.65 ? 1 : 2;
  const names = [
    s('脑膜中的结构与通路', 'Structures and routes in meninges'),
    s('从识别到抗体', 'From recognition to antibody'),
    s('识别感染细胞', 'Recognizing an infected cell'),
    s('同一抗原的再次相遇', 'Re-encounter with the same antigen'),
  ];
  const r = Math.min(42, w * 0.13),
    cell = (x: number, y: number, role: 'APC' | 'T' | 'B' | 'plasma', opacity = 1) => (
      <g opacity={opacity}>
        <circle
          cx={x}
          cy={y}
          r={r}
          fill={{ APC: '#d8c2a4', T: '#c6d3b6', B: '#c0d1db', plasma: '#b9cbd4' }[role]}
          stroke="#98ab9e"
          strokeWidth="2"
        />
        <ellipse
          cx={x + (role === 'plasma' ? -12 : 2)}
          cy={y + 4}
          rx={r * 0.45}
          ry={r * 0.52}
          fill="#9cae9f"
          opacity=".65"
        />
        {role === 'plasma' &&
          [0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${x} ${y - r * 0.65 + i * 10}q${r * 0.9} 8 0 15`}
              fill="none"
              stroke="#849eaa"
              strokeWidth="2"
            />
          ))}
        <text x={x} y={role === 'T' ? y - r - 10 : y + r + 25} textAnchor="middle">
          {
            {
              APC: 'APC',
              T: s('辅助T细胞', 'Helper T'),
              B: s('B细胞', 'B cell'),
              plasma: s('浆细胞', 'Plasma cell'),
            }[role]
          }
        </text>
      </g>
    );
  const lymphRoute = [
    { x: w * 0.19, y: 190 },
    { x: w * 0.19, y: 156 },
    { x: w - 80, y: 156 },
    { x: w - 27, y: 185 },
    { x: w - 27, y: 310 },
    { x: w - 54, y: 330 },
  ];
  const targetX = w * 0.68,
    targetY = 168,
    targetR = Math.min(52, w * 0.17),
    tcX = targetX - targetR - r - 35 * (1 - cyto.contact);
  return (
    <div ref={host} className="bio-immune" data-watch={film.watch}>
      <div className="bio-immune-head">{names[mode]}</div>
      {mode === 0 && (
        <svg viewBox={`0 0 ${w} 385`} role="img" aria-label={names[0]}>
          <path
            d={`M25 70Q${w / 2} 6 ${w - 25} 70`}
            fill="none"
            stroke="#c5bba4"
            strokeWidth="20"
          />
          <path d={`M25 91H${w - 25}V168H25Z`} fill="#e7ddca" opacity=".7" />
          <text x="28" y="32">
            {s('颅骨', 'Skull')}
          </text>
          <text x="28" y="86">
            {s('硬脑膜', 'Dura')}
          </text>
          <path d={`M35 111H${w - 40}`} stroke="#ba8c85" strokeWidth="18" strokeLinecap="round" />
          {Array.from({ length: 11 }, (_, i) => (
            <circle key={i} cx={43 + (i * (w - 95)) / 10} cy="111" r="3" fill="#eac5ba" />
          ))}
          <path
            d={`M35 156H${w - 80}L${w - 27} 185V310L${w - 54} 330`}
            stroke={lymph.identitySupported ? '#8eaf80' : '#c8c7b3'}
            strokeWidth="10"
            fill="none"
            strokeLinejoin="round"
          />
          <text x={w * 0.55} y="137" textAnchor="middle">
            {s('静脉内血管标记', 'IV vascular label')}
          </text>
          {lymph.identitySupported &&
            Array.from({ length: 9 }, (_, i) => (
              <ellipse
                key={i}
                cx={43 + (i * (w - 130)) / 8}
                cy="156"
                rx="3"
                ry="5"
                fill="#d3e3bd"
              />
            ))}
          <path
            d={`M45 212q28-23 54 1t55-2t55 4t${Math.max(15, w - 284)} 0V285H45Z`}
            fill="#d3d7c5"
            stroke="#b0b9a1"
          />
          <path d={`M65 244q22-22 45 3t47-1t48 3`} stroke="#b7bfaa" fill="none" strokeWidth="3" />
          <text x={w * 0.46} y="273" textAnchor="middle">
            {s('脑实质', 'Brain tissue')}
          </text>
          <text x={w * 0.45} y="198" textAnchor="middle">
            {s('脑脊液', 'CSF')}
          </text>
          <ellipse cx={w - 56} cy="331" rx="24" ry="16" fill="#b5c9a1" stroke="#8fa780" />
          {lymph.tracerProgress > 0 &&
            Array.from({ length: 5 }, (_, i) => {
              const pos = signalPathPoint(
                lymphRoute,
                immuneClamp((lymph.tracerProgress - i * 0.04) / 0.8),
              );
              return <circle key={i} cx={pos.x} cy={pos.y} r="3" fill="#9e809f" />;
            })}
          <text x="25" y="330">
            {s('颈深淋巴结', 'Deep cervical node')}
          </text>
          <text x={w / 2} y="373" textAnchor="middle">
            {(film.watch && film.chapter === 0) || (!film.watch && !tracer)
              ? 'LYVE-1 · PROX1'
              : s('紫色：脑脊液示踪物', 'Purple: CSF tracer')}
          </text>
        </svg>
      )}
      {mode === 1 && phase === 0 && (
        <svg viewBox={`0 0 ${w} 330`} role="img" aria-label={names[1]}>
          {cell(w / 2 - r - 4, 140, 'APC')}
          {cell(w / 2 + r + 4, 140, 'T')}
          <path d={`M${w / 2 - 4} 132l9 8-9 8Z`} fill="#b48c62" opacity={state.presentation} />
          <path
            d={`M${w / 2} 131l-6 9 6 9`}
            fill="none"
            stroke="#688f9a"
            strokeWidth="3"
            opacity={state.help + 0.3}
          />
          <text x={w / 2} y="47" textAnchor="middle">
            {s('抗原片段与呈递分子', 'Peptide presentation')}
          </text>
          <text x={w / 2} y="281" textAnchor="middle">
            {state.help > 0.1
              ? s('匹配识别，辅助信号建立', 'Matched recognition → help')
              : s('先呈递，再识别', 'Presentation precedes recognition')}
          </text>
        </svg>
      )}
      {mode === 1 && phase === 1 && (
        <svg viewBox={`0 0 ${w} 400`} role="img" aria-label={names[1]}>
          {cell(w / 2, 70, 'T')}
          {cell(w / 2, 70 + 2 * r + 8, 'B')}
          <path d={`M${w / 2 - r - 20} ${70 + 2 * r + 8}h14l7-7v14l-7-7`} fill="#b48c62" />
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i} opacity={i < state.cloneCount ? 1 : 0.12}>
              <circle
                cx={(w * ((i % 4) + 1)) / 5}
                cy={282 + Math.floor(i / 4) * 55}
                r="18"
                fill="#c2d2d8"
                stroke="#92aab4"
              />
              <circle
                cx={(w * ((i % 4) + 1)) / 5 + 4}
                cy={282 + Math.floor(i / 4) * 55}
                r="7"
                fill="#9aafb6"
              />
            </g>
          ))}
          <text x={w / 2} y="387" textAnchor="middle">
            {s('同一特异性的克隆扩增', 'Expansion of a matching clone')}
          </text>
        </svg>
      )}
      {mode === 1 && phase === 2 && (
        <svg viewBox={`0 0 ${w} 330`} role="img" aria-label={names[1]}>
          {cell(w * 0.23, 150, state.activation === 1 ? 'plasma' : 'B')}
          <circle cx={w * 0.77} cy="150" r="33" fill="#d9c1a2" stroke="#b49874" strokeWidth="2" />
          {state.antibodies.map((a) => {
            const angle = Math.PI - 0.7 + a.id * 0.28,
              antigen = { x: w * 0.77 + Math.cos(angle) * 34, y: 150 + Math.sin(angle) * 34 },
              end = { x: antigen.x - 8, y: antigen.y + 5 },
              start = { x: w * 0.23 + r + 10, y: 132 + a.id * 7 },
              pos = {
                x: start.x + (end.x - start.x) * a.progress,
                y: start.y + (end.y - start.y) * a.progress,
              };
            return (
              <g key={a.id}>
                <circle cx={antigen.x} cy={antigen.y} r="3" fill="#b48450" />
                {a.progress > 0 && (
                  <path
                    d="M-10 0H0l8-5M0 0l8 5"
                    transform={`translate(${pos.x} ${pos.y})`}
                    fill="none"
                    stroke="#7898aa"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}
          <text x={w * 0.77} y="216" textAnchor="middle">
            {s('病原体', 'Pathogen')}
          </text>
          <text x={w / 2} y="284" textAnchor="middle">
            {s('抗体在细胞外结合抗原', 'Antibodies bind outside cells')}
          </text>
        </svg>
      )}
      {mode === 2 && (
        <svg viewBox={`0 0 ${w} 350`} role="img" aria-label={names[2]}>
          <circle
            cx={targetX}
            cy={targetY}
            r={targetR}
            fill="#d6d1bb"
            stroke="#a9ad95"
            strokeWidth="2"
            opacity={1 - cyto.apoptosis * 0.5}
          />
          <ellipse
            cx={targetX + 5}
            cy={targetY + 4}
            rx="20"
            ry="24"
            fill="#b3b5a1"
            opacity={1 - cyto.apoptosis * 0.4}
          />
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d="M-5-4h10v8h-10Z"
              transform={`translate(${targetX - 16 + i * 15} ${targetY - 18 + (i % 2) * 9})`}
              fill="#a28aa7"
            />
          ))}
          <circle cx={tcX} cy={targetY} r={r} fill="#b6c7a5" stroke="#91a27e" strokeWidth="2" />
          <ellipse cx={tcX - 5} cy={targetY + 5} rx="18" ry="23" fill="#93aa82" />
          <path
            d={`M${targetX - targetR} ${targetY - 7}l-8 7 8 7M${tcX + r} ${targetY - 7}l8 7-8 7`}
            fill="none"
            stroke={cyto.recognition ? '#b18c61' : '#839cac'}
            strokeWidth="3"
          />
          {Array.from({ length: 5 }, (_, i) => (
            <circle
              key={i}
              cx={targetX + Math.cos(i * 1.1) * targetR}
              cy={targetY + Math.sin(i * 1.1) * targetR}
              r={cyto.apoptosis * 8}
              fill="#d7d0b9"
              stroke="#a9ad95"
            />
          ))}
          <text x={tcX} y="71" textAnchor="middle">
            {s('细胞毒性T', 'Cytotoxic T')}
          </text>
          <text x={targetX} y="274" textAnchor="middle">
            {s('感染细胞', 'Infected cell')}
          </text>
          <text x={w / 2} y="326" textAnchor="middle">
            {cyto.apoptosis > 0.05
              ? s('识别后诱导靶细胞凋亡', 'Target apoptosis follows')
              : s('先接触，核对呈递抗原', 'Check presented antigen')}
          </text>
        </svg>
      )}
      {mode === 3 && (
        <svg viewBox={`0 0 ${w} 355`} role="img" aria-label={names[3]}>
          <path d={`M30 254H${w - 25}M30 70V254`} fill="none" stroke="#c8d2c0" />
          {[false, true].map((recall, i) => (
            <path
              key={i}
              d={Array.from({ length: 101 }, (_, n) => {
                const t = n / 100;
                return `${n ? 'L' : 'M'}${30 + (w - 55) * t},${254 - immuneRecall(t, recall && (film.watch ? true : match), film.watch ? true : memory) * 170}`;
              }).join(' ')}
              stroke={i ? '#83a28a' : '#b5a58c'}
              strokeWidth="3"
              fill="none"
            />
          ))}
          <path d={`M${30 + (w - 55) * p} 63V260`} stroke="#9baeb5" strokeDasharray="4 5" />
          <text x="30" y="34">
            {s('相对反应 · 教学曲线', 'Relative response (model)')}
          </text>
          <path d="M30 48h18" stroke="#b5a58c" strokeWidth="3" />
          <text x="55" y="54">
            {s('初次', 'Primary')}
          </text>
          <path d={`M${w - 103} 48h18`} stroke="#83a28a" strokeWidth="3" />
          <text x={w - 77} y="54">
            {s('再次', 'Recall')}
          </text>
          <text x={w / 2} y="290" textAnchor="middle">
            {s('再次接触后的时间', 'Time after exposure')}
          </text>
          <text x={w / 2} y="338" textAnchor="middle">
            {s('异种抗原需新的初次反应', 'New antigen: primary response')}
          </text>
        </svg>
      )}
      {!film.watch && (
        <div className="bio-immune-controls">
          <div className="bio-immune-buttons">
            {names.map((name, i) => (
              <button key={i} aria-pressed={chosen === i} onClick={() => setChosen(i)}>
                {name}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-time`}>
            {s('证据过程', 'Evidence sequence')}
            <input
              id={`${id}-time`}
              type="range"
              min="0"
              max="1"
              step=".01"
              value={time}
              onChange={(e) => setTime(+e.target.value)}
            />
          </label>
          <div className="bio-immune-buttons">
            {mode === 0 ? (
              <>
                <button aria-pressed={markers} onClick={() => setMarkers(!markers)}>
                  {s('淋巴内皮标记', 'Lymphatic identity markers')}
                </button>
                <button aria-pressed={tracer} onClick={() => setTracer(!tracer)}>
                  {s('脑脊液示踪', 'CSF tracer')}
                </button>
              </>
            ) : (
              <>
                <button aria-pressed={match} onClick={() => setMatch(!match)}>
                  {mode === 3
                    ? s('再次为同一抗原', 'Same antigen on return')
                    : s('当前克隆能匹配', 'Selected clone matches')}
                </button>
                {mode === 3 ? (
                  <button aria-pressed={memory} onClick={() => setMemory(!memory)}>
                    {s('已有记忆细胞', 'Memory cells present')}
                  </button>
                ) : (
                  <button aria-pressed={help} onClick={() => setHelp(!help)}>
                    {s('辅助信号保留', 'Helper signal present')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <details>
        <summary>{s('标记身份与证据范围', 'Evidence and model')}</summary>
        <p>
          {s(
            '脑膜视图重建2015年小鼠研究的证据逻辑，不是原始荧光图。LYVE-1/PROX1支持淋巴内皮身份，静脉内血管标记与脑脊液QDot655示踪物身份和注入位置不同；结构沿硬脑膜静脉窦分布，不画成脑实质内的淋巴管。适应性免疫只演示选定的T依赖性路径，呈递、辅助、克隆与抗体的进度是教学状态，不是临床计时。抗原不匹配表示当前选定克隆不响应，不表示整个机体不能启动其他克隆。',
            'The meningeal view reconstructs the logic of the 2015 mouse study, not its microscopy. LYVE-1/PROX1 support lymphatic identity; an intravenous vascular label differs from CSF-injected QDot655. Vessels lie along dural sinuses, outside brain parenchyma. Adaptive immunity shows a selected T-dependent route with declared teaching stages, not clinical timing. An unmatched selected clone does not imply that the whole immune system cannot recruit another clone.',
          )}
        </p>
      </details>
    </div>
  );
}
