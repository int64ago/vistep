# Union–find — author brief

Misconception: find returns an original network route; compression changes connectivity; any repeated union reduces the number of sets. Prerequisite: follow a pointer and count members. Different from dijkstra: equivalence-class membership, without weights or path distances.

Independent art direction: sage parent-pointer forest. Root circles store valid sizes; a selected ochre pointer chain turns into direct root links. Layout is derived recursively from the actual forest and changes with compression. A thin root strip replaces a side dashboard. Desktop and phone share the forest but not the density: phone hides duplicate size entries and details while retaining 24-unit SVG member IDs (about16.9px at254/360), component count and visited path. Budget is about300–380px for the scene, pending complete-player measurement.

| Claim                                                             | Source                                                                            | Conditions                                              |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Same representative root means same set                           | [Princeton Union-Find](https://algs4.cs.princeton.edu/15uf/)                      | Valid forest, incremental equivalence merges            |
| Attach smaller root to larger; compress visited path to root      | [Author lecture](https://algs4.cs.princeton.edu/lectures/keynote/15UnionFind.pdf) | Size entries meaningful only at roots; no edge deletion |
| Low amortized cost does not promise strict constant time per call | Same primary sources                                                              | Teaching validation, copies and layout excluded         |

Six shots, planned128s: singleton roots; first successful union; form two four-member trees; merge equal-size roots into one; trace7→6→4→0 then compress; redundant union1/7 leaves count1. Each changes either topology, traversal cost or a tested no-op. No unrelated narrative animation.

Independent benchmark: undirected BFS membership after40 deterministic unions on12 vertices, checking all pairs; every pair before/after compression; hand-built eight-node parent array; cyclic pointers, bad root size and invalid indices rejected. Three focused tests. Snapshots never mutate inputs. No independent clock or browser resources. Author model/MDX checks are not independent review; browser, full watch, recordings/listening and device measurements are pending.

Computing age10; proposed links dijkstra, network and hash. Reverse link from dijkstra should distinguish connectivity from weighted distance. Speech awaits keyframe acceptance.
