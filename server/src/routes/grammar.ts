import { Router } from "express";
import { requireCap } from "../middleware.js";
import { scanGrammar } from "../anthropic.js";
import type { TextField } from "../anthropic.js";

export const grammarRouter = Router();

// Whoever can edit a profile is who triggers a scan during save — gated the
// same as profile.edit rather than left on plain requireAuth.
grammarRouter.use(requireCap("profile.edit"));

grammarRouter.post("/scan", async (req, res) => {
  const fields = (req.body?.fields ?? []) as TextField[];
  if (!Array.isArray(fields)) {
    res.status(400).json({ error: "fields must be an array of {label, text}." });
    return;
  }
  try {
    const issues = await scanGrammar(fields);
    res.json({ issues });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Grammar scan failed." });
  }
});
