import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  TOPO_EDGES,
  TOPO_LABELS,
  TOPO_POINTS,
  topologicalTrace,
  type TopoEdge,
} from '../../models/topological-sort';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/topological-sort.css';
export default function TopologicalSort() {
  const d = useShowcase(),
    id = useId(),
    [cycle, setCycle] = useState(false),
    [reverse, setReverse] = useState(false),
    [step, setStep] = useState(0);
  const c = d.watch ? Math.min(5, d.chapter) : 0,
    p = d.watch ? d.chapterProgress : 1,
    hasCycle = d.watch ? c === 5 : cycle,
    edges: TopoEdge[] = hasCycle ? [...TOPO_EDGES, [4, 1]] : TOPO_EDGES,
    q = topologicalTrace(6, edges, !d.watch && reverse);
  const index = d.watch
      ? c === 0
        ? 0
        : c === 1
          ? 1
          : c === 2
            ? 2
            : c === 3
              ? 3
              : c === 4
                ? Math.min(6, 4 + Math.floor(p * 3))
                : q.frames.length - 1
      : Math.min(step, q.frames.length - 1),
    frame = q.frames[index];
  const cycleEdges = new Set(q.cycle.slice(1).map((v, i) => `${q.cycle[i]},${v}`));
  return (
    <section
      className="topo-study"
      data-watch={d.watch}
      data-playing={d.playing}
      aria-label={t('拓扑排序依赖解除实验')}
    >
      <header>
        <span>DEPENDENCIES / RELEASE</span>
        <b>{hasCycle ? t('存在循环依赖') : t('先完成所有前提')}</b>
      </header>
      <svg viewBox="0 0 360 264" role="img" aria-label={t('有向依赖图，箭头表示必须先完成的前提')}>
        <defs>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="10"
            markerHeight="10"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10" />
          </marker>
        </defs>
        {edges.map(([a, b], i) => {
          const from = TOPO_POINTS[a],
            to = TOPO_POINTS[b],
            length = Math.hypot(to.x - from.x, to.y - from.y);
          const end = {
            x: to.x - ((to.x - from.x) * 29) / length,
            y: to.y - ((to.y - from.y) * 29) / length,
          };
          return (
            <path
              key={`${a}-${b}`}
              d={`M${from.x} ${from.y}L${end.x} ${end.y}`}
              className="topo-link"
              data-removed={frame.removed.includes(i)}
              data-cycle={hasCycle && cycleEdges.has(`${a},${b}`)}
              markerEnd={`url(#${id}-arrow)`}
            />
          );
        })}
        {TOPO_POINTS.map((point, i) => (
          <g
            key={i}
            transform={`translate(${point.x} ${point.y})`}
            className="topo-node"
            data-done={frame.order.includes(i)}
            data-ready={frame.ready.includes(i)}
            data-active={frame.active === i}
            data-cycle={hasCycle && q.cycle.includes(i)}
          >
            <circle r="25" />
            <text textAnchor="middle" y="9">
              {TOPO_LABELS[i]}
            </text>
          </g>
        ))}
      </svg>
      <div className="topo-counts" aria-label={t('每项尚未完成的前提数')}>
        {TOPO_LABELS.map((label, i) => (
          <span key={label} data-done={frame.order.includes(i)}>
            {label}
            <b>{frame.indegree[i]}</b>
          </span>
        ))}
      </div>
      <p className="topo-ready">
        <span>{t('可执行')}</span>
        <strong>
          {frame.ready.length ? frame.ready.map((i) => TOPO_LABELS[i]).join(' · ') : '∅'}
        </strong>
      </p>
      <div className="topo-order">
        <span>{t('已输出')}</span>
        {frame.order.length ? frame.order.map((i) => <b key={i}>{TOPO_LABELS[i]}</b>) : '∅'}
      </div>
      {hasCycle && (
        <p className="topo-warning">
          {t('循环')} B → E → B<br />
          {t('D、F 被阻塞，但不在环上。')}
        </p>
      )}
      {!d.watch && (
        <div className="topo-controls">
          <label>
            <input
              type="checkbox"
              checked={cycle}
              onChange={(e) => {
                setCycle(e.target.checked);
                setStep(0);
              }}
            />
            {t('加入 E → B 循环依赖')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={reverse}
              onChange={(e) => {
                setReverse(e.target.checked);
                setStep(0);
              }}
            />
            {t('就绪项按反向字母选择')}
          </label>
          <label htmlFor={`${id}-step`}>
            {t('解除依赖步骤')} · {index}/{q.frames.length - 1}
          </label>
          <input
            id={`${id}-step`}
            type="range"
            min="0"
            max={q.frames.length - 1}
            value={index}
            onChange={(e) => setStep(+e.target.value)}
          />
        </div>
      )}
      <details>
        <summary>{t('拓扑顺序不一定唯一')}</summary>
        <p>
          {t(
            '只要求每条箭头的起点排在终点之前。多个零入度项可以任意选取；这不等于带时长和资源约束的最优排程。无法输出全部项时，剩余项中一定有环，但并非每个剩余项都属于环。',
          )}
        </p>
      </details>
    </section>
  );
}
