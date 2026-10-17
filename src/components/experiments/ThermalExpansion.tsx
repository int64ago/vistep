import { useId, useState } from 'react';
import { t } from '../../i18n';
import { thermalExpansion, expandPoint, expansionShot } from '../../models/thermal-expansion';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/thermal-expansion.css';
export default function ThermalExpansion() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [deltaT, setDeltaT] = useState(80),
    [plugHot, setPlugHot] = useState(false),
    [locked, setLocked] = useState(false),
    [view, setView] = useState<'plate' | 'gap' | 'rod'>('plate'),
    [material, setMaterial] = useState(false),
    [length, setLength] = useState(1);
  const shot = film.watch
      ? expansionShot(film.chapter, film.chapterProgress)
      : {
          deltaT,
          plugDeltaT: plugHot ? deltaT : 0,
          locked,
          view,
          alpha: material ? 12e-6 : 25e-6,
          young: material ? 200e9 : 70e9,
          length,
        },
    s = thermalExpansion(shot),
    W = phone ? 340 : 760,
    H = phone ? 235 : 300,
    mag = 100,
    centre = phone ? 170 : 380,
    R = phone ? 77 : 105,
    displayScale = 1 + s.strain * mag,
    hole = R * 0.4 * displayScale,
    gapCentre = phone ? 170 : 380,
    gapScale = phone ? 0.65 : 1.1,
    holeEdge = gapCentre + (s.holeRadius - 0.02) * 1e6 * gapScale,
    plugEdge = gapCentre + (s.plugRadius - 0.02) * 1e6 * gapScale,
    rodStart = phone ? 45 : 150,
    rodScale = phone ? 180 : 380,
    rodEnd = rodStart + rodScale * s.length,
    tip = rodStart + rodScale * (s.length + s.freeChange * mag),
    physicalEnd = s.locked ? rodEnd : tip;
  return (
    <section className="expansion-study">
      <header>
        {t(
          shot.view === 'rod'
            ? s.locked
              ? '长度被固定，热应变转为应力'
              : '一端定位，另一端允许自由伸缩'
            : shot.view === 'gap'
              ? '固定倍率看孔缘与塞子之间的间隙'
              : '均匀受热，孔与外缘一起扩大',
        )}
      </header>
      <svg
        className="expansion-object"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('均匀热膨胀的带孔板、冷塞间隙局部或受约束杆的兼容变形')}
      >
        <defs>
          <linearGradient id={`${id}metal`} x2=".7" y2="1">
            <stop stopColor="#e2ceb0" />
            <stop offset=".45" stopColor="#b9a17c" />
            <stop offset="1" stopColor="#e5d2ac" />
          </linearGradient>
          <pattern id={`${id}hatch`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 8L8 0" stroke="#969184" />
          </pattern>
        </defs>
        {shot.view === 'plate' ? (
          <>
            <path
              d={`M${centre - R * displayScale} ${H / 2}a${R * displayScale} ${R * displayScale} 0 1 0 ${2 * R * displayScale} 0a${R * displayScale} ${R * displayScale} 0 1 0 ${-2 * R * displayScale} 0M${centre - hole} ${H / 2}a${hole} ${hole} 0 1 0 ${2 * hole} 0a${hole} ${hole} 0 1 0 ${-2 * hole} 0`}
              fill={`url(#${id}metal)`}
              fillRule="evenodd"
              stroke="#a08b69"
            />
            <circle
              cx={centre}
              cy={H / 2}
              r={R}
              fill="none"
              stroke="#837f75"
              strokeDasharray="4 5"
            />
            <circle
              cx={centre}
              cy={H / 2}
              r={R * 0.4}
              fill="none"
              stroke="#837f75"
              strokeDasharray="4 5"
            />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * Math.PI) / 6,
                p = expandPoint(Math.cos(a) * 0.036, Math.sin(a) * 0.036, s.deltaT, s.alpha, mag);
              return (
                <circle
                  key={i}
                  cx={centre + (p.x / 0.05) * R}
                  cy={H / 2 + (p.y / 0.05) * R}
                  r="2.5"
                  fill="#776b55"
                />
              );
            })}
            <path
              d={`M${centre - hole + 3} ${H / 2}H${centre + hole - 3}`}
              stroke="#a18357"
              strokeWidth="2"
            />
            <path
              d={`M${centre - hole} ${H / 2 - 6}v12M${centre + hole} ${H / 2 - 6}v12`}
              stroke="#a18357"
              strokeWidth="2"
            />
          </>
        ) : shot.view === 'gap' ? (
          <>
            <rect
              x="20"
              y="45"
              width={Math.max(0, plugEdge - 20)}
              height={H - 80}
              rx="10"
              fill="#7d8f92"
            />
            <rect
              x={holeEdge}
              y="45"
              width={W - 20 - holeEdge}
              height={H - 80}
              rx="10"
              fill={`url(#${id}metal)`}
            />
            <path d={`M${gapCentre} 28V${H - 20}`} stroke="#8e8a7c" strokeDasharray="4 5" />
            <path d={`M${plugEdge} ${H / 2}H${holeEdge}`} stroke="#9d7849" strokeWidth="3" />
            {[plugEdge, holeEdge].map((x, i) => (
              <path key={i} d={`M${x} ${H / 2 - 8}v16`} stroke="#9d7849" strokeWidth="2" />
            ))}
            <path
              d={`M${holeEdge + 18} 58V${H - 48}M${plugEdge - 18} 58V${H - 48}`}
              stroke="#f0e9d8"
              strokeOpacity=".65"
              strokeWidth="2"
            />
          </>
        ) : (
          <>
            <rect
              x={rodStart - 19}
              y={H / 2 - 55}
              width="19"
              height="110"
              fill={`url(#${id}hatch)`}
            />
            <rect
              x={rodStart}
              y={H / 2 - 20}
              width={Math.max(0, physicalEnd - rodStart)}
              height="40"
              rx="4"
              fill={`url(#${id}metal)`}
              stroke="#a08b69"
            />
            <path
              d={`M${rodEnd} ${H / 2 - 50}V${H / 2 + 65}`}
              stroke="#888a80"
              strokeDasharray="4 5"
            />
            {s.locked && (
              <rect x={rodEnd} y={H / 2 - 55} width="19" height="110" fill={`url(#${id}hatch)`} />
            )}
            {s.locked ? (
              <g stroke="#a16f52" strokeWidth="3" fill="none">
                {[0, 1].map((k) => {
                  const side = k === 0 ? -1 : 1,
                    x = k === 0 ? rodStart + 10 : rodEnd - 10,
                    dir = s.stress < 0 ? -side : side;
                  return (
                    <path
                      key={k}
                      d={`M${x - (dir * 30 * Math.abs(s.stress)) / 175e6} ${H / 2}H${x}m${-dir * 7} -5L${x} ${H / 2}l${-dir * 7} 5`}
                    />
                  );
                })}
              </g>
            ) : (
              <path d={`M${rodEnd} ${H / 2 + 45}H${tip}`} stroke="#a16f52" strokeWidth="3" />
            )}
          </>
        )}
      </svg>
      <div className="expansion-legend">
        <span>
          {t(
            shot.view === 'plate'
              ? '尺寸变化 ×100'
              : shot.view === 'gap'
                ? '孔缘局部，固定微米标尺'
                : '杆长变化 ×100',
          )}
        </span>
        <span>ΔT {s.deltaT.toFixed(0)} K</span>
      </div>
      <div className="expansion-value">
        <b>
          {shot.view === 'rod'
            ? s.locked
              ? `${(s.stress / 1e6).toFixed(1)} MPa`
              : `${(s.freeChange * 1000).toFixed(2)} mm`
            : shot.view === 'gap'
              ? `${(s.clearance * 1e6).toFixed(1)} μm`
              : `${(s.holeRadius * 2000).toFixed(3)} mm`}
        </b>
        <span>
          {t(
            shot.view === 'rod'
              ? s.locked
                ? '轴向应力：负为压缩'
                : '自由长度增量'
              : shot.view === 'gap'
                ? '径向间隙'
                : '真实孔径',
          )}
        </span>
      </div>
      {shot.view === 'gap' && (
        <div className="expansion-gap-labels">
          <span>
            {t('塞子温升')} {s.plugDeltaT.toFixed(0)} K
          </span>
          <span>
            {t('板温升')} {s.deltaT.toFixed(0)} K
          </span>
        </div>
      )}
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('均匀温度、小应变与放大')}</summary>
          <p>
            {t(
              '各向同性、温度均匀、常数膨胀系数；孔板自由膨胀，塞子不受接触力。初始孔半径20mm、塞半径19.98mm。板与杆只把尺寸的变化放大100倍，读数使用真实尺寸。间隙镜头使用固定微米倍率。杆完全轴向约束时用线弹性估算应力，忽略屈曲、屈服与温度梯度，不是结构安全计算。材料点只用于跟踪，不表示原子变大。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="expansion-controls">
          <Range
            label={t('相对初温的温差')}
            value={deltaT}
            min={view === 'rod' ? -40 : 0}
            max={100}
            unit="K"
            onChange={setDeltaT}
          />
          <Range
            label={t('杆初长')}
            value={length}
            min={0.5}
            max={1}
            step={0.01}
            unit="m"
            onChange={setLength}
          />
          <div className="expansion-modes">
            {(['plate', 'gap', 'rod'] as const).map((v) => (
              <button
                type="button"
                key={v}
                aria-pressed={view === v}
                onClick={() => {
                  setView(v);
                  if (v !== 'rod' && deltaT < 0) setDeltaT(0);
                }}
              >
                {t(v === 'plate' ? '看孔板' : v === 'gap' ? '放大间隙' : '看金属杆')}
              </button>
            ))}
          </div>
          <button type="button" aria-pressed={material} onClick={() => setMaterial(!material)}>
            {t(material ? '改用铝参数' : '改用钢参数')}
          </button>
          {view === 'gap' && (
            <button type="button" aria-pressed={plugHot} onClick={() => setPlugHot(!plugHot)}>
              {t(plugHot ? '保持塞子初温' : '塞子与板同温')}
            </button>
          )}
          {view === 'rod' && (
            <button type="button" aria-pressed={locked} onClick={() => setLocked(!locked)}>
              {t(locked ? '释放杆的右端' : '固定杆的右端')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
