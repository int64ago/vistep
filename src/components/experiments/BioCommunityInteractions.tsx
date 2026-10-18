import { useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import {
  competitionModel,
  gauseRecords,
  normalizedHareLynx,
  hareLynxCorrelation,
  hareFactorial,
  shoreTransition,
  shoreOccupancy,
  communityClamp,
  type ShoreSpecies,
} from '../../models/bio-community-interactions';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import '../../styles/bio-community-interactions.css';
export default function BioCommunityInteractions() {
  const film = useShowcase(),
    { host, width: w } = useSignalWidth(),
    id = useId(),
    s = (z: string, e: string) => (browserLocale() === 'en' ? e : z);
  const variants = ['bio-elective-2-014-1', 'bio-elective-2-015-1', 'bio-elective-2-025-1'];
  const [chosen, setChosen] = useState(Math.max(0, variants.indexOf(film.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(1),
    [overlap, setOverlap] = useState(1),
    [lag, setLag] = useState(0),
    [food, setFood] = useState(false),
    [fence, setFence] = useState(false),
    [removed, setRemoved] = useState(true);
  const mode = film.watch ? Math.floor(film.chapter / 3) : chosen,
    local = film.watch ? film.chapter % 3 : view,
    p = film.watch ? film.chapterProgress : progress;
  const share = film.watch
      ? mode === 0 && local === 2
        ? 1 - 0.7 * communityClamp((p - 0.25) / 0.5)
        : 1
      : overlap,
    shift = film.watch ? 0 : lag,
    year = 1845 + Math.floor(90 * communityClamp(p / 0.9));
  const model = useMemo(
    () => Array.from({ length: 81 }, (_, i) => ({ day: i / 2, ...competitionModel(i / 2, share) })),
    [share],
  );
  const history = useMemo(normalizedHareLynx, []);
  const off = film.watch ? (local === 0 ? true : local === 2 ? p >= 0.34 : true) : removed,
    shoreTime = film.watch
      ? local === 0
        ? 0
        : local === 1
          ? 1.6 * communityClamp(p / 0.8)
          : p < 0.34
            ? 0
            : 1.6 + ((p - 0.34) / 0.66) * 8.4
      : local === 0
        ? 0
        : local === 1
          ? p * 1.6
          : 1.6 + p * 8.4;
  const shore = shoreTransition(shoreTime, off),
    fractions = shoreOccupancy(shoreTime, off),
    mapW = Math.min(w - 32, 255),
    mapH = (mapW * 2) / 3,
    mapX = (w - mapW) / 2;
  const titles = [
    s('共享资源的竞争', 'Competition for shared resources'),
    s('捕食关系中的证据', 'Evidence in predator–prey systems'),
    s('一片岩面的占位变化', 'Occupancy on one rock surface'),
  ];
  const colors = { caudatum: '#ab8c77', aurelia: '#7f9c7a', hare: '#83a482', lynx: '#b69168' };
  const shell = (
    type: ShoreSpecies,
    x: number,
    y: number,
    size: number,
    key: string,
    opacity = 1,
  ) => (
    <g key={key} transform={`translate(${x} ${y})`} opacity={opacity}>
      {type === 'barnacle' && (
        <>
          <path
            d={`M${-size * 0.42} ${size * 0.28}L${-size * 0.2} ${-size * 0.4}H${size * 0.2}L${size * 0.42} ${size * 0.28}Z`}
            fill="#d7d3b9"
            stroke="#a29e84"
            strokeWidth=".8"
          />
          <path
            d={`M${-size * 0.13} ${-size * 0.28}L0 ${size * 0.1}L${size * 0.13} ${-size * 0.28}`}
            fill="#878e7c"
          />
        </>
      )}
      {type === 'mussel' && (
        <>
          <ellipse
            rx={size * 0.25}
            ry={size * 0.47}
            transform="rotate(30)"
            fill="#596c76"
            stroke="#40545c"
            strokeWidth=".8"
          />
          <path
            d={`M${size * 0.15} ${-size * 0.36}Q${-size * 0.2} 0 ${-size * 0.15} ${size * 0.36}`}
            fill="none"
            stroke="#96a8ab"
            strokeWidth=".8"
          />
        </>
      )}
      {type === 'limpet' && (
        <>
          <ellipse
            rx={size * 0.39}
            ry={size * 0.29}
            fill="#c3ae7c"
            stroke="#958360"
            strokeWidth=".8"
          />
          <path
            d={`M${-size * 0.3} ${size * 0.1}L${size * 0.05} ${-size * 0.19}L${size * 0.3} ${size * 0.1}`}
            fill="none"
            stroke="#9b895d"
            strokeWidth=".8"
          />
        </>
      )}
      {type === 'chiton' && (
        <>
          <ellipse rx={size * 0.27} ry={size * 0.43} fill="#998c73" />
          {[-2, -1, 0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${-size * 0.18} ${i * size * 0.11}q${size * 0.18} ${-size * 0.1} ${size * 0.36} 0`}
              stroke="#c4b49a"
              strokeWidth=".8"
              fill="none"
            />
          ))}
        </>
      )}
    </g>
  );
  const star = (x: number, y: number) => (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M0-23Q5-7 9-7L25-7Q14 1 11 5L16 22Q5 14 0 12Q-5 14-16 22L-11 5Q-14 1-25-7L-9-7Q-5-7 0-23Z"
        fill="#b28065"
        stroke="#966b59"
        strokeWidth="1.5"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d="M0-3v-13"
          transform={`rotate(${i * 72})`}
          stroke="#d4ae88"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
  const hare = (x: number, y: number, scale = 1) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="-3" cy="5" rx="20" ry="13" fill="#d7d9ce" />
      <circle cx="16" cy="-4" r="10" fill="#d7d9ce" />
      <ellipse cx="14" cy="-21" rx="4" ry="13" fill="#c8cfc0" />
      <ellipse cx="22" cy="-19" rx="3.5" ry="12" fill="#c8cfc0" />
      <circle cx="20" cy="-6" r="1.5" fill="#4c6657" />
      <ellipse cx="11" cy="18" rx="12" ry="4" fill="#bec7b5" />
    </g>
  );
  const lynx = (x: number, y: number, scale = 1) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M-30-5Q-5-18 17-7L23-20l8 11 6-10 5 15-9 15-16-3-5 17H4L4 7h-20l-3 17h-8l1-26-11-5"
        fill="#b9aa90"
      />
      <path d="M25-18l-1-8m15 7 3-8" stroke="#7c755f" />
      <circle cx="33" cy="-3" r="1.5" fill="#58614c" />
    </g>
  );
  return (
    <div ref={host} className="bio-community" data-watch={film.watch}>
      <div className="bio-community-head">{titles[mode]}</div>
      {mode === 0 && (
        <svg viewBox={`0 0 ${w} 310`} role="img" aria-label={titles[0]}>
          <text x="16" y="23" style={{ fill: colors.caudatum }}>
            {s('大草履虫', 'P. caudatum')}
          </text>
          <text x={w - 16} y="48" textAnchor="end" style={{ fill: colors.aurelia }}>
            {s('双小核草履虫', 'P. aurelia')}
          </text>
          <text x={w / 2} y="77" textAnchor="middle">
            {local === 2
              ? `${s('资源重叠', 'Overlap')} ${share.toFixed(2)} · ${s('模型', 'model')}`
              : local === 0
                ? s('分别单独培养', 'Separate monocultures')
                : s('混合培养', 'Mixed culture')}
          </text>
          <path d={`M44 92v151h${w - 66}`} stroke="#b6bdad" fill="none" />
          {[0, 125, 250].map((v) => (
            <g key={v}>
              <path d={`M44 ${243 - (v / 250) * 145}h${w - 66}`} stroke="#e0e4d9" />
              <text x="37" y={248 - (v / 250) * 145} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          {(['caudatum', 'aurelia'] as const).map((sp) => {
            const records =
                local === 2
                  ? model
                  : gauseRecords.filter(
                      (r) =>
                        r.treatment === (local === 1 ? 'Mixture' : sp === 'caudatum' ? 'Pc' : 'Pa'),
                    ),
              end = local === 2 ? 40 : 24;
            const points = records.filter((r) => r.day <= end * communityClamp(p / 0.8));
            return (
              <g key={sp}>
                <path
                  d={points
                    .map(
                      (r, i) =>
                        `${i ? 'L' : 'M'}${44 + (r.day / end) * (w - 66)},${243 - (r[sp] / 250) * 145}`,
                    )
                    .join(' ')}
                  stroke={colors[sp]}
                  fill="none"
                  strokeWidth="2.2"
                />
                {local !== 2 &&
                  points.map((r, i) => (
                    <circle
                      key={i}
                      cx={44 + (r.day / end) * (w - 66)}
                      cy={243 - (r[sp] / 250) * 145}
                      r="2.8"
                      fill={colors[sp]}
                    />
                  ))}
              </g>
            );
          })}
          {[0, 1, 2, 3].map((i) => (
            <text key={i} x={44 + (i * (w - 66)) / 3} y="266" textAnchor="middle">
              {(i * (local === 2 ? 40 : 24)) / 3 === Math.round((i * (local === 2 ? 40 : 24)) / 3)
                ? (i * (local === 2 ? 40 : 24)) / 3
                : Math.round((i * 40) / 3)}
            </text>
          ))}
          <text x={w / 2} y="297" textAnchor="middle">
            {local === 2
              ? s('天 · 理想模型数量', 'days · model abundance')
              : s('天 · 原图相对体积指数', 'days · digitized volume index')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 0 && (
        <svg
          viewBox={`0 0 ${w} 300`}
          role="img"
          aria-label={s('1845至1935年的历史记录指数', 'Historical record indices from1845 to1935')}
        >
          <defs>
            <clipPath id={`${id}-history`}>
              <rect x="36" y="30" width={w - 56} height="228" />
            </clipPath>
          </defs>
          <text x={w / 2} y="23" textAnchor="middle">
            {s('各自最大记录 = 1', 'Each maximum record = 1')}
          </text>
          {(['hare', 'lynx'] as const).map((sp, j) => {
            const base = 126 + j * 126,
              key = sp === 'hare' ? 'hareIndex' : 'lynxIndex';
            const pts = history.filter((r) => r.year <= year);
            return (
              <g key={sp}>
                <text x="40" y={base - 80} style={{ fill: colors[sp] }}>
                  {sp === 'hare' ? s('雪兔', 'Hare') : s('猞猁', 'Lynx')}
                </text>
                <path d={`M36 ${base - 70}v70h${w - 56}`} stroke="#b5bfaa" fill="none" />
                <text x="28" y={base - 64} textAnchor="end">
                  1
                </text>
                <text x="28" y={base + 4} textAnchor="end">
                  0
                </text>
                <path
                  clipPath={`url(#${id}-history)`}
                  d={pts
                    .map(
                      (r, i) =>
                        `${i ? 'L' : 'M'}${36 + ((r.year - 1845 - (sp === 'lynx' ? shift : 0)) / 90) * (w - 56)},${base - r[key] * 65}`,
                    )
                    .join(' ')}
                  fill="none"
                  stroke={colors[sp]}
                  strokeWidth="2.1"
                />
              </g>
            );
          })}
          {[1845, 1890, 1935].map((y) => (
            <text key={y} x={36 + ((y - 1845) / 90) * (w - 56)} y="277" textAnchor="middle">
              {y}
            </text>
          ))}
          <text x={w / 2} y="299" textAnchor="middle">
            {s('补充历史记录，非逐只普查', 'Supplementary records, not a census')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 1 && (
        <svg
          viewBox={`0 0 ${w} 300`}
          role="img"
          aria-label={s('食物与捕食形成反馈', 'Food and predation form feedback')}
        >
          <defs>
            <marker
              id={`${id}-arrow`}
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0L7 3.5 0 7" fill="#91a482" />
            </marker>
          </defs>
          <path
            d={`M${w / 2 - 24} 44q24-28 48 0m-24-5v20m0-13q-22-13-20-20m20 20q22-13 20-20`}
            stroke="#8da377"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <text x={w / 2} y="82" textAnchor="middle">
            {s('食物', 'Food')}
          </text>
          <path d={`M${w / 2} 89v28`} stroke="#91a482" markerEnd={`url(#${id}-arrow)`} />
          <text x={w / 2 + 18} y="112">
            +
          </text>
          {hare(w / 2, 148)}
          <text x={w / 2 + 48} y="155">
            {s('雪兔', 'Hare')}
          </text>
          <path d={`M${w / 2} 176v34`} stroke="#91a482" markerEnd={`url(#${id}-arrow)`} />
          <text x={w / 2 + 18} y="201">
            +
          </text>
          {lynx(w / 2, 239)}
          <text x={w / 2 + 48} y="246">
            {s('猞猁', 'Lynx')}
          </text>
          <path
            d={`M${w / 2 - 44} 239Q${w * 0.16} 205 ${w / 2 - 31} 152`}
            fill="none"
            stroke="#b39777"
            markerEnd={`url(#${id}-arrow)`}
          />
          <text x={w * 0.16} y="198">
            −
          </text>
          <circle cx={w / 2} cy={90 + p * 25} r="3" fill="#91a482" />
          <circle cx={w / 2} cy={178 + p * 28} r="3" fill="#91a482" />
          <text x={w / 2} y="293" textAnchor="middle">
            {s('食物网还有其他捕食者', 'Other predators also belong to the web')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 2 && (
        <svg
          viewBox={`0 0 ${w} 294`}
          role="img"
          aria-label={s(
            '食物与排除捕食者的析因证据',
            'Factorial evidence from food and predator reduction',
          )}
        >
          <text x={w / 2} y="23" textAnchor="middle">
            {s('阶段平均密度比', 'Phase-mean density ratio')}
          </text>
          {[
            [false, false],
            [true, false],
            [false, true],
            [true, true],
          ].map(([f, e], i) => {
            const v = hareFactorial(f, e),
              selected = film.watch ? i <= Math.floor(p * 4) : f === food && e === fence;
            return (
              <g key={i} opacity={selected ? 1 : 0.25}>
                <text x="14" y={68 + i * 53}>
                  {
                    [
                      s('对照', 'Control'),
                      s('加食物', 'Food'),
                      s('减少捕食者', 'Predator reduction'),
                      s('两项同时', 'Combined'),
                    ][i]
                  }
                </text>
                <path
                  d={`M${w * 0.64} ${62 + i * 53}h${(w * 0.24 * v) / 11}`}
                  stroke={i === 3 ? '#a39b65' : '#b8c9a0'}
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <text x={w - 8} y={68 + i * 53} textAnchor="end">
                  {v}×
                </text>
              </g>
            );
          })}
          <text x={w / 2} y="281" textAnchor="middle">
            {s('对照 = 1 · 1989–1993', 'Control = 1 · 1989–1993')}
          </text>
        </svg>
      )}
      {mode === 2 && (
        <svg viewBox={`0 0 ${w} ${mapH + 145}`} role="img" aria-label={titles[2]}>
          <text x={w / 2} y="24" textAnchor="middle">
            {!off
              ? s('保留海星 · 参照', 'Sea star retained · reference')
              : local === 0
                ? s('移除海星', 'Remove sea star')
                : s('移除后 · 占位模型', 'After removal · occupancy model')}
          </text>
          <rect x={mapX} y="65" width={mapW} height={mapH} rx="14" fill="#b3baab" />
          <path
            d={`M${mapX + 8} 111q${mapW * 0.32}-45 ${mapW * 0.6} 17t${mapW * 0.36} 35M${mapX + 14} ${mapH + 40}q${mapW * 0.3}-40 ${mapW * 0.73}-11`}
            fill="none"
            stroke="#9fa99b"
            strokeWidth="2"
          />
          {shore.map((c) => {
            const x = mapX + c.x * mapW,
              y = 65 + c.y * mapH,
              size = (mapW / 12) * 0.84;
            return (
              <g key={c.id}>
                {shell(c.type, x, y, size, 'old', c.type === c.next ? 1 : 1 - c.progress)}
                {c.type !== c.next && shell(c.next, x, y, size, 'new', c.progress)}
              </g>
            );
          })}
          {(() => {
            if (off && local > 0) return null;
            const q = local === 0 && off ? communityClamp((p - 0.15) / 0.6) : 0;
            return star(
              mapX + mapW * 0.6 + (w - 32 - mapX - mapW * 0.6) * q,
              65 + mapH * 0.6 + (43 - 65 - mapH * 0.6) * q,
            );
          })()}
          {local > 0 && (
            <text x={w / 2} y={mapH + 89} textAnchor="middle">
              {s('藤壶', 'Barnacles')} {Math.round(fractions.barnacle * 100)}% ·{' '}
              {s('贻贝', 'Mussels')} {Math.round(fractions.mussel * 100)}%
            </text>
          )}
          {local === 0 && (
            <text x={w / 2} y={mapH + 89} textAnchor="middle">
              {s('同一片岩面，先改变捕食者', 'Change predators on the same surface')}
            </text>
          )}
          {(['barnacle', 'mussel', 'limpet', 'chiton'] as ShoreSpecies[]).map((type, i) => {
            const x = w * (i % 2 === 0 ? 0.24 : 0.72),
              y = mapH + 112 + Math.floor(i / 2) * 23;
            return (
              <g key={type}>
                {shell(type, x - 37, y - 5, 16, 'legend')}
                <text x={x - 20} y={y}>
                  {
                    [
                      s('藤壶', 'Barnacle'),
                      s('贻贝', 'Mussel'),
                      s('帽贝', 'Limpet'),
                      s('石鳖', 'Chiton'),
                    ][i]
                  }
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {!film.watch && (
        <div className="bio-community-controls">
          <div className="bio-community-buttons">
            {titles.map((t, i) => (
              <button
                key={i}
                aria-pressed={mode === i}
                onClick={() => {
                  setChosen(i);
                  setView(0);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="bio-community-buttons">
            {[0, 1, 2].map((i) => (
              <button key={i} aria-pressed={local === i} onClick={() => setView(i)}>
                {s('观察', 'View ')}
                {i + 1}
              </button>
            ))}
          </div>
          {!(mode === 1 && local === 2) && (
            <label>
              {s('过程位置', 'Progress')}
              <input
                type="range"
                min="0"
                max="1"
                step=".01"
                value={progress}
                onChange={(e) => setProgress(+e.target.value)}
              />
            </label>
          )}
          {mode === 0 && local === 2 && (
            <label>
              {s('资源重叠系数', 'Resource overlap')} {overlap.toFixed(2)}
              <input
                type="range"
                min="0"
                max="1"
                step=".01"
                value={overlap}
                onChange={(e) => setOverlap(+e.target.value)}
              />
            </label>
          )}
          {mode === 1 && local === 0 && (
            <>
              <label>
                {s('将猞猁记录提前对齐', 'Shift lynx records earlier')} {lag} {s('年', 'years')}
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="1"
                  value={lag}
                  onChange={(e) => setLag(+e.target.value)}
                />
              </label>
              <p>
                {s('配对相关', 'Paired correlation')} r ={' '}
                {hareLynxCorrelation(lag).value.toFixed(2)} · n = {hareLynxCorrelation(lag).pairs}
              </p>
            </>
          )}
          {mode === 1 && local === 2 && (
            <div className="bio-community-buttons">
              <button aria-pressed={food} onClick={() => setFood(!food)}>
                {s('增加食物', 'Add food')}
              </button>
              <button aria-pressed={fence} onClick={() => setFence(!fence)}>
                {s('减少哺乳类捕食者', 'Reduce mammalian predators')}
              </button>
            </div>
          )}
          {mode === 2 && (
            <button aria-pressed={removed} onClick={() => setRemoved(!removed)}>
              {s('移除海星', 'Remove sea stars')}
            </button>
          )}
          <details>
            <summary>{s('证据来源与模型边界', 'Evidence and model boundaries')}</summary>
            <p>
              {s(
                '草履虫点为gauseR对1934年原图的数字化相对体积指数，不是个体数；24日末大草履虫仍非零，教材概括后续消失。竞争曲线另用明确参数，不冒充拟合。长期记录为1845–1935补充汇编，各自归一化；历史捕获、地区和调查方法会影响记录，相关不独自证明因果。食物与捕食者实验显示阶段平均比值，排除哺乳类捕食者不等于排除猛禽。岩面是保面积的机制重建，百分比非原始实测；海星保留组固定为参照，未声称预测其所有自然波动。',
                'Paramecium points are gauseR’s digitized1934 size-standardized volume indices, not cell counts. P. caudatum remains above zero at day24; the textbook summarizes eventual disappearance. The separate competition curve is illustrative. Supplementary1845–1935 records are normalized individually; harvest, geography and survey methods affect observations. Correlation alone is not causation. Factorial results are phase means; mammal exclusion did not exclude raptors. Rock occupancy conserves area but is a mechanism reconstruction, not measured percentages. The retained-star baseline is held as a reference rather than predicting all natural variability.',
              )}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
