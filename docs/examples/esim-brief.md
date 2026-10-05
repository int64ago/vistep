# eSIM: follow the same protected profile

[简体中文](../zh-CN/examples/esim-brief.md)

## Causal question

A phone has no SIM tray. Where does its subscriber identity live, and how does scanning a code place a new subscription there? Follow one travel profile from its download reference, through mutual authentication and a bound package, into the same physical eUICC. The decisive comparison copies that bound package to a different chip and rejects it. Installation and enable are separate visible steps.

Use consumer GSMA RSP with the activation-code route and an LPA in the device. Do not combine this with the unattended IoT SGP.32 architecture. Age 12 is suggested because the film distinguishes a reference, protected credentials and an authentication response; optional standards detail is not a prerequisite.

## Original art and phone direction

An original engineering cutaway reveals a board, shielded processing area, traces, battery and a discrete eUICC. This is a conceptual soldered implementation, not a copy of a specific phone or a dimensionally exact semiconductor package. The same chip position and phone proportions drive the cover. The secure-chip inset enlarges a real object; padlocks denote protection boundaries and show no key material.

The film changes representation with the causal question: physical cutaway; activation-reference fields; a two-party authentication sequence; movement of the same bound package through LPA; isolated storage slots; and mobile challenge-response. Desktop delivery runs horizontally. Phone delivery uses a vertical path while preserving the same three named actors, and every other chapter gives its current evidence the full width. Text labels are in actual CSS pixels: the SVG viewBox width follows the measured stage width. The film art is 342 px high at all widths. The complete bilingual player still requires integrator browser review.

The activation-code mosaic is deliberately not a functional QR code. Its incomplete reference uses the reserved `.invalid` domain. No real token, EID, IMSI, ICCID or network key appears. Film and fallback use the same lightweight SVG renderer, so there is no runtime WebGL or Worker dependency to fail. This does not bypass the site's startup browser capability gate.

## Planned shared windows

Six 24-second windows plan a 144-second film; assembled speech determines the canonical duration. Recorded timing, ASR, native listening and full playback are separate evidence.

| Window    | Visible causal change                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 0–24 s    | Phone shell reveals its board and eUICC; a connected inset identifies the same chip.                                                     |
| 24–48 s   | Activation reference separates server location from subscription reference; LPA locates the prepared profile.                            |
| 48–72 s   | Server identity is checked before the chip proves itself; only both success states permit binding.                                       |
| 72–96 s   | BPP crosses LPA into A in eight teaching segments; a copy addressed to B is rejected.                                                    |
| 96–120 s  | Full installation creates a disabled travel profile; later enabling selects it and retains the daily profile.                            |
| 120–144 s | Enabled profile computes a network response using protected K; switching profile changes the identity and triggers fresh authentication. |

All directed state comes from chapter and chapter progress. There is no independent continuous timer. Direct seek immediately reconstructs the protocol prerequisites, received segments, stored profiles, active identity and network-authentication outcome. The copy comparison has an independent rejected recipient while the original transaction remains successful.

## Model and explicit limits

`src/models/esim.ts` enforces locate → server authentication → chip authentication → binding → complete receipt → installation → enable. Network authentication is a later operation. The old profile survives rejected server trust, a different recipient, modified package or missing initial internet. Receive counts are monotone, installation requires all eight illustrative segments, and immutable updates preserve inputs. Single-port switching invalidates network-authentication state.

This is a protocol state machine, not a cryptographic implementation. Pass/fail inputs represent real certificate, binding and integrity outcomes; no production signature, ECDH, encryption, APDU encoding or operator service runs here. Eight blocks are not a measured file size, throughput or APDU count. Failure inputs restart the same deterministic transaction; they are not live packet interception. The offline case concerns absence of a connection before download, not mid-transfer retries.

The diagram deliberately permits one enabled profile. Modern dual-eSIM or multiple-enabled-profile capability depends on ports, modem, OS, device and operator support. Stored capacity and concurrent active lines are different limits. Profiles may also be managed through other consumer discovery/transfer paths, which this film does not cover.

## Primary references

- [GSMA SGP.21 v2.6](https://www.gsma.com/solutions-and-impact/technologies/esim/wp-content/uploads/2024/09/SGP.21-v2.6.pdf): consumer scope; §1.4 object definitions; §4.3 EUICC1, 5, 6, 21–29, 38 for secure hardware, isolation, credential protection, disabled installation and unchanged state after failure; §4.11 LPA; §5.2 activation-code path.
- [GSMA SGP.22 v2.2.2](https://www.gsma.com/solutions-and-impact/technologies/esim/wp-content/uploads/2020/06/SGP.22-v2.2.2.pdf): §§2.5–2.6 package types/protection and §3.1.2 common mutual authentication.
- [Apple, Use Dual SIM on iPhone](https://support.apple.com/en-euro/guide/iphone/iph9c5776d3c/ios): examples of two eSIM support, qualifying the single-enabled-port illustration.

All object artwork, choreography, prose and code are original. Standards diagrams are not reproduced. Author self-review and targeted tests do not establish independent visual acceptance, speech listening or physical-phone performance; the integrator records those separately before publication.
