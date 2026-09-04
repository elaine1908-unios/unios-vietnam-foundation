import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api, downloadPdf } from "../../lib/api";
import type { JobDescriptionDetail, JobDescriptionTranslation } from "../../lib/types";
import type { JdLang } from "../../lib/jobDescriptionContent";
import { JobDescriptionBody } from "../../components/JobDescriptionBody";

export function PublicJobDescriptionPage() {
  const { id } = useParams<{ id: string }>();
  const [downloading, setDownloading] = useState(false);
  const [lang, setLang] = useState<JdLang>("vi");
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Same response shape as the internal detail endpoint — this is the
  // public.ts router re-using loadDetail(), just gated to Now Hiring +
  // non-archived records instead of requireAuth.
  const { data: jd, isLoading, error } = useQuery({
    queryKey: ["public-job-description", id],
    queryFn: () => api.get<JobDescriptionDetail>(`/public/job-descriptions/${id}`),
    enabled: Boolean(id),
    retry: false,
  });

  const {
    data: translation,
    isLoading: translating,
    error: translationError,
  } = useQuery({
    queryKey: ["public-job-description-translation", id],
    queryFn: () => api.get<JobDescriptionTranslation>(`/public/job-descriptions/${id}/translation`),
    enabled: Boolean(id) && lang === "en",
    retry: false,
  });

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !jd) {
    return (
      <div>
        <p className="text-sm text-red-600 mb-3">This position isn't available — it may have closed.</p>
        <Link to="/careers" className="text-sm text-accent hover:underline">
          ← Back to open positions
        </Link>
      </div>
    );
  }

  const showingEnglish = lang === "en" && Boolean(translation);
  const content = {
    ...(translation ?? {
      job_title: jd.job_title,
      location: jd.location,
      responsibilities: jd.responsibilities,
      requirements: jd.requirements,
      competencies: jd.competencies,
    }),
    employment_type: jd.employment_type,
    custom_benefits: jd.custom_benefits,
  };

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadPdf(
        `/public/job-descriptions/${jd!.id}/pdf${showingEnglish ? "?lang=en" : ""}`,
        `${jd!.job_title.replace(/[^a-z0-9]+/gi, "-")}${showingEnglish ? "-en" : ""}.pdf`,
      );
    } catch {
      alert("Could not generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
        <div>
          <Link to="/careers" className="text-sm text-accent hover:underline">
            ← All open positions
          </Link>
          <h1 className="font-display font-bold text-xl mt-1">
            {jd.job_title} — {jd.location}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
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
          <button className="btn-primary" onClick={() => setShowApplyModal(true)} type="button">
            Apply
          </button>
        </div>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md">
            <p className="text-sm mb-3">
              Vui lòng đính kèm CV, portfolio và LinkedIn (nếu có) khi ứng tuyển. Chúng tôi sẽ phản hồi trong vòng 5
              ngày làm việc nếu hồ sơ phù hợp. Nếu bạn chưa nhận được phản hồi, có thể vị trí đã được tuyển đủ hoặc
              chúng tôi đang tiếp tục với ứng viên khác. Do số lượng hồ sơ lớn, mong bạn thông cảm nếu chúng tôi
              không thể phản hồi từng hồ sơ. Bạn vẫn có thể chủ động liên hệ để kiểm tra tình trạng ứng tuyển.
            </p>
            <p className="text-sm text-ink-muted mb-4">
              Please attach your CV, portfolio, and LinkedIn profile (if available) when applying. We will get back
              to you within 5 working days if your profile is suitable. If you do not hear from us, the position may
              have been filled or we may be proceeding with other candidates. Due to the high volume of
              applications, we may not be able to reply individually. Feel free to follow up to check your
              application status.
            </p>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={() => setShowApplyModal(false)} type="button">
                Cancel
              </button>
              <a
                className="btn-primary"
                href={`mailto:uv-recruitment@unios.com?subject=${encodeURIComponent(
                  `${jd.job_title} - Your name`,
                )}&body=${encodeURIComponent("Please attach your CV, portfolio (if any), and LinkedIn profile (if any).")}`}
                onClick={() => setShowApplyModal(false)}
              >
                Apply Now
              </a>
            </div>
          </div>
        </div>
      )}

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
