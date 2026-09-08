import { Router, type IRouter, type Request, type RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import {
  AssignDepositAddressBody,
  AssignDepositAddressParams,
  AssignDepositAddressResponse,
  ClaimReferralBody,
  ClaimReferralResponse,
  UpdateDepositStatusBody,
  UpdateDepositStatusParams,
  UpdateDepositStatusResponse,
  CreateDepositBody,
  CreateDepositResponse,
  CreateTicketBody,
  CreateTicketResponse,
  CreateTicketReplyParams,
  CreateTicketReplyBody,
  CreateTicketReplyResponse,
  CreateWithdrawalBody,
  CreateWithdrawalResponse,
  GetAdminDepositsResponse,
  GetAdminOverviewResponse,
  GetAdminTicketsResponse,
  GetAdminWithdrawalsResponse,
  GetDashboardResponse,
  GetDepositsResponse,
  GetFaqsResponse,
  GetKycResponse,
  GetMarketResponse,
  GetReferralsResponse,
  GetTicketsResponse,
  GetTransactionsResponse,
  GetWithdrawalsResponse,
  UpdateTicketStatusParams,
  UpdateTicketStatusBody,
  UpdateTicketStatusResponse,
  GetAdminKycResponse,
  GetCopyTradingResponse,
  SubmitKycBody,
  SubmitKycResponse,
  UpdateKycStatusBody,
  UpdateKycStatusParams,
  UpdateKycStatusResponse,
  CreateCopyAllocationBody,
  CreateCopyAllocationResponse,
  GetInvestmentResponse,
  GetAdminInvestmentsResponse,
  AdminAccrueInvestmentParams,
  AdminAccrueInvestmentResponse,
  AdminSetInvestmentFiguresParams,
  AdminSetInvestmentFiguresBody,
  AdminSetInvestmentFiguresResponse,
  UpdateWithdrawalStatusBody,
  UpdateWithdrawalStatusParams,
  UpdateWithdrawalStatusResponse,
  ReverseApprovedDepositBody,
  ReverseApprovedDepositParams,
  ReverseApprovedDepositResponse,
} from "@workspace/api-zod";

type Transaction = {
  id: string;
  type: "deposit" | "withdrawal" | "referral" | "adjustment";
  amount: number;
  status: "completed" | "pending" | "rejected";
  reference: string | null;
  createdAt: Date;
  userId: string;
};

type DepositRequest = {
  id: number;
  amount: number;
  status:
    | "awaiting_address"
    | "awaiting_transfer"
    | "pending_review"
    | "completed"
    | "rejected";
  network: "TRC20";
  address: string | null;
  createdAt: Date;
  userId: string;
};

type WithdrawalRequest = {
  id: number;
  amount: number;
  address: string;
  status: "pending_review" | "processing" | "completed" | "rejected";
  network: "TRC20";
  createdAt: Date;
  userId: string;
};

type ReferralAttribution = {
  referrerUserId: string;
  referredUserId: string;
  email: string;
  joinedAt: Date;
};

type ReferralReward = {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  depositId: number;
  depositAmount: number;
  rewardRate: number;
  reward: number;
  approvedAt: Date;
};

type SupportTicket = {
  id: number;
  subject: string;
  category: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  createdAt: Date;
  userId: string;
  replies: {
    id: number;
    author: string;
    message: string;
    createdAt: Date;
  }[];
};

type KycSubmission = {
  id: number;
  fullName: string;
  dateOfBirth: string;
  country: string;
  documentType: "passport" | "national_id" | "drivers_license";
  documentNumber: string;
  documentReference: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  submittedAt: Date;
  userId: string;
};

type InvestmentEarning = {
  date: Date;
  baseAmount: number;
  profit: number;
  portfolioValue: number;
};

type InvestmentRecord = {
  userId: string;
  investmentAmount: number;
  dailyReturnPercentage: number;
  compoundingEnabled: boolean;
  investmentStartDate: Date | null;
  lastAccruedDate: string | null;
  totalAccumulatedProfit: number;
  currentPortfolioValue: number;
  earningsHistory: InvestmentEarning[];
};

type AuditLog = {
  id: number;
  action: string;
  actor: string;
  amount: number;
  reason: string;
  createdAt: Date;
  reference: string;
};

type DepositCorrection = {
  id: string;
  depositId: number;
  userId: string;
  reason: string;
  depositAmount: number;
  referralRewardAmount: number;
  correctedAt: Date;
};

const now = () => new Date();

let transactions: Transaction[] = [
  {
    id: "TX-24810",
    type: "deposit",
    amount: 2500,
    status: "completed",
    reference: "TRC20-DEMO-24810",
    createdAt: new Date("2026-08-27T09:20:00Z"),
    userId: "demo-user",
  },
  {
    id: "TX-REF-24792",
    type: "referral",
    amount: 32.5,
    status: "completed",
    reference: "REF-8841",
    createdAt: new Date("2026-08-25T15:10:00Z"),
    userId: "demo-user",
  },
  {
    id: "TX-REF-24791",
    type: "referral",
    amount: 25,
    status: "completed",
    reference: "REF-24791",
    createdAt: new Date("2026-08-20T12:30:00Z"),
    userId: "demo-user",
  },
  {
    id: "TX-24760",
    type: "withdrawal",
    amount: 400,
    status: "pending",
    reference: null,
    createdAt: new Date("2026-08-23T11:45:00Z"),
    userId: "demo-user",
  },
];

let deposits: DepositRequest[] = [
  {
    id: 24792,
    amount: 650,
    status: "completed",
    network: "TRC20",
    address: "TReferralDemoDepositAddressPreviewOnlyOne",
    createdAt: new Date("2026-08-25T15:10:00Z"),
    userId: "referred-user-1",
  },
  {
    id: 24791,
    amount: 500,
    status: "completed",
    network: "TRC20",
    address: "TReferralDemoDepositAddressPreviewOnlyTwo",
    createdAt: new Date("2026-08-20T12:30:00Z"),
    userId: "referred-user-2",
  },
  {
    id: 24835,
    amount: 1000,
    status: "awaiting_transfer",
    network: "TRC20",
    address: "TReferralPendingDepositAddressPreviewOnly",
    createdAt: new Date("2026-08-28T11:30:00Z"),
    userId: "referred-user-1",
  },
  {
    id: 24810,
    amount: 2500,
    status: "completed",
    network: "TRC20",
    address: "TDemoPrimevoraDepositAddressDoNotSend",
    createdAt: new Date("2026-08-27T09:20:00Z"),
    userId: "demo-user",
  },
  {
    id: 24836,
    amount: 800,
    status: "awaiting_address",
    network: "TRC20",
    address: null,
    createdAt: new Date("2026-08-28T12:05:00Z"),
    userId: "demo-user",
  },
];

let referralAttributions: ReferralAttribution[] = [
  {
    referrerUserId: "demo-user",
    referredUserId: "referred-user-1",
    email: "a••••@example.com",
    joinedAt: new Date("2026-08-21T11:00:00Z"),
  },
  {
    referrerUserId: "demo-user",
    referredUserId: "referred-user-2",
    email: "m••••@example.com",
    joinedAt: new Date("2026-08-16T14:20:00Z"),
  },
];

let referralRewards: ReferralReward[] = [
  {
    id: "REF-24792",
    referrerUserId: "demo-user",
    referredUserId: "referred-user-1",
    depositId: 24792,
    depositAmount: 650,
    rewardRate: 5,
    reward: 32.5,
    approvedAt: new Date("2026-08-25T15:10:00Z"),
  },
  {
    id: "REF-24791",
    referrerUserId: "demo-user",
    referredUserId: "referred-user-2",
    depositId: 24791,
    depositAmount: 500,
    rewardRate: 5,
    reward: 25,
    approvedAt: new Date("2026-08-20T12:30:00Z"),
  },
];

let withdrawals: WithdrawalRequest[] = [
  {
    id: 24760,
    amount: 400,
    address: "TQ7fDemoDestinationAddressForPreviewOnly",
    status: "pending_review",
    network: "TRC20",
    createdAt: new Date("2026-08-23T11:45:00Z"),
    userId: "demo-user",
  },
];

const tickets: SupportTicket[] = [
  {
    id: 1042,
    subject: "Question about my deposit",
    category: "Deposits",
    message: "I submitted a deposit request and would like to confirm the next step.",
    status: "in_progress",
    createdAt: new Date("2026-08-28T08:40:00Z"),
    userId: "demo-user",
    replies: [
      {
        id: 1,
        author: "Primevora Care",
        message: "We are reviewing your request and will update the deposit address shortly.",
        createdAt: new Date("2026-08-28T10:10:00Z"),
      },
    ],
  },
];

const kycSubmissions: KycSubmission[] = [
  {
    id: 701,
    fullName: "Christopher Mutu",
    dateOfBirth: "1994-06-12",
    country: "Kenya",
    documentType: "passport",
    documentNumber: "P••••••41",
    documentReference: "passport-front.pdf",
    status: "pending",
    rejectionReason: null,
    submittedAt: new Date("2026-08-29T07:30:00Z"),
    userId: "demo-user",
  },
];

const copyTrader = {
  name: "Alex Scott",
  title: "Systematic crypto strategist",
  avatar: "AS",
  dailyReturnMin: 2,
  dailyReturnMax: 6,
  riskLevel: "medium" as const,
  followers: 1842,
  strategy: "A diversified, momentum-led approach focused on liquid large-cap assets.",
  portfolioAllocation: [
    { asset: "BTC", percentage: 38 },
    { asset: "ETH", percentage: 27 },
    { asset: "SOL", percentage: 18 },
    { asset: "USDT", percentage: 10 },
    { asset: "Other", percentage: 7 },
  ],
  performance: [2.1, 2.8, 2.4, 3.6, 3.1, 4.2, 3.8, 5.2, 4.6, 5.7, 5.1, 6.2],
};

let copyAllocation = 0;
let nextKycId = 702;

const investmentRecords: InvestmentRecord[] = [
  {
    userId: "demo-user",
    investmentAmount: 5000,
    dailyReturnPercentage: 3,
    compoundingEnabled: true,
    investmentStartDate: new Date("2026-08-25T00:00:00Z"),
    lastAccruedDate: "2026-08-25",
    totalAccumulatedProfit: 0,
    currentPortfolioValue: 5000,
    earningsHistory: [],
  },
];

const auditLogs: AuditLog[] = [
  {
    id: 1,
    action: "Deposit address assigned",
    actor: "Operations",
    amount: 2500,
    reason: "Verified TRC20 deposit request",
    createdAt: new Date("2026-08-27T09:45:00Z"),
    reference: "AUD-77821",
  },
  {
    id: 2,
    action: "Balance adjustment",
    actor: "Finance",
    amount: 186.5,
    reason: "Referral reward batch",
    createdAt: new Date("2026-08-25T16:05:00Z"),
    reference: "AUD-77794",
  },
];
let depositCorrections: DepositCorrection[] = [];

let nextDepositId = 24837;
let nextWithdrawalId = 24761;
let nextTicketId = 1043;
let nextAuditId = 3;
const referralCodes = new Map<string, string>([["PRIME-8841", "demo-user"]]);

/*
 * The database migration owns these relations.  This module deliberately only
 * performs DML: deployments apply schema changes through Drizzle's publish
 * flow, never while serving a request.
 */
let financialSeeded = false;
const demoFinancialRecords = {
  transactions: transactions.map((item) => ({ ...item })),
  deposits: deposits.map((item) => ({ ...item })),
  withdrawals: withdrawals.map((item) => ({ ...item })),
  attributions: referralAttributions.map((item) => ({ ...item })),
  rewards: referralRewards.map((item) => ({ ...item })),
};

const dbNumber = (value: unknown) => Number(value);
const seedFinancialRecords = async () => {
  if (financialSeeded) return;
  for (const item of demoFinancialRecords.deposits) {
    await pool.query(
      `insert into primevora_deposits (id, user_id, amount, status, network, address, created_at)
       values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do nothing`,
      [item.id, item.userId, item.amount, item.status, item.network, item.address, item.createdAt],
    );
  }
  for (const item of demoFinancialRecords.withdrawals) {
    await pool.query(
      `insert into primevora_withdrawals (id, user_id, amount, address, status, network, created_at)
       values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do nothing`,
      [item.id, item.userId, item.amount, item.address, item.status, item.network, item.createdAt],
    );
  }
  for (const item of demoFinancialRecords.transactions) {
    await pool.query(
      `insert into primevora_transactions (id, user_id, type, amount, status, reference, created_at)
       values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do nothing`,
      [item.id, item.userId, item.type, item.amount, item.status, item.reference, item.createdAt],
    );
  }
  for (const item of demoFinancialRecords.attributions) {
    await pool.query(
      `insert into primevora_referral_attributions (referred_user_id, referrer_user_id, email, joined_at)
       values ($1,$2,$3,$4) on conflict (referred_user_id) do nothing`,
      [item.referredUserId, item.referrerUserId, item.email, item.joinedAt],
    );
  }
  for (const item of demoFinancialRecords.rewards) {
    await pool.query(
      `insert into primevora_referral_rewards (id, referrer_user_id, referred_user_id, deposit_id, deposit_amount, reward_rate, reward, approved_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (deposit_id) do nothing`,
      [item.id, item.referrerUserId, item.referredUserId, item.depositId, item.depositAmount, item.rewardRate, item.reward, item.approvedAt],
    );
  }
  financialSeeded = true;
};

const refreshFinancialRecords = async () => {
  await seedFinancialRecords();
  const [transactionRows, depositRows, withdrawalRows, attributionRows, rewardRows, correctionRows] = await Promise.all([
    pool.query(`select id, user_id, type, amount, status, reference, created_at from primevora_transactions order by created_at desc`),
    pool.query(`select id, user_id, amount, status, network, address, created_at from primevora_deposits order by created_at desc`),
    pool.query(`select id, user_id, amount, address, status, network, created_at from primevora_withdrawals order by created_at desc`),
    pool.query(`select referred_user_id, referrer_user_id, email, joined_at from primevora_referral_attributions`),
    pool.query(`select id, referrer_user_id, referred_user_id, deposit_id, deposit_amount, reward_rate, reward, approved_at from primevora_referral_rewards order by approved_at desc`),
    pool.query(`select id, deposit_id, user_id, reason, deposit_amount, referral_reward_amount, corrected_at from primevora_deposit_corrections`),
  ]);
  transactions = transactionRows.rows.map((row): Transaction => ({ id: row.id, userId: row.user_id, type: row.type, amount: dbNumber(row.amount), status: row.status, reference: row.reference, createdAt: row.created_at }));
  deposits = depositRows.rows.map((row): DepositRequest => ({ id: dbNumber(row.id), userId: row.user_id, amount: dbNumber(row.amount), status: row.status, network: row.network, address: row.address, createdAt: row.created_at }));
  withdrawals = withdrawalRows.rows.map((row): WithdrawalRequest => ({ id: dbNumber(row.id), userId: row.user_id, amount: dbNumber(row.amount), address: row.address, status: row.status, network: row.network, createdAt: row.created_at }));
  referralAttributions = attributionRows.rows.map((row): ReferralAttribution => ({ referredUserId: row.referred_user_id, referrerUserId: row.referrer_user_id, email: row.email, joinedAt: row.joined_at }));
  referralRewards = rewardRows.rows.map((row): ReferralReward => ({ id: row.id, referrerUserId: row.referrer_user_id, referredUserId: row.referred_user_id, depositId: dbNumber(row.deposit_id), depositAmount: dbNumber(row.deposit_amount), rewardRate: dbNumber(row.reward_rate), reward: dbNumber(row.reward), approvedAt: row.approved_at }));
  depositCorrections = correctionRows.rows.map((row): DepositCorrection => ({ id: row.id, depositId: dbNumber(row.deposit_id), userId: row.user_id, reason: row.reason, depositAmount: dbNumber(row.deposit_amount), referralRewardAmount: dbNumber(row.referral_reward_amount), correctedAt: row.corrected_at }));
};

const faqs = [
  {
    id: 1,
    question: "Which network does Primevora support for USDT?",
    answer:
      "Primevora currently supports USDT on the TRON network (TRC20). Always confirm the network before sending funds.",
  },
  {
    id: 2,
    question: "How long do deposits take?",
    answer:
      "After the network confirms your transfer, our operations team reviews it before crediting your balance.",
  },
  {
    id: 3,
    question: "Can I change a withdrawal after submitting it?",
    answer:
      "For your security, withdrawal details cannot be edited after submission. Contact customer care immediately if you need help.",
  },
];

type UserIdResolver = (req: Request) => string | null | undefined;
type AdminAuth = {
  userId: string | null | undefined;
  role: unknown;
};
type AdminAuthResolver = (req: Request) => AdminAuth;

let resolveUserId: UserIdResolver = (req) => getAuth(req).userId;
let resolveAdminAuth: AdminAuthResolver = (req) => {
  const auth = getAuth(req);
  const metadata = auth.sessionClaims?.metadata;
  return {
    userId: auth.userId,
    role:
      typeof metadata === "object" && metadata !== null && "role" in metadata
        ? metadata.role
        : undefined,
  };
};

export const setPrimevoraUserIdResolverForTests = (resolver: UserIdResolver) => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("The Primevora user ID resolver can only be replaced in tests");
  }
  resolveUserId = resolver;
};

