import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  dnaResidues,
  dnaSequence,
  pairedSequence,
  backboneSegments,
  residueRings,
  pairHydrogenBonds,
  projectDna,
  canonicalContactGraph,
  compositionState,
  helixConstraint,
  idealDuplex,
  retainedStrandPrediction,
  dnaDirector,
  dnaChapters,
  nucleotideTrace,
  nucleotideTraceNodes,
  type Base,
  type DnaChapter,
} from '../../models/bio-dna-structure';
import diffraction from '../../models/bio-dna-diffraction.json';
import '../../styles/bio-dna-structure.css';
const baseColors: Record<Base, string> = { A: '#aa8551', T: '#668f87', G: '#8c719e', C: '#b27968' };
const names = [
  '衍射与螺旋约束',
  '碱基组成约束',
  '配对几何检验',
  '核苷酸与骨架连接',
  '反向平行检验',
  '真实坐标空间观察',
];
const roleColor = { donor: '#a85c3c', acceptor: '#427d8a', neither: '#827c6c' };
function StageNote({ children }: { children: React.ReactNode }) {
  return <p className="bdx-note">{children}</p>;
}
function Fiber({ twist }: { twist: number }) {
  return (
    <svg viewBox="0 0 90 190" aria-hidden="true">
      {[0, 1].map((strand) => (
        <polyline
          key={strand}
          points={Array.from(
            { length: 81 },
            (_, i) =>
              `${45 + 26 * Math.cos((((i * twist) / 4 + strand * 144) * Math.PI) / 180)},${7 + i * 2.2}`,
          ).join(' ')}
          fill="none"
          stroke={strand ? '#a97f6b' : '#6f9690'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
function Diffraction({ pattern, evidence }: { pattern: number; evidence: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (evidence) return;
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) {
      setUnavailable(true);
      return;
    }
    setUnavailable(false);
    const data = ctx.createImageData(diffraction.size, diffraction.size);
    diffraction.patterns[pattern].intensity.forEach((v, i) => {
      const q = Math.max(0, Math.min(1, (Math.log10(Math.max(v, 1e-6)) + 5) / 4.8));
      data.data.set([18 + 206 * q, 24 + 193 * q, 29 + 165 * q, 255], i * 4);
    });
    ctx.putImageData(data, 0, 0);
  }, [pattern, evidence]);
  const constraint = helixConstraint(diffraction.patterns[pattern].twist);
  return (
    <div className="bdx-diffraction">
      <div className="bdx-reference">
        <span>{t('固定历史尺度')}</span>
        <strong>
          0.34 nm <span>/</span> 3.4 nm
        </strong>
      </div>
      {evidence ? (
        <div className="bdx-evidence-scales">
          <div className="bdx-stack">
            {Array.from({ length: 11 }, (_, i) => (
              <i key={i} style={{ top: i * 12 }} />
            ))}
            <b className="bdx-rise">0.34 nm</b>
            <b className="bdx-repeat">3.4 nm</b>
          </div>
          <span>{t('短间隔与长周期')}</span>
        </div>
      ) : (
        <div className="bdx-scatter-grid">
          <div className="bdx-computed">
            <canvas
              ref={canvas}
              hidden={unavailable}
              width={diffraction.size}
              height={diffraction.size}
              role="img"
              aria-label={t('由有限理想双链散射点计算的衍射强度，不是51号照片')}
            />
            {unavailable && (
              <span role="status">{t('无法绘制衍射图；仍可查看链形状与下方结构模型。')}</span>
            )}
            <span>{t('模型散射')}</span>
          </div>
          <div className="bdx-candidate">
            <Fiber twist={constraint.twist} />
            <strong>{constraint.twist}°</strong>
          </div>
          <div className="bdx-candidate-result">
            <span>{t('候选周期')}</span>
            <strong>{constraint.repeatNm ? `${constraint.repeatNm.toFixed(1)} nm` : '—'}</strong>
            <span className={constraint.agreesWithRepeat ? 'bdx-match' : 'bdx-conflict'}>
              {t(constraint.agreesWithRepeat ? '周期吻合' : '周期不符')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
function Composition({ progress, single }: { progress: number; single: boolean }) {
  const s = compositionState(progress, single);
  return (
    <div className="bdx-composition">
      <svg
        viewBox="0 0 320 218"
        aria-label={t('同一批碱基连续移位，总量不变而四处局部配对改变')}
        role="img"
      >
        {[...s.top].map((b, i) => (
          <g key={`top-${i}`} data-base-id={`top-${i}`}>
            <rect
              x={14 + i * 49}
              y="23"
              width="43"
              height="38"
              rx="10"
              fill={baseColors[b as Base]}
            />
            <text x={35.5 + i * 49} y="51" className="bdx-base-letter">
              {b}
            </text>
          </g>
        ))}
        {!single &&
          s.tokens.map((token) => (
            <g
              key={token.id}
              data-base-id={token.id}
              transform={`translate(${14 + token.slot * 49} ${95 + token.travel})`}
            >
              <rect
                width="43"
                height="38"
                rx="10"
                fill={baseColors[token.base]}
                stroke={
                  s.mismatchSlots.includes(token.destination) && s.progress === 1
                    ? '#ad4e3d'
                    : 'transparent'
                }
                strokeWidth="3"
              />
              <text x="21.5" y="28" className="bdx-base-letter">
                {token.base}
              </text>
              <text x="21.5" y="62" className="bdx-token-id">
                {token.label}
              </text>
            </g>
          ))}
        {!single &&
          s.progress === 1 &&
          s.mismatchSlots.map((i) => (
            <path
              key={i}
              d={`M${30 + i * 49} 76l11 11m0 -11l-11 11`}
              stroke="#ad4e3d"
              strokeWidth="2"
            />
          ))}
        {single && (
          <text x="160" y="115" textAnchor="middle" className="bdx-svg-label">
            {t('只计这一条链')}
          </text>
        )}
      </svg>
      <div className="bdx-counts">
        {(['A', 'T', 'G', 'C'] as Base[]).map((b) => (
          <span key={b}>
            <i style={{ height: s.counts[b] * 7 + 3, background: baseColors[b] }} />
            <b>
              {b} {s.counts[b]}
            </b>
          </span>
        ))}
      </div>
    </div>
  );
}
function Ring({ base, side }: { base: Base; side: number }) {
  return (
    <g transform={side ? 'translate(320 0) scale(-1 1)' : undefined} className="bdx-ring">
      <path
        d="M67 70L92 88V134L67 151L34 134V88Z"
        fill={baseColors[base]}
        fillOpacity=".13"
        stroke={baseColors[base]}
        strokeWidth="2"
      />
      {(base === 'A' || base === 'G') && (
        <path
          d="M34 88L11 85L3 112L14 141L34 134"
          fill={baseColors[base]}
          fillOpacity=".1"
          stroke={baseColors[base]}
          strokeWidth="2"
        />
      )}
      <path
        d="M67 70L100 56M92 111H100M67 151L100 166"
        fill="none"
        stroke={baseColors[base]}
        strokeWidth="2"
      />
    </g>
  );
}
function ContactPair({
  first,
  second,
  reveal = 1,
  unknown = false,
}: {
  first: Base;
  second: Base;
  reveal?: number;
  unknown?: boolean;
}) {
  const g = canonicalContactGraph(first, second);
  return (
    <div
      className="bdx-contact-pair"
      data-contact-count={unknown ? 0 : g.contactCount}
      data-standard={g.standard}
    >
      <div className="bdx-pair-heading">
        <strong style={{ color: baseColors[first] }}>{first}</strong>
        <span>
          {g.rings.join(' + ')} {t('个环')}
        </span>
        <strong style={{ color: baseColors[second] }}>{unknown ? '?' : second}</strong>
      </div>
      <svg
        viewBox="0 0 320 205"
        role="img"
        aria-label={t('固定标准配准中的氮氧与供体氢；虚线表示氢键接触')}
      >
        <Ring base={first} side={0} />
        {!unknown && <Ring base={second} side={1} />}
        {g.contacts.map((c) => (
          <g key={c.id} opacity={reveal}>
            {!unknown && c.compatible && (
              <line
                x1={c.from!.x + (c.from!.x < c.to!.x ? 9 : -9)}
                y1={c.from!.y}
                x2={c.to!.x + (c.from!.x < c.to!.x ? -18 : 18)}
                y2={c.to!.y}
                stroke="#6b8067"
                strokeWidth="2.4"
                strokeDasharray="4 5"
              />
            )}
            {!unknown && c.conflict && (
              <g stroke="#ad604e" fill="none">
                <path d={`M154 ${c.left.y - 6}l12 12m0 -12l-12 12`} strokeWidth="2.5" />
                <ellipse
                  cx="160"
                  cy={c.left.y}
                  rx="73"
                  ry="22"
                  strokeDasharray="3 5"
                  opacity=".5"
                />
              </g>
            )}
          </g>
        ))}
        {g.sites
          .flat()
          .filter((s) => !(unknown && s.side === 1) && s.role !== 'neither')
          .map((s) => (
            <g key={s.id} data-atom-id={s.id} opacity={reveal}>
              {s.hydrogen && (
                <>
                  <line
                    x1={s.x + (s.side ? -11 : 11)}
                    y1={s.y}
                    x2={s.hydrogen.x + (s.side ? 8 : -8)}
                    y2={s.y}
                    stroke={roleColor.donor}
                    strokeWidth="2.3"
                  />
                  <text
                    x={s.hydrogen.x}
                    y={s.y + 7}
                    className="bdx-atom bdx-hydrogen"
                    fill={roleColor.donor}
                    data-atom-id={s.hydrogen.id}
                  >
                    H
                  </text>
                </>
              )}
              <text x={s.x} y={s.y + 7} className="bdx-atom" fill={roleColor[s.role]}>
                {s.atom}
              </text>
            </g>
          ))}
        {unknown && (
          <text x="215" y="120" textAnchor="middle" className="bdx-svg-label">
            ?
          </text>
        )}
      </svg>
      <div className="bdx-contact-legend">
        <span className="bdx-donor">N—H · {t('供体')}</span>
        <span className="bdx-acceptor">N / O · {t('受体')}</span>
      </div>
    </div>
  );
}
function IdealHelix({ assembly, rotation }: { assembly: number; rotation: number }) {
  const pairs = idealDuplex(assembly, rotation),
    focus = pairs[3];
  const primitives = pairs.map((p) => ({
    id: p.id,
    z: (p.first.z + p.second.z) / 2,
    node: (
      <g data-pair-id={p.id} opacity={p.index === 3 ? 1 : Math.max(0.15, assembly)}>
        <line
          x1={p.first.x}
          y1={p.first.y}
          x2={(p.first.x + p.second.x) / 2}
          y2={p.first.y}
          stroke={baseColors[p.base]}
          strokeWidth={p.index === 3 ? 7 : 4}
        />
        <line
          x1={(p.first.x + p.second.x) / 2}
          y1={p.second.y}
          x2={p.second.x}
          y2={p.second.y}
          stroke={baseColors[p.partner]}
          strokeWidth={p.index === 3 ? 7 : 4}
        />
      </g>
    ),
  }));
  return (
    <div className="bdx-ideal">
      <svg
        viewBox="0 0 320 245"
        role="img"
        aria-label={t('同一配对进入完整理想双螺旋，固定0.34纳米间隔和3.4纳米重复')}
      >
        {[0, 1].map((s) => (
          <polyline
            key={s}
            points={pairs.map((p) => `${s ? p.second.x : p.first.x},${p.first.y}`).join(' ')}
            fill="none"
            stroke={s ? '#638b85' : '#a58659'}
            strokeWidth="6"
            strokeLinecap="round"
          />
        ))}
        {primitives
          .sort((a, b) => a.z - b.z)
          .map((p) => (
            <g key={p.id}>{p.node}</g>
          ))}
        <g className="bdx-ideal-focus">
          <circle cx={focus.first.x + 15} cy={focus.first.y} r="14" fill={baseColors.G} />
          <text x={focus.first.x + 15} y={focus.first.y + 8}>
            G
          </text>
          <circle cx={focus.second.x - 15} cy={focus.second.y} r="14" fill={baseColors.C} />
          <text x={focus.second.x - 15} y={focus.second.y + 8}>
            C
          </text>
        </g>
        <path d="M250 26h8V196h-8" fill="none" stroke="#827557" strokeWidth="1.8" />
        <text x="266" y="105" className="bdx-svg-label">
          3.4
        </text>
        <text x="266" y="131" className="bdx-svg-label">
          nm
        </text>
        <path d="M55 111h-7v17h7" fill="none" stroke="#827557" strokeWidth="1.8" />
        <text x="40" y="159" textAnchor="middle" className="bdx-svg-label">
          0.34
        </text>
        <text x="40" y="185" textAnchor="middle" className="bdx-svg-label">
          nm
        </text>
      </svg>
    </div>
  );
}
function Nucleotide({ trace, across }: { trace: number; across: boolean }) {
  const marker = nucleotideTrace(trace);
  return (
    <svg
      className="bdx-nucleotide"
      viewBox="0 0 320 245"
      role="img"
      aria-label={t('沿三撇氧经过磷酸到下一糖的五撇侧，区别跨链氢键')}
    >
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(100 ${60 + i * 123})`}>
          <path
            d="M24 -5L16 22L-16 23L-26 -5L0 -25Z"
            fill="#ddcfaf"
            stroke="#9e8d68"
            strokeWidth="2"
          />
          <text x="0" y="-18" className="bdx-atom">
            O
          </text>
          <path d="M24 -5H55M-26 -5L-45 -14" fill="none" stroke="#97815c" strokeWidth="2" />
          <rect x="55" y="-22" width="42" height="34" rx="8" fill={baseColors[i ? 'C' : 'A']} />
          <text x="76" y="4" className="bdx-base-letter">
            {i ? 'C' : 'A'}
          </text>
          <text x="31" y="-18" className="bdx-svg-label">
            1′
          </text>
          <text x="-42" y="35" className="bdx-svg-label">
            3′
          </text>
          {!i && (
            <>
              <path d="M16 22l21 17" fill="none" stroke="#9e8d68" strokeWidth="2" />
              <text x="52" y="49" className="bdx-svg-label">
                2′–H
              </text>
              <path d="M-45 -14V-42" stroke="#9e8d68" fill="none" />
              <text x="-45" y="-43" className="bdx-atom">
                O
              </text>
              <text x="-75" y="-38" className="bdx-svg-label">
                5′
              </text>
            </>
          )}
        </g>
      ))}
      <polyline
        points={nucleotideTraceNodes.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#9b8765"
        strokeWidth="3"
      />
      <text x="84" y="119" className="bdx-atom">
        O
      </text>
      <circle cx="55" cy="139" r="13" fill="#9c8e68" />
      <text x="55" y="147" className="bdx-base-letter">
        P
      </text>
      <text x="55" y="165" className="bdx-atom">
        O
      </text>
      <text x="23" y="190" className="bdx-svg-label">
        5′
      </text>
      <circle
        cx={marker.x}
        cy={marker.y}
        r="6"
        fill="#ab572f"
        stroke="#f9f3df"
        strokeWidth="2"
        data-trace-from={marker.fromId}
        data-trace-to={marker.toId}
      />
      {across && (
        <g>
          <path d="M198 50H234M198 60H234" stroke="#7d8f72" strokeDasharray="3 4" strokeWidth="2" />
          <rect x="237" y="38" width="43" height="34" rx="8" fill={baseColors.T} />
          <text x="258" y="64" className="bdx-base-letter">
            T
          </text>
          <path d="M281 55H292V200" stroke="#749890" strokeWidth="5" fill="none" />
        </g>
      )}
    </svg>
  );
}
function Ladder({ parallel, rotate, time }: { parallel: boolean; rotate: number; time: number }) {
  const top = dnaSequence.slice(0, 3),
    bottom = pairedSequence(top),
    theta = (rotate * 180) / Math.PI;
  const q = (time % 8) / 8;
  return (
    <svg
      className="bdx-direction"
      viewBox="0 0 320 240"
      role="img"
      aria-label={t('追踪五撇到三撇的化学方向，转动后端点身份仍保留')}
    >
      <g transform={`rotate(${theta} 160 120)`}>
        <path d="M76 28V208M244 28V208" stroke="#b29c78" strokeWidth="5" fill="none" />
        {[...top].map((b, i) => (
          <g key={i} transform={`translate(0 ${61 + i * 58})`}>
            <path
              d="M76 -12l12 9l-5 15H68L64 -3Z M244 -12l12 9l-5 15H236L232 -3Z"
              fill="#ddcfaf"
              stroke="#988462"
            />
            <path d="M87 0H106M214 0H233" fill="none" stroke="#9e8a66" />
            <rect x="106" y="-15" width="41" height="30" rx="7" fill={baseColors[b as Base]} />
            <rect
              x="173"
              y="-15"
              width="41"
              height="30"
              rx="7"
              fill={baseColors[bottom[i] as Base]}
            />
            <text x="126.5" y="9" className="bdx-base-letter">
              {b}
            </text>
            <text x="193.5" y="9" className="bdx-base-letter">
              {bottom[i]}
            </text>
            <path d="M149 -5H171M149 0H171M149 5H171" stroke="#7f8a73" strokeDasharray="3 3" />
          </g>
        ))}
        <text x="76" y="21" className="bdx-end">
          5′
        </text>
        <text x="76" y="234" className="bdx-end">
          3′
        </text>
        <text x="244" y="21" className="bdx-end">
          {parallel ? '5′' : '3′'}
        </text>
        <text x="244" y="234" className="bdx-end">
          {parallel ? '3′' : '5′'}
        </text>
        <path d="M35 50V185l-6 -10m6 10l6 -10" fill="none" stroke="#a77e52" strokeWidth="2" />
        <path
          d={parallel ? 'M285 50V185l-6 -10m6 10l6 -10' : 'M285 185V50l-6 10m6 -10l6 10'}
          fill="none"
          stroke="#648e87"
          strokeWidth="2"
        />
        <circle cx="76" cy={36 + q * 165} r="5" fill="#a77e52" />
        <circle cx="244" cy={parallel ? 36 + q * 165 : 201 - q * 165} r="5" fill="#648e87" />
      </g>
    </svg>
  );
}
const backbone = backboneSegments();
function Molecular({ rotation, focus }: { rotation: number; focus: number }) {
  const primitives: { id: string; z: number; node: React.ReactNode }[] = [];
  for (const s of backbone) {
    const a = projectDna(s.a, rotation),
      b = projectDna(s.b, rotation);
    primitives.push({
      id: s.id,
      z: (a.z + b.z) / 2,
      node: (
        <line
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={s.chain === 'A' ? '#b49d78' : '#7d9b95'}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      ),
    });
  }
  for (const r of dnaResidues) {
    const selected = r.index === focus + 1 || r.index === 24 - focus;
    for (const ring of residueRings(r)) {
      const pts = ring.points.map((v) => projectDna(v, rotation));
      primitives.push({
        id: ring.id,
        z: pts.reduce((a, v) => a + v.z, 0) / pts.length,
        node: (
          <polygon
            points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill={
              ring.kind === 'sugar' ? (r.chain === 'A' ? '#d6c7aa' : '#bfd0c5') : baseColors[r.base]
            }
            stroke={selected ? '#6e6554' : '#f4eee0'}
            strokeWidth={selected ? 1.6 : 0.6}
            opacity={selected ? 1 : 0.7}
          />
        ),
      });
    }
    const a = projectDna(r.atoms["C1'"], rotation),
      b = projectDna(r.atoms[r.base === 'A' || r.base === 'G' ? 'N9' : 'N1'], rotation);
    primitives.push({
      id: `${r.id}-glycosidic`,
      z: (a.z + b.z) / 2,
      node: <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9e967f" strokeWidth="2" />,
    });
    if (r.atoms.P) {
      const p = projectDna(r.atoms.P, rotation);
      primitives.push({
        id: `${r.id}-P`,
        z: p.z,
        node: <circle cx={p.x} cy={p.y} r="3.5" fill="#8c876d" />,
      });
    }
  }
  for (const [i, bond] of pairHydrogenBonds(focus).entries()) {
    const a = projectDna(bond.a, rotation),
      b = projectDna(bond.b, rotation);
    primitives.push({
      id: `hydrogen-${i}`,
      z: (a.z + b.z) / 2,
      node: (
        <line
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke="#6f6857"
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />
      ),
    });
  }
  primitives.sort((a, b) => a.z - b.z);
  return (
    <svg
      className="bdx-molecular"
      viewBox="0 0 350 330"
      role="img"
      aria-label={t('依据1BNA真实坐标绘制两条DNA骨架、糖环、碱基平面与所选氢键')}
    >
      <g>
        {primitives.map((v) => (
          <g key={v.id}>{v.node}</g>
        ))}
      </g>
      {[0, 11, 12, 23].map((i) => {
        const r = dnaResidues[i],
          v = projectDna(r.atoms[i === 0 || i === 12 ? "O5'" : "O3'"], rotation);
        return (
          <text
            key={i}
            x={v.x + (v.x > 175 ? 12 : -12)}
            y={v.y + (v.y > 165 ? 20 : -10)}
            fontSize="23"
            textAnchor={v.x > 175 ? 'start' : 'end'}
            fill="#6d6553"
          >
            {i === 0 || i === 12 ? '5′' : '3′'}
          </text>
        );
      })}
      <path d="M25 302H86M25 297V307M86 297V307" stroke="#8d8772" strokeWidth="2" />
      <text x="56" y="325" fontSize="23" textAnchor="middle" fill="#817964">
        1 nm
      </text>
    </svg>
  );
}
function StrandPrediction({ reveal }: { reveal: number }) {
  const units = retainedStrandPrediction(0, reveal);
  return (
    <div className="bdx-prediction">
      <svg
        viewBox="0 0 320 210"
        role="img"
        aria-label={t('保留实测同一链的六个碱基身份，逐一预测反向互补伙伴')}
      >
        <text x="16" y="25" className="bdx-svg-label">
          5′
        </text>
        <text x="283" y="25" className="bdx-svg-label">
          3′
        </text>
        <text x="16" y="204" className="bdx-svg-label">
          3′
        </text>
        <text x="283" y="204" className="bdx-svg-label">
          5′
        </text>
        {units.map((v, i) => (
          <g key={v.id} data-retained-id={v.id} data-predicted-id={v.partnerId}>
            <rect x={15 + i * 49} y="37" width="42" height="43" rx="10" fill={baseColors[v.base]} />
            <text x={36 + i * 49} y="67" className="bdx-base-letter">
              {v.base}
            </text>
            <rect
              x={15 + i * 49}
              y="134"
              width="42"
              height="43"
              rx="10"
              fill={v.revealed ? baseColors[v.partner] : '#ded7c6'}
            />
            <text x={36 + i * 49} y="164" className="bdx-base-letter">
              {v.revealed ? v.partner : '?'}
            </text>
            {v.revealed &&
              Array.from(
                { length: canonicalContactGraph(v.base, v.partner).contactCount },
                (_, bond) => {
                  const count = canonicalContactGraph(v.base, v.partner).contactCount;
                  const x = 36 + i * 49 + (bond - (count - 1) / 2) * 10;
                  return (
                    <line
                      key={bond}
                      x1={x}
                      x2={x}
                      y1="90"
                      y2="124"
                      stroke="#7a8b71"
                      strokeDasharray="3 5"
                      strokeWidth="2"
                    />
                  );
                },
              )}
          </g>
        ))}
      </svg>
      <span>{t('同一条链，不是复制动画')}</span>
    </div>
  );
}
export default function BioDnaStructure() {
  const f = useShowcase(),
    locale =
      typeof window !== 'undefined' && /^\/en(?:\/|$)/.test(window.location.pathname) ? 'en' : 'zh';
  const [chosen, setChosen] = useState<DnaChapter | null>(null),
    [pattern, setPattern] = useState(1),
    [scrambled, setScrambled] = useState(false),
    [first, setFirst] = useState<Base>('A'),
    [second, setSecond] = useState<Base>('T'),
    [geometryWhole, setGeometryWhole] = useState(false),
    [trace, setTrace] = useState(0.6),
    [parallel, setParallel] = useState(false),
    [rotation, setRotation] = useState(0.5),
    [focus, setFocus] = useState(4),
    [reveal, setReveal] = useState(6);
  const d = dnaDirector(f.chapter, f.chapterTime, locale),
    mode = f.watch ? d.mode : (chosen ?? d.mode);
  const pair = f.watch ? d.pair : ([first, second] as [Base, Base]);
  const shot = f.watch
    ? d.shot
    : mode === 'geometry'
      ? geometryWhole
        ? 'whole-ideal'
        : 'contact-explore'
      : mode;
  const chemistry = f.variant === 'geometry';
  const note =
    mode === 'diffraction'
      ? '理想计算，非照片'
      : mode === 'composition'
        ? f.watch && d.single
          ? '单链不要求A=T'
          : (f.watch ? d.permutation === 1 : scrambled)
            ? '位置改变，数量不变'
            : '同一批碱基'
        : mode === 'geometry'
          ? shot === 'whole-ideal'
            ? '理想双链：骨架在外'
            : shot === 'predict-partner'
              ? '保留A，预测搭档'
              : pair[0] === 'A' && pair[1] === 'C'
                ? '固定配准：两处失配'
                : '氢仍连在供体上'
          : mode === 'nucleotide'
            ? f.watch && d.shot === 'backbone-versus-pair'
              ? '横跨两链的是氢键'
              : '沿3′—O—P—O—5′追踪'
            : mode === 'antiparallel'
              ? (f.watch ? d.parallel : parallel)
                ? '同向候选：不符合标准双链'
                : '化学方向不随视角变'
              : shot === 'retained-strand'
                ? '从同一链预测伙伴'
                : '1981 · 1BNA实测坐标';
  return (
    <div
      className="bdx-root"
      data-watch={f.watch}
      data-mode={mode}
      data-dna-shot={shot}
      data-entry-camera={chemistry ? 'chemical-edge' : 'structure-evidence'}
    >
      <div className={`bdx-stage bdx-stage-${mode}`}>
        {mode === 'diffraction' ? (
          <Diffraction
            pattern={f.watch ? d.pattern : pattern}
            evidence={f.watch && d.shot === 'fixed-evidence'}
          />
        ) : mode === 'composition' ? (
          <Composition
            progress={f.watch ? d.permutation : scrambled ? 1 : 0}
            single={f.watch && d.single}
          />
        ) : mode === 'geometry' ? (
          shot === 'whole-ideal' ? (
            <IdealHelix
              assembly={f.watch ? d.assembly : 1}
              rotation={f.watch ? d.idealRotation : rotation}
            />
          ) : (
            <ContactPair
              first={pair[0]}
              second={pair[1]}
              reveal={f.watch ? (chemistry ? Math.max(0.35, d.contacts) : d.contacts) : 1}
              unknown={f.watch && shot === 'predict-partner' && d.predictionReveal < 0.95}
            />
          )
        ) : mode === 'nucleotide' ? (
          <Nucleotide
            trace={f.watch ? d.trace : trace}
            across={f.watch ? d.shot === 'backbone-versus-pair' : true}
          />
        ) : mode === 'antiparallel' ? (
          <Ladder
            parallel={f.watch ? d.parallel : parallel}
            rotate={f.watch ? d.viewRotation : rotation * 0.05}
            time={f.watch ? f.chapterTime : trace * 8}
          />
        ) : f.watch && shot === 'retained-strand' ? (
          <StrandPrediction reveal={d.predictionReveal} />
        ) : (
          <Molecular
            rotation={f.watch ? d.molecularRotation : rotation}
            focus={f.watch ? 4 : focus}
          />
        )}
      </div>
      <StageNote>{t(note)}</StageNote>
      {!f.watch && (
        <div className="bdx-controls">
          <label>
            {t('选择结构证据')}
            <select value={mode} onChange={(e) => setChosen(e.target.value as DnaChapter)}>
              {dnaChapters.map((m, i) => (
                <option key={m} value={m}>
                  {t(names[i])}
                </option>
              ))}
            </select>
          </label>
          {mode === 'diffraction' && (
            <Segments
              label={t('候选结构')}
              value={String(pattern)}
              onChange={(v) => setPattern(Number(v))}
              options={['平行直链', '每步转36°', '每步转24°'].map((label, i) => ({
                value: String(i),
                label: t(label),
              }))}
            />
          )}
          {mode === 'composition' && (
            <button onClick={() => setScrambled(!scrambled)}>
              {t(scrambled ? '恢复原顺序' : '同ID重新排列')}
            </button>
          )}
          {mode === 'geometry' && (
            <>
              <button onClick={() => setGeometryWhole(!geometryWhole)}>
                {t(geometryWhole ? '检验局部接触' : '查看完整理想双链')}
              </button>
              {!geometryWhole &&
                [0, 1].map((i) => (
                  <Segments
                    key={i}
                    label={t(i ? '第二个碱基' : '第一个碱基')}
                    value={i ? second : first}
                    onChange={(v) => (i ? setSecond(v as Base) : setFirst(v as Base))}
                    options={(['A', 'T', 'G', 'C'] as Base[]).map((v) => ({ value: v, label: v }))}
                  />
                ))}
            </>
          )}
          {mode === 'nucleotide' && (
            <Range
              label={t('沿链内骨架')}
              min={0}
              max={1}
              step={0.01}
              value={trace}
              onChange={setTrace}
            />
          )}
          {mode === 'antiparallel' && (
            <>
              <button onClick={() => setParallel(!parallel)}>
                {t(parallel ? '改为反向平行' : '将两链改为同向')}
              </button>
              <Range
                label={t('转动观察方向')}
                min={0}
                max={6.28}
                step={0.01}
                value={rotation}
                onChange={setRotation}
              />
            </>
          )}
          {mode === 'helix' && (
            <>
              <Range
                label={t('绕分子轴旋转')}
                min={0}
                max={6.28}
                step={0.01}
                value={rotation}
                onChange={setRotation}
              />
              <Range
                label={t('所选碱基对')}
                min={1}
                max={12}
                step={1}
                value={focus + 1}
                onChange={(v) => setFocus(v - 1)}
              />
              <details>
                <summary>{t('预测对应搭档')}</summary>
                <StrandPrediction reveal={reveal} />
                <Range
                  label={t('揭示互补搭档')}
                  min={0}
                  max={6}
                  step={1}
                  value={reveal}
                  onChange={setReveal}
                />
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
}
