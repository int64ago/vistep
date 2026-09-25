# Mobile roaming: how a foreign network recognises you

[简体中文](../zh-CN/examples/mobile-roaming-brief.md)

## Question and scope

Abroad, how does your phone still know who you are? The common intuitions are that the home operator's signal somehow reaches abroad, or that the foreign network simply trusts the SIM. The decisive observation overturns both: the visited network never learns the subscriber key K. It reads the home network identity from the IMSI (MCC + MNC), asks the home network over the roaming exchange (IPX) for an authentication vector, and the SIM proves itself by computing a response from a random challenge with K, while also verifying that the challenge came from home (AUTN). Home then records where the subscriber is, and calls and data follow routes decided by that record and by the roaming architecture.

The tracked object is one subscription identity: the IMSI digits and the key K that never leaves the SIM or the home network. Scope: automatic PLMN selection, EPS AKA with MILENAGE, S6a location update, home-routed versus local-breakout data, and a circuit-switched mobile-terminated call. Radio cells, measurements and handover belong to the sibling `cell-handover` scene; radio capacity belongs to `mobile-5g`. The suggested starting age is 12: the film needs place value in multi-digit codes, the idea of a secret shared by two parties and a round trip; hex values and equations stay optional.

## Visual direction

A calm two-country map slice: the visited country on the left, home on the right, a sea between them with the IPX node on it. Every network element is a small glyph (phone with SIM, towers A/B/C, MME, IPX, HSS, gateways), and a gold key glyph sits only at the phone's SIM and at the home HSS in every frame. Four lane heads under the map (phone, visited, IPX, home) continue downward as the lifelines of message ladders, so geography and message order share the same x positions. Chapter panels change form: a network list that re-sorts from signal order to SIM priority, the IMSI split into coloured digit cells, byte-cell rows for the actual MILENAGE values, the home subscriber record card, stacked round-trip bars and a call ladder. A single line of qualification sits under the panel; model limits live in exploration's details.

Phone: the same map recomposed at 192 px height with no node labels, the lane heads kept, and each panel re-laid out (byte rows wrap to eight cells, labels move above their rows, country labels hide where data or call glyphs need the corners). All SVG text is authored at 16 px in viewBoxes that equal the rendered width, so it renders at 16 CSS px.

## Chapters (provisional 24 s windows; measured speech sets the final timing)

| #   | Chapter                             | What changes on screen / model state                                                                                                                                                                                                          | Desktop vs phone                                    |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | Landing and switching on            | Towers emit rings scaled by modelled RSRP; rows appear in signal order (C −79, B −90, A −97 dBm); home 001-01 absent; rows re-sort into SIM priority (A #1, B #2, C unlisted); A chosen, link drawn from phone to tower A. `mrSelectNetwork`. | Same list; phone uses taller rows.                  |
| 2   | The SIM says who you are            | SIM card with contact pad and locked key; the 15 IMSI digits are read out, then split into MCC/MNC/MSIN; the home realm `epc.mnc001.mcc001.3gppnetwork.org` is assembled from those digits (MNC padded); a dashed query points home.          | SIM card above the digit row on phone.              |
| 3   | The visited network asks home       | Ladder: attach request (IMSI) → AIR over IPX with a partner check → home computes a vector with K → AIA (RAND, AUTN, XRES, K_ASME). Capsules travel the map route in sync.                                                                    | Shorter ladder labels on phone.                     |
| 4   | Proof without revealing the key     | Byte rows: RAND, locked K, AUTN check band, RES, XRES; RES equals XRES. Then K bit 42 is flipped: the SIM rejects AUTN and RES′ differs from XRES in 34 of 64 bits (computed).                                                                | Rows wrap to 8 bytes; short band text.              |
| 5   | Home records where you are          | Ladder: ULR, cancel the old home MME, ULA with profile, attach accept; the HSS record card changes from 001-01 to 002-01; the old MME glyph is crossed out.                                                                                   | Card full width.                                    |
| 6   | Data: home-routed or local breakout | Same request to a local website: home-routed path phone → visited gateway → IPX → home gateway → Internet back abroad (≈250 ms, home address 198.51.100.23); local breakout (≈30 ms, local address 203.0.113.45). `mrDataRoute`.              | Bar labels above bars; address wraps.               |
| 7   | Someone calls you                   | Ladder: family dials → HLR record → PRN → MSRN → call routed → paging; map shows the voice trunk above the signalling route; finally a local friend's call crossing twice (trombone).                                                         | Short labels; the caller label anchors to the edge. |

## Model and limits

- `src/models/mobile-roaming-milenage.ts`: AES-128 (FIPS-197) and MILENAGE f1–f5, f1*, f5* (TS 35.206), HMAC-SHA-256 (reusing the site's SHA-256 model) and the K_ASME KDF (TS 33.401 Annex A.2), with BCD PLMN encoding. Tests reproduce FIPS-197 examples, TS 35.208 test sets 1 and 2 exactly, and RFC 4231 HMAC cases.
- `src/models/mobile-roaming.ts`: IMSI parsing with explicit MNC length, home realm, TS 23.122 automatic selection order (the standard randomises the high-quality group; the model sorts it by signal for reproducibility), AKA runs with tamper cases (wrong key bit, altered RAND, replayed old vector with AUTS), location update including refusal 5004, a propagation-only latency model (204 km/ms fibre, 1.4× route factor, 25 ms radio, 2 ms per node), and the call route with international leg count.
- `src/models/mobile-roaming-film.ts`: chapter-relative beats, deterministic under seeking.
- Identities are fictional or test values: 001-01 is the 3GPP test PLMN; MCC 002 and operators A/B/C are invented; K/OP/RAND/SQN/AMF are TS 35.208 test set 1. Signal values are illustrative. NAS security mode, ciphering, SUCI computation, IMS, charging records and optimal routing are described in text only.

## Sources

3GPP TS 33.102, TS 33.401, TS 33.501, TS 35.206, TS 35.208, TS 23.122, TS 23.003, TS 29.272, TS 23.401, TS 23.018; ITU-T E.212; GSMA IR.34 and IR.88 (links in the topic registry and articles).

## Evidence

Model tests are automated evidence only. Browser stills were reviewed by the scene author (self-review) at 1280 and 390 px in both languages, with English strings injected from the handoff packet before integration. No recording, listening, complete playback timing or physical-device performance is claimed.
