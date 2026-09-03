import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, downloadPdf } from "../lib/api";
import type { AuditLogEntry, ProfileDetail, ProfileTranslation } from "../lib/types";
import { CAREER_RANK_LABELS } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";

type Lang = "vi" | "en";

const SECTION_TITLES: Record<Lang, Record<"general" | "responsibilities" | "requirements" | "okrs" | "cb" | "competencies", string>> = {
  vi: {
    general: "Thông tin chung (General information)",
    responsibilities: "Hạng mục công việc chính (Key responsibilities)",
    requirements: "Yêu cầu tối thiểu (Essential requirements)",
    okrs: "Mục tiêu & kết quả chính (OKRs)",
    cb: "Chính sách phúc lợi (C&B)",
    competencies: "Kỹ năng chủ đạo (Competencies)",
  },
  en: {
    general: "General information",
    responsibilities: "Key responsibilities",
    requirements: "Essential requirements",
    okrs: "OKRs",
    cb: "Compensation & Benefits",
    competencies: "Competencies",
  },
};

// GET returns 404 until a translation has been generated at least once; this
// transparently falls back to POST (generate + cache) so the on-page toggle
// never needs a separate "Translate" click — see server/src/translation.ts.
async function fetchOrCreateTranslation(profileId: string): Promise<ProfileTranslation> {
  try {
    return await api.get<ProfileTranslation>(`/profiles/${profileId}/translation`);
  } catch {
    return await forceRetranslate(profileId);
  }
}

// Always regenerates, bypassing the cache — used by the explicit
// "Retranslate" button. fetchOrCreateTranslation's GET-then-POST fallback
// would just return the same cached content again once one exists.
function forceRetranslate(profileId: string): Promise<ProfileTranslation> {
  return api.post<ProfileTranslation>(`/profiles/${profileId}/translate`);
}

function formatAuditDate(value: string): string {
  // SQLite's datetime('now') is UTC, formatted "YYYY-MM-DD HH:MM:SS".
  return new Date(`${value.replace(" ", "T")}Z`).toLocaleString();
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  archived: "Archived",
  restored: "Restored",
};

