# Cells and handover: why a call survives the journey

[简体中文](../zh-CN/examples/cell-handover-brief.md)

## Question and scope

Why doesn't a call drop while you move? Follow one phone, in a call on a bus, along one street through a city of three-sector macro sites. The reader's intuition is that a phone connects to the nearest tower and that cells are fixed hexagons. The turning point is that boundaries are not drawn: they emerge from comparing each cell's received signal, which fluctuates, and the network hands over only when a neighbour is clearly stronger for long enough.

Scope: LTE-style connected-mode mobility (event A3 with hysteresis and time to trigger, X2/Xn handover with data forwarding) and idle-mode reselection, tracking areas and paging. 5G radio capacity (bandwidth, OFDM, MIMO) belongs to `mobile-5g`; SIM identity, authentication and home routing belong to `mobile-roaming`. Suggested starting age: 10. The main film needs only "stronger/weaker signal", a moving object and a timeline; the A3 inequality and filter equation stay in the article's details.

## Original visual direction

A calm dusk city seen from above. Sites are small masts with three coloured sector petals; the street is the one road the phone follows. Signal strength is rendered as light: each spot glows with the long-term RSRP of its strongest cell, and thin warm lines mark where two cells tie. Colour identifies a cell, never a frequency (the film says so where it matters, because reuse-1 is the modern case).

Under the map sits the chapter's instrument, sharing the stage height: the journey's serving-cell ribbon, a resource-block strip, a dBm ruler, RSRP traces with lanes, or the idle camping ribbon. The handover chapter replaces map and instrument with a message ladder above a to-scale receive timeline. Desktop shows the whole street; the phone follows the handset with a tighter camera and keeps the same instrument, with fixed two-line status height so nothing jumps. Speech names cells and instruments (F1, the thick trace, the ladder), not screen directions.

## Chapters (provisional 22–26 s windows; director is chapter-relative)

| Chapter                           | What changes                                                                                                                                                  | Model state                                       | Desktop / phone                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| 1 Changing cells on the move      | Phone drives the whole street; link line and coloured trail change at each of 8 handovers; textbook hexagons dashed                                           | `chSimulate(CH_DEFAULT)` serving cells            | Full map + journey ribbon / follow camera         |
| 2 Limited spectrum, reused        | 120 fixed people appear; the phone's cell F1 has 14 sharing 50 resource blocks; sites double in density, the same people regroup and 7 share the phone's cell | `chAssign` for ISD 500 and 250 m, reuse-1         | Map zooms to the phone, two PRB rows              |
| 3 Boundaries from signal strength | Field sweeps in without shadowing (hexagons emerge from the model), then shadowing bends them; probe shows nearest site G vs strongest cell F1                | `chField` σ = 0 and 6 dB, `chNearestNotStrongest` | Full map + dBm ruler / camera fits phone, G and F |
| 4 The phone keeps listening       | Phone drives the first 60 %; top-3 RSRP traces grow; dotted listen lines to neighbours                                                                        | L3-filtered measurements                          | Full map + traces / follow                        |
| 5 Hysteresis and time to trigger  | Same stretch replayed: 0 dB/0 ms → 9 handovers; 3 dB/320 ms → band and TTT ring (slow motion) → 1                                                             | `chCompareWindow` on identical inputs             | Zoom to G–H boundary + traces with two lanes      |
| 6 The handover itself             | Ladder of 14 messages; packets keep numbers through trays; 33 ms receive gap; forwarded then new-path packets                                                 | `chLadder`, `chPacketAt`                          | Ladder + timeline, short node names below 340 px  |
| 7 Finding an idle phone           | Tracking areas as regions; silent reselections; one update when camping in TA 2; paging rings at all 21 cells; answer                                         | `chIdle` (R criterion)                            | Full map + camping ribbon / follow                |

## Model and numerical conventions

- Layout: 13 hexagonal three-sector sites, ISD 500 m, boresights 0/120/240°; textbook hexagon side ISD/3.
- RSRP = 46 dBm − 10·log10(600) + 14 dBi + A(θ) − 9 dB (vehicle) − PL − σ·S. A(θ) = −min(12(θ/70°)², 25 dB) (TR 36.814). PL = 128.1 + 37.6·log10(d₃D/km), 32 m mast, 1.5 m handset, 35 m minimum (TR 25.814). S: unit-variance seeded lattice field, ~50 m decorrelation, 0.5 inter-site correlation, shared by a site's sectors; σ = 6 dB in the film (8 dB is the evaluation value).
- Measurements: long-term RSRP plus seeded AR(1) fluctuation (1.6 dB, 0.3 s), L3 filter k = 4 adapted from 200 ms to 40 ms steps.
- A3: Mn − Hys > Ms + Off held for TTT (standard enumerations only), execution 60 ms; ping-pong = return within 1 s (TR 36.839). SINR assumes full load; RLF if SINR < −8 dB for 1 s, re-establish after 1 s.
- Idle: Rn > Rs + 4 dB for 1 s after ≥ 1 s camping; TAU when the camped cell's TA differs from the registered one.
- Ladder: 1 ms air, 5 ms backhaul, T_interrupt = 20 ms + TIU (4 ms) for a known cell (TS 36.133 bound ≤ 50 ms).
- Film facts used by the narration are locked by `cell-handover-film.test.ts`.

## Limits

No fast fading simulation, vertical pattern, multiple carriers, load, CRE, DAPS/CHO or vendor algorithms. Users share PRBs equally regardless of SINR. The numbers are a controlled comparison, not a network prediction. Packet numbers track order only.

## Sources

3GPP TS 36.331 (§5.5.3.2, §5.5.4.4), TS 36.300 (§10.1.2.1.1), TS 38.300 (§9.2.3.2.1), TS 36.133 (§5.1.2.1), TS 36.304 (§5.2.4.6), TS 23.401 (§4.3.5.3, §5.3.3, §5.3.4.3), TS 36.214 (§5.1.1), TR 36.814 (Annex A.2.1.1), TR 25.814 (Table A.2.1.1-3), TR 38.901 (§7.4.3), TR 36.839 (§5.2.2), ITU-R M.2410. Links are in the article.

## Evidence

Model tests: `src/models/cell-handover*.test.ts`. Author self-review of headless stills at 1280, 390 and 320 px in Chinese, and English via the packet dictionary. Not yet done: recorded narration, listening, continuous playback review by an independent reviewer, real-device performance.
