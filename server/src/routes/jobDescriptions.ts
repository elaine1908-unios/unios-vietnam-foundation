import { Router } from "express";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "../db.js";
import { newId } from "../ids.js";
import { requireCap } from "../middleware.js";
import { logAudit, diffAndLog } from "../audit.js";
import { JobDescriptionDocument } from "../pdf/JobDescriptionDocument.js";
import type { JobDescriptionForPdf, JdLang, EmploymentType } from "../pdf/JobDescriptionDocument.js";
import { getOrCreateTranslation } from "../translation.js";
import type { ProfileForTranslation } from "../translation.js";

export const jobDescriptionsRouter = Router();

// Job Descriptions aren't part of the original career-map/profiles spec —
// extended here at the same tier as profiles (see capabilities.ts).
jobDescriptionsRouter.use(requireCap("jobdescription.view"));

const EMPLOYMENT_TYPES: EmploymentType[] = ["full_time", "part_time"];

interface JobDescriptionInput {
  job_profile_id?: string;
  location?: string;
  is_now_hiring?: boolean;
  employment_type?: EmploymentType;
  // Only meaningful (and shown) for part_time — full_time always uses the
  // fixed JD_COPY/COPY benefits boilerplate instead. There's no standard
  // benefits package for a part-time role, so HR writes their own per posting.
  custom_benefits?: string | null;
}

function validate(input: JobDescriptionInput): string | null {
  if (!input.job_profile_id?.trim()) return "A Job Profile is required.";
  if (!input.location?.trim()) return "Location is required.";
  const profile = db.prepare("SELECT id FROM job_profiles WHERE id = ?").get(input.job_profile_id);
  if (!profile) return "That Job Profile no longer exists.";
  if (input.employment_type && !EMPLOYMENT_TYPES.includes(input.employment_type)) {
    return `Employment type must be one of: ${EMPLOYMENT_TYPES.join(", ")}.`;
  }
  return null;
}

interface JobDescriptionRow {
  id: string;
  location: string;
  is_archived: number;
  is_now_hiring: number;
  employment_type: EmploymentType;
  custom_benefits: string | null;
  created_at: string;
  updated_at: string;
  job_profile_id: string;
  job_title: string;
  division: string | null;
  function: string | null;
}

export function loadDetail(id: string) {
  const row = db
    .prepare(
      `SELECT jd.id, jd.location, jd.is_archived, jd.is_now_hiring, jd.employment_type, jd.custom_benefits,
              jd.created_at, jd.updated_at, jd.job_profile_id, jp.job_title, jp.division, jp.function
       FROM job_descriptions jd JOIN job_profiles jp ON jp.id = jd.job_profile_id
       WHERE jd.id = ?`,
    )
    .get(id) as JobDescriptionRow | undefined;
  if (!row) return null;
  const profileId = row.job_profile_id as string;
  return {
    ...row,
    is_archived: Boolean(row.is_archived),
    is_now_hiring: Boolean(row.is_now_hiring),
    // Live-pulled from the linked profile, current as of right now — a JD
    // deliberately has no content of its own to go stale. success_criteria
    // is intentionally left out: it's an internal measurement detail, not
    // something to put in front of a candidate.
    responsibilities: db
      .prepare(
        "SELECT main_function, responsibilities FROM profile_responsibilities WHERE job_profile_id = ? ORDER BY sort_order",
      )
      .all(profileId),
    requirements: db
      .prepare("SELECT requirement FROM profile_requirements WHERE job_profile_id = ? ORDER BY sort_order")
      .all(profileId),
    competencies: db
      .prepare("SELECT skill, level, requirement FROM profile_competencies WHERE job_profile_id = ? ORDER BY sort_order")
      .all(profileId),
  };
}

