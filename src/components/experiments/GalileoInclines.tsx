import { useState, useId } from 'react';
import { t, browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  rollingIncline,
  galileoTrackView,
  galileoTimingGeometry,
  galileoFilmState,
} from '../../models/galileo-inclines';
import '../../styles/galileo-inclines.css';
export default function GalileoInclines() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [selectedPath, setPath] = useState<'timing' | 'double' | 'energy' | null>(null),
    [angle, setAngle] = useState(6),
    [right, setRight] = useState(25),
    [time, setTime] = useState(1.2);
  const director = galileoFilmState(film.chapter, film.chapterTime, browserLocale());
  const path = selectedPath ?? director.kind;
  const c = film.watch ? film.chapter : path === 'timing' ? 1 : path === 'energy' ? 5 : 3;
  const kind = film.watch ? director.kind : path;
  const angleNow = film.watch ? director.angle : angle,
    rightNow = film.watch ? director.right : right;
  const run = film.watch ? director.run : Math.min(time, 3);
  const roll = rollingIncline(film.watch ? director.timingTime : time, angleNow);
  const view = galileoTrackView(run, rightNow),
    double = view.state,
    center = view.center,
    radius = view.radius;
  const rail = view.rail.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ');
  const timing = galileoTimingGeometry(angleNow),
    phi = timing.phi,
    track = timing.at,
    ball = track(roll.position),
    end = timing.end;
  return (
    <section
      className="galileo-lab"
      data-kind={kind}
      data-camera={view.camera}
      data-physical-time={kind === 'timing' ? roll.time : run}
    >
      <header>
        <p>
          {t(
            kind === 'timing'
              ? c === 2
                ? '斜面把下落问题变慢，但滚动不是自由落体'
                : '让铜球沿缓坡滚下，用流水比较时间'
              : kind === 'energy'
                ? '高度与速度互换，理想总机械能保持不变'
                : rightNow === 0
                  ? '右侧变成水平：理想小球继续前进'
                  : '同样释放高度，右坡更缓，需要走得更远',
          )}
        </p>
        <span>{t(kind === 'timing' ? '历史实验的物理重建' : '理想实验 · 忽略耗散')}</span>
      </header>
      {kind === 'timing' ? (
        <>
          <div className="galileo-timing">
            <svg
              viewBox="0 0 360 220"
              role="img"
              aria-label={t('铜球沿斜面滚动，流水收集量随计时时间增加')}
            >
              <defs>
                <radialGradient id={`${id}ball`}>
                  <stop stopColor="#e0c393" />
                  <stop offset=".7" stopColor="#b49666" />
                  <stop offset="1" stopColor="#927751" />
                </radialGradient>
              </defs>
              <path d={`M35 80L${end.x} ${end.y}V${end.y + 8}L35 88Z`} fill="#cdb692" />
              {timing.supports.map((q, i) => (
                <path
                  key={i}
                  d={`M${q.x} ${q.top}V${q.bottom}`}
                  stroke="#b9ac8c"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              ))}
              <path d={`M25 ${timing.tableY}H328`} stroke="#d5d5be" strokeWidth="3" />
              {[0.25, 0.5, 0.75, 1].map((f, i) => {
                const q = track(1.6 * f * f);
                return (
                  <g key={i}>
                    <path d={`M${q.x} ${q.y + 4}v10`} stroke="#9da98b" />
                    {roll.time >= roll.endTime * f && (
                      <circle cx={q.x} cy={q.y - 1} r="2.5" fill="#a8af90" />
                    )}
                  </g>
                );
              })}
              <g
                transform={`translate(${ball.x + 9 * Math.sin(phi)} ${ball.y - 9 * Math.cos(phi)}) rotate(${(((roll.position * 175) / 9) * 180) / Math.PI})`}
              >
                <circle r="9" fill={`url(#${id}ball)`} />
                <path d="M-4-3L4 3" stroke="#8d7754" strokeWidth="1" />
              </g>
            </svg>
            <div className="galileo-water">
              <svg viewBox="0 0 180 220" aria-hidden="true">
                <path
                  d="M35 25H108V81Q100 91 86 91H56Q35 88 35 70Z"
                  fill="#c8d7c9"
                  fillOpacity=".5"
                  stroke="#9aaf9b"
                  strokeWidth="2"
                />
                <path
                  d="M37 41H106V70Q105 83 86 83H58Q37 80 37 65Z"
                  fill="#b9cfc2"
                  fillOpacity=".6"
                />
                <path d="M89 89V106H105V115" stroke="#9aaa8c" strokeWidth="5" fill="none" />
                {!roll.arrived && roll.time > 0 && (
                  <path
                    d="M105 116V153"
                    stroke="#a3c5b9"
                    strokeWidth="2"
                    strokeDasharray="3 5"
                    strokeDashoffset={-roll.time * 25}
                  />
                )}
                <path
                  d="M78 149L83 198H126L132 149"
                  stroke="#a3b69e"
                  fill="#dce7d6"
                  fillOpacity=".4"
                  strokeWidth="1.5"
                />
                <path d={`M82 ${197 - roll.waterMass * 950}H128L126 197H84Z`} fill="#b4cdbf" />
                <path d="M71 202H139" stroke="#c4ccb3" strokeWidth="3" />
              </svg>
              <span>
                {t('收集水量')} <strong>{(roll.waterMass * 1000).toFixed(1)} g</strong>
              </span>
            </div>
          </div>
          <div className="galileo-values">
            <span>
              {t('滚动距离')} {roll.position.toFixed(2)} m
            </span>
            <span>
              {t('模型时间')} {roll.time.toFixed(2)} s
            </span>
          </div>
          {c === 1 && (
            <div className="galileo-records" aria-label={t('等时间间隔的记录')}>
              {[0.25, 0.5, 0.75, 1].map((f, i) => (
                <span key={i}>
                  {roll.time >= roll.endTime * f ? `${(roll.endTime * f).toFixed(2)} s` : '—'}
                  <strong>
                    {roll.time >= roll.endTime * f ? `${(1.6 * f * f).toFixed(2)} m` : '—'}
                  </strong>
                </span>
              ))}
            </div>
          )}
          <p className="galileo-cause">
            {t(
              c === 2
                ? '实心球还需要转动能量，不能把滚动加速度直接当作g。'
                : '稳定水流下，收集水量与时间成正比；距离与时间平方成正比。',
            )}
          </p>
        </>
      ) : (
        <>
          <svg
            className="galileo-double"
            viewBox="0 0 360 185"
            role="img"
            aria-label={t('平滑连接的双斜面上小球滚动，释放高度与回升高度对照')}
          >
            <defs>
              <radialGradient id={`${id}sphere`}>
                <stop stopColor="#dfc291" />
                <stop offset="1" stopColor="#a18356" />
              </radialGradient>
            </defs>
            <path d={`M15 ${view.referenceY}H345`} stroke="#b9bf9e" strokeDasharray="4 5" />
            <path d={rail} stroke="#c9b38c" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d={rail} stroke="#e4d4b4" strokeWidth="1" fill="none" />
            <circle cx={view.first.x} cy={view.first.y} r={radius} fill="none" stroke="#b9bfa2" />
            <g
              transform={`translate(${center.x} ${center.y}) rotate(${((double.position / 0.065) * 180) / Math.PI})`}
            >
              <circle r={radius} fill={`url(#${id}sphere)`} />
              <path
                d={`M${-radius * 0.6} ${-radius * 0.3}L${radius * 0.6} ${radius * 0.3}`}
                stroke="#8b734f"
                strokeWidth="1"
              />
            </g>
            {rightNow === 0 &&
              view.ticks
                .filter((q) => q.x > 20 && q.x < 310)
                .map((q) => (
                  <g key={q.worldX}>
                    <path d={`M${q.x} ${156 + radius + 1}v5`} stroke="#b7baa0" />
                    <text x={q.x} y="182" textAnchor="middle" fontSize="22" fill="#7c8d68">
                      {q.worldX} m
                    </text>
                  </g>
                ))}
            {view.continuesRight && (
              <path d="M327 172H348m-7-5l7 5-7 5" stroke="#8d9f79" strokeWidth="1.7" fill="none" />
            )}
          </svg>
          {view.continuesRight && (
            <p className="galileo-continuation">
              {t('轨道继续向右延伸')}
              {rightNow > 0 && <> · {view.returnDistance.toFixed(1)} m</>}
            </p>
          )}
          <div className="galileo-values">
            {kind === 'energy' ? (
              <>
                <span>h {double.y.toFixed(2)} m</span>
                <span>v {Math.abs(double.velocity).toFixed(2)} m/s</span>
              </>
            ) : (
              <>
                <span>
                  {t('右坡角度')} {rightNow}°
                </span>
                <span>
                  {t('当前高度')} {double.y.toFixed(2)} m
                </span>
                <span>
                  {t('模型时间')} {run.toFixed(2)} s
                </span>
              </>
            )}
          </div>
          {kind === 'energy' && (
            <div className="galileo-energy">
              <div className="galileo-energy-bar">
                <i style={{ width: `${(double.potential / double.energy) * 100}%` }} />
                <i style={{ width: `${(double.kinetic / double.energy) * 100}%` }} />
              </div>
              <p>
                <span>
                  {t('势能')} {double.potential.toFixed(2)} J/kg
                </span>
                <span>
                  {t('滚动动能')} {double.kinetic.toFixed(2)} J/kg
                </span>
              </p>
            </div>
          )}
          <p className="galileo-cause">
            {t(
              kind === 'energy'
                ? '滚动的动能包含平动和转动；无耗散时两者一起计入。'
                : rightNow === 0
                  ? '水平延伸无法靠升高消耗速度；无阻力的极限是继续匀速前进。'
                  : '越缓的上坡，需要更长路程才能回到同样高度。',
            )}
          </p>
        </>
      )}
      {!film.watch && (
        <div className="galileo-controls">
          <Segments
            label={t('研究路径')}
            value={path}
            onChange={setPath}
            options={[
              { value: 'timing', label: t('斜面计时') },
              { value: 'double', label: t('双斜面理想实验') },
              { value: 'energy', label: t('机械能观察') },
            ]}
          />
          {kind === 'timing' ? (
            <Range
              label={t('斜面角度')}
              value={angle}
              min={3}
              max={18}
              unit="°"
              onChange={setAngle}
            />
          ) : (
            <Range
              label={t('右坡角度')}
              value={right}
              min={0}
              max={55}
              unit="°"
              onChange={setRight}
            />
          )}
          <Range
            label={t('模型时间')}
            value={kind === 'timing' ? Math.min(time, roll.endTime) : time}
            min={0}
            max={kind === 'timing' ? Math.ceil(roll.endTime * 100) / 100 : 3}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <p className="galileo-note">
        {t('均匀实心球无滑动滚动，忽略耗散；缓坡计时在终点定格。模拟重建不是伽利略原始测量记录。')}
      </p>
    </section>
  );
}
