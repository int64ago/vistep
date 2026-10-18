import { useState, useMemo } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { floatState, floatForce, floatParameters } from '../../models/floating-oscillator';
import '../../styles/floating-oscillator.css';
export default function FloatingOscillator() {
  const film = useShowcase(),
    [amplitude, setAmplitude] = useState(0.04),
    [damping, setDamping] = useState(0.003),
    [time, setTime] = useState(0),
    [view, setView] = useState('motion'),
    c = film.chapter,
    p = film.chapterProgress,
    A = film.watch ? (c === 3 ? 0.12 : 0.04) : amplitude,
    b = film.watch ? (c === 2 ? 0.006 : 0) : damping,
    seconds = film.watch ? Math.min(1, p / 0.9) * 3.2 : time,
    s = useMemo(() => floatState(seconds, A, b), [seconds, A, b]),
    params = floatParameters(),
    top = 155 - 600 * (s.length - s.immersion + s.x),
    bottom = top + 600 * s.length,
    showForce = film.watch ? c > 0 : view === 'force',
    fscale = 1100,
    caption = film.watch
      ? c === 0
        ? '下端绕铁丝的均匀木筷，提起后在水中上下振动'
        : c === 1
          ? '水面切过等截面木筷时，浸入长度的变化给出线性回复力'
          : c === 2
            ? '加入阻力后振幅逐渐减小，不能把真实运动永远画成等振幅'
            : '整根木筷浸没后，排水体积不再随位移增加，线性关系失效'
      : '比较木筷的位置、排水体积和合力';
  return (
    <section className="fo-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="fo-caption">{t(caption)}</p>
      <svg
        viewBox="0 0 400 380"
        className="fo-apparatus"
        role="img"
        aria-label={t('带铁丝配重的木筷在水杯中竖直浮动，水面与浸入长度共同确定浮力')}
      >
        <defs>
          <linearGradient id="fo-water" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#d4e5d9" stopOpacity=".4" />
            <stop offset="1" stopColor="#a7c7bc" stopOpacity=".55" />
          </linearGradient>
        </defs>
        <path
          d="M76 90v251q0 17 18 17h212q18 0 18-17V90"
          fill="none"
          stroke="#bacdc1"
          strokeWidth="4"
        />
        <path d="M78 155H322v187q0 13-16 13H94q-16 0-16-13Z" fill="url(#fo-water)" />
        <ellipse cx="200" cy="155" rx="121" ry="12" fill="#d5e7dc" opacity=".6" />
        <path d={`M200 ${top}V${bottom}`} stroke="#bc9865" strokeWidth="10" strokeLinecap="round" />
        <path d={`M198 ${top + 3}V${bottom - 3}`} stroke="#dfc59a" strokeWidth="2" />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M193 ${bottom - 5 - i * 4}q7-5 14 0`}
            fill="none"
            stroke="#87918a"
            strokeWidth="3"
          />
        ))}
        <path d="M120 155H280" stroke="#6e9b90" strokeWidth="2" />
        <path
          d={`M225 ${Math.max(155, top)}h10V${bottom}h-10`}
          stroke="#8ea996"
          fill="none"
          strokeDasharray="3 4"
        />
        <path
          d={`M193 ${155 - 600 * (params.length - params.immersion)}h14`}
          stroke="#9b825d"
          strokeWidth="2"
        />
        {showForce && (
          <>
            <path
              d={`M166 ${(top + bottom) / 2}v${-s.buoyancy * fscale}l-5 9m5-9 5 9`}
              stroke="#769c8f"
              strokeWidth="3"
              fill="none"
            />
            <path
              d={`M264 ${(top + bottom) / 2}v${s.weight * fscale}l-5-9m5 9 5-9`}
              stroke="#b39465"
              strokeWidth="3"
              fill="none"
            />
            <text x="149" y={(top + bottom) / 2 - s.buoyancy * fscale - 9}>
              Fᵦ
            </text>
            <text x="266" y={(top + bottom) / 2 + s.weight * fscale + 24}>
              mg
            </text>
          </>
        )}
        <text x="200" y="378" textAnchor="middle">
          {t('木筷直径与铁丝已放大')}
        </text>
      </svg>
      <div className="fo-reading">
        <span>x = {(s.x * 100).toFixed(1)} cm</span>
        <span>h = {(s.h * 100).toFixed(1)} cm</span>
        {showForce && <span>ΣF = {(s.net * 1000).toFixed(1)} mN</span>}
      </div>
      {showForce && (
        <svg
          viewBox="0 0 400 170"
          className="fo-plot"
          role="img"
          aria-label={t('回复力位移关系在部分浸没区为直线，完全浸没后变平')}
        >
          <path d="M30 85H374M200 15V154" fill="none" stroke="#c1cdb6" />
          <path
            d={Array.from({ length: 101 }, (_, i) => {
              const x = -0.14 + (0.28 * i) / 100,
                F = floatForce(x).net;
              return `${i ? 'L' : 'M'}${200 + 1100 * x},${85 - 1500 * F}`;
            }).join(' ')}
            stroke="#93a984"
            fill="none"
            strokeWidth="3"
          />
          <circle cx={200 + 1100 * s.x} cy={85 - 1500 * floatForce(s.x).net} r="6" fill="#b39362" />
          <text x="356" y="111">
            x
          </text>
          <text x="212" y="28">
            Fᵦ − mg
          </text>
        </svg>
      )}
      <p className="fo-note">
        {t(
          s.partial
            ? '水面仍切过木筷：浮力变化量与位移成正比'
            : '木筷已完全浸没：浮力达到平台，不能继续使用 −kx',
        )}
      </p>
      {!film.watch && (
        <div className="fo-controls">
          <Segments
            label={t('观察内容')}
            value={view}
            options={[
              { value: 'motion', label: t('只看运动') },
              { value: 'force', label: t('比较受力') },
            ]}
            onChange={setView}
          />
          <Range
            label={t('向上提起的距离')}
            value={amplitude}
            min={0.01}
            max={0.12}
            step={0.005}
            unit="m"
            onChange={setAmplitude}
          />
          <Range
            label={t('线性阻力系数')}
            value={damping}
            min={0}
            max={0.012}
            step={0.001}
            unit="kg/s"
            onChange={setDamping}
          />
          <Range
            label={t('模型时间')}
            value={time}
            min={0}
            max={4}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <details className="fo-details">
        <summary>{t('浮力模型与边界')}</summary>
        <p>
          {t(
            '木筷长 24 cm、半径 3 mm、密度 500 kg/m³，下端铁丝质量 1 g。铁丝保持浸没并计入排水体积。只计算竖直运动，忽略液体附加质量、涟漪和转动；配重稳定性作为装置条件。阻力取线性教学近似。完全浸没时按有限体积截断浮力，杯底始终未接触。',
          )}
        </p>
      </details>
    </section>
  );
}
