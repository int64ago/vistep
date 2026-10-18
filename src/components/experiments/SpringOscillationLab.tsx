import { useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  springState,
  springSamples,
  measuredSpringPeriod,
  pencilTrace,
} from '../../models/spring-oscillation-lab';
import '../../styles/spring-oscillation-lab.css';
type Mode = 'horizontal' | 'vertical' | 'pencil' | 'amplitude' | 'phase' | 'mass' | 'length';
function coil(x: number, y: number, length: number, vertical = true, turns = 12) {
  return Array.from({ length: turns * 16 + 1 }, (_, i) => {
    const q = i / (turns * 16),
      w = q < 0.04 || q > 0.96 ? 0 : 9 * Math.sin(q * turns * Math.PI * 2);
    return `${i ? 'L' : 'M'}${vertical ? x + w : x + q * length},${vertical ? y + q * length : y + w}`;
  }).join(' ');
}
function Spring({
  x,
  time,
  mass,
  length,
  amplitude,
  delay = 0,
  color = '#839977',
}: {
  x: number;
  time: number;
  mass: number;
  length: number;
  amplitude: number;
  delay?: number;
  color?: string;
}) {
  const s = springState(time, mass, length, amplitude, delay),
    radius = 18 * Math.cbrt(mass / 0.2),
    y = 43 + 400 * (s.equilibrium + s.x) + radius;
  return (
    <g>
      <path d={`M${x - 32} 38h64`} stroke="#a6b299" strokeWidth="8" strokeLinecap="round" />
      <path
        d={coil(x, 43, y - radius - 43, true, Math.round(12 * length))}
        fill="none"
        stroke={color}
        strokeWidth="3"
      />
      <circle cx={x} cy={y} r={radius} fill={color} />
      <path
        d={`M${x - 32} ${43 + 400 * s.equilibrium + radius}h64`}
        stroke="#bdab87"
        strokeDasharray="3 5"
      />
      {s.held && (
        <path
          d={`M${x - 28} ${y + 19}h56`}
          stroke="#c1ab87"
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}
      <text x={x} y="282" textAnchor="middle">
        {mass.toFixed(2)} kg
      </text>
    </g>
  );
}
export default function SpringOscillationLab() {
  const film = useShowcase(),
    initial: Mode =
      film.variant === 'e1-pencil-trace'
        ? 'pencil'
        : film.variant === 'e1-oscillator-phase'
          ? 'phase'
          : film.variant === 'e1-spring-period-amplitude'
            ? 'amplitude'
            : film.variant === 'e1-spring-period-research'
              ? 'mass'
              : 'horizontal',
    [selected, setSelected] = useState<Mode>(initial),
    [mass, setMass] = useState(0.2),
    [length, setLength] = useState(1),
    [amplitude, setAmplitude] = useState(0.05),
    [delay, setDelay] = useState(0.25),
    [progress, setProgress] = useState(0),
    [paperSpeed, setPaperSpeed] = useState(0.05),
    [error, setError] = useState(0),
    [records, setRecords] = useState<{ m: number; l: number; T: number }[]>([]),
    c = film.chapter,
    p = film.watch ? film.chapterProgress : progress,
    mode: Mode = film.watch
      ? (
          [
            'horizontal',
            'vertical',
            'pencil',
            'amplitude',
            'amplitude',
            'phase',
            'phase',
            'mass',
            'length',
          ] as Mode[]
        )[Math.min(c, 8)]
      : selected,
    trial = Math.min(2, Math.floor(p * 3)),
    m = film.watch ? (mode === 'mass' ? [0.1, 0.2, 0.4][trial] : 0.2) : mass,
    l = film.watch ? (mode === 'length' ? [1, 0.75, 0.5][trial] : 1) : length,
    A = film.watch ? (c === 4 ? 0.025 : 0.05) : amplitude,
    base = springState(0, m, l, A),
    research = mode === 'mass' || mode === 'length',
    phase = mode === 'phase',
    timing = mode === 'amplitude' || research,
    u = research && film.watch ? p * 3 - trial : p,
    time = (timing ? 10 * base.period : 2 * base.period) * Math.min(1, u / 0.88),
    delayTime = phase ? (film.watch ? (c === 6 ? 0.25 : 0) : delay) * base.period : 0,
    s = springState(mode === 'vertical' ? time + base.period / 2 : time, m, l, A),
    dt = mode === 'horizontal' ? 0.05 : 0.04,
    samples = springSamples(time, dt, m, l, A).map((a) =>
      mode === 'vertical' ? { ...a, x: -a.x, v: -a.v } : a,
    ),
    complete = time >= 10 * base.period - 1e-8,
    measured = measuredSpringPeriod(m, l, 10, film.watch ? 0 : error),
    caption =
      mode === 'horizontal'
        ? '每隔 0.05 秒留下一个位置，再把位置放回时间轴'
        : mode === 'vertical'
          ? '画面上端对齐，每隔 0.04 秒取钢球中心的位置'
          : mode === 'pencil'
            ? '笔尖只上下振动；纸张匀速横移，把时间变成距离'
            : mode === 'amplitude'
              ? '从同一状态计满十个周期，再把振幅减半比较'
              : mode === 'phase'
                ? '第二球被托住到释放时刻；之后两球周期相同，步调可以不同'
                : mode === 'mass'
                  ? '保持同一根弹簧，只改变悬挂质量'
                  : '取同一根均匀弹簧的不同长度：越短，劲度系数越大';
  const plot = samples
      .map((a, i) => `${i ? 'L' : 'M'}${35 + (330 * a.time) / (2 * base.period)},${75 - 900 * a.x}`)
      .join(' '),
    history = records;
  return (
    <section
      className="so-film"
      data-watch={film.watch || undefined}
      data-chapter={film.chapter}
      data-focus={film.watch && (c === 0 || c === 1) && p >= 0.4 ? 'record' : 'apparatus'}
    >
      <p className="so-caption">{t(caption)}</p>
      {mode === 'pencil' ? (
        <svg
          viewBox="0 0 400 290"
          className="so-apparatus"
          role="img"
          aria-label={t('笔尖沿竖直方向振动，纸张向左匀速运动，纸上留下波形')}
        >
          <rect x="24" y="52" width="352" height="188" rx="12" fill="#f1eddf" />
          <path d="M36 145H365" stroke="#c8b995" strokeDasharray="4 5" />
          {Array.from({ length: 11 }, (_, i) => {
            const x = 350 - 1000 * paperSpeed * time + i * 40;
            return x > 30 && x < 370 ? <path key={i} d={`M${x} 56v181`} stroke="#dfd5bb" /> : null;
          })}
          <path
            d={Array.from({ length: 181 }, (_, i) => {
              const at = (time * i) / 180,
                a = pencilTrace(at, paperSpeed);
              return `${i ? 'L' : 'M'}${350 - 1000 * paperSpeed * (time - at)},${145 - 900 * a.x}`;
            }).join(' ')}
            stroke="#a1845b"
            strokeWidth="3"
            fill="none"
          />
          <path d={`M350 ${145 - 900 * s.x}l-8-41 16 0Z`} fill="#bb985f" />
          <path d="M160 258h-70l12-7m-12 7 12 7" fill="none" stroke="#a89b7b" strokeWidth="3" />
          <text x="204" y="268">
            {(paperSpeed * 100).toFixed(0)} cm/s
          </text>
        </svg>
      ) : (
        <svg
          viewBox={mode === 'horizontal' ? '0 0 400 210' : '0 0 400 305'}
          className="so-apparatus"
          role="img"
          aria-label={t('弹簧的真实长度由静态伸长和瞬时位移共同确定，球心位置对应记录点')}
        >
          {mode === 'horizontal' ? (
            <>
              <path
                d="M40 63v89M40 108H370"
                stroke="#adbaa1"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d={coil(40, 108, 180 + 900 * s.x - 18 - 40, false)}
                stroke="#839977"
                fill="none"
                strokeWidth="3"
              />
              <circle cx={180 + 900 * s.x} cy="108" r="18" fill="#839977" />
              <path d="M180 80v65" stroke="#c6af83" strokeDasharray="4 5" />
              <text x="180" y="175" textAnchor="middle">
                O
              </text>
              <rect x="313" y="38" width="50" height="32" rx="8" fill="#b5c1a6" />
              <circle cx="336" cy="54" r="11" fill="#718567" />
              <text x="200" y="203" textAnchor="middle">
                Δt = 0.05 s
              </text>
            </>
          ) : (
            <>
              <Spring
                x={phase ? 126 : 200}
                time={mode === 'vertical' ? time + base.period / 2 : time}
                mass={m}
                length={l}
                amplitude={A}
              />
              {phase && (
                <Spring
                  x={274}
                  time={time}
                  mass={m}
                  length={l}
                  amplitude={A}
                  delay={delayTime}
                  color="#b89968"
                />
              )}
              {mode === 'vertical' && (
                <g>
                  <rect x="299" y="139" width="66" height="43" rx="10" fill="#bac7ad" />
                  <circle cx="326" cy="159" r="14" fill="#768b69" />
                  <path d="M331 183l-20 70m20-70 20 70" stroke="#a6b49c" strokeWidth="3" />
                </g>
              )}
            </>
          )}
        </svg>
      )}
      {(mode === 'horizontal' || mode === 'vertical') && (
        <>
          <div className="so-frames">
            {samples.slice(-4).map((a) => (
              <div key={a.time}>
                <svg viewBox="0 0 80 110" role="img" aria-label={`${a.time.toFixed(2)} s`}>
                  <path d={mode === 'horizontal' ? 'M7 55H73' : 'M40 9V99'} stroke="#d2ddc5" />
                  {mode === 'horizontal' ? (
                    <circle cx={40 + 500 * a.x} cy="55" r="6" fill="#869c75" />
                  ) : (
                    <circle cx="40" cy={55 + 500 * a.x} r="6" fill="#869c75" />
                  )}
                </svg>
                <span>{a.time.toFixed(2)} s</span>
              </div>
            ))}
          </div>
          <svg
            viewBox="0 0 400 165"
            className="so-plot"
            role="img"
            aria-label={t('相同位置样本绘成的位移时间图；曲线不是小球在空间里的路径')}
          >
            <path d="M35 13V140M35 75H376" stroke="#bac7aa" />
            <path d={plot} stroke="#a98f64" fill="none" strokeWidth="2" />
            {samples.map((a) => (
              <circle
                key={a.time}
                cx={35 + (330 * a.time) / (2 * base.period)}
                cy={75 - 900 * a.x}
                r="2.8"
                fill="#7b916d"
              />
            ))}
            <text x="15" y="23">
              x
            </text>
            <text x="373" y="99">
              t
            </text>
            <text x="32" y="159">
              0
            </text>
            <text x="311" y="159">
              {(2 * base.period).toFixed(2)} s
            </text>
          </svg>
        </>
      )}
      <div className="so-reading">
        <span>
          {t('模型时间')} {time.toFixed(2)} s
        </span>
        {timing ? (
          <>
            <span>n = {Math.min(10, Math.floor(time / base.period + 1e-8))} / 10</span>
            <span>T = {complete ? measured.period.toFixed(3) : '—'} s</span>
          </>
        ) : phase ? (
          <span>Δt = {(delayTime / base.period).toFixed(2)} T</span>
        ) : (
          <span>x = {(s.x * 100).toFixed(2)} cm</span>
        )}
      </div>
      {research && (
        <>
          <p className="so-note">{t('理想模型计时数据；不是实体实验测得的结果')}</p>
          <table className="so-table">
            <thead>
              <tr>
                <th>m / kg</th>
                <th>k / N·m⁻¹</th>
                <th>T² / s²</th>
              </tr>
            </thead>
            <tbody>
              {(film.watch
                ? Array.from({ length: trial + (complete ? 1 : 0) }, (_, i) => ({
                    m: mode === 'mass' ? [0.1, 0.2, 0.4][i] : 0.2,
                    l: mode === 'length' ? [1, 0.75, 0.5][i] : 1,
                    T: springState(
                      0,
                      mode === 'mass' ? [0.1, 0.2, 0.4][i] : 0.2,
                      mode === 'length' ? [1, 0.75, 0.5][i] : 1,
                    ).period,
                  }))
                : history
              ).map((r, i) => (
                <tr key={i}>
                  <td>{r.m.toFixed(2)}</td>
                  <td>{(20 / r.l).toFixed(1)}</td>
                  <td>{(r.T * r.T).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {!film.watch && (
        <div className="so-controls">
          <Segments
            label={t('选择记录与对照实验')}
            value={selected}
            options={(
              [
                ['horizontal', '水平频闪'],
                ['vertical', '竖直录像'],
                ['pencil', '铅笔拖纸'],
                ['amplitude', '振幅与周期'],
                ['phase', '延迟释放'],
                ['mass', '改变质量'],
                ['length', '改变弹簧长度'],
              ] as [Mode, string][]
            ).map(([value, label]) => ({ value, label: t(label) }))}
            onChange={(v) => {
              setSelected(v as Mode);
              setProgress(0);
            }}
          />
          <Range
            label={t('振幅')}
            value={amplitude}
            min={0.02}
            max={0.07}
            step={0.005}
            unit="m"
            onChange={setAmplitude}
          />
          {phase && (
            <Range
              label={t('第二球释放延迟')}
              value={delay}
              min={0}
              max={0.75}
              step={0.05}
              unit="T"
              onChange={setDelay}
            />
          )}
          {mode === 'pencil' && (
            <Range
              label={t('纸张速度')}
              value={paperSpeed}
              min={0.03}
              max={0.1}
              step={0.01}
              unit="m/s"
              onChange={setPaperSpeed}
            />
          )}
          {research && (
            <>
              <Range
                label={t('悬挂质量')}
                value={mass}
                min={0.1}
                max={0.4}
                step={0.05}
                unit="kg"
                onChange={setMass}
              />
              <Range
                label={t('保留的弹簧长度比例')}
                value={length}
                min={0.5}
                max={1}
                step={0.05}
                unit="×"
                onChange={setLength}
              />
            </>
          )}
          {timing && (
            <Range
              label={t('累计计时误差')}
              value={error}
              min={-0.3}
              max={0.3}
              step={0.05}
              unit="s"
              onChange={setError}
            />
          )}
          <Range
            label={t('逐帧观察实验')}
            value={progress}
            min={0}
            max={1}
            step={0.001}
            unit="×"
            onChange={setProgress}
          />
          {research && (
            <button
              type="button"
              disabled={!complete}
              onClick={() => setRecords((r) => [...r.slice(-5), { m, l, T: measured.period }])}
            >
              {t('保存本次计时')}
            </button>
          )}
        </div>
      )}
      <details className="so-details">
        <summary>{t('记录方法与模型边界')}</summary>
        <p>
          {t(
            '忽略弹簧质量与阻力，采用线性胡克定律。竖直装置的原点是悬挂后静止的球心，不是弹簧原长末端。均匀弹簧截短时有效圈数随长度变化，劲度系数与所取长度成反比。照片、计时和曲线均来自同一轨迹；真实记录仍有标尺、帧率、视差与启停误差。',
          )}
        </p>
      </details>
    </section>
  );
}
