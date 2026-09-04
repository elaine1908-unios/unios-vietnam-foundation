import { Router } from "express";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { db } from "../db.js";
import { JobDescriptionDocument } from "../pdf/JobDescriptionDocument.js";
import type { JdLang, JobDescriptionForPdf } from "../pdf/JobDescriptionDocument.js";
import { getTranslatedJdContent, loadDetail } from "./jobDescriptions.js";

// Deliberately NOT behind requireAuth — this is the one surface external,
// logged-out visitors (job candidates) can reach. Every route re-checks
// visibility itself (is_now_hiring AND not archived AND the linked profile
// isn't archived) rather than trusting loadDetail alone, since that helper
// is shared with the authenticated router and returns archived/hidden
// records too when called from there.
export const publicRouter = Router();

interface VisibilityRow {
  is_now_hiring: number;
  jd_archived: number;
  profile_archived: number;
}

function isPubliclyVisible(id: string): boolean {
  const row = db
    .prepare(
      `SELECT jd.is_now_hiring as is_now_hiring, jd.is_archived as jd_archived, jp.is_archived as profile_archived
       FROM job_descriptions jd JOIN job_profiles jp ON jp.id = jd.job_profile_id
       WHERE jd.id = ?`,
    )
    .get(id) as VisibilityRow | undefined;
  return Boolean(row && row.is_now_hiring && !row.jd_archived && !row.profile_archived);
}

publicRouter.get("/job-descriptions", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT jd.id, jd.location, jd.updated_at, jp.job_title, jp.division, jp.function
       FROM job_descriptions jd JOIN job_profiles jp ON jp.id = jd.job_profile_id
       WHERE jd.is_now_hiring = 1 AND jd.is_archived = 0 AND jp.is_archived = 0
       ORDER BY jp.job_title COLLATE NOCASE`,
    )
    .all();
  res.json(rows);
});

publicRouter.get("/job-descriptions/:id", (req, res) => {
  if (!isPubliclyVisible(req.params.id)) {
    res.status(404).json({ error: "Not found." });
    return;
  }
  res.json(loadDetail(req.params.id));
});

publicRouter.get("/job-descriptions/:id/translation", async (req, res) => {
  if (!isPubliclyVisible(req.params.id)) {
    res.status(404).json({ error: "Not found." });
    return;
  }
  const detail = loadDetail(req.params.id)!;
  try {
    const translated = await getTranslatedJdContent(detail.job_profile_id as string, undefined);
    res.json({ ...translated, location: detail.location });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Translation failed." });
  }
});

publicRouter.get("/job-descriptions/:id/pdf", async (req, res) => {
  if (!isPubliclyVisible(req.params.id)) {
    res.status(404).json({ error: "Not found." });
    return;
  }
  const detail = loadDetail(req.params.id)!;
  const wantsEnglish = req.query.lang === "en";
  let jd: JobDescriptionForPdf;
  if (wantsEnglish) {
    try {
      const translated = await getTranslatedJdContent(detail.job_profile_id as string, undefined);
      jd = {
        ...translated,
        location: detail.location as string,
        employment_type: detail.employment_type as JobDescriptionForPdf["employment_type"],
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
      employment_type: detail.employment_type as JobDescriptionForPdf["employment_type"],
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
