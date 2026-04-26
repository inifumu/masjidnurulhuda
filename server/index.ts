import { Hono } from "hono";
import seksiRouter from "./api/public/seksi";
import authRouter from "./api/admin/auth"; // Import router auth
import dashboardRouter from "./api/admin/dashboard";
import transactionRouter from "./api/admin/transaction";
import pengaturanRouter from "./api/admin/pengaturan";
import publicApi from "./api/public/index";

const app = new Hono<{ Bindings: { DB: D1Database } }>();

app.route("/api/public/seksi", seksiRouter);
app.route("/api/admin/auth", authRouter); // auth login admin panel
app.route("/api/admin/dashboard", dashboardRouter);
app.route("/api/admin/transaction", transactionRouter);
app.route("/api/admin/pengaturan", pengaturanRouter);

app.get("/api/public/hello", (c) => {
  return c.json({ status: "success", message: "Backend berjalan!" });
});

app.route("/api/public", publicApi);

export default app;
