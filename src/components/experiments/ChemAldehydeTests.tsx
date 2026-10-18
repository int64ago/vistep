import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ease, ramp } from '../lab/FilmContext';
import {
  reagentPreparation,
  redox,
  metalMarkers,
  silverWall,
  type Sample,
  type Metal,
} from '../../models/chem-aldehyde-tests';
import '../../styles/chem-aldehyde-tests.css';
const modes = ['silver-prep', 'silver', 'copper-prep', 'copper'] as const;
type Mode = (typeof modes)[number];
const labels = ['新制银氨溶液', '银沉积到内壁', '新制氢氧化铜', '砖红色氧化亚铜'];
function ReactionTube({
  metal,
  p,
  prep,
  heated,
  sample,
  amount,
}: {
  metal: Metal;
  p: number;
  prep: boolean;
  heated: boolean;
  sample: Sample;
  amount: number;
}) {
  const id = useId().replace(/:/g, ''),
    pre = reagentPreparation(p),
    r = redox(metal, sample, p, amount, heated),
    conversion = amount ? r.reducedMetal / amount : 0,
    marks = metalMarkers(metal, conversion);
  return (
    <>
      <svg
        viewBox="0 0 200 274"
        role="img"
        aria-label={t(
          metal === 'silver' ? '热水浴中试管内壁形成银镜' : '新制蓝色氢氧化铜转为砖红色氧化亚铜',
        )}
      >
        <defs>
          <clipPath id={id}>
            <path d="M56 25V194Q56 234 100 234T144 194V25Z" />
          </clipPath>
          <linearGradient id={id + 'silver'}>
            <stop stopColor="#6e807c" />
            <stop offset=".18" stopColor="#f8f8ed" />
            <stop offset=".45" stopColor="#a0aaa1" />
            <stop offset=".65" stopColor="#f9f9ee" />
            <stop offset="1" stopColor="#74847e" />
          </linearGradient>
        </defs>
        {metal === 'silver' && !prep && (
          <g>
            <path
              d="M20 143V250Q20 262 34 262H166Q180 262 180 250V143"
              fill="none"
              stroke="#a4bbae"
              strokeWidth="2"
            />
            <path
              d="M24 168H176V249Q176 258 164 258H36Q24 258 24 249Z"
              fill="#cfdfd4"
              opacity=".55"
            />
            <path d="M15 268H185" stroke="#b69b75" strokeWidth="6" strokeLinecap="round" />
          </g>
        )}
        <g clipPath={`url(#${id})`}>
          <rect x="56" y="91" width="88" height="150" fill="#e1e8dc" />
          {metal === 'silver' &&
            prep &&
            Array.from({ length: 35 }, (_, i) => (
              <ellipse
                key={i}
                cx={63 + ((i * 17) % 74)}
                cy={104 + ((i * 23) % 117)}
                rx="3.3"
                ry="2.3"
                fill="#90745b"
                opacity={pre.oxide}
              />
            ))}
          {metal === 'copper' &&
            Array.from({ length: 45 }, (_, i) => (
              <ellipse
                key={i}
                cx={62 + ((i * 13) % 76)}
                cy={100 + ((i * 29) % 120)}
                rx={3 + (i % 3)}
                ry="2"
                fill="#78a8b6"
                opacity={prep ? p : 1 - conversion}
              />
            ))}
          {!prep &&
            amount > 0 &&
            marks.map((a) => (
              <g key={a.id}>
                <circle
                  cx={a.x}
                  cy={a.y}
                  r={metal === 'silver' ? 3.4 : 4}
                  fill={
                    metal === 'silver'
                      ? conversion > 0.7
                        ? '#9da89f'
                        : '#c9c7a4'
                      : conversion > 0.5
                        ? '#b37650'
                        : '#79a9b6'
                  }
                  stroke="#f8f7e9"
                  strokeWidth=".7"
                />
              </g>
            ))}
          {metal === 'silver' && !prep && (
            <>
              <path
                d={silverWall}
                stroke={`url(#${id + 'silver'})`}
                strokeWidth={1 + 7 * conversion}
                fill="none"
                opacity={conversion}
              />
              <path
                d="M62 98V189Q62 219 85 225"
                stroke="#fffef5"
                strokeWidth="1.7"
                fill="none"
                opacity={conversion * 0.9}
              />
            </>
          )}
          {metal === 'copper' && !prep && (
            <path
              d="M66 212Q78 202 90 209Q105 198 117 207Q128 201 137 212Q126 230 100 230T66 212"
              fill="#b2744f"
              opacity={conversion}
            />
          )}
        </g>
        <path
          d="M52 22V194Q52 238 100 238T148 194V22"
          stroke="#94a99c"
          strokeWidth="2"
          fill="none"
        />
        <ellipse cx="100" cy="22" rx="48" ry="7" stroke="#94a99c" fill="none" />
        <path d="M63 37V86" stroke="#fff" strokeWidth="3" />
        {metal === 'copper' && !prep && (
          <path d="M72 260H128" stroke="#b69b75" strokeWidth="6" strokeLinecap="round" />
        )}
      </svg>
      <div className="cat-tube-caption">
        {t(
          prep
            ? metal === 'silver'
              ? pre.ready
                ? '澄清银氨溶液'
                : '配位溶解过程'
              : '蓝色 Cu(OH)₂'
            : heated
              ? metal === 'silver'
                ? '热水浴'
                : '加热'
              : '未加热',
        )}
      </div>
    </>
  );
}
function Carbon({ product, ketone }: { product: number; ketone: boolean }) {
  return (
    <svg
      className="cat-carbon"
      viewBox="0 0 330 125"
      role="img"
      aria-label={t('羰基碳的净氧化变化')}
    >
      <g stroke="#8b9e88" strokeWidth="3">
        <path d="M60 95H135M163 76V32M171 76V32M191 95H253" />
      </g>
      <g textAnchor="middle">
        <text x="40" y="103">
          CH₃
        </text>
        <text x="167" y="103">
          C
        </text>
        <text x="167" y="25" fill="#ae8270">
          O
        </text>
        <text x="280" y="103">
          {ketone ? 'CH₃' : product > 0.5 ? 'O⁻' : 'H'}
        </text>
      </g>
      <circle cx="167" cy="96" r="29" fill="none" stroke="#beab76" strokeWidth="2" />
    </svg>
  );
}
export default function ChemAldehydeTests({ variant }: { variant?: string }) {
  const f = useShowcase(),
    [mode, setMode] = useState<Mode>(
      modes.includes(variant as Mode) ? (variant as Mode) : 'silver-prep',
    ),
    [progress, setProgress] = useState(1),
    [sample, setSample] = useState<Sample>('ethanal'),
    [heat, setHeat] = useState('yes'),
    [amount, setAmount] = useState(2);
  const m = f.watch ? modes[Math.min(3, f.chapter)] : mode,
    metal: Metal = m.startsWith('silver') ? 'silver' : 'copper',
    prep = m.endsWith('prep'),
    p = f.watch ? ease(ramp(f.chapterProgress, 0.1, 0.85)) : progress,
    s = f.watch ? 'ethanal' : sample,
    h = f.watch || heat === 'yes',
    n = f.watch ? 2 : amount,
    r = redox(metal, s, p, n, h),
    pre = reagentPreparation(p);
  return (
    <div className={`cat ${f.watch ? 'is-watch' : ''}`}>
      <div className="cat-stage">
        <div className="cat-layout">
          <div className="cat-tube">
            <ReactionTube metal={metal} p={p} prep={prep} heated={h} sample={s} amount={n} />
          </div>
          <div className="cat-molecular">
            {prep ? (
              <>
                <div className="cat-prep-symbol">
                  {metal === 'silver' ? (pre.ready ? '[Ag(NH₃)₂]⁺' : 'Ag₂O') : 'Cu(OH)₂'}
                </div>
                <p>
                  {t(
                    metal === 'silver'
                      ? '先出现沉淀，再随氨配位而溶解。'
                      : 'Cu²⁺ + 2 OH⁻ → Cu(OH)₂↓',
                  )}
                </p>
                <strong>
                  {t(
                    metal === 'silver'
                      ? '这是试剂制备，还没有银镜。'
                      : '蓝色是新制悬浊液，不是砖红产物。',
                  )}
                </strong>
              </>
            ) : (
              <>
                <Carbon product={r.carboxylate} ketone={s === 'acetone'} />
                <p>{t(s === 'acetone' ? '丙酮对照' : '醛基碳：+1 → +3')}</p>
                <div className="cat-electrons">
                  <span>{t('转移电子的相对量')}</span>
                  <b>{r.electrons.toFixed(2)} e⁻</b>
                </div>
                <p className="cat-reduction">
                  {metal === 'silver' ? '2 Ag⁺ + 2 e⁻ → 2 Ag' : '2 Cu²⁺ + 2 e⁻ → 2 Cu⁺'}
                </p>
              </>
            )}
          </div>
        </div>
        {!prep && (
          <div className="cat-result">
            <span>
              {t(metal === 'silver' ? '金属银相对量' : 'Cu₂O 相对量')}{' '}
              <b>{r.solidUnits.toFixed(2)}</b>
            </span>
            <span>
              {t('羧酸根相对量')} <b>{r.carboxylate.toFixed(2)}</b>
            </span>
          </div>
        )}
      </div>
      {!f.watch && (
        <div className="cat-controls">
          <Segments
            label={t('实验阶段')}
            value={mode}
            options={modes.map((value, i) => ({ value, label: t(labels[i]) }))}
            onChange={(v) => setMode(v as Mode)}
          />
          <Range
            label={t('教学进程')}
            value={progress}
            min={0}
            max={1}
            step={0.01}
            onChange={setProgress}
          />
          {!prep && (
            <>
              <Segments
                label={t('待检物')}
                value={sample}
                options={[
                  { value: 'ethanal', label: t('乙醛') },
                  { value: 'acetone', label: t('丙酮对照') },
                ]}
                onChange={(v) => setSample(v as Sample)}
              />
              <Segments
                label={t('所示实验加热条件')}
                value={heat}
                options={[
                  { value: 'yes', label: t('满足') },
                  { value: 'no', label: t('未满足') },
                ]}
                onChange={setHeat}
              />
              <Range
                label={t('氧化态金属的初始相对量')}
                value={amount}
                min={0}
                max={3}
                step={0.1}
                onChange={setAmount}
              />
            </>
          )}
        </div>
      )}
      <small className="cat-note">{t('计量与净氧化态模型，不是反应速率或银镜质量预测。')}</small>
    </div>
  );
}
