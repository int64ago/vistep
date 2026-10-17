import { useId, useState } from 'react';
import { t } from '../../i18n';
import { helmholtzState, helmholtzShot } from '../../models/helmholtz-resonator';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/helmholtz-resonator.css';
export default function HelmholtzResonator() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [volume, setVolume] = useState(1),
    [radius, setRadius] = useState(10),
    [length, setLength] = useState(30),
    [end, setEnd] = useState(true),
    [phase, setPhase] = useState(0);
  const shot = film.watch
      ? helmholtzShot(film.chapter, film.chapterProgress, film.chapterTime)
      : {
          volume: volume / 1000,
          radius: radius / 1000,
          length: length / 1000,
          endFactor: end ? 1.6 : 0,
          phase: phase * 2 * Math.PI,
        },
    s = helmholtzState(shot.phase, shot),
    W = phone ? 340 : 760,
    H = 310,
    scale = 1000,
    centre = phone ? 110 : 275,
    bottom = 280,
    bodyR = 0.055,
    bodyArea = Math.PI * bodyR ** 2,
    bodyHeight = 0.0015 / bodyArea,
    top = bottom - bodyHeight * scale,
    water = top + (s.V / bodyArea) * scale,
    neckTop = top - s.L * scale,
    half = s.r * scale,
    outward = ((0.6 * s.r * s.e) / 1.6) * scale,
    inward = ((s.r * s.e) / 1.6) * scale,
    plugTop = neckTop - outward - s.displacement * scale * 80,
    plugHeight = s.effectiveLength * scale,
    pressurePeak = (s.stiffness * 0.00015) / s.area,
    energy = s.energy || 1,
    chartX = phone ? 228 : 505,
    chartW = phone ? 80 : 120;
  return (
    <section className="helm-study" data-watch={film.watch}>
      <header>{t('颈部空气有惯性，腔内空气能压缩')}</header>
      <svg
        className="helm-vessel"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('刚性透明腔体、改变空气体积的水面、颈部往复空气与同一时刻的压力和能量')}
      >
        <defs>
          <linearGradient id={`${id}glass`}>
            <stop stopColor="#9cae9d" stopOpacity=".35" />
            <stop offset=".4" stopColor="#e2e4c7" stopOpacity=".08" />
            <stop offset="1" stopColor="#c8d1b8" stopOpacity=".4" />
          </linearGradient>
        </defs>
        <rect
          x={centre - 55}
          y={top}
          width="110"
          height={bodyHeight * scale}
          rx="10"
          fill="#192f39"
        />
        <rect
          x={centre - 53}
          y={top + 2}
          width="106"
          height={Math.max(0, water - top - 2)}
          fill={s.pressure >= 0 ? '#e4ac6d' : '#8fbfc9'}
          opacity={0.08 + 0.45 * Math.abs(s.pressure / pressurePeak)}
        />
        <path
          d={`M${centre - 53} ${water}H${centre + 53}V${bottom - 9}Q${centre + 53} ${bottom} ${centre + 43} ${bottom}H${centre - 43}Q${centre - 53} ${bottom} ${centre - 53} ${bottom - 9}Z`}
          fill="#7da7a8"
          opacity=".65"
        />
        <path d={`M${centre - 53} ${water}H${centre + 53}`} stroke="#b3d2cb" strokeWidth="2" />
        <rect
          x={centre - 55}
          y={top}
          width="110"
          height={bodyHeight * scale}
          rx="10"
          fill={`url(#${id}glass)`}
          stroke="#9fb5a5"
          strokeWidth="2"
        />
        <path
          d={`M${centre - 55} ${top + 1}H${centre - half}V${neckTop}M${centre + 55} ${top + 1}H${centre + half}V${neckTop}`}
          fill="none"
          stroke="#c5d0b6"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <rect
          x={centre - half - 2}
          y={neckTop - outward}
          width={2 * half + 4}
          height={s.effectiveLength * scale}
          rx="5"
          fill="#e0c591"
          opacity=".13"
          stroke="#e0c591"
          strokeDasharray="3 3"
        />
        <rect
          x={centre - half + 2}
          y={plugTop}
          width={Math.max(2, 2 * half - 4)}
          height={plugHeight}
          rx="5"
          fill="#e0c591"
          opacity=".4"
        />
        {Array.from({ length: 7 }, (_, j) =>
          [-0.45, 0, 0.45].map((q, k) => (
            <circle
              key={`${j}-${k}`}
              cx={centre + q * half}
              cy={plugTop + ((j + 0.5) * plugHeight) / 7}
              r="1.9"
              fill="#eedab0"
            />
          )),
        )}
        <path
          d={`M${centre + half + 18} ${neckTop - outward}h8M${centre + half + 22} ${neckTop - outward}V${top + inward}M${centre + half + 18} ${top + inward}h8`}
          fill="none"
          stroke="#e2c58f"
          strokeWidth="1.5"
        />
        <path
          d={`M${centre + 62} ${top + (water - top) / 2}H${chartX - 10}`}
          stroke="#809ca1"
          strokeDasharray="3 4"
        />
        <rect x={chartX} y="87" width={chartW} height="124" rx="12" fill="#132831" />
        <path d={`M${chartX + 12} 149H${chartX + chartW - 12}`} stroke="#8fa8a3" />
        <rect
          x={chartX + chartW / 2 - 13}
          y={s.pressure >= 0 ? 149 - (50 * s.pressure) / pressurePeak : 149}
          width="26"
          height={50 * Math.abs(s.pressure / pressurePeak)}
          rx="4"
          fill={s.pressure >= 0 ? '#e4ac6d' : '#8fbfc9'}
        />
      </svg>
      <div className="helm-legend">
        <span>
          <i />
          {t('颈部位移 ×80')}
        </span>
        <span>
          {t('腔内压力')} {s.pressure.toFixed(1)} Pa
        </span>
      </div>
      <div className="helm-readout">
        <b>{s.frequency.toFixed(1)} Hz</b>
        <span>
          {t('空气体积')} {(s.V * 1000).toFixed(2)} L<br />
          {t('有效颈长')} {(s.effectiveLength * 1000).toFixed(1)} mm
        </span>
      </div>
      <div className="helm-energy" aria-label={t('同一振动中的动能与压缩能量')}>
        <div>
          <i style={{ width: `${(100 * s.kinetic) / energy}%` }} />
          <i style={{ width: `${(100 * s.compression) / energy}%` }} />
        </div>
        <span>{t('颈部动能')}</span>
        <span>{t('腔体压缩能')}</span>
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('集中参数近似与端修正')}</summary>
          <p>
            {t(
              '腔体刚性，水面只用于改变静止空气体积，不模拟水或瓶壁的振动。腔内压力近似均匀，空气绝热小振幅压缩，忽略损耗与吹气激励。颈外端加0.6倍半径、内端加1倍半径只是近似；金色虚框表示参与惯性的有效空气柱，不是实体活塞。位移放大80倍，相位慢放。',
            )}
          </p>
          <p>
            λ {s.wavelength.toFixed(2)} m · {t('腔体高度')} {(bodyHeight * 100).toFixed(1)} cm
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="helm-controls">
          <Range
            label={t('空气体积')}
            value={volume}
            min={0.5}
            max={1.5}
            step={0.01}
            unit="L"
            onChange={setVolume}
          />
          <Range
            label={t('颈部半径')}
            value={radius}
            min={8}
            max={15}
            step={0.5}
            unit="mm"
            onChange={setRadius}
          />
          <Range
            label={t('几何颈长')}
            value={length}
            min={20}
            max={80}
            unit="mm"
            onChange={setLength}
          />
          <Range
            label={t('周期相位')}
            value={phase}
            min={0}
            max={1}
            step={0.01}
            onChange={setPhase}
          />
          <button type="button" aria-pressed={end} onClick={() => setEnd(!end)}>
            {t(end ? '仅用几何颈长' : '加入颈端修正')}
          </button>
        </div>
      )}
    </section>
  );
}
