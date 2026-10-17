# Database transactions — author brief

Misconceptions: a transaction immediately exposes each write; atomicity alone makes stale read/absolute-write logic safe; an aborted retry automatically succeeds. Scope is a reservation application state machine, not a database emulator. Prerequisite: inventory and order counts. Different from database-index: visibility and concurrent correctness, not lookup cost.

Art direction: public stock ledger over two private transaction envelopes, mauve T1 and slate T2. Public stock and order count change in one state transition; proposed writes stay inside envelopes until commit. A visible conservation equation exposes the anomaly. Phone retains two narrow lanes, short16px labels and23px values; long descriptions/details move out of watch mode. Stage budget roughly390px, no scaled text; complete-player measurement pending.

| Claim                                                        | Primary source / qualification                                                                                                               |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Transaction atomicity and rollback                           | [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial-transactions.html); private staged model, no persistent storage       |
| Isolation governs concurrent effects and may require retries | [PostgreSQL isolation reference](https://www.postgresql.org/docs/current/transaction-iso.html); our version validation is not PostgreSQL SSI |
| Old application read/absolute write can lose one decrement   | Independent exact interleaving; no claim every DB/isolation/update allows this                                                               |

Six shots, planned132s: public1/0; staged private0 while public1/0; rollback discards draft; two old reads produce atomic but inconsistent0/2; validation aborts second commit and keeps0/1; retry reads0 and refuses another order. Capacity1–3 and serial/overlap schedules recompute the actual state. No network, disk or timing simulation; durability reserved for WAL.

Independent benchmarks: all70 merge-interleavings of two ordered four-event transactions at initial capacities0–3; invariant at every validated frame; known unchecked counterexample; input mutation/rollback and malformed action checks. Four focused tests. Author checks are distinct from independent scientific review, browser, full viewing, both recordings/listening and device tests, all pending. Computing age12; related database-index,bloom-filter,lz77. Suggested reverse link from database-index to distinguish query speed from transaction semantics. Speech pending shot acceptance.
