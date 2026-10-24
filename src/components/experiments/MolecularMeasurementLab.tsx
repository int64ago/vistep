import { useEffect, useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  carbonTrack,
  carbonPosition,
  carbonImpacts,
  carbonDiffusion,
  waterAlcoholMix,
  mixtureStructure,
  oilFilm,
  oilBoundary,
  oilPowder,
  molecularShot,
  type MolecularState,
} from '../../models/molecular-measurement-lab';
import '../../styles/molecular-measurement-lab.css';
const carbonShape = 'M-16-4L-10-17 5-19 18-7 16 11 1 19-15 11Z';
function Water({ x = 0, y = 0, angle = 0 }: { x?: number; y?: number; angle?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M-5 4L0 0 5 4" stroke="#bc9a88" strokeWidth="2" />
      <circle r="3.4" fill="#bb8272" />
      <circle cx="-5" cy="4" r="2.3" fill="#fbfaf0" stroke="#b0b9a6" />
      <circle cx="5" cy="4" r="2.3" fill="#fbfaf0" stroke="#b0b9a6" />
    </g>
  );
}
function Ethanol({ x = 0, y = 0, angle = 0 }: { x?: number; y?: number; angle?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M-8 2L0-3 8 2 13-1" stroke="#b2ab8c" strokeWidth="2" />
      <circle cx="-8" cy="2" r="3.4" fill="#758569" />
      <circle cy="-3" r="3.4" fill="#758569" />
      <circle cx="8" cy="2" r="3.4" fill="#bb8272" />
      <circle cx="13" cy="-1" r="2.2" fill="#fbfaf0" stroke="#b0b9a6" />
    </g>
  );
}
export default function MolecularMeasurementLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    authored = molecularShot(film.chapter, film.chapterProgress, film.chapterTime);
  const [manual, setManual] = useState<MolecularState | null>(null),
    s = film.watch ? authored : (manual ?? authored);
  useEffect(() => {
    if (!film.watch) setManual((previous) => previous ?? authored);
  }, [film.watch, authored]);
  const set = (patch: Partial<MolecularState>) => setManual({ ...s, ...patch });
  const tracks = useMemo(
    () =>
      Array.from({ length: 19 }, (_, i) =>
        carbonTrack(137 + i * 19, s.temperature, s.radius * 1e-6),
      ),
    [s.temperature, s.radius],
  );
  const cold = useMemo(() => carbonTrack(137, 293.15, s.radius * 1e-6), [s.radius]);
  const tracked = carbonPosition(tracks[0], s.time),
    reference = carbonPosition(cold, s.time),
    impact = carbonImpacts(137, s.time),
    mix = waterAlcoholMix(s.progress),
    molecules = mixtureStructure(s.progress),
    oil = oilFilm(1, s.drops, s.dilution, s.area);
  const scale = Math.min(
    2.5,
    49 /
      Math.max(
        1,
        ...tracks[0].map((p) => Math.hypot(p.x, p.y)),
        ...cold.map((p) => Math.hypot(p.x, p.y)),
      ),
  );
  const trace = (track: { x: number; y: number }[]) =>
    track
      .filter((_, i) => i <= s.time && i % 30 === 0)
      .map((p, i) => `${i ? 'L' : 'M'}${68 + p.x * scale} ${90 + p.y * scale}`)
      .join(' ');
  const boundary = useMemo(() => oilBoundary(200), []),
    outline =
      boundary.map((p, i) => `${i ? 'L' : 'M'}${140 + p.x * 8} ${96 + p.y * 8}`).join(' ') + 'Z';
  const links = molecules.flatMap((p, i) => {
    const nearest = molecules
      .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
      .filter((q) => q.j !== i)
      .sort((a, b) => a.d - b.d)[0];
    return nearest.d < 44 && i < nearest.j ? [[i, nearest.j]] : [];
  });
  const cylinder = (x: number, volume: number, label: string) => (
    <g>
      <path
        d={`M${x - 20} 10V82Q${x - 20} 88 ${x - 15} 88H${x + 15}Q${x + 20} 88 ${x + 20} 82V10`}
        fill="#edf3e9"
        stroke="#9daf99"
        strokeWidth="1.5"
      />
      <path
        d={`M${x - 18} ${86 - volume * 0.68}H${x + 18}V81Q${x + 18} 86 ${x + 13} 86H${x - 13}Q${x - 18} 86 ${x - 18} 81Z`}
        fill="#bad3c1"
        opacity=".8"
      />
      {[0, 25, 50, 75, 100].map((v) => (
        <path key={v} d={`M${x + 12} ${86 - v * 0.68}h7`} stroke="#8ba184" />
      ))}
      <path d={`M${x - 27} 90H${x + 27}`} stroke="#aabda2" strokeWidth="3" strokeLinecap="round" />
      <text x={x} y="112" textAnchor="middle">
        {label}
      </text>
    </g>
  );
  return (
    <div
      className="molecular-lab"
      data-mode={s.mode}
      data-watch={film.watch}
      data-state={JSON.stringify(s)}
      data-mass={mix.totalMass}
      data-volume={mix.mixture}
      data-water-count={molecules.filter((m) => m.species === 'water').length}
      data-ethanol-count={molecules.filter((m) => m.species === 'ethanol').length}
      data-thickness={oil.thickness}
    >
      <header>
        <span>
          {t(
            s.mode === 'brownian'
              ? '可见炭粒 → 分子热运动'
              : s.mode === 'mix'
                ? '体积变了，分子没消失'
                : '铺成一层，估测尺度',
          )}
        </span>
        <b>
          {s.mode === 'brownian'
            ? `${Math.round(s.temperature - 273.15)} °C`
            : s.mode === 'mix'
              ? '50 + 50 mL'
              : `1 : ${s.dilution}`}
        </b>
      </header>
      <div className={`molecular-figure molecular-${s.mode}`}>
        <svg
          viewBox="0 0 280 190"
          role="img"
          aria-label={t(
            s.mode === 'brownian'
              ? '炭粒观察与分子撞击解释的双尺度图'
              : s.mode === 'mix'
                ? '量筒读数与保持身份的水醇分子结构图'
                : '油膜体积、面积与单层厚度的关系图',
          )}
        >
          <defs>
            <clipPath id={`${id}-scope`}>
              <circle cx="68" cy="90" r="60" />
            </clipPath>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0 0L8 4 0 8Z" fill="context-stroke" />
            </marker>
            <linearGradient id={`${id}-water`} x2="0" y2="1">
              <stop stopColor="#d3e4d8" />
              <stop offset="1" stopColor="#edf2e6" />
            </linearGradient>
          </defs>
          {s.mode === 'brownian' && (
            <>
              <circle cx="68" cy="90" r="64" fill="#e0e7d6" />
              <circle cx="68" cy="90" r="60" fill="#f1f3e8" stroke="#bbc9ad" />
              <g clipPath={`url(#${id}-scope)`}>
                {s.compare && (
                  <path d={trace(cold)} fill="none" stroke="#91b0aa" strokeWidth="1.4" />
                )}
                <path
                  d={trace(tracks[0])}
                  fill="none"
                  stroke="#b69b62"
                  strokeWidth="1.4"
                  strokeDasharray="2 3"
                />
                {tracks.map((track, i) => {
                  const p = carbonPosition(track, s.time),
                    x = 68 + (p.x + (i === 0 ? 0 : ((i % 5) - 2) * 8)) * scale,
                    y = 90 + (p.y + (i === 0 ? 0 : (Math.floor(i / 5) - 1.5) * 10)) * scale;
                  return (
                    <g key={i} transform={`translate(${x} ${y})`}>
                      <path
                        d={carbonShape}
                        transform={`scale(${Math.max(0.055, s.radius * 0.15)})`}
                        fill={i === 0 ? '#9e7f47' : '#819079'}
                      />
                      {i === 0 && <circle r="5.5" fill="none" stroke="#b79a59" strokeWidth="1.2" />}
                    </g>
                  );
                })}
                {s.compare && (
                  <circle
                    cx={68 + reference.x * scale}
                    cy={90 + reference.y * scale}
                    r="4"
                    fill="none"
                    stroke="#81a7a2"
                  />
                )}
              </g>
              <path d={`M${100 - 20 * scale} 146h${20 * scale}`} stroke="#78906b" strokeWidth="2" />
              <text x={100 - 10 * scale} y="174" textAnchor="middle">
                20 μm
              </text>
              <path d="M133 90h13" stroke="#b8bba0" strokeDasharray="2 3" />
              <circle cx="211" cy="90" r="60" fill="#eff1e3" />
              <path d={carbonShape} transform="translate(211 90)" fill="#a58a54" stroke="#8f794b" />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * Math.PI) / 6,
                  phase = (s.time % 1) * 7;
                return (
                  <Water
                    key={i}
                    x={211 + Math.cos(a) * (44 - phase * (i % 2 ? 1 : -0.5))}
                    y={90 + Math.sin(a) * (44 - phase * (i % 2 ? 1 : -0.5))}
                    angle={i * 41}
                  />
                );
              })}
              {(
                [
                  [211 - 21 - impact.left * 9, 90, 190, 90],
                  [211 + 21 + impact.right * 9, 90, 232, 90],
                  [211, 90 - 22 - impact.top * 9, 211, 68],
                  [211, 90 + 22 + impact.bottom * 9, 211, 112],
                ] as number[][]
              ).map((a, i) => (
                <path
                  key={i}
                  d={`M${a[0]} ${a[1]}L${a[2]} ${a[3]}`}
                  stroke="#92ada8"
                  strokeWidth={1.5 + [impact.left, impact.right, impact.top, impact.bottom][i]}
                  markerEnd={`url(#${id}-arrow)`}
                />
              ))}
              <path
                d={`M211 90l${impact.x * 28} ${impact.y * 28}`}
                stroke="#997535"
                strokeWidth="2.6"
                markerEnd={`url(#${id}-arrow)`}
              />
              <text x="211" y="174" textAnchor="middle">
                {t('撞击不均衡')}
              </text>
            </>
          )}
          {s.mode === 'mix' && (
            <>
              {cylinder(55, mix.water, `${mix.water.toFixed(0)} mL`)}
              {cylinder(212, mix.mixture, `${mix.mixture.toFixed(0)} mL`)}
              <path d="M181 18h63" stroke="#b79858" strokeDasharray="3 3" />
              <text x="142" y="25" textAnchor="middle">
                100
              </text>
              <text x="134" y="64" textAnchor="middle">
                {s.progress === 0 ? '+' : '→'}
              </text>
              <g transform="translate(0 116) scale(1 .78)">
                <path
                  d={s.progress === 0 ? 'M8 0H102V87H8Z M158 0H251V87H158Z' : 'M102 0H253V87H102Z'}
                  fill="#edf1e5"
                  stroke="#d6decc"
                  strokeDasharray="3 4"
                />
                {links.map(([a, b]) => (
                  <path
                    key={`${a}-${b}`}
                    d={`M${molecules[a].x} ${molecules[a].y}L${molecules[b].x} ${molecules[b].y}`}
                    stroke="#b8ae86"
                    strokeDasharray="2 3"
                  />
                ))}
                {molecules.map((m) => (
                  <g key={m.id} data-molecule-id={m.id} data-species={m.species}>
                    {m.species === 'water' ? <Water {...m} /> : <Ethanol {...m} />}
                  </g>
                ))}
              </g>
            </>
          )}
          {s.mode === 'oil' && s.oilStage === 0 && (
            <>
              <path d="M50 15H96V95H50Z" fill="#edf2e5" stroke="#a5b89a" />
              <path d="M73 0V15M54 1H92M73 95V124" stroke="#8da57f" strokeWidth="3" />
              <path d="M53 48H93V92H53Z" fill="#dfcb99" />
              {Array.from({ length: 5 }, (_, i) => (
                <path key={i} d={`M50 ${25 + i * 13}h12`} stroke="#a6b799" />
              ))}
              <path d="M38 148V184H108V148" stroke="#a3b796" fill="#ecf0e0" />
              <circle cx="73" cy={125 + ((s.progress * s.drops) % 1) * 20} r="3" fill="#b59b5b" />
              <text x="188" y="43" textAnchor="middle">
                1 mL ÷ {s.drops}
              </text>
              <text x="188" y="75" textAnchor="middle">
                {oil.dropMl.toFixed(3)} mL
              </text>
              <path d="M188 84v20" stroke="#a99968" markerEnd={`url(#${id}-arrow)`} />
              <text x="220" y="101">
                ÷{s.dilution}
              </text>
              <text x="188" y="133" textAnchor="middle">
                {(oil.volumeMl * 1000).toFixed(3)} μL
              </text>
              <text x="188" y="163" textAnchor="middle">
                {t('纯油酸')}
              </text>
            </>
          )}
          {s.mode === 'oil' && s.oilStage > 0 && s.oilStage < 3 && (
            <>
              <rect
                x="9"
                y="8"
                width="262"
                height="176"
                rx="18"
                fill={`url(#${id}-water)`}
                stroke="#b6c8aa"
                strokeWidth="2"
              />
              {oilPowder(s.oilStage === 1 ? s.progress : 1).map((p) => (
                <circle key={p.id} cx={p.x} cy={p.y} r="1" fill="#fcfbec" />
              ))}
              <path
                d={outline}
                transform={
                  s.oilStage === 1
                    ? `translate(140 96) scale(${0.1 + 0.9 * Math.min(1, s.progress / 0.7)}) translate(-140 -96)`
                    : undefined
                }
                fill="#e6d39a"
                stroke="#baa164"
              />
              {s.oilStage === 2 && (
                <>
                  {Array.from({ length: 33 }, (_, i) => (
                    <path
                      key={`v${i}`}
                      d={`M${12 + i * 8} 10V181`}
                      stroke="#a0b491"
                      strokeWidth=".55"
                    />
                  ))}
                  {Array.from({ length: 22 }, (_, i) => (
                    <path
                      key={`h${i}`}
                      d={`M11 ${10 + i * 8}H269`}
                      stroke="#a0b491"
                      strokeWidth=".55"
                    />
                  ))}
                </>
              )}
            </>
          )}
          {s.mode === 'oil' && s.oilStage === 3 && (
            <>
              <rect x="11" y="110" width="258" height="72" rx="10" fill={`url(#${id}-water)`} />
              {Array.from({ length: 12 }, (_, i) => (
                <g key={i}>
                  <circle cx={25 + i * 19} cy="109" r="5" fill="#94b398" />
                  <path
                    d={`M${25 + i * 19} 104l3-8-4-8 4-8-3-10`}
                    stroke="#b39a61"
                    strokeWidth="3"
                    fill="none"
                  />
                </g>
              ))}
              <path d="M261 70v39m-4-39h8m-8 39h8" stroke="#a58b50" strokeWidth="1.5" />
              <text x="140" y="39" textAnchor="middle">
                d = V / S = {(oil.thickness * 1e9).toFixed(2)} nm
              </text>
              <text x="140" y="159" textAnchor="middle">
                {t('亲水端朝向水')}
              </text>
            </>
          )}
        </svg>
      </div>
      <div className="molecular-readings">
        {s.mode === 'brownian' ? (
          <>
            <span>
              {s.time.toFixed(0)} s · r = {s.radius.toFixed(1)} μm
            </span>
            <span>
              D = {(carbonDiffusion(s.temperature, s.radius * 1e-6) * 1e12).toFixed(3)} μm²/s
            </span>
            {s.compare && (
              <span className="molecular-comparison">{t('青：20°C · 金：当前温度')}</span>
            )}
          </>
        ) : s.mode === 'mix' ? (
          <>
            <span>H₂O × 12 · C₂H₅OH × 4</span>
          </>
        ) : (
          <span>
            {s.oilStage === 0
              ? t('溶液体积 ≠ 纯油酸体积')
              : `V = ${(oil.volumeMl * 1000).toFixed(3)} μL · S = ${s.area} cm²`}
          </span>
        )}
      </div>
      <p className="molecular-qualification">
        {t(
          s.mode === 'brownian'
            ? '撞击图：非显微图，非同比例'
            : s.mode === 'mix'
              ? '结构示意：不代表配比，不预测体积'
              : s.oilStage === 2
                ? '每格1 cm²；过半计1格，少于半格舍去'
                : s.oilStage === 3
                  ? '只有均匀单层，厚度才对应分子尺度'
                  : s.oilStage === 1
                    ? '边界稳定后测面积；单层是估测前提'
                    : '先数滴，再扣除溶剂所占体积',
        )}
      </p>
      {!film.watch && (
        <>
          <div className="molecular-controls">
            <Segments
              label={t('选择分子实验')}
              value={s.mode}
              onChange={(mode) => set({ mode })}
              options={[
                { value: 'brownian', label: t('炭粒') },
                { value: 'mix', label: t('水醇') },
                { value: 'oil', label: t('油膜') },
              ]}
            />
            {s.mode === 'brownian' ? (
              <>
                <Range
                  label={t('悬浊液温度')}
                  value={s.temperature - 273.15}
                  min={5}
                  max={70}
                  unit="°C"
                  onChange={(temperature) =>
                    set({ temperature: temperature + 273.15, compare: true })
                  }
                />
                <Range
                  label={t('等效炭粒半径')}
                  value={s.radius}
                  min={0.2}
                  max={1.5}
                  step={0.1}
                  unit="μm"
                  onChange={(radius) => set({ radius })}
                />
                <Range
                  label={t('观察时间')}
                  value={Number(s.time.toFixed(1))}
                  min={0}
                  max={300}
                  step={0.1}
                  unit="s"
                  onChange={(time) => set({ time })}
                />
              </>
            ) : s.mode === 'mix' ? (
              <Range
                label={t('倒入并待混合稳定的进度')}
                value={s.progress}
                min={0}
                max={1}
                step={0.01}
                onChange={(progress) => set({ progress })}
              />
            ) : (
              <>
                <Segments
                  label={t('油膜实验步骤')}
                  value={String(s.oilStage)}
                  onChange={(step) => set({ oilStage: Number(step) })}
                  options={[
                    { value: '0', label: t('滴数') },
                    { value: '1', label: t('铺展') },
                    { value: '2', label: t('面积') },
                    { value: '3', label: t('厚度') },
                  ]}
                />
                <Range
                  label={t('1毫升溶液的滴数读数')}
                  value={s.drops}
                  min={30}
                  max={80}
                  onChange={(drops) => set({ drops })}
                />
                <Range
                  label={t('配液稀释倍数读数')}
                  value={s.dilution}
                  min={250}
                  max={1000}
                  step={50}
                  onChange={(dilution) => set({ dilution })}
                />
                <Range
                  label={t('油膜面积读数')}
                  value={s.area}
                  min={160}
                  max={240}
                  unit="cm²"
                  onChange={(area) => set({ area })}
                />
              </>
            )}
          </div>
          <details className="molecular-note">
            <summary>{t('间接观察与估测边界')}</summary>
            <p>
              {t(
                '炭粒的30秒连线是位置记录；撞击图只表示不均衡的合效应，不是水分子的真实轨迹或力测量。水醇图保留示意分子身份，颗数不代表配比，连线表示相互作用而非新化学键；约96毫升是近室温代表读数，不由结构图计算。油膜图固定为200平方厘米，探索改变测量读数分析误差。',
              )}
            </p>
          </details>
        </>
      )}
    </div>
  );
}
