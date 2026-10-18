import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { levitatingSample, magneticLift } from '../../models/diamagnetic-levitation-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
export default function DiamagneticLevitationLab() {
  const film = useShowcase();
  const [field, setField] = useState(16),
    [shape, setShape] = useState('gradient'),
    [object, setObject] = useState('water'),
    [progress, setProgress] = useState(0.6);
  const stage = film.chapter,
    p = film.watch ? film.chapterProgress : progress,
    peak = film.watch ? (stage === 0 ? 0 : 16) : field,
    uniform = film.watch ? stage === 1 : shape === 'uniform',
    frog = film.watch ? stage === 4 : object === 'frog';
  const sample = levitatingSample(p * 4, peak, uniform, film.watch && stage === 3),
    y = 170 - sample.z * 850,
    force = sample.acceleration / 9.8;
  return (
    <div className="textbook-em diamagnetic-levitation-lab">
      <div className="textbook-em-state">
        <span>{t(frog ? '青蛙悬浮的水体近似' : '强磁场中的水滴')}</span>
        <span>{`${peak.toFixed(1)} T`}</span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 320"
        role="img"
        aria-label={t('竖直强磁体孔中抗磁物体的受力与稳定位置')}
      >
        <defs>
          <linearGradient id="dia-coil" x1="0" x2="1">
            <stop stopColor="#b89b66" />
            <stop offset=".5" stopColor="#dac59b" />
            <stop offset="1" stopColor="#b89b66" />
          </linearGradient>
        </defs>
        {[62, 250].map((x) => (
          <g key={x}>
            <rect
              x={x}
              y="90"
              width="48"
              height="160"
              rx="8"
              fill="url(#dia-coil)"
              stroke="#ae9665"
            />
            {Array.from({ length: 16 }, (_, i) => (
              <path key={i} d={`M${x + 2} ${97 + i * 9.5}h44`} stroke="#a78d59" opacity=".6" />
            ))}
          </g>
        ))}
        <path d="M119 68V250M241 68V250" stroke="#adc09c" strokeWidth="3" />
        {peak > 0 &&
          [-2, -1, 0, 1, 2].map((i) => (
            <path
              key={i}
              d={
                uniform
                  ? `M${180 + i * 17} 70V244`
                  : `M${180 + i * 30} 70Q${180 + i * 8} 167 ${180 + i * 17} 244`
              }
              fill="none"
              stroke="#a7be95"
              strokeWidth="1.5"
              opacity=".65"
            />
          ))}
        <path d="M147 176h66" stroke="#b4c4a4" strokeWidth="4" strokeLinecap="round" />
        {frog ? (
          <g transform={`translate(180 ${y})`}>
            <ellipse rx="15" ry="8" fill="#8da779" />
            <ellipse cx="3" cy="-7" rx="9" ry="6" fill="#9cb589" />
            <circle cx="0" cy="-11" r="3" fill="#adc399" />
            <circle cx="7" cy="-11" r="3" fill="#adc399" />
            <circle cx="0" cy="-12" r="1.2" fill="#536e4c" />
            <circle cx="7" cy="-12" r="1.2" fill="#536e4c" />
            <path
              d="M-10 2l-13 3 9 4m26-6 12 3-10 4M-5-3l-15-5m27 5 15-6"
              stroke="#86a270"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ) : (
          <>
            <circle cx="180" cy={y} r="11" fill="#a4c9be" stroke="#80aa9b" strokeWidth="1.5" />
            <ellipse cx="176" cy={y - 4} rx="3" ry="4" fill="#e1eee1" />
          </>
        )}
        <path d={`M216 ${y}v24m-4-6 4 6 4-6`} stroke="#b49a65" strokeWidth="2" fill="none" />
        {force > 0 && (
          <path
            d={`M145 ${y}v${-24 * force}m-4 6 4-6 4 6`}
            stroke="#789765"
            strokeWidth="2"
            fill="none"
          />
        )}
        <text className="em-small" x="225" y={y + 22}>
          mg
        </text>
        <text className="em-small" x="122" y={y - 15}>
          Fₘ
        </text>
        <path d="M48 294H314M48 294V261" stroke="#b0c4a1" />
        <path d="M48 278H314" stroke="#b59a67" strokeDasharray="4 3" />
        <path
          d={Array.from({ length: 80 }, (_, i) => {
            const z = (i * 0.12) / 79;
            return `${i ? 'L' : 'M'}${48 + z * 2200} ${294 - magneticLift(z, peak, uniform).acceleration * 1.63}`;
          }).join(' ')}
          stroke="#87a675"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx={48 + sample.z * 2200}
          cy={294 - sample.acceleration * 1.63}
          r="3.5"
          fill="#819c6d"
        />
        <text className="em-small" x="321" y="298">
          z
        </text>
        <text className="em-small" x="326" y="281">
          g
        </text>
      </svg>
      <div className="textbook-em-meters">
        <span>
          {t('磁力与重力比')} <b>{(sample.acceleration / 9.8).toFixed(2)}</b>
        </span>
        <span>
          {t('竖直位置')} <b>{(sample.z * 100).toFixed(2)} cm</b>
        </span>
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Range
            label={t('磁场峰值')}
            value={field}
            min={0}
            max={20}
            step={0.5}
            onChange={setField}
          />
          <Segments
            label={t('磁场分布')}
            value={shape}
            onChange={setShape}
            options={[
              { value: 'gradient', label: t('非均匀磁场') },
              { value: 'uniform', label: t('均匀磁场') },
            ]}
          />
          <Segments
            label={t('观察对象')}
            value={object}
            onChange={setObject}
            options={[
              { value: 'water', label: t('水滴') },
              { value: 'frog', label: t('青蛙示意') },
            ]}
          />
          <Range
            label={t('释放后进度')}
            value={progress}
            min={0}
            max={1}
            step={0.002}
            onChange={setProgress}
          />
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('强度、梯度与简化')}</summary>
        <p>
          {t(
            '水的体积磁化率取−9.05×10⁻⁶，密度取1000千克每立方米；磁场沿轴用宽度5厘米的高斯分布近似，只计算竖直运动与线性阻尼，不据此证明三维稳定。青蛙形状用于科学史说明，其整体按水的参数近似；不是对真实动物的精确生物模型。',
          )}
        </p>
      </details>
    </div>
  );
}
