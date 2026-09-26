import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import "./db.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { profilesRouter } from "./routes/profiles.js";
import { pdfRouter } from "./routes/pdf.js";
import { careerMapRouter } from "./routes/careerMap.js";
import { jobDescriptionsRouter } from "./routes/jobDescriptions.js";
import { grammarRouter } from "./routes/grammar.js";
import { publicRouter } from "./routes/public.js";
import { auditRouter } from "./routes/audit.js";
import { employeesRouter } from "./routes/employees.js";
import { requestsRouter } from "./routes/requests.js";
import { codeOfConductRouter } from "./routes/codeOfConduct.js";
import { twoFactorRouter } from "./routes/twoFactor.js";
import { attachUser } from "./middleware.js";
import { forcePasswordChangeGate } from "./forcePasswordChangeGate.js";
import { force2faSetupGate } from "./force2faSetupGate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Order matters: attachUser first so authRouter's own requireAuth-gated
// routes (GET /me, PATCH /me, POST /me/password) see req.user. authRouter
// itself sits before the forced-password-change gate, so all of
// /api/auth/* — sign-in, "read my profile", "set my password" — stays
// reachable no matter what; every router mounted after the gate does not.
// /api/2fa sits between the two forced-setup gates for the same reason:
// it must stay reachable while must_setup_2fa is true (that's the whole
// point — you need /2fa/setup and /2fa/confirm to get past the gate), but
// still requires a real password to already be set first.
//
// Both gates are scoped to "/api" specifically, not mounted bare — mounted
// bare, they'd also intercept the static frontend build and the SPA
// catch-all further below, so a flagged user hard-loading (or refreshing,
// or opening a bookmark to) ANY page, including "/", got a raw JSON 403
// instead of the app shell — RequireAuth.tsx never even got a chance to
// render ForceChangePasswordPage/ForceSetup2FAPage in its place, since the
// server never sent index.html at all. Scoping to "/api" lets the SPA
// shell always load; the client-side gate in RequireAuth.tsx (which reads
// the same must_change_password/must_setup_2fa flags from /api/auth/me)
// is what actually shows the right page once it does.
app.use(attachUser);
app.use("/api/auth", authRouter);
app.use("/api", forcePasswordChangeGate);
app.use("/api/2fa", twoFactorRouter);
app.use("/api", force2faSetupGate);
app.use("/api/users", usersRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/profiles", pdfRouter);
app.use("/api/career-map", careerMapRouter);
app.use("/api/job-descriptions", jobDescriptionsRouter);
app.use("/api/grammar", grammarRouter);
app.use("/api/audit-log", auditRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/code-of-conduct", codeOfConductRouter);
app.use("/api/public", publicRouter);

// Production: serve the built frontend from the same process/port, so the
// whole app is one process with no separate hosting to configure.
const webDist = join(__dirname, "../../web/dist");
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(join(webDist, "index.html"));
  });
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Unios Foundation server listening on http://localhost:${port}`);
});