export const setPrimevoraAdminAuthResolverForTests = (resolver: AdminAuthResolver) => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("The Primevora admin auth resolver can only be replaced in tests");
  }
  resolveAdminAuth = resolver;
};

const userIdFor = (req: Request) => resolveUserId(req) ?? "demo-user";

const publicDeposit = (item: DepositRequest) => {
  const { userId: _userId, ...result } = item;
  const correction = depositCorrections.find((candidate) => candidate.depositId === item.id);
  return {
    ...result,
    correction: correction
      ? {
          id: correction.id,
          reason: correction.reason,
          depositAmount: correction.depositAmount,
          referralRewardAmount: correction.referralRewardAmount,
          correctedAt: correction.correctedAt,
        }
      : null,
  };
};

const latestApprovedDeposit = (userId: string) =>
  deposits
    .filter(
      (item) =>
        item.userId === userId &&
        item.status === "completed" &&
        !depositCorrections.some((correction) => correction.depositId === item.id),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

const publicWithdrawal = (item: WithdrawalRequest) => {
  const { userId: _userId, ...result } = item;
  return result;
};

const publicTicket = (item: SupportTicket) => {
  const { userId: _userId, ...result } = item;
  return result;
};

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const referralCodeFor = (userId: string) => {
  const existing = [...referralCodes.entries()].find(([, owner]) => owner === userId)?.[0];
  if (existing) return existing;
  const code = `PRIME-${Buffer.from(userId).toString("hex").slice(-8).toUpperCase().padStart(8, "0")}`;
  referralCodes.set(code, userId);
  return code;
};
const completedDepositsTotal = (userId: string) =>
  money(
    deposits
      .filter((item) => item.userId === userId && item.status === "completed")
      .reduce(
        (sum, item) =>
          sum +
          item.amount -
          (depositCorrections.find((correction) => correction.depositId === item.id)?.depositAmount ?? 0),
        0,
      ),
  );
const referralRewardsTotal = (userId: string) =>
  money(
    referralRewards
      .filter((item) => item.referrerUserId === userId)
      .reduce(
        (sum, item) =>
          sum +
          item.reward -
          (depositCorrections.find((correction) => correction.depositId === item.depositId)
            ?.referralRewardAmount ?? 0),
        0,
      ),
  );
const reservedWithdrawalsTotal = (userId: string) =>
  money(
    withdrawals
      .filter((item) => item.userId === userId && item.status !== "rejected")
      .reduce((sum, item) => sum + item.amount, 0),
  );
const withdrawableBalance = (userId: string) =>
  money(Math.max(0, completedDepositsTotal(userId) + referralRewardsTotal(userId) - reservedWithdrawalsTotal(userId)));
const awardReferralReward = (deposit: DepositRequest) => {
  if (deposit.status !== "completed" || referralRewards.some((item) => item.depositId === deposit.id)) return null;
  const attribution = referralAttributions.find((item) => item.referredUserId === deposit.userId);
  if (!attribution || attribution.referrerUserId === deposit.userId) return null;
  const reward: ReferralReward = {
    id: `REF-${deposit.id}`,
    referrerUserId: attribution.referrerUserId,
    referredUserId: deposit.userId,
    depositId: deposit.id,
    depositAmount: money(deposit.amount),
    rewardRate: 5,
    reward: money(deposit.amount * 0.05),
    approvedAt: now(),
  };
  referralRewards.unshift(reward);
  transactions.unshift({
    id: `TX-${reward.id}`,
    type: "referral",
    amount: reward.reward,
    status: "completed",
    reference: reward.id,
    createdAt: reward.approvedAt,
    userId: reward.referrerUserId,
  });
  addAuditLog(
    "Referral reward issued",
    reward.reward,
    `5% reward for approved deposit #${deposit.id}`,
  );
  return reward;
};
const dateKey = (value: Date) => value.toISOString().slice(0, 10);
const nextDateKey = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return dateKey(date);
};

