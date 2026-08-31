import { db } from "./db.js";
import { translateFields } from "./anthropic.js";
import type { TextField } from "./anthropic.js";

// Builds the flattened {label, text} list sent to Claude for translation, and
// reassembles the label -> English text map it returns back into the same
// nested shape as a loaded profile. Both functions walk the profile in
// lockstep (same order, same label template), so no parsing is needed —
// applyTranslations just looks each label up in the map it's given.

export interface ProfileForTranslation {
  job_title: string;
  rank: string | null;
  division: string | null;
  function: string | null;
  location: string | null;
  compensation: string | null;
  benefits: string | null;
  bonuses: string | null;
  responsibilities: { main_function: string; responsibilities: string; success_criteria: string | null }[];
  requirements: { requirement: string }[];
  okrs: { objective: string; key_results: string }[];
  competencies: { skill: string; level: string | null; requirement: string | null }[];
}

export interface TranslatedProfile {
  job_title: string;
  rank: string | null;
  division: string | null;
  function: string | null;
  location: string | null;
  compensation: string | null;
  benefits: string | null;
  bonuses: string | null;
  responsibilities: { main_function: string; responsibilities: string; success_criteria: string | null }[];
  requirements: { requirement: string }[];
  okrs: { objective: string; key_results: string }[];
  competencies: { skill: string; level: string | null; requirement: string | null }[];
}

export function buildProfileFields(profile: ProfileForTranslation): TextField[] {
  const fields: TextField[] = [
    { label: "Job title", text: profile.job_title },
    { label: "Rank", text: profile.rank ?? "" },
    { label: "Division", text: profile.division ?? "" },
    { label: "Function", text: profile.function ?? "" },
    { label: "Location", text: profile.location ?? "" },
    { label: "Compensation", text: profile.compensation ?? "" },
    { label: "Benefits", text: profile.benefits ?? "" },
    { label: "Bonuses & dependencies", text: profile.bonuses ?? "" },
  ];
  profile.responsibilities.forEach((r, i) => {
    fields.push({ label: `Responsibility ${i + 1} — Main function`, text: r.main_function });
    fields.push({ label: `Responsibility ${i + 1} — Responsibilities`, text: r.responsibilities });
    fields.push({ label: `Responsibility ${i + 1} — Success criteria`, text: r.success_criteria ?? "" });
  });
  profile.requirements.forEach((r, i) => {
    fields.push({ label: `Essential requirement ${i + 1}`, text: r.requirement });
  });
  profile.okrs.forEach((o, i) => {
    fields.push({ label: `OKR ${i + 1} — Objective`, text: o.objective });
    fields.push({ label: `OKR ${i + 1} — Key results`, text: o.key_results });
  });
  profile.competencies.forEach((c, i) => {
    fields.push({ label: `Competency ${i + 1} — Skill`, text: c.skill });
    fields.push({ label: `Competency ${i + 1} — Requirement`, text: c.requirement ?? "" });
  });
  return fields;
}

export function applyTranslations(profile: ProfileForTranslation, map: Record<string, string>): TranslatedProfile {
  const get = (label: string, fallback: string) => map[label] ?? fallback;
  return {
    job_title: get("Job title", profile.job_title),
    rank: profile.rank ? get("Rank", profile.rank) : null,
    division: profile.division ? get("Division", profile.division) : null,
    function: profile.function ? get("Function", profile.function) : null,
    location: profile.location ? get("Location", profile.location) : null,
    compensation: profile.compensation ? get("Compensation", profile.compensation) : null,
    benefits: profile.benefits ? get("Benefits", profile.benefits) : null,
    bonuses: profile.bonuses ? get("Bonuses & dependencies", profile.bonuses) : null,
    responsibilities: profile.responsibilities.map((r, i) => ({
      main_function: get(`Responsibility ${i + 1} — Main function`, r.main_function),
      responsibilities: get(`Responsibility ${i + 1} — Responsibilities`, r.responsibilities),
      success_criteria: r.success_criteria ? get(`Responsibility ${i + 1} — Success criteria`, r.success_criteria) : null,
    })),
    requirements: profile.requirements.map((r, i) => ({
      requirement: get(`Essential requirement ${i + 1}`, r.requirement),
    })),
    okrs: profile.okrs.map((o, i) => ({
      objective: get(`OKR ${i + 1} — Objective`, o.objective),
      key_results: get(`OKR ${i + 1} — Key results`, o.key_results),
    })),
    competencies: profile.competencies.map((c, i) => ({
      skill: get(`Competency ${i + 1} — Skill`, c.skill),
      level: c.level,
      requirement: c.requirement ? get(`Competency ${i + 1} — Requirement`, c.requirement) : null,
    })),
  };
}

interface TranslationRow {
  content_json: string;
  source_updated_at: string;
}

// Shared by the explicit "view English" flow (routes/profiles.ts's
// GET/POST /:id/translation, which only reads the cache and lets the caller
// trigger generation) and by direct-download flows (the English PDF, and a
// Job Description's English view) that want a translation handed back
// immediately, generating it transparently on first request if needed.
export async function getOrCreateTranslation(
  profileId: string,
  profile: ProfileForTranslation,
  profileUpdatedAt: string,
  userId: string | undefined,
  force = false,
): Promise<TranslatedProfile> {
  if (!force) {
    const cached = db
      .prepare("SELECT content_json, source_updated_at FROM job_profile_translations WHERE job_profile_id = ?")
      .get(profileId) as TranslationRow | undefined;
    if (cached && cached.source_updated_at === profileUpdatedAt) {
      return JSON.parse(cached.content_json) as TranslatedProfile;
    }
  }
  const fields = buildProfileFields(profile);
  const map = await translateFields(fields);
  const translated = applyTranslations(profile, map);
  db.prepare(
    `INSERT INTO job_profile_translations (job_profile_id, content_json, source_updated_at, translated_at, translated_by)
     VALUES (?, ?, ?, datetime('now'), ?)
     ON CONFLICT(job_profile_id) DO UPDATE SET content_json = excluded.content_json,
       source_updated_at = excluded.source_updated_at, translated_at = excluded.translated_at, translated_by = excluded.translated_by`,
  ).run(profileId, JSON.stringify(translated), profileUpdatedAt, userId ?? null);
  return translated;
}
