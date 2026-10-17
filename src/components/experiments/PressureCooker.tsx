import { useId, useState } from 'react';
import { t } from '../../i18n';
import { cookerState, cookerShot } from '../../models/pressure-cooker';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/FilmContext';
import { useCompact } from '../lab/useCompact';
import '../../styles/pressure-cooker.css';
export default function PressureCooker() {
  const film = useShowcase(),
    phone = useCompact(),
    id = useId().replaceAll(':', '');
  const [ambient, setAmbient] = useState(101.325),
    [weight, setWeight] = useState(33),
    [power, setPower] = useState(600),
    [elapsed, setElapsed] = useState(0),
    [sealed, setSealed] = useState(true);
  const shot = film.watch
      ? cookerShot(film.chapter, film.chapterProgress)
      : { ambient: ambient * 1000, weight: weight / 1000, power, time: elapsed, sealed },
    s = cookerState(shot),
    W = phone ? 340 : 760,
    H = 300,
    cx = phone ? 170 : 230,
    L = cx - (phone ? 105 : 150),
    R = cx + (phone ? 105 : 150),
    floor = 245,
    rim = 130,
    water = floor - ((s.liquid * s.vl) / s.volume) * (floor - rim),
    gap = s.lift * 80000,
    capHeight = 16 + (s.weight - 0.02) * 800,
    speed = film.watch ? film.time : elapsed,
    flowWidth = 1.5 + Math.min(3, s.flow * 6000),
    up = (Math.max(0, s.upForce) / 0.4) * 32,
    down = (s.weightForce / 0.4) * 32;
  const valve = (x: number, y: number, scale = 1, forces = false, from = 51) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-5 40V0H-14M5 40V0H14" fill="none" stroke={`url(#${id}steel)`} strokeWidth="5" />
      <rect
        x="-20"
        y={-gap - capHeight}
        width="40"
        height={capHeight}
        rx="5"
        fill={`url(#${id}weight)`}
        stroke="#8e9793"
        strokeWidth="1"
      />
      <path d={`M-13 ${-gap - capHeight + 5}H13`} stroke="#f0e6cf" opacity=".55" />
      {s.regulated &&
        [-1, 1].map((sign) => (
          <path
            key={sign}
            d={`M0 ${from}V${-gap / 2}H${sign * 43}Q${sign * 50} ${-gap / 2} ${sign * 50} ${-gap / 2 - 12}V-56`}
            fill="none"
            stroke="#b1d9ce"
            strokeWidth={flowWidth}
            strokeDasharray="7 8"
            strokeDashoffset={-speed * 24}
            opacity=".85"
          />
        ))}
      {forces && (
        <>
          {up > 1e-5 && (
            <path
              d={`M-36 ${-gap - capHeight / 2 + up / 2}v${-up}`}
              stroke="#b7d4c8"
              strokeWidth="2.5"
              markerEnd={`url(#${id}arrow)`}
            />
          )}
          <path
            d={`M36 ${-gap - capHeight / 2 - down / 2}v${down}`}
            stroke="#e3b77b"
            strokeWidth="2.5"
            markerEnd={`url(#${id}arrow)`}
          />
        </>
      )}
    </g>
  );
  return (
    <section className="cooker-study">
      <header>
        {t(
          s.power === 0
            ? '供热为零，绝热模型状态保持不变'
            : !s.sealed
              ? '常压沸腾：继续供热，主要增加相变'
              : s.regulated
                ? '阀口排汽，温度与压力接近保持'
                : '阀仍贴在座上，供热使温度与饱和压力上升',
        )}
      </header>
      <svg
        className="cooker-cutaway"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('液汽共存的锅体剖面，连续阀口通道与按压差受力打开的理想配重阀')}
      >
        <defs>
          <linearGradient id={`${id}steel`}>
            <stop stopColor="#7f9391" />
            <stop offset=".4" stopColor="#d9dfcf" />
            <stop offset=".65" stopColor="#a6b8ae" />
            <stop offset="1" stopColor="#6c8480" />
          </linearGradient>
          <linearGradient id={`${id}weight`} x2="0" y2="1">
            <stop stopColor="#dfc48b" />
            <stop offset=".5" stopColor="#a08758" />
            <stop offset="1" stopColor="#6e654d" />
          </linearGradient>
          <linearGradient id={`${id}water`} x2="0" y2="1">
            <stop stopColor="#90b9b5" stopOpacity=".9" />
            <stop offset="1" stopColor="#466b6c" />
          </linearGradient>
          <marker
            id={`${id}arrow`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
          </marker>
        </defs>
        <path
          d={`M${L} ${rim}V${floor - 12}Q${L} ${floor} ${L + 12} ${floor}H${R - 12}Q${R} ${floor} ${R} ${floor - 12}V${rim}`}
          fill="#bfd4c2"
          fillOpacity=".035"
          stroke={`url(#${id}steel)`}
          strokeWidth="9"
        />
        <path
          d={`M${L + 5} ${water}H${R - 5}V${floor - 12}Q${R - 5} ${floor - 5} ${R - 12} ${floor - 5}H${L + 12}Q${L + 5} ${floor - 5} ${L + 5} ${floor - 12}Z`}
          fill={`url(#${id}water)`}
        />
        <path d={`M${L + 7} ${water}H${R - 7}`} stroke="#bad6c7" strokeWidth="2" />
        <path
          d={`M${L - 2} 156h-22q-10 0-10 9v9q0 8 10 8h22M${R + 2} 156h22q10 0 10 9v9q0 8-10 8h-22`}
          fill="none"
          stroke="#34433d"
          strokeWidth="10"
        />
        {s.sealed ? (
          <>
            <path
              d={`M${L - 3} ${rim}Q${L + 25} 111 ${cx - 9} 114V${rim}M${cx + 9} ${rim}V114Q${R - 25} 111 ${R + 3} ${rim}`}
              fill="none"
              stroke={`url(#${id}steel)`}
              strokeWidth="9"
            />
            <path
              d={`M${L + 2} ${rim + 4}H${cx - 9}M${cx + 9} ${rim + 4}H${R - 2}`}
              stroke="#596e61"
              strokeWidth="3"
            />
            {valve(cx, 100, 1, phone, water - 100)}
            {!phone && (
              <>
                {valve(600, 145, 1.5, true)}
                <path d="M540 215H660" stroke="#8b9d8e" strokeWidth="2" opacity=".4" />
              </>
            )}
          </>
        ) : (
          s.flow > 0 &&
          [-1, 0, 1].map((i) => (
            <path
              key={i}
              d={`M${cx + i * 40} ${water - 5}V45`}
              stroke="#b1d9ce"
              strokeWidth={flowWidth}
              fill="none"
              strokeDasharray="7 8"
              strokeDashoffset={-speed * 24}
              opacity=".65"
            />
          ))
        )}
        <path
          d={`M${L + 15} 266H${R - 15}`}
          stroke="#ad7853"
          strokeWidth="7"
          strokeLinecap="round"
          opacity={s.power > 0 ? 0.35 + (s.power / 900) * 0.65 : 0.15}
        />
        {s.power > 0 &&
          [-1, 0, 1].map((i) => (
            <path
              key={i}
              d={`M${cx + i * 37} 283V250`}
              stroke="#e3aa72"
              strokeWidth={1.5 + (s.power / 900) * 2.5}
              markerEnd={`url(#${id}arrow)`}
            />
          ))}
      </svg>
      <div className="cooker-view-note">
        <span>{t(s.sealed ? '阀隙纵向放大；蒸汽通道连续' : '敞口对照，从常压液汽平衡开始')}</span>
        {!phone && s.sealed && <span>{t('右：同一阀口的局部剖面')}</span>}
      </div>
      <div className="cooker-readouts">
        <div>
          <b>{s.temperature.toFixed(1)} °C</b>
          <span>{t('液汽平衡温度')}</span>
        </div>
        <div>
          <b>{(s.pressure / 1000).toFixed(1)} kPa</b>
          <span>{t('锅内绝对压力')}</span>
        </div>
      </div>
      {(!film.watch || !phone || film.chapter !== 3) && (
        <div className="cooker-pressure">
          <span>
            {t('环境')} {(s.ambient / 1000).toFixed(1)} kPa
          </span>
          <span>
            {t('表压')} {(s.gauge / 1000).toFixed(1)} kPa
          </span>
        </div>
      )}
      {s.sealed && (!film.watch || !phone || [1, 2, 4].includes(film.chapter)) && (
        <div className="cooker-forces">
          <span>
            ↑ {t('压差作用')} {s.upForce.toFixed(3)} N
          </span>
          <span>
            ↓ {t('配重重力')} {s.weightForce.toFixed(3)} N
          </span>
        </div>
      )}
      {(!film.watch || !phone || [0, 3].includes(film.chapter)) && (
        <div className="cooker-energy">
          <span>
            {t('供热')} {s.power.toFixed(0)} W
          </span>
          <span>
            {t('排汽')} {(s.flow * 1000).toFixed(3)} g/s
          </span>
          <span>
            {t('剩余液水')} {(s.liquid * 1000).toFixed(0)} g
          </span>
        </div>
      )}
      {(!film.watch || !phone) && (
        <details>
          <summary>{t('起始状态、阀模型与质量能量账')}</summary>
          <p>
            {t(
              '从空气已排尽、液汽共存且达到环境压力的状态开始，不模拟冷锅启动。2L刚性绝热容器初始总水1kg；饱和压采用IAPWS-IF97，液水密度1000kg/m³、比热4180J/(kg·K)，蒸汽近似理想气体，潜热按100—120°C数据作线性近似。升压段按定容混合物内能求温度，达压后质量流出和气相占据空间的变化共同满足开放系统能量账。理想平阀受压差作用，阀座半径1mm；配重仅为模型参数。阀隙由准稳态理想气体喷口流量反求，γ=1.3、流量系数0.7，忽略摇摆、摩擦、滞回与真实复杂流道。阀隙纵向放大，不预测实际阀的位移；不计算食品熟化、操作流程或冷却降压。',
            )}
          </p>
        </details>
      )}
      {!film.watch && (
        <div className="cooker-controls">
          <Range
            label={t('环境绝对压力')}
            value={ambient}
            min={70}
            max={105}
            step={1}
            unit="kPa"
            onChange={setAmbient}
          />
          <Range
            label={t('理想阀配重')}
            value={weight}
            min={20}
            max={40}
            step={1}
            unit="g"
            onChange={setWeight}
          />
          <Range
            label={t('模型供热功率')}
            value={power}
            min={0}
            max={900}
            step={50}
            unit="W"
            onChange={setPower}
          />
          <Range
            label={t('从液汽平衡开始的时间')}
            value={elapsed}
            min={0}
            max={900}
            step={5}
            unit="s"
            onChange={setElapsed}
          />
          <button type="button" aria-pressed={sealed} onClick={() => setSealed(!sealed)}>
            {t(sealed ? '切换常压敞口对照' : '查看理想配重阀')}
          </button>
        </div>
      )}
    </section>
  );
}
