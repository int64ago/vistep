import { useEffect, useId, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import ElectricGeneratorStudio from '../three/ElectricGeneratorStudio';
import {
  GENERATOR as G,
  GENERATOR_AREA,
  generatorDefaults,
  generatorShot,
  generatorState,
  generatorWork,
  generatorRotorLeads,
  rotateGeneratorPoint,
  type GeneratorShot,
} from '../../models/electric-generator';
import '../../styles/electric-generator.css';

const fmt = (value: number, digits = 2) =>
  (Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value).toFixed(digits);
function SlipRingDetail({ shot }: { shot: GeneratorShot }) {
  return (
    <div className="generator-contact-detail">
      <div className="generator-instrument-heading">
        <span>{t('沿轴看两只滑环')}</span>
        <span>{t('铜线接点在转；电刷不转')}</span>
      </div>
      <svg
        viewBox="0 0 320 145"
        role="img"
        aria-label={t('两个滑环分别保持 A 与 B 接通，没有每半圈交换端子')}
      >
        {[0, 1].map((i) => {
          const cx = 69 + i * 159,
            cy = 68,
            scale = 108,
            outer = (G.ringRadius + G.ringTube) * scale;
          const p = rotateGeneratorPoint(generatorRotorLeads()[i].at(-1)!, shot.state.theta);
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="13" fill="#70828a" />
              <circle
                cx={cx}
                cy={cy}
                r={G.ringRadius * scale}
                fill="none"
                stroke="#b49c6e"
                strokeWidth={2 * G.ringTube * scale}
              />
              <path
                d={`M${cx + p[0] * scale * 0.48} ${cy - p[1] * scale * 0.48}L${cx + p[0] * scale} ${cy - p[1] * scale}`}
                stroke={i ? '#ba7a3f' : '#267b91'}
                strokeWidth="3"
              />
              <circle
                cx={cx + p[0] * scale}
                cy={cy - p[1] * scale}
                r="4"
                fill={i ? '#ba7a3f' : '#267b91'}
              />
              <rect x={cx + outer} y={cy - 7} width="24" height="14" rx="2" fill="#47585b" />
              <path
                d={`M${cx + outer + 24} ${cy}h10v39h-32`}
                fill="none"
                stroke={i ? '#ba7a3f' : '#267b91'}
                strokeWidth="2.3"
              />
              <text x={cx} y="132" textAnchor="middle" fontSize="19" fill="#304a56">
                {i ? 'B' : 'A'}
              </text>
            </g>
          );
        })}
      </svg>
      <p>{t('完整滑环保持原来的接线，所以输出仍会正负交替。')}</p>
    </div>
  );
}

