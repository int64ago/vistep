import { useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  phoneMotion,
  phoneSamples,
  phoneShot,
  phoneForceMeter,
  type PhoneTrial,
  PHONE_G,
} from '../../models/phone-accelerometer-lab';
import '../../styles/phone-accelerometer-lab.css';
export default function PhoneAccelerometerLab() {
  const film = useShowcase();
  const [trial, setTrial] = useState<PhoneTrial>(() =>
      film.variant?.includes('elevator') ? 'lift' : 'drop',
    ),
    [time, setTime] = useState(0.55),
    [output, setOutput] = useState('both'),
    [instrument, setInstrument] = useState('phone');
  const shot = phoneShot(film.chapter, film.chapterProgress),
    mode = film.watch ? shot.trial : trial,
    now = film.watch ? shot.time : time,
    s = phoneMotion(mode, now),
    samples = phoneSamples(mode),
    duration = s.duration,
    rawVisible = film.watch || output !== 'corrected',
    correctedVisible = film.watch ? film.chapter >= 2 : output !== 'raw',
    spring = mode === 'lift' && (film.watch ? film.chapter === 5 : instrument === 'spring'),
    meter = phoneForceMeter(s.a),
    springLength = 20 + meter.extension * 240;
  const py = (value: number) => 104 - (value / 30) * 76,
    px = (q: number) => 22 + (q / duration) * 274,
    deviceY = mode === 'drop' ? 55 + (1.4 - s.z) * 95 : 105 - s.z * 7;
  const phase =
    s.phase === 'held'
      ? '手掌托住'
      : s.phase === 'falling'
        ? '脱离支撑，自由下落'
        : s.phase === 'catching'
          ? '接住，向上减速'
          : s.phase === 'speeding'
            ? '上行，加速'
            : s.phase === 'cruising'
              ? '上行，匀速'
              : s.phase === 'braking'
                ? '上行，减速'
                : '恢复静止';
  return (
    <section className="phone-accel-lab">
      <header>
        <p>{t(phase)}</p>
        <span>
          {t('向上为正')} · {s.t.toFixed(2)} s
        </span>
      </header>
      <div className="phone-accel-causal">
        <svg
          viewBox="0 0 320 194"
          role="img"
          aria-label={t('平放手机的竖直运动与支撑状态，向上为正轴')}
        >
          {mode === 'lift' && (
            <>
              <rect
                x="65"
                y="13"
                width="183"
                height="168"
                rx="16"
                fill="#e7ece0"
                stroke="#c4cfba"
              />
              <path d="M82 27V170M231 27V170" stroke="#b5c5ac" strokeWidth="2" />
              {[0, 1, 2, 3].map((i) => (
                <path key={i} d={`M49 ${35 + i * 43}h12`} stroke="#c7d1bf" />
              ))}
            </>
          )}
          <path d="M270 120V36l-5 8m5-8 5 8" stroke="#9cab8f" fill="none" strokeWidth="1.5" />
          <text x="280" y="45" fontSize="21" fill="#758b70">
            z
          </text>
          {spring ? (
            <g transform={`translate(154 ${deviceY - 40})`}>
              <path d="M-35 0H35" stroke="#8ba080" strokeWidth="4" strokeLinecap="round" />
              <rect x="-26" y="5" width="52" height="79" rx="9" fill="#dce5d2" stroke="#a5b89a" />
              <path d="M0 5V13" stroke="#6f896c" strokeWidth="2" />
              <path
                d={Array.from(
                  { length: 17 },
                  (_, i) =>
                    `${i ? 'L' : 'M'}${i === 0 || i === 16 ? 0 : i % 2 ? 9 : -9} ${13 + (i / 16) * springLength}`,
                ).join(' ')}
                fill="none"
                stroke="#839877"
                strokeWidth="1.6"
              />
              <path
                d={`M0 ${13 + springLength}V${23 + springLength}`}
                stroke="#6f896c"
                strokeWidth="2"
              />
              <rect x="-13" y={23 + springLength} width="26" height="22" rx="4" fill="#8da17d" />
              {[0, 1, 2, 3, 4].map((i) => (
                <path key={i} d={`M16 ${22 + i * 10}h6`} stroke="#adbca1" />
              ))}
            </g>
          ) : (
            <g transform={`translate(154 ${deviceY})`}>
              <ellipse cx="5" cy="70" rx="76" ry="8" fill="#86967c" opacity=".08" />
              {(s.phase !== 'falling' || mode === 'lift') && (
                <>
                  <path
                    d="M-66 37C-48 25 -33 30 -16 30H44C58 30 68 39 72 48L42 61H-38Z"
                    fill="#d9bf9a"
                    stroke="#bea581"
                  />
                  <path d="M-38 38H37" stroke="#c5a680" fill="none" />
                </>
              )}
              <path d="M-53 -1H39L65 27-34 28Z" fill="#5e766b" stroke="#486357" strokeWidth="1.2" />
              <path d="M-53 -1V6L-34 35 65 34V27" fill="#81968a" stroke="#687f71" />
              <path d="M-43 3H36L53 22-29 23Z" fill="#d3dfcb" />
              <path
                d="M-30 10H-7l8 -4 6 12 8-9h22"
                stroke="#7f9b73"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="-43" cy="2" r="1.4" fill="#b5c5ad" />
              {s.phase === 'falling' && (
                <path d="M-74 12v35l-4-6m4 6 4-6" stroke="#b59a6d" strokeWidth="1.5" fill="none" />
              )}
            </g>
          )}
        </svg>
        <div className="phone-accel-readouts">
          <p>
            <i className="phone-raw" />
            {t(spring ? '测力计示数' : '原始加速度计')}
            <strong>
              {spring ? meter.force.toFixed(2) : s.raw.toFixed(1)}{' '}
              <span>{spring ? 'N' : 'm/s²'}</span>
            </strong>
          </p>
          <p>
            <i className="phone-corrected" />
            {t('去重力后的加速度')}
            <strong>
              {s.corrected.toFixed(1)} <span>m/s²</span>
            </strong>
          </p>
        </div>
      </div>
      <div className="phone-accel-trace">
        <div>
          <span>{t(spring ? '拉力除以质量，与运动加速度比较' : '同一次运动，两种输出')}</span>
          <span>m/s²</span>
        </div>
        <svg viewBox="0 0 320 150" role="img" aria-label={t('原始加速度计与去重力输出的时间曲线')}>
          <path d="M22 14V135H299" stroke="#c4cfb9" fill="none" />
          <text x="2" y={py(0) + 6} fontSize="21" fill="#829477">
            0
          </text>
          <path d={`M22 ${py(0)}H299`} stroke="#c4cfb9" strokeDasharray="3 4" />
          <path d={`M22 ${py(PHONE_G)}H299`} stroke="#d7ddcd" strokeDasharray="2 4" />
          {rawVisible && (
            <path
              d={samples
                .filter((q) => q.t <= s.t)
                .map((q, i) => `${i ? 'L' : 'M'}${px(q.t)} ${py(q.raw)}`)
                .join(' ')}
              fill="none"
              stroke="#6e927b"
              strokeWidth="2.3"
            />
          )}
          {correctedVisible && (
            <path
              d={samples
                .filter((q) => q.t <= s.t)
                .map((q, i) => `${i ? 'L' : 'M'}${px(q.t)} ${py(q.corrected)}`)
                .join(' ')}
              fill="none"
              stroke="#bd9b63"
              strokeWidth="2.3"
            />
          )}
          <path d={`M${px(s.t)} 15V134`} stroke="#809578" opacity=".35" />
          <circle
            cx={px(s.t)}
            cy={py(rawVisible ? s.raw : s.corrected)}
            r="4"
            fill={rawVisible ? '#6e927b' : '#bd9b63'}
          />
        </svg>
        <div>
          <span>0 s</span>
          <span>{duration.toFixed(1)} s</span>
        </div>
      </div>
      <p className="phone-accel-equation">
        {t(
          spring
            ? 'a = F/m − g；悬挂质量0.20 kg，忽略弹簧振动'
            : '原始读数 = 运动加速度 + g（本片坐标）',
        )}
      </p>
      {!film.watch && (
        <div className="phone-accel-controls">
          <Segments
            label={t('测量情境')}
            value={trial}
            onChange={(v) => {
              setTrial(v);
              setTime(0);
            }}
            options={[
              { value: 'drop', label: t('托住、释放、接住') },
              { value: 'lift', label: t('电梯上行') },
            ]}
          />
          {mode === 'lift' && (
            <Segments
              label={t('测量仪器')}
              value={instrument}
              onChange={setInstrument}
              options={[
                { value: 'phone', label: t('手机传感器') },
                { value: 'spring', label: t('弹簧测力计') },
              ]}
            />
          )}
          <Range
            label={t('运动时刻')}
            value={Math.min(time, duration)}
            min={0}
            max={duration}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
          <Segments
            label={t('曲线显示')}
            value={output}
            onChange={setOutput}
            options={[
              { value: 'both', label: t('两种输出') },
              { value: 'raw', label: t('原始输出') },
              { value: 'corrected', label: t('去重力输出') },
            ]}
          />
        </div>
      )}
      <details>
        <summary>{t('为什么教材的自由下落曲线是−g？')}</summary>
        <p>
          {t(
            '手机加速度计测比力：支撑、接触等非引力作用造成的单位质量受力。平放并取向上为正，静止原始读数约+g，自由落体约0；应用程序去除重力分量后，静止显示0，自由落体显示−g。先核对应用的输出模式和坐标轴。本片保持手机方向不变，忽略旋转、滤波和传感器噪声。',
          )}
        </p>
      </details>
    </section>
  );
}
