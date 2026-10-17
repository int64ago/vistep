import { useState } from 'react';
import { t } from '../../i18n';
import {
  capillaryDefault,
  capillaryFrame,
  capillaryMeniscus,
  capillaryShot,
} from '../../models/capillary';
import { useShowcase } from '../lab/FilmContext';
import { useSignalWidth } from '../lab/SignalFigure';
import { Range } from '../lab/Controls';
import '../../styles/capillary.css';
export default function Capillary() {
  const d = useShowcase(),
    { host, width: w } = useSignalWidth();
  const [radius, setRadius] = useState(0.35),
    [angle, setAngle] = useState(20),
    [tension, setTension] = useState(72),
    [time, setTime] = useState(10);
  const f = d.watch
      ? capillaryShot(d.chapter, d.chapterProgress)
      : capillaryFrame(
          { ...capillaryDefault, radius: radius / 1000, angle, tension: tension / 1000 },
          time,
        ),
    close = d.watch && [1, 2, 6].includes(d.chapter),
    mid = w / 2;
  const tube = (x: number, r: number, h: number, key: string) => {
    const half = 15 + r * 22000,
      y = 280 - h * 1800,
      meniscus = capillaryMeniscus(half, f.config.angle);
    const line = meniscus.map((p, i) => `${i ? 'L' : 'M'}${x + p.x} ${y - p.z}`).join(' ');
    return (
      <g key={key}>
        <path
          d={`M${x - half - 4} 58V382M${x + half + 4} 58V382`}
          stroke="#c4d7d5"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d={`${line}L${x + half} 382H${x - half}Z`} fill="#b7dcd7" opacity=".82" />
        <path d={line} fill="none" stroke="#4c9b98" strokeWidth="2" />
        <path d={`M${x - half + 1} 69V365`} stroke="#fff" strokeWidth="2" opacity=".9" />
        <text x={x} y="33" textAnchor="middle">
          r = {(r * 1000).toFixed(2)} mm
        </text>
        <text x={x} y="423" textAnchor="middle">
          {(h * 1000).toFixed(1)} mm
        </text>
      </g>
    );
  };
  const other = capillaryFrame({ ...f.config, radius: 0.0007 }, f.time);
  const detailRadius = Math.min(80, (w - 32) / 2 - 60);
  const meniscus = capillaryMeniscus(detailRadius, f.config.angle),
    path = meniscus.map((p, i) => `${i ? 'L' : 'M'}${mid + p.x} ${190 - p.z}`).join(' '),
    edgeY = 190 - meniscus[0].z,
    a = (f.config.angle * Math.PI) / 180;
  return (
    <div ref={host} className="capillary-scene">
      <div className="capillary-head">
        <span>{t(close ? '接触线局部 · 等比例放大' : '细管液柱 · 同一种液体')}</span>
        <b>
          {f.config.angle.toFixed(0)}° <small>{t('接触角')}</small>
        </b>
      </div>
      <svg viewBox={`0 0 ${w} 445`} role="img" aria-label={t('毛细液柱、接触角与表面张力')}>
        {close ? (
          <>
            <path d={`${path}L${mid + detailRadius} 350H${mid - detailRadius}Z`} fill="#c4e3dc" />
            <path
              d={`M${mid - detailRadius - 4} 40V350M${mid + detailRadius + 4} 40V350`}
              stroke="#c3d7d2"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path d={path} fill="none" stroke="#4a9290" strokeWidth="3" />
            {[-1, 1].map((sign) => (
              <g key={sign}>
                <circle cx={mid + sign * detailRadius} cy={edgeY} r="5" fill="#ae8853" />
                <path
                  d={`M${mid + sign * detailRadius} ${edgeY}l${sign * Math.sin(a) * 60} ${-Math.cos(a) * 60}`}
                  stroke="#ba9558"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d={`M${mid + sign * detailRadius} ${edgeY}v${-Math.cos(a) * 60}`}
                  stroke="#618c78"
                  strokeWidth="3"
                  strokeDasharray="4 4"
                />
              </g>
            ))}
            <text x={mid} y="387" textAnchor="middle">
              {t('金线：表面张力方向')}
            </text>
            <text x={mid} y="424" textAnchor="middle">
              {t('虚线：竖直分量')}
            </text>
          </>
        ) : (
          <>
            <path
              d={`M16 280H${w - 16}V387Q${w - 16} 404 ${w - 33} 404H33Q16 404 16 387Z`}
              fill="#d6eae3"
            />
            <path d={`M16 280H${w - 16}`} stroke="#8bb6a9" strokeWidth="2" />
            {tube(w * 0.29, f.config.radius, f.height, 'a')}
            {tube(w * 0.73, 0.0007, other.height, 'b')}
            <path
              d={`M${w * 0.29 + 50} 280V${280 - f.height * 1800}`}
              stroke="#b38c54"
              strokeDasharray="3 4"
            />
          </>
        )}
      </svg>
      <div className="capillary-forces">
        <span>
          {t('表面张力竖直合力')}
          <b>{(f.capillaryForce * 1000).toFixed(3)} mN</b>
        </span>
        <span>
          {t('液柱相对重量')}
          <b>{(f.weight * 1000).toFixed(3)} mN</b>
        </span>
      </div>
      <details className="capillary-model-note">
        <summary>{t('模型边界')}</summary>
        <p>{t('主图管宽横向放大；局部接触线等比例。黏性准静态模型忽略惯性。')}</p>
      </details>
      {!d.watch && (
        <div className="capillary-controls">
          <Range
            label={t('细管半径')}
            min={0.2}
            max={1}
            step={0.01}
            value={radius}
            unit="mm"
            onChange={setRadius}
          />
          <Range
            label={t('液体内侧接触角')}
            min={0}
            max={130}
            step={1}
            value={angle}
            unit="°"
            onChange={setAngle}
          />
          <Range
            label={t('表面张力')}
            min={35}
            max={80}
            step={1}
            value={tension}
            unit="mN/m"
            onChange={setTension}
          />
          <Range
            label={t('进入液体后的时间')}
            min={0}
            max={30}
            step={0.05}
            value={time}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
    </div>
  );
}
