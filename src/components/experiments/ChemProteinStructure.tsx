import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  crambin,
  aminoLetter,
  proteinGeometry,
  proteinStructureDirector,
} from '../../models/chem-protein-structure';
import '../../styles/chem-protein-structure.css';
const colors = { helix: '#9e6471', sheet: '#a6954c', loop: '#879e93' };
const chainColors: Record<string, string> = {
  A: '#966274',
  B: '#678b9d',
  C: '#bd8b92',
  D: '#8cb1b8',
};
const views = ['sequence', 'helix', 'sheet', 'whole', 'assembly'] as const;
export default function ChemProteinStructure() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState('sequence'),
    [angle, setAngle] = useState(0),
    [selected, setSelected] = useState(16),
    [spread, setSpread] = useState(0.5);
  const d = film.watch
    ? proteinStructureDirector(film.chapter, film.chapterProgress)
    : {
        chapter: views.indexOf(view as (typeof views)[number]),
        progress: 1,
        yaw: angle,
        selected,
        separation: spread,
        linkOpacity: 1,
      };
  const v = views[d.chapter],
    m = proteinGeometry(v === 'sequence' ? 'whole' : v, d.yaw, d.separation),
    r = crambin[d.selected - 1];
  const labels = [
    say('一级：氨基酸的顺序', 'Primary: residue sequence'),
    say('二级：链内螺旋', 'Secondary: a local helix'),
    say('二级：相邻链段的折叠', 'Secondary: a β sheet'),
    say('三级：整条链的空间结构', 'Tertiary: the whole chain'),
    say('四级：多条链的组合', 'Quaternary: several chains'),
  ];
  return (
    <section className="chem-fold">
      <div className="chem-fold-title">{labels[d.chapter]}</div>
      {v === 'sequence' ? (
        <>
          <div
            className="chem-fold-sequence"
            aria-label="Actual crambin sequence from amino to carboxyl terminus"
          >
            {crambin.map((a) => (
              <span
                key={a.id}
                className={a.id === d.selected ? 'selected' : ''}
                title={`${a.id} ${a.name}`}
              >
                {aminoLetter[a.name]}
              </span>
            ))}
          </div>
          <div className="chem-fold-evidence">N → C · 46 {say('个残基', 'residues')}</div>
          <div className="chem-fold-selected">
            {r.id} · {r.name}
          </div>
        </>
      ) : (
        <>
          <svg
            className="chem-fold-svg"
            viewBox="0 0 320 290"
            role="img"
            aria-label={say(
              '由PDB实测坐标投影的蛋白质主链及指定相互作用',
              'Protein alpha-carbon traces projected from deposited PDB coordinates, with selected actual atom contacts',
            )}
          >
            {m.segments.map((s, i) => {
              const col =
                v === 'assembly'
                  ? chainColors[s.b.chain]
                  : colors[s.b.secondary as keyof typeof colors];
              return (
                <g key={i}>
                  <line
                    x1={s.a.point[0]}
                    y1={s.a.point[1]}
                    x2={s.b.point[0]}
                    y2={s.b.point[1]}
                    stroke={col}
                    strokeWidth={v === 'assembly' ? 3 : 6}
                    strokeLinecap="round"
                    opacity={0.72 + Math.min(0.28, Math.max(0, (s.depth + 15) / 100))}
                  />
                </g>
              );
            })}
            {m.sidechains.map((s) => (
              <path
                key={s.id}
                d={s.points.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ')}
                stroke="#aaa178"
                strokeWidth="2"
                fill="none"
                opacity={d.linkOpacity}
              />
            ))}
            {m.links.map((l, i) => (
              <g key={i} opacity={d.linkOpacity}>
                <line
                  x1={l.a[0]}
                  y1={l.a[1]}
                  x2={l.b[0]}
                  y2={l.b[1]}
                  stroke={l.kind === 'disulfide' ? '#b39743' : '#797aa5'}
                  strokeWidth={l.kind === 'disulfide' ? 4 : 2}
                  strokeDasharray={l.kind === 'disulfide' ? undefined : '3 4'}
                />
                <circle
                  cx={l.a[0]}
                  cy={l.a[1]}
                  r="3"
                  fill={l.kind === 'disulfide' ? '#b39743' : '#ba7071'}
                />
                <circle
                  cx={l.b[0]}
                  cy={l.b[1]}
                  r="3"
                  fill={l.kind === 'disulfide' ? '#b39743' : '#6d8dad'}
                />
              </g>
            ))}
          </svg>
          <div className="chem-fold-evidence">
            {v === 'helix'
              ? 'Oᵢ ··· Nᵢ₊₄'
              : v === 'sheet'
                ? say('反平行链段 · O ··· N', 'Antiparallel segments · O ··· N')
                : v === 'whole'
                  ? say('同一条链 · 3 个 S—S', 'One chain · 3 S—S bonds')
                  : 'α₂β₂ · 4HHB'}
          </div>
          {v === 'assembly' ? (
            <div className="chem-fold-legend">
              {['A', 'B', 'C', 'D'].map((a, i) => (
                <span key={a} style={{ color: chainColors[a] }}>
                  {['α₁', 'β₁', 'α₂', 'β₂'][i]} · {i % 2 ? 146 : 141}
                </span>
              ))}
            </div>
          ) : (
            <div className="chem-fold-key">{say('1CRN · Cα 轨迹', '1CRN · Cα trace')}</div>
          )}
        </>
      )}
      {!film.watch ? (
        <div className="chem-fold-controls">
          <Segments
            label={say('结构层次', 'Structural view')}
            value={view}
            onChange={setView}
            options={views.map((v, i) => ({ value: v, label: labels[i] }))}
          />
          {v === 'sequence' ? (
            <Range
              label={say('追踪残基', 'Tracked residue')}
              min={1}
              max={46}
              step={1}
              value={selected}
              onChange={setSelected}
            />
          ) : (
            <Range
              label={say('转动观察角度', 'Rotate the view')}
              min={-3.14}
              max={3.14}
              step={0.02}
              value={angle}
              onChange={setAngle}
            />
          )}
          {v === 'assembly' ? (
            <Range
              label={say('分开展示各链', 'Separate chains for inspection')}
              min={0}
              max={1}
              step={0.01}
              value={spread}
              onChange={setSpread}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
