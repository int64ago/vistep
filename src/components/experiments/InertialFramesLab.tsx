import { useId, useState } from 'react';
import { t, browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range } from '../lab/Controls';
import { paperBall, inertiaDirector, inertiaGeometry } from '../../models/inertial-frames-lab';
import '../../styles/inertial-frames-lab.css';
export default function InertialFramesLab() {
  const film = useShowcase(),
    { host, width, compact } = useSignalWidth(),
    id = useId().replaceAll(':', '');
  const authored = inertiaDirector(
    film.chapter,
    film.chapterProgress,
    film.chapterTime,
    browserLocale(),
  );
  const [manual, setManual] = useState<{
    duration: number;
    coefficient: number;
    time: number;
  } | null>(null);
  const selected = film.watch ? authored : (manual ?? authored),
    s = paperBall(selected.time, selected.duration, selected.coefficient);
  const update = (change: Partial<NonNullable<typeof manual>>) =>
    setManual({ ...selected, ...change });
  const panelWidth = compact ? width : (width - 24) / 2;
  return (
    <section
      className="if16-lab"
      ref={host}
      data-inertia-time={selected.time}
      data-inertia-duration={selected.duration}
      data-inertia-mu={selected.coefficient}
    >
      <div className="if16-clock">
        <span>t = {selected.time.toFixed(2)} s</span>
        <span>
          {t('纸面 μ')} = {selected.coefficient.toFixed(3)}
        </span>
      </div>
      <div className="if16-frames">
        {(['lab', 'paper'] as const).map((frame) => {
          const g = inertiaGeometry(s, frame, panelWidth);
          return (
            <div key={frame} className="if16-frame" data-reference-frame={frame}>
              <h3>
                {t(frame === 'lab' ? '桌面参考系' : '纸面参考系')}{' '}
                <span>
                  {frame === 'lab' ? 'x' : 'x′'} = {(g.displacement * 100).toFixed(1)} cm
                </span>
              </h3>
              <svg
                viewBox={`0 0 ${panelWidth} 80`}
                role="img"
                aria-label={t(
                  frame === 'lab'
                    ? '静止桌面上，纸张向右抽动，钢球的位移较小'
                    : '跟随纸张的视角中，桌面和钢球相对纸面向后移动',
                )}
                data-physical-state={`${s.position},${s.angle}`}
              >
                <defs>
                  <clipPath id={`${id}${frame}clip`}>
                    <rect x="0" y="0" width={panelWidth} height="78" />
                  </clipPath>
                  <radialGradient id={`${id}${frame}steel`} cx=".3" cy=".25">
                    <stop stopColor="#f0f3eb" />
                    <stop offset=".5" stopColor="#a4b5ac" />
                    <stop offset="1" stopColor="#56796c" />
                  </radialGradient>
                </defs>
                <g clipPath={`url(#${id}${frame}clip)`}>
                  <rect x="0" y={g.surfaceY} width={panelWidth} height="15" rx="3" fill="#d4c1a2" />
                  {Array.from({ length: 30 }, (_, i) => (
                    <path
                      key={i}
                      d={`M${i * 24 - (g.gridOffset % 24) - 24} 53l-8 9`}
                      stroke="#baa98d"
                      strokeWidth="1.3"
                    />
                  ))}
                  <rect
                    data-contact-surface="paper"
                    x={g.paperX}
                    y={g.surfaceY}
                    width={g.paperWidth}
                    height="2.5"
                    fill="#faf7ed"
                  />
                  <path
                    d={`M${g.paperX + g.paperWidth - 18} 36q4-13 10-13l18 4q5 3 0 9h-21`}
                    fill="#dac0a1"
                    stroke="#b99d7b"
                    strokeWidth="1"
                  />
                  <path
                    d={`M${g.paperX + 8} 37h${g.paperWidth - 40}`}
                    stroke="#c5ccba"
                    strokeWidth="1"
                  />
                  <g
                    data-ball="same-ball"
                    transform={`translate(${g.ballX} ${g.ballY}) rotate(${(s.angle * 180) / Math.PI})`}
                  >
                    <circle r={g.ballRadius} fill={`url(#${id}${frame}steel)`} />
                    <path
                      d={`M${-g.ballRadius * 0.55} ${-g.ballRadius * 0.35}L${g.ballRadius * 0.55} ${g.ballRadius * 0.35}`}
                      stroke="#547766"
                      strokeWidth="1"
                    />
                  </g>
                  <path
                    d={`M${g.origin} 12V23M${g.origin} 17H${g.ballX}`}
                    stroke={frame === 'lab' ? '#869f71' : '#b28f61'}
                    strokeWidth="1.4"
                  />
                  <circle cx={g.origin} cy="17" r="2" fill="#9cb486" />
                </g>
                <text x={panelWidth - 4} y="73" textAnchor="end">
                  {frame === 'lab' ? `X = ${(s.paper.position * 100).toFixed(1)} cm` : 'x′ = x − X'}
                </text>
              </svg>
            </div>
          );
        })}
      </div>
      <div className="if16-contact">
        {t(s.onPaper ? '接触：纸面' : '接触：桌面')} <span>{t('同一颗球 · 同一时刻')}</span>
      </div>
      {!film.watch && (
        <div className="if16-controls">
          <Range
            label={t('抽纸持续时间')}
            value={selected.duration}
            min={0.25}
            max={2}
            step={0.05}
            unit="s"
            onChange={(duration) =>
              update({ duration, time: Math.min(selected.time, duration + 0.3) })
            }
          />
          <Range
            label={t('纸面滑动摩擦因数')}
            value={selected.coefficient}
            min={0}
            max={0.1}
            step={0.005}
            onChange={(coefficient) => update({ coefficient })}
          />
          <Range
            label={t('模型时间')}
            value={selected.time}
            min={0}
            max={selected.duration + 0.3}
            step={0.01}
            unit="s"
            onChange={(time) => update({ time })}
          />
          <p>
            {t(
              '薄纸厚度忽略；钢球包含转动与接触摩擦。纸面加速阶段不是惯性参考系，影片按模型秒慢放。',
            )}
          </p>
        </div>
      )}
    </section>
  );
}
