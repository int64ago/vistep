import { useState } from 'react';
import { t } from '../../i18n';
import {
  coriolisFrame,
  coriolisShot,
  coriolisTrail,
  type CoriolisConfig,
  type RotationPoint,
} from '../../models/coriolis';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import { Range } from '../lab/Controls';
import '../../styles/coriolis.css';

function Plate({
  config,
  time,
  frame,
  vectors = false,
}: {
  config: CoriolisConfig;
  time: number;
  frame: 'laboratory' | 'table';
  vectors?: boolean;
}) {
  const s = coriolisFrame(config, time),
    // Fit the entire eight-second experiment, not each moving frame.
    scale = Math.min(105, 135 / Math.max(1, Math.hypot(s.velocity.x * 8, config.offset)));
  const extent = Math.max(Math.abs(config.offset), Math.hypot(s.velocity.x * 8, config.offset));
  const accelerationBound = Math.max(
    2 * Math.abs(config.omega) * (Math.abs(s.velocity.x) + Math.abs(config.omega) * extent),
    config.omega ** 2 * extent,
  );
  // One common vector scale for the entire selected experiment, including extreme releases.
  const vectorScale = Math.min(180, (146 - extent * scale) / (accelerationBound || 1));
  const pt = (p: RotationPoint) => ({ x: 170 + p.x * scale, y: 170 - p.y * scale });
  const puck = pt(s[frame]),
    origin = pt(s.initial);
  const trail = coriolisTrail(config, time, frame);
  const path = trail.map((p, i) => `${i ? 'L' : 'M'}${pt(p).x},${pt(p).y}`).join('');
  const angle = frame === 'laboratory' ? (-s.angle * 180) / Math.PI : 0;
  const arrow = (v: RotationPoint, color: string) => {
    if (Math.hypot(v.x, v.y) < 1e-12) return null;
    const end = { x: puck.x + v.x * vectorScale, y: puck.y - v.y * vectorScale };
    const a = Math.atan2(end.y - puck.y, end.x - puck.x);
    return (
      <g key={color} stroke={color} strokeWidth="2.4" fill="none">
        <path d={`M${puck.x} ${puck.y}L${end.x} ${end.y}`} />
        <path
          d={`M${end.x - 7 * Math.cos(a - 0.5)} ${end.y - 7 * Math.sin(a - 0.5)}L${end.x} ${end.y}L${end.x - 7 * Math.cos(a + 0.5)} ${end.y - 7 * Math.sin(a + 0.5)}`}
        />
      </g>
    );
  };
  return (
    <figure className="coriolis-plate">
      <figcaption>
        {t(frame === 'laboratory' ? '固定相机' : '随盘相机')}
        <span>{time.toFixed(1)} s</span>
      </figcaption>
      <svg
        viewBox="0 0 340 340"
        role="img"
        aria-label={t(
          frame === 'laboratory'
            ? '滑块在固定坐标中沿直线前进'
            : '同一滑块在旋转坐标中形成弯曲轨迹',
        )}
      >
        <circle
          cx="170"
          cy="170"
          r={1.36 * scale}
          fill="#18383b"
          stroke="#628582"
          strokeWidth="1"
        />
        <g transform={`rotate(${angle} 170 170)`}>
          {[0.35, 0.7, 1.05].map((r) => (
            <circle
              key={r}
              cx="170"
              cy="170"
              r={r * scale}
              fill="none"
              stroke="#608780"
              strokeOpacity=".25"
            />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d={`M170 ${170 - 1.34 * scale}V${170 + 1.34 * scale}`}
              stroke="#86aaa0"
              strokeOpacity={i === 0 ? 0.55 : 0.12}
              transform={`rotate(${i * 15} 170 170)`}
            />
          ))}
          <circle cx="170" cy={170 - 1.29 * scale} r="5" fill="#9ed5c6" />
        </g>
        <path d={path} fill="none" stroke="#e9bd77" strokeWidth="3.4" strokeLinecap="round" />
        {trail
          .filter((_, i) => i % 10 === 0)
          .map((p, i) => (
            <circle key={i} cx={pt(p).x} cy={pt(p).y} r="2.5" fill="#e9bd77" />
          ))}
        <circle cx={origin.x} cy={origin.y} r="5" fill="none" stroke="#e9bd77" />
        {vectors && (
          <>
            {arrow(s.coriolis, '#e7a19a')}
            {arrow(s.centrifugal, '#9bcdd7')}
          </>
        )}
        <circle cx={puck.x} cy={puck.y + 3} r="12" fill="#071e23" opacity=".5" />
        <circle cx={puck.x} cy={puck.y} r="10" fill="#e8c78d" stroke="#fff0cd" strokeWidth="1.4" />
        <circle cx={puck.x - 2} cy={puck.y - 3} r="3" fill="#fff2cf" />
      </svg>
    </figure>
  );
}

