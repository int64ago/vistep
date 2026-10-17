# Congestion: finite queue, causal sawtooth

Track numbered packets through one service bottleneck. Start with an unresponsive sender, then ACK-driven slow start, real overflow and proportional recovery. The chart is computed from the same FIFO history as the visible queue. The controlled buffer chapter changes storage only at the same observed round. Phone rearranges sender/exit into one row and gives the queue the full width; graph and all text remain legible. Explicit limit: RTT-binned AIMD, not complete packet-level Reno, and drops are counted without retransmission.

Primary sources

- [RFC 5681: TCP Congestion Control](https://www.rfc-editor.org/rfc/rfc5681)
- [RFC 6928: Increasing TCP’s Initial Window](https://www.rfc-editor.org/rfc/rfc6928)
