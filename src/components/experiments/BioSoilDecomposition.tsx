import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range } from '../lab/Controls';
import {
  soilClamp,
  litterState,
  litterRecord,
  leafHoles,
  sampleTransfer,
  assayResult,
  reagentDrops,
  carbonPools,
  carbonMarker,
  decomposerPath,
  soilDirector,
  soilChapterSeconds,
} from '../../models/bio-soil-decomposition';
import '../../styles/bio-soil-decomposition.css';
type Say = (z: string, e: string) => string;
const colors = ['#a59659', '#be8b4e', '#6b927c'];
function Leaf({ x, y, remaining, id }: { x: number; y: number; remaining: number; id: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <mask id={id}>
          <path d="M0-48Q48-12 0 51Q-43 2 0-48Z" fill="white" />
          {leafHoles.map((h) => (
            <circle
              key={h.id}
              cx={h.x}
              cy={h.y}
              r={h.r * Math.sqrt(1 - remaining) * 3}
              fill="black"
            />
          ))}
        </mask>
      </defs>
      <path d="M0-48Q48-12 0 51Q-43 2 0-48Z" fill="#a58d59" mask={`url(#${id})`} />
      <path
        d="M0 48V-40m0 22 17-16M0 4-17-13M0 24l14-14"
        stroke="#d0c28f"
        fill="none"
        strokeWidth="2"
      />
    </g>
  );
}
function Pots({
  w,
  s,
  days,
  moisture,
  activity,
  question = false,
  predict = false,
}: {
  w: number;
  s: Say;
  days: number;
  moisture: number;
  activity: number;
  question?: boolean;
  predict?: boolean;
}) {
  const id = useId();
  return (
    <>
      <div className="bsd20-pair-label">
        <span>{predict ? s('更干燥', 'Drier') : s('处理土', 'Treated soil')}</span>
        <span>{predict ? s('适度湿润', 'Moist') : s('自然土', 'Natural soil')}</span>
      </div>
      <svg
        viewBox={`0 20 ${w} 198`}
        role="img"
        aria-label={s(
          '同样的叶片在两份土壤中的模型比较',
          'Model comparison of matched leaves in two soils',
        )}
      >
        {[activity, 1].map((a, i) => {
          const x = w * (i === 0 ? 0.25 : 0.75),
            r = litterState(days, a, predict && i === 1 ? 0.5 : moisture).remaining;
          return (
            <g key={i} data-pot={i} data-remaining={r}>
              <path
                d={`M${x - 50} 67v122q50 20 100 0V67`}
                stroke="#9faaa1"
                fill="#eef1e8"
                strokeWidth="2"
              />
              <path d={`M${x - 48} 119h96v68q-48 17-96 0Z`} fill="#8d7c60" />
              <ellipse cx={x} cy="119" rx="48" ry="9" fill="#ac997a" />
              <Leaf x={x} y={85} remaining={r} id={`${id}-${i}`} />
              <text x={x} y="216" textAnchor="middle">
                {question ? '?' : `${(100 * r).toFixed(0)}%`}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="bsd20-note">
        {question
          ? s('落叶减少了，碳去了哪里？', 'The leaf shrinks. Where is its carbon?')
          : predict
            ? s('同土同时间 · 模型预测', 'Same soil and time · prediction')
            : s('模型余量 · 同温同湿', 'Model remainder · matched conditions')}
      </div>
    </>
  );
}
function Mechanism({
  w,
  s,
  p,
  enzyme,
  uptake,
  starch = false,
}: {
  w: number;
  s: Say;
  p: number;
  enzyme: boolean;
  uptake: boolean;
  starch?: boolean;
}) {
  const m = decomposerPath(p, w, enzyme, uptake);
  return (
    <>
      <svg
        viewBox={`0 0 ${w} 242`}
        role="img"
        aria-label={s(
          '胞外切分后，同一批碳标记经入口进入微生物',
          'Extracellular breakdown followed by entry of the same carbon markers',
        )}
        data-enzyme={enzyme}
        data-uptake={uptake}
      >
        <path
          d={`M${m.gate.x - m.gate.half} 157H50Q28 157 28 181v33q0 23 22 23h${w - 100}q22 0 22-23v-33q0-24-22-24H${m.gate.x + m.gate.half}`}
          fill="#e1ebe2"
          stroke="#6e8c76"
          strokeWidth={m.gate.membraneStroke}
        />
        <path
          data-gate-clear-width={2 * m.gate.half - m.gate.wallStroke}
          d={`M${m.gate.x - m.gate.half} ${m.gate.top}V${m.gate.bottom}M${m.gate.x + m.gate.half} ${m.gate.top}V${m.gate.bottom}`}
          stroke="#877b64"
          strokeWidth={m.gate.wallStroke}
          strokeLinecap="round"
        />
        {m.bonds.map((b) => {
          const a = m.units.find((x) => x.id === b.a)!,
            v = m.units.find((x) => x.id === b.b)!;
          return (
            <path
              key={b.id}
              d={`M${a.x + 13} ${a.y}L${v.x - 13} ${v.y}`}
              fill="none"
              stroke="#a79061"
              strokeWidth="5"
              opacity={b.intact}
            />
          );
        })}
        {enzyme && (
          <g transform={`translate(${m.enzyme.x} ${m.enzyme.y})`}>
            <path
              d="M-27-13Q-16-31 0-20Q16-31 27-13L18 1Q0-9-18 1Z"
              fill="#7b9b86"
              stroke="#53765e"
            />
            <text x="0" y="-29" textAnchor="middle">
              {s('胞外酶', 'Outside enzyme')}
            </text>
          </g>
        )}
        {m.units.map((u) => (
          <g
            key={u.id}
            data-carbon-id={u.id}
            data-inside={u.inside}
            transform={`translate(${u.x} ${u.y})`}
          >
            <rect
              x={-m.gate.markerHalfWidth}
              y={-m.gate.markerHalfHeight}
              width={m.gate.markerHalfWidth * 2}
              height={m.gate.markerHalfHeight * 2}
              strokeWidth={m.gate.markerStroke}
              rx="8"
              fill={u.inside ? '#c4d6be' : '#e2cea3'}
              stroke="#9b9475"
            />
            <text textAnchor="middle" y="5">
              {u.id}
            </text>
          </g>
        ))}
        {p < 0.49 && (
          <text x={w / 2} y="208" textAnchor="middle">
            {s('微生物细胞', 'Microbial cell')}
          </text>
        )}
      </svg>
      <div className="bsd20-note">
        {!enzyme
          ? s('新样对照：不切分', 'Fresh sample: no cleavage')
          : m.further < 0.9
            ? s('胞外切分 · 碳份额示意', 'Outside cleavage · carbon portions')
            : !uptake
              ? s('新样对照：不吸收', 'Fresh sample: no uptake')
              : s('碳份额示意 · 后续步骤合并', 'Carbon portions · steps grouped')}
      </div>
    </>
  );
}
function Tube({
  x,
  y = 38,
  name,
  fill,
  precip = 0,
  ml = 10,
}: {
  x: number;
  y?: number;
  name: string;
  fill: string;
  precip?: number;
  ml?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-20 0v116q0 21 20 21t20-21V0" fill="#edf2ed" stroke="#9aaca7" strokeWidth="2" />
      <path
        d={`M-18 ${137 - ml * 8}h36v${Math.max(0, ml * 8 - 21)}q0 19-18 19t-18-19Z`}
        fill={fill}
      />
      <ellipse cx="0" cy="0" rx="20" ry="4" fill="none" stroke="#9aaca7" />
      {Array.from({ length: 30 }, (_, i) => (
        <circle
          key={i}
          cx={-12 + (i % 6) * 4.8}
          cy={124 + Math.floor(i / 6) * 2}
          r="2"
          opacity={soilClamp(precip * 30 - i)}
          fill="#a85d36"
        />
      ))}
      <text x="0" y="164" textAnchor="middle">
        {name}
      </text>
    </g>
  );
}
function Tests({
  w,
  s,
  p,
  day,
  use,
  heat,
  kind,
  puzzle = false,
}: {
  w: number;
  s: Say;
  p: number;
  day: number;
  use: number;
  heat: boolean;
  kind: 'iodine' | 'fehling';
  puzzle?: boolean;
}) {
  return (
    <>
      <div className="bsd20-note">
        {puzzle
          ? s('模型：淀粉少，糖也少？', 'Model: little starch and little sugar?')
          : s(
              kind === 'iodine' ? '等份检测剩余淀粉' : '等份检测还原性产物',
              kind === 'iodine'
                ? 'Separate aliquots: remaining starch'
                : 'Separate aliquots: reducing products',
            )}
      </div>
      <svg
        viewBox={`0 0 ${w} 226`}
        role="img"
        aria-label={s(
          '相同条件下分别检测A与B的独立样品',
          'Independent A and B aliquots tested under matched conditions',
        )}
      >
        {kind === 'fehling' && heat && (
          <path
            d={`M${puzzle ? w * 0.55 : 25} 83H${w - 25}v99H${puzzle ? w * 0.55 : 25}Z`}
            fill="#dbe7e8"
            stroke="#a5bfc2"
          />
        )}
        {[true, false].map((active, i) => {
          const x = w * (i === 0 ? 0.28 : 0.72),
            r = assayResult(day, puzzle ? true : active, use, heat, p),
            testKind = puzzle ? (i === 0 ? 'iodine' : 'fehling') : kind,
            fill =
              testKind === 'iodine'
                ? `color-mix(in srgb, #344369 ${r.iodine * 100}%, #e6d5a7)`
                : '#a9d1d8';
          return (
            <g key={i} data-assay={i} data-iodine={r.iodine} data-precipitate={r.precipitate}>
              <Tube
                x={x}
                fill={fill}
                precip={testKind === 'fehling' ? r.precipitate : 0}
                name={
                  puzzle ? `A${i + 1}` : `${i === 0 ? 'A' : 'B'}${kind === 'iodine' ? '1' : '2'}`
                }
              />
              {reagentDrops(p).map(
                (d) =>
                  d.visible && (
                    <circle
                      key={d.id}
                      cx={x}
                      cy={8 + 80 * d.phase}
                      r="4"
                      fill={kind === 'iodine' ? '#8b6c2f' : '#5f9cb6'}
                    />
                  ),
              )}
            </g>
          );
        })}
        <text x={w / 2} y="223" textAnchor="middle">
          {puzzle
            ? s('A1 碘液 · A2 斐林', 'A1 Iodine · A2 Fehling')
            : kind === 'fehling'
              ? heat
                ? s('同一水浴', 'Same water bath')
                : s('新样对照：未加热', 'Fresh sample: no heat')
              : s('A：浸出液 · B：水', 'A: extract · B: water')}
        </text>
      </svg>
    </>
  );
}
function Budget({
  w,
  s,
  day,
  use,
  enzyme,
  uptake,
}: {
  w: number;
  s: Say;
  day: number;
  use: number;
  enzyme: boolean;
  uptake: boolean;
}) {
  const k = enzyme ? 0.55 : 0,
    d = uptake ? use : 0,
    a = carbonPools(day, k, d),
    vals = [a.polymer, a.soluble, a.other];
  return (
    <>
      <div className="bsd20-note">
        {s('模型碳收支 · 第', 'Model carbon ledger · day ')}
        {day.toFixed(1)}
        {s('天', '')}
      </div>
      <div className="bsd20-pool-labels">
        {[s('淀粉', 'Starch'), s('可溶产物', 'Soluble'), s('其他碳库', 'Other pools')].map(
          (v, i) => (
            <div key={i}>
              <span style={{ color: colors[i] }}>{v}</span>
              <b data-pool={i}>{(vals[i] * 100).toFixed(1)}%</b>
            </div>
          ),
        )}
      </div>
      <svg
        viewBox={`0 0 ${w} 160`}
        role="img"
        aria-label={s(
          '24个选定碳标记由淀粉经过可溶产物进入其他碳库',
          'Twenty-four selected carbon markers move through polymer, soluble and other pools',
        )}
      >
        {[0, 1, 2].map((a) => (
          <rect
            key={a}
            x="13"
            y={[12, 92.5, 173.5][a] * 0.65}
            width={w - 26}
            height={[80.5, 81, 72.5][a] * 0.65}
            rx="0"
            fill={colors[a]}
            fillOpacity=".09"
            stroke={colors[a]}
            strokeOpacity=".35"
          />
        ))}
        {Array.from({ length: 24 }, (_, id) => {
          const c = carbonMarker(id, day, k, d, w);
          return (
            <circle
              key={c.id}
              data-marker={c.id}
              data-pool-name={c.pool}
              cx={c.x}
              cy={c.y * 0.65}
              r="3.7"
              fill={colors[c.pool === 'polymer' ? 0 : c.pool === 'soluble' ? 1 : 2]}
              stroke="#fff"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <div className="bsd20-note">{s('标记：有限样本', 'Markers: finite sample')}</div>
    </>
  );
}
function Split({ w, s, p, group }: { w: number; s: Say; p: number; group: number }) {
  const clipId = useId();
  const a = sampleTransfer(p, w),
    g = group === 0 ? 'A' : 'B';
  return (
    <>
      <div className="bsd20-note">{`${g} · ${s('独立样品，两份检测', 'Separate sample, two tests')}`}</div>
      <svg
        viewBox={`0 0 ${w} 262`}
        role="img"
        aria-label={s(
          '40毫升分到两个10毫升试管，余20毫升',
          'Two 10 mL aliquots from 40 mL, leaving 20 mL',
        )}
        data-sample={g}
        data-transfer-progress={p}
        data-source-ml={a.source}
        data-pipette-ml={a.pipette}
        data-aliquots={a.tubes.join(',')}
      >
        <path d={`M${w * 0.2 - 24} 155v84h48v-84`} fill="#edf0e7" stroke="#acb5a0" />
        <path d={`M${w * 0.2 - 22} ${239 - a.source * 1.65}h44V239h-44Z`} fill="#d8cba2" />
        {a.tubes.map((ml, i) => (
          <g key={i}>
            <path
              d={`M${w * (i === 0 ? 0.57 : 0.82) - 16} 145v85q16 15 32 0v-85`}
              fill="#edf0e7"
              stroke="#a7b4a5"
            />
            <defs>
              <clipPath id={`${clipId}-${i}`}>
                <path d={`M${w * (i === 0 ? 0.57 : 0.82) - 14} 147v83q14 13 28 0v-83Z`} />
              </clipPath>
            </defs>
            {ml > 0 && (
              <rect
                data-aliquot-liquid={i}
                x={w * (i === 0 ? 0.57 : 0.82) - 14}
                y={237 - ml * 7}
                width="28"
                height={ml * 7}
                fill="#d8cba2"
                clipPath={`url(#${clipId}-${i})`}
              />
            )}
            <text x={w * (i === 0 ? 0.57 : 0.82)} y="261" textAnchor="middle">
              {g}
              {i + 1}
            </text>
          </g>
        ))}
        <path d={`M${a.x - 5} ${a.y - 87}v65l5 22 5-22v-65Z`} stroke="#6e8981" fill="#f3f6ec" />
        <path
          d={`M${a.x - 3} ${a.y - 22 - a.pipette * 5}v${a.pipette * 5}h6v-${a.pipette * 5}Z`}
          fill="#c6ac6d"
        />
        {textLabel(w * 0.2, 261, `${g} ${a.source.toFixed(0)} mL`)}
      </svg>
    </>
  );
}
const textLabel = (x: number, y: number, t: string) => (
  <text x={x} y={y} textAnchor="middle">
    {t}
  </text>
);
type Settings = {
  time: number;
  day: number;
  use: number;
  moisture: number;
  activity: number;
  heat: boolean;
  enzyme: boolean;
  uptake: boolean;
  group: number;
};
export default function BioSoilDecomposition() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    s: Say = (z, e) => (browserLocale() === 'en' ? e : z);
  const [mode, setMode] = useState<number | null>(null),
    [manual, setManual] = useState<Record<number, Partial<Settings>>>({}),
    [records, setRecords] = useState(['', '', '', '']);
  const chapter = f.watch ? f.chapter : (mode ?? f.chapter),
    duration =
      (f.chapters[chapter + 1]?.at ?? f.duration) - (f.chapters[chapter]?.at ?? 0) ||
      soilChapterSeconds[chapter],
    baseTime = mode === null || f.watch ? f.chapterTime : duration * 0.7;
  const values = f.watch ? {} : (manual[chapter] ?? {}),
    time = values.time ?? baseTime,
    d = soilDirector(chapter, time, browserLocale() === 'en' ? 'en' : 'zh'),
    day = values.day ?? d.day,
    use = values.use ?? d.use,
    moisture = values.moisture ?? d.moisture,
    activity = values.activity ?? 0.12,
    heat = values.heat ?? d.heat,
    enzyme = values.enzyme ?? d.enzyme,
    uptake = values.uptake ?? d.uptake,
    group = values.group ?? d.group;
  const set = (key: keyof Settings, value: Settings[keyof Settings]) => {
    setMode(chapter);
    // Pin the entire visible condition on first edit; Watch can reset its own clock.
    setManual((v) => ({
      ...v,
      [chapter]: {
        time,
        day,
        use,
        moisture,
        activity,
        heat,
        enzyme,
        uptake,
        group,
        [key]: value,
      },
    }));
  };
  const titles = [
    s('落叶对照', 'Litter comparison'),
    s('胞外分解', 'Outside breakdown'),
    s('记录与预测', 'Records and prediction'),
    s('浸出液疑问', 'An extract puzzle'),
    s('分解与吸收', 'Breakdown and uptake'),
    s('独立分样', 'Separate aliquots'),
    s('碘液证据', 'Iodine evidence'),
    s('还原性证据', 'Reducing products'),
    s('迟测的反例', 'A late-test counterexample'),
  ];
  return (
    <div
      ref={host}
      className="bsd20"
      data-watch={f.watch}
      data-chapter={chapter}
      data-shot={d.shot}
      data-time={time}
      data-use={use}
      data-day={day}
    >
      <div className="bsd20-stage">
        {(d.shot === 'pots' || d.shot === 'litter-question') && (
          <Pots
            w={w}
            s={s}
            days={d.shot === 'litter-question' ? 28 : 28 * d.progress}
            moisture={moisture}
            activity={activity}
            question={d.shot === 'litter-question'}
          />
        )}
        {(d.shot === 'mechanism' || d.shot === 'starch-mechanism') && (
          <Mechanism
            w={w}
            s={s}
            p={d.progress}
            enzyme={enzyme}
            uptake={uptake}
            starch={chapter === 4}
          />
        )}
        {d.shot === 'records' && (
          <>
            <div className="bsd20-note">
              {f.watch
                ? s('模型示例，非教材实测', 'Model example, not measurements')
                : s('我的干质量记录', 'My dry-mass records')}
            </div>
            <div className="bsd20-records">
              {[0, 1].map((i) => {
                const r = litterRecord(records[i * 2], records[i * 2 + 1]);
                return (
                  <section key={i}>
                    <h3>{i === 0 ? s('处理土', 'Treated soil') : s('自然土', 'Natural soil')}</h3>
                    <strong>
                      {f.watch
                        ? `2.00 → ${(2 * litterState(28, i === 0 ? activity : 1, moisture).remaining).toFixed(2)} g`
                        : r
                          ? `${r.initial} → ${r.final} g`
                          : s('尚未填写', 'No observation yet')}
                    </strong>
                    <div
                      className="bsd20-mass"
                      style={{
                        width: `${100 * (f.watch ? litterState(28, i === 0 ? activity : 1, moisture).remaining : r ? soilClamp(r.final / r.initial) : 0)}%`,
                      }}
                    />
                  </section>
                );
              })}
            </div>
            <p className="bsd20-note">
              {s('统一干燥；空白不等于零', 'Match drying; missing ≠ zero')}
            </p>
          </>
        )}
        {d.shot === 'moisture' && (
          <>
            <div className="bsd20-note">{s('更干燥，会更快吗？', 'Faster when dry?')}</div>
            <Pots w={w} s={s} days={28} moisture={moisture} activity={1} predict />
          </>
        )}
        {(d.shot === 'puzzle' || d.shot === 'predict') && (
          <>
            <Tests w={w} s={s} p={1} day={7} use={1.2} heat={true} kind="fehling" puzzle />
            <div className="bsd20-question">
              {s('阴性 = 没有分解？', 'Negative = no breakdown?')}
            </div>
          </>
        )}
        {d.shot === 'extract' && (
          <>
            <div className="bsd20-note">
              {s('纱布不是除菌滤膜', 'Gauze is not a sterile filter')}
            </div>
            <svg
              viewBox={`0 0 ${w} 240`}
              role="img"
              aria-label={s(
                '纱布带走粗土，浸出液中保留微生物和胞外酶',
                'Gauze removes coarse soil; microbes and enzymes can remain in the extract',
              )}
            >
              <path
                d={`M${w / 2 - 67} 69v154h134V69`}
                fill="#e6ece4"
                stroke="#9cae9f"
                strokeWidth="2"
              />
              <path d={`M${w / 2 - 65} 134h130v87h-130Z`} fill="#d3c299" fillOpacity=".6" />
              <g transform={`translate(${w / 2} ${-82 * d.progress})`}>
                <path
                  d="M-48 86Q-60 163 0 163T48 86"
                  fill="#dbc9a4"
                  fillOpacity=".65"
                  stroke="#9a906f"
                />
                <path
                  d="M-40 100L25 151m-17-63 29 42m-71-8 51 35m-48-12 60-45M-13 157l53-39"
                  stroke="#a9a285"
                  fill="none"
                />
                {[0, 1, 2].map((i) => (
                  <circle key={i} cx={-22 + i * 22} cy={128 + (i % 2) * 12} r="12" fill="#8a755a" />
                ))}
              </g>
              {[0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${w / 2 - 40 + i * 39} ${182 + (i % 2) * 18})`}>
                  <rect x="-9" y="-4" width="18" height="8" rx="4" fill="#6d8a73" />
                  <path d="M-11 15q5-10 11 0l-3 4Z" fill="#be966a" />
                </g>
              ))}
            </svg>
            <div className="bsd20-note">
              {s('细胞、胞外酶、溶解物', 'Cells, enzymes and solutes')}
            </div>
          </>
        )}
        {d.shot === 'pair' && (
          <>
            <div className="bsd20-note">
              {s('等量淀粉 · 同温同时间', 'Equal starch · same time and temperature')}
            </div>
            <svg
              viewBox={`0 0 ${w} 228`}
              role="img"
              aria-label={s(
                'A加入土壤浸出液，B加等体积水',
                'A receives extract; B receives equal water',
              )}
            >
              {[0, 1].map((i) => {
                const x = w * (i === 0 ? 0.26 : 0.74);
                return (
                  <g key={i}>
                    <path
                      d={`M${x - 44} 76v123h88V76`}
                      fill="#edf1e9"
                      stroke="#a5b1a1"
                      strokeWidth="2"
                    />
                    <path
                      d={`M${x - 42} ${197 - (10 + 30 * d.progress) * 2}h84V197h-84Z`}
                      fill={i === 0 ? '#cfc09a' : '#dce4d7'}
                    />
                    <text x={x} y="223" textAnchor="middle">
                      {i === 0 ? s('A 浸出液', 'A Extract') : s('B 水', 'B Water')}
                    </text>
                    <text x={x} y="37" textAnchor="middle">
                      +30 mL
                    </text>
                    {d.progress > 0 && d.progress < 1 && (
                      <path
                        d={`M${x} 48V${197 - (10 + 30 * d.progress) * 2}`}
                        stroke={i === 0 ? '#b9a374' : '#b2ced0'}
                        strokeWidth="4"
                        fill="none"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </>
        )}
        {d.shot === 'split' && <Split w={w} s={s} p={d.progress} group={group} />}
        {(d.shot === 'iodine' || d.shot === 'fehling') && (
          <Tests w={w} s={s} p={d.progress} day={day} use={use} heat={heat} kind={d.shot} />
        )}
        {d.shot === 'pools' && (
          <Budget w={w} s={s} day={day} use={use} enzyme={enzyme} uptake={uptake} />
        )}
      </div>
      {!f.watch && (
        <div className="bsd20-controls">
          <label>
            {s('观察主题', 'View')}
            <select value={chapter} onChange={(e) => setMode(Number(e.target.value))}>
              {titles.map((v, i) => (
                <option key={i} value={i}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <Range
            label={s('过程位置', 'Process position')}
            value={time}
            min={0}
            max={duration}
            step={0.1}
            onChange={(v) => set('time', v)}
          />
          {chapter < 3 && (
            <>
              <Range
                label={s('共同水分条件', 'Shared moisture')}
                value={moisture}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => set('moisture', v)}
              />
              <Range
                label={s('处理后相对活性', 'Treated activity')}
                value={activity}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => set('activity', v)}
              />
            </>
          )}
          {(chapter === 1 || chapter === 4 || chapter === 8) && (
            <div className="bsd20-buttons">
              <button aria-pressed={enzyme} onClick={() => set('enzyme', !enzyme)}>
                {s('胞外酶切', 'Outside cleavage')}
              </button>
              <button aria-pressed={uptake} onClick={() => set('uptake', !uptake)}>
                {s('后续利用', 'Further use')}
              </button>
            </div>
          )}
          {chapter >= 6 && (
            <>
              <Range
                label={s('培养时间/天', 'Incubation days')}
                value={day}
                min={0}
                max={14}
                step={0.1}
                onChange={(v) => set('day', v)}
              />
              <Range
                label={s('产物利用系数', 'Product-use coefficient')}
                value={use}
                min={0}
                max={1.2}
                step={0.01}
                onChange={(v) => set('use', v)}
              />
            </>
          )}
          {chapter === 7 && (
            <button aria-pressed={heat} onClick={() => set('heat', !heat)}>
              {s('水浴加热', 'Water-bath heating')}
            </button>
          )}
          {chapter === 5 && (
            <div className="bsd20-buttons">
              {['A', 'B'].map((v, i) => (
                <button key={v} aria-pressed={group === i} onClick={() => set('group', i)}>
                  {v}
                </button>
              ))}
            </div>
          )}
          {chapter === 2 && (
            <div className="bsd20-record-inputs">
              {records.map((v, i) => (
                <label key={i}>
                  {
                    [
                      s('处理土初始/g', 'Treated initial/g'),
                      s('处理土末次/g', 'Treated final/g'),
                      s('自然土初始/g', 'Natural initial/g'),
                      s('自然土末次/g', 'Natural final/g'),
                    ][i]
                  }
                  <input
                    type="number"
                    min="0"
                    step=".01"
                    value={v}
                    onChange={(e) =>
                      setRecords((a) => a.map((x, j) => (j === i ? e.target.value : x)))
                    }
                  />
                </label>
              ))}
            </div>
          )}
          <details>
            <summary>{s('模型与证据的界限', 'Model and evidence limits')}</summary>
            <p>
              {s(
                '所有趋势和色深均为教学模型，不是教材的实测结果。C1—C6为同一批碳份额，不是六个游离碳原子；胞外多步切分和细胞内反应合并，不完整模拟呼吸。其他碳库包含细胞成分、代谢产物和CO₂等，不作固定分配。24标记是有限样本，连续百分比来自独立方程。60°C处理1h不保证无菌，残留酶也可继续作用。水分极端只表示本模型中的好氧限制，不断言自然土壤完全不分解。',
                'All trends and color intensities are teaching models, not textbook measurements. C1–C6 label carbon portions, not six free atoms. Multiple extracellular and intracellular reactions are grouped; respiration is not simulated in full. Other pools include cell material, metabolites and CO₂ with no fixed allocation. The 24 markers are a finite sample; percentages use independent equations. Treatment at 60°C for 1 h does not guarantee sterility; residual enzymes can remain active. Moisture extremes limit this aerobic model, not all decomposition in real soil.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
