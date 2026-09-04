import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { EmploymentType, GrammarIssue, JobDescriptionDetail, ProfileDetail, ProfileSummary } from "../lib/types";
import { GrammarIssuesPanel } from "../components/GrammarIssuesPanel";

export function JobDescriptionEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const [jobProfileId, setJobProfileId] = useState("");
  const [location, setLocation] = useState("");
  const [isNowHiring, setIsNowHiring] = useState(false);
  const [employmentType, setEmploymentType] = useState<EmploymentType>("full_time");
  const [customBenefits, setCustomBenefits] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grammarIssues, setGrammarIssues] = useState<GrammarIssue[]>([]);
  const [grammarChecked, setGrammarChecked] = useState(false);
  const [scanning, setScanning] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-jd"],
    queryFn: () => api.get<ProfileSummary[]>("/profiles"),
  });

  useEffect(() => {
    if (isNew) return;
    api
      .get<JobDescriptionDetail>(`/job-descriptions/${id}`)
      .then((jd) => {
        setJobProfileId(jd.job_profile_id);
        setLocation(jd.location);
        setIsNowHiring(jd.is_now_hiring);
        setEmploymentType(jd.employment_type);
        setCustomBenefits(jd.custom_benefits ?? "");
      })
      .catch(() => setError("Couldn't load this job description."))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  useEffect(() => {
    setGrammarChecked(false);
    setGrammarIssues([]);
  }, [jobProfileId, location, employmentType, customBenefits]);

  if (loading) return <p className="text-sm text-ink-muted">Loading…</p>;

  async function runGrammarScan(): Promise<boolean> {
    setScanning(true);
    try {
      const profile = await api.get<ProfileDetail>(`/profiles/${jobProfileId}`);
      const fields = [
        { label: "Location", text: location },
        { label: "Job title", text: profile.job_title },
        ...profile.responsibilities.flatMap((r, i) => [
          { label: `Role ${i + 1} — Main function`, text: r.main_function },
          { label: `Role ${i + 1} — Responsibilities`, text: r.responsibilities },
        ]),
        ...profile.requirements.map((r, i) => ({ label: `Essential requirement ${i + 1}`, text: r.requirement })),
        ...profile.competencies.map((c, i) => ({ label: `Competency ${i + 1}`, text: c.requirement ?? "" })),
        ...(employmentType === "part_time" && customBenefits.trim()
          ? [{ label: "Benefits (part time)", text: customBenefits }]
          : []),
      ];
      const { issues } = await api.post<{ issues: GrammarIssue[] }>("/grammar/scan", { fields });
      setGrammarChecked(true);
      if (issues.length > 0) {
        setGrammarIssues(issues);
        return false;
      }
      setGrammarIssues([]);
      return true;
    } catch {
      // Advisory only — don't block saving if the scan itself fails.
      setGrammarChecked(true);
      return true;
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit() {
    if (!jobProfileId) {
      setError("Choose a Job Profile.");
      return;
    }
    if (!location.trim()) {
      setError("Location is required.");
      return;
    }
    if (!grammarChecked) {
      setError(null);
      const clean = await runGrammarScan();
      if (!clean) return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        job_profile_id: jobProfileId,
        location: location.trim(),
        is_now_hiring: isNowHiring,
        employment_type: employmentType,
        custom_benefits: customBenefits.trim() || null,
      };
      const saved = isNew
        ? await api.post<JobDescriptionDetail>("/job-descriptions", body)
        : await api.patch<JobDescriptionDetail>(`/job-descriptions/${id}`, body);
      navigate(`/job-descriptions/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display font-bold text-xl mb-1">{isNew ? "New job description" : "Edit job description"}</h1>
      <p className="text-sm text-ink-muted mb-4">
        A Job Description is generated from a Job Profile — its role content always reflects the profile's current
        responsibilities, requirements, and competencies. Only the title, location, and hiring status are set here.
      </p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <GrammarIssuesPanel issues={grammarIssues} />

      <div className="card flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Job Profile</span>
          <select className="input" value={jobProfileId} onChange={(e) => setJobProfileId(e.target.value)}>
            <option value="" disabled>
              Select a job profile…
            </option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.job_title}
                {p.division ? ` — ${p.division}${p.function ? ` — ${p.function}` : ""}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Location</span>
          <input
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Ho Chi Minh City"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Employment type</span>
          <select
            className="input"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
          >
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
          </select>
        </label>
        {employmentType === "full_time" ? (
          <p className="text-xs text-ink-faint -mt-2">
            Benefits use the standard full-time package automatically — nothing to fill in here.
          </p>
        ) : (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Benefits (part time)</span>
            <textarea
              className="input"
              rows={4}
              value={customBenefits}
              onChange={(e) => setCustomBenefits(e.target.value)}
              placeholder="No standard package for part-time roles — write what applies to this posting (one per line)."
            />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isNowHiring} onChange={(e) => setIsNowHiring(e.target.checked)} />
          <span className="font-medium">Now Hiring</span>
          <span className="text-ink-faint">— visible on the public careers page (no login required)</span>
        </label>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || scanning} type="button">
            {scanning ? "Checking grammar…" : saving ? "Saving…" : grammarIssues.length > 0 ? "Save anyway" : "Save job description"}
          </button>
          <button className="btn-secondary" onClick={() => navigate(-1)} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
