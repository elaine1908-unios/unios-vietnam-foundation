import { Router } from "express";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "../db.js";
import { newId } from "../ids.js";
import { requireCap } from "../middleware.js";
import { ProfileDocument } from "../pdf/ProfileDocument.js";
import type { ProfileForPdf } from "../pdf/ProfileDocument.js";
import { getOrCreateTranslation } from "../translation.js";
import type { ProfileForTranslation } from "../translation.js";

export const pdfRouter = Router();

pdfRouter.use(requireCap("profile.view"));

pdfRouter.get("/:id/pdf", async (req, res) => {
  const profile = db.prepare("SELECT * FROM job_profiles WHERE id = ?").get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!profile) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }

  const full: ProfileForPdf = {
    job_title: profile.job_title as string,
    rank: profile.rank as string | null,
    division: profile.division as string | null,
    function: profile.function as string | null,
    location: profile.location as string | null,
    last_updated: profile.last_updated as string | null,
    compensation: profile.compensation as string | null,
    benefits: profile.benefits as string | null,
    bonuses: profile.bonuses as string | null,
    responsibilities: db
      .prepare("SELECT * FROM profile_responsibilities WHERE job_profile_id = ? ORDER BY sort_order")
      .all(req.params.id) as unknown as ProfileForPdf["responsibilities"],
    requirements: db
      .prepare("SELECT * FROM profile_requirements WHERE job_profile_id = ? ORDER BY sort_order")
      .all(req.params.id) as unknown as ProfileForPdf["requirements"],
    okrs: db
      .prepare("SELECT * FROM profile_okrs WHERE job_profile_id = ? ORDER BY sort_order")
      .all(req.params.id) as unknown as ProfileForPdf["okrs"],
    competencies: db
      .prepare("SELECT * FROM profile_competencies WHERE job_profile_id = ? ORDER BY sort_order")
      .all(req.params.id) as unknown as ProfileForPdf["competencies"],
  };

  const downloadedAt = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

  db.prepare("INSERT INTO pdf_downloads (id, job_profile_id, user_id) VALUES (?, ?, ?)").run(
    newId(),
    req.params.id,
    req.user!.id,
  );

  const wantsEnglish = req.query.lang === "en";
  let content: ProfileForPdf = full;
  if (wantsEnglish) {
    try {
      const translated = await getOrCreateTranslation(
        req.params.id,
        full as unknown as ProfileForTranslation,
        profile.updated_at as string,
        req.user!.id,
      );
      content = translated as unknown as ProfileForPdf;
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : "Translation failed." });
      return;
    }
  }

  const buffer = await renderToBuffer(
    React.createElement(ProfileDocument, {
      profile: content,
      downloadedByName: req.user!.name,
      downloadedByEmail: req.user!.email,
      downloadedAt,
      lang: wantsEnglish ? "en" : "vi",
    }) as Parameters<typeof renderToBuffer>[0],
  );

  const filename = `${(content.job_title || "performance-profile").replace(/[^a-z0-9]+/gi, "-")}${wantsEnglish ? "-en" : ""}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
});
