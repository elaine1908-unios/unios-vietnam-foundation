import { Router } from "express";
import { db } from "../db.js";
import { newId } from "../ids.js";
import { requireCap } from "../middleware.js";
import { logAudit, diffAndLog } from "../audit.js";
import type { CareerRankKey } from "../types.js";

export const careerMapRouter = Router();

// Baseline for every route in this router, read and write alike — the
// mutating routes below layer a stricter requireCap on top. Note Team Lead
// holds careermap.view but not careerrole.* — it can see the map, not edit it.
careerMapRouter.use(requireCap("careermap.view"));

const VALID_RANKS: CareerRankKey[] = ["core", "specialists", "leadership", "divisional"];

function validate(body: { division?: string; function?: string | null; rank?: string; role_name?: string }): string | null {
  if (!body.division?.trim()) return "Division is required.";
  if (!body.role_name?.trim()) return "Role name is required.";
  if (!body.rank || !VALID_RANKS.includes(body.rank as CareerRankKey)) {
    return "Rank must be one of: core, specialists, leadership, divisional.";
  }
  return null;
}

// Non-archived Job Profiles currently linked to each role — shown on the
// Career Map management page so archiving a role that's still in active use
// isn't a silent surprise.
function withProfileCounts(rows: Record<string, unknown>[]) {
  const counts = db
    .prepare(
      "SELECT career_map_role_id, COUNT(*) as n FROM job_profiles WHERE career_map_role_id IS NOT NULL AND is_archived = 0 GROUP BY career_map_role_id",
    )
    .all() as { career_map_role_id: string; n: number }[];
  const countByRole = new Map(counts.map((c) => [c.career_map_role_id, c.n]));
  return rows.map((r) => ({ ...r, is_archived: Boolean(r.is_archived), profile_count: countByRole.get(r.id as string) ?? 0 }));
}

careerMapRouter.get("/", (req, res) => {
  const includeArchived = req.query.includeArchived === "true";
  const rows = db
    .prepare(
      `SELECT * FROM career_map_roles ${includeArchived ? "" : "WHERE is_archived = 0"} ORDER BY sort_order, role_name COLLATE NOCASE`,
    )
    .all() as Record<string, unknown>[];
  res.json(withProfileCounts(rows));
});

careerMapRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM career_map_roles WHERE id = ?").get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!row) {
    res.status(404).json({ error: "Role not found." });
    return;
  }
  res.json(withProfileCounts([row])[0]);
});

careerMapRouter.post("/", requireCap("careerrole.create"), (req, res) => {
  const body = req.body as { division?: string; function?: string | null; rank?: string; role_name?: string };
  const error = validate(body);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  const id = newId();
  const maxOrder = (db.prepare("SELECT COALESCE(MAX(sort_order), 0) as m FROM career_map_roles").get() as { m: number }).m;
  try {
    db.prepare(
      `INSERT INTO career_map_roles (id, division, function, rank, role_name, sort_order, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      body.division!.trim(),
      body.function?.trim() || null,
      body.rank!,
      body.role_name!.trim(),
      maxOrder + 10,
      req.user!.id,
      req.user!.id,
    );
  } catch {
    res.status(409).json({ error: "A role with this name already exists." });
    return;
  }
  logAudit("career_map_role", id, "created", req.user!.id);
  res.status(201).json(db.prepare("SELECT * FROM career_map_roles WHERE id = ?").get(id));
});

careerMapRouter.patch("/:id", requireCap("careerrole.edit"), (req, res) => {
  const existing = db.prepare("SELECT * FROM career_map_roles WHERE id = ?").get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: "Role not found." });
    return;
  }
  const body = req.body as { division?: string; function?: string | null; rank?: string; role_name?: string };
  const error = validate(body);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  try {
    db.prepare(
      `UPDATE career_map_roles SET division = ?, function = ?, rank = ?, role_name = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(body.division!.trim(), body.function?.trim() || null, body.rank!, body.role_name!.trim(), req.user!.id, req.params.id);
  } catch {
    res.status(409).json({ error: "A role with this name already exists." });
    return;
  }
  const updated = db.prepare("SELECT * FROM career_map_roles WHERE id = ?").get(req.params.id) as Record<string, unknown>;
  diffAndLog("career_map_role", req.params.id, existing, updated, ["division", "function", "rank", "role_name"], req.user!.id);
  res.json(updated);
});

careerMapRouter.post("/:id/archive", requireCap("careerrole.archive"), (req, res) => {
  const result = db.prepare("UPDATE career_map_roles SET is_archived = 1 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Role not found." });
    return;
  }
  logAudit("career_map_role", req.params.id, "archived", req.user!.id, "is_archived", "false", "true");
  res.json({ ok: true });
});

careerMapRouter.post("/:id/restore", requireCap("careerrole.archive"), (req, res) => {
  const result = db.prepare("UPDATE career_map_roles SET is_archived = 0 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Role not found." });
    return;
  }
  logAudit("career_map_role", req.params.id, "restored", req.user!.id, "is_archived", "true", "false");
  res.json({ ok: true });
});
