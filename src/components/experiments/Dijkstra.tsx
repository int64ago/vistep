import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  DIJKSTRA_NODES,
  dijkstraEdges,
  dijkstraPath,
  dijkstraTrace,
  localEdgeGreedy,
} from '../../models/dijkstra';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/dijkstra.css';
const number = (n: number) => (Number.isFinite(n) ? String(n) : '∞');
export default function Dijkstra() {
  const d = useShowcase(),
    id = useId(),
    [branch, setBranch] = useState(5),
    [step, setStep] = useState(0),
    [negative, setNegative] = useState(false);
  const c = d.watch ? Math.min(6, d.chapter) : 5,
    p = d.watch ? d.chapterProgress : 1;
  const edges = dijkstraEdges(d.watch ? 5 : branch),
    frames = dijkstraTrace(
      DIJKSTRA_NODES.map((n) => n.id),
      edges,
      'S',
    );
  const frameIndex = d.watch
    ? c === 0
      ? 0
      : c === 1
        ? 1
        : c === 2
          ? 2
          : c === 3
            ? 3
            : c === 4
              ? p < 0.5
                ? 4
                : 5
              : c === 5
                ? 6
                : 2
    : Math.min(step, frames.length - 1);
  const frame = frames[frameIndex],
    invalid = d.watch ? c === 6 : negative;
  const greedy = localEdgeGreedy(edges),
    best = dijkstraPath(frames.at(-1)!, 'T');
  const shownPath =
    c === 0 && d.watch
      ? greedy.path.slice(0, Math.min(greedy.path.length, 1 + Math.floor(p * greedy.path.length)))
      : c === 5 || !d.watch
        ? dijkstraPath(frame, 'T')
        : [];
  const frontier = DIJKSTRA_NODES.filter(
    (n) => !frame.settled.includes(n.id) && Number.isFinite(frame.distance[n.id]),
  ).sort((a, b) => frame.distance[a.id] - frame.distance[b.id] || a.id.localeCompare(b.id));
  const node = (key: string) => DIJKSTRA_NODES.find((n) => n.id === key)!;
  const visibleEdges = invalid ? [...edges, { from: 'B', to: 'A', weight: -10 }] : edges;
  return (
    <section className="dj-study" aria-label={t('最低暂定距离实验')}>
      <header>
        <span>DIJKSTRA / S → T</span>
        <b>
          {t(invalid ? '前提已被破坏' : c === 0 && d.watch ? '只挑眼前短边' : '从起点累计代价')}
        </b>
      </header>
      <svg
        className="dj-map"
        viewBox="0 0 320 300"
        role="img"
        aria-label={t('有向加权图，节点与距离来自同一轮计算')}
      >
        <defs>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L8 4L0 8" fill="currentColor" />
          </marker>
        </defs>
        {visibleEdges.map((edge) => {
          const a = node(edge.from),
            b = node(edge.to),
            length = Math.hypot(b.x - a.x, b.y - a.y),
            ux = (b.x - a.x) / length,
            uy = (b.y - a.y) / length;
          const chosen = invalid
            ? (edge.from === 'S' && edge.to === 'B') || edge.weight < 0
            : shownPath.some((n, i) => n === edge.from && shownPath[i + 1] === edge.to);
          const relaxed = frame.relaxed.some((e) => e.from === edge.from && e.to === edge.to);
          const midX =
              (a.x + b.x) / 2 +
              (edge.from === 'C' && edge.to === 'D'
                ? -14
                : edge.from === 'A' && edge.to === 'T'
                  ? -5
                  : 0),
            midY = (a.y + b.y) / 2 + (edge.from === 'S' ? 0 : edge.to === 'T' ? -12 : -10);
          return (
            <g
              key={`${edge.from}-${edge.to}`}
              className="dj-edge"
              data-active={chosen || relaxed}
              data-negative={edge.weight < 0}
            >
              <path
                d={`M${a.x + ux * 21} ${a.y + uy * 21}L${b.x - ux * 23} ${b.y - uy * 23}`}
                markerEnd={`url(#${id}-arrow)`}
              />
              <rect x={midX - 14} y={midY - 13} width="28" height="26" rx="8" />
              <text x={midX} y={midY + 7} textAnchor="middle">
                {edge.weight}
              </text>
            </g>
          );
        })}
        {DIJKSTRA_NODES.map((n) => (
          <g
            className="dj-node"
            key={n.id}
            data-settled={frame.settled.includes(n.id) && !invalid}
            data-current={n.id === frame.current}
            transform={`translate(${n.x} ${n.y})`}
          >
            <circle r="20" />
            <text textAnchor="middle" y="7">
              {n.id}
            </text>
            {!(d.watch && c === 0) && (
              <text
                className="dj-distance"
                x={n.id === 'S' ? 0 : 0}
                y={n.y < 150 ? -29 : 45}
                textAnchor="middle"
              >
                {invalid && n.id === 'A' ? '2 → −5' : number(frame.distance[n.id])}
                {frame.settled.includes(n.id) && !invalid ? ' ✓' : ''}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="dj-frontier">
        <span>
          {t(
            invalid
              ? '负边反例'
              : c === 0 && d.watch
                ? '局部贪心走出的路'
                : '尚未定案 · 按累计距离排队',
          )}
        </span>
        <div>
          {invalid ? (
            <strong>S → B → A : 5 − 10 = −5</strong>
          ) : c === 0 && d.watch ? (
            <strong>
              {greedy.path.join(' → ')} = {greedy.cost}
            </strong>
          ) : frontier.length ? (
            frontier.map((n, i) => (
              <b key={n.id} data-next={i === 0}>
                {n.id}
                <em>{number(frame.distance[n.id])}</em>
              </b>
            ))
          ) : (
            <strong>
              {best.join(' → ')} = {frames.at(-1)!.distance.T}
            </strong>
          )}
        </div>
      </div>
      {!d.watch && (
        <p className="dj-evidence">
          {invalid
            ? t('A 曾以 2 定案；负边却让之后的路径降到 −5。')
            : c === 0 && d.watch
              ? t('眼前最短的一步，不保证整条路最短。')
              : frame.current === 'T'
                ? t('T 以全局最低的暂定距离 {0} 定案。', frame.distance.T)
                : frame.current === 'C' && d.watch
                  ? t('离开 C 后，下一位仍是累计距离更小的 B。')
                  : t('发现目标只是上界；暂定值还可以被改小。')}
        </p>
      )}
      {!d.watch && (
        <div className="dj-controls">
          <label htmlFor={`${id}-weight`}>
            {t('S → B 的代价')} · {branch}
          </label>
          <input
            id={`${id}-weight`}
            type="range"
            min="1"
            max="12"
            value={branch}
            onChange={(e) => {
              setBranch(+e.target.value);
              setStep(0);
              setNegative(false);
            }}
          />
          <label htmlFor={`${id}-step`}>
            {t('定案轮次')} · {Math.min(step, frames.length - 1)} / {frames.length - 1}
          </label>
          <input
            id={`${id}-step`}
            type="range"
            min="0"
            max={frames.length - 1}
            value={Math.min(step, frames.length - 1)}
            onChange={(e) => setStep(+e.target.value)}
          />
          <button
            aria-pressed={negative}
            onClick={() => {
              setBranch(5);
              setStep(2);
              setNegative(!negative);
            }}
          >
            {t(negative ? '移除 B → A 负边' : '展示固定负边反例')}
          </button>
          <p>
            {invalid ? (
              t('负边示例不使用 Dijkstra 认证结果。')
            ) : (
              <>
                {t('当前最短路')}：{best.join(' → ')} = {frames.at(-1)!.distance.T}
              </>
            )}
          </p>
        </div>
      )}
      <details>
        <summary>{t('为什么可以定案？')}</summary>
        <p>{t('发现目标只是上界；暂定值还可以被改小。')}</p>
        <p>
          {t(
            '所有边权非负。任何尚未发现的更短路，都必须先经过某个未定案点；它的累计距离不小于当前最小值，再走非负边无法把代价降下来。负边反例只展示失效条件，不运行 Dijkstra 来认证负权结果。',
          )}
        </p>
      </details>
    </section>
  );
}