// Full profile shape needed to (re)use the shared translation cache — must
// include every field job_profile_translations covers (even OKRs, which a
// JD never shows), so whichever caller — this route or the Job Profile's own
// /:id/translate — triggers generation first, the cached result is complete
// and reusable by the other.
function loadProfileForTranslation(profileId: string): { profile: ProfileForTranslation; updatedAt: string } | null {
  const row = db.prepare("SELECT * FROM job_profiles WHERE id = ?").get(profileId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    updatedAt: row.updated_at as string,
    profile: {
      job_title: row.job_title as string,
      rank: row.rank as string | null,
      division: row.division as string | null,
      function: row.function as string | null,
      location: row.location as string | null,
      compensation: row.compensation as string | null,
      benefits: row.benefits as string | null,
      bonuses: row.bonuses as string | null,
      responsibilities: db
        .prepare("SELECT main_function, responsibilities, success_criteria FROM profile_responsibilities WHERE job_profile_id = ? ORDER BY sort_order")
        .all(profileId) as unknown as ProfileForTranslation["responsibilities"],
      requirements: db
        .prepare("SELECT requirement FROM profile_requirements WHERE job_profile_id = ? ORDER BY sort_order")
        .all(profileId) as unknown as ProfileForTranslation["requirements"],
      okrs: db
        .prepare("SELECT objective, key_results FROM profile_okrs WHERE job_profile_id = ? ORDER BY sort_order")
        .all(profileId) as unknown as ProfileForTranslation["okrs"],
      competencies: db
        .prepare("SELECT skill, level, requirement FROM profile_competencies WHERE job_profile_id = ? ORDER BY sort_order")
        .all(profileId) as unknown as ProfileForTranslation["competencies"],
    },
  };
}

// Job Descriptions have no translation cache of their own — this reuses (or
// generates) the linked profile's, then reshapes it to the JD's subset
// (excludes success_criteria and OKRs, same as the Vietnamese live view).
export async function getTranslatedJdContent(jobProfileId: string, userId: string | undefined) {
  const loaded = loadProfileForTranslation(jobProfileId);
  if (!loaded) throw new Error("Linked Job Profile not found.");
  const translated = await getOrCreateTranslation(jobProfileId, loaded.profile, loaded.updatedAt, userId);
  return {
    job_title: translated.job_title,
    responsibilities: translated.responsibilities.map((r) => ({
      main_function: r.main_function,
      responsibilities: r.responsibilities,
    })),
    requirements: translated.requirements,
    competencies: translated.competencies,
  };
}

