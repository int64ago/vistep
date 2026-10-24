import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  glucoseRingOpening,
  glucoseTestSequence,
  glucoseOxidationAccount,
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
  const span = (c: number) =>
    film.chapters.length ? (film.chapters[c + 1]?.at ?? film.duration) - film.chapters[c].at : 23;
  type Manual = {
    chapter: number;
    progress: number;
    sample: Sugar;
    hydrolysis: number;
    assay: string;
    alkaline: string;
    heated: string;
    amount: number;
    metal: number;
    view: 'lesson' | 'test';
    testProgress: number;
  };
  const fromFilm = (): Manual => {
    const shot = sugarDirector(film.chapter, film.chapterProgress);
    return {
      chapter: shot.chapter,
      progress: shot.progress,
      sample: shot.sugar,
      hydrolysis: shot.chapter === 5 && shot.progress > 0.72 ? 0.5 : shot.hydrolysis,
      assay: shot.chapter === 3 ? 'iodine' : shot.test,
      alkaline:
        (shot.chapter === 4 && shot.progress < 0.82) ||
        (shot.chapter === 11 && shot.progress < 0.25)
          ? 'no'
          : 'yes',
      heated: 'yes',
      amount: 1,
      metal: 2,
      view: 'lesson',
      testProgress:
        shot.chapter === 1 || shot.chapter === 2
          ? glucoseTestSequence(
              shot.progress,
              shot.chapter === 1,
              en ? 'en' : 'zh',
              span(shot.chapter),
            ).shot === 'observation'
            ? Math.min(1, shot.progress / 0.13)
            : glucoseTestSequence(
                shot.progress,
                shot.chapter === 1,
                en ? 'en' : 'zh',
                span(shot.chapter),
              ).oxidation
          : shot.chapter === 5
            ? Math.min(1, shot.progress / 0.72)
            : shot.chapter === 7
              ? Math.max(0, (shot.progress - 0.4) / 0.6)
              : shot.chapter === 11
                ? Math.max(0, (shot.progress - 0.4) / 0.6)
                : shot.progress,
    };
  };
  const [manual, setManual] = useState<Manual | null>(null);
  const [wasWatching, setWasWatching] = useState(film.watch);
  if (film.watch !== wasWatching) {
    setWasWatching(film.watch);
    if (!film.watch && manual === null) setManual(fromFilm());
  }
  const state = film.watch ? fromFilm() : (manual ?? fromFilm());
  const change = (patch: Partial<Manual>) => setManual({ ...state, ...patch });
  const { sample, hydrolysis, progress, assay, alkaline, heated, amount, metal } = state;
  const d = sugarDirector(state.chapter, progress);
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
    ['环里的醛基，怎样出现？', 'Glucose opens a reactive end'],
    ['糖失去的电子，去了哪里？', 'From glucose to copper'],
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
    state.testProgress,
    assay === 'silver' ? 'silver' : 'copper',
    alkaline === 'yes',
    heated === 'yes',
    amount,
    metal,
  );
  return (
    <section
      className="chem-sugar"
      data-sugar-chapter={d.chapter}
      data-sugar-progress={d.progress}
      data-sugar-view={film.watch ? 'lesson' : state.view}
    >
      <div className="chem-sugar-title">
        {film.watch || state.view === 'lesson'
          ? say(titles[d.chapter][0], titles[d.chapter][1])
          : name(sample)}
      </div>
      {!film.watch && state.view === 'test' ? (
        <>
          {assay === 'iodine' ? (
            <IodineTube strength={amount > 0 ? sugarHydrolysis(sample, hydrolysis).iodine : 0} />
          ) : (
            <TestVessels states={[m]} silver={assay === 'silver'} />
          )}
          <div
            className="chem-sugar-note"
            data-sugar-extent={m.extent}
            data-sugar-metal-left={m.metalRemaining}
            data-sugar-reducing-left={m.remainingReducing}
          >
            {assay === 'iodine'
              ? amount === 0
                ? say('空白样品，不判断糖的性质', 'Blank sample: no conclusion about a sugar')
                : say('另取一份样品作碘检验', 'A separate aliquot for the iodine test')
              : metal === 0
                ? say('未加入金属试剂，不能判阴性', 'No metal reagent: not a negative test')
                : amount === 0
                  ? say('空白样品，不判断糖的性质', 'Blank sample: no conclusion about a sugar')
                  : !m.valid
                    ? say('条件不合适，不能判阴性', 'Invalid conditions, not a negative result')
                    : heated === 'no'
                      ? say('尚未加热检验', 'Test has not been warmed')
                      : m.visible
                        ? say('出现还原性证据', 'Reducing evidence is visible')
                        : say('未出现明显还原性证据', 'No clear reducing evidence')}
          </div>
          {assay !== 'iodine' ? (
            <div className="chem-sugar-inventory">
              <span>
                {say('金属剩余', 'Metal left')}: {m.metalRemaining.toFixed(2)}
              </span>
              <span>
                {say('还原端剩余', 'Reducing ends left')}: {m.remainingReducing.toFixed(2)}
              </span>
            </div>
          ) : null}
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
            <GlucoseMechanism
              p={d.progress}
              silver={d.chapter === 1}
              locale={en ? 'en' : 'zh'}
              duration={span(d.chapter)}
              say={say}
            />
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
                iodineFirst={d.progress > 0.72}
                states={
                  d.progress > 0.72
                    ? [sugarReduction('starch', 0.5, 1), sugarReduction('starch', 0.5, 1)]
                    : [
                        sugarReduction('starch', 0, d.progress / 0.72),
                        sugarReduction('starch', 1, d.progress / 0.72),
                      ]
                }
              />
              <div className="chem-sugar-two">
                <span>
                  {d.progress > 0.72
                    ? say('碘检验', 'Iodine test')
                    : say('未水解', 'Before hydrolysis')}
                </span>
                <span>
                  {d.progress > 0.72
                    ? say('铜检验 · 加热', 'Copper · warmed')
                    : say('水解后', 'After hydrolysis')}
                </span>
              </div>
              <div className="chem-sugar-note">
                {d.progress > 0.72
                  ? say('部分水解，长链与还原性产物共存', 'Partial hydrolysis: both tests positive')
                  : say('相同 C₆ 总量，水解后自由端更多', 'Same C₆ total; more free ends')}
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
              <DisaccharideSplit p={Math.min(1, d.progress / 0.4)} say={say} />
              <TestVessels
                compact
                states={[sugarReduction('sucrose', 1, Math.max(0, (d.progress - 0.4) / 0.6))]}
              />
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
            </>
          ) : null}
          {d.chapter === 10 ? (
            <>
              <CottonHydrolysis p={d.progress} />
              <div className="chem-sugar-equation">
                {name('cellulose')} → {name('glucose')}
              </div>
              <div className="chem-sugar-note">
                {say('链片段示意 · 不是直接加铜试剂', 'Net chain hydrolysis')}
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
      {!film.watch ? (
        <div className="chem-sugar-controls">
          <Segments
            label={say('观察方式', 'View')}
            value={state.view}
            onChange={(view) => change({ view: view as Manual['view'] })}
            options={[
              { value: 'lesson', label: say('原理镜头', 'Principle') },
              { value: 'test', label: say('检验预测', 'Test prediction') },
            ]}
          />
          {state.view === 'lesson' ? (
            <Range
              label={say('镜头进度', 'Scene progress')}
              value={progress}
              onChange={(progress) => change({ progress })}
              min={0}
              max={1}
              step={0.01}
            />
          ) : (
            <>
              <Segments
                label={say('样品', 'Sample')}
                value={sample}
                onChange={(v) => change({ sample: v as Sugar })}
                options={(['glucose', 'sucrose', 'maltose', 'starch', 'cellulose'] as Sugar[]).map(
                  (s) => ({ value: s, label: name(s) }),
                )}
              />
              <Segments
                label={say('检验', 'Test')}
                value={assay}
                onChange={(assay) => change({ assay })}
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
                  onChange={(hydrolysis) => change({ hydrolysis })}
                  min={0}
                  max={1}
                  step={0.01}
                />
              ) : null}
              {assay !== 'iodine' ? (
                <>
                  <Range
                    label={say('检验进度', 'Test progress')}
                    value={state.testProgress}
                    onChange={(testProgress) => change({ testProgress })}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                  <Range
                    label={say('样品C₆单元示意份数', 'Sample hexose-unit model amount')}
                    value={amount}
                    onChange={(amount) => change({ amount })}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <Range
                    label={say('金属试剂示意份数', 'Metal reagent model units')}
                    value={metal}
                    onChange={(metal) => change({ metal })}
                    min={0}
                    max={4}
                    step={0.1}
                  />
                  <div className="chem-sugar-condition">
                    <span>{say('检验时呈碱性', 'Alkaline during testing')}</span>
                    <Segments
                      label={say('检验时呈碱性', 'Alkaline during testing')}
                      value={alkaline}
                      onChange={(alkaline) => change({ alkaline })}
                      options={[
                        { value: 'yes', label: say('是', 'Yes') },
                        { value: 'no', label: say('否', 'No') },
                      ]}
                    />
                  </div>
                  <div className="chem-sugar-condition">
                    <span>{say('已加热', 'Warmed')}</span>
                    <Segments
                      label={say('已加热', 'Warmed')}
                      value={heated}
                      onChange={(heated) => change({ heated })}
                      options={[
                        { value: 'yes', label: say('是', 'Yes') },
                        { value: 'no', label: say('否', 'No') },
                      ]}
                    />
                  </div>
                  <div>
                    {assay === 'silver' ? 'Ag' : 'Cu₂O'}:{' '}
                    {(assay === 'silver' ? m.silver : m.copperOxide).toFixed(3)}{' '}
                    {say('示意份', 'model units')}
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
function TestVessels({
  states,
  silver = false,
  compact = false,
  iodineFirst = false,
}: {
  states: ReturnType<typeof sugarReduction>[];
  silver?: boolean;
  compact?: boolean;
  iodineFirst?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    n = states.length;
  return (
    <svg
      className={`chem-sugar-svg ${compact ? 'compact' : ''}`}
      viewBox="0 0 320 230"
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
      {!iodineFirst ? (
        <path
          d="M25 115V222H295V115"
          stroke="#c0c9bb"
          fill="#e8eee3"
          fillOpacity=".7"
          strokeWidth="2"
        />
      ) : null}
      {states.map((m, i) => {
        const x = n === 1 ? 160 : 85 + 150 * i,
          f = m.visible ? Math.min(1, m.extent / 2) : 0,
          iodine = iodineFirst && i === 0;
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
              fill={iodine ? '#8585a7' : silver ? '#dde6da' : '#b6d1d2'}
              opacity={iodine ? m.sample.iodine : silver ? 0.6 : 1 - f * 0.55}
            />
            {iodine ? null : silver ? (
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
      <text x="160" y="215" fontSize="20" textAnchor="middle" fill="#b4a07b">
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
  if (p > 0.42)
    return (
      <div>
        <GlucoseStructure opening={Math.min(1, (p - 0.42) / 0.35)} linkedResidue say={say} />
        <div className="chem-sugar-note">
          {say('麦芽糖的自由端开环，C₄—O—G 连接保留', 'Free end opens; C₄–O–G stays')}
        </div>
      </div>
    );
  return (
    <svg
      className="chem-sugar-svg"
      viewBox="0 0 320 300"
      role="img"
      aria-label="Simplified linkages: sucrose connects both anomeric carbons; maltose retains a free anomeric group that can open to an aldehyde."
    >
      <text x="160" y="26" fontSize="21" textAnchor="middle" fill="#949180">
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
      viewBox="0 0 320 235"
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

function GlucoseMechanism({
  p,
  silver,
  locale,
  duration,
  say,
}: {
  p: number;
  silver: boolean;
  locale: 'zh' | 'en';
  duration: number;
  say: (a: string, b: string) => string;
}) {
  const d = glucoseTestSequence(p, silver, locale, duration),
    m = sugarReduction('glucose', 0, d.oxidation, silver ? 'silver' : 'copper');
  const account = glucoseOxidationAccount(m.extent);
  return (
    <div
      className="chem-sugar-mechanism"
      data-sugar-shot={d.shot}
      data-opening={d.opening}
      data-oxidation={m.extent}
    >
      {d.shot === 'observation' ? (
        <>
          <TestVessels
            states={[
              sugarReduction('glucose', 0, Math.min(1, p / 0.13), silver ? 'silver' : 'copper'),
            ]}
            silver={silver}
          />
          <div className="chem-sugar-note">
            {silver
              ? say('银镜是金属银，电子从哪里来？', 'Silver coats the inner wall')
              : say('蓝色铜试剂 → 砖红色 Cu₂O', 'Blue copper reagent → brick-red Cu₂O')}
          </div>
        </>
      ) : d.shot === 'prediction' ? (
        <>
          {silver ? (
            <div className="chem-sugar-replenish">
              <div className="chem-sugar-pool">
                <span>⬡</span>
                <span>⬡</span>
                <span>⬡</span>
                <span>⬡</span>
              </div>
              <div>{say('多数为环状', 'Mostly rings')}</div>
              <strong style={{ color: d.replenishment > 0.15 ? '#8eaa78' : undefined }}>⇌</strong>
              <div>
                —CHO <span className="chem-sugar-c1">C₁</span>
              </div>
              <strong style={{ color: d.replenishment > 0.4 ? '#aa986d' : undefined }}>↓</strong>
              <div>—COO⁻ + 2e⁻</div>
              <div className="chem-sugar-note">
                {say('开链被消耗，平衡继续补充', 'Open chains react and are replenished')}
              </div>
            </div>
          ) : (
            <>
              <TestVessels
                states={[
                  sugarReduction('glucose', 0, 1, 'copper', false),
                  sugarReduction('glucose', 0, 1),
                ]}
              />
              <div className="chem-sugar-two">
                <span>
                  {say('仍呈酸性', 'Still acidic')}
                  <br />
                  {say('检验无效', 'Invalid test')}
                </span>
                <span>
                  {say('碱性、加热', 'Alkaline + heat')}
                  <br />
                  {say('阳性', 'Positive')}
                </span>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <GlucoseStructure opening={d.opening} oxidised={d.product ? 1 : 0} say={say} />
          {d.shot === 'opening' ? (
            <div className="chem-sugar-mechanism-caption">
              {d.opening < 1
                ? say('追踪 C₁：半缩醛可以开环', 'Follow C₁: the hemiacetal can open')
                : say('同一个 C₁，现在属于醛端', 'The same C₁ is now an aldehyde end')}
            </div>
          ) : (
            <>
              <div
                className="chem-sugar-electron-row"
                data-electrons={account.electrons}
                data-metal-reduced={m.metalReduced}
              >
                <span className="chem-sugar-c1">C₁: {d.product ? '+3' : '+1'}</span>
                <svg
                  viewBox="0 0 210 62"
                  role="img"
                  aria-label={say(
                    '两电子净转移，分别还原两个金属中心；不是微观反应路线。',
                    'Two-electron net transfer reduces two metal centres; not an elementary pathway.',
                  )}
                >
                  {[0, 1].map((i) => (
                    <g key={i} data-metal-site={i}>
                      <path d={`M16 ${17 + i * 30}H144`} stroke="#c2c9b5" strokeWidth="1.5" />
                      <circle
                        cx={16 + 128 * d.oxidation}
                        cy={17 + i * 30}
                        r="4"
                        fill="#ac9b78"
                        opacity={d.oxidation <= 0 || d.product ? 0 : 1}
                      />
                      <rect
                        x="143"
                        y={2 + i * 30}
                        width="66"
                        height="28"
                        rx="12"
                        fill={d.product ? '#e0dfcf' : '#e7ece1'}
                      />
                      <text
                        x="176"
                        y={24 + i * 30}
                        textAnchor="middle"
                        fontSize="22"
                        fill="#8b967f"
                      >
                        {silver ? (d.product ? 'Ag' : 'Ag⁺') : d.product ? 'Cu(I)' : 'Cu(II)'}
                      </text>
                    </g>
                  ))}
                  <text x="73" y="39" textAnchor="middle" fontSize="22" fill="#a89a7c">
                    2e⁻
                  </text>
                </svg>
              </div>
              <div className="chem-sugar-note">
                {silver
                  ? say('醛端被氧化，金属银留下', 'C₁ oxidation · Ag reduction')
                  : say('醛端被氧化，Cu₂O 留下', 'C₁ oxidation · Cu(II) reduction')}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function GlucoseStructure({
  opening,
  oxidised = 0,
  linkedResidue = false,
  say,
}: {
  opening: number;
  oxidised?: number;
  linkedResidue?: boolean;
  say: (a: string, b: string) => string;
}) {
  const g = glucoseRingOpening(opening),
    points = Object.fromEntries(g.atoms.map((a) => [a.id, a]));
  const line = (a: string, b: string, opacity = 1, offset = 0) => {
    const u = points[a],
      v = points[b],
      dx = v.x - u.x,
      dy = v.y - u.y,
      l = Math.hypot(dx, dy),
      ox = (-dy / l) * offset,
      oy = (dx / l) * offset;
    return (
      <line
        key={`${a}-${b}-${offset}`}
        data-sugar-bond={`${a}-${b}`}
        x1={u.x + ox}
        y1={u.y + oy}
        x2={v.x + ox}
        y2={v.y + oy}
        stroke="#b7bca4"
        strokeWidth="2.5"
        opacity={opacity}
      />
    );
  };
  const oxidisedEnd = oxidised > 0.65;
  return (
    <div
      className="chem-sugar-structure"
      data-open-progress={g.progress}
      data-end={oxidisedEnd ? 'carboxylate' : g.progress > 0.9 ? 'aldehyde' : 'hemiacetal'}
    >
      <svg
        className="chem-sugar-svg"
        viewBox={linkedResidue ? '0 0 320 240' : '0 0 320 190'}
        role="img"
        aria-label={say(
          '同一组碳与氧从环状半缩醛变为开链醛端；只画关键连接，不表示立体结构或微观路径。',
          'The same carbon and oxygen sites change from a cyclic hemiacetal to an open aldehyde end. Key connectivity, not stereochemistry or an elementary mechanism.',
        )}
      >
        {['C1', 'C2', 'C3', 'C4', 'C5'].map((a, i) => line(a, `C${i + 2}`))}
        {line('C5', 'O5')}
        {line('O5', 'C1', g.ringBond)}
        {line('C1', 'O1')}
        {line('C1', 'O1', g.carbonyl, 6)}
        {g.progress > 0.8 ? (
          <line
            x1={points.C1.x}
            y1={points.C1.y}
            x2="298"
            y2="110"
            stroke="#b7bca4"
            strokeWidth="2.5"
          />
        ) : null}
        {g.atoms.map((a) => (
          <g key={a.id} data-sugar-atom={a.id}>
            <circle
              cx={a.x}
              cy={a.y}
              r={a.id === 'C1' ? 18 : a.id.startsWith('O') ? 17 : 14}
              fill={a.id === 'C1' ? '#eed3a3' : '#f5f4eb'}
            />
            <text
              x={a.x}
              y={a.y + 7}
              textAnchor="middle"
              fontSize="22"
              fill={a.id === 'C1' ? '#876538' : a.id.startsWith('O') ? '#8b9e81' : '#8c9680'}
            >
              {a.id === 'C1'
                ? 'C₁'
                : a.id.startsWith('C')
                  ? a.id.slice(1)
                  : a.id === 'O5'
                    ? g.progress > 0.65
                      ? 'OH'
                      : 'O'
                    : g.progress > 0.65
                      ? 'O'
                      : 'OH'}
            </text>
          </g>
        ))}
        {g.progress > 0.8 ? (
          <g data-sugar-end-group="true">
            <rect x="278" y="96" width="40" height="27" rx="12" fill="#f5f4eb" />
            <text
              x="298"
              y="118"
              fontSize="22"
              textAnchor="middle"
              fill={oxidisedEnd ? '#8b9e81' : '#9d9176'}
            >
              {oxidisedEnd ? 'O⁻' : 'H'}
            </text>
          </g>
        ) : null}
        {linkedResidue ? (
          <g data-linked-residue="C4-glycoside">
            <line
              x1={points.C4.x}
              y1={points.C4.y}
              x2={points.C4.x}
              y2={points.C4.y + 80}
              stroke="#b7bca4"
              strokeWidth="2.5"
            />
            <circle cx={points.C4.x} cy={points.C4.y + 40} r="13" fill="#f5f4eb" />
            <text
              x={points.C4.x}
              y={points.C4.y + 47}
              textAnchor="middle"
              fontSize="22"
              fill="#8b9e81"
            >
              O
            </text>
            <rect
              x={points.C4.x - 21}
              y={points.C4.y + 65}
              width="42"
              height="30"
              rx="12"
              fill="#e2e8d7"
            />
            <text
              x={points.C4.x}
              y={points.C4.y + 87}
              fontSize="22"
              textAnchor="middle"
              fill="#91a07d"
            >
              G
            </text>
          </g>
        ) : null}
        {!linkedResidue ? (
          <text
            x="160"
            y={linkedResidue ? 225 : 178}
            textAnchor="middle"
            fontSize="20"
            fill="#9aa38e"
          >
            {say('其余 H / OH 省略', 'Other H / OH groups omitted')}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

function DisaccharideSplit({ p, say }: { p: number; say: (a: string, b: string) => string }) {
  const x1 = 137 - 47 * p,
    x2 = 183 + 47 * p;
  return (
    <div className="chem-sugar-disaccharide">
      <svg
        viewBox="0 0 320 60"
        role="img"
        aria-label={say(
          '同一个葡萄糖单元和果糖单元在水解后分开；净变化示意。',
          'The same glucose and fructose units separate after hydrolysis; a net account.',
        )}
      >
        <path d={`M${x1} 29H${x2}`} stroke="#b6ad8c" strokeWidth="3" opacity={1 - p} />
        {[
          ['G', x1],
          ['F', x2],
        ].map(([id, x]) => (
          <g key={id} data-sugar-unit={id}>
            <rect
              x={Number(x) - 23}
              y="6"
              width="46"
              height="46"
              rx="18"
              fill={id === 'G' ? '#e1e7d4' : '#ece4ce'}
            />
            <text x={x} y="36" fontSize="23" textAnchor="middle" fill="#96a17f">
              {id}
            </text>
          </g>
        ))}
        <text x="160" y="36" fontSize="22" textAnchor="middle" fill="#a9a486" opacity={p}>
          +
        </text>
      </svg>
      <div>
        {p < 0.4 ? say('蔗糖 + H₂O', 'Sucrose + H₂O') : say('葡萄糖 + 果糖', 'Glucose + fructose')}
      </div>
    </div>
  );
}
