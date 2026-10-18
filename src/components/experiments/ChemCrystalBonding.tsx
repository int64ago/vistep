import { useId, useMemo, useState, type ReactNode } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  diamond,
  quartz,
  water,
  iodine,
  cleave,
  rotate,
  add,
  mul,
  sub,
  length,
  atomicRadius,
  atomColor,
  components,
  type Structure,
  type V,
} from '../../models/chem-crystal-bonding';
import '../../styles/chem-crystal-bonding.css';
const modes = ['iodine', 'ice', 'diamond', 'quartz', 'cleavage'] as const;
type Mode = (typeof modes)[number];
const names = [
  '碘分子完整离开',
  '冰中的两类连接',
  '金刚石的连续网络',
  '石英不是独立分子',
  '硬不等于不易破碎',
];
function AtomicView({
  s,
  mode,
  progress,
  yaw,
  zoom = 1,
}: {
  s: Structure;
  mode: Mode;
  progress: number;
  yaw: number;
  zoom?: number;
}) {
  const uid = useId().replace(/:/g, ''),
    scale =
      (mode === 'iodine'
        ? 16
        : mode === 'quartz'
          ? 15
          : mode === 'cleavage'
            ? 19
            : mode === 'ice'
              ? 32
              : 25) * zoom;
  const project = (p: V) => {
    const r = rotate(p, yaw, mode === 'iodine' ? 0 : 0.38);
    return { x: 160 + r.x * scale, y: 128 - r.y * scale, z: r.z };
  };
  const atoms = new Map([...s.atoms, ...(s.outside ?? [])].map((a) => [a.id, a]));
  const nodes: { z: number; key: string; el: ReactNode }[] = [];
  const reveal = mode === 'diamond' || mode === 'quartz' ? ease(ramp(progress, 0.18, 0.64)) : 1;
  const alpha = (id: string) => {
    const a = atoms.get(id)!;
    return a.level > 1 ? 0.12 + 0.88 * reveal : 1;
  };
  const selected = new Set(
    mode === 'ice' ? [s.focus] : mode === 'iodine' ? ['2:0:0', '2:0:1'] : [s.focus],
  );
  for (const [i, b] of s.bonds.entries()) {
    const a = atoms.get(b.a)!,
      c = atoms.get(b.b)!;
    if (!a || !c) continue;
    const d = length(sub(c.p, a.p)),
      u = mul(sub(c.p, a.p), 1 / d);
    const start = add(a.p, mul(u, atomicRadius[a.element])),
      end = add(c.p, mul(u, -atomicRadius[c.element]));
    const A = project(start),
      B = project(end),
      opacity = Math.min(alpha(a.id), alpha(c.id)) * (b.opacity ?? 1);
    if (b.kind !== 'covalent')
      nodes.push({
        z: (A.z + B.z) / 2,
        key: `weak${i}`,
        el: (
          <path
            d={`M${A.x} ${A.y} L${B.x} ${B.y}`}
            fill="none"
            stroke={b.kind === 'hydrogen' ? '#a4814b' : '#9380a0'}
            strokeDasharray="3 4"
            strokeWidth="1.7"
            opacity={opacity}
          />
        ),
      });
    else
      for (let j = 0; j < 8; j++) {
        const aa = project(add(start, mul(sub(end, start), j / 8))),
          bb = project(add(start, mul(sub(end, start), (j + 1) / 8)));
        nodes.push({
          z: (aa.z + bb.z) / 2,
          key: `bond${i}:${j}`,
          el: (
            <path
              d={`M${aa.x} ${aa.y} L${bb.x} ${bb.y}`}
              fill="none"
              stroke={mode === 'cleavage' && (b.opacity ?? 1) < 1 ? '#bd8761' : '#8eaaa6'}
              strokeWidth={mode === 'iodine' ? 4 : 3.4}
              strokeLinecap="round"
              opacity={opacity}
            />
          ),
        });
      }
  }
  // Continuation stubs are cut at the finite observation boundary, never complete atoms.
  for (const [i, b] of (s.boundary ?? []).entries()) {
    const inside = s.atoms.some((a) => a.id === b.a) ? atoms.get(b.a)! : atoms.get(b.b)!;
    const outside = inside.id === b.a ? atoms.get(b.b) : atoms.get(b.a);
    if (!outside) continue;
    const u = mul(sub(outside.p, inside.p), 1 / length(sub(outside.p, inside.p))),
      A = project(add(inside.p, mul(u, atomicRadius[inside.element]))),
      B = project(add(inside.p, mul(u, 0.62)));
    nodes.push({
      z: (A.z + B.z) / 2,
      key: `boundary${i}`,
      el: (
        <path
          d={`M${A.x} ${A.y} L${B.x} ${B.y}`}
          fill="none"
          stroke="#9caf9f"
          strokeWidth="1.5"
          strokeDasharray="2 3"
          opacity={0.45 * reveal}
        />
      ),
    });
  }
  for (const a of s.atoms) {
    const P = project(a.p),
      r = atomicRadius[a.element] * scale,
      chosen = selected.has(a.id);
    nodes.push({
      z: P.z,
      key: a.id,
      el: (
        <g opacity={alpha(a.id)}>
          {chosen && (
            <circle cx={P.x} cy={P.y} r={r + 3.5} fill="none" stroke="#bd914a" strokeWidth="1.4" />
          )}
          <circle
            cx={P.x}
            cy={P.y}
            r={r}
            fill={`url(#${uid}-${a.element})`}
            stroke="#4b5f5c"
            strokeOpacity=".24"
            strokeWidth=".7"
          />
        </g>
      ),
    });
  }
  nodes.sort((a, b) => a.z - b.z);
  return (
    <svg viewBox="0 0 320 260" role="img" aria-label={t(names[modes.indexOf(mode)])}>
      <defs>
        {Object.entries(atomColor).map(([e, c]) => (
          <radialGradient key={e} id={`${uid}-${e}`} cx="32%" cy="26%" r="75%">
            <stop stopColor="#fffdf3" stopOpacity=".9" />
            <stop offset=".35" stopColor={c} />
            <stop offset="1" stopColor={c} stopOpacity=".94" />
          </radialGradient>
        ))}
      </defs>
      {nodes.map((n) => (
        <g key={n.key}>{n.el}</g>
      ))}
    </svg>
  );
}
export default function ChemCrystalBonding() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>('iodine'),
    [progress, setProgress] = useState(0.7),
    [angle, setAngle] = useState(15),
    [zoom, setZoom] = useState(1);
  const m = f.watch ? modes[Math.min(4, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.08, 0.9)) : progress;
  const yaw = f.watch
    ? m === 'iodine'
      ? 0
      : m === 'cleavage'
        ? Math.PI / 4
        : 0.25 + 0.55 * p
    : (angle * Math.PI) / 180;
  const state = useMemo(
    () =>
      m === 'iodine'
        ? iodine(p)
        : m === 'ice'
          ? water
          : m === 'quartz'
            ? quartz
            : m === 'cleavage'
              ? cleave(p).structure
              : diamond,
    [m, p],
  );
  const connected = components(
    state,
    m === 'cleavage' && p >= 0.4 ? cleave(p).cutBonds : [],
  ).length;
  return (
    <div className={`ccb ${f.watch ? 'is-watch' : ''}`}>
      <div className={`ccb-stage ccb-mode-${m}`}>
        <div className="ccb-heading">
          <strong>
            {m === 'iodine' ? 'I₂' : m === 'ice' ? 'H₂O' : m === 'quartz' ? 'SiO₂' : 'C'}
          </strong>
          <span>
            {t(
              m === 'iodine'
                ? '分子间排列为教学示意'
                : m === 'ice'
                  ? '氢键与分子内共价键'
                  : m === 'quartz'
                    ? 'α-石英 · 298 K 坐标'
                    : m === 'cleavage'
                      ? '沿 (111) 方向分开'
                      : '金刚石 · C—C = 154 pm',
            )}
          </span>
        </div>
        <AtomicView s={state} mode={m} progress={p} yaw={yaw} zoom={f.watch ? 1 : zoom} />
        <div className="ccb-evidence">
          {m === 'iodine' ? (
            <>
              <span>
                {t('共价连接的独立单元')} <b>{connected}</b>
              </span>
              <span>
                {t('每个单元')} <b>I—I</b>
              </span>
            </>
          ) : m === 'ice' ? (
            <>
              <span>
                {t('每个水分子')} <b>2 O—H</b>
              </span>
              <span>
                {t('中心水的氢键')} <b>4</b>
              </span>
            </>
          ) : m === 'quartz' ? (
            <>
              <span>
                <i className="ccb-element ccb-si" />
                <b>Si → 4 O</b>
              </span>
              <span>
                <i className="ccb-element ccb-o" />
                <b>O → 2 Si</b>
              </span>
              <span>
                {t('晶胞计数')} <b>3 Si : 6 O</b>
              </span>
            </>
          ) : m === 'diamond' ? (
            <>
              <span>
                {t('中心碳的近邻')} <b>4</b>
              </span>
              <span>
                {t('键角')} <b>109.47°</b>
              </span>
            </>
          ) : (
            <>
              <span>
                {t('切断的跨面键')} <b>{cleave(p).broken}</b>
              </span>
              <span>
                {t('共价连接区域')} <b>{connected}</b>
              </span>
            </>
          )}
        </div>
        <div className="ccb-legend">
          <span>
            <i className="ccb-solid" />
            {t('共价键')}
          </span>
          {m === 'iodine' || m === 'ice' ? (
            <span>
              <i className="ccb-dashed" />
              {t(m === 'ice' ? '氢键' : '分子间作用')}
            </span>
          ) : (
            <span>
              <i className="ccb-boundary" />
              {t('视野外继续连接')}
            </span>
          )}
        </div>
      </div>
      {!f.watch && (
        <div className="ccb-controls">
          <Segments
            label={t('观察内容')}
            value={m}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          {m !== 'ice' && (
            <Range
              label={t('演示进度')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          )}
          <Range
            label={t('观察角度（°）')}
            value={angle}
            min={-160}
            max={160}
            onChange={setAngle}
          />
          <Range
            label={t('结构放大倍数')}
            value={zoom}
            min={0.75}
            max={1}
            step={0.05}
            onChange={setZoom}
          />
          <p>
            {t(
              '分离与断裂是连接关系演示，不计算蒸气压、断裂力或真实时间。球的大小不代表原子半径。',
            )}
          </p>
        </div>
      )}
    </div>
  );
}