function GeneratorInstrument({ shot }: { shot: GeneratorShot }) {
  const s = shot.state,
    angle = (((s.theta / (Math.PI * 2)) % 1) + 1) % 1,
    selected = shot.showWork ? shot.progress : angle;
  const voltsLimit = 1.4,
    maxWork = generatorWork({ ...s.input, rpm: G.rpm }, 0, 2 * Math.PI).shaft || 1;
  const samples = Array.from({ length: 201 }, (_, i) => {
    const phase = (i / 200) * 2 * Math.PI;
    return shot.showWork
      ? generatorWork({ ...s.input, rpm: G.rpm }, 0, phase)
      : generatorState({ ...s.input, angle: phase });
  });
  const path = (values: number[], limit: number, energy = false) =>
    values
      .map(
        (value, i) =>
          `${i ? 'L' : 'M'}${12 + (i / 200) * 576},${energy ? 118 - (value / limit) * 96 : 72 - (value / limit) * 48}`,
      )
      .join(' ');
  const voltage = samples.map((v) => ('voltage' in v ? v.voltage : 0));
  const reference = Array.from(
    { length: 201 },
    (_, i) => generatorState({ ...s.input, angle: (i / 200) * 2 * Math.PI, rpm: G.rpm }).voltage,
  );
  return (
    <div className="generator-instrument">
      <div className="generator-instrument-heading">
        <span>{t(shot.showWork ? '一圈里的能量去向' : '一圈留下的电压')}</span>
        <strong>
          {shot.showWork ? `${fmt(shot.work.shaft * 1000, 2)} mJ` : `${fmt(s.voltage, 3)} V`}
        </strong>
      </div>
      <svg
        viewBox="0 0 600 144"
        preserveAspectRatio="none"
        role="img"
        aria-label={t(
          shot.showWork ? '机械功等于负载得到的电能与内部损耗' : '旋转角度与带正负号的端电压',
        )}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <path key={p} d={`M${12 + p * 576} 12V130`} className="generator-grid" />
        ))}
        <path d={`M12 ${shot.showWork ? 118 : 72}H588`} className="generator-zero" />
        {shot.showWork ? (
          <>
            <path
              d={path(
                samples.map((v) => ('shaft' in v ? v.shaft : 0)),
                maxWork,
                true,
              )}
              className="generator-work-shaft"
            />
            <path
              d={path(
                samples.map((v) => ('load' in v ? v.load : 0)),
                maxWork,
                true,
              )}
              className="generator-work-load"
            />
            <path
              d={path(
                samples.map((v) => ('internal' in v ? v.internal : 0)),
                maxWork,
                true,
              )}
              className="generator-work-loss"
            />
          </>
        ) : (
          <>
            {shot.showReference && (
              <path d={path(reference, voltsLimit)} className="generator-reference" />
            )}
            <path d={path(voltage, voltsLimit)} className="generator-voltage-wave" />
          </>
        )}
        <path d={`M${12 + selected * 576} 8V131`} className="generator-cursor" />
        <circle
          cx={12 + selected * 576}
          cy={
            shot.showWork
              ? 118 - (shot.work.shaft / maxWork) * 96
              : 72 - (s.voltage / voltsLimit) * 48
          }
          r="4"
          className="generator-point"
        />
      </svg>
      <div className="generator-axis">
        <span>0°</span>
        <span>90°</span>
        <span>180°</span>
        <span>270°</span>
        <span>360°</span>
      </div>
      {shot.showWork ? (
        <div className="generator-energy-account">
          <span>
            {t('机械输入')} {fmt(shot.work.shaft * 1000)} mJ
          </span>
          <span>
            {t('负载电能')} {fmt(shot.work.load * 1000)} mJ
          </span>
          <span>
            {t('内部损耗')} {fmt(shot.work.internal * 1000)} mJ
          </span>
        </div>
      ) : (
        <div className="generator-instrument-foot">
          <span>{t('电压刻度')} ±1.4 V</span>
          <span>
            {shot.showReference
              ? t('虚线：原来的 360 rpm')
              : s.period === null
                ? t('轴已停止')
                : `${t('物理周期')} ${fmt(s.period * 1000, 1)} ms`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ElectricGenerator() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null),
    id = useId();
  const [width, setWidth] = useState(800),
    [angle, setAngle] = useState(45),
    [rpm, setRpm] = useState(360),
    [field, setField] = useState(0.8),
    [load, setLoad] = useState(8),
    [connected, setConnected] = useState(true);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const auto = generatorShot(film.chapter, film.chapterProgress),
    input = { ...generatorDefaults, angle: (angle * Math.PI) / 180, rpm, field, load, connected };
  const shot: GeneratorShot = film.watch
    ? auto
    : {
        ...auto,
        input,
        state: generatorState(input),
        contactFocus: 0,
        showArea: true,
        showForces: true,
        showWork: false,
        showReference: false,
        cutaway: 0.35,
      };
  const s = shot.state,
    narrow = width < 620;
  const phoneSample = film.watch && narrow && [1, 5, 6].includes(shot.chapter);
  return (
    <div
      className="electric-generator"
      ref={host}
      data-watch={film.watch}
      data-narrow={narrow}
      data-shot={shot.chapter}
    >
      <div className="generator-machine">
        <div className="generator-topline">
          <span>{t('一圈铜线，接住转动')}</span>
          <span>{t('单匝交流发电机')}</span>
        </div>
        <div className="generator-object">
          <ElectricGeneratorStudio key={narrow ? 'portrait' : 'wide'} shot={shot} narrow={narrow} />
        </div>
        <div className="generator-shaft-label">
          <span>
            {t('轴转速')} <b>{fmt(s.input.rpm, 0)} rpm</b>
          </span>
          <span>
            {t(s.input.connected ? '负载已接通' : '负载开路')} ·{' '}
            <b>{fmt(s.current * 1000, 1)} mA</b>
          </span>
        </div>
      </div>
      <div className="generator-proof">
        {film.watch && shot.chapter === 2 ? (
          <SlipRingDetail shot={shot} />
        ) : phoneSample ? (
          <div className="generator-phone-sample">
            <span>
              e = <strong>{fmt(s.emf, 3)} V</strong>
            </span>
            <span>
              {shot.chapter === 1 ? 'Φ' : 'i'} ={' '}
              <strong>
                {shot.chapter === 1
                  ? `${fmt(s.flux * 1000, 2)} mWb`
                  : `${fmt(s.current * 1000, 1)} mA`}
              </strong>
            </span>
          </div>
        ) : (
          <GeneratorInstrument shot={shot} />
        )}
        <div className="generator-observation">
          <span>
            {shot.showForces
              ? `τₑₘ = ${fmt(s.torque * 1000, 3)} mN·m`
              : `Φ = ${fmt(s.flux * 1000, 2)} mWb`}
          </span>
          <span>
            {shot.showForces
              ? t(
                  Math.abs(s.current) < 1e-5
                    ? '没有电流，就没有这里的电磁阻力矩'
                    : '电磁力矩总是反抗当前的转动',
                )
              : shot.showArea
                ? t('法线与磁场的夹角，决定穿过线圈的磁通')
                : t('磁场不提供持续能量，驱动轴才提供机械功')}
          </span>
        </div>
      </div>
      {!film.watch && (
        <div className="generator-explore">
          <label htmlFor={`${id}-angle`}>
            <span>
              {t('停在一个转角')}
              <output>{angle}°</output>
            </span>
            <input
              id={`${id}-angle`}
              type="range"
              min="0"
              max="360"
              step="1"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
          </label>
          <label htmlFor={`${id}-rpm`}>
            <span>
              {t('设定轴转速')}
              <output>{rpm} rpm</output>
            </span>
            <input
              id={`${id}-rpm`}
              type="range"
              min="-720"
              max="720"
              step="30"
              value={rpm}
              onChange={(e) => setRpm(Number(e.target.value))}
            />
          </label>
          <label htmlFor={`${id}-field`}>
            <span>
              {t('气隙磁场')}
              <output>{field.toFixed(2)} T</output>
            </span>
            <input
              id={`${id}-field`}
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={field}
              onChange={(e) => setField(Number(e.target.value))}
            />
          </label>
          <label htmlFor={`${id}-load`}>
            <span>
              {t('负载电阻')}
              <output>{load} Ω</output>
            </span>
            <input
              id={`${id}-load`}
              type="range"
              min="2"
              max="32"
              step="1"
              value={load}
              onChange={(e) => setLoad(Number(e.target.value))}
            />
          </label>
          <div className="generator-buttons">
            <button aria-pressed={connected} onClick={() => setConnected(!connected)}>
              {t(connected ? '断开负载' : '接通负载')}
            </button>
            <button
              onClick={() => {
                setAngle(45);
                setRpm(360);
                setField(0.8);
                setLoad(8);
                setConnected(true);
              }}
            >
              {t('重置发电机')}
            </button>
          </div>
        </div>
      )}
      <details className="generator-notes">
        <summary>{t('方向、能量与教学边界')}</summary>
        <p>
          {t(
            '正角度绕轴的正方向增加；初始线圈法线与气隙磁场平行。电压定义为 B 电刷减去 A 电刷，正电流从 B 流向负载，再回到 A。',
          )}
        </p>
        <div className="generator-formulas">
          <span>Φ = BA cos θ</span>
          <span>e = −dΦ/dt = BAω sin θ</span>
          <span>τₑₘ = −BAi sin θ</span>
          <span>−τₑₘω = ei = i²(R + r)</span>
        </div>
        <p>
          {t(
            '这是一个单匝、圆角矩形线圈。面积由铜线中心线推导；转轴、绝缘支架、滑环和电刷分开连接。气隙磁场近似均匀，忽略端部漏磁与旋转引线的额外感应。',
          )}
        </p>
        <p>
          {t(
            '影片使用慢动作和观察停帧；转角滑块改变取样位置，转速滑块改变真实计算。由外部驱动维持指定转速，忽略转动惯量、轴承摩擦、线圈电感和电枢反应。',
          )}
        </p>
        <p>
          {t(
            '内部等效电阻为 0.4 Ω，合并绕组与电刷接触损耗，不计算温度。负载开路时只有感应电压；这里没有持续的输出功率或电磁制动力矩。',
          )}
        </p>
        <p>
          A = {fmt(GENERATOR_AREA * 1e4, 2)} cm² · B = {fmt(s.input.field)} T · r = 0.4 Ω
        </p>
      </details>
    </div>
  );
}
