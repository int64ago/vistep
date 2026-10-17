import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  capacitorFieldDefaults,
  capacitorFields,
  capacitorFieldShot,
} from '../../models/capacitor-fields';
import '../../styles/capacitor-fields.css';
export default function CapacitorFields() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [connection, setConnection] = useState('voltage'),
    [gap, setGap] = useState(5),
    [voltage, setVoltage] = useState(12),
    [charge, setCharge] = useState(212.5),
    [permittivity, setPermittivity] = useState(4),
    [fraction, setFraction] = useState('0'),
    c = film.watch ? film.chapter : -1,
    s = film.watch
      ? capacitorFieldShot(c, film.chapterProgress)
      : capacitorFields({
          ...capacitorFieldDefaults(),
          connection: connection as 'voltage' | 'charge',
          gap: gap / 1000,
          voltage,
          charge: charge * 1e-12,
          relativePermittivity: permittivity,
          fraction: Number(fraction),
        }),
    scale = 36000,
    left = 170 - (s.gap * scale) / 2,
    right = 170 + (s.gap * scale) / 2,
    dl = left + s.airHalf * scale,
    dr = dl + s.thickness * scale,
    axisMax = Math.max(18, Math.ceil(s.voltage / 6) * 6),
    py = (v: number) => 93 - (v / axisMax) * 65,
    points = [0, s.airHalf, s.airHalf + s.thickness, s.gap]
      .map((x) => `${left + x * scale},${py(s.potential(x))}`)
      .join(' '),
    bound = s.fraction > 0 && s.relativePermittivity > 1;
  return (
    <div className="capacitor-field-film" data-watch={film.watch}>
      <p className="capacitor-boundary">
        {s.connection === 'charge' ? t('隔离：自由电荷固定') : t('接电源：电压固定')}
      </p>
      <svg
        className="capacitor-gap"
        viewBox="0 0 340 218"
        role="img"
        aria-label={t('平行极板中央间隙剖面、自由电荷与介质极化')}
      >
        <defs>
          <linearGradient id={`${id}-dielectric`} x1={dl} x2={dr} gradientUnits="userSpaceOnUse">
            <stop stopColor="#dfdfbf" />
            <stop offset=".5" stopColor="#ece7cb" />
            <stop offset="1" stopColor="#d7dfc2" />
          </linearGradient>
          <marker
            id={`${id}-field`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="#9b9269" />
          </marker>
        </defs>
        {s.fraction > 0 && (
          <rect
            x={dl}
            y="30"
            width={dr - dl}
            height="144"
            rx="3"
            fill={`url(#${id}-dielectric)`}
            stroke="#c6cdae"
          />
        )}
        <rect x={left - 8} y="30" width="8" height="144" rx="2" fill="#bea375" />
        <rect x={right} y="30" width="8" height="144" rx="2" fill="#87a6a0" />
        {[left - 4, right + 4].map((x) => (
          <g key={x}>
            <path
              d={`M${x - 5} 29l3 -4 4 8 3 -4M${x - 5} 175l3 -4 4 8 3 -4`}
              fill="none"
              stroke="#f9faf4"
              strokeWidth="2"
            />
          </g>
        ))}
        <text x={left - 4} y="22" textAnchor="middle" fill="#ac8955">
          +
        </text>
        <text x={right + 4} y="22" textAnchor="middle" fill="#6c9790">
          −
        </text>
        {Array.from({ length: 6 }, (_, i) => {
          const y = 43 + i * 22,
            opacity = 0.35 + (0.65 * s.charge) / (s.charge + 2e-10);
          return (
            <g key={i} opacity={opacity}>
              <path
                d={`M${left + 3} ${y}h6M${left + 6} ${y - 3}v6M${right - 9} ${y}h6`}
                stroke="#8f956e"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
        {bound &&
          Array.from({ length: 6 }, (_, i) => {
            const y = 43 + i * 22;
            return (
              <g key={i} opacity={0.25 + 0.75 * (1 - 1 / s.relativePermittivity)}>
                <circle cx={dl + 13} cy={y} r="4" fill="#92afa5" />
                <path d={`M${dl + 11} ${y}h4`} stroke="#fffdf0" />
                <circle cx={dr - 13} cy={y} r="4" fill="#c7ad77" />
                <path d={`M${dr - 15} ${y}h4M${dr - 13} ${y - 2}v4`} stroke="#fffdf0" />
              </g>
            );
          })}
        {s.voltage > 0 && (
          <path
            d={`M${left + 20} 102H${right - 20}`}
            fill="none"
            stroke="#9b9269"
            strokeWidth="2"
            markerEnd={`url(#${id}-field)`}
          />
        )}
        <path d={`M${left} 187v7m0 -3H${right}m0 -4v7`} fill="none" stroke="#b3bda5" />
        <text x="170" y="210" textAnchor="middle">
          d = {(s.gap * 1000).toFixed(1)} mm
        </text>
      </svg>
      <div className="capacitor-potential">
        <svg
          viewBox="0 0 340 124"
          role="img"
          aria-label={t('沿极板间隙的电势，斜率大小表示电场强度')}
        >
          <path d={`M${left} 26V93H${right}`} fill="none" stroke="#b5c3aa" />
          {s.fraction > 0 && (
            <>
              <path d={`M${dl} 26V93M${dr} 26V93`} stroke="#d0d6bd" strokeDasharray="3 4" />
            </>
          )}
          <polyline points={points} fill="none" stroke="#9d8d59" strokeWidth="3" />
          <circle cx={left} cy={py(s.voltage)} r="3" fill="#9d8d59" />
          <text x="17" y="20">
            {axisMax} V
          </text>
          <text x="8" y="100">
            0
          </text>
          <text x="170" y="114" textAnchor="middle">
            {t('电势剖面')}
          </text>
        </svg>
      </div>
      <div className="capacitor-readings">
        <span>
          V (V)<b>{s.voltage.toFixed(2)}</b>
        </span>
        <span>
          Q (pC)<b>{(s.charge * 1e12).toFixed(0)}</b>
        </span>
      </div>
      <p className="capacitor-fields-readout">
        {s.fraction === 1 ? (
          <>
            {t('介质场强')} {(s.dielectricField / 1000).toFixed(2)} kV/m
          </>
        ) : s.fraction === 0 ? (
          <>
            {t('空气场强')} {(s.airField / 1000).toFixed(2)} kV/m
          </>
        ) : (
          <>
            {t('空气')} {(s.airField / 1000).toFixed(2)} · {t('介质')}{' '}
            {(s.dielectricField / 1000).toFixed(2)} kV/m
          </>
        )}
      </p>
      {!film.watch && (
        <div className="capacitor-field-controls">
          <Segments
            label={t('电边界条件')}
            value={connection}
            options={[
              { value: 'voltage', label: t('固定电压') },
              { value: 'charge', label: t('固定电荷') },
            ]}
            onChange={setConnection}
          />
          {connection === 'voltage' ? (
            <Range
              label={t('电源电压')}
              value={voltage}
              min={3}
              max={12}
              step={0.5}
              unit="V"
              onChange={setVoltage}
            />
          ) : (
            <Range
              label={t('自由电荷量')}
              value={charge}
              min={50}
              max={400}
              step={0.5}
              unit="pC"
              onChange={setCharge}
            />
          )}
          <Range
            label={t('板间距离')}
            value={gap}
            min={2}
            max={8}
            step={0.1}
            unit="mm"
            onChange={setGap}
          />
          <Segments
            label={t('介质占间隙厚度')}
            value={fraction}
            options={[
              { value: '0', label: t('无介质') },
              { value: '.5', label: t('一半') },
              { value: '1', label: t('全部') },
            ]}
            onChange={setFraction}
          />
          <Range
            label={t('相对介电常数')}
            value={permittivity}
            min={1}
            max={6}
            step={0.1}
            onChange={setPermittivity}
          />
        </div>
      )}
      <details className="capacitor-field-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '面积100 cm²，忽略边缘效应；画面是中央4 mm高的局部剖面。线性绝缘介质，无漏电、击穿或充电瞬态。符号表示电荷正负，箭头表示场方向；数值与电势斜率给出大小。材料变化比较独立静态配置。',
          )}
        </p>
      </details>
    </div>
  );
}
