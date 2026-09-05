import { useState } from 'react';
import { t } from '../../i18n';
import {
  apertureDiameter,
  apertureShot,
  circleOfConfusion,
  depthOfField,
  relativeLight,
  airyDiameter,
  thinLens,
} from '../../models/optics';
import { useShowcase } from '../lab/Showcase';
import { Range } from '../lab/Controls';
import AperturePhoto from '../lab/AperturePhoto';
import { useCompact } from '../lab/useCompact';
import '../../styles/optics.css';
export default function Aperture() {
  const demo = useShowcase(),
    [manualN, setN] = useState(2),
    [manualFocus, setFocus] = useState(2000),
    [autoExposure, setAutoExposure] = useState(true);
  const state = demo.watch
    ? apertureShot(demo.chapter, demo.chapterProgress)
    : { fNumber: manualN, focus: manualFocus, compensate: autoExposure, focal: 50 };
  const diameter = apertureDiameter(50, state.fNumber),
    depth = depthOfField(50, state.fNumber, state.focus);
  const map = (m: number) => Math.max(0, Math.min(100, ((m - 1000) / 5400) * 100));
  const blur = circleOfConfusion(50, state.fNumber, 6000, state.focus);
  const compact = useCompact(),
    sharpImage = thinLens(50, 6000).image!,
    sensor = thinLens(50, state.focus).image!;
  const sensorX = 300 + (sensor - sharpImage) * 240;
  const coneY = (x: number, sign: number) =>
    80 + ((sign * diameter) / 2) * (1 - x / sharpImage) * 200;
  return (
    <div className="aperture-study">
      <div className="aperture-viewfinder">
        <AperturePhoto {...state} />
        <div className="viewfinder-top">
          <span>50 mm</span>
          <span>ƒ / {state.fNumber.toFixed(1)}</span>
        </div>
        <div
          className="viewfinder-focus"
          style={{
            left: state.focus < 3000 ? (compact ? '45%' : '46.7%') : compact ? '90.5%' : '77%',
            top: state.focus < 3000 ? '41.5%' : '25%',
            transition: demo.playing ? undefined : 'none',
          }}
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="viewfinder-bottom">
          <span>
            {t('对焦')} {(state.focus / 1000).toFixed(1)} m
          </span>
          <span>{state.compensate ? t('亮度补偿') : t('固定快门')}</span>
        </div>
        {demo.watch && demo.chapter === 3 && (
          <div className="blur-study">
            <svg
              viewBox="0 0 640 160"
              aria-label={t('同一个背景光点在传感器上形成的弥散圆')}
              role="img"
            >
              <path d="M40 80H560" stroke="#a4ae9b" strokeDasharray="4 6" />
              {[-1, 1].map((sign) => (
                <path
                  key={sign}
                  d={`M60 ${coneY(sharpImage - 1, sign)}L300 80L${sensorX} ${coneY(sensor, sign)}`}
                  fill="none"
                  stroke="#927742"
                  strokeWidth="2"
                />
              ))}
              <path d={`M${sensorX} 8V152`} stroke="#82947c" strokeWidth="3" />
              <circle cx="595" cy="80" r={Math.max(1, blur * 100)} fill="#d6b56d" opacity=".7" />
            </svg>
            <span>
              {t('像面附近放大')}
              <br />
              {t('背景弥散圆')} {(blur * 1000).toFixed(0)} μm
            </span>
          </div>
        )}
        {demo.watch && demo.chapter === 6 && (
          <div className="diffraction-note">
            <svg
              viewBox="0 0 240 120"
              role="img"
              aria-label={t('放大后的衍射光斑，光圈缩小时中央斑变大')}
            >
              <rect width="240" height="120" rx="16" fill="#233b30" />
              {[2.65, 1.83, 1].map((v, i) => (
                <circle
                  key={v}
                  cx="120"
                  cy="60"
                  r={airyDiameter(state.fNumber) * 650 * v}
                  fill={i === 2 ? '#d7dfb080' : 'none'}
                  stroke="#dae8b2"
                  strokeOpacity={0.15 + i * 0.15}
                />
              ))}
            </svg>
            <span>
              {t('衍射光斑直径')}
              <strong>{(airyDiameter(state.fNumber) * 1000).toFixed(1)} μm</strong>
            </span>
          </div>
        )}
      </div>
      <div className="aperture-strip">
        <div className="pupil-view">
          <svg viewBox="0 0 130 130" role="img" aria-label={t('入瞳直径随光圈值增大而减小')}>
            <defs>
              <radialGradient id="pupil-metal">
                <stop stopColor="#8f9a86" />
                <stop offset=".72" stopColor="#354c40" />
                <stop offset="1" stopColor="#182e24" />
              </radialGradient>
              <mask id="pupil-hole">
                <rect width="130" height="130" fill="white" />
                <circle cx="65" cy="65" r={diameter * 1.75} fill="black" />
              </mask>
            </defs>
            <circle cx="65" cy="65" r="59" fill="#11291f" />
            <circle cx="65" cy="65" r="57" fill="url(#pupil-metal)" mask="url(#pupil-hole)" />
            <circle cx="65" cy="65" r={diameter * 1.75} fill="#ede9ce" />
            <circle cx="65" cy="65" r="59" fill="none" stroke="#b1b79d" strokeWidth="2" />
          </svg>
          <span>
            {t('入瞳')} {diameter.toFixed(1)} mm
          </span>
        </div>
        <div className="aperture-observation">
          <div className="aperture-main-number">
            <strong>ƒ / {state.fNumber.toFixed(1)}</strong>
            <span>
              {t('相对进光量')} {(relativeLight(state.fNumber) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="depth-scale">
            <div
              className="depth-acceptable"
              style={{ left: `${map(depth.near)}%`, width: `${map(depth.far) - map(depth.near)}%` }}
            />
            {[1300, 2000, 3000, 6000].map((d) => (
              <i
                key={d}
                style={{ left: `${map(d)}%` }}
                data-focused={circleOfConfusion(50, state.fNumber, d, state.focus) < 0.03}
              >
                <span>{d / 1000} m</span>
              </i>
            ))}
            <b style={{ left: `${map(state.focus)}%` }} />
          </div>
          <p>
            {t('可接受清晰范围')}{' '}
            <strong>
              {(depth.near / 1000).toFixed(2)}–
              {Number.isFinite(depth.far) ? (depth.far / 1000).toFixed(2) : '∞'} m
            </strong>
          </p>
        </div>
      </div>
      {!demo.watch && (
        <div className="aperture-explore">
          <Range label={t('光圈值')} value={manualN} min={2} max={22} step={0.1} onChange={setN} />
          <Range
            label={t('对焦距离')}
            value={manualFocus / 1000}
            min={1.3}
            max={6}
            step={0.1}
            unit="m"
            onChange={(v) => setFocus(v * 1000)}
          />
          <button
            className="btn"
            aria-pressed={autoExposure}
            onClick={() => setAutoExposure(!autoExposure)}
          >
            {autoExposure ? t('关闭亮度补偿') : t('开启亮度补偿')}
          </button>
        </div>
      )}
      <p className="optics-model-note">{t('50 mm 理想镜头 · 全画幅 · 清晰阈值 0.03 mm')}</p>
    </div>
  );
}
