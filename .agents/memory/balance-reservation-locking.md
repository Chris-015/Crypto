---
name: Balance reservation locking
description: Cross-instance serialization rule for operations that reserve or invalidate withdrawable funds.
---

Any operation that reserves withdrawable funds or invalidates credited funds must take the same transaction-scoped database lock for every affected user before recalculating balances and writing ledger entries.

**Why:** Process-local checks cannot prevent two API instances from accepting requests against the same pre-write balance.

**How to apply:** Acquire affected-user locks in a deterministic order, recalculate from persisted ledger rows inside the transaction, and commit the state change with its linked transaction records atomically.