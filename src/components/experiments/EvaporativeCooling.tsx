import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  evaporationParameters,
  evaporationFlux,
  evaporationEquilibrium,
  evaporationHistory,
  evaporationAt,
  evaporationShot,
} from '../../models/evaporative-cooling';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/evaporative-cooling.css';
export default function EvaporativeCooling() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [humidity, setHumidity] = useState(0.3),
    [flow, setFlow] = useState(1),
    [initial, setInitial] = useState(30),
    [elapsed, setElapsed] = useState(0),
    [open, setOpen] = useState(true);
  const shot = evaporationShot(film.chapter),
    o = film.watch ? shot.one : { air: 30, humidity, flow, initial, open },
    comparison = film.watch ? shot.two : null,
    p = evaporationParameters(o),
    history = useMemo(
      () => evaporationHistory(o),
      [p.air, p.humidity, p.flow, p.initial, p.mass, p.open],
    ),
    reference = useMemo(
      () => (comparison ? evaporationHistory(comparison) : null),
      [comparison?.humidity, comparison?.flow, comparison?.open],
    ),
    time = film.watch ? shot.start + shot.duration * film.chapterProgress : elapsed,
    q = evaporationAt(history, time),
    f = evaporationFlux(q.temperature, o),
    eq = evaporationEquilibrium(o),
    r = reference ? evaporationAt(reference, time) : null,
    W = phone ? 340 : 760,
    H = phone ? 250 : 330,
    gx = phone ? 192 : 365,
    gy = 22,
    gw = W - gx - 14,
    gh = H - 64,
    px = (v: number) => gx + (gw * v) / 900,
    py = (v: number) => gy + gh * (1 - v / 40),
    curve = (h: typeof history) => h.map((v) => `${px(v.time)},${py(v.temperature)}`).join(' '),
    surface = 150 + Math.max(-8, Math.min(8, ((p.mass - q.mass) / p.mass) * 60)),
    color = `rgb(${Math.round(104 + q.temperature * 3)},${Math.round(180 - q.temperature * 0.7)},${Math.round(187 - q.temperature * 2.3)})`,
    condensing = f.massRate < -0.00000001;
  return (
    <section className="evaporation-study">
      <header>
        {t(
          condensing
            ? '水汽凝结，潜热回到水膜'
            : !p.open
              ? '关闭蒸发，只保留温差传热'
              : f.heat < -1e-8
                ? '水膜向空气放热，蒸发也带走能量'
                : '蒸发带走潜热，空气同时向水膜补热',
        )}
      </header>
      <svg
        className="evaporation-apparatus"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('薄水膜、浸入式温度探头、可反向的热流与质量流，以及积分得到的温度曲线')}
      >
        <defs>
          <linearGradient id={`${id}metal`}>
            <stop stopColor="#6d7d7d" />
            <stop offset=".5" stopColor="#d5dbd0" />
            <stop offset="1" stopColor="#798a86" />
          </linearGradient>
          <marker
            id={`${id}arrow`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
          </marker>
        </defs>
        <g transform={phone ? undefined : 'translate(30 -10) scale(1.35)'}>
          <path
            d="M20 144V194Q20 202 28 202H135Q143 202 143 194V144"
            fill="none"
            stroke={`url(#${id}metal)`}
            strokeWidth="7"
          />
          <path
            d={`M24 ${surface}H139V193Q139 198 133 198H30Q24 198 24 192Z`}
            fill={color}
            opacity=".9"
          />
          <path d={`M25 ${surface}H138`} stroke="#c7e5dc" strokeWidth="2" />
          <path d="M61 61V169" stroke="#dce3d7" strokeWidth="14" strokeLinecap="round" />
          <path d="M61 166V73" stroke="#364d4b" strokeWidth="4" strokeLinecap="round" />
          <path
            d={`M61 166V${162 - q.temperature * 2.1}`}
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="61" cy="172" r="12" fill={color} stroke="#dce3d7" strokeWidth="4" />
          {Math.abs(f.massRate) > 1e-10 && (
            <path
              d={f.massRate > 0 ? `M112 ${surface}V47` : `M112 47V${surface}`}
              fill="none"
              stroke={f.massRate > 0 ? '#a3c9c9' : '#dfad74'}
              strokeWidth={Math.max(1.8, Math.min(6, Math.abs(f.latent) * 1.1))}
              markerEnd={`url(#${id}arrow)`}
            />
          )}
          {Math.abs(f.heat) > 1e-8 && (
            <path
              d={f.heat > 0 ? 'M3 183H42' : 'M42 183H3'}
              stroke="#deae79"
              strokeWidth={Math.max(1.6, Math.min(5, Math.abs(f.heat) * 1.2))}
              markerEnd={`url(#${id}arrow)`}
            />
          )}
        </g>
        {[0, 20, 40].map((v) => (
          <g key={v}>
            <path d={`M${gx} ${py(v)}H${W - 14}`} stroke="#b6bdae" opacity=".17" />
            <text
              x={gx - 9}
              y={py(v) + 7}
              textAnchor="end"
              fill="#c5cdbf"
              fontSize={phone ? 28 : 20}
            >
              {v}
            </text>
          </g>
        ))}
        <path
          d={`M${gx} ${py(eq)}H${W - 14}`}
          stroke="#a5bdb8"
          strokeDasharray="4 5"
          opacity=".6"
        />
        {reference && (
          <polyline
            points={curve(reference)}
            fill="none"
            stroke="#a6b9a8"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        )}
        <polyline points={curve(history)} fill="none" stroke="#dfb273" strokeWidth="2.8" />
        <circle cx={px(time)} cy={py(q.temperature)} r="5" fill="#f0c481" />
        {r && <circle cx={px(time)} cy={py(r.temperature)} r="4.5" fill="#c2d3bf" />}
        <path d={`M${gx} ${gy}V${gy + gh}H${W - 14}`} fill="none" stroke="#b2bcae" opacity=".5" />
      </svg>
      <div className="evaporation-chart-note">
        <span>{t('水温曲线：0—15分钟')}</span>
        <span>
          {t('虚线：当前模型平衡温度')} {eq.toFixed(1)} °C
        </span>
      </div>
      <div className="evaporation-temperatures">
        <div>
          <b>{q.temperature.toFixed(1)} °C</b>
          <span>
            RH {(p.humidity * 100).toFixed(0)}% · {t('换气倍率')} {p.flow.toFixed(1)}
          </span>
        </div>
        <div>
          <b>{r ? `${r.temperature.toFixed(1)} °C` : `${(f.massRate * 3600000).toFixed(1)} g/h`}</b>
          <span>
            {r
              ? t(
                  shot.kind === 'humidity'
                    ? '对照：湿度80%'
                    : shot.kind === 'flow'
                      ? '对照：换气2倍'
                      : '对照：开启蒸发',
                )
              : t(condensing ? '凝结净质量流入' : '蒸发净质量流出')}
          </span>
        </div>
      </div>
      <div className="evaporation-energy">
        <span>
          {t('空气传热（入为正）')} <b>{f.heat.toFixed(2)} W</b>
        </span>
        <span>
          {t('相变带走（出为正）')} <b>{f.latent.toFixed(2)} W</b>
        </span>
      </div>
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('水膜的能量账与传质简化')}</summary>
          <p>
            {t(
              '均温纯水薄膜置于恒定30°C、恒湿空气库，热容随剩余液体质量变化。相变通量按饱和蒸气压与环境水汽分压之差计算，可在冷表面反向凝结。空气传热与相变带走的差，改变液体温度；稳态两者相等。传热系数8 W/(m²·K)、压差传质系数4×10⁻⁸ kg/(m²·s·Pa)仅为教学参数，换气倍率同时乘两者，不是实际风速标定或标准湿球温度预测。面积0.02m²，初始水20g，潜热取2.43MJ/kg；忽略辐射、容器热容、边缘效应和水膜干涸。曲线用实际质量与能量方程积分，运动加速。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="evaporation-controls">
          <Range
            label={t('空气相对湿度')}
            value={humidity * 100}
            min={10}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => setHumidity(v / 100)}
          />
          <Range
            label={t('换气倍率')}
            value={flow}
            min={0.4}
            max={3}
            step={0.1}
            onChange={setFlow}
          />
          <Range
            label={t('水膜初始温度')}
            value={initial}
            min={10}
            max={35}
            step={1}
            unit="°C"
            onChange={setInitial}
          />
          <Range
            label={t('真实经过时间')}
            value={elapsed}
            min={0}
            max={900}
            step={5}
            unit="s"
            onChange={setElapsed}
          />
          <button type="button" aria-pressed={open} onClick={() => setOpen(!open)}>
            {t(open ? '关闭蒸发通道' : '开启蒸发通道')}
          </button>
        </div>
      )}
    </section>
  );
}