const ensureInvestment = (userId: string) => {
  const existing = investmentRecords.find((item) => item.userId === userId);
  if (existing) return existing;
  const blank: InvestmentRecord = {
    userId,
    investmentAmount: 0,
    dailyReturnPercentage: 3,
    compoundingEnabled: true,
    investmentStartDate: null,
    lastAccruedDate: null,
    totalAccumulatedProfit: 0,
    currentPortfolioValue: 0,
    earningsHistory: [],
  };
  investmentRecords.push(blank);
  return blank;
};

const syncInvestmentToApprovedDeposit = (record: InvestmentRecord) => {
  const approvedDeposit = latestApprovedDeposit(record.userId);
  const approvedAmount = approvedDeposit ? money(approvedDeposit.amount) : 0;
  if (record.investmentAmount === approvedAmount) return;

  record.investmentAmount = approvedAmount;
  record.investmentStartDate = approvedDeposit ? approvedDeposit.createdAt : null;
  record.lastAccruedDate = approvedDeposit ? dateKey(approvedDeposit.createdAt) : null;
  record.currentPortfolioValue = approvedAmount;
  record.totalAccumulatedProfit = 0;
  record.earningsHistory = [];
};

const accrueInvestment = (record: InvestmentRecord) => {
  if (!record.investmentStartDate || record.investmentAmount <= 0) return;
  const today = dateKey(now());
  let earningDate = nextDateKey(record.lastAccruedDate ?? dateKey(record.investmentStartDate));
  while (earningDate <= today) {
    const baseAmount = record.compoundingEnabled
      ? record.currentPortfolioValue
      : record.investmentAmount;
    const profit = money(baseAmount * (record.dailyReturnPercentage / 100));
    record.currentPortfolioValue = money(record.currentPortfolioValue + profit);
    record.totalAccumulatedProfit = money(record.totalAccumulatedProfit + profit);
    record.earningsHistory.push({
      date: new Date(`${earningDate}T00:00:00.000Z`),
      baseAmount: money(baseAmount),
      profit,
      portfolioValue: record.currentPortfolioValue,
    });
    record.lastAccruedDate = earningDate;
    earningDate = nextDateKey(earningDate);
  }
};

