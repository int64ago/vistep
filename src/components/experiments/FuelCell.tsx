import { useId, useState } from 'react';
import { t } from '../../i18n';
import { fuelCell } from '../../models/fuel-cell';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/fuel-cell.css';

export default function FuelCell() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [load, setLoad] = useState(0.5),
    [internal, setInternal] = useState(0.2),
    [time, setTime] = useState(60),
    [hydrogen, setHydrogen] = useState(2),
    [oxygen, setOxygen] = useState(1),
    [closed, setClosed] = useState(true),
    [conducting, setConducting] = useState(true);
  const c = film.watch ? Math.min(6, film.chapter) : 3,
    p = film.watch ? film.chapterProgress : 1;
  const resistance = film.watch ? (c === 4 ? (p < 0.5 ? 2 : 0.2) : c === 5 ? 0.05 : 0.5) : load;
  const seconds = film.watch
    ? c === 0
      ? 0
      : c === 1
        ? 2
        : c === 2
          ? 20
          : c === 6
            ? 30 * Math.min(1, p / 0.65)
            : 60
    : time;
  const q = fuelCell({
    resistance,
    internalResistance: film.watch ? 0.2 : internal,
    seconds,
    hydrogenMMol: film.watch ? 2 : hydrogen,
    oxygenMMol: film.watch ? (c === 6 ? 0.1 : 1) : oxygen,
    circuitClosed: film.watch ? c !== 0 : closed,
    membraneConducting: film.watch || conducting,
  });
  const moving = q.current > 0,
    cycle = film.watch ? p * 3 : q.charge / 100;
  const electricalFraction = q.enthalpyRate > 0 ? q.electricalPower / q.enthalpyRate : 0;
  const electronAt = (f: number) => {
    let distance = (((f % 1) + 1) % 1) * 310;
    if (distance < 105) return [115, 145 - distance];
    distance -= 105;
    if (distance < 100) return [115 + distance, 40];
    distance -= 100;
    return [215, 40 + distance];
  };
  return (
    <section
      className="fuel-cell-study"
      data-watch={film.watch}
      aria-label={t('PEM 燃料电池的物质与功率收支')}
    >
      <header>
        <span>PEM / FUEL CELL</span>
        <b>{t('两条载流路，一个外部负载')}</b>
      </header>
      <div
        className="fuel-cell-cutaway"
        role="img"
        aria-label={t('氢在负阳极氧化，电子经过负载，质子穿膜，正阴极生成水')}
      >
        <svg viewBox="0 0 360 230">
          <defs>
            <marker
              id={`${id}-feed`}
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M0 0L7 3.5L0 7Z" fill="#87756b" />
            </marker>
            <linearGradient id={`${id}-layer`} x1="0" x2="1">
              <stop stopColor="#cbb9b0" />
              <stop offset="1" stopColor="#ddcec2" />
            </linearGradient>
          </defs>
          <path d="M115 145V40H215V145" fill="none" stroke="#b1a28a" strokeWidth="3" />
          {(film.watch ? c === 0 : !closed) && (
            <path d="M202 40H215" stroke="#f0eae3" strokeWidth="10" />
          )}
          <circle cx="175" cy="40" r="21" fill={moving ? '#e5d6b3' : '#e6ded1'} stroke="#b2a388" />
          <path
            d="M166 43L172 34L178 46L184 37"
            fill="none"
            stroke="#877255"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={moving ? 0.55 + Math.min(1, q.electricalPower / 2) * 0.45 : 0.25}
          />
          <path d="M90 90H134L145 101V207H101L90 196Z" fill={`url(#${id}-layer)`} />
          <path
            d="M145 101L134 90H175L186 101V207H145Z"
            fill={film.watch || conducting ? '#c6c9b0' : '#d5c8bf'}
          />
          <path d="M186 101L175 90H219L230 101V207H186Z" fill="#b9c9c5" />
          <path
            d="M101 109V188M111 109V188M121 109V188"
            stroke="#ab9489"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M198 111V189M208 111V189M218 111V189"
            stroke="#92aaa5"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M151 108V196M160 108V196M169 108V196M178 108V196"
            stroke="#e1e3cd"
            strokeWidth="2"
            strokeDasharray="4 5"
          />
          <path
            d="M34 144H94M333 124H231M231 180H320V215"
            fill="none"
            stroke="#87756b"
            strokeWidth="2"
            strokeLinejoin="round"
            markerEnd={`url(#${id}-feed)`}
          />
          <path
            d="M126 158H199"
            fill="none"
            stroke="#6d817c"
            strokeWidth="2"
            markerEnd={`url(#${id}-feed)`}
            opacity={moving ? 1 : 0.25}
          />
          {moving &&
            [0, 0.25, 0.5, 0.75].map((offset) => {
              const [x, y] = electronAt(cycle + offset);
              return <circle key={offset} cx={x} cy={y} r="3" fill="#90704e" />;
            })}
          {moving &&
            [0, 0.5].map((offset) => (
              <circle
                key={offset}
                cx={130 + ((cycle + offset) % 1) * 63}
                cy="158"
                r="3"
                fill="#6f8f89"
              />
            ))}
        </svg>
        <b className="fuel-cell-load">R</b>
        <span className="fuel-cell-hydrogen">H₂ →</span>
        <span className="fuel-cell-oxygen">← O₂</span>
        <span className="fuel-cell-water">H₂O ↓</span>
        <span className="fuel-cell-protons">H⁺ →</span>
        <span className="fuel-cell-electrons">e⁻ →</span>
      </div>
      <div className="fuel-cell-polarity">
        <span>{t('阳极')} −</span>
        <span>{t('阴极')} ＋</span>
      </div>
      <p className="fuel-cell-reaction">
        {c === 1
          ? '2 H₂ → 4 H⁺ + 4 e⁻'
          : c === 2
            ? 'O₂ + 4 H⁺ + 4 e⁻ → 2 H₂O'
            : '2 H₂ + O₂ → 2 H₂O'}
      </p>
      <div className="fuel-cell-power">
        <span>
          {t('电输出')}
          <b>{q.electricalPower.toFixed(2)} W</b>
        </span>
        <span>
          {t('总放热')}
          <b>{q.heatOut.toFixed(2)} W</b>
        </span>
        <span>
          {t('焓效率')}
          <b>{q.efficiency === null ? '—' : `${(100 * q.efficiency).toFixed(1)}%`}</b>
        </span>
      </div>
      <div className="fuel-cell-energy-strip" aria-label={t('反应焓分配为电输出与总放热')}>
        <i style={{ width: `${electricalFraction * 100}%` }} />
        <i style={{ width: `${moving ? (1 - electricalFraction) * 100 : 0}%` }} />
      </div>
      {!q.exhausted && (
        <p className="fuel-cell-meter">
          {q.current.toFixed(2)} A · {q.voltage === null ? '—' : q.voltage.toFixed(3)} V · R ={' '}
          {resistance.toFixed(2)} Ω
        </p>
      )}
      <div className="fuel-cell-material">
        <span>
          {t('耗氢')} {(q.usedHydrogen * 1000).toFixed(3)}
        </span>
        <span>
          {t('耗氧')} {(q.usedOxygen * 1000).toFixed(3)}
        </span>
        <span>
          {t('产水')} {(q.water * 1000).toFixed(3)} mmol
        </span>
      </div>
      {q.exhausted && (
        <p className="fuel-cell-empty">
          {t('反应物耗尽，持续电流停止')} · {t('剩余氢')} {(q.hydrogenRemaining * 1000).toFixed(3)}{' '}
          mmol
        </p>
      )}
      {!film.watch && (
        <div className="fuel-cell-controls">
          {[
            {
              key: 'R',
              label: t('外负载，Ω'),
              value: load,
              min: 0.05,
              max: 3,
              step: 0.05,
              set: setLoad,
            },
            {
              key: 'r',
              label: t('内部等效电阻，Ω'),
              value: internal,
              min: 0.1,
              max: 0.5,
              step: 0.05,
              set: setInternal,
            },
            {
              key: 'time',
              label: t('经过时间，s'),
              value: time,
              min: 0,
              max: 90,
              step: 1,
              set: setTime,
            },
            {
              key: 'hydrogen',
              label: t('供氢额度，mmol'),
              value: hydrogen,
              min: 0.1,
              max: 2,
              step: 0.1,
              set: setHydrogen,
            },
            {
              key: 'oxygen',
              label: t('供氧额度，mmol'),
              value: oxygen,
              min: 0.05,
              max: 1,
              step: 0.05,
              set: setOxygen,
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
            {t('负载回路闭合')}
          </button>
          <button aria-pressed={conducting} onClick={() => setConducting(!conducting)}>
            {t('膜允许质子通过')}
          </button>
          <p>
            {t('剩余氢')} {(q.hydrogenRemaining * 1000).toFixed(3)} · {t('剩余氧')}{' '}
            {(q.oxygenRemaining * 1000).toFixed(3)} mmol
          </p>
        </div>
      )}
      <details>
        <summary>{t('电压模型、放热与阳极的含义')}</summary>
        <p>
          {t(
            'PEM 燃料电池负阳极氧化氢，正阴极还原氧并产水。阳极指氧化，阴极指还原，不固定代表正或负。H⁺ 穿膜，电子经过负载；电子流方向与常规电流方向相反。小点只示意路线。膜与电子回路都必须导通，任一反应物供给耗尽则稳态电流停止；忽略电容、气体交叉与泄漏。',
          )}
        </p>
        <p>
          {t(
            '本片采用标准态液态水的 ΔG≈237.1、ΔH≈285.8 kJ/mol，E=ΔG/(2F)，负载 R 与等效内阻 r 给 I=E/(R+r)。不是实测极化曲线；忽略活化、传质、压强和温度响应，供料在额度耗尽前保持参考活度。外部电功率 I²R，内阻热 I²r，另有可逆熵热；两项放热加电输出等于反应焓率。效率按液态水焓口径，无辅机损耗。教学模型，不提供氢气储运、接线或混合气实验指导；氢氧混合与点火有危险。',
          )}
        </p>
      </details>
    </section>
  );
}
