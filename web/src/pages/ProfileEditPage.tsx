import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { groupByDivision } from "../lib/careerMap";
import type {
  CareerMapRole,
  Competency,
  CompetencyLevel,
  GrammarIssue,
  Okr,
  ProfileDetail,
  ProfileInput,
  Requirement,
  Responsibility,
} from "../lib/types";
import { CAREER_RANK_LABELS } from "../lib/types";
import { GrammarIssuesPanel } from "../components/GrammarIssuesPanel";

function buildGrammarFields(form: ProfileInput) {
  const fields: { label: string; text: string }[] = [
    { label: "Job title", text: form.job_title },
    { label: "Rank", text: form.rank ?? "" },
    { label: "Division", text: form.division ?? "" },
    { label: "Function", text: form.function ?? "" },
    { label: "Location", text: form.location ?? "" },
    { label: "Compensation", text: form.compensation ?? "" },
    { label: "Benefits", text: form.benefits ?? "" },
    { label: "Bonuses & dependencies", text: form.bonuses ?? "" },
  ];
  form.responsibilities.forEach((r, i) => {
    fields.push({ label: `Responsibility ${i + 1} — Main function`, text: r.main_function });
    fields.push({ label: `Responsibility ${i + 1} — Responsibilities`, text: r.responsibilities });
    fields.push({ label: `Responsibility ${i + 1} — Success criteria`, text: r.success_criteria ?? "" });
  });
  form.requirements.forEach((r, i) => fields.push({ label: `Essential requirement ${i + 1}`, text: r.requirement }));
  form.okrs.forEach((o, i) => {
    fields.push({ label: `OKR ${i + 1} — Objective`, text: o.objective });
    fields.push({ label: `OKR ${i + 1} — Key results`, text: o.key_results });
  });
  form.competencies.forEach((c, i) => {
    fields.push({ label: `Competency ${i + 1} — Skill`, text: c.skill });
    fields.push({ label: `Competency ${i + 1} — Requirement`, text: c.requirement ?? "" });
  });
  return fields;
}

const LEVELS: CompetencyLevel[] = ["Basic", "Intermediate", "Advanced", "Expert"];
const SKILL_OPTIONS = [
  "Communication",
  "Teamwork",
  "Technical/Professional",
  "Adaptability",
  "Time management",
  "Problem-solving",
  "Organising",
  "Leadership",
];
const CUSTOM_OPTION = "__custom__";

function roleOptionLabel(role: CareerMapRole): string {
  const prefix = role.function ? `${role.function} — ` : "";
  const archivedSuffix = role.is_archived ? " — archived" : "";
  return `${prefix}${role.role_name} (${role.rank[0].toUpperCase()})${archivedSuffix}`;
}

function formatToday(): string {
  const d = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

const emptyForm: ProfileInput = {
  job_title: "",
  rank: "",
  division: "",
  function: "",
  location: "",
  last_updated: "",
  career_map_role_id: null,
  compensation: "",
  benefits: "",
  bonuses: "",
  responsibilities: [],
  requirements: [],
  okrs: [],
  competencies: [],
};

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <textarea className="input" rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function ProfileEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileInput>(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grammarIssues, setGrammarIssues] = useState<GrammarIssue[]>([]);
  const [grammarChecked, setGrammarChecked] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [useCustomTitle, setUseCustomTitle] = useState(false);
  const customTitleInitialized = useRef(false);
  const [missingLinkedRole, setMissingLinkedRole] = useState<CareerMapRole | null>(null);

  const { data: roles = [] } = useQuery({
    queryKey: ["career-map"],
    queryFn: () => api.get<CareerMapRole[]>("/career-map"),
  });

  // The linked role's id is the source of truth for dropdown vs. custom
  // rendering (not a name match) — see ProfileDetail.career_map_role_id.
  // If that role is archived, it's excluded from the default list above, so
  // fetch it individually to still render it as the selected option.
  useEffect(() => {
    if (!form.career_map_role_id) {
      setMissingLinkedRole(null);
      return;
    }
    if (roles.some((r) => r.id === form.career_map_role_id)) {
      setMissingLinkedRole(null);
      return;
    }
    api
      .get<CareerMapRole>(`/career-map/${form.career_map_role_id}`)
      .then(setMissingLinkedRole)
      .catch(() => setMissingLinkedRole(null));
  }, [form.career_map_role_id, roles]);

  const allRoles = missingLinkedRole ? [...roles, missingLinkedRole] : roles;

  useEffect(() => {
    if (isNew) return;
    api
      .get<ProfileDetail>(`/profiles/${id}`)
      .then((p) => setForm(p))
      .catch(() => setError("Couldn't load this profile."))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  // Defaults "Last updated" to today for a brand-new profile — still a plain
  // editable field afterwards (e.g. to match an official HR revision date).
  useEffect(() => {
    if (!isNew) return;
    setForm((f) => ({ ...f, last_updated: formatToday() }));
  }, [isNew]);

  // Once the profile (if editing) has loaded, decide whether it's linked to
  // a Career Map role (dropdown mode) or needs the free-text fallback (was
  // created via "Other", or predates the Career Map link).
  useEffect(() => {
    if (customTitleInitialized.current || loading) return;
    if (!form.career_map_role_id && form.job_title) {
      setUseCustomTitle(true);
    }
    customTitleInitialized.current = true;
  }, [loading, form.career_map_role_id, form.job_title]);

  // Re-arms the grammar scan whenever the form changes after that first
  // load, so further edits get a fresh check on the next Save click instead
  // of silently reusing a scan of stale content.
  const formLoadedRef = useRef(false);
  useEffect(() => {
    if (!formLoadedRef.current) {
      formLoadedRef.current = true;
      return;
    }
    setGrammarChecked(false);
    setGrammarIssues([]);
  }, [form]);

  if (loading) return <p className="text-sm text-ink-muted">Loading…</p>;

  function handleRoleSelect(value: string) {
    if (value === CUSTOM_OPTION) {
      setUseCustomTitle(true);
      setForm((f) => ({ ...f, career_map_role_id: null }));
      return;
    }
    const role = allRoles.find((r) => r.id === value);
    if (!role) return;
    setForm((f) => ({
      ...f,
      job_title: role.role_name,
      rank: CAREER_RANK_LABELS[role.rank],
      division: role.division,
      function: role.function ?? "",
      career_map_role_id: role.id,
    }));
  }

  async function handleSubmit() {
    if (!form.job_title.trim()) {
      setError("Job title is required.");
      return;
    }
    // Grammar scan runs once per save attempt, advisory only: the first
    // click scans and — if it finds anything — stops here to show the
    // panel instead of saving; clicking Save again proceeds regardless.
    if (!grammarChecked) {
      setScanning(true);
      setError(null);
      try {
        const { issues } = await api.post<{ issues: GrammarIssue[] }>("/grammar/scan", {
          fields: buildGrammarFields(form),
        });
        setGrammarChecked(true);
        setScanning(false);
        if (issues.length > 0) {
          setGrammarIssues(issues);
          return;
        }
        setGrammarIssues([]);
      } catch {
        // Grammar scanning is a convenience, not a requirement (e.g. no
        // ANTHROPIC_API_KEY configured) — don't block saving on it failing.
        setScanning(false);
        setGrammarChecked(true);
      }
    }
    setSaving(true);
    setError(null);
    try {
      const saved = isNew
        ? await api.post<ProfileDetail>("/profiles", form)
        : await api.patch<ProfileDetail>(`/profiles/${id}`, form);
      navigate(`/profiles/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const addResponsibility = () =>
    setForm((f) => ({
      ...f,
      responsibilities: [...f.responsibilities, { main_function: "", responsibilities: "", success_criteria: "" }],
    }));
  const updateResponsibility = (i: number, patch: Partial<Responsibility>) =>
    setForm((f) => ({
      ...f,
      responsibilities: f.responsibilities.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    }));
  const removeResponsibility = (i: number) =>
    setForm((f) => ({ ...f, responsibilities: f.responsibilities.filter((_, idx) => idx !== i) }));

  const addRequirement = () => setForm((f) => ({ ...f, requirements: [...f.requirements, { requirement: "" }] }));
  const updateRequirement = (i: number, patch: Partial<Requirement>) =>
    setForm((f) => ({ ...f, requirements: f.requirements.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));
  const removeRequirement = (i: number) =>
    setForm((f) => ({ ...f, requirements: f.requirements.filter((_, idx) => idx !== i) }));

  const addOkr = () => setForm((f) => ({ ...f, okrs: [...f.okrs, { objective: "", key_results: "" }] }));
  const updateOkr = (i: number, patch: Partial<Okr>) =>
    setForm((f) => ({ ...f, okrs: f.okrs.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) }));
  const removeOkr = (i: number) => setForm((f) => ({ ...f, okrs: f.okrs.filter((_, idx) => idx !== i) }));

  const addCompetency = () =>
    setForm((f) => ({ ...f, competencies: [...f.competencies, { skill: "", level: null, requirement: "" }] }));
  const updateCompetency = (i: number, patch: Partial<Competency>) =>
    setForm((f) => ({ ...f, competencies: f.competencies.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));
  const removeCompetency = (i: number) =>
    setForm((f) => ({ ...f, competencies: f.competencies.filter((_, idx) => idx !== i) }));

  return (
    <div className="max-w-4xl pb-16">
      <h1 className="font-display font-bold text-xl mb-4">{isNew ? "New job profile" : `Edit: ${form.job_title}`}</h1>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <GrammarIssuesPanel issues={grammarIssues} />

      <div className="card mb-6 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Job title</span>
          {useCustomTitle ? (
            <>
              <input
                className="input"
                value={form.job_title}
                onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
                placeholder="Role not yet on the Career Map"
              />
              {allRoles.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-accent self-start hover:underline"
                  onClick={() => setUseCustomTitle(false)}
                >
                  ← Choose from Career Map instead
                </button>
              )}
            </>
          ) : (
            <select className="input" value={form.career_map_role_id ?? ""} onChange={(e) => handleRoleSelect(e.target.value)}>
              <option value="" disabled>
                Select a role…
              </option>
              {groupByDivision(allRoles).map(([division, divisionRoles]) => (
                <optgroup key={division} label={division}>
                  {divisionRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {roleOptionLabel(r)}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value={CUSTOM_OPTION}>Other (type manually)…</option>
            </select>
          )}
        </label>
        <TextField label="Rank" value={form.rank} onChange={(v) => setForm((f) => ({ ...f, rank: v }))} />
        <TextField label="Division" value={form.division} onChange={(v) => setForm((f) => ({ ...f, division: v }))} />
        <TextField label="Function" value={form.function} onChange={(v) => setForm((f) => ({ ...f, function: v }))} />
        <TextField label="Location" value={form.location} onChange={(v) => setForm((f) => ({ ...f, location: v }))} />
        <TextField
          label="Last updated"
          value={form.last_updated}
          onChange={(v) => setForm((f) => ({ ...f, last_updated: v }))}
        />
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold">Key responsibilities</h2>
          <button className="btn-secondary" onClick={addResponsibility} type="button">
            + Add row
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {form.responsibilities.map((r, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
              <TextAreaField label="Main function" value={r.main_function} onChange={(v) => updateResponsibility(i, { main_function: v })} />
              <TextAreaField label="Responsibilities" value={r.responsibilities} onChange={(v) => updateResponsibility(i, { responsibilities: v })} />
              <div className="flex flex-col gap-2">
                <TextAreaField label="Success criteria" value={r.success_criteria} onChange={(v) => updateResponsibility(i, { success_criteria: v })} />
                <button className="text-sm text-red-600 self-start" onClick={() => removeResponsibility(i)} type="button">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {form.responsibilities.length === 0 && <p className="text-sm text-ink-muted">No rows yet.</p>}
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold">Essential requirements</h2>
          <button className="btn-secondary" onClick={addRequirement} type="button">
            + Add row
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {form.requirements.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-sm text-ink-faint">{i + 1}</span>
              <input
                className="input flex-1"
                value={r.requirement}
                onChange={(e) => updateRequirement(i, { requirement: e.target.value })}
              />
              <button className="text-sm text-red-600" onClick={() => removeRequirement(i)} type="button">
                Remove
              </button>
            </div>
          ))}
          {form.requirements.length === 0 && <p className="text-sm text-ink-muted">No rows yet.</p>}
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold">OKRs</h2>
          <button className="btn-secondary" onClick={addOkr} type="button">
            + Add row
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {form.okrs.map((o, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
              <TextAreaField label="Objective" value={o.objective} onChange={(v) => updateOkr(i, { objective: v })} />
              <div className="flex flex-col gap-2">
                <TextAreaField label="Key results" value={o.key_results} onChange={(v) => updateOkr(i, { key_results: v })} />
                <button className="text-sm text-red-600 self-start" onClick={() => removeOkr(i)} type="button">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {form.okrs.length === 0 && <p className="text-sm text-ink-muted">No rows yet.</p>}
        </div>
      </div>

      <div className="card mb-6 grid grid-cols-1 gap-4">
        <h2 className="font-display font-semibold">Compensation &amp; benefits</h2>
        <TextAreaField label="Compensation" value={form.compensation} onChange={(v) => setForm((f) => ({ ...f, compensation: v }))} />
        <TextAreaField label="Benefits" value={form.benefits} onChange={(v) => setForm((f) => ({ ...f, benefits: v }))} />
        <TextAreaField label="Bonuses & dependencies" value={form.bonuses} onChange={(v) => setForm((f) => ({ ...f, bonuses: v }))} />
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold">Competencies</h2>
          <button className="btn-secondary" onClick={addCompetency} type="button">
            + Add row
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {form.competencies.map((c, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex flex-col gap-1">
                <TextField label="Skill" value={c.skill} onChange={(v) => updateCompetency(i, { skill: v })} />
                <select
                  className="input !w-auto py-1 text-xs text-ink-muted"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) updateCompetency(i, { skill: e.target.value });
                  }}
                >
                  <option value="">Preset…</option>
                  {SKILL_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Level</span>
                <select
                  className="input"
                  value={c.level ?? ""}
                  onChange={(e) => updateCompetency(i, { level: (e.target.value || null) as CompetencyLevel | null })}
                >
                  <option value="">—</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-col gap-2">
                <TextAreaField label="Requirement" value={c.requirement} onChange={(v) => updateCompetency(i, { requirement: v })} />
                <button className="text-sm text-red-600 self-start" onClick={() => removeCompetency(i)} type="button">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {form.competencies.length === 0 && <p className="text-sm text-ink-muted">No rows yet.</p>}
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn-primary" onClick={handleSubmit} disabled={saving || scanning} type="button">
          {scanning ? "Checking grammar…" : saving ? "Saving…" : grammarIssues.length > 0 ? "Save anyway" : "Save profile"}
        </button>
        <button className="btn-secondary" onClick={() => navigate(-1)} type="button">
          Cancel
        </button>
      </div>
    </div>
  );
}
