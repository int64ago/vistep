import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  bondEnergyBook,
  carbonHess,
  bondDirector,
  trackedBondAtoms,
} from '../../models/chem-bond-energy';
import '../../styles/chem-bond-energy.css';
export default function ChemBondEnergy() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState(film.variant === 'hess-carbon' ? 'hess' : 'bonds'),
    [progress, setProgress] = useState(1),
    [extent, setExtent] = useState(1),
    [reverse, setReverse] = useState(false);
  const d = film.watch
    ? bondDirector(film.chapter, film.chapterProgress)
    : { chapter: view === 'hess' ? 5 : 3, progress, bookProgress: progress, pathProgress: 1 };
  const n = film.watch ? 1 : extent,
    b = bondEnergyBook(d.bookProgress, n),
    h = carbonHess(n, film.watch ? false : reverse),
    atoms = trackedBondAtoms(d.bookProgress);
  const names = [
    ['原子相同，连接不同', 'Same atoms, different bonds'],
    ['断键需要能量', 'Breaking bonds takes energy'],
    ['成键释放能量', 'Forming bonds releases energy'],
    ['比较两项收支', 'Compare the two energy terms'],
    ['两条途径，同一始末态', 'Two routes, the same endpoints'],
    ['把中间物种消去', 'Cancel the intermediate'],
  ];
  const fmt = (v: number) => `${v > 0 ? '+' : ''}${Number(v.toFixed(1))}`;
  const coefficient = (v: number, symbol: string) =>
    `${v === 1 ? '' : Number(v.toFixed(2))}${symbol}`;
  const c = coefficient(n, 'C(s)'),
    o = coefficient(n, 'O₂(g)'),
    halfO = coefficient(n / 2, 'O₂(g)'),
    co = coefficient(n, 'CO(g)'),
    co2 = coefficient(n, 'CO₂(g)');
  const y = (energy: number) => 42 - (energy * 0.44) / Math.max(n, 0.0001);
  return (
    <section className="chem-bond-energy">
      <div className="chem-bond-heading">{say(names[d.chapter][0], names[d.chapter][1])}</div>
      {d.chapter < 4 ? (
        <>
          <svg
            className="chem-bond-atoms"
            viewBox="0 0 320 165"
            aria-label={say(
              '同一组两个氢原子和两个氯原子，先记断键再记形成两份氯化氢',
              'The same two hydrogen and two chlorine atoms are tracked through bond-breaking and bond-forming accounts',
            )}
            role="img"
          >
            {[
              [0, 1, 1 - b.broken],
              [2, 3, 1 - b.broken],
              [0, 2, b.formed],
              [1, 3, b.formed],
            ].map(([a, c, opacity], i) => (
              <line
                key={i}
                x1={atoms[a].x}
                y1={atoms[a].y}
                x2={atoms[c].x}
                y2={atoms[c].y}
                stroke="#a2af9d"
                strokeWidth="5"
                strokeLinecap="round"
                opacity={opacity * (n > 0 ? 1 : 0)}
              />
            ))}
            {atoms.map((a) => (
              <g key={a.id} opacity={n > 0 ? 1 : 0}>
                <circle
                  cx={a.x}
                  cy={a.y}
                  r={a.element === 'H' ? 15 : 22}
                  fill={a.element === 'H' ? '#e6e9dc' : '#bac9ad'}
                  stroke={a.element === 'H' ? '#bfc9b3' : '#a4b594'}
                  strokeWidth="1.5"
                />
                <circle
                  cx={a.x - 4}
                  cy={a.y - 6}
                  r={a.element === 'H' ? 7 : 10}
                  fill="#f6f8eb"
                  opacity=".25"
                />
                <text x={a.x} y={a.y + 6.5} textAnchor="middle" fontSize="21" fill="#708260">
                  {a.element}
                </text>
              </g>
            ))}
          </svg>
          <div className="chem-bond-ledger">
            <div>
              <span>{say('断键吸收', 'Bond breaking')}</span>
              <i style={{ width: `${(b.input / 1724) * 100}%` }} />
              <strong>+{b.input.toFixed(0)} kJ</strong>
            </div>
            <div>
              <span>{say('成键释放', 'Bond forming')}</span>
              <i className="release" style={{ width: `${(b.output / 1724) * 100}%` }} />
              <strong>−{b.output.toFixed(0)} kJ</strong>
            </div>
          </div>
          {d.chapter >= 3 && <div className="chem-bond-net">ΔH ≈ {fmt(b.net)} kJ</div>}
          <div className="chem-bond-note">
            {say(
              '教材近似数值 · 假想能量账本',
              'Textbook approximations · hypothetical energy account',
            )}
          </div>
        </>
      ) : d.chapter === 4 ? (
        <>
          <svg
            className="chem-bond-hess"
            viewBox="0 0 320 270"
            aria-label={say(
              '石墨和氧气到二氧化碳的直接路径与经一氧化碳的分步路径',
              'Direct and carbon-monoxide routes from graphite and oxygen to carbon dioxide',
            )}
            role="img"
          >
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <path d={`M68 ${y(h.levels[i])}H252`} stroke="#c0cbb6" strokeWidth="2" />
                <text
                  x="160"
                  y={y(h.levels[i]) - 10}
                  textAnchor="middle"
                  fontSize="20"
                  fill="#738567"
                >
                  {['C(s) + O₂(g)', 'CO(g) + ½O₂(g)', 'CO₂(g)'][i]}
                </text>
              </g>
            ))}
            <path
              d={`M44 ${y(0)}V${y(h.levels[2])}m-6-11 6 11 6-11`}
              stroke="#bcae8c"
              strokeWidth="3"
              fill="none"
              pathLength="1"
              strokeDasharray={`${Math.min(1, d.pathProgress * 2)} 1`}
            />
            <path
              d={`M276 ${y(0)}V${y(h.levels[1])}m-6-10 6 10 6-10M276 ${y(h.levels[1]) + 10}V${y(h.levels[2])}m-6-10 6 10 6-10`}
              stroke="#9bb5aa"
              strokeWidth="3"
              fill="none"
              pathLength="1"
              strokeDasharray={`${Math.max(0, d.pathProgress * 2 - 1)} 1`}
            />
            <circle
              cx="44"
              cy={y(h.levels[2] * Math.min(1, d.pathProgress * 2))}
              r="5"
              fill="#bcae8c"
            />
            <text x="160" y="252" textAnchor="middle" fontSize="20" fill="#8b9b7f">
              ΔH = −393.5 kJ
            </text>
          </svg>
          <div className="chem-bond-note">
            {say('C(s)为石墨 · 同温度与状态', 'C(s) is graphite · same temperature and states')}
          </div>
        </>
      ) : (
        <>
          <div className="chem-bond-equations">
            <div>
              <span>{h.reverse ? `${co} → ${c} + ${halfO}` : `${c} + ${halfO} → ${co}`}</span>
              <b>{film.watch && d.progress < 0.45 ? '?' : fmt(h.unknown)} kJ</b>
            </div>
            <div>
              <span>{h.reverse ? `${co2} → ${co} + ${halfO}` : `${co} + ${halfO} → ${co2}`}</span>
              <b>{fmt(h.second.enthalpy)} kJ</b>
            </div>
            <div className="chem-bond-cancel">
              <span>{say('CO生成量 + CO消耗量', 'CO formed + CO consumed')}</span>
              <strong>
                {fmt(h.first.coefficients.CO)} {fmt(h.second.coefficients.CO)} ={' '}
                {h.sum.coefficients.CO}
              </strong>
            </div>
            <div
              className="chem-bond-total"
              style={{ opacity: film.watch ? 0.35 + 0.65 * d.progress : 1 }}
            >
              <span>{h.reverse ? `${co2} → ${c} + ${o}` : `${c} + ${o} → ${co2}`}</span>
              <b>{fmt(h.sum.enthalpy)} kJ</b>
            </div>
          </div>
          <div className="chem-bond-note">
            {say('能量相加，反应式也相加', 'Add the energies and the reaction equations')}
          </div>
        </>
      )}
      {!film.watch && (
        <div className="chem-bond-controls">
          <Segments
            label={say('账本', 'Account')}
            value={view}
            onChange={setView}
            options={[
              { value: 'bonds', label: say('断键与成键', 'Bond energies') },
              { value: 'hess', label: say('盖斯路径', 'Hess paths') },
            ]}
          />
          <Range
            label={say('反应进度量 / mol', 'Reaction extent / mol')}
            value={extent}
            min={0}
            max={2}
            step={0.1}
            onChange={setExtent}
          />
          {view === 'bonds' ? (
            <Range
              label={say('能量账本步骤', 'Energy-account progress')}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              onChange={setProgress}
            />
          ) : (
            <Segments
              label={say('方向', 'Direction')}
              value={String(reverse)}
              onChange={(v) => setReverse(v === 'true')}
              options={[
                { value: 'false', label: say('正向', 'Forward') },
                { value: 'true', label: say('反向', 'Reverse') },
              ]}
            />
          )}
          <details>
            <summary>{say('模型含义与数值边界', 'Meaning and numerical limits')}</summary>
            <p>
              {say(
                '原子图是通过假想孤立原子态核对收支，不是氢氯反应的实际基元机理或活化能曲线。教材键能近似给出−183kJ；现代标准生成焓会给出略有不同的数值。盖斯相加要求温度、相态与物质状态一致。',
                'The atom diagram uses a hypothetical separated-atom state to check energy, not the elementary mechanism or activation-energy curve of hydrogen and chlorine. Textbook bond approximations give−183kJ; modern standard formation enthalpies differ slightly. Hess addition requires consistent temperature, phases and states.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
