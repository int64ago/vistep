# Consistent hashing: fixed positions, changing successors

Track one key on a true clockwise successor ring. Start with exact modulo churn, introduce the ring and explicit wraparound, then add and remove a physical token without moving old positions. A load-count view exposes imbalance; virtual tokens split actual intervals before adding D again. Phone retains the complete circle, CSS-pixel labels and measured per-node load bars. The scheme is deterministic and collision ordering is explicit. No implication that assigning ownership performs replication or transfer.

Primary sources

- [Karger et al., Consistent Hashing and Random Trees (1997)](https://people.csail.mit.edu/karger/Papers/web.pdf)
- [Karger, Consistent Hashing: Load Balancing in a Changing World](https://people.csail.mit.edu/karger/Talks/Hash/index.htm)
