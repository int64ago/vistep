import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  FLOW_LABELS,
  FLOW_POINTS,
  flowLessonNetwork,
  flowValue,
  maxFlowTrace,
} from '../../models/max-flow';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/max-flow.css';
const lesson = maxFlowTrace(flowLessonNetwork(), true);
export default function MaxFlow() {
  const d = useShowcase(),
    id = useId(),
    [outlet, setOutlet] = useState(2),
    [step, setStep] = useState(0);
  const c = d.watch ? Math.min(5, d.chapter) : 0,
    p = d.watch ? d.chapterProgress : 1,
    q = d.watch ? lesson : maxFlowTrace(flowLessonNetwork(outlet), true),
    index = d.watch
      ? c === 0
        ? 0
        : c === 1
          ? 1
          : c === 2
            ? p < 0.45
              ? 2
              : 3
            : c === 3
              ? 3
              : c === 4 && p < 0.35
                ? 3
                : 4
      : Math.min(step, q.frames.length - 1),
    frame = q.frames[index],
    state = frame.state,
    cut = d.watch ? c === 5 : index === q.frames.length - 1,
    path = d.watch && (c === 3 || c === 4) ? q.frames[4].path : cut ? [] : frame.path,
    reverseVisible = state.flows[2] > 0 || path.some((a) => a.direction === -1),
    reverseActive = path.some((a) => a.direction === -1),
    value = flowValue(state),
    cutText = q.cutEdges.map((i) => state.network.edges[i].capacity).join(' + ');
  return (
    <section className="flow-study" data-watch={d.watch} aria-label={t('最大流与反向残余实验')}>
      <header>
        <span>FLOW / RECONSIDER</span>
        <strong>
          {t('总流量')} · {value}
        </strong>
      </header>
      <svg viewBox="0 0 360 280" role="img" aria-label={t('有向容量网络，边上标记当前流量与容量')}>
        <defs>
          <marker
            id={`${id}-forward`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="12"
            markerHeight="12"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10" />
          </marker>
          <marker
            id={`${id}-reverse`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10" />
          </marker>
        </defs>
        {state.network.edges.map((edge, i) => {
          const a = FLOW_POINTS[edge.from],
            b = FLOW_POINTS[edge.to],
            length = Math.hypot(b.x - a.x, b.y - a.y),
            end = { x: b.x - ((b.x - a.x) * 27) / length, y: b.y - ((b.y - a.y) * 27) / length };
          return (
            <g key={edge.id}>
              <path
                className="flow-capacity"
                d={`M${a.x} ${a.y}L${end.x} ${end.y}`}
                style={{ strokeWidth: 4 + edge.capacity * 2 }}
                data-cut={cut && q.cutEdges.includes(i)}
                markerEnd={`url(#${id}-forward)`}
              />
              {state.flows[i] > 0 && (
                <path
                  className="flow-current"
                  d={`M${a.x} ${a.y}L${end.x} ${end.y}`}
                  style={{ strokeWidth: 2 + state.flows[i] * 2 }}
                  data-path={path.some((a) => a.edge === i && a.direction === 1)}
                  markerEnd={`url(#${id}-forward)`}
                />
              )}
            </g>
          );
        })}
        {reverseVisible && (
          <path
            d="M180 242Q270 140 198 59"
            className="flow-reverse"
            data-active={reverseActive}
            markerEnd={`url(#${id}-reverse)`}
          />
        )}
        {state.network.edges.map((edge, i) => {
          const a = FLOW_POINTS[edge.from],
            b = FLOW_POINTS[edge.to],
            dx = b.x - a.x,
            dy = b.y - a.y,
            len = Math.hypot(dx, dy),
            offset = i === 2 ? 35 : 20,
            x = (a.x + b.x) / 2 - (dy / len) * offset,
            y = (a.y + b.y) / 2 + (dx / len) * offset;
          return (
            <g key={edge.id} className="flow-label" transform={`translate(${x} ${y})`}>
              <rect x="-30" y="-17" width="60" height="34" rx="12" />
              <text y="8" textAnchor="middle">
                {state.flows[i]}/{edge.capacity}
              </text>
            </g>
          );
        })}
        {reverseVisible && (
          <g className="flow-reverse-label">
            <circle cx="228" cy="140" r="17" />
            <text x="228" y="148" textAnchor="middle">
              {state.flows[2] || frame.delta}
            </text>
          </g>
        )}
        {FLOW_POINTS.map((point, i) => (
          <g
            key={i}
            className="flow-node"
            transform={`translate(${point.x} ${point.y})`}
            data-side={cut && q.reachable.includes(i)}
          >
            <circle r="24" />
            <text y="9" textAnchor="middle">
              {FLOW_LABELS[i]}
            </text>
          </g>
        ))}
      </svg>
      <div className="flow-key">
        <span>{t('流量 / 容量')}</span>
        {reverseVisible && <span>↶ {t(state.flows[2] === 0 ? '本次反向撤回' : '反向残余')}</span>}
      </div>
      {cut ? (
        <div className="flow-proof">
          <span>{t('割容量上界')}</span>
          <strong>
            {cutText} = {q.cutCapacity}
          </strong>
          <span>{t('已达到上界')}</span>
        </div>
      ) : (
        <p className="flow-path">
          <span>{d.watch && c === 3 ? t('下一条残余路径') : t('本次增广')}</span>
          <b>
            {path.length
              ? [FLOW_LABELS[path[0].from], ...path.map((a) => FLOW_LABELS[a.to])].join(' → ')
              : '∅'}
          </b>
          {path.length > 0 && <span>+{d.watch && c === 3 ? 1 : frame.delta}</span>}
        </p>
      )}
      {!d.watch && (
        <div className="flow-controls">
          <label htmlFor={`${id}-outlet`}>
            {t('A → T 容量')} · {outlet}
          </label>
          <input
            id={`${id}-outlet`}
            type="range"
            min="1"
            max="3"
            value={outlet}
            onChange={(e) => {
              setOutlet(+e.target.value);
              setStep(0);
            }}
          />
          <label htmlFor={`${id}-step`}>
            {t('增广步骤')} · {index}/{q.frames.length - 1}
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
        <summary>{t('反向边是撤回，不是额外管道')}</summary>
        <p>
          {t(
            '每条原边的正向残余为容量减流量，反向残余等于已有流量。反向增广减少原边分配，同时整条路径仍增加源到汇的净流。容量与中间节点守恒始终受检验；这里不模拟压力或真实流体。第一条绕路刻意指定，随后用广度优先残余路径。',
          )}
        </p>
      </details>
    </section>
  );
}
