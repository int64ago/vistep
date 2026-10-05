import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  JELLY,
  JELLY_DEFAULT,
  jellyFrame,
  jellyRun,
  jellyShot,
  type JellyFrame,
  type JellyView,
} from '../../models/jellyfish';
import { useShowcase } from '../lab/Showcase';
import JellyfishStudio from '../three/JellyfishStudio';
import JellyfishFlat from '../three/JellyfishFlat';
import { jellyOralPoint, jellyOutline } from '../../models/jellyfish-geometry';
import '../../styles/jellyfish.css';
const stageNames = { contract: '收缩', relax: '放松回填', rest: '完全舒张' };
function PulseStrip({ frame }: { frame: JellyFrame }) {
  return (
    <div className="jelly-pulse-strip" aria-label={t('一个游动周期的阶段')}>
      {(['contract', 'relax', 'rest'] as const).map((stage, index) => (
        <span
          key={stage}
          data-active={frame.stage === stage}
          style={{ flex: [0.25, 0.47, 0.28][index] }}
        >
          {t(stageNames[stage])}
        </span>
      ))}
      <i style={{ left: `${frame.phase * 100}%` }} />
    </div>
  );
}
function VelocityTrace({
  trace,
  reference,
  frame,
}: {
  trace: JellyFrame[];
  reference: JellyFrame[];
  frame: JellyFrame;
}) {
  const end = trace.at(-1)!.time,
    max = Math.max(0.001, ...trace.map((f) => f.speed)),
    width = 560,
    height = 124;
  const line = (run: JellyFrame[]) =>
    'M' +
    run
      .filter((f, i) => i % 8 === 0 || i === run.length - 1)
      .map(
        (f) =>
          `${(8 + (f.time / end) * (width - 16)).toFixed(2)},${(height - 12 - (f.speed / max) * (height - 25)).toFixed(2)}`,
      )
      .join(' L');
  const x = 8 + (frame.time / end) * (width - 16),
    y = height - 12 - (frame.speed / max) * (height - 25);
  const restWindows: { start: number; end: number }[] = [];
  let restStart: number | null = null;
  trace.forEach((f, i) => {
    if (f.stage === 'rest' && restStart === null) restStart = f.time;
    if (restStart !== null && (f.stage !== 'rest' || i === trace.length - 1)) {
      restWindows.push({ start: restStart, end: f.time });
      restStart = null;
    }
  });
  return (
    <div className="jelly-velocity">
      <div className="jelly-trace-label">
        <span>{t('教学模型速度')}</span>
        <span>{t('相同伞运动与阻力')}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={t('有回收项与仅有惯性阻力的速度比较')}
      >
        {restWindows.map((window) => (
          <rect
            key={window.start}
            data-rest-start={window.start}
            data-rest-end={window.end}
            x={8 + (window.start / end) * (width - 16)}
            y="0"
            width={((window.end - window.start) / end) * (width - 16)}
            height={height}
            fill="#d6b36b"
            fillOpacity=".07"
          />
        ))}
        <path d={`M8 ${height - 12}H${width - 8}`} stroke="#a0b9c0" strokeOpacity=".24" />
        <path
          d={line(reference)}
          fill="none"
          stroke="#7e91a1"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        <path d={line(trace)} fill="none" stroke="#cdb37b" strokeWidth="2.5" />
        <path d={`M${x} 0V${height - 12}`} stroke="#bddce0" strokeOpacity=".35" />
        <circle cx={x} cy={y} r="4" fill="#dfc994" />
      </svg>
      <div className="jelly-trace-legend">
        <span>
          <i />
          {t('计入回收项')}
        </span>
        <span>
          <i />
          {t('移除回收项')}
        </span>
      </div>
    </div>
  );
}
function Comparison({
  trace,
  reference,
  frame,
}: {
  trace: JellyFrame[];
  reference: JellyFrame[];
  frame: JellyFrame;
}) {
  const other = jellyFrame(reference, frame.time),
    maximum = trace.at(-1)!.distance;
  return (
    <div className="jelly-comparison">
      <div className="jelly-comparison-title">{t('伞的动作完全相同，差别只在回收项')}</div>
      {[frame, other].map((state, i) => (
        <div className="jelly-distance-row" key={i}>
          <span>{t(i ? '移除回收项' : '计入回收项')}</span>
          <div className="jelly-distance-lane">
            <i style={{ width: `${(state.distance / Math.max(1e-9, maximum)) * 100}%` }} />
            <svg
              viewBox="0 0 60 44"
              style={{ left: `${(state.distance / Math.max(1e-9, maximum)) * 85}%` }}
              aria-hidden="true"
            >
              <path
                d={`${jellyOutline(state, 23, 30, 20)} Z`}
                fill="#a3ced4"
                fillOpacity=".42"
                stroke="#cae5e9"
                strokeWidth="1"
              />
              {Array.from({ length: 4 }, (_, arm) => (
                <path
                  key={arm}
                  d={
                    'M' +
                    Array.from({ length: 12 }, (_, i) => {
                      const p = jellyOralPoint(arm, i / 11, 0, state);
                      return `${30 + p[0] * 23},${20 - p[1] * 23}`;
                    }).join(' L')
                  }
                  stroke="#c2d9e0"
                  strokeWidth="1"
                  fill="none"
                />
              ))}
            </svg>
          </div>
          <b>{(state.distance * 1000).toFixed(1)} mm</b>
        </div>
      ))}
      <VelocityTrace trace={trace} reference={reference} frame={frame} />
      <p className="jelly-scope">
        {t('移除回收项是虚拟比较；数值来自未校准模型，不是月水母实测成绩。')}
      </p>
    </div>
  );
}
export default function Jellyfish() {
  const film = useShowcase(),
    id = useId(),
    [amplitude, setAmplitude] = useState(22),
    [period, setPeriod] = useState(2),
    [time, setTime] = useState(1.7),
    [recovery, setRecovery] = useState(true),
    [view, setView] = useState<JellyView>('vortices'),
    [section, setSection] = useState(false);
  const story = useMemo(() => jellyRun(), []),
    baseline = useMemo(() => jellyRun({ ...JELLY_DEFAULT, recovery: false }), []);
  const manual = useMemo(
    () => jellyRun({ amplitude: amplitude / 100, period, recovery }),
    [amplitude, period, recovery],
  );
  const manualWithRecovery = useMemo(
    () => jellyRun({ amplitude: amplitude / 100, period, recovery: true }),
    [amplitude, period],
  );
  const manualBase = useMemo(
    () => jellyRun({ amplitude: amplitude / 100, period, recovery: false }),
    [amplitude, period],
  );
  const directed = jellyShot(film.chapter, film.chapterProgress),
    shot = film.watch
      ? directed
      : { view, time, anatomy: view === 'animal', section: view !== 'animal', close: false },
    trace = film.watch ? story : manual,
    reference = film.watch ? baseline : manualBase;
  const frame = jellyFrame(trace, shot.time),
    visual = { frame, shot, watch: film.watch };
  const mode =
    frame.amplitude === 0
      ? '没有形变，模型没有排水或推进。'
      : frame.stage === 'contract'
        ? '伞缘向内，伞下体积减少'
        : frame.stage === 'relax'
          ? '弹性回弹，水重新进入伞下'
          : '伞已静止，水的运动还没有结束';
  return (
    <section className="jelly-study" data-view={shot.view} data-watch={film.watch}>
      <header className="jelly-species">
        <span>AURELIA AURITA</span>
        <b>{t('月水母的一次脉动')}</b>
      </header>
      {shot.view === 'compare' ? (
        <Comparison
          trace={film.watch ? story : manualWithRecovery}
          reference={reference}
          frame={jellyFrame(film.watch ? story : manualWithRecovery, shot.time)}
        />
      ) : (
        <>
          <div className="jelly-water-window">
            {section && !film.watch ? (
              <JellyfishFlat visual={visual} />
            ) : (
              <JellyfishStudio visual={visual} />
            )}
            {shot.anatomy && (
              <div className="jelly-anatomy-key">
                <span>
                  <i />
                  {t('四个马蹄形生殖腺')}
                </span>
                <span>{t('中央口腕与短伞缘触手')}</span>
              </div>
            )}
            {['vortices', 'pressure'].includes(shot.view) && (
              <div className="jelly-vortex-key">
                <span>
                  <i />
                  {t('起始涡')}
                </span>
                <span>
                  <i />
                  {t('停止涡')}
                </span>
                <small>{t('涡环位置与流向为示意')}</small>
              </div>
            )}
          </div>
          <PulseStrip frame={frame} />
          {shot.view === 'volume' && (
            <div className="jelly-volume">
              <span>
                {t('伞下模型体积')} <b>{(frame.volume * 1e6).toFixed(2)} mL</b>
              </span>
              <span>
                {t(frame.outflow > 0 ? '排出通量' : '回填通量')}{' '}
                <b>{((frame.outflow + frame.inflow) * 1e6).toFixed(2)} mL/s</b>
              </span>
            </div>
          )}
          {shot.view === 'pressure' && (
            <div className="jelly-pressure-observation">
              <span>
                {t('伞下体积变化率')} <b>{(frame.volumeRate * 1e6).toFixed(2)} mL/s</b>
              </span>
              <span data-lit={frame.recoveryForce > 0}>
                {t(
                  frame.recoveryForce > 0
                    ? '回收项仍提供推力'
                    : !film.watch && !recovery
                      ? '回收项已移除'
                      : '回收项等待形成',
                )}
              </span>
            </div>
          )}
          {!film.watch && <p className="jelly-mode-note">{t(mode)}</p>}
        </>
      )}
      {!film.watch && (
        <div className="jelly-explore">
          <div className="jelly-view-choice" role="group" aria-label={t('水母观察方式')}>
            {(
              [
                ['animal', '看身体'],
                ['volume', '看排水'],
                ['vortices', '看涡环'],
                ['pressure', '看二次推力'],
                ['compare', '同动作比较'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-time`}>
            {t('观察时刻')} <output>{time.toFixed(2)} s</output>
          </label>
          <input
            id={`${id}-time`}
            type="range"
            min="0"
            max={JELLY.duration}
            step=".01"
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
          />
          <div className="jelly-input-pair">
            <div>
              <label htmlFor={`${id}-amplitude`}>
                {t('半径收缩幅度')} <output>{amplitude}%</output>
              </label>
              <input
                id={`${id}-amplitude`}
                type="range"
                min="0"
                max="35"
                step="1"
                value={amplitude}
                onChange={(e) => setAmplitude(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor={`${id}-period`}>
                {t('脉动周期')} <output>{period.toFixed(1)} s</output>
              </label>
              <input
                id={`${id}-period`}
                type="range"
                min=".8"
                max="4"
                step=".1"
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
              />
            </div>
          </div>
          {view !== 'compare' && (
            <div className="jelly-toggles">
              <label>
                <input
                  type="checkbox"
                  checked={recovery}
                  onChange={(e) => setRecovery(e.target.checked)}
                />
                {t('计入回收项')}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={section}
                  onChange={(e) => setSection(e.target.checked)}
                />
                {t('固定二维剖面')}
              </label>
            </div>
          )}
          <p className="jelly-scope">
            {t('改变幅度和周期会重建同一低阶模型。水流、压力与涡环不是流体求解或实测。')}
          </p>
        </div>
      )}
    </section>
  );
}
