import { describe, expect, it } from 'vitest';
import {
  raftAppend,
  raftCampaign,
  raftCommit,
  raftInitial,
  raftLesson,
  raftPartition,
  raftProbe,
  raftReplicate,
} from './raft-consensus';
describe('bounded five-server Raft transitions', () => {
  it('requires three durable acknowledgements and refuses to commit inherited entries by counting alone', () => {
    for (let replicas = 1; replicas <= 5; replicas++) {
      const current = raftProbe(replicas),
        old = raftProbe(replicas, true),
        noop = raftProbe(replicas, true, true);
      expect(current.state.nodes[current.leader].commit).toBe(replicas >= 3 ? 1 : 0);
      expect(old.state.nodes[old.leader].commit).toBe(0);
      expect(noop.state.nodes[noop.leader].commit).toBe(replicas >= 3 ? 2 : 0);
      expect(noop.state.nodes[noop.leader].applied).toEqual(replicas >= 3 ? ['x'] : []);
    }
  });
  it('elects only the majority partition, commits y and replaces only the pending x after healing', () => {
    const frames = raftLesson();
    expect(frames[3].nodes[0].commit).toBe(0);
    expect(frames[3].nodes[0].log[0].command).toBe('x');
    expect(frames[5].nodes[0].role).toBe('leader');
    expect(frames[5].nodes[2].role).toBe('leader');
    expect(frames[5].nodes[0].term).toBe(1);
    expect(frames[5].nodes[2].term).toBe(2);
    expect(frames[9].nodes[2].commit).toBe(1);
    const final = frames.at(-1)!;
    for (const node of final.nodes) {
      expect(node.log).toEqual([{ term: 2, command: 'y' }]);
      expect(node.commit).toBe(1);
      expect(node.applied).toEqual(['y']);
    }
    expect(final.nodes[0].role).toBe('follower');
    for (const frame of frames)
      for (const a of frame.nodes)
        for (const b of frame.nodes)
          for (let i = 0; i < Math.min(a.commit, b.commit); i++) expect(a.log[i]).toEqual(b.log[i]);
  });
  it('denies stale candidates, minority elections, unreachable replication and illegal writes', () => {
    let s = raftCampaign(raftInitial(), 0).state;
    s = raftAppend(s, 0, 'x');
    s = raftReplicate(s, 0, 1);
    const stale = raftCampaign(s, 2);
    expect(stale.votes).not.toContain(0);
    expect(stale.votes).not.toContain(1);
    const split = raftPartition(s);
    expect(raftCampaign(split, 0).elected).toBe(false);
    expect(raftReplicate(split, 0, 2).nodes[2].log).toEqual([]);
    expect(raftCampaign(raftInitial(), 0, [1, 1, 1]).elected).toBe(false);
    expect(raftCommit(raftLesson()[5], 0).nodes[0].commit).toBe(0);
    expect(() => raftAppend(raftInitial(), 0, 'x')).toThrow();
    expect(() => raftProbe(6)).toThrow();
  });
  it('retains an unmatched uncommitted tail on an empty matching heartbeat and never mutates prior states', () => {
    let s = raftCampaign(raftInitial(), 0).state;
    const initial = s;
    s = raftAppend(s, 0, 'x');
    s = raftReplicate(s, 0, 1);
    expect(initial.nodes[0].log).toEqual([]);
    const elected = raftCampaign(s, 2).state;
    const heartbeat = raftReplicate(elected, 2, 0);
    expect(heartbeat.nodes[0].log).toEqual([{ term: 1, command: 'x' }]);
    expect(heartbeat.nodes[0].commit).toBe(0);
    expect(raftCommit(s, 0).nodes[0].commit).toBe(0);
  });
});
