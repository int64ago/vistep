import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ELEMENT_SYMBOLS,
  PERIOD_3,
  periodicCell,
  periodicDirector,
  orbitalOccupancy,
  trendData,
} from '../../models/chem-periodic-patterns';
import '../../styles/chem-periodic-patterns.css';
const colors = { s: '#bca882', p: '#9daf7f', d: '#8aabab', ds: '#759d94', f: '#b1a2bc' };
export default function ChemPeriodicPatterns() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState(
      film.variant === 'electronegativity'
        ? 'trend'
        : film.variant === 'electron-filling'
          ? 'filling'
          : 'table',
    ),
    [z, setZ] = useState(11),
    [expanded, setExpanded] = useState(0),
    [group, setGroup] = useState<'period' | 'alkali' | 'halogen'>('period'),
    [metric, setMetric] = useState<'en' | 'ie'>('en'),
    [exception, setException] = useState('Cr');
  const d = film.watch
    ? periodicDirector(film.chapter, film.chapterProgress)
    : {
        chapter: view === 'table' ? 1 : view === 'filling' ? 2 : view === 'exceptions' ? 3 : 7,
        progress: 1,
        z,
        expanded,
        group,
        metric,
        exception,
      };
  const cell = periodicCell(d.z, d.expanded),
    element = PERIOD_3[Math.max(0, Math.min(7, d.z - 11))],
    data = trendData(d.group, d.metric),
    active = Math.min(data.length - 1, Math.floor(d.progress * data.length));
  const boxes = (n: number, slots: number, label: string) => (
    <div className="chem-periodic-subshell">
      <span>{label}</span>
      <div>
        {orbitalOccupancy(n, slots).map((k, i) => (
          <i key={i}>{k === 2 ? '↑↓' : k === 1 ? '↑' : ''}</i>
        ))}
      </div>
    </div>
  );
  return (
    <section className="chem-periodic-patterns">
      {d.chapter < 2 ? (
        <>
          <div className="chem-periodic-selected">
            <strong>{cell.symbol}</strong>
            <span>
              Z = {cell.z} · {say('第', 'Period ')}
              {cell.period}
              {say('周期', '')} · {cell.block}
            </span>
          </div>
          <svg
            className="chem-periodic-map"
            viewBox="0 0 350 210"
            role="img"
            aria-label={say(
              '同一118种元素在18列与32列形式之间重新排列',
              'The same118 elements rearrange between18-column and32-column forms',
            )}
          >
            {ELEMENT_SYMBOLS.map((_, i) => {
              const c = periodicCell(i + 1, d.expanded),
                w = 330 / c.columns;
              return (
                <rect
                  key={i}
                  x={10 + c.x * w}
                  y={10 + c.y * 20}
                  width={w - 2}
                  height={16}
                  rx="2"
                  fill={colors[c.block]}
                  opacity={c.z === d.z ? 1 : 0.58}
                  stroke={c.z === d.z ? '#465c42' : 'none'}
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          <div className="chem-periodic-map-label">
            {d.expanded < 0.5
              ? say('18列 · f区抽出', '18 columns · f block detached')
              : say('32列 · f区展开', '32 columns · f block expanded')}
          </div>
          <div className="chem-periodic-legend">
            {Object.entries(colors).map(([b, c]) => (
              <span key={b}>
                <i style={{ background: c }} />
                {b}
              </span>
            ))}
          </div>
        </>
      ) : d.chapter === 2 ? (
        <>
          <div className="chem-periodic-selected">
            <strong>{element.symbol}</strong>
            <span>Z = {element.z}</span>
          </div>
          <div className="chem-periodic-electron-core">[Ne]</div>
          {boxes(element.s, 1, '3s')}
          {boxes(element.p, 3, '3p')}
          <div className="chem-periodic-small-elements">
            {PERIOD_3.map((e) => (
              <span key={e.symbol} data-active={e.symbol === element.symbol}>
                {e.symbol}
              </span>
            ))}
          </div>
        </>
      ) : d.chapter === 3 ? (
        <>
          <div className="chem-periodic-selected">
            <strong>{d.exception}</strong>
            <span>{say('实测基态排布', 'Observed ground configuration')}</span>
          </div>
          <div className="chem-periodic-electron-core">[Ar]</div>
          {boxes(d.exception === 'Cr' ? 5 : 10, 5, '3d')}
          {boxes(1, 1, '4s')}
          <div className="chem-periodic-map-label">
            {d.exception === 'Cr' ? '[Ar] 3d⁵ 4s¹' : '[Ar] 3d¹⁰ 4s¹'}
          </div>
        </>
      ) : (
        <>
          <div className="chem-periodic-metric">
            {d.metric === 'en'
              ? say('电负性 · 教材标度', 'Electronegativity · textbook scale')
              : say('第一电离能 · kJ/mol', 'First ionization energy · kJ/mol')}
          </div>
          <div className="chem-periodic-bars">
            {data.map((e, i) => (
              <div key={e.symbol} data-active={i === active} className="chem-periodic-bar">
                <span>{e.symbol}</span>
                <div>
                  <i
                    style={{
                      width: `${e.value === null ? 0 : (e.value / (d.metric === 'en' ? 4 : 1800)) * 100}%`,
                      opacity: film.watch && i > active ? 0.28 : 1,
                    }}
                  />
                </div>
                <b>
                  {e.value === null
                    ? '—'
                    : d.metric === 'en'
                      ? e.value.toFixed(1)
                      : Math.round(e.value)}
                </b>
              </div>
            ))}
          </div>
          <div className="chem-periodic-trend-key">
            {d.metric === 'ie' && d.group === 'period'
              ? 'Mg > Al · P > S'
              : d.group === 'alkali'
                ? 'Li → Na → K → Rb → Cs'
                : d.group === 'halogen'
                  ? 'F → Cl → Br → I'
                  : 'Na → Ar'}
          </div>
        </>
      )}
      {!film.watch && (
        <div className="chem-periodic-controls">
          <Segments
            label={say('观察对象', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'table', label: say('周期表', 'Table') },
              { value: 'filling', label: say('排布', 'Filling') },
              { value: 'exceptions', label: 'Cr / Cu' },
              { value: 'trend', label: say('数据', 'Data') },
            ]}
          />
          {view === 'table' ? (
            <>
              <Range
                label={say('原子序数', 'Atomic number')}
                value={z}
                min={1}
                max={118}
                step={1}
                onChange={setZ}
              />
              <Range
                label={say('展开f区', 'Unfold the f block')}
                value={expanded}
                min={0}
                max={1}
                step={0.01}
                onChange={setExpanded}
              />
            </>
          ) : view === 'filling' ? (
            <Range
              label={say('第三周期原子序数', 'Period3 atomic number')}
              value={Math.max(11, Math.min(18, z))}
              min={11}
              max={18}
              step={1}
              onChange={setZ}
            />
          ) : view === 'exceptions' ? (
            <Segments
              label={say('元素', 'Element')}
              value={exception}
              onChange={setException}
              options={[
                { value: 'Cr', label: 'Cr' },
                { value: 'Cu', label: 'Cu' },
              ]}
            />
          ) : (
            <>
              <Segments
                label={say('比较范围', 'Comparison')}
                value={group}
                onChange={(v) => setGroup(v as typeof group)}
                options={[
                  { value: 'period', label: say('第三周期', 'Period3') },
                  { value: 'alkali', label: say('第ⅠA族', 'Group1') },
                  { value: 'halogen', label: say('第ⅦA族', 'Group17') },
                ]}
              />
              <Segments
                label={say('性质', 'Property')}
                value={metric}
                onChange={(v) => setMetric(v as typeof metric)}
                options={[
                  { value: 'en', label: say('电负性', 'Electronegativity') },
                  { value: 'ie', label: say('电离能', 'Ionization') },
                ]}
              />
            </>
          )}
          <details>
            <summary>{say('数据与模型边界', 'Data and model limits')}</summary>
            <p>
              {say(
                '电负性照录教材一位小数，空白不等于零；电离能采用NIST气态基态原子数据。周期表展开仅改变布局，不裁定第三族归属。箭头表示自旋占据，不表示电子飞行路线。',
                'Electronegativity follows textbook rounding; missing is not zero. NIST ionization energies concern gaseous ground-state atoms. Unfolding changes layout without settling group3 conventions. Arrows denote spin occupancy, not flight paths.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
