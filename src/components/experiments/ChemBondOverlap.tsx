import { useEffect, useRef, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  bondDirector,
  overlapField,
  gaussianOverlap,
  ionicBookkeeping,
  ROCK_SALT_NEIGHBORS,
  projectNeighbor,
  type OverlapKind,
} from '../../models/chem-bond-overlap';
import '../../styles/chem-bond-overlap.css';
function OrbitalSlice({
  kind,
  distance,
  angle,
  combined,
}: {
  kind: OverlapKind;
  distance: number;
  angle: number;
  combined: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const c = ref.current,
      ctx = c?.getContext('2d');
    if (!ctx || !c) {
      setUnavailable(true);
      return;
    }
    const w = 360,
      h = 240,
      im = ctx.createImageData(w, h);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const x = (i - w / 2) / 45,
          y = (h / 2 - j) / 45,
          v = overlapField(kind, distance, x, y, 0, angle, combined),
          a = Math.min(0.92, Math.sqrt(v) * 1.8),
          q = (j * w + i) * 4;
        im.data[q] = Math.round(249 * (1 - a) + 103 * a);
        im.data[q + 1] = Math.round(250 * (1 - a) + 136 * a);
        im.data[q + 2] = Math.round(244 * (1 - a) + 76 * a);
        im.data[q + 3] = 255;
      }
    ctx.putImageData(im, 0, 0);
    ctx.strokeStyle = '#8d9a814f';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(10, h / 2);
    ctx.lineTo(w - 10, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(w / 2 + sign * distance * 22.5, h / 2, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ae7857';
      ctx.fill();
    }
  }, [kind, distance, angle, combined]);
  if (unavailable)
    return (
      <p className="chem-bond-evidence">
        {browserLocale() === 'en'
          ? 'The orbital slice needs Canvas2D. The model remains available in the article.'
          : '当前浏览器无法绘制轨道剖面，可展开文章阅读模型说明。'}
      </p>
    );
  return (
    <canvas
      ref={ref}
      width="360"
      height="240"
      role="img"
      aria-label="Calculated orbital-symmetry density slice"
    />
  );
}
export default function ChemBondOverlap() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState(film.variant === 'orbital-overlap' ? 'orbitals' : 'ionic'),
    [kind, setKind] = useState<OverlapKind>('ss'),
    [distance, setDistance] = useState(1.8),
    [angle, setAngle] = useState(0),
    [transfer, setTransfer] = useState(1),
    [turn, setTurn] = useState(0.6);
  const d = film.watch
    ? bondDirector(film.chapter, film.chapterProgress)
    : {
        chapter:
          view === 'ionic'
            ? 0
            : view === 'lattice'
              ? 1
              : view === 'chlorine'
                ? 2
                : view === 'polar'
                  ? 3
                  : kind === 'pi'
                    ? 8
                    : 4,
        progress: transfer,
        kind,
        distance,
        angle: (angle * Math.PI) / 180,
        combined: true,
        transferred: transfer >= 1,
      };
  const ions = ionicBookkeeping(d.transferred),
    left = d.chapter === 0 ? 'Na' : d.chapter === 2 ? 'Cl' : 'H',
    right = 'Cl',
    x1 = d.chapter === 0 ? 70 : 80,
    x2 = d.chapter === 0 ? 250 : 240,
    sharedX = d.chapter === 3 ? 177 : 160;
  const lone = (cx: number, side: number) => (
    <>
      {[-1, 0, 1].flatMap((row, i) =>
        [0, 1].map((k) => (
          <circle
            key={`${i}-${k}`}
            cx={cx + (row === 0 ? side * 40 : (k - 0.5) * 12)}
            cy={140 + (row === 0 ? (k - 0.5) * 12 : row * 37)}
            r="3"
            fill="#718664"
          />
        )),
      )}
    </>
  );
  const neighbors = [
    { x: 0, y: 0, z: 0, center: true },
    ...ROCK_SALT_NEIGHBORS.map((p) => ({ ...p, center: false })),
  ]
    .map((p) => ({ ...p, ...projectNeighbor(p, film.watch ? 0.5 + d.progress * 0.5 : turn) }))
    .sort((a, b) => a.depth - b.depth);
  return (
    <section className="chem-bond-overlap">
      {d.chapter === 1 ? (
        <>
          <div className="chem-bond-label">
            {say('NaCl · 局部配位', 'NaCl · Local coordination')}
          </div>
          <svg
            className="chem-bond-lattice"
            viewBox="0 0 320 270"
            aria-label={say(
              '氯化钠中的八面体配位局部',
              'Local octahedral coordination in sodium chloride',
            )}
            role="img"
          >
            <defs>
              <radialGradient id="chem-bond-na">
                <stop stopColor="#efdfbd" />
                <stop offset="1" stopColor="#b69a70" />
              </radialGradient>
              <radialGradient id="chem-bond-cl">
                <stop stopColor="#d9e5c5" />
                <stop offset="1" stopColor="#8fa77c" />
              </radialGradient>
            </defs>
            {neighbors.map((p, i) => (
              <g key={i} opacity={p.center ? 1 : 0.9}>
                <circle
                  cx={160 + p.x}
                  cy={135 - p.y}
                  r={p.center ? 23 : 28}
                  fill={p.center ? 'url(#chem-bond-na)' : 'url(#chem-bond-cl)'}
                />
                <text x={160 + p.x} y={141 - p.y} textAnchor="middle" fontSize="19" fill="#42543a">
                  {p.center ? 'Na⁺' : 'Cl⁻'}
                </text>
              </g>
            ))}
          </svg>
        </>
      ) : d.chapter < 4 ? (
        <>
          <div className="chem-bond-label">
            {d.chapter === 0
              ? say('Na / Cl · 电子式', 'Na / Cl · Lewis diagram')
              : d.chapter === 2
                ? 'Cl—Cl'
                : 'H—Cl'}
          </div>
          <svg
            className="chem-bond-lewis"
            viewBox="0 0 320 260"
            aria-label={say(
              '价电子转移或共用的电子式示意',
              'Lewis schematic of valence transfer or sharing',
            )}
            role="img"
          >
            <text x={x1} y="151" textAnchor="middle" fill="#61764f" fontSize="35">
              {left}
              {d.chapter === 0 && d.transferred ? '⁺' : ''}
            </text>
            <text x={x2} y="151" textAnchor="middle" fill="#61764f" fontSize="35">
              {right}
              {d.chapter === 0 && d.transferred ? '⁻' : ''}
            </text>
            {lone(x2, 1)}
            {d.chapter === 2 && lone(x1, -1)}
            {d.chapter === 0 ? (
              <>
                <circle cx={105 + 110 * d.progress} cy="137" r="4" fill="#b38c5c" />
                <circle cx="215" cy="149" r="3" fill="#718664" />
                {d.transferred && (
                  <path
                    d="M205 95H195V185H205M290 95H300V185H290"
                    fill="none"
                    stroke="#718664"
                    strokeWidth="1.5"
                  />
                )}
              </>
            ) : (
              <>
                <circle cx={105 + (sharedX - 105) * d.progress} cy="135" r="3.5" fill="#b38c5c" />
                <circle cx={215 + (sharedX - 215) * d.progress} cy="147" r="3.5" fill="#718664" />
                {d.chapter === 3 && (
                  <>
                    <text x="80" y="90" textAnchor="middle" fill="#99734d" fontSize="22">
                      δ+
                    </text>
                    <text x="240" y="90" textAnchor="middle" fill="#738966" fontSize="22">
                      δ−
                    </text>
                  </>
                )}
              </>
            )}
          </svg>
          <div className="chem-bond-evidence">
            {d.chapter === 0
              ? `${ions.naElectrons} + ${ions.clElectrons} = ${ions.totalElectrons} e⁻`
              : d.chapter === 2
                ? say('共用：2 e⁻', 'Shared: 2 e⁻')
                : 'δ+ H—Cl δ−'}
          </div>
        </>
      ) : (
        <>
          <div className="chem-bond-label">
            {d.kind === 'ss'
              ? 's–s · σ'
              : d.kind === 'sp'
                ? 's–p · σ'
                : d.kind === 'sigma'
                  ? 'p–p · σ'
                  : 'p–p · π'}
          </div>
          <OrbitalSlice kind={d.kind} distance={d.distance} angle={d.angle} combined={d.combined} />
          <div className="chem-bond-evidence">
            {d.chapter === 8
              ? `θ = ${Math.round((d.angle * 180) / Math.PI)}° · S = ${gaussianOverlap(d.kind, d.distance, d.angle).toFixed(3)}`
              : say('轨道对称性剖面', 'Orbital-symmetry slice')}
          </div>
        </>
      )}
      {!film.watch && (
        <div className="chem-bond-controls">
          <Segments
            label={say('观察对象', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'ionic', label: say('转移', 'Transfer') },
              { value: 'lattice', label: say('晶格局部', 'Lattice') },
              { value: 'chlorine', label: 'Cl₂' },
              { value: 'polar', label: 'HCl' },
              { value: 'orbitals', label: say('重叠', 'Overlap') },
            ]}
          />
          {view === 'orbitals' ? (
            <>
              <Segments
                label={say('基函数形状', 'Basis shapes')}
                value={kind}
                onChange={(v) => setKind(v as OverlapKind)}
                options={[
                  { value: 'ss', label: 's–s' },
                  { value: 'sp', label: 's–p' },
                  { value: 'sigma', label: 'p–p σ' },
                  { value: 'pi', label: 'p–p π' },
                ]}
              />
              <Range
                label={say('核间距（模型单位）', 'Separation (model units)')}
                value={distance}
                min={1.6}
                max={4}
                step={0.05}
                onChange={setDistance}
              />
              {kind === 'pi' && (
                <Range
                  label={say('第二个p方向角', 'Second p-axis angle')}
                  value={angle}
                  min={0}
                  max={90}
                  step={1}
                  onChange={setAngle}
                />
              )}
            </>
          ) : view === 'lattice' ? (
            <Range
              label={say('观察转角', 'View angle')}
              value={turn}
              min={0.2}
              max={1.2}
              step={0.01}
              onChange={setTurn}
            />
          ) : (
            <Range
              label={say('电子式演示进度', 'Lewis diagram progress')}
              value={transfer}
              min={0}
              max={1}
              step={0.01}
              onChange={setTransfer}
            />
          )}
          <details>
            <summary>{say('科学模型的边界', 'Scientific limits')}</summary>
            <p>
              {say(
                '电子式是价电子记账，不是粒子轨迹。晶格仅显示六配位局部。密度剖面由归一化高斯s/p基函数计算，用于比较对称性；不是H₂、HCl或Cl₂的定量电子密度，不计算键能。',
                'Lewis dots account for valence electrons; they are not trajectories. The lattice shows only a six-coordinate neighborhood. Normalized Gaussian s/p bases generate symmetry slices, not quantitative H₂, HCl or Cl₂ densities or bond energies.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
