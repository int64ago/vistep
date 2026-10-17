import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  ufCreate,
  ufFind,
  ufLayout,
  ufLesson,
  ufUnion,
  type UfFrame,
} from '../../models/union-find';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/union-find.css';
const lesson = ufLesson();
export default function UnionFind() {
  const d = useShowcase(),
    id = useId(),
    [a, setA] = useState(7),
    [b, setB] = useState(1),
    [manual, setManual] = useState(lesson.states[6]),
    [query, setQuery] = useState<ReturnType<typeof ufFind> | null>(null),
    [cursor, setCursor] = useState(0);
  const c = d.watch ? Math.min(5, d.chapter) : 0,
    p = d.watch ? d.chapterProgress : 1;
  let state = manual,
    path: number[] = [],
    changed: number | null = null,
    root: number | null = null;
  if (d.watch) {
    state =
      c === 0
        ? lesson.states[0]
        : c === 1
          ? lesson.states[1]
          : c === 2
            ? lesson.states[Math.min(6, 2 + Math.floor(p * 5))]
            : c === 3
              ? lesson.states[7]
              : c === 4
                ? lesson.find.frames[
                    Math.min(
                      lesson.find.frames.length - 1,
                      Math.floor(p * lesson.find.frames.length),
                    )
                  ].state
                : lesson.find.state;
    if (c === 4) {
      const f =
        lesson.find.frames[
          Math.min(lesson.find.frames.length - 1, Math.floor(p * lesson.find.frames.length))
        ];
      path = f.path;
      changed = f.changed;
      root = path[path.length - 1];
    }
    if (c === 5) {
      path = [1, 0, 7];
      root = 0;
    }
  } else if (query) {
    const f: UfFrame = query.frames[Math.min(cursor, query.frames.length - 1)];
    state = f.state;
    path = f.path;
    changed = f.changed;
    root = query.root;
  }
  const points = ufLayout(state),
    roots = state.parent.map((v, i) => (v === i ? i : -1)).filter((i) => i >= 0);
  const runFind = () => {
    const q = ufFind(manual, a);
    setQuery(q);
    setCursor(0);
    setManual(q.state);
  };
  return (
    <section
      className="uf-study"
      data-watch={d.watch}
      data-chapter={c}
      aria-label={t('并查集父指针森林')}
    >
      <header>
        <span>DISJOINT / SETS</span>
        <strong>
          {t('连通分量')} · {state.count}
        </strong>
      </header>
      <svg viewBox="0 0 360 260" role="img" aria-label={t('箭头从成员指向父项，根指向自己')}>
        <defs>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="10"
            markerHeight="10"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10" />
          </marker>
        </defs>
        {state.parent.map((parent, i) => {
          if (parent === i) return null;
          const a = points[i],
            b = points[parent],
            length = Math.hypot(b.x - a.x, b.y - a.y);
          const end = {
            x: b.x - ((b.x - a.x) * 22) / length,
            y: b.y - ((b.y - a.y) * 22) / length,
          };
          return (
            <path
              key={`p-${i}`}
              d={`M${a.x} ${a.y}L${end.x} ${end.y}`}
              className="uf-link"
              data-path={path.includes(i) && path.includes(parent)}
              markerEnd={`url(#${id}-arrow)`}
            />
          );
        })}
        {state.parent.map((parent, i) => (
          <g
            key={i}
            transform={`translate(${points[i].x} ${points[i].y})`}
            className="uf-node"
            data-root={parent === i}
            data-path={path.includes(i)}
            data-changed={changed === i}
          >
            <circle r="18" />
            <text textAnchor="middle" y="8">
              {i}
            </text>
          </g>
        ))}
      </svg>
      <div className="uf-root-strip">
        {roots.map((r) => (
          <span key={r}>
            {t('根')} {r}
            <b>
              {t('大小')} {state.size[r]}
            </b>
          </span>
        ))}
      </div>
      {path.length > 0 && (
        <p className="uf-trace" aria-live="polite">
          {c === 5 && d.watch
            ? t('同根，不再合并')
            : changed === null
              ? t('沿父指针查找')
              : t('改指向根')}{' '}
          · {c === 5 && d.watch ? '1 → 0 ← 7' : path.join(' → ')}
          {changed !== null && (
            <>
              {' '}
              · {changed} → {root}
            </>
          )}
        </p>
      )}
      {!d.watch && (
        <div className="uf-controls">
          <div>
            <label htmlFor={`${id}-a`}>
              {t('成员')} A
              <select id={`${id}-a`} value={a} onChange={(e) => setA(+e.target.value)}>
                {state.parent.map((_, i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </label>
            <label htmlFor={`${id}-b`}>
              {t('成员')} B
              <select id={`${id}-b`} value={b} onChange={(e) => setB(+e.target.value)}>
                {state.parent.map((_, i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <button disabled={!!query && cursor < query.frames.length - 1} onClick={runFind}>
              {t('查找并压缩 A')}
            </button>
            <button
              disabled={!!query && cursor < query.frames.length - 1}
              onClick={() => {
                setManual(ufUnion(manual, a, b).state);
                setQuery(null);
              }}
            >
              {t('合并 A 与 B')}
            </button>
          </div>
          {query && (
            <>
              <label htmlFor={`${id}-step`}>
                {t('查找步骤')} · {cursor}/{query.frames.length - 1}
              </label>
              <input
                id={`${id}-step`}
                type="range"
                min="0"
                max={query.frames.length - 1}
                value={cursor}
                onChange={(e) => setCursor(+e.target.value)}
              />
            </>
          )}
          <button
            onClick={() => {
              setManual(ufCreate(8));
              setQuery(null);
            }}
          >
            {t('恢复八个独立成员')}
          </button>
          <button
            onClick={() => {
              setManual(lesson.states[7]);
              setQuery(null);
            }}
          >
            {t('恢复深路径示例')}
          </button>
        </div>
      )}
      <details>
        <summary>{t('父指针不是原图的边')}</summary>
        <p>
          {t(
            '根相同表示属于同一集合；父指针只是维护集合的内部索引。按大小合并只更新根的有效大小。路径压缩改变指针，不改变成员关系，也不支持直接撤销或删除原图边。',
          )}
        </p>
      </details>
    </section>
  );
}
