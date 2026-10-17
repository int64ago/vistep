import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import CentrifugalGovernorStudio from '../three/CentrifugalGovernorStudio';
import {
  governorDefaults,
  governorEquilibrium,
  governorReading,
  governorTrajectory,
  governorSample,
} from '../../models/centrifugal-governor';
import '../../styles/centrifugal-governor.css';
export default function CentrifugalGovernor() {
  const film = useShowcase(),
    [mode, setMode] = useState('load'),
    [rpm, setRpm] = useState(72),
    [time, setTime] = useState(12),
    [step, setStep] = useState(2),
    [lag, setLag] = useState(0.4),
    [feedback, setFeedback] = useState(true),
    c = film.watch ? film.chapter : -1,
    u = film.chapterProgress,
    bench = film.watch ? c < 2 : mode === 'bench',
    useFeedback = film.watch ? c !== 3 : feedback,
    useLag = film.watch ? (c === 5 ? 3 : 0.4) : lag,
    useStep = film.watch ? 2 : step,
    p = useMemo(
      () => ({ ...governorDefaults(), feedback: useFeedback, lag: useLag, loadStep: useStep }),
      [useFeedback, useLag, useStep],
    ),
    trajectory = useMemo(() => governorTrajectory(p), [p]),
    reference = useMemo(() => governorTrajectory(governorDefaults()), []),
    elapsed = film.watch ? u * (c === 2 ? 12 : c === 3 ? 30 : c === 5 ? 25 : 35) : time,
    speed = ((film.watch ? (c === 1 ? 64 + 18 * u : 72) : rpm) * Math.PI) / 30,
    s = bench
      ? governorReading(speed, governorEquilibrium(speed).rise, 0, film.watch ? u * 100 : 8, p)
      : governorSample(trajectory, elapsed),
    sy = 3.6 - s.height * 12,
    gateTop = 3.3 - 1.5 * (s.baseValve - (s.feedback ? 4 * (s.rise - s.referenceRise) : 0));
  const flat = (
    <svg viewBox="0 0 340 230" role="img" aria-label={t('调速器与阀门的同模型平面剖视')}>
      <path d="M104 20V210" stroke="#9aaba1" strokeWidth="6" />
      {[0, 1].map((i) => {
        const a = s.phase * 0.12 + i * Math.PI,
          x = 104 + s.radius * 6 * 48 * Math.cos(a),
          y = 202 - (3.6 - s.height * 6) * 48;
        return (
          <g key={i}>
            <path
              d={`M104 29L${x} ${y}L104 ${202 - sy * 48}`}
              fill="none"
              stroke="#8e9f95"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx={x} cy={y} r="7" fill="#b69a66" />
          </g>
        );
      })}
      <rect x="95" y={196 - sy * 48} width="18" height="12" rx="4" fill="#6b9585" />
      <rect
        x="246"
        y="43.6"
        width="52"
        height="72"
        rx="5"
        fill="#e0e9dc"
        stroke="#aebea9"
        strokeWidth="3"
      />
      <rect x="250" y="45" width="44" height={Math.max(0, 69 * s.valve)} fill="#9ac4b6" />
      <rect x="250" y={202 - gateTop * 48} width="44" height="77" rx="3" fill="#b69a66" />
      {s.feedback && (
        <path
          d={`M104 ${202 - sy * 48}H272V${202 - gateTop * 48}`}
          fill="none"
          stroke="#719783"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      <rect x="77" y="208" width="54" height="11" rx="5" fill="#8aab94" />
      <path d="M242 218H302" stroke="#8aab94" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
  const plotDuration = film.watch ? (c === 2 ? 12 : c === 3 ? 30 : c === 5 ? 25 : 35) : 35,
    floor = useFeedback
      ? Math.min(60, Math.floor(Math.min(...trajectory.map((v) => v.rpm)) / 5) * 5)
      : 0,
    ceiling = useFeedback
      ? Math.max(75, Math.ceil(Math.max(...trajectory.map((v) => v.rpm)) / 5) * 5)
      : 80,
    plotX = (time: number) => 42 + (time / plotDuration) * 274,
    plotY = (rpm: number) => 101 - ((rpm - floor) / (ceiling - floor)) * 77;
  const plot = (points: typeof trajectory, color: string, dash?: string) => (
    <polyline
      points={points
        .filter((v, i) => i % 20 === 0 && v.time <= (c === 5 ? plotDuration : elapsed))
        .map((v) => `${plotX(v.time)},${plotY(v.rpm)}`)
        .join(' ')}
      stroke={color}
      strokeWidth="2.5"
      fill="none"
      strokeDasharray={dash}
    />
  );
  return (
    <div className="governor-film" data-watch={film.watch}>
      <p className="governor-mode">
        {bench
          ? t('外部驱动：观察转速与阀门关系')
          : s.feedback
            ? t('反馈接通')
            : t('反馈断开，阀门固定')}
      </p>
      <div className="governor-object">
        <CentrifugalGovernorStudio state={s} fallback={flat} />
      </div>
      <div className="governor-values">
        <span>
          {t('转速')}
          <b>
            {s.rpm.toFixed(1)}
            <small> rpm</small>
          </b>
        </span>
        <span>
          {t('阀口')}
          <b>{(s.valve * 100).toFixed(0)}%</b>
        </span>
        {!bench && (
          <span>
            {t('轴负载')}
            <b>
              {s.load.toFixed(1)}
              <small> N·m</small>
            </b>
          </span>
        )}
      </div>
      {bench ? (
        <p className="governor-relation">{t('转速↑ → 套筒↑ → 开度↓')}</p>
      ) : (
        <div className="governor-plot">
          <svg
            viewBox="0 0 340 128"
            role="img"
            aria-label={t('负载变化后的转速，虚线为原先72 rpm')}
          >
            <path d="M42 24V101H316" fill="none" stroke="#bdcbb6" />
            <path
              d={`M42 ${plotY(72)}H316`}
              stroke="#b2aa8b"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {c === 5 && plot(reference, '#a8b8a1')}
            {plot(trajectory, '#5d9383')}
            <circle cx={plotX(elapsed)} cy={plotY(s.rpm)} r="4" fill="#5d9383" />
            <text x="34" y="30" textAnchor="end">
              {ceiling}
            </text>
            <text x="34" y="107" textAnchor="end">
              {floor}
            </text>
            <text x="42" y="124">
              0 s
            </text>
            <text x="316" y="124" textAnchor="end">
              {plotDuration} s
            </text>
            <text x="51" y="18">
              {t('2秒：负载增加')}
            </text>
          </svg>
          {c === 5 && <p>{t('浅线0.4 s · 深线3 s')}</p>}
        </div>
      )}
      {!film.watch && (
        <div className="governor-controls">
          <Segments
            label={t('调速器实验')}
            value={mode}
            options={[
              { value: 'bench', label: t('速度关系') },
              { value: 'load', label: t('负载变化') },
            ]}
            onChange={setMode}
          />
          {mode === 'bench' ? (
            <Range
              label={t('外部驱动转速')}
              value={rpm}
              min={60}
              max={85}
              unit="rpm"
              onChange={setRpm}
            />
          ) : (
            <>
              <Range
                label={t('观察时刻')}
                value={time}
                min={0}
                max={35}
                step={0.1}
                unit="s"
                onChange={setTime}
              />
              <Range
                label={t('增加负载')}
                value={step}
                min={0}
                max={3}
                step={0.1}
                unit="N·m"
                onChange={setStep}
              />
              <Range
                label={t('调速器响应时间')}
                value={lag}
                min={0.2}
                max={3}
                step={0.1}
                unit="s"
                onChange={setLag}
              />
              <Segments
                label={t('反馈连接')}
                value={feedback ? 'on' : 'off'}
                options={[
                  { value: 'on', label: t('接通') },
                  { value: 'off', label: t('断开') },
                ]}
                onChange={(v) => setFeedback(v === 'on')}
              />
            </>
          )}
        </div>
      )}
      <details className="governor-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '等长连杆、轻套筒与小阀门负载；静态用瓦特调速器关系，瞬态用一阶响应近似与独立轴动力学。动画慢放；不预测真实发动机性能。',
          )}
        </p>
      </details>
    </div>
  );
}
