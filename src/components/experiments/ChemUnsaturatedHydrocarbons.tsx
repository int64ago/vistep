import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  bromineAddition,
  ethynePreparation,
  permanganateEvidence,
  hydrocarbonDirector,
  type UnsaturatedGas,
} from '../../models/chem-unsaturated-hydrocarbons';
import '../../styles/chem-unsaturated-hydrocarbons.css';
export default function ChemUnsaturatedHydrocarbons() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [gas, setGas] = useState<UnsaturatedGas>(
      film.variant === 'ethyne-lab' ? 'ethyne' : 'ethene',
    ),
    [view, setView] = useState(film.variant === 'ethyne-lab' ? 'preparation' : 'test'),
    [test, setTest] = useState('bromine'),
    [progress, setProgress] = useState(0.75),
    [bromine, setBromine] = useState(2),
    [copper, setCopper] = useState(0.12);
  const d = film.watch
    ? hydrocarbonDirector(film.chapter, film.chapterProgress)
    : {
        chapter:
          view === 'preparation'
            ? 4
            : view === 'burn'
              ? gas === 'ethene'
                ? 0
                : 7
              : view === 'addition'
                ? 3
                : gas === 'ethyne'
                  ? 6
                  : test === 'bromine'
                    ? 2
                    : 1,
        progress,
        exposure: progress,
        gas,
      };
  const actualGas = d.chapter === 4 || d.chapter === 5 ? 'ethyne' : d.gas;
  const b = bromineAddition(
      actualGas,
      film.watch ? (actualGas === 'ethene' ? 1 : 2) : bromine,
      d.exposure,
    ),
    prep = ethynePreparation(d.exposure, film.watch ? 0.12 : copper),
    red = permanganateEvidence(d.exposure, actualGas === 'ethyne' ? prep.outletImpurity * 2 : 0);
  const formula = actualGas === 'ethene' ? 'C₂H₄' : 'C₂H₂',
    names = [
      ['火焰与黑烟', 'Flame and soot'],
      ['紫色氧化剂被消耗', 'The purple oxidant is consumed'],
      ['溴的颜色逐渐消失', 'Bromine colour disappears'],
      ['碳链保留，双键发生加成', 'Addition retains the carbon skeleton'],
      ['沿装置追踪乙炔', 'Follow ethyne through the apparatus'],
      ['先排除杂质干扰', 'Remove interfering impurities'],
      ['分别观察两种试剂', 'Test the two reagents separately'],
      ['净化后的气体再作燃烧观察', 'Observe combustion after purification'],
    ];
  return (
    <section className="chem-unsat">
      <div className="chem-unsat-heading">
        {d.chapter === 3 && actualGas === 'ethyne'
          ? say('三键可以分两步加成', 'A triple bond can add in two stages')
          : say(names[d.chapter][0], names[d.chapter][1])}
      </div>
      {d.chapter === 0 || d.chapter === 7 ? (
        <>
          <Flame p={d.exposure} ethyne={actualGas === 'ethyne'} />
          <div className="chem-unsat-formula">{formula}</div>
          <div className="chem-unsat-note">
            {say('燃烧现象示意 · 非火焰计算', 'Qualitative flame observation')}
          </div>
        </>
      ) : null}
      {d.chapter === 1 || d.chapter === 2 ? (
        <>
          <div className="chem-unsat-single">
            <TestTube
              colour={d.chapter === 1 ? 'purple' : 'amber'}
              remaining={
                d.chapter === 1 ? red.remaining : b.available ? b.remaining / b.available : 0
              }
              p={d.exposure}
            />
          </div>
          <div className="chem-unsat-formula">
            {d.chapter === 1
              ? say('酸性KMnO₄', 'Acidic KMnO₄')
              : say('Br₂ / CCl₄溶液', 'Br₂ in CCl₄')}
          </div>
          <div className="chem-unsat-note">
            {d.chapter === 1
              ? say('褪色：氧化还原证据', 'Decolourisation: redox evidence')
              : say('褪色：Br₂被消耗', 'Decolourisation: Br₂ consumed')}
          </div>
        </>
      ) : null}
      {d.chapter === 3 ? (
        <>
          <Addition gas={actualGas} first={b.first} second={b.second} />
          <div className="chem-unsat-formula">
            {actualGas === 'ethene' ? 'CH₂=CH₂ + Br₂' : 'HC≡CH + 2Br₂'}
            <br />→ {actualGas === 'ethene' ? 'CH₂Br—CH₂Br' : 'CHBr₂—CHBr₂'}
          </div>
          <div className="chem-unsat-note">
            {say('净加成的连接记账', 'Connectivity account of net addition')}
          </div>
        </>
      ) : null}
      {d.chapter === 4 || d.chapter === 5 ? (
        <>
          <Preparation p={d.exposure} prep={prep} zoom={d.chapter === 5} />
          {d.chapter === 4 ? (
            <div className="chem-unsat-equation">
              CaC₂ + 2H₂O
              <br />→ Ca(OH)₂ + C₂H₂↑
            </div>
          ) : (
            <>
              <div className="chem-unsat-equation">Cu²⁺ + H₂S → CuS↓ + 2H⁺</div>
              <div className="chem-unsat-purity">
                <span>{say('出口H₂S示意余量', 'Outlet H₂S model units')}</span>
                <b>{prep.outletImpurity.toFixed(3)}</b>
              </div>
            </>
          )}
          <div className="chem-unsat-note">
            {say('发生 → 净化 → 性质检验', 'Generate → purify → test')}
          </div>
        </>
      ) : null}
      {d.chapter === 6 ? (
        <>
          <div className="chem-unsat-tests">
            <div>
              <TestTube colour="purple" remaining={red.remaining} p={d.exposure} />
              <span>{say('酸性KMnO₄', 'Acidic KMnO₄')}</span>
            </div>
            <div>
              <TestTube
                colour="amber"
                remaining={b.available ? b.remaining / b.available : 0}
                p={d.exposure}
              />
              <span>Br₂ / CCl₄</span>
            </div>
          </div>
          <div className="chem-unsat-equation">
            HC≡CH + 2Br₂
            <br />→ CHBr₂—CHBr₂
          </div>
          <div className="chem-unsat-note">{say('分别通入试剂', 'Separate tests')}</div>
        </>
      ) : null}
      {!film.watch ? (
        <div className="chem-unsat-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'test', label: say('性质试剂', 'Reagents') },
              { value: 'addition', label: say('加成连接', 'Addition') },
              { value: 'preparation', label: say('制取净化', 'Preparation') },
              { value: 'burn', label: say('燃烧观察', 'Combustion') },
            ]}
          />
          {view !== 'preparation' ? (
            <Segments
              label={say('气体', 'Gas')}
              value={gas}
              onChange={(v) => setGas(v as UnsaturatedGas)}
              options={[
                { value: 'ethene', label: 'C₂H₄' },
                { value: 'ethyne', label: 'C₂H₂' },
              ]}
            />
          ) : null}
          {view === 'test' && gas === 'ethene' ? (
            <Segments
              label={say('试剂', 'Reagent')}
              value={test}
              onChange={setTest}
              options={[
                { value: 'bromine', label: 'Br₂' },
                { value: 'permanganate', label: 'KMnO₄' },
              ]}
            />
          ) : null}
          <Range
            label={say('示意进度', 'Illustrative progress')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {view === 'addition' && (
            <div className="chem-unsat-purity">
              {say('剩余Br₂示意份数', 'Remaining Br₂ model units')}: {b.remaining.toFixed(2)}
            </div>
          )}
          {view === 'preparation' ? (
            <>
              <Range
                label={say('Cu²⁺可用份数', 'Available Cu²⁺ model units')}
                value={copper}
                min={0}
                max={0.2}
                step={0.01}
                onChange={setCopper}
              />
              <div className="chem-unsat-purity">
                {say('出口H₂S余量', 'Outlet H₂S')}: {prep.outletImpurity.toFixed(3)}
              </div>
            </>
          ) : view === 'addition' ||
            (view === 'test' && (gas === 'ethyne' || test === 'bromine')) ? (
            <Range
              label={say('每份烃的Br₂份数', 'Br₂ units per hydrocarbon unit')}
              value={bromine}
              min={0}
              max={3}
              step={0.1}
              onChange={setBromine}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
function TestTube({
  colour,
  remaining,
  p,
}: {
  colour: 'purple' | 'amber';
  remaining: number;
  p: number;
}) {
  return (
    <svg
      viewBox="0 0 155 235"
      role="img"
      aria-label={
        colour === 'purple'
          ? 'Acidic permanganate test tube with a submerged gas inlet'
          : 'Bromine in carbon tetrachloride with a submerged gas inlet'
      }
    >
      <path
        d="M51 29V194Q51 219 80 219T109 194V29"
        fill="#edf1e7"
        fillOpacity=".5"
        stroke="#b2c0aa"
        strokeWidth="2"
      />
      <path
        d="M54 120H106V193Q106 215 80 215T54 193Z"
        fill={colour === 'purple' ? '#96779b' : '#c99b68'}
        opacity={0.04 + 0.55 * remaining}
      />
      <ellipse cx="80" cy="120" rx="26" ry="3" fill="#d8dfce" opacity=".4" />
      <path d="M4 64H69V189" stroke="#a9baa5" strokeWidth="6" strokeLinejoin="round" fill="none" />
      <path d="M4 64H69V189" stroke="#f8faf3" strokeWidth="2" fill="none" />
      {p > 0 && p < 1
        ? [0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={71 + Math.sin(i + p * 3) * 5}
              cy={185 - ((p * 3 + i * 0.28) % 1) * 61}
              r={3 + i * 0.6}
              stroke="#b8c8b0"
              fill="#f9fbf5"
              fillOpacity=".4"
            />
          ))
        : null}
      <path d="M130 32V226M128 226H148M130 71H112" stroke="#a4b298" strokeWidth="3" />
      <path d="M111 62Q101 61 102 72T112 82" stroke="#a4b298" fill="none" strokeWidth="3" />
    </svg>
  );
}
function Flame({ p, ethyne }: { p: number; ethyne: boolean }) {
  return (
    <svg
      className="chem-unsat-flame"
      viewBox="0 0 320 255"
      role="img"
      aria-label={
        ethyne
          ? 'A bright ethyne flame with visible soot above the nozzle'
          : 'A bright ethene flame with soot above the nozzle'
      }
    >
      <path
        d="M67 244H153V191L160 178L167 191V244"
        fill="#d5dfd1"
        stroke="#a2b29a"
        strokeWidth="2"
      />
      {p > 0 ? (
        <>
          <path
            d={`M160 188C${128 + 5 * Math.sin(p * 12)} 164 143 117 164 81c-5 35 25 45 21 70-1 21-16 35-25 37Z`}
            fill="#d4b97c"
            opacity=".8"
          />
          <path d="M160 184c-14-18-9-37 1-49 4 17 14 27 12 34-1 7-5 12-13 15Z" fill="#f0df9d" />
          <path d="M160 185q-8-8 0-18 9 11 0 18Z" fill="#a5bac1" />
          {Array.from({ length: ethyne ? 14 : 8 }, (_, i) => {
            const q = (p * 2 + i * 0.071) % 1;
            return (
              <circle
                key={i}
                cx={160 + Math.sin(i * 2.3 + q * 4) * (7 + q * 19)}
                cy={77 - q * 70}
                r={2 + q * 3}
                fill="#7b8174"
                opacity={0.45 * (1 - q)}
              />
            );
          })}
        </>
      ) : null}
    </svg>
  );
}
function Preparation({
  p,
  prep,
  zoom,
}: {
  p: number;
  prep: ReturnType<typeof ethynePreparation>;
  zoom: boolean;
}) {
  return (
    <svg
      className={zoom ? 'chem-unsat-prep zoom' : 'chem-unsat-prep'}
      viewBox={zoom ? '175 62 145 215' : '0 0 320 270'}
      role="img"
      aria-label={
        zoom
          ? 'Close-up of CuSO4 scrubber: gas enters below liquid, leaves above it, and CuS accumulates'
          : 'Dropping funnel and calcium carbide flask connected to a copper sulfate gas scrubber with submerged inlet and short outlet'
      }
    >
      <path d="M47 105V133a46 46 0 1 0 38 0V105Z" fill="#eef2e9" stroke="#b0bfaa" strokeWidth="2" />
      <path d="M27 177Q65 166 105 177a40 40 0 0 1-78 0Z" fill="#dbe3d2" />
      <path d="M35 198l13-10 12 8 8-10 16 14Z" fill="#929d87" opacity={1 - p} />
      <rect x="42" y="102" width="48" height="12" rx="3" fill="#acb298" />
      <path
        d="M57 20v11q-19 9-16 26 1 9 15 23v62h5V80q15-23 15-27 1-15-15-22V20Z"
        fill="#e9eee1"
        stroke="#b5c3ad"
        strokeWidth="2"
      />
      <path d="M44 54H72L59 76Z" fill="#cfdfcf" />
      <path d="M49 99H69" stroke="#9baf91" strokeWidth="3" />
      {p > 0 && p < 1 ? (
        <circle cx="59" cy={148 + ((p * 5) % 1) * 19} r="3" fill="#b5ccbb" />
      ) : null}
      <path
        d="M78 109V77H229V206"
        fill="none"
        stroke="#abbba4"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M78 109V77H229V206" fill="none" stroke="#f5f8ee" strokeWidth="2" />
      <path
        d="M199 122V223Q199 240 237 240T275 223V122Z"
        fill="#edf1e6"
        stroke="#b0c0a8"
        strokeWidth="2"
      />
      <path
        d="M202 173H272V223Q272 236 237 236T202 223Z"
        fill="#8cbdc6"
        opacity={0.12 + 0.45 * (prep.copperInitial ? prep.copperRemaining / prep.copperInitial : 0)}
      />
      <rect x="195" y="117" width="84" height="13" rx="4" fill="#adb69e" />
      <path d="M229 77V206" fill="none" stroke="#abbba4" strokeWidth="6" />
      <path d="M229 77V206" fill="none" stroke="#f5f8ee" strokeWidth="2" />
      <path d="M254 143V101H313" stroke="#a9bba4" fill="none" strokeWidth="6" />
      <path d="M254 143V101H313" stroke="#f4f7ed" fill="none" strokeWidth="2" />
      <path d="M302 96l9 5-9 5" stroke="#8fa584" fill="none" strokeWidth="2" />
      {p > 0 && p < 1
        ? [0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={230 + i * 4}
              cy={205 - ((p * 4 + i * 0.3) % 1) * 33}
              r="3"
              stroke="#c5d5bf"
              fill="#f6faf0"
            />
          ))
        : null}
      <path
        d={`M206 ${234 - prep.precipitate * 100}Q237 ${229 - prep.precipitate * 100} 269 ${234 - prep.precipitate * 100}V231Q237 239 206 231Z`}
        fill="#6f776b"
        opacity={Math.min(1, prep.precipitate * 20)}
      />
      <path d="M18 98V242M12 242H115M18 124H43" stroke="#a9b69d" strokeWidth="3" fill="none" />
      <path d="M42 116q13 0 13 8t-13 8" stroke="#9caa91" strokeWidth="3" fill="none" />
      <text x="66" y="264" textAnchor="middle" fontSize="20" fill="#829176">
        CaC₂
      </text>
      <text x="237" y="264" textAnchor="middle" fontSize="20" fill="#829176">
        CuSO₄
      </text>
    </svg>
  );
}
function Addition({ gas, first, second }: { gas: UnsaturatedGas; first: number; second: number }) {
  const ethene = gas === 'ethene';
  const bond = (x1: number, y1: number, x2: number, y2: number, opacity = 1) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#afbea4" strokeWidth="4" opacity={opacity} />
  );
  const atom = (x: number, y: number, label: string, opacity = 1) => (
    <g opacity={opacity}>
      <circle
        cx={x}
        cy={y}
        r={label === 'H' ? 14 : 20}
        fill={label === 'C' ? '#a9bba1' : label === 'H' ? '#e4ebda' : '#c5aa83'}
      />
      <text
        x={x}
        y={y + 6}
        textAnchor="middle"
        fontSize="20"
        fill={label === 'C' ? '#f6f8ef' : '#819075'}
      >
        {label}
      </text>
    </g>
  );
  return (
    <svg
      className="chem-unsat-addition"
      viewBox="0 0 320 220"
      role="img"
      aria-label="Net bromine addition shown as changing connectivity, not an elementary mechanism"
    >
      {bond(115, 110, 205, 110)}
      {bond(115, 101, 205, 101, 1 - first)}
      {!ethene ? bond(115, 119, 205, 119, 1 - second) : null}
      {(ethene
        ? [
            [75, 63, 115, 110],
            [75, 157, 115, 110],
            [245, 63, 205, 110],
            [245, 157, 205, 110],
          ]
        : [
            [58, 110, 115, 110],
            [262, 110, 205, 110],
          ]
      ).map(([x, y, cx, cy], i) => (
        <g key={i}>
          {bond(x, y, cx, cy)}
          {atom(x, y, 'H')}
        </g>
      ))}
      {bond(115, 110, 115, 30, first)}
      {bond(205, 110, 205, 190, first)}
      {atom(115, 30, 'Br', first)}
      {atom(205, 190, 'Br', first)}
      {!ethene ? (
        <>
          {bond(115, 110, 115, 190, second)}
          {bond(205, 110, 205, 30, second)}
          {atom(115, 190, 'Br', second)}
          {atom(205, 30, 'Br', second)}
        </>
      ) : null}
      {atom(115, 110, 'C')}
      {atom(205, 110, 'C')}
    </svg>
  );
}
