import { Router } from "express";
import DOMPurify from "isomorphic-dompurify";
import { db } from "../db.js";
import { newId } from "../ids.js";
import { requireAuth, requireCap } from "../middleware.js";
import { diffAndLog, logAudit } from "../audit.js";

export const codeOfConductRouter = Router();

// Viewable by every signed-in user (same "universal read" reasoning as
// Career Map's careermap.view) — only the PATCH below is capability-gated.
codeOfConductRouter.use(requireAuth);

function loadDocument() {
  return db.prepare("SELECT * FROM code_of_conduct_document LIMIT 1").get() as
    | { id: string; version: string; version_date: string; updated_at: string }
    | undefined;
}

// One shared version for the whole document (matches the source PDF's own
// single-version-for-everything convention) — editing any section bumps it
// for all of them. A plain +0.1 minor bump; if the stored value somehow
// isn't numeric (shouldn't happen — see the CHECK-free but always-seeded
// column), leave it alone rather than producing garbage.
function bumpVersion(current: string): string {
  const n = parseFloat(current);
  if (!Number.isFinite(n)) return current;
  return (Math.round((n + 0.1) * 10) / 10).toFixed(1);
}

codeOfConductRouter.get("/", (_req, res) => {
  const document = loadDocument();
  const sections = db
    .prepare("SELECT id, sort_order, title FROM code_of_conduct_sections ORDER BY sort_order")
    .all();
  res.json({ document, sections });
});

codeOfConductRouter.get("/version-history", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT h.id, h.version, h.version_date, h.section_title, h.changed_at, u.name as changed_by_name
       FROM code_of_conduct_version_history h LEFT JOIN users u ON u.id = h.changed_by
       ORDER BY h.changed_at DESC`,
    )
    .all();
  res.json(rows);
});

codeOfConductRouter.get("/sections/:id", (req, res) => {
  const section = db.prepare("SELECT * FROM code_of_conduct_sections WHERE id = ?").get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!section) {
    res.status(404).json({ error: "Section not found." });
    return;
  }
  const updatedByUser = section.updated_by
    ? (db.prepare("SELECT name FROM users WHERE id = ?").get(section.updated_by as string) as
        | { name: string }
        | undefined)
    : undefined;
  res.json({ ...section, updated_by_name: updatedByUser?.name ?? null, document: loadDocument() });
});

codeOfConductRouter.patch("/sections/:id", requireCap("codeofconduct.edit"), (req, res) => {
  const existing = db.prepare("SELECT * FROM code_of_conduct_sections WHERE id = ?").get(req.params.id) as
    | { id: string; title: string; content_en: string; content_vi: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: "Section not found." });
    return;
  }
  const { title, content_en, content_vi } = req.body as { title?: string; content_en?: string; content_vi?: string };
  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required." });
    return;
  }
  const cleanEn = DOMPurify.sanitize(content_en ?? "");
  const cleanVi = DOMPurify.sanitize(content_vi ?? "");
  const document = loadDocument();
  const newVersion = document ? bumpVersion(document.version) : "1.0";
  const today = new Date().toISOString().slice(0, 10);

  db.prepare(
    "UPDATE code_of_conduct_sections SET title = ?, content_en = ?, content_vi = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(title.trim(), cleanEn, cleanVi, req.user!.id, existing.id);
  diffAndLog(
    "code_of_conduct_section",
    existing.id,
    existing,
    { title: title.trim(), content_en: cleanEn, content_vi: cleanVi },
    ["title", "content_en", "content_vi"],
    req.user!.id,
  );

  if (document) {
    db.prepare(
      "UPDATE code_of_conduct_document SET version = ?, version_date = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(newVersion, today, req.user!.id, document.id);
  }
  db.prepare(
    "INSERT INTO code_of_conduct_version_history (id, version, version_date, section_title, changed_by) VALUES (?, ?, ?, ?, ?)",
  ).run(newId(), newVersion, today, title.trim(), req.user!.id);
  logAudit("code_of_conduct_document", document?.id ?? existing.id, "updated", req.user!.id, "version", document?.version ?? null, newVersion);

  const updated = db.prepare("SELECT * FROM code_of_conduct_sections WHERE id = ?").get(existing.id);
  res.json({ ...updated, document: loadDocument() });
});
