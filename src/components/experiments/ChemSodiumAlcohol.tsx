import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  sodiumProtic,
  compareSodium,
  hydrogenProductTest,
  sodiumAlcoholDirector,
} from '../../models/chem-sodium-alcohol';
import '../../styles/chem-sodium-alcohol.css';
export default function ChemSodiumAlcohol() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState(
      film.variant === 'water-ethanol-comparison' ? 'compare' : 'ethanol',
    ),
    [progress, setProgress] = useState(0.55),
    [sodium, setSodium] = useState(2),
    [donors, setDonors] = useState(2);
  const d = film.watch
    ? sodiumAlcoholDirector(film.chapter, film.chapterProgress)
    : {
        chapter: view === 'compare' ? 4 : view === 'structure' ? 3 : 0,
        progress,
        reactionProgress: progress,
        burnProgress: 0,
        compareTime: progress,
      };
  const m = sodiumProtic(
      'ethanol',
      d.reactionProgress,
      film.watch || view === 'structure' ? 2 : sodium,
      film.watch || view === 'structure' ? 2 : donors,
    ),
    comparison = compareSodium(d.compareTime, film.watch ? 2 : sodium, film.watch ? 2 : donors),
    burn = hydrogenProductTest(m.hydrogen, d.burnProgress);
  const titles = [
    ['乙醇中也能产生气体', 'Gas also forms in ethanol'],
    ['燃烧产物留下水滴', 'Combustion leaves water droplets'],
    ['石灰水保持澄清', 'Limewater remains clear'],
    ['氢来自羟基', 'The hydrogen comes from O—H'],
    ['相同钠样，比较两种液体', 'Compare equal sodium samples'],
    ['基团改变反应表现', 'The surrounding group matters'],
  ];
  return (
    <section className="chem-na-alcohol">
      <div className="chem-na-heading">{say(titles[d.chapter][0], titles[d.chapter][1])}</div>
      {d.chapter === 0 || d.chapter === 1 ? (
        <>
          <AlcoholTube model={m} burn={burn} collecting={d.chapter === 1} p={d.progress} />
          <div className="chem-na-label">
            {d.chapter === 0 ? 'C₂H₅OH + Na' : say('燃烧生成的水', 'Water formed by combustion')}
          </div>
          <div className="chem-na-note">
            {d.chapter === 0
              ? say('气体经导管离开', 'Gas leaves through the outlet')
              : say('教材先检验气体纯度', 'Gas purity is checked first in the textbook')}
          </div>
        </>
      ) : null}
      {d.chapter === 2 ? (
        <>
          <svg
            className="chem-na-lime"
            viewBox="0 0 320 235"
            role="img"
            aria-label={say(
              '收集燃烧产物的小烧杯已经倒转，加入澄清石灰水，液体保持透明',
              'The collector has been turned upright; added limewater remains clear',
            )}
          >
            <path
              d="M83 47V192Q83 207 99 207H221Q237 207 237 192V47"
              fill="#eef2e8"
              fillOpacity=".5"
              stroke="#b6c4ac"
              strokeWidth="2"
            />
            <path
              d="M86 142H234V192Q234 204 220 204H100Q86 204 86 192Z"
              fill="#d5e5d9"
              opacity=".6"
            />
            <ellipse cx="160" cy="142" rx="74" ry="4" fill="#e7eee0" />
            {[0, 1, 2, 3].map((i) => (
              <path
                key={i}
                d={`M${i % 2 ? 229 : 91} ${75 + i * 20}q-4 6 0 8 4-2 0-8Z`}
                fill="#c2d5c5"
              />
            ))}
            <text x="160" y="182" fontSize="21" textAnchor="middle" fill="#879b7a">
              Ca(OH)₂(aq)
            </text>
          </svg>
          <div className="chem-na-label">{say('没有出现CaCO₃浑浊', 'No CaCO₃ cloudiness')}</div>
          <div className="chem-na-note">
            {say('与水滴证据合看', 'Interpret alongside the water droplets')}
          </div>
        </>
      ) : null}
      {d.chapter === 3 ? (
        <>
          <HydroxylHydrogens p={d.progress} />
          <div className="chem-na-equation">
            2C₂H₅OH + 2Na
            <br />→ 2C₂H₅ONa + H₂↑
          </div>
          <div className="chem-na-note">
            {say('乙氧基与Na⁺为离子记账', 'Ethoxide and Na⁺ are accounted as ions')}
          </div>
        </>
      ) : null}
      {d.chapter === 4 ? (
        <>
          <div className="chem-na-comparison">
            <div>
              <ReactionBeaker model={comparison.water} p={d.compareTime} />
              <span>H₂O</span>
            </div>
            <div>
              <ReactionBeaker model={comparison.ethanol} p={d.compareTime} />
              <span>C₂H₅OH</span>
            </div>
          </div>
          <div className="chem-na-two">
            <div>
              <span>{say('水中已生成H₂', 'H₂ formed in water')}</span>
              <b>{comparison.water.hydrogen.toFixed(2)}</b>
            </div>
            <div>
              <span>{say('乙醇中已生成H₂', 'H₂ formed in ethanol')}</span>
              <b>{comparison.ethanol.hydrogen.toFixed(2)}</b>
            </div>
          </div>
          <div className="chem-na-note">
            {say('模型份数 · 快慢仅作定性', 'Model units · qualitative timing')}
          </div>
        </>
      ) : null}
      {d.chapter === 5 ? (
        <>
          <div className="chem-na-groups">
            <div>
              <span>H—O—H</span>
              <b>{say('水', 'Water')}</b>
            </div>
            <div>
              <span>C₂H₅—O—H</span>
              <b>{say('乙醇', 'Ethanol')}</b>
            </div>
          </div>
          <div className="chem-na-causality">
            <span>{say('同样大小的Na', 'Equal sodium samples')}</span>
            <i>↓</i>
            <span>{say('反应表现不同', 'Different observed behaviour')}</span>
            <i>↓</i>
            <span>{say('比较O—H所处环境', 'Compare the O—H environments')}</span>
          </div>
        </>
      ) : null}
      {!film.watch ? (
        <div className="chem-na-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'ethanol', label: say('乙醇反应', 'Ethanol') },
              { value: 'compare', label: say('水与乙醇', 'Comparison') },
              { value: 'structure', label: say('氢的来源', 'Hydrogen source') },
            ]}
          />
          <Range
            label={say('过程进度', 'Progress')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {view !== 'structure' ? (
            <>
              <Range
                label={say('起始Na示意份数', 'Initial Na model units')}
                value={sodium}
                min={0}
                max={4}
                step={0.2}
                onChange={setSodium}
              />
              <Range
                label={say('可反应O—H示意份数', 'Available O—H donor units')}
                value={donors}
                min={1}
                max={4}
                step={0.2}
                onChange={setDonors}
              />
              {view === 'ethanol' ? (
                <div className="chem-na-label">
                  H₂: {m.hydrogen.toFixed(2)} · Na{say('剩余', ' left')}:{' '}
                  {m.sodiumRemaining.toFixed(2)}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
function AlcoholTube({
  model: m,
  burn,
  collecting,
  p,
}: {
  model: ReturnType<typeof sodiumProtic>;
  burn: ReturnType<typeof hydrogenProductTest>;
  collecting: boolean;
  p: number;
}) {
  const radius = m.initialSodium ? 10 * Math.cbrt(m.sodiumRemaining / 2) : 0;
  return (
    <svg
      className="chem-na-tube"
      viewBox="0 0 320 280"
      role="img"
      aria-label={
        collecting
          ? 'Hydrogen from sodium and ethanol burns at the outlet; an inverted collector receives water droplets'
          : 'Sodium at the bottom of an ethanol tube releases gas through a stopper and glass nozzle'
      }
    >
      <path
        d="M125 126V242Q125 263 160 263T195 242V126"
        fill="#edf2e7"
        stroke="#b1c0a8"
        strokeWidth="2"
      />
      <path d="M128 187H192V242Q192 260 160 260T128 242Z" fill="#d9e4d3" opacity=".8" />
      <rect x="121" y="118" width="78" height="17" rx="4" fill="#aeb89f" />
      <path d="M157 146V84l3-9 3 9v62" stroke="#a4b69b" fill="#edf3e4" strokeWidth="2" />
      <rect
        x={160 - radius}
        y={247 - radius}
        width={radius * 2}
        height={radius * 1.4}
        rx="2"
        fill="#a3ae98"
      />
      {m.extent > 0 && m.sodiumRemaining > 0
        ? [0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={159 + Math.sin(i + p * 4) * 8}
              cy={236 - ((p * 4 + i * 0.2) % 1) * 44}
              r="3"
              fill="#f5f9ec"
              stroke="#c2d2b6"
            />
          ))
        : null}
      <path d="M67 115V269M58 269H109M67 155H122" fill="none" stroke="#a7b49b" strokeWidth="3" />
      <path d="M121 145q12-2 12 10t-12 10" stroke="#9fad91" fill="none" strokeWidth="3" />
      {collecting ? (
        <>
          <path
            d="M91 96V20Q91 12 102 12H218Q229 12 229 20V96"
            fill="#f5f8ef"
            fillOpacity=".25"
            stroke="#bcc9b3"
            strokeWidth="2"
          />
          {burn.burnt > 0 ? (
            <path d="M160 75q-13-17 1-37 1 13 9 20 5 12-10 17Z" fill="#b5c9d0" opacity=".8" />
          ) : null}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${103 + i * 21} ${25 + (i % 2) * 9}q-3 6 0 8 3-2 0-8Z`}
              fill="#bfd4c4"
              opacity={Math.max(0, Math.min(1, burn.water * 2 - i * 0.12))}
            />
          ))}
        </>
      ) : (
        <path
          d="M155 62l5-8 5 8"
          stroke="#c4d0b9"
          fill="none"
          strokeWidth="2"
          opacity={m.extent > 0 ? 1 : 0}
        />
      )}
    </svg>
  );
}
function ReactionBeaker({ model: m, p }: { model: ReturnType<typeof sodiumProtic>; p: number }) {
  const r = 10 * Math.cbrt(m.sodiumRemaining / 2),
    x = 80 + (m.floats ? Math.sin(p * 18) * 24 : 0),
    y = m.floats ? 107 : 192;
  return (
    <svg
      viewBox="0 0 155 225"
      role="img"
      aria-label={
        m.floats
          ? 'Sodium floats at the water surface and reacts faster in this qualitative comparison'
          : 'Sodium lies below the ethanol surface and reacts more slowly in this qualitative comparison'
      }
    >
      <path
        d="M21 40V192Q21 210 39 210H119Q136 210 136 192V40"
        fill="#eff3e9"
        stroke="#b5c3ab"
        strokeWidth="2"
      />
      <path d="M24 107H133V190Q133 207 119 207H39Q24 207 24 190Z" fill="#dbe6d5" />
      <ellipse cx="78" cy="107" rx="54" ry="4" fill="#edf2e5" />
      {m.floats ? (
        <ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill="#a9b59f" />
      ) : (
        <rect x={x - r} y={y - r} width={2 * r} height={r * 1.5} rx="2" fill="#a9b59f" />
      )}
      {m.extent > 0 && m.sodiumRemaining > 0
        ? Array.from({ length: m.floats ? 8 : 4 }, (_, i) => (
            <circle
              key={i}
              cx={x + Math.sin(i * 2 + p * 15) * 16}
              cy={y - 5 - ((p * 5 + i * 0.13) % 1) * (m.floats ? 20 : 72)}
              r={2.4 + (i % 3) * 0.4}
              fill="#f7faef"
              stroke="#bfd1b3"
            />
          ))
        : null}
    </svg>
  );
}
function HydroxylHydrogens({ p }: { p: number }) {
  const q = Math.max(0, Math.min(1, (p - 0.1) / 0.75));
  return (
    <svg
      className="chem-na-atoms"
      viewBox="0 0 320 240"
      role="img"
      aria-label="Two hydroxyl hydrogens form H2; ethanol carbon-hydrogen groups remain unchanged; sodium gives Na+ counterions"
    >
      {[55, 155].map((y, i) => {
        const hx = 220 + (263 - 220) * q,
          hy = y + ((i ? 122 : 89) - y) * q;
        return (
          <g key={i}>
            <text x="65" y={y + 6} textAnchor="middle" fontSize="23" fill="#91a17f">
              C₂H₅
            </text>
            <path d={`M101 ${y}H148`} stroke="#b5c5aa" strokeWidth="4" />
            <path d={`M168 ${y}L${hx} ${hy}`} stroke="#b5c5aa" strokeWidth="4" opacity={1 - q} />
            <circle cx="160" cy={y} r="20" fill="#c7b19c" />
            <text x="160" y={y + 7} textAnchor="middle" fontSize="21" fill="#8c7763">
              O
            </text>
            <text x="178" y={y - 18} fontSize="22" fill="#9b9f87" opacity={q}>
              −
            </text>
            <circle cx={hx} cy={hy} r="15" fill="#e0e9d5" />
            <text x={hx} y={hy + 6} textAnchor="middle" fontSize="21" fill="#879b75">
              H
            </text>
            <text x="210" y={y + 7} textAnchor="middle" fontSize="20" fill="#a8b294" opacity={q}>
              Na⁺
            </text>
          </g>
        );
      })}
      <path d="M263 104V107" stroke="#aebf9f" strokeWidth="4" opacity={q} />
      <text x="263" y="184" textAnchor="middle" fontSize="20" fill="#8b9f78" opacity={q}>
        H₂
      </text>
      <text x="160" y="230" textAnchor="middle" fontSize="20" fill="#95a286">
        2Na → 2Na⁺ + 2e⁻
      </text>
    </svg>
  );
}
