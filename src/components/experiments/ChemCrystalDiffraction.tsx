import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  artemisinin,
  artemisininBonds,
  atomAngle,
  atomDistance,
  acetateCandidate,
  acetateReference,
  candidateEvidence,
  cellSites,
  penrose,
  penrosePoints,
  planarPoints,
  refineHistory,
  rotate,
  sharingCells,
  type V,
  type P,
} from '../../models/chem-crystal-diffraction';
import '../../styles/chem-crystal-diffraction.css';
const modes = [
  'sharing',
  'count',
  'quasi',
  'quasi-pattern',
  'patterns',
  'powder',
  'refine',
  'molecule',
] as const;
type Mode = (typeof modes)[number];
const names = [
  '共享一个原子',
  '晶胞中算多少',
  '有序不等于周期',
  '非周期也有亮斑',
  '比较衍射图',
  '从斑点到粉末峰',
  '坐标要解释强度',
  '从坐标量出结构',
];
const frame = (p: V, yaw = 0.55, scale = 100, centre: V = { x: 0.5, y: 0.5, z: 0.5 }) => {
  const a = rotate({ x: p.x - centre.x, y: p.y - centre.y, z: p.z - centre.z }, yaw);
  return { x: 160 + a.x * scale, y: 125 - a.y * scale, z: a.z };
};
const corners = Array.from({ length: 8 }, (_, i) => ({
  x: i % 2,
  y: Math.floor(i / 2) % 2,
  z: Math.floor(i / 4),
}));
const edges = corners.flatMap((a, i) =>
  corners.flatMap((b, j) =>
    j > i && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z) === 1 ? [[i, j]] : [],
  ),
);
function Cube({
  origin,
  yaw,
  scale,
  centre,
  active = false,
}: {
  origin: V;
  yaw: number;
  scale: number;
  centre: V;
  active?: boolean;
}) {
  const ps = corners.map((a) =>
    frame({ x: a.x + origin.x, y: a.y + origin.y, z: a.z + origin.z }, yaw, scale, centre),
  );
  return (
    <g
      stroke={active ? '#a78959' : '#8daba8'}
      opacity={active ? 1 : 0.3}
      strokeWidth={active ? 1.8 : 1}
    >
      {edges.map(([a, b], i) => (
        <path key={i} d={`M${ps[a].x} ${ps[a].y} L${ps[b].x} ${ps[b].y}`} fill="none" />
      ))}
    </g>
  );
}
function UnitCell({
  sharing,
  kind,
  yaw,
  salt,
}: {
  sharing: boolean;
  kind: 'corner' | 'edge' | 'face' | 'inside';
  yaw: number;
  salt: boolean;
}) {
  const s = sharingCells(kind),
    centre = sharing ? s.site : { x: 0.5, y: 0.5, z: 0.5 },
    scale = sharing ? 75 : 128;
  const atoms = sharing
    ? [{ ...s.site, species: 'Cu', weight: s.weight }]
    : cellSites(salt ? 'nacl' : 'fcc');
  return (
    <svg
      viewBox="0 0 320 250"
      role="img"
      aria-label={t(
        sharing
          ? '相邻晶胞共享同一原子，边界位置决定分数权重'
          : '根据同一晶胞边界对顶角、棱、面与内部粒子进行分数计数',
      )}
    >
      <defs>
        <radialGradient id="cdf-copper" cx="30%" cy="25%">
          <stop stopColor="#edc595" />
          <stop offset="1" stopColor="#ab7957" />
        </radialGradient>
      </defs>
      {(sharing ? s.cells : [{ x: 0, y: 0, z: 0 }]).map((o, i) => (
        <Cube
          key={i}
          origin={o}
          yaw={yaw}
          scale={scale}
          centre={centre}
          active={o.x === 0 && o.y === 0 && o.z === 0}
        />
      ))}
      {atoms
        .map((a, i) => ({ ...frame(a, yaw, scale, centre), ...a, id: i }))
        .map((a) => ({ ...a, view: frame(a, yaw, scale, centre) }))
        .sort((a, b) => a.view.z - b.view.z)
        .map((a) => (
          <g key={a.id}>
            <circle
              cx={a.view.x}
              cy={a.view.y}
              r={sharing ? 18 : a.species === 'Cl' ? 12 : 9}
              fill={
                a.species === 'Cu' ? 'url(#cdf-copper)' : a.species === 'Cl' ? '#9ebca4' : '#b8b5cf'
              }
              stroke={a.species === 'Cu' ? '#956f50' : '#849b99'}
              strokeWidth=".8"
            />
            {sharing && (
              <circle
                cx={a.view.x}
                cy={a.view.y}
                r="25"
                fill="none"
                stroke="#bd9d63"
                strokeDasharray="3 5"
              />
            )}
          </g>
        ))}
    </svg>
  );
}
function Penrose({ shift = 0, detail = true }: { shift?: number; detail?: boolean }) {
  const ts = useMemo(() => penrose(4), []),
    pts = useMemo(() => penrosePoints(), []);
  return (
    <svg
      viewBox="0 0 320 250"
      role="img"
      aria-label={t('按黄金比例递归构造的有限彭罗斯铺排，平移副本不与整体重合')}
    >
      <defs>
        <clipPath id="cdf-penrose-window">
          <circle cx="160" cy="125" r="112" />
        </clipPath>
      </defs>
      <g clipPath="url(#cdf-penrose-window)">
        {detail &&
          ts.map((v, i) => (
            <polygon
              key={i}
              points={[v.a, v.b, v.c].map((p) => `${160 + p.x * 109},${125 + p.y * 109}`).join(' ')}
              fill={v.kind ? '#cbd9ce' : '#e2d4b5'}
              stroke="#9ab1a6"
              strokeWidth=".4"
            />
          ))}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={160 + (p.x * 109) / 7}
            cy={125 + (p.y * 109) / 7}
            r={detail ? 1.3 : 2}
            fill="#6d9690"
          />
        ))}
        {shift > 0 &&
          pts.map((p, i) => (
            <circle
              key={`g${i}`}
              cx={160 + ((p.x + shift) * 109) / 7}
              cy={125 + (p.y * 109) / 7}
              r="2.5"
              fill="none"
              stroke="#bd9357"
              strokeWidth="1"
            />
          ))}
      </g>
    </svg>
  );
}
function Heatmap({
  kind,
  extent = 2.5,
}: {
  kind: 'quasi' | 'periodic' | 'disordered';
  extent?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    [status, setStatus] = useState('loading'),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let worker: Worker | undefined,
      alive = true;
    setStatus('loading');
    try {
      worker = new Worker(
        new URL('../../workers/chem-crystal-diffraction.worker.ts', import.meta.url),
        { type: 'module' },
      );
      worker.onmessage = (e) => {
        if (!alive) return;
        const values = e.data.values as Float32Array,
          ctx = ref.current?.getContext('2d');
        if (!ctx) {
          setStatus('failed');
          return;
        }
        const image = ctx.createImageData(128, 128);
        for (let i = 0; i < values.length; i++) {
          const v = Math.min(1, Math.log1p(values[i] * 700) / Math.log(701)),
            j = i * 4;
          image.data[j] = 25 + v * 207;
          image.data[j + 1] = 44 + v * 195;
          image.data[j + 2] = 46 + v * 162;
          image.data[j + 3] = 255;
        }
        ctx.putImageData(image, 0, 0);
        setStatus('ready');
      };
      worker.onerror = () => alive && setStatus('failed');
      worker.postMessage({ id: 1, kind, size: 128, extent });
    } catch {
      setStatus('failed');
    }
    return () => {
      alive = false;
      worker?.terminate();
    };
  }, [kind, extent, retry]);
  return (
    <div className="cdf-heatmap">
      <canvas
        ref={ref}
        width={128}
        height={128}
        role="img"
        aria-label={t('由当前点坐标计算的二维散射强度，亮度使用对数压缩')}
      />
      {status !== 'ready' && (
        <div className="cdf-compute">
          {status === 'loading' ? (
            t('正在计算图谱')
          ) : (
            <button onClick={() => setRetry((v) => v + 1)}>{t('重试图谱计算')}</button>
          )}
        </div>
      )}
    </div>
  );
}
function Points({ disordered }: { disordered: boolean }) {
  const points = useMemo(() => planarPoints(disordered ? 1 : 0), [disordered]);
  return (
    <svg
      viewBox="0 0 250 250"
      role="img"
      aria-label={t(disordered ? '相同数目的非周期排列散射点' : '周期排列的同种散射点')}
    >
      {points.map((p, i) => (
        <circle
          key={i}
          cx={125 + p.x * 19}
          cy={125 + p.y * 19}
          r="3.2"
          fill={disordered ? '#aa966d' : '#719b97'}
        />
      ))}
    </svg>
  );
}
function PatternComparison() {
  return (
    <div className="cdf-comparison">
      {[false, true].map((d) => (
        <div className="cdf-comparison-row" key={String(d)}>
          <p>{t(d ? '位置无序对照' : '周期点阵')}</p>
          <div className="cdf-pair">
            <Points disordered={d} />
            <Heatmap kind={d ? 'disordered' : 'periodic'} />
          </div>
        </div>
      ))}
    </div>
  );
}
type Curve = { q: number; intensity: number }[];
function Powder({ scan }: { scan: number }) {
  const [data, setData] = useState<{ periodic: Curve; disordered: Curve } | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let w: Worker | undefined;
    try {
      w = new Worker(new URL('../../workers/chem-crystal-diffraction.worker.ts', import.meta.url), {
        type: 'module',
      });
      w.onmessage = (e) => setData(e.data);
      w.onerror = () => setFailed(true);
      w.postMessage({ id: 1, kind: 'powder', size: 0, extent: 0 });
    } catch {
      setFailed(true);
    }
    return () => w?.terminate();
  }, []);
  const max = data
    ? Math.max(...data.periodic.map((p) => p.intensity), ...data.disordered.map((p) => p.intensity))
    : 1;
  const path = (a: Curve, base: number) =>
    a
      .map(
        (v, i) =>
          `${i ? 'L' : 'M'}${28 + ((v.q - 3) / 12) * 264} ${base - (v.intensity / max) * 48}`,
      )
      .join(' ');
  return (
    <div className="cdf-powder">
      <svg
        viewBox="0 0 320 310"
        role="img"
        aria-label={t('对三维散射点的成对距离计算取向平均强度，比较峰与弥散背景')}
      >
        {data && (
          <g>
            {data.periodic.map((v, i) => {
              const r = (v.q / 15) * 50;
              return (
                <path
                  key={i}
                  d={`M160 ${63 - r} A${r} ${r} 0 0 0 160 ${63 + r}`}
                  fill="none"
                  stroke="#6e9993"
                  strokeWidth="1.1"
                  opacity={Math.min(1, 0.08 + Math.sqrt(v.intensity / max))}
                />
              );
            })}
            {data.disordered.map((v, i) => {
              const r = (v.q / 15) * 50;
              return (
                <path
                  key={i}
                  d={`M160 ${63 - r} A${r} ${r} 0 0 1 160 ${63 + r}`}
                  fill="none"
                  stroke="#b39768"
                  strokeWidth="1.1"
                  opacity={Math.min(1, 0.08 + Math.sqrt(v.intensity / max))}
                />
              );
            })}
            <circle
              cx="160"
              cy="63"
              r={((3 + 12 * scan) / 15) * 50}
              fill="none"
              stroke="#637f78"
              strokeWidth="1"
              strokeDasharray="2 4"
            />
          </g>
        )}
        <path d="M28 133 V271 H298" fill="none" stroke="#9fb3aa" />
        <path d="M28 204 H295" fill="none" stroke="#bfcdc1" strokeDasharray="3 5" />
        {data && (
          <>
            <path d={path(data.periodic, 199)} fill="none" stroke="#6e9993" strokeWidth="2" />
            <path d={path(data.disordered, 267)} fill="none" stroke="#b39768" strokeWidth="2" />
          </>
        )}
        <path
          d={`M${28 + 264 * scan} 133 V271`}
          fill="none"
          stroke="#bf9e66"
          strokeWidth="1.5"
          opacity=".55"
        />
        {[3, 6, 9, 12, 15].map((q) => (
          <text key={q} x={28 + ((q - 3) / 12) * 264} y="298">
            {q}
          </text>
        ))}
      </svg>
      <div className="cdf-curve-labels">
        <span>{t('周期结构')}</span>
        <span>{t('无序结构')}</span>
      </div>
      <p>{failed ? t('图谱计算不可用，正文仍可阅读') : t('q（相对单位）· 三维点散射模型')}</p>
    </div>
  );
}
function Refinement({ distance, loss }: { distance: number; loss: number }) {
  const pts = acetateCandidate(distance),
    e = candidateEvidence(distance)
      .filter((v) => v.h >= 0 && v.k >= 0)
      .slice(1, 7);
  const proj = (p: P) => ({ x: 160 + p.x * 48, y: 115 + p.y * 48 });
  return (
    <div className="cdf-refine">
      <svg
        viewBox="0 0 320 240"
        role="img"
        aria-label={t('移动候选氧原子，真实重算各个反射的强度与误差')}
      >
        <g opacity=".23">
          {acetateReference.map((p, i) => (
            <circle
              key={i}
              cx={proj(p).x}
              cy={proj(p).y}
              r={i < 2 ? 18 : 21}
              fill={i < 2 ? '#8ca4a2' : '#c89582'}
            />
          ))}
        </g>
        {[
          [0, 1],
          [1, 2],
          [1, 3],
        ].map(([a, b], i) => {
          const p = proj(pts[a]),
            q = proj(pts[b]),
            d = Math.hypot(q.x - p.x, q.y - p.y),
            x = (q.x - p.x) / d,
            y = (q.y - p.y) / d;
          return (
            <path
              key={i}
              d={`M${p.x + x * 12} ${p.y + y * 12} L${q.x - x * 12} ${q.y - y * 12}`}
              fill="none"
              stroke={b === 2 ? '#bd915b' : '#8b9e98'}
              strokeWidth={b === 2 ? 4 : 3}
            />
          );
        })}
        {pts.map((p, i) => (
          <g key={i}>
            <circle
              cx={proj(p).x}
              cy={proj(p).y}
              r="12"
              fill={p.label === 'O' ? '#c8907b' : '#8b9d98'}
              stroke="#6d8582"
              strokeWidth=".7"
            />
            {i === 2 && (
              <circle
                cx={proj(p).x}
                cy={proj(p).y}
                r="18"
                fill="none"
                stroke="#be9a58"
                strokeWidth="1.6"
              />
            )}
          </g>
        ))}
        <path d="M33 213 H287" fill="none" stroke="#9cb2a8" />
        {e.map((v, i) => (
          <g key={i}>
            <path
              d={`M${48 + i * 41} 210 v${(-v.reference / 784) * 45}`}
              fill="none"
              stroke="#82a29c"
              strokeWidth="6"
            />
            <path
              d={`M${57 + i * 41} 210 v${(-v.candidate / 784) * 45}`}
              fill="none"
              stroke="#bf9c65"
              strokeWidth="6"
            />
          </g>
        ))}
      </svg>
      <div className="cdf-refine-read">
        <span>
          {t('候选 C—O')} <b>{distance.toFixed(3)} Å</b>
        </span>
        <span>
          {t('归一化误差')} <b>{loss.toFixed(4)}</b>
        </span>
      </div>
      <p>{t('模拟参考强度 / 候选强度 · H 省略')}</p>
    </div>
  );
}
function Molecule({ yaw, measure }: { yaw: number; measure: 'bond' | 'angle' }) {
  const centre = artemisinin.reduce(
      (n, a) => ({ x: n.x + a.x / 20, y: n.y + a.y / 20, z: n.z + a.z / 20 }),
      { x: 0, y: 0, z: 0 },
    ),
    nodes = artemisinin.map((a) => ({ ...a, ...frame(a, yaw, 28, centre) }));
  const objects: { z: number; key: string; node: React.ReactNode }[] = [];
  for (const [a, b] of artemisininBonds) {
    const p = nodes.find((v) => v.id === a)!,
      q = nodes.find((v) => v.id === b)!,
      d = Math.hypot(q.x - p.x, q.y - p.y),
      ux = (q.x - p.x) / d,
      uy = (q.y - p.y) / d;
    const active = (a === 'O1' && b === 'O2') || (measure === 'angle' && a === 'O1' && b === 'C4');
    objects.push({
      z: (p.z + q.z) / 2,
      key: a + b,
      node: (
        <path
          d={`M${p.x + ux * 8} ${p.y + uy * 8} L${q.x - ux * 8} ${q.y - uy * 8}`}
          fill="none"
          stroke={active ? '#bf9557' : '#8d9f99'}
          strokeWidth={active ? 5 : 3}
          strokeLinecap="round"
        />
      ),
    });
  }
  for (const p of nodes)
    objects.push({
      z: p.z,
      key: p.id,
      node: (
        <g>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.element === 'O' ? 9 : 7.5}
            fill={p.element === 'O' ? '#c48d77' : '#8a9f99'}
            stroke={p.element === 'O' ? '#aa725f' : '#708b83'}
            strokeWidth=".7"
          />
          <circle cx={p.x - 2} cy={p.y - 2} r="2" fill="white" opacity=".35" />
        </g>
      ),
    });
  return (
    <div className="cdf-molecule">
      <svg
        viewBox="0 0 320 250"
        role="img"
        aria-label={t('公开精修坐标生成的青蒿素重原子结构，突出过氧桥与实际测量的几何')}
      >
        <g>
          {objects
            .sort((a, b) => a.z - b.z)
            .map((o) => (
              <g key={o.key}>{o.node}</g>
            ))}
        </g>
      </svg>
      <div className="cdf-metric">
        <strong>
          {measure === 'bond'
            ? `O—O ${atomDistance('O1', 'O2').toFixed(3)} Å`
            : `C—O—O ${atomAngle('C4', 'O1', 'O2').toFixed(1)}°`}
        </strong>
        <p>{t('青蒿素 · 公开精修坐标 · H 省略')}</p>
        <div className="cdf-atom-key">
          <span>{t('碳')}</span>
          <span>{t('氧')}</span>
        </div>
      </div>
    </div>
  );
}
export default function ChemCrystalDiffraction() {
  const film = useShowcase(),
    initial =
      film.variant === 'quasicrystal'
        ? 'quasi'
        : film.variant === 'xray-comparison'
          ? 'patterns'
          : film.variant === 'organic-xray'
            ? 'refine'
            : 'sharing';
  const [mode, setMode] = useState<Mode>(initial),
    [share, setShare] = useState('corner'),
    [salt, setSalt] = useState('Cu'),
    [yaw, setYaw] = useState(0.55),
    [shift, setShift] = useState(1),
    [extent, setExtent] = useState(2.5),
    [distance, setDistance] = useState(1.75),
    [measure, setMeasure] = useState('bond');
  const m = film.watch ? modes[Math.min(film.chapter, 7)] : mode,
    p = film.watch ? film.chapterProgress : 0.7,
    kind = (
      film.watch
        ? (['corner', 'edge', 'face', 'inside'] as const)[Math.min(3, Math.floor(p * 4))]
        : share
    ) as 'corner' | 'edge' | 'face' | 'inside';
  const fit = useMemo(() => refineHistory(), []),
    f = film.watch
      ? fit[Math.min(36, Math.floor(ease(ramp(p, 0.15, 0.85)) * 36))]
      : {
          distance,
          loss:
            candidateEvidence(distance).reduce((s, v) => s + (v.reference - v.candidate) ** 2, 0) /
            candidateEvidence(distance).reduce((s, v) => s + v.reference ** 2, 0),
        },
    angle = film.watch ? 0.45 + ease(p) * 0.65 : yaw;
  return (
    <div className="cdf">
      <div className={`cdf-stage cdf-mode-${m}`}>
        {m === 'sharing' || m === 'count' ? (
          <div className="cdf-main">
            <UnitCell
              sharing={m === 'sharing'}
              kind={kind}
              yaw={angle}
              salt={!film.watch && salt === 'NaCl'}
            />
            <div className="cdf-cell-evidence">
              {m === 'sharing' ? (
                <>
                  <strong>
                    {t({ corner: '顶角', edge: '棱上', face: '面上', inside: '内部' }[kind])}
                  </strong>
                  <p>
                    {sharingCells(kind).cells.length} {t('个晶胞共享')}
                  </p>
                  <b>
                    {t('每个晶胞计入')} 1 / {sharingCells(kind).cells.length}
                  </b>
                </>
              ) : (
                <>
                  <strong>{film.watch || salt === 'Cu' ? 'Cu' : 'NaCl'}</strong>
                  <p>{film.watch || salt === 'Cu' ? '8 × ⅛ + 6 × ½ = 4' : 'Na: 12 × ¼ + 1 = 4'}</p>
                  {!film.watch && salt === 'NaCl' && <p>Cl: 8 × ⅛ + 6 × ½ = 4</p>}
                  <p>{t('分数是空间计数，不是切碎原子')}</p>
                </>
              )}
            </div>
          </div>
        ) : m === 'quasi' ? (
          <>
            <Penrose shift={film.watch ? ease(ramp(p, 0.2, 0.8)) * 1.4 : shift} />
            <p>{t('彭罗斯铺排 · 金色为平移副本')}</p>
          </>
        ) : m === 'quasi-pattern' ? (
          <>
            <div className="cdf-pair cdf-quasi-pair">
              <Penrose detail={false} />
              <Heatmap kind="quasi" extent={film.watch ? 2.5 : extent} />
            </div>
            <p>{t('同一组坐标 → 计算强度 · 非合金实测图')}</p>
          </>
        ) : m === 'patterns' ? (
          <>
            <PatternComparison />
            <p>{t('同种散射点、相同数目 · 不是 SiO₂ 实测谱')}</p>
          </>
        ) : m === 'powder' ? (
          <Powder scan={ease(p)} />
        ) : m === 'refine' ? (
          <Refinement distance={f.distance} loss={f.loss} />
        ) : (
          <Molecule
            yaw={angle}
            measure={(film.watch ? (p < 0.55 ? 'bond' : 'angle') : measure) as 'bond' | 'angle'}
          />
        )}
      </div>
      {!film.watch && (
        <div className="cdf-controls">
          <Segments
            label={t('观察内容')}
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={modes.map((v, i) => ({ value: v, label: t(names[i]) }))}
          />
          {m === 'sharing' && (
            <Segments
              label={t('位置')}
              value={share}
              onChange={setShare}
              options={['corner', 'edge', 'face', 'inside'].map((v, i) => ({
                value: v,
                label: t(['顶角', '棱上', '面上', '内部'][i]),
              }))}
            />
          )}{' '}
          {m === 'count' && (
            <Segments
              label={t('晶体示例')}
              value={salt}
              onChange={setSalt}
              options={[
                { value: 'Cu', label: 'Cu' },
                { value: 'NaCl', label: 'NaCl' },
              ]}
            />
          )}{' '}
          {['sharing', 'count', 'molecule'].includes(m) && (
            <Range
              label={t('观察角度')}
              value={yaw}
              onChange={setYaw}
              min={-0.5}
              max={1.8}
              step={0.01}
            />
          )}{' '}
          {m === 'quasi' && (
            <Range
              label={t('平移距离（模型单位）')}
              value={shift}
              onChange={setShift}
              min={0}
              max={2}
              step={0.01}
            />
          )}{' '}
          {m === 'quasi-pattern' && (
            <Range
              label={t('倒空间观察范围')}
              value={extent}
              onChange={setExtent}
              min={1.5}
              max={4}
              step={0.25}
            />
          )}{' '}
          {m === 'refine' && (
            <Range
              label={t('候选 C—O 距离（Å）')}
              value={distance}
              onChange={setDistance}
              min={0.9}
              max={1.9}
              step={0.01}
            />
          )}{' '}
          {m === 'molecule' && (
            <Segments
              label={t('几何测量')}
              value={measure}
              onChange={setMeasure}
              options={[
                { value: 'bond', label: t('键长') },
                { value: 'angle', label: t('键角') },
              ]}
            />
          )}
          <p>{t('点散射图谱和有机单参数拟合是教学模型，完整结构反演还需要相位与其他证据。')}</p>
        </div>
      )}
    </div>
  );
}
