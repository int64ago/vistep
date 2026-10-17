import { useState } from 'react';
import { t } from '../../i18n';
import { pinhole, pinholeRay, pinholeShot } from '../../models/pinhole-camera';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/pinhole-camera.css';
export default function PinholeCamera() {
  const film = useShowcase(),
    phone = useCompact();
  const [hole, setHole] = useState(0.35),
    [depth, setDepth] = useState(100);
  const shot = pinholeShot(film.chapter, film.chapterProgress),
    s = pinhole(film.watch ? shot : { aperture: hole, screenDistance: depth });
  const W = phone ? 340 : 760,
    H = phone ? 310 : 350,
    ox = 35,
    xScale = (W - 70) / 780,
    hx = ox + 600 * xScale,
    sx = hx + s.screenDistance * xScale,
    cy = H / 2,
    objectScale = phone ? 1.55 : 1.8,
    imageScale = objectScale,
    // Fixed scale fits all three image points and their blur at b=180 mm, d=0.03 mm.
    detailScale = 5;
  const blur = Math.min(65, s.illustrativeWidth * imageScale),
    detail = !film.watch || (film.chapter >= 1 && film.chapter <= 4);
  return (
    <section className="pinhole-study">
      <div className="pinhole-title">
        <span>{t('一个孔，把方向分开')}</span>
        <b>ø {s.aperture.toFixed(2)} mm</b>
      </div>
      {detail ? (
        <div className="pinhole-detail">
          <span>{t('接收屏局部放大')}</span>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={t('相同物点的归一化光斑随孔径改变')}
          >
            <rect
              x={W * 0.65 - 24}
              y="18"
              width={48}
              height={H - 36}
              rx="16"
              fill="#101f2a"
              stroke="#5a7784"
            />
            <path
              d={`M${W * 0.16} ${H / 2 - 45}V${H / 2 - (s.aperture * detailScale) / 2}M${W * 0.16} ${H / 2 + (s.aperture * detailScale) / 2}V${H / 2 + 45}`}
              stroke="#d6c09d"
              strokeWidth="3"
            />
            {[60, 0, -60].map((h, i) => (
              <g key={h}>
                {[-0.5, 0.5].map((edge) => (
                  <path
                    key={edge}
                    d={`M${W * 0.16} ${H / 2 - edge * s.aperture * detailScale}L${W * 0.65} ${H / 2 - pinholeRay(h, edge * s.aperture, { aperture: s.aperture, screenDistance: s.screenDistance }) * detailScale}`}
                    fill="none"
                    stroke={['#edb369', '#d8dfbe', '#86baca'][i]}
                    strokeWidth="1"
                    opacity=".3"
                  />
                ))}
                <circle
                  cx={W * 0.65}
                  cy={H / 2 + ((h * s.screenDistance) / s.objectDistance) * detailScale}
                  r={Math.max(0.7, (s.illustrativeWidth * detailScale) / 2)}
                  fill={['#edb369', '#d8dfbe', '#86baca'][i]}
                  opacity=".3"
                />
                <circle
                  cx={W * 0.65}
                  cy={H / 2 + ((h * s.screenDistance) / s.objectDistance) * detailScale}
                  r="0.7"
                  fill={['#edb369', '#d8dfbe', '#86baca'][i]}
                />
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('物点经小孔在暗箱中形成倒像')}>
          <path
            d={`M${hx} 22H${sx + 12}V${H - 22}H${hx}Z`}
            fill="#101f2a"
            stroke="#5a7784"
            strokeWidth="2"
          />
          <path
            d={`M${hx} 22V${cy - 5 - s.aperture * 3}M${hx} ${cy + 5 + s.aperture * 3}V${H - 22}`}
            stroke="#d6c09d"
            strokeWidth="6"
          />
          <path d={`M${sx} 34V${H - 34}`} stroke="#d4dfd8" strokeWidth="5" />
          {[60, 0, -60].map((height, i) => {
            const color = ['#edb369', '#d8dfbe', '#86baca'][i],
              y = cy - height * objectScale,
              landing = cy + ((height * s.screenDistance) / s.objectDistance) * imageScale;
            return (
              <g key={height}>
                <circle cx={ox} cy={y} r="7" fill={color} />
                {[-0.5, 0, 0.5].map((edge, j) => {
                  const cross = edge * s.aperture,
                    land =
                      cy -
                      pinholeRay(height, cross, {
                        aperture: s.aperture,
                        screenDistance: s.screenDistance,
                      }) *
                        imageScale;
                  return (
                    <path
                      key={j}
                      d={`M${ox} ${y}L${hx} ${cy - cross * imageScale}L${sx} ${land}`}
                      stroke={color}
                      strokeWidth={j === 1 ? 1.7 : 1}
                      opacity={j === 1 ? 0.8 : 0.25}
                      fill="none"
                    />
                  );
                })}
                <ellipse
                  cx={sx}
                  cy={landing}
                  rx={phone ? 5 : 8}
                  ry={Math.max(4, blur / 2)}
                  fill={color}
                  opacity=".45"
                />
                <circle cx={sx} cy={landing} r="3" fill={color} />
              </g>
            );
          })}
          <path
            d={`M${ox} ${cy - 60 * objectScale}V${cy + 60 * objectScale}`}
            stroke="#dce2d5"
            strokeWidth="2"
            opacity=".3"
          />
          <g fill="#b9cbd0" fontSize={phone ? 22 : 18}>
            <text x={ox} y={H - 3}>
              {t('物体')}
            </text>
            <text x={hx - 16} y={cy - 38} textAnchor="end">
              {t('孔口')}
            </text>
            <path d={`M${hx - 14} ${cy - 32}L${hx - 4} ${cy - 8}`} fill="none" stroke="#b9cbd066" />
            <text x={sx} y={H - 3} textAnchor="end">
              {t('接收屏')}
            </text>
          </g>
        </svg>
      )}
      <div className="pinhole-scales">
        <div>
          <span>{t('几何斑直径')}</span>
          <b>{s.geometric.toFixed(2)} mm</b>
          <i style={{ width: `${Math.min(100, (s.geometric / 2.5) * 100)}%` }} />
        </div>
        <div>
          <span>{t('衍射斑尺度')}</span>
          <b>{s.diffraction.toFixed(2)} mm</b>
          <i style={{ width: `${Math.min(100, (s.diffraction / 2.5) * 100)}%` }} />
        </div>
      </div>
      <div className="pinhole-photometry">
        <span>
          {t('像高 / 物高')} <b>−{(s.screenDistance / s.objectDistance).toFixed(2)}</b>
        </span>
        <span>
          {t('相对通光量')} <b>{(s.throughput / 0.35 ** 2).toFixed(2)}×</b>
        </span>
      </div>
      <details>
        <summary>{t('光斑与模型条件')}</summary>
        <p>
          {t(
            '光斑亮度已归一化，通光量相对0.35毫米孔径。孔口放大，光斑宽度为几何与衍射尺度的平方和开方示意。2.44λb/d仅是圆孔远场尺度；过渡区不是精确点扩散函数。',
          )}
        </p>
      </details>
      {!film.watch && (
        <div className="pinhole-controls">
          <Range
            label={t('孔径')}
            value={hole}
            min={0.03}
            max={2}
            step={0.01}
            unit="mm"
            onChange={setHole}
          />
          <Range label={t('屏距')} value={depth} min={50} max={180} unit="mm" onChange={setDepth} />
        </div>
      )}
    </section>
  );
}
