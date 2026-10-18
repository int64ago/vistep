import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  armKinematics,
  flickDrop,
  textbookFlick,
  wristPhone,
  javelinRelease,
  type Vec2,
} from '../../models/arm-motion-lab';
import '../../styles/arm-motion-lab.css';
type Mode =
  'flick' | 'vectors' | 'measure' | 'radius' | 'phone' | 'compare' | 'javelin' | 'research';
const colors = ['#8aa47e', '#b0a378', '#b58977'];
export default function ArmMotionLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', ''),
    [mode, setMode] = useState<Mode>(film.variant === 'required-2-javelin' ? 'javelin' : 'flick'),
    [time, setTime] = useState(0.32),
    [wrist, setWrist] = useState('moving'),
    [run, setRun] = useState(4),
    activeWrist = film.watch || wrist === 'moving',
    c = film.chapter,
    p = Math.min(1, film.chapterProgress / 0.8),
    kind: Mode = film.watch
      ? (
          [
            'flick',
            'vectors',
            'measure',
            'radius',
            'phone',
            'compare',
            'javelin',
            'research',
          ] as Mode[]
        )[Math.min(7, c)]
      : mode,
    throwing = kind === 'javelin' || kind === 'research',
    phone = kind === 'phone',
    throwTime = film.watch && kind === 'javelin' ? 0.22 + 0.07 * p : 0.29,
    runValue = film.watch ? (kind === 'research' ? 4 * p : 0) : run,
    source = kind === 'measure' || kind === 'radius' || kind === 'compare',
    tm = film.watch
      ? kind === 'vectors'
        ? 0.12 + 0.24 * p
        : throwing
          ? 0.29
          : phone
            ? 0.1 + 0.28 * p
            : 0.46 * p
      : Math.min(time, 0.46),
    a = phone
      ? wristPhone(tm).state
      : throwing
        ? javelinRelease(runValue, throwTime).state
        : armKinematics(tm, activeWrist),
    offset = throwing ? a.points[0].x : 0,
    P = (v: Vec2) => ({
      x: (throwing ? 230 : 200) + (v.x - offset) * 240,
      y: (throwing ? 240 : 200) - v.y * 240,
    }),
    pts = a.points.map(P),
    tip = pts[3],
    drop = flickDrop(tm),
    ds = P(drop),
    data = textbookFlick(),
    sensor = wristPhone(tm),
    throwState = javelinRelease(runValue, throwTime),
    trace = Array.from({ length: Math.floor(tm / 0.02) + 1 }, (_, i) =>
      P(armKinematics(i * 0.02, activeWrist).tip),
    );
  const arrow = (start: Vec2, v: Vec2, color: string, scale = 14) => {
    const end = { x: start.x + v.x * scale, y: start.y - v.y * scale };
    return (
      <path
        d={`M${start.x} ${start.y}L${end.x} ${end.y}`}
        stroke={color}
        strokeWidth="2.4"
        fill="none"
        markerEnd={`url(#${id}-arrow)`}
      />
    );
  };
  return (
    <section className="arm-motion-lab">
      <header>
        <p>
          {t(
            source
              ? kind === 'measure'
                ? '从真实尺寸与帧间隔开始'
                : kind === 'radius'
                  ? '教材怎样估算指尖的向心加速度？'
                  : '两种估算接近，但精度不能凭空提高'
              : phone
                ? '先弄清手机在测哪一个点'
                : throwing
                  ? '把助跑与手臂运动放在同一参考系'
                  : '肩、肘、腕的运动，一起到达指尖',
          )}
        </p>
        <span>
          {t(
            source
              ? '教材数值重算 · 示意图并非原始照片'
              : throwing
                ? '参考课题 · 构型示意，不是动作指导'
                : '独立关节运动示意 · 不是教材照片的拟合',
          )}
        </span>
      </header>
      <div className="arm-motion-stage">
        <svg
          viewBox="0 0 440 370"
          role="img"
          aria-label={t(
            source
              ? '分别呈现帧间位移与局部转弯半径的教材测量示意'
              : '上臂、前臂和手掌保持长度不变，关节运动与指尖轨迹来自同一个运动模型',
          )}
        >
          <defs>
            <marker
              id={`${id}-arrow`}
              viewBox="0 0 8 8"
              refX="6"
              refY="4"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M1 1L7 4L1 7" stroke="#8c9f79" strokeWidth="1.2" fill="none" />
            </marker>
          </defs>
          {source ? (
            <>
              <path d="M29 26Q220 17 411 26V332Q220 343 29 332Z" fill="#f3efdf" stroke="#e0dfca" />
              <path d="M55 276h328" stroke="#c5cdb5" />
              {Array.from({ length: 27 }, (_, i) => (
                <path
                  key={i}
                  d={`M${65 + i * 11.5} 276v${i % 5 === 0 ? 12 : 6}`}
                  stroke="#b2bea2"
                />
              ))}
              <path d="M110 210H266" stroke="#af9b72" strokeWidth="2" strokeDasharray="4 5" />
              <circle cx="110" cy="210" r="5" fill="#b19d77" />
              <circle cx="266" cy="210" r="5" fill="#8ba57b" />
              <text x="106" y="242" fontSize="24" fill="#8e9e78">
                A
              </text>
              <text x="261" y="242" fontSize="24" fill="#8e9e78">
                B
              </text>
              {kind !== 'measure' ? (
                <>
                  <path d="M266 108V210" stroke="#a6b894" strokeWidth="2" />
                  <circle cx="266" cy="108" r="5" fill="#adbc99" />
                  <path
                    d="M324.5 191.5A102 102 0 0 1 208 191.7"
                    stroke="#bdc8a7"
                    fill="none"
                    strokeWidth="2"
                  />
                  <text x="283" y="111" fontSize="24" fill="#8d9e79">
                    N
                  </text>
                  <text x="282" y="163" fontSize="24" fill="#8d9e79">
                    17 cm
                  </text>
                </>
              ) : (
                <>
                  <text x="190" y="58" textAnchor="middle" fontSize="24" fill="#8c9e76">
                    65 cm
                  </text>
                  <path d="M327 48h44v36h-44Z" fill="#d9ddc4" stroke="#b8c4a8" />
                  <circle cx="349" cy="65" r="9" fill="#b0c0a0" />
                </>
              )}
              <text x="188" y="191" textAnchor="middle" fontSize="24" fill="#a18c68">
                26 cm
              </text>
              <text x="220" y="319" textAnchor="middle" fontSize="24" fill="#8e9d79">
                25 fps · Δt = 0.04 s
              </text>
            </>
          ) : (
            <>
              {!throwing && (
                <path
                  d="M192 184Q166 171 146 186L135 289Q159 314 190 298L204 218"
                  fill="#e0e5cf"
                  stroke="#c5d0b6"
                  strokeWidth="2"
                />
              )}
              {throwing && (
                <>
                  <path
                    d="M228 235Q200 211 183 236L173 295L200 299Z"
                    fill="#d9e1c8"
                    stroke="#bdcbb0"
                    strokeWidth="2"
                  />
                  <path
                    d="M184 292L157 324L119 334M198 296L239 329H280"
                    stroke="#c1cdb2"
                    strokeWidth="13"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <ellipse cx="190" cy="207" rx="16" ry="19" fill="#d1bea0" />
                </>
              )}
              {!throwing && <ellipse cx="169" cy="154" rx="16" ry="19" fill="#d3bfa0" />}
              {!throwing &&
                !phone &&
                trace.map((q, i) => (
                  <circle key={i} cx={q.x} cy={q.y} r="2" fill="#adbca0" opacity=".5" />
                ))}
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <path
                    d={`M${pts[i].x} ${pts[i].y}L${pts[i + 1].x} ${pts[i + 1].y}`}
                    stroke={i === 0 ? '#c2ceb0' : i === 1 ? '#d2bd9c' : '#d9c7ac'}
                    strokeWidth={[19, 14, 10][i]}
                    strokeLinecap="round"
                  />
                  <path
                    d={`M${pts[i].x} ${pts[i].y}L${pts[i + 1].x} ${pts[i + 1].y}`}
                    stroke={colors[i]}
                    strokeWidth="1.6"
                    strokeDasharray={i === 0 ? '3 4' : undefined}
                  />
                  <circle
                    cx={pts[i].x}
                    cy={pts[i].y}
                    r="4.5"
                    fill="#f0eddb"
                    stroke={colors[i]}
                    strokeWidth="1.5"
                  />
                </g>
              ))}
              {phone ? (
                <g
                  transform={`translate(${pts[2].x} ${pts[2].y}) rotate(${(-sensor.angle * 180) / Math.PI})`}
                >
                  <rect
                    x="-20"
                    y="-11"
                    width="40"
                    height="22"
                    rx="4"
                    fill="#a8b69b"
                    stroke="#8d9e80"
                  />
                  <rect x="-16" y="-8" width="31" height="16" rx="2" fill="#e1e8cf" />
                  <circle r="2.5" fill="#bb9979" />
                  <path
                    d="M0 0h28m-3 -3l3 3-3 3M0 0v-22m-3 3l3-3 3 3"
                    stroke="#9da986"
                    fill="none"
                  />
                </g>
              ) : throwing ? (
                <g transform={`translate(${tip.x} ${tip.y}) rotate(-22)`}>
                  <path d="M-103 0H129" stroke="#b4aa85" strokeWidth="2.8" />
                  <path d="M129 0l-12 -2v4Z" fill="#a4ad9b" />
                  <path d="M-9 -2h18v4h-18Z" fill="#a08a67" />
                </g>
              ) : kind === 'flick' && activeWrist ? (
                <>
                  <path
                    d={Array.from(
                      { length: Math.max(1, Math.floor(Math.max(0, tm - 0.36) / 0.005) + 1) },
                      (_, i) => {
                        const q = P(flickDrop(0.36 + i * 0.005));
                        return `${i ? 'L' : 'M'}${q.x} ${q.y}`;
                      },
                    ).join(' ')}
                    stroke="#b2c1ca"
                    strokeDasharray="2 5"
                    fill="none"
                  />
                  <circle cx={ds.x} cy={ds.y} r="3.5" fill="#a3bac7" />
                </>
              ) : null}
              {(kind === 'vectors' || throwing) && (
                <>
                  {arrow(
                    tip,
                    throwing ? throwState.relative.velocity : a.velocity,
                    '#7f9d71',
                    throwing ? 13 : 15,
                  )}
                  {throwing &&
                    arrow(
                      {
                        x: tip.x + throwState.relative.velocity.x * 13,
                        y: tip.y - throwState.relative.velocity.y * 13,
                      },
                      throwState.transport,
                      '#b7a16f',
                      13,
                    )}
                </>
              )}
            </>
          )}
        </svg>
      </div>
      {source ? (
        <div className="arm-motion-source">
          <p>
            {kind === 'measure'
              ? 'v ≈ 0.26 / 0.04 = 6.5 m/s'
              : kind === 'radius'
                ? `a ≈ 6.5² / 0.17 ≈ ${data.normal.toFixed(0)} m/s² ≈ 25g`
                : 'a_B / a_N ≈ 2.2² / (3/5) ≈ 8'}
          </p>
          {kind === 'compare' && <p>8 × 32 = 256 m/s² ≈ 249 m/s²</p>}
          <span>
            {t(
              kind === 'measure'
                ? '65厘米用于照片比例标定；26厘米是相邻帧指尖位移。'
                : '教材采用末段局部圆周近似；一般关节运动须完整计算矢量加速度。',
            )}
          </span>
        </div>
      ) : phone ? (
        <div className="arm-motion-readings">
          <span>
            {t('沿前臂原始读数')}
            <b>{sensor.rawAlong.toFixed(1)} m/s²</b>
          </span>
          <span>
            {t('去除重力后的同轴读数')}
            <b>{sensor.coordinateAlong.toFixed(1)} m/s²</b>
          </span>
          <p>{t('以上是模型读数；教材另一次手腕测量给出约32 m/s²。')}</p>
        </div>
      ) : throwing ? (
        <div className="arm-motion-readings">
          <span>
            {t('助跑贡献')}
            <b>{throwState.transport.x.toFixed(1)} m/s</b>
          </span>
          <span>
            {t('手相对肩的速率')}
            <b>{throwState.relative.speed.toFixed(2)} m/s</b>
          </span>
          <span>
            {t('合速度大小')}
            <b>{throwState.speed.toFixed(2)} m/s</b>
          </span>
        </div>
      ) : (
        <div className="arm-motion-readings">
          <span>
            {t('指尖模型速率')}
            <b>{a.speed.toFixed(2)} m/s</b>
          </span>
          <span>
            {t('模型时间')}
            <b>{tm.toFixed(3)} s</b>
          </span>
        </div>
      )}
      {kind === 'vectors' && (
        <div className="arm-motion-vectors">
          <p>{t('每一段贡献都是矢量，方向也参与相加。')}</p>
          <svg
            viewBox="0 0 440 220"
            role="img"
            aria-label={t('三段运动的速度贡献首尾相接，合矢量从起点连到终点')}
          >
            <path d="M40 80H400M90 15V205" stroke="#d6ddc6" strokeWidth="1" />
            {a.components.map((v, i) => {
              const prev = a.components
                .slice(0, i)
                .reduce((sum, q) => ({ x: sum.x + q.x, y: sum.y + q.y }), { x: 0, y: 0 });
              return (
                <g key={i}>
                  {arrow({ x: 90 + prev.x * 18, y: 80 - prev.y * 18 }, v, colors[i], 18)}
                </g>
              );
            })}
            {arrow({ x: 90, y: 80 }, a.velocity, '#7d9871', 18)}
          </svg>
        </div>
      )}
      <p className="arm-motion-cause">
        {t(
          kind === 'flick' && activeWrist
            ? '水滴脱离后沿当时速度飞出，随后受重力改变方向。'
            : kind === 'phone'
              ? '手机测在手腕，腕关节保持不转；坐标轴会随前臂转动。'
              : throwing
                ? '速度按矢量相加，速率不能直接相加；还需测量出手方向与动作时序。'
                : source
                  ? '这些数值属于教材中的一次研究，不是所有人、所有动作的固定结果。'
                  : '指尖速度来自肩、肘、腕共同运动；不是只看最末一段。',
        )}
      </p>
      {!film.watch && (
        <div className="arm-motion-controls">
          <Segments
            label={t('研究步骤')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'flick', label: t('甩手轨迹') },
              { value: 'vectors', label: t('速度合成') },
              { value: 'measure', label: t('照片测量') },
              { value: 'radius', label: t('局部估算') },
              { value: 'phone', label: t('手机测量') },
              { value: 'compare', label: t('交叉比较') },
              { value: 'javelin', label: t('标枪课题') },
            ]}
          />
          {throwing ? (
            <Range
              label={t('助跑贡献')}
              value={run}
              min={0}
              max={7}
              step={0.1}
              unit="m/s"
              onChange={setRun}
            />
          ) : (
            !source && (
              <>
                <Range
                  label={t('模型时间')}
                  value={time}
                  min={0}
                  max={0.46}
                  step={0.001}
                  unit="s"
                  onChange={setTime}
                />
                {!phone && (
                  <Segments
                    label={t('腕关节')}
                    value={wrist}
                    onChange={setWrist}
                    options={[
                      { value: 'moving', label: t('参与转动') },
                      { value: 'fixed', label: t('保持固定') },
                    ]}
                  />
                )}
              </>
            )
          )}
        </div>
      )}
      <p className="arm-motion-note">
        {t(
          '关节角度是示意输入，未使用肌肉动力学。水滴释放时刻预先指定，不把任意动作与25g绑定；标枪不模拟离手后的空气动力。',
        )}
      </p>
    </section>
  );
}
