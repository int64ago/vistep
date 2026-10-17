# TCP: a trace with identities, not anonymous traveling dots

Track byte range B, sequence 1100–1199, across delay, loss and retransmission. The two lifelines show timed data and cumulative ACKs; the receiver's delivered prefix and waiting buffer are independent views of the same deterministic event state. A separate ACK-loss case shows real duplicate suppression. Phone keeps one timeline and compact prefix/buffer rows with CSS text. Timings, fixed send limit and omitted protocol functions are disclosed. This scene does not impersonate a full TCP implementation.

Primary sources

- [RFC 9293: Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293)
- [RFC 6298: Computing TCP Retransmission Timer](https://www.rfc-editor.org/rfc/rfc6298)
