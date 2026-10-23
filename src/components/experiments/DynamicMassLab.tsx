import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  dynamicMassState,
  dynamicMassComparison,
  dynamicMassGeometry,
  dynamicMassFilm,
  type DynamicMassView,
} from '../../models/dynamic-mass-lab';
import '../../styles/dynamic-mass-lab.css';
function Cabin({
  time,
  mass,
  force,
  pull = true,
}: {
  time: number;
  mass: number;
  force: number;
  pull?: boolean;
}) {
  const id = useId().replace(/:/g, ''),
    s = dynamicMassState(time, mass, force),
    g = dynamicMassGeometry(s.position),
    { arm, wall } = g,
    bx = g.platformX,
    ex = g.jointX;
  return (
    <svg
      viewBox="0 0 360 278"
      data-dynamic-apparatus="true"
      data-observation-time={s.time}
      data-position={s.position}
      role="img"
      aria-label={t('宇航员固定在折叠支架上，恒力绳牵引支架，固定光栅记录位移')}
    >
      <defs>
        <linearGradient id={`${id}wall`}>
          <stop stopColor="#e0e7df" />
          <stop offset="1" stopColor="#f4f4ec" />
        </linearGradient>
        <linearGradient id={`${id}suit`}>
          <stop stopColor="#e4e8df" />
          <stop offset="1" stopColor="#bccdbd" />
        </linearGradient>
      </defs>
      <path d="M16 20Q16 10 28 10H52V222H28Q16 222 16 210Z" fill={`url(#${id}wall)`} />
      {[37, 73, 109, 145, 181, 210].map((y) => (
        <path key={y} d={`M26 ${y}H42`} stroke="#c5d0c3" strokeWidth="2" />
      ))}
      <path
        d={`M${wall} 118L${ex} ${118 - arm.rise * 300}L${bx} 118L${ex} ${118 + arm.rise * 300}Z`}
        stroke="#a6b7a7"
        strokeWidth="7"
        fill="none"
        strokeLinejoin="round"
      />
      {[
        [wall, 118],
        [ex, 118 - arm.rise * 300],
        [ex, 118 + arm.rise * 300],
        [bx, 118],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="#d4dece" stroke="#8ea58f" strokeWidth="1.4" />
      ))}
      <circle cx="60" cy="118" r="13" fill="#bdcbb5" stroke="#8fa17d" />
      <circle cx="60" cy="118" r="7" stroke="#e5ebdf" fill="none" />
      <path d={`M60 118H${bx}`} stroke="#aa966f" strokeWidth="1.5" />
      <path d={`M${bx} 67V199`} stroke="#829a8c" strokeWidth="8" strokeLinecap="round" />
      <g transform={`translate(${bx} 0)`}>
        <path
          d="M10 98Q32 87 43 103L48 151Q34 167 12 151Z"
          fill={`url(#${id}suit)`}
          stroke="#9caf9b"
        />
        <path
          d="M19 153L33 186L64 195M40 153L55 179L80 184"
          fill="none"
          stroke="#bfd0bf"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M64 195l12 3M80 184l12 3"
          stroke="#829889"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M17 108L38 128L60 118M39 107L58 124"
          stroke="#c8d7c3"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M10 104L42 143M42 102L12 144" stroke="#a29476" strokeWidth="4" />
        <path d="M19 94V84H34V97" fill="#dcc7ab" />
        <ellipse cx="27" cy="71" rx="16" ry="19" fill="#dbc8b1" />
        <path d="M12 69Q8 46 28 50Q46 50 43 68L39 59L19 60Z" fill="#829087" />
        <path d="M0 194V232" stroke="#8ba28f" strokeWidth="3" />
        <rect
          x="-7"
          y="226"
          width="14"
          height="13"
          rx="3"
          fill={s.signal ? '#b6c894' : '#859c83'}
          stroke="#738e77"
        />
      </g>
      <rect x="176" y="241" width="86" height="14" rx="3" fill="#e5dfca" />
      {Array.from({ length: 26 }, (_, i) => (
        <path
          key={i}
          d={`M${255 - i * 3} 243v10`}
          stroke={i % 2 ? '#e6dfcb' : '#8da189'}
          strokeWidth="2"
        />
      ))}
      <path d={`M${bx} 239V248`} stroke="#bb9560" strokeWidth="2" />
      <path d="M255 264H180m5-4-5 4 5 4" stroke="#9db08b" fill="none" />
      {pull ? (
        <path d={`M${bx - 14} 118h-35m7-5-7 5 7 5`} stroke="#ab895c" strokeWidth="2" fill="none" />
      ) : null}
    </svg>
  );
}
function Evidence({
  width,
  time,
  mass,
  force,
  view,
  reveal,
}: {
  width: number;
  time: number;
  mass: number;
  force: number;
  view: 'encoder' | 'velocity';
  reveal: boolean;
}) {
  const s = dynamicMassState(time, mass, force),
    end = Number.isFinite(s.endTime) ? Math.max(1.6, s.endTime) : 2.4,
    x = (t: number) => 36 + (t / end) * (width - 58),
    y = (v: number) => 170 - (v / 0.75) * 110;
  return (
    <svg
      viewBox={`0 0 ${width} 208`}
      role="img"
      aria-label={t('等距光栅的时间记录与速度斜率')}
      data-dynamic-evidence={view}
    >
      {view === 'encoder' ? (
        <>
          <text x={width / 2} y={20} textAnchor="middle">
            {t('每过2厘米，留下同一时钟的读数')}
          </text>
          <path d={`M28 54H${width - 22}`} stroke="#bdcbb8" strokeWidth="10" />
          {Array.from({ length: 13 }, (_, i) => (
            <path
              key={i}
              d={`M${width - 25 - (i * (width - 58)) / 12} 44v20`}
              stroke="#879d86"
              strokeWidth="2"
            />
          ))}
          <path
            data-reader-x={s.position}
            d={`M${width - 25 - (s.position / 0.24) * (width - 58)} 29v16m-5-5 5 5 5-5`}
            stroke="#b29363"
            fill="none"
            strokeWidth="2"
          />
          <text x={28} y={101}>
            t / s
          </text>
          <path d={`M28 150H${width - 22}`} stroke="#ccd6c6" />
          {s.crossings.map((q, i) => (
            <g key={i}>
              <path d={`M${x(q.time)} 121v29`} stroke="#a68b60" strokeWidth="2" />
              <circle cx={x(q.time)} cy={150} r="3" fill="#a68b60" />
            </g>
          ))}
          <text x={28} y={192}>
            {t('已记录位置')} {s.crossings.length}
          </text>
        </>
      ) : (
        <>
          <text x={28} y={20}>
            v / (m/s)
          </text>
          <path d={`M36 38V170H${width - 18}`} stroke="#bccbb4" fill="none" />
          {[0, 0.2, 0.4, 0.6].map((v) => (
            <g key={v}>
              <text x={27} y={y(v) + 5} textAnchor="end">
                {v.toFixed(1)}
              </text>
              <path d={`M36 ${y(v)}H${width - 18}`} stroke="#e5e9df" />
            </g>
          ))}
          <path
            d={`M36 170L${x(s.time)} ${y(s.velocity)}`}
            stroke="#a8b99b"
            strokeWidth="1.5"
            fill="none"
          />
          {s.intervals.map((q, i) => (
            <circle key={i} cx={x(q.time)} cy={y(q.velocity)} r="3.8" fill="#7d987d" />
          ))}
          {reveal && s.intervals.length > 1 && (
            <path
              d={`M${x(s.intervals[0].time)} ${y(s.intervals[0].velocity)}H${x(s.intervals.at(-1)!.time)}V${y(s.intervals.at(-1)!.velocity)}`}
              stroke="#b2996f"
              strokeDasharray="4 3"
              fill="none"
            />
          )}
          <text x={width - 18} y={202} textAnchor="end">
            t / s
          </text>
          <text x={width - 22} y={50} textAnchor="end">
            a ={' '}
            {!reveal
              ? '?'
              : s.measuredAcceleration === null
                ? '—'
                : s.measuredAcceleration.toFixed(3)}{' '}
            m/s²
          </text>
        </>
      )}
    </svg>
  );
}
export default function DynamicMassLab() {
  const film = useShowcase(),
    { host, width } = useSignalWidth(),
    locale = browserLocale(),
    authored = dynamicMassFilm(film.chapter, film.chapterTime, locale),
    [manual, setManual] = useState<Partial<typeof authored>>({});
  const current = film.watch ? authored : { ...authored, ...manual },
    state = {
      ...current,
      time: current.view === 'comparison' ? Math.min(1, current.time) : current.time,
    },
    comparison = dynamicMassComparison(state.time, state.force),
    s = dynamicMassState(state.time, state.mass, state.force),
    view = state.view;
  const set = <K extends keyof typeof authored>(key: K, value: (typeof authored)[K]) =>
    setManual((p) => ({ ...p, [key]: value }));
  const labels: Record<DynamicMassView, string> = {
    apparatus: '折叠支架',
    encoder: '光栅计时',
    velocity: '速度与斜率',
    mass: '扣除平台',
    comparison: '同力比较',
  };
  return (
    <section
      className="dynamic-mass-lab"
      data-dynamic-view={view}
      data-mass={state.mass}
      data-force={state.force}
      data-time={view === 'comparison' ? comparison.time : state.time}
      data-requested-time={state.time}
      data-comparison-limited={view === 'comparison' && comparison.limited}
      data-reveal={state.reveal}
    >
      <div className="dynamic-mass-stage" ref={host}>
        {view === 'apparatus' ? (
          <>
            <div className="dynamic-mass-kicker">
              F = {state.force.toFixed(0)} N · {t('恒力原理重建')}
            </div>
            <div className="dynamic-mass-cabin">
              <Cabin
                time={state.time}
                mass={state.mass}
                force={state.force}
                pull={film.chapter > 0 || !film.watch}
              />
            </div>
            <div className="dynamic-mass-foot">
              t = {s.time.toFixed(3)} s · x = {(s.position * 100).toFixed(1)} cm
            </div>
          </>
        ) : null}
        {view === 'encoder' || view === 'velocity' ? (
          <>
            <Evidence
              width={width}
              time={state.time}
              mass={state.mass}
              force={state.force}
              view={view}
              reveal={state.reveal}
            />
            <div className="dynamic-mass-foot">
              {view === 'encoder'
                ? t('等距标记，时间间隔逐渐缩短')
                : state.reveal
                  ? 'a = Δv / Δt'
                  : t('平均速度位于该段中点时刻')}
            </div>
          </>
        ) : null}
        {view === 'mass' ? (
          <div className="dynamic-mass-inference">
            <p>{t('全部随动质量')}</p>
            <strong>
              {state.force} /{' '}
              {s.measuredAcceleration === null ? '—' : s.measuredAcceleration.toFixed(3)} ≈{' '}
              {s.measuredMass === null ? '—' : (s.measuredMass + 6).toFixed(1)} kg
            </strong>
            {state.subtract && (
              <div className="dynamic-mass-parts">
                <span>
                  {t('人体')}
                  <b>{s.measuredMass === null ? '?' : s.measuredMass.toFixed(1)} kg</b>
                </span>
                <span>＋</span>
                <span>
                  {t('平台')}
                  <b>6 kg</b>
                </span>
              </div>
            )}
            <p>{state.subtract ? 'm = F/a − 6 kg' : 'M = F/a'}</p>
          </div>
        ) : null}
        {view === 'comparison' ? (
          <>
            <div className="dynamic-mass-kicker">
              {state.reveal ? t('同样的力，同一个时刻') : t('谁加速更慢？')} · {state.force} N
            </div>
            <div className="dynamic-mass-pair">
              {comparison.states.map((q) => {
                const m = q.mass;
                return (
                  <div key={m}>
                    <div>{m} kg</div>
                    <Cabin time={comparison.time} mass={m} force={state.force} />
                    <div>{state.reveal ? `a = ${q.acceleration.toFixed(3)}` : 'a = ?'}</div>
                  </div>
                );
              })}
            </div>
            <div className="dynamic-mass-foot">
              {t('加速度单位')} m/s² · t = {comparison.time.toFixed(3)} s
            </div>
          </>
        ) : null}
      </div>
      {!film.watch && (
        <div className="dynamic-mass-controls">
          <Segments
            label={t('观察对象')}
            value={view}
            onChange={(v) => set('view', v)}
            options={(Object.keys(labels) as DynamicMassView[]).map((value) => ({
              value,
              label: t(labels[value]),
            }))}
          />
          {view !== 'comparison' && (
            <Range
              label={t('人体质量')}
              value={state.mass}
              min={40}
              max={100}
              step={1}
              unit="kg"
              onChange={(v) => set('mass', v)}
            />
          )}
          <Range
            label={t('恒定拉力')}
            value={state.force}
            min={0}
            max={40}
            step={1}
            unit="N"
            onChange={(v) => set('force', v)}
          />
          <Range
            label={
              view === 'comparison'
                ? locale === 'en'
                  ? 'Requested time'
                  : '请求时刻'
                : t('模型时间')
            }
            value={state.time}
            min={0}
            max={view === 'comparison' ? 1 : 2.4}
            step={0.01}
            unit="s"
            onChange={(v) => set('time', v)}
          />
          {!state.reveal && <button onClick={() => set('reveal', true)}>{t('揭晓比较')}</button>}
          <details>
            <summary>{t('模型范围')}</summary>
            <p>
              {t('支架原理示意；连杆质量忽略，平台等效质量6 kg。测量终点停帧，影片按模型秒慢放。')}
            </p>
            <p>{t('光栅记录与运动来自同一理想模型，不是历史测量数据。')}</p>
            {view === 'comparison' && (
              <p>
                {locale === 'en'
                  ? 'Both trials share the displayed observation time. When either reaches the 0.25 m stroke limit, both freeze at that instant; requested later times do not advance either trial. This does not model braking or collision.'
                  : '两侧使用显示的同一观察时刻；任一侧到达0.25 m行程终点时，两侧共同停帧。请求更晚时刻也不会使任何一侧继续前进；这里不模拟制动或碰撞。'}
              </p>
            )}
          </details>
        </div>
      )}
    </section>
  );
}
