import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import primevoraRouter, { setPrimevoraUserIdResolverForTests } from "./primevora";

const app = express();
app.use(express.json());
setPrimevoraUserIdResolverForTests(
  (req) => req.header("x-test-user-id") ?? "demo-user",
);
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
  options: { userId?: string; method?: string; body?: unknown } = {},
) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers: {
      "content-type": "application/json",
      ...(options.userId ? { "x-test-user-id": options.userId } : {}),
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