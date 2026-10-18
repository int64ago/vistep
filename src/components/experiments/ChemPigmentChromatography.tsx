import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  pigmentBands,
  pigmentColors,
  phaseBalance,
  residenceTrace,
  extractPigmentSections,
  chromatographyDirector,
} from '../../models/chem-pigment-chromatography';
import '../../styles/chem-pigment-chromatography.css';
export default function ChemPigmentChromatography() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const [view, setView] = useState('bands'),
    [time, setTime] = useState(1),
    [contrast, setContrast] = useState(1),
    [spreading, setSpreading] = useState(0.35),
    [extraction, setExtraction] = useState(0.7);
  const d = film.watch
    ? chromatographyDirector(film.chapter, film.chapterProgress)
    : {
        ...chromatographyDirector(view === 'residence' ? 1 : view === 'extract' ? 6 : 2, time),
        time,
        contrast,
        spreading,
        extract: extraction,
      };
  const m = pigmentBands(d.time, d.contrast, d.spreading),
    ex = extractPigmentSections(d.time, d.contrast, d.spreading, d.extract);
  const names = [
    say('玻璃管、棉花与碳酸钙', 'Glass, cotton and calcium carbonate'),
    say('停留时间改变平均迁移', 'Residence changes average motion'),
    say('流动相向下，色带不同速', 'One flow, different band speeds'),
    say('比较保留差异', 'Compare retention contrast'),
    say('颜色分开不等于绝对纯', 'Separate colors need not be pure'),
    say('取出吸附了色素的粉末', 'Remove the colored adsorbent'),
    say('乙醇从色层中提取色素', 'Ethanol extracts the removed bands'),
  ];
  return (
    <section className="chem-chroma">
      <div className="chem-chroma-title">{names[d.chapter]}</div>
      {d.chapter === 1 ? (
        <div className="chem-chroma-residence">
          {[0, 2].map((id) => {
            const b = m.bands[id],
              r = residenceTrace(b.k, d.p * 5.8),
              phase = phaseBalance(b.k);
            return (
              <div key={id} className="chem-chroma-lane">
                <div className="chem-chroma-lane-head">
                  <span style={{ color: b.color }}>
                    {say(`组分 ${'ABC'[id]}`, `Component ${'ABC'[id]}`)}
                  </span>
                  <span>
                    {say('可移动份额', 'Mobile share')} {(100 * phase.mobile).toFixed(0)}%
                  </span>
                </div>
                <svg
                  viewBox="0 0 250 90"
                  role="img"
                  aria-label={say(
                    '色素在移动和吸附停留间切换',
                    'Pigment switches between travel and adsorption',
                  )}
                >
                  <path
                    d="M12 27H237M228 21L237 27 228 33"
                    fill="none"
                    stroke="#b7c6b3"
                    strokeWidth="2"
                  />
                  {Array.from({ length: 10 }, (_, i) => (
                    <ellipse
                      key={i}
                      cx={14 + i * 25}
                      cy="74"
                      rx="15"
                      ry="14"
                      fill="#e4dfc9"
                      stroke="#d6d0b6"
                    />
                  ))}
                  <path
                    d={`M16 45H${16 + 210 * r.distance}`}
                    stroke={b.color}
                    strokeWidth="2"
                    opacity=".35"
                  />
                  <circle cx={16 + 210 * r.distance} cy={r.moving ? 45 : 58} r="7" fill={b.color} />
                </svg>
                <span className="chem-chroma-phase">
                  {r.moving
                    ? say('随流动相移动', 'Moving with the liquid')
                    : say('暂时吸附在固体上', 'Temporarily adsorbed')}
                </span>
              </div>
            );
          })}
        </div>
      ) : d.chapter === 4 ? (
        <>
          <Profiles model={m} />
          <div className="chem-chroma-reading">
            <span>{say('A 与 B 的分布重叠', 'A–B distribution overlap')}</span>
            <b>{(100 * m.overlap).toFixed(1)}%</b>
          </div>
        </>
      ) : d.chapter === 6 ? (
        <>
          <div className="chem-chroma-vials">
            {ex.samples.map((s, i) => (
              <div key={i}>
                <span>
                  {say('色层', 'Zone')} {'ABC'[i]}
                </span>
                <svg
                  viewBox="0 0 76 148"
                  role="img"
                  aria-label={say(
                    '色素从粉末转入乙醇',
                    'Pigment transfers from adsorbent into ethanol',
                  )}
                >
                  <path
                    d="M10 13V126Q10 137 21 137H55Q66 137 66 126V13"
                    fill="#f1f4e8"
                    stroke="#afbaa8"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 49H64V125Q64 135 55 135H21Q12 135 12 125Z"
                    fill={mixedColor(s.dissolved)}
                    fillOpacity={0.15 + 0.5 * ex.fraction}
                  />
                  <path
                    d="M13 113Q24 106 34 112T63 111V126Q63 134 55 134H21Q13 134 13 126Z"
                    fill={mixedColor(s.adsorbed)}
                    fillOpacity={0.25 + 0.7 * (1 - ex.fraction)}
                  />
                  {Array.from({ length: 10 }, (_, j) => (
                    <circle
                      key={j}
                      cx={19 + (j % 5) * 10}
                      cy={119 + Math.floor(j / 5) * 7}
                      r="2"
                      fill="#ddd8bd"
                    />
                  ))}
                  {s.dissolved.map((a, j) =>
                    Array.from({ length: Math.round(a * 18) }, (_, n) => (
                      <circle
                        key={`${j}-${n}`}
                        cx={18 + ((n * 17 + j * 7) % 40)}
                        cy={61 + ((n * 19 + j * 13) % 41)}
                        r="1.6"
                        fill={pigmentColors[j]}
                      />
                    )),
                  )}
                </svg>
              </div>
            ))}
          </div>
          <div className="chem-chroma-reading">
            <span>{say('模型转入乙醇的份额', 'Model fraction in ethanol')}</span>
            <b>{(100 * ex.fraction).toFixed(0)}%</b>
          </div>
          <div className="chem-chroma-note">
            {say('每种色素的总量守恒', 'Each component is conserved')}
          </div>
        </>
      ) : (
        <>
          <Column model={m} chapter={d.chapter} p={d.p} remove={d.remove} />
          {d.chapter === 0 ? (
            <div className="chem-chroma-note">
              {say('棉花支撑粉末；液体可向下通过', 'Cotton supports the powder; liquid can pass')}
            </div>
          ) : d.chapter === 5 ? (
            <div className="chem-chroma-note">
              {say('取出的是固体色层', 'The removed zones are solid adsorbent')}
            </div>
          ) : (
            <div className="chem-chroma-speeds">
              {m.bands.map((b, i) => (
                <span key={i}>
                  <i style={{ background: b.color }} />
                  {'ABC'[i]}
                  <b>{b.relativeVelocity.toFixed(2)}u</b>
                </span>
              ))}
            </div>
          )}
        </>
      )}
      {d.chapter !== 0 && d.chapter !== 1 && d.chapter !== 5 ? (
        <div className="chem-chroma-legend">
          {say('A / B / C 为教学组分', 'A / B / C are model components')}
        </div>
      ) : null}
      {!film.watch ? (
        <div className="chem-chroma-controls">
          <Segments
            label={say('观察', 'View')}
            value={view}
            onChange={setView}
            options={[
              { value: 'bands', label: say('色带', 'Bands') },
              { value: 'residence', label: say('停留', 'Residence') },
              { value: 'extract', label: say('提取', 'Extract') },
            ]}
          />
          <Range
            label={say('迁移时间', 'Migration time')}
            value={time}
            min={0}
            max={1}
            step={0.01}
            onChange={setTime}
          />
          <Range
            label={say('保留差异', 'Retention contrast')}
            value={contrast}
            min={0}
            max={1}
            step={0.01}
            onChange={setContrast}
          />
          {view !== 'residence' ? (
            <Range
              label={say('色带展宽', 'Band spreading')}
              value={spreading}
              min={0}
              max={1}
              step={0.01}
              onChange={setSpreading}
            />
          ) : null}
          {view === 'extract' ? (
            <Range
              label={say('乙醇提取进度', 'Ethanol extraction')}
              value={extraction}
              min={0}
              max={1}
              step={0.01}
              onChange={setExtraction}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
type BandModel = ReturnType<typeof pigmentBands>;
function Column({
  model,
  chapter,
  p,
  remove,
}: {
  model: BandModel;
  chapter: number;
  p: number;
  remove: number;
}) {
  const uid = useId().replace(/:/g, ''),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a);
  const x = chapter === 5 ? 57 : 96,
    y = 38,
    height = 216,
    width = 50;
  return (
    <svg
      className="chem-chroma-column"
      viewBox="0 0 250 289"
      role="img"
      aria-label={say(
        '碳酸钙柱中不同色带的位置',
        'Positions of colored zones in a calcium carbonate column',
      )}
    >
      <defs>
        <linearGradient id={`${uid}glass`}>
          <stop stopColor="#dce8de" stopOpacity=".8" />
          <stop offset=".28" stopColor="#fff" stopOpacity=".2" />
          <stop offset=".8" stopColor="#dde7db" stopOpacity=".3" />
          <stop offset="1" stopColor="#a9bba9" stopOpacity=".6" />
        </linearGradient>
      </defs>
      <path
        d={`M${x - 4} 17V267M${x + width + 4} 267V17`}
        fill={`url(#${uid}glass)`}
        stroke="#a6b7a2"
        strokeWidth="1.8"
        opacity={1 - remove * 0.65}
      />
      {[0, 1, 2].map((j) => {
        const section = model.sections[j],
          from = y + height * section.from,
          to = y + height * section.to,
          dx = remove * 98,
          dy = remove * (j - 1) * 7;
        return (
          <g key={j} transform={`translate(${dx} ${dy})`}>
            <rect x={x} y={from} width={width} height={to - from} fill="#e7e1ca" />
            {model.bands.map((b, i) =>
              b.cells.map((a, n) => {
                const lo = Math.max(n / 160, section.from),
                  hi = Math.min((n + 1) / 160, section.to);
                return hi > lo ? (
                  <rect
                    key={`${i}-${n}`}
                    x={x}
                    y={y + lo * height}
                    width={width}
                    height={(hi - lo) * height + 0.1}
                    fill={b.color}
                    opacity={Math.min(0.88, a * 13) * (chapter === 0 ? p : 1)}
                  />
                ) : null;
              }),
            )}
            {Array.from({ length: Math.ceil((to - from) / 8) }, (_, n) => (
              <g key={n} opacity=".28">
                {[0, 1, 2, 3, 4].map((a) => (
                  <circle
                    key={a}
                    cx={x + 6 + a * 10 + (n % 2) * 2}
                    cy={Math.min(to - 2, from + 4 + n * 8)}
                    r=".8"
                    fill="#a79c75"
                  />
                ))}
              </g>
            ))}
            {chapter === 5 ? (
              <>
                <path
                  d={`M${x} ${from}H${x + width}M${x} ${to}H${x + width}`}
                  stroke="#a9a486"
                  strokeDasharray="3 3"
                />
                <text
                  x={x + width + 10}
                  y={(from + to) / 2 + 6}
                  fill={pigmentColors[j]}
                  fontSize="19"
                >
                  {'ABC'[j]}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
      <path
        d={`M${x + 2} 255Q${x + 10} 250 ${x + 18} 255Q${x + 26} 250 ${x + 34} 255Q${x + 42} 252 ${x + 48} 256L${x + 45} 264H${x + 5}Z`}
        fill="#f3f2e6"
        stroke="#c8c9b3"
        opacity={1 - remove * 0.7}
      />
      {chapter !== 5 ? (
        <>
          <path
            d={`M${x + width + 28} 58V228M${x + width + 22} 219L${x + width + 28} 228 ${x + width + 34} 219`}
            fill="none"
            stroke="#a4b6a2"
            strokeWidth="2"
          />
          <circle cx={x + width + 28} cy={63 + 155 * ((p * 1.5) % 1)} r="3" fill="#a4b6a2" />
          <text x="125" y="13" textAnchor="middle" fontSize="19" fill="#829276">
            {chapter === 0
              ? say('植物色素溶液', 'Plant pigment solution')
              : say('流动相', 'Mobile liquid')}
          </text>
          <text x="125" y="287" textAnchor="middle" fontSize="19" fill="#829276">
            CaCO₃
          </text>
        </>
      ) : null}
    </svg>
  );
}
function Profiles({ model }: { model: BandModel }) {
  const en = browserLocale() === 'en';
  return (
    <svg
      className="chem-chroma-profiles"
      viewBox="0 0 250 230"
      role="img"
      aria-label={
        en ? 'Overlapping pigment distributions along the column' : '色素沿柱的分布及重叠'
      }
    >
      <path d="M19 24V185H232" fill="none" stroke="#c1cbb9" strokeWidth="2" />
      {model.bands.map((b) => (
        <path
          key={b.id}
          d={`M19 185 ${b.cells.map((v, i) => `L${19 + (213 * (i + 0.5)) / 160} ${185 - 1800 * v}`).join(' ')} L232 185Z`}
          fill={b.color}
          fillOpacity=".19"
          stroke={b.color}
          strokeWidth="2"
        />
      ))}
      <text x="125" y="17" textAnchor="middle" fontSize="19" fill="#7e8e74">
        {en ? 'Relative pigment amount' : '相对色素量'}
      </text>
      <text x="19" y="211" fontSize="19" fill="#7e8e74">
        {en ? 'Top' : '柱顶'}
      </text>
      <text x="232" y="211" textAnchor="end" fontSize="19" fill="#7e8e74">
        {en ? 'Bottom' : '柱底'}
      </text>
      {model.bands.map((b, i) => (
        <text
          key={i}
          x={19 + b.center * 213}
          y="39"
          textAnchor="middle"
          fontSize="19"
          fill={b.color}
        >
          {'ABC'[i]}
        </text>
      ))}
    </svg>
  );
}
function mixedColor(amounts: number[]) {
  const values = [
      [86, 133, 111],
      [196, 164, 67],
      [199, 125, 71],
    ],
    sum = amounts.reduce((a, b) => a + b, 0);
  if (sum < 1e-12) return '#e5dfc9';
  return `rgb(${[0, 1, 2].map((j) => Math.round(amounts.reduce((s, a, i) => s + a * values[i][j], 0) / sum)).join(',')})`;
}
