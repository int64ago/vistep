# Heap priority queue — author brief

Misconceptions: the heap array is sorted; either child can be chosen during sinking; equal priorities are automatically stable. Distinct from sorting films: preserve a mutable frontier with one certified extreme, rather than finish a global ordering. Prerequisite: compare whole numbers and follow a parent path.

Art direction: a restrained navy tournament tree over its actual level-order array. One amber identity moves through a cool parent/child structure; removed priorities accumulate outside it. Tree geometry and array indices share heapPosition. Desktop spreads eight cells; phone uses two array rows, SVG node values 24 on a 360-unit viewBox (about 16.9 actual px at a 254px plot). Main scene budget about 430px, leaving room for caption and transport inside the requested 740px complete-player target; actual browser measurement remains pending.

| Claim                                                              | Source / basis                                                     | Conditions                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Complete tree plus parent≥children certifies maximum root          | [Princeton, Priority Queues](https://algs4.cs.princeton.edu/24pq/) | Max heap, finite ordered priorities                                       |
| Insertion swims; removal replaces root then sinks via larger child | Same primary textbook chapter                                      | Parent comparison additionally resolves equal priorities by arrival order |
| Standard O(log n) update path, not full teaching-interface runtime | Same source, independent model snapshots                           | Excludes O(n) validation and copied trace storage                         |

Six shots, planned129s: valid but unsorted level array; append10 next leaf; swim the same10 through7→3→1→0; remove10 and fillroot with last3; compare9/8 then7/5 to select larger child; repeated removal to empty. Deliberately choosing smaller8 is a negative benchmark: it leaves9 below8.

Independent model benchmark: sorted-list reference through128 deterministic mixed insertions/removals; invariant and identity checks after each operation; empty/singleton and equal-priority arrival tests. Known insertion [10,9,8,7,5,2,6,3] and subsequent pop return the starting heap. Four focused tests pass. HTML controls enforce a completed trace before the next operation; current heap≤8, recent history≤16. No additional animation clock, canvas, audio or worker.

Computing, age10. Related dijkstra (min-heap frontier), congestion-control (queues), cpu-pipeline (work scheduling), with explicit distinction from their algorithms. Model tests and MDX syntax are author checks only. Browser keyframes, complete watch, both recordings/listening and physical-device tests remain not-run. Speech is pending shot acceptance.
