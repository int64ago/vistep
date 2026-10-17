import { useId, useState } from 'react';
import { t } from '../../i18n';
import { groundFaultBreaker } from '../../models/ground-fault-breaker';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/ground-fault-breaker.css';
export default function GroundFaultBreaker() {
  const film = useShowcase(),
    id = useId().replace(/:/g, '');
  const [mode, setMode] = useState<'earth' | 'test' | 'balanced'>('earth'),
    [load, setLoad] = useState(5),
    [leak, setLeak] = useState(40),
    [time, setTime] = useState(50),
    [clears, setClears] = useState(false),
    [reset, setReset] = useState<number | null>(null);
  const c = film.watch ? Math.min(6, film.chapter) : 2,
    p = film.watch ? film.chapterProgress : 1;
  const circuit = film.watch
    ? c === 0 || c === 1
      ? 'balanced'
      : c === 5
        ? 'test'
        : 'earth'
    : mode;
  const loadA = film.watch ? (c === 1 ? (p < 0.5 ? 2 : 12) : 5) : load;
  const seconds = film.watch
    ? c < 2
      ? 0.02
      : c === 2
        ? 0.049
        : c === 3
          ? 0.04 + 0.045 * Math.min(1, p / 0.7)
          : c === 4
            ? 0.14
            : c === 5
              ? p < 0.5
                ? 0.049
                : 0.08
              : 0.18
    : time / 1000;
  const earthMA = circuit === 'earth' ? (film.watch ? 40 : leak) : 0,
    testMA = circuit === 'test' ? 40 : 0;
  const clearAt = film.watch ? (c === 4 || c === 6 ? 0.1 : null) : clears ? 0.1 : null,
    resetAt = film.watch ? (c === 6 ? 0.16 : null) : reset;
  const q = groundFaultBreaker({ loadA, earthMA, testMA, seconds, clearAt, resetAt });
  const changeMode = (value: typeof mode) => {
    setMode(value);
    setReset(null);
  };
  return (
    <section
      className="ground-fault-study"
      data-watch={film.watch}
      aria-label={t('单相交流漏电保护的差流与锁扣')}
    >
      <header>
        <span>RESIDUAL CURRENT / RCD</span>
        <b>{t('比较去、回电流')}</b>
      </header>
      <div
        className="ground-fault-circuit"
        data-test={circuit === 'test'}
        role="img"
        aria-label={t('L 与 N 同穿检测环，旁路电流造成不抵消的磁作用')}
      >
        <svg viewBox="0 0 360 250">
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
              <path d="M0 0L7 3.5L0 7Z" fill="#8f7054" />
            </marker>
          </defs>
          <ellipse cx="145" cy="110" rx="30" ry="66" fill="#c5b69a" />
          <ellipse cx="145" cy="110" rx="22" ry="55" fill="#f0eee5" />
          <path
            d="M20 65H65M95 65H290V155H95M65 155H20"
            stroke="#9f8c6c"
            strokeWidth="3"
            fill="none"
            strokeLinejoin="round"
          />
          <path
            d={q.closed ? 'M65 65H95M65 155H95' : 'M65 65L91 45M65 155L91 135'}
            stroke="#87765d"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M78 76V133" stroke="#b9ad95" strokeWidth="2" strokeDasharray="3 4" />
          <rect x="276" y="90" width="28" height="40" rx="8" fill="#d9d4c0" stroke="#b7ae91" />
          {q.lineA > 0 && (
            <>
              <path
                d="M185 65H215"
                stroke="#8f7054"
                strokeWidth="2"
                markerEnd={`url(#${id}-arrow)`}
              />
            </>
          )}
          {q.neutralA > 0 && (
            <path
              d="M215 155H185"
              stroke="#8f7054"
              strokeWidth="2"
              markerEnd={`url(#${id}-arrow)`}
            />
          )}
          {circuit === 'earth' && q.active && (
            <>
              <path
                d="M250 65V222H20V155"
                stroke={q.earthA > 0 ? '#a78559' : '#c4bda8'}
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="6 4"
              />
              <path
                d="M213 222H185"
                stroke="#8f7054"
                strokeWidth="2"
                markerEnd={`url(#${id}-arrow)`}
              />
              <path
                d="M100 222V231M88 231H112M92 237H108M97 243H103"
                stroke="#8d8669"
                strokeWidth="1.5"
              />
            </>
          )}
          {circuit === 'test' && (
            <>
              <path
                d="M40 65V20H240V155"
                stroke={q.testA > 0 ? '#9b7d68' : '#c4b9ab'}
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M160 20L165 14L171 26L177 14L183 26L189 20"
                stroke="#8d7566"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M205 20H225"
                stroke="#8f7054"
                strokeWidth="2"
                markerEnd={`url(#${id}-arrow)`}
              />
            </>
          )}
          <path
            d="M166 71C183 71 183 83 166 83M171 93C188 93 188 105 171 105M171 115C188 115 188 127 171 127M166 137C183 137 183 149 166 149"
            fill="none"
            stroke="#ad8e69"
            strokeWidth="2"
          />
          <path d="M181 109H219V117H228" fill="none" stroke="#b6a18a" strokeWidth="2" />
          <rect
            x="209"
            y="91"
            width="37"
            height="35"
            rx="9"
            fill={q.closed ? '#e1dfcd' : '#cfb7a2'}
            stroke="#b9ac91"
          />
          <path
            d="M208 116H193V186H78V166"
            fill="none"
            stroke="#b9ad95"
            strokeWidth="1.5"
            strokeDasharray="3 4"
          />
          {q.residualMA > 0 && (
            <path
              d={
                q.signedResidualA > 0
                  ? 'M130 76C120 103 120 132 132 149'
                  : 'M132 149C120 132 120 103 130 76'
              }
              fill="none"
              stroke="#9a7857"
              strokeWidth={Math.min(5, q.residualMA / 15)}
              markerEnd={`url(#${id}-arrow)`}
            />
          )}
        </svg>
        <span className="ground-fault-L">L</span>
        <span className="ground-fault-N">N</span>
        <span className="ground-fault-load">{t('负载')}</span>
        <span className="ground-fault-ring">{t('共同检测环')}</span>
        {circuit === 'test' && <span className="ground-fault-test">{t('内部测试旁路')}</span>}
        {circuit === 'earth' && q.active && (
          <span className="ground-fault-earth">{t('环外返回')}</span>
        )}
      </div>
      <div className="ground-fault-current">
        <span>
          I<sub>L</sub>
          <b>{q.lineA.toFixed(3)} A</b>
        </span>
        <span>
          I<sub>N</sub>
          <b>{q.neutralA.toFixed(3)} A</b>
        </span>
        <span>
          I<sub>Δ</sub>
          <b>{q.residualMA.toFixed(1)} mA</b>
        </span>
      </div>
      <p className="ground-fault-contact" data-open={!q.closed}>
        {q.closed ? t('触点闭合') : t('锁扣已跳开')} · t = {(seconds * 1000).toFixed(0)} ms
      </p>
      <p className="ground-fault-memory">
        {q.trips.length
          ? `${t('跳闸前差流')} ${q.detectedResidualMA.toFixed(0)} mA · ${t('首次跳闸')} ${(q.trips[0] * 1000).toFixed(0)} ms`
          : `${t('示例门槛')} 30 mA · ${t('示例持续时间')} 20 ms`}
      </p>
      {!film.watch && (
        <div className="ground-fault-controls">
          <div className="ground-fault-modes">
            {(['balanced', 'earth', 'test'] as const).map((value) => (
              <button key={value} aria-pressed={mode === value} onClick={() => changeMode(value)}>
                {value === 'balanced'
                  ? t('平衡回路')
                  : value === 'earth'
                    ? t('环外漏电')
                    : t('内部测试')}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-load`}>
            {t('平衡负载电流，A')} · {load}
            <input
              id={`${id}-load`}
              type="range"
              min="0"
              max="20"
              step="1"
              value={load}
              onChange={(e) => setLoad(+e.target.value)}
            />
          </label>
          {mode === 'earth' && (
            <label htmlFor={`${id}-leak`}>
              {t('环外差流，mA')} · {leak}
              <input
                id={`${id}-leak`}
                type="range"
                min="0"
                max="80"
                step="1"
                value={leak}
                onChange={(e) => setLeak(+e.target.value)}
              />
            </label>
          )}
          <label htmlFor={`${id}-time`}>
            {t('事件时间，ms')} · {time}
            <input
              id={`${id}-time`}
              type="range"
              min="0"
              max="200"
              step="1"
              value={time}
              onChange={(e) => setTime(+e.target.value)}
            />
          </label>
          {mode !== 'balanced' && (
            <button
              aria-pressed={clears}
              onClick={() => {
                setClears(!clears);
                setReset(null);
              }}
            >
              {t('在 100 ms 消除故障')}
            </button>
          )}
          {!q.closed && <button onClick={() => setReset(time / 1000)}>{t('此时重新合闸')}</button>}
        </div>
      )}
      <details>
        <summary>{t('示例差流，不是完整电气安全判定')}</summary>
        <p>
          {t(
            '这是单相、同相正弦交流、理想 RMS 检测的 RCD/RCCB 教学模型。L、N 在同一磁环内的安匝相抵，环外返回造成剩余；内部测试从环前 L 接到环后 N，不需要经过 PE。示例门槛 30 mA 和持续 20 ms 只是可观察的逻辑，不是实际产品动作曲线、人体安全电流或合规规格。',
          )}
        </p>
        <p>
          {t(
            '触点跳开后需重新合闸；若差流仍在，模型会再次跳开。故障消失不等于自动恢复供电。纯差流功能不判断过载、L/N 间平衡故障、全部触电或电弧；RCBO 另含过流功能。未模拟直流、各型 RCD 的频率适用、接线故障或开断电弧。示意不是接线与带电测试指导；实际安装、检测和维修应交合格专业人员。',
          )}
        </p>
      </details>
    </section>
  );
}
