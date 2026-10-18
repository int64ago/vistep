import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  horizontalProjectile,
  rollingLaunch,
  rampFlight,
  wallIntercept,
  reconstructLaunchSpeed,
  projectileRanges,
} from '../../models/projectile-motion-lab';
import '../../styles/projectile-motion-lab.css';
type Path = 'strobe' | 'pair' | 'carbon' | 'sensor' | 'board' | 'wall' | 'parabola' | 'speed';
const PATHS: Path[] = ['strobe', 'pair', 'carbon', 'sensor', 'board', 'wall', 'parabola', 'speed'];
export default function ProjectileMotionLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState<Path>(
      film.variant?.includes('parabola')
        ? 'parabola'
        : film.variant?.includes('launch-speed')
          ? 'speed'
          : 'strobe',
    ),
    [time, setTime] = useState(0.6),
    [release, setRelease] = useState(0.13),
    [height, setHeight] = useState(0.8),
    [screen, setScreen] = useState(0.4),
    [wallScreen, setWallScreen] = useState(0.4),
    c = film.chapter,
    p = film.chapterProgress,
    kind = film.watch ? PATHS[Math.min(7, c)] : mode,
    H = film.watch ? 0.8 : height,
    rise = film.watch ? 0.13 : release,
    ramp = rollingLaunch(rise),
    v = ramp.speed,
    repeated = ['carbon', 'board', 'wall'].includes(kind),
    u = Math.min(4.999, p * 5),
    index = Math.floor(u),
    trialProgress = u - index,
    levels = [0.14, 0.28, 0.42, 0.56, 0.7],
    wallDistances = [0.16, 0.245, 0.33, 0.415, 0.5],
    hitDistance = film.watch
      ? wallDistances[index]
      : Math.min(wallScreen, v * Math.sqrt((2 * H) / 9.8) * 0.94),
    drop =
      kind === 'wall'
        ? wallIntercept(hitDistance, v).y
        : repeated
          ? film.watch
            ? levels[index]
            : Math.min(screen, H)
          : H,
    end = ramp.duration + Math.sqrt((2 * drop) / 9.8),
    physical = film.watch
      ? ['strobe', 'pair', 'sensor', 'parabola'].includes(kind)
        ? Math.min(1, p / 0.8) * Math.sqrt((2 * H) / 9.8)
        : (repeated ? Math.min(1, trialProgress / 0.8) : Math.min(1, p / 0.8)) * end
      : time,
    flightOnly = ['strobe', 'pair', 'sensor', 'parabola'].includes(kind),
    flight = horizontalProjectile(physical, v, drop),
    rstate = rampFlight(physical, rise, drop),
    s = flightOnly ? { ...flight, airborne: true, launchTime: 0, speed: v } : rstate,
    X = (x: number) => 140 + x * 225,
    Y = (y: number) => 82 + y * 225,
    at = { x: X(s.x), y: Y(s.y) },
    airTime = flightOnly ? s.time : Math.max(0, s.time - ramp.duration),
    dots = Array.from({ length: Math.floor(airTime / 0.05) + 1 }, (_, i) =>
      horizontalProjectile(i * 0.05, v, drop),
    ),
    range = projectileRanges(s.x, s.y),
    showAnalysis = kind === 'parabola',
    marks = Array.from(
      { length: film.watch ? index + Number(s.arrived) : Number(s.arrived) },
      (_, i) =>
        kind === 'wall'
          ? wallIntercept(film.watch ? wallDistances[i] : hitDistance, v)
          : horizontalProjectile(100, v, film.watch ? levels[i] : drop),
    );
  const rampPath = Array.from({ length: 41 }, (_, i) => {
      const x = -ramp.length + (i / 40) * ramp.length;
      return `${i ? 'L' : 'M'}${X(x)} ${Y(-rise * (x / ramp.length) ** 2) + 4}`;
    }).join(' '),
    trace = Array.from({ length: 65 }, (_, i) => horizontalProjectile((airTime * i) / 64, v, drop))
      .map((q, i) => `${i ? 'L' : 'M'}${X(q.x)} ${Y(q.y)}`)
      .join(' ');
  return (
    <section className="projectile-motion-lab">
      <header>
        <p>
          {t(
            kind === 'strobe'
              ? '相同时间间隔，水平等距，竖直间距递增'
              : kind === 'pair'
                ? '同高同时释放，平抛与直落同时触地'
                : kind === 'carbon'
                  ? '逐次改变挡板高度，留下轨迹点'
                  : kind === 'sensor'
                    ? '两个接收器测距，交会确定平面位置'
                    : kind === 'board'
                      ? '同一释放位置，改变接球木板高度'
                      : kind === 'wall'
                        ? '移动带复写纸的墙面，记录不同位置'
                        : kind === 'parabola'
                          ? '用坐标检验轨迹，不能只看它像不像'
                          : '测出高度和水平距离，反求离桌速度',
          )}
        </p>
        <span>{t('平抛实验 · 同一初始条件')}</span>
      </header>
      <div className="projectile-motion-stage">
        <svg
          viewBox="0 0 390 330"
          role="img"
          aria-label={t(
            kind === 'pair'
              ? '弹性金属片同时抛出一球并释放另一球'
              : kind === 'sensor'
                ? '运动发射器与两个固定红外超声接收器确定二维位置'
                : '水平末端斜槽、钢球与对应的轨迹测量装置',
          )}
        >
          <defs>
            <radialGradient id={`${id}ball`} cx="28%" cy="22%">
              <stop stopColor="#eaf0e3" />
              <stop offset=".5" stopColor="#b4c8ae" />
              <stop offset="1" stopColor="#819f87" />
            </radialGradient>
          </defs>
          {kind === 'carbon' && (
            <>
              <path d="M50 28H365V309H50Z" fill="#e8eadc" stroke="#c6d0b7" />
              <path d="M54 31H361V305H54Z" fill="#faf8ed" fillOpacity=".65" />
              <path d="M354 31v274" stroke="#b5b9a2" strokeWidth="5" />
            </>
          )}
          {(kind === 'strobe' || kind === 'parabola') && (
            <>
              {Array.from({ length: 5 }, (_, i) => (
                <g key={i}>
                  <path
                    d={`M140 ${82 + i * 0.2 * 225}H362M${140 + i * 0.2 * 225} 40V290`}
                    stroke="#e0e5d2"
                  />
                </g>
              ))}
              <path d="M140 42V286M140 82H363" stroke="#b9c8a6" fill="none" />
            </>
          )}
          {kind !== 'pair' && kind !== 'sensor' ? (
            <>
              <path d={rampPath} stroke="#b9c4aa" strokeWidth="7" fill="none" />
              <path d={rampPath} stroke="#dce3cb" strokeWidth="3" fill="none" />
              <path
                d={`M${X(-ramp.length)} ${Y(-rise) + 8}V${Y(0) + 15}H140`}
                fill="none"
                stroke="#b5c2a5"
                strokeWidth="3"
              />
              {['board', 'wall', 'speed'].includes(kind) && (
                <>
                  <path d="M40 89H140V96H40Z" fill="#cbbf9e" />
                  <path d={`M57 96V${Y(H) + 4}`} stroke="#b8b390" strokeWidth="7" />
                  <path d={`M50 ${Y(H) + 4}H367`} stroke="#cdd4bc" strokeWidth="4" />
                </>
              )}
            </>
          ) : kind === 'pair' ? (
            <>
              <path d="M71 48V83H143" stroke="#b5c3a8" strokeWidth="4" fill="none" />
              <path
                d={`M71 49Q${74 + 8 * Math.exp(-physical * 25)} 64 76 82`}
                stroke="#8da285"
                strokeWidth="2"
                fill="none"
              />
              <path d="M56 109L63 65" stroke="#b49e77" strokeWidth="5" />
              <path d="M52 65H72" stroke="#a8b69c" strokeWidth="10" strokeLinecap="round" />
              <path d={`M68 ${Y(H) + 4}H367`} stroke="#c8d2ba" strokeWidth="4" />
              <circle cx="100" cy={Y(flight.y)} r="4" fill="#bdac8c" />
              <path d={`M100 ${Y(flight.y)}H${at.x}`} stroke="#c5cdb5" strokeDasharray="4 5" />
              <path d="M100 82V290" stroke="#dedfca" strokeDasharray="2 6" />
            </>
          ) : null}
          {kind === 'sensor' && (
            <>
              <path d="M88 105V252" stroke="#b8c8ac" strokeWidth="10" strokeLinecap="round" />
              {[range.y1, range.y2].map((yy, i) => (
                <g key={i}>
                  <rect x="87" y={Y(yy) - 12} width="26" height="24" rx="5" fill="#adc4aa" />
                  <ellipse cx="113" cy={Y(yy)} rx="4" ry="9" fill="#dce7d0" stroke="#8fa98c" />
                  <path
                    d={`M113 ${Y(yy)}L${at.x} ${at.y}`}
                    stroke="#9ab79d"
                    strokeDasharray="4 4"
                    fill="none"
                  />
                </g>
              ))}
              <path d="M88 240Q52 259 53 287H92" stroke="#a7b79b" strokeWidth="2" fill="none" />
              <rect x="92" y="268" width="82" height="45" rx="6" fill="#e1e7d7" stroke="#b0c0a3" />
              <path d="M99 305V277M99 305H163" fill="none" stroke="#a7bc95" />
            </>
          )}
          {s.airborne && kind !== 'parabola' && (
            <path
              d={trace}
              stroke="#b4c7a0"
              strokeWidth="1.7"
              fill="none"
              opacity={kind === 'carbon' || kind === 'board' || kind === 'wall' ? 0.3 : 1}
            />
          )}
          {(kind === 'strobe' || kind === 'parabola') &&
            dots.map((q, i) => (
              <g key={i}>
                <circle cx={X(q.x)} cy={Y(q.y)} r="3.5" fill="#a58f6c" />
                <path
                  d={`M${X(q.x)} ${Y(q.y)}V82M140 ${Y(q.y)}H${X(q.x)}`}
                  stroke="#c8d2b7"
                  strokeDasharray="3 5"
                  fill="none"
                  opacity=".7"
                />
              </g>
            ))}
          {kind === 'carbon' && (
            <>
              <path d={`M130 ${Y(drop) + 4}H355l-10 10H120Z`} fill="#c8c4a8" stroke="#a8b197" />
              <path
                d={`M355 ${Y(drop) + 4}V302M125 ${Y(drop) + 14}V302`}
                stroke="#bac3a9"
                strokeWidth="3"
              />
            </>
          )}
          {kind === 'board' && (
            <>
              <path d={`M130 ${Y(drop) + 4}H360v8H130Z`} fill="#c3b18c" />
              <path d={`M138 ${Y(drop) + 3}H351`} stroke="#efe9d8" strokeWidth="3" />
              <path d={`M145 ${Y(drop) + 2}H345`} stroke="#b3b59a" strokeWidth="1.4" />
              <path
                d={`M326 ${Y(drop) + 12}V${Y(H) + 4}M314 ${Y(H) + 4}H338`}
                stroke="#aab99a"
                strokeWidth="4"
              />
            </>
          )}
          {kind === 'wall' && (
            <>
              <path d={`M${X(hitDistance) + 4} 106V${Y(H) + 4}h13V106Z`} fill="#d4d8c1" />
              <path d={`M${X(hitDistance) + 3} 110V${Y(H) - 4}`} stroke="#f4f1e5" strokeWidth="4" />
            </>
          )}
          {marks.map((q, i) => (
            <circle key={i} cx={X(q.x)} cy={Y(q.y)} r="3.5" fill="#a99a76" />
          ))}
          <circle cx={at.x} cy={at.y} r={kind === 'sensor' ? 6 : 4} fill={`url(#${id}ball)`} />
          {kind === 'sensor' && <circle cx={at.x} cy={at.y} r="1.8" fill="#bca071" />}
          {kind === 'speed' && s.arrived && (
            <>
              <path
                d={`M140 ${Y(H) + 22}H${at.x}M140 ${Y(H) + 16}V${Y(H) + 28}M${at.x} ${Y(H) + 16}V${Y(H) + 28}`}
                stroke="#a39165"
              />
              <path d={`M122 86V${Y(H) + 4}M117 86H127M117 ${Y(H) + 4}H127`} stroke="#a39165" />
            </>
          )}
        </svg>
      </div>
      {showAnalysis ? (
        <div className="projectile-motion-analysis">
          <p>{t('取抛出点球心为原点，检验y/x²')}</p>
          <table>
            <thead>
              <tr>
                <th>x / m</th>
                <th>y / m</th>
                <th>y/x² / m⁻¹</th>
              </tr>
            </thead>
            <tbody>
              {dots
                .filter((q, i) => i > 0 && i % 2 === 0)
                .map((q, i) => (
                  <tr key={i}>
                    <td>{q.x.toFixed(3)}</td>
                    <td>{q.y.toFixed(3)}</td>
                    <td>{(q.y / q.x ** 2).toFixed(3)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p>y = [g/(2v₀²)] x²</p>
        </div>
      ) : kind === 'sensor' ? (
        <div className="projectile-motion-readings">
          <span>
            d₁ <b>{range.r1.toFixed(3)} m</b>
          </span>
          <span>
            d₂ <b>{range.r2.toFixed(3)} m</b>
          </span>
          <span>
            {t('交会坐标')}{' '}
            <b>
              ({range.recoveredX.toFixed(3)}, {range.recoveredY.toFixed(3)}) m
            </b>
          </span>
        </div>
      ) : kind === 'speed' ? (
        <div className="projectile-motion-speed">
          <p>
            h = {H.toFixed(2)} m · l = {s.arrived ? s.x.toFixed(3) : '—'} m
          </p>
          <strong>
            v₀ = l √[g/(2h)] = {s.arrived ? reconstructLaunchSpeed(s.x, H).toFixed(3) : '—'} m/s
          </strong>
        </div>
      ) : (
        <div className="projectile-motion-readings">
          <span>
            {t('离开装置后的时间')} <b>{airTime.toFixed(3)} s</b>
          </span>
          <span>
            {t('水平位移')} <b>{Math.max(0, s.x).toFixed(3)} m</b>
          </span>
          <span>
            {t('下落位移')} <b>{Math.max(0, s.y).toFixed(3)} m</b>
          </span>
        </div>
      )}
      <p className="projectile-motion-cause">
        {t(
          kind === 'pair'
            ? '水平初速度改变落点，不改变同高度的下落时间。'
            : kind === 'carbon' || kind === 'board' || kind === 'wall'
              ? '每次都从斜槽同一位置静止释放；不同轨迹点才属于同一条抛物线。'
              : kind === 'sensor'
                ? '两个距离有两个镜像交点；已知小球在接收器右侧，才能选定唯一位置。'
                : kind === 'parabola'
                  ? '比值近似恒定支持二次关系；原点必须正确，不能用0/0。'
                  : kind === 'speed'
                    ? '高度给出飞行时间，水平距离除以时间得到初速度。'
                    : '等时间水平位移相同；竖直位移与时间的平方对应。',
        )}
      </p>
      {!film.watch && (
        <div className="projectile-motion-controls">
          <Segments
            label={t('测量路径')}
            value={mode}
            onChange={(v) => {
              setMode(v);
              setTime(0.6);
            }}
            options={PATHS.map((value, i) => ({
              value,
              label: t(
                [
                  '频闪记录',
                  '同时释放',
                  '实验描迹',
                  '双接收器',
                  '木板落点',
                  '墙面落点',
                  '抛物线检验',
                  '测初速度',
                ][i],
              ),
            }))}
          />
          {kind === 'pair' ? (
            <Range
              label={t('水平投射速度')}
              value={v}
              min={1}
              max={1.7}
              step={0.05}
              unit="m/s"
              onChange={(q) => setRelease((7 * q * q) / (10 * 9.8))}
            />
          ) : (
            <Range
              label={t('斜槽释放高度')}
              value={release}
              min={0.08}
              max={0.2}
              step={0.01}
              unit="m"
              onChange={setRelease}
            />
          )}
          <Range
            label={t('桌面距地面高度')}
            value={height}
            min={0.4}
            max={0.9}
            step={0.05}
            unit="m"
            onChange={setHeight}
          />
          {kind === 'wall' && (
            <Range
              label={t('墙面水平距离')}
              value={hitDistance}
              min={0.1}
              max={v * Math.sqrt((2 * H) / 9.8) * 0.94}
              step={0.01}
              unit="m"
              onChange={setWallScreen}
            />
          )}
          {(kind === 'carbon' || kind === 'board') && (
            <Range
              label={t('接球面下落距离')}
              value={Math.min(screen, height)}
              min={0.1}
              max={height}
              step={0.05}
              unit="m"
              onChange={setScreen}
            />
          )}
          <Range
            label={t('模型时间')}
            value={Math.min(time, flightOnly ? flight.duration : end)}
            min={0}
            max={flightOnly ? flight.duration : end}
            step={0.005}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <p className="projectile-motion-note">
        {t(
          '理想无气阻；钢球在槽内纯滚动，末端水平。数值是模型数据；描迹按球心位置校正，首次接触接球面即停帧。',
        )}
      </p>
    </section>
  );
}
