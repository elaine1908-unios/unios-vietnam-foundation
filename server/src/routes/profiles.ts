import { Router } from "express";
import { db, transaction } from "../db.js";
import { newId } from "../ids.js";
import { requireCap } from "../middleware.js";
import { logAudit, diffAndLog } from "../audit.js";
import { getOrCreateTranslation } from "../translation.js";
import type { ProfileForTranslation } from "../translation.js";

export const profilesRouter = Router();

// Baseline for every route in this router, read and write alike — the
// mutating routes below layer a stricter requireCap on top.
profilesRouter.use(requireCap("profile.view"));

interface ResponsibilityInput {
  main_function: string;
  responsibilities: string;
  success_criteria?: string;
}
interface RequirementInput {
  requirement: string;
}
interface OkrInput {
  objective: string;
  key_results: string;
}
interface CompetencyInput {
  skill: string;
  level?: string;
  requirement?: string;
}
interface ProfileInput {
  job_title: string;
  rank?: string;
  division?: string;
  function?: string;
  location?: string;
  last_updated?: string;
  compensation?: string;
  benefits?: string;
  bonuses?: string;
  // The Career Map role this profile was created from, if any — null when
  // the team lead used the "Other (type manually)" fallback. Deliberately
  // not kept in sync if that role is later renamed (see migration 0003);
  // it's a traceability link, not a live mirror.
  career_map_role_id?: string | null;
  responsibilities: ResponsibilityInput[];
  requirements: RequirementInput[];
  okrs: OkrInput[];
  competencies: CompetencyInput[];
}

