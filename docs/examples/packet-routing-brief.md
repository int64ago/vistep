# Packet routing — production brief

[简体中文](../zh-CN/examples/packet-routing-brief.md)

Current recording revision (2026-09-06): both tracks run **181.5 seconds**. See [the refinement record](../qa-expansion-refinements.md) for the updated windows and review limits. Earlier recording names, timings and review results below describe the preceding version.

## Integrated film

The assembled Chinese and English tracks share **182 seconds**. The original 176-second storyboard below is the initial handoff; measured speech determines the final windows here. Authored chapter titles, captions and spoken wording are unchanged. Temporary packet paths below refer to the consumed handoff. `src/data/narration.json`, `film-timeline.json`, `audio-tracks.json` and `audio-manifest.json` are canonical.

| Chapter                                 | Measured window |
| --------------------------------------- | --------------- |
| 1. Each router chooses a next hop       | 0–22.5 s        |
| 2. Shortest means least routing cost    | 22.5–44.5 s     |
| 3. Wait, then serialize the packet      | 44.5–68 s       |
| 4. TTL bounds forwarding                | 68–90 s         |
| 5. A neighbor notices the failure first | 90–112 s        |
| 6. Routes converge after updates spread | 112–134.5 s     |
| 7. A full queue drops arriving packets  | 134.5–158 s     |
| 8. Arrival order is not delivery order  | 158–182 s       |

Recordings: `/narration/packet-routing-zh-f516a094c21e.mp3` · `/narration/packet-routing-en-91b189c4e854.mp3`

Full continuous viewing, native bilingual listening and physical-phone performance remain separate pending evidence.

---

## Visual argument

Follow a persistent datagram ID across a small network, then discover that the next hop depends on each router's **current local information**. The midnight-blue network is the principal object: rounded routers, terminal hosts, continuous links, a single labeled selected packet, quieter other in-flight packets, queue occupancy badges and violet topology notices. Cost labels sit on outward link normals, clear of packet markers. There are no decorative traffic streams or invented transfer rates.

Desktop is a horizontal branching network; phone is a vertically composed kite with source above A, B/C side by side and receiver below. The diagram is SVG throughout, so its complete explanation survives without WebGL. Only the selected chapter's instrument appears: residence-time strip, local forwarding tables, FIFO queue, TTL steps, update installation, or receive-order slots. The shared Showcase owns the current caption beneath the scene; no duplicate explanatory paragraph appears above the network.

The existing `network` article follows web loading, DNS, HTTP and rendering. This scene instead follows store-and-forward datagrams, topology knowledge and per-hop decisions.

## Frozen eight-chapter film

Chinese and English wording, titles, captions, chapter count/order and director timing are **frozen** at handoff. Eight initial 22-second cues total **176 seconds**; English cues contain 50–55 words. Parent owns measured voice production and central integration.

| Film window | Calculated action                                                                   | Observation                                                                                          |
| ----------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 0–22 s      | P1 traverses S–A–B–R over a 0–40 ms view                                            | Each router receives the whole datagram and chooses one next hop; time has a physical budget         |
| 22–44 s     | Two independently converged trials, B–R cost 1 then 6, each viewed over 0–72 ms     | Administrative least cost selects A–B–R or A–C–R, independent of drawn distance                      |
| 44–66 s     | Four packets at 5 ms intervals, B–R 0.4 Mbit/s; 0–130 ms                            | P3 waits 38 ms before its 24 ms output serialization                                                 |
| 66–88 s     | P1 starts with TTL 2; 0–20 ms                                                       | A decrements to 1, B discards at 0; R never receives it                                              |
| 88–110 s    | B–R fails at 40 ms, P1 in propagation; 0–105 ms                                     | A packet is lost and only neighboring B initially knows the changed topology                         |
| 110–132 s   | Same failure run, now inspect P2 and local tables over 35–150 ms                    | Temporary B↔C loops precede C's 93 ms and A's 94 ms update installation                              |
| 132–154 s   | Identical ten-packet burst; two then eight waiting slots; each trial shows 0–180 ms | P5 is dropped by the small buffer but survives with a 76 ms wait in the large buffer                 |
| 154–176 s   | Initially unavailable B–R returns at 40 ms; 0–235 ms                                | Later packets overtake those already on slow C–R; application delivery waits for a contiguous prefix |

