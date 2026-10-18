import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  ELEMENTARY_CHARGE,
  ELECTRON_MASS,
  acceleratedSpeed,
  magneticTrajectory,
  isotopeRadius,
  particleShot,
  positronTrack,
  type ParticleExperiment,
} from '../../models/charged-particle-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
import '../../styles/charged-particle-lab.css';
const options = [
  { value: 'beam', label: '阴极射线束' },
  { value: 'orbit', label: '电子轨迹' },
  { value: 'mass', label: '质谱仪' },
  { value: 'positron', label: '正电子径迹' },
] as const;
const initial = (variant?: string): ParticleExperiment =>
  variant?.includes('positron')
    ? 'positron'
    : variant?.includes('mass-spectrometer')
      ? 'mass'
      : variant?.includes('electron-orbit')
        ? 'orbit'
        : 'beam';
export default function ChargedParticleLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [experiment, setExperiment] = useState<ParticleExperiment>(() => initial(film.variant)),
    [voltage, setVoltage] = useState(200),
    [field, setField] = useState(1.2),
    [angle, setAngle] = useState(90),
    [phase, setPhase] = useState(0.8),
    [charge, setCharge] = useState('positive');
  const s = film.watch
    ? particleShot(film.chapter, film.chapterProgress)
    : {
        experiment,
        voltage,
        field: field / 1000,
        angle: (angle * Math.PI) / 180,
        phase,
        progress: phase / 1.9,
        positive: charge === 'positive',
      };
  const speed = acceleratedSpeed(s.voltage),
    period =
      (2 * Math.PI * ELECTRON_MASS) / (ELEMENTARY_CHARGE * Math.max(Math.abs(s.field), 0.0008)),
    helix = s.experiment === 'orbit' && Math.abs(s.angle - Math.PI / 2) > 0.05;
  const duration =
      s.experiment === 'beam'
        ? 6e-9 * (film.watch ? 1 : Math.min(1, s.phase / 1.5))
        : period * Math.min(1.5, s.phase),
    totalDuration = s.experiment === 'beam' ? 6e-9 : period * 1.5;
  const point = (time: number) =>
    magneticTrajectory({
      speed,
      field: s.field,
      angle: s.experiment === 'beam' ? Math.PI / 2 : s.angle,
      time,
    });
  const reference = point(totalDuration),
    r = point(1e-9).radius;
  const project = (p: ReturnType<typeof point>) =>
    s.experiment === 'beam'
      ? { x: 75 + p.x * 2850, y: 150 - p.y * 2850 }
      : helix
        ? {
            x: 75 + (reference.z ? (180 * p.z) / reference.z : 0) + (p.x / Math.max(r, 1e-9)) * 26,
            y: 183 - (p.y / Math.max(r, 1e-9)) * 38,
          }
        : { x: 170 + p.x * 1100, y: 225 - p.y * 1100 };
  const completeTrace = Array.from({ length: 181 }, (_, i) => project(point((duration * i) / 180)));
  const firstWall =
    s.experiment === 'orbit' && !helix
      ? completeTrace.findIndex((p) => ((p.x - 180) / 145) ** 2 + ((p.y - 152) / 123) ** 2 > 1)
      : -1;
  const trace = firstWall > 0 ? completeTrace.slice(0, firstWall) : completeTrace;
  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const isotopes = [20, 22].map((m) => ({ m, ...isotopeRadius(m, 1000, 0.25) }));
  const positron = Array.from({ length: 181 }, (_, i) => {
    const a = -1 + (2.5 * i) / 180,
      p = positronTrack(a, 6, 3, 1.5, s.positive ? 1 : -1);
    return { x: 180 + p.x * 8200, y: 150 - p.y * 8200 };
  });
  const live = trace.at(-1)!;
  return (
    <div
      className="textbook-em charged-particle-lab"
      data-watch={film.watch}
      data-experiment={s.experiment}
    >
      <div className="textbook-em-state">
        <span>{t(options.find((x) => x.value === s.experiment)!.label)}</span>
        {(!film.watch || s.experiment !== 'positron') && (
          <span>
            {s.experiment === 'mass'
              ? '20Ne / 22Ne'
              : s.experiment === 'positron'
                ? t('铅板前后，曲率不同')
                : `U = ${s.voltage.toFixed(0)} V`}
          </span>
        )}
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 300"
        role="img"
        aria-label={t('由洛伦兹运动方程计算的电子束、同位素或正电子轨迹')}
      >
        <defs>
          <radialGradient id={`${id}-glass`}>
            <stop stopColor="#f8fbef" />
            <stop offset=".8" stopColor="#e2ece1" stopOpacity=".45" />
            <stop offset="1" stopColor="#b5cbbc" stopOpacity=".7" />
          </radialGradient>
          <filter id={`${id}-glow`}>
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <clipPath id={`${id}-tube`}>
            <path d="M31 126H75C100 35 284 30 318 82V218C284 270 100 265 75 174H31Z" />
          </clipPath>
        </defs>
        {(s.experiment === 'beam' || s.experiment === 'orbit') && (
          <>
            {s.experiment === 'beam' ? (
              <>
                <path
                  d="M31 126H75C100 35 284 30 318 82V218C284 270 100 265 75 174H31Z"
                  fill={`url(#${id}-glass)`}
                  stroke="#a7bdae"
                  strokeWidth="2"
                />
                <path d="M39 136v28M55 132v36M69 135v30" stroke="#91a096" strokeWidth="3" />
                <path d="M22 142h17M22 158h17" stroke="#b19567" strokeWidth="3" />
              </>
            ) : (
              <>
                <ellipse
                  cx="180"
                  cy="152"
                  rx="149"
                  ry="127"
                  fill={`url(#${id}-glass)`}
                  stroke="#aec3b0"
                  strokeWidth="2"
                />
                <path
                  d="M65 63Q180 2 295 63M65 239Q180 300 295 239"
                  fill="none"
                  stroke="#c3a170"
                  strokeWidth="6"
                  opacity=".55"
                />
                <path d="M142 277h76M160 269v8m40-8v8" stroke="#a5b39b" strokeWidth="5" />
              </>
            )}
            {!helix &&
              s.field !== 0 &&
              Array.from({ length: 15 }, (_, i) => (
                <g
                  key={i}
                  transform={`translate(${110 + (i % 5) * 40} ${85 + Math.floor(i / 5) * 65})`}
                  opacity=".3"
                >
                  <circle r="4" stroke="#729b85" fill="none" />
                  {s.field > 0 ? (
                    <circle r="1.2" fill="#729b85" />
                  ) : (
                    <path d="M-2.5 -2.5l5 5m-5 0 5-5" stroke="#729b85" />
                  )}
                </g>
              ))}
            {helix && (
              <path
                d="M65 145H290l-9-5m9 5-9 5"
                stroke="#819f81"
                strokeDasharray="4 5"
                fill="none"
              />
            )}
            <g clipPath={s.experiment === 'beam' ? `url(#${id}-tube)` : undefined}>
              <path
                d={path(trace)}
                stroke="#86c4a3"
                strokeWidth="8"
                opacity=".3"
                fill="none"
                filter={`url(#${id}-glow)`}
              />
              <path d={path(trace)} stroke="#5f9e7d" strokeWidth="2.5" fill="none" />
              <circle cx={live.x} cy={live.y} r="4" fill="#c2a16c" />
            </g>
          </>
        )}
        {s.experiment === 'mass' && (
          <>
            <rect x="64" y="30" width="256" height="245" rx="18" fill="#e5ecdf" stroke="#c3cfb9" />
            <path d="M31 70H90" stroke="#9aaf98" strokeWidth="3" />
            <rect x="17" y="54" width="30" height="32" rx="7" fill="#c6d1bd" stroke="#90a388" />
            <path d="M55 51v38M68 51v38" stroke="#b29a68" strokeWidth="3" />
            <rect x="83" y="176" width="10" height="92" rx="3" fill="#94a594" />
            {isotopes.map(({ m, radius }, j) => {
              const theta = Math.PI * Math.min(1, s.progress * 1.25),
                scale = 950,
                pts = Array.from({ length: 141 }, (_, i) => {
                  const a = (theta * i) / 140;
                  return {
                    x: 90 + radius * Math.sin(a) * scale,
                    y: 70 + radius * (1 - Math.cos(a)) * scale,
                  };
                }),
                last = pts.at(-1)!;
              return (
                <g key={m}>
                  <path
                    d={path(pts)}
                    stroke={j ? '#ab8b56' : '#608f7c'}
                    strokeWidth="2.8"
                    fill="none"
                  />
                  <circle cx={last.x} cy={last.y} r="4" fill={j ? '#ab8b56' : '#608f7c'} />
                  <path
                    d={`M93 ${70 + 2 * radius * scale}H122`}
                    stroke={j ? '#ab8b56' : '#608f7c'}
                    strokeDasharray="2 3"
                  />
                  <text x={j ? 135 : 46} y={78 + 2 * radius * scale} textAnchor="middle">
                    {m}
                  </text>
                </g>
              );
            })}
            <text x="198" y="57" textAnchor="middle">
              B = 0.25 T
            </text>
          </>
        )}
        {s.experiment === 'positron' && (
          <>
            <circle cx="180" cy="150" r="132" fill="#e7ebe0" stroke="#bccbb8" strokeWidth="2" />
            {Array.from({ length: 23 }, (_, i) => (
              <circle
                key={i}
                cx={75 + ((i * 67) % 215)}
                cy={55 + ((i * 41) % 190)}
                r="1.1"
                fill="#a9b7a0"
                opacity=".4"
              />
            ))}
            <path
              d={path(
                positron.slice(0, Math.max(2, Math.round(181 * Math.min(1, 0.3 + s.progress)))),
              )}
              stroke="#5f8270"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <rect x="51" y="145" width="258" height="10" rx="2" fill="#9ca8a1" />
            <path d="M52 148H308" stroke="#d9dfd2" />
            <path d="M180 157v-14" stroke="#5f8270" strokeWidth="2" strokeDasharray="2 2" />
            <text x="75" y="134">
              Pb
            </text>
            <path d="M161 189v-27l-5 7m5-7 5 7" stroke="#b2925a" strokeWidth="2" fill="none" />
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {s.experiment === 'mass'
          ? t('同电压加速 · 相同电荷')
          : s.experiment === 'positron'
            ? t(s.positive ? '向上运动 + 正电荷' : '反事实：同方向的负电荷')
            : t(
                helix
                  ? '斜向入射：绕轴前进'
                  : s.field === 0
                    ? '无磁场：保持直线'
                    : '磁力转向，不改变速率',
              )}
      </p>
      <div className="textbook-em-readout">
        <span>
          {t(
            s.experiment === 'mass'
              ? '两条径迹半径'
              : s.experiment === 'positron'
                ? '穿板后动量下降'
                : '磁场与轨迹半径',
          )}
        </span>
        <strong>
          {s.experiment === 'mass'
            ? `${(isotopes[0].radius * 1000).toFixed(1)} / ${(isotopes[1].radius * 1000).toFixed(1)} mm`
            : s.experiment === 'positron'
              ? 'r₂ < r₁'
              : `${(s.field * 1000).toFixed(1)} mT · ${Number.isFinite(r) ? (r * 1000).toFixed(1) + ' mm' : '∞'}`}
        </strong>
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择粒子实验')}
            value={experiment}
            options={options.map((x) => ({ ...x, label: t(x.label) }))}
            onChange={setExperiment}
          />
          {['beam', 'orbit'].includes(experiment) && (
            <>
              <Range
                label={t('电子加速电压')}
                value={voltage}
                min={50}
                max={350}
                step={5}
                unit="V"
                onChange={setVoltage}
              />
              <Range
                label={t('磁场强度与方向')}
                value={field}
                min={-1.8}
                max={1.8}
                step={0.1}
                unit="mT"
                onChange={setField}
              />
              {experiment === 'orbit' && (
                <Range
                  label={t('速度与磁场夹角')}
                  value={angle}
                  min={35}
                  max={90}
                  step={1}
                  unit="°"
                  onChange={setAngle}
                />
              )}
            </>
          )}
          {experiment === 'positron' && (
            <Segments
              label={t('电荷假设')}
              value={charge}
              options={[
                { value: 'positive', label: t('正电荷') },
                { value: 'negative', label: t('负电荷') },
              ]}
              onChange={setCharge}
            />
          )}
          <Range
            label={t('观察轨迹进度')}
            value={phase}
            min={0}
            max={1.5}
            step={0.01}
            onChange={setPhase}
          />
        </div>
      )}
      {!film.watch && (
        <details className="textbook-em-note">
          <summary>{t('轨迹、时间与历史证据')}</summary>
          <p>
            {t(
              '电子束按低速洛伦兹方程计算，显示慢放；螺旋视图的轴向与横向分别缩放。质谱示例是同电压加速的单电荷氖离子。正电子采用相对论动量，6与3MeV只是教学对照，不是历史照片拟合；铅板能量损失预设，未模拟散射。确认正电子还需结合电离与穿透证据，不能只凭曲率断言粒子种类。',
            )}
          </p>
        </details>
      )}
    </div>
  );
}
