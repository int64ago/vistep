import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  copperAlcoholCycle,
  dichromateAlcohol,
  alcoholOxidationDirector,
} from '../../models/chem-alcohol-oxidation';
import '../../styles/chem-alcohol-oxidation.css';
export default function ChemAlcoholOxidation() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState(film.variant === 'acid-dichromate' ? 'chromium' : 'copper'),
    [time, setTime] = useState(1.75),
    [progress, setProgress] = useState(0.65),
    [ethanol, setEthanol] = useState(3),
    [oxidant, setOxidant] = useState(2),
    [air, setAir] = useState('yes');
  const d = film.watch
    ? alcoholOxidationDirector(film.chapter, film.chapterProgress)
    : {
        chapter: view === 'chromium' ? 4 : view === 'atoms' ? 3 : 2,
        progress,
        cycleTime: time,
        oxidationProgress: progress,
      };
  const cu = copperAlcoholCycle(d.cycleTime, film.watch || air === 'yes'),
    cr = dichromateAlcohol(d.oxidationProgress, film.watch ? 3 : ethanol, film.watch ? 2 : oxidant);
  const labels = [
    ['铜表面在空气中变黑', 'Copper blackens in air'],
    ['黑色表面恢复铜色', 'The copper colour returns'],
    ['同一份铜反复循环', 'The same copper cycles'],
    ['两个氢离开，羰基形成', 'Two hydrogens leave'],
    ['橙色逐渐转为绿色', 'Orange shifts towards green'],
    ['氧化可继续到羧酸', 'Oxidation can continue'],
  ];
  return (
    <section className="chem-alcox">
      <div className="chem-alcox-title">{say(labels[d.chapter][0], labels[d.chapter][1])}</div>
      {d.chapter < 3 ? (
        <>
          <CopperBench m={cu} />
          <div className="chem-alcox-equation">
            {d.chapter === 0 ? (
              '2Cu + O₂ → 2CuO'
            ) : d.chapter === 1 ? (
              <>
                C₂H₅OH + CuO
                <br />→ CH₃CHO + Cu + H₂O
              </>
            ) : (
              <>
                Cu ⇄ CuO
                <br />
                <span>
                  {say('累计乙醛', 'Cumulative ethanal')}: {cu.aldehyde.toFixed(2)}
                </span>
              </>
            )}
          </div>
          <div className="chem-alcox-note">
            {d.chapter === 2
              ? say('铜总量始终为1示意份', 'Total copper stays at 1 model unit')
              : d.chapter === 0
                ? 'Cu → CuO'
                : 'CuO → Cu'}
          </div>
        </>
      ) : null}
      {d.chapter === 3 ? (
        <>
          <AlcoholAtoms p={d.progress} />
          <div className="chem-alcox-equation">CH₃CH₂OH → CH₃CHO</div>
          <div className="chem-alcox-note">{say('净原子去向示意', 'Net atom accounting')}</div>
        </>
      ) : null}
      {d.chapter === 4 ? (
        <>
          <ChromiumTube color={cr.color} p={d.progress} />
          <div className="chem-alcox-pair">
            <span>
              Cr(VI)<b>{(2 * cr.dichromate).toFixed(2)}</b>
            </span>
            <span>
              Cr(III)<b>{cr.chromiumIII.toFixed(2)}</b>
            </span>
          </div>
          <div className="chem-alcox-note">
            {say('铬原子示意份数', 'Chromium atom model units')}
          </div>
        </>
      ) : null}
      {d.chapter === 5 ? (
        <>
          <div className="chem-alcox-route">
            <div>CH₃CH₂OH</div>
            <span>↓ −2H</span>
            <div>CH₃CHO</div>
            <span>↓ +O</span>
            <div>CH₃COOH</div>
          </div>
          <div className="chem-alcox-transfer">
            <span>3C₂H₅OH → 3CH₃COOH</span>
            <b>12e⁻</b>
            <span>2Cr₂O₇²⁻ → 4Cr³⁺</span>
          </div>
        </>
      ) : null}
      {!film.watch ? (
        <div className="chem-alcox-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'copper', label: say('铜循环', 'Copper cycle') },
              { value: 'atoms', label: say('原子去向', 'Atoms') },
              { value: 'chromium', label: say('酸性氧化', 'Acid oxidation') },
            ]}
          />
          {view === 'copper' ? (
            <>
              <Range
                label={say('循环进度', 'Cycle progress')}
                value={time}
                onChange={setTime}
                min={0}
                max={4}
                step={0.01}
              />
              <Segments
                label={say('空气供氧', 'Air oxygen')}
                value={air}
                onChange={setAir}
                options={[
                  { value: 'yes', label: say('有', 'Present') },
                  { value: 'no', label: say('无', 'Absent') },
                ]}
              />
            </>
          ) : (
            <Range
              label={say('过程进度', 'Progress')}
              value={progress}
              onChange={setProgress}
              min={0}
              max={1}
              step={0.01}
            />
          )}
          {view === 'chromium' ? (
            <>
              <Range
                label={say('乙醇示意份数', 'Ethanol model units')}
                value={ethanol}
                onChange={setEthanol}
                min={0}
                max={6}
                step={0.1}
              />
              <Range
                label={say('重铬酸根示意份数', 'Dichromate model units')}
                value={oxidant}
                onChange={setOxidant}
                min={0}
                max={4}
                step={0.1}
              />
              <div>
                {say('生成乙酸', 'Ethanoic acid formed')}: {cr.aceticAcid.toFixed(2)}
                <br />
                {say('乙醇剩余', 'Ethanol remaining')}: {cr.ethanol.toFixed(2)}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
function CopperBench({ m }: { m: ReturnType<typeof copperAlcoholCycle> }) {
  const copper = [178, 120, 91],
    oxide = [80, 80, 70],
    color = `rgb(${copper.map((c, i) => Math.round(c + (oxide[i] - c) * m.oxide)).join(',')})`;
  return (
    <svg
      className="chem-alcox-bench"
      viewBox="0 0 320 270"
      role="img"
      aria-label="One copper coil travels between heating in air and ethanol. Its oxide layer changes with the same reaction account."
    >
      <path d="M35 253H284" stroke="#d4cbbf" />
      <path
        d="M58 225Q47 231 48 245Q80 261 112 245Q113 231 102 225V210H58Z"
        fill="#e8d6b6"
        stroke="#bfad8e"
        strokeWidth="2"
      />
      <path d="M65 210H95V216H65Z" fill="#bcae96" />
      <path d="M77 208V188H83V208" fill="#8d8271" />
      <path d="M80 190Q54 169 78 132Q76 153 92 165Q103 182 80 190" fill="#aebdc4" opacity=".8" />
      <path d="M80 184Q71 169 81 158Q89 176 80 184" fill="#d9e6d8" />
      <path
        d="M191 103V224Q191 251 220 251T249 224V103"
        fill="#f1f1e9"
        fillOpacity=".4"
        stroke="#b7c2b2"
        strokeWidth="2"
      />
      <path d="M194 165H246V224Q246 248 220 248T194 224Z" fill="#d6e3d3" opacity=".7" />
      <path
        d="M276 78V251M260 251H292M276 125H251q-7 7 0 14H276"
        fill="none"
        stroke="#a7b59c"
        strokeWidth="2"
      />
      <g transform={`translate(${m.x} ${m.y})`}>
        <path d="M0-65V-20" stroke="#ad795c" strokeWidth="4" />
        <path
          d="M0-20c-22 0-22 8 0 8s22 8 0 8-22 8 0 8 22 8 0 8-22 8 0 8"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M-5-65H5" stroke="#8e8b7c" strokeWidth="3" />
      </g>
      <text x="80" y="32" fontSize="21" textAnchor="middle" fill="#918f7e">
        O₂
      </text>
      <text x="220" y="278" fontSize="21" textAnchor="middle" fill="#918f7e"></text>
      <text x="220" y="237" textAnchor="middle" fontSize="20" fill="#86967c">
        EtOH
      </text>
    </svg>
  );
}
function AlcoholAtoms({ p }: { p: number }) {
  const t = Math.max(0, Math.min(1, (p - 0.2) / 0.65)),
    x1 = 125 + (235 - 125) * t,
    y1 = 35 + 145 * t,
    x2 = 269 + (285 - 269) * t,
    y2 = 95 + 85 * t;
  return (
    <svg
      className="chem-alcox-atoms"
      viewBox="0 0 320 245"
      role="img"
      aria-label="Net account: ethanol retains its oxygen in the carbonyl. One O–H and one adjacent C–H hydrogen join oxygen from copper oxide to form water."
    >
      <g stroke="#b6b9a3" strokeWidth="3">
        <path d="M95 95H110M143 95H189M125 113V139" />
        <path d="M125 51V77M223 95H253" opacity={1 - t} />
        <path d="M143 87H189" opacity={t} />
        <path d={`M260 ${225 - 25 * t}L${x1} ${y1}M260 ${225 - 25 * t}L${x2} ${y2}`} opacity={t} />
      </g>
      <text x="48" y="102" fontSize="24" fill="#93977d">
        CH₃
      </text>
      <circle cx="125" cy="95" r="18" fill="#ccc6b0" />
      <text x="125" y="102" textAnchor="middle" fontSize="22" fill="#817d6b">
        C
      </text>
      <circle cx="207" cy="95" r="18" fill="#c6a78f" />
      <text x="207" y="102" textAnchor="middle" fontSize="22" fill="#8d6f5a">
        O
      </text>
      {[
        [x1, y1],
        [x2, y2],
        [125, 155],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="15" fill="#dce4cc" />
          <text x={x} y={y + 7} textAnchor="middle" fontSize="21" fill="#95a385">
            H
          </text>
        </g>
      ))}
      <circle cx="260" cy={225 - 25 * t} r="18" fill="#b9ccd0" />
      <text x="260" y={232 - 25 * t} textAnchor="middle" fontSize="22" fill="#7f979a">
        O
      </text>
      <text x="130" y="221" fontSize="21" textAnchor="middle" fill="#889b9c">
        CuO →
      </text>
    </svg>
  );
}
function ChromiumTube({ color, p }: { color: string; p: number }) {
  return (
    <svg
      className="chem-alcox-chromium"
      viewBox="0 0 320 240"
      role="img"
      aria-label="Acid dichromate solution changes from orange towards green as chromium(VI) is reduced to chromium(III)."
    >
      <path
        d="M125 87V193Q125 227 160 227T195 193V87"
        fill="#f4f0e7"
        stroke="#bdc1ad"
        strokeWidth="2"
      />
      <path d="M128 135H192V193Q192 224 160 224T128 193Z" fill={color} opacity=".8" />
      <ellipse cx="160" cy="135" rx="32" ry="4" fill={color} />
      <path d="M154 13H166V54L162 69H158L154 54Z" fill="#e7ecdf" stroke="#b4bfab" strokeWidth="2" />
      <path d="M154 13V4H166V13" stroke="#9cab91" strokeWidth="4" />
      {p < 0.7 ? (
        <path d={`M160 ${78 + 37 * ((p / 0.7) % 1)}q-7 12 0 13 7-1 0-13Z`} fill="#d0ddc3" />
      ) : null}
      <path
        d="M226 107V227M212 227H244M226 103H197q-8 7 0 13H226"
        fill="none"
        stroke="#a9b69d"
        strokeWidth="2"
      />
      <text x="112" y="35" textAnchor="end" fontSize="20" fill="#899778">
        EtOH
      </text>
    </svg>
  );
}
