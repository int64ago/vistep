# Multimeter experiments — author handoff

Textbook: PEP required 3, printed 72–75. Two contiguous learning paths: practice (7 chapters / 156 s) and faults (3 chapters / 76 s). Whole group 232 s.

Misconception: the same pointer/lead arrangement can be used unchanged for every quantity; any lamp-terminal voltage proves an intact lamp. Prior knowledge: closed circuits, voltage/current, resistance. Tracked objects: red and black probes. Each chapter changes actual topology, specimen, calibration or test location.

Art direction: one physically connected analog instrument with curved probe leads. The meter and measured apparatus form a vertical composition for phones; no detached decorative meter card. The enlarged nonlinear ohm scale and function knob share the same calculated pointer. Desktop limits apparatus width to preserve readable proportions. Film topology changes at chapter boundaries; within a diagnosis chapter changes correspond to separate explicitly named cases.

Science: source constraints and formulas are in bilingual MDX. Primary sources: HIOKI 3007 instrument manual https://www.hioki.com/download/29783 (black-positive internal ohm supply), HIOKI input resistance https://www.hioki.com/us-en/support/faq/detail/id_121 (20 kΩ/V), OpenStax 10.4 https://openstax.org/books/university-physics-volume-2/pages/10-4-electrical-measuring-instruments (measurement topology/loading).

Independent numerical benchmarks within author tests: calibrated half-deflection occurs at midpoint resistance; Shockley/load-line current satisfies both equations; wire/switch/socket fault probes obey the loaded network. Boundary counterexamples: open circuit → zero deflection/infinite resistance; wrong zero alters indicated resistance; polarity reversal sends DC pointer backward; an inadequate range gives explicit over-range status; socket voltage does not prove an intact filament. Fault candidate set is explicitly limited. Diode apparent resistance changes with range; analog ohm polarity is not generalized to digital meters.

Author checks: 5 targeted model tests passed, packet validation passed (244 at validation), TSX syntax has zero diagnostics, all renderer Chinese literals have bilingual packet keys, owned files formatted. No real browser operation, complete viewing, audio listening, narrow-screen capture or physical-device performance claimed. Root owns those acceptance steps, shared registration, narration and deployment. Cover derives pointer from the same ohmmeter model.
