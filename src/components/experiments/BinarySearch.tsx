import { useId, useState } from 'react';
import { t } from '../../i18n';
import { BINARY_VALUES, binarySearchTrace } from '../../models/binary-search';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/binary-search.css';
export default function BinarySearch() {
  const d = useShowcase(),
    id = useId(),
    [target, setTarget] = useState(37),
    [step, setStep] = useState(0),
    [duplicates, setDuplicates] = useState(false);
  const c = d.watch ? Math.min(5, d.chapter) : 3,
    p = d.watch ? d.chapterProgress : 1;
  const values =
    !d.watch && duplicates ? [...BINARY_VALUES, 37, 37].sort((a, b) => a - b) : [...BINARY_VALUES];
  const query = d.watch ? (c === 4 ? 38 : 37) : target,
    trace = binarySearchTrace(values, query);
  const index = d.watch
    ? c < 2
      ? 0
      : c === 2
        ? 1
        : c === 3
          ? 2
          : c === 4
            ? Math.min(trace.frames.length - 1, Math.floor(p * trace.frames.length))
            : 0
    : Math.min(step, trace.frames.length - 1);
  const frame = trace.frames[index],
    reveal = d.watch ? c > 0 : true,
    discard = d.watch ? p > 0.5 || c === 5 : true,
    invalid = d.watch && c === 5;
  if (invalid) {
    values[1] = 37;
    values[9] = 39;
  }
  const low = discard ? frame.nextLow : frame.low,
    high = discard ? frame.nextHigh : frame.high;
  return (
    <section
      className="binary-study"
      data-invalid={invalid}
      data-watch={d.watch}
      data-chapter={c}
      aria-label={t('二分查找候选区间实验')}
    >
      <header>
        <span>BINARY SEARCH</span>
        <b>
          {t('目标')} <strong>{query}</strong>
        </b>
      </header>
      <div className="binary-ruler">
        <span>{t(invalid ? '乱序：有序前提已失效' : '从小到大 · 索引从 0 开始')}</span>
        <span>{reveal ? `${low} ≤ i ≤ ${high}` : t('完整候选区间')}</span>
      </div>
      <div
        className="binary-shelf"
        style={{ gridTemplateColumns: `repeat(${values.length},minmax(0,1fr))` }}
        role="img"
        aria-label={t('按索引排列的候选值，被排除部分淡出')}
      >
        {values.map((value, i) => (
          <div
            key={i}
            className="binary-slot"
            data-excluded={reveal && (i < low || i > high)}
            data-probe={reveal && i === frame.mid}
            data-found={reveal && frame.found === i}
            data-witness={invalid && i === 1}
          >
            <span>{value}</span>
            <small>{i}</small>
          </div>
        ))}
      </div>
      <div className="binary-comparison">
        {!reveal ? (
          <>
            <span>{t('还没有比较')}</span>
            <b>16 → ?</b>
          </>
        ) : frame.relation === 'absent' ? (
          <>
            <span>{t('候选区间为空')}</span>
            <b>
              {t('没有找到')} {query}
            </b>
          </>
        ) : (
          <>
            <span>
              {t('中点')} · i = {frame.mid}
            </span>
            <b>
              {frame.value}{' '}
              {frame.relation === 'less' ? '<' : frame.relation === 'greater' ? '>' : '='} {query}
            </b>
          </>
        )}
      </div>
      {invalid ? (
        <p className="binary-counterexample">{t('值 37 明明在索引 1，却会被错误地丢掉。')}</p>
      ) : (
        <div className="binary-window">
          <span>{t(reveal && frame.found !== null ? '命中索引' : '剩余候选数')}</span>
          <strong>
            {reveal && frame.found !== null
              ? frame.found
              : reveal
                ? Math.max(0, high - low + 1)
                : values.length}
          </strong>
          <span>
            {t('已做比较')} {reveal ? Math.min(index + 1, trace.comparisons) : 0}
          </span>
        </div>
      )}
      {!d.watch && (
        <div className="binary-controls">
          <label htmlFor={`${id}-target`}>
            {t('要找的值')} · {target}
          </label>
          <input
            id={`${id}-target`}
            type="range"
            min="0"
            max="75"
            value={target}
            onChange={(e) => {
              setTarget(+e.target.value);
              setStep(0);
            }}
          />
          <label htmlFor={`${id}-step`}>
            {t('比较步骤')} · {index + 1}/{trace.frames.length}
          </label>
          <input
            id={`${id}-step`}
            type="range"
            min="0"
            max={trace.frames.length - 1}
            value={index}
            onChange={(e) => setStep(+e.target.value)}
          />
          <button
            aria-pressed={duplicates}
            onClick={() => {
              setDuplicates(!duplicates);
              setStep(0);
            }}
          >
            {t(duplicates ? '有重复的 37' : '加入两个重复的 37')}
          </button>
        </div>
      )}
      <details>
        <summary>{t('舍弃半边的前提')}</summary>
        <p>
          {t(
            '数组必须按同一个比较规则有序。如果目标存在，它始终位于闭区间 [low, high]。命中后本模型返回某个匹配索引，不承诺第一个重复项；验证有序性是教学保护，不计入查找比较数。',
          )}
        </p>
      </details>
    </section>
  );
}
