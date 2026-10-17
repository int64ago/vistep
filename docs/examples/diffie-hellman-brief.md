# Diffie–Hellman — author brief

Misconceptions: a secret is transmitted directly; public exchange automatically authenticates a peer; visual complexity makes a toy group safe. Prerequisite: modular exponent composition. Different from digital-signature: agreement on a shared input to key derivation, not a proof about an authored message.

Art direction: two differently colored exchange folios, showing private exponent, public outgoing, actual received and locally computed shared value. No mixing-paint metaphor. Agreement is an actual modular equality. Enumerating the tiny group replaces the folios with a candidate table; MITM preserves both folios but substitutes actual received numbers and exposes both attacker results. Dark soft semantic colors (#35585b/#365365) on pale backgrounds, HTML16px minimum. Desktop max620px; phone short labels and compact private/received rows retain all causal numbers. Stage target400px with caption/transport budget740px pending review.

Claim basis: [RFC2631§2.1.1,§2.1.5](https://www.rfc-editor.org/rfc/rfc2631.html) for g^(ab) and subgroup validation. Historical source only: no adoption of its old KDF. Explicit insecure p23/q11/g2; no secrecy theorem from toy examples, no production cipher, KDF or authenticated channel claimed. Intermediary construction is independently calculated.

Seven shots, planned147s: private exponents; publish18/13; exchange only public values; derive6/6; changing Alice6→7 changes both shared results to9; enumerate10 candidates to recover6; substitute8/16, endpoints13/18 and attacker derives both. Equality alone does not authenticate; accidental endpoint equality under other inputs does not prevent MITM knowledge.

Four focused tests: all100 exponent pairs against BigInt, all100 MITM endpoint/attacker equalities, full11-element subgroup enumeration, membership/scalar guards. No external browser resources or independent clock. Model/MDX author evidence only; keyframes/full playback/recording/listening/devices/independent review pending. Computing age14; related digital-signature,hash,network. Speech pending keyframes.
