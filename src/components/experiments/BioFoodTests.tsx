import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase, ramp } from '../lab/FilmContext';
import {
  foodAssay,
  lipidDroplets,
  type FoodAssay,
  type FoodSample,
} from '../../models/bio-food-tests';
import '../../styles/bio-food-tests.css';
const names: Record<FoodSample, string> = {
  pear: '梨匀浆',
  sucrose: '蔗糖溶液',
  albumin: '蛋清稀释液',
  peanut: '花生薄片',
  water: '蒸馏水',
};
const assaySamples: Record<FoodAssay, FoodSample[]> = {
  fehling: ['pear', 'sucrose', 'water'],
  sudan: ['peanut', 'water'],
  biuret: ['albumin', 'water'],
};
function Tube({
  assay,
  sample,
  stage,
  heated,
  alkali,
  id,
}: {
  assay: FoodAssay;
  sample: FoodSample;
  stage: number;
  heated: boolean;
  alkali: boolean;
  id: string;
}) {
  const s = foodAssay(assay, sample, stage, heated, alkali);
  return (
    <svg viewBox="0 0 150 240" role="img" aria-label={t('样液、试剂与反应产物的位置')}>
      <defs>
        <clipPath id={id}>
          <path d="M52 30H98V175Q98 199 75 199Q52 199 52 175Z" />
        </clipPath>
        <linearGradient id={`${id}-glass`}>
          <stop stopColor="#bfd2cb" stopOpacity=".6" />
          <stop offset=".4" stopColor="#ffffff" stopOpacity=".15" />
          <stop offset="1" stopColor="#95b0a9" stopOpacity=".4" />
        </linearGradient>
      </defs>
      {assay === 'fehling' && heated && stage >= 2.5 && (
        <>
          <path
            d="M20 115V215Q20 221 27 221H123Q130 221 130 215V115"
            fill="#a3c7ce"
            fillOpacity=".25"
            stroke="#829e9f"
            strokeWidth="2"
          />
          <path d="M22 147H128V213H22Z" fill="#b1d5d5" opacity=".4" />
          {[40, 105, 118].map((x, i) => (
            <path
              key={x}
              d={`M${x} 132q-7-10 0-20t0-20`}
              fill="none"
              stroke="#a7b8a4"
              opacity={0.4 + (i % 2) * 0.2}
            />
          ))}
        </>
      )}
      <g clipPath={`url(#${id})`}>
        <rect
          x="51"
          y={stage >= 1 ? 100 : 125}
          width="48"
          height="100"
          fill={s.liquid}
          opacity=".85"
        />
        {s.precipitate > 0 && (
          <>
            <path
              d={`M52 ${196 - s.precipitate * 25}Q75 ${190 - s.precipitate * 28} 98 ${196 - s.precipitate * 25}V203H52Z`}
              fill="#b76b45"
            />
            {Array.from({ length: 20 }, (_, i) => (
              <circle
                key={i}
                cx={56 + ((i * 17) % 37)}
                cy={130 + ((i * 19) % 60)}
                r={1.2}
                fill="#b76b45"
                opacity={s.precipitate}
              />
            ))}
          </>
        )}
      </g>
      <path
        d="M49 28H101M52 30V175Q52 199 75 199Q98 199 98 175V30"
        fill={`url(#${id}-glass)`}
        stroke="#74938e"
        strokeWidth="2"
      />
      <path d="M59 42V168" stroke="#fff" strokeWidth="3" opacity=".5" />
      {stage > 0 && stage < 2 && (
        <>
          <path d="M72 4H78V25H72Z" fill="#849c8b" />
          <path
            d={`M75 ${35 + stage * 16}q-7 10 0 12q7-2 0-12`}
            fill={assay === 'biuret' && stage < 1.5 ? '#e9efe5' : '#6facc0'}
          />
        </>
      )}
    </svg>
  );
}
export default function BioFoodTests() {
  const f = useShowcase(),
    uid = useId().replace(/:/g, ''),
    [assay, setAssay] = useState<FoodAssay>('fehling'),
    [sample, setSample] = useState<FoodSample>('pear'),
    [stage, setStage] = useState(4),
    [heated, setHeated] = useState(true),
    [alkali, setAlkali] = useState(true);
  const a = f.watch ? (f.chapter < 2 ? 'fehling' : f.chapter < 4 ? 'sudan' : 'biuret') : assay;
  const s = f.watch
    ? f.chapter === 1
      ? 'sucrose'
      : a === 'sudan'
        ? 'peanut'
        : a === 'biuret'
          ? 'albumin'
          : 'pear'
    : sample;
  const step = f.watch
    ? f.chapter === 0
      ? 4 * ramp(f.chapterProgress, 0.05, 0.85)
      : f.chapter === 1
        ? 4
        : f.chapter === 2
          ? 2.8 * ramp(f.chapterProgress, 0, 0.85)
          : f.chapter === 3
            ? 3 + ramp(f.chapterProgress, 0, 0.8)
            : 4 * ramp(f.chapterProgress, 0.05, 0.8)
    : stage;
  const state = foodAssay(a, s, step, f.watch ? true : heated, f.watch ? true : alkali);

  return (
    <section className="bio-food">
      <div className="bio-food-protocol">
        <span>
          {t(
            a === 'fehling'
              ? '斐林试剂 · 50–65 ℃水浴'
              : a === 'sudan'
                ? '苏丹Ⅲ · 花生薄片'
                : '双缩脲 · A液先于B液',
          )}
        </span>
        <span>
          {t('步骤')} {Math.min(4, Math.floor(step) + 1)}/4
        </span>
      </div>
      {a === 'sudan' ? (
        <div className="bio-food-lipid">
          <svg viewBox="0 0 290 220" role="img" aria-label={t('薄切片中的脂肪颗粒，洗去背景染液')}>
            <defs>
              <clipPath id={`${uid}-leaf`}>
                <rect x="20" y="28" width="250" height="165" rx="25" />
              </clipPath>
            </defs>
            <rect x="8" y="10" width="274" height="200" rx="8" fill="#dbe8d6" stroke="#9bb5a3" />
            <g clipPath={`url(#${uid}-leaf)`}>
              <rect x="20" y="28" width="250" height="165" fill="#e3e5c9" />
              <rect
                x="20"
                y="28"
                width="250"
                height="165"
                fill="#d7a25f"
                opacity={state.reagent ? 0.65 * (1 - state.washingProgress) : 0}
              />
              {s === 'peanut' &&
                [0, 1, 2, 3].map((i) => (
                  <path
                    key={i}
                    d={`M${35 + i * 65} 25q20 70 0 175M20 ${48 + i * 45}q120 10 250 0`}
                    stroke="#99aa80"
                    fill="none"
                  />
                ))}
              {s === 'peanut' &&
                lipidDroplets().map((q) => (
                  <ellipse
                    key={q.id}
                    cx={q.x}
                    cy={q.y}
                    rx={q.r}
                    ry={q.r * 0.8}
                    fill={state.lipidStain > 0 ? '#d78d36' : '#bdbf8d'}
                    opacity={s === 'peanut' ? 1 : 0.1}
                  />
                ))}
            </g>
            {!state.washed && state.reagent && (
              <path
                d="M15 29Q80 9 160 31T275 31V46H15Z"
                fill="#d9a468"
                opacity={0.45 * (1 - state.washingProgress)}
              />
            )}
          </svg>
          <p>
            {t(names[s])} ·{' '}
            {t(state.washed ? '已洗去浮色' : step >= 3 ? '洗去背景染液' : '染色过程')}
          </p>
        </div>
      ) : (
        <div className="bio-food-tubes">
          {[s, 'water' as FoodSample].map((x, i) => (
            <div key={i}>
              <Tube
                assay={a}
                sample={x}
                stage={step}
                heated={f.watch ? true : heated}
                alkali={f.watch ? true : alkali}
                id={`${uid}-tube-${i}`}
              />
              <p>{t(i === 1 ? '空白对照' : names[x])}</p>
            </div>
          ))}
        </div>
      )}
      {!f.watch && (
        <p className="bio-food-observation">
          {t(
            state.invalidOrder
              ? '顺序错误：这一组不能作有效的阴性结论。'
              : !state.complete
                ? '反应条件尚未齐备，暂不能判读结果。'
                : state.positive
                  ? '出现该检测的阳性表现。'
                  : '未出现该检测的阳性表现。',
          )}
        </p>
      )}
      {!f.watch && (
        <div className="bio-food-controls">
          <Segments
            value={assay}
            onChange={(v) => {
              setAssay(v);
              setSample(v === 'sudan' ? 'peanut' : v === 'biuret' ? 'albumin' : 'pear');
            }}
            label={t('选择检测')}
            options={[
              { value: 'fehling', label: t('还原糖') },
              { value: 'sudan', label: t('脂肪') },
              { value: 'biuret', label: t('蛋白质') },
            ]}
          />
          <label>
            {t('选择材料')}
            <select value={sample} onChange={(e) => setSample(e.target.value as FoodSample)}>
              {assaySamples[assay].map((key) => (
                <option key={key} value={key}>
                  {t(names[key])}
                </option>
              ))}
            </select>
          </label>
          <Range
            label={t('操作进度')}
            value={stage}
            min={0}
            max={4}
            step={0.1}
            onChange={setStage}
          />
          {assay === 'fehling' && (
            <button type="button" aria-pressed={heated} onClick={() => setHeated(!heated)}>
              {t(heated ? '温水浴：开启' : '温水浴：关闭')}
            </button>
          )}
          {assay === 'biuret' && (
            <button type="button" aria-pressed={alkali} onClick={() => setAlkali(!alkali)}>
              {t(alkali ? '加液顺序：A → B' : '加液顺序：B → A')}
            </button>
          )}
        </div>
      )}
      {!f.watch && <small>{t('定性检测示意，颜色深浅不用于推算浓度。')}</small>}
    </section>
  );
}
