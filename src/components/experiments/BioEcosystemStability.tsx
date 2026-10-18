import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  stableClamp,
  pheromoneState,
  feedbackState,
  stabilityResponse,
  tankState,
  tankLayout,
  trialRate,
} from '../../models/bio-ecosystem-stability';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-ecosystem-stability.css';
export default function BioEcosystemStability() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    uid = useId(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = ['bio-elective-2-072-1', 'bio-elective-2-mechanism-22', 'bio-elective-2-078-1'];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(1),
    [source, setSource] = useState(true),
    [records, setRecords] = useState(['', '', '', '']),
    [disturbance, setDisturbance] = useState(0.7),
    [resist, setResist] = useState(1),
    [recover, setRecover] = useState(0.45),
    [illumination, setIllumination] = useState(1),
    [load, setLoad] = useState(2),
    [plants, setPlants] = useState(1),
    [journal, setJournal] = useState('');
  const mode = f.watch ? (f.chapter < 3 ? 0 : f.chapter < 6 ? 1 : 2) : mode0,
    local = f.watch ? f.chapter - [0, 3, 6][mode] : Math.min(view, [2, 2, 3][mode]),
    p = f.watch ? f.chapterProgress : progress;
  const present = f.watch ? (local === 1 ? p < 0.5 : true) : source,
    pp = f.watch && mode === 0 && local === 1 ? (p === 1 ? 1 : (p * 2) % 1) : p,
    chem = pheromoneState(pp, w, present, local === 1),
    fb = feedbackState(p);
  const shock = f.watch ? (local === 2 ? 0.9 : 0.7) : disturbance,
    rs = f.watch ? (local === 2 ? 0 : 1) : resist,
    rc = f.watch ? 0.45 : recover,
    response = stabilityResponse(p * 12, shock, rs, rc, local === 2),
    light = f.watch ? 1 : illumination,
    consumers = f.watch ? (local === 2 ? 7 : 2) : load,
    producer = f.watch ? 1 : plants;
  const build = (start: number) => (local === 0 ? stableClamp((p - start) / 0.15) : 1);
  const hours = p * 72,
    tank = tankState(hours, light, consumers, producer),
    g = tankLayout(w),
    titles = [
      s('昆虫之间的化学信息', 'Chemical signals between insects'),
      s('反馈、抵抗与恢复', 'Feedback, resistance and recovery'),
      s('有条件的生态缸稳定性', 'Conditional stability in a tank'),
    ];
  const moth = (x: number, y: number, female = false, scale = 1) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M-4 0q-18-22-24-9q5 19 24 13M-4 0q-18 22-24 9q5-19 24-13"
        fill={female ? '#c6bba3' : '#b9bea6'}
        stroke="#9a9c83"
      />
      <ellipse cx="-4" rx="14" ry="4" fill="#ad9c7e" />
      <path d="M-15-2l-8-8m8 12-8 8" stroke="#7f886e" strokeWidth="1.5" />
    </g>
  );
  const grass = (x: number, y: number, amount = 1) => (
    <g key={`${x}-${y}`} opacity={stableClamp(amount)}>
      <path
        d={`M${x} ${y}q-13-20-16-32m16 32q-2-30 5-40m-5 40q12-25 21-29`}
        fill="none"
        stroke="#8ea271"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
  return (
    <div className="bio-stability" ref={host} data-watch={f.watch}>
      <div className="bio-stability-head">{titles[mode]}</div>
      {mode === 0 && local < 2 && (
        <svg
          viewBox={`0 0 ${w} 302`}
          role="img"
          aria-label={
            local === 0
              ? s(
                  '纱网隔离个体，化学物质仍可通过',
                  'Mesh excludes insects while chemical signals pass',
                )
              : s(
                  '遮光弯管保留气流，对比空室',
                  'Opaque bent duct preserves airflow with empty-chamber control',
                )
          }
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {local === 0
              ? s('纱网：排除直接接触', 'Mesh excludes direct contact')
              : present
                ? s('遮光室内有雌蛾', 'Female in opaque chamber')
                : s('相同气流 · 空室对照', 'Same airflow · empty chamber')}
          </text>
          <path d={`M16 105H${w - 16}V244H16Z`} fill="#eff1e4" stroke="#cbd2b9" />
          <path d={`M20 84H${w - 25}m-9-6 9 6-9 6`} stroke="#a7b8a1" strokeWidth="2" fill="none" />
          <text x={w / 2} y="70" textAnchor="middle">
            {s('相同气流', 'Matched airflow')}
          </text>
          {local === 0 ? (
            <>
              <path
                d={`M${chem.mesh} 128v75`}
                stroke="#b2b6a0"
                strokeWidth="5"
                strokeDasharray="4 4"
              />
              {present && moth(chem.source.x, chem.source.y, true, 0.7)}
              <text x={chem.source.x} y="228" textAnchor="middle">
                {present ? s('雌蛾', 'Female') : s('空室', 'Blank')}
              </text>
            </>
          ) : (
            <>
              <path
                d={`M${chem.source.x - 25} 133H${chem.mesh - 8}v38H${chem.source.x - 25}Z`}
                fill="#b8b8a0"
                stroke="#919c80"
              />
              <path
                d={`M${chem.mesh - 8} 163v28h${chem.exit.x - (chem.mesh - 8)}`}
                fill="none"
                stroke="#929d83"
                strokeWidth="17"
                strokeLinejoin="round"
              />
              <path
                d={`M${chem.mesh - 8} 163v28h${chem.exit.x - (chem.mesh - 8)}`}
                fill="none"
                stroke="#e6e8d6"
                strokeWidth="10"
                strokeLinejoin="round"
              />
              <path
                d={`M${chem.exit.x} 184v14`}
                stroke="#9fa98e"
                strokeWidth="2"
                strokeDasharray="2 3"
              />
              <text x={chem.source.x} y="228" textAnchor="middle">
                {present ? s('有源', 'Source') : s('空白', 'Blank')}
              </text>
            </>
          )}
          {chem.dots
            .filter((d) => d.visible && (local === 0 || d.x > chem.mesh - 19))
            .map((d) => (
              <circle key={d.id} cx={d.x} cy={d.y} r="1.5" fill="#ba9d67" />
            ))}
          {moth(chem.male.x, chem.male.y, false, 0.7)}
          <text x={w - 40} y="228" textAnchor="middle">
            {s('雄蛾', 'Male')}
          </text>
          <text x={w / 2} y="278" textAnchor="middle">
            {local === 0
              ? s('仍需排除视觉等其他线索', 'Visual cues remain possible')
              : s('弯管挡直视，气流通路保留', 'Bent duct blocks direct sight')}
          </text>
        </svg>
      )}
      {mode === 0 && local === 2 && (
        <svg
          viewBox={`0 0 ${w} 285`}
          role="img"
          aria-label={s(
            '定向反应需要重复与对照',
            'Directional responses require replication and controls',
          )}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {f.watch
              ? s('假设结果示例', 'Hypothetical results')
              : s('我的重复观察', 'My repeated observations')}
          </text>
          {[0, 1].map((i) => {
            const r = f.watch
              ? i === 0
                ? 0.7
                : 0.2
              : trialRate(records[i * 2], records[i * 2 + 1]);
            return (
              <g key={i}>
                <text x="16" y={76 + i * 92}>
                  {i === 0 ? s('雌蛾气味', 'Female odor') : s('相同气流空室', 'Airflow blank')}
                </text>
                {r === null ? (
                  <text x="16" y={108 + i * 92}>
                    {s('尚未记录', 'No records yet')}
                  </text>
                ) : (
                  <>
                    <rect
                      x="16"
                      y={90 + i * 92}
                      width={(w - 85) * r}
                      height="18"
                      rx="9"
                      fill="#a7b18a"
                    />
                    <text x={w - 16} y={106 + i * 92} textAnchor="end">
                      {(r * 100).toFixed(0)}%
                    </text>
                  </>
                )}
              </g>
            );
          })}
          <text x={w / 2} y="266" textAnchor="middle">
            {s('换位置 · 去残留 · 独立重复', 'Swap sides · clean · replicate')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 298`}
          role="img"
          aria-label={s(
            '草食动物增加后，限制和捕食反馈逐渐改变',
            'Food limitation and predators respond after herbivores increase',
          )}
        >
          <path d={`M16 244Q${w / 2} 225 ${w - 16} 244v25H16Z`} fill="#e2e8d2" />
          {Array.from({ length: 9 }, (_, i) =>
            grass(22 + (i * (w - 44)) / 8, 246, 0.65 * fb.grass),
          )}
          <g transform={`translate(${w * 0.29} 150) scale(${Math.sqrt(fb.herbIndex)})`}>
            <ellipse rx="22" ry="14" fill="#c8bda2" />
            <ellipse cx="17" cy="-9" rx="11" ry="10" fill="#c8bda2" />
            <path d="M16-16q-8-29 0-29q7 4 5 29m5 0q0-30 7-27q6 8-3 30" fill="#c8bda2" />
            <circle cx="22" cy="-11" r="1.7" fill="#6f7862" />
          </g>
          <g transform={`translate(${w * 0.73} 153) scale(${Math.sqrt(fb.predIndex)})`}>
            <path
              d="M-28 0q20-20 43-8l12-12 3 15 11 6-18 8-8-3-7 13-8-3 2-13-22 2-10 13-7-3 8-17-19-7Z"
              fill="#a5ad99"
            />
          </g>
          <text x={w * 0.28} y="200" textAnchor="middle">
            {s('草食动物', 'Herbivores')}
          </text>
          <text x={w * 0.75} y="200" textAnchor="middle">
            {s('捕食者', 'Predators')}
          </text>
          <text x={w / 2} y="28" textAnchor="middle">
            {s('扰动后，响应有延迟', 'Responses follow disturbance')}
          </text>
          <text x={w / 2} y="64" textAnchor="middle">
            {s('数量指数', 'Population indices')} {fb.herbIndex.toFixed(2)} /{' '}
            {fb.predIndex.toFixed(2)}
          </text>
          <text x={w / 2} y="294" textAnchor="middle">
            {s('图形大小是指数示意', 'Size represents an index')}
          </text>
        </svg>
      )}
      {mode === 1 && local > 0 && (
        <svg
          viewBox={`0 0 ${w} 305`}
          role="img"
          aria-label={s(
            '受扰偏离与随后恢复分别量化',
            'Separate initial displacement and subsequent recovery',
          )}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {local === 1
              ? s('抵抗：偏离小 · 恢复：回返快', 'Resistance and recovery differ')
              : s('超过阈值，不保证回原状', 'Thresholds can prevent return')}
          </text>
          <path d={`M32 61V244H${w - 15}`} stroke="#aab399" fill="none" />
          <path d={`M32 74H${w - 16}`} stroke="#c4cbb3" strokeDasharray="4 4" />
          <text x="10" y="80">
            1
          </text>
          <text x="10" y="245">
            0
          </text>
          <path
            d={Array.from({ length: 101 }, (_, i) => {
              const t = (i / 100) * p * 12,
                q = stabilityResponse(t, shock, rs, rc, local === 2);
              return `${i === 0 ? 'M' : 'L'}${32 + ((w - 48) * t) / 12} ${244 - 170 * q.value}`;
            }).join(' ')}
            stroke={local === 2 ? '#b49b7d' : '#96a67a'}
            strokeWidth="3"
            fill="none"
          />
          <path d={`M32 74v${170 * (1 - response.initial)}`} stroke="#c2ac83" strokeWidth="5" />
          {local === 2 && (
            <>
              <path d={`M32 201.5H${w - 16}`} stroke="#c4ab90" strokeDasharray="3 5" />
              <text x={w - 16} y="192" textAnchor="end">
                {s('示意阈值0.25', 'Model threshold 0.25')}
              </text>
            </>
          )}
          <circle cx={32 + (w - 48) * p} cy={244 - 170 * response.value} r="5" fill="#9ba87e" />
          <text x={w / 2} y="276" textAnchor="middle">
            {s('功能指数', 'Function index')} {response.value.toFixed(2)}
          </text>
          <text x={w / 2} y="303" textAnchor="middle">
            {s('时间与参数是教学假设', 'Time and parameters are illustrative')}
          </text>
        </svg>
      )}
      {mode === 2 && local < 3 && (
        <svg
          viewBox={`0 0 ${w} 310`}
          role="img"
          aria-label={s(
            '坡面、水域与缸内气体组成微生态系统',
            'Land slope, water and internal air form a microecosystem',
          )}
        >
          <defs>
            <marker
              id={`${uid}-flow`}
              markerWidth="5"
              markerHeight="5"
              refX="4.5"
              refY="2.5"
              orient="auto"
            >
              <path d="M0 0L5 2.5 0 5" fill="#8ba79a" />
            </marker>
            <clipPath id={`${uid}-tank`}>
              <rect x="14" y="74" width={w - 28} height="192" rx="8" />
            </clipPath>
          </defs>
          <text x={w / 2} y="24" textAnchor="middle">
            {local === 0
              ? s('坡面 + 水域 + 分解者', 'Land + water + decomposers')
              : s(
                  `第${(hours / 24).toFixed(1)}天 · 缸内氧变化`,
                  `Day ${(hours / 24).toFixed(1)} · oxygen`,
                )}
          </text>
          <rect
            x="12"
            y="72"
            width={w - 24}
            height="197"
            rx="10"
            fill="#f0f4e8"
            stroke="#a7b79a"
            strokeWidth="2"
          />
          <rect x="9" y="66" width={w - 18} height="8" rx="4" fill="#c4cfb7" opacity={build(0.8)} />
          <g clipPath={`url(#${uid}-tank)`}>
            {local > 0 &&
              tank.light > 0 &&
              [0.35, 0.5, 0.65].map((v, i) => (
                <path
                  key={i}
                  d={`M${w * v} 75L${w * v + 22} 185`}
                  stroke="#d5c589"
                  strokeWidth="8"
                  opacity={0.2 * tank.light}
                />
              ))}
            <path
              d={`M14 ${g.landY}H${g.landEdge}L${g.slopeEnd} ${g.soilY}H${g.right}V267H14Z`}
              fill="#aaa184"
              opacity={build(0.05)}
            />
            <path
              d={`M14 ${g.landY + 16}H${g.landEdge - 3}L${g.slopeEnd - 1} ${g.soilY + 12}H${g.right}V267H14Z`}
              fill="#c2b494"
              opacity={build(0.05)}
            />
            <path d={g.waterPath} fill="#c6dcd1" fillOpacity={0.8 * build(0.25)} />
            <path
              d={`M${g.cross} 190H${g.right}`}
              stroke="#a4bfb1"
              strokeWidth="2"
              opacity={build(0.25)}
            />
            <g opacity={producer === 0 ? 0 : build(0.4)}>
              {grass(w * 0.19, 165, 1)}
              <path d={`M${w * 0.19} 166v12l-12 12m12-12 14 13`} stroke="#a39171" fill="none" />
            </g>
            <g opacity={producer === 0 ? 0 : build(0.4)}>
              <path
                d={`M${w * 0.74} 242v-53m0 30q-21-15-20-29m20 42q17-17 20-33m-20 10q12-10 14-24`}
                fill="none"
                stroke="#83a38b"
                strokeWidth="3"
              />
              <path d={`M${w * 0.74} 242l-9 7m9-7 9 7`} stroke="#95866a" />
            </g>
            {Array.from({ length: Math.round(consumers) }, (_, i) => {
              const x = w * 0.64 + (i % 4) * ((w * 0.23) / 3),
                y = 231 - Math.floor(i / 4) * 17;
              return (
                <g key={i} opacity={build(0.6)}>
                  <path d={`M${x - 7} ${y + 5}h15m-2 0 4-4`} stroke="#8a8e6c" strokeWidth="2" />
                  <circle cx={x} cy={y} r="5" fill="#b9aa7a" stroke="#92865f" />
                  <path
                    d={`M${x + 2} ${y + 2}q-6 2-5-3t5 1`}
                    fill="none"
                    stroke="#92865f"
                    strokeWidth="1"
                  />
                </g>
              );
            })}
            {local > 0 && (
              <path
                d={tank.exchange >= 0 ? `M${w * 0.93} 147V204` : `M${w * 0.93} 204V147`}
                stroke="#8ba79a"
                strokeWidth="1.7"
                fill="none"
                markerEnd={`url(#${uid}-flow)`}
              />
            )}
            {Array.from({ length: 12 }, (_, i) => (
              <circle
                key={i}
                cx={w * 0.38 + (i * (w * 0.5)) / 12}
                cy={251 + (i % 3) * 3}
                r="1.3"
                fill="#8f9571"
                opacity={build(0.4)}
              />
            ))}
          </g>
          {local === 0 ? (
            <>
              <text x={w * 0.73} y="122" textAnchor="middle">
                {s('缸内空气', 'Internal air')}
              </text>
              <text x={w / 2} y="297" textAnchor="middle">
                {s('间接光照 · 每周记录', 'Indirect light · weekly records')}
              </text>
            </>
          ) : (
            <>
              <text x={w / 2} y="95" textAnchor="middle">
                {s('水中O₂', 'Water O₂')} {tank.waterO.toFixed(1)} mg/L
              </text>
              <text x={w / 2} y="119" textAnchor="middle">
                {tank.light > 0.01
                  ? s('光合与呼吸同时进行', 'Photosynthesis + respiration')
                  : s('夜间仍在呼吸', 'Respiration continues at night')}
              </text>
              <text x={w / 2} y="297" textAnchor="middle">
                {local === 2
                  ? s('相同光照，消费者负荷更高', 'Same light, higher consumer load')
                  : s('缸内气水交换，不穿透缸盖', 'Gas exchange stays inside')}
              </text>
            </>
          )}
        </svg>
      )}
      {mode === 2 && local === 3 && (
        <svg
          viewBox={`0 0 ${w} 276`}
          role="img"
          aria-label={s(
            '长期稳定性需要实际连续记录',
            'Long-term stability requires real longitudinal records',
          )}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {f.watch
              ? s('每周观察表 · 示例', 'Weekly journal · example')
              : s('我的观察记录', 'My observation record')}
          </text>
          {[
            s('日期与光温条件', 'Date, light, temperature'),
            s('植物与动物种类、数量', 'Plant/animal types and counts'),
            s('水色、活动、异常变化', 'Water, activity, unusual changes'),
          ].map((v, i) => (
            <g key={i}>
              <text x="16" y={72 + i * 67}>
                {v}
              </text>
              <path d={`M16 ${95 + i * 67}H${w - 16}`} stroke="#d2d6c1" />
              {f.watch && (
                <text x="16" y={96 + i * 67}>
                  {
                    [
                      s('第1周 · 间接光', 'Week 1 · indirect light'),
                      s('原种类仍见，数量待核对', 'Types present; counts to verify'),
                      s('记录原状，保留照片', 'Record condition and photos'),
                    ][i]
                  }
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
      {!f.watch && (
        <div className="bio-stability-controls">
          <div className="bio-stability-buttons">
            {titles.map((t, i) => (
              <button
                key={i}
                aria-pressed={mode === i}
                onClick={() => {
                  setMode(i);
                  setView(0);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="bio-stability-buttons">
            {Array.from({ length: [3, 3, 4][mode] }, (_, i) => (
              <button key={i} aria-pressed={local === i} onClick={() => setView(i)}>
                {s('观察', 'View ')}
                {i + 1}
              </button>
            ))}
          </div>
          {!(mode === 0 && local === 2) && !(mode === 2 && local === 3) && (
            <label>
              {s('过程位置', 'Progress')}
              <input
                type="range"
                min="0"
                max="1"
                step=".001"
                value={progress}
                onChange={(e) => setProgress(+e.target.value)}
              />
            </label>
          )}
          {mode === 0 && local < 2 && (
            <button aria-pressed={source} onClick={() => setSource(!source)}>
              {s('室内有雌蛾', 'Female present')}
            </button>
          )}
          {mode === 0 && local === 2 && (
            <div className="bio-stability-records">
              {records.map((v, i) => (
                <label key={i}>
                  {
                    [
                      s('有源组响应数', 'Source responses'),
                      s('有源组总数', 'Source total'),
                      s('空室组响应数', 'Blank responses'),
                      s('空室组总数', 'Blank total'),
                    ][i]
                  }
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={v}
                    onChange={(e) => {
                      const n = [...records];
                      n[i] = e.target.value;
                      setRecords(n);
                    }}
                  />
                </label>
              ))}
            </div>
          )}
          {mode === 1 && local > 0 && (
            <>
              <label>
                {s('扰动强度', 'Disturbance')} {disturbance.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={disturbance}
                  onChange={(e) => setDisturbance(+e.target.value)}
                />
              </label>
              <label>
                {s('抵抗参数', 'Resistance')} {resist.toFixed(1)}
                <input
                  type="range"
                  min="0"
                  max="4"
                  step=".1"
                  value={resist}
                  onChange={(e) => setResist(+e.target.value)}
                />
              </label>
              <label>
                {s('恢复速率', 'Recovery rate')} {recover.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step=".05"
                  value={recover}
                  onChange={(e) => setRecover(+e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 2 && local < 3 && (
            <>
              <label>
                {s('间接光强系数', 'Indirect-light factor')} {illumination.toFixed(1)}
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step=".1"
                  value={illumination}
                  onChange={(e) => setIllumination(+e.target.value)}
                />
              </label>
              <label>
                {s('消费者负荷指数', 'Consumer-load index')} {load}
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="1"
                  value={load}
                  onChange={(e) => setLoad(+e.target.value)}
                />
              </label>
              <label>
                {s('生产者量系数', 'Producer amount')} {plants.toFixed(1)}
                <input
                  type="range"
                  min="0"
                  max="3"
                  step=".1"
                  value={plants}
                  onChange={(e) => setPlants(+e.target.value)}
                />
              </label>
            </>
          )}
          {mode === 2 && local === 3 && (
            <label>
              {s(
                '每周记录日期、环境、生物与异常',
                'Weekly date, environment, organisms and changes',
              )}
              <textarea
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder={s('尚无实测记录', 'No measured records yet')}
              />
            </label>
          )}
          <details>
            <summary>{s('证据与模型边界', 'Evidence and model limits')}</summary>
            <p>
              {s(
                '纱网只排除接触；遮光室与弯管控制直视，并须保持气流、温湿度、容器和操作一致。点是气味示意，不是实测分子；雄蚕蛾步行定向，不保证所有昆虫同样响应。70%/20%是假设练习结果。反馈模型指数、恢复速率与0.25阈值均非真实生态预测。生态缸采用水1L、气相0.3L的短期示意，水与空气交换氧，光合与呼吸改变总氧；碳在无机/有机库之间守恒。模型未预测长期种群生存，不是投放动物密度建议。实际每周观察，稳定不是组成永远不变。',
                'Mesh excludes contact only. The opaque chamber and bent duct remove direct sight while airflow and other conditions remain matched. Odor dots and male silkmoth walking are illustrative; 70%/20% are hypothetical practice values. Feedback indices and the 0.25 threshold are not site predictions. The short-term tank model uses 1 L water and 0.3 L internal air; gas exchange redistributes oxygen while photosynthesis and respiration change total oxygen and conserve carbon between pools. It does not predict long-term survival or prescribe stocking densities. Stability requires continuing real observations.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
