import { useId, useState, type CSSProperties } from 'react';
import { t } from '../../i18n';
import { QUICK_VALUES, quickItems, quickPartition, quickSortTrace } from '../../models/quicksort';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/quicksort.css';
export default function Quicksort() {
  const d = useShowcase(),
    id = useId(),
    [pivot, setPivot] = useState(3),
    [step, setStep] = useState(0),
    [same, setSame] = useState(false);
  const c = d.watch ? Math.min(6, d.chapter) : 3,
    p = d.watch ? d.chapterProgress : 1;
  const values = !d.watch && same ? Array(8).fill(3) : QUICK_VALUES,
    pivotValue = d.watch || same ? 3 : pivot;
  const partition = quickPartition(quickItems(values), pivotValue),
    sort = quickSortTrace(values, 'middle', pivotValue);
  const index = d.watch
    ? c === 0
      ? 0
      : c === 1
        ? Math.min(1, Math.floor(p * 2))
        : c === 2
          ? Math.min(6, 2 + Math.floor(p * 5))
          : c === 3
            ? Math.min(8, 6 + Math.floor(p * 3))
            : 8
    : Math.min(step, partition.frames.length - 1);
  const frame = partition.frames[index],
    final = partition.frames.at(-1)!;
  const sortedStep =
    sort.steps[
      Math.min(sort.steps.length - 1, 9 + Math.floor(p * Math.max(1, sort.steps.length - 9)))
    ];
  const items =
    d.watch && c === 5
      ? sortedStep.items
      : d.watch && c === 6
        ? quickItems([1, 2, 3, 4, 5, 6, 7, 8])
        : frame.items;
  const bands = d.watch && c === 5 ? final : frame;
  const bad = quickSortTrace([1, 2, 3, 4, 5, 6, 7, 8], 'minimum'),
    balanced = quickSortTrace([1, 2, 3, 4, 5, 6, 7, 8], 'median');
  const zone = (i: number) =>
    i < bands.lt ? 'less' : i < bands.scan ? 'equal' : i <= bands.gt ? 'unknown' : 'greater';
  return (
    <section
      className="quick-study"
      data-watch={d.watch}
      data-playing={d.playing}
      data-chapter={c}
      aria-label={t('三向快速排序实验')}
    >
      <header>
        <span>QUICKSORT / THREE WAY</span>
        {!(d.watch && (c === 5 || c === 6)) && (
          <b>
            {t('主元')} <strong>{pivotValue}</strong>
          </b>
        )}
        {d.watch && c === 5 && (
          <span
            className="quick-recursion"
            style={{
              left: `${(sortedStep.low * 100) / items.length}%`,
              width: `${((sortedStep.high - sortedStep.low + 1) * 100) / items.length}%`,
            }}
          />
        )}
      </header>
      <div className="quick-belt" role="img" aria-label={t('同一批带编号的项在四个分区中交换')}>
        {items.map((x, i) => (
          <div
            className="quick-item"
            key={x.id}
            data-zone={c === 6 && d.watch ? 'unknown' : zone(i)}
            data-inspected={frame.inspected === x.id && c !== 6}
            data-inversion={d.watch && c === 4 && (i === 6 || i === 7)}
            style={
              {
                left: `${(i * 100) / items.length}%`,
                width: `${100 / items.length}%`,
              } as CSSProperties
            }
          >
            <div>
              <strong>{x.value}</strong>
              <span>#{x.origin + 1}</span>
            </div>
          </div>
        ))}
        {!(d.watch && c === 6) && (
          <span
            className="quick-scan"
            style={{
              left: `${(Math.min(bands.scan, items.length - 1) * 100) / items.length}%`,
              width: `${100 / items.length}%`,
            }}
          >
            ↑ i
          </span>
        )}
      </div>
      {d.watch && c === 6 ? (
        <div className="quick-work">
          <div>
            <h3>{t('总选最小值')}</h3>
            <strong>{bad.classifications}</strong>
            <div>
              {bad.partitions.map((x, i) => (
                <i key={i} style={{ width: `${(x.size / 8) * 100}%` }} />
              ))}
            </div>
          </div>
          <div>
            <h3>{t('选真实中位数')}</h3>
            <strong>{balanced.classifications}</strong>
            <div>
              {balanced.partitions.map((x, i) => (
                <i key={i} style={{ width: `${(x.size / 8) * 100}%` }} />
              ))}
            </div>
          </div>
          <p>{t('只数元素分类；未计寻找主元的工作。')}</p>
        </div>
      ) : (
        <>
          <div className="quick-zones">
            <span data-zone="less">
              &lt; {pivotValue}
              <b>{bands.lt}</b>
            </span>
            <span data-zone="equal">
              = {pivotValue}
              <b>{bands.scan - bands.lt}</b>
            </span>
            <span data-zone="unknown">
              ?<b>{Math.max(0, bands.gt - bands.scan + 1)}</b>
            </span>
            <span data-zone="greater">
              &gt; {pivotValue}
              <b>{items.length - bands.gt - 1}</b>
            </span>
          </div>
          <p className="quick-action">
            {t(
              d.watch && c === 0
                ? '主元用于分类，不是最终索引。'
                : d.watch && c === 4
                  ? '右段仍有逆序：8 在 6 前面。'
                  : d.watch && c === 5
                    ? '等值段已完成；只递归外侧。'
                    : frame.action === 'greater'
                      ? '换到右侧；i 不动，来项还未知。'
                      : frame.action === 'less'
                        ? '较小项送左侧；lt 与 i 都前进。'
                        : frame.action === 'equal'
                          ? '等于主元，只前进 i。'
                          : '问号区间还未分类。',
            )}
          </p>
        </>
      )}
      {!d.watch && (
        <div className="quick-controls">
          <label htmlFor={`${id}-pivot`}>
            {t('选作主元的值')} · {pivotValue}
          </label>
          <select
            id={`${id}-pivot`}
            value={pivotValue}
            disabled={same}
            onChange={(e) => {
              setPivot(+e.target.value);
              setStep(0);
            }}
          >
            {[...new Set(values)]
              .sort((a, b) => a - b)
              .map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
          </select>
          <label htmlFor={`${id}-step`}>
            {t('分区步骤')} · {index}/{partition.frames.length - 1}
          </label>
          <input
            id={`${id}-step`}
            type="range"
            min="0"
            max={partition.frames.length - 1}
            value={index}
            onChange={(e) => setStep(+e.target.value)}
          />
          <button
            aria-pressed={same}
            onClick={() => {
              setSame(!same);
              setStep(0);
            }}
          >
            {t(same ? '八项都等于 3' : '改成八项都等于 3')}
          </button>
        </div>
      )}
      <details>
        <summary>{t('分区不等于完整排序')}</summary>
        <p>
          {t(
            '左段小于主元，中段等于主元，右段大于主元；未知区间结束后，只有外侧两段需要递归。本分区不稳定，相等值的原始编号可能换序。中位数比较是已知选值的教学对照，不声称寻找它没有成本；快照存储也不是最小原地实现。',
          )}
        </p>
      </details>
    </section>
  );
}
