import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { EmployeeDetail, ProfileSummary } from "../lib/types";
import { rankBadge } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";
import { employeeDisplayName } from "../lib/vietnamese";
import { OffshoreIcon } from "../components/OffshoreIcon";

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

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [archiving, setArchiving] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  // Populated only when more than one Job Profile is linked to this
  // employee's Career Map role — otherwise the click navigates straight
  // there (or shows the "not available" alert) without ever setting this.
  const [profileChoices, setProfileChoices] = useState<ProfileSummary[] | null>(null);

  const { data: e, isLoading, error } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => api.get<EmployeeDetail>(`/employees/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !e) return <p className="text-sm text-red-600">Couldn't load this employee.</p>;

  const canEdit = user?.capabilities.includes("employee.edit") ?? false;
  const canArchive = user?.capabilities.includes("employee.archive") ?? false;
  // Team Lead/Head of Department hold employee.view too now (scoped to
  // their own reporting chain — see employeeScopeFor in
  // routes/employees.ts), but the server redacts these sections' fields to
  // null for them rather than sending real values — hiding the sections
  // entirely here avoids showing a page of misleading "—" placeholders for
  // information they were never sent in the first place. Admin sees
  // everything unredacted, same as Owner (see employeeScopeFor).
  const canViewSensitive = user?.access_level === "owner" || user?.access_level === "admin";
  const displayName = employeeDisplayName(e);

  async function handleArchiveToggle() {
    setArchiving(true);
    try {
      await api.post(`/employees/${e!.id}/${e!.is_archived ? "restore" : "archive"}`);
      await queryClient.invalidateQueries({ queryKey: ["employee", id] });
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch {
      alert("Something went wrong.");
    } finally {
      setArchiving(false);
    }
  }

  // Looks up the Job Profile(s) linked to the same Career Map role as this
  // employee (department/position/rank all trace back to that one role —
  // see career_map_role_id). No role linked, or no non-archived profile
  // built from it yet, both land on the same "not available" message —
  // from the viewer's point of view there's nothing useful to show either
  // way.
  async function handleViewProfile() {
    if (!e!.career_map_role_id) {
      alert("This profile is not available right now.");
      return;
    }
    setCheckingProfile(true);
    try {
      const matches = await api.get<ProfileSummary[]>(`/profiles?career_map_role_id=${e!.career_map_role_id}`);
      if (matches.length === 0) {
        alert("This profile is not available right now.");
      } else if (matches.length === 1) {
        navigate(`/profiles/${matches[0].id}`);
      } else {
        setProfileChoices(matches);
      }
    } catch {
      alert("This profile is not available right now.");
    } finally {
      setCheckingProfile(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <Link to="/employees" className="text-sm text-accent hover:underline">
            ← Employee Master
          </Link>
          <h1 className="font-display font-bold text-xl mt-1 flex items-center gap-2">
            {displayName}
            {e.is_offshore && <OffshoreIcon className="w-5 h-5 shrink-0" />}
          </h1>
          {e.employee_code && <p className="font-mono text-xs text-ink-faint mt-0.5">{e.employee_code}</p>}
          <div className="flex gap-2 mt-1">
            {e.is_archived ? (
              <span className="text-xs rounded bg-surface-2 border border-border px-1.5 py-0.5 text-ink-faint">
                Archived
              </span>
            ) : (
              <span className="text-xs rounded bg-accent-soft border border-accent/30 px-1.5 py-0.5 text-accent font-medium">
                On-going
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <button className="btn-secondary" onClick={handleViewProfile} disabled={checkingProfile}>
              {checkingProfile ? "Checking…" : "View Performance Profile"}
            </button>
            {profileChoices && (
              <div className="absolute right-0 z-10 mt-1 w-72 card !p-2 shadow-lg">
                <p className="text-xs text-ink-muted px-2 pb-1">Multiple profiles use this role — choose one:</p>
                {profileChoices.map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-surface-2"
                    onClick={() => navigate(`/profiles/${p.id}`)}
                    type="button"
                  >
                    {p.job_title}
                    {p.location && <span className="text-ink-muted"> — {p.location}</span>}
                  </button>
                ))}
                <button
                  className="w-full text-left text-xs text-ink-faint px-2 pt-1"
                  onClick={() => setProfileChoices(null)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          {canEdit && (
            <button className="btn-secondary" onClick={() => navigate(`/employees/${e.id}/edit`)}>
              Edit
            </button>
          )}
          {canArchive && (
            <button className="btn-secondary" onClick={handleArchiveToggle} disabled={archiving}>
              {e.is_archived ? "Restore" : "Archive"}
            </button>
          )}
        </div>
      </div>

      <Section title="Work Information">
        <InfoRow label="Work Email" value={e.work_email} />
        <InfoRow label="Phone No." value={e.phone_no} />
        <InfoRow label="Department" value={e.department} />
        <InfoRow label="Function" value={e.function} />
        <InfoRow label="Position" value={e.position} />
        <InfoRow label="Rank" value={rankBadge(e.rank)} />
        <InfoRow label="Office Location" value={e.office_location} />
        <InfoRow label="Commencement Date" value={e.commencement_date} />
        <InfoRow label="Off-shore" value={e.is_offshore ? "Yes" : "No"} />
        <div className="flex border-b border-border last:border-0">
          <div className="w-56 shrink-0 bg-surface-2 px-3 py-2 text-sm font-medium">Report To</div>
          <div className="px-3 py-2 text-sm">
            {e.report_to_employee ? (
              <Link to={`/employees/${e.report_to_employee.id}`} className="text-accent hover:underline">
                {employeeDisplayName(e.report_to_employee)}
              </Link>
            ) : (
              "—"
            )}
          </div>
        </div>
      </Section>
      {e.career_map_role_id && (
        <p className="text-xs text-ink-faint -mt-4 mb-6">
          Linked to Career Map role: {e.career_map_role?.division}
          {e.career_map_role?.function ? ` — ${e.career_map_role.function}` : ""}
          {e.career_map_role?.is_archived && " · archived"}
          {e.career_map_role && e.career_map_role.role_name !== e.position && (
            <> · now named "{e.career_map_role.role_name}" on the Career Map</>
          )}
        </p>
      )}

      <Section title="Personal Information">
        <InfoRow label="Last Name" value={e.last_name} />
        <InfoRow label="Middle Name" value={e.middle_name} />
        <InfoRow label="First Name" value={e.first_name} />
        <InfoRow label="English Name" value={e.english_name} />
        <InfoRow label="Gender" value={e.gender} />
        <InfoRow label="Marital Status" value={e.marital_status} />
        <InfoRow label="Birthday" value={e.birthday} />
        <InfoRow label="Nationality" value={e.nationality} />
      </Section>

      {canViewSensitive && (
        <Section title="Identification">
          <InfoRow label="ID No." value={e.id_no} />
          <InfoRow label="Issued Date" value={e.issued_date} />
          <InfoRow label="Passport No." value={e.passport_no} />
        </Section>
      )}

      <Section title="Contract Information">
        <InfoRow label="Contract Type" value={e.contract_type} />
        <InfoRow label="Length of Contract" value={e.contract_length} />
        <InfoRow label="Contract No." value={e.contract_no} />
        <InfoRow label="Start Date" value={e.contract_start_date} />
        <InfoRow label="End Date" value={e.contract_end_date} />
      </Section>

      {canViewSensitive && (
        <Section title="Financial">
          <InfoRow label="Personal Tax No." value={e.personal_tax_no} />
          <InfoRow label="Bank Account No." value={e.bank_account_no} />
          <InfoRow label="Bank Name" value={e.bank_name} />
          <InfoRow label="Health Insurance" value={e.health_insurance} />
        </Section>
      )}

      {canViewSensitive && (
        <Section title="Address">
          <InfoRow label="Permanent Address" value={e.permanent_address} />
          <InfoRow label="Temporary Address" value={e.temporary_address} />
        </Section>
      )}

      {canViewSensitive && (
        <Section title="Emergency Contact">
          <InfoRow label="Emergency Contact" value={e.emergency_contact} />
          <InfoRow label="Relationship" value={e.relationship} />
          <InfoRow label="Contact Phone No." value={e.contact_phone_no} />
        </Section>
      )}
    </div>
  );
}
