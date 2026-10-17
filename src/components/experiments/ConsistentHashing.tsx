import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import {
  ringBuild,
  ringCompare,
  ringPoint,
  ringArc,
  ringInterval,
  moduloChanges,
  RING_KEYS,
  RING_NODES,
} from '../../models/consistent-hashing';
import '../../styles/consistent-hashing.css';
const COLORS: Record<string, string> = { A: '#7b9f9b', B: '#9b9f70', C: '#a793ba', D: '#c09359' };
export default function ConsistentHashing() {
  const d = useShowcase(),
    id = useId(),
    [members, setMembers] = useState(3),
    [replicas, setReplicas] = useState(1),
    [selection, setSelection] = useState(0);
  const c = d.watch ? Math.min(7, d.chapter) : 7,
    p = d.watch ? d.chapterProgress : 1;
  const base = useMemo(() => ringBuild(), []),
    mode =
      c === 3 || c === 7
        ? p < 0.4
          ? 'base'
          : 'add'
        : c === 4
          ? p < 0.4
            ? 'base'
            : 'remove'
          : 'base';
  const nodes = d.watch
      ? mode === 'add'
        ? [...RING_NODES, 'D']
        : mode === 'remove'
          ? ['A', 'B']
          : RING_NODES
      : [...RING_NODES, 'D'].slice(0, members),
    reps = d.watch ? (c === 6 || c === 7 ? 8 : 1) : replicas;
  const run = useMemo(() => ringBuild(nodes, reps), [nodes.join(','), reps]);
  const previous = useMemo(() => ringBuild(RING_NODES, reps), [reps]),
    changes = ringCompare(previous, run),
    changed = new Set(changes.filter((k) => k.changed).map((k) => k.key));
  const wrap = run.assignments.findIndex((a) => a.position > run.tokens.at(-1)!.position),
    selected = d.watch
      ? c === 2
        ? Math.max(0, wrap)
        : Math.min(31, Math.floor(p * 32))
      : selection,
    tracked = run.assignments[selected];
  const interval = ringInterval(tracked.token, run.tokens),
    source = ringPoint(tracked.position, 84),
    near = ringPoint(tracked.position, 110),
    target = ringPoint(tracked.token.position, 110);
  const mods = moduloChanges(),
    loadsMax = Math.max(1, ...Object.values(run.loads));
  return (
    <section
      className="ring-study"
      aria-label={t('一致性哈希实验')}
      data-chapter={c}
      data-playing={d.playing}
    >
      <header>
        <span>CONSISTENT HASHING</span>
        <span>{t('位置不变，归属按顺时针找')}</span>
      </header>
      {c === 0 ? (
        <div className="ring-modulo">
          <div className="ring-modulo-head">
            <span>{t('同一哈希值')}</span>
            <b>mod 3</b>
            <b>mod 4</b>
          </div>
          {mods.slice(0, 8).map((a) => (
            <div key={a.key} data-changed={a.changed}>
              <code>{a.key}</code>
              <b style={{ color: COLORS[a.before] }}>{a.before}</b>
              <b style={{ color: COLORS[a.after] }}>{a.after}</b>
            </div>
          ))}
          <p>
            {t(
              '加入 D 后，{0}/{1} 个键的取模归属改变。',
              mods.filter((a) => a.changed).length,
              mods.length,
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="ring-context">
            <span>
              {t(
                c === 3
                  ? '加入节点 D'
                  : c === 4
                    ? '移除节点 C'
                    : c === 6
                      ? '每个节点拥有 8 个虚拟位置'
                      : '固定的键与节点哈希位置',
              )}
            </span>
            <b>
              {c === 3 || c === 4
                ? `${changed.size} / ${RING_KEYS.length}`
                : `${run.tokens.length} ${t('个位置')}`}
            </b>
          </div>
          <div className="ring-map">
            <svg viewBox="0 0 320 320" aria-hidden="true">
              <circle cx="160" cy="160" r="110" className="ring-orbit" />
              {run.tokens.map((token, i) => {
                const a = ringInterval(token, run.tokens);
                return (
                  <path
                    key={i}
                    d={ringArc(a.from, a.to)}
                    stroke={COLORS[token.node]}
                    className="ring-ownership"
                  />
                );
              })}
              <path
                d={ringArc(interval.from, interval.to)}
                className="ring-active-arc"
                stroke={COLORS[tracked.owner]}
              />
              {run.assignments.map((a) => {
                const point = ringPoint(a.position, 84);
                return (
                  <circle
                    key={a.key}
                    cx={point.x}
                    cy={point.y}
                    r={changed.has(a.key) ? 4 : 2.5}
                    fill={changed.has(a.key) ? '#be8e52' : COLORS[a.owner]}
                    opacity={a.key === tracked.key ? 1 : 0.55}
                  />
                );
              })}
              <path d={`M${source.x} ${source.y}L${near.x} ${near.y}`} className="ring-lookup" />
              <path d={ringArc(tracked.position, tracked.token.position)} className="ring-lookup" />
              {run.tokens.map((token, i) => {
                const point = ringPoint(token.position, 110);
                return (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r={token.replica === 0 ? 6 : 3}
                    fill={COLORS[token.node]}
                    stroke="#f8faf4"
                    strokeWidth="1.5"
                  />
                );
              })}
              <circle
                cx={source.x}
                cy={source.y}
                r="5"
                fill="#fdf9ef"
                stroke={COLORS[tracked.owner]}
                strokeWidth="2"
              />
              <path d="M154 31q17-3 31 4m-6-7 7 7-9 1" className="ring-clockwise" />
            </svg>
            {run.tokens
              .filter((a) => a.replica === 0)
              .map((a) => {
                const point = ringPoint(a.position, 134);
                return (
                  <b
                    key={a.node}
                    className="ring-node-label"
                    style={{
                      left: `${(point.x / 320) * 100}%`,
                      top: `${(point.y / 320) * 100}%`,
                      color: COLORS[a.node],
                    }}
                  >
                    {a.node}
                  </b>
                );
              })}
            <div className="ring-center">
              <span>{tracked.key}</span>
              <b style={{ color: COLORS[tracked.owner] }}>→ {tracked.owner}</b>
              <small>{(tracked.position * 100).toFixed(1)}%</small>
            </div>
          </div>
          {c === 5 || c === 6 || c === 7 ? (
            <div
              className="ring-loads"
              style={{ gridTemplateColumns: `repeat(${run.nodes.length},minmax(0,1fr))` }}
            >
              {run.nodes.map((node) => (
                <div key={node}>
                  <b style={{ color: COLORS[node] }}>{node}</b>
                  <i
                    style={{
                      width: `${(run.loads[node] / loadsMax) * 100}%`,
                      background: COLORS[node],
                    }}
                  />
                  <span>{run.loads[node]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>
              {t(
                c === 1
                  ? '从键的位置顺时针走，遇到的第一个节点就是归属。'
                  : c === 2
                    ? '经过 100% 后回到 0%；顺时针查找仍然连续。'
                    : c === 3
                      ? '只有落入 D 新接管弧段的键改变归属。'
                      : '只有原来归 C 的键，需要寻找新的后继。',
              )}
            </p>
          )}
          {(c === 5 || c === 6 || c === 7) && (
            <p>
              {t(
                c === 5
                  ? '随机位置不保证三段一样长，也不保证负载一样。'
                  : c === 6
                    ? '虚拟位置把每个节点的份额分散到多个弧段。'
                    : '位置稳定减少迁移；负载均衡仍需检查真实键分布。',
              )}
            </p>
          )}
        </>
      )}
      {!d.watch && (
        <div className="ring-controls">
          <label htmlFor={`${id}-nodes`}>
            {t('物理节点数量')} · {members}
          </label>
          <input
            type="range"
            id={`${id}-nodes`}
            min="2"
            max="4"
            value={members}
            onChange={(e) => setMembers(+e.target.value)}
          />
          <label htmlFor={`${id}-replicas`}>
            {t('每节点虚拟位置')} · {replicas}
          </label>
          <input
            type="range"
            id={`${id}-replicas`}
            min="1"
            max="16"
            value={replicas}
            onChange={(e) => setReplicas(+e.target.value)}
          />
          <label htmlFor={`${id}-key`}>{t('追踪键')}</label>
          <select
            id={`${id}-key`}
            value={selection}
            onChange={(e) => setSelection(+e.target.value)}
          >
            {RING_KEYS.map((key, i) => (
              <option key={key} value={i}>
                {key}
              </option>
            ))}
          </select>
        </div>
      )}
      <footer>
        <details>
          <summary>{t('模型边界')}</summary>
          <p>{t('固定哈希、32 个等权教学键；不模拟复制、真实数据搬运或节点间一致性协议。')}</p>
        </details>
      </footer>
    </section>
  );
}
