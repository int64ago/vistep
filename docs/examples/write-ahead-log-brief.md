# Write-ahead logging — author brief

Misconception: writing memory/log buffers is durability; success requires every data page first; missing acknowledgement proves no commit; WAL means all engines replay only committed physical records. Prerequisite: volatile versus durable storage. Distinct from database-transactions: recovery after crash, not concurrent visibility.

Art direction: warm sequential log tape between a volatile memory page and durable data page. Two record tiles gain a quiet durable baseline; crash removes only memory and nondurable records. A separate two-case final composition shows update-only versus durable-commit/no-ack outcomes. No pretend spinning disks or timing numbers. Desktop content max640px; phone73px lane labels,16px log records and30px page values. Watch details hidden. Stage roughly350–400px, complete player≤740px target awaiting real measurement.

| Claim                                                              | Primary source / conditions                                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Corresponding WAL durable before a data page                       | [PostgreSQL18 WAL](https://www.postgresql.org/docs/18/wal-intro.html), storage honors flush                               |
| Synchronous acknowledgement requires durable commit; async differs | [PostgreSQL asynchronous commit](https://www.postgresql.org/docs/18/wal-async-commit.html), no performance recommendation |
| Update-only/no-ack outcomes in this logical model                  | Explicit single-page no-steal policy; not PostgreSQL physical replay/visibility implementation                            |

Six shots, planned132s: memory11/page7; commit record buffered but not durable; both log records durable and acknowledged before page write; crash erases memory; recovery restores11 by LSN; compare durable update without commit→7 versus durable commit without acknowledgement→11. Exploration changes value and five crash boundaries. Real checkpoints, torn pages, undo/MVCC and disk latency are excluded and disclosed.

Independent tests: all five crash boundaries×five values including0/1000; expected committed-state oracle; repeat crash/recovery idempotence; ordering guards for WAL-before-page and durable-before-ack; explicit no-steal rejection. Four focused tests pass. Source and prior snapshots never mutate. Browser, complete playback, recording/listening, devices and independent review remain not-run. Computing age12; related database-transactions,database-index,lz77, suggested reverse link from transaction durability discussion. Speech pending shot acceptance.
