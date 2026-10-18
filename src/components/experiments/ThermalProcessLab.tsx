import { useId, useState } from 'react';
import { t } from '../../i18n';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import {
  jouleCalorimeter,
  eggCooling,
  glowingIron,
  ironSpectrum,
} from '../../models/thermal-process-lab';
import '../../styles/thermal-process-lab.css';
type Mode = 'joule' | 'egg' | 'glow';
function Calorimeter({
  x,
  current,
  resistance,
  time,
}: {
  x: number;
  current: number;
  resistance: number;
  time: number;
}) {
  const s = jouleCalorimeter(current, resistance, time),
    h = 15 + (s.temperature - 20) * 2.4;
  return (
    <g transform={`translate(${x} 0)`}>
      <path
        d="M-61 93v148q0 15 15 15h92q15 0 15-15V93"
        fill="#e7eeda"
        fillOpacity=".5"
        stroke="#bdc8ae"
        strokeWidth="2"
      />
      <path d="M-58 145v95q0 13 13 13h90q13 0 13-13v-95z" fill="#c7dac1" opacity=".65" />
      <ellipse cx="0" cy="145" rx="58" ry="8" fill="#d9e6cc" />
      <path
        d="M-27 109v87q0 8 8 8h31q8 0 8 8v4q0 8-8 8h-31q-8 0-8 8v4q0 8 8 8h39V109"
        stroke="#b09970"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M-27 109V74H-67V294H-22M22 294H69V74H20V109"
        stroke="#aaba9b"
        strokeWidth="2"
        fill="none"
      />
      <rect x="-22" y="277" width="44" height="34" rx="9" fill="#c4cdae" />
      <text x="-14" y="300">
        +
      </text>
      <text x="7" y="300">
        −
      </text>
      <rect x="34" y="88" width="9" height="144" rx="4" fill="#eef2e3" stroke="#b5c29f" />
      <path d={`M38.5 225v-${h}`} stroke="#b39a6b" strokeWidth="3.3" strokeLinecap="round" />
      <circle cx="38.5" cy="230" r="6" fill="#b39a6b" />
      <text x="0" y="40" textAnchor="middle">
        {current.toFixed(1)} A · {resistance.toFixed(0)} Ω
      </text>
      <text x="0" y="346" textAnchor="middle">
        {s.temperature.toFixed(1)} °C
      </text>
    </g>
  );
}
function JouleView({
  current,
  resistance,
  time,
}: {
  current: number;
  resistance: number;
  time: number;
}) {
  const a = jouleCalorimeter(2, 4, time),
    b = jouleCalorimeter(current, resistance, time);
  return (
    <>
      <svg
        viewBox="0 0 400 365"
        className="tp-apparatus"
        role="img"
        aria-label={t('两套相同的水量热器、电阻丝、温度计和独立直流供电')}
      >
        <Calorimeter x={100} current={2} resistance={4} time={time} />
        <Calorimeter x={300} current={current} resistance={resistance} time={time} />
      </svg>
      <div className="tp-readings">
        <span>
          {t('相同时间')} {time.toFixed(0)} s
        </span>
        <span>Q₁ = {a.input.toFixed(0)} J</span>
        <span>Q₂ = {b.input.toFixed(0)} J</span>
      </div>
      <p className="tp-subtitle">{t('现代量热示意，用于解释焦耳定律；不复原历史仪器')}</p>
    </>
  );
}
function EggView({ time, mass, equal }: { time: number; mass: number; equal: boolean }) {
  const s = eggCooling(time, mass, equal ? 30 : 90, equal ? 30 : 20),
    level = 140 - (75 * (mass - 0.2)) / 0.3,
    flow = Math.min(1, Math.abs(s.rate) / 140);
  return (
    <>
      <svg
        viewBox="0 0 400 305"
        className="tp-apparatus"
        role="img"
        aria-label={t('热鸡蛋浸在冷水中，两个温度随能量交换趋同')}
      >
        <path
          d="M75 59v205q0 17 17 17h216q17 0 17-17V59"
          fill="#e7eeda"
          fillOpacity=".4"
          stroke="#bac8ad"
          strokeWidth="2.5"
        />
        <path
          d={`M78 ${level}v${264 - level}q0 14 14 14h216q14 0 14-14V${level}Z`}
          fill="#c6d9bf"
          opacity=".65"
        />
        <ellipse cx="200" cy={level} rx="122" ry="10" fill="#d9e6cd" />
        <path
          d="M200 145C174 145 153 195 157 219C161 248 185 258 201 257C232 255 246 236 243 212C241 185 223 145 200 145Z"
          fill="#d8c49f"
          stroke="#b8a67f"
          strokeWidth="1.7"
        />
        <path
          d="M183 162C174 174 167 194 167 213"
          stroke="#e9debf"
          strokeWidth="5"
          opacity=".65"
          strokeLinecap="round"
        />
        {[
          [-1, 0],
          [1, 0],
          [0, -1],
        ].map(([x, y], i) => (
          <path
            key={i}
            d={`M${200 + x * 50} ${205 + y * 60}l${x * 42} ${y * 35}`}
            stroke="#b8a578"
            strokeWidth="3"
            opacity={flow * 0.8}
            strokeLinecap="round"
          />
        ))}
        <path d="M200 175V91M275 220V95" stroke="#acba9b" strokeWidth="1.2" strokeDasharray="3 4" />
        <text x="200" y="79" textAnchor="middle">
          {s.egg.toFixed(1)}°
        </text>
        <text x="275" y="79" textAnchor="middle">
          {s.water.toFixed(1)}°
        </text>
      </svg>
      <div className="tp-readings">
        <span>
          {t('鸡蛋')} {s.egg.toFixed(1)} °C
        </span>
        <span>
          {t('水')} {s.water.toFixed(1)} °C
        </span>
        <span>
          {t('能量转移')} {s.transfer.toFixed(0)} J
        </span>
      </div>
      <p className="tp-subtitle">
        {equal
          ? t('同温时没有净传热，也不会自发重新分成冷热两部分')
          : t('鸡蛋降温所失的能量，等于水升温所获的能量')}
      </p>
    </>
  );
}
function GlowView({ temperature, id }: { temperature: number; id: string }) {
  const s = glowingIron(temperature),
    points = ironSpectrum(temperature),
    X = (w: number) => 35 + (330 * Math.log(w / 0.3e-6)) / Math.log(20 / 0.3),
    visibleA = X(380e-9),
    visibleB = X(780e-9);
  return (
    <>
      <svg
        viewBox="0 0 400 300"
        className="tp-apparatus"
        role="img"
        aria-label={t('炉膛内铁块随温度升高发光，下方光谱显示波长分布')}
      >
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor={s.color} stopOpacity={s.brightness * 0.65} />
            <stop offset="1" stopColor={s.color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M38 253V103Q38 38 101 38h198q63 0 63 65v150Z" fill="#c8ceba" />
        <path d="M64 241V109q0-45 44-45h184q44 0 44 45v132Z" fill="#56604b" />
        <path
          d="M38 125h25m-25 56h25m273-56h26m-26 56h26M101 38v26m99-26v26m99-26v26"
          stroke="#acb69d"
          strokeWidth="2"
        />
        <ellipse cx="201" cy="172" rx="134" ry="108" fill={`url(#${id}-glow)`} />
        <path d="M102 230h196v15H102Z" fill="#8e977e" />
        <path d="M116 162l33-26h134l-33 26Z" fill={s.color} opacity=".9" />
        <path d="M250 162l33-26v61l-33 26Z" fill={s.color} opacity=".6" />
        <path d="M116 162h134v61H116Z" fill={s.color} />
        <path d="M125 171h115" stroke="#f0e3bf" opacity={s.brightness * 0.6} strokeWidth="2" />
        <text x="200" y="282" textAnchor="middle">
          {temperature.toFixed(0)} K
        </text>
      </svg>
      <svg
        viewBox="0 0 400 140"
        className="tp-spectrum"
        role="img"
        aria-label={t('按峰值归一化的热辐射光谱，可见区以浅色标示')}
      >
        <rect
          x={visibleA}
          y="15"
          width={visibleB - visibleA}
          height="93"
          fill="#c7d5af"
          opacity=".45"
        />
        <path d="M35 15v93h330" stroke="#b5c0a3" fill="none" />
        <path
          d={`M${points.map((p) => `${X(p.wavelength)},${108 - p.value * 85}`).join('L')}`}
          stroke="#ab9567"
          strokeWidth="2.5"
          fill="none"
        />
        <path d={`M${X(s.peak)} 20v88`} stroke="#abb99a" strokeDasharray="3 4" />
        {[0.3, 1, 3, 10, 20].map((w) => (
          <text key={w} x={X(w * 1e-6)} y="132" textAnchor="middle">
            {w}
          </text>
        ))}
      </svg>
      <div className="tp-spectrum-key">Bλ / Bλ,max · λ / µm</div>
      <div className="tp-readings">
        <span>λmax = {(s.peak * 1e6).toFixed(2)} µm</span>
        <span>
          {t('可见辐射占比')} {(s.visibleFraction * 100).toFixed(3)}%
        </span>
      </div>
      <p className="tp-subtitle">
        {t('横轴波长 µm；曲线各自归一化，只比较形状。屏幕亮色是曝光示意。')}
      </p>
    </>
  );
}
export default function ThermalProcessLab() {
  const film = useShowcase(),
    id = useId().replace(/:/g, ''),
    initial: Mode =
      film.variant === 'r3-egg-cooling'
        ? 'egg'
        : film.variant === 'r3-thermal-glow'
          ? 'glow'
          : 'joule',
    [mode, setMode] = useState<Mode>(initial),
    [current, setCurrent] = useState(4),
    [resistance, setResistance] = useState(4),
    [time, setTime] = useState(120),
    [mass, setMass] = useState(0.2),
    [equal, setEqual] = useState(false),
    [temperature, setTemperature] = useState(1200);
  const c = film.chapter,
    p = film.chapterProgress,
    m = film.watch ? (c < 2 ? 'joule' : c < 4 ? 'egg' : 'glow') : mode,
    I = film.watch ? (c === 0 ? 4 : 2) : current,
    R = film.watch ? (c === 1 ? 8 : 4) : resistance,
    seconds = film.watch
      ? c < 2
        ? 120 * p
        : c === 2
          ? 500 * p
          : 500
      : m === 'joule'
        ? Math.min(time, 240)
        : time,
    T = film.watch ? (c === 4 ? 300 : c === 5 ? 600 + 600 * p : 1200 + 550 * p) : temperature,
    isEqual = film.watch ? c === 3 : equal;
  const label =
    m === 'joule'
      ? !film.watch
        ? '分别改变电流和电阻，比较同时间发热'
        : c === 1
          ? '电流相同，比较不同电阻产生的热量'
          : '电阻相同，电流加倍使发热变为四倍'
      : m === 'egg'
        ? isEqual
          ? '能量守恒，还需要过程方向的条件'
          : '热鸡蛋把能量传给冷水'
        : T < 650
          ? '没有可见辉光，不代表没有热辐射'
          : '温度越高，可见波段的辐射越强';
  return (
    <section className="tp-film" data-watch={film.watch || undefined} data-chapter={film.chapter}>
      <p className="tp-kicker">{t(label)}</p>
      {m === 'joule' ? (
        <JouleView current={I} resistance={R} time={seconds} />
      ) : m === 'egg' ? (
        <EggView time={seconds} mass={film.watch ? 0.2 : mass} equal={isEqual} />
      ) : (
        <GlowView temperature={T} id={id} />
      )}
      {!film.watch && (
        <div className="tp-controls">
          <Segments
            label={t('选择热过程')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'joule', label: t('电阻量热') },
              { value: 'egg', label: t('鸡蛋与水') },
              { value: 'glow', label: t('铁块热辐射') },
            ]}
          />
          {m === 'joule' ? (
            <>
              <Range
                label={t('右侧电流')}
                value={current}
                min={0}
                max={4}
                step={0.5}
                unit="A"
                onChange={setCurrent}
              />
              <Range
                label={t('右侧电阻')}
                value={resistance}
                min={1}
                max={8}
                step={1}
                unit="Ω"
                onChange={setResistance}
              />
              <Range
                label={t('共同通电时间')}
                value={Math.min(time, 240)}
                min={0}
                max={240}
                step={5}
                unit="s"
                onChange={setTime}
              />
            </>
          ) : m === 'egg' ? (
            <>
              <Range
                label={t('接触后时间')}
                value={time}
                min={0}
                max={1000}
                step={10}
                unit="s"
                onChange={setTime}
              />
              <Range
                label={t('水的质量')}
                value={mass}
                min={0.2}
                max={0.5}
                step={0.05}
                unit="kg"
                onChange={setMass}
              />
              <Segments
                label={t('初始温度条件')}
                value={equal ? 'equal' : 'different'}
                onChange={(v) => setEqual(v === 'equal')}
                options={[
                  { value: 'different', label: t('热鸡蛋与冷水') },
                  { value: 'equal', label: t('从同温开始') },
                ]}
              />
            </>
          ) : (
            <Range
              label={t('铁块绝对温度')}
              value={temperature}
              min={300}
              max={1750}
              step={25}
              unit="K"
              onChange={setTemperature}
            />
          )}
        </div>
      )}
      <details className="tp-details">
        <summary>{t('三个装置的计算边界')}</summary>
        <p>
          {t(
            '量热器用相同热容量和环境散热系数，电热 Q = I²Rt 与储能、散热守恒。鸡蛋与水各取均匀温度，只交换能量，忽略杯子与环境；实际鸡蛋内部存在温差。铁块用发射率 0.8 的灰体普朗克光谱，温度上限保持在铁熔点以下；色彩与光晕只是固定曝光下的屏幕示意，不标定实物颜色。炉温是输入，不模拟炉子升温过程。',
          )}
        </p>
      </details>
    </section>
  );
}
