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
import { attachUser } from "./middleware.js";
import { forcePasswordChangeGate } from "./forcePasswordChangeGate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// Order matters: attachUser first so authRouter's own requireAuth-gated
// routes (GET /me, PATCH /me, POST /me/password) see req.user. authRouter
// itself sits before the forced-password-change gate, so all of
// /api/auth/* — sign-in, "read my profile", "set my password" — stays
// reachable no matter what; every router mounted after the gate does not.
app.use(attachUser);
app.use("/api/auth", authRouter);
app.use(forcePasswordChangeGate);
app.use("/api/users", usersRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/profiles", pdfRouter);
app.use("/api/career-map", careerMapRouter);
app.use("/api/job-descriptions", jobDescriptionsRouter);
app.use("/api/grammar", grammarRouter);
app.use("/api/audit-log", auditRouter);
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
  console.log(`Performance Profiles server listening on http://localhost:${port}`);
});
