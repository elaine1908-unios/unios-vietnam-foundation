import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, downloadPdf } from "../lib/api";
import type { JobDescriptionDetail, JobDescriptionTranslation } from "../lib/types";
import type { JdLang } from "../lib/jobDescriptionContent";
import { JobDescriptionBody } from "../components/JobDescriptionBody";
import { useAuth } from "../auth/AuthProvider";

export function JobDescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [lang, setLang] = useState<JdLang>("vi");

  const { data: jd, isLoading, error } = useQuery({
    queryKey: ["job-description", id],
    queryFn: () => api.get<JobDescriptionDetail>(`/job-descriptions/${id}`),
    enabled: Boolean(id),
  });

  const {
    data: translation,
    isLoading: translating,
    error: translationError,
  } = useQuery({
    queryKey: ["job-description-translation", id],
    queryFn: () => api.get<JobDescriptionTranslation>(`/job-descriptions/${id}/translation`),
    enabled: Boolean(id) && lang === "en",
    retry: false,
  });

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !jd) return <p className="text-sm text-red-600">Couldn't load this job description.</p>;

  const canEdit = user?.capabilities.includes("jobdescription.edit") ?? false;
  const canArchive = user?.capabilities.includes("jobdescription.archive") ?? false;
  // Only actually "showing English" once a translation has come back —
  // otherwise fall back to the original rather than mislabeling it.
  const showingEnglish = lang === "en" && Boolean(translation);
  const content = translation
      ? translation
      : {
          job_title: jd.job_title,
          location: jd.location,
          responsibilities: jd.responsibilities,
          requirements: jd.requirements,
          competencies: jd.competencies,
        };

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadPdf(
        `/job-descriptions/${jd!.id}/pdf${showingEnglish ? "?lang=en" : ""}`,
        `${jd!.job_title.replace(/[^a-z0-9]+/gi, "-")}${showingEnglish ? "-en" : ""}.pdf`,
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
      await api.post(`/job-descriptions/${jd!.id}/${jd!.is_archived ? "restore" : "archive"}`);
      await queryClient.invalidateQueries({ queryKey: ["job-description", id] });
      await queryClient.invalidateQueries({ queryKey: ["job-descriptions"] });
    } catch {
      alert("Something went wrong.");
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <Link to="/job-descriptions" className="text-sm text-accent hover:underline">
            ← All job descriptions
          </Link>
          <h1 className="font-display font-bold text-xl mt-1">
            {jd.job_title} — {jd.location}
          </h1>
          <div className="flex gap-2 mt-1">
            {jd.is_archived && (
              <span className="text-xs rounded bg-surface-2 border border-border px-1.5 py-0.5 text-ink-faint">
                Archived
              </span>
            )}
            {jd.is_now_hiring ? (
              <span className="text-xs rounded bg-accent-soft border border-accent/30 px-1.5 py-0.5 text-accent font-medium">
                Now Hiring — public
              </span>
            ) : (
              <span className="text-xs rounded bg-surface-2 border border-border px-1.5 py-0.5 text-ink-faint">
                Not public
              </span>
            )}
          </div>
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
          {canEdit && (
            <button className="btn-secondary" onClick={() => navigate(`/job-descriptions/${jd.id}/edit`)}>
              Edit
            </button>
          )}
          {canArchive && (
            <button className="btn-secondary" onClick={handleArchiveToggle} disabled={archiving}>
              {jd.is_archived ? "Restore" : "Archive"}
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

      <JobDescriptionBody lang={lang} content={content} />
    </div>
  );
}
