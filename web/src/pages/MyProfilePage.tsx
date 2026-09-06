import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { EmployeeDetail } from "../lib/types";
import { rankBadge } from "../lib/types";
import { GENDERS, MARITAL_STATUSES, PHONE_PLACEHOLDER } from "../lib/employeeOptions";
import { employeeDisplayName } from "../lib/vietnamese";

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex border-b border-border last:border-0">
      <div className="w-56 shrink-0 bg-surface-2 px-3 py-2 text-sm font-medium">{label}</div>
      <div className="px-3 py-2 text-sm whitespace-pre-wrap">{value || "—"}</div>
    </div>
  );
}

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

function DateField({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input className="input" type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

// The subset of EmployeeDetail this page lets someone edit on their own
// record — Personal Information and Emergency Contact only (see PATCH
// /employees/me on the server). Everything else on this page is read-only,
// informational context sourced from the same record.
type SelfEditableFields = Pick<
  EmployeeDetail,
  | "last_name"
  | "middle_name"
  | "first_name"
  | "english_name"
  | "gender"
  | "marital_status"
  | "birthday"
  | "nationality"
  | "emergency_contact"
  | "relationship"
  | "contact_phone_no"
>;

function extractEditable(e: EmployeeDetail): SelfEditableFields {
  return {
    last_name: e.last_name,
    middle_name: e.middle_name,
    first_name: e.first_name,
    english_name: e.english_name,
    gender: e.gender,
    marital_status: e.marital_status,
    birthday: e.birthday,
    nationality: e.nationality,
    emergency_contact: e.emergency_contact,
    relationship: e.relationship,
    contact_phone_no: e.contact_phone_no,
  };
}

export function MyProfilePage() {
  const queryClient = useQueryClient();
  const { data: e, isLoading, error } = useQuery({
    queryKey: ["employees", "me"],
    queryFn: () => api.get<EmployeeDetail>("/employees/me"),
    retry: false,
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SelfEditableFields | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (e) setForm(extractEditable(e));
  }, [e]);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !e) {
    const message =
      error instanceof ApiError ? error.message : "No employee record is linked to your account yet — contact your Head of Department.";
    return <p className="text-sm text-red-600">{message}</p>;
  }

  function set<K extends keyof SelfEditableFields>(key: K, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function startEditing() {
    setForm(extractEditable(e!));
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setForm(extractEditable(e!));
    setSaveError(null);
    setEditing(false);
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.patch("/employees/me", form);
      await queryClient.invalidateQueries({ queryKey: ["employees", "me"] });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const displayName = employeeDisplayName(e);

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h1 className="font-display font-bold text-xl">{displayName}</h1>
          {e.employee_code && <p className="font-mono text-xs text-ink-faint mt-0.5">{e.employee_code}</p>}
        </div>
        {!editing && (
          <button className="btn-secondary shrink-0" onClick={startEditing}>
            Edit my info
          </button>
        )}
      </div>

      <div className="mb-6">
        <h2 className="bg-accent-2 text-white text-sm font-display font-semibold px-3 py-2 rounded-t-md">Work Information</h2>
        <div className="border border-t-0 border-border rounded-b-md">
          <InfoRow label="Work Email" value={e.work_email} />
          <InfoRow label="Department" value={e.department} />
          <InfoRow label="Function" value={e.function} />
          <InfoRow label="Position" value={e.position} />
          <InfoRow label="Rank" value={rankBadge(e.rank)} />
          <InfoRow label="Office Location" value={e.office_location} />
          <InfoRow label="Commencement Date" value={e.commencement_date} />
          <InfoRow label="Report To" value={e.report_to_employee ? employeeDisplayName(e.report_to_employee) : null} />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="bg-accent-2 text-white text-sm font-display font-semibold px-3 py-2 rounded-t-md">Contract Information</h2>
        <div className="border border-t-0 border-border rounded-b-md">
          <InfoRow label="Contract Type" value={e.contract_type} />
          <InfoRow label="Length of Contract" value={e.contract_length} />
          <InfoRow label="Contract No." value={e.contract_no} />
          <InfoRow label="Start Date" value={e.contract_start_date} />
          <InfoRow label="End Date" value={e.contract_end_date} />
        </div>
      </div>

      {editing && form ? (
        <>
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
            </div>
          </div>

          {saveError && <p className="text-sm text-red-600 mb-2">{saveError}</p>}
          <div className="flex gap-2">
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn-secondary" onClick={cancelEditing} disabled={saving} type="button">
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="bg-accent-2 text-white text-sm font-display font-semibold px-3 py-2 rounded-t-md">Personal Information</h2>
            <div className="border border-t-0 border-border rounded-b-md">
              <InfoRow label="Last Name" value={e.last_name} />
              <InfoRow label="Middle Name" value={e.middle_name} />
              <InfoRow label="First Name" value={e.first_name} />
              <InfoRow label="English Name" value={e.english_name} />
              <InfoRow label="Gender" value={e.gender} />
              <InfoRow label="Marital Status" value={e.marital_status} />
              <InfoRow label="Birthday" value={e.birthday} />
              <InfoRow label="Nationality" value={e.nationality} />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="bg-accent-2 text-white text-sm font-display font-semibold px-3 py-2 rounded-t-md">Emergency Contact</h2>
            <div className="border border-t-0 border-border rounded-b-md">
              <InfoRow label="Emergency Contact" value={e.emergency_contact} />
              <InfoRow label="Relationship" value={e.relationship} />
              <InfoRow label="Contact Phone No." value={e.contact_phone_no} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
