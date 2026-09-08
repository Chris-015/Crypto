---
name: Deposit correction safety
description: Durable policy for correcting approved deposits and linked referral rewards.
---

Approved deposits remain approved and immutable. Corrections append compensating deposit and referral entries, require a meaningful Operations reason, and cannot be repeated.

**Why:** Reopening or deleting financial history obscures what was originally approved, while correcting only one credited party leaves balances unreconciled.

**How to apply:** Before recording any compensation, block the entire correction when the depositor or linked referral recipient has a non-rejected withdrawal. Record both compensations and one linked audit event as a single operation.