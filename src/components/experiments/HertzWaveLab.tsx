import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  LIGHT_SPEED,
  hertzPulse,
  standingField,
  snellAngle,
  slitIntensity,
  hertzShot,
} from '../../models/hertz-wave-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
const names = [
  '火花发射与传播',
  '开口环接收',
  '反射与干涉',
  '介质中的折射',
  '接收方向与偏振',
  '狭缝后的衍射',
];
export default function HertzWaveLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [mode, setMode] = useState('0'),
    [time, setTime] = useState(18),
    [angle, setAngle] = useState(0),
    [incident, setIncident] = useState(35),
    [width, setWidth] = useState(1.2);
  const s = film.watch
    ? hertzShot(film.chapter, film.chapterProgress)
    : {
        mode: Number(mode),
        time: time * 1e-9,
        angle: (angle * Math.PI) / 180,
        incident: (incident * Math.PI) / 180,
        width,
      };
  const pulse = hertzPulse(s.time, 3, s.angle),
    refraction = snellAngle(s.incident);
  return (
    <div className="textbook-em hertz-wave-lab">
      <div className="textbook-em-state">
        <span>{t(names[s.mode])}</span>
        <span>
          {s.mode < 2
            ? `t = ${(s.time * 1e9).toFixed(1)} ns`
            : s.mode === 4
              ? `θ = ${((s.angle * 180) / Math.PI).toFixed(0)}°`
              : s.mode === 5
                ? `a/λ = ${s.width.toFixed(1)}`
                : 'f = 100 MHz'}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 290"
        role="img"
        aria-label={t('赫兹发射接收装置与电磁波性质的逐项对照')}
      >
        <defs>
          <clipPath id={`${id}-field`}>
            <rect x="103" y="48" width="151" height="185" />
          </clipPath>
        </defs>
        {(s.mode < 2 || s.mode === 4) && (
          <>
            <path
              d="M72 54V128M72 157V231"
              stroke="#a0b193"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="72" cy="132" r="9" fill="#c2ad80" stroke="#a48f64" />
            <circle cx="72" cy="154" r="9" fill="#c2ad80" stroke="#a48f64" />
            <path
              d="M20 103H72M20 183H72M20 103V183"
              stroke="#91a284"
              fill="none"
              strokeWidth="2"
            />
            <rect x="8" y="125" width="24" height="38" rx="6" fill="#cfdbc4" stroke="#9fb492" />
            <path
              d="M69 139l7 5-8 4 7 6"
              stroke="#d7b768"
              strokeWidth="3"
              fill="none"
              opacity={Math.min(1, Math.abs(pulse.source) * 2)}
            />
            <g clipPath={`url(#${id}-field)`}>
              {Array.from({ length: 12 }, (_, i) => {
                const r = LIGHT_SPEED * (s.time - i * 1e-8) * (211 / 3);
                return r > 0 ? (
                  <circle
                    key={i}
                    cx="72"
                    cy="143"
                    r={r}
                    fill="none"
                    stroke="#a2bba0"
                    strokeWidth="1.5"
                    opacity={0.6 * Math.exp(-i * 0.4)}
                  />
                ) : null;
              })}
            </g>
            <g transform={`translate(283 143) scale(${Math.max(0.08, Math.cos(s.angle))} 1)`}>
              <path d="M9 48A49 49 0 1 0-9 48" fill="none" stroke="#b59a67" strokeWidth="4" />
              <circle cx="-9" cy="48" r="5" fill="#c5b385" />
              <circle cx="9" cy="48" r="5" fill="#c5b385" />
              <path
                d="M-5 48l5-3 1 6 5-3"
                fill="none"
                stroke="#d1b25e"
                strokeWidth="3"
                opacity={Math.min(1, Math.abs(pulse.received) * 8)}
              />
            </g>
          </>
        )}
        {s.mode === 2 && (
          <>
            <path d="M304 45V244" stroke="#a9b9a0" strokeWidth="12" />
            <path d="M52 145H299" stroke="#d4dfc9" />
            <path
              d={Array.from(
                { length: 221 },
                (_, i) =>
                  `${i ? 'L' : 'M'}${62 + (i * 242) / 220} ${145 - standingField((i / 220) * 6, s.time) * 34}`,
              ).join(' ')}
              stroke="#7d9d75"
              strokeWidth="2.5"
              fill="none"
            />
            {Array.from({ length: 5 }, (_, i) => (
              <path
                key={i}
                d={`M${304 - (i * (LIGHT_SPEED / 1e8 / 2) * 242) / 6} 82V208`}
                stroke="#c2ceb5"
                strokeDasharray="3 5"
              />
            ))}
          </>
        )}
        {s.mode === 3 && (
          <>
            <path d="M40 144H320V245H40Z" fill="#dbe5d2" opacity=".8" />
            <path d="M40 144H320M180 38V255" stroke="#a8bc9a" strokeDasharray="4 4" />
            <path
              d={`M${180 - 100 * Math.sin(s.incident)} ${144 - 100 * Math.cos(s.incident)}L180 144L${180 + 100 * Math.sin(refraction)} ${144 + 100 * Math.cos(refraction)}`}
              stroke="#a78d56"
              strokeWidth="3"
              fill="none"
            />
            <path
              d={`M180 107A37 37 0 0 0 ${180 - 37 * Math.sin(s.incident)} ${144 - 37 * Math.cos(s.incident)}`}
              stroke="#8caa7a"
              fill="none"
            />
            <text x="275" y="108">
              n₁ = 1
            </text>
            <text x="270" y="211">
              n₂ = 1.5
            </text>
          </>
        )}
        {s.mode === 5 && (
          <>
            <path
              d={`M115 40V${145 - s.width * 19}M115 ${145 + s.width * 19}V250`}
              stroke="#acbca0"
              strokeWidth="9"
            />
            {Array.from({ length: 6 }, (_, i) => (
              <path key={i} d={`M${32 + i * 13} 60V230`} stroke="#bdcdb3" strokeWidth="1.5" />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <path
                key={i}
                d={`M${115 + (i + 1) * 22 * Math.cos(-0.9)} ${145 + (i + 1) * 22 * Math.sin(-0.9)}A${(i + 1) * 22} ${(i + 1) * 22} 0 0 1 ${115 + (i + 1) * 22 * Math.cos(0.9)} ${145 + (i + 1) * 22 * Math.sin(0.9)}`}
                stroke="#b1c4a4"
                fill="none"
                strokeWidth="1.5"
                opacity=".6"
              />
            ))}
            <path
              d={Array.from({ length: 161 }, (_, i) => {
                const theta = (i / 160 - 0.5) * 1.8;
                return `${i ? 'L' : 'M'}${300 + slitIntensity(theta, s.width) * 32} ${45 + i * 1.25}`;
              }).join(' ')}
              fill="none"
              stroke="#809e72"
              strokeWidth="3"
            />
          </>
        )}
      </svg>
      {(s.mode < 2 || s.mode === 4) && (
        <div className="lab-inline-legend">
          <span>{t('发射间隙')}</span>
          <span>{t('接收间隙')}</span>
        </div>
      )}
      <p className="lab-apparatus-caption">
        {s.mode === 2
          ? t('入射波与反射波叠加出驻波')
          : s.mode === 3
            ? t('向法线偏折，频率保持不变')
            : s.mode === 5
              ? t('狭缝变窄，主瓣展开')
              : null}
      </p>
      <div className="textbook-em-meters">
        <span>
          {s.mode === 3
            ? `sin θ₁ / sin θ₂ = 1.5`
            : s.mode === 4
              ? `${t('相对接收功率')} = ${(Math.cos(s.angle) ** 2 * 100).toFixed(0)}%`
              : s.mode === 5
                ? `${t('中央强度归一')} = 1`
                : `λ = ${pulse.wavelength.toFixed(2)} m · Δt = ${(pulse.delay * 1e9).toFixed(2)} ns`}
        </span>
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择电磁波证据')}
            value={mode}
            onChange={setMode}
            options={names.map((label, i) => ({ value: String(i), label: t(label) }))}
          />
          {Number(mode) !== 3 && Number(mode) !== 5 && (
            <Range
              label={t('传播时间')}
              value={time}
              min={0}
              max={120}
              step={0.5}
              unit="ns"
              onChange={setTime}
            />
          )}
          {Number(mode) === 4 && (
            <Range
              label={t('接收环法线与磁场夹角')}
              value={angle}
              min={0}
              max={90}
              step={1}
              unit="°"
              onChange={setAngle}
            />
          )}{' '}
          {Number(mode) === 3 && (
            <Range
              label={t('入射角')}
              value={incident}
              min={0}
              max={65}
              step={1}
              unit="°"
              onChange={setIncident}
            />
          )}{' '}
          {Number(mode) === 5 && (
            <Range
              label={t('狭缝宽度与波长之比')}
              value={width}
              min={0.4}
              max={3}
              step={0.1}
              onChange={setWidth}
            />
          )}
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('历史装置与演示模型')}</summary>
        <p>
          {t(
            '火花装置为结构示意，响应按100兆赫阻尼波包和有限传播延迟计算；可见火花亮度仅表示响应强弱，不计算空气击穿阈值。极化比较采用接收环磁通投影，反射用一维理想导体边界，折射用平面界面，衍射用远场单缝近似。空间与纳秒时间均放大显示，未复原赫兹器材的全部尺寸。',
          )}
        </p>
      </details>
    </div>
  );
}
