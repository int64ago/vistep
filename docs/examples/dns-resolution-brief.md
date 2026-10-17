# DNS resolution — author brief

Misconception: DNS servers forward the same request down a ladder, and every lookup starts at the root. Prerequisite: a name and an address differ. Distinction: `network` treats DNS as one milestone; this film follows the resolver's individual requests, returned referrals and separately expiring records.

Art direction: a lavender address directory. One resolver remains anchored while three authority entries return directions to it. Message identities and record keys persist. Desktop gives the branching paths room; phone uses two columns with HTML labels in CSS pixels, never scaled SVG text. Cache close observation carries the later chapters. The line marker uses the same segment endpoints as the highlighted connection.

| Claim                                                                                        | Primary source / section                                       | Conditions                                                        |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| Recursive service returns an answer/error, while non-recursive service may return a referral | [RFC 1034 §4.3.1](https://www.rfc-editor.org/rfc/rfc1034.html) | Recursion requested and available; successful A scenario here     |
| A resolver follows the closest known delegation and may cache records                        | RFC 1034 §5.3.3                                                | Server addresses are assumed available; one server per zone shown |
| TTL is an upper bound on retention                                                           | [RFC 2181 §8](https://www.rfc-editor.org/rfc/rfc2181.html)     | No serve-stale extension or early eviction in the toy cache       |
| `.test` is reserved                                                                          | [RFC 2606 §2](https://www.rfc-editor.org/rfc/rfc2606.html)     | Fictional delegation; no live lookup                              |

Independent benchmark: hand-count cold client/resolver exchange plus three upstream query/reply pairs (8 messages), warm lookup (2), expired A with live NS (4). Boundary counterexamples: expiry exactly at 60 s; TTL zero; changed authoritative address while an old A remains live; all delegation records expired at 3600 s. These are numerical/semantic checks, not independent visual acceptance.

Six shots: request contract; root referral returned; TLD referral returned; authority address and cache; t=20 cache hit with remaining 40 s; t=65 A refresh bypassing root/TLD with a changed address. Each adds a distinct visible state. Planned windows 22 s each are provisional until measured bilingual speech; no stretched loop.

Integration: category `computing`, age 10; related `network`, `packet-routing`, `public-key`. Suggested backlinks: network's DNS paragraph → this expanded resolver view; packet-routing → logical naming versus packet paths.

Evidence: author source/model checks only. Browser keyframes, complete watching, synthesized speech/listening, physical-device performance and independent review remain not-run for the integration owner. Speech cues refer to record/server names rather than screen directions. Caption and script freeze awaits the first desktop/phone keyframe review.