const publicInvestment = (record: InvestmentRecord) => ({
  approvedDepositAmount: latestApprovedDeposit(record.userId)
    ? money(latestApprovedDeposit(record.userId)!.amount)
    : 0,
  depositApproved: Boolean(latestApprovedDeposit(record.userId)),
  investmentAmount: record.investmentAmount,
  dailyReturnPercentage: record.dailyReturnPercentage,
  dailyProfit: money(
    (record.compoundingEnabled
      ? record.currentPortfolioValue
      : record.investmentAmount) *
      (record.dailyReturnPercentage / 100),
  ),
  totalAccumulatedProfit: record.totalAccumulatedProfit,
  currentPortfolioValue: record.currentPortfolioValue,
  investmentStartDate: record.investmentStartDate,
  compoundingEnabled: record.compoundingEnabled,
  reportingMode: "admin_reported" as const,
  isWithdrawable: false,
  earningsHistory: record.earningsHistory,
});

const adminInvestment = (record: InvestmentRecord) => ({
  ...publicInvestment(record),
  userId: record.userId,
});

const addAuditLog = (action: string, amount: number, reason: string) => {
  auditLogs.unshift({
    id: nextAuditId++,
    action,
    actor: "Operations",
    amount,
    reason,
    createdAt: now(),
    reference: `AUD-${nextAuditId + 77800}`,
  });
};

const router: IRouter = Router();

const requireAdmin: RequestHandler = (req, res, next) => {
  const auth = resolveAdminAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (auth.role !== "admin") {
    res.status(403).json({ error: "Administrator access required" });
    return;
  }
  next();
};

