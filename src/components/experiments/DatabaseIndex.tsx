import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import {
  diBuild,
  diDataset,
  diFilm,
  diInsert,
  diParse,
  diQuery,
  diShot,
  type DiChange,
} from '../../models/database-index';
import { DiChangeView, DiComparePlans, DiLeafRibbon, DiQueryView } from '../lab/DatabaseIndexPages';
import '../../styles/database-index.css';
const titles = [
  '先逐页翻完这张表',
  '分隔键，是通往下一页的路标',
  '沿着页号，找到同一条记录',
  '少翻了几页，账要算完整',
  '范围查询，顺着叶页接着走',
  '叶页满了，把新邻居接进来',
  '分裂向上传，直到长出新根',
  '读得越多，索引越不占便宜',
];
export default function DatabaseIndex() {
  const director = useShowcase(),
    id = useId();
  const film = useMemo(() => diFilm(), []);
  const [seed, setSeed] = useState(19),
    [low, setLow] = useState('63'),
    [high, setHigh] = useState('63'),
    [plan, setPlan] = useState<'index' | 'scan'>('index');
  const [insertKey, setInsertKey] = useState('79'),
    [keys, setKeys] = useState<number[]>([]),
    [step, setStep] = useState(0),
    [view, setView] = useState<'query' | 'split'>('query'),
    [event, setEvent] = useState(0),
    [details, setDetails] = useState(false);
  const manual = useMemo(() => {
    let tree = diBuild(diDataset(seed));
    let changes: DiChange[] = [];
    for (const key of keys) {
      const inserted = diInsert(tree, key);
      tree = inserted.tree;
      changes = inserted.changes;
    }
    return { tree, changes };
  }, [seed, keys]);
  const parsedLow = diParse(low),
    parsedHigh = diParse(high),
    parsedInsert = diParse(insertKey);
  const valid = parsedLow !== null && parsedHigh !== null && parsedLow <= parsedHigh;
  const query = useMemo(
    () => (valid ? diQuery(manual.tree, parsedLow!, parsedHigh!, plan) : null),
    [manual, parsedLow, parsedHigh, plan, valid],
  );
  const shot = diShot(film, director.chapter, director.chapterProgress),
    chapter = shot.chapter;
  const reset = () => {
    setSeed(19);
    setLow('63');
    setHigh('63');
    setPlan('index');
    setInsertKey('79');
    setKeys([]);
    setStep(0);
    setView('query');
    setEvent(0);
    setDetails(false);
  };
  const totalSteps = view === 'split' ? manual.changes.length : (query?.steps.length ?? 1);
  const activeStep = Math.min(view === 'split' ? event : step, Math.max(0, totalSteps - 1));
  const updateStep = (v: number) => (view === 'split' ? setEvent(v) : setStep(v));
  return (
    <section
      className="database-index-study"
      data-watch={director.watch}
      data-chapter={chapter}
      aria-label={t('数据库索引页实验')}
    >
      <header className="di-heading">
        <span>B+ TREE</span>
        <span>{t('微型页模型')}</span>
      </header>
      <h3>{t(director.watch ? titles[chapter] : '亲手查找与插入')}</h3>
      <div className="di-film-surface">
        {director.watch ? (
          <>
            {(chapter === 0 || chapter === 1 || chapter === 2) && shot.query && (
              <DiQueryView
                tree={shot.tree}
                query={shot.query}
                cursor={shot.cursor}
                low={film.point}
                high={film.point}
                rootOnly={chapter === 1}
              />
            )}
            {chapter === 3 && (
              <DiComparePlans
                tree={film.base}
                index={diQuery(film.base, film.point)}
                scan={diQuery(film.base, film.point, film.point, 'scan')}
                progress={shot.progress}
              />
            )}
            {chapter === 4 && shot.query && (
              <div className="di-range-scene">
                <DiQueryView
                  tree={shot.tree}
                  query={shot.query}
                  cursor={shot.cursor}
                  low={film.low}
                  high={film.high}
                />
                <DiLeafRibbon tree={shot.tree} low={film.low} high={film.high} />
              </div>
            )}
            {(chapter === 5 || chapter === 6) && shot.change && (
              <DiChangeView change={shot.change} added={shot.added} />
            )}
            {chapter === 7 && shot.query && (
              <DiComparePlans
                tree={film.grown}
                index={shot.query}
                scan={diQuery(film.grown, 0, 99, 'scan')}
                progress={shot.progress}
                wide
              />
            )}
          </>
        ) : view === 'split' && manual.changes.length ? (
          <DiChangeView change={manual.changes[activeStep]} added={keys.length} />
        ) : query ? (
          <DiQueryView
            tree={manual.tree}
            query={query}
            cursor={activeStep}
            low={parsedLow!}
            high={parsedHigh!}
          />
        ) : (
          <p className="di-input-error" role="status">
            {t('请输入 0 到 99 的整数，且下界不大于上界。')}
          </p>
        )}
      </div>
      {!director.watch && (
        <div className="di-explore">
          <div className="di-input-grid">
            <label htmlFor={`${id}-low`}>
              {t('查询下界')}
              <input
                id={`${id}-low`}
                value={low}
                inputMode="numeric"
                onChange={(e) => {
                  setLow(e.target.value);
                  setStep(0);
                  setView('query');
                }}
              />
            </label>
            <label htmlFor={`${id}-high`}>
              {t('查询上界')}
              <input
                id={`${id}-high`}
                value={high}
                inputMode="numeric"
                onChange={(e) => {
                  setHigh(e.target.value);
                  setStep(0);
                  setView('query');
                }}
              />
            </label>
            <label htmlFor={`${id}-plan`}>
              {t('访问路线')}
              <select
                id={`${id}-plan`}
                value={plan}
                onChange={(e) => {
                  setPlan(e.target.value as typeof plan);
                  setView('query');
                  setStep(0);
                }}
              >
                <option value="index">{t('B+ 树查找')}</option>
                <option value="scan">{t('全表扫描')}</option>
              </select>
            </label>
            <label htmlFor={`${id}-seed`}>
              {t('同一数据的堆顺序')}
              <select
                id={`${id}-seed`}
                value={seed}
                onChange={(e) => {
                  setSeed(Number(e.target.value));
                  setKeys([]);
                  setStep(0);
                  setView('query');
                  setEvent(0);
                }}
              >
                <option value="19">{t('排列 A')}</option>
                <option value="7">{t('排列 B')}</option>
              </select>
            </label>
          </div>
          <div className="di-step-control">
            <label htmlFor={`${id}-step`}>
              {t('访问或分裂步骤')}{' '}
              <output>
                {activeStep + 1} / {totalSteps || 1}
              </output>
            </label>
            <input
              id={`${id}-step`}
              type="range"
              min="0"
              max={Math.max(0, totalSteps - 1)}
              value={activeStep}
              aria-label={t('访问或分裂步骤')}
              onChange={(e) => updateStep(Number(e.target.value))}
            />
            <div>
              <button
                type="button"
                disabled={activeStep === 0}
                onClick={() => updateStep(activeStep - 1)}
              >
                {t('上一步')}
              </button>
              <button
                type="button"
                disabled={activeStep >= totalSteps - 1}
                onClick={() => updateStep(activeStep + 1)}
              >
                {t('下一步')}
              </button>
            </div>
          </div>
          <div className="di-insert-control">
            <label htmlFor={`${id}-insert`}>
              {t('新记录的键值')}
              <input
                id={`${id}-insert`}
                value={insertKey}
                inputMode="numeric"
                onChange={(e) => setInsertKey(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={parsedInsert === null || keys.length >= 30}
              onClick={() => {
                if (parsedInsert !== null) {
                  setKeys([...keys, parsedInsert]);
                  setEvent(0);
                  setView('split');
                  setStep(0);
                }
              }}
            >
              {t('插入一行')}
            </button>
            <button
              type="button"
              onClick={() => {
                setView(view === 'query' && manual.changes.length ? 'split' : 'query');
              }}
              disabled={!manual.changes.length}
            >
              {t(view === 'split' ? '返回查询' : '看最近一次插入')}
            </button>
          </div>
          <p>{t('最多新增 30 行；同键保留不同的行号。切换堆顺序会重新开始。')}</p>
          <div className="di-manual-actions">
            <button type="button" onClick={reset}>
              {t('重置全部输入')}
            </button>
            <button type="button" aria-expanded={details} onClick={() => setDetails(!details)}>
              {t('页与计数规则')}
            </button>
          </div>
          {details && (
            <p className="di-rules">
              {t(
                '键值按整数升序，同键按行号升序。内部页最多 4 个子页，叶页最多 3 项，堆页最多 4 行。每次查询从空缓存开始，已读页保留；统计触及的不同页与比较器调用次数，不测耗时。不模拟删除、事务或并发。',
              )}
            </p>
          )}
        </div>
      )}
      <footer className="di-film-note">
        {t(
          director.watch && (chapter === 5 || chapter === 6)
            ? '分裂的局部快照；提交后整树平衡。'
            : '微型页：I 为索引，H 为堆；计数不是耗时。',
        )}
      </footer>
    </section>
  );
}
