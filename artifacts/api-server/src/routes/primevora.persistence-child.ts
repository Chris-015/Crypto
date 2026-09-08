import express from "express";
import primevoraRouter, {
  setPrimevoraAdminAuthResolverForTests,
  setPrimevoraUserIdResolverForTests,
} from "./primevora";

const [depositUserId, referrerUserId, withdrawalUserId] = process.argv.slice(2);
setPrimevoraUserIdResolverForTests((req) => req.header("x-test-user-id") ?? "demo-user");
setPrimevoraAdminAuthResolverForTests((req) => ({
  userId: req.header("x-test-user-id"),
  role: req.header("x-test-role"),
}));
const app = express();
app.use(express.json());
app.use("/api", primevoraRouter);
const server = app.listen(0, "127.0.0.1", async () => {
  const address = server.address();
  if (!address || typeof address === "string") process.exit(1);
  const origin = `http://127.0.0.1:${address.port}/api`;
  const get = async (path: string, userId: string) =>
    (await fetch(`${origin}${path}`, { headers: { "x-test-user-id": userId } })).json();
  const result = {
    deposits: await get("/deposits", depositUserId),
    depositDashboard: await get("/dashboard", depositUserId),
    referrals: await get("/referrals", referrerUserId),
    withdrawals: await get("/withdrawals", withdrawalUserId),
    withdrawalDashboard: await get("/dashboard", withdrawalUserId),
  };
  process.stdout.write(JSON.stringify(result));
  server.close(() => process.exit(0));
});