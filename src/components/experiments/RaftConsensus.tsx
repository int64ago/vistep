import { useId, useState } from 'react';
import { t } from '../../i18n';
import { raftLesson, raftProbe } from '../../models/raft-consensus';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/raft-consensus.css';
const lesson = raftLesson(),
  old = raftProbe(3, true),
  prefix = raftProbe(3, true, true),
  roles = { follower: '追随者', candidate: '候选者', leader: '领导者' } as const;
export default function RaftConsensus() {
  const d = useShowcase(),
    id = useId(),
    [replicas, setReplicas] = useState(2),
    [inherited, setInherited] = useState(false),
    [noop, setNoop] = useState(false);
  const c = d.watch ? Math.min(6, d.chapter) : 0,
    p = d.watch ? d.chapterProgress : 1,
    index =
      c === 0
        ? p < 0.35
          ? 0
          : 1
        : c === 1
          ? p < 0.35
            ? 2
            : 3
          : c === 2
            ? 5
            : c === 3
              ? Math.min(9, 6 + Math.floor(p * 4))
              : Math.min(14, 10 + Math.floor(p * 5)),
    probe = !d.watch ? raftProbe(replicas, inherited, noop) : c === 5 ? old : prefix,
    s = d.watch && c < 5 ? lesson[index] : probe.state,
    leader = d.watch && c < 5 ? (c < 2 ? 0 : 2) : probe.leader,
    n = s.nodes[leader],
    target = n.log.length,
    copies = target ? s.match[leader].filter((m) => m >= target).length : 0,
    split = !s.links[0][2],
    votes = s.nodes.filter((node) => node.votedFor === leader && node.term === n.term).length;
  return (
    <section className="raft-study" data-watch={d.watch} aria-label={t('Raft 任期与日志复制实验')}>
      <header>
        <span>RAFT / TERMS</span>
        <b>{t('多数阈值')} 3/5</b>
      </header>
      <div className="raft-journals">
        {s.nodes.map((node, i) => (
          <article
            key={i}
            data-leader={node.role === 'leader'}
            data-voted={c === 0 && d.watch && node.votedFor === 0}
            data-minority={split && i < 2}
          >
            <div className="raft-server">
              <strong>
                {String.fromCharCode(65 + i)} <span>t{node.term}</span>
              </strong>
              <span>{t(roles[node.role])}</span>
            </div>
            <div className="raft-entries">
              {node.log.map((entry, j) => (
                <div
                  key={j}
                  data-committed={j < node.commit}
                  data-current={entry.term === node.term}
                  title={t('索引 {0}，任期 {1}，命令 {2}', j + 1, entry.term, entry.command)}
                >
                  <b>{entry.command === 'no-op' ? '·' : entry.command}</b>
                  <sup>{entry.term}</sup>
                </div>
              ))}
              {!node.log.length && <span className="raft-empty">∅</span>}
            </div>
            <span className="raft-commit" title={t('该节点已知的提交索引')}>
              ✓{node.commit}
            </span>
          </article>
        ))}
      </div>
      <div className="raft-quorum">
        {d.watch && (c === 0 || c === 2) ? (
          <span>
            {t('获得选票')} <b>{votes}/5</b>
          </span>
        ) : (
          <>
            <span>
              {t('已确认副本')} <b>{copies}/5</b>
            </span>
            <span>
              {t('提交索引')} <b>{n.commit}</b>
            </span>
          </>
        )}
      </div>
      {split && <p className="raft-partition">A · B / C · D · E · {t('网络分区')}</p>}
      {!d.watch && (
        <div className="raft-controls">
          <label htmlFor={`${id}-copies`}>
            {t('已确认副本，包含领导者')} · {replicas}
          </label>
          <input
            id={`${id}-copies`}
            type="range"
            min="1"
            max="5"
            value={replicas}
            onChange={(e) => setReplicas(+e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              checked={inherited}
              onChange={(e) => {
                setInherited(e.target.checked);
                setNoop(false);
              }}
            />
            {t('换任期，继承未提交旧日志')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={noop}
              disabled={!inherited}
              onChange={(e) => setNoop(e.target.checked)}
            />
            {t('追加当前任期 no-op')}
          </label>
        </div>
      )}
      <details>
        <summary>{t('多数副本，还要满足当前任期条件')}</summary>
        <p>
          {t(
            '固定五节点、崩溃故障而非恶意节点；选票、任期和日志视为回复前已稳定存储。选举还检查候选日志新鲜度。领导者只能按多数复制直接提交当前任期条目；旧前缀随它间接提交。此有界模型显式驱动消息与分区，不模拟随机超时、成员变更、快照或线性一致读。',
          )}
        </p>
      </details>
    </section>
  );
}
