import { useId, useState, type CSSProperties } from 'react';
import { t } from '../../i18n';
import { bayesUpdate } from '../../models/bayes-updating';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/bayes-updating.css';
const count = (n: number) => Math.round(n).toLocaleString('en-US');
export default function BayesUpdating() {
  const d = useShowcase(),
    id = useId(),
    [prior, setPrior] = useState(10),
    [hit, setHit] = useState(80),
    [otherHit, setOtherHit] = useState(10),
    [twice, setTwice] = useState(false),
    [independent, setIndependent] = useState(true);
  const c = d.watch ? Math.min(5, d.chapter) : 3,
    p = d.watch ? d.chapterProgress : 1;
  const priorValue = d.watch ? (c === 4 ? 0.01 : 0.1) : prior / 100,
    observations = d.watch ? (c === 5 ? 2 : 1) : twice ? 2 : 1;
  const fresh = d.watch ? c !== 5 || p >= 0.5 : independent;
  const q = bayesUpdate({
    prior: priorValue,
    hit: d.watch ? 0.8 : hit / 100,
    otherHit: d.watch ? 0.1 : otherHit / 100,
    observations,
    conditionallyIndependent: fresh,
  });
  const reveal = d.watch ? c >= 1 : true,
    filtered = d.watch ? c >= 2 : true,
    normalized = d.watch ? c >= 3 : true;
  const bandStyle = {
    '--blue-base': `${q.prior * 100}%`,
    '--blue-mark': `${q.blueLikelihood * 100}%`,
    '--other-mark': `${q.otherLikelihood * 100}%`,
    '--posterior': `${(q.posterior ?? 0) * 100}%`,
  } as CSSProperties;
  return (
    <section
      className="bayes-study"
      data-filtered={filtered}
      data-normalized={normalized}
      data-watch={d.watch}
      data-reveal={reveal}
      data-playing={d.playing}
      aria-label={t('贝叶斯自然频数实验')}
      style={bandStyle}
    >
      <header>
        <span>BAYES / {count(q.population)}</span>
        <span>{t('虚构纸签总体')}</span>
      </header>
      <div className="bayes-question">{t('看到星标，来自蓝色组的机会多大？')}</div>
      <div className="bayes-population">
        <div>
          <i />
          {t('蓝色组')}
          <strong>{count(q.blue)}</strong>
        </div>
        <div>
          <i />
          {t('非蓝色组')}
          <strong>{count(q.other)}</strong>
        </div>
      </div>
      <div
        className="bayes-cloth"
        role="img"
        aria-label={t('宽度表示基准率，高度表示各组出现星标的比例')}
      >
        <div className="bayes-blue">
          <div className="bayes-selected" />
          <div className="bayes-unselected" />
        </div>
        <div className="bayes-other">
          <div className="bayes-selected" />
          <div className="bayes-unselected" />
        </div>
        <div className="bayes-cloth-grid" />
      </div>
      {reveal && (
        <div className="bayes-frequencies">
          <div>
            <span>{'★ ' + t('蓝色组')}</span>
            <strong>{count(q.blueMarked)}</strong>
            <small>
              {(q.blueLikelihood * 100).toFixed(0)}% × {count(q.blue)}
            </small>
          </div>
          <div>
            <span>{'★ ' + t('非蓝色组')}</span>
            <strong>{count(q.otherMarked)}</strong>
            <small>
              {(q.otherLikelihood * 100).toFixed(0)}% × {count(q.other)}
            </small>
          </div>
        </div>
      )}
      {normalized && (
        <div className="bayes-normalized">
          <div className="bayes-keep">
            <span>★ {t('只保留有星标的纸签')}</span>
            <b>{count(q.selected)}</b>
          </div>
          <div className="bayes-posterior-bar">
            <span />
            <i />
          </div>
          <div className="bayes-result">
            <strong>{q.posterior === null ? '—' : `${(q.posterior * 100).toFixed(1)}%`}</strong>
            <span>
              {t('星标中的蓝色比例')}
              <b>
                {count(q.blueMarked)} / {count(q.selected)}
              </b>
            </span>
          </div>
        </div>
      )}
      {d.watch && c === 5 && (
        <p className="bayes-dependence">
          {t(fresh ? '新星标：给定组别后条件独立。' : '同一枚星标再看一次：没有新增证据。')}
        </p>
      )}
      {!d.watch && (
        <div className="bayes-controls">
          <label htmlFor={`${id}-prior`}>
            {t('蓝色基准率')} · {prior}%
          </label>
          <input
            id={`${id}-prior`}
            type="range"
            min="1"
            max="50"
            value={prior}
            onChange={(e) => setPrior(+e.target.value)}
          />
          <label htmlFor={`${id}-hit`}>
            {t('蓝色组出现星标')} · {hit}%
          </label>
          <input
            id={`${id}-hit`}
            type="range"
            min="10"
            max="100"
            step="10"
            value={hit}
            onChange={(e) => setHit(+e.target.value)}
          />
          <label htmlFor={`${id}-other`}>
            {t('非蓝组出现星标')} · {otherHit}%
          </label>
          <input
            id={`${id}-other`}
            type="range"
            min="0"
            max="50"
            step="10"
            value={otherHit}
            onChange={(e) => setOtherHit(+e.target.value)}
          />
          <button aria-pressed={twice} onClick={() => setTwice(!twice)}>
            {t(twice ? '观察两枚星标' : '观察一枚星标')}
          </button>
          {twice && (
            <button aria-pressed={independent} onClick={() => setIndependent(!independent)}>
              {t(independent ? '两次条件独立' : '实际是同一证据重复')}
            </button>
          )}
        </div>
      )}
      <details>
        <summary>{t('模型边界')}</summary>
        <p>
          {t(
            '宽度乘高度给出联合比例。后验只在证据总体中重新归一化；P(星标|蓝色) 不等于 P(蓝色|星标)。第二次乘似然的前提是给定组别后条件独立。数字为构造的纸签频数，不是医疗、检测或真实分类器的建议。',
          )}
        </p>
      </details>
    </section>
  );
}
