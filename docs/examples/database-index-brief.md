# Database index — production brief

[简体中文](../zh-CN/examples/database-index-brief.md)

## Integrated film

The assembled Chinese and English tracks share **202 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                                 | Measured window |
| --------------------------------------- | --------------- |
| 1. Read the table page by page          | 0–24 s          |
| 2. Separators point to the next page    | 24–47 s         |
| 3. Follow page IDs to the same record   | 47–73 s         |
| 4. Count every page on both routes      | 73–99.5 s       |
| 5. Continue a range along the leaves    | 99.5–125 s      |
| 6. A full leaf gains a new neighbor     | 125–148.5 s     |
| 7. Splits climb until a new root grows  | 148.5–174.5 s   |
| 8. Reading more can erase the advantage | 174.5–202 s     |

Recordings: `/narration/database-index-zh-8da8c83fbf48.mp3` · `/narration/database-index-en-092907fe6d85.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

## Question and visual idea

How can a database retrieve one complete row without reading the entire table? An understated atlas of pages answers through actual addresses: index pages use cool blue tabs, heap pages use green tabs, and the same row ID survives every jump. Desktop gives the current page a small trail of visited pages. Phone gives that page the whole available width, keeping only the latest four path entries with an ellipsis. Leaf and internal splits become two adjacent, readable page fragments, not a miniature view of the whole tree.

The data is the protagonist. No 3D objects, ornamental cabinet, fake binary tree, latency counter or prerecorded page states are used. The component leaves the full current explanation to the shared Showcase caption. It adds only the chapter title, exact predicate, comparator, page IDs, brief model annotations and counters.

## Model and contracts

Independent insertion-only B+ tree in `src/models/database-index.ts`. Capacity is deliberately tiny: three leaf entries, four internal child pointers, four complete heap records per page. Internal non-root occupancy is 2–4 children; leaf non-root occupancy is 2–3 entries. All committed leaves share a depth. Empty root leaves are supported.

Entries sort lexicographically by integer key and unique ascending row ID. Each separator equals the right subtree minimum pair. A lower-bound probe uses row ID zero, preceding every real duplicate. The leaf chain supports inclusive ranges and stops at the first key beyond the upper bound. The model validates keys within ±1,000,000; UI inputs expose only 0–99. No nulls, strings, collation or floating-point keys.

Heap records remain in append order. Leaf entries hold `(key,rowId)` pointers; fetching payloads touches actual heap pages. Each query begins with an empty unbounded cache, so counters report distinct index pages and heap pages touched. Comparator calls are counted individually. Numeric comparisons use row ID zero on both operands; routing compares full pairs. A failed lower-bound check short-circuits the upper comparison. Result display sorting is outside the measured access trace, identically for both plans. Counters are neither disk reads nor timing.

Copy-on-insert trees and event snapshots preserve all prior states. Leaf overflow splits 4 entries into 2+2, repairs links and copies the right minimum upward. Internal overflow splits 5 children into 3+2 and promotes the middle separator, removing it from both resulting internal pages. Root overflow creates a new root. Intermediate events are explicitly local snapshots, possibly not yet fully connected; queries run only on committed trees. Deletion and merging are omitted, as are transactions, MVCC, concurrent updates, buffer replacement, durability, covering-index optimization and production planning.

## Eight chapters and verified values

Eight 22-second chapter windows total 176 seconds. Cue starts are chapter start +0.45 seconds. Authored English scripts contain 51–54 words each; Chinese scripts were separately written to direct attention to the operation.

1. Scan 24 records on six heap pages for key 63; continue after a match because duplicates are permitted.
2. Read real root separators `(38,r3)`, `(47,r4)`, `(70,r2)`; route the lower-bound probe `(63,r0)`.
3. Trace `I8 → I7 → I10 → I11`, then row `r14` on `H4`, payload `item-14`.
4. Same result: index touches 4 index +1 heap page with 11 comparisons; scan touches 6 heap pages with 33 comparisons.
5. Range 38–47 returns `(38,r3), (42,r6), (42,r7), (42,r8), (47,r4)`. The index touches 6+2 distinct pages, with 17 comparisons.
6. Insert 40, 53, 66 and then 79. Its leaf split creates two neighbors and copies `(82,r22)` upward.
7. Continue with 92, 5, 18, 31, 44, 57, 70, 83, 96. The final insert triggers one leaf split, two internal splits and a new root; height becomes four. The preparatory inserts occupy the first quarter of the chapter; the final cascade occupies three quarters.
8. Retrieve all 37 rows. Index: 17+10 distinct pages, 77 comparisons. Scan: 10 heap pages, 74 comparisons. Results match, and the page advantage reverses.

`diShot(film,chapter,progress)` reconstructs the view solely from shared director chapter/progress. There is no private frame timer, evolving random generator or animation history. Watch state is independent of manual inputs. CSS state feedback is gentle and disabled for reduced motion. There are no WebGL, audio, worker or observer resources to dispose; shared Showcase owns playback and visibility/background pause.

## Exploration and accessibility

Named bounds, access-plan selector, heap-order selector, insert key, range slider, previous/next buttons and reset. Explicit `htmlFor`/IDs name every field; the range also has its own translated aria-label. Invalid integers or inverted bounds render an accessible status. Each insertion gets a distinct row ID. Up to 30 additions; switching heap order starts a fresh table with the same key multiset. The query and most recent insertion are inspectable separately.

Full reset restores order A/seed19, bounds 63–63, index plan, insertion key79, no additions, first query and split steps, query view and closed details. Standard HTML provides the 2D rendering and keyboard fallback. The scene contains no playback-dependent computation or resource-failure blank canvas.

## Evidence — September 6, 2026

- `pnpm exec vitest run src/models/database-index.test.ts`: **7 tests passed**. Tests verify 618 sequential committed inserts across ascending, descending, all-duplicate and 12 seeded sequences; capacity, fanout, separator minima, exact leaf order, reachability and height after every insertion. They also check range/equality results against an independently sorted filter, trace counters, both split types, root growth, old-snapshot immutability, invalid/boundary inputs and 168 forward/backward direct-seek states.
- Separate Python SQLite 3.53.4 reference: **8,580 query predicates × both access plans** over 11 datasets. `SELECT ... WHERE key BETWEEN ... ORDER BY key,rowId` matches key, row ID, payload and heap location. SQLite is a result oracle; this does not claim that SQLite uses this B+ tree implementation.
- Targeted strict TypeScript diagnostics on model/test/experiment/renderer: **0**. Chinese string-literal coverage audit: **0 missing translations**. Packet overlaps preserve current shared dictionary wording.
- Both MDX files compile through the installed Astro MDX/satteri renderer. Cover compiles with Astro compiler/runtime, renders with AstroContainer, then rasterizes with Resvg to **400×230**. Its diagram is a labeled path excerpt from the actual default tree. No borrowed art or code assets.
- Isolated review tree at `/tmp/vistep-database-index-review`, with its own React/esbuild dependencies. No shared package, lockfile, node_modules symlink or build output changed.
- Browser exclusively through CUA, own in-app tab. Final phone sweep: **80 bilingual samples**, 8 chapters ×5 progress points ×2 languages at **320×900**. Stage heights **820–871.477px**, minimum text **16px**, no document or descendant horizontal overflow. This is viewport measurement, not complete viewing.
- Desktop: 16 bilingual chapter samples at 1100×900; sampled stage heights 725.742–799.328px, no document overflow. Visual screenshots inspected for desktop lookup and phone record lookup, leaf split, internal split, broad-query comparison and the range stopping past47.
- CUA manual checks: both plans return `r6,r7,r8` for42; insertion adds `r25`; a fresh79 insertion exposes a leaf split and parent update; End/Home, next-step, invalid bound, heap-order reset and full reset exercised. Every measured input/select/button is at least **44px high** and at least117px wide. Browser error log empty in the fixture.
- **Not claimed:** continuous 176-second viewing, shared transport/voice synchronization, audio listening, physical-phone or native-browser performance, full repository checks, preview/production build or deployment. The fixture contained no audio/video elements, so it provides no media `currentTime` evidence. Parent owns these remaining integration/release checks.

## Primary references and attribution

- [CMU 15-445 Lecture08, Indexes & Filters I](https://15445.courses.cs.cmu.edu/fall2024/notes/08-indexes1.pdf): B+ tree invariants, duplicate-key row IDs, leaf copying versus internal promotion.
- [PostgreSQL18 B-Tree Indexes](https://www.postgresql.org/docs/18/btree.html): ordering requirements, cascading splits and root growth.
- [PostgreSQL18 Index-Only Scans and Covering Indexes](https://www.postgresql.org/docs/18/indexes-index-only-scans.html): secondary index versus heap access and scope of index-only behavior.

Algorithm and SVG/HTML/CSS are independently authored. References inform the explanation; no source code, diagrams or third-party assets were copied.

## Frozen integration packet and ownership

Temporary packet: `src/data/scene-packets/database-index.json`, exact parent contract, no topic number. Related topics: memory-cache, hash, cpu-pipeline. Parent integrates and removes/absorbs the temporary handoff as appropriate; this is not a second canonical narration source.

**Frozen:** all eight cue IDs, bilingual spoken scripts, chapter titles, captions, 176-second duration, chapterAt and at values. SHA-256 of `JSON.stringify(packet.narration)`:

`c7157b011a8e770861c202c061ceea6c744c29a3c5bd7a6ee72ecce44cc125db`

Owned paths:

- `src/models/database-index.ts`
- `src/models/database-index.test.ts`
- `src/components/experiments/DatabaseIndex.tsx`
- `src/components/lab/DatabaseIndexPages.tsx`
- `src/styles/database-index.css`
- `src/components/covers/DatabaseIndexCover.astro`
- `src/content/database-index.mdx`
- `src/content/en/database-index.mdx`
- `docs/examples/database-index-brief.md`
- `docs/zh-CN/examples/database-index-brief.md`
- `src/data/scene-packets/database-index.json`