router.get("/market", async (req, res): Promise<void> => {
  const ids = "bitcoin,ethereum,tether,binancecoin,solana,usd-coin,ripple,dogecoin,cardano,tron";
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false`,
      { headers: { accept: "application/json" } },
    );
    if (!response.ok) {
      req.log.warn({ status: response.status }, "Market data provider returned an error");
      res.status(502).json({ error: "Market data is temporarily unavailable" });
      return;
    }
    const data = (await response.json()) as Array<{
      id: string;
      symbol: string;
      name: string;
      image: string;
      current_price: number;
      price_change_percentage_24h: number | null;
      market_cap: number;
      last_updated: string;
    }>;
    res.json(
      GetMarketResponse.parse(
        data.map((asset) => ({
          id: asset.id,
          symbol: asset.symbol.toUpperCase(),
          name: asset.name,
          image: asset.image,
          price: asset.current_price,
          change24h: asset.price_change_percentage_24h ?? 0,
          marketCap: asset.market_cap,
          lastUpdated: asset.last_updated,
        })),
      ),
    );
  } catch (error) {
    req.log.error({ error }, "Failed to fetch market data");
    res.status(502).json({ error: "Market data is temporarily unavailable" });
  }
});

router.get("/dashboard", async (req, res) => {
  await refreshFinancialRecords();
  const userId = userIdFor(req);
  const userTransactions = transactions.filter((item) => item.userId === userId);
  const data = {
    balance: withdrawableBalance(userId),
    pendingBalance: money(
      deposits
        .filter((item) => item.userId === userId && !["completed", "rejected"].includes(item.status))
        .reduce((sum, item) => sum + item.amount, 0),
    ),
    totalDeposited: completedDepositsTotal(userId),
    totalWithdrawn: money(
      withdrawals
        .filter((item) => item.userId === userId && item.status === "completed")
        .reduce((sum, item) => sum + item.amount, 0),
    ),
    referralRewards: referralRewardsTotal(userId),
    recentActivity: userTransactions,
  };
  res.json(GetDashboardResponse.parse(data));
});

router.get("/investment", async (req, res) => {
  await refreshFinancialRecords();
  const record = ensureInvestment(userIdFor(req));
  syncInvestmentToApprovedDeposit(record);
  accrueInvestment(record);
  res.json(GetInvestmentResponse.parse(publicInvestment(record)));
});

router.get("/transactions", async (req, res) => {
  await refreshFinancialRecords();
  const userId = userIdFor(req);
  res.json(GetTransactionsResponse.parse(transactions.filter((item) => item.userId === userId)));
});

router.get("/deposits", async (req, res) => {
  await refreshFinancialRecords();
  const userId = userIdFor(req);
  res.json(GetDepositsResponse.parse(deposits.filter((item) => item.userId === userId).map(publicDeposit)));
});

router.post("/deposits", async (req, res) => {
  const parsed = CreateDepositBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = userIdFor(req);
  await seedFinancialRecords();
  const createdAt = now();
  const inserted = await pool.query(
    `insert into primevora_deposits (user_id, amount, status, network, address, created_at)
     values ($1,$2,'awaiting_address','TRC20',null,$3) returning id`,
    [userId, parsed.data.amount, createdAt],
  );
  const item: DepositRequest = { id: dbNumber(inserted.rows[0].id), amount: parsed.data.amount, status: "awaiting_address", network: "TRC20", address: null, createdAt, userId };
  res.status(201).json(CreateDepositResponse.parse(publicDeposit(item)));
});

router.get("/withdrawals", async (req, res) => {
  await refreshFinancialRecords();
  const userId = userIdFor(req);
  res.json(
    GetWithdrawalsResponse.parse(
      withdrawals.filter((item) => item.userId === userId).map(publicWithdrawal),
    ),
  );
});

router.post("/withdrawals", async (req, res) => {
  const parsed = CreateWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = userIdFor(req);
  const verification = kycSubmissions.find((candidate) => candidate.userId === userId) ?? kycSubmissions[0];
  if (verification.status !== "approved") {
    res.status(403).json({ error: "Withdrawals require approved KYC verification" });
    return;
  }
  await seedFinancialRecords();
  const client = await pool.connect();
  try {
    await client.query("begin");
    // Transaction-scoped advisory locking serializes balance reservation even
    // when requests are handled by different API processes.
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [userId]);
    const balance = await client.query(
      `select coalesce((select sum(d.amount - coalesce(c.deposit_amount, 0))
          from primevora_deposits d left join primevora_deposit_corrections c on c.deposit_id=d.id
          where d.user_id=$1 and d.status='completed'), 0)
       + coalesce((select sum(r.reward - coalesce(c.referral_reward_amount, 0))
          from primevora_referral_rewards r left join primevora_deposit_corrections c on c.deposit_id=r.deposit_id
          where r.referrer_user_id=$1), 0)
       - coalesce((select sum(amount) from primevora_withdrawals where user_id=$1 and status <> 'rejected'), 0)
       as available`,
      [userId],
    );
    const available = money(dbNumber(balance.rows[0].available));
    if (parsed.data.amount > available) {
      await client.query("rollback");
      res.status(409).json({ error: `Withdrawal exceeds available balance of ${available.toFixed(2)} USDT` });
      return;
    }
    const createdAt = now();
    const inserted = await client.query(
      `insert into primevora_withdrawals (user_id, amount, address, status, network, created_at)
       values ($1,$2,$3,'pending_review','TRC20',$4) returning id`,
      [userId, parsed.data.amount, parsed.data.address, createdAt],
    );
    const id = dbNumber(inserted.rows[0].id);
    await client.query(
      `insert into primevora_transactions (id, user_id, type, amount, status, reference, withdrawal_id, created_at)
       values ($1,$2,'withdrawal',$3,'pending',null,$4,$5)`,
      [`TX-W-${id}`, userId, parsed.data.amount, id, createdAt],
    );
    await client.query("commit");
    res.status(201).json(CreateWithdrawalResponse.parse({ id, amount: parsed.data.amount, address: parsed.data.address, status: "pending_review", network: "TRC20", createdAt }));
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
});

router.get("/referrals", async (req, res) => {
  await refreshFinancialRecords();
  const userId = userIdFor(req);
  const code = referralCodeFor(userId);
  const attributions = referralAttributions.filter((item) => item.referrerUserId === userId);
  const rewards = referralRewards.filter((item) => item.referrerUserId === userId);
  res.json(
    GetReferralsResponse.parse({
      code,
      link: `${req.protocol}://${req.get("host")}/join/${code}`,
      totalReferred: attributions.length,
      activeReferred: new Set(rewards.map((item) => item.referredUserId)).size,
      earned: referralRewardsTotal(userId),
      withdrawableBalance: withdrawableBalance(userId),
      bonusRate: 5,
      history: rewards.map((reward) => {
        const attribution = attributions.find((item) => item.referredUserId === reward.referredUserId)!;
        return {
          id: reward.id,
          email: attribution.email,
          joinedAt: attribution.joinedAt,
          depositAmount: reward.depositAmount,
          rewardRate: reward.rewardRate,
          reward: reward.reward,
          approvedAt: reward.approvedAt,
          correction: (() => {
            const correction = depositCorrections.find((item) => item.depositId === reward.depositId);
            return correction
              ? {
                  id: correction.id,
                  reason: correction.reason,
                  amount: correction.referralRewardAmount,
                  correctedAt: correction.correctedAt,
                }
              : null;
          })(),
        };
      }),
    }),
  );
});

router.post("/referrals/claim", async (req, res) => {
  const parsed = ClaimReferralBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const referredUserId = userIdFor(req);
  const referrerUserId = referralCodes.get(parsed.data.code.toUpperCase());
  if (!referrerUserId) {
    res.status(404).json({ error: "Referral code not found" });
    return;
  }
  if (referrerUserId === referredUserId) {
    res.status(409).json({ error: "Self-referrals are not eligible" });
    return;
  }
  await refreshFinancialRecords();
  const existing = referralAttributions.find((item) => item.referredUserId === referredUserId);
  if (existing && existing.referrerUserId !== referrerUserId) {
    res.status(409).json({ error: "This account is already linked to a referrer" });
    return;
  }
  if (
    !existing &&
    (deposits.some((item) => item.userId === referredUserId) ||
      withdrawals.some((item) => item.userId === referredUserId))
  ) {
    res.status(409).json({ error: "Referral codes must be claimed before the first account transaction" });
    return;
  }
  if (!existing) await pool.query(
    `insert into primevora_referral_attributions (referred_user_id, referrer_user_id, email, joined_at)
     values ($1,$2,'Primevora member',$3) on conflict (referred_user_id) do nothing`,
    [referredUserId, referrerUserId, now()],
  );
  res.json(ClaimReferralResponse.parse({ claimed: true }));
});

router.get("/kyc", (req, res) => {
  const userId = userIdFor(req);
  const item = kycSubmissions.find((candidate) => candidate.userId === userId) ?? kycSubmissions[0];
  res.json(GetKycResponse.parse(item));
});

router.post("/kyc", (req, res) => {
  const parsed = SubmitKycBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = userIdFor(req);
  const existing = kycSubmissions.find((candidate) => candidate.userId === userId);
  if (existing) {
    Object.assign(existing, {
      ...parsed.data,
      dateOfBirth: parsed.data.dateOfBirth.toISOString().slice(0, 10),
      status: "pending",
      rejectionReason: null,
      submittedAt: now(),
    });
    res.status(201).json(SubmitKycResponse.parse(existing));
    return;
  }
  const item: KycSubmission = {
    id: nextKycId++,
    ...parsed.data,
    dateOfBirth: parsed.data.dateOfBirth.toISOString().slice(0, 10),
    status: "pending",
    rejectionReason: null,
    submittedAt: now(),
    userId,
  };
  kycSubmissions.unshift(item);
  res.status(201).json(SubmitKycResponse.parse(item));
});

router.get("/copy-trading", (_req, res) => {
  res.json(
    GetCopyTradingResponse.parse({
      trader: copyTrader,
      allocation: copyAllocation,
      reportingMode: "admin_reported",
    }),
  );
});

