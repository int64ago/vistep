import { t } from '../../i18n';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useShowcase } from '../lab/Showcase';
import { fixedReplay } from '../../models/replay';
import { spanProgress } from '../../models/direction';
import ElevatorStudio from '../three/ElevatorStudio';
import { Metric, Segments } from '../lab/Controls';
import { useSimulation } from '../lab/useSimulation';
import {
  makeScenario,
  newElevatorState,
  stepElevators,
  elevatorStats,
  compareElevators,
  type Strategy,
} from '../../models/elevator';
const names = {
  fcfs: t('先来先服务'),
  nearest: t('最近任务优先'),
  collective: t('顺路停靠'),
};
export default function Elevator() {
  const demo = useShowcase(),
    fixed = useRef(0),
    finishedAt = useRef<number | null>(null);
  const [scenario, setScenario] = useState(() => makeScenario()),
    [mode, setMode] = useState('morning'),
    [manualStrategy, setStrategy] = useState<Strategy>('fcfs'),
    [manualPlaying, setPlaying] = useState(false),
    [destination, setDestination] = useState(6),
    [origin, setOrigin] = useState(0),
    [notice, setNotice] = useState(t('选择起点和目的楼层，加入一位乘客。')),
    [comparison, setComparison] = useState<ReturnType<typeof compareElevators> | null>(null);
  const c = demo.chapter;
  const strategy: Strategy = demo.watch
    ? c < 4
      ? 'fcfs'
      : c < 7
        ? 'nearest'
        : 'collective'
    : manualStrategy;
  const playing = demo.watch ? demo.playing : manualPlaying;
  const directedRequests = useMemo(
    () =>
      makeScenario('mixed', 42)
        .slice(0, 10)
        .map((r, i) => ({ ...r, arrival: i * 0.8 })),
    [],
  );
  const directedResults = useMemo(() => compareElevators(directedRequests), [directedRequests]);
  const directedReplay = useMemo(
    () =>
      fixedReplay(
        () => newElevatorState(directedRequests),
        (s, dt) => stepElevators(s, dt, strategy),
      ),
    [strategy, demo.run, directedRequests],
  );
  const simulation = useRef(newElevatorState(scenario));
  const [state, setState] = useState(() => structuredClone(simulation.current));
  const acc = useRef(0);
  const host = useSimulation((dt) => {
    if (finishedAt.current !== null && simulation.current.time >= finishedAt.current + 1.5) return;
    fixed.current += dt * 4;
    while (fixed.current >= 1 / 60) {
      stepElevators(simulation.current, 1 / 60, strategy);
      fixed.current -= 1 / 60;
    }
    acc.current += dt;
    if (
      finishedAt.current === null &&
      simulation.current.requests.every((r) => r.status === 'done')
    )
      finishedAt.current = simulation.current.time;
    const settled =
      finishedAt.current !== null && simulation.current.time >= finishedAt.current + 1.5;
    if (acc.current > 0.08 || settled) {
      acc.current = 0;
      setState(structuredClone(simulation.current));
      if (settled) setPlaying(false);
    }
  }, playing && !demo.watch);
  const stats = elevatorStats(state);
  const reset = (requests = scenario) => {
    fixed.current = 0;
    finishedAt.current = null;
    acc.current = 0;
    simulation.current = newElevatorState(requests);
    setState(structuredClone(simulation.current));
    setPlaying(false);
    setComparison(null);
  };
  useEffect(() => {
    if (!demo.watch) return;
    const segment = c < 4 ? [1, 4] : c < 7 ? [4, 7] : [7, 9];
    const completion = directedResults.find((r) => r.strategy === strategy)!;
    const progress =
      c === 0
        ? 0
        : c === 10
          ? demo.chapterProgress * 0.6
          : c >= 9
            ? 1
            : spanProgress(demo, segment[0], segment[1]);
    const next = directedReplay(progress * completion.time);
    simulation.current = structuredClone(next);
    setState(structuredClone(next));
  }, [demo.watch, demo.time, demo.run, strategy, directedReplay, directedResults]);
  useEffect(() => {
    if (!demo.watch) return;
    setScenario(directedRequests);
    setMode('mixed');
    setComparison(c === 9 || c === 11 ? directedResults : null);
  }, [demo.watch, c, directedRequests, directedResults]);
  const add = (from: number) => {
    if (from === destination) {
      setNotice(t('起点与目的地相同，换一个目的楼层试试。'));
      return;
    }
    const request = {
      id: Math.max(-1, ...simulation.current.requests.map((r) => r.id)) + 1,
      from,
      to: destination,
      arrival: simulation.current.time,
      status: 'waiting' as const,
    };
    simulation.current.requests.push({ ...request });
    finishedAt.current = null;
    setScenario((old) => [...old, { ...request, status: 'future' }]);
    setState(structuredClone(simulation.current));
    setComparison(null);
    setNotice(t('已加入：{0}F → {1}F', from + 1, destination + 1));
  };
  return (
    <div ref={host}>
      <div className="lab-toolbar">
        <h2>{t('两部电梯，怎样照顾同一批乘客？')}</h2>
        <div className="lab-actions">
          <button className="btn primary" onClick={() => setPlaying(!playing)}>
            {playing ? t('Ⅱ 暂停') : t('▷ 运行调度')}
          </button>
          <button className="btn" onClick={() => reset()}>
            {t('↻ 重播客流')}
          </button>
        </div>
      </div>
      <div className="lab-tabs">
        <Segments
          label={t('电梯调度策略')}
          value={strategy}
          options={Object.entries(names).map(([value, label]) => ({
            value: value as Strategy,
            label,
          }))}
          onChange={(v) => {
            setStrategy(v);
            reset();
          }}
        />
        <span className="note">{t('切换策略会从相同客流重新开始。')}</span>
      </div>
      <div className="elevator-layout">
        <div className="building">
          <ElevatorStudio state={state} />
          {demo.watch && (
            <div className="passenger-sequence" aria-label={t('同一批乘客的行程')}>
              {state.requests.map((r) => (
                <span
                  key={r.id}
                  data-state={r.status}
                  title={`${r.id + 1}: ${r.from + 1}F → ${r.to + 1}F`}
                >
                  <i>{r.id + 1}</i>
                  {r.from + 1} → {r.to + 1}
                </span>
              ))}
            </div>
          )}
          <div className="elevator-building-note">
            <span>{demo.watch ? names[strategy] : '8 FLOORS / 2 ELEVATORS'}</span>
            <span>
              {demo.watch
                ? `${state.time.toFixed(1)} s · ${stats.done} / ${state.requests.length}`
                : t('◦ 候梯 ◦ 乘梯 · 4× 速度')}
            </span>
          </div>
        </div>
        <div className="elevator-controls">
          <div>
            <p className="lab-subtitle">{t('同一份客流')}</p>
            <Segments
              label={t('客流场景')}
              value={mode}
              options={[
                { value: 'morning', label: t('早高峰') },
                { value: 'mixed', label: t('各层往来') },
              ]}
              onChange={(v) => {
                setMode(v);
                const next = makeScenario(v);
                setScenario(next);
                reset(next);
              }}
            />
          </div>
          <label className="control">
            <span className="control-top">{t('新增乘客的目的地')}</span>
            <select value={destination} onChange={(e) => setDestination(Number(e.target.value))}>
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i} value={i}>
                  {i + 1}F
                </option>
              ))}
            </select>
          </label>
          <label className="control">
            <span className="control-top">{t('新增乘客的起点')}</span>
            <select value={origin} onChange={(e) => setOrigin(Number(e.target.value))}>
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i} value={i}>
                  {i + 1}F
                </option>
              ))}
            </select>
          </label>
          <button className="btn" onClick={() => add(origin)}>
            {t('加入一位乘客 +')}
          </button>
          <p role="status" className="note">
            {notice}
          </p>
          <div className="lab-callout">
            {strategy === 'fcfs'
              ? t('空梯优先处理最早的请求，梯内按上梯顺序送达。')
              : strategy === 'nearest'
                ? t('优先选择距离最近的任务；途中不为新请求停靠。')
                : t('保持一个方向，顺路接送同向乘客，再掉头。')}
            <br />
            {t('最短的个人等待，不一定带来最好的整体结果。')}
          </div>
          <button
            className="btn"
            onClick={() => {
              setPlaying(false);
              setComparison(compareElevators(scenario));
            }}
          >
            {t('对比同一客流的三种结果')}
          </button>
        </div>
      </div>
      <div className="metrics">
        <Metric label={t('当前等待')} value={stats.waiting} unit={t('人')} />
        <Metric label={t('已送达 / 总乘客')} value={`${stats.done} / ${state.requests.length}`} />
        <Metric label={t('已上梯平均等待')} value={stats.meanWait.toFixed(1)} unit="s" />
      </div>
      {comparison && (
        <div className="comparison-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('策略')}</th>
                <th>{t('平均等待')}</th>
                <th>{t('平均乘坐')}</th>
                <th>{t('已送达')}</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c) => (
                <tr key={c.strategy}>
                  <td>{names[c.strategy]}</td>
                  <td>{c.meanWait.toFixed(1)} s</td>
                  <td>{c.meanRide.toFixed(1)} s</td>
                  <td>
                    {c.done} / {scenario.length}
                    {!c.complete ? t('（模拟超时）') : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="lab-caption">
        {t(
          '固定客流种子 42，每次对比都使用同一批乘客和到达时间。实时平均等待仅统计已经上梯的人；完整对比运行到送达或 1800 秒上限。策略是可解释的教学规则，',
        )}
        <strong>{t('不代表厂商实际控制算法')}</strong>。
      </p>
    </div>
  );
}
