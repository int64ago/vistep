import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range } from '../lab/Controls';
import { stringEllipse, ellipseTrace } from '../../models/ellipse-string-lab';
import '../../styles/ellipse-string-lab.css';
export default function EllipseStringLab() {
  const film = useShowcase(),
    id = useId().replaceAll(':', ''),
    [distance, setDistance] = useState(0.6),
    [trace, setTrace] = useState(0.2),
    c = film.chapter,
    p = Math.min(1, film.chapterProgress * 1.25),
    d = film.watch ? (c === 3 ? 0.6 * (1 - p) : 0.6) : distance,
    progress = film.watch
      ? c === 0
        ? 0.13
        : c === 1
          ? 0.13 + 0.38 * p
          : c === 2
            ? p
            : 0.2 + 0.3 * p
      : trace,
    s = stringEllipse(progress * Math.PI * 2, 1, d),
    P = (x: number, y: number) => ({ x: 220 + x * 280, y: 210 - y * 280 }),
    tip = P(s.x, s.y),
    left = P(-s.c, 0),
    right = P(s.c, 0),
    points = ellipseTrace(c === 3 && film.watch ? 1 : progress, 1, d),
    path = points
      .map((v, i) => {
        const q = P(v.x, v.y);
        return `${i ? 'L' : 'M'}${q.x} ${q.y}`;
      })
      .join(' ');
  return (
    <section className="ellipse-string-lab">
      <header>
        <p>{t(c === 3 && film.watch ? '绳长不变，让两个焦点靠近' : '用同一根绳，留下一条椭圆')}</p>
        <span>{t('两端分别系在图钉上，铅笔始终绷紧细绳')}</span>
      </header>
      <div className="ellipse-string-board">
        <svg
          viewBox="0 0 440 420"
          role="img"
          aria-label={t('木板上的两枚图钉系住细绳两端，铅笔撑紧细绳并画出椭圆')}
        >
          <defs>
            <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#faf8eb" />
              <stop offset="1" stopColor="#edeedc" />
            </linearGradient>
          </defs>
          <rect x="9" y="24" width="422" height="383" rx="18" fill="#ccb99a" />
          <path
            d="M16 398q196 6 408 0M18 389q205 10 406 0"
            stroke="#b7a587"
            fill="none"
            opacity=".5"
          />
          <path
            d="M22 28Q220 18 416 28L420 387Q220 397 23 387Z"
            fill={`url(#${id}-paper)`}
            stroke="#dedcc6"
          />
          <path d="M42 210H400M220 55V365" stroke="#bbc7ac" strokeWidth="1" strokeDasharray="3 6" />
          {film.watch &&
            c === 3 &&
            [0.6, 0.4, 0.2].map((dd) => (
              <ellipse
                key={dd}
                cx="220"
                cy="210"
                rx="140"
                ry={stringEllipse(0, 1, dd).b * 280}
                fill="none"
                stroke="#c6cdb8"
                strokeDasharray="3 5"
              />
            ))}
          <path d={path} stroke="#819c79" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path
            d={`M${left.x} ${left.y}L${tip.x} ${tip.y}`}
            stroke="#a98e60"
            strokeWidth="2.2"
            fill="none"
          />
          <path
            d={`M${tip.x} ${tip.y}L${right.x} ${right.y}`}
            stroke="#b9ab7c"
            strokeWidth="2.2"
            fill="none"
          />
          {[left, right].map((q, i) => (
            <g key={i}>
              <ellipse cx={q.x + 3} cy={q.y + 3} rx="8" ry="4" fill="#a39472" opacity=".14" />
              <path d={`M${q.x} ${q.y}v-9`} stroke="#a29172" strokeWidth="2" />
              <ellipse
                cx={q.x}
                cy={q.y - 10}
                rx="7"
                ry="3.8"
                fill={i ? '#baa278' : '#a49167'}
                stroke="#978364"
              />
            </g>
          ))}
          <g transform={`translate(${tip.x} ${tip.y}) rotate(24)`}>
            <path d="M0 0L-4 -16L-4 -67Q0 -70 4 -67V-16Z" fill="#bda572" stroke="#aa9164" />
            <path d="M-4 -16L0 0L4 -16Z" fill="#decca2" />
            <path d="M-1.2 -5L0 0L1.2 -5Z" fill="#64705c" />
            <path d="M-1 -64V-18" stroke="#ddcc9a" strokeWidth="2" />
          </g>
          <circle cx="220" cy="210" r="2" fill="#9ca98d" />
        </svg>
      </div>
      <div className="ellipse-string-lengths">
        <span>
          <i />
          {t('第一段')}
          <b>{s.left.toFixed(3)} m</b>
        </span>
        <span>+</span>
        <span>
          <i />
          {t('第二段')}
          <b>{s.right.toFixed(3)} m</b>
        </span>
        <span>=</span>
        <span>
          {t('绳长')}
          <b>1.000 m</b>
        </span>
      </div>
      <div className="ellipse-string-ribbon">
        <i style={{ width: `${s.left * 100}%` }} />
        <i style={{ width: `${s.right * 100}%` }} />
      </div>
      <p className="ellipse-string-cause">
        {t(
          d < 0.001
            ? '焦点重合，椭圆成为圆；半长轴就是圆半径。'
            : film.watch && c === 3
              ? '焦点靠近，短轴变长；长轴始终等于绳长。'
              : '两段长度此消彼长，总和始终不变。',
        )}
      </p>
      <div className="ellipse-string-measures">
        <span>
          {t('两焦点间距')} <b>{d.toFixed(2)} m</b>
        </span>
        <span>a = {s.a.toFixed(2)} m</span>
        <span>b = {s.b.toFixed(3)} m</span>
      </div>
      {!film.watch && (
        <div className="ellipse-string-controls">
          <Range
            label={t('两焦点间距')}
            value={distance}
            min={0}
            max={0.9}
            step={0.01}
            unit="m"
            onChange={setDistance}
          />
          <Range
            label={t('绘制进度')}
            value={trace}
            min={0}
            max={1}
            step={0.005}
            onChange={setTrace}
          />
        </div>
      )}
      <p className="ellipse-string-note">
        {t('铅笔和图钉按点处理，细绳不可伸长。绘图速度不代表行星沿轨道运行的速度。')}
      </p>
    </section>
  );
}
