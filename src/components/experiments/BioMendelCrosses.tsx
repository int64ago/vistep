import { useState } from 'react';
import { browserLocale } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  mendelCross,
  peaOutline,
  pollinationState,
  bucketPoint,
  drawBallPoint,
  crossTransmission,
  pollenEvidence,
  observationFor,
  sampleFrame,
  mendelDirector,
  MENDEL_IDS,
  MENDEL_PAIRS,
  type MendelMode,
  type Assortment,
} from '../../models/bio-mendel-crosses';
import '../../styles/bio-mendel-crosses.css';
const tr = (zh: string, en: string) => (browserLocale() === 'en' ? en : zh);
const names = [
  ['花粉来源', 'Pollen source'],
  ['亲本杂交', 'Parents'],
  ['F₁自交', 'F₁ selfing'],
  ['放回抽样', 'Sampling'],
  ['单性状测交', 'Test cross'],
  ['两对性状', 'Two traits'],
  ['两性状自交', 'Two-trait selfing'],
  ['双性状测交', 'Two-trait test'],
];
const labels: Record<string, [string, string]> = {
  tall: ['高茎', 'Tall'],
  short: ['矮茎', 'Short'],
  'yellow-round': ['黄圆', 'Yellow round'],
  'green-round': ['绿圆', 'Green round'],
  'yellow-wrinkled': ['黄皱', 'Yellow wrinkled'],
  'green-wrinkled': ['绿皱', 'Green wrinkled'],
};
const label = (key: string) => tr(...labels[key]);
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
            transform={`translate(${recipient ? -removal * (38 + i * 0.5) : 0} ${recipient ? removal * 65 : 0})`}
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
function Trait({ phenotype }: { phenotype: string }) {
  return phenotype === 'tall' || phenotype === 'short' ? (
    <Plant short={phenotype === 'short'} />
  ) : (
    <Pea phenotype={phenotype} />
  );
}
function Evidence({ mode, reciprocal = false }: { mode: MendelMode; reciprocal?: boolean }) {
  const record = observationFor(mode, reciprocal)!;
  return (
    <div className="bmc15-evidence" data-record={mode}>
      <p className="bmc15-kicker">
        {tr('教材固定记录', 'Fixed textbook record')} ·{' '}
        {mode.startsWith('di')
          ? mode === 'diSelf'
            ? 'P 9'
            : 'P 11'
          : mode === 'self'
            ? 'P 4'
            : 'P 7'}
      </p>
      {record.labels.map((name, i) => (
        <div
          className="bmc15-record-row"
          key={name}
          data-record-label={name}
          data-count={record.values[i]}
        >
          <Trait phenotype={name} />
          <span>{label(name)}</span>
          <strong>{record.values[i]}</strong>
          <i style={{ width: `${(100 * record.values[i]) / Math.max(...record.values)}%` }} />
        </div>
      ))}
      <p className="bmc15-note">
        {mode === 'self'
          ? tr('矮茎重新出现；不是因子被抹掉。', 'Short plants return; the factor was not erased.')
          : mode === 'diSelf'
            ? tr(
                '绿圆与黄皱：亲本没有的新组合。',
                'Green round and yellow wrinkled are new combinations.',
              )
            : tr('检验新预测；不由模拟生成。', 'A test of the prediction, not simulated counts.')}
      </p>
      {mode === 'diTest' && (
        <p className="bmc15-source">
          {reciprocal ? tr('F₁作父本', 'F₁ as pollen parent') : tr('F₁作母本', 'F₁ as seed parent')}
        </p>
      )}
    </div>
  );
}
function FirstObservation({ di }: { di: boolean }) {
  const phenotypes = di
    ? ['yellow-round', 'green-wrinkled', 'yellow-round']
    : ['tall', 'short', 'tall'];
  return (
    <div className="bmc15-first">
      <p className="bmc15-kicker">{tr('先看观察', 'Observation first')}</p>
      <div className="bmc15-first-parents">
        {phenotypes.slice(0, 2).map((p, i) => (
          <div key={p}>
            <Trait phenotype={p} />
            <span>{label(p)}</span>
          </div>
        ))}
        <b>×</b>
      </div>
      <div className="bmc15-first-child">
        <span>F₁</span>
        <Trait phenotype={phenotypes[2]} />
        <strong>{di ? tr('都是黄色圆粒', 'All yellow round') : tr('都是高茎', 'All tall')}</strong>
      </div>
      <p className="bmc15-note">
        {di
          ? tr('颜色与形状，总要一起传吗？', 'Must color and shape travel together?')
          : tr('矮茎的遗传因子消失了吗？', 'Has the short factor disappeared?')}
      </p>
    </div>
  );
}
function Transfer({
  parents,
  index,
  progress,
  width,
  assortment,
}: {
  parents: [string, string];
  index: number;
  progress: number;
  width: number;
  assortment: Assortment;
}) {
  const s = crossTransmission(...parents, index, progress, width, assortment),
    w = s.width,
    y = 181;
  return (
    <div className="bmc15-transfer" data-genotype={s.genotype}>
      <p className="bmc15-kicker">{tr('遗传因子传递模型', 'Factor-transmission model')}</p>
      <div className="bmc15-parent-labels">
        <span>
          {w < 340 ? tr('母本', 'Seed') : tr('母本', 'Seed parent')} · {parents[0]}
        </span>
        <span>
          {w < 340 ? tr('父本', 'Pollen') : tr('父本', 'Pollen parent')} · {parents[1]}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} 219`}
        style={{ height: 219 }}
        role="img"
        aria-label={tr('追踪两方配子中的遗传因子', 'Trace the factors carried by both gametes')}
      >
        {[0, 1].map((side) => (
          <g key={side}>
            <rect
              x={w * (side ? 0.75 : 0.25) - 56}
              y="16"
              width="112"
              height="44"
              rx="20"
              className="bmc15-outline"
            />
            <path d={`M${w * (side ? 0.75 : 0.25)} 60V84`} className="bmc15-guide" />
            <rect
              x={w * (side ? 0.75 : 0.25) - 43}
              y="84"
              width="86"
              height="44"
              rx="22"
              className="bmc15-outline"
            />
            <path
              d={`M${w * (side ? 0.75 : 0.25)} 128Q${w * (side ? 0.75 : 0.25)} 156 ${w / 2} 160`}
              className="bmc15-guide"
            />
          </g>
        ))}
        <rect x={w / 2 - 72} y={y - 25} width="144" height="50" rx="25" className="bmc15-outline" />
        {s.sources.map((a) => (
          <text key={a.id} x={a.x} y={a.y + 7} className="bmc15-source-allele">
            {a.allele}
          </text>
        ))}
        {s.tokens.map((a) => (
          <g
            key={a.id}
            data-token-id={a.id}
            data-source-id={a.sourceId}
            data-allele={a.allele}
            className={a.side ? 'bmc15-paternal' : 'bmc15-maternal'}
          >
            <rect x={a.x - 11} y={a.y - 17} width="22" height="32" rx={a.side ? 6 : 11} />
            <text x={a.x} y={a.y + 7}>
              {a.allele}
            </text>
          </g>
        ))}
      </svg>
      <div className="bmc15-result" data-revealed={progress >= 0.98}>
        {progress >= 0.98 ? (
          <>
            <strong>{s.genotype}</strong>
            <Trait phenotype={s.selected.phenotype} />
            <span>{label(s.selected.phenotype)}</span>
          </>
        ) : (
          <span>{tr('追踪每一份来源', 'Follow each parental contribution')}</span>
        )}
      </div>
    </div>
  );
}
function Gametes({
  genotype,
  assortment,
  index,
  width,
}: {
  genotype: string;
  assortment: Assortment;
  index: number;
  width: number;
}) {
  const cross = mendelCross(genotype, genotype, assortment),
    choices = cross.rows,
    w = width,
    n = choices.length,
    active = ((index % n) + n) % n,
    sourceX = (i: number) => w / 2 + (i - (genotype.length - 1) / 2) * 34;
  return (
    <div>
      <p className="bmc15-kicker">
        {genotype.length === 2
          ? tr('分离假说', 'Segregation hypothesis')
          : tr('独立组合假说', 'Assortment hypothesis')}
      </p>
      <svg
        viewBox={`0 0 ${w} 203`}
        style={{ height: 203 }}
        role="img"
        aria-label={tr(
          '每对取一个，再组合成配子',
          'Take one factor from each pair to form a gamete',
        )}
      >
        {choices.map((g, j) => (
          <g key={g.alleles}>
            {[...g.alleles].map((a, l) => {
              const src = l * 2 + genotype.slice(l * 2, l * 2 + 2).indexOf(a),
                x = ((j + 0.5) * w) / n + (l - (g.alleles.length - 1) / 2) * 16;
              return (
                <path
                  key={l}
                  d={`M${sourceX(src)} 54Q${sourceX(src)} 93 ${x} 128`}
                  className="bmc15-branch"
                  data-active={j === active}
                />
              );
            })}
            <rect
              x={((j + 0.5) * w) / n - 29}
              y="129"
              width="58"
              height="42"
              rx="21"
              className="bmc15-gamete"
              data-active={j === active}
            />
            <text x={((j + 0.5) * w) / n} y="157">
              {g.alleles}
            </text>
            <text className="bmc15-prob" x={((j + 0.5) * w) / n} y="197">
              1/{n}
            </text>
          </g>
        ))}
        {[...genotype].map((a, i) => (
          <g key={i}>
            <rect
              x={sourceX(i) - 13}
              y="16"
              width="26"
              height="38"
              rx="8"
              className="bmc15-factor"
            />
            <text x={sourceX(i)} y="42">
              {a}
            </text>
          </g>
        ))}
      </svg>
      <p className="bmc15-note">
        {genotype.length === 2
          ? tr('每个配子，每对只取一个因子。', 'One factor per pair in each gamete.')
          : assortment === 'independent'
            ? tr('两对独立选择，得到四种可能。', 'Independent choices give four possibilities.')
            : tr('反例假设：只允许亲本组合YR和yr。', 'Counterexample: only parental YR and yr.')}
      </p>
    </div>
  );
}
function Matrix({
  parents,
  index,
  progress,
  width,
  assortment,
}: {
  parents: [string, string];
  index: number;
  progress: number;
  width: number;
  assortment: Assortment;
}) {
  const cross = mendelCross(...parents, assortment),
    selected = cross.cells[Math.min(index, cross.cells.length - 1)],
    cols = cross.columns.length,
    rows = cross.rows.length,
    x0 = 40,
    y0 = 35,
    cw = (width - x0 - 4) / cols,
    ch = rows > 2 ? (width < 340 ? 30 : width < 480 ? 36 : 48) : width < 340 ? 54 : 64,
    h = y0 + rows * ch + 5,
    q = progress >= 1 ? 1 : Math.min(1, ((progress * cross.cells.length) % 1) / 0.48),
    tx = x0 + (selected.column + 0.5) * cw,
    ty = y0 + (selected.row + 0.5) * ch;
  return (
    <div className="bmc15-matrix" data-matrix-cells={cross.cells.length}>
      <p className="bmc15-kicker">{tr('概率模型', 'Probability model')}</p>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        style={{ height: h }}
        role="img"
        aria-label={tr(
          '由行列配子计算受精组合',
          'Compute fertilization combinations from row and column gametes',
        )}
      >
        {cross.columns.map((g, i) => (
          <text key={g.alleles} x={x0 + (i + 0.5) * cw} y="24" className="bmc15-col">
            {g.alleles}
          </text>
        ))}
        {cross.rows.map((g, i) => (
          <text key={g.alleles} x="18" y={y0 + (i + 0.5) * ch + 6} className="bmc15-row">
            {g.alleles}
          </text>
        ))}
        {cross.cells.map((c) => (
          <g
            key={`${c.row}-${c.column}`}
            transform={`translate(${x0 + c.column * cw} ${y0 + c.row * ch})`}
            data-cell={`${c.row}-${c.column}`}
          >
            <rect
              width={cw - 3}
              height={ch - 3}
              rx="10"
              className="bmc15-matrix-cell"
              data-active={c === selected}
            />
            {parents[0].length === 4 ? (
              <path
                d={peaOutline(c.phenotype, 12)}
                transform={`translate(${cw / 2} ${ch / 2 - 2})`}
                fill={c.phenotype.startsWith('yellow') ? '#cabb68' : '#89a071'}
                stroke="#748064"
              />
            ) : (
              <>
                <text x={cw * 0.28} y={ch * 0.5 + 7}>
                  {c.genotype}
                </text>
                <path
                  d={`M${cw * 0.73} ${ch - 11}V${c.phenotype === 'short' ? ch - 27 : 12}`}
                  stroke="#809869"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d={`M${cw * 0.73} ${ch - 20}q-15-13-18-4q8 8 18 4m0-7q16-14 18-5q-8 8-18 5`}
                  fill="#a7b58d"
                />
              </>
            )}
          </g>
        ))}
        <path d={`M18 ${ty}H${tx}M${tx} 24V${ty}`} fill="none" className="bmc15-selected-route" />
        {q < 1 && (
          <>
            <circle cx={18 + (tx - 11 - 18) * q} cy={ty} r="6" className="bmc15-origin-m" />
            <path d={`M${tx} ${24 + (ty - 24) * q - 6}l6 6-6 6-6-6Z`} className="bmc15-origin-p" />
          </>
        )}
      </svg>
      <p className="bmc15-equation">
        <span className="bmc15-m">{selected.maternal}</span> +{' '}
        <span className="bmc15-p">{selected.paternal}</span> → <strong>{selected.genotype}</strong>
      </p>
      <p className="bmc15-note">
        {parents[0].length === 2 ? (
          Object.entries(cross.genotypes)
            .map(([g, v]) => `${g} ${Math.round(v * cross.cells.length)}`)
            .join(' · ')
        ) : (
          <>P = {Math.round(selected.probability * 10000) / 100}%</>
        )}
      </p>
      <div className="bmc15-ratio">
        {Object.entries(cross.phenotype).map(([p, v]) => (
          <span key={p}>
            <Trait phenotype={p} />
            <b>{Math.round(v * cross.cells.length)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
function Prediction({
  di,
  assortment,
  reveal = true,
}: {
  di: boolean;
  assortment: Assortment;
  reveal?: boolean;
}) {
  const cross = mendelCross(di ? 'YyRr' : 'Dd', di ? 'yyrr' : 'dd', assortment);
  return (
    <div className="bmc15-prediction" data-revealed={reveal}>
      <p className="bmc15-kicker">{tr('新的测交预测', 'Predict a new test cross')}</p>
      <strong>{di ? 'YyRr × yyrr' : 'Dd × dd'}</strong>
      <p>
        {tr('测试亲本只提供', 'Tester supplies only')} <b>{di ? 'yr' : 'd'}</b>
      </p>
      <div className="bmc15-prediction-grid">
        {(di
          ? ['yellow-round', 'yellow-wrinkled', 'green-round', 'green-wrinkled']
          : ['tall', 'short']
        ).map((p) => (
          <div key={p}>
            <Trait phenotype={p} />
            <span>{label(p)}</span>
            <b>{reveal ? `${Math.round((cross.phenotype[p] ?? 0) * 100)}%` : '?'}</b>
          </div>
        ))}
      </div>
      <p className="bmc15-note">
        {di
          ? tr('下一步：用固定记录检验。', 'Next: check the fixed record.')
          : tr('高茎与矮茎，应各占一半吗？', 'Should tall and short be equally likely?')}
      </p>
    </div>
  );
}
function Pollen({
  progress,
  removed,
  isolated,
  risk,
}: {
  progress: number;
  removed: boolean;
  isolated: boolean;
  risk: boolean;
}) {
  const pol = pollinationState(progress, removed, isolated),
    e = pollenEvidence(removed, isolated);
  return (
    <div>
      <p className="bmc15-kicker">
        {risk
          ? tr('不控制来源，父本是谁？', 'Without controls, who is the father?')
          : tr('让指定花粉的来源可追踪', 'Trace pollen from the chosen parent')}
      </p>
      <svg
        viewBox="0 0 370 225"
        className="bmc15-flower"
        role="img"
        aria-label={tr('花粉来源与隔离作用', 'Pollen sources and isolation')}
      >
        <g transform="translate(89 105)">
          <Flower recipient removal={pol.removal} />
        </g>
        <g transform="translate(282 105)">
          <Flower recipient={false} />
        </g>
        <path
          d="M28 23Q88 10 150 23L142 146Q86 160 35 146Z"
          fill="#d5c7a6"
          fillOpacity={pol.bag * 0.72}
          stroke="#b9ae90"
          strokeOpacity={pol.bag}
        />
        <path d={`M286 73Q190 9 93 61`} className="bmc15-chosen-route" />
        {Array.from({ length: 5 }, (_, i) => (
          <circle
            key={i}
            cx={286 - 193 * pol.pollen + (i % 2) * 3}
            cy={73 - 12 * pol.pollen - 28 * Math.sin(Math.PI * pol.pollen) + Math.floor(i / 2) * 3}
            r="3"
            fill="#a88638"
          />
        ))}
        {(risk || pol.removal < 0.99) && (
          <path d="M72 75Q65 48 93 61" className="bmc15-risk-route" />
        )}
        {(risk || !isolated) && <path d="M13 8Q45 22 93 61" className="bmc15-risk-route" />}
        {!risk && pol.bag > 0.8 && (
          <>
            <path d="M13 8L43 24" className="bmc15-risk-route" />
            <path d="M35 17L49 31M35 31L49 17" stroke="#aa817a" strokeWidth="2" />
          </>
        )}
      </svg>
      <div className="bmc15-parent-labels">
        <span>{tr('母本保留雌蕊', 'Maternal pistil')}</span>
        <span>{tr('指定父本花粉', 'Chosen pollen')}</span>
      </div>
      <p className="bmc15-note">
        {risk || !e.identifiedFather
          ? tr('自身或外来花粉，会混淆来源。', 'Self or foreign pollen can confound parentage.')
          : tr('排除自身，限制外来花粉。', 'Exclude self; restrict foreign pollen.')}
      </p>
    </div>
  );
}
function Sampling({ seed, n, progress }: { seed: number; n: number; progress: number }) {
  const s = sampleFrame(seed, n, progress);
  return (
    <div>
      <p className="bmc15-kicker">{tr('随机抽样，取后放回', 'Draw, record, replace')}</p>
      <svg
        viewBox="0 0 370 230"
        className="bmc15-buckets"
        role="img"
        aria-label={tr('同一个球取出后回到原桶', 'The same ball returns to its original bucket')}
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
            <ellipse cx={81.5 + side * 204} cy="108" rx="51" ry="12" fill="none" stroke="#a9a388" />
            {Array.from({ length: 20 }, (_, i) => {
              const selected = i === (side ? s.draw.paternalIndex : s.draw.maternalIndex),
                q = selected ? drawBallPoint(i, side, s.phase) : bucketPoint(i, side);
              return (
                <g key={i} data-ball-id={`${side}-${i}`} data-moving={selected}>
                  <circle
                    cx={q.x}
                    cy={q.y}
                    r="7.4"
                    fill={i < 10 ? '#91a982' : '#b3a0b4'}
                    stroke={i < 10 ? '#778c69' : '#967d99'}
                  />
                  {i >= 10 && <path d={`M${q.x - 4} ${q.y}h8`} stroke="#fff" strokeWidth="1.5" />}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <div className="bmc15-sample-pair">
        <span>D</span>
        <span>d ━</span>
        <strong>
          {s.draw.maternal} + {s.draw.paternal} → {s.draw.genotype}
        </strong>
      </div>
      <div className="bmc15-sample-tallies">
        {Object.entries(s.counts).map(([g, n]) => (
          <span key={g}>
            {g} <b>{n}</b>
          </span>
        ))}
      </div>
      <p className="bmc15-note">
        {tr('已放回', 'Replaced')} {s.completed}/{s.n} · {tr('理论', 'Theory')} 1 : 2 : 1
      </p>
    </div>
  );
}
export default function BioMendelCrosses() {
  const f = useShowcase(),
    { host, width } = useSignalWidth(),
    w = Math.max(260, Math.min(680, width - 24)),
    [mode, setMode] = useState<MendelMode | null>(null),
    [view, setView] = useState<string | null>(null),
    [progress, setProgress] = useState(0.85),
    [index, setIndex] = useState(0),
    [seed, setSeed] = useState(17),
    [n, setN] = useState(30),
    [removed, setRemoved] = useState(true),
    [isolated, setIsolated] = useState(true),
    [reciprocal, setReciprocal] = useState(false),
    [assortment, setAssortment] = useState<Assortment>('independent'),
    [custom, setCustom] = useState<Partial<Record<MendelMode, [string, string]>>>({});
  const m = f.watch
      ? MENDEL_IDS[Math.min(7, f.chapter)]
      : (mode ?? MENDEL_IDS[Math.min(7, f.chapter)]),
    c = MENDEL_IDS.indexOf(m),
    d = mendelDirector(c, f.chapterTime, browserLocale()),
    di = m.startsWith('di'),
    a = f.watch ? 'independent' : assortment,
    pair = f.watch ? MENDEL_PAIRS[m] : (custom[m] ?? MENDEL_PAIRS[m]),
    parents: [string, string] = !f.watch && reciprocal ? [pair[1], pair[0]] : pair,
    cross = mendelCross(...parents, a),
    p = f.watch ? d.progress : progress,
    cell = f.watch ? d.cell : Math.min(index, cross.cells.length - 1),
    shot = f.watch
      ? d.shot
      : (view ??
        (m === 'pollination'
          ? 'pollen-chosen'
          : m === 'sampling'
            ? 'sampling'
            : m === 'self' || m === 'diSelf'
              ? 'matrix'
              : 'transmission'));
  const record = observationFor(m, !f.watch && reciprocal),
    views =
      m === 'pollination' || m === 'sampling'
        ? []
        : [
            ['transmission', tr('传递', 'Transmission')],
            ...(m === 'self' || m === 'diSelf'
              ? [
                  ['gametes', tr('配子假说', 'Gamete hypothesis')],
                  ['matrix', tr('受精组合', 'Combinations')],
                  ['prediction', tr('新预测', 'Prediction')],
                ]
              : []),
            ...(record ? [['record', tr('固定记录', 'Fixed record')]] : []),
          ];
  return (
    <section className="bmc15" ref={host} data-watch={f.watch} data-mode={m} data-shot={shot}>
      <div className="bmc15-stage">
        {m === 'pollination' ? (
          <Pollen
            progress={p}
            removed={f.watch || removed}
            isolated={f.watch || isolated}
            risk={f.watch && shot === 'pollen-risk'}
          />
        ) : m === 'sampling' ? (
          <Sampling seed={f.watch ? 17 : seed} n={f.watch ? 30 : n} progress={p} />
        ) : shot === 'first-observation' ? (
          <FirstObservation di={di} />
        ) : shot === 'record' && record ? (
          <Evidence mode={m} reciprocal={!f.watch && reciprocal} />
        ) : shot === 'gametes' ? (
          <Gametes
            genotype={parents[0]}
            assortment={a}
            index={f.watch ? Math.floor(d.time) : index}
            width={w}
          />
        ) : shot === 'matrix' ? (
          <Matrix parents={parents} assortment={a} index={cell} progress={p} width={w} />
        ) : shot === 'prediction' ? (
          <Prediction di={di} assortment={a} reveal={!f.watch || d.predictionRevealed} />
        ) : (
          <Transfer parents={parents} index={cell} progress={p} width={w} assortment={a} />
        )}
      </div>
      {!f.watch && (
        <div className="bmc15-controls">
          <Segments
            label={tr('观察主题', 'View')}
            value={m}
            onChange={(value) => {
              setMode(value);
              setView(null);
              setIndex(0);
            }}
            options={MENDEL_IDS.map((value, i) => ({
              value,
              label: tr(...(names[i] as [string, string])),
            }))}
          />
          {views.length > 0 && (
            <Segments
              label={tr('证据与推演', 'Evidence and model')}
              value={shot}
              onChange={setView}
              options={views.map(([value, label]) => ({ value, label }))}
            />
          )}
          <Range
            label={tr('推演进度', 'Model progress')}
            value={progress}
            min={0}
            max={1}
            step={0.001}
            onChange={setProgress}
          />
          {m === 'pollination' ? (
            <div className="bmc15-buttons">
              <button type="button" aria-pressed={removed} onClick={() => setRemoved(!removed)}>
                {removed
                  ? tr('已经去雄', 'Stamens removed')
                  : tr('保留自身雄蕊', 'Own stamens retained')}
              </button>
              <button type="button" aria-pressed={isolated} onClick={() => setIsolated(!isolated)}>
                {isolated
                  ? tr('使用隔离袋', 'Isolation bag used')
                  : tr('不使用隔离袋', 'No isolation bag')}
              </button>
            </div>
          ) : m === 'sampling' ? (
            <>
              <Range
                label={tr('抽样次数', 'Number of draws')}
                value={n}
                min={10}
                max={300}
                step={10}
                onChange={setN}
              />
              <button type="button" onClick={() => setSeed(seed + 1)}>
                {tr('换一组抽样', 'New random sample')}
              </button>
            </>
          ) : (
            <>
              <Range
                label={tr('选择配子组合', 'Select gamete combination')}
                value={Math.min(index, cross.cells.length - 1)}
                min={0}
                max={Math.max(1, cross.cells.length - 1)}
                step={1}
                onChange={setIndex}
              />
              {[0, 1].map((side) => (
                <Segments
                  key={side}
                  label={
                    side
                      ? tr('父本基因型', 'Pollen-parent genotype')
                      : tr('母本基因型', 'Seed-parent genotype')
                  }
                  value={pair[side]}
                  onChange={(g) => {
                    const next: [string, string] = [...pair];
                    next[side] = g;
                    setCustom({ ...custom, [m]: next });
                  }}
                  options={(di ? ['YYRR', 'YyRr', 'yyrr'] : ['DD', 'Dd', 'dd']).map((value) => ({
                    value,
                    label: value,
                  }))}
                />
              ))}
              <button
                type="button"
                aria-pressed={reciprocal}
                onClick={() => setReciprocal(!reciprocal)}
              >
                {tr('交换亲本角色', 'Swap parental roles')}
              </button>
              {di && (
                <Segments
                  label={tr('组合假设', 'Assortment assumption')}
                  value={a}
                  onChange={setAssortment}
                  options={[
                    { value: 'independent', label: tr('独立分配', 'Independent') },
                    { value: 'parental-only', label: tr('只保留亲本组合', 'Parental only') },
                  ]}
                />
              )}
              <p className="bmc15-note">
                {tr(
                  '模型参数可变；教材记录保持原实验条件。',
                  'Model inputs change; records retain their original conditions.',
                )}
              </p>
            </>
          )}
          <details>
            <summary>{tr('这个模型的边界', 'Model limits')}</summary>
            <p>
              {tr(
                '字母追踪可能传递的因子副本，不是减数分裂实拍。主模型假定配子等概率、随机受精与相近存活率。反例只允许YR与yr，代表指定连锁相位且无重组的假设，不是孟德尔的观察。',
                'Letters trace hypothetical transmitted factor copies, not a filmed meiosis. The main model assumes equal gamete probabilities, random fertilization and comparable viability. The counterexample allows only YR and yr: a specified coupling phase without recombination, not Mendel’s observation.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
