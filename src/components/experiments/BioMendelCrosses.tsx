import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  mendelCross,
  mendelObservations,
  peaOutline,
  peaPhenotype,
  pollinationState,
  segregationCounts,
  segregationDraws,
  bucketPoint,
  drawBallPoint,
} from '../../models/bio-mendel-crosses';
import '../../styles/bio-mendel-crosses.css';
type Mode =
  'pollination' | 'parents' | 'self' | 'sampling' | 'test' | 'diParents' | 'diSelf' | 'diTest';
const modes: Mode[] = [
  'pollination',
  'parents',
  'self',
  'sampling',
  'test',
  'diParents',
  'diSelf',
  'diTest',
];
const names = [
  '控制花粉来源',
  '一对性状：亲本杂交',
  '一对性状：F1自交',
  '两桶彩球模拟',
  '一对性状：测交',
  '两对性状：亲本杂交',
  '两对性状：F1自交',
  '两对性状：测交',
];
const labels: Record<string, string> = {
  tall: '高茎',
  short: '矮茎',
  'yellow-round': '黄色圆粒',
  'yellow-wrinkled': '黄色皱粒',
  'green-round': '绿色圆粒',
  'green-wrinkled': '绿色皱粒',
};
const defaults: Record<Mode, [string, string]> = {
  pollination: ['DD', 'dd'],
  parents: ['DD', 'dd'],
  self: ['Dd', 'Dd'],
  sampling: ['Dd', 'Dd'],
  test: ['Dd', 'dd'],
  diParents: ['YYRR', 'yyrr'],
  diSelf: ['YyRr', 'YyRr'],
  diTest: ['YyRr', 'yyrr'],
};
function Pea({ phenotype }: { phenotype: string }) {
  return (
    <svg viewBox="-26 -26 52 52" aria-hidden="true">
      <path
        d={peaOutline(phenotype)}
        fill={phenotype.startsWith('yellow') ? '#c9b768' : '#9cae7d'}
        stroke={phenotype.startsWith('yellow') ? '#b29e52' : '#7e9867'}
        strokeWidth="1.4"
      />
      <path d="M-7-5Q-12 1-5 6" fill="none" stroke="#f1ecd0" strokeWidth="2" opacity=".7" />
      {phenotype.includes('wrinkled') && (
        <path
          d="M-12-12Q-1-8-5 3M11-8Q1 1 9 12M-12 10Q-3 14 0 6"
          stroke="#8b9569"
          fill="none"
          strokeWidth="1.5"
          opacity=".7"
        />
      )}
    </svg>
  );
}
function Plant({ short = false }: { short?: boolean }) {
  const h = short ? 46 : 110;
  return (
    <svg viewBox="0 0 80 135" aria-hidden="true">
      <path d={`M40 126V${126 - h}`} stroke="#7b9760" strokeWidth="3" fill="none" />
      {[0.25, 0.5, 0.75].map((f, i) => (
        <g key={f}>
          <path
            d={`M40 ${126 - h * f}Q${i % 2 ? 13 : 67} ${112 - h * f} ${i % 2 ? 17 : 63} ${124 - h * f}Q${i % 2 ? 28 : 52} ${133 - h * f} 40 ${126 - h * f}`}
            fill="#a6b889"
          />
          <path
            d={`M40 ${126 - h * f}Q${i % 2 ? 51 : 29} ${111 - h * f} ${i % 2 ? 61 : 19} ${118 - h * f}`}
            fill="none"
            stroke="#8aa174"
          />
        </g>
      ))}
      <path d={`M40 ${126 - h}q-16-12-16 0q6 12 16 3q10 8 15-3q-3-10-15 0`} fill="#ae94ad" />
      <path d="M17 127H63" stroke="#bbb598" strokeWidth="2" />
    </svg>
  );
}
function Flower({ recipient, removal = 0 }: { recipient: boolean; removal?: number }) {
  return (
    <g>
      <path d="M0 100Q8 48 0 5" stroke="#87a06d" strokeWidth="5" fill="none" />
      <path
        d="M0 5Q-62-54-48-69Q-14-90 0-44Q17-90 51-67Q67-39 0 5"
        fill="#c9b3c6"
        stroke="#ac91aa"
        strokeWidth="1.5"
      />
      <path
        d="M0 5Q-62-17-45 11Q-24 44 0 21Q24 44 48 11Q64-17 0 5"
        fill="#d6c3d2"
        stroke="#b397b0"
      />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 9 - 0.5) * 2,
          x = Math.sin(a) * 22,
          y = -15 - Math.cos(a) * 20;
        return (
          <g
            key={i}
            transform={`translate(${recipient ? removal * (52 + i * 2) : 0} ${recipient ? -removal * 74 : 0})`}
            opacity={1 - (recipient ? removal * 0.65 : 0)}
          >
            <path d={`M0 17Q${x} 3 ${x} ${y}`} stroke="#b6ac77" fill="none" />
            <ellipse cx={x} cy={y} rx="4" ry="7" fill="#c8b46a" />
          </g>
        );
      })}
      <path d="M0 17Q-3-20 4-43" stroke="#92a66d" fill="none" strokeWidth="4" />
      <ellipse cx="4" cy="-44" rx="7" ry="4" fill="#a1b67e" />
    </g>
  );
}
export default function BioMendelCrosses() {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      modes.includes(f.variant as Mode) ? (f.variant as Mode) : 'pollination',
    ),
    [progress, setProgress] = useState(0.7),
    [seed, setSeed] = useState(17),
    [sampleSize, setSampleSize] = useState(30),
    [emasculated, setEmasculated] = useState(true),
    [protectedFlower, setProtectedFlower] = useState(true),
    [reciprocal, setReciprocal] = useState(false),
    [custom, setCustom] = useState<Partial<Record<Mode, [string, string]>>>({});
  const m = f.watch ? modes[Math.min(7, f.chapter)] : mode,
    p = f.watch ? ease(ramp(f.chapterProgress, 0.04, 0.9)) : progress,
    pair = f.watch ? defaults[m] : (custom[m] ?? defaults[m]),
    reversed = !f.watch && reciprocal,
    parents = reversed ? [pair[1], pair[0]] : pair,
    cross = mendelCross(parents[0], parents[1]),
    active = Math.min(cross.cells.length - 1, Math.floor(p * cross.cells.length)),
    selected = cross.cells[active],
    di = m.startsWith('di'),
    pol = pollinationState(p, f.watch || emasculated, f.watch || protectedFlower),
    n = f.watch ? 30 : sampleSize,
    completed = Math.min(n, Math.floor(p * n)),
    phase = p === 1 ? 1 : p * n - completed,
    draw = segregationDraws(f.watch ? 17 : seed, n)[Math.min(n - 1, completed)],
    counts = segregationCounts(f.watch ? 17 : seed, completed),
    observation =
      m === 'self'
        ? mendelObservations.self
        : m === 'test'
          ? mendelObservations.test
          : m === 'diSelf'
            ? mendelObservations.diSelf
            : m === 'diTest'
              ? reversed
                ? mendelObservations.diTestMale
                : mendelObservations.diTestFemale
              : null;
  return (
    <section
      className="bio-mendel"
      data-watch={f.watch}
      data-mode={m}
      data-observed={f.watch && !!observation && f.chapterProgress >= 0.72}
    >
      <p className="bio-mendel-kind">{t(names[modes.indexOf(m)])}</p>
      {m === 'pollination' ? (
        <>
          <svg
            className="bio-mendel-flower"
            viewBox="0 0 370 270"
            role="img"
            aria-label={t('未成熟花去雄、套袋、接受另一株花粉，再套袋')}
          >
            <g transform="translate(89 135)">
              <Flower recipient removal={pol.removal} />
            </g>
            <g transform="translate(282 135)">
              <Flower recipient={false} />
            </g>
            <path
              d={`M${110 + pol.removal * 48} ${100 - pol.removal * 74}l35-30m-35 30 45-20`}
              fill="none"
              stroke="#969b96"
              strokeWidth="3"
            />
            {Array.from({ length: 8 }, (_, i) => (
              <circle
                key={i}
                cx={286 - pol.pollen * 193 + ((i % 4) - 1.5) * 3}
                cy={
                  103 -
                  pol.pollen * 12 +
                  Math.floor(i / 4) * 3 -
                  22 * Math.sin(pol.pollen * Math.PI)
                }
                r="2.4"
                fill="#bca35b"
                opacity={p > 0.46 ? 1 : 0}
              />
            ))}
            <path
              d="M28 53Q88 40 150 53L142 176Q86 190 35 176Z"
              fill="#d5c7a6"
              fillOpacity={pol.bag * 0.76}
              stroke="#b9ae90"
              strokeOpacity={pol.bag}
              strokeWidth="2"
            />
            <path d="M39 177H139" stroke="#928b70" opacity={pol.bag} />
          </svg>
          <div className="bio-mendel-parent-labels">
            <span>{t('母本：保留雌蕊')}</span>
            <span>{t('父本：提供花粉')}</span>
          </div>
          <div className="bio-mendel-steps">
            {['去雄', '套袋', '授粉', '再套袋'].map((s, i) => (
              <span key={s} data-active={Math.min(3, Math.floor(p * 4)) === i}>
                {t(s)}
              </span>
            ))}
          </div>
          {!pol.controlledCross && (
            <p className="bio-mendel-note">{t('缺少去雄或隔离，不能保证后代只来自指定异交。')}</p>
          )}
        </>
      ) : m === 'sampling' ? (
        <>
          <svg
            className="bio-mendel-buckets"
            viewBox="0 0 370 235"
            role="img"
            aria-label={t('从两桶分别随机取球，组合记录后放回原桶')}
          >
            {[0, 1].map((side) => (
              <g key={side}>
                <path
                  d={`M${30 + side * 204} 108L${39 + side * 204} 213H${124 + side * 204}L${133 + side * 204} 108`}
                  fill="#d4d0b2"
                  fillOpacity=".6"
                  stroke="#a9a388"
                  strokeWidth="2"
                />
                <ellipse
                  cx={81.5 + side * 204}
                  cy="108"
                  rx="51"
                  ry="12"
                  fill="none"
                  stroke="#a9a388"
                />
                {Array.from({ length: 20 }, (_, i) => {
                  const isSelected = i === (side ? draw.paternalIndex : draw.maternalIndex),
                    q = isSelected ? drawBallPoint(i, side, phase) : bucketPoint(i, side),
                    dom = i < 10;
                  return (
                    <g key={i}>
                      <circle
                        cx={q.x}
                        cy={q.y}
                        r="7.4"
                        fill={dom ? '#91a982' : '#b3a0b4'}
                        stroke={dom ? '#778c69' : '#967d99'}
                      />
                      {!dom && (
                        <path d={`M${q.x - 4} ${q.y}h8`} stroke="#e7daea" strokeWidth="1.5" />
                      )}
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
          <div className="bio-mendel-draw">
            <span>D</span>
            <span>d ━</span>
            <strong>
              {draw.maternal} + {draw.paternal} → {draw.genotype}
            </strong>
          </div>
          <div className="bio-mendel-tallies">
            <span>
              DD <b>{counts.DD}</b>
            </span>
            <span>
              Dd <b>{counts.Dd}</b>
            </span>
            <span>
              dd <b>{counts.dd}</b>
            </span>
          </div>
          <p className="bio-mendel-note">
            {t('已完成并放回')} {completed} / {n} · {t('理论表型比')} 3 : 1
          </p>
        </>
      ) : (
        <>
          <div className="bio-mendel-cross">
            <div>
              {di ? (
                <Pea phenotype={peaPhenotype(parents[0])} />
              ) : (
                <Plant short={parents[0] === 'dd'} />
              )}
              <span>
                {t('母本')} {parents[0]}
              </span>
            </div>
            <b>×</b>
            <div>
              {di ? (
                <Pea phenotype={peaPhenotype(parents[1])} />
              ) : (
                <Plant short={parents[1] === 'dd'} />
              )}
              <span>
                {t('父本')} {parents[1]}
              </span>
            </div>
          </div>
          <div className="bio-mendel-gamete">
            <span className="maternal">{selected.maternal}</span>
            <span> + </span>
            <span className="paternal">{selected.paternal}</span>
            <span> → </span>
            <strong>{selected.genotype}</strong>
            <span>{t(labels[selected.phenotype])}</span>
          </div>
          <div
            className="bio-mendel-matrix"
            style={{ gridTemplateColumns: `42px repeat(${cross.columns.length}, minmax(0, 1fr))` }}
          >
            <div aria-hidden="true" />
            {cross.columns.map((g) => (
              <div className="bio-mendel-axis paternal" key={g.alleles}>
                {g.alleles}
              </div>
            ))}
            {cross.rows.map((row, ri) => (
              <div className="bio-mendel-matrix-row" key={row.alleles}>
                <div className="bio-mendel-axis maternal">{row.alleles}</div>
                {cross.cells
                  .filter((c) => c.row === ri)
                  .map((c) => (
                    <div
                      key={c.column}
                      className="bio-mendel-cell"
                      data-active={selected.row === c.row && selected.column === c.column}
                    >
                      {di ? (
                        <Pea phenotype={c.phenotype} />
                      ) : (
                        <Plant short={c.phenotype === 'short'} />
                      )}
                      <span>{c.genotype}</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
          <div className="bio-mendel-probabilities">
            {Object.entries(cross.phenotype).map(([phenotype, prob]) => (
              <span key={phenotype}>
                {t(labels[phenotype])}{' '}
                <strong>{(prob * 100).toFixed((prob * 100) % 1 ? 2 : 0)}%</strong>
              </span>
            ))}
          </div>
          {observation && (
            <div className="bio-mendel-record">
              <span>{t('教材实测记录')}</span>
              <div>
                {observation.labels.map((label, i) => (
                  <span key={label}>
                    {t(labels[label])} <b>{observation.values[i]}</b>
                  </span>
                ))}
              </div>
              <p>
                {t('理论预期')} {observation.expected.join(' : ')}
                {m === 'diTest' && <> · {t(reversed ? 'F1作父本' : 'F1作母本')}</>}
              </p>
            </div>
          )}
        </>
      )}
      {!f.watch && (
        <div className="bio-mendel-controls">
          <Segments
            label={t('实验与推理')}
            value={mode}
            onChange={setMode}
            options={modes.map((value, i) => ({ value, label: t(names[i]) }))}
          />
          <Range
            label={t('过程进度')}
            value={progress}
            min={0}
            max={1}
            step={0.001}
            onChange={setProgress}
          />
          {m === 'pollination' ? (
            <div className="bio-mendel-buttons">
              <button
                type="button"
                aria-pressed={emasculated}
                onClick={() => setEmasculated(!emasculated)}
              >
                {t(emasculated ? '已经去雄' : '保留自身雄蕊')}
              </button>
              <button
                type="button"
                aria-pressed={protectedFlower}
                onClick={() => setProtectedFlower(!protectedFlower)}
              >
                {t(protectedFlower ? '使用隔离袋' : '不使用隔离袋')}
              </button>
            </div>
          ) : m === 'sampling' ? (
            <>
              <Range
                label={t('抽样总次数')}
                value={sampleSize}
                min={10}
                max={300}
                step={10}
                onChange={setSampleSize}
              />
              <button type="button" onClick={() => setSeed(seed + 1)}>
                {t('换一组随机抽样')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                aria-pressed={reciprocal}
                onClick={() => setReciprocal(!reciprocal)}
              >
                {t('交换父本和母本')}
              </button>
              {[0, 1].map((side) => (
                <Segments
                  key={side}
                  label={t(side ? '设置父本基因型' : '设置母本基因型')}
                  value={pair[side]}
                  onChange={(value) => {
                    const next: [string, string] = [...pair];
                    next[side] = value;
                    setCustom({ ...custom, [m]: next });
                  }}
                  options={(di ? ['YYRR', 'YyRr', 'yyrr'] : ['DD', 'Dd', 'dd']).map((value) => ({
                    value,
                    label: value,
                  }))}
                />
              ))}
              <p className="bio-mendel-note">
                {t('自定义模型重新计算概率；教材实测记录保持原实验条件。')}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
