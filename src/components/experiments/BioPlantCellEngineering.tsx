import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  plantCellClamp as clamp,
  fusionGeometry,
  tissueState,
  hormoneResponse,
  explantRate,
} from '../../models/bio-plant-cell-engineering';
import '../../styles/bio-plant-cell-engineering.css';
export default function BioPlantCellEngineering() {
  const f = useShowcase(),
    { host, width: w } = useSignalWidth(),
    uid = useId(),
    s = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
  const variants = ['bio-elective-3-035-1', 'bio-elective-3-036-1', 'bio-elective-3-037-1'];
  const [mode0, setMode] = useState(Math.max(0, variants.indexOf(f.variant ?? ''))),
    [view, setView] = useState(0),
    [progress, setProgress] = useState(0.7),
    [contamination, setContamination] = useState(false),
    [aux, setAux] = useState(0.5),
    [cyt, setCyt] = useState(3),
    [total, setTotal] = useState(''),
    [shootCount, setShootCount] = useState(''),
    [rootCount, setRootCount] = useState(''),
    [journal, setJournal] = useState('');
  const mode = f.watch ? (f.chapter < 4 ? 0 : f.chapter < 8 ? 1 : 2) : mode0,
    local = f.watch ? f.chapter - [0, 4, 8][mode] : Math.min(view, [3, 3, 2][mode]),
    p = f.watch ? f.chapterProgress : progress,
    state = tissueState(local, p, f.watch ? false : contamination),
    g = fusionGeometry(
      w,
      local === 0 ? 0 : local === 1 ? p : 1,
      local === 2 ? p : local > 2 ? 1 : 0,
    ),
    wall = local === 0 ? 1 - p : local === 2 ? clamp((p - 0.5) * 2) : 0;
  const titles = [
      s('同一外植体的再生过程', 'Regeneration from one explant'),
      s('从原生质体到杂种证据', 'Protoplasts and hybrid evidence'),
      s('配比之外，还看浓度', 'Ratio and absolute concentration'),
    ],
    views = [
      [
        s('愈伤组织', 'Callus'),
        s('生芽', 'Shoots'),
        s('生根', 'Roots'),
        s('炼苗与移栽', 'Acclimatization'),
      ],
      [
        s('去除细胞壁', 'Remove walls'),
        s('原生质体融合', 'Protoplast fusion'),
        s('核融合与再生壁', 'Nuclei and new walls'),
        s('验证与性状', 'Evidence and traits'),
      ],
      [
        s('无外源激素对照', 'No added hormones'),
        s('改变配比', 'Change the ratio'),
        s('相同比例，不同浓度', 'Same ratio, different doses'),
      ],
    ];
  const leaf = (x: number, y: number, side: number, scale = 1) => (
    <g transform={`translate(${x} ${y}) scale(${side * scale} ${scale})`}>
      <path d="M0 0Q19-22 30-12Q22 4 0 0Z" fill="#9cb180" />
      <path d="M0 0l24-11" stroke="#dce4c6" fill="none" />
    </g>
  );
  const plant = (x: number, y: number, shoot: number, root: number, callus: number, scale = 1) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {Array.from({ length: 15 }, (_, i) => {
        const a = i * 2.4,
          r = Math.sqrt((i + 0.5) / 15) * 20 * callus;
        return (
          <ellipse
            key={i}
            cx={r * Math.cos(a)}
            cy={r * 0.6 * Math.sin(a)}
            rx={4 + callus * 3}
            ry={3 + callus * 3}
            opacity={clamp(callus * 8)}
            fill={i % 2 ? '#c3c58d' : '#d0cd99'}
            stroke="#b3ba86"
          />
        );
      })}
      <path
        d={`M0 0Q${-5 * shoot} ${-36 * shoot} ${3 * shoot} ${-91 * shoot}`}
        stroke="#8da878"
        strokeWidth="4"
        fill="none"
      />
      {shoot > 0.05 && (
        <>
          {leaf(0, -30 * shoot, -1, shoot)}
          {leaf(0, -53 * shoot, 1, shoot)}
          {leaf(2 * shoot, -76 * shoot, -1, shoot * 0.7)}
        </>
      )}
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M0 8Q${(i - 2) * 7 * root} ${25 * root + 8} ${(i - 2) * 12 * root} ${48 * root + 8}m${-(i - 2) * 2 * root} ${-14 * root}l${(i % 2 ? 7 : -7) * root} ${7 * root}`}
          fill="none"
          stroke="#baa57e"
          strokeWidth="1.5"
        />
      ))}
    </g>
  );
  return (
    <div className="bio-plant-cell" data-watch={f.watch} ref={host}>
      <div className="bio-plant-cell-head">{mode === 2 ? views[2][local] : titles[mode]}</div>
      {mode === 0 && (
        <svg
          viewBox={`0 0 ${w} 304`}
          role="img"
          aria-label={s(
            '外植体在培养基中形成愈伤组织，再生芽和根，炼苗后移栽',
            'The same explant forms callus, shoots and roots before acclimatization and transplanting',
          )}
        >
          <text x={w / 2} y="27" textAnchor="middle">
            {state.contaminated
              ? s('污染瓶：不作有效结果', 'Contaminated: exclude result')
              : views[0][local]}
          </text>
          <g opacity={local === 3 ? 1 - clamp((p - 0.5) * 2) : 1}>
            <path
              d={`M${w / 2 - 48} 77V94L${w / 2 - 65} 121V238Q${w / 2 - 65} 251 ${w / 2 - 52} 251H${w / 2 + 52}Q${w / 2 + 65} 251 ${w / 2 + 65} 238V121L${w / 2 + 48} 94V77`}
              fill="#f3f4e6"
              stroke="#afbea5"
              strokeWidth="2"
            />
            <path
              d={`M${w / 2 - 63} 201h126v36q0 12-12 12H${w / 2 - 51}q-12 0-12-12Z`}
              fill="#dce0bc"
            />
            <path
              d={`M${w / 2 - 50} ${74 - (local === 3 ? clamp(p * 2) * 22 : 0)}h100`}
              stroke="#bfceb1"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </g>
          {local === 3 && (
            <g opacity={clamp((p - 0.5) * 2)}>
              <path d={`M${w / 2 - 57} 200h114l-12 61h-90Z`} fill="#c5b18a" stroke="#ae9973" />
              <ellipse cx={w / 2} cy="201" rx="57" ry="9" fill="#9e9276" />
            </g>
          )}
          <path d={`M${w / 2 - 4} 170l8 0v37h-8Z`} fill="#a0b784" opacity={state.stemOpacity} />
          {plant(w / 2, 190, state.shoot, state.root, state.callus)}
          {state.contaminated &&
            Array.from({ length: 6 }, (_, i) => (
              <circle
                key={i}
                cx={w / 2 - 40 + i * 15}
                cy={224 + (i % 2) * 9}
                r="6"
                fill="#aab0a1"
              />
            ))}
          <text x={w / 2} y="289" textAnchor="middle">
            {local === 3
              ? s('逐步适应瓶外环境', 'Adapt gradually outside culture')
              : s('营养、激素、无菌与环境条件', 'Nutrition / hormones / conditions')}
          </text>
        </svg>
      )}
      {mode === 1 && local < 3 && (
        <svg
          viewBox={`0 0 ${w} 302`}
          role="img"
          aria-label={s(
            '两来源原生质体先接触再形成连续膜，核来源标记保持在细胞内',
            'Two protoplasts contact before forming a continuous membrane; nuclear origin labels remain inside',
          )}
        >
          <text x={w / 2} y="27" textAnchor="middle">
            {local === 0
              ? s('去壁仍保留细胞膜', 'Remove walls, retain membranes')
              : local === 1
                ? s('先接触，再形成共同边界', 'Contact, then a common boundary')
                : s('核来源与细胞壁再生', 'Nuclear origin and wall regrowth')}
          </text>
          <g transform={`translate(${g.cx} ${g.cy}) rotate(${g.vertical ? 90 : 0})`}>
            {!g.body.connected ? (
              [-1, 1].map((sign) => (
                <circle
                  key={sign}
                  cx={sign * g.body.half}
                  r={g.body.r}
                  fill={sign < 0 ? '#d9e3bb' : '#e1d5bc'}
                  stroke="#9cb38c"
                  strokeWidth="2"
                />
              ))
            ) : (
              <path d={g.body.path} fill="#dce1bd" stroke="#9cb38c" strokeWidth="2" />
            )}
            {wall > 0 &&
              (!g.body.connected ? (
                [-1, 1].map((sign) => (
                  <circle
                    key={sign}
                    cx={sign * g.body.half}
                    r={g.body.r + 5}
                    stroke="#bdc6a1"
                    strokeWidth="6"
                    strokeDasharray={local === 0 && p > 0.2 ? '7 4' : undefined}
                    fill="none"
                    opacity={wall}
                  />
                ))
              ) : (
                <path
                  d={g.body.path}
                  transform="scale(1.1)"
                  stroke="#bdc6a1"
                  strokeWidth="7"
                  fill="none"
                  opacity={wall}
                />
              ))}
            {g.organelles.map((a) => (
              <ellipse
                key={a.id}
                cx={a.localX}
                cy={a.localY}
                rx="4"
                ry="2.4"
                fill={a.group ? '#b2a879' : '#95ae7e'}
              />
            ))}
            {g.nuc.connected ? (
              <path d={g.nuc.path} fill="#d2c6c6" stroke="#b7a8b4" />
            ) : (
              [-1, 1].map((sign) => (
                <circle
                  key={sign}
                  cx={sign * g.ns}
                  r="9"
                  fill={sign < 0 ? '#c5c3d4' : '#dcc1b3'}
                  stroke="#b5a3b3"
                />
              ))
            )}
            {g.markers.map((a) => (
              <path
                key={a.id}
                d={`M${a.localX - 2} ${a.localY - 2}q4 2 0 4`}
                stroke={a.group ? '#b28a74' : '#918da9'}
                strokeWidth="2"
                fill="none"
              />
            ))}
          </g>
          <text x={w / 2} y="281" textAnchor="middle">
            {s('两种颜色：核内来源标记', 'Two colours: nuclear-origin labels')}
          </text>
        </svg>
      )}
      {mode === 1 && local === 3 && (
        <svg
          viewBox={`0 0 ${w} 298`}
          role="img"
          aria-label={s(
            '核来源证据与期待整株性状分别判断',
            'Nuclear-source evidence is distinct from desired whole-plant traits',
          )}
        >
          <text x={w / 2} y="27" textAnchor="middle">
            {s('融合成功 ≠ 性状如愿组合', 'Fusion ≠ desired trait combination')}
          </text>
          {plant(w / 2, 195, 0.85 * clamp(p * 2), 0.85 * clamp(p * 2), 0.4)}
          <rect x={w / 2 - 48} y="223" width="96" height="30" rx="8" fill="#e7e4d0" />
          {[0, 1].map((i) => (
            <g key={i}>
              <circle cx={w / 2 - 22 + i * 44} cy="238" r="7" fill={i ? '#b28a74' : '#918da9'} />
              <text x={w / 2 - 22 + i * 44} y="279" textAnchor="middle">
                {i ? 'B' : 'A'}
              </text>
            </g>
          ))}
          <text x={w / 2} y="61" textAnchor="middle">
            {s('核编码产物证据：两亲本', 'Nuclear products: both parents')}
          </text>
        </svg>
      )}
      {mode === 2 && (
        <svg
          viewBox={`0 0 ${w} 320`}
          role="img"
          aria-label={s(
            '不同激素配比和总浓度的教学响应对照',
            'Illustrative responses to hormone ratio and total concentration',
          )}
        >
          <text x={w / 2} y="25" textAnchor="middle">
            {s('生长素 / 细胞分裂素', 'Auxin / cytokinin')}
          </text>
          {(local === 2
            ? [
                [0, 0],
                [0.1, 0.1],
                [1, 1],
                [f.watch ? 10 : aux, f.watch ? 10 : cyt],
              ]
            : [
                [0, 0],
                [1, 1],
                [3, 0.5],
                [f.watch ? 0.5 : aux, f.watch ? 3 : cyt],
              ]
          )
            .filter((_, i) => local !== 0 || i < 2)
            .map(([a, c], i) => {
              const x = w * (i % 2 ? 0.75 : 0.25),
                y = local === 0 ? 175 : i < 2 ? 130 : 268,
                v = hormoneResponse(a, c),
                amount = clamp(p * 2);
              return (
                <g key={i}>
                  <path
                    d={`M${x - 38} ${y - 87}v94q38 16 76 0v-94`}
                    fill="#f1f3e4"
                    stroke="#b8c3aa"
                  />
                  <path d={`M${x - 36} ${y - 7}h72v12q-36 12-72 0Z`} fill="#d7dcb6" />
                  {plant(x, y - 14, v.shoot * amount, v.root * amount, v.callus * amount, 0.52)}
                  <text x={x} y={y + 40} textAnchor="middle">
                    {a} / {c}
                  </text>
                </g>
              );
            })}
        </svg>
      )}
      {!f.watch && (
        <div className="bio-plant-cell-controls">
          <div className="bio-plant-cell-buttons">
            {titles.map((x, i) => (
              <button
                key={i}
                aria-pressed={mode === i}
                onClick={() => {
                  setMode(i);
                  setView(0);
                }}
              >
                {x}
              </button>
            ))}
          </div>
          <div className="bio-plant-cell-buttons">
            {views[mode].map((x, i) => (
              <button
                key={i}
                aria-pressed={local === i}
                onClick={() => {
                  setView(i);
                  if (mode === 2 && i === 2) {
                    setAux(10);
                    setCyt(10);
                  }
                }}
              >
                {x}
              </button>
            ))}
          </div>
          <label>
            {s('过程位置', 'Process position')}
            <input
              type="range"
              min="0"
              max="1"
              step=".005"
              value={progress}
              onChange={(e) => setProgress(+e.target.value)}
            />
          </label>
          {mode === 0 && (
            <button aria-pressed={contamination} onClick={() => setContamination(!contamination)}>
              {contamination
                ? s('污染观察变式', 'Contaminated observation')
                : s('清洁培养变式', 'Clean culture example')}
            </button>
          )}
          {mode === 2 && local > 0 && (
            <>
              <label>
                {s('第四组：生长素（相对浓度）', 'Group4: auxin (relative dose)')} {aux}
                <input
                  type="range"
                  min="0"
                  max="12"
                  step=".1"
                  value={aux}
                  onChange={(e) => setAux(+e.target.value)}
                />
              </label>
              <label>
                {s('第四组：细胞分裂素', 'Group4: cytokinin')} {cyt}
                <input
                  type="range"
                  min="0"
                  max="12"
                  step=".1"
                  value={cyt}
                  onChange={(e) => setCyt(+e.target.value)}
                />
              </label>
              <div className="bio-plant-cell-records">
                {[
                  [total, setTotal, s('实际接种总数', 'Actual explants')],
                  [shootCount, setShootCount, s('生芽外植体数', 'Explants with shoots')],
                  [rootCount, setRootCount, s('生根外植体数', 'Explants with roots')],
                ].map(([v, set, label], i) => (
                  <label key={i}>
                    {label as string}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={v as string}
                      onChange={(e) => (set as typeof setTotal)(e.target.value)}
                    />
                  </label>
                ))}
              </div>
              <p>
                {s('个人生芽 / 生根比例', 'Own shoot / root fractions')}:{' '}
                {explantRate(shootCount, total)?.toFixed(2) ?? '—'} /{' '}
                {explantRate(rootCount, total)?.toFixed(2) ?? '—'}
              </p>
            </>
          )}
          <details>
            <summary>{s('模型边界与培养记录', 'Model boundaries and records')}</summary>
            <p>
              {s(
                '过程压缩不代表固定天数。配比响应是教学假设，不是菊花的剂量处方；相同比例还受绝对浓度、外植体和基因型影响。融合图守恒的是二维图示面积，颜色是来源标记，不是真实染料、染色体数量或测量结果。',
                'Compressed stages are not fixed durations. Hormone responses are illustrative, not a chrysanthemum recipe. Absolute dose, explant and genotype also matter. Fusion conserves illustrated2-D area; colours mark origin, not actual dyes, chromosome numbers or measurements.',
              )}
            </p>
            <label>
              {s(
                '材料、条件、污染、分化与移栽记录',
                'Materials, conditions, contamination, differentiation and transplant record',
              )}
              <textarea value={journal} onChange={(e) => setJournal(e.target.value)} />
            </label>
          </details>
        </div>
      )}
    </div>
  );
}
