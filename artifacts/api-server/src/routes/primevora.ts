import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
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

const now = () => new Date();

const transactions: Transaction[] = [
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

const deposits: DepositRequest[] = [
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

const referralAttributions: ReferralAttribution[] = [
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

const referralRewards: ReferralReward[] = [
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

const withdrawals: WithdrawalRequest[] = [
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

let nextDepositId = 24837;
let nextWithdrawalId = 24761;
let nextTicketId = 1043;
let nextAuditId = 3;
const referralCodes = new Map<string, string>([["PRIME-8841", "demo-user"]]);

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

let resolveUserId: UserIdResolver = (req) => getAuth(req).userId;

export const setPrimevoraUserIdResolverForTests = (resolver: UserIdResolver) => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("The Primevora user ID resolver can only be replaced in tests");
  }
  resolveUserId = resolver;
};

const userIdFor = (req: Request) => resolveUserId(req) ?? "demo-user";

const publicDeposit = (item: DepositRequest) => {
  const { userId: _userId, ...result } = item;
  return result;
};

const latestApprovedDeposit = (userId: string) =>
  deposits
    .filter((item) => item.userId === userId && item.status === "completed")
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
      .reduce((sum, item) => sum + item.amount, 0),
  );
const referralRewardsTotal = (userId: string) =>
  money(
    referralRewards
      .filter((item) => item.referrerUserId === userId)
      .reduce((sum, item) => sum + item.reward, 0),
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

router.get("/dashboard", (req, res) => {
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

router.get("/investment", (req, res) => {
  const record = ensureInvestment(userIdFor(req));
  syncInvestmentToApprovedDeposit(record);
  accrueInvestment(record);
  res.json(GetInvestmentResponse.parse(publicInvestment(record)));
});

router.get("/transactions", (req, res) => {
  const userId = userIdFor(req);
  res.json(GetTransactionsResponse.parse(transactions.filter((item) => item.userId === userId)));
});

router.get("/deposits", (req, res) => {
  const userId = userIdFor(req);
  res.json(GetDepositsResponse.parse(deposits.filter((item) => item.userId === userId).map(publicDeposit)));
});

router.post("/deposits", (req, res) => {
  const parsed = CreateDepositBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = userIdFor(req);
  const item: DepositRequest = {
    id: nextDepositId++,
    amount: parsed.data.amount,
    status: "awaiting_address",
    network: "TRC20",
    address: null,
    createdAt: now(),
    userId,
  };
  deposits.unshift(item);
  res.status(201).json(CreateDepositResponse.parse(publicDeposit(item)));
});

router.get("/withdrawals", (req, res) => {
  const userId = userIdFor(req);
  res.json(
    GetWithdrawalsResponse.parse(
      withdrawals.filter((item) => item.userId === userId).map(publicWithdrawal),
    ),
  );
});

router.post("/withdrawals", (req, res) => {
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
  const available = withdrawableBalance(userId);
  if (parsed.data.amount > available) {
    res.status(409).json({ error: `Withdrawal exceeds available balance of ${available.toFixed(2)} USDT` });
    return;
  }
  const item: WithdrawalRequest = {
    id: nextWithdrawalId++,
    amount: parsed.data.amount,
    address: parsed.data.address,
    status: "pending_review",
    network: "TRC20",
    createdAt: now(),
    userId,
  };
  withdrawals.unshift(item);
  transactions.unshift({
    id: `TX-${item.id}`,
    type: "withdrawal",
    amount: item.amount,
    status: "pending",
    reference: null,
    createdAt: item.createdAt,
    userId,
  });
  res.status(201).json(CreateWithdrawalResponse.parse(publicWithdrawal(item)));
});

router.get("/referrals", (req, res) => {
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
        };
      }),
    }),
  );
});

router.post("/referrals/claim", (req, res) => {
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
  if (!existing) {
    referralAttributions.push({
      referrerUserId,
      referredUserId,
      email: "Primevora member",
      joinedAt: now(),
    });
  }
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

router.get("/admin/overview", (_req, res) => {
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

router.get("/admin/deposits", (_req, res) => {
  res.json(GetAdminDepositsResponse.parse(deposits.map(publicDeposit)));
});

router.get("/admin/investments", (_req, res) => {
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

router.post("/admin/deposits/:id/address", (req, res) => {
  const params = AssignDepositAddressParams.safeParse(req.params);
  const parsed = AssignDepositAddressBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid deposit address assignment" });
    return;
  }
  const item = deposits.find((candidate) => candidate.id === params.data.id);
  if (!item) {
    res.status(404).json({ error: "Deposit request not found" });
    return;
  }
  if (item.status !== "awaiting_address") {
    res.status(409).json({ error: `An ${item.status} deposit cannot receive a new address` });
    return;
  }
  item.address = parsed.data.address;
  item.status = "awaiting_transfer";
  res.json(AssignDepositAddressResponse.parse(publicDeposit(item)));
});

router.post("/admin/deposits/:id/status", (req, res) => {
  const params = UpdateDepositStatusParams.safeParse(req.params);
  const parsed = UpdateDepositStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid deposit status update" });
    return;
  }
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
  item.status = parsed.data.status;
  if (item.status === "completed") {
    if (!transactions.some((transaction) => transaction.id === `TX-${item.id}`)) {
      transactions.unshift({
        id: `TX-${item.id}`,
        type: "deposit",
        amount: item.amount,
        status: "completed",
        reference: `DEPOSIT-${item.id}`,
        createdAt: now(),
        userId: item.userId,
      });
    }
    awardReferralReward(item);
  }
  syncInvestmentToApprovedDeposit(ensureInvestment(item.userId));
  addAuditLog(
    parsed.data.status === "completed" ? "Deposit approved" : "Deposit rejected",
    item.amount,
    `Deposit request #${item.id} marked ${parsed.data.status} by Operations`,
  );
  res.json(UpdateDepositStatusResponse.parse(publicDeposit(item)));
});

router.get("/admin/withdrawals", (_req, res) => {
  res.json(GetAdminWithdrawalsResponse.parse(withdrawals.map(publicWithdrawal)));
});

router.post("/admin/withdrawals/:id/status", (req, res) => {
  const params = UpdateWithdrawalStatusParams.safeParse(req.params);
  const parsed = UpdateWithdrawalStatusBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid withdrawal status update" });
    return;
  }
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
  item.status = parsed.data.status;
  const transaction = transactions.find((candidate) => candidate.id === `TX-${item.id}`);
  if (transaction) {
    transaction.status =
      parsed.data.status === "completed"
        ? "completed"
        : parsed.data.status === "rejected"
          ? "rejected"
          : "pending";
  }
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