import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  dnaResidues,
  dnaSequence,
  pairedSequence,
  basePair,
  dnaCounts,
  verifyDuplex,
  backboneSegments,
  residueRings,
  pairHydrogenBonds,
  projectDna,
  type Base,
} from '../../models/bio-dna-structure';
import diffraction from '../../models/bio-dna-diffraction.json';
import '../../styles/bio-dna-structure.css';
type Mode = 'diffraction' | 'composition' | 'geometry' | 'nucleotide' | 'antiparallel' | 'helix';
const modes: Mode[] = [
  'diffraction',
  'composition',
  'geometry',
  'nucleotide',
  'antiparallel',
  'helix',
];
const names = [
  '衍射与螺旋约束',
  '碱基组成约束',
  '配对几何检验',
  '核苷酸与骨架连接',
  '反向平行检验',
  '真实坐标空间观察',
];
const baseColors: Record<Base, string> = { A: '#b59c6c', T: '#8fa5a1', G: '#a28fa9', C: '#b18e85' };
function Diffraction({ pattern }: { pattern: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) {
      setUnavailable(true);
      return;
    }
    const data = ctx.createImageData(diffraction.size, diffraction.size);
    diffraction.patterns[pattern].intensity.forEach((v, i) => {
      const light = Math.max(0, Math.min(1, (Math.log10(Math.max(v, 1e-6)) + 5) / 4.8));
      const a = i * 4;
      data.data[a] = 18 + light * 206;
      data.data[a + 1] = 24 + light * 193;
      data.data[a + 2] = 29 + light * 165;
      data.data[a + 3] = 255;
    });
    ctx.putImageData(data, 0, 0);
  }, [pattern]);
  const twist = diffraction.patterns[pattern].twist;
  return (
    <div className="bio-dna-diffraction">
      <canvas
        hidden={unavailable}
        ref={canvas}
        width={diffraction.size}
        height={diffraction.size}
        role="img"
        aria-label={t('由有限理想双链散射点计算的衍射强度，不是51号照片')}
      />
      {unavailable && (
        <p className="bio-dna-note" role="status">
          {t('无法绘制衍射图；仍可查看链形状与下方结构模型。')}
        </p>
      )}
      <div className="bio-dna-fiber">
        <svg viewBox="0 0 100 250" aria-hidden="true">
          {[0, 1].map((strand) => (
            <polyline
              key={strand}
              points={Array.from(
                { length: 81 },
                (_, i) =>
                  `${50 + 30 * Math.cos((((i * twist) / 4 + strand * 144) * Math.PI) / 180)},${20 + i * 2.6}`,
              ).join(' ')}
              fill="none"
              stroke={strand ? '#a88d8d' : '#8e9e9a'}
              strokeWidth="4"
            />
          ))}
        </svg>
        <span>{t(pattern === 0 ? '平行直链' : pattern === 1 ? '每步转36°' : '每步转24°')}</span>
      </div>
      <p className="bio-dna-note">{t('理想散射计算；不是51号照片，也不能仅凭X形识别全部结构。')}</p>
    </div>
  );
}
function Composition({ scrambled }: { scrambled: boolean }) {
  const top = 'AATGCC',
    bottom = scrambled ? 'TGTACG' : pairedSequence(top),
    a = dnaCounts(top + bottom),
    check = verifyDuplex(top, bottom, true);
  return (
    <>
      <div className="bio-dna-letterrows">
        {[top, bottom].map((seq, j) => (
          <div key={j}>
            {[...seq].map((b, i) => (
              <span
                key={i}
                className={j && check.pairErrors.includes(i) ? 'mismatch' : ''}
                style={{ background: baseColors[b as Base] }}
              >
                {b}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="bio-dna-counts">
        {(['A', 'T', 'G', 'C'] as Base[]).map((b) => (
          <div key={b}>
            <span>{b}</span>
            <div style={{ height: a[b] * 17, background: baseColors[b] }} />
            <strong>{a[b]}</strong>
          </div>
        ))}
      </div>
      <p className="bio-dna-note">
        {t(
          scrambled
            ? '总量仍有A=T、G=C，但局部错配；数量关系不能独自证明结构。'
            : '互补双链总量有A=T、G=C，不要求单链自己满足。',
        )}
      </p>
    </>
  );
}
function BaseShape({ base, mirror = false }: { base: Base; mirror?: boolean }) {
  const purine = base === 'A' || base === 'G';
  return (
    <g
      transform={mirror ? 'scale(-1 1)' : undefined}
      fill={baseColors[base]}
      stroke="#f6f1e4"
      strokeWidth="2"
    >
      <path d="M-32 -29H2L19 0L2 29H-32L-49 0Z" />
      {purine && <path d="M-32 -29L-65 -18L-65 18L-32 29L-49 0Z" />}
    </g>
  );
}
function PairGeometry({ a, b }: { a: Base; b: Base }) {
  const pair = basePair(a, b);
  return (
    <>
      <svg
        className="bio-dna-pair"
        viewBox="0 0 350 205"
        role="img"
        aria-label={t('比较碱基环数与互补配对的氢键数量')}
      >
        <g transform="translate(126 96)">
          <BaseShape base={a} />
          <text x="-15" y="7" textAnchor="middle" fontSize="24" fill="#fff">
            {a}
          </text>
        </g>
        <g transform="translate(224 96)">
          <BaseShape base={b} mirror />
          <text x="15" y="7" textAnchor="middle" fontSize="24" fill="#fff">
            {b}
          </text>
        </g>
        {Array.from({ length: pair.hydrogenBonds }, (_, i) => (
          <line
            key={i}
            x1="146"
            x2="204"
            y1={83 + i * (pair.hydrogenBonds === 2 ? 26 : 13)}
            y2={83 + i * (pair.hydrogenBonds === 2 ? 26 : 13)}
            stroke="#8b8775"
            strokeDasharray="4 5"
            strokeWidth="2"
          />
        ))}
        <path
          d={`M${pair.rings[0] === 2 ? 61 : 77} 154V164H${pair.rings[1] === 2 ? 289 : 273}V154`}
          fill="none"
          stroke="#a9a087"
          strokeWidth="2"
        />
        <text x="175" y="194" textAnchor="middle" fontSize="24" fill="#716b5c">
          {pair.rings.join(' + ')} {t('个环')}
        </text>
      </svg>
      <p className="bio-dna-note">
        {t(
          pair.valid
            ? pair.hydrogenBonds === 2
              ? 'A—T：两条氢键'
              : 'G—C：三条氢键'
            : '不符合标准互补配对；不能用环数代替供受体匹配。',
        )}
      </p>
    </>
  );
}
function Nucleotide({ p }: { p: number }) {
  const assembly = ease(ramp(p, 0.1, 0.75));
  return (
    <svg
      className="bio-dna-nucleotide"
      viewBox="35 10 260 330"
      role="img"
      aria-label={t('碱基接1′碳，5′端经磷酸连接相邻糖的3′氧')}
    >
      <g transform="translate(126 100)">
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(0 ${i * 155})`} opacity={i ? assembly : 1}>
            <path
              d="M26 0L0 29L-35 18L-36 -20L0 -32Z"
              fill="#d5c7a4"
              stroke="#a79977"
              strokeWidth="2"
            />
            <path d="M26 0H68" stroke="#9e947e" strokeWidth="2" />
            <rect
              x="68"
              y="-17"
              width="55"
              height="34"
              rx="9"
              fill={i ? baseColors.C : baseColors.A}
            />
            <text x="95" y="8" textAnchor="middle" fontSize="23" fill="#fff">
              {i ? 'C' : 'A'}
            </text>
            <path
              d="M-36 -20L-55 -39V-47M-55 -65V-64M-35 18V51"
              stroke="#9e947e"
              strokeWidth="2"
              fill="none"
            />
            <text x="-55" y="-50" textAnchor="middle" fontSize="20" fill="#6c685a">
              O
            </text>
            <circle cx="-55" cy="-77" r="14" fill="#a29b80" />
            <text x="-55" y="-71" textAnchor="middle" fontSize="20" fill="#fff">
              P
            </text>
            <text x="-61" y="-43" textAnchor="end" fontSize="21" fill="#6c685a">
              5′
            </text>
            <text x="35" y="-15" fontSize="21" fill="#6c685a">
              1′
            </text>
            <text x="-42" y="28" textAnchor="end" fontSize="21" fill="#6c685a">
              3′
            </text>
            <text x="-35" y="65" textAnchor="middle" fontSize="21" fill="#6c685a">
              O
            </text>
            <circle cx="0" cy="-32" r="9" fill="#efeadf" />
            <text x="0" y="-26" textAnchor="middle" fontSize="20" fill="#6c685a">
              O
            </text>
          </g>
        ))}
        <path d="M-39 64L-47 70" stroke="#a28f70" strokeWidth="3" opacity={assembly} />
        <path d="M0 29L12 42" stroke="#9e947e" fill="none" />
        <text x="17" y="51" fontSize="20" fill="#6c685a">
          2′–H
        </text>
        <text x="-21" y="220" textAnchor="start" fontSize="21" fill="#6c685a" opacity={assembly}>
          H
        </text>
      </g>
    </svg>
  );
}
function Ladder({ parallel, window }: { parallel: boolean; window: number }) {
  const top = dnaSequence.slice(window, window + 6),
    bottom = pairedSequence(top);
  return (
    <>
      <svg
        className="bio-dna-ladder"
        viewBox="0 0 350 295"
        role="img"
        aria-label={t('同一组碱基保持互补，两条骨架方向相反')}
      >
        <path d="M75 30V267M275 30V267" stroke="#c5b79b" strokeWidth="7" strokeLinecap="round" />
        {[...top].map((b, i) => (
          <g key={i} transform={`translate(0 ${49 + i * 37})`}>
            <circle cx="75" r="7" fill="#b19e7b" />
            <circle cx="275" r="7" fill="#b19e7b" />
            <path d="M82 0H100M250 0H268" stroke="#aa9b7d" strokeWidth="2" />
            <rect x="100" y="-12" width="65" height="24" rx="7" fill={baseColors[b as Base]} />
            <rect
              x="185"
              y="-12"
              width="65"
              height="24"
              rx="7"
              fill={baseColors[bottom[i] as Base]}
            />
            <text x="132" y="8" textAnchor="middle" fontSize="23" fill="#fff">
              {b}
            </text>
            <text x="217" y="8" textAnchor="middle" fontSize="23" fill="#fff">
              {bottom[i]}
            </text>
            <path d="M167 -4H183M167 4H183" stroke="#aca590" strokeDasharray="3 3" />
            {(b === 'G' || b === 'C') && (
              <path d="M167 0H183" stroke="#aca590" strokeDasharray="3 3" />
            )}
          </g>
        ))}
        <g fontSize="23" fill="#726957">
          <text x="35" y="35">
            5′
          </text>
          <text x="35" y="273">
            3′
          </text>
          <text x="292" y="35">
            {parallel ? '5′' : '3′'}
          </text>
          <text x="292" y="273">
            {parallel ? '3′' : '5′'}
          </text>
        </g>
        <path d="M24 72V221l-5 -10m5 10l5 -10" stroke="#a48b82" strokeWidth="2" fill="none" />
        <path
          d={parallel ? 'M325 72V221l-5 -10m5 10l5 -10' : 'M325 221V72l-5 10m5 -10l5 10'}
          stroke="#7c9791"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <p className="bio-dna-note">
        {t(
          parallel
            ? '方向检验未通过：两条链不应同向。'
            : '反向平行；5′与3′描述化学方向，不是左右位置。',
        )}
      </p>
    </>
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
      className="bio-dna-molecular"
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
export default function BioDnaStructure() {
  const f = useShowcase();
  const [mode, setMode] = useState<Mode>(() =>
      modes.includes(f.variant as Mode) ? (f.variant as Mode) : 'diffraction',
    ),
    [progress, setProgress] = useState(0.85),
    [pattern, setPattern] = useState(1),
    [scrambled, setScrambled] = useState(false),
    [a, setA] = useState<Base>('A'),
    [b, setB] = useState<Base>('T'),
    [parallel, setParallel] = useState(false),
    [window, setWindow] = useState(0),
    [rotation, setRotation] = useState(0.5),
    [focus, setFocus] = useState(4);
  const m = f.watch ? modes[Math.min(5, f.chapter)] : mode,
    p = f.watch ? f.chapterProgress : progress;
  const patternIndex = f.watch ? (p < 0.3 ? 0 : p < 0.75 ? 1 : 2) : pattern;
  const pairA = f.watch ? (p < 0.5 ? 'A' : 'G') : a,
    pairB = f.watch ? (p < 0.26 ? 'G' : p < 0.5 ? 'T' : 'C') : b;
  return (
    <div className="bio-dna-structure" data-watch={f.watch} data-mode={m}>
      <p className="bio-dna-kind">
        {t(
          m === 'helix'
            ? '1981年1BNA结构；不是1953年的原始模型。'
            : '模型约束与制作；分子符号有意简化。',
        )}
      </p>
      {m === 'diffraction' ? (
        <Diffraction pattern={patternIndex} />
      ) : m === 'composition' ? (
        <Composition scrambled={f.watch ? p > 0.5 : scrambled} />
      ) : m === 'geometry' ? (
        <PairGeometry a={pairA} b={pairB} />
      ) : m === 'nucleotide' ? (
        <Nucleotide p={p} />
      ) : m === 'antiparallel' ? (
        <Ladder parallel={f.watch ? p < 0.28 : parallel} window={f.watch ? 0 : window} />
      ) : (
        <>
          <Molecular
            rotation={f.watch ? 0.3 + ease(ramp(p, 0.04, 0.92)) * Math.PI * 1.6 : rotation}
            focus={f.watch ? 4 : focus}
          />
          <p className="bio-dna-note">{t('骨架在外，碱基向内；坐标保留真实的沟槽与局部偏离。')}</p>
        </>
      )}
      {!f.watch && (
        <div className="bio-dna-controls">
          <label>
            {t('观察结构')}
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              {modes.map((v, i) => (
                <option key={v} value={v}>
                  {t(names[i])}
                </option>
              ))}
            </select>
          </label>
          {m === 'diffraction' && (
            <Segments
              label={t('理想链形状')}
              value={String(pattern)}
              onChange={(v) => setPattern(Number(v))}
              options={['平行直链', '每步转36°', '每步转24°'].map((name, i) => ({
                value: String(i),
                label: t(name),
              }))}
            />
          )}{' '}
          {m === 'composition' && (
            <button onClick={() => setScrambled(!scrambled)}>
              {t(scrambled ? '恢复逐位互补' : '打乱互补链顺序')}
            </button>
          )}
          {m === 'geometry' && (
            <>
              {[0, 1].map((i) => (
                <Segments
                  key={i}
                  label={t(i ? '第二个碱基' : '第一个碱基')}
                  value={i ? b : a}
                  onChange={(value) => (i ? setB(value as Base) : setA(value as Base))}
                  options={(['A', 'T', 'G', 'C'] as Base[]).map((v) => ({ value: v, label: v }))}
                />
              ))}
            </>
          )}
          {m === 'nucleotide' && (
            <Range
              label={t('连接过程')}
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={setProgress}
            />
          )}{' '}
          {m === 'antiparallel' && (
            <>
              <button onClick={() => setParallel(!parallel)}>
                {t(parallel ? '改为反向平行' : '将两链改为同向')}
              </button>
              <Segments
                label={t('查看区段')}
                value={String(window)}
                onChange={(v) => setWindow(Number(v))}
                options={[
                  { value: '0', label: '1–6' },
                  { value: '6', label: '7–12' },
                ]}
              />
            </>
          )}
          {m === 'helix' && (
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
