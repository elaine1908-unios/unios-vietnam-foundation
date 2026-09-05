import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { EmployeeDetail } from "../lib/types";
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

  const { data: e, isLoading, error } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => api.get<EmployeeDetail>(`/employees/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !e) return <p className="text-sm text-red-600">Couldn't load this employee.</p>;

  const canEdit = user?.capabilities.includes("employee.edit") ?? false;
  const canArchive = user?.capabilities.includes("employee.archive") ?? false;
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
        <InfoRow label="Position" value={e.position} />
        <InfoRow label="Rank" value={e.rank} />
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

      <Section title="Identification">
        <InfoRow label="ID No." value={e.id_no} />
        <InfoRow label="Issued Date" value={e.issued_date} />
        <InfoRow label="Passport No." value={e.passport_no} />
      </Section>

      <Section title="Contract Information">
        <InfoRow label="Contract Type" value={e.contract_type} />
        <InfoRow label="Length of Contract" value={e.contract_length} />
        <InfoRow label="Contract No." value={e.contract_no} />
        <InfoRow label="Start Date" value={e.contract_start_date} />
        <InfoRow label="End Date" value={e.contract_end_date} />
      </Section>

      <Section title="Financial">
        <InfoRow label="Personal Tax No." value={e.personal_tax_no} />
        <InfoRow label="Bank Account No." value={e.bank_account_no} />
        <InfoRow label="Bank Name" value={e.bank_name} />
        <InfoRow label="Health Insurance" value={e.health_insurance} />
      </Section>

      <Section title="Address">
        <InfoRow label="Permanent Address" value={e.permanent_address} />
        <InfoRow label="Temporary Address" value={e.temporary_address} />
      </Section>

      <Section title="Emergency Contact">
        <InfoRow label="Emergency Contact" value={e.emergency_contact} />
        <InfoRow label="Relationship" value={e.relationship} />
        <InfoRow label="Contact Phone No." value={e.contact_phone_no} />
      </Section>
    </div>
  );
}
