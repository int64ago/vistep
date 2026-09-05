import { t } from '../../i18n';
import {
  diHeight,
  diQuery,
  type diFilm,
  type diShot,
  diLeaves,
  type DiChange,
  type DiEntry,
  type DiPage,
  type DiQuery,
  type DiQueryStep,
  type DiTree,
} from '../../models/database-index';
export function DiPair({ entry }: { entry: DiEntry }) {
  return (
    <span className="di-pair">
      <b>{entry.key}</b>
      <span>{entry.rowId === 0 ? 'r0' : `r${entry.rowId}`}</span>
    </span>
  );
}
export function DiPageSheet({
  page,
  slot,
  highlight,
  target,
  compact = false,
}: {
  page: DiPage;
  slot?: number;
  highlight?: number[];
  target?: number;
  compact?: boolean;
}) {
  return (
    <div className="di-page" data-kind={page.kind} data-compact={compact}>
      <div className="di-page-tab">
        <span>{t(page.kind === 'leaf' ? '叶页' : '内部页')}</span>
        <b>I{page.id}</b>
      </div>
      {page.kind === 'leaf' ? (
        <>
          <div className="di-page-columns">
            <span>{t('键值')}</span>
            <span>{t('行号指针')}</span>
          </div>
          <div className="di-entries">
            {page.entries.map((e, i) => (
              <div
                className="di-entry"
                key={e.rowId}
                data-active={i === slot}
                data-match={highlight?.includes(e.rowId)}
              >
                <DiPair entry={e} />
              </div>
            ))}
          </div>
          <div className="di-page-tail">
            <span>{t('下一叶页')}</span>
            <b>{page.next === null ? '∅' : `→ I${page.next}`}</b>
          </div>
        </>
      ) : (
        <>
          <div className="di-page-columns">
            <span>{t('分隔键')}</span>
            <span>{t('右侧最小项')}</span>
          </div>
          <div className="di-separators">
            {page.keys.map((e, i) => (
              <div className="di-separator" data-active={i === slot} key={e.rowId}>
                <DiPair entry={e} />
                <span>→ I{page.children[i + 1]}</span>
              </div>
            ))}
          </div>
          <div className="di-children" aria-label={t('子页编号')}>
            {page.children.map((id) => (
              <span key={id} data-active={target === id}>
                I{id}
              </span>
            ))}
          </div>
          <div className="di-page-tail">
            <span>{t('最左子页')}</span>
            <b>← I{page.children[0]}</b>
          </div>
        </>
      )}
    </div>
  );
}
export function DiHeap({ tree, page, step }: { tree: DiTree; page: number; step?: DiQueryStep }) {
  return (
    <div className="di-page di-heap">
      <div className="di-page-tab">
        <span>{t('完整记录页')}</span>
        <b>H{page}</b>
      </div>
      <div className="di-page-columns">
        <span>{t('键值 · 行号')}</span>
        <span>{t('记录内容')}</span>
      </div>
      {tree.rows
        .filter((r) => r.heap === page)
        .map((r, i) => (
          <div
            className="di-heap-row"
            key={r.rowId}
            data-active={step?.rowId === r.rowId || step?.slot === i}
            data-match={step?.found.includes(r.rowId)}
          >
            <DiPair entry={r} />
            <span>{r.payload}</span>
          </div>
        ))}
      <div className="di-page-tail">{t('按插入顺序存放 · 每页 4 行')}</div>
    </div>
  );
}
function DiOperation({ step }: { step: DiQueryStep }) {
  return (
    <div className="di-operation" data-kind={step.kind}>
      <span>
        {t(
          step.kind === 'compare'
            ? '实际比较'
            : step.kind === 'link'
              ? '沿指针前进'
              : step.kind === 'match'
                ? '取回完整记录'
                : '触及这一页',
        )}
      </span>
      {step.kind === 'compare' && step.lhs && step.rhs ? (
        <div className="di-equation">
          {step.lhs.rowId || step.rhs.rowId ? (
            <>
              <DiPair entry={step.lhs} />
              <b>{step.order! < 0 ? '<' : step.order! > 0 ? '>' : '='}</b>
              <DiPair entry={step.rhs} />
            </>
          ) : (
            <strong>
              {step.lhs.key} {step.order! < 0 ? '<' : step.order! > 0 ? '>' : '='} {step.rhs.key}
            </strong>
          )}
        </div>
      ) : (
        <strong>
          {step.kind === 'link'
            ? `I${step.page} → I${step.target}`
            : step.kind === 'match'
              ? `r${step.rowId} · H${step.page}`
              : `${step.space === 'index' ? 'I' : 'H'}${step.page}`}
        </strong>
      )}
    </div>
  );
}
export function DiQueryView({
  tree,
  query,
  cursor,
  low,
  high,
  rootOnly = false,
}: {
  tree: DiTree;
  query: DiQuery;
  cursor: number;
  low: number;
  high: number;
  rootOnly?: boolean;
}) {
  const step = query.steps[Math.min(cursor, query.steps.length - 1)];
  const visited = query.steps.slice(0, cursor + 1).filter((s) => s.kind === 'page');
  const page = rootOnly
    ? tree.pages[tree.root]
    : step.space === 'index'
      ? tree.pages[step.page]
      : null;
  const completed = step.found;
  return (
    <div className="di-query-view">
      <div className="di-predicate">
        <span>{t('同一筛选条件')}</span>
        <strong>{low === high ? `key = ${low}` : `${low} ≤ key ≤ ${high}`}</strong>
      </div>
      <div className="di-query-body">
        <aside className="di-path" aria-label={t('已走过的页路径')}>
          <span>{t('页路径')}</span>
          <div>
            {visited.length > 4 && (
              <span className="di-path-ellipsis" aria-hidden="true">
                …
              </span>
            )}
            {visited.map((v, i) => (
              <span key={i} data-space={v.space} data-recent={i >= visited.length - 4}>
                {v.space === 'index' ? 'I' : 'H'}
                {v.page}
              </span>
            ))}
          </div>
        </aside>
        <div className="di-focus">
          {page ? (
            <DiPageSheet page={page} slot={step.slot} highlight={completed} target={step.target} />
          ) : (
            <DiHeap tree={tree} page={step.page} step={step} />
          )}
          <DiOperation step={step} />
        </div>
      </div>
      <div className="di-query-receipt">
        <span>
          {t('索引页')} <b>{step.indexPages}</b>
        </span>
        <span>
          {t('堆页')} <b>{step.heapPages}</b>
        </span>
        <span>
          {t('比较')} <b>{step.comparisons}</b>
        </span>
      </div>
      {rootOnly ? (
        <p className="di-probe-note">{t('r0 排在所有真实行号之前。')}</p>
      ) : (
        <div className="di-found">
          <span>{t('已找到的行号')}</span>
          <b>{completed.length ? completed.map((id) => `r${id}`).join(' · ') : '∅'}</b>
        </div>
      )}
    </div>
  );
}
export function DiComparePlans({
  tree,
  index,
  scan,
  progress,
  wide = false,
}: {
  tree: DiTree;
  index: DiQuery;
  scan: DiQuery;
  progress: number;
  wide?: boolean;
}) {
  const a =
    index.steps[Math.min(index.steps.length - 1, Math.floor(progress * index.steps.length))];
  const b = scan.steps[Math.min(scan.steps.length - 1, Math.floor(progress * scan.steps.length))];
  return (
    <div className="di-comparison">
      <div className="di-comparison-query">
        <span>{t(wide ? '读取全部记录' : '两条路线，返回同一行')}</span>
        <strong>{wide ? '0 ≤ key ≤ 99' : 'key = 63'}</strong>
      </div>
      <div className="di-plan-grid">
        {[
          { name: '全表扫描', step: b },
          { name: 'B+ 树查找', step: a },
        ].map(({ name, step }) => (
          <div className="di-plan" key={name}>
            <h4>{t(name)}</h4>
            <div className="di-page-count">
              <strong>{step.indexPages + step.heapPages}</strong>
              <span>{t('不同页')}</span>
            </div>
            <div className="di-beads" aria-hidden="true">
              {Array.from({ length: step.indexPages }, (_, i) => (
                <i key={`i${i}`} data-space="index" />
              ))}
              {Array.from({ length: step.heapPages }, (_, i) => (
                <i key={`h${i}`} data-space="heap" />
              ))}
            </div>
            <p>
              I {step.indexPages} + H {step.heapPages}
            </p>
            <p>
              {t('比较')} <b>{step.comparisons}</b>
            </p>
            <p>
              {t('找到行数')} <b>{step.found.length}</b>
            </p>
          </div>
        ))}
      </div>
      <div className="di-result-proof">
        <span>{t('最终结果逐行一致')}</span>
        <strong>
          {index.rows.length === 1
            ? `r${index.rows[0].rowId} · ${index.rows[0].payload}`
            : `${index.rows.length} / ${tree.rows.length}`}
        </strong>
      </div>
      <p className="di-inline-note">
        {t(wide ? '全部都要读时，索引还要多读自己的页。' : '索引页也要读；完整记录还要回到堆页。')}
      </p>
    </div>
  );
}
const changeLabels = {
  insert: '按序插入新项',
  'leaf-split': '叶页分开，复制分隔键',
  parent: '把新子页接入父页',
  'internal-split': '内部页分开，上推分隔键',
  root: '建立新根，树高增加一层',
} as const;
export function DiChangeView({ change, added }: { change: DiChange; added: number }) {
  const { tree } = change,
    page = tree.pages[change.page],
    row = tree.rows.at(-1)!;
  const isSplit = change.kind === 'leaf-split' || change.kind === 'internal-split';
  return (
    <div className="di-change-view">
      <div className="di-insert-heading">
        <span>
          {t('累计新增')} <b>{added}</b>
        </span>
        <span>
          {t('当前新项')}{' '}
          <b>
            {row.key} · r{row.rowId}
          </b>
        </span>
      </div>
      <h4>{t(changeLabels[change.kind])}</h4>
      {change.before && (
        <div className="di-overflow-strip">
          <span>{t('分裂前')}</span>
          <b>
            {change.before.kind === 'leaf'
              ? `${change.before.entries.length} / 3`
              : `${change.before.children.length} / 4`}
          </b>
          <span>{t(change.before.kind === 'leaf' ? '叶项超出容量' : '子页超出容量')}</span>
        </div>
      )}
      <div className="di-split-pages" data-split={isSplit}>
        <DiPageSheet page={page} highlight={[row.rowId]} target={change.right} />
        {isSplit && change.right && (
          <DiPageSheet page={tree.pages[change.right]} highlight={[row.rowId]} />
        )}
      </div>
      {change.separator && (
        <div className="di-promote">
          <span>
            {t(
              change.kind === 'leaf-split'
                ? '复制到父页，叶项保留'
                : change.kind === 'internal-split'
                  ? '上推到父页，两侧不再保留'
                  : '父页中的分隔键',
            )}
          </span>
          <DiPair entry={change.separator} />
        </div>
      )}
      <div className="di-change-footer">
        <span>
          {t('总行数')} <b>{tree.rows.length}</b>
        </span>
        <span>
          {t('当前树高')} <b>{diHeight(tree)}</b>
        </span>
        <span>{t('局部分裂步骤')}</span>
      </div>
    </div>
  );
}
export function DiLeafRibbon({ tree, low, high }: { tree: DiTree; low: number; high: number }) {
  const leaves = diLeaves(tree).filter((p) => p.entries.some((e) => e.key >= low && e.key <= high));
  return (
    <div className="di-leaf-ribbon">
      <span>{t('本区间所在叶页')}</span>
      <div>
        {leaves.map((p, i) => (
          <span key={p.id}>
            I{p.id}
            {i < leaves.length - 1 ? ' →' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Phone film: one actual access or local split is the primary reading surface. */
export function DiPhoneFilm({
  film,
  shot,
}: {
  film: ReturnType<typeof diFilm>;
  shot: ReturnType<typeof diShot>;
}) {
  const c = shot.chapter;
  if (c === 3 || c === 7)
    return (
      <DiPhoneComparison
        tree={c === 3 ? film.base : film.grown}
        low={c === 3 ? film.point : 0}
        high={c === 3 ? film.point : 99}
        progress={shot.progress}
      />
    );
  if (shot.change) return <DiPhoneChange change={shot.change} added={shot.added} />;
  if (!shot.query) return null;
  const query = shot.query,
    cursor = Math.min(shot.cursor, query.steps.length - 1),
    step = query.steps[cursor];
  const visited = query.steps.slice(0, cursor + 1).filter((s) => s.kind === 'page');
  const page =
    c === 1
      ? shot.tree.pages[shot.tree.root]
      : step.space === 'index'
        ? shot.tree.pages[step.page]
        : null;
  return (
    <div className="di-phone-query" data-step-kind={step.kind}>
      <div className="di-phone-predicate">
        <strong>{c === 4 ? `${film.low} ≤ key ≤ ${film.high}` : `key = ${film.point}`}</strong>
      </div>
      <div className="di-phone-path" aria-label={t('已走过的页路径')}>
        {visited.length > 3 && <span aria-hidden="true">… → </span>}
        {visited.slice(-3).map((v, i) => (
          <span key={i}>
            {i ? ' → ' : ''}
            {v.space === 'index' ? 'I' : 'H'}
            {v.page}
          </span>
        ))}
      </div>
      <div className="di-phone-access">
        {page ? (
          <DiPageSheet
            page={page}
            slot={step.slot}
            highlight={step.found}
            target={step.target}
            compact
          />
        ) : (
          <DiHeap tree={shot.tree} page={step.page} step={step} />
        )}
        <DiOperation step={step} />
      </div>
      {c === 1 ? (
        <p className="di-phone-result">{t('r0 排在所有真实行号之前。')}</p>
      ) : (
        <div className="di-phone-result">
          <span>{t('已找到的行号')}</span>
          <b>{step.found.length ? step.found.map((id) => `r${id}`).join(' · ') : '∅'}</b>
        </div>
      )}
      <DiPhoneReceipt step={step} />
    </div>
  );
}
function DiPhoneReceipt({ step }: { step: DiQueryStep }) {
  return (
    <dl className="di-phone-receipt">
      <div>
        <dt>{t('索引页')}</dt>
        <dd>{step.indexPages}</dd>
      </div>
      <div>
        <dt>{t('堆页')}</dt>
        <dd>{step.heapPages}</dd>
      </div>
      <div>
        <dt>{t('比较')}</dt>
        <dd>{step.comparisons}</dd>
      </div>
    </dl>
  );
}
function DiPhoneComparison({
  tree,
  low,
  high,
  progress,
}: {
  tree: DiTree;
  low: number;
  high: number;
  progress: number;
}) {
  const index = diQuery(tree, low, high),
    scan = diQuery(tree, low, high, 'scan');
  return (
    <div className="di-phone-comparison">
      <div className="di-phone-predicate">
        <strong>{low === high ? `key = ${low}` : `${low} ≤ key ≤ ${high}`}</strong>
      </div>
      {[
        { name: '全表扫描', query: scan },
        { name: 'B+ 树查找', query: index },
      ].map(({ name, query }) => {
        const step =
            query.steps[
              Math.min(query.steps.length - 1, Math.floor(progress * query.steps.length))
            ],
          domain = Math.max(index.indexPages + index.heapPages, scan.indexPages + scan.heapPages);
        return (
          <section className="di-phone-plan" key={name}>
            <h4>{t(name)}</h4>
            <div className="di-phone-plan-total">
              <strong>{step.indexPages + step.heapPages}</strong>
              <span>{t('不同页')}</span>
            </div>
            <div className="di-phone-page-bars" aria-hidden="true">
              <i style={{ width: `${(step.indexPages / domain) * 100}%` }} />
              <b style={{ width: `${(step.heapPages / domain) * 100}%` }} />
            </div>
            <p>
              I {step.indexPages} + H {step.heapPages} · {t('比较')} {step.comparisons}
            </p>
            <p>
              {t('找到行数')} {step.found.length}
            </p>
          </section>
        );
      })}
      <div className="di-phone-result">
        <span>{t('最终结果逐行一致')}</span>
        <b>
          {index.rows.length === 1
            ? `r${index.rows[0].rowId} · ${index.rows[0].payload}`
            : `${index.rows.length} / ${tree.rows.length}`}
        </b>
      </div>
    </div>
  );
}
function DiPhoneChange({ change, added }: { change: DiChange; added: number }) {
  const { tree } = change,
    row = tree.rows.at(-1)!,
    page = tree.pages[change.page],
    split = change.kind === 'leaf-split' || change.kind === 'internal-split';
  return (
    <div className="di-phone-change" data-change={change.kind}>
      <div className="di-phone-insertion">
        <span>{t('当前新项')}</span>
        <DiPair entry={row} />
        <span aria-label={`${t('累计新增')} ${added}`} title={t('累计新增')}>
          +{added}
        </span>
      </div>
      <h4>{t(changeLabels[change.kind])}</h4>
      {change.before && (
        <div className="di-phone-overflow">
          <span>{t('分裂前')}</span>
          <strong>
            {change.before.kind === 'leaf'
              ? `${change.before.entries.length} / 3`
              : `${change.before.children.length} / 4`}
          </strong>
        </div>
      )}
      <div className="di-phone-split" data-split={split}>
        <DiPageSheet page={page} highlight={[row.rowId]} target={change.right} compact />
        {split && change.right !== undefined && (
          <DiPageSheet page={tree.pages[change.right]} highlight={[row.rowId]} compact />
        )}
      </div>
      {change.separator && (
        <div className="di-phone-promote">
          <DiPair entry={change.separator} />
          <p>
            {t(
              change.kind === 'leaf-split'
                ? '复制到父页，叶项保留'
                : change.kind === 'internal-split'
                  ? '上推到父页，两侧不再保留'
                  : '父页中的分隔键',
            )}
          </p>
        </div>
      )}
      <div className="di-phone-tree-status">
        <span>
          {t('总行数')} {tree.rows.length}
        </span>
        <span>
          {t('当前树高')} {diHeight(tree)}
        </span>
      </div>
    </div>
  );
}
