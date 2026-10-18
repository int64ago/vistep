import { useEffect, useId, useMemo, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ammoniumSmoke,
  smokeDirector,
  smokeInventory,
  clearSmokeCache,
  SMOKE_GRID,
} from '../../models/chem-ammonium-smoke';
import '../../styles/chem-ammonium-smoke.css';
export default function ChemAmmoniumSmoke() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a),
    id = useId().replace(/:/g, '');
  const [time, setTime] = useState(5),
    [gap, setGap] = useState(0.18),
    [both, setBoth] = useState(true),
    [zoom, setZoom] = useState(false);
  useEffect(() => () => clearSmokeCache(), []);
  const d = film.watch
    ? smokeDirector(film.chapter, film.chapterProgress)
    : { chapter: 0, time, gap, both, zoom };
  const at = Math.round(d.time * 50) / 50,
    s = useMemo(() => ammoniumSmoke(at, d.gap, d.both), [at, d.gap, d.both]),
    inv = smokeInventory(s),
    left = 32 + Math.round((0.5 - d.gap / 2) * 39) * 6.4,
    right = 32 + Math.round((0.5 + d.gap / 2) * 39) * 6.4,
    tip = 35 + 14 * 6.4;
  return (
    <section className="chem-ammonium-smoke">
      <div className="chem-smoke-heading">
        {d.zoom
          ? say('白烟中的固体微粒', 'Solid particles in the white cloud')
          : say('两根玻璃棒之间', 'Between the two glass rods')}
      </div>
      <svg
        className="chem-smoke-stage"
        viewBox="0 0 320 270"
        role="img"
        aria-label={say(
          '两种无色气体接触区形成白色氯化铵颗粒；颜色标记只用于追踪',
          'White ammonium chloride particles form where two colourless gases meet; coloured tracer marks are schematic',
        )}
      >
        <defs>
          <radialGradient id={`${id}-back`}>
            <stop stopColor="#70847b" />
            <stop offset="1" stopColor="#93a094" />
          </radialGradient>
          <linearGradient id={`${id}-rod`}>
            <stop stopColor="#cbd7d1" />
            <stop offset=".45" stopColor="#faf9f1" />
            <stop offset="1" stopColor="#a6bab0" />
          </linearGradient>
          <filter id={`${id}-blur`}>
            <feGaussianBlur stdDeviation="3.8" />
          </filter>
          <clipPath id={`${id}-clip`}>
            <rect x="12" y="10" width="296" height="247" rx="28" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          <rect x="12" y="10" width="296" height="247" rx="28" fill={`url(#${id}-back)`} />
          {!d.zoom && (
            <>
              <path
                d={`M47 26L${left} ${tip}`}
                stroke={`url(#${id}-rod)`}
                strokeWidth="9"
                strokeLinecap="round"
              />
              <path
                d={`M273 25L${right} ${tip}`}
                stroke={`url(#${id}-rod)`}
                strokeWidth="9"
                strokeLinecap="round"
              />
              <path
                d={`M47 26L${left - 1.5} ${tip - 2}`}
                stroke="#eef4ed"
                strokeWidth="1.2"
                opacity=".8"
              />
              <path
                d={`M273 25L${right - 1.5} ${tip - 2}`}
                stroke="#eef4ed"
                strokeWidth="1.2"
                opacity=".8"
              />
              <ellipse cx={left} cy={tip} rx="4.5" ry="6.2" fill="#e6eee6aa" />
              {d.both && <ellipse cx={right} cy={tip} rx="4.5" ry="6.2" fill="#e6eee6aa" />}
              <g filter={`url(#${id}-blur)`}>
                {Array.from(s.solid, (v, i) =>
                  v > 0.00005 ? (
                    <circle
                      key={i}
                      cx={32 + (i % SMOKE_GRID.width) * 6.4}
                      cy={35 + Math.floor(i / SMOKE_GRID.width) * 6.4}
                      r="5.6"
                      fill="#f7f8ef"
                      opacity={Math.min(0.86, 1 - Math.exp(-v * 18))}
                    />
                  ) : null,
                )}
              </g>
              {film.watch &&
                d.chapter === 0 &&
                Array.from(s.a, (v, i) =>
                  i % 7 === 0 && v > 0.001 ? (
                    <circle
                      key={i}
                      cx={32 + (i % 40) * 6.4}
                      cy={35 + Math.floor(i / 40) * 6.4}
                      r="1.8"
                      fill="none"
                      stroke="#dce8c8"
                      opacity=".65"
                    />
                  ) : null,
                )}
              <text x="72" y="228" fontSize="23" fill="#f0f3e8">
                NH₃
              </text>
              <text x="224" y="228" textAnchor="middle" fontSize="23" fill="#f0f3e8">
                {d.both ? 'HCl' : say('无HCl', 'No HCl')}
              </text>
            </>
          )}
          {d.zoom && (
            <>
              <circle
                cx="160"
                cy="126"
                r="89"
                fill="#c3cfc144"
                stroke="#e4eadb"
                strokeWidth="1.3"
              />
              {Array.from({ length: 13 }, (_, i) => {
                const x = 94 + ((i * 43) % 127),
                  y = 71 + ((i * 31) % 111),
                  r = 4 + (i % 4) * 2;
                return (
                  <g
                    key={i}
                    transform={`translate(${x} ${y}) rotate(${i * 29})`}
                    opacity={Math.min(1, inv.solid / 2)}
                  >
                    <path
                      d={`M${-r} 0L${-r * 0.5} ${-r * 0.8}L${r * 0.7} ${-r}L${r} ${r * 0.4}L0 ${r}Z`}
                      fill="#f0f3e7"
                      stroke="#d5ddca"
                    />
                    <path
                      d={`M${-r} 0L0 ${r * 0.1}L${r * 0.7} ${-r}M0 ${r * 0.1}V${r}`}
                      fill="none"
                      stroke="#b9c7b1"
                      strokeWidth=".8"
                    />
                  </g>
                );
              })}
              <text x="160" y="239" fontSize="24" textAnchor="middle" fill="#f2f4e9">
                NH₄Cl(s)
              </text>
            </>
          )}
        </g>
      </svg>
      {(d.zoom || !d.both || (film.watch && d.chapter === 0)) && (
        <div className="chem-smoke-note">
          {d.zoom
            ? say('放大示意 · 不表示真实粒径', 'Enlarged schematic · not actual particle size')
            : !d.both
              ? say('仅 NH₃ · 对照', 'NH₃ only · comparison')
              : say('空心点仅用于追踪无色气体', 'Hollow dots only trace the colourless gas')}
        </div>
      )}
      {d.zoom && <div className="chem-smoke-equation">NH₃(g) ＋ HCl(g) → NH₄Cl(s)</div>}
      {!film.watch && (
        <div className="chem-smoke-controls">
          <Range
            label={say('模型演化程度', 'Model progress')}
            value={time}
            min={0}
            max={12}
            step={0.05}
            onChange={setTime}
          />
          <Range
            label={say('两端相对距离', 'Relative tip separation')}
            value={gap}
            min={0.08}
            max={0.7}
            step={0.02}
            onChange={setGap}
          />
          <Segments
            label={say('气体条件', 'Gas conditions')}
            value={both ? 'both' : 'single'}
            onChange={(v) => setBoth(v === 'both')}
            options={[
              { value: 'both', label: 'NH₃ + HCl' },
              { value: 'single', label: say('仅NH₃', 'NH₃ only') },
            ]}
          />
          <Segments
            label={say('观察尺度', 'Observation scale')}
            value={zoom ? 'grain' : 'rods'}
            onChange={(v) => setZoom(v === 'grain')}
            options={[
              { value: 'rods', label: say('玻璃棒', 'Glass rods') },
              { value: 'grain', label: say('微粒示意', 'Particle schematic') },
            ]}
          />
          <details>
            <summary>{say('扩散与成粒的限定', 'Diffusion and particle limits')}</summary>
            <p>
              {say(
                '二维教学网格保存NH₃、HCl及产物的物质量，局部重叠决定反应；每格物质量不是浓度测量。时间、扩散系数和反应常数是无量纲教学量，未拟合气流、湿度、成核阈值或真实粒径。放大图只说明白烟含固体微粒，不是显微照片或晶体结构模型。',
                'A two-dimensional teaching grid conserves NH₃, HCl and product amounts; local overlap controls reaction. Cell amounts are not concentration measurements. Time, diffusion and reaction constants are dimensionless teaching parameters, with airflow, humidity, nucleation thresholds and real particle sizes omitted. The enlarged view conveys solid grains, not a micrograph or crystal-structure model.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
