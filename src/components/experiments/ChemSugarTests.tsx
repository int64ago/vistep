import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  sugarDirector,
  sugarHydrolysis,
  sugarReduction,
  sugarSolubility,
  type Sugar,
} from '../../models/chem-sugar-tests';
import '../../styles/chem-sugar-tests.css';
export default function ChemSugarTests() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [sample, setSample] = useState<Sugar>(
      film.variant === 'starch-tests'
        ? 'starch'
        : film.variant === 'cellulose-hydrolysis'
          ? 'cellulose'
          : film.variant === 'disaccharide-comparison'
            ? 'sucrose'
            : 'glucose',
    ),
    [hydrolysis, setHydrolysis] = useState(0.5),
    [progress, setProgress] = useState(0.7),
    [assay, setAssay] = useState('copper'),
    [alkaline, setAlkaline] = useState('yes'),
    [heated, setHeated] = useState('yes'),
    [amount, setAmount] = useState(1);
  const d = sugarDirector(film.chapter, film.chapterProgress);
  const name = (s: Sugar) =>
    ({
      glucose: say('葡萄糖', 'Glucose'),
      sucrose: say('蔗糖', 'Sucrose'),
      maltose: say('麦芽糖', 'Maltose'),
      starch: say('淀粉', 'Starch'),
      cellulose: say('纤维素', 'Cellulose'),
    })[s];
  const titles = [
    ['先比较固体在水中的变化', 'First observe changes in water'],
    ['银出现在试管内壁', 'Silver appears on the inner wall'],
    ['砖红色沉淀留下证据', 'A brick-red precipitate appears'],
    ['碘让淀粉显色', 'Iodine reveals starch'],
    ['水解后先改变检验环境', 'Adjust the test after hydrolysis'],
    ['水解前后分别检验', 'Test before and after hydrolysis'],
    ['蔗糖先给出阴性对照', 'Sucrose provides a negative result'],
    ['水解让新证据出现', 'Hydrolysis changes the evidence'],
    ['相同方法比较两种二糖', 'Compare two disaccharides'],
    ['关键在连接的部位', 'The linkage position matters'],
    ['纤维素也能生成葡萄糖', 'Cellulose can yield glucose'],
    ['把检验条件补齐', 'Complete the test conditions'],
  ];
  const m = sugarReduction(
    sample,
    hydrolysis,
    progress,
    assay === 'silver' ? 'silver' : 'copper',
    alkaline === 'yes',
    heated === 'yes',
    amount,
  );
  return (
    <section className="chem-sugar">
      <div className="chem-sugar-title">
        {film.watch ? say(titles[d.chapter][0], titles[d.chapter][1]) : name(sample)}
      </div>
      {!film.watch ? (
        <>
          {assay === 'iodine' ? (
            <IodineTube strength={sugarHydrolysis(sample, hydrolysis).iodine} />
          ) : (
            <TestVessels states={[m]} silver={assay === 'silver'} />
          )}
          <div className="chem-sugar-note">
            {assay === 'iodine'
              ? say('另取一份样品作碘检验', 'A separate aliquot for the iodine test')
              : !m.valid
                ? say('条件不合适，不能判阴性', 'Invalid conditions, not a negative result')
                : heated === 'no'
                  ? say('尚未加热检验', 'Test has not been warmed')
                  : m.visible
                    ? say('出现还原性证据', 'Reducing evidence is visible')
                    : say('未出现明显还原性证据', 'No clear reducing evidence')}
          </div>
          <div className="chem-sugar-controls">
            <Segments
              label={say('样品', 'Sample')}
              value={sample}
              onChange={(v) => setSample(v as Sugar)}
              options={(['glucose', 'sucrose', 'maltose', 'starch', 'cellulose'] as Sugar[]).map(
                (s) => ({ value: s, label: name(s) }),
              )}
            />
            <Segments
              label={say('检验', 'Test')}
              value={assay}
              onChange={setAssay}
              options={[
                { value: 'copper', label: say('铜试剂', 'Copper') },
                { value: 'silver', label: say('银氨', 'Silver') },
                { value: 'iodine', label: say('碘', 'Iodine') },
              ]}
            />
            {sample !== 'glucose' ? (
              <Range
                label={say('完全水解部分的比例', 'Fully hydrolysed fraction')}
                value={hydrolysis}
                onChange={setHydrolysis}
                min={0}
                max={1}
                step={0.01}
              />
            ) : null}
            {assay !== 'iodine' ? (
              <>
                <Range
                  label={say('检验进度', 'Test progress')}
                  value={progress}
                  onChange={setProgress}
                  min={0}
                  max={1}
                  step={0.01}
                />
                <Range
                  label={say('样品C₆单元示意份数', 'Sample hexose-unit model amount')}
                  value={amount}
                  onChange={setAmount}
                  min={0}
                  max={2}
                  step={0.1}
                />
                <Segments
                  label={say('检验时呈碱性', 'Alkaline during testing')}
                  value={alkaline}
                  onChange={setAlkaline}
                  options={[
                    { value: 'yes', label: say('是', 'Yes') },
                    { value: 'no', label: say('否', 'No') },
                  ]}
                />
                <Segments
                  label={say('已加热', 'Warmed')}
                  value={heated}
                  onChange={setHeated}
                  options={[
                    { value: 'yes', label: say('是', 'Yes') },
                    { value: 'no', label: say('否', 'No') },
                  ]}
                />
                <div>
                  {assay === 'silver' ? 'Ag' : 'Cu₂O'}:{' '}
                  {(assay === 'silver' ? m.silver : m.copperOxide).toFixed(3)}{' '}
                  {say('示意份', 'model units')}
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : (
        <>
          {d.chapter === 0 ? (
            <>
              <SolubilityPanel p={d.progress} />
              <div className="chem-sugar-three">
                <span>{name('glucose')}</span>
                <span>{name('sucrose')}</span>
                <span>{name('starch')}</span>
              </div>
              <div className="chem-sugar-note">
                {d.progress < 0.5
                  ? say('冷水振荡', 'Mixing with cool water')
                  : say('淀粉加热后形成糊状体系', 'Warmed starch forms a paste')}
              </div>
            </>
          ) : null}
          {d.chapter === 1 || d.chapter === 2 ? (
            <>
              <TestVessels
                states={[sugarReduction('glucose', 0, d.progress, d.test)]}
                silver={d.chapter === 1}
              />
              <div className="chem-sugar-equation">
                {d.chapter === 1 ? '2Ag⁺ + 2e⁻ → 2Ag' : '2Cu(II) + 2e⁻ → 2Cu(I)'}
              </div>
              <div className="chem-sugar-note">
                {d.chapter === 1
                  ? say('金属银，不是白色银盐', 'Metallic silver, not a white silver salt')
                  : say('Cu₂O · 新制铜试剂、碱性、加热', 'Cu₂O · fresh reagent, alkaline, warmed')}
              </div>
            </>
          ) : null}
          {d.chapter === 3 ? (
            <>
              <IodineFood p={d.progress} />
              <div className="chem-sugar-equation">
                {say('蓝色支持淀粉存在', 'Blue colour supports starch presence')}
              </div>
            </>
          ) : null}
          {d.chapter === 4 ? (
            <>
              {d.progress < 0.52 ? (
                <PolymerSplit p={d.progress / 0.52} />
              ) : (
                <Neutralisation p={(d.progress - 0.52) / 0.48} say={say} />
              )}
              {d.progress < 0.52 ? (
                <div className="chem-sugar-note">
                  {say('链片段与单糖的简化对应', 'Simplified chain-to-monomer account')}
                </div>
              ) : null}
            </>
          ) : null}
          {d.chapter === 5 ? (
            <>
              <TestVessels
                states={[
                  sugarReduction('starch', 0, d.progress),
                  sugarReduction('starch', 1, d.progress),
                ]}
              />
              <div className="chem-sugar-two">
                <span>{say('未水解', 'Before hydrolysis')}</span>
                <span>{say('水解后', 'After hydrolysis')}</span>
              </div>
              <div className="chem-sugar-note">
                {say('两份样品分别检验', 'Separate sample portions')}
              </div>
            </>
          ) : null}
          {d.chapter === 6 ? (
            <>
              <TestVessels states={[sugarReduction('sucrose', 0, d.progress)]} />
              <div className="chem-sugar-equation">
                {say('未出现砖红色Cu₂O', 'No brick-red Cu₂O appears')}
              </div>
              <div className="chem-sugar-note">
                {say('同样为碱性、加热条件', 'Same alkaline, warmed conditions')}
              </div>
            </>
          ) : null}
          {d.chapter === 7 ? (
            <>
              <div className="chem-sugar-route">
                <span>{name('sucrose')} + H₂O</span>
                <i>↓</i>
                <span>
                  {name('glucose')} + {say('果糖', 'Fructose')}
                </span>
              </div>
              <TestVessels compact states={[sugarReduction('sucrose', 1, d.progress)]} />
              <div className="chem-sugar-note">
                {say('冷却并调至碱性后检验', 'Test after cooling and making alkaline')}
              </div>
            </>
          ) : null}
          {d.chapter === 8 ? (
            <>
              <TestVessels
                states={[
                  sugarReduction('sucrose', 0, d.progress),
                  sugarReduction('maltose', 0, d.progress),
                ]}
              />
              <div className="chem-sugar-two">
                <span>{name('sucrose')}</span>
                <span>{name('maltose')}</span>
              </div>
              <div className="chem-sugar-note">
                {say('均未经水解', 'Neither sample was hydrolysed')}
              </div>
            </>
          ) : null}
          {d.chapter === 9 ? (
            <>
              <LinkageComparison p={d.progress} say={say} />
              <div className="chem-sugar-note">
                {say('环形符号仅表示连接关系', 'Ring symbols show linkage only')}
              </div>
            </>
          ) : null}
          {d.chapter === 10 ? (
            <>
              <CottonHydrolysis p={d.progress} />
              <div className="chem-sugar-equation">
                {name('cellulose')} → {name('glucose')}
              </div>
              <div className="chem-sugar-note">
                {say('链片段示意 · 不是直接加铜试剂', 'Chain fragment · hydrolysis comes first')}
              </div>
            </>
          ) : null}
          {d.chapter === 11 ? (
            <>
              {d.progress < 0.4 ? (
                <Neutralisation p={d.progress / 0.4} say={say} />
              ) : (
                <TestVessels states={[sugarReduction('cellulose', 1, (d.progress - 0.4) / 0.6)]} />
              )}
              {d.progress >= 0.4 ? <div className="chem-sugar-note">Cu₂O</div> : null}
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
function TestVessels({
  states,
  silver = false,
  compact = false,
}: {
  states: ReturnType<typeof sugarReduction>[];
  silver?: boolean;
  compact?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    n = states.length;
  return (
    <svg
      className={`chem-sugar-svg ${compact ? 'compact' : ''}`}
      viewBox="0 0 320 250"
      role="img"
      aria-label={
        silver
          ? 'Silver deposits on the inner wall of a warmed alkaline sugar test.'
          : 'A warmed alkaline copper test forms a brick-red copper(I) oxide precipitate when a detectable reducing amount is present.'
      }
    >
      <defs>
        <linearGradient id={id}>
          <stop stopColor="#8b9697" />
          <stop offset=".35" stopColor="#eff1e9" />
          <stop offset=".55" stopColor="#b2bcb7" />
          <stop offset="1" stopColor="#737f80" />
        </linearGradient>
      </defs>
      <path
        d="M25 115V222H295V115"
        stroke="#c0c9bb"
        fill="#e8eee3"
        fillOpacity=".7"
        strokeWidth="2"
      />
      {states.map((m, i) => {
        const x = n === 1 ? 160 : 85 + 150 * i,
          f = m.visible ? m.fraction : 0;
        return (
          <g key={i}>
            <path
              d={`M${x - 29} 25V167Q${x - 29} 202 ${x} 202T${x + 29} 167V25`}
              stroke="#b6c0b0"
              fill="#f6f6ee"
              strokeWidth="2"
            />
            <path
              d={`M${x - 26} 113H${x + 26}V167Q${x + 26} 199 ${x} 199T${x - 26} 167Z`}
              fill={silver ? '#dde6da' : '#b6d1d2'}
              opacity={silver ? 0.6 : 1 - f * 0.55}
            />
            {silver ? (
              <>
                <path
                  d={`M${x - 25} ${190 - 90 * f}V168Q${x - 25} 198 ${x} 198T${x + 25} 168V${190 - 90 * f}`}
                  fill="none"
                  stroke={`url(#${id})`}
                  strokeWidth={f * 9}
                  opacity={m.visible ? 1 : 0}
                />
                <path
                  d={`M${x - 17} ${190 - 90 * f}V177`}
                  stroke="#fffdf0"
                  strokeWidth="2"
                  opacity={f}
                />
              </>
            ) : (
              <>
                <defs>
                  <clipPath id={`${id}-${i}`}>
                    <path
                      d={`M${x - 26} 113H${x + 26}V167Q${x + 26} 199 ${x} 199T${x - 26} 167Z`}
                    />
                  </clipPath>
                </defs>
                <path
                  d={`M${x - 26} ${198 - 45 * f}Q${x} ${194 - 45 * f} ${x + 26} ${198 - 45 * f}V205H${x - 26}Z`}
                  clipPath={`url(#${id}-${i})`}
                  fill="#bb866e"
                  opacity={f > 0 ? 0.85 : 0}
                />
                {Array.from({ length: 12 }, (_, j) => (
                  <circle
                    key={j}
                    cx={x - 19 + (j % 4) * 12}
                    cy={145 + Math.floor(j / 4) * 13}
                    r="2"
                    fill="#bb866e"
                    opacity={f * 0.6}
                  />
                ))}
              </>
            )}
            <path
              d={`M${x + 37} 33V222M${x + 37} 62H${x + 30}q-7 7 0 13H${x + 37}`}
              fill="none"
              stroke="#adb9a2"
              strokeWidth="2"
            />
          </g>
        );
      })}
      <text x="160" y="246" fontSize="20" textAnchor="middle" fill="#9d9b87">
        Δ
      </text>
    </svg>
  );
}
function SolubilityPanel({ p }: { p: number }) {
  return (
    <svg
      className="chem-sugar-svg"
      viewBox="0 0 320 235"
      role="img"
      aria-label="Glucose and sucrose crystals dissolve in water; starch remains dispersed in cool water and forms a paste on warming."
    >
      {(['glucose', 'sucrose', 'starch'] as Sugar[]).map((s, i) => {
        const x = 58 + i * 102,
          m = sugarSolubility(
            s,
            s === 'starch' && p > 0.5 ? (p - 0.5) * 2 : Math.min(1, p * 2),
            p > 0.5,
          );
        return (
          <g key={s}>
            <path
              d={`M${x - 29} 25V174Q${x - 29} 208 ${x} 208T${x + 29} 174V25`}
              fill="#f4f4ea"
              stroke="#b9c1ae"
              strokeWidth="2"
            />
            <path
              d={`M${x - 26} 105H${x + 26}V174Q${x + 26} 205 ${x} 205T${x - 26} 174Z`}
              fill={`rgb(${223 + 4 * m.gel},${232 - 8 * m.gel},${219 - 14 * m.gel})`}
            />
            {Array.from({ length: 9 }, (_, j) => (
              <path
                key={j}
                d={`M${x - 18 + (j % 3) * 13} ${179 + Math.floor(j / 3) * 6}l5-3 4 4-5 4Z`}
                fill="#b9baa4"
                opacity={s === 'starch' ? m.granules : 1 - m.dissolved}
              />
            ))}
            {s === 'starch' && p > 0.5 ? (
              <path
                d={`M${x - 22} 137q11-9 22 0t22 0M${x - 22} 153q11-9 22 0t22 0`}
                fill="none"
                stroke="#cecbb4"
                opacity={m.gel}
                strokeWidth="3"
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
function IodineFood({ p }: { p: number }) {
  return (
    <svg
      className="chem-sugar-svg"
      viewBox="0 0 320 225"
      role="img"
      aria-label="A drop of iodine solution stains a potato slice blue, supporting the presence of starch."
    >
      <ellipse cx="160" cy="160" rx="119" ry="51" fill="#d9c9a2" />
      <ellipse cx="160" cy="154" rx="114" ry="46" fill="#eee6ca" />
      <path
        d="M123 139q22-20 48-10t21 28q-18 27-52 17t-17-35"
        fill="#8586a5"
        opacity={Math.max(0, (p - 0.15) / 0.85)}
      />
      <path d="M154 12H166V60L161 73H159L154 60Z" stroke="#b8bda9" fill="#e6d8b9" strokeWidth="2" />
      {p < 0.45 ? <path d={`M160 ${76 + p * 110}q-7 13 0 15 7-2 0-15Z`} fill="#b59464" /> : null}
    </svg>
  );
}
function IodineTube({ strength }: { strength: number }) {
  return (
    <svg
      className="chem-sugar-svg"
      viewBox="0 0 320 220"
      role="img"
      aria-label="Iodine gives a blue response when sufficiently long starch remains."
    >
      <path
        d="M126 20V167Q126 202 160 202T194 167V20"
        fill="#f5f2e8"
        stroke="#bbc1b0"
        strokeWidth="2"
      />
      <path d="M129 111H191V167Q191 199 160 199T129 167Z" fill="#c7b18a" />
      <path d="M129 111H191V167Q191 199 160 199T129 167Z" fill="#8585a7" opacity={strength} />
    </svg>
  );
}
function PolymerSplit({ p }: { p: number }) {
  const points = Array.from({ length: 8 }, (_, i) => {
    const a = [35 + i * 35, 105 + Math.sin(i * 1.3) * 18],
      b = [42 + (i % 4) * 78, 60 + Math.floor(i / 4) * 100];
    return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
  });
  return (
    <svg
      className="chem-sugar-svg"
      viewBox="0 0 320 225"
      role="img"
      aria-label="An abbreviated polymer fragment separates into glucose units. It is a net endpoint illustration, not intermediate kinetics."
    >
      {points.slice(1).map((q, i) => (
        <path
          key={i}
          d={`M${points[i][0]} ${points[i][1]}L${q[0]} ${q[1]}`}
          stroke="#b1b99f"
          strokeWidth="3"
          opacity={1 - p}
        />
      ))}
      {points.map(([x, y], i) => (
        <g key={i}>
          <path
            d={`M${x - 13} ${y - 19}h26l13 19-13 19h-26l-13-19Z`}
            fill="#e3e6d3"
            stroke="#b7bda4"
          />
          <text x={x} y={y + 7} fontSize="20" textAnchor="middle" fill="#93a080">
            G
          </text>
        </g>
      ))}
      <text x="160" y="221" fontSize="20" textAnchor="middle" fill="#b4a07b">
        H₂O
      </text>
    </svg>
  );
}
function Neutralisation({ p, say }: { p: number; say: (a: string, b: string) => string }) {
  const ready = p > 0.62;
  return (
    <div className="chem-sugar-neutral">
      <svg
        className="chem-sugar-svg"
        viewBox="0 0 320 200"
        role="img"
        aria-label="The hydrolysate is cooled, neutralised and made alkaline before the copper test."
      >
        <path
          d="M95 44V158Q95 179 116 179H204Q225 179 225 158V44"
          fill="#eff1e5"
          stroke="#b6c1ab"
          strokeWidth="2"
        />
        <path d="M98 118H222V158Q222 176 204 176H116Q98 176 98 158Z" fill="#d8e1cf" />
        <path
          d="M154 4H166V31L161 45H159L154 31Z"
          stroke="#b5bda9"
          fill="#e6ecde"
          strokeWidth="2"
        />
        <path d={`M160 ${55 + 43 * (p % 1)}q-6 12 0 13 6-1 0-13Z`} fill="#b7c7a5" />
        <text
          x="160"
          y="154"
          fontSize="22"
          textAnchor="middle"
          fill={ready ? '#819a79' : '#ba9285'}
        >
          {ready ? 'OH⁻' : 'H⁺'}
        </text>
      </svg>
      <div className="chem-sugar-equation">H⁺ + OH⁻ → H₂O</div>
      <div className="chem-sugar-note">
        {ready
          ? say('已呈碱性，可继续检验', 'Alkaline; the test can proceed')
          : say('仍在调节，暂不判结果', 'Still adjusting; do not interpret yet')}
      </div>
    </div>
  );
}
function LinkageComparison({ p, say }: { p: number; say: (a: string, b: string) => string }) {
  return (
    <svg
      className="chem-sugar-svg"
      viewBox="0 0 320 300"
      role="img"
      aria-label="Simplified linkages: sucrose connects both anomeric carbons; maltose retains a free anomeric group that can open to an aldehyde."
    >
      <text x="160" y="20" fontSize="21" textAnchor="middle" fill="#949180">
        {say('蔗糖：两个位点都参与连接', 'Sucrose: both sites linked')}
      </text>
      <path
        d="M130 80L108 119H62L40 80 62 41H108Z M195 80L223 41 272 56V104L223 119Z"
        fill="#e8e4d1"
        stroke="#bfb79c"
        strokeWidth="2"
      />
      <path d="M130 80H195" stroke="#bba681" strokeWidth="4" />
      {[130, 195].map((x) => (
        <circle key={x} cx={x} cy="80" r="9" fill="#b7a281" />
      ))}
      <text x="85" y="87" fontSize="22" textAnchor="middle" fill="#9b967d">
        G
      </text>
      <text x="237" y="87" fontSize="22" textAnchor="middle" fill="#9b967d">
        F
      </text>
      <text x="160" y="164" fontSize="21" textAnchor="middle" fill="#8d9b81">
        {say('麦芽糖：保留一个自由端', 'Maltose: one free end')}
      </text>
      <path
        d="M130 230L108 269H62L40 230 62 191H108Z M280 230L258 269H212L190 230 212 191H258Z"
        fill="#e2e8d7"
        stroke="#b4bea3"
        strokeWidth="2"
      />
      <path d="M130 230H190" stroke="#b1b99b" strokeWidth="4" />
      <circle cx="130" cy="230" r="9" fill="#b7a281" />
      <circle cx="280" cy="230" r={9 + 3 * p} fill="#a5bc95" />
      <text x="85" y="237" fontSize="22" textAnchor="middle" fill="#91a07d">
        G
      </text>
      <text x="235" y="237" fontSize="22" textAnchor="middle" fill="#91a07d">
        G
      </text>
    </svg>
  );
}
function CottonHydrolysis({ p }: { p: number }) {
  return (
    <svg
      className="chem-sugar-svg"
      viewBox="0 0 320 245"
      role="img"
      aria-label="Cellulose fibres are treated to hydrolyse their chains; glucose units appear. Neutralisation and testing follow in a separate chapter."
    >
      <path
        d="M97 32V194Q97 225 160 225T223 194V32"
        fill="#f3f1e5"
        stroke="#b8beaa"
        strokeWidth="2"
      />
      <path d="M100 124H220V194Q220 222 160 222T100 194Z" fill="#e1dec9" />
      {Array.from({ length: 10 }, (_, i) => (
        <path
          key={i}
          d={`M${115 + i * 9} 185q-20-15 3-23t-2-23q-15-15 3-25`}
          stroke="#fdfcf0"
          strokeWidth="3"
          fill="none"
          opacity={1 - p}
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} opacity={p}>
          <circle cx={122 + (i % 3) * 38} cy={147 + Math.floor(i / 3) * 38} r="13" fill="#d2dcbf" />
          <text
            x={122 + (i % 3) * 38}
            y={154 + Math.floor(i / 3) * 38}
            fontSize="20"
            textAnchor="middle"
            fill="#93a57c"
          >
            G
          </text>
        </g>
      ))}
      <text x="160" y="73" fontSize="21" textAnchor="middle" fill="#ad9c7b">
        H⁺, H₂O
      </text>
    </svg>
  );
}