All sample times are derived directly from chapter progress. The two cost and capacity comparisons restart **independent trials with identical release schedules**, not hot-swapping physical state. The convergence chapter intentionally revisits the same event run with a different packet, time window and instrument. No private animation clock or random state advances the simulation. The bounded cache stores a finite set of authored event runs, independent of seek history.

## Declared event model

Nodes S/R are terminal hosts; A/B/C route. S has gateway A. Packets are 1200 bytes, under the declared 1500-byte limit, and all target R. P1…Pn are teaching identities/application sequence positions, not IPv4 fragmentation IDs. The default graph is:

| Link | Data bit rate | Propagation | Administrative cost |
| ---- | ------------- | ----------- | ------------------- |
| S–A  | 4 Mbit/s      | 2 ms        | 1                   |
| A–B  | 2 Mbit/s      | 4 ms        | 1                   |
| A–C  | 2 Mbit/s      | 8 ms        | 1.5                 |
| B–C  | 2 Mbit/s      | 3 ms        | 1                   |
| B–R  | 0.8 Mbit/s    | 8 ms        | 1                   |
| C–R  | 2 Mbit/s      | 40 ms       | 4                   |

Each direction has its own FIFO and transmitter. Waiting capacity excludes the active serialization. Serialization is `8 × bytes / rate`; after its last bit is sent, the packet spends the link's propagation delay in flight. Only complete reception starts the next router's 1 ms processing. At the forwarding decision, TTL decreases once. A zero result is discarded; source and destination do not decrement it. Positive route weights are solved with Dijkstra and lexical tie breaks. Queue occupancy does not silently alter route cost.

Events are ordered by time, then defined priority, then insertion serial. A link event precedes simultaneous installation, transmission completion, arrival and source injection. Failure discards waiting/transmitting/propagating packets assigned to B–R and invalidates their pending completions. Datagrams never resurrect. Routing decisions use the installed local table at that decision time, even if it is stale. Queue choices persist while waiting; this is not a model of arbitrary queued-packet rerouting.

Initial link-state knowledge is synchronized. The only changing advertisement is B's B–R availability, represented by a local versioned copy at each router; all other edges remain known and unchanged. B detects the local event immediately and floods version 1 across router links. A control message is 80 bytes, uses a **separate reserved 64 kbit/s budget per direction**, incurs the real link propagation, and then 40 ms receiving installation processing. Control serialization is queued independently of data. Duplicate versions are neither installed nor reflooded. This is deliberately not full OSPF wire format, acknowledgment/retransmission, Hello detection, aging, adjacency negotiation, areas, prefixes or ECMP. The control rate and processing delay are authored teaching values, not OSPF timers or measured performance.

The packet ledger always partitions all planned IDs into unsent, active, arrived and dropped. Received application data can be held; ordered release is a subset of arrivals, not another counted packet. The application waits for contiguous identities starting at P1. It has no timeout or recovery. A missing P1 therefore keeps later received packets held forever.

Derived default P1 delay is 35.2 ms: 2 ms processing + 19.2 ms serialization + 14 ms propagation. In the failure run, P2 actually follows `S–A–B–C–B–C–B–C–R`, arriving at 142 ms with TTL 1. Two waiting slots drop six of ten burst packets; eight retain all ten when the run completes, although some are still in flight at the film comparison's 180 ms endpoint. In restoration, C–R propagation is explicitly increased to 120 ms; arrival order is **4, 1, 5, 2, 6, 3**. P4 arrives at 131.2 ms but is held until 208 ms. These are model results, not network measurements.

Scope excludes complete IPv4, ICMP generation, checksums, fragmentation, link errors except the authored outage, retransmission, TCP acknowledgments/windows/congestion control, and real router CPU scheduling. The packet marker represents a state/last-bit journey, not a physical packet length. Violet notice movement includes its control serialization and propagation; its destination arc measures remaining installation work.

## Exploration and lifecycle