export default function Coriolis() {
  const demo = useShowcase(),
    compact = useCompact();
  const [omega, setOmega] = useState(0.42),
    [speed, setSpeed] = useState(0.105),
    [offset, setOffset] = useState(0),
    [time, setTime] = useState(6);
  const [camera, setCamera] = useState<'laboratory' | 'table'>('table');
  const shot = coriolisShot(demo.chapter, demo.chapterProgress);
  const c = demo.watch ? shot.config : { omega, speed, offset },
    now = demo.watch ? shot.time : time;
  const s = coriolisFrame(c, now),
    primary = demo.watch ? shot.primary : camera;
  return (
    <div className="coriolis-study" data-chapter={demo.chapter}>
      <div className="coriolis-kicker">
        <span>{t('同一枚自由滑块')}</span>
        <span>Ω {c.omega.toFixed(2)} rad/s</span>
      </div>
      <div className="coriolis-cameras">
        {compact ? (
          <Plate config={c} time={now} frame={primary} vectors={demo.chapter === 6} />
        ) : (
          <>
            <Plate config={c} time={now} frame="laboratory" />
            <Plate config={c} time={now} frame="table" vectors={demo.chapter === 6} />
          </>
        )}
      </div>
      <div className="coriolis-observation">
        <span className="coriolis-dot" />
        {t(
          primary === 'laboratory' ? '释放后，没有水平外力。' : '金色轨迹记录滑块相对转盘的位置。',
        )}
      </div>
      {demo.chapter === 6 && (
        <div className="coriolis-vector-key">
          <span>{t('红：科里奥利项')}</span>
          <span>{t('蓝：离心项')}</span>
        </div>
      )}
      {compact && (
        <div className="coriolis-comparison">
          <span>{t('固定坐标轨迹')}</span>
          <svg viewBox="0 0 180 38" aria-hidden="true">
            <path d="M8 20H172" stroke="#8ca29b" strokeOpacity=".4" />
            <path
              d={`M90 20H${90 + (s.laboratory.x / Math.max(1, Math.abs(s.velocity.x * 8))) * 74}`}
              stroke="#e9bd77"
              strokeWidth="3"
            />
            <circle
              cx={90 + (s.laboratory.x / Math.max(1, Math.abs(s.velocity.x * 8))) * 74}
              cy="20"
              r="4"
              fill="#e9bd77"
            />
          </svg>
          <span>{t('始终为直线')}</span>
        </div>
      )}
      {!demo.watch && (
        <div className="coriolis-explore">
          <div className="coriolis-switch">
            {(['laboratory', 'table'] as const).map((v) => (
              <button
                type="button"
                key={v}
                aria-pressed={camera === v}
                onClick={() => setCamera(v)}
              >
                {t(v === 'laboratory' ? '固定相机' : '随盘相机')}
              </button>
            ))}
          </div>
          <Range
            label={t('转盘角速度')}
            value={omega}
            min={-0.8}
            max={0.8}
            step={0.01}
            unit="rad/s"
            onChange={setOmega}
          />
          <Range
            label={t('相对转盘的释放速度')}
            value={speed}
            min={0.06}
            max={0.14}
            step={0.005}
            unit="m/s"
            onChange={setSpeed}
          />
          <Range
            label={t('释放点偏移')}
            value={offset}
            min={-0.3}
            max={0.3}
            step={0.01}
            unit="m"
            onChange={setOffset}
          />
          <Range
            label={t('释放后的时间')}
            value={time}
            min={0}
            max={8}
            step={0.05}
            unit="s"
            onChange={setTime}
          />
          <p>
            {t('固定相机中的速度')} {s.velocity.x.toFixed(3)} m/s
          </p>
        </div>
      )}
      <details className="coriolis-method">
        <summary>{t('坐标与模型边界')}</summary>
        <p>
          {t(
            '俯视无摩擦滑块，转盘不施加水平力；忽略空气阻力。正角速度为逆时针。离心项和科里奥利项共同重建随盘加速度；箭头采用相同绘图比例。',
          )}
        </p>
        <p>{t('偏心释放保留转盘赋予的初始切向速度。此平面实验不模拟天气、球面或排水旋涡。')}</p>
      </details>
    </div>
  );
}
