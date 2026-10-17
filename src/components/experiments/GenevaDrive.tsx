import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import { genevaState, genevaShot } from '../../models/geneva-drive';
import '../../styles/geneva-drive.css';
export default function GenevaDrive() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    [angle, setAngle] = useState(-180),
    [slots, setSlots] = useState(4),
    [rpm, setRpm] = useState(30),
    s = film.watch
      ? genevaShot(film.chapter, film.chapterProgress)
      : genevaState((angle * Math.PI) / 180, slots, rpm),
    c = film.watch ? film.chapter : -1;
  const start = (Math.PI - s.entry) / (2 * Math.PI),
    end = (Math.PI + s.entry) / (2 * Math.PI),
    phase = (s.phase + Math.PI) / (2 * Math.PI);
  return (
    <div className="geneva-film">
      <div className="geneva-heading">
        <span>
          {t('连续输入')}
          <b>{s.rpm.toFixed(0)} rpm</b>
        </span>
        <span className={s.engaged ? 'is-indexing' : ''}>
          {s.engaged ? t('销钉推动') : t('圆弧锁止')}
          <b>{s.outputRpm.toFixed(1)} rpm</b>
        </span>
      </div>
      <svg
        className="geneva-machine"
        viewBox="0 0 340 250"
        role="img"
        aria-label={t('驱动销、径向槽和配合锁止圆弧的日内瓦机构')}
      >
        <defs>
          <mask
            id={`${id}-wheel`}
            maskUnits="userSpaceOnUse"
            x="-1.2"
            y="-1.2"
            width="2.4"
            height="2.4"
          >
            <circle r={s.outer} fill="white" />
            {Array.from({ length: s.slots }, (_, i) => {
              const a = Math.PI + i * s.step,
                b = a - s.halfStep;
              return (
                <g key={i}>
                  <rect
                    x={s.slotInner}
                    y={-s.slotHalfWidth}
                    width="1.2"
                    height={s.slotHalfWidth * 2}
                    fill="black"
                    transform={`rotate(${(a * 180) / Math.PI})`}
                  />
                  <circle cx={Math.cos(b)} cy={Math.sin(b)} r={s.lockRadius} fill="black" />
                </g>
              );
            })}
          </mask>
          <mask id={`${id}-driver`} maskUnits="userSpaceOnUse" x="-1" y="-1" width="2" height="2">
            <circle r={s.lockRadius} fill="white" />
            <circle cx="1" cy="0" r={s.reliefRadius} fill="black" />
          </mask>
          <linearGradient
            id={`${id}-metal`}
            x1="-1"
            x2="1"
            y1="-1"
            y2="1"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#adc5bb" />
            <stop offset=".55" stopColor="#79a596" />
            <stop offset="1" stopColor="#537c73" />
          </linearGradient>
          <linearGradient
            id={`${id}-bronze`}
            x1="-.7"
            x2=".7"
            y1="-.7"
            y2=".7"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#d6b67b" />
            <stop offset="1" stopColor="#a67c49" />
          </linearGradient>
        </defs>
        <path d="M45 189H303" stroke="#c8d3c3" strokeWidth="3" strokeLinecap="round" />
        <g transform="translate(104 126) scale(102 -102)">
          <circle
            r={s.crank}
            fill="none"
            stroke="#cbd4c4"
            strokeWidth=".012"
            strokeDasharray=".03 .055"
          />
          <path
            d={`M0 0L${s.pin.x} ${s.pin.y}`}
            stroke="#8c9b98"
            strokeWidth=".13"
            strokeLinecap="round"
          />
          <circle cx={s.pin.x} cy={s.pin.y} r=".065" fill="#8c9b98" />
          <g transform={`rotate(${(s.input * 180) / Math.PI})`}>
            <circle r={s.lockRadius} fill={`url(#${id}-bronze)`} mask={`url(#${id}-driver)`} />
          </g>
          <g transform={`translate(1 0) rotate(${(s.output * 180) / Math.PI})`}>
            <circle
              r={s.outer}
              fill={`url(#${id}-metal)`}
              stroke="#527c72"
              strokeWidth=".018"
              mask={`url(#${id}-wheel)`}
            />
            <circle r=".19" fill="#d9e3d8" stroke="#587f74" strokeWidth=".018" />
            <path d="M0 0L.16 0" stroke="#bd9053" strokeWidth=".045" strokeLinecap="round" />
            {c === 1 && (
              <path
                d={`M${-s.outer} 0H${-s.slotInner}`}
                stroke="#dbaf59"
                strokeWidth=".018"
                strokeDasharray=".035 .025"
              />
            )}
          </g>
          <circle r=".105" fill="#ebeee2" stroke="#9a805c" strokeWidth=".018" />
          <circle r=".035" fill="#8b775c" />
          <circle cx="1" r=".055" fill="#58786d" />
          <circle
            cx={s.pin.x}
            cy={s.pin.y}
            r={s.pinRadius}
            fill="#fff2ad"
            stroke="#a47e42"
            strokeWidth=".012"
          />
          {(c === 1 || c === 2) && (
            <circle
              cx={s.pin.x}
              cy={s.pin.y}
              r=".085"
              fill="none"
              stroke="#d6a14c"
              strokeWidth=".013"
            />
          )}
          {c === 3 && (
            <circle
              cx={s.lockRadius}
              cy="0"
              r=".095"
              fill="#e7c17f"
              fillOpacity=".35"
              stroke="#af8649"
              strokeWidth=".012"
            />
          )}
        </g>
        <text x="104" y="232" textAnchor="middle">
          {t('输入轴')}
        </text>
        <text x="206" y="232" textAnchor="middle">
          {s.slots}
          {t('槽')}
        </text>
      </svg>
      <div className="geneva-timing" aria-label={t('一圈输入中的分度和停歇区间')}>
        <div className="geneva-timing-label">
          <span>{t('一圈输入')}</span>
          <span>
            {t('每步')} {(360 / s.slots).toFixed(0)}°
          </span>
        </div>
        <div className="geneva-band">
          <span style={{ left: `${start * 100}%`, width: `${(end - start) * 100}%` }} />
          <i style={{ left: `${phase * 100}%` }} />
        </div>
        <div className="geneva-fractions">
          <span>
            {t('分度')} {(s.indexFraction * 100).toFixed(0)}%
          </span>
          <span>
            {t('停歇')} {(s.dwellFraction * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      {!film.watch && (
        <div className="geneva-controls">
          <Segments
            label={t('径向槽数')}
            value={String(slots)}
            options={[4, 5, 6].map((v) => ({ value: String(v), label: String(v) }))}
            onChange={(v) => setSlots(Number(v))}
          />
          <Range
            label={t('输入转角')}
            value={angle}
            min={-180}
            max={1260}
            unit="°"
            onChange={setAngle}
          />
          <Range label={t('输入转速')} value={rpm} min={10} max={90} unit="rpm" onChange={setRpm} />
        </div>
      )}
      <details className="geneva-notes">
        <summary>{t('模型条件')}</summary>
        <p>
          {t(
            '标准外啮合日内瓦机构，刚体、理想锁止；动画慢放，读数按参考转速；不计算间隙冲击、惯量、应力或额定转速。',
          )}
        </p>
      </details>
    </div>
  );
}
