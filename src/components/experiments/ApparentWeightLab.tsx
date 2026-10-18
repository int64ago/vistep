import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  apparentMotion,
  leakingBottle,
  squatKnee,
  type WeightTrial,
} from '../../models/apparent-weight-lab';
import '../../styles/apparent-weight-lab.css';
function Person({ drop = 0 }: { drop?: number }) {
  const hip = 0.82 + drop,
    k = squatKnee(hip),
    feet = 225,
    scale = 110,
    hy = feet - hip * scale,
    ky = feet - k.height * scale;
  return (
    <g>
      <path
        d={`M151 ${hy}L${151 + k.x * scale} ${ky}L151 ${feet}M139 ${hy}L${139 + k.x * scale} ${ky}L139 ${feet}`}
        stroke="#98ae9a"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M133 ${hy - 54}Q146 ${hy - 60}159 ${hy - 52}L163 ${hy}Q145 ${hy + 7}130 ${hy}Z`}
        fill="#c7d4ba"
        stroke="#91a78c"
      />
      <path
        d={`M134 ${hy - 46}L121 ${hy - 21}L151 ${hy - 19}M156 ${hy - 44}L175 ${hy - 25}L194 ${hy - 42}`}
        stroke="#c2d0b5"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={`M141 ${hy - 56}v-10h12v12`} fill="#d4bea2" />
      <ellipse cx="147" cy={hy - 80} rx="14" ry="17" fill="#d4bea2" />
      <path
        d={`M133 ${hy - 82}Q128 ${hy - 100}147 ${hy - 99}Q165 ${hy - 98}161 ${hy - 82}L155 ${hy - 91}L139 ${hy - 91}Z`}
        fill="#87968a"
      />
      <path d="M136 228h20M148 230h21" stroke="#7d9480" strokeWidth="8" strokeLinecap="round" />
      <circle cx="146" cy={hy - 23} r="3" fill="#a58c61" />
    </g>
  );
}
export default function ApparentWeightLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [mode, setMode] = useState<'squat' | 'lift' | 'bottle'>(
      film.variant?.includes('bottle')
        ? 'bottle'
        : film.variant?.includes('elevator')
          ? 'lift'
          : 'squat',
    ),
    [time, setTime] = useState(1),
    [mass, setMass] = useState(60),
    [direction, setDirection] = useState('up'),
    [instrument, setInstrument] = useState('scale');
  const c = film.chapter,
    p = film.chapterProgress,
    trial = film.watch ? (c < 2 ? 'squat' : c < 4 ? 'lift' : 'bottle') : mode,
    isBottle = trial === 'bottle',
    dir = film.watch ? (c === 3 ? -1 : 1) : direction === 'up' ? 1 : -1,
    platform = film.watch ? c === 1 : instrument === 'platform',
    physical = film.watch
      ? trial === 'squat'
        ? Math.min(1, p / 0.82) * (c === 0 ? 2.4 : 4.8)
        : trial === 'lift'
          ? Math.min(1, p / 0.85) * 8
          : c === 4
            ? -0.1
            : -0.2 + Math.min(1, p / 0.78) * 0.62
      : time;
  const s = apparentMotion((isBottle ? 'squat' : trial) as WeightTrial, physical, mass, dir),
    b = leakingBottle(physical, film.watch ? c === 5 : true),
    weightState =
      Math.abs(s.a) < 0.02 ? '读数等于静止值' : s.a > 0 ? '读数高于静止值' : '读数低于静止值';
  const record = Array.from({ length: 121 }, (_, i) => {
      const q = apparentMotion(
        (isBottle ? 'squat' : trial) as WeightTrial,
        (i * s.duration) / 120,
        mass,
        dir,
      );
      return q.time <= s.time ? q : null;
    }).filter((q) => q !== null),
    curve = record
      .map(
        (q, i) =>
          `${i ? 'L' : 'M'}${34 + (q.time / s.duration) * 292} ${105 - ((q.normal - s.gravity) / mass) * 35}`,
      )
      .join(' ');
  return (
    <section className="apparent-weight-lab">
      <header>
        <p>
          {t(
            isBottle
              ? b.released
                ? '瓶与水一起自由下落，持续水流消失'
                : '静止时，水的压力差推动水流'
              : trial === 'squat'
                ? '下蹲与站起，体重计读数为何改变？'
                : '看加速度，不能只看电梯向哪走',
          )}
        </p>
        <span>
          {t(
            isBottle
              ? '漏水瓶 · 完全失重'
              : trial === 'squat'
                ? '身体运动 · 支持力'
                : '升降机 · 支持力',
          )}
        </span>
      </header>
      <div className={`apparent-weight-composition ${isBottle ? 'is-bottle' : ''}`}>
        {isBottle ? (
          <>
            <div className="apparent-weight-bottle">
              <svg
                viewBox="0 0 350 390"
                role="img"
                aria-label={t('通气水瓶释放后，瓶和水一起下落，旧水滴继续飞行')}
              >
                <defs>
                  <linearGradient id={`${id}glass`}>
                    <stop stopColor="#e1ece3" stopOpacity=".35" />
                    <stop offset=".3" stopColor="#f6f7ee" stopOpacity=".65" />
                    <stop offset="1" stopColor="#c7dccd" stopOpacity=".4" />
                  </linearGradient>
                  <clipPath id={`${id}drops`}>
                    <rect x="10" y="0" width="335" height="385" />
                  </clipPath>
                </defs>
                <path d="M44 32V358M38 32H50M38 358H50" stroke="#d2ddcb" />
                <g transform={`translate(0 ${-b.z * 170})`}>
                  <path
                    d="M108 26H132V49Q132 56 149 64V147Q149 156 139 156H101Q91 156 91 147V64Q108 56 108 49Z"
                    fill={`url(#${id}glass)`}
                    stroke="#abc7b6"
                    strokeWidth="2"
                  />
                  <path
                    d="M94 115.6H146V146Q146 153 138 153H102Q94 153 94 146Z"
                    fill="#b4d8c7"
                    fillOpacity=".65"
                  />
                  <path
                    d="M94 115.6Q120 118 146 115.6M98 126H142M98 142H142"
                    stroke="#94bcab"
                    strokeOpacity=".5"
                  />
                  <circle cx="149" cy="136" r="2.8" fill="#84b19d" />
                  <path d="M104 26H136" stroke="#a4bcaa" strokeWidth="3" />
                  <path d="M162 115.6V136M158 115.6H166M158 136H166" stroke="#a4ba9d" />
                </g>
                <g clipPath={`url(#${id}drops)`}>
                  {b.drops.map((q, i) => (
                    <circle
                      key={i}
                      cx={149 + q.x * 170}
                      cy={136 - q.z * 170}
                      r="1.8"
                      fill="#8dbfa9"
                      opacity={Math.max(0.08, 1 - i / 100)}
                    />
                  ))}
                </g>
                <path d="M71 363H310" stroke="#d3ddca" />
              </svg>
            </div>
            <div className="apparent-weight-measure">
              <p>{t('孔口内外压差')}</p>
              <strong>
                {b.pressure.toFixed(0)} <small>Pa</small>
              </strong>
              <span>
                {t(b.released ? '新水流停止，已喷出的水滴继续运动' : '水面与空气相通，水头12 cm')}
              </span>
              <p>{t('瓶的加速度')}</p>
              <b>{b.a.toFixed(1)} m/s²</b>
              <p>{t('有效重力')}</p>
              <b>g + a = {b.effectiveGravity.toFixed(1)} m/s²</b>
            </div>
          </>
        ) : (
          <>
            <div className="apparent-weight-person">
              <svg
                viewBox="0 0 350 285"
                role="img"
                aria-label={t(
                  trial === 'squat'
                    ? '足部停在秤面，关节随下蹲弯曲，质心与支持力对应'
                    : '电梯里的人站在秤面，井道刻线显示电梯运动',
                )}
              >
                <defs>
                  <clipPath id={`${id}shaft`}>
                    <rect x="20" y="16" width="309" height="249" rx="18" />
                  </clipPath>
                </defs>
                {trial === 'lift' && (
                  <g clipPath={`url(#${id}shaft)`}>
                    <path d="M32 10V270M318 10V270" stroke="#d5ddca" strokeWidth="3" />
                    {Array.from({ length: 23 }, (_, i) => (
                      <path
                        key={i}
                        d={`M22 ${i * 32 - 320 + s.z * 35}H47M303 ${i * 32 - 320 + s.z * 35}H329`}
                        stroke="#becbb1"
                        strokeWidth="3"
                      />
                    ))}
                    <rect
                      x="56"
                      y="18"
                      width="242"
                      height="242"
                      rx="16"
                      fill="#eef0e6"
                      fillOpacity=".6"
                      stroke="#c4d1b8"
                    />
                    <path d="M56 43H298" stroke="#d3dcc5" />
                  </g>
                )}
                <Person drop={trial === 'squat' ? s.z : 0} />
                <path d="M92 259H260" stroke="#d4d7c7" strokeWidth="4" />
                <rect
                  x="106"
                  y="235"
                  width="105"
                  height="22"
                  rx="7"
                  fill={platform ? '#a9bda6' : '#d5d3bc'}
                  stroke="#a4b69b"
                />
                <rect x="139" y="240" width="40" height="12" rx="3" fill="#e8edda" />
                {platform && <path d="M210 245Q253 246 253 220V185" stroke="#a1b198" fill="none" />}
                <path
                  d={`M233 202v${-s.normal / 16}m-4 6 4-6 4 6`}
                  stroke="#8ca77d"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d={`M263 147v${s.gravity / 16}m-4-6 4 6 4-6`}
                  stroke="#b29b73"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              <div className="apparent-weight-reading">
                <span>{t(platform ? '力传感器示数' : '体重计示数')}</span>
                <strong>
                  {platform ? s.normal.toFixed(1) : s.scaleMass.toFixed(1)}{' '}
                  <small>{platform ? 'N' : 'kg'}</small>
                </strong>
                <span>{t(weightState)}</span>
              </div>
            </div>
            <div className="apparent-weight-analysis">
              <div className="apparent-weight-kinematics">
                <span>
                  v <b>{s.v.toFixed(2)} m/s</b>
                </span>
                <span>
                  a <b>{s.a.toFixed(2)} m/s²</b>
                </span>
              </div>
              <p>
                {t('支持力记录')} <span>{t('虚线：静止时mg')}</span>
              </p>
              <svg
                viewBox="0 0 350 170"
                role="img"
                aria-label={t('支持力相对于重力基线变化，曲线只显示已经发生的时刻')}
              >
                <path d="M34 22V141H326" stroke="#c3cfb4" fill="none" />
                <path d="M34 105H326" stroke="#b6a684" strokeDasharray="4 5" />
                <path d={curve} stroke="#8ca57b" strokeWidth="2.5" fill="none" />
                {record.length > 0 && (
                  <circle
                    cx={34 + (s.time / s.duration) * 292}
                    cy={105 - ((s.normal - s.gravity) / mass) * 35}
                    r="4"
                    fill="#9b8c64"
                  />
                )}
                <text x="34" y="19" fontSize="21" fill="#80916f">
                  N
                </text>
                <text x="326" y="166" fontSize="21" textAnchor="end" fill="#80916f">
                  t / s
                </text>
              </svg>
              <p className="apparent-weight-law">N − mg = ma</p>
              <span className="apparent-weight-axis">
                {t('竖直向上为正；人体质量与重力保持不变')}
              </span>
            </div>
          </>
        )}
      </div>
      <p className="apparent-weight-cause">
        {t(
          isBottle
            ? '水流来自压力差；自由下落减小这个压力差，地球引力仍然存在。'
            : '读数改变的是支持力。正在下降的人，减速时也可能超重。',
        )}
      </p>
      {!film.watch && (
        <div className="apparent-weight-controls">
          <Segments
            label={t('实验路径')}
            value={mode}
            onChange={(v) => {
              setMode(v);
              setTime(v === 'bottle' ? -0.15 : 1);
            }}
            options={[
              { value: 'squat', label: t('蹲起') },
              { value: 'lift', label: t('电梯') },
              { value: 'bottle', label: t('漏水瓶') },
            ]}
          />
          {!isBottle && (
            <>
              <Range
                label={t('人体质量')}
                value={mass}
                min={40}
                max={100}
                step={1}
                unit="kg"
                onChange={setMass}
              />
              {trial === 'lift' ? (
                <Segments
                  label={t('电梯方向')}
                  value={direction}
                  onChange={setDirection}
                  options={[
                    { value: 'up', label: t('向上') },
                    { value: 'down', label: t('向下') },
                  ]}
                />
              ) : (
                <Segments
                  label={t('测量仪器')}
                  value={instrument}
                  onChange={setInstrument}
                  options={[
                    { value: 'scale', label: t('体重计') },
                    { value: 'platform', label: t('力传感器') },
                  ]}
                />
              )}
            </>
          )}
          <Range
            label={t('模型时间')}
            value={Math.min(isBottle ? 0.42 : s.duration, Math.max(isBottle ? -0.2 : 0, time))}
            min={isBottle ? -0.2 : 0}
            max={isBottle ? 0.42 : s.duration}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <p className="apparent-weight-note">
        {t(
          isBottle
            ? '开口通气、短时水位近似不变；忽略释放瞬间的流体惯性、表面张力与空气阻力。'
            : '人体用规定的平滑质心轨迹近似；仪表瞬时响应，未模拟人体自然晃动和仪表滤波。',
        )}
      </p>
    </section>
  );
}
