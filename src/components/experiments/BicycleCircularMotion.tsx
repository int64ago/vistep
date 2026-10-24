import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  bicycleCircular,
  bicycleFilmState,
  bicycleWheelVelocity,
  type BicycleSceneState,
} from '../../models/bicycle-circular-motion';
import { sprocketOutline, TAU } from '../../models/mechanisms';
import '../../styles/bicycle-circular-motion.css';
export default function BicycleCircularMotion() {
  const film = useShowcase(),
    arrowId = useId().replace(/:/g, ''),
    [manual, setManual] = useState<BicycleSceneState | null>(null),
    authored = bicycleFilmState(film.chapter, film.chapterProgress),
    state = film.watch || !manual ? authored : manual,
    change = (patch: Partial<BicycleSceneState>) => setManual({ ...state, ...patch }),
    wheel = state.view === 'wheel',
    close = state.view === 'chain' || state.view === 'angles',
    angles = state.view === 'angles',
    s = bicycleCircular(state.time, state.rear, state.cadence),
    ch = s.chain,
    points = Array.from({ length: ch.count }, (_, i) => ch.sample(i + s.phase));
  const view = wheel
    ? `${ch.distance / 2 - 0.41} -.41 .82 .82`
    : close
      ? `${-ch.distance / 2 - 0.14} -.19 ${ch.distance + 0.24} .38`
      : '-.48 -.43 1.07 .87';
  const wheels = [
    { x: -ch.distance / 2, r: ch.ra, n: 40, a: s.frontAngle },
    { x: ch.distance / 2, r: ch.rb, n: s.rear, a: s.rearAngle },
  ];
  return (
    <section
      className="bicycle-circular-lab"
      data-view={state.view}
      data-time={state.time}
      data-rear={state.rear}
      data-cadence={state.cadence}
      data-chain-speed={s.chainSpeed}
    >
      <header>
        <p>
          {t(
            wheel
              ? '同一转角，两段路程'
              : angles
                ? '同一链长，不同转角'
                : close
                  ? '跟住金色链节'
                  : '先分清两种快慢',
          )}
        </p>
        <span>{t(wheel ? '同轴比较 · 角速度相同' : '架起后轮 · 链传动')}</span>
      </header>
      <div className={`bicycle-circular-stage ${close ? 'is-close' : ''}`}>
        <svg
          viewBox={view}
          role="img"
          aria-label={t(
            wheel
              ? '车轮半径和半半径的两个标记同步转动'
              : '闭合链条与两齿轮同节距啮合，后轮架空由后齿轮带动',
          )}
        >
          <defs>
            <marker
              id={arrowId}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M0 1L8 5L0 9" fill="none" stroke="context-stroke" strokeWidth="1.5" />
            </marker>
          </defs>
          <g transform="scale(1,-1)">
            {(!close || wheel) && (
              <g transform={`translate(${ch.distance / 2} 0)`}>
                <circle r=".34" fill="none" stroke="#9ead91" strokeWidth=".014" />
                <circle r=".327" fill="none" stroke="#c5d2b4" strokeWidth=".005" />
                {Array.from({ length: 24 }, (_, i) => {
                  const a = s.rearAngle + (i * TAU) / 24;
                  return (
                    <path
                      key={i}
                      d={`M${0.025 * Math.cos(a + 0.1)} ${0.025 * Math.sin(a + 0.1)}L${0.325 * Math.cos(a)} ${0.325 * Math.sin(a)}`}
                      stroke="#c3d0b6"
                      strokeWidth=".002"
                    />
                  );
                })}
                <circle r=".024" fill="#a3b697" />
                {wheel && (
                  <>
                    <path
                      d={`M0 0L${0.34 * Math.cos(s.rearAngle)} ${0.34 * Math.sin(s.rearAngle)}`}
                      stroke="#b6a078"
                      strokeWidth=".004"
                    />
                    {[0.17, 0.34].map((r, i) => {
                      const v = bicycleWheelVelocity(s.rearAngle, r, s.omegaRear);
                      return (
                        <g key={i}>
                          <circle
                            r={r}
                            fill="none"
                            stroke="#c6ceb5"
                            strokeDasharray=".008 .012"
                            strokeWidth=".002"
                          />
                          {s.omegaRear > 0 && (
                            <path
                              d={`M${v.x} ${v.y}l${v.vx * 0.05} ${v.vy * 0.05}`}
                              stroke={i ? '#8b692e' : '#527a45'}
                              strokeWidth=".004"
                              fill="none"
                              markerEnd={`url(#${arrowId})`}
                            />
                          )}
                          <circle
                            cx={r * Math.cos(s.rearAngle)}
                            cy={r * Math.sin(s.rearAngle)}
                            r=".011"
                            fill={i ? '#a38e62' : '#91aa7c'}
                          />
                        </g>
                      );
                    })}
                  </>
                )}
              </g>
            )}
            {!wheel && (
              <>
                {!close && (
                  <>
                    <path
                      d={`M${-ch.distance / 2} 0L${-0.1} .30L${ch.distance / 2} 0Z`}
                      fill="none"
                      stroke="#b5c7ae"
                      strokeWidth=".016"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M-.12 .32H-.03"
                      stroke="#9aaf92"
                      strokeWidth=".025"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${ch.distance / 2} 0L${ch.distance / 2 - 0.11} -.4M${ch.distance / 2} 0L${ch.distance / 2 + 0.11} -.4`}
                      fill="none"
                      stroke="#bdc6ae"
                      strokeWidth=".009"
                    />
                    <path d="M-.43-.41H.57" stroke="#d7ddca" strokeWidth=".005" />
                  </>
                )}
                {wheels.map((q, i) => (
                  <g key={i} transform={`translate(${q.x} 0) rotate(${(q.a * 180) / Math.PI})`}>
                    <path
                      d={
                        sprocketOutline(q.n, ch.pitch)
                          .map((v, j) => `${j ? 'L' : 'M'}${v.x} ${v.y}`)
                          .join(' ') + 'Z'
                      }
                      fill={i ? '#c8be9d' : '#b9c9aa'}
                      stroke={i ? '#ad9e78' : '#92a883'}
                      strokeWidth=".0012"
                    />
                    {Array.from({ length: 5 }, (_, j) => {
                      const a = (j * TAU) / 5;
                      return (
                        <path
                          key={j}
                          d={`M${0.013 * Math.cos(a)} ${0.013 * Math.sin(a)}L${q.r * 0.7 * Math.cos(a)} ${q.r * 0.7 * Math.sin(a)}`}
                          stroke="#eef0df"
                          strokeWidth={q.r * 0.16}
                          strokeLinecap="round"
                        />
                      );
                    })}
                    <circle r=".012" fill="#8ca37f" />
                    <circle cx={q.r} cy="0" r=".0042" fill="#ac895a" />
                    {!i && !close && (
                      <>
                        <path
                          d="M0 0H-.17"
                          stroke="#8da486"
                          strokeWidth=".012"
                          strokeLinecap="round"
                        />
                        <path d="M-.19 0h.04" stroke="#b2a27e" strokeWidth=".025" />
                      </>
                    )}
                  </g>
                ))}
                {points.map((a, i) => {
                  const b = points[(i + 1) % points.length];
                  return (
                    <g key={i}>
                      <path
                        d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
                        stroke={i === 0 ? '#a88d5b' : '#8ca181'}
                        strokeWidth={i === 0 ? 0.008 : i % 2 ? 0.0032 : 0.0044}
                        strokeLinecap="round"
                      />
                      <circle
                        cx={a.x}
                        cy={a.y}
                        r={i === 0 ? 0.0055 : 0.0019}
                        fill={i === 0 ? '#9a7130' : '#e4e9d6'}
                      />
                    </g>
                  );
                })}
                {angles &&
                  wheels.map((q, i) => (
                    <g key={i}>
                      <path
                        d={Array.from({ length: 31 }, (_, j) => {
                          const a = ((i ? s.rearSweep : s.frontSweep) * j) / 30;
                          return `${j ? 'L' : 'M'}${q.x + q.r * 0.7 * Math.cos((i ? ch.alpha + (ch.lengths[0] * TAU) / s.rear : ch.alpha) - a)} ${q.r * 0.7 * Math.sin((i ? ch.alpha + (ch.lengths[0] * TAU) / s.rear : ch.alpha) - a)}`;
                        }).join(' ')}
                        stroke="#ba9c6a"
                        strokeWidth=".003"
                        fill="none"
                      />
                      <path
                        d={`M${q.x} 0L${q.x + q.r * Math.cos(i ? ch.alpha + (ch.lengths[0] * TAU) / s.rear : ch.alpha)} ${q.r * Math.sin(i ? ch.alpha + (ch.lengths[0] * TAU) / s.rear : ch.alpha)}`}
                        stroke="#baa98a"
                        strokeWidth=".0015"
                        strokeDasharray=".004 .004"
                      />
                    </g>
                  ))}
              </>
            )}
          </g>
        </svg>
      </div>
      <div className="bicycle-circular-readings">
        {wheel ? (
          <>
            <span>
              {t('共同角速度')} <b>{s.omegaRear.toFixed(2)} rad/s</b>
            </span>
            <span>
              {t('轮缘速度')} <b>{s.wheelRimSpeed.toFixed(2)} m/s</b>
            </span>
            <span>
              {t('半径中点速度')} <b>{s.wheelMidSpeed.toFixed(2)} m/s</b>
            </span>
          </>
        ) : angles ? (
          <>
            <span>
              {t('大齿轮转角')} <b>{((s.frontSweep * 180) / Math.PI).toFixed(1)}°</b>
            </span>
            <span>
              {t('小齿轮转角')} <b>{((s.rearSweep * 180) / Math.PI).toFixed(1)}°</b>
            </span>
            <span>
              {t('前后齿数')} <b>40 : {state.rear}</b>
            </span>
          </>
        ) : (
          <>
            <span>
              {t('链条平均速度')} <b>{s.chainSpeed.toFixed(3)} m/s</b>
            </span>
            <span>
              {t('大齿轮 ω')} <b>{s.omegaFront.toFixed(2)} rad/s</b>
            </span>
            <span>
              {t('小齿轮 ω')} <b>{s.omegaRear.toFixed(2)} rad/s</b>
            </span>
          </>
        )}
      </div>
      <p className="bicycle-circular-cause">
        {t(
          wheel
            ? '同轴角速度相同，线速度与到转轴的距离成正比。'
            : '相同链长通过时，齿数较少的齿轮转得更快；用线速度和角速度回答不同的问题。',
        )}
      </p>
      {!film.watch && (
        <div className="bicycle-circular-controls">
          <Segments
            label={t('比较对象')}
            value={state.view}
            onChange={(view) => change({ view })}
            options={[
              { value: 'overview', label: t('整车观察') },
              { value: 'chain', label: t('两个齿轮') },
              { value: 'angles', label: t('比较转角') },
              { value: 'wheel', label: t('同一车轮') },
            ]}
          />
          <Segments
            label={t('后齿轮齿数')}
            value={String(state.rear)}
            onChange={(rear) => change({ rear: Number(rear) })}
            options={[
              { value: '16', label: '16' },
              { value: '20', label: '20' },
              { value: '24', label: '24' },
            ]}
          />
          <Range
            label={t('踩踏转速')}
            value={state.cadence}
            min={0}
            max={40}
            step={1}
            unit="r/min"
            onChange={(cadence) => change({ cadence })}
          />
          <Range
            label={t('模型时间')}
            value={state.time}
            min={0}
            max={9}
            step={0.01}
            unit="s"
            onChange={(time) => change({ time })}
          />
        </div>
      )}
      <p className="bicycle-circular-note">
        {t(
          '链节节距12.7 mm，齿相位与闭合链路同源；读数采用每转链长的平均速度，忽略实际链传动的微小多边形效应。',
        )}
      </p>
    </section>
  );
}
