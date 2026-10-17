# Quicksort — author brief

Misconception: a pivot instantly sorts its neighbors, every exchange advances the scan, or quicksort is always balanced/stable. Prerequisite: compare values and follow an index. Distinction from merge-sort: this follows in-place local swaps and an unknown region rather than selecting the heads of already sorted runs.

Art direction: eight persistent capsules on a lilac partition belt, with four computed state colors and one scan marker. Positions transition by item identity rather than fading in replacement objects. On phone, one eight-slot belt keeps 23px values and 16px IDs; boundaries are expressed in an external four-part count rail rather than microscopic text inside a one-item region. Paused seeks and reduced motion disable position interpolation. The final work comparison replaces the full belt height with a compact input and two bounded work silhouettes.

| Claim                                                            | Source / basis                                                      | Conditions                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Three-way partition maintains less/equal/unknown/greater regions | [Princeton, Quicksort](https://algs4.cs.princeton.edu/23quicksort/) | Finite comparable values, pivot chosen from input for recursive sorting   |
| Equal region needs no further recursion; balance affects cost    | Same source and model node-size sums                                | Partition classification count only; pivot-selection work excluded        |
| Duplicate-key work and historical variants need explicit scope   | [Sedgewick's own research overview](https://sedgewick.io/research/) | This is the simple three-way scheme, not a claim about every library sort |

Independent benchmarks: native numeric sort over lengths0–40×4 inputs×3 pivot modes; all four region predicates and identity conservation in every frame. Right-swap keeps scan=0 with a new unknown item. Default equal-ID order becomes [1,7,3] (zero-based), proving instability. Eight equal values need eight classifications. Controlled eight-item minimum/median selection yields 35/17 classifications and depth7/3, with selection work explicitly outside the metric.

Seven shots: pivot contract; greater item swaps right but scan stays; smaller item swaps through the equal region; repeated keys collect in the middle; finished partition still has an internal 8,6 inversion; recursively sort only outer regions; expose extreme versus balanced partition work. Planned147 seconds; no timed filler. Key scientific qualification is part of the visible work-comparison footer.

Category `computing`, age12; related `hash`, `database-index`, `dijkstra`; later reciprocal link to merge-sort should contrast stability. Model and MDX syntax checks are author evidence only; desktop/320/390, full watching, recordings/listening, physical devices and independent review remain not-run. Speech awaits shot acceptance.
