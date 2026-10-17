import { useId, useState } from 'react';
import { t } from '../../i18n';
import { electrolysis } from '../../models/electrolysis';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/electrolysis.css';

export default function Electrolysis() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [current, setCurrent] = useState(2),
    [seconds, setSeconds] = useState(60),
    [voltage, setVoltage] = useState(1.8),
    [water, setWater] = useState(2),
    [closed, setClosed] = useState(true),
    [conducting, setConducting] = useState(true);
  const c = film.watch ? Math.min(6, film.chapter) : 3,
    p = film.watch ? film.chapterProgress : 1;
  const I = film.watch ? (c === 4 && p >= 0.5 ? 4 : 2) : current;
  const time = film.watch
    ? c === 0
      ? 0
      : c === 1
        ? 10
        : c === 2
          ? 20
          : c === 6
            ? 60 * Math.min(1, p / 0.65)
            : 60
    : seconds;
  const V = film.watch ? (c === 5 ? (p < 0.5 ? 1.6 : 2) : 1.8) : voltage;
  const q = electrolysis({
    current: I,
    seconds: time,
    voltage: V,
    waterMMol: film.watch ? (c === 6 ? 0.3 : 2) : water,
    circuitClosed: film.watch ? c !== 0 : closed,
    membraneConducting: film.watch || conducting,
  });
  const cycle = film.watch ? film.chapterProgress * 3 : q.charge / 100;
  const moving = q.runningCurrent > 0;
  const electronPoints = [
    [136, 182],
    [136, 40],
    [214, 40],
    [214, 182],
  ];
  const pointAt = (fraction: number) => {
    const lengths = [142, 78, 142],
      total = 362;
    let distance = (((fraction % 1) + 1) % 1) * total;
    for (let n = 0; n < lengths.length; n++) {
      if (distance <= lengths[n]) {
        const a = electronPoints[n],
          b = electronPoints[n + 1],
          f = distance / lengths[n];
        return [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])];
      }
      distance -= lengths[n];
    }
    return electronPoints[3];
  };
  const amountScale = 78 / 2; // Fixed millimole scale, never rescaled with current or time.
  return (
    <section
      className="electrolysis-study"
      data-watch={film.watch}
      aria-label={t('PEM 水电解的电荷与物质收支')}
    >
      <header>
        <span>PEM / ELECTROLYSIS</span>
        <b>{t('电能输入，产气分开')}</b>
      </header>
      <div
        className="electrolysis-vessel"
        role="img"
        aria-label={t('正阳极产氧，质子穿膜到负阴极，电子经直流电源绕行')}
      >
        <svg viewBox="0 0 360 255">
          <defs>
            <marker
              id={`${id}-arrow`}
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M0 0L7 3.5L0 7Z" fill="#657b79" />
            </marker>
          </defs>
          <rect x="108" y="100" width="144" height="139" rx="20" className="electrolysis-case" />
          <path d="M121 135H168V224H121Z" fill="#c6d9d5" />
          <path d="M192 135H239V224H192Z" fill="#c0d7dc" />
          <rect
            x="174"
            y="108"
            width="12"
            height="118"
            rx="5"
            fill={film.watch || conducting ? '#b7c3a1' : '#d4ccc5'}
          />
          <rect x="132" y="120" width="8" height="105" rx="4" fill="#8c9991" />
          <rect x="210" y="120" width="8" height="105" rx="4" fill="#83989d" />
          <path d="M136 182V40H214V182" fill="none" stroke="#929c85" strokeWidth="3" />
          {(film.watch ? c === 0 : !closed) && (
            <path d="M203 40H214" stroke="#edf1e9" strokeWidth="9" />
          )}
          <rect x="157" y="24" width="36" height="32" rx="9" fill="#e6e8d6" stroke="#9aab91" />
          <path
            d="M136 145H55V109M214 145H305V109"
            fill="none"
            stroke="#a4bbb6"
            strokeWidth="9"
            strokeLinejoin="round"
          />
          {[55, 305].map((x, i) => (
            <g key={x}>
              <rect
                x={x - 23}
                y="105"
                width="46"
                height="113"
                rx="16"
                fill="#e1ebe7"
                stroke="#a9c0b9"
              />
              <rect
                x={x - 16}
                y={207 - Math.min(78, (i ? q.hydrogen : q.oxygen) * 1000 * amountScale)}
                width="32"
                height={Math.min(78, (i ? q.hydrogen : q.oxygen) * 1000 * amountScale)}
                rx="8"
                fill={i ? '#a6c6d0' : '#b3c6b0'}
              />
            </g>
          ))}
          <path
            d="M146 181H205"
            stroke="#657b79"
            fill="none"
            strokeWidth="2"
            markerEnd={`url(#${id}-arrow)`}
            opacity={moving ? 1 : 0.25}
          />
          {moving &&
            [0, 0.25, 0.5, 0.75].map((offset) => {
              const [x, y] = pointAt(cycle + offset);
              return <circle key={offset} cx={x} cy={y} r="3" fill="#75654c" />;
            })}
          {moving &&
            [0, 0.5].map((offset) => (
              <circle
                key={offset}
                cx={146 + ((cycle + offset) % 1) * 54}
                cy="181"
                r="3"
                fill="#698994"
              />
            ))}
        </svg>
        <b className="electrolysis-dc">DC</b>
        <b className="electrolysis-plus">＋</b>
        <b className="electrolysis-minus">−</b>
        <span className="electrolysis-oxygen">O₂</span>
        <span className="electrolysis-hydrogen">H₂</span>
        <span className="electrolysis-proton">H⁺ →</span>
        <span className="electrolysis-electron">e⁻</span>
      </div>
      <div className="electrolysis-electrodes">
        <span>{t('阳极')} ＋</span>
        <span>{t('阴极')} −</span>
      </div>
      <p className="electrolysis-equation">
        {c === 1
          ? '2 H₂O → O₂ + 4 H⁺ + 4 e⁻'
          : c === 2
            ? '4 H⁺ + 4 e⁻ → 2 H₂'
            : '2 H₂O → 2 H₂ + O₂'}
      </p>
      <div className="electrolysis-amounts">
        <span>
          O₂ <b>{(q.oxygen * 1000).toFixed(3)}</b>
        </span>
        <span>
          H₂ <b>{(q.hydrogen * 1000).toFixed(3)}</b>
        </span>
        <span>
          Q <b>{q.charge.toFixed(1)} C</b>
        </span>
      </div>
      <p className="electrolysis-status">
        {q.exhausted
          ? t('水已耗尽，稳态电流停止')
          : `${q.runningCurrent.toFixed(1)} A · ${time.toFixed(1)} s · ${V.toFixed(2)} V`}{' '}
        <span>{t('气体量 mmol')}</span>
      </p>
      {c === 5 && (
        <div className="electrolysis-energy">
          <span>
            {t('电输入')} {q.electricalPower.toFixed(2)} W
          </span>
          <span>
            {t('净放热')} {q.heatOut.toFixed(2)} W
          </span>
        </div>
      )}
      {!film.watch && (
        <div className="electrolysis-controls">
          {[
            {
              key: 'I',
              label: t('设定电流，A'),
              value: current,
              min: 0,
              max: 4,
              step: 0.1,
              set: setCurrent,
            },
            {
              key: 't',
              label: t('累计通电时间，s'),
              value: seconds,
              min: 0,
              max: 90,
              step: 1,
              set: setSeconds,
            },
            {
              key: 'V',
              label: t('单元电压，V'),
              value: voltage,
              min: 1.25,
              max: 2.2,
              step: 0.05,
              set: setVoltage,
            },
            {
              key: 'water',
              label: t('初始水量，mmol'),
              value: water,
              min: 0.1,
              max: 2,
              step: 0.1,
              set: setWater,
            },
          ].map((control) => (
            <label key={control.key} htmlFor={`${id}-${control.key}`}>
              {control.label} · {control.value}
              <input
                id={`${id}-${control.key}`}
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={control.value}
                onChange={(e) => control.set(+e.target.value)}
              />
            </label>
          ))}
          <button aria-pressed={closed} onClick={() => setClosed(!closed)}>
            {t('外部电路闭合')}
          </button>
          <button aria-pressed={conducting} onClick={() => setConducting(!conducting)}>
            {t('膜允许质子通过')}
          </button>
          <p>
            {t('电输入')} {q.electricalPower.toFixed(2)} W · {t('净放热')} {q.heatOut.toFixed(2)} W
          </p>
        </div>
      )}
      <details>
        <summary>{t('为何是 2∶1，为什么电压也要算？')}</summary>
        <p>
          {t(
            '本片只表示 PEM 水电解，阳极氧化为正、阴极还原为负；H⁺ 穿膜，电子不穿膜。理想法拉第效率 100%，n(H₂)=Q/(2F)，n(O₂)=Q/(4F)，耗水等于产氢物质的量。固定毫米摩尔刻度，收集条不表示气压或体积。电子点是载流路径示意，非分子计数或迁移速度。开路、膜不导离子或水耗尽时，不保留持续电流；忽略启动双电层瞬态。',
          )}
        </p>
        <p>
          {t(
            '电流由理想电源设定，电压独立用于标准状态能量记账，不预测真实极化曲线。298.15 K、标准态且水为液体，产氢焓约 285.8 kJ/mol，吉布斯自由能约 237.1 kJ/mol；净放热=VI−产氢焓率，负值代表需要吸热。实际需考虑温度、压强、过电位、传质与气体交叉。教学模型，不是接线、制氢或气体混合实验指导；氢氧混合及点火有危险。',
          )}
        </p>
      </details>
    </section>
  );
}
