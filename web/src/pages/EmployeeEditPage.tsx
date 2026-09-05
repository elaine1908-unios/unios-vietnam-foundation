import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { groupByDivision } from "../lib/careerMap";
import type { CareerMapRole, EmployeeDetail, EmployeeInput } from "../lib/types";
import { CAREER_RANK_LABELS } from "../lib/types";
import { OFFICE_LOCATIONS, BANK_NAMES, GENDERS, MARITAL_STATUSES, HEALTH_INSURANCE_STATUSES } from "../lib/employeeOptions";

function roleOptionLabel(role: CareerMapRole): string {
  const prefix = role.function ? `${role.function} — ` : "";
  const archivedSuffix = role.is_archived ? " — archived" : "";
  return `${prefix}${role.role_name} (${role.rank[0].toUpperCase()})${archivedSuffix}`;
}

// Vietnam's domestic prefix — pre-filled since nearly every hire is a
// domestic number, but plain editable text: someone entering a foreign
// number (see e.g. a Dutch or Australian hire) just types over it.
const DEFAULT_PHONE_PREFIX = "(084) ";
const PHONE_PLACEHOLDER = "(084) XXX XXX XXX";

const EMPTY_FORM: EmployeeInput = {
  work_email: "",
  last_name: "",
  middle_name: "",
  first_name: "",
  english_name: "",
  department: "",
  position: "",
  rank: "",
  career_map_role_id: null,
  office_location: "",
  commencement_date: "",
  phone_no: DEFAULT_PHONE_PREFIX,
  personal_tax_no: "",
  bank_account_no: "",
  bank_name: "",
  gender: "",
  marital_status: "",
  birthday: "",
  id_no: "",
  issued_date: "",
  issued_at: "",
  passport_no: "",
  nationality: "",
  permanent_address: "",
  temporary_address: "",
  emergency_contact: "",
  relationship: "",
  contact_phone_no: DEFAULT_PHONE_PREFIX,
  contact_address: "",
  health_insurance: "",
};

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateField({
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
      <input className="input" type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
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
      <textarea className="input" rows={2} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const [form, setForm] = useState<EmployeeInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingLinkedRole, setMissingLinkedRole] = useState<CareerMapRole | null>(null);

  const { data: roles = [] } = useQuery({
    queryKey: ["career-map"],
    queryFn: () => api.get<CareerMapRole[]>("/career-map"),
  });

  useEffect(() => {
    if (isNew) return;
    api
      .get<EmployeeDetail>(`/employees/${id}`)
      .then((e) => setForm(e))
      .catch(() => setError("Couldn't load this employee."))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  // If the linked role was later archived, it's excluded from the default
  // /career-map list — fetch it individually so it still shows as the
  // selected option instead of the dropdown silently landing on nothing.
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

  if (loading) return <p className="text-sm text-ink-muted">Loading…</p>;

  function set<K extends keyof EmployeeInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleRoleSelect(roleId: string) {
    const role = allRoles.find((r) => r.id === roleId);
    if (!role) return;
    setForm((f) => ({
      ...f,
      career_map_role_id: role.id,
      department: role.division,
      position: role.role_name,
      rank: CAREER_RANK_LABELS[role.rank],
    }));
  }

  async function handleSubmit() {
    if (!form.last_name?.trim() || !form.first_name?.trim()) {
      setError("Last name and first name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = isNew
        ? await api.post<EmployeeDetail>("/employees", form)
        : await api.patch<EmployeeDetail>(`/employees/${id}`, form);
      navigate(`/employees/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl pb-16">
      <h1 className="font-display font-bold text-xl mb-3">{isNew ? "New employee" : "Edit employee"}</h1>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="card !p-4 mb-4">
        <h2 className="font-display font-semibold mb-2">Work Information</h2>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Work Email" value={form.work_email} onChange={(v) => set("work_email", v)} />
          <TextField
            label="Phone No."
            value={form.phone_no}
            onChange={(v) => set("phone_no", v)}
            placeholder={PHONE_PLACEHOLDER}
          />
          <SelectField
            label="Office Location"
            value={form.office_location}
            options={OFFICE_LOCATIONS}
            onChange={(v) => set("office_location", v)}
          />
          <DateField
            label="Commencement Date"
            value={form.commencement_date}
            onChange={(v) => set("commencement_date", v)}
          />
        </div>
        <label className="flex flex-col gap-1 text-sm mt-3">
          <span className="font-medium">Career Map Role</span>
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
          </select>
          <span className="text-xs text-ink-faint">
            Department, Position, and Rank are set by picking a role here — there's no free-text override.
          </span>
        </label>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Department</span>
            <p className="input bg-surface-2 text-ink-muted">{form.department || "—"}</p>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Position</span>
            <p className="input bg-surface-2 text-ink-muted">{form.position || "—"}</p>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Rank</span>
            <p className="input bg-surface-2 text-ink-muted">{form.rank || "—"}</p>
          </div>
        </div>
      </div>

      <div className="card !p-4 mb-4">
        <h2 className="font-display font-semibold mb-2">Personal Information</h2>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Last Name" value={form.last_name} onChange={(v) => set("last_name", v)} />
          <TextField label="Middle Name" value={form.middle_name} onChange={(v) => set("middle_name", v)} />
          <TextField label="First Name" value={form.first_name} onChange={(v) => set("first_name", v)} />
          <TextField label="English Name" value={form.english_name} onChange={(v) => set("english_name", v)} />
          <SelectField label="Gender" value={form.gender} options={GENDERS} onChange={(v) => set("gender", v)} />
          <SelectField
            label="Marital Status"
            value={form.marital_status}
            options={MARITAL_STATUSES}
            onChange={(v) => set("marital_status", v)}
          />
          <DateField label="Birthday" value={form.birthday} onChange={(v) => set("birthday", v)} />
          <TextField label="Nationality" value={form.nationality} onChange={(v) => set("nationality", v)} />
        </div>
      </div>

      <div className="card !p-4 mb-4">
        <h2 className="font-display font-semibold mb-2">Identification</h2>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="ID No." value={form.id_no} onChange={(v) => set("id_no", v)} />
          <DateField label="Issued Date" value={form.issued_date} onChange={(v) => set("issued_date", v)} />
          <TextField label="Issued At" value={form.issued_at} onChange={(v) => set("issued_at", v)} />
          <TextField label="Passport No." value={form.passport_no} onChange={(v) => set("passport_no", v)} />
        </div>
      </div>

      <div className="card !p-4 mb-4">
        <h2 className="font-display font-semibold mb-2">Financial</h2>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Personal Tax No." value={form.personal_tax_no} onChange={(v) => set("personal_tax_no", v)} />
          <TextField label="Bank Account No." value={form.bank_account_no} onChange={(v) => set("bank_account_no", v)} />
          <SelectField label="Bank Name" value={form.bank_name} options={BANK_NAMES} onChange={(v) => set("bank_name", v)} />
          <SelectField
            label="Health Insurance"
            value={form.health_insurance}
            options={HEALTH_INSURANCE_STATUSES}
            onChange={(v) => set("health_insurance", v)}
          />
        </div>
      </div>

      <div className="card !p-4 mb-4">
        <h2 className="font-display font-semibold mb-2">Address</h2>
        <div className="grid grid-cols-2 gap-3">
          <TextAreaField label="Permanent Address" value={form.permanent_address} onChange={(v) => set("permanent_address", v)} />
          <TextAreaField label="Temporary Address" value={form.temporary_address} onChange={(v) => set("temporary_address", v)} />
        </div>
      </div>

      <div className="card !p-4 mb-4">
        <h2 className="font-display font-semibold mb-2">Emergency Contact</h2>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Emergency Contact" value={form.emergency_contact} onChange={(v) => set("emergency_contact", v)} />
          <TextField label="Relationship" value={form.relationship} onChange={(v) => set("relationship", v)} />
          <TextField
            label="Contact Phone No."
            value={form.contact_phone_no}
            onChange={(v) => set("contact_phone_no", v)}
            placeholder={PHONE_PLACEHOLDER}
          />
          <TextAreaField label="Contact Address" value={form.contact_address} onChange={(v) => set("contact_address", v)} />
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn-primary" onClick={handleSubmit} disabled={saving} type="button">
          {saving ? "Saving…" : "Save employee"}
        </button>
        <button className="btn-secondary" onClick={() => navigate(-1)} type="button">
          Cancel
        </button>
      </div>
    </div>
  );
}