jobDescriptionsRouter.get("/", (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const includeArchived = req.query.includeArchived === "true";
  const clauses: string[] = [];
  const params: string[] = [];
  if (!includeArchived) clauses.push("jd.is_archived = 0");
  if (search) {
    clauses.push("(jp.job_title LIKE ? OR jd.location LIKE ? OR jp.division LIKE ? OR jp.function LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT jd.id, jd.location, jd.is_archived, jd.is_now_hiring, jd.employment_type, jd.updated_at, jp.job_title, jp.division, jp.function
       FROM job_descriptions jd JOIN job_profiles jp ON jp.id = jd.job_profile_id
       ${where} ORDER BY jp.job_title COLLATE NOCASE`,
    )
    .all(...params) as Record<string, unknown>[];
  res.json(rows.map((r) => ({ ...r, is_archived: Boolean(r.is_archived), is_now_hiring: Boolean(r.is_now_hiring) })));
});

jobDescriptionsRouter.get("/:id", (req, res) => {
  const detail = loadDetail(req.params.id);
  if (!detail) {
    res.status(404).json({ error: "Job Description not found." });
    return;
  }
  res.json(detail);
});

jobDescriptionsRouter.post("/", requireCap("jobdescription.create"), (req, res) => {
  const input = req.body as JobDescriptionInput;
  const error = validate(input);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  const id = newId();
  const employmentType = input.employment_type ?? "full_time";
  db.prepare(
    `INSERT INTO job_descriptions (id, job_profile_id, location, is_now_hiring, employment_type, custom_benefits, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.job_profile_id!.trim(),
    input.location!.trim(),
    input.is_now_hiring ? 1 : 0,
    employmentType,
    input.custom_benefits?.trim() || null,
    req.user!.id,
    req.user!.id,
  );
  logAudit("job_description", id, "created", req.user!.id);
  res.status(201).json(loadDetail(id));
});

jobDescriptionsRouter.patch("/:id", requireCap("jobdescription.edit"), (req, res) => {
  const existing = db.prepare("SELECT * FROM job_descriptions WHERE id = ?").get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: "Job Description not found." });
    return;
  }
  const input = req.body as JobDescriptionInput;
  const error = validate(input);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  const employmentType = input.employment_type ?? "full_time";
  db.prepare(
    `UPDATE job_descriptions SET job_profile_id = ?, location = ?, is_now_hiring = ?, employment_type = ?,
     custom_benefits = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(
    input.job_profile_id!.trim(),
    input.location!.trim(),
    input.is_now_hiring ? 1 : 0,
    employmentType,
    input.custom_benefits?.trim() || null,
    req.user!.id,
    req.params.id,
  );
  const updated = db.prepare("SELECT * FROM job_descriptions WHERE id = ?").get(req.params.id) as Record<string, unknown>;
  diffAndLog(
    "job_description",
    req.params.id,
    { ...existing, is_now_hiring: Boolean(existing.is_now_hiring) },
    { ...updated, is_now_hiring: Boolean(updated.is_now_hiring) },
    ["job_profile_id", "location", "is_now_hiring", "employment_type", "custom_benefits"],
    req.user!.id,
  );
  res.json(loadDetail(req.params.id));
});

jobDescriptionsRouter.post("/:id/archive", requireCap("jobdescription.archive"), (req, res) => {
  const result = db.prepare("UPDATE job_descriptions SET is_archived = 1 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Job Description not found." });
    return;
  }
  logAudit("job_description", req.params.id, "archived", req.user!.id, "is_archived", "false", "true");
  res.json({ ok: true });
});

jobDescriptionsRouter.post("/:id/restore", requireCap("jobdescription.archive"), (req, res) => {
  const result = db.prepare("UPDATE job_descriptions SET is_archived = 0 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Job Description not found." });
    return;
  }
  logAudit("job_description", req.params.id, "restored", req.user!.id, "is_archived", "true", "false");
  res.json({ ok: true });
});

// English view — reuses the linked profile's translation cache (see
// getTranslatedJdContent above). location isn't translated (it's already a
// plain place name in practice — see jobDescriptionContent.ts on the web
// side for the same call).
jobDescriptionsRouter.get("/:id/translation", async (req, res) => {
  const detail = loadDetail(req.params.id);
  if (!detail) {
    res.status(404).json({ error: "Job Description not found." });
    return;
  }
  try {
    const translated = await getTranslatedJdContent(detail.job_profile_id as string, req.user!.id);
    res.json({ ...translated, location: detail.location });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Translation failed." });
  }
});

// No watermark, no download log here (unlike the Performance Profile PDF) —
// a Job Description is meant to be shared externally with candidates, not a
// locked internal document.
jobDescriptionsRouter.get("/:id/pdf", async (req, res) => {
  const detail = loadDetail(req.params.id);
  if (!detail) {
    res.status(404).json({ error: "Job Description not found." });
    return;
  }
  const wantsEnglish = req.query.lang === "en";
  let jd: JobDescriptionForPdf;
  // employment_type/custom_benefits aren't translated (custom_benefits is
  // HR's own free text, same as location) — passed through unchanged either way.
  if (wantsEnglish) {
    try {
      const translated = await getTranslatedJdContent(detail.job_profile_id as string, req.user!.id);
      jd = {
        ...translated,
        location: detail.location as string,
        employment_type: detail.employment_type as EmploymentType,
        custom_benefits: detail.custom_benefits as string | null,
      };
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : "Translation failed." });
      return;
    }
  } else {
    jd = {
      job_title: detail.job_title as string,
      location: detail.location as string,
      employment_type: detail.employment_type as EmploymentType,
      custom_benefits: detail.custom_benefits as string | null,
      responsibilities: detail.responsibilities as unknown as JobDescriptionForPdf["responsibilities"],
      requirements: detail.requirements as unknown as JobDescriptionForPdf["requirements"],
      competencies: detail.competencies as unknown as JobDescriptionForPdf["competencies"],
    };
  }
  const lang: JdLang = wantsEnglish ? "en" : "vi";
  const buffer = await renderToBuffer(
    React.createElement(JobDescriptionDocument, { jd, lang }) as Parameters<typeof renderToBuffer>[0],
  );
  const filename = `${(jd.job_title || "job-description").replace(/[^a-z0-9]+/gi, "-")}${wantsEnglish ? "-en" : ""}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
});
