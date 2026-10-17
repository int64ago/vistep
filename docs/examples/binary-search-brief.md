# Binary search — author brief

Misconception: a comparison magically locates the answer's half, or an absent search should return the closest number. Prerequisite: numerical order and zero-based indices. Distinction: database-index studies page structure; this follows one inclusive array interval and proves each exclusion.

Art direction: an ochre numbered shelf, with eliminated values faded and one comparison value held in warm gold. Desktop is a single ordered rail; phone folds to eight columns and two short rows, with retained row-major indices and 20px values / 16px indices. The interval is specified by indices, so no implied two-dimensional spatial metric is introduced. Key causal frames are 29<37, 46>37 and the discarded out-of-order witness.

| Claim                                                          | Source / basis                                                                    | Conditions                                             |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| A midpoint comparison can exclude a half                       | [Princeton, Sorting and Searching](https://introcs.cs.princeton.edu/java/42sort/) | Finite ascending array under the same comparator       |
| The remaining inclusive interval contains every possible match | Direct loop invariant and the displayed trace                                     | If a match exists; failed comparison excludes midpoint |
| Duplicate handling depends on the search contract              | This exact implementation                                                         | Returns some match, not first/last or lower_bound      |

Independent benchmark: linear membership across every length 0–64 and target −23…80, including duplicate keys. Hand trace: 29,46,37 gives index 9 in three comparisons. Boundary counterexamples: absent 38; empty/singleton; NaN/Infinity; unsorted 37 at index 1 incorrectly excluded by the tempting first move. The function rejects that input. Sortedness validation costs O(n) and is excluded from the search comparison counter.

Six shots: original ordered interval; discard prefix after 29; discard suffix after 46; exact hit; empty interval for 38; deliberately broken ordering. Planned 123 seconds with varied windows, to be remeasured from both voices. No repeated loop is used to fill time.

Category `computing`, age 10. Related `database-index`, `bloom-filter`, `dijkstra`. Suggested backlink from database-index's ordered-key explanation, explicitly distinguishing arrays from B trees. Author numerical and MDX syntax checks only. Desktop/320/390 keyframes, complete viewing, voices/listening and physical-device measurements remain not-run; scripts pending keyframe acceptance.
