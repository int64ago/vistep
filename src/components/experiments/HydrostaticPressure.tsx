import { useId, useState } from 'react';
import { t } from '../../i18n';
import { hydrostatic, hydrostaticShot, vesselWidth } from '../../models/hydrostatic-pressure';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/hydrostatic-pressure.css';
export default function HydrostaticPressure() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [height, setHeight] = useState(0.3),
    [fraction, setFraction] = useState(2 / 3),
    [density, setDensity] = useState(1000),
    [surface, setSurface] = useState(101.325),
    [area, setArea] = useState(1),
    [forces, setForces] = useState(false),
    [patch, setPatch] = useState(false);
  const shot = film.watch
      ? hydrostaticShot(film.chapter, film.chapterProgress)
      : {
          height,
          depth: height * fraction,
          density,
          surface: surface * 1000,
          sensorArea: area / 10000,
          forces,
          patch,
        },
    s = hydrostatic(shot),
    W = phone ? 340 : 760,
    H = phone ? 250 : 330,
    scale = phone ? 450 : 650,
    bottom = H - 20,
    centres = phone ? [55, 170, 280] : [150, 380, 610],
    y = (e: number) => bottom - e * scale,
    water = y(s.height),
    sensor = y(s.height - s.depth),
    half = (j: number, e: number) => (vesselWidth(j, e) * scale) / 2,
    names = [t('直壁'), t('上宽'), t('上窄')];
  return (
    <section className="hydro-study" data-forces={shot.forces && film.watch}>
      <header>
        {t(
          shot.patch
            ? '放大同一深度的膜片：压强与总力分开'
            : shot.forces
              ? '液体重量不同，底部压力仍可相同'
              : '同一种静止液体：同深、同压',
        )}
      </header>
      <svg
        className="hydro-vessels"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('连通的直壁、上宽和上窄容器，共同液位、等深探头与斜壁承重')}
      >
        <defs>
          <linearGradient id={`${id}fluid`} x2="0" y2="1">
            <stop stopColor="#94bab7" stopOpacity=".35" />
            <stop offset="1" stopColor="#6e9a9c" stopOpacity=".75" />
          </linearGradient>
        </defs>
        {shot.patch ? (
          <g>
            <rect
              x="20"
              y="20"
              width={W - 40}
              height={H - 35}
              rx="14"
              fill="#91b4ae"
              opacity=".23"
            />
            {(() => {
              const r = Math.sqrt(s.sensorArea / Math.PI) * (phone ? 5000 : 7000),
                cx = phone ? 95 : 240,
                edge = phone ? 245 : 530,
                cy = H / 2,
                n = s.gauge * (phone ? 0.01 : 0.015);
              return (
                <>
                  <circle cx={cx} cy={cy} r={r} fill="#dac598" stroke="#a78a5d" strokeWidth="2" />
                  <path
                    d={`M${cx + r + 8} ${cy - r}H${edge - 12}M${cx + r + 8} ${cy + r}H${edge - 12}`}
                    stroke="#8aa09a"
                    strokeDasharray="3 4"
                    fill="none"
                  />
                  <path d={`M${edge} ${cy - r}V${cy + r}`} stroke="#a78a5d" strokeWidth="5" />
                  {n > 0.2 &&
                    [-0.6, 0, 0.6].map((q, i) => (
                      <path
                        key={i}
                        d={`M${edge + n + 7} ${cy + q * r}h${-n}m5-4l-5 4l5 4`}
                        fill="none"
                        stroke="#587f81"
                        strokeWidth="2"
                      />
                    ))}
                </>
              );
            })()}
          </g>
        ) : (
          <>
            {[0, 1].map((j) => {
              const z = 0.025,
                d = 0.005,
                xa = centres[j] + half(j, z + d),
                xb = centres[j + 1] - half(j + 1, z + d),
                xc = centres[j + 1] - half(j + 1, z - d),
                xd = centres[j] + half(j, z - d);
              return (
                <g key={j}>
                  <path d={`M${xa} ${y(z + d)}H${xb}L${xc} ${y(z - d)}H${xd}Z`} fill="#86aaa7" />
                  <path
                    d={`M${xa} ${y(z + d)}H${xb}M${xd} ${y(z - d)}H${xc}`}
                    stroke="#819996"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
            {centres.map((cx, j) => {
              const b = half(j, 0),
                h = half(j, 0.36),
                f = half(j, s.height),
                q = s.vessels[j];
              return (
                <g key={j}>
                  <path
                    d={`M${cx - b} ${bottom}H${cx + b}L${cx + f} ${water}H${cx - f}Z`}
                    fill={`url(#${id}fluid)`}
                  />
                  {[-1, 1].map((sign) => {
                    const side = (e: number) => cx + sign * half(j, e),
                      connected = !((j === 0 && sign < 0) || (j === 2 && sign > 0));
                    return (
                      <path
                        key={sign}
                        d={
                          connected
                            ? `M${side(0.36)} ${y(0.36)}L${side(0.03)} ${y(0.03)}M${side(0.02)} ${y(0.02)}L${side(0)} ${bottom}`
                            : `M${side(0.36)} ${y(0.36)}L${side(0)} ${bottom}`
                        }
                        stroke="#7c9290"
                        strokeWidth="2.5"
                        fill="none"
                      />
                    );
                  })}
                  <path
                    d={`M${cx - b} ${bottom}H${cx + b}M${cx - f} ${water}H${cx + f}`}
                    stroke="#7c9290"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle
                    cx={cx}
                    cy={sensor}
                    r={shot.patch && j === 0 ? Math.sqrt(s.sensorArea / Math.PI) * scale : 4}
                    fill="#e7d4a6"
                    stroke="#997b4f"
                    strokeWidth="1.5"
                  />
                  {shot.patch && j === 0 && (
                    <path
                      d={`M${cx + Math.sqrt(s.sensorArea / Math.PI) * scale + 18} ${sensor}h-14m5 -4l-5 4l5 4`}
                      stroke="#997b4f"
                      fill="none"
                      strokeWidth="2"
                    />
                  )}
                  {shot.forces && (
                    <>
                      <path
                        d={`M${cx} ${bottom - 2}v${-q.bottomForce * (phone ? 1.7 : 2.5)}m-4 6l4-6l4 6`}
                        stroke="#94754d"
                        strokeWidth="2.5"
                        fill="none"
                      />
                      {Math.abs(q.wallUp) > 0.01 &&
                        [-1, 1].map((sign) => {
                          const e = s.height / 2,
                            x = cx + sign * half(j, e),
                            len = (Math.abs(q.wallUp) / 2) * (phone ? 2.5 : 3.5),
                            up = q.wallUp > 0;
                          return (
                            <path
                              key={sign}
                              d={`M${x} ${y(e)}v${up ? -len : len}m-4 ${up ? 6 : -6}l4 ${up ? -6 : 6}l4 ${up ? 6 : -6}`}
                              stroke="#567d7e"
                              strokeWidth="2.5"
                              fill="none"
                            />
                          );
                        })}
                    </>
                  )}
                </g>
              );
            })}
            <path
              d={`M25 ${sensor}H${W - 25}`}
              stroke="#aa8d5d"
              strokeDasharray="4 5"
              opacity=".55"
            />
          </>
        )}
      </svg>
      <div className="hydro-names">
        {shot.patch ? (
          <>
            <span>{t('膜片正面')}</span>
            <span>{t('膜片侧面')}</span>
          </>
        ) : (
          names.map((n, j) => (
            <span key={j}>
              {n}
              {shot.forces && (
                <>
                  <b>{s.vessels[j].weight.toFixed(1)} N</b>
                  <small>{t('液重')}</small>
                </>
              )}
            </span>
          ))
        )}
      </div>
      <div className="hydro-pressure">
        <b>{(s.gauge / 1000).toFixed(2)} kPa</b>
        <span>
          {t('同深表压')} · h {(s.depth * 100).toFixed(1)} cm
          <br />
          {t('绝对压强')} {(s.absolute / 1000).toFixed(2)} kPa
        </span>
      </div>
      {shot.patch && (
        <div className="hydro-patch">
          <span>A {(s.sensorArea * 10000).toFixed(1)} cm²</span>
          <span>
            {t('相对液面气压的膜片力')} {s.sensorForce.toFixed(3)} N
          </span>
        </div>
      )}
      {shot.forces && !shot.patch && (
        <p className="hydro-force-note">
          {t('每个底面合力')} {s.vessels[0].bottomForce.toFixed(1)} N ·{' '}
          {t('斜壁分担或增加竖直载荷')}
        </p>
      )}
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('连通条件、容器壁与表压')}</summary>
          <p>
            {t(
              '液体均匀、不可压缩、静止，重力恒定，三个自由液面承受相同气压。容器剖面沿厚度0.08m挤出，底宽0.08m；宽度随高度线性变化。连通管只用于建立共同压力，不计入各容器重量账本。底力与壁面竖直力按相对共同液面气压的压力计算。膜片力也相对该参考气压。忽略表面张力、毛细差与管中流动，不模拟到达平衡的过程。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="hydro-controls">
          <Range
            label={t('共同液位高度')}
            value={height}
            min={0.15}
            max={0.33}
            step={0.01}
            unit="m"
            onChange={setHeight}
          />
          <Range
            label={t('探头深度比例')}
            value={fraction}
            min={0}
            max={1}
            step={0.01}
            onChange={setFraction}
          />
          <Range
            label={t('液体密度')}
            value={density}
            min={800}
            max={1200}
            step={10}
            unit="kg/m³"
            onChange={setDensity}
          />
          <Range
            label={t('共同液面气压')}
            value={surface}
            min={80}
            max={160}
            step={0.1}
            unit="kPa"
            onChange={setSurface}
          />
          <Range
            label={t('膜片面积')}
            value={area}
            min={1}
            max={4}
            step={0.1}
            unit="cm²"
            onChange={setArea}
          />
          <button type="button" aria-pressed={patch} onClick={() => setPatch(!patch)}>
            {t(patch ? '看连通容器' : '看膜片局部')}
          </button>
          <button type="button" aria-pressed={forces} onClick={() => setForces(!forces)}>
            {t(forces ? '隐藏壁面承重' : '看壁面承重')}
          </button>
        </div>
      )}
    </section>
  );
}
