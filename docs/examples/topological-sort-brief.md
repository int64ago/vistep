# Topological sort — author brief

Misconception: finishing one predecessor unlocks a node; every graph has an ordering; every blocked item lies on the cycle; an ordering is an optimal schedule. Prerequisite: arrow direction and counting. Unlike dijkstra, no distance or nearest frontier; unlike union-find, dependencies are directed and cannot be collapsed into equivalence sets.

Art direction: parchment dependency weave. Six lettered tokens retain fixed positions while released edges soften. Counts live outside nodes in a six-cell ledger, keeping SVG letters28 units and HTML counts18–20px. A green ready tray makes the selection condition visible; an output ribbon records the actual order. On phone the plot is about186px tall, header repetition and details hide in watch mode. Target stage about340px, leaving caption/transport budget; actual browser measurement pending.

| Claim                                                           | Source                                                                                 | Conditions                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Remove zero-indegree vertices and decrement outgoing successors | [Princeton Directed Graphs](https://algs4.cs.princeton.edu/42digraph/)                 | Finite simple digraph, self-loop accepted as cycle             |
| Complete topological order iff acyclic                          | [Author lecture](https://algs4.cs.princeton.edu/lectures/keynote/42DirectedGraphs.pdf) | Every vertex must be included, not merely a processable prefix |
| Blocked vertices need not all be cycle members                  | Model DFS witness on B→E→B with downstream D,F                                         | Distinguish cycle witness from Kahn residual set               |

Six shots, planned132s: initially ready A/B/C; A alone does not release D; B releases D but E still waits C; C yields ready D/E, showing non-uniqueness; output through F; add E→B and exhibit partial A,C plus true B/E cycle and downstream blocked D/F. Exploration changes ready-item tie rule or adds/removes the actual edge, recomputing indegrees and order.

Independent benchmark: exhaustive permutations for all64 directed three-vertex graphs; every snapshot indegree equals remaining incoming-edge count; default and reversed valid orders; actual directed cycle-edge witness; duplicate/invalid endpoints rejected and self-cycle accepted. Four focused model tests. No external runtime resources or independent animation clock.

Computing age10, related cpu-pipeline, dijkstra, database-index. Suggested reverse link from cpu-pipeline should qualify that dependency order alone lacks processor/resource constraints. Author model/MDX checks do not count as independent review, full watching, keyframes, listening or device performance. Speech pending shot acceptance.
