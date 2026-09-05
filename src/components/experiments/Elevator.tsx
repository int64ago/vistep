import { useRef, useState, useEffect } from 'react';
import { useShowcase } from '../lab/Showcase';
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
const names = { fcfs: '先来先服务', nearest: '最近任务优先', collective: '顺路停靠' };
export default function Elevator() {
  const demo = useShowcase(),
    fixed = useRef(0),
    finishedAt = useRef<number | null>(null);
  const [scenario, setScenario] = useState(() => makeScenario()),
    [mode, setMode] = useState('morning'),
    [strategy, setStrategy] = useState<Strategy>('fcfs'),
    [manualPlaying, setPlaying] = useState(false),
    [destination, setDestination] = useState(6),
    [origin, setOrigin] = useState(0),
    [notice, setNotice] = useState('选择起点和目的楼层，加入一位乘客。'),
    [comparison, setComparison] = useState<ReturnType<typeof compareElevators> | null>(null);
  const playing = demo.watch ? demo.playing && demo.time < 39 : manualPlaying;
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
  }, playing);
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
    const requests = makeScenario('mixed', 42)
      .slice(0, 10)
      .map((r, i) => ({ ...r, arrival: i * 0.8 }));
    if (demo.chapter < 3) {
      setScenario(requests);
      setMode('mixed');
      setStrategy((['fcfs', 'nearest', 'collective'] as Strategy[])[demo.chapter]);
      reset(requests);
    } else setComparison(compareElevators(requests));
  }, [demo.watch, demo.run, demo.chapter]);
  const add = (from: number) => {
    if (from === destination) {
      setNotice('起点与目的地相同，换一个目的楼层试试。');
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
    setNotice(`已加入：${from + 1}F → ${destination + 1}F`);
  };
  return (
    <div ref={host}>
      <div className="lab-toolbar">
        <h2>两部电梯，怎样照顾同一批乘客？</h2>
        <div className="lab-actions">
          <button className="btn primary" onClick={() => setPlaying(!playing)}>
            {playing ? 'Ⅱ 暂停' : '▷ 运行调度'}
          </button>
          <button className="btn" onClick={() => reset()}>
            ↻ 重播客流
          </button>
        </div>
      </div>
      <div className="lab-tabs">
        <Segments
          label="电梯调度策略"
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
        <span className="note">切换策略会从相同客流重新开始。</span>
      </div>
      <div className="elevator-layout">
        <div className="building">
          <ElevatorStudio state={state} />
          <div className="elevator-building-note">
            <span>{demo.watch ? names[strategy] : '8 FLOORS / 2 ELEVATORS'}</span>
            <span>◦ 候梯　◦ 乘梯　·　4× 速度</span>
          </div>
        </div>
        <div className="elevator-controls">
          <div>
            <p className="lab-subtitle">同一份客流</p>
            <Segments
              label="客流场景"
              value={mode}
              options={[
                { value: 'morning', label: '早高峰' },
                { value: 'mixed', label: '各层往来' },
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
            <span className="control-top">新增乘客的目的地</span>
            <select value={destination} onChange={(e) => setDestination(Number(e.target.value))}>
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i} value={i}>
                  {i + 1}F
                </option>
              ))}
            </select>
          </label>
          <label className="control">
            <span className="control-top">新增乘客的起点</span>
            <select value={origin} onChange={(e) => setOrigin(Number(e.target.value))}>
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i} value={i}>
                  {i + 1}F
                </option>
              ))}
            </select>
          </label>
          <button className="btn" onClick={() => add(origin)}>
            加入一位乘客 +
          </button>
          <p role="status" className="note">
            {notice}
          </p>
          <div className="lab-callout">
            {strategy === 'fcfs'
              ? '空梯优先处理最早的请求，梯内按上梯顺序送达。'
              : strategy === 'nearest'
                ? '优先选择距离最近的任务；途中不为新请求停靠。'
                : '保持一个方向，顺路接送同向乘客，再掉头。'}
            <br />
            最短的个人等待，不一定带来最好的整体结果。
          </div>
          <button
            className="btn"
            onClick={() => {
              setPlaying(false);
              setComparison(compareElevators(scenario));
            }}
          >
            对比同一客流的三种结果
          </button>
        </div>
      </div>
      <div className="metrics">
        <Metric label="当前等待" value={stats.waiting} unit="人" />
        <Metric label="已送达 / 总乘客" value={`${stats.done} / ${state.requests.length}`} />
        <Metric label="已上梯平均等待" value={stats.meanWait.toFixed(1)} unit="s" />
      </div>
      {comparison && (
        <div className="comparison-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>策略</th>
                <th>平均等待</th>
                <th>平均乘坐</th>
                <th>已送达</th>
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
                    {!c.complete ? '（模拟超时）' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="lab-caption">
        固定客流种子
        42，每次对比都使用同一批乘客和到达时间。实时平均等待仅统计已经上梯的人；完整对比运行到送达或
        1800 秒上限。策略是可解释的教学规则，<strong>不代表厂商实际控制算法</strong>。
      </p>
    </div>
  );
}
