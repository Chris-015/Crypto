---
name: Admin-reported investment baselines
description: Rules for keeping admin-assigned investment figures consistent when principals change.
---

When Operations changes an existing investment principal, reset the reported portfolio baseline and earnings history to the new assigned amount; rate-only edits preserve accrued value.

**Why:** Leaving the previous compounded value in place makes the displayed principal, daily profit, and portfolio value internally inconsistent.

**How to apply:** Treat a principal change as a new reporting baseline, keep compounding enabled by default, and keep all reported earnings separate from withdrawable balances.