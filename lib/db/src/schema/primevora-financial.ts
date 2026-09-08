import {
  bigint,
  index,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const instant = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow();

export const primevoraDepositsTable = pgTable("primevora_deposits", {
  id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ startWith: 1_000_000 }),
  userId: text("user_id").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  status: text("status").notNull(),
  network: text("network").notNull(),
  address: text("address"),
  createdAt: instant("created_at"),
});

export const primevoraWithdrawalsTable = pgTable("primevora_withdrawals", {
  id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ startWith: 1_000_000 }),
  userId: text("user_id").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  address: text("address").notNull(),
  status: text("status").notNull(),
  network: text("network").notNull(),
  createdAt: instant("created_at"),
}, (table) => [index("primevora_withdrawals_user_idx").on(table.userId)]);

export const primevoraTransactionsTable = pgTable("primevora_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  status: text("status").notNull(),
  reference: text("reference"),
  depositId: bigint("deposit_id", { mode: "number" }),
  withdrawalId: bigint("withdrawal_id", { mode: "number" }),
  referralRewardId: text("referral_reward_id"),
  createdAt: instant("created_at"),
}, (table) => [
  index("primevora_transactions_user_idx").on(table.userId),
  uniqueIndex("primevora_transactions_withdrawal_unique").on(table.withdrawalId),
  uniqueIndex("primevora_transactions_reward_unique").on(table.referralRewardId),
]);

export const primevoraReferralAttributionsTable = pgTable("primevora_referral_attributions", {
  referredUserId: text("referred_user_id").primaryKey(),
  referrerUserId: text("referrer_user_id").notNull(),
  email: text("email").notNull(),
  joinedAt: instant("joined_at"),
});

export const primevoraReferralRewardsTable = pgTable("primevora_referral_rewards", {
  id: text("id").primaryKey(),
  referrerUserId: text("referrer_user_id").notNull(),
  referredUserId: text("referred_user_id").notNull(),
  depositId: bigint("deposit_id", { mode: "number" }).notNull(),
  depositAmount: numeric("deposit_amount", { precision: 18, scale: 2 }).notNull(),
  rewardRate: numeric("reward_rate", { precision: 5, scale: 2 }).notNull(),
  reward: numeric("reward", { precision: 18, scale: 2 }).notNull(),
  approvedAt: instant("approved_at"),
}, (table) => [
  uniqueIndex("primevora_referral_rewards_deposit_unique").on(table.depositId),
  index("primevora_referral_rewards_referrer_idx").on(table.referrerUserId),
]);

export const primevoraDepositCorrectionsTable = pgTable("primevora_deposit_corrections", {
  id: text("id").primaryKey(),
  depositId: bigint("deposit_id", { mode: "number" }).notNull(),
  userId: text("user_id").notNull(),
  reason: text("reason").notNull(),
  depositAmount: numeric("deposit_amount", { precision: 18, scale: 2 }).notNull(),
  referralRewardAmount: numeric("referral_reward_amount", { precision: 18, scale: 2 }).notNull(),
  correctedAt: instant("corrected_at"),
}, (table) => [uniqueIndex("primevora_deposit_corrections_deposit_unique").on(table.depositId)]);

export const primevoraUserLocksTable = pgTable("primevora_user_locks", {
  userId: text("user_id").primaryKey(),
  updatedAt: instant("updated_at"),
});

export const insertPrimevoraDepositSchema = createInsertSchema(primevoraDepositsTable).omit({ id: true, createdAt: true });
export type PrimevoraDeposit = typeof primevoraDepositsTable.$inferSelect;
export type InsertPrimevoraDeposit = z.infer<typeof insertPrimevoraDepositSchema>;

export const insertPrimevoraWithdrawalSchema = createInsertSchema(primevoraWithdrawalsTable).omit({ id: true, createdAt: true });
export type PrimevoraWithdrawal = typeof primevoraWithdrawalsTable.$inferSelect;
export type InsertPrimevoraWithdrawal = z.infer<typeof insertPrimevoraWithdrawalSchema>;

export const insertPrimevoraTransactionSchema = createInsertSchema(primevoraTransactionsTable).omit({ createdAt: true });
export type PrimevoraTransaction = typeof primevoraTransactionsTable.$inferSelect;
export type InsertPrimevoraTransaction = z.infer<typeof insertPrimevoraTransactionSchema>;

export const insertPrimevoraReferralAttributionSchema = createInsertSchema(primevoraReferralAttributionsTable).omit({ joinedAt: true });
export type PrimevoraReferralAttribution = typeof primevoraReferralAttributionsTable.$inferSelect;
export type InsertPrimevoraReferralAttribution = z.infer<typeof insertPrimevoraReferralAttributionSchema>;

export const insertPrimevoraReferralRewardSchema = createInsertSchema(primevoraReferralRewardsTable).omit({ approvedAt: true });
export type PrimevoraReferralReward = typeof primevoraReferralRewardsTable.$inferSelect;
export type InsertPrimevoraReferralReward = z.infer<typeof insertPrimevoraReferralRewardSchema>;

export const insertPrimevoraDepositCorrectionSchema = createInsertSchema(primevoraDepositCorrectionsTable).omit({ correctedAt: true });
export type PrimevoraDepositCorrection = typeof primevoraDepositCorrectionsTable.$inferSelect;
export type InsertPrimevoraDepositCorrection = z.infer<typeof insertPrimevoraDepositCorrectionSchema>;