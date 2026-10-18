import { useId, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  axialSolenoidField,
  currentSpring,
  magneticForceShot,
  nailForce,
  parallelForcePerLength,
  suspendedWire,
  type MagneticForceExperiment,
} from '../../models/magnetic-force-lab';
import '../../styles/textbook-electromagnetism.css';
import '../../styles/teaching-lab-legibility.css';
const experiments = [
  { value: 'wire', label: '悬挂导体棒' },
  { value: 'solenoid', label: '螺线管与铁钉' },
  { value: 'parallel', label: '平行导线' },
  { value: 'spring', label: '通电弹簧' },
] as const;
const initial = (variant?: string): MagneticForceExperiment =>
  variant?.includes('solenoid')
    ? 'solenoid'
    : variant?.includes('parallel')
      ? 'parallel'
      : variant?.includes('spring')
        ? 'spring'
        : 'wire';
export default function MagneticForceLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [experiment, setExperiment] = useState<MagneticForceExperiment>(() =>
    initial(film.variant),
  );
  const [current, setCurrent] = useState(2),
    [field, setField] = useState(0.18),
    [second, setSecond] = useState(2),
    [time, setTime] = useState(2.4);
  const shot = film.watch
    ? magneticForceShot(film.chapter, film.chapterProgress)
    : { experiment, current, field, secondCurrent: second, time, progress: time / 8 };
  const wire = suspendedWire(shot.current, shot.field, shot.time),
    spring = currentSpring(shot.time, Math.abs(shot.current));
  const separation = 0.03,
    parallel = parallelForcePerLength(shot.current, shot.secondCurrent, separation);
  const attraction = nailForce(0.052, shot.current),
    fieldInCoil = axialSolenoidField(0, shot.current);
  const arrow = (x: number, y: number, dx: number, dy: number, color = '#ae8751') => (
    <path
      d={`M${x} ${y}l${dx} ${dy}`}
      stroke={color}
      strokeWidth="3"
      markerEnd={`url(#${id}-arrow)`}
    />
  );
  const fieldDots = (sign: number) =>
    Array.from({ length: 20 }, (_, i) => (
      <g
        key={i}
        transform={`translate(${82 + (i % 5) * 48} ${90 + Math.floor(i / 5) * 42})`}
        opacity=".38"
      >
        <circle r="5" stroke="#729b91" fill="none" />
        {sign >= 0 ? (
          <circle r="1.5" fill="#729b91" />
        ) : (
          <path d="M-3 -3l6 6m-6 0 6-6" stroke="#729b91" />
        )}
      </g>
    ));
  return (
    <div className="textbook-em magnetic-force-lab" data-watch={film.watch}>
      <div className="textbook-em-state">
        <span>{t(experiments.find((item) => item.value === shot.experiment)!.label)}</span>
        <span>
          {shot.experiment === 'spring'
            ? t(spring.closed ? '触点接通' : '触点断开')
            : `I = ${shot.current.toFixed(1)} A`}
        </span>
      </div>
      <svg
        className="textbook-em-apparatus"
        viewBox="0 0 360 300"
        role="img"
        aria-label={t('磁场、电流与受力由同一模型计算的实验装置')}
      >
        <defs>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="3"
            markerHeight="3"
            orient="auto"
          >
            <path d="M0 0L8 4L0 8Z" fill="context-stroke" />
          </marker>
          <linearGradient id={`${id}-copper`} x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#e8c78b" />
            <stop offset=".4" stopColor="#bb8e55" />
            <stop offset=".65" stopColor="#ead1a1" />
            <stop offset="1" stopColor="#a77d49" />
          </linearGradient>
          <linearGradient id={`${id}-iron`}>
            <stop stopColor="#bec9c5" />
            <stop offset=".5" stopColor="#83948f" />
            <stop offset="1" stopColor="#c8d3cb" />
          </linearGradient>
        </defs>
        {shot.experiment === 'wire' && (
          <>
            <rect x="59" y="66" width="242" height="194" rx="22" fill="#e4eee5" opacity=".65" />
            {shot.field !== 0 && fieldDots(shot.field)}
            <path
              d="M110 52V16H172M188 16H250V52M172 5V27M188 9V23"
              stroke="#748773"
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d="M70 47H290M80 47V275M280 47V275M62 277h36m164 0h36"
              stroke="#aab5a3"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={`M110 52Q105 125 116 ${192 - wire.displacement * 400}M250 52Q255 125 244 ${192 - wire.displacement * 400}`}
              stroke="#6b7c72"
              strokeWidth="2.5"
              fill="none"
            />
            <rect
              x="110"
              y={187 - wire.displacement * 400}
              width="140"
              height="12"
              rx="6"
              fill={`url(#${id}-copper)`}
              stroke="#a88754"
            />
            {Math.abs(shot.current) > 0.01 &&
              arrow(
                shot.current > 0 ? 146 : 210,
                177 - wire.displacement * 400,
                shot.current > 0 ? 54 : -54,
                0,
              )}
            {Math.abs(wire.force) > 0.001 &&
              arrow(180, 193 - wire.displacement * 400, 0, -Math.sign(wire.force) * 43, '#6e998e')}
            <text x="315" y="37" textAnchor="middle">
              {shot.field === 0 ? 'B = 0' : shot.field > 0 ? 'B ⊙' : 'B ⊗'}
            </text>
          </>
        )}
        {shot.experiment === 'solenoid' && (
          <>
            <path d="M40 248H295" stroke="#d4dbcc" strokeWidth="3" />
            <path
              d="M63 194V242H120M212 194V242H160"
              stroke="#7c8b7d"
              strokeWidth="3"
              fill="none"
            />
            <path d="M120 230v24m12-30v36m0-18h28" stroke="#738171" strokeWidth="3" />
            <rect x="63" y="107" width="149" height="89" rx="28" fill="#edf0e4" stroke="#c6d1bf" />
            <path
              d={Array.from({ length: 897 }, (_, i) => {
                const p = i / 896;
                return `${i ? 'L' : 'M'}${63 + 149 * p + 8 * Math.sin(28 * Math.PI * p)} ${151 + 43 * Math.cos(28 * Math.PI * p)}`;
              }).join(' ')}
              stroke={`url(#${id}-copper)`}
              strokeWidth="3"
              fill="none"
            />
            {shot.current !== 0 && (
              <>
                {arrow(shot.current > 0 ? 95 : 177, 151, shot.current > 0 ? 80 : -80, 0, '#729b91')}
                <text x="140" y="86" textAnchor="middle">
                  {(fieldInCoil * 1000).toFixed(2)} mT
                </text>
              </>
            )}
            <g
              transform={`translate(${Math.abs(attraction) > 0 ? -Math.min(28, shot.time * 15) : 0} 0)`}
            >
              <path d="M258 138v31l28-12v-7Z" fill={`url(#${id}-iron)`} stroke="#81958a" />
              <path d="M258 137h-7v33h7" stroke="#81958a" strokeWidth="3" fill="none" />
              {Math.abs(attraction) > 0 && arrow(274, 188, -30, 0, '#729b91')}
            </g>
            <path d="M234 196h65" stroke="#bcc5b5" strokeWidth="2" />
          </>
        )}
        {shot.experiment === 'parallel' && (
          <>
            <path
              d="M72 44H288M72 269H288"
              stroke="#bcc6b4"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {[
              { x: 120, i: shot.current, s: 1 },
              { x: 240, i: shot.secondCurrent, s: -1 },
            ].map(({ x, i, s }) => {
              const shift = Math.sign(parallel) * s * 12 * (1 - Math.exp(-shot.time * 2));
              return (
                <g key={x}>
                  <path
                    d={`M${x} 45Q${x + shift} 155 ${x} 268`}
                    fill="none"
                    stroke={`url(#${id}-copper)`}
                    strokeWidth="7"
                  />
                  {i !== 0 && arrow(x + shift + 17, i > 0 ? 185 : 118, 0, i > 0 ? -54 : 54)}
                  {parallel !== 0 &&
                    arrow(x + shift + s * 10, 152, s * Math.sign(parallel) * 35, 0, '#729b91')}
                </g>
              );
            })}
            <path d="M120 283H240" stroke="#a9b8a0" />
          </>
        )}
        {shot.experiment === 'spring' && (
          <>
            <path
              d="M80 44H254M80 44V270H284"
              stroke="#a9b5a0"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M183 44V63" stroke="#a17e50" strokeWidth="3" />
            <path
              d={Array.from({ length: 161 }, (_, i) => {
                const f = i / 160;
                return `${i ? 'L' : 'M'}${183 + 22 * Math.sin(f * Math.PI * 20)} ${63 + f * (152 - spring.displacement * 5000)}`;
              }).join(' ')}
              stroke={`url(#${id}-copper)`}
              strokeWidth="3"
              fill="none"
            />
            <path
              d={`M183 ${215 - spring.displacement * 5000}V${236 - spring.displacement * 5000}`}
              stroke="#8d754d"
              strokeWidth="3"
            />
            <path d="M148 240v18q35 10 70 0v-18" fill="#d7dfd5" stroke="#a4b6a7" strokeWidth="2" />
            <path d="M150 246q33 5 66 0" stroke="#8d9b92" strokeWidth="4" />
            <path
              d="M218 251h75V76H249M211 76h-28V44"
              stroke="#6e877b"
              strokeWidth="2"
              fill="none"
            />
            <path d="M227 62v28m10-22v16M211 76h16m10 0h12" stroke="#7c8c79" strokeWidth="3" />
            <circle
              cx="183"
              cy="239"
              r="12"
              fill={spring.closed ? '#d6b778' : 'none'}
              opacity=".28"
            />
          </>
        )}
      </svg>
      <p className="lab-apparatus-caption">
        {shot.experiment === 'wire'
          ? null
          : shot.experiment === 'solenoid'
            ? t('反转电流，铁钉仍被吸引')
            : shot.experiment === 'parallel'
              ? parallel === 0
                ? 'F = 0'
                : t(parallel > 0 ? '同向电流：相吸' : '反向电流：相斥')
              : t('历史接点装置 · 虚拟观察')}
      </p>
      <div className="textbook-em-readout">
        {shot.experiment === 'wire' ? (
          <>
            <span>{t('导体棒受力')}</span>
            <strong>{(wire.force * 1000).toFixed(1)} mN</strong>
          </>
        ) : shot.experiment === 'parallel' ? (
          <>
            <span>{t('单位长度相互作用力')}</span>
            <strong>{(Math.abs(parallel) * 1e6).toFixed(1)} µN/m</strong>
          </>
        ) : shot.experiment === 'spring' ? (
          <>
            <span>{t('线圈实际电流')}</span>
            <strong>{spring.current.toFixed(1)} A</strong>
          </>
        ) : (
          <>
            <span>{t('线圈中心磁场')}</span>
            <strong>{(fieldInCoil * 1000).toFixed(2)} mT</strong>
          </>
        )}
      </div>
      {!film.watch && (
        <div className="textbook-em-controls">
          <Segments
            label={t('选择磁力实验')}
            value={experiment}
            options={experiments.map((x) => ({ ...x, label: t(x.label) }))}
            onChange={setExperiment}
          />
          <Range
            label={t('导线电流')}
            value={current}
            min={-3}
            max={3}
            step={0.1}
            unit="A"
            onChange={setCurrent}
          />
          {experiment === 'wire' && (
            <Range
              label={t('外部磁场')}
              value={field}
              min={-0.25}
              max={0.25}
              step={0.01}
              unit="T"
              onChange={setField}
            />
          )}{' '}
          {experiment === 'parallel' && (
            <Range
              label={t('另一根导线电流')}
              value={second}
              min={-3}
              max={3}
              step={0.1}
              unit="A"
              onChange={setSecond}
            />
          )}
          <Range
            label={t('实验经过时间')}
            value={time}
            min={0}
            max={8}
            step={0.01}
            unit="s"
            onChange={setTime}
          />
        </div>
      )}
      <details className="textbook-em-note">
        <summary>{t('模型与观察尺度')}</summary>
        <p>
          {t(
            '导体棒使用小位移弹性支承；平行导线按长直导线计算，形变放大。螺线管铁钉采用线性诱导磁矩近似，位移只示意吸引方向。弹簧为带接触迟滞的集总模型，磁力系数是教学参数；历史水银接点不作为现实操作建议。',
          )}
        </p>
      </details>
    </div>
  );
}