Manual controls expose 1–12 datagrams, 4–80 ms release spacing, B–R 0.2–2 Mbit/s, 0–10 waiting slots and TTL 1–16. The sample slider spans at least 300 ms and expands to the computed run end. Choose a stable, failed-link or restored-link scenario; select a packet and local router; compare the same inputs with eight waiting slots. All six ranges have explicit translated aria-labels and matching ids/labels. Reset restores every parameter, time, selection, scenario and comparison flag. Controls are at least 44 px, ordinary labels 16 px, and visible keyboard focus is retained.

`useShowcase` owns chapter/progress and visibility/background/reduced-motion behavior. The experiment creates no timer, RAF, Worker, audio or WebGL object. The shared compact-layout hook removes its media-query listener. Computed packet histories are immutable simulation results used for direct seek, not accumulated playback frames. SVG is the complete primary/fallback rendering path.

## Primary references and artwork

- [RFC 2328: OSPF Version 2](https://www.rfc-editor.org/rfc/rfc2328.html), especially flooding and shortest-path calculation: technical basis for local database copies, versions and Dijkstra.
- [RFC 1812: Requirements for IP Version 4 Routers](https://www.rfc-editor.org/rfc/rfc1812.html), forwarding and section 5.3.1: TTL and router responsibility.
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791.html): IP service boundaries; no built-in end-to-end acknowledgment or retransmission.

Accessed 2026-09-06. All circuit/network geometry, cover, state markers and timing strips are original code. No external visual asset or new font was added.

## Evidence, separated by type

**Model:** 18 targeted Vitest tests cover Dijkstra versus an independent Bellman-Ford oracle, deterministic ties, store-and-forward time, complete-packet reception, FIFO serialization exclusion, zero-capacity boundary, matched-input buffer comparison, TTL 1/2/3 limits, noninstantaneous updates, duplicate rejection, temporary loops, failure cancellation, genuine reordering, permanent application gaps, 54 parameter corners with identity/queue invariants, residence-time accounting, eight-chapter seeking, full reset and invalid inputs. Final targeted run: **18/18 passed**, 2026-09-06 00:59:27 Asia/Shanghai, 377 ms. Strict TypeScript passed for the owned model, experiment and renderer; topic-only formatting passed for all 11 files. The integration audit passed with zero errors: 74 interface labels, 90 translations, six named ranges, all metadata/related/source and MDX/cover contracts, and eight 22-second cues. Frozen narration SHA-256 of JSON serialization: `1dc204a66cdc69e2116fd59c3d4a5b8f338c835bbaf29b0f0f41b9ab2fc55f5e`.

**CUA stills and DOM measurements:** an isolated fixture with its own npm-installed React 19.1.1 / React DOM 19.1.1 / esbuild 0.25.9 dependencies, no shared node_modules symlink. It copies only the scene's files, substitutes a chapter/progress context and local translations, and renders the packet caption below the scene. It is not the integrated Astro/Showcase page. CUA inspected Chinese/English 320 px stills for packet forwarding, queue occupancy, convergence, costs and ordered reception, plus 1040 px desktop reception and routing-cost views. Review corrected cramped English ledger labels and packet/metric overlap. A temporary iframe inspection timeout was resolved by fresh fixture document navigation; it is not counted as a passing check.

In a 320 px iframe, 64 samples (both languages × eight chapters × four progress values) measured film heights **675.3–808.5 px**, maximum **896.5 px including the substitute caption and its margin**, with document scroll width 320 px in every sample. These are responsive-fixture measurements, not physical-phone evidence or proof of all production layouts. Final terminology and fixed-width time readout refinements were included in a fresh 64-sample run with the same bounds; this is final-code fixture evidence.

**Keyboard/reset:** CUA used End to change TTL to 16, enabled the eight-slot comparison and confirmed the disabled range displayed the applied value, selected P4 and router C, then verified reset restored TTL 8, capacity 3, comparison off, P1 and A. Model tests cover the entire reset object.

**Not performed:** complete continuous film viewing, shared/native media seeking, either synthesized voice or full bilingual listening, physical-phone performance, and integrated Astro production/preview builds. Parent owns these reviews, central registration, synthesis, media currentTime checks and publication. No shared registry, translation file, audio output, package/lockfile, git state or deployment was modified.

Temporary packet: `src/data/scene-packets/packet-routing.json`. It omits topic number and preserves shared translation wording. After parent consumption, canonical registries replace the temporary handoff as the published source of truth.
