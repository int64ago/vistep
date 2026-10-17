import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  HEAP_PRIORITIES,
  heapChildChoice,
  heapDrainTrace,
  heapInsertTrace,
  heapItems,
  heapPopTrace,
  heapPosition,
  type HeapFrame,
  type HeapItem,
} from '../../models/heap-priority-queue';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/heap-priority-queue.css';
const initial = () => {
  const items = heapItems(HEAP_PRIORITIES);
  return {
    items,
    frames: [{ items, moving: null, phase: 'ready', swapped: null }] as HeapFrame[],
    cursor: 0,
    removed: [] as HeapItem[],
    nextOrder: 7,
  };
};
export default function HeapPriorityQueue() {
  const d = useShowcase(),
    id = useId(),
    [priority, setPriority] = useState(10),
    [manual, setManual] = useState(initial);
  const c = d.watch ? Math.min(5, d.chapter) : 0,
    p = d.watch ? d.chapterProgress : 1;
  const base = heapItems(HEAP_PRIORITIES),
    insert = heapInsertTrace(base, { id: 'heap-7', priority: 10, order: 7 }),
    pop = heapPopTrace(insert.result),
    drain = heapDrainTrace(pop.result);
  let frame: HeapFrame = { items: base, moving: null, phase: 'ready', swapped: null },
    served: HeapItem[] = [];
  if (!d.watch) {
    frame = manual.frames[manual.cursor];
    served = manual.removed;
  } else if (c === 1) frame = insert.frames[0];
  else if (c === 2)
    frame =
      insert.frames[
        Math.min(insert.frames.length - 1, 1 + Math.floor(p * (insert.frames.length - 1)))
      ];
  else if (c === 3) {
    frame = pop.frames[0];
    served = [pop.removed!];
  } else if (c === 4) {
    frame = pop.frames[Math.min(pop.frames.length - 1, Math.floor(p * pop.frames.length))];
    served = [pop.removed!];
  } else if (c === 5) {
    const current =
      drain.frames[Math.min(drain.frames.length - 1, Math.floor(p * drain.frames.length))];
    frame = {
      items: current.items,
      moving: null,
      phase: current.items.length ? 'ready' : 'empty',
      swapped: null,
    };
    served = [pop.removed!, ...current.output];
  }
  const movingIndex = frame.items.findIndex((x) => x.id === frame.moving),
    choice =
      movingIndex >= 0
        ? heapChildChoice(frame.items, movingIndex)
        : { candidates: [], chosen: null },
    pending = manual.cursor < manual.frames.length - 1;
  const candidates = choice.candidates.map((i) => frame.items[i]);
  const action =
    frame.phase === 'append'
      ? '先接到完整树的下一个叶位。'
      : frame.phase === 'swim'
        ? '只沿父链上浮，其他分支不动。'
        : frame.phase === 'replace'
          ? '弹出根，用最后一项填补根。'
          : frame.phase === 'sink'
            ? '向下交换后，只继续修复这条路径。'
            : frame.phase === 'empty'
              ? '队列已空。'
              : '父节点不小于子节点，根保留最大优先级。';
  const perform = (kind: 'insert' | 'pop') => {
    if (pending) return;
    if (kind === 'insert') {
      const next = heapInsertTrace(manual.items, {
        id: `manual-${manual.nextOrder}`,
        priority,
        order: manual.nextOrder,
      });
      setManual({
        ...manual,
        items: next.result,
        frames: next.frames,
        cursor: 0,
        nextOrder: manual.nextOrder + 1,
      });
    } else if (manual.items.length) {
      const next = heapPopTrace(manual.items);
      setManual({
        ...manual,
        items: next.result,
        frames: next.frames,
        cursor: 0,
        removed: [...manual.removed, next.removed!].slice(-16),
      });
    }
  };
  return (
    <section className="heap-study" data-watch={d.watch} aria-label={t('二叉堆优先队列实验')}>
      <header>
        <span>MAX HEAP / PRIORITY</span>
        <span>{t('数值越大，优先级越高')}</span>
      </header>
      {frame.items.length ? (
        <svg
          className="heap-tree"
          viewBox={`0 0 360 ${frame.items.length > 7 ? 270 : 210}`}
          role="img"
          aria-label={t('完全二叉树，父子关系由数组索引计算')}
        >
          {frame.items.slice(1).map((item, j) => {
            const i = j + 1,
              parent = heapPosition(Math.floor((i - 1) / 2)),
              point = heapPosition(i);
            return (
              <path
                key={item.id}
                d={`M${parent.x} ${parent.y}L${point.x} ${point.y}`}
                className="heap-link"
              />
            );
          })}
          {frame.items.map((item, i) => {
            const point = heapPosition(i);
            return (
              <g
                key={item.id}
                transform={`translate(${point.x} ${point.y})`}
                className="heap-node"
                data-moving={item.id === frame.moving}
                data-root={i === 0}
                data-child={c === 4 && choice.candidates.includes(i)}
                data-chosen={c === 4 && i === choice.chosen}
              >
                <circle r="20" />
                <text textAnchor="middle" y="8">
                  {item.priority}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <div className="heap-empty">
          ∅<span>{t('队列已空。')}</span>
        </div>
      )}
      <div className="heap-array" aria-label={t('同一棵树的层序数组')}>
        {frame.items.map((item, i) => (
          <div
            key={item.id}
            data-moving={item.id === frame.moving}
            title={t('数组索引 {0}，优先级 {1}，到达编号 {2}', i, item.priority, item.order)}
          >
            <strong>{item.priority}</strong>
            <span>i={i}</span>
          </div>
        ))}
      </div>
      {served.length > 0 && (
        <div className="heap-served">
          <span>{t(d.watch ? '已弹出' : '最近弹出')}</span>
          <div>
            {served.map((item) => (
              <b key={item.id}>{item.priority}</b>
            ))}
          </div>
        </div>
      )}
      {c === 4 && d.watch && candidates.length ? (
        <p className="heap-choice">
          {t('下一次比较子节点')}：{candidates.map((x) => x.priority).join(' / ')} →{' '}
          {frame.items[choice.chosen!].priority}
        </p>
      ) : (
        <p className="heap-action">{t(action)}</p>
      )}
      {!d.watch && (
        <div className="heap-controls">
          <label htmlFor={`${id}-priority`}>
            {t('新项优先级')} · {priority}
          </label>
          <input
            id={`${id}-priority`}
            type="range"
            min="1"
            max="12"
            value={priority}
            onChange={(e) => setPriority(+e.target.value)}
          />
          <div>
            <button
              disabled={pending || manual.items.length >= 8}
              onClick={() => perform('insert')}
            >
              {t('插入一项')}
            </button>
            <button disabled={pending || !manual.items.length} onClick={() => perform('pop')}>
              {t('弹出最高优先级')}
            </button>
          </div>
          <label htmlFor={`${id}-step`}>
            {t('当前重排步骤')} · {manual.cursor}/{manual.frames.length - 1}
          </label>
          <input
            id={`${id}-step`}
            type="range"
            min="0"
            max={manual.frames.length - 1}
            value={manual.cursor}
            onChange={(e) => setManual({ ...manual, cursor: +e.target.value })}
          />
          <button onClick={() => setManual(initial())}>{t('恢复示例队列')}</button>
          {pending && <p>{t('先把重排步骤移到末尾，再开始下一次操作。')}</p>}
        </div>
      )}
      <details>
        <summary>{t('堆序不是全局排序')}</summary>
        <p>
          {t(
            '只要求每个父项不小于子项，兄弟与数组邻项不必有序。使用零起始索引：父索引 floor((i−1)/2)，子索引 2i+1、2i+2。相同优先级以到达次序作为额外比较键；并非所有堆都自带稳定性。演示最多显示八项。',
          )}
        </p>
      </details>
    </section>
  );
}
