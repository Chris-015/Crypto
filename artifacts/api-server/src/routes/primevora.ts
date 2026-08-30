import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import {
  AssignDepositAddressBody,
  AssignDepositAddressParams,
  AssignDepositAddressResponse,
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

const now = () => new Date();

const transactions: Transaction[] = [
  {
    id: "TX-24810",
    type: "deposit",
    amount: 2500,
    status: "completed",
    reference: "TRC20-DEMO-24810",
    createdAt: new Date("2026-08-27T09:20:00Z"),
  },
  {
    id: "TX-24792",
    type: "referral",
    amount: 32.5,
    status: "completed",
    reference: "REF-8841",
    createdAt: new Date("2026-08-25T15:10:00Z"),
  },
  {
    id: "TX-24760",
    type: "withdrawal",
    amount: 400,
    status: "pending",
    reference: null,
    createdAt: new Date("2026-08-23T11:45:00Z"),
  },
];

const deposits: DepositRequest[] = [
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
  performance: [2.1, 2.8, 2.4, 3.6, 3.1, 4.2, 3.8, 5.2, 4.6, 5.7, 5.1, 6.2],
};

let copyAllocation = 0;
let nextKycId = 702;

let nextDepositId = 24837;
let nextWithdrawalId = 24761;
let nextTicketId = 1043;

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

const userIdFor = (req: Request) => {
  const auth = getAuth(req);
  return auth.userId ?? "demo-user";
};

const publicDeposit = (item: DepositRequest) => {
  const { userId: _userId, ...result } = item;
  return result;
};

const publicWithdrawal = (item: WithdrawalRequest) => {
  const { userId: _userId, ...result } = item;
  return result;
};

const publicTicket = (item: SupportTicket) => {
  const { userId: _userId, ...result } = item;
  return result;
};

const router: IRouter = Router();

router.get("/market", async (req, res): Promise<void> => {
  const ids = "bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,tether";
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=7&page=1&sparkline=false`,
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

router.get("/dashboard", (_req, res) => {
  const data = {
    balance: 12840.75,
    pendingBalance: 800,
    totalDeposited: 18450,
    totalWithdrawn: 1250,
    referralRewards: 186.5,
    recentActivity: transactions,
  };
  res.json(GetDashboardResponse.parse(data));
});

router.get("/transactions", (_req, res) => {
  res.json(GetTransactionsResponse.parse(transactions));
});

router.get("/deposits", (req, res) => {
  const userId = userIdFor(req);
  res.json(GetDepositsResponse.parse(deposits.filter((item) => item.userId === userId || userId === "demo-user").map(publicDeposit)));
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
      withdrawals.filter((item) => item.userId === userId || userId === "demo-user").map(publicWithdrawal),
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
  });
  res.status(201).json(CreateWithdrawalResponse.parse(publicWithdrawal(item)));
});

router.get("/referrals", (_req, res) => {
  res.json(
    GetReferralsResponse.parse({
      code: "PRIME-8841",
      link: "https://primevora.app/join/PRIME-8841",
      totalReferred: 12,
      activeReferred: 8,
      earned: 186.5,
      bonusRate: 5,
      history: [
        {
          id: "ref-1",
          email: "a••••@example.com",
          joinedAt: new Date("2026-08-21T11:00:00Z"),
          reward: 32.5,
        },
        {
          id: "ref-2",
          email: "m••••@example.com",
          joinedAt: new Date("2026-08-16T14:20:00Z"),
          reward: 25,
        },
      ],
    }),
  );
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
      isSimulated: true,
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
      isSimulated: true,
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
      auditLogs: [
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
      ],
    }),
  );
});

router.get("/admin/deposits", (_req, res) => {
  res.json(GetAdminDepositsResponse.parse(deposits.map(publicDeposit)));
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
  item.address = parsed.data.address;
  item.status = "awaiting_transfer";
  res.json(AssignDepositAddressResponse.parse(publicDeposit(item)));
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
  item.status = parsed.data.status;
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