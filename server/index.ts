import { Hono } from "hono";
import seksiRouter from "./api/public/seksi";
import authRouter from "./api/admin/auth"; // Import router auth
import dashboardRouter from "./api/admin/dashboard";
import transactionRouter from "./api/admin/transaction";
import pengaturanRouter from "./api/admin/pengaturan";
import mediaRouter from "./api/admin/media";
import publicApi from "./api/public/index";

type AppBindings = {
  DB: D1Database;
  JWT_SECRET: string;
  MEDIA_BUCKET: R2Bucket;
};

type AppVariables = {
  requestId: string;
};

const app = new Hono<{
  Bindings: AppBindings;
  Variables: AppVariables;
}>();

app.use("*", async (c, next) => {
  const start = Date.now();
  const inboundRequestId = c.req.header("x-request-id");
  const requestId =
    inboundRequestId && inboundRequestId.trim()
      ? inboundRequestId.trim()
      : crypto.randomUUID();

  c.set("requestId", requestId);
  c.header("x-request-id", requestId);

  await next();

  const durationMs = Date.now() - start;
  const method = c.req.method;
  const url = new URL(c.req.url);
  const path = url.pathname;
  const status = c.res.status;
  const userAgent = c.req.header("user-agent") ?? "-";
  const cfRay = c.req.header("cf-ray") ?? "-";

  console.log("[http_request_metric]", {
    requestId,
    method,
    path,
    status,
    duration_ms: durationMs,
    userAgent,
    cfRay,
  });
});

app.route("/api/public/seksi", seksiRouter);
app.route("/api/admin/auth", authRouter); // auth login admin panel
app.route("/api/admin/dashboard", dashboardRouter);
app.route("/api/admin/transaction", transactionRouter);
app.route("/api/admin/pengaturan", pengaturanRouter);
app.route("/api/admin/media", mediaRouter);

app.get("/api/public/hello", (c) => {
  return c.json({ status: "success", message: "Backend berjalan!" });
});

app.route("/api/public", publicApi);

export default app;
