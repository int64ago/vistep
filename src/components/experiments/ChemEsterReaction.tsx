import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  esterPreparation,
  esterHydrolysis,
  esterDirector,
  ethanolBurn,
  aceticCarbonate,
  type HydrolysisMedium,
} from '../../models/chem-ester-reaction';
import { copperAlcoholCycle } from '../../models/chem-alcohol-oxidation';
import '../../styles/chem-ester-reaction.css';
export default function ChemEsterReaction() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState(
      film.variant === 'hydrolysis-inquiry' ? 'hydrolysis' : 'preparation',
    ),
    [progress, setProgress] = useState(0.65),
    [temperature, setTemperature] = useState(75),
    [base, setBase] = useState(1.2),
    [heat, setHeat] = useState('yes'),
    [catalyst, setCatalyst] = useState('yes'),
    [medium, setMedium] = useState<HydrolysisMedium>('acid');
  const d = film.watch
    ? esterDirector(film.chapter, film.chapterProgress)
    : {
        chapter:
          view === 'hydrolysis' ? 6 : view === 'temperature' ? 9 : view === 'washing' ? 5 : 4,
        progress,
        preparation: progress,
        hydrolysis: progress,
      };
  const prep = esterPreparation(
    d.preparation,
    film.watch || heat === 'yes',
    film.watch || catalyst === 'yes',
  );
  const titles = [
    ['燃烧后验证两种产物', 'Verify two combustion products'],
    ['再看铜丝的循环', 'Revisit the copper cycle'],
    ['用现象判断乙酸的酸性', 'Observe ethanoic acid acidity'],
    ['反应与收集分开进行', 'Reaction and collection'],
    ['沿导管追踪混合蒸气', 'Follow the mixed vapour'],
    ['静置后出现上层酯液', 'The ester forms an upper layer'],
    ['相同起点，改变介质', 'Same starting point, new medium'],
    ['酸催化水解可以逆行', 'Acid hydrolysis is reversible'],
    ['碱被消耗，羧酸盐留下', 'Base is consumed; carboxylate remains'],
    ['只改变温度再比较', 'Compare temperature alone'],
  ];
  const label = (m: HydrolysisMedium) =>
    m === 'neutral'
      ? say('中性', 'Neutral')
      : m === 'acid'
        ? say('酸性', 'Acid')
        : say('碱性', 'Base');
  return (
    <section className="chem-ester">
      <div className="chem-ester-title">{say(titles[d.chapter][0], titles[d.chapter][1])}</div>
      {d.chapter === 0 ? (
        <>
          <BurnEvidence p={d.progress} />
          <div className="chem-ester-equation">
            C₂H₅OH + 3O₂
            <br />→ 2CO₂ + 3H₂O
          </div>
        </>
      ) : null}
      {d.chapter === 1 ? (
        <>
          <CopperRecap p={d.progress} />
          <div className="chem-ester-equation">
            Cu ⇄ CuO
            <br />
            C₂H₅OH → CH₃CHO
          </div>
        </>
      ) : null}
      {d.chapter === 2 ? (
        <>
          <AcidEvidence p={d.progress} />
          <div className="chem-ester-two">
            <span>{say('石蕊变红', 'Litmus turns red')}</span>
            <span>{say('碳酸盐放出CO₂', 'Carbonate releases CO₂')}</span>
          </div>
          <div className="chem-ester-note">{say('活动设计示例', 'An activity design example')}</div>
        </>
      ) : null}
      {d.chapter === 3 || d.chapter === 4 ? (
        <>
          <PreparationBench p={d.progress} model={prep} />
          {d.chapter === 3 ? (
            <div className="chem-ester-equation">
              CH₃COOH + C₂H₅OH
              <br />⇌ CH₃COOC₂H₅ + H₂O
            </div>
          ) : (
            <div className="chem-ester-key">
              <span>
                <i style={{ background: '#b8b386' }} /> {say('酯', 'Ester')}
              </span>
              <span>
                <i style={{ background: '#bd9b8e' }} /> {say('酸', 'Acid')}
              </span>
              <span>
                <i style={{ background: '#8da8a4' }} /> {say('醇与水', 'Alcohol + water')}
              </span>
            </div>
          )}
        </>
      ) : null}
      {d.chapter === 5 ? (
        <>
          <ReceiverDetail model={prep} />
          <div className="chem-ester-two">
            <span>{say('上层：酯较多', 'Upper: ester-rich')}</span>
            <span>{say('水层：醇与乙酸盐', 'Water: alcohol + acetate')}</span>
          </div>
          <div className="chem-ester-note">
            {say('分层不等于纯品', 'Two layers do not mean purity')}
          </div>
        </>
      ) : null}
      {d.chapter === 6 ? (
        <>
          <div className="chem-ester-bath-label">
            {film.watch ? '75' : temperature.toFixed(0)} °C · {say('同一水浴', 'One water bath')}
          </div>
          <HydrolysisBath
            states={(['neutral', 'acid', 'base'] as HydrolysisMedium[]).map((m) =>
              esterHydrolysis(
                d.hydrolysis,
                m,
                film.watch ? 75 : temperature,
                film.watch ? 1.2 : base,
              ),
            )}
          />
          <div className="chem-ester-three">
            {(['neutral', 'acid', 'base'] as HydrolysisMedium[]).map((m) => (
              <span key={m}>
                {label(m)}
                <b>
                  {(
                    esterHydrolysis(
                      d.hydrolysis,
                      m,
                      film.watch ? 75 : temperature,
                      film.watch ? 1.2 : base,
                    ).ester * 100
                  ).toFixed(0)}
                  %
                </b>
              </span>
            ))}
          </div>
          <div className="chem-ester-note">
            {say('剩余酯 · 示意计算', 'Ester remaining · illustrative')}
          </div>
        </>
      ) : null}
      {d.chapter === 7 ? (
        <>
          <div className="chem-ester-molecules">
            <div>CH₃COOC₂H₅ + H₂O</div>
            <span>
              ⇌ <small>H⁺</small>
            </span>
            <div>CH₃COOH + C₂H₅OH</div>
          </div>
          <ReactionArrows p={d.progress} />
          <div className="chem-ester-note">
            {say('催化剂促进两个方向', 'Catalysis accelerates both directions')}
          </div>
        </>
      ) : null}
      {d.chapter === 8 ? (
        <>
          <div className="chem-ester-molecules">
            <div>CH₃COOC₂H₅ + OH⁻</div>
            <span>↓</span>
            <div>CH₃COO⁻ + C₂H₅OH</div>
          </div>
          <div className="chem-ester-salt">
            <span>OH⁻</span>
            <div>
              <i
                style={{
                  width: `${100 * (1 - esterHydrolysis(d.progress, 'base').extent / 1.2)}%`,
                }}
              />
            </div>
            <span>CH₃COO⁻</span>
            <div>
              <i
                style={{
                  width: `${(100 * esterHydrolysis(d.progress, 'base').extent) / 1.2}%`,
                  background: '#bca98b',
                }}
              />
            </div>
          </div>
          <div className="chem-ester-note">
            {say('每水解1份酯，消耗1份OH⁻', 'One OH⁻ consumed per ester hydrolysed')}
          </div>
        </>
      ) : null}
      {d.chapter === 9 ? (
        <>
          <div className="chem-ester-bath-label">{label(film.watch ? 'acid' : medium)}</div>
          <HydrolysisBath
            states={[
              esterHydrolysis(
                d.hydrolysis,
                film.watch ? 'acid' : medium,
                25,
                film.watch ? 1.2 : base,
              ),
              esterHydrolysis(
                d.hydrolysis,
                film.watch ? 'acid' : medium,
                75,
                film.watch ? 1.2 : base,
              ),
            ]}
          />
          <div className="chem-ester-two">
            <span>25 °C</span>
            <span>75 °C</span>
          </div>
          <div className="chem-ester-note">
            {say('量、介质与示意时长相同', 'Same amounts, medium and model duration')}
          </div>
        </>
      ) : null}
      {!film.watch ? (
        <div className="chem-ester-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'preparation', label: say('制备', 'Preparation') },
              { value: 'washing', label: say('分层', 'Layers') },
              { value: 'hydrolysis', label: say('水解', 'Hydrolysis') },
              { value: 'temperature', label: say('温度', 'Temperature') },
            ]}
          />
          <Range
            label={say('过程进度', 'Progress')}
            value={progress}
            onChange={setProgress}
            min={0}
            max={1}
            step={0.01}
          />
          {view === 'preparation' || view === 'washing' ? (
            <>
              <Segments
                label={say('加热', 'Heating')}
                value={heat}
                onChange={setHeat}
                options={[
                  { value: 'yes', label: say('有', 'On') },
                  { value: 'no', label: say('无', 'Off') },
                ]}
              />
              <Segments
                label={say('酸催化剂', 'Acid catalyst')}
                value={catalyst}
                onChange={setCatalyst}
                options={[
                  { value: 'yes', label: say('有', 'Present') },
                  { value: 'no', label: say('无', 'Absent') },
                ]}
              />
              <div>
                {say('累计收集酯', 'Ester collected')}: {prep.receiver.ester.toFixed(3)}{' '}
                {say('示意份', 'model units')}
              </div>
            </>
          ) : (
            <>
              <Range
                label={say('初始OH⁻示意份数', 'Initial OH⁻ model units')}
                value={base}
                onChange={setBase}
                min={0}
                max={3}
                step={0.1}
              />
              {view === 'hydrolysis' ? (
                <Range
                  label={say('水浴温度', 'Bath temperature')}
                  value={temperature}
                  onChange={setTemperature}
                  min={25}
                  max={80}
                  step={1}
                />
              ) : (
                <Segments
                  label={say('保持相同介质', 'Keep the medium fixed')}
                  value={medium}
                  onChange={(v) => setMedium(v as HydrolysisMedium)}
                  options={(['neutral', 'acid', 'base'] as HydrolysisMedium[]).map((m) => ({
                    value: m,
                    label: label(m),
                  }))}
                />
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
function Flame({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-18 24Q-24 37-15 40H15Q24 37 18 24Z" fill="#d7c39b" />
      <path d="M0 24V9" stroke="#aaa184" strokeWidth="4" />
      <path d="M0 12Q-19-3 0-34Q-1-11 10-4Q17 8 0 12" fill="#a6bbc1" />
    </g>
  );
}
function BurnEvidence({ p }: { p: number }) {
  const m = ethanolBurn(p),
    q = Math.max(0, (p - 0.35) / 0.65);
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 245"
      role="img"
      aria-label="Ethanol combustion produces water droplets in a dry collector; a separate limewater test becomes cloudy with carbon dioxide."
    >
      <Flame x={80} y={175} />
      <path
        d="M30 141V59Q30 50 41 50H119Q130 50 130 61V141"
        stroke="#b4c0ac"
        fill="none"
        strokeWidth="2"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M${43 + i * 14} ${65 + (i % 2) * 15}q-5 9 0 10 5-1 0-10Z`}
          fill="#a7c1bb"
          opacity={Math.min(1, m.water * 3)}
        />
      ))}
      <path
        d="M203 62V190Q203 222 235 222T267 190V62"
        stroke="#b6c2ad"
        fill="#f5f6ef"
        strokeWidth="2"
      />
      <path d="M206 143H264V190Q264 219 235 219T206 190Z" fill="#d6e4d9" />
      <path d="M206 143H264V190Q264 219 235 219T206 190Z" fill="#f5f2e8" opacity={q} />
      <text x="80" y="32" fontSize="21" textAnchor="middle" fill="#879b8c">
        H₂O
      </text>
      <text x="235" y="32" fontSize="21" textAnchor="middle" fill="#879b8c">
        CO₂
      </text>
      <text x="235" y="180" fontSize="20" textAnchor="middle" fill="#9da78e">
        CaCO₃
      </text>
    </svg>
  );
}
function CopperRecap({ p }: { p: number }) {
  const m = copperAlcoholCycle(0.15 + 1.85 * p),
    col = `rgb(${[178, 120, 91].map((v, i) => Math.round(v + ([80, 80, 70][i] - v) * m.oxide)).join(',')})`;
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 240"
      role="img"
      aria-label="The same copper coil alternates between air heating and ethanol contact; black oxide is repeatedly formed and reduced."
    >
      <Flame x={80} y={180} />
      <path
        d="M191 87V204Q191 231 220 231T249 204V87"
        stroke="#b3c0aa"
        fill="#f3f5ec"
        strokeWidth="2"
      />
      <path d="M194 145H246V204Q246 228 220 228T194 204Z" fill="#d6e3d1" />
      <g transform={`translate(${m.x} ${m.y - 20})`}>
        <path d="M0-70V-20" stroke="#b28563" strokeWidth="4" />
        <path
          d="M0-20c-22 0-22 8 0 8s22 8 0 8-22 8 0 8 22 8 0 8-22 8 0 8"
          stroke={col}
          strokeWidth="5"
          fill="none"
        />
      </g>
      <path
        d="M275 60V230M260 230H290M275 105H251q-7 7 0 14H275"
        fill="none"
        stroke="#a5b29a"
        strokeWidth="2"
      />
      <text x="220" y="218" textAnchor="middle" fontSize="20" fill="#8b9a7c">
        EtOH
      </text>
      <text x="80" y="32" textAnchor="middle" fontSize="21" fill="#8b9a7c">
        O₂
      </text>
    </svg>
  );
}
function AcidEvidence({ p }: { p: number }) {
  const m = aceticCarbonate(p);
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 220"
      role="img"
      aria-label="Designed examples: ethanoic acid turns litmus red and reacts with carbonate to release carbon dioxide."
    >
      {[83, 237].map((x, i) => (
        <g key={i}>
          <path
            d={`M${x - 30} 24V170Q${x - 30} 204 ${x} 204T${x + 30} 170V24`}
            stroke="#b6c2ad"
            strokeWidth="2"
            fill="#f3f5ec"
          />
          <path
            d={`M${x - 27} 115H${x + 27}V170Q${x + 27} 201 ${x} 201T${x - 27} 170Z`}
            fill={
              i
                ? '#dce6d6'
                : `rgb(${Math.round(151 + 38 * p)},${Math.round(151 - 26 * p)},${Math.round(180 - 38 * p)})`
            }
          />
        </g>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <circle
          key={i}
          cx={222 + (i % 3) * 13}
          cy={183 - ((p * 100 + i * 12) % 110)}
          r="3"
          fill="none"
          stroke="#afc0a7"
          opacity={m.extent > 0 ? 0.7 : 0}
        />
      ))}
      <text x="83" y="75" fontSize="20" textAnchor="middle" fill="#9b8b91">
        H⁺
      </text>
      <text x="237" y="75" fontSize="20" textAnchor="middle" fill="#8c9e7e">
        CO₂↑
      </text>
    </svg>
  );
}
function PreparationBench({
  p,
  model: m,
}: {
  p: number;
  model: ReturnType<typeof esterPreparation>;
}) {
  const paths = [
      [65, 175],
      [155, 100],
      [175, 85],
      [238, 85],
      [245, 92],
      [245, 165],
    ],
    lens = paths.slice(1).map((a, i) => Math.hypot(a[0] - paths[i][0], a[1] - paths[i][1])),
    total = lens.reduce((a, b) => a + b, 0);
  const point = (q: number) => {
    let d = q * total;
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i])
        return [
          paths[i][0] + ((paths[i + 1][0] - paths[i][0]) * d) / lens[i],
          paths[i][1] + ((paths[i + 1][1] - paths[i][1]) * d) / lens[i],
        ];
      d -= lens[i];
    }
    return paths.at(-1)!;
  };
  const oil = Math.min(30, m.washed.oil * 70);
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 275"
      role="img"
      aria-label="An inclined heated reaction tube feeds one continuous delivery tube into a receiver. The delivery tip remains above the carbonate solution; an ester-rich layer accumulates above it."
    >
      <path
        d="M18 263H304M119 24V263M101 263H138M119 124L135 113"
        stroke="#a8b29a"
        strokeWidth="2"
        fill="none"
      />
      <g transform="translate(155 95) rotate(55)">
        <path
          d="M-17 8V145Q-17 163 0 163T17 145V8"
          fill="#f0efe3"
          stroke="#b9bba4"
          strokeWidth="2"
        />
        <path d="M-14 106H14V144Q14 160 0 160T-14 144Z" fill="#d9dab8" />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${-8 + i * 7} ${145 + (i % 2) * 7}l5-2 1 5-5 2Z`} fill="#c1baa1" />
        ))}
        <rect x="-22" y="-3" width="44" height="14" rx="3" fill="#b5ae92" />
      </g>
      <path
        d="M107 111L138 133M111 105L142 127"
        fill="none"
        stroke="#98a486"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Flame x={33} y={222} />
      <path
        d="M155 100L175 85H238Q245 85 245 92V165"
        stroke="#b0b9a1"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M155 100L175 85H238Q245 85 245 92V165"
        stroke="#eff2e7"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M218 106V232Q218 257 245 257T272 232V106"
        fill="#f3f4e9"
        fillOpacity=".3"
        stroke="#b9c0aa"
        strokeWidth="2"
      />
      <path d="M221 200H269V232Q269 254 245 254T221 232Z" fill="#d2dfce" />
      <rect x="221" y={200 - oil} width="48" height={oil} fill="#d8d5a9" opacity=".85" />
      {m.extent > 0 && p < 0.99
        ? Array.from({ length: 8 }, (_, i) => {
            const [x, y] = point((p * 0.8 + i / 8) % 1);
            return (
              <circle key={i} cx={x} cy={y} r="3" fill={['#b8b386', '#bd9b8e', '#8da8a4'][i % 3]} />
            );
          })
        : null}
      <path
        d="M295 93V257M284 257H306M295 118H274q-7 7 0 13H295"
        stroke="#a7b399"
        fill="none"
        strokeWidth="2"
      />
      <text x="245" y="239" fontSize="20" textAnchor="middle" fill="#8b9d80">
        CO₃²⁻
      </text>
      <text x="78" y="30" fontSize="20" fill="#a09375">
        H⁺, Δ
      </text>
    </svg>
  );
}
function ReceiverDetail({ model: m }: { model: ReturnType<typeof esterPreparation> }) {
  const oil = Math.min(45, m.washed.oil * 90);
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 235"
      role="img"
      aria-label="The upper layer is ester-rich. Ethanol enters the aqueous layer and acid is neutralised by carbonate; the separation is not a purity test."
    >
      <path
        d="M67 28V188Q67 222 104 222T141 188V28"
        fill="#f6f5e8"
        stroke="#b7c1a6"
        strokeWidth="2"
      />
      <path d="M70 128H138V188Q138 219 104 219T70 188Z" fill="#d3dfc9" />
      <rect x="70" y={128 - oil} width="68" height={oil} fill="#d4cda0" />
      <path d={`M145 ${128 - oil / 2}H174M145 174H174`} stroke="#bdc2ad" />
      <text x="183" y={135 - oil / 2} fontSize="21" fill="#a19a73">
        EtOAc
      </text>
      <text x="183" y="166" fontSize="20" fill="#94a285">
        EtOH
      </text>
      <text x="183" y="195" fontSize="20" fill="#94a285">
        CH₃COO⁻
      </text>
    </svg>
  );
}
function HydrolysisBath({ states }: { states: ReturnType<typeof esterHydrolysis>[] }) {
  const n = states.length;
  return (
    <svg
      className="chem-ester-svg"
      viewBox="0 0 320 215"
      role="img"
      aria-label="Equal initial ester amounts in separate labelled test tubes. The illustrative upper ester layer shrinks as hydrolysis proceeds."
    >
      <path
        d={n === 3 ? 'M20 90V198H300V90' : 'M20 90V198H150V90M170 90V198H300V90'}
        stroke="#bac8b4"
        fill="#e2ece0"
        fillOpacity=".6"
        strokeWidth="2"
      />
      {states.map((m, i) => {
        const x = n === 3 ? 65 + i * 95 : 85 + i * 150,
          layer = 33 * m.oilLayer;
        return (
          <g key={i}>
            <path
              d={`M${x - 25} 12V156Q${x - 25} 183 ${x} 183T${x + 25} 156V12`}
              fill="#f2f4e9"
              stroke="#b5bfa6"
              strokeWidth="2"
            />
            <path
              d={`M${x - 22} 103H${x + 22}V156Q${x + 22} 180 ${x} 180T${x - 22} 156Z`}
              fill="#d2dfc8"
            />
            <rect x={x - 22} y={103 - layer} width="44" height={layer} fill="#d9cfa2" />
            {layer > 0.1 ? (
              <path d={`M${x - 22} ${103 - layer}H${x + 22}`} stroke="#c2b98d" />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
function ReactionArrows({ p }: { p: number }) {
  const positions = [0, 1, 2].map((i) => (p + i / 3) % 1);
  return (
    <svg
      className="chem-ester-flux"
      viewBox="0 0 320 80"
      aria-label="Two reaction directions remain available in acid catalysis"
    >
      <path d="M45 25H275l-10-6M275 55H45l10 6" stroke="#b2bca1" strokeWidth="2" fill="none" />
      {positions.map((q, i) => (
        <g key={i}>
          <circle cx={45 + 230 * q} cy="25" r="4" fill="#c1b08b" />
          <circle cx={275 - 230 * q} cy="55" r="4" fill="#9db3a2" />
        </g>
      ))}
    </svg>
  );
}
