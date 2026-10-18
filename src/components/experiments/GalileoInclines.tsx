import { useState, useId } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  rollingIncline,
  doubleInclineGeometry,
  doubleInclineState,
} from '../../models/galileo-inclines';
import '../../styles/galileo-inclines.css';
export default function GalileoInclines() {
  const film = useShowcase(),
    id = useId().replaceAll(':', '');
  const [path, setPath] = useState<'timing' | 'double' | 'energy'>(
      film.variant?.includes('double')
        ? 'double'
        : film.variant?.includes('energy')
          ? 'energy'
          : 'timing',
    ),
    [angle, setAngle] = useState(6),
    [right, setRight] = useState(25),
    [time, setTime] = useState(1.2);
  const c = film.watch ? film.chapter : path === 'timing' ? 1 : path === 'energy' ? 5 : 3,
    p = film.chapterProgress,
    kind = film.watch ? (c < 3 ? 'timing' : c === 5 ? 'energy' : 'double') : path;
  const angleNow = film.watch ? (c === 2 ? 12 : 6) : angle,
    trial = c === 4 ? Math.min(2, Math.floor(p * 3)) : 0,
    rightNow = film.watch ? (c === 4 ? [35, 15, 0][trial] : c === 5 ? 25 : 35) : right;
  const run = film.watch
    ? c === 4
      ? (p * 3 - trial) * (trial === 2 ? 1.8 : trial === 1 ? 2.6 : 1.7)
      : p * (c === 5 ? 2.1 : 1.7)
    : Math.min(time, rightNow === 0 ? 1.9 : 3);
  const roll = rollingIncline(
      film.watch ? Math.min(1, p * 1.5) * rollingIncline(0, angleNow).endTime : time,
      angleNow,
    ),
    double = doubleInclineState(run, rightNow),
    geometry = doubleInclineGeometry(rightNow),
    first = geometry.at(0),
    last = geometry.at(geometry.length);
  const scale = 330 / (last.x - first.x),
    map = (x: number, y: number) => ({ x: 15 + (x - first.x) * scale, y: 201 - y * scale });
  const center = map(double.x, double.y),
    radius = 0.065 * scale;
  const rail = Array.from({ length: 151 }, (_, i) => {
    const q = geometry.at((geometry.length * i) / 150),
      r = map(q.x + 0.065 * Math.sin(q.angle), q.y - 0.065 * Math.cos(q.angle));
    return `${i ? 'L' : 'M'}${r.x} ${r.y}`;
  }).join(' ');
  const phi = (angleNow * Math.PI) / 180,
    track = (s: number) => ({ x: 35 + s * 175 * Math.cos(phi), y: 80 + s * 175 * Math.sin(phi) }),
    ball = track(roll.position),
    end = track(1.6);
  return (
    <section className="galileo-lab">
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
              <path
                d={`M45 88V169M${end.x - 8} ${end.y + 8}V169`}
                stroke="#b9ac8c"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path d="M25 170H328" stroke="#d5d5be" strokeWidth="3" />
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
                transform={`translate(${ball.x + 7 * Math.sin(phi)} ${ball.y - 7 * Math.cos(phi)}) rotate(${(((roll.position * 175) / 7) * 180) / Math.PI})`}
              >
                <circle r="7" fill={`url(#${id}ball)`} />
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
                {t('收集的水质量')} <strong>{(roll.waterMass * 1000).toFixed(1)} g</strong>
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
            viewBox="0 0 360 245"
            role="img"
            aria-label={t('平滑连接的双斜面上小球滚动，释放高度与回升高度对照')}
          >
            <defs>
              <radialGradient id={`${id}sphere`}>
                <stop stopColor="#dfc291" />
                <stop offset="1" stopColor="#a18356" />
              </radialGradient>
            </defs>
            <path d={`M15 ${map(0, 0.7).y}H345`} stroke="#b9bf9e" strokeDasharray="4 5" />
            <path d={rail} stroke="#c9b38c" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d={rail} stroke="#e4d4b4" strokeWidth="1" fill="none" />
            <circle
              cx={map(first.x, first.y).x}
              cy={map(first.x, first.y).y}
              r={radius}
              fill="none"
              stroke="#b9bfa2"
            />
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
            {rightNow === 0 && (
              <path d="M327 187H348m-7-5l7 5-7 5" stroke="#8d9f79" strokeWidth="1.7" fill="none" />
            )}
          </svg>
          <div className="galileo-values">
            <span>
              {t('右坡角度')} {rightNow}°
            </span>
            <span>
              {t('当前高度')} {double.y.toFixed(2)} m
            </span>
            <span>
              {t('模型时间')} {run.toFixed(2)} s
            </span>
          </div>
          {kind === 'energy' && (
            <div className="galileo-energy">
              <div className="galileo-energy-bar">
                <i style={{ width: `${(double.potential / double.energy) * 100}%` }} />
                <i style={{ width: `${(double.kinetic / double.energy) * 100}%` }} />
              </div>
              <p>
                <span>
                  {t('重力势能')} {double.potential.toFixed(2)} J/kg
                </span>
                <span>
                  {t('平动与转动动能')} {double.kinetic.toFixed(2)} J/kg
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
            value={time}
            min={0}
            max={kind === 'timing' ? 3 : right === 0 ? 1.9 : 3}
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
