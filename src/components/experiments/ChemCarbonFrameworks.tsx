import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import ChemMoleculeStudio, { CHEM_ATOM_COLORS } from '../three/ChemMoleculeStudio';
import {
  carbonMolecule,
  bondCounts,
  carbonDirector,
  FOUR_CARBON_GRAPHS,
  graphHydrogens,
} from '../../models/chem-carbon-frameworks';
import '../../styles/chem-carbon-frameworks.css';
const names: Record<string, [string, string]> = {
  methane: ['甲烷', 'Methane'],
  ethane: ['乙烷', 'Ethane'],
  ethene: ['乙烯', 'Ethene'],
  ethyne: ['乙炔', 'Ethyne'],
  dichloromethane: ['二氯甲烷', 'Dichloromethane'],
  butane: ['正丁烷', 'Butane'],
  isobutane: ['异丁烷', 'Isobutane'],
  butene: ['1-丁烯', 'But-1-ene'],
  cyclobutane: ['环丁烷', 'Cyclobutane'],
  butyne: ['1-丁炔', 'But-1-yne'],
};
export default function ChemCarbonFrameworks() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [key, setKey] = useState(film.variant === 'sigma-pi-count' ? 'ethane' : 'methane'),
    [yaw, setYaw] = useState(0.55),
    [pitch, setPitch] = useState(0.25),
    [pair, setPair] = useState(0),
    [alignment, setAlignment] = useState(1),
    [pi, setPi] = useState(true),
    [graph, setGraph] = useState(0);
  const d = film.watch
    ? carbonDirector(film.chapter, film.chapterProgress)
    : {
        chapter:
          key === 'graphs'
            ? 6
            : key === 'dichloromethane'
              ? 4
              : key === 'ethane'
                ? 1
                : key === 'ethene'
                  ? 2
                  : key === 'ethyne'
                    ? 3
                    : 0,
        progress: 1,
        key,
        pair,
        alignment,
        yaw,
        pitch,
        showPi: pi,
        graph,
      };
  const m = carbonMolecule(d.key, d.pair, d.alignment),
    counts = bondCounts(m),
    g = FOUR_CARBON_GRAPHS[d.graph],
    hs = graphHydrogens(g.edges),
    formula = (s: string) => s.replace(/\d/g, (c) => '₀₁₂₃₄₅₆₇₈₉'[Number(c)]),
    title = names[d.chapter === 6 ? g.key : d.key];
  const points =
    g.key === 'cyclobutane'
      ? [
          [75, 65],
          [245, 65],
          [245, 210],
          [75, 210],
        ]
      : g.key === 'isobutane'
        ? [
            [160, 130],
            [65, 210],
            [255, 210],
            [160, 40],
          ]
        : [
            [40, 170],
            [120, 90],
            [200, 170],
            [280, 90],
          ];
  const span =
    d.key === 'butane' || d.key === 'isobutane'
      ? 6.8
      : d.key === 'dichloromethane'
        ? 5.2
        : d.key === 'methane'
          ? 4
          : 4.8;
  return (
    <section className="chem-carbon-frameworks">
      <div className="chem-carbon-title">
        <strong>{say(...title)}</strong>
        <span>{formula(d.chapter === 6 ? g.formula : m.formula)}</span>
      </div>
      {d.chapter === 6 ? (
        <>
          <svg
            className="chem-carbon-graph"
            viewBox="0 0 320 260"
            role="img"
            aria-label={say(
              '由碳四价计算氢数的结构示意',
              'Connectivity with hydrogen counts derived from carbon valence',
            )}
          >
            {g.edges.map(([a, b, order], i) => {
              const p = points[a],
                q = points[b],
                dx = q[0] - p[0],
                dy = q[1] - p[1],
                l = Math.hypot(dx, dy);
              return Array.from({ length: order }, (_, k) => (
                <line
                  key={`${i}-${k}`}
                  x1={p[0] + ((k - (order - 1) / 2) * 7 * dy) / l}
                  y1={p[1] - ((k - (order - 1) / 2) * 7 * dx) / l}
                  x2={q[0] + ((k - (order - 1) / 2) * 7 * dy) / l}
                  y2={q[1] - ((k - (order - 1) / 2) * 7 * dx) / l}
                  stroke="#a5b294"
                  strokeWidth="3"
                />
              ));
            })}
            {points.map(([x, y], i) => (
              <g key={i}>
                <rect x={x - 29} y={y - 17} width="58" height="34" rx="9" fill="#fafbf6" />
                <text x={x} y={y + 7} textAnchor="middle" fill="#5c704e" fontSize="24">
                  C{hs[i] > 0 ? 'H' : ''}
                  {hs[i] > 1 ? '₀₁₂₃₄'[hs[i]] : ''}
                </text>
              </g>
            ))}
          </svg>
          <div className="chem-carbon-evidence">
            {say('结构连接示意 · 非空间比例', 'Connectivity diagram · not spatial scale')}
          </div>
        </>
      ) : (
        <>
          <ChemMoleculeStudio
            key={d.key === 'dichloromethane' ? 'dichloro' : span}
            molecule={m}
            yaw={d.yaw}
            pitch={d.pitch}
            showPi={d.showPi}
            span={span}
          />
          <div className="chem-carbon-evidence">
            {d.chapter === 4
              ? `${say('氯位置组合', 'Cl-position choice')} ${d.pair + 1}/6 · ${Math.round(d.alignment * 100)}%`
              : d.key === 'methane'
                ? `109.47° · 4σ`
                : d.key === 'ethene'
                  ? `120° · ${counts.sigma}σ + ${counts.pi}π`
                  : d.key === 'ethyne'
                    ? `180° · ${counts.sigma}σ + ${counts.pi}π`
                    : `${counts.sigma}σ + ${counts.pi}π`}
          </div>
          <div className="chem-carbon-legend">
            {Object.entries(CHEM_ATOM_COLORS)
              .filter(([e]) => m.atoms.some((a) => a.element === e))
              .map(([e, c]) => (
                <span key={e}>
                  <i style={{ background: c }} />
                  {e}
                </span>
              ))}
            {d.showPi && counts.pi > 0 && (
              <span>
                <i style={{ background: '#7293bf' }} />
                π₁
              </span>
            )}
            {d.showPi && counts.pi > 1 && (
              <span>
                <i style={{ background: '#c49355' }} />
                π₂
              </span>
            )}
          </div>
        </>
      )}
      {!film.watch && (
        <div className="chem-carbon-controls">
          <Segments
            label={say('分子或骨架', 'Molecule or framework')}
            value={key}
            onChange={setKey}
            options={[
              ...[
                'methane',
                'ethane',
                'ethene',
                'ethyne',
                'dichloromethane',
                'butane',
                'isobutane',
              ].map((value) => ({ value, label: say(...names[value]) })),
              { value: 'graphs', label: say('四碳连接', 'C4 connectivity') },
            ]}
          />
          {key === 'graphs' ? (
            <Segments
              label={say('连接方式', 'Connectivity')}
              value={String(graph)}
              onChange={(v) => setGraph(Number(v))}
              options={FOUR_CARBON_GRAPHS.map((g, i) => ({
                value: String(i),
                label: say(...names[g.key]),
              }))}
            />
          ) : (
            <>
              <Range
                label={say('观察转角', 'Viewing yaw')}
                value={yaw}
                min={-1.6}
                max={1.6}
                step={0.02}
                onChange={setYaw}
              />
              <Range
                label={say('俯仰角', 'Viewing pitch')}
                value={pitch}
                min={-0.8}
                max={0.8}
                step={0.02}
                onChange={setPitch}
              />
              {key === 'dichloromethane' ? (
                <>
                  <Range
                    label={say('氯的顶点组合', 'Chlorine vertex choice')}
                    value={pair}
                    min={0}
                    max={5}
                    step={1}
                    onChange={setPair}
                  />
                  <Range
                    label={say('刚体旋转重合', 'Rigid-rotation alignment')}
                    value={alignment}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={setAlignment}
                  />
                </>
              ) : ['ethene', 'ethyne'].includes(key) ? (
                <Segments
                  label={say('π方向示意', 'Pi direction guides')}
                  value={pi ? 'on' : 'off'}
                  onChange={(v) => setPi(v === 'on')}
                  options={[
                    { value: 'on', label: say('显示', 'Show') },
                    { value: 'off', label: say('隐藏', 'Hide') },
                  ]}
                />
              ) : null}
            </>
          )}
          <details>
            <summary>{say('模型尺寸与适用范围', 'Dimensions and limits')}</summary>
            <p>
              {say(
                '采用教材层级理想键角与近似键长，不模拟热运动或能量优化。球半径、棍粗细和π示意体为教学比例；π体不是等密度面。四碳示例用于比较连接，并非穷尽所有四碳烃。',
                'Textbook-level ideal angles and approximate bond lengths omit thermal motion and energy optimization. Sphere radii, stick thickness and pi guides are illustrative; guides are not isodensity surfaces. C4 examples compare connectivity, not an exhaustive hydrocarbon catalog.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
