---
name: Approved-deposit investment baselines
description: Rules for linking investment principals to deposits approved by Operations.
---

The latest deposit approved by Operations is the source of truth for the investment principal. A newly approved amount resets the portfolio baseline and earnings history; rate-only edits preserve accrued value.

**Why:** The user expects the investment to show the exact amount they requested and Operations approved, rather than an independently editable principal.

**How to apply:** Approve the deposit first, sync its amount into the investment record, keep compounding enabled by default, and keep earnings separate from withdrawable balances.