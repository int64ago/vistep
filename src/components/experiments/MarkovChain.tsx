import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  markovPath,
  markovStationary,
  markovStep,
  markovTrace,
  type MarkovDistribution,
} from '../../models/markov-chain';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/markov-chain.css';
const percent = (v: number) => `${Math.round(v * 1000) / 10}%`;
export default function MarkovChain() {
  const d = useShowcase(),
    id = useId(),
    [alpha, setAlpha] = useState(0.2),
    [beta, setBeta] = useState(0.3),
    [step, setStep] = useState(1),
    [seed, setSeed] = useState(7);
  const c = d.watch ? Math.min(6, d.chapter) : 2,
    p = d.watch ? d.chapterProgress : 1,
    a = d.watch ? (c === 4 ? 0.5 : c === 5 ? 1 : c === 6 ? 0 : 0.2) : alpha,
    b = d.watch ? (c === 4 ? 0.1 : c === 5 ? 1 : c === 6 ? 0 : 0.3) : beta,
    n = d.watch
      ? c < 2
        ? 0
        : c === 3
          ? Math.min(15, Math.floor(p * 16))
          : c === 5
            ? Math.min(8, Math.floor(p * 9))
            : c === 6
              ? 0
              : Math.min(15, 2 + Math.floor(p * 14))
      : step,
    stationary = markovStationary(a, b),
    initial: MarkovDistribution =
      d.watch && c === 3 ? [0.6, 0.4] : d.watch && c === 6 && p >= 0.5 ? [0.25, 0.75] : [1, 0],
    source = markovTrace(a, b, n, initial)[n],
    next = markovStep(source, a, b),
    path = markovPath(a, b, 20, 0, d.watch ? 7 : seed),
    flows = [
      { from: 0, to: 0, mass: source[0] * (1 - a) },
      { from: 0, to: 1, mass: source[0] * a },
      { from: 1, to: 0, mass: source[1] * b },
      { from: 1, to: 1, mass: source[1] * (1 - b) },
    ];
  return (
    <section className="markov-study" data-watch={d.watch} aria-label={t('马尔可夫转移与稳态实验')}>
      <header>
        <span>MARKOV / FLOW</span>
        <b>{t('第 {0} → {1} 步', n, n + 1)}</b>
      </header>
      {d.watch && c === 0 ? (
        <div className="markov-start">
          <b>A</b>
          <span>P</span>
          <b>B</b>
        </div>
      ) : (
        <div className="markov-loom">
          <div className="markov-marginal">
            {source.map((mass, i) => (
              <div key={i} data-state={i}>
                <b>{i === 0 ? 'A' : 'B'}</b>
                <strong>{percent(mass)}</strong>
              </div>
            ))}
          </div>
          <svg
            viewBox="0 0 360 180"
            preserveAspectRatio="none"
            role="img"
            aria-label={t('带宽表示从当前分布流向下一分布的概率质量')}
          >
            {flows
              .filter((f) => f.mass > 0)
              .map((f) => (
                <path
                  key={`${f.from}-${f.to}`}
                  d={`M0 ${f.from ? 135 : 45} C135 ${f.from ? 135 : 45} 225 ${f.to ? 135 : 45} 360 ${f.to ? 135 : 45}`}
                  data-from={f.from}
                  style={{ strokeWidth: f.mass * 40 }}
                />
              ))}
          </svg>
          <div className="markov-marginal">
            {next.map((mass, i) => (
              <div key={i} data-state={i}>
                <b>{i === 0 ? 'A' : 'B'}</b>
                <strong>{percent(mass)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
      {!(d.watch && c === 3) && (
        <table className="markov-matrix">
          <thead>
            <tr>
              <th>{t('从 / 到')}</th>
              <th>A</th>
              <th>B</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>A</th>
              <td>{percent(1 - a)}</td>
              <td>{percent(a)}</td>
            </tr>
            <tr>
              <th>B</th>
              <td>{percent(b)}</td>
              <td>{percent(1 - b)}</td>
            </tr>
          </tbody>
        </table>
      )}
      {c >= 2 || !d.watch ? (
        <p className="markov-stationary">
          {stationary.unique ? (
            <>
              π = ({percent(stationary.distribution![0])}, {percent(stationary.distribution![1])})
            </>
          ) : (
            t('稳态不唯一；每个初始分布都保持。')
          )}
        </p>
      ) : (
        <p className="markov-stationary">{t('每行是给定当前状态的下一步概率。')}</p>
      )}
      {((d.watch && c === 3) || !d.watch) && (
        <div className="markov-path">
          <span>{t('一条从 A 开始的轨迹')}</span>
          <div>
            {path.states.slice(0, d.watch ? Math.min(16, n + 1) : n + 1).map((state, i) => (
              <b key={i} data-state={state}>
                {state === 0 ? 'A' : 'B'}
              </b>
            ))}
          </div>
        </div>
      )}
      {!d.watch && (
        <div className="markov-controls">
          <label htmlFor={`${id}-a`}>P(A→B) · {percent(alpha)}</label>
          <input
            id={`${id}-a`}
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={alpha}
            onChange={(e) => setAlpha(+e.target.value)}
          />
          <label htmlFor={`${id}-b`}>P(B→A) · {percent(beta)}</label>
          <input
            id={`${id}-b`}
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={beta}
            onChange={(e) => setBeta(+e.target.value)}
          />
          <label htmlFor={`${id}-step`}>
            {t('分布更新步数')} · {step}
          </label>
          <input
            id={`${id}-step`}
            type="range"
            min="0"
            max="20"
            value={step}
            onChange={(e) => setStep(+e.target.value)}
          />
          <label htmlFor={`${id}-seed`}>
            {t('轨迹种子')} · {seed}
          </label>
          <input
            id={`${id}-seed`}
            type="range"
            min="1"
            max="9"
            value={seed}
            onChange={(e) => setSeed(+e.target.value)}
          />
        </div>
      )}
      <details>
        <summary>{t('分布不变，不是每个个体不动')}</summary>
        <p>
          {t(
            '固定二状态齐次链，分布按行向量 p下一步=pP 更新。带宽是 pᵢPᵢⱼ，不只是条件转移概率。πP=π 是稳态，不保证从任意初始分布收敛；周期交替是反例。固定伪随机种子只用于可重现的单轨迹，不把单条轨迹的有限频率当作精确分布。',
          )}
        </p>
      </details>
    </section>
  );
}
