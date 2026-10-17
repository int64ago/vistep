import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  idealGas,
  idealGasShot,
  gasParticle,
  gasWallMeasurement,
  lastRightHit,
  gasConstants,
} from '../../models/ideal-gas';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/ideal-gas.css';
export default function IdealGas() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [temperature, setTemperature] = useState(300),
    [volume, setVolume] = useState(1),
    [groups, setGroups] = useState(2),
    [neon, setNeon] = useState(false),
    [phase, setPhase] = useState(0);
  const shot = film.watch
      ? idealGasShot(film.chapter, film.chapterProgress)
      : { temperature, volume: volume / 1000, groups, neon, gaugeView: true },
    s = idealGas(shot),
    time = 0.03 + (film.watch ? film.chapterTime * 2e-5 : phase * 1e-4),
    wall = gasWallMeasurement(time, 0.01, shot),
    W = phone ? 340 : 760,
    H = phone ? 235 : 300,
    scale = phone ? 1200 : 1500,
    ox = phone ? 45 : 230,
    oy = phone ? 195 : 255,
    project = (a: number[]) => ({
      x: ox + scale * (a[0] + 0.25 * a[2]),
      y: oy - scale * (a[1] + 0.17 * a[2]),
    }),
    polygon = (points: number[][]) =>
      points
        .map((p) => {
          const q = project(p);
          return `${q.x},${q.y}`;
        })
        .join(' '),
    right = [
      [s.lx, 0, 0],
      [s.lx, 0.1, 0],
      [s.lx, 0.1, 0.1],
      [s.lx, 0, 0.1],
    ],
    dots = Array.from({ length: s.count }, (_, i) => ({ i, ...gasParticle(i, time, shot) })).sort(
      (a, b) => b.position[2] - a.position[2],
    ),
    tail = Array.from({ length: 16 }, (_, i) => {
      const q = project(gasParticle(0, time - (15 - i) * 0.0000008, shot).position);
      return `${q.x},${q.y}`;
    }).join(' ');
  return (
    <section className="gas-study" data-watch={film.watch}>
      <header>
        <span>
          {t(shot.gaugeView ? '状态方程用绝对压强，不用表压' : '壁面压强，来自碰撞冲量的时间平均')}
        </span>
        <b>{shot.neon ? 'Ne' : 'He'}</b>
      </header>
      <svg
        className="gas-box"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('真实三维反射轨迹的代表气体粒子、容积可变箱体与右壁碰撞位置')}
      >
        <defs>
          <linearGradient id={`${id}wall`}>
            <stop stopColor="#c6d7d5" stopOpacity=".2" />
            <stop offset="1" stopColor="#acc6c5" stopOpacity=".6" />
          </linearGradient>
        </defs>
        <polygon
          points={polygon([
            [0, 0, 0.1],
            [s.lx, 0, 0.1],
            [s.lx, 0.1, 0.1],
            [0, 0.1, 0.1],
          ])}
          fill="#e3e8dc"
          stroke="#a2b6b3"
        />
        <polygon
          points={polygon([
            [0, 0, 0],
            [0, 0, 0.1],
            [0, 0.1, 0.1],
            [0, 0.1, 0],
          ])}
          fill="#d7e1d5"
          stroke="#94ada8"
        />
        <polygon
          points={polygon([
            [0, 0, 0],
            [s.lx, 0, 0],
            [s.lx, 0, 0.1],
            [0, 0, 0.1],
          ])}
          fill="#b8c9bd"
          opacity=".5"
        />
        <polygon
          points={polygon(right)}
          fill={`url(#${id}wall)`}
          stroke="#8ba8a6"
          strokeWidth="2"
        />
        <polyline points={tail} stroke="#b58142" strokeWidth="2" fill="none" opacity=".85" />
        {dots.map((a) => {
          const p = project(a.position);
          return (
            <circle
              key={a.i}
              cx={p.x}
              cy={p.y}
              r={a.i === 0 ? 4 : 2.5}
              fill={a.i === 0 ? '#ac7638' : '#5b8a8d'}
              opacity={0.55 + 0.45 * (1 - a.position[2] / 0.1)}
            />
          );
        })}
        {dots.map((a) => {
          const hit = lastRightHit(a.i, time, shot),
            age = time - hit.at;
          if (age < 0 || age > 0.000003) return null;
          const p = project(hit.position);
          return (
            <circle
              key={a.i}
              cx={p.x}
              cy={p.y}
              r={4 + (age / 0.000003) * 6}
              fill="none"
              stroke="#b58142"
              strokeWidth="2"
              opacity={1 - age / 0.000003}
            />
          );
        })}
        <path
          d={`M${project([0, 0.1, 0]).x} ${project([0, 0.1, 0]).y}L${project([s.lx, 0.1, 0]).x} ${project([s.lx, 0.1, 0]).y}L${project([s.lx, 0, 0]).x} ${project([s.lx, 0, 0]).y}L${ox} ${oy}Z`}
          fill="none"
          stroke="#789a97"
          strokeWidth="2"
        />
      </svg>
      <div className="gas-state">
        <span>{(s.volume * 1000).toFixed(2)} L</span>
        <span>{s.temperature.toFixed(0)} K</span>
        <span>{s.moles.toFixed(2)} mol</span>
      </div>
      <div className="gas-pressures">
        <div>
          <span>{t('绝对压强')}</span>
          <b>
            {(s.pressure / 1000).toFixed(1)} <small>kPa</small>
          </b>
        </div>
        <div>
          <span>{t('壁面冲量平均')}</span>
          <b>
            {(wall.pressure / 1000).toFixed(1)} <small>kPa</small>
          </b>
        </div>
      </div>
      {shot.gaugeView ? (
        <div className="gas-gauge">
          <div>
            <i style={{ width: `${(100 * s.pressure) / 600000}%` }} />
            <em style={{ left: `${(100 * gasConstants.ambient) / 600000}%` }} />
          </div>
          <span>{t('环境')} 101.3 kPa</span>
          <span>
            {t('表压')} {(s.gauge / 1000).toFixed(1)} kPa
          </span>
        </div>
      ) : (
        <div className="gas-speed">
          <span>v_rms {s.rms.toFixed(0)} m/s</span>
          <span>{t('平均窗口')} 10 ms</span>
        </div>
      )}
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('代表粒子与平衡状态比较')}</summary>
          <p>
            {t(
              '每个点代表固定数量的单原子，使用等速、二阶各向同性的速度组，并非麦克斯韦速率分布。点粒子在真实三维箱壁弹性反射，不计算粒子间碰撞；金色点保留同一身份。壁面平均由10ms窗口内的实际冲量计数，有限样本会波动。运动慢放50000倍，粒径与轨迹尾迹为示意。改变参数会比较新的平衡样本，不模拟活塞做功、热交换或充气历史。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="gas-controls">
          <Range
            label={t('气体绝对温度')}
            value={temperature}
            min={300}
            max={600}
            unit="K"
            onChange={setTemperature}
          />
          <Range
            label={t('气体体积')}
            value={volume}
            min={0.5}
            max={1.5}
            step={0.01}
            unit="L"
            onChange={setVolume}
          />
          <Range label={t('粒子组数')} value={groups} min={1} max={3} onChange={setGroups} />
          <Range
            label={t('慢放轨迹相位')}
            value={phase}
            min={0}
            max={1}
            step={0.01}
            onChange={setPhase}
          />
          <button type="button" aria-pressed={neon} onClick={() => setNeon(!neon)}>
            {t(neon ? '换为氦原子' : '换为氖原子')}
          </button>
        </div>
      )}
    </section>
  );
}