router.post("/copy-trading", (req, res) => {
  const parsed = CreateCopyAllocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  copyAllocation = parsed.data.amount;
  res.status(201).json(
    CreateCopyAllocationResponse.parse({
      trader: copyTrader,
      allocation: copyAllocation,
      reportingMode: "admin_reported",
    }),
  );
});

router.get("/support/faqs", (_req, res) => {
  res.json(GetFaqsResponse.parse(faqs));
});

router.get("/support/tickets", (req, res) => {
  const userId = userIdFor(req);
  res.json(
    GetTicketsResponse.parse(
      tickets.filter((item) => item.userId === userId || userId === "demo-user").map(publicTicket),
    ),
  );
});

router.post("/support/tickets", (req, res) => {
  const parsed = CreateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const item: SupportTicket = {
    id: nextTicketId++,
    ...parsed.data,
    status: "open",
    createdAt: now(),
    userId: userIdFor(req),
    replies: [],
  };
  tickets.unshift(item);
  res.status(201).json(CreateTicketResponse.parse(publicTicket(item)));
});

router.post("/support/tickets/:id/reply", (req, res) => {
  const params = CreateTicketReplyParams.safeParse(req.params);
  const parsed = CreateTicketReplyBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid ticket reply" });
    return;
  }
  const ticket = tickets.find((candidate) => candidate.id === params.data.id && candidate.userId === userIdFor(req));
  if (!ticket) {
    res.status(404).json({ error: "Support ticket not found" });
    return;
  }
  ticket.replies.push({
    id: Date.now(),
    author: "You",
    message: parsed.data.message,
    createdAt: now(),
  });
  res.status(201).json(CreateTicketReplyResponse.parse(publicTicket(ticket)));
});

router.use("/admin", requireAdmin);

router.get("/admin/overview", async (_req, res) => {
  await refreshFinancialRecords();
  res.json(
    GetAdminOverviewResponse.parse({
      users: 248,
      pendingDeposits: deposits.filter((item) => item.status === "awaiting_address").length,
      pendingWithdrawals: withdrawals.filter((item) => item.status === "pending_review").length,
      openTickets: tickets.filter((item) => item.status !== "closed").length,
      volume: 284650,
      auditLogs,
    }),
  );
});

router.get("/admin/deposits", async (_req, res) => {
  await refreshFinancialRecords();
  res.json(GetAdminDepositsResponse.parse(deposits.map(publicDeposit)));
});

router.get("/admin/investments", async (_req, res) => {
  await refreshFinancialRecords();
  investmentRecords.forEach((record) => {
    syncInvestmentToApprovedDeposit(record);
    accrueInvestment(record);
  });
  res.json(GetAdminInvestmentsResponse.parse(investmentRecords.map(adminInvestment)));
});

router.post("/admin/investments/:userId/accrue", (req, res) => {
  const params = AdminAccrueInvestmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid investment user" });
    return;
  }
  const record = investmentRecords.find((item) => item.userId === params.data.userId);
  if (!record) {
    res.status(404).json({ error: "Investment record not found" });
    return;
  }
  const previousEarnings = record.earningsHistory.length;
  accrueInvestment(record);
  if (record.earningsHistory.length > previousEarnings) {
    addAuditLog(
      "Daily admin-reported earning accrued",
      publicInvestment(record).dailyProfit,
      `Recorded a non-withdrawable ${record.dailyReturnPercentage}% admin-reported earning for ${record.userId}`,
    );
  }
  res.json(AdminAccrueInvestmentResponse.parse(adminInvestment(record)));
});

router.put("/admin/investments/:userId", (req, res) => {
  const params = AdminSetInvestmentFiguresParams.safeParse(req.params);
  const parsed = AdminSetInvestmentFiguresBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid investment figures" });
    return;
  }
  const approvedDeposit = latestApprovedDeposit(params.data.userId);
  if (!approvedDeposit) {
    res.status(409).json({ error: "An approved deposit is required before setting the investment rate" });
    return;
  }
  const record = ensureInvestment(params.data.userId);
  syncInvestmentToApprovedDeposit(record);
  const previousAmount = record.investmentAmount;
  if (previousAmount > 0) {
    accrueInvestment(record);
  }
  record.dailyReturnPercentage = parsed.data.dailyReturnPercentage;
  record.compoundingEnabled = true;
  addAuditLog(
    "Investment rate updated",
    record.investmentAmount,
    `${record.userId}: approved deposit ${record.investmentAmount} USDT at ${record.dailyReturnPercentage}% daily compounding`,
  );
  res.json(AdminSetInvestmentFiguresResponse.parse(adminInvestment(record)));
});

router.post("/admin/deposits/:id/address", async (req, res) => {
  const params = AssignDepositAddressParams.safeParse(req.params);
  const parsed = AssignDepositAddressBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid deposit address assignment" });
    return;
  }
  await seedFinancialRecords();
  const updated = await pool.query(
    `update primevora_deposits
     set address=$1, status='awaiting_transfer'
     where id=$2 and status='awaiting_address'
     returning id,user_id,amount,status,network,address,created_at`,
    [parsed.data.address, params.data.id],
  );
  if (updated.rowCount) {
    const row = updated.rows[0];
    const item: DepositRequest = {
      id: dbNumber(row.id), userId: row.user_id, amount: dbNumber(row.amount),
      status: row.status, network: row.network, address: row.address, createdAt: row.created_at,
    };
    res.json(AssignDepositAddressResponse.parse(publicDeposit(item)));
    return;
  }
  const current = await pool.query(`select status from primevora_deposits where id=$1`, [params.data.id]);
  if (!current.rowCount) {
    res.status(404).json({ error: "Deposit request not found" });
    return;
  }
  res.status(409).json({ error: `An ${current.rows[0].status} deposit cannot receive a new address` });
});

