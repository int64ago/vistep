import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  shapeMolecule,
  shapeDipoles,
  shapeDirector,
  shapeProject,
  shapeScale,
  shapeAdd,
  shapeUnit,
  SHAPE_TETRA,
  balloonSurface,
  type ShapePoint,
} from '../../models/chem-molecular-shapes';
import '../../styles/chem-molecular-shapes.css';
const names: Record<string, [string, string]> = {
  hydrogen: ['氢气', 'Hydrogen'],
  chlorine: ['氯气', 'Chlorine'],
  'carbon-dioxide': ['二氧化碳', 'Carbon dioxide'],
  formaldehyde: ['甲醛', 'Formaldehyde'],
  methane: ['甲烷', 'Methane'],
  ammonia: ['氨', 'Ammonia'],
  water: ['水', 'Water'],
  chloromethane: ['一氯甲烷', 'Chloromethane'],
  balloons: ['四个等大气球', 'Four equal balloons'],
};
const colors = { H: '#e7e4d7', Cl: '#9bad78', C: '#5e7075', O: '#bf786d', N: '#778eac' };
const sub = (s: string) => s.replace(/\d/g, (c) => '₀₁₂₃₄₅₆₇₈₉'[Number(c)]);
export default function ChemMolecularShapes() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a),
    uid = useId().replace(/:/g, '');
  const [key, setKey] = useState(film.variant === 'six-models' ? 'hydrogen' : 'carbon-dioxide'),
    [mode, setMode] = useState(film.variant === 'molecular-polarity' ? 'polarity' : 'domains'),
    [yaw, setYaw] = useState(0.4),
    [pitch, setPitch] = useState(0.3),
    [sum, setSum] = useState(1);
  const d = film.watch
    ? shapeDirector(film.chapter, film.chapterProgress)
    : {
        chapter: 0,
        key,
        domains: mode === 'domains',
        polarity: mode === 'polarity',
        yaw,
        pitch,
        reveal: 1,
        sum,
      };
  const balloon = d.key === 'balloons',
    m = shapeMolecule(balloon ? 'methane' : d.key),
    dip = shapeDipoles(m),
    s = balloon ? 65 : 66;
  const proj = (p: ShapePoint) => {
    const q = shapeProject(p, d.yaw, d.pitch);
    return { x: 160 + q.x * s, y: 125 - q.y * s, z: q.z };
  };
  const atoms = m.atoms.map((a) => ({ ...a, ...proj(a) })),
    origin = proj({ x: 0, y: 0, z: 0 });
  const domains = m.bonds
    .map((b) => shapeUnit(shapeAdd(m.atoms[b.b], shapeScale(m.atoms[b.a], -1))))
    .concat(m.lonePairs)
    .map((p) => proj(shapeScale(p, 1.35)));
  const faces = balloon
    ? SHAPE_TETRA.flatMap((u, bi) =>
        Array.from({ length: 13 }, (_, r) =>
          Array.from({ length: 20 }, (_, a) => {
            const pts = [
              [r, a],
              [r + 1, a],
              [r + 1, a + 1],
              [r, a + 1],
            ].map(([rr, aa]) => proj(balloonSurface(u, rr / 13, (aa * Math.PI) / 10)));
            return {
              points: pts.map((p) => `${p.x},${p.y}`).join(' '),
              z: pts.reduce((v, p) => v + p.z, 0) / 4,
              bi,
              light: 0.84 + 0.12 * Math.cos((a * Math.PI) / 10 - 0.8),
            };
          }),
        ).flat(),
      ).sort((a, b) => a.z - b.z)
    : [];
  const drawItems = m.bonds
    .flatMap((b, bi) =>
      [0, 1].map((half) => {
        const a = atoms[b.a],
          z = atoms[b.b];
        return {
          type: 'bond' as const,
          z: half === 0 ? (3 * a.z + z.z) / 4 : (a.z + 3 * z.z) / 4,
          b,
          bi,
          half,
        };
      }),
    )
    .concat([])
    .map((x) => x as typeof x | { type: 'atom'; z: number; index: number });
  atoms.forEach((a, index) => drawItems.push({ type: 'atom', z: a.z, index }));
  drawItems.sort((a, b) => a.z - b.z);
  const arrow = (a: ShapePoint, b: ShapePoint, color: string, id: string, width = 2.4) => {
    const p = proj(a),
      q = proj(b);
    if (Math.hypot(p.x - q.x, p.y - q.y) < 2) return null;
    return (
      <line
        key={id}
        x1={p.x}
        y1={p.y}
        x2={q.x}
        y2={q.y}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        markerEnd={`url(#${uid}-${color === '#a87242' ? 'sum' : 'bond'})`}
      />
    );
  };
  return (
    <section className="chem-molecular-shapes">
      <div className="chem-shapes-title">
        <strong>{say(...names[d.key])}</strong>
        {!balloon && <span>{sub(m.formula)}</span>}
      </div>
      <svg
        className="chem-shapes-stage"
        viewBox="0 0 320 250"
        role="img"
        aria-label={say(
          '按三维坐标投影的分子、价层电子对或极性向量',
          'Molecule, electron domains or polarity vectors projected from three-dimensional coordinates',
        )}
      >
        <defs>
          {Object.entries(colors).map(([e, c]) => (
            <radialGradient key={e} id={`${uid}-${e}`} cx="30%" cy="25%" r="75%">
              <stop offset="0" stopColor="#fff" />
              <stop offset=".42" stopColor={c} />
              <stop offset="1" stopColor={c} stopOpacity=".84" />
            </radialGradient>
          ))}
          <radialGradient id={`${uid}-lp`}>
            <stop offset="0" stopColor="#c4a485" stopOpacity=".3" />
            <stop offset="1" stopColor="#c4a485" stopOpacity=".03" />
          </radialGradient>
          {[
            ['bond', '#678995'],
            ['sum', '#a87242'],
          ].map(([id, c]) => (
            <marker
              key={id}
              id={`${uid}-${id}`}
              markerWidth="6"
              markerHeight="6"
              refX="5.1"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0 0 L6 3 L0 6Z" fill={c} />
            </marker>
          ))}
        </defs>
        {balloon ? (
          <>
            {faces.map((f, i) => (
              <polygon
                key={i}
                points={f.points}
                fill={['#96afa8', '#b6b98c', '#b1a0b1', '#9eacc4'][f.bi]}
                opacity={f.light}
                stroke={['#96afa8', '#b6b98c', '#b1a0b1', '#9eacc4'][f.bi]}
                strokeWidth=".35"
              />
            ))}
            <ellipse
              cx={origin.x}
              cy={origin.y}
              rx="6"
              ry="4"
              fill="#ad9477"
              stroke="#806c52"
              strokeWidth="1.5"
            />
          </>
        ) : (
          <>
            {d.domains && domains.length > 1 && (
              <g
                opacity={d.reveal * 0.5}
                fill="none"
                stroke="#99afa9"
                strokeWidth="1"
                strokeDasharray="4 5"
              >
                {domains.flatMap((p, i) =>
                  domains
                    .slice(i + 1)
                    .map((q, j) => <line key={`${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />),
                )}
              </g>
            )}
            {d.domains &&
              m.lonePairs.map((u, i) => {
                const p = proj(shapeScale(u, 0.83)),
                  tip = proj(shapeScale(u, 1.45)),
                  ang = (Math.atan2(tip.y - origin.y, tip.x - origin.x) * 180) / Math.PI;
                return (
                  <g key={i} opacity={d.reveal}>
                    <ellipse
                      cx={p.x}
                      cy={p.y}
                      rx="38"
                      ry="21"
                      fill={`url(#${uid}-lp)`}
                      stroke="#b49879"
                      strokeWidth="1"
                      strokeDasharray="3 4"
                      transform={`rotate(${ang} ${p.x} ${p.y})`}
                    />
                    <circle cx={p.x - 3} cy={p.y} r="2.8" fill="#a88460" />
                    <circle cx={p.x + 3} cy={p.y} r="2.8" fill="#a88460" />
                  </g>
                );
              })}
            {drawItems.map((item, i) => {
              if (item.type === 'atom') {
                const a = atoms[item.index],
                  r = a.element === 'H' ? 11 : a.element === 'Cl' ? 17 : 15;
                return (
                  <circle
                    key={i}
                    cx={a.x}
                    cy={a.y}
                    r={r}
                    fill={`url(#${uid}-${a.element})`}
                    stroke="#61707655"
                    strokeWidth=".8"
                  />
                );
              }
              const a = atoms[item.b.a],
                b = atoms[item.b.b],
                len = Math.hypot(b.x - a.x, b.y - a.y) || 1,
                dx = (b.y - a.y) / len,
                dy = -(b.x - a.x) / len,
                t = item.half === 0 ? 0 : 0.5,
                u = item.half === 0 ? 0.5 : 1;
              return (
                <g key={i}>
                  {Array.from({ length: item.b.order }, (_, k) => {
                    const off = (k - (item.b.order - 1) / 2) * 5;
                    return (
                      <line
                        key={k}
                        x1={a.x + (b.x - a.x) * t + dx * off}
                        y1={a.y + (b.y - a.y) * t + dy * off}
                        x2={a.x + (b.x - a.x) * u + dx * off}
                        y2={a.y + (b.y - a.y) * u + dy * off}
                        stroke={colors[item.half === 0 ? a.element : b.element]}
                        strokeWidth={item.b.order > 1 ? 4 : 7}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </g>
              );
            })}
            {d.polarity &&
              dip.bonds.map((b, i) => {
                const a = m.atoms[b.a],
                  z = m.atoms[b.b],
                  mid = shapeScale(shapeAdd(a, z), 0.5),
                  u = shapeScale(b.vector, 0.42 * d.reveal);
                return arrow(
                  shapeAdd(mid, shapeScale(u, -0.5)),
                  shapeAdd(mid, shapeScale(u, 0.5)),
                  '#678995',
                  `b${i}`,
                );
              })}
            {d.polarity &&
              dip.magnitude > 1e-8 &&
              arrow(
                { x: 0, y: 0, z: 0.35 },
                shapeAdd({ x: 0, y: 0, z: 0.35 }, shapeScale(dip.resultant, 0.75 * d.sum)),
                '#a87242',
                'result',
                4,
              )}
            {d.polarity && dip.magnitude < 1e-8 && (
              <circle
                cx={origin.x}
                cy={origin.y}
                r={25 + 3 * d.sum}
                fill="none"
                stroke="#a87242"
                strokeWidth="2"
                strokeDasharray="3 5"
                opacity={d.sum}
              />
            )}
          </>
        )}
      </svg>
      <div className="chem-shapes-readout">
        {balloon ? (
          say('四个方向 · 四面体排列', 'Four directions · tetrahedral')
        ) : d.polarity ? (
          <>
            <span className="chem-shapes-key">
              <i />
              {say('键偶极', 'Bond dipoles')}
            </span>
            <strong className="chem-shapes-sum">
              {dip.magnitude < 1e-8
                ? say('合向量 = 0', 'Resultant = 0')
                : say('合向量 ≠ 0', 'Resultant ≠ 0')}
            </strong>
          </>
        ) : d.key === 'hydrogen' || d.key === 'chlorine' ? (
          `${d.key === 'hydrogen' ? 74 : 198} pm`
        ) : (
          <>
            {m.angle === 180
              ? '180°'
              : d.key === 'methane' || d.key === 'chloromethane'
                ? '109°28′'
                : `${m.angle}°`}
            <span>
              {say(
                `${m.domains} 组电子对 · ${m.lonePairs.length} 孤对`,
                `${m.domains} domains · ${m.lonePairs.length} lone pairs`,
              )}
            </span>
          </>
        )}
      </div>
      {!balloon && (
        <div className="chem-shapes-legend">
          {Object.entries(colors)
            .filter(([e]) => m.atoms.some((a) => a.element === e))
            .map(([e, c]) => (
              <span key={e}>
                <i style={{ background: c }} />
                {e}
              </span>
            ))}
          {d.domains && m.lonePairs.length > 0 && (
            <span>
              <i style={{ background: '#c4a485' }} />
              {say('孤电子对示意', 'Lone-pair marker')}
            </span>
          )}
        </div>
      )}
      {!film.watch && (
        <div className="chem-shapes-controls">
          <Segments
            label={say('模型', 'Model')}
            value={key}
            onChange={setKey}
            options={Object.entries(names).map(([value, label]) => ({
              value,
              label: say(...label),
            }))}
          />
          {!balloon && (
            <Segments
              label={say('观察层', 'Observation layer')}
              value={mode}
              onChange={setMode}
              options={[
                { value: 'domains', label: say('电子对与骨架', 'Domains and nuclei') },
                { value: 'polarity', label: say('极性向量', 'Polarity vectors') },
              ]}
            />
          )}
          <Range
            label={say('观察转角', 'Viewing yaw')}
            value={yaw}
            min={-1.5}
            max={1.5}
            step={0.02}
            onChange={setYaw}
          />
          <Range
            label={say('俯仰角', 'Viewing pitch')}
            value={pitch}
            min={-0.9}
            max={0.9}
            step={0.02}
            onChange={setPitch}
          />
          {mode === 'polarity' && !balloon && (
            <Range
              label={say('合向量显现', 'Reveal resultant')}
              value={sum}
              min={0}
              max={1}
              step={0.02}
              onChange={setSum}
            />
          )}
          <details>
            <summary>{say('模型范围与箭头约定', 'Model limits and arrow convention')}</summary>
            <p>
              {say(
                '键长和键角取教材给定值；VSEPR 只提供近似空间骨架。孤电子对轮廓和气球表面是教学示意。极性采用从负到正的物理偶极箭头；相对长度只用于比较对称性，不表示实测德拜数，也不替代电子密度计算。',
                'Bond lengths and angles are textbook inputs; VSEPR predicts approximate arrangements. Lone-pair outlines and balloon surfaces are schematic. Physical dipole arrows point from negative to positive. Their relative lengths test symmetry and are not measured Debye values or a complete electron-density calculation.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
