# A* search — author brief

Misconception: always move geometrically toward the goal; a larger heuristic is automatically better; first discovery of a goal proves optimality. Prerequisite: grid coordinates and addition. Different from dijkstra: add a rigorously bounded remaining-cost estimate, then deliberately violate that bound to show the consequence.

Art direction: a light topographic tile map with an ochre expensive crossing, muted walls, frontier tint and a continuous parent-chain route. HTML cells retain20px S/G and cost labels on phone; SVG contains only a geometric route, no shrunken text. Desktop equation shares a row; phone gives its g+h equation a separate line and only the first three actual frontier records. Comparison and failure chapters replace the frontier strip. Watch details and duplicate header hide. Stage target roughly340–400px, complete-player budget740px pending real measurement.

| Claim                                                        | Source / check                                                                                 | Conditions                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A* selects minimum g+h, goal selection rather than discovery | [AIMA authors' Informed Search slides](https://aima.cs.berkeley.edu/slides-pdf/chapter04a.pdf) | Finite map, positive entering costs; reopening on improved g |
| Manhattan is a consistent lower bound here                   | Per-edge model inequality h(u)≤c(u,v)+h(v)                                                     | Cardinal movement, minimum entering cost1                    |
| Weighted estimate may return a costlier goal                 | Independent repeated-relaxation reference                                                      | Weight6 returns15 versus optimum12 on this exact map         |

Seven shots, planned147s: start lower bound8; actual frontier g+h records; obstacle detour and growing g; goal selected with optimum12; h0 versus h1 selected-item counts; sixfold weighted estimate returns15; fully sealed column empties the frontier with no successful route. No claim that a heuristic strictly improves every map. Counts include goal selection and tie policy is f,h,cell ID.

Independent benchmark: Bellman-style repeated relaxation on40 deterministic weighted grids with weights0,.5,1; sum/adjacency of returned routes; every selected item equals previous frontier minimum; consistency per edge; unreachable, same-start-goal and invalid costs. Four focused tests pass. No external resources or independent clock. Full playback, browser keyframes, recordings/listening and physical devices remain pending; author checks are not independent acceptance.

Computing age12, related dijkstra, network, heap-priority-queue (new scene backlink suggestion; registry owner decides availability). Use dijkstra, network and database-index as currently established registered links. Speech pending shot acceptance.
