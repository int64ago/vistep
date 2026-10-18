import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  chlorineGasTrain,
  pipePosition,
  chlorineDiscoveryDirector,
  type PipePoint,
} from '../../models/chem-chlorine-discovery';
import '../../styles/chem-chlorine-discovery.css';
export default function ChemChlorineDiscovery() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState(film.variant === 'history' ? 'history' : 'train'),
    [throughput, setThroughput] = useState(2),
    [hydroxide, setHydroxide] = useState(8);
  const d = film.watch
    ? chlorineDiscoveryDirector(film.chapter, film.chapterProgress)
    : {
        history: view === 'history',
        element: true,
        throughput,
        hydroxide,
        ledger: true,
        progress: throughput / 4,
      };
  const m = chlorineGasTrain(d.throughput, d.hydroxide);
  const source = (
    <g>
      <path
        d="M91 42V123A56 56 0 1 0 129 123V42"
        stroke="#8b9b80"
        fill="#bbcdaf18"
        strokeWidth="2"
      />
      <path d="M61 175Q110 198 159 175A53 53 0 0 1 61 175Z" fill="#b8c7a0" opacity=".35" />
      <path d="M88 43H132V56H88Z" fill="#b5bfa5" />
      {Array.from({ length: 10 }, (_, i) => (
        <ellipse
          key={i}
          cx={76 + ((i * 11) % 68)}
          cy={203 + (i % 3) * 5}
          rx="6"
          ry="3"
          fill="#5f6857"
        />
      ))}
      <path d="M110 43V4" stroke="#91a181" strokeWidth="5" />
      <ellipse cx="110" cy="13" rx="14" ry="20" stroke="#91a181" fill="#d6dfcd" />
      <path d="M119 50V30H260" stroke="#91a181" fill="none" strokeWidth="4" />
      <path d="M84 232H136M110 232V248M80 249H140" stroke="#7d8e73" strokeWidth="3" />
      <path
        d="M110 244Q93 231 110 217Q127 231 110 244"
        fill="#d4b47d"
        opacity={d.throughput > 0 ? 0.8 : 0.2}
      />
      <text x="110" y="276" textAnchor="middle" fontSize="20" fill="#43563d">
        MnO₂ + HCl
      </text>
    </g>
  );
  const collector = (
    <g>
      <path
        d="M90 60V85L69 101V231H198V101L177 85V60"
        fill="#bccb8222"
        stroke="#8b9b80"
        strokeWidth="2"
      />
      <path d="M72 104H195V228H72Z" fill="#c2cb75" opacity={m.collected * 0.45} />
      <path d="M87 58H181V72H87Z" fill="#b4c0a2" />
      <path d="M0 30H109V215M158 62V30H260" fill="none" stroke="#91a181" strokeWidth="4" />
      <text x="134" y="276" textAnchor="middle" fontSize="20" fill="#43563d">
        Cl₂
      </text>
    </g>
  );
  const absorber = (
    <g>
      <path
        d="M70 101V225Q70 236 83 236H196Q209 236 209 225V101"
        fill="#b1c7af22"
        stroke="#8b9b80"
        strokeWidth="2"
      />
      <path d="M73 163H206V224Q206 233 196 233H83Q73 233 73 224Z" fill="#adc9b5" opacity=".3" />
      <path d="M0 30H128V219" fill="none" stroke="#91a181" strokeWidth="4" />
      {Array.from({ length: 6 }, (_, i) => (
        <circle
          key={i}
          cx={132 + ((i * 11) % 28)}
          cy={211 - ((i * 19 + d.progress * 43) % 45)}
          r={2 + (i % 2)}
          fill="none"
          stroke={m.unabsorbed > 0 ? '#ba8866' : '#a0b992'}
          opacity={Math.min(1, m.tail)}
        />
      ))}
      <text x="139" y="276" textAnchor="middle" fontSize="20" fill="#43563d">
        NaOH
      </text>
    </g>
  );
  const render = (mobile: boolean) => {
    // Phone composition uses a separate return tube below the two upper vessels;
    // the generator feed and collector outlet never join or bypass the collector.
    const points: PipePoint[] = mobile
      ? [
          [55.68, 46],
          [55.68, 31.6],
          [223.48, 31.6],
          [223.48, 164.8],
        ]
      : [
          [139, 80],
          [280, 80],
          [369, 80],
          [369, 265],
        ];
    const points2: PipePoint[] = mobile
      ? [
          [258.76, 54.64],
          [258.76, 31.6],
          [344, 31.6],
          [344, 228],
          [80, 228],
          [80, 266.6],
          [172.16, 266.6],
          [172.16, 402.68],
        ]
      : [
          [418, 110],
          [418, 80],
          [648, 80],
          [648, 269],
        ];
    return (
      <svg
        className={mobile ? 'chem-chlorine-mobile' : 'chem-chlorine-desktop'}
        viewBox={mobile ? '0 0 360 460' : '0 0 800 350'}
        role="img"
        aria-label={say(
          '连续导管连接发生瓶、集气瓶与氢氧化钠尾气吸收杯',
          'Continuous tubing connects the generator, collecting jar and sodium hydroxide tail-gas absorber',
        )}
      >
        <g transform={mobile ? 'translate(-30,10) scale(.72)' : 'translate(20,50)'}>{source}</g>
        <g transform={mobile ? 'translate(145,10) scale(.72)' : 'translate(260,50)'}>{collector}</g>
        <g transform={mobile ? 'translate(80,245) scale(.72)' : 'translate(520,50)'}>{absorber}</g>
        {mobile && (
          <>
            <path d="M332.2 31.6H344V228H80V266.6" fill="none" stroke="#91a181" strokeWidth="4" />
          </>
        )}
        {d.throughput > 0 &&
          [points, points2].map((ps, j) =>
            Array.from({ length: 7 }, (_, i) => {
              const q = pipePosition(ps, (i / 7 + d.progress * 0.6) % 1);
              return (
                <circle
                  key={`${j}-${i}`}
                  cx={q.x}
                  cy={q.y}
                  r="3.5"
                  fill="#bbc770"
                  opacity={j === 0 ? 1 : Math.min(1, m.tail)}
                />
              );
            }),
          )}
      </svg>
    );
  };
  return (
    <section className="chem-chlorine-discovery" data-watch={film.watch}>
      {d.history ? (
        <div className="chem-chlorine-history">
          <div>
            <strong>1774</strong>
            <span>{say('舍勒', 'Scheele')}</span>
            <p>{say('获得黄绿色气体', 'A yellow-green gas is obtained')}</p>
          </div>
          <svg viewBox="0 0 220 240" aria-hidden="true">
            <path
              d="M65 35V65L42 88V210H178V88L155 65V35Z"
              fill="#c3cd7b55"
              stroke="#90a080"
              strokeWidth="2"
            />
            <ellipse cx="110" cy="35" rx="45" ry="7" fill="#d9deca" stroke="#90a080" />
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i} transform={`translate(${65 + ((i * 23) % 90)},${100 + ((i * 17) % 85)})`}>
                <circle r="4" fill="#9eb169" />
                <circle cx="7" r="4" fill="#9eb169" />
              </g>
            ))}
          </svg>
          <div className={d.element ? '' : 'is-unrevealed'}>
            <strong>1810</strong>
            <span>{say('戴维', 'Davy')}</span>
            <p>{say('确认氯的元素身份', 'Chlorine is recognized as an element')}</p>
          </div>
        </div>
      ) : (
        <>
          {render(false)}
          {render(true)}
          <div className="chem-chlorine-pathlabels">
            <span>{say('发生', 'Generation')}</span>
            <span>{say('收集', 'Collection')}</span>
            <span>{say('吸收尾气', 'Tail-gas absorption')}</span>
          </div>
          {d.ledger && (
            <div className="chem-chlorine-ledger">
              <span>Cl₂ + 2OH⁻ → Cl⁻ + ClO⁻ + H₂O</span>
              <div>
                <span>
                  {say('收集瓶内', 'In collector')} <b>{m.collected.toFixed(2)}</b>
                </span>
                <span>
                  {say('已吸收', 'Absorbed')} <b>{m.absorbed.toFixed(2)}</b>
                </span>
                <span>
                  {say('未吸收尾气', 'Unabsorbed tail gas')} <b>{m.unabsorbed.toFixed(2)}</b>
                </span>
              </div>
              <small>
                {say('相对气体量 · 理想混合模型', 'Relative gas amount · ideal mixing model')}
              </small>
            </div>
          )}
        </>
      )}
      {!film.watch && (
        <div className="chem-chlorine-controls">
          <Segments
            label={say('视图', 'View')}
            value={view}
            options={[
              { value: 'history', label: say('发现与解释', 'Discovery') },
              { value: 'train', label: say('装置路径', 'Apparatus path') },
            ]}
            onChange={setView}
          />
          {view === 'train' && (
            <>
              <Range
                label={say('累计通过量（相对单位）', 'Total throughput (relative units)')}
                value={throughput}
                min={0}
                max={4}
                step={0.05}
                onChange={setThroughput}
              />
              <Range
                label={say('吸收液OH⁻容量（相对单位）', 'Absorber OH⁻ capacity (relative units)')}
                value={hydroxide}
                min={0}
                max={8}
                step={0.1}
                onChange={setHydroxide}
              />
              <p>
                {say(
                  '理想充分混合收集瓶、瞬时吸收反应；不模拟真实流速、反应条件或装置效率。',
                  'Ideal well-mixed collector and instantaneous absorption; actual flow rate, reaction conditions and apparatus efficiency are not simulated.',
                )}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
