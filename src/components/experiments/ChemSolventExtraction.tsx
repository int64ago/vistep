import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  liquidPartition,
  repeatedExtraction,
  drainFunnel,
  solidExtraction,
  extractionDirector,
  funnelLevel,
  funnelShape,
  funnelWidth,
} from '../../models/chem-solvent-extraction';
import '../../styles/chem-solvent-extraction.css';
export default function ChemSolventExtraction() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState('partition'),
    [ratio, setRatio] = useState(4),
    [heavy, setHeavy] = useState('light'),
    [p, setP] = useState(0.6),
    [vent, setVent] = useState('open'),
    [valve, setValve] = useState('open'),
    [portions, setPortions] = useState(3);
  const d = film.watch
    ? extractionDirector(film.chapter, film.chapterProgress)
    : {
        ...extractionDirector(
          view === 'repeat' ? 5 : view === 'solid' ? 6 : view === 'drain' ? 3 : 1,
          p,
        ),
        ratio,
        transfer: p,
        heavy: heavy === 'heavy',
        vented: vent === 'open',
        drain: p,
        portions,
      };
  const m = liquidPartition(d.ratio, 50),
    a = repeatedExtraction(d.ratio, 50, 1),
    b = repeatedExtraction(d.ratio, 50, d.portions),
    dr = drainFunnel(d.ratio, d.heavy, d.drain, d.vented, film.watch || valve === 'open'),
    s = solidExtraction(d.p);
  const names = [
    say('两种不互溶的液体', 'Two immiscible liquids'),
    say('溶质在两相间分配', 'Solute distributes between phases'),
    say('下层不一定是水', 'The lower layer is not always water'),
    say('先分配，再分液', 'Distribute, then separate'),
    say('空气补入才能顺畅流出', 'Air entry permits sustained outflow'),
    say('同样总溶剂，分次接触', 'Fresh portions, same total solvent'),
    say('也可以从固体中溶出', 'A solvent can extract from a solid'),
  ];
  return (
    <section className="chem-extract">
      <div className="chem-extract-title">{names[d.chapter]}</div>
      {d.chapter <= 4 ? (
        <>
          {d.chapter === 2 ? (
            <div className="chem-extract-density">
              {[false, true].map((h) => (
                <div key={String(h)}>
                  <span>
                    {h ? say('有机相较重', 'Denser organic') : say('有机相较轻', 'Lighter organic')}
                  </span>
                  <Funnel
                    heavy={h}
                    ratio={d.ratio}
                    transfer={1}
                    drain={0}
                    vented={false}
                    valve={false}
                    compact
                  />
                </div>
              ))}
            </div>
          ) : (
            <Funnel
              heavy={d.heavy}
              ratio={d.ratio}
              transfer={d.transfer}
              drain={d.drain}
              vented={d.vented}
              valve={film.watch ? d.chapter >= 3 : valve === 'open'}
            />
          )}
          {d.chapter <= 2 ? (
            <div className="chem-extract-account">
              <span>
                {say('有机相溶质', 'Organic solute')}
                <b>{(100 * m.organic * d.transfer).toFixed(1)}%</b>
              </span>
              <span>
                {say('水相溶质', 'Water solute')}
                <b>{(100 * (1 - m.organic * d.transfer)).toFixed(1)}%</b>
              </span>
            </div>
          ) : (
            <div className="chem-extract-account">
              <span>
                {say('已流出液体', 'Drained liquid')}
                <b>{dr.drained.toFixed(1)} mL</b>
              </span>
              <span>
                {say('顶空气压', 'Headspace')}
                <b>{(dr.headPressure / 1000).toFixed(1)} kPa</b>
              </span>
            </div>
          )}
        </>
      ) : null}
      {d.chapter === 5 ? (
        <>
          <div className="chem-extract-repeat">
            <div>
              <span>{say('一次接触', 'One contact')}</span>
              <Meter value={a.recovered} />
              <b>{(100 * a.recovered).toFixed(1)}%</b>
            </div>
            <div>
              <span>
                {d.portions}
                {say('次新鲜溶剂', ' fresh portions')}
              </span>
              <Meter value={b.recovered} />
              <b>{(100 * b.recovered).toFixed(1)}%</b>
            </div>
          </div>
          <div className="chem-extract-sequence">
            {b.extracts.map((v, i) => (
              <div key={i} style={{ opacity: d.p > (i / d.portions) * 0.8 ? 1 : 0.25 }}>
                <span>{i + 1}</span>
                <i style={{ height: (80 * v) / b.extracts[0] + 8 }} />
                <b>{(100 * v).toFixed(1)}%</b>
              </div>
            ))}
          </div>
          <div className="chem-extract-note">
            {say('累计萃取份额；总溶剂相同', 'Recovered solute; equal total solvent')}
          </div>
        </>
      ) : null}
      {d.chapter === 6 ? (
        <>
          <svg
            className="chem-extract-solid"
            viewBox="0 0 320 235"
            role="img"
            aria-label={names[6]}
          >
            <path
              d="M45 30V211Q45 220 55 220H265Q275 220 275 211V30"
              fill="#e7ede1"
              stroke="#a2b3a2"
              strokeWidth="2"
            />
            <path d="M48 76H272V211Q272 217 265 217H55Q48 217 48 211Z" fill="#c4ceaa" />
            <g>
              {Array.from({ length: 20 }, (_, i) => (
                <circle
                  key={i}
                  cx={76 + (i % 5) * 41}
                  cy={163 + Math.floor(i / 5) * 12}
                  r="10"
                  fill="#ad9c7d"
                />
              ))}
            </g>
            {Array.from({ length: 30 }, (_, i) => {
              const q = Math.min(1, d.p * 0.75),
                move = i / 30 < q,
                px = 76 + (i % 5) * 41,
                py = 161 + Math.floor(i / 5) * 9;
              return (
                <circle
                  key={i}
                  cx={move ? 67 + (i % 6) * 36 : px}
                  cy={move ? 96 + Math.floor(i / 6) * 12 : py}
                  r="3"
                  fill="#b07c63"
                />
              );
            })}
            <text x="160" y="56" textAnchor="middle" fontSize="21" fill="#7b906d">
              {say('溶剂', 'Solvent')}
            </text>
          </svg>
          <div className="chem-extract-account">
            <span>
              {say('已溶出', 'Dissolved')}
              <b>{(100 * s.dissolved).toFixed(1)}%</b>
            </span>
            <span>
              {say('仍在固体', 'In the solid')}
              <b>{(100 * s.residualSolute).toFixed(1)}%</b>
            </span>
          </div>
        </>
      ) : null}
      {d.chapter < 5 ? (
        <div className="chem-extract-legend">
          <span>
            <i style={{ background: '#c6d2ae' }} />
            {say('有机相', 'Organic')}
          </span>
          <span>
            <i style={{ background: '#bdd7d2' }} />
            {say('水相', 'Water')}
          </span>
          <span>
            <i style={{ background: '#b07c63' }} />
            {say('溶质', 'Solute')}
          </span>
        </div>
      ) : null}
      {!film.watch ? (
        <div className="chem-extract-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'partition', label: say('分配', 'Partition') },
              { value: 'drain', label: say('分液', 'Drain') },
              { value: 'repeat', label: say('分次', 'Portions') },
              { value: 'solid', label: say('固液', 'Solid–liquid') },
            ]}
          />
          <Range
            label={say('模型进度', 'Model progress')}
            min={0}
            max={1}
            step={0.01}
            value={p}
            onChange={setP}
          />
          {view !== 'solid' ? (
            <Range
              label={say('分配比 D（选定值）', 'Chosen distribution ratio D')}
              min={0.1}
              max={10}
              step={0.1}
              value={ratio}
              onChange={setRatio}
            />
          ) : null}
          {view === 'partition' || view === 'drain' ? (
            <Segments
              label={say('相对密度', 'Relative density')}
              value={heavy}
              onChange={setHeavy}
              options={[
                { value: 'light', label: say('有机相较轻', 'Organic lighter') },
                { value: 'heavy', label: say('有机相较重', 'Organic denser') },
              ]}
            />
          ) : null}
          {view === 'drain' ? (
            <>
              <Segments
                label={say('上口', 'Upper opening')}
                value={vent}
                onChange={setVent}
                options={[
                  { value: 'open', label: say('通气', 'Vented') },
                  { value: 'closed', label: say('封闭', 'Sealed') },
                ]}
              />
              <Segments
                label={say('下活塞', 'Lower stopcock')}
                value={valve}
                onChange={setValve}
                options={[
                  { value: 'open', label: say('打开', 'Open') },
                  { value: 'closed', label: say('关闭', 'Closed') },
                ]}
              />
            </>
          ) : null}
          {view === 'repeat' ? (
            <Range
              label={say('新鲜溶剂份数', 'Fresh solvent portions')}
              min={1}
              max={6}
              step={1}
              value={portions}
              onChange={setPortions}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
function Meter({ value }: { value: number }) {
  return (
    <div className="chem-extract-meter">
      <i style={{ width: `${value * 100}%` }} />
    </div>
  );
}
function Funnel({
  heavy,
  ratio,
  transfer,
  drain,
  vented,
  valve,
  compact = false,
}: {
  heavy: boolean;
  ratio: number;
  transfer: number;
  drain: number;
  vented: boolean;
  valve: boolean;
  compact?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    m = liquidPartition(ratio, 50),
    d = drainFunnel(ratio, heavy, drain, vented, valve),
    top = funnelLevel(d.remainingVolume),
    split = funnelLevel(d.lowerVolume),
    lower = heavy ? '#c6d2ae' : '#bdd7d2',
    upper = heavy ? '#bdd7d2' : '#c6d2ae',
    orgFraction = m.organic * transfer,
    organicDots = Math.ceil(30 * orgFraction),
    lowerDots = heavy ? organicDots : 30 - organicDots,
    collectedDots = Math.floor((lowerDots * d.drained) / (heavy ? 50 : 100));
  return (
    <svg
      className="chem-extract-funnel"
      viewBox={compact ? '90 0 140 220' : '35 0 250 305'}
      role="img"
      aria-label={
        en
          ? 'Separatory funnel, two layers, stopcock and receiver'
          : '分液漏斗、两液层、活塞与接收器'
      }
    >
      <defs>
        <clipPath id={id}>
          <path d={funnelShape} />
        </clipPath>
      </defs>
      <path d={funnelShape} fill="#f0f3e9" stroke="#a0b2a1" strokeWidth="2" />
      <g clipPath={`url(#${id})`}>
        <path d={`M80 ${top}H240V${split}H80Z`} fill={upper} />
        <path d={`M80 ${split}H240V212H80Z`} fill={lower} />
        {Array.from({ length: 30 }, (_, i) => {
          const org = i / 30 < orgFraction,
            lowerPoint = org === heavy,
            lo = lowerPoint ? split : top,
            hi = lowerPoint ? 190 : split,
            y = lo + (hi - lo) * (0.2 + (Math.floor(i / 6) % 5) * 0.15),
            x = 160 + ((i % 6) - 2.5) * funnelWidth(y) * 0.28;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2.4"
              fill="#b07c63"
              opacity={lowerPoint && (heavy ? i : i - organicDots) < collectedDots ? 0 : 1}
            />
          );
        })}
      </g>
      <path d="M145 199H176" stroke="#99a998" strokeWidth="8" strokeLinecap="round" />
      <path d={valve ? 'M160 190V207' : 'M152 199H168'} stroke="#798e7b" strokeWidth="3" />
      {vented ? (
        <>
          <rect x="178" y="3" width="21" height="13" rx="3" fill="#b4b59a" />
          <path d="M160 0V15m-5-6 5 6 5-6" stroke="#8baab0" strokeWidth="2" fill="none" />
        </>
      ) : (
        <rect x="149" y="10" width="22" height="14" rx="3" fill="#b4b59a" />
      )}
      {!compact ? (
        <>
          <path
            d="M117 241V291Q117 299 125 299H195Q203 299 203 291V241"
            fill="#eef2e8"
            stroke="#a0b2a1"
            strokeWidth="2"
          />
          <rect
            x="120"
            y={296 - (55 * d.drained) / 100}
            width="80"
            height={(55 * d.drained) / 100}
            fill={lower}
          />
          {Array.from({ length: collectedDots }, (_, i) => (
            <circle
              key={i}
              cx={130 + (i % 6) * 12}
              cy={296 - ((55 * d.drained) / 100) * (0.25 + Math.floor(i / 6) * 0.17)}
              r="2.4"
              fill="#b07c63"
            />
          ))}
          {valve && vented && d.drained > 0 && drain < 1 ? (
            <path d={`M160 211V${296 - (55 * d.drained) / 100}`} stroke={lower} strokeWidth="4" />
          ) : null}
          <text x="228" y={(top + split) / 2 + 6} fontSize="19" fill="#809474">
            {heavy ? (en ? 'water' : '水相') : en ? 'org.' : '有机相'}
          </text>
          <text x="228" y={(split + 190) / 2 + 6} fontSize="19" fill="#809999">
            {heavy ? (en ? 'org.' : '有机相') : en ? 'water' : '水相'}
          </text>
        </>
      ) : null}
    </svg>
  );
}