router.post("/admin/deposits/:id/status", async (req, res) => {
  const params = UpdateDepositStatusParams.safeParse(req.params);
  const parsed = UpdateDepositStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid deposit status update" });
    return;
  }
  await refreshFinancialRecords();
  const item = deposits.find((candidate) => candidate.id === params.data.id);
  if (!item) {
    res.status(404).json({ error: "Deposit request not found" });
    return;
  }
  if (parsed.data.status === "completed" && !item.address) {
    res.status(409).json({ error: "A receiving address must be assigned before approving the deposit" });
    return;
  }
  if (item.status === "completed" || item.status === "rejected") {
    if (item.status !== parsed.data.status) {
      res.status(409).json({ error: `A ${item.status} deposit cannot change status` });
      return;
    }
    res.json(UpdateDepositStatusResponse.parse(publicDeposit(item)));
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("begin");
    const initial = await client.query(
      `select d.user_id,a.referrer_user_id
       from primevora_deposits d
       left join primevora_referral_attributions a on a.referred_user_id=d.user_id
       where d.id=$1`,
      [item.id],
    );
    if (!initial.rowCount) {
      await client.query("rollback");
      res.status(404).json({ error: "Deposit request not found" });
      return;
    }
    const affectedUserIds = [...new Set([
      initial.rows[0].user_id as string,
      ...(initial.rows[0].referrer_user_id ? [initial.rows[0].referrer_user_id as string] : []),
    ])].sort();
    for (const affectedUserId of affectedUserIds) {
      await client.query("select pg_advisory_xact_lock(hashtext($1))", [affectedUserId]);
    }
    const locked = await client.query(
      `select d.status,d.address,d.user_id,d.amount,a.referrer_user_id
       from primevora_deposits d
       left join primevora_referral_attributions a on a.referred_user_id=d.user_id
       where d.id=$1 for update of d`,
      [item.id],
    );
    if (!locked.rowCount) {
      await client.query("rollback");
      res.status(404).json({ error: "Deposit request not found" });
      return;
    }
    const persistedStatus = locked.rows[0].status as DepositRequest["status"];
    if (persistedStatus === "completed" || persistedStatus === "rejected") {
      await client.query("rollback");
      if (persistedStatus !== parsed.data.status) {
        res.status(409).json({ error: `A ${persistedStatus} deposit cannot change status` });
      } else {
        item.status = persistedStatus;
        res.json(UpdateDepositStatusResponse.parse(publicDeposit(item)));
      }
      return;
    }
    if (parsed.data.status === "completed" && !locked.rows[0].address) {
      await client.query("rollback");
      res.status(409).json({ error: "A receiving address must be assigned before approving the deposit" });
      return;
    }
    item.userId = locked.rows[0].user_id;
    item.amount = dbNumber(locked.rows[0].amount);
    await client.query(`update primevora_deposits set status=$1 where id=$2`, [parsed.data.status, item.id]);
    if (parsed.data.status === "completed") {
      const approvedAt = now();
      await client.query(
        `insert into primevora_transactions (id,user_id,type,amount,status,reference,deposit_id,created_at)
         values ($1,$2,'deposit',$3,'completed',$4,$5,$6) on conflict (id) do nothing`,
        [`TX-${item.id}`, item.userId, item.amount, `DEPOSIT-${item.id}`, item.id, approvedAt],
      );
      const referrerUserId = locked.rows[0].referrer_user_id as string | null;
      if (referrerUserId && referrerUserId !== item.userId) {
        const rewardId = `REF-${item.id}`;
        const reward = money(item.amount * 0.05);
        const inserted = await client.query(
          `insert into primevora_referral_rewards (id,referrer_user_id,referred_user_id,deposit_id,deposit_amount,reward_rate,reward,approved_at)
           values ($1,$2,$3,$4,$5,5,$6,$7) on conflict (deposit_id) do nothing returning id`,
          [rewardId, referrerUserId, item.userId, item.id, item.amount, reward, approvedAt],
        );
        if (inserted.rowCount) await client.query(
          `insert into primevora_transactions (id,user_id,type,amount,status,reference,referral_reward_id,created_at)
           values ($1,$2,'referral',$3,'completed',$4,$4,$5) on conflict (id) do nothing`,
          [`TX-${rewardId}`, referrerUserId, reward, rewardId, approvedAt],
        );
      }
    }
    await client.query("commit");
  } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  item.status = parsed.data.status;
  syncInvestmentToApprovedDeposit(ensureInvestment(item.userId));
  addAuditLog(
    parsed.data.status === "completed" ? "Deposit approved" : "Deposit rejected",
    item.amount,
    `Deposit request #${item.id} marked ${parsed.data.status} by Operations`,
  );
  res.json(UpdateDepositStatusResponse.parse(publicDeposit(item)));
});

router.post("/admin/deposits/:id/reverse", async (req, res) => {
  const params = ReverseApprovedDepositParams.safeParse(req.params);
  const parsed = ReverseApprovedDepositBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "A correction reason of at least 10 characters is required" });
    return;
  }
  const reason = parsed.data.reason.trim();
  if (reason.length < 10) {
    res.status(400).json({ error: "A correction reason of at least 10 characters is required" });
    return;
  }
  await seedFinancialRecords();
  const client = await pool.connect();
  try {
    await client.query("begin");
    // Derive the advisory-lock set from the authoritative tables, then take
    // the same depositor lock used by approval *before* taking row locks.
    // This ordering avoids an approval/reversal deadlock.
    const initialDeposit = await client.query(
      `select d.id,d.user_id,d.amount,d.status,a.referrer_user_id
       from primevora_deposits d
       left join primevora_referral_attributions a on a.referred_user_id=d.user_id
       where d.id=$1`,
      [params.data.id],
    );
    if (!initialDeposit.rowCount) {
      await client.query("rollback");
      res.status(404).json({ error: "Deposit request not found" });
      return;
    }
    const lockUserIds = [
      initialDeposit.rows[0].user_id as string,
      ...(initialDeposit.rows[0].referrer_user_id
        ? [initialDeposit.rows[0].referrer_user_id as string]
        : []),
    ].sort();
    for (const affectedUserId of [...new Set(lockUserIds)]) {
      await client.query("select pg_advisory_xact_lock(hashtext($1))", [affectedUserId]);
    }
    // Approval takes the depositor advisory lock before its deposit lock.
    // Re-read every dependency after that lock to make the decision from a
    // coherent, serialized ledger view.
    const depositResult = await client.query(
      `select d.id,d.user_id,d.amount,d.status,a.referrer_user_id
       from primevora_deposits d
       left join primevora_referral_attributions a on a.referred_user_id=d.user_id
       where d.id=$1 for update of d`,
      [params.data.id],
    );
    const correctionResult = await client.query(
      `select id from primevora_deposit_corrections where deposit_id=$1 for update`,
      [params.data.id],
    );
    const rewardResult = await client.query(
      `select id,referrer_user_id,reward from primevora_referral_rewards where deposit_id=$1 for update`,
      [params.data.id],
    );
    const row = depositResult.rows[0];
    if (row.status !== "completed") {
      await client.query("rollback");
      res.status(409).json({ error: "Only an approved deposit can be reversed" });
      return;
    }
    if (correctionResult.rowCount) {
      await client.query("rollback");
      res.status(409).json({ error: "This approved deposit has already been reversed" });
      return;
    }
    const linkedReward = rewardResult.rows[0];
    const affectedUserIds = [...new Set([row.user_id as string, ...(linkedReward ? [linkedReward.referrer_user_id as string] : [])])];
    const unsafe = await client.query(`select 1 from primevora_withdrawals where user_id = any($1::text[]) and status <> 'rejected' limit 1`, [[...affectedUserIds]]);
    if (unsafe.rowCount) {
      await client.query("rollback");
      res.status(409).json({ error: "This deposit cannot be reversed while the depositor or linked referrer has a pending, processing, or completed withdrawal" });
      return;
    }
    const correctedAt = now();
    const correction: DepositCorrection = {
      id: `COR-${row.id}`,
      depositId: dbNumber(row.id),
      userId: row.user_id,
      reason,
      depositAmount: money(dbNumber(row.amount)),
      referralRewardAmount: linkedReward ? money(dbNumber(linkedReward.reward)) : 0,
      correctedAt,
    };
    await client.query(
      `insert into primevora_deposit_corrections (id,deposit_id,user_id,reason,deposit_amount,referral_reward_amount,corrected_at)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [correction.id, correction.depositId, correction.userId, correction.reason, correction.depositAmount, correction.referralRewardAmount, correction.correctedAt],
    );
    await client.query(
      `insert into primevora_transactions (id,user_id,type,amount,status,reference,created_at)
       values ($1,$2,'adjustment',$3,'completed',$4,$5)`,
      [`TX-${correction.id}-DEPOSIT`, correction.userId, -correction.depositAmount, correction.id, correctedAt],
    );
    if (linkedReward) await client.query(
      `insert into primevora_transactions (id,user_id,type,amount,status,reference,created_at)
       values ($1,$2,'adjustment',$3,'completed',$4,$5)`,
      [`TX-${correction.id}-REFERRAL`, linkedReward.referrer_user_id, -correction.referralRewardAmount, correction.id, correctedAt],
    );
    await client.query("commit");
    // Only update in-memory investment/audit presentation state after the
    // durable ledger operation has committed.
    const item: DepositRequest = { id: correction.depositId, userId: correction.userId, amount: correction.depositAmount, status: "completed", network: "TRC20", address: null, createdAt: correctedAt };
    depositCorrections.unshift(correction);
    syncInvestmentToApprovedDeposit(ensureInvestment(item.userId));
    addAuditLog(
      "Approved deposit reversed",
      correction.depositAmount,
      `Deposit request #${item.id} corrected by Operations: ${correction.reason}. Referral correction: ${correction.referralRewardAmount.toFixed(2)} USDT`,
    );
    res.json(ReverseApprovedDepositResponse.parse(publicDeposit(item)));
  } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
});

