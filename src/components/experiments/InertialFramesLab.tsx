import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import { Range } from '../lab/Controls';
import { paperBall } from '../../models/inertial-frames-lab';
import '../../styles/inertial-frames-lab.css';
export default function InertialFramesLab() {
  const film = useShowcase(),
    compact = useCompact(),
    id = useId().replaceAll(':', '');
  const [duration, setDuration] = useState(0.35),
    [mu, setMu] = useState(0.03),
    [time, setTime] = useState(0.18);
  const c = film.watch ? film.chapter : 1,
    p = film.chapterProgress,
    d = film.watch ? (c === 3 ? 2 : 0.35) : duration,
    friction = film.watch ? (c === 2 ? 0 : 0.03) : mu,
    seconds = film.watch ? Math.min(1, p * 1.4) * (d + 0.2) : Math.min(time, d + 0.3),
    s = paperBall(seconds, d, friction);
  return (
    <section className="inertia-lab">
      <header>
        <p>
          {t(
            c === 0
              ? '从桌面观察：纸抽走，球只移动很少'
              : c === 1
                ? '从纸面观察：球看起来向后运动'
                : c === 2
                  ? '把摩擦设为零，单独检查参考系效应'
                  : '慢慢抽纸，球与纸的相互作用更明显',
          )}
        </p>
        <span>{t('同一过程 · 两个参考系')}</span>
      </header>
      <div className="inertia-views">
        {(['lab', 'paper'] as const).map((frame, i) => {
          const offset = frame === 'paper' ? s.paper.position : 0,
            ballX = 145 + (s.position - offset) * 230,
            paperX = 145 + (s.paper.position - offset - 0.3) * 230,
            grid = (offset * 230) % 30;
          return (
            <div
              className={`inertia-view ${film.watch && ((c === 0 && i === 1) || (c === 1 && i === 0)) ? 'inertia-secondary' : ''}`}
              key={frame}
            >
              <h3>{t(frame === 'lab' ? '桌面参考系' : '纸面参考系')}</h3>
              <svg
                viewBox={compact && film.watch ? '0 70 360 86' : '0 0 360 170'}
                role="img"
                aria-label={t(
                  frame === 'lab'
                    ? '静止桌面上，纸张向右抽动，钢球的位移较小'
                    : '跟随纸张的视角中，桌面和钢球相对纸面向后移动',
                )}
              >
                <defs>
                  <clipPath id={`${id}${frame}clip`}>
                    <rect x="12" y="20" width="336" height="125" />
                  </clipPath>
                  <radialGradient id={`${id}${frame}steel`} cx=".32" cy=".25">
                    <stop stopColor="#e0e6dc" />
                    <stop offset=".6" stopColor="#9cae9f" />
                    <stop offset="1" stopColor="#6f8a7d" />
                  </radialGradient>
                </defs>
                <g clipPath={`url(#${id}${frame}clip)`}>
                  <rect x="12" y="106" width="336" height="14" rx="4" fill="#d7c6aa" />
                  {Array.from({ length: 14 }, (_, j) => (
                    <path
                      key={j}
                      d={`M${j * 30 - grid} 120l-10 13`}
                      stroke="#c7c3a8"
                      strokeWidth="1.4"
                    />
                  ))}
                  <rect
                    x={paperX}
                    y="104"
                    width="138"
                    height="2"
                    fill="#f4efe0"
                    stroke="#c1bea4"
                    strokeWidth=".5"
                  />
                  <path
                    d={`M${paperX + 120} 101q5-10 10-10l17 2q9 4 2 10h-19`}
                    fill="#d8c0a2"
                    stroke="#bda686"
                    strokeWidth="1"
                  />
                  <path
                    d={`M${paperX + 13} 103h20M${paperX + 58} 103h20`}
                    stroke="#bdc6b0"
                    strokeWidth=".8"
                  />
                  <g transform={`translate(${ballX} 99.1) rotate(${(s.angle * 180) / Math.PI})`}>
                    <circle r="6.9" fill={`url(#${id}${frame}steel)`} />
                    <path d="M-4-2L4 2" stroke="#6f897c" strokeWidth="1" />
                  </g>
                  <path
                    d={`M145 143H${145 + (frame === 'lab' ? s.position : s.relativePosition) * 230}`}
                    stroke={frame === 'lab' ? '#99aa82' : '#aa8e64'}
                    strokeWidth="1.4"
                  />
                </g>
              </svg>
              <div className="inertia-coordinate">
                <span>{t('相对起点位移')}</span>
                <strong>
                  {((frame === 'lab' ? s.position : s.relativePosition) * 100).toFixed(1)} cm
                </strong>
              </div>
            </div>
          );
        })}
      </div>
      <div className="inertia-state">
        <span>
          {t('模型时间')} {seconds.toFixed(2)} s
        </span>
        <span>
          {t('纸的位移')} {(s.paper.position * 100).toFixed(1)} cm
        </span>
        <span>
          {t('接触位置')} {t(s.onPaper ? '仍在纸上' : '已到桌面')}
        </span>
      </div>
      <p className="inertia-cause">
        {t(
          friction === 0
            ? '球没有水平加速度，但加速纸面中的相对运动仍会改变。'
            : '换参考系不会新增真实相互作用；摩擦存在时，球也会有小的真实运动。',
        )}
      </p>
      {!film.watch && (
        <div className="inertia-controls">
          <Range
            label={t('抽纸持续时间')}
            value={duration}
            min={0.25}
            max={2}
            step={0.05}
            unit="s"
            onChange={setDuration}
          />
          <Range
            label={t('纸面滑动摩擦因数')}
            value={mu}
            min={0}
            max={0.1}
            step={0.005}
            onChange={setMu}
          />
          <Range
            label={t('模型时间')}
            value={time}
            min={0}
            max={2.3}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <p className="inertia-note">
        {t('薄纸厚度忽略；钢球包含转动与接触摩擦。纸面加速阶段不是惯性参考系，影片按模型秒慢放。')}
      </p>
    </section>
  );
}