function loadProfile(id: string) {
  const profile = db.prepare("SELECT * FROM job_profiles WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!profile) return null;
  const careerMapRole = profile.career_map_role_id
    ? db.prepare("SELECT * FROM career_map_roles WHERE id = ?").get(profile.career_map_role_id as string) as
        | Record<string, unknown>
        | undefined
    : undefined;
  return {
    ...profile,
    is_archived: Boolean(profile.is_archived),
    // Current state of the linked Career Map role (may differ from this
    // profile's own job_title/rank/division/function if the role was renamed
    // since, or be absent if the role was hard-referenced by an id that no
    // longer resolves — shouldn't happen since roles are archived, not
    // deleted, but handled defensively).
    career_map_role: careerMapRole ? { ...careerMapRole, is_archived: Boolean(careerMapRole.is_archived) } : null,
    responsibilities: db
      .prepare("SELECT * FROM profile_responsibilities WHERE job_profile_id = ? ORDER BY sort_order")
      .all(id),
    requirements: db
      .prepare("SELECT * FROM profile_requirements WHERE job_profile_id = ? ORDER BY sort_order")
      .all(id),
    okrs: db.prepare("SELECT * FROM profile_okrs WHERE job_profile_id = ? ORDER BY sort_order").all(id),
    competencies: db
      .prepare("SELECT * FROM profile_competencies WHERE job_profile_id = ? ORDER BY sort_order")
      .all(id),
  };
}

function resolveCareerMapRoleId(rawId: string | null | undefined): string | null | "invalid" {
  if (!rawId) return null;
  const exists = db.prepare("SELECT id FROM career_map_roles WHERE id = ?").get(rawId);
  return exists ? rawId : "invalid";
}

function validate(input: ProfileInput): string | null {
  if (!input.job_title?.trim()) return "Job title is required.";
  for (const r of input.responsibilities ?? []) {
    if (!r.main_function?.trim() || !r.responsibilities?.trim()) {
      return "Each responsibility needs a main function and a description.";
    }
  }
  for (const r of input.requirements ?? []) {
    if (!r.requirement?.trim()) return "Essential requirement rows can't be blank.";
  }
  for (const o of input.okrs ?? []) {
    if (!o.objective?.trim() || !o.key_results?.trim()) return "Each OKR needs an objective and key results.";
  }
  for (const c of input.competencies ?? []) {
    if (!c.skill?.trim()) return "Each competency needs a skill name.";
    if (c.level && !["Basic", "Intermediate", "Advanced", "Expert"].includes(c.level)) {
      return "Competency level must be Basic, Intermediate, Advanced, or Expert.";
    }
  }
  return null;
}

const writeChildren = (profileId: string, input: ProfileInput) => {
  db.prepare("DELETE FROM profile_responsibilities WHERE job_profile_id = ?").run(profileId);
  db.prepare("DELETE FROM profile_requirements WHERE job_profile_id = ?").run(profileId);
  db.prepare("DELETE FROM profile_okrs WHERE job_profile_id = ?").run(profileId);
  db.prepare("DELETE FROM profile_competencies WHERE job_profile_id = ?").run(profileId);

  (input.responsibilities ?? []).forEach((r, i) => {
    db.prepare(
      "INSERT INTO profile_responsibilities (id, job_profile_id, sort_order, main_function, responsibilities, success_criteria) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(newId(), profileId, i, r.main_function.trim(), r.responsibilities.trim(), r.success_criteria?.trim() || null);
  });
  (input.requirements ?? []).forEach((r, i) => {
    db.prepare(
      "INSERT INTO profile_requirements (id, job_profile_id, sort_order, requirement) VALUES (?, ?, ?, ?)",
    ).run(newId(), profileId, i, r.requirement.trim());
  });
  (input.okrs ?? []).forEach((o, i) => {
    db.prepare(
      "INSERT INTO profile_okrs (id, job_profile_id, sort_order, objective, key_results) VALUES (?, ?, ?, ?, ?)",
    ).run(newId(), profileId, i, o.objective.trim(), o.key_results.trim());
  });
  (input.competencies ?? []).forEach((c, i) => {
    db.prepare(
      "INSERT INTO profile_competencies (id, job_profile_id, sort_order, skill, level, requirement) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(newId(), profileId, i, c.skill.trim(), c.level || null, c.requirement?.trim() || null);
  });
};

profilesRouter.get("/", (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const includeArchived = req.query.includeArchived === "true";
  const clauses: string[] = [];
  const params: string[] = [];
  if (!includeArchived) clauses.push("is_archived = 0");
  if (search) {
    clauses.push("(job_title LIKE ? OR rank LIKE ? OR division LIKE ? OR function LIKE ? OR location LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT id, job_title, rank, division, function, location, last_updated, is_archived, updated_at
       FROM job_profiles ${where} ORDER BY job_title COLLATE NOCASE`,
    )
    .all(...params) as Record<string, unknown>[];
  res.json(rows.map((r) => ({ ...r, is_archived: Boolean(r.is_archived) })));
});

profilesRouter.get("/:id", (req, res) => {
  const profile = loadProfile(req.params.id);
  if (!profile) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  res.json(profile);
});

profilesRouter.post("/", requireCap("profile.create"), (req, res) => {
  const input = req.body as ProfileInput;
  const error = validate(input);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  const careerMapRoleId = resolveCareerMapRoleId(input.career_map_role_id);
  if (careerMapRoleId === "invalid") {
    res.status(400).json({ error: "That Career Map role no longer exists." });
    return;
  }
  const id = newId();
  const create = transaction(() => {
    db.prepare(
      `INSERT INTO job_profiles (id, job_title, rank, division, function, location, last_updated, compensation, benefits, bonuses, career_map_role_id, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.job_title.trim(),
      input.rank?.trim() || null,
      input.division?.trim() || null,
      input.function?.trim() || null,
      input.location?.trim() || null,
      input.last_updated?.trim() || null,
      input.compensation?.trim() || null,
      input.benefits?.trim() || null,
      input.bonuses?.trim() || null,
      careerMapRoleId,
      req.user!.id,
      req.user!.id,
    );
    writeChildren(id, input);
  });
  create();
  logAudit("job_profile", id, "created", req.user!.id);
  res.status(201).json(loadProfile(id));
});

profilesRouter.patch("/:id", requireCap("profile.edit"), (req, res) => {
  const existing = db.prepare("SELECT * FROM job_profiles WHERE id = ?").get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  const input = req.body as ProfileInput;
  const error = validate(input);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  const careerMapRoleId = resolveCareerMapRoleId(input.career_map_role_id);
  if (careerMapRoleId === "invalid") {
    res.status(400).json({ error: "That Career Map role no longer exists." });
    return;
  }
  const existingChildren = {
    responsibilities: JSON.stringify(db.prepare("SELECT main_function, responsibilities, success_criteria FROM profile_responsibilities WHERE job_profile_id = ? ORDER BY sort_order").all(req.params.id)),
    requirements: JSON.stringify(db.prepare("SELECT requirement FROM profile_requirements WHERE job_profile_id = ? ORDER BY sort_order").all(req.params.id)),
    okrs: JSON.stringify(db.prepare("SELECT objective, key_results FROM profile_okrs WHERE job_profile_id = ? ORDER BY sort_order").all(req.params.id)),
    competencies: JSON.stringify(db.prepare("SELECT skill, level, requirement FROM profile_competencies WHERE job_profile_id = ? ORDER BY sort_order").all(req.params.id)),
  };
  const update = transaction(() => {
    db.prepare(
      `UPDATE job_profiles SET job_title = ?, rank = ?, division = ?, function = ?, location = ?, last_updated = ?,
       compensation = ?, benefits = ?, bonuses = ?, career_map_role_id = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(
      input.job_title.trim(),
      input.rank?.trim() || null,
      input.division?.trim() || null,
      input.function?.trim() || null,
      input.location?.trim() || null,
      input.last_updated?.trim() || null,
      input.compensation?.trim() || null,
      input.benefits?.trim() || null,
      input.bonuses?.trim() || null,
      careerMapRoleId,
      req.user!.id,
      req.params.id,
    );
    writeChildren(req.params.id, input);
  });
  update();
  const updatedRow = db.prepare("SELECT * FROM job_profiles WHERE id = ?").get(req.params.id) as Record<string, unknown>;
  diffAndLog(
    "job_profile",
    req.params.id,
    existing,
    updatedRow,
    ["job_title", "rank", "division", "function", "location", "last_updated", "compensation", "benefits", "bonuses"],
    req.user!.id,
  );
  // The four child sections are wholesale-replaced arrays, not scalar
  // fields — logged as a single "section changed" note per section rather
  // than a structural diff (see audit.ts's diffAndLog comment).
  const newChildren = {
    responsibilities: JSON.stringify(input.responsibilities ?? []),
    requirements: JSON.stringify(input.requirements ?? []),
    okrs: JSON.stringify(input.okrs ?? []),
    competencies: JSON.stringify(input.competencies ?? []),
  };
  diffAndLog(
    "job_profile",
    req.params.id,
    existingChildren,
    newChildren,
    ["responsibilities", "requirements", "okrs", "competencies"],
    req.user!.id,
  );
  res.json(loadProfile(req.params.id));
});

profilesRouter.post("/:id/archive", requireCap("profile.archive"), (req, res) => {
  const result = db.prepare("UPDATE job_profiles SET is_archived = 1 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  logAudit("job_profile", req.params.id, "archived", req.user!.id, "is_archived", "false", "true");
  res.json({ ok: true });
});

profilesRouter.post("/:id/restore", requireCap("profile.archive"), (req, res) => {
  const result = db.prepare("UPDATE job_profiles SET is_archived = 0 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  logAudit("job_profile", req.params.id, "restored", req.user!.id, "is_archived", "true", "false");
  res.json({ ok: true });
});

profilesRouter.get("/:id/audit-log", (req, res) => {
  const profile = db.prepare("SELECT id FROM job_profiles WHERE id = ?").get(req.params.id);
  if (!profile) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  const rows = db
    .prepare(
      `SELECT audit_log.id, audit_log.action, audit_log.field_name, audit_log.old_value, audit_log.new_value,
              audit_log.changed_at, users.name as changed_by_name, users.email as changed_by_email
       FROM audit_log LEFT JOIN users ON users.id = audit_log.changed_by
       WHERE audit_log.entity_type = 'job_profile' AND audit_log.entity_id = ?
       ORDER BY audit_log.changed_at DESC`,
    )
    .all(req.params.id);
  res.json(rows);
});

interface TranslationRow {
  content_json: string;
  source_updated_at: string;
  translated_at: string;
}

// Any signed-in user can view or (re)generate a translation — it's a
// derived, read-only artifact of the profile, not an edit to its content, so
// this doesn't need Team Lead permissions the way writing the profile does.
profilesRouter.get("/:id/translation", (req, res) => {
  const profile = db.prepare("SELECT updated_at FROM job_profiles WHERE id = ?").get(req.params.id) as
    | { updated_at: string }
    | undefined;
  if (!profile) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  const row = db
    .prepare("SELECT content_json, source_updated_at, translated_at FROM job_profile_translations WHERE job_profile_id = ?")
    .get(req.params.id) as TranslationRow | undefined;
  if (!row) {
    res.status(404).json({ error: "not_translated" });
    return;
  }
  res.json({
    content: JSON.parse(row.content_json),
    translated_at: row.translated_at,
    stale: row.source_updated_at !== profile.updated_at,
  });
});

profilesRouter.post("/:id/translate", async (req, res) => {
  const profile = loadProfile(req.params.id);
  if (!profile) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  try {
    const updatedAt = (profile as unknown as { updated_at: string }).updated_at;
    const translated = await getOrCreateTranslation(
      req.params.id,
      profile as unknown as ProfileForTranslation,
      updatedAt,
      req.user!.id,
      true, // force: this is the explicit (re)translate action
    );
    res.json({ content: translated, translated_at: new Date().toISOString(), stale: false });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Translation failed." });
  }
});