function AuditTrail({ profileId }: { profileId: string }) {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["profile-audit-log", profileId],
    queryFn: () => api.get<AuditLogEntry[]>(`/profiles/${profileId}/audit-log`),
  });

  return (
    <div className="mb-6">
      <h2 className="bg-accent-2 text-white text-sm font-display font-semibold px-3 py-2 rounded-t-md">
        Audit trail
      </h2>
      <div className="border border-t-0 border-border rounded-b-md">
        {isLoading && <p className="px-3 py-3 text-sm text-ink-muted">Loading…</p>}
        {!isLoading && (!entries || entries.length === 0) && (
          <p className="px-3 py-3 text-sm text-ink-muted">No history yet.</p>
        )}
        {!isLoading && entries && entries.length > 0 && (
          <ul className="text-sm">
            {entries.map((e) => (
              <li key={e.id} className="flex justify-between border-b border-border last:border-0 px-3 py-2">
                <span>
                  {AUDIT_ACTION_LABELS[e.action] ?? e.action} by{" "}
                  <span className="font-medium">{e.changed_by_name ?? "an unknown user"}</span>
                </span>
                <span className="text-ink-faint">{formatAuditDate(e.changed_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CareerMapLink({ profile }: { profile: ProfileDetail }) {
  if (!profile.career_map_role_id || !profile.career_map_role) {
    return <p className="text-xs text-ink-faint mt-1">Custom title — not linked to the Career Map.</p>;
  }
  const role = profile.career_map_role;
  const location = role.function ? `${role.division} — ${role.function}` : role.division;
  const renamed = role.role_name !== profile.job_title;
  return (
    <p className="text-xs text-ink-faint mt-1">
      Career Map role: {location} · {CAREER_RANK_LABELS[role.rank]}
      {role.is_archived && " · archived"}
      {renamed && ` · now named "${role.role_name}" on the Career Map`}
    </p>
  );
}

// Mirrors web/src/components/JobDescriptionBody.tsx's splitLines — a Team
// Lead sometimes types multiple lines (or their own "- " bullets) into one
// free-text field; render each as its own bullet instead of one run-on
// block of pre-wrapped text with no visual separation between lines.
function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•·‣]\s+/, "").trim())
    .filter((line) => line.length > 0);
}

function MultilineText({ text }: { text: string }) {
  const lines = splitLines(text);
  if (lines.length === 0) return <>—</>;
  if (lines.length === 1) return <>{lines[0]}</>;
  return (
    <ul className="list-disc list-inside flex flex-col gap-1">
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="bg-accent-2 text-white text-sm font-display font-semibold px-3 py-2 rounded-t-md">{title}</h2>
      <div className="border border-t-0 border-border rounded-b-md">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex border-b border-border last:border-0">
      <div className="w-56 shrink-0 bg-surface-2 px-3 py-2 text-sm font-medium">{label}</div>
      <div className="px-3 py-2 text-sm whitespace-pre-wrap">{value || "—"}</div>
    </div>
  );
}

export function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [lang, setLang] = useState<Lang>("vi");

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => api.get<ProfileDetail>(`/profiles/${id}`),
    enabled: Boolean(id),
  });

  const {
    data: translation,
    isLoading: translating,
    error: translationError,
  } = useQuery({
    queryKey: ["profile-translation", id],
    queryFn: () => fetchOrCreateTranslation(id!),
    enabled: Boolean(id) && lang === "en",
    retry: false,
  });

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !profile) return <p className="text-sm text-red-600">Couldn't load this profile.</p>;

  async function handleRetranslate() {
    const fresh = await forceRetranslate(profile!.id);
    queryClient.setQueryData(["profile-translation", id], fresh);
  }

  const isTeamLead = user?.role === "team_lead";
  // Only actually "showing English" once a translation has come back —
  // otherwise (still loading, or the API errored, e.g. no ANTHROPIC_API_KEY
  // configured) fall back to the original content rather than silently
  // mislabeling Vietnamese text as English.
  const showingEnglish = lang === "en" && Boolean(translation);
  const content = translation ? translation.content : profile;
  const t = SECTION_TITLES[showingEnglish ? "en" : "vi"];

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadPdf(
        `/profiles/${profile!.id}/pdf${showingEnglish ? "?lang=en" : ""}`,
        `${content.job_title.replace(/[^a-z0-9]+/gi, "-")}${showingEnglish ? "-en" : ""}.pdf`,
      );
    } catch {
      alert("Could not generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleArchiveToggle() {
    setArchiving(true);
    try {
      await api.post(`/profiles/${profile!.id}/${profile!.is_archived ? "restore" : "archive"}`);
      await queryClient.invalidateQueries({ queryKey: ["profile", id] });
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
    } catch {
      alert("Something went wrong.");
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <Link to="/" className="text-sm text-accent hover:underline">
            ← All profiles
          </Link>
          <h1 className="font-display font-bold text-xl mt-1">{content.job_title}</h1>
          {profile.is_archived && (
            <span className="text-xs rounded bg-surface-2 border border-border px-1.5 py-0.5 text-ink-faint">
              Archived
            </span>
          )}
          <CareerMapLink profile={profile} />
          {showingEnglish && translation && (
            <p className="text-xs text-ink-faint mt-1">
              Machine-translated
              {translation.stale && " — profile updated since; may be outdated"}
              {" · "}
              <button type="button" className="text-accent hover:underline" onClick={handleRetranslate}>
                Retranslate
              </button>
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="flex rounded-md border border-border overflow-hidden text-sm">
            <button
              className={`px-3 py-1.5 ${lang === "vi" ? "bg-accent text-white" : "bg-surface text-ink-muted"}`}
              onClick={() => setLang("vi")}
              type="button"
            >
              Tiếng Việt
            </button>
            <button
              className={`px-3 py-1.5 ${lang === "en" ? "bg-accent text-white" : "bg-surface text-ink-muted"}`}
              onClick={() => setLang("en")}
              type="button"
            >
              English
            </button>
          </div>
          <button className="btn-secondary" onClick={handleDownload} disabled={downloading || (showingEnglish && translating)}>
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
          {isTeamLead && (
            <button className="btn-secondary" onClick={() => navigate(`/profiles/${profile.id}/edit`)}>
              Edit
            </button>
          )}
          {isTeamLead && (
            <button className="btn-secondary" onClick={handleArchiveToggle} disabled={archiving}>
              {profile.is_archived ? "Restore" : "Archive"}
            </button>
          )}
        </div>
      </div>

      {lang === "en" && translating && <p className="text-sm text-ink-muted mb-4">Translating…</p>}
      {lang === "en" && translationError && !translating && (
        <p className="text-sm text-red-600 mb-4">
          Couldn't translate: {translationError instanceof Error ? translationError.message : "unknown error"}.
          Showing the original Vietnamese below.
        </p>
      )}

      <Section title={t.general}>
        <InfoRow label="Job title" value={content.job_title} />
        <InfoRow label="Rank" value={content.rank} />
        <InfoRow label="Division" value={content.division} />
        <InfoRow label="Function" value={content.function} />
        <InfoRow label="Location" value={content.location} />
        <InfoRow label="Last updated" value={profile.last_updated} />
      </Section>

      <Section title={t.responsibilities}>
        {content.responsibilities.length === 0 ? (
          <p className="px-3 py-3 text-sm text-ink-muted">No responsibilities defined yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                <th className="px-3 py-2 font-medium w-1/4">Main function</th>
                <th className="px-3 py-2 font-medium w-2/5">Responsibilities</th>
                <th className="px-3 py-2 font-medium">Success criteria</th>
              </tr>
            </thead>
            <tbody>
              {content.responsibilities.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0 align-top">
                  <td className="px-3 py-2">
                    <MultilineText text={r.main_function} />
                  </td>
                  <td className="px-3 py-2">
                    <MultilineText text={r.responsibilities} />
                  </td>
                  <td className="px-3 py-2">
                    <MultilineText text={r.success_criteria ?? ""} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={t.requirements}>
        {content.requirements.length === 0 ? (
          <p className="px-3 py-3 text-sm text-ink-muted">No essential requirements defined yet.</p>
        ) : (
          <ol className="text-sm">
            {content.requirements.map((r, i) => (
              <li key={i} className="flex border-b border-border last:border-0">
                <span className="w-10 shrink-0 bg-surface-2 px-3 py-2 font-medium">{i + 1}</span>
                <span className="px-3 py-2">{r.requirement}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title={t.okrs}>
        {content.okrs.length === 0 ? (
          <p className="px-3 py-3 text-sm text-ink-muted">No OKRs defined yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                <th className="px-3 py-2 font-medium w-1/3">Objective</th>
                <th className="px-3 py-2 font-medium">Key results</th>
              </tr>
            </thead>
            <tbody>
              {content.okrs.map((o, i) => (
                <tr key={i} className="border-b border-border last:border-0 align-top">
                  <td className="px-3 py-2 whitespace-pre-wrap">{o.objective}</td>
                  <td className="px-3 py-2 whitespace-pre-wrap">{o.key_results}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={t.cb}>
        <InfoRow label="Compensation" value={content.compensation} />
        <InfoRow label="Benefits" value={content.benefits} />
        <InfoRow label="Bonuses & dependencies" value={content.bonuses} />
      </Section>

      <Section title={t.competencies}>
        {content.competencies.length === 0 ? (
          <p className="px-3 py-3 text-sm text-ink-muted">No competencies defined yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                <th className="px-3 py-2 font-medium w-1/4">Skill</th>
                <th className="px-3 py-2 font-medium w-1/5">Level</th>
                <th className="px-3 py-2 font-medium">Requirement</th>
              </tr>
            </thead>
            <tbody>
              {content.competencies.map((c, i) => (
                <tr key={i} className="border-b border-border last:border-0 align-top">
                  <td className="px-3 py-2">{c.skill}</td>
                  <td className="px-3 py-2">{c.level || "—"}</td>
                  <td className="px-3 py-2 whitespace-pre-wrap">{c.requirement || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <AuditTrail profileId={profile.id} />

      <p className="text-xs text-ink-faint">
        This Performance Profile may be updated at any time. For enquiries, please contact your Line Manager or
        People &amp; Culture. This document is confidential, remains the property of Unios Vietnam, and must not be
        distributed externally without prior written approval.
      </p>
    </div>
  );
}
