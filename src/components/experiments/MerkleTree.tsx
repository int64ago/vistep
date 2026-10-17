import { useId, useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  MERKLE_DATA,
  merkleLeaf,
  merkleNodes,
  merkleProof,
  merkleTree,
  merkleVerify,
  type MerkleNode,
} from '../../models/merkle-tree';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/merkle-tree.css';
const original = merkleTree(MERKLE_DATA),
  altered = merkleTree(['alpha', 'beta', 'Gamma', 'delta']);
const key = (n: Pick<MerkleNode, 'start' | 'end'>) => `${n.start}:${n.end}`;
const label = (start: number, end: number) =>
  Array.from({ length: end - start }, (_, i) => String.fromCharCode(65 + start + i)).join('');
const point = (n: MerkleNode) => ({
  x: ((n.start + n.end) / 2 / 4) * 360,
  y: n.end - n.start === 4 ? 28 : n.end - n.start === 2 ? 104 : 184,
});
export default function MerkleTree() {
  const d = useShowcase(),
    id = useId(),
    [selected, setSelected] = useState(2),
    [text, setText] = useState('gamma'),
    [accept, setAccept] = useState(false),
    [inputError, setInputError] = useState(false);
  const c = d.watch ? Math.min(6, d.chapter) : 4,
    p = d.watch ? d.chapterProgress : 1,
    index = d.watch ? 2 : selected,
    payload = d.watch ? (c >= 5 ? 'Gamma' : 'gamma') : text;
  const manual = useMemo(
      () => merkleTree(MERKLE_DATA.map((value, i) => (i === selected ? text : value))),
      [selected, text],
    ),
    tree = d.watch ? (c >= 5 ? altered : original) : manual,
    proof = useMemo(() => merkleProof(original, index), [index]),
    untrusted = d.watch ? c === 6 : accept,
    expected = untrusted ? tree.root.hash : original.root.hash,
    verification = useMemo(
      () => merkleVerify(payload, proof, expected),
      [payload, proof, expected],
    ),
    nodes = merkleNodes(tree.root),
    originalNodes = merkleNodes(original.root),
    changed = new Set(nodes.filter((node, i) => node.hash !== originalNodes[i].hash).map(key)),
    pathKeys = new Set([
      `${index}:${index + 1}`,
      ...nodes.filter((node) => index >= node.start && index < node.end).map(key),
    ]),
    siblings = new Set(proof.steps.map(key)),
    shown = d.watch && c === 4 ? Math.min(2, Math.floor(p * 3)) : 2,
    complete = !d.watch || c !== 4 || shown === 2;
  return (
    <section
      className="merkle-study"
      data-watch={d.watch}
      aria-label={t('Merkle 树与包含证明实验')}
    >
      <header>
        <span>MERKLE / WITNESS</span>
        <b>SHA-256</b>
      </header>
      <div className="merkle-tree">
        <svg viewBox="0 0 360 220" preserveAspectRatio="none" aria-hidden="true">
          {nodes.flatMap((node) =>
            node.left && node.right
              ? [node.left, node.right].map((child) => {
                  const a = point(node),
                    b = point(child);
                  return (
                    <path
                      key={`${key(node)}-${key(child)}`}
                      d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
                      data-show={!d.watch || c >= 1}
                      data-path={c >= 3 && pathKeys.has(key(child))}
                    />
                  );
                })
              : [],
          )}
        </svg>
        {nodes.map((node) => {
          const leaf = node.end - node.start === 1,
            pt = point(node),
            reveal = !d.watch || leaf || c >= 2 || (c === 1 && node.end - node.start === 2);
          return (
            <div
              key={key(node)}
              className="merkle-seal"
              style={{ left: `${(pt.x / 360) * 100}%`, top: `${(pt.y / 220) * 100}%` }}
              data-leaf={leaf}
              data-path={c >= 3 && pathKeys.has(key(node))}
              data-sibling={c >= 3 && siblings.has(key(node))}
              data-changed={changed.has(key(node))}
            >
              <span>{node.end - node.start === 4 ? t('根') : label(node.start, node.end)}</span>
              {leaf && <em>{tree.data[node.start]}</em>}
              <b title={node.hash}>
                {reveal
                  ? node.hash.slice(0, leaf ? 4 : node.end - node.start === 4 ? 8 : 6)
                  : '······'}
              </b>
            </div>
          );
        })}
      </div>
      {d.watch && c < 3 ? (
        <p className="merkle-rule">
          {c === 0 ? 'H(00 ∥ data)' : c === 1 ? 'H(01 ∥ L ∥ R)' : t('根绑定这四项的顺序与内容。')}
        </p>
      ) : c === 3 && d.watch ? (
        <div className="merkle-proof">
          <span>
            {t('C 的包含证明')} · 2 {t('个兄弟哈希')}
          </span>
          <div>
            {proof.steps.map((s) => (
              <b key={key(s)}>
                {label(s.start, s.end)}
                <code>{s.hash.slice(0, 6)}</code>
              </b>
            ))}
          </div>
        </div>
      ) : c === 4 && d.watch ? (
        <div className="merkle-rebuild">
          {verification.steps.map((step, j) => (
            <div key={j} data-active={j < shown}>
              <span>
                {j + 1} · {t(step.side === 'left' ? '兄弟在左' : '兄弟在右')}
              </span>
              <b>{j < shown ? step.hash.slice(0, 8) : '········'}</b>
            </div>
          ))}
          <p>{complete ? t('重建根与可信根一致。') : t('从叶逐层重建根。')}</p>
        </div>
      ) : (
        <div className="merkle-compare">
          <div>
            <span>{t(untrusted ? '对方给出的新根' : '原先可信根')}</span>
            <code>{expected.slice(0, 8)}</code>
          </div>
          <div>
            <span>{t('重建的根')}</span>
            <code>{verification.root.slice(0, 8)}</code>
          </div>
          <p data-valid={verification.valid} data-trusted={!untrusted}>
            {untrusted
              ? t('自洽不代表可信；根的来源仍需认证。')
              : verification.valid
                ? t('重建根与可信根一致。')
                : t('不一致：修改不能通过原根验证。')}
          </p>
        </div>
      )}
      {!d.watch && (
        <div className="merkle-controls">
          <label htmlFor={`${id}-leaf`}>{t('验证哪一项')}</label>
          <select
            id={`${id}-leaf`}
            value={selected}
            onChange={(e) => {
              const i = +e.target.value;
              setSelected(i);
              setText(MERKLE_DATA[i]);
              setAccept(false);
              setInputError(false);
            }}
          >
            {MERKLE_DATA.map((_, i) => (
              <option key={i} value={i}>
                {label(i, i + 1)}
              </option>
            ))}
          </select>
          <label htmlFor={`${id}-text`}>{t('收到的内容')}</label>
          <input
            id={`${id}-text`}
            type="text"
            maxLength={24}
            value={text}
            onChange={(e) => {
              try {
                merkleLeaf(e.target.value);
                setText(e.target.value);
                setInputError(false);
              } catch {
                setInputError(true);
              }
            }}
          />
          {inputError && <p role="alert">{t('输入需为有效 Unicode，最多 128 字节。')}</p>}
          <label>
            <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
            {t('改用对方给出的新根')}
          </label>
        </div>
      )}
      <details>
        <summary>{t('短码只用于显示，验证比较完整哈希')}</summary>
        <p>
          {t(
            '叶为 SHA-256(00 ∥ UTF-8内容)，内部为 SHA-256(01 ∥ 左哈希原字节 ∥ 右哈希原字节)。包含证明绑定索引、树大小与左右次序；不是加密，也不证明内容真实或日志只追加。需要另行认证可信根。',
          )}
        </p>
        <code className="merkle-full">{expected}</code>
      </details>
    </section>
  );
}
