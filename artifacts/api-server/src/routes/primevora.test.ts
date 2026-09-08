import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";
import express from "express";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import primevoraRouter, {
  setPrimevoraAdminAuthResolverForTests,
  setPrimevoraUserIdResolverForTests,
} from "./primevora";

const app = express();
app.use(express.json());
setPrimevoraUserIdResolverForTests(
  (req) => req.header("x-test-user-id") ?? "demo-user",
);
setPrimevoraAdminAuthResolverForTests((req) => ({
  userId: req.header("x-test-user-id"),
  role: req.header("x-test-role"),
}));
app.use("/api", primevoraRouter);

let server: ReturnType<typeof app.listen>;
let baseUrl = "";

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Test server did not bind to a TCP port");
      }
      baseUrl = `http://127.0.0.1:${address.port}/api`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

const request = async <T>(
  path: string,
  options: {
    userId?: string | null;
    role?: "admin" | "customer" | null;
    method?: string;
    body?: unknown;
  } = {},
) => {
  const isAdminRoute = path.startsWith("/admin");
  const userId = options.userId === undefined
    ? isAdminRoute
      ? "test-admin"
      : undefined
    : options.userId;
  const role = options.role === undefined && isAdminRoute ? "admin" : options.role;
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers: {
      "content-type": "application/json",
      ...(userId ? { "x-test-user-id": userId } : {}),
      ...(role ? { "x-test-role": role } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const body = (await response.json()) as T;
  return { status: response.status, body };
};

const createDeposit = async (userId: string, amount = 500) => {
  const created = await request<{ id: number }>("/deposits", {
    userId,
    body: { amount },
  });
  assert.equal(created.status, 201);
  return created.body.id;
};

const prepareDeposit = async (userId: string, amount = 500) => {
  const id = await createDeposit(userId, amount);
  const assigned = await request(`/admin/deposits/${id}/address`, {
    body: { address: "TTestDepositAddress1234567890" },
  });
  assert.equal(assigned.status, 200);
  return id;
};

const updateDeposit = (id: number, status: "completed" | "rejected") =>
  request<{ status: string; error?: string }>(`/admin/deposits/${id}/status`, {
    body: { status },
  });

const reverseDeposit = (id: number, reason = "Duplicate blockchain confirmation") =>
  request<{ correction?: { reason: string }; error?: string }>(`/admin/deposits/${id}/reverse`, {
    body: { reason },
  });

const referralSummary = () =>
  request<{ earned: number; history: Array<{ depositAmount: number; reward: number }> }>(
    "/referrals",
    { userId: "demo-user" },
  );

test("customers and unauthenticated callers cannot access admin routes", async () => {
  const customerResponse = await request<{ error: string }>("/admin/deposits", {
    userId: "customer-user",
    role: "customer",
  });
  assert.equal(customerResponse.status, 403);
  assert.equal(customerResponse.body.error, "Administrator access required");

  const anonymousResponse = await request<{ error: string }>("/admin/deposits", {
    userId: null,
    role: null,
  });
  assert.equal(anonymousResponse.status, 401);
  assert.equal(anonymousResponse.body.error, "Authentication required");
});

test("customers cannot approve deposits or release withdrawals", async () => {
  const depositId = await prepareDeposit("authorization-deposit-user", 500);
  const deniedDeposit = await request<{ error: string }>(
    `/admin/deposits/${depositId}/status`,
    {
      userId: "customer-user",
      role: "customer",
      body: { status: "completed" },
    },
  );
  assert.equal(deniedDeposit.status, 403);
  const deposit = (
    await request<Array<{ id: number; status: string }>>("/admin/deposits")
  ).body.find((item) => item.id === depositId);
  assert.equal(deposit?.status, "awaiting_transfer");

  const withdrawalId = 24760;
  const deniedWithdrawal = await request<{ error: string }>(
    `/admin/withdrawals/${withdrawalId}/status`,
    {
      userId: "customer-user",
      role: "customer",
      body: { status: "completed" },
    },
  );
  assert.equal(deniedWithdrawal.status, 403);
  const storedWithdrawal = (
    await request<Array<{ id: number; status: string }>>("/admin/withdrawals")
  ).body.find((item) => item.id === withdrawalId);
  assert.equal(storedWithdrawal?.status, "pending_review");
});

test("an approved referred deposit earns exactly one 5% reward when approval is replayed", async () => {
  const userId = "reward-once-user";
  const claimed = await request("/referrals/claim", {
    userId,
    body: { code: "PRIME-8841" },
  });
  assert.equal(claimed.status, 200);

  const before = await referralSummary();
  const depositId = await prepareDeposit(userId, 500);
  assert.equal((await updateDeposit(depositId, "completed")).status, 200);
  assert.equal((await updateDeposit(depositId, "completed")).status, 200);

  const after = await referralSummary();
  assert.equal(after.body.earned - before.body.earned, 25);
  assert.equal(
    after.body.history.filter((reward) => reward.depositAmount === 500 && reward.reward === 25)
      .length -
      before.body.history.filter((reward) => reward.depositAmount === 500 && reward.reward === 25)
        .length,
    1,
  );
});

test("a rejected referred deposit receives no reward", async () => {
  const userId = "rejected-reward-user";
  assert.equal(
    (
      await request("/referrals/claim", {
        userId,
        body: { code: "PRIME-8841" },
      })
    ).status,
    200,
  );
  const before = await referralSummary();
  const depositId = await prepareDeposit(userId, 500);
  assert.equal((await updateDeposit(depositId, "rejected")).status, 200);
  const after = await referralSummary();
  assert.equal(after.body.earned, before.body.earned);
});

test("deposit terminal statuses are idempotent but cannot be reversed", async () => {
  const completedId = await prepareDeposit("terminal-completed-user");
  assert.equal((await updateDeposit(completedId, "completed")).status, 200);
  assert.equal((await updateDeposit(completedId, "completed")).status, 200);
  assert.equal((await updateDeposit(completedId, "rejected")).status, 409);

  const rejectedId = await prepareDeposit("terminal-rejected-user");
  assert.equal((await updateDeposit(rejectedId, "rejected")).status, 200);
  assert.equal((await updateDeposit(rejectedId, "rejected")).status, 200);
  assert.equal((await updateDeposit(rejectedId, "completed")).status, 409);
});

test("approved deposit corrections compensate the deposit and referral reward without changing approval history", async () => {
  const referrerUserId = "correction-referrer";
  const referredUserId = "correction-depositor";
  const referrer = await request<{ code: string; earned: number }>("/referrals", { userId: referrerUserId });
  assert.equal(
    (await request("/referrals/claim", { userId: referredUserId, body: { code: referrer.body.code } })).status,
    200,
  );
  const depositId = await prepareDeposit(referredUserId, 600);
  assert.equal((await updateDeposit(depositId, "completed")).status, 200);
  assert.equal((await request<{ balance: number }>("/dashboard", { userId: referredUserId })).body.balance, 600);
  assert.equal((await request<{ earned: number }>("/referrals", { userId: referrerUserId })).body.earned, 30);

  const corrected = await reverseDeposit(depositId, "Confirmed transfer belongs to another customer");
  assert.equal(corrected.status, 200);
  assert.equal(corrected.body.correction?.reason, "Confirmed transfer belongs to another customer");
  assert.equal((await request<{ balance: number }>("/dashboard", { userId: referredUserId })).body.balance, 0);
  assert.equal((await request<{ earned: number }>("/referrals", { userId: referrerUserId })).body.earned, 0);
  const correctedReferrals = await request<{
    history: Array<{ correction: { amount: number; reason: string } | null }>;
  }>("/referrals", { userId: referrerUserId });
  assert.ok(
    correctedReferrals.body.history.some(
      (reward) => reward.correction?.amount === 30 && reward.correction.reason.includes("another customer"),
    ),
  );
  assert.equal((await reverseDeposit(depositId)).status, 409);

  const adminDeposits = await request<Array<{ id: number; status: string; correction: unknown }>>("/admin/deposits");
  const original = adminDeposits.body.find((deposit) => deposit.id === depositId);
  assert.equal(original?.status, "completed");
  assert.ok(original?.correction);
  const overview = await request<{ auditLogs: Array<{ action: string; reason: string }> }>("/admin/overview");
  assert.ok(overview.body.auditLogs.some((log) => log.action === "Deposit approved" && log.reason.includes(`#${depositId}`)));
  assert.ok(overview.body.auditLogs.some((log) => log.action === "Approved deposit reversed" && log.reason.includes(`#${depositId}`)));
});

test("approved deposit corrections reject whitespace-only reasons", async () => {
  const depositId = await prepareDeposit("correction-reason-user", 500);
  assert.equal((await updateDeposit(depositId, "completed")).status, 200);
  assert.equal((await reverseDeposit(depositId, "          ")).status, 400);
  const deposit = (
    await request<Array<{ id: number; correction: unknown }>>("/admin/deposits")
  ).body.find((item) => item.id === depositId);
  assert.equal(deposit?.correction, null);
});

test("an existing withdrawal blocks an approved deposit correction without changing the balance", async () => {
  const userId = "correction-blocked-by-withdrawal";
  assert.equal(
    (await request("/admin/kyc/701/status", { body: { status: "approved" } })).status,
    200,
  );
  const depositId = await prepareDeposit(userId, 500);
  assert.equal((await updateDeposit(depositId, "completed")).status, 200);
  const withdrawal = await request("/withdrawals", {
    userId,
    body: { amount: 25, address: "TBlockedCorrectionAddress12345678" },
  });
  assert.equal(withdrawal.status, 201);
  const balanceBefore = (await request<{ balance: number }>("/dashboard", { userId })).body.balance;
  const correction = await reverseDeposit(depositId);
  assert.equal(correction.status, 409);
  assert.match(correction.body.error ?? "", /withdrawal/i);
  assert.equal((await request<{ balance: number }>("/dashboard", { userId })).body.balance, balanceBefore);
});

test("withdrawals reserve funds, rejection releases them, completion keeps them debited, and overspending fails", async () => {
  assert.equal(
    (
      await request("/admin/kyc/701/status", {
        body: { status: "approved" },
      })
    ).status,
    200,
  );
  const dashboardBefore = await request<{ balance: number }>("/dashboard");

  const pending = await request<{ id: number }>("/withdrawals", {
    body: { amount: 100, address: "TTestWithdrawalAddress123456789" },
  });
  assert.equal(pending.status, 201);
  assert.equal((await request<{ balance: number }>("/dashboard")).body.balance, dashboardBefore.body.balance - 100);

  assert.equal(
    (
      await request(`/admin/withdrawals/${pending.body.id}/status`, {
        body: { status: "rejected" },
      })
    ).status,
    200,
  );
  assert.equal((await request<{ balance: number }>("/dashboard")).body.balance, dashboardBefore.body.balance);

  const completed = await request<{ id: number }>("/withdrawals", {
    body: { amount: 75, address: "TTestWithdrawalAddress123456789" },
  });
  assert.equal(completed.status, 201);
  assert.equal(
    (
      await request(`/admin/withdrawals/${completed.body.id}/status`, {
        body: { status: "completed" },
      })
    ).status,
    200,
  );
  assert.equal((await request<{ balance: number }>("/dashboard")).body.balance, dashboardBefore.body.balance - 75);

  const overspend = await request<{ error: string }>("/withdrawals", {
    body: { amount: dashboardBefore.body.balance, address: "TTestWithdrawalAddress123456789" },
  });
  assert.equal(overspend.status, 409);
  assert.match(overspend.body.error, /exceeds available balance/i);
});

test("withdrawal terminal statuses are idempotent but cannot be reversed", async () => {
  const completed = await request<{ id: number }>("/withdrawals", {
    body: { amount: 10, address: "TCompletedWithdrawalAddress12345" },
  });
  assert.equal(completed.status, 201);
  const completedPath = `/admin/withdrawals/${completed.body.id}/status`;
  assert.equal((await request(completedPath, { body: { status: "completed" } })).status, 200);
  assert.equal((await request(completedPath, { body: { status: "completed" } })).status, 200);
  assert.equal((await request(completedPath, { body: { status: "rejected" } })).status, 409);

  const rejected = await request<{ id: number }>("/withdrawals", {
    body: { amount: 10, address: "TRejectedWithdrawalAddress12345" },
  });
  assert.equal(rejected.status, 201);
  const rejectedPath = `/admin/withdrawals/${rejected.body.id}/status`;
  assert.equal((await request(rejectedPath, { body: { status: "rejected" } })).status, 200);
  assert.equal((await request(rejectedPath, { body: { status: "rejected" } })).status, 200);
  assert.equal((await request(rejectedPath, { body: { status: "completed" } })).status, 409);
});

test("referral claims work before account activity and fail after activity begins", async () => {
  const beforeActivityUser = "claim-before-activity-user";
  assert.equal(
    (
      await request("/referrals/claim", {
        userId: beforeActivityUser,
        body: { code: "PRIME-8841" },
      })
    ).status,
    200,
  );
  await createDeposit(beforeActivityUser);

  const afterActivityUser = "claim-after-activity-user";
  await createDeposit(afterActivityUser);
  const claim = await request<{ error: string }>("/referrals/claim", {
    userId: afterActivityUser,
    body: { code: "PRIME-8841" },
  });
  assert.equal(claim.status, 409);
  assert.match(claim.body.error, /before the first account transaction/i);
});

test("financial records survive a separately bundled process", async () => {
  const suffix = process.hrtime.bigint().toString();
  const referrerUserId = `restart-referrer-${suffix}`;
  const depositUserId = `restart-deposit-${suffix}`;
  const withdrawalUserId = `restart-withdrawal-${suffix}`;
  const referrer = await request<{ code: string }>("/referrals", { userId: referrerUserId });
  assert.equal((await request("/referrals/claim", { userId: depositUserId, body: { code: referrer.body.code } })).status, 200);
  const correctedDeposit = await prepareDeposit(depositUserId, 500);
  assert.equal((await updateDeposit(correctedDeposit, "completed")).status, 200);
  assert.equal((await reverseDeposit(correctedDeposit, "Restart persistence correction")).status, 200);
  const withdrawalDeposit = await prepareDeposit(withdrawalUserId, 500);
  assert.equal((await updateDeposit(withdrawalDeposit, "completed")).status, 200);
  assert.equal((await request("/withdrawals", {
    userId: withdrawalUserId,
    body: { amount: 100, address: "TRestartReservationAddress123456" },
  })).status, 201);

  const outputDir = await mkdtemp(path.join(tmpdir(), "primevora-persistence-"));
  const childFile = path.join(outputDir, "child.cjs");
  try {
    await build({
      entryPoints: [path.join(process.cwd(), "src/routes/primevora.persistence-child.ts")],
      bundle: true, format: "cjs", platform: "node", outfile: childFile, logLevel: "silent",
    });
    const childOutput = new Promise<string>((resolve, reject) => {
      const child = spawn(process.execPath, [childFile, depositUserId, referrerUserId, withdrawalUserId], {
        env: { ...process.env, NODE_ENV: "test" },
      });
      let result = "";
      child.stdout.on("data", (chunk) => { result += chunk; });
      child.once("error", reject);
      child.once("exit", (code) => code === 0 ? resolve(result) : reject(new Error(`Child process exited ${code}`)));
    });
    const startupWriteUser = `startup-write-${suffix}`;
    const [stdout, startupDepositId] = await Promise.all([
      childOutput,
      createDeposit(startupWriteUser, 500),
    ]);
    assert.ok(startupDepositId >= 1_000_000);
    assert.ok((await request<Array<{ id: number }>>("/deposits", { userId: startupWriteUser }))
      .body.some((deposit) => deposit.id === startupDepositId));
    const result = JSON.parse(stdout) as {
      deposits: Array<{ id: number; correction: unknown }>;
      depositDashboard: { balance: number };
      referrals: { earned: number; history: Array<{ correction: unknown }> };
      withdrawals: Array<{ amount: number; status: string }>;
      withdrawalDashboard: { balance: number };
    };
    assert.ok(result.deposits.some((deposit) => deposit.id === correctedDeposit && deposit.correction));
    assert.equal(result.depositDashboard.balance, 0);
    assert.ok(result.referrals.history.some((reward) => reward.correction));
    assert.ok(result.withdrawals.some((withdrawal) => withdrawal.amount === 100 && withdrawal.status === "pending_review"));
    assert.equal(result.withdrawalDashboard.balance, 400);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("concurrent withdrawal reservations cannot overspend a persisted balance", async () => {
  const userId = `concurrent-withdrawal-${process.hrtime.bigint()}`;
  const depositId = await prepareDeposit(userId, 500);
  assert.equal((await updateDeposit(depositId, "completed")).status, 200);

  const [first, second] = await Promise.all([
    request<{ id?: number; error?: string }>("/withdrawals", {
      userId,
      body: { amount: 375, address: "TConcurrentWithdrawalAddress123456" },
    }),
    request<{ id?: number; error?: string }>("/withdrawals", {
      userId,
      body: { amount: 375, address: "TConcurrentWithdrawalAddress123456" },
    }),
  ]);
  assert.deepEqual([first.status, second.status].sort(), [201, 409]);
  const dashboard = await request<{ balance: number }>("/dashboard", { userId });
  assert.equal(dashboard.body.balance, 125);
  const withdrawals = await request<Array<{ amount: number }>>("/withdrawals", { userId });
  assert.equal(withdrawals.body.filter((withdrawal) => withdrawal.amount === 375).length, 1);
});

test("approval racing a reversal cannot leave an uncorrected referral credit", async () => {
  const userId = `approval-reversal-race-${process.hrtime.bigint()}`;
  const referrerUserId = `approval-reversal-referrer-${process.hrtime.bigint()}`;
  const referrer = await request<{ code: string; earned: number }>("/referrals", { userId: referrerUserId });
  assert.equal((await request("/referrals/claim", { userId, body: { code: referrer.body.code } })).status, 200);
  const before = await request<{ earned: number }>("/referrals", { userId: referrerUserId });
  const depositId = await prepareDeposit(userId, 500);
  const [racingApproval, racingReverse] = await Promise.all([
    updateDeposit(depositId, "completed"),
    reverseDeposit(depositId, "Race-safe correction of approved transfer"),
  ]);
  // If reversal read the pre-approval state, retry once after the racing
  // approval settles.  The durable final state must still compensate reward.
  // The winner can legitimately observe the other operation's pre-terminal
  // state. Settle any loser, then assert the durable result of the race.
  const raced = (await request<Array<{ id: number; status: string; correction: unknown }>>("/admin/deposits"))
    .body.find((candidate) => candidate.id === depositId);
  if (raced?.status !== "completed") assert.equal((await updateDeposit(depositId, "completed")).status, 200);
  const settled = (await request<Array<{ id: number; correction: unknown }>>("/admin/deposits"))
    .body.find((candidate) => candidate.id === depositId);
  if (!settled?.correction) {
    const correction = await reverseDeposit(depositId, "Race-safe correction of approved transfer");
    assert.ok(correction.status === 200 || correction.status === 409, `unexpected race result: ${racingApproval.status}/${racingReverse.status}`);
  }
  assert.equal((await request<{ balance: number }>("/dashboard", { userId })).body.balance, 0);
  const after = await request<{ earned: number }>("/referrals", { userId: referrerUserId });
  assert.equal(after.body.earned, before.body.earned);
  const deposit = (await request<Array<{ id: number; correction: unknown }>>("/admin/deposits"))
    .body.find((candidate) => candidate.id === depositId);
  assert.ok(deposit?.correction);
});

test("withdrawal racing reversal cannot create a corrected negative balance", async () => {
  const userId = `withdrawal-reversal-depositor-${process.hrtime.bigint()}`;
  const depositId = await prepareDeposit(userId, 500);
  assert.equal((await updateDeposit(depositId, "completed")).status, 200);
  const [withdrawal, reversal] = await Promise.all([
    request("/withdrawals", {
      userId,
      body: { amount: 400, address: "TWithdrawalReversalRaceAddress1234" },
    }),
    reverseDeposit(depositId, "Withdrawal reversal serialization race"),
  ]);
  const dashboard = await request<{ balance: number }>("/dashboard", { userId });
  assert.ok(dashboard.body.balance >= 0);
  if (reversal.status === 200) {
    assert.equal(withdrawal.status, 409);
    assert.equal(dashboard.body.balance, 0);
  } else {
    assert.equal(withdrawal.status, 201);
    assert.equal(reversal.status, 409);
    assert.equal(dashboard.body.balance, 100);
  }
});

test("deposit address assignment racing approval never reverts completion", async () => {
  const userId = `address-approval-race-${process.hrtime.bigint()}`;
  const depositId = await createDeposit(userId, 500);
  const [assignment, approval] = await Promise.all([
    request(`/admin/deposits/${depositId}/address`, {
      body: { address: "TAddressApprovalRaceAddress123456" },
    }),
    updateDeposit(depositId, "completed"),
  ]);
  assert.ok([200, 409].includes(approval.status));
  assert.ok([200, 409].includes(assignment.status));
  const stored = (await request<Array<{ id: number; status: string }>>("/admin/deposits"))
    .body.find((deposit) => deposit.id === depositId);
  assert.ok(stored);
  if (approval.status === 200) assert.equal(stored.status, "completed");
  assert.notEqual(stored.status, "awaiting_address");
});