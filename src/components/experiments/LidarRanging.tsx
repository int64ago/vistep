import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { useSignalWidth } from '../lab/SignalFigure';
import {
  lidarDelay,
  lidarPolar,
  lidarRay,
  lidarScan,
  lidarShot,
  LIDAR_CYLINDER,
  LIDAR_PARTITION,
  LIDAR_DEFAULT,
} from '../../models/lidar-ranging';
import '../../styles/signal-studies.css';
export default function LidarRanging() {
  const d = useShowcase(),
    { host, width: w, compact } = useSignalWidth(),
    [manual, setManual] = useState(LIDAR_DEFAULT),
    shot = lidarShot(d.chapter, d.chapterProgress),
    s = d.watch ? shot.input : manual,
    c = d.watch ? shot.view : 7,
    scan = d.watch ? shot.scan : 1,
    points = useMemo(() => lidarScan(s, scan), [s.step, s.jitter, s.threshold, scan]),
    hit = lidarRay(s.angle),
    showCloud = c >= 3 || !d.watch,
    scale = compact ? Math.min((w - 48) / 8, 25) : Math.min((w - 64) / 12, 36),
    height = compact ? 368 : 350,
    origin = { x: w / 2, y: height / 2 },
    project = (x: number, y: number) =>
      compact
        ? { x: origin.x - y * scale, y: origin.y - x * scale }
        : { x: origin.x + x * scale, y: origin.y - y * scale },
    P = (x: number, y: number) => {
      const p = project(x, y);
      return `${p.x},${p.y}`;
    },
    dot = project(hit.point.x, hit.point.y),
    pulse = lidarPolar(hit.range * (d.watch ? shot.pulse : 1), s.angle),
    ghost = lidarRay(s.angle, true),
    rect = [
      [-6, -4],
      [6, -4],
      [6, 4],
      [-6, 4],
    ]
      .map(([x, y]) => P(x, y))
      .join(' '),
    cy = project(LIDAR_CYLINDER.x, LIDAR_CYLINDER.y),
    inks = { wall: '#9bd5e4', partition: '#f2d89c', cylinder: '#eda891' };
  return (
    <div className="signal-study lidar-study" ref={host}>
      <div className="signal-head">
        <span>{t(c >= 6 ? '测量点与真实轮廓' : '单层激光扫描 · 截面')}</span>
        <strong>
          {c >= 3
            ? `${points.filter((p) => p.detected).length} ${t('个返回点')}`
            : `${(lidarDelay(hit.range) * 1e9).toFixed(1)} ns · ${hit.range.toFixed(2)} m`}
        </strong>
      </div>
      <svg viewBox={`0 0 ${w} ${height}`} role="img" aria-label={t('射线测距、扫描点云与遮挡')}>
        <polygon
          points={rect}
          fill="#9bd5e4"
          fillOpacity=".025"
          stroke="#88a5b6"
          strokeOpacity={showCloud ? 0.2 : 0.6}
          strokeWidth="2"
        />
        <circle
          cx={cy.x}
          cy={cy.y}
          r={LIDAR_CYLINDER.radius * scale}
          fill="#eda891"
          fillOpacity={c === 7 ? 0.04 : 0.1}
          stroke="#eda891"
          strokeOpacity=".35"
          strokeWidth="1.5"
        />
        <path
          d={`M${P(LIDAR_PARTITION[0].x, LIDAR_PARTITION[0].y)}L${P(LIDAR_PARTITION[1].x, LIDAR_PARTITION[1].y)}`}
          stroke="#f2d89c"
          strokeWidth="4"
          strokeOpacity=".35"
          strokeLinecap="round"
        />
        {showCloud &&
          points.map((p) => (
            <g key={p.i}>
              {c === 4 && p.i % 3 === 0 && (
                <path
                  d={`M${P(0, 0)}L${P(p.hit.point.x, p.hit.point.y)}`}
                  stroke="#9bd5e4"
                  strokeOpacity=".07"
                />
              )}
              {p.detected && (
                <circle
                  cx={project(p.point.x, p.point.y).x}
                  cy={project(p.point.x, p.point.y).y}
                  r={c === 6 ? 2 : 2.4}
                  fill={inks[p.hit.id]}
                />
              )}
            </g>
          ))}
        {c === 5 && hit.id === 'cylinder' && (
          <path
            d={`M${P(hit.point.x, hit.point.y)}L${P(ghost.point.x, ghost.point.y)}`}
            stroke="#eda891"
            strokeDasharray="3 7"
            opacity=".3"
          />
        )}
        {(c < 4 || c === 5 || !d.watch) && (
          <>
            <path
              d={`M${P(0, 0)}L${P(hit.point.x, hit.point.y)}`}
              stroke="#f2d89c"
              strokeWidth="1.7"
            />
            <circle cx={dot.x} cy={dot.y} r="5" fill="#f2d89c" />
            {c < 2 && (
              <circle
                cx={project(pulse.x, pulse.y).x}
                cy={project(pulse.x, pulse.y).y}
                r="5"
                fill={c === 1 ? '#eda891' : '#9bd5e4'}
              />
            )}
          </>
        )}
        {c === 2 && (
          <>
            <path
              d={`M${P(0, 0)}L${P(hit.point.x, 0)}L${P(hit.point.x, hit.point.y)}`}
              stroke="#9bd5e4"
              strokeDasharray="4 5"
              fill="none"
            />
            <text x={project(hit.point.x / 2, 0).x + 12} y={project(hit.point.x / 2, 0).y + 22}>
              x
            </text>
            <text
              x={project(hit.point.x, hit.point.y / 2).x + 12}
              y={project(hit.point.x, hit.point.y / 2).y}
            >
              y
            </text>
          </>
        )}
        <circle
          cx={origin.x}
          cy={origin.y}
          r="10"
          fill="#264b5d"
          stroke="#c8dfe9"
          strokeWidth="1.5"
        />
        <circle cx={origin.x} cy={origin.y} r="3" fill="#f2d89c" />
      </svg>
      <p className="signal-note">
        {t(
          c === 5
            ? '遮挡后方没有回波点'
            : c === 6
              ? '同一束角度，只改变计时误差'
              : c === 7
                ? '弱回波低于阈值时不留点'
                : '点的位置来自角度与往返时间',
        )}
      </p>
      <div className="signal-equation">
        {c === 2
          ? 'x = r cos θ · y = r sin θ'
          : c === 6
            ? `σt = ${s.jitter.toFixed(1)} ns`
            : c === 4
              ? `Δθ = ${s.step.toFixed(1)}°`
              : 'r = cΔt / 2'}
      </div>
      {!d.watch && (
        <div className="signal-explore">
          <Range
            label={t('扫描角间距')}
            value={s.step}
            min={1}
            max={12}
            step={0.5}
            unit="°"
            onChange={(step) => setManual((m) => ({ ...m, step }))}
          />
          <Range
            label={t('选中射线角度')}
            value={(s.angle * 180) / Math.PI}
            min={0}
            max={360}
            unit="°"
            onChange={(angle) => setManual((m) => ({ ...m, angle: (angle * Math.PI) / 180 }))}
          />
          <Range
            label={t('往返计时标准差')}
            value={s.jitter}
            min={0}
            max={2}
            step={0.1}
            unit="ns"
            onChange={(jitter) => setManual((m) => ({ ...m, jitter }))}
          />
          <Range
            label={t('归一化检测阈值')}
            value={s.threshold}
            min={0}
            max={0.025}
            step={0.001}
            onChange={(threshold) => setManual((m) => ({ ...m, threshold }))}
          />
        </div>
      )}
      <details>
        <summary>{t('截面模型与回波限制')}</summary>
        <p>
          {t(
            '只计算二维房间中的第一处射线交点，不模拟完整三维雷达。时间抖动按固定随机种子变成径向误差；弱回波使用反射率、入射角与距离平方的教学阈值模型，不是实际传感器的探测概率。物体不透明，省略多次回波、光斑尺寸、玻璃、雾和运动畸变。',
          )}
        </p>
      </details>
    </div>
  );
}
