export type RaftEntry = { term: number; command: string };
export type RaftNode = {
  term: number;
  votedFor: number | null;
  role: 'follower' | 'candidate' | 'leader';
  log: RaftEntry[];
  commit: number;
  applied: string[];
};
export type RaftState = { nodes: RaftNode[]; links: boolean[][]; match: number[][] };
export const raftInitial = (): RaftState => ({
  nodes: Array.from({ length: 5 }, () => ({
    term: 0,
    votedFor: null,
    role: 'follower',
    log: [],
    commit: 0,
    applied: [],
  })),
  links: Array.from({ length: 5 }, () => Array(5).fill(true)),
  match: Array.from({ length: 5 }, () => Array(5).fill(0)),
});
const copy = (s: RaftState): RaftState => ({
  nodes: s.nodes.map((n) => ({ ...n, log: n.log.map((e) => ({ ...e })), applied: [...n.applied] })),
  links: s.links.map((r) => [...r]),
  match: s.match.map((r) => [...r]),
});
const validId = (s: RaftState, i: number) => {
  if (!Number.isInteger(i) || i < 0 || i >= s.nodes.length) throw new RangeError('Invalid server');
};
const apply = (n: RaftNode) => {
  n.applied = n.log
    .slice(0, n.commit)
    .filter((e) => e.command !== 'no-op')
    .map((e) => e.command);
};
export function raftPartition(input: RaftState, split = true) {
  const s = copy(input);
  s.links = s.nodes.map((_, a) => s.nodes.map((_, b) => !split || a < 2 === b < 2));
  return s;
}
export function raftCampaign(
  input: RaftState,
  candidate: number,
  requests = input.nodes.map((_, i) => i),
) {
  validId(input, candidate);
  const s = copy(input),
    n = s.nodes[candidate];
  n.term++;
  n.role = 'candidate';
  n.votedFor = candidate;
  const term = n.term,
    votes = [candidate],
    last = n.log.at(-1)?.term ?? 0;
  s.match[candidate] = s.nodes.map((_, i) => (i === candidate ? n.log.length : 0));
  for (const i of requests) {
    validId(s, i);
    if (votes.includes(i) || !s.links[candidate][i] || !s.links[i][candidate]) continue;
    const voter = s.nodes[i];
    if (voter.term > term) {
      n.term = voter.term;
      n.votedFor = null;
      n.role = 'follower';
      return { state: s, votes, elected: false };
    }
    if (voter.term < term) {
      voter.term = term;
      voter.votedFor = null;
      voter.role = 'follower';
    }
    const other = voter.log.at(-1)?.term ?? 0,
      fresh = last > other || (last === other && n.log.length >= voter.log.length);
    if (fresh && (voter.votedFor === null || voter.votedFor === candidate)) {
      voter.votedFor = candidate;
      votes.push(i);
    }
  }
  if (votes.length >= Math.floor(s.nodes.length / 2) + 1) n.role = 'leader';
  return { state: s, votes, elected: n.role === 'leader' };
}
export function raftAppend(input: RaftState, leader: number, command: string) {
  validId(input, leader);
  const s = copy(input),
    n = s.nodes[leader];
  if (n.role !== 'leader' || !command || command.length > 32 || n.log.length >= 16)
    throw new RangeError('Leader and bounded command required');
  n.log.push({ term: n.term, command });
  s.match[leader][leader] = n.log.length;
  return s;
}
export function raftReplicate(input: RaftState, leader: number, follower: number) {
  validId(input, leader);
  validId(input, follower);
  const s = copy(input),
    a = s.nodes[leader],
    b = s.nodes[follower];
  if (leader === follower || a.role !== 'leader')
    throw new RangeError('Invalid replication endpoints');
  if (!s.links[leader][follower] || !s.links[follower][leader]) return s;
  if (a.term < b.term) {
    a.term = b.term;
    a.role = 'follower';
    a.votedFor = null;
    return s;
  }
  if (b.term < a.term) {
    b.term = a.term;
    b.votedFor = null;
  }
  b.role = 'follower';
  for (let i = 0; i < a.log.length; i++) {
    if (b.log[i] && b.log[i].term !== a.log[i].term) {
      if (i < b.commit) throw new Error('Cannot overwrite committed prefix');
      b.log = b.log.slice(0, i);
    }
    if (!b.log[i]) b.log.push({ ...a.log[i] });
    else if (b.log[i].command !== a.log[i].command)
      throw new Error('Same-index same-term log mismatch');
  }
  s.match[leader][follower] = a.log.length;
  b.commit = Math.max(b.commit, Math.min(a.commit, a.log.length));
  apply(b);
  return s;
}
export function raftCommit(input: RaftState, leader: number) {
  validId(input, leader);
  const s = copy(input),
    n = s.nodes[leader];
  if (n.role !== 'leader') throw new RangeError('Leader required');
  for (let index = n.log.length; index > n.commit; index--)
    if (
      n.log[index - 1].term === n.term &&
      s.match[leader].filter((match) => match >= index).length >= Math.floor(s.nodes.length / 2) + 1
    ) {
      n.commit = index;
      break;
    }
  apply(n);
  return s;
}
export function raftLesson() {
  let s = raftInitial();
  const frames: RaftState[] = [s],
    save = (next: RaftState) => {
      s = next;
      frames.push(s);
    };
  save(raftCampaign(s, 0, [1, 2]).state);
  save(raftAppend(s, 0, 'x'));
  save(raftReplicate(s, 0, 1));
  save(raftPartition(s));
  save(raftCampaign(s, 2).state);
  save(raftAppend(s, 2, 'y'));
  save(raftReplicate(s, 2, 3));
  save(raftReplicate(s, 2, 4));
  save(raftCommit(s, 2));
  save(raftPartition(s, false));
  for (const i of [0, 1, 3, 4]) save(raftReplicate(s, 2, i));
  return frames;
}
export function raftProbe(replicas = 3, inherited = false, noop = false) {
  if (!Number.isInteger(replicas) || replicas < 1 || replicas > 5)
    throw new RangeError('Invalid replica count');
  let s = raftCampaign(raftInitial(), 0).state;
  s = raftAppend(s, 0, 'x');
  let leader = 0;
  if (inherited) {
    s = raftReplicate(s, 0, 1);
    s = raftCampaign(s, 1).state;
    leader = 1;
  }
  if (noop) s = raftAppend(s, leader, 'no-op');
  for (const i of s.nodes
    .map((_, i) => i)
    .filter((i) => i !== leader)
    .slice(0, replicas - 1))
    s = raftReplicate(s, leader, i);
  s = raftCommit(s, leader);
  return { state: s, leader };
}
