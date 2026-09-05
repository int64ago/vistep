import { t } from '../../i18n';
import { useRef, useState, useEffect } from 'react';
import { useShowcase } from '../lab/Showcase';
import PendulumStudio from '../three/PendulumStudio';
import { Range, Metric, Segments, clamp } from '../lab/Controls';
import { useSimulation } from '../lab/useSimulation';
import { stepPendulum, pendulumEnergy, smallAnglePeriod } from '../../models/pendulum';
export default function Pendulum() {
  const demo = useShowcase();
  const [manualLength, setLength] = useState(1.4),
    [manualGravity, setGravity] = useState(9.81),
    [manualMass, setMass] = useState(1),
    [manualDamping, setDamping] = useState(0.04),
    [manualInitial, setInitial] = useState(35),
    [manualPlaying, setPlaying] = useState(false),
    [state, setState] = useState({ angle: (35 * Math.PI) / 180, velocity: 0, time: 0 });
  const c = demo.chapter;
  const episode = c < 5 ? 0 : c === 10 ? 9 : c;
  const length = demo.watch ? (c >= 5 && c <= 7 ? 2 : 1.4) : manualLength,
    gravity = demo.watch ? (c === 7 ? 1.62 : 9.81) : manualGravity,
    mass = demo.watch ? (c === 6 || c === 7 ? 2 : 1) : manualMass;
  const damping = demo.watch ? (c === 9 || c === 10 ? 0.28 : 0) : manualDamping,
    initial = demo.watch ? (c === 8 ? 70 : 35) : manualInitial;
  const playing = demo.watch ? demo.playing : manualPlaying;
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
  }, playing && !demo.watch);
  const reset = (angle = initial) => {
    sim.current = { angle: (angle * Math.PI) / 180, velocity: 0, time: 0 };
    setState(sim.current);
    trace.current = [];
    setPoints('');
  };
  const directed = useRef({ episode: -1, run: -1 });
  useEffect(() => {
    if (!demo.watch) return;
    const target = Math.max(0, demo.time - demo.chapters[episode].at - (episode === 0 ? 4 : 0));
    if (
      directed.current.episode !== episode ||
      directed.current.run !== demo.run ||
      target < sim.current.time
    ) {
      reset(initial);
      directed.current = { episode, run: demo.run };
    }
    while (sim.current.time + 1 / 120 <= target) {
      sim.current = stepPendulum(sim.current, 1 / 120, length, gravity, damping);
      if (Math.round(sim.current.time * 120) % 4 === 0) {
        trace.current.push(sim.current.angle);
        if (trace.current.length > 160) trace.current.shift();
      }
    }
    setState({ ...sim.current });
    setPoints(trace.current.map((v, i) => `${38 + i * 3.45},${374 - v * 22}`).join(' '));
  }, [demo.watch, demo.run, demo.time, episode, initial, length, gravity, damping]);
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
        <h2>{t('先把摆球拉向一边，再松手。')}</h2>
        <div className="lab-actions">
          <button
            className={`btn ${playing ? '' : 'primary'}`}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? t('Ⅱ 暂停') : t('▷ 释放钟摆')}
          </button>
          <button
            className="btn"
            onClick={() => {
              setPlaying(false);
              reset();
            }}
          >
            {t('↻ 重置')}
          </button>
        </div>
      </div>
      <div className="lab-grid">
        <div className="lab-scene">
          <span className="scene-label">{t('THE PENDULUM / 单摆')}</span>
          <div className="pendulum-object" data-observation={demo.watch ? c : undefined}>
            <PendulumStudio
              angle={state.angle}
              length={length}
              mass={mass}
              showForces={demo.watch && c === 1}
              onDrag={(angle) => {
                if (demo.watch) return;
                setInitial(Math.round(angle));
                setPlaying(false);
                reset(angle);
              }}
              onRelease={() => {
                if (!demo.watch) setPlaying(true);
              }}
            />
          </div>
          <div className="pendulum-readout">
            <span>θ</span>
            <strong>
              {((state.angle * 180) / Math.PI).toFixed(1)}
              <small>°</small>
            </strong>
            <p>
              {demo.watch
                ? t(
                    '{0} m · {1}',
                    length.toFixed(1),
                    damping < 0.01 ? `${gravity.toFixed(2)} m/s²` : t('增加阻尼'),
                  )
                : t('拉起摆球，然后松手。')}
            </p>
          </div>
          <svg className="pendulum-trace" viewBox="0 330 640 90" aria-label={t('实时角度轨迹')}>
            <path d="M38 374H590" stroke="#cdd3c1" />
            <polyline points={points} stroke="#ae8748" strokeWidth="1.6" fill="none" />
            <text x="40" y="404" fill="#9b9e8b" fontSize="10">
              ANGLE / TIME
            </text>
            <text x="555" y="404" fill="#9b9e8b" fontSize="10">
              {state.time.toFixed(1)}s
            </text>
          </svg>
          {demo.watch && c >= 2 && (
            <div className="pendulum-energy-live" aria-label={t('能量交换')}>
              <span>
                {t('势能')} <b>{energy.potential.toFixed(2)} J</b>
              </span>
              <div>
                <i style={{ width: `${(100 * energy.potential) / maxEnergy}%` }} />
                <i style={{ width: `${(100 * energy.kinetic) / maxEnergy}%` }} />
                <i style={{ flex: 1 }} />
              </div>
              <span>
                {t('动能')} <b>{energy.kinetic.toFixed(2)} J</b>
              </span>
            </div>
          )}
        </div>
        <div className="lab-controls">
          <Range
            label={t('摆长')}
            value={length}
            min={0.5}
            max={2.2}
            step={0.1}
            unit="m"
            onChange={(v) => change(setLength, v)}
          />
          <Range
            label={t('起始角度')}
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
            label={t('摆球质量')}
            value={mass}
            min={0.5}
            max={3}
            step={0.1}
            unit="kg"
            onChange={setMass}
          />
          <Range
            label={t('阻尼')}
            value={damping}
            min={0}
            max={0.5}
            step={0.01}
            onChange={setDamping}
          />
          <div>
            <span className="lab-subtitle">{t('换一个星球')}</span>
            <Segments
              label={t('重力环境')}
              value={gravity === 9.81 ? 'earth' : 'moon'}
              options={[
                { value: 'earth', label: t('地球') },
                { value: 'moon', label: t('月球') },
              ]}
              onChange={(v) => change(setGravity, v === 'earth' ? 9.81 : 1.62)}
            />
          </div>
          <div className="pendulum-energy">
            <div className="energy-label">
              <span>{t('势能')}</span>
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
              <span>{t('动能')}</span>
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
          label={t('小角度近似周期')}
          value={smallAnglePeriod(length, gravity).toFixed(2)}
          unit="s"
        />
        <Metric label={t('机械能')} value={total.toFixed(2)} unit="J" />
        <Metric label={t('重力加速度')} value={gravity.toFixed(2)} unit="m/s²" />
      </div>
      <p className="lab-caption">
        <strong>{t('试试看：')}</strong>
        {t(
          '把质量翻倍，周期会变吗？这里使用非线性单摆方程计算运动；周期读数是小角度近似。参数改变代表重新设置实验，阻尼把机械能转移到环境。',
        )}
      </p>
    </div>
  );
}