router.get("/admin/withdrawals", async (_req, res) => {
  await refreshFinancialRecords();
  res.json(GetAdminWithdrawalsResponse.parse(withdrawals.map(publicWithdrawal)));
});

router.post("/admin/withdrawals/:id/status", async (req, res) => {
  const params = UpdateWithdrawalStatusParams.safeParse(req.params);
  const parsed = UpdateWithdrawalStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid withdrawal status update" });
    return;
  }
  await refreshFinancialRecords();
  const item = withdrawals.find((candidate) => candidate.id === params.data.id);
  if (!item) {
    res.status(404).json({ error: "Withdrawal request not found" });
    return;
  }
  if (item.status === "completed" || item.status === "rejected") {
    if (item.status !== parsed.data.status) {
      res.status(409).json({ error: `A ${item.status} withdrawal cannot change status` });
      return;
    }
    res.json(UpdateWithdrawalStatusResponse.parse(publicWithdrawal(item)));
    return;
  }
  if (item.status === "pending_review" && !["processing", "completed", "rejected"].includes(parsed.data.status)) {
    res.status(409).json({ error: "Invalid withdrawal status transition" });
    return;
  }
  if (item.status === "processing" && !["completed", "rejected"].includes(parsed.data.status)) {
    res.status(409).json({ error: "Invalid withdrawal status transition" });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("begin");
    const locked = await client.query(
      `select user_id, status from primevora_withdrawals where id=$1 for update`,
      [item.id],
    );
    if (!locked.rowCount) {
      await client.query("rollback");
      res.status(404).json({ error: "Withdrawal request not found" });
      return;
    }
    const persistedStatus = locked.rows[0].status as WithdrawalRequest["status"];
    if (persistedStatus === "completed" || persistedStatus === "rejected") {
      await client.query("rollback");
      if (persistedStatus !== parsed.data.status) {
        res.status(409).json({ error: `A ${persistedStatus} withdrawal cannot change status` });
      } else {
        item.status = persistedStatus;
        res.json(UpdateWithdrawalStatusResponse.parse(publicWithdrawal(item)));
      }
      return;
    }
    if (
      (persistedStatus === "pending_review" && !["processing", "completed", "rejected"].includes(parsed.data.status)) ||
      (persistedStatus === "processing" && !["completed", "rejected"].includes(parsed.data.status))
    ) {
      await client.query("rollback");
      res.status(409).json({ error: "Invalid withdrawal status transition" });
      return;
    }
    // Link by withdrawal_id for newly-created records; the id fallback keeps
    // the seeded legacy transaction synchronized as well.
    await client.query(`update primevora_withdrawals set status=$1 where id=$2`, [parsed.data.status, item.id]);
    await client.query(
      `update primevora_transactions set status=$1
       where withdrawal_id=$2 or id=$3`,
      [parsed.data.status === "completed" ? "completed" : parsed.data.status === "rejected" ? "rejected" : "pending", item.id, `TX-${item.id}`],
    );
    await client.query("commit");
  } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
  item.status = parsed.data.status;
  addAuditLog(
    `Withdrawal ${parsed.data.status}`,
    item.amount,
    `Withdrawal request #${item.id} marked ${parsed.data.status} by Operations`,
  );
  res.json(UpdateWithdrawalStatusResponse.parse(publicWithdrawal(item)));
});

router.get("/admin/tickets", (_req, res) => {
  res.json(GetAdminTicketsResponse.parse(tickets.map(publicTicket)));
});

router.post("/admin/tickets/:id/status", (req, res) => {
  const params = UpdateTicketStatusParams.safeParse(req.params);
  const parsed = UpdateTicketStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid ticket status update" });
    return;
  }
  const ticket = tickets.find((candidate) => candidate.id === params.data.id);
  if (!ticket) {
    res.status(404).json({ error: "Support ticket not found" });
    return;
  }
  ticket.status = parsed.data.status;
  res.json(UpdateTicketStatusResponse.parse(publicTicket(ticket)));
});

router.post("/admin/tickets/:id/reply", (req, res) => {
  const params = CreateTicketReplyParams.safeParse(req.params);
  const parsed = CreateTicketReplyBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid ticket reply" });
    return;
  }
  const ticket = tickets.find((candidate) => candidate.id === params.data.id);
  if (!ticket) {
    res.status(404).json({ error: "Support ticket not found" });
    return;
  }
  ticket.replies.push({
    id: Date.now(),
    author: "Primevora Care",
    message: parsed.data.message,
    createdAt: now(),
  });
  ticket.status = "in_progress";
  res.status(201).json(CreateTicketReplyResponse.parse(publicTicket(ticket)));
});

router.get("/admin/kyc", (_req, res) => {
  const { userId: _userId, ...first } = kycSubmissions[0];
  res.json(GetAdminKycResponse.parse(kycSubmissions.map(({ userId: _id, ...item }) => item)));
});

router.post("/admin/kyc/:id/status", (req, res) => {
  const params = UpdateKycStatusParams.safeParse(req.params);
  const parsed = UpdateKycStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid KYC status update" });
    return;
  }
  const item = kycSubmissions.find((candidate) => candidate.id === params.data.id);
  if (!item) {
    res.status(404).json({ error: "KYC submission not found" });
    return;
  }
  item.status = parsed.data.status;
  item.rejectionReason = parsed.data.rejectionReason ?? null;
  const { userId: _userId, ...result } = item;
  res.json(UpdateKycStatusResponse.parse(result));
});

export default router;