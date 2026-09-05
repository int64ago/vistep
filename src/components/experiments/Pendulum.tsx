import { useRef, useState } from 'react';
import PendulumStudio from '../three/PendulumStudio';
import { Range, Metric, Segments, clamp } from '../lab/Controls';
import { useSimulation } from '../lab/useSimulation';
import { stepPendulum, pendulumEnergy, smallAnglePeriod } from '../../models/pendulum';
export default function Pendulum() {
  const [length, setLength] = useState(1.4),
    [gravity, setGravity] = useState(9.81),
    [mass, setMass] = useState(1),
    [damping, setDamping] = useState(0.04),
    [initial, setInitial] = useState(35),
    [playing, setPlaying] = useState(false),
    [state, setState] = useState({ angle: (35 * Math.PI) / 180, velocity: 0, time: 0 });
  const sim = useRef(state),
    lastUI = useRef(0),
    trace = useRef<number[]>([]),
    [points, setPoints] = useState('');
  const host = useSimulation((dt) => {
    for (let i = 0; i < 4; i++)
      sim.current = stepPendulum(sim.current, dt / 4, length, gravity, damping);
    lastUI.current += dt;
    if (lastUI.current > 1 / 30) {
      lastUI.current = 0;
      setState({ ...sim.current });
      trace.current.push(sim.current.angle);
      if (trace.current.length > 160) trace.current.shift();
      setPoints(trace.current.map((v, i) => `${38 + i * 3.45},${374 - v * 22}`).join(' '));
    }
  }, playing);
  const reset = (angle = initial) => {
    sim.current = { angle: (angle * Math.PI) / 180, velocity: 0, time: 0 };
    setState(sim.current);
    trace.current = [];
    setPoints('');
  };
  const change = (fn: (v: number) => void, v: number) => {
    fn(v);
    setPlaying(false);
    reset();
  };
  const energy = pendulumEnergy(state, length, gravity, mass);
  const maxEnergy = Math.max(
    0.01,
    mass * gravity * length * (1 - Math.cos((initial * Math.PI) / 180)),
  );
  const total = energy.kinetic + energy.potential;
  return (
    <div ref={host}>
      <div className="lab-toolbar">
        <h2>先把摆球拉向一边，再松手。</h2>
        <div className="lab-actions">
          <button
            className={`btn ${playing ? '' : 'primary'}`}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? 'Ⅱ 暂停' : '▷ 释放钟摆'}
          </button>
          <button
            className="btn"
            onClick={() => {
              setPlaying(false);
              reset();
            }}
          >
            ↻ 重置
          </button>
        </div>
      </div>
      <div className="lab-grid">
        <div className="lab-scene">
          <span className="scene-label">THE PENDULUM / 单摆</span>
          <div className="pendulum-object">
            <PendulumStudio
              angle={state.angle}
              length={length}
              mass={mass}
              onDrag={(angle) => {
                setInitial(Math.round(angle));
                setPlaying(false);
                reset(angle);
              }}
              onRelease={() => setPlaying(true)}
            />
          </div>
          <div className="pendulum-readout">
            <span>θ</span>
            <strong>
              {((state.angle * 180) / Math.PI).toFixed(1)}
              <small>°</small>
            </strong>
            <p>拉起摆球，然后松手。</p>
          </div>
          <svg className="pendulum-trace" viewBox="0 330 640 90" aria-label="实时角度轨迹">
            <path d="M38 374H590" stroke="#cdd3c1" />
            <polyline points={points} stroke="#ae8748" strokeWidth="1.6" fill="none" />
            <text x="40" y="404" fill="#9b9e8b" fontSize="10">
              ANGLE / TIME
            </text>
            <text x="555" y="404" fill="#9b9e8b" fontSize="10">
              {state.time.toFixed(1)}s
            </text>
          </svg>
        </div>
        <div className="lab-controls">
          <Range
            label="摆长"
            value={length}
            min={0.5}
            max={2.2}
            step={0.1}
            unit="m"
            onChange={(v) => change(setLength, v)}
          />
          <Range
            label="起始角度"
            value={initial}
            min={-80}
            max={80}
            unit="°"
            onChange={(v) => {
              setInitial(v);
              setPlaying(false);
              reset(v);
            }}
          />
          <Range
            label="摆球质量"
            value={mass}
            min={0.5}
            max={3}
            step={0.1}
            unit="kg"
            onChange={setMass}
          />
          <Range label="阻尼" value={damping} min={0} max={0.5} step={0.01} onChange={setDamping} />
          <div>
            <span className="lab-subtitle">换一个星球</span>
            <Segments
              label="重力环境"
              value={gravity === 9.81 ? 'earth' : 'moon'}
              options={[
                { value: 'earth', label: '地球' },
                { value: 'moon', label: '月球' },
              ]}
              onChange={(v) => change(setGravity, v === 'earth' ? 9.81 : 1.62)}
            />
          </div>
          <div>
            <div className="energy-label">
              <span>势能</span>
              <span>{energy.potential.toFixed(2)} J</span>
            </div>
            <div className="energy-track">
              <span
                style={{
                  width: `${clamp((energy.potential / maxEnergy) * 100, 0, 100)}%`,
                  background: '#d99e40',
                }}
              />
            </div>
            <div className="energy-label" style={{ marginTop: 12 }}>
              <span>动能</span>
              <span>{energy.kinetic.toFixed(2)} J</span>
            </div>
            <div className="energy-track">
              <span style={{ width: `${clamp((energy.kinetic / maxEnergy) * 100, 0, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
      <div className="metrics">
        <Metric
          label="小角度近似周期"
          value={smallAnglePeriod(length, gravity).toFixed(2)}
          unit="s"
        />
        <Metric label="机械能" value={total.toFixed(2)} unit="J" />
        <Metric label="重力加速度" value={gravity.toFixed(2)} unit="m/s²" />
      </div>
      <p className="lab-caption">
        <strong>试试看：</strong>
        把质量翻倍，周期会变吗？这里使用非线性单摆方程计算运动；周期读数是小角度近似。参数改变代表重新设置实验，阻尼把机械能转移到环境。
      </p>
    </div>
  );
}
