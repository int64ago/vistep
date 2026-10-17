# Raft consensus — author brief

Misconceptions: election implies every entry committed; a minority leader may keep confirming commands; any three old copies suffice; a new leader can erase committed state; crash tolerance handles malicious nodes. Prerequisite: majority and ordered lists. Distinct from WAL: agreement across servers, with durable RPC acknowledgements assumed rather than implemented.

Art direction: five aligned server journals, entry command plus explicit term superscript, local role/term and local known commit index. Minority rows turn muted mauve during a2/3 partition; current authority is inferred from terms, votes and acknowledgements rather than a decorative central crown. A cutover replaces the actual conflicting pending cell. Desktop content max660px, phone80px server label plus46px log cells and16px term/index text. Watch details hide; target scene400–440px, complete-player740px budget awaiting browser acceptance.

| Claim                                                         | Primary source and model boundary                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Term/vote/log-freshness election, conflict truncation         | [Original Raft paper](https://raft.github.io/raft.pdf), Figure2 and§5.2–5.4                                        |
| Majority counting directly commits only current-term entries  | Same paper§5.4.2; inherited prefix committed through current-term no-op                                            |
| Partition progress needs a majority; local beliefs may differ | Paper assumptions, fixed5 crash-fault servers; no Byzantine behavior, timing measurements or general liveness test |

Seven shots, planned159s: elect A by3votes; x has2copies and commit0; partition and elect Cterm2; y gets3copies then commits; heal, step A down and overwrite only pending x; separate inherited-x majority still commit0; current-term no-op majority advances commit2. Green means local known committed prefix, not physical copy count. General interaction changes actual acknowledged replicas1–5 and old/current-term rule, recomputing commit.

Independent tests: exact thresholds for all1–5 replicas in three term/no-op modes; original full failover sequence and pairwise committed-prefix agreement in every frame; stale-log vote denial, duplicate request deduplication, minority no-commit; blocked messages; matching empty heartbeat retains an unmatched pending tail; immutable snapshots. Four focused tests. This is a rule subset, not a formally verified production Raft implementation. Browser, complete watch, recordings/listening, independent review and devices remain pending. Computing age14; related network,write-ahead-log,database-transactions. Speech pending keyframe acceptance.
