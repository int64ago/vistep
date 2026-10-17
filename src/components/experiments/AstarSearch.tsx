import { useId, useState } from 'react';
import { t } from '../../i18n';
import { astarLessonGrid, astarPoint, astarTrace } from '../../models/astar-search';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/astar-search.css';
const standard = astarTrace(astarLessonGrid()),
  zero = astarTrace(astarLessonGrid(), 0),
  weighted = astarTrace(astarLessonGrid(), 6),
  sealed = astarTrace(astarLessonGrid(true));
export default function AstarSearch() {
  const d = useShowcase(),
    id = useId(),
    [weight, setWeight] = useState(1),
    [wall, setWall] = useState(false),
    [step, setStep] = useState(0);
  const c = d.watch ? Math.min(6, d.chapter) : 0,
    p = d.watch ? d.chapterProgress : 1,
    w = d.watch ? (c === 5 ? 6 : 1) : weight,
    blocked = d.watch ? c === 6 : wall,
    grid = astarLessonGrid(blocked),
    q = d.watch ? (c === 5 ? weighted : c === 6 ? sealed : standard) : astarTrace(grid, w);
  const index = d.watch
      ? c === 0
        ? 0
        : c === 1
          ? 1
          : c === 2
            ? Math.min(q.frames.length - 2, 2 + Math.floor(p * (q.frames.length - 3)))
            : q.frames.length - 1
      : Math.min(step, q.frames.length - 1),
    frame = q.frames[index];
  const current = frame.current ?? grid.start,
    point = astarPoint(grid, current),
    h = (Math.abs(point.x - 8) + Math.abs(point.y - 2)) * w,
    path = c === 6 && d.watch ? [] : frame.path,
    pathD = path
      .map((v, i) => {
        const point = astarPoint(grid, v);
        return `${i ? 'L' : 'M'}${point.x + 0.5} ${point.y + 0.5}`;
      })
      .join(' '),
    done = index === q.frames.length - 1;
  return (
    <section
      className="astar-study"
      data-watch={d.watch}
      data-chapter={c}
      aria-label={t('A 星搜索与启发下界实验')}
    >
      <header>
        <span>A* / COST CONTOURS</span>
        <b>{w > 1 ? t('放大估计，不保证最优') : t('不高估的曼哈顿下界')}</b>
      </header>
      <div className="astar-map">
        <div className="astar-cells">
          {grid.cost.map((cost, i) => (
            <div
              key={i}
              className="astar-cell"
              data-wall={grid.blocked.includes(i)}
              data-rough={cost > 1}
              data-open={frame.open.some((x) => x.id === i)}
              data-closed={frame.closed.includes(i)}
              data-current={frame.current === i}
              data-route={path.includes(i)}
            >
              <span>
                {i === grid.start
                  ? 'S'
                  : i === grid.goal
                    ? 'G'
                    : cost > 1 && !grid.blocked.includes(i)
                      ? cost
                      : ''}
              </span>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 9 5" preserveAspectRatio="none" aria-hidden="true">
          <path d={pathD} />
        </svg>
      </div>
      <div className="astar-legend">
        <span>■ {t('墙')}</span>
        <span>{t('进入普通格成本 1；赭色格成本 6。')}</span>
      </div>
      {c === 4 && d.watch ? (
        <div className="astar-comparison">
          <div>
            <span>h = 0</span>
            <b>{zero.pops}</b>
            <small>{t('取出次数')}</small>
          </div>
          <div>
            <span>h = L₁</span>
            <b>{standard.pops}</b>
            <small>{t('取出次数')}</small>
          </div>
        </div>
      ) : c === 5 && d.watch ? (
        <div className="astar-risk">
          <span>
            {t('所得路线成本')} <b>{weighted.cost}</b>
          </span>
          <span>
            {t('最优成本')} <b>{standard.cost}</b>
          </span>
        </div>
      ) : c === 6 && d.watch ? (
        <p className="astar-failure">{t('前沿为空：终点不可达。')}</p>
      ) : (
        <div className="astar-equation">
          <span>
            {t(frame.current === null ? '起点的初始估计' : '刚取出的项')} · ({point.x},{point.y})
          </span>
          <strong>
            <i>g</i> {frame.g[current]} + <i>h</i> {h} = <b>{frame.g[current] + h}</b>
          </strong>
        </div>
      )}
      {c < 3 || !d.watch ? (
        <div className="astar-frontier">
          <span>{t('接下来按 f 最小选择')}</span>
          <div>
            {frame.open.slice(0, 3).map((x) => (
              <b key={x.id}>
                ({x.id % 9},{Math.floor(x.id / 9)})
                <small>
                  {x.g}+{x.h}={x.f}
                </small>
              </b>
            ))}
            {!frame.open.length && '∅'}
          </div>
        </div>
      ) : (
        c === 3 && (
          <p className="astar-result">
            {t('终点出队时的最优成本')} · <b>{q.cost}</b>
          </p>
        )
      )}
      {!d.watch && (
        <div className="astar-controls">
          <label htmlFor={`${id}-weight`}>{t('估计规则')}</label>
          <select
            id={`${id}-weight`}
            value={weight}
            onChange={(e) => {
              setWeight(+e.target.value);
              setStep(0);
            }}
          >
            <option value="0">h = 0 · Dijkstra</option>
            <option value="1">h = L₁ · {t('合法下界')}</option>
            <option value="6">h = 6 × L₁ · {t('可能高估')}</option>
          </select>
          <label>
            <input
              type="checkbox"
              checked={wall}
              onChange={(e) => {
                setWall(e.target.checked);
                setStep(0);
              }}
            />
            {t('封闭整列墙')}
          </label>
          <label htmlFor={`${id}-step`}>
            {t('取出步骤')} · {index}/{q.frames.length - 1}
          </label>
          <input
            id={`${id}-step`}
            type="range"
            min="0"
            max={q.frames.length - 1}
            value={index}
            onChange={(e) => setStep(+e.target.value)}
          />
          {done && <p>{q.found ? t('最终路线成本 {0}', q.cost) : t('前沿为空：终点不可达。')}</p>}
          {weight > 1 && <p>{t('此模式故意违反不高估条件，不能保证最优。')}</p>}
        </div>
      )}
      <details>
        <summary>{t('为什么必须把 g 加回来？')}</summary>
        <p>
          {t(
            '只看剩余估计 h 会忽略已经付出的成本 g。每步只向上下左右移动，进入格子的成本至少为一，所以忽略墙的曼哈顿距离是不高估且一致的下界。算法在更小 g 出现时允许重开节点，终点从前沿取出才停止；放大下界可能破坏最优性。',
          )}
        </p>
      </details>
    </section>
  );
}
