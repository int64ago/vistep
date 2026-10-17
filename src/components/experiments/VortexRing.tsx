import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  vortexRing,
  vortexField,
  vortexTrail,
  vortexMarker,
  vortexShot,
} from '../../models/vortex-ring';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/vortex-ring.css';
export default function VortexRing() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [radius, setRadius] = useState(20),
    [circulation, setCirculation] = useState(1),
    [core, setCore] = useState(0.12),
    [elapsed, setElapsed] = useState(0),
    [lab, setLab] = useState(false),
    [angle, setAngle] = useState(0);
  const shot = film.watch
      ? vortexShot(film.chapter, film.chapterProgress)
      : {
          radius: radius / 1000,
          circulation: circulation / 1000,
          coreRatio: core,
          lab,
          angle,
          slice: angle < 0.2,
        },
    s = vortexRing(shot),
    sign = s.circulation < 0 ? -1 : 1,
    histories = useMemo(
      () =>
        [0.2, 0.65, 0.8, 1.2, -0.2, -0.65, -0.8, -1.2].map((y) => {
          const points = vortexTrail({ x: 0, y }, s.coreRatio, 32, 0.02, sign);
          return { points, poly: points.map((p) => `${p.x},${-p.y}`).join(' ') };
        }),
      [s.coreRatio, sign],
    ),
    W = phone ? 340 : 760,
    H = phone ? 280 : 360,
    cx = W / 2,
    cy = H / 2,
    scale = phone ? 2200 : 3400,
    time = film.watch ? (shot.lab ? 2 * film.chapterProgress : film.chapterTime * 0.1) : elapsed,
    xc = shot.lab ? s.self * time : 0,
    tau = (Math.abs(s.circulation) / s.radius ** 2) * time,
    unit = s.radius * scale,
    wire = Array.from({ length: 121 }, (_, i) => {
      const a = (i * 2 * Math.PI) / 120;
      return `${cx + xc * scale + Math.sin(a) * Math.sin(shot.angle) * unit},${cy - Math.cos(a) * unit}`;
    }).join(' '),
    axisCentre = vortexField(0, 0, 0, shot).axial,
    zero = Math.abs(s.circulation) < 1e-12;
  return (
    <section className="vortex-study">
      <header>
        {t(shot.angle > 0.05 ? '一个闭合涡环，转到经线切面' : '两个反向涡核，属于同一个涡环')}
      </header>
      <svg
        className="vortex-field"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('同一闭合涡丝的投影与经线切面，正则化毕奥萨伐尔速度场推动实际流体标记')}
      >
        <defs>
          <radialGradient id={`${id}core`}>
            <stop stopColor="#dbbe8b" stopOpacity=".7" />
            <stop offset="1" stopColor="#dbbe8b" stopOpacity=".06" />
          </radialGradient>
        </defs>
        {shot.lab &&
          [-0.04, -0.02, 0, 0.02, 0.04].map((x, i) => (
            <path
              key={i}
              d={`M${cx + x * scale} 15V${H - 15}`}
              stroke="#78999b"
              strokeDasharray="2 7"
              opacity=".3"
            />
          ))}
        <path d={`M20 ${cy}H${W - 20}`} stroke="#72969a" strokeDasharray="4 7" opacity=".3" />
        {((film.chapter === 0 && film.watch) || (!film.watch && shot.angle > 0.05)) && (
          <polyline points={wire} fill="none" stroke="#d7bb84" strokeWidth="2.8" opacity=".85" />
        )}
        {shot.slice && shot.angle < 0.2 && (
          <g transform={`translate(${cx + xc * scale} ${cy}) scale(${unit})`}>
            {!zero &&
              histories.map((h, j) => {
                const p = vortexMarker(h.points, tau);
                return (
                  <g key={j}>
                    <polyline
                      points={h.poly}
                      fill="none"
                      stroke="#8eafb0"
                      strokeWidth={1 / unit}
                      opacity=".35"
                    />
                    <circle
                      cx={p.x}
                      cy={-p.y}
                      r={(j === 0 ? 4 : 3) / unit}
                      fill={j === 0 ? '#e1c38d' : '#b4d0c6'}
                    />
                  </g>
                );
              })}
            {[-1, 1].map((y) => (
              <g key={y}>
                <circle cx="0" cy={-y} r={s.coreRatio * 2.2} fill={`url(#${id}core)`} />
                <circle
                  cx="0"
                  cy={-y}
                  r={s.coreRatio}
                  fill="none"
                  stroke="#d3b98a"
                  strokeWidth={1.3 / unit}
                />
                {!zero &&
                  (y * sign > 0 ? (
                    <circle cx="0" cy={-y} r={2.5 / unit} fill="#dfc591" />
                  ) : (
                    <path
                      d={`M${-3 / unit} ${-y - 3 / unit}l${6 / unit} ${6 / unit}m${-6 / unit} 0l${6 / unit} ${-6 / unit}`}
                      stroke="#dfc591"
                      strokeWidth={1.6 / unit}
                    />
                  ))}
              </g>
            ))}
          </g>
        )}
      </svg>
      <div className="vortex-reference">
        <span>{t(shot.lab ? '实验室参考系' : '随涡环移动的参考系')}</span>
        <span>{t('流体标记，非烟雾边界')}</span>
      </div>
      <div className="vortex-speed">
        <b>{(s.self * 1000).toFixed(1)} mm/s</b>
        <span>
          {t('环的轴向传播')}
          <br />R {(s.radius * 1000).toFixed(1)} mm · Γ {(s.circulation * 1000).toFixed(2)} ×10⁻³
          m²/s
        </span>
      </div>
      <div className="vortex-centre">
        <span>{t('轴心处流体速度')}</span>
        <span>{(axisCentre * 1000).toFixed(1)} mm/s</span>
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('涡丝、正则化核与观察参考系')}</summary>
          <p>
            {t(
              '同一正则化毕奥萨伐尔圆涡丝给出流体速度与环自身传播速度；轨迹在随环参考系中积分，再按需要加回实验室位移。圆圈是涡丝平面投影，切面两核不是两只独立涡环。核宽参数用平滑分母替代奇异涡丝，不等于均匀涡量实心核；图中光晕只定位核区，不预测烟雾浓度。固定核形、不可压缩、无黏性扩散；不模拟喷口生成、卷吸边界、破裂或湍流。运动慢放，读数保持物理单位。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="vortex-controls">
          <Range
            label={t('涡环半径')}
            value={radius}
            min={15}
            max={30}
            unit="mm"
            onChange={setRadius}
          />
          <Range
            label={t('有向环量')}
            value={circulation}
            min={-2}
            max={2}
            step={0.1}
            unit="×10⁻³m²/s"
            onChange={setCirculation}
          />
          <Range
            label={t('平滑核宽与环半径比')}
            value={core}
            min={0.08}
            max={0.2}
            step={0.02}
            onChange={setCore}
          />
          <Range
            label={t('模型经过时间')}
            value={elapsed}
            min={0}
            max={lab ? 1 : 3}
            step={0.01}
            unit="s"
            onChange={setElapsed}
          />
          <Range
            label={t('投影观察角')}
            value={(angle * 180) / Math.PI}
            min={0}
            max={90}
            onChange={(v) => setAngle((v * Math.PI) / 180)}
            unit="°"
          />
          <button
            type="button"
            aria-pressed={lab}
            onClick={() => {
              setLab(!lab);
              setElapsed(Math.min(elapsed, 1));
            }}
          >
            {t(lab ? '跟随涡环观察' : '固定实验室观察')}
          </button>
        </div>
      )}
    </section>
  );
}
