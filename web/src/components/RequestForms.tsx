import { useState } from "react";
import { LEAVE_DURATIONS, LEAVE_TYPES, OT_LOCATIONS } from "../lib/types";
import type { AlDetails, BtDetails, OtDetails } from "../lib/types";

// Mirrors the same calculations in server/src/routes/requests.ts exactly —
// duplicated here purely for an immediate live preview as the employee
// types; the server is still the authority and recomputes on submit.
function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}
// Vietnam's fixed (solar-calendar) public holidays only — same date every
// year. Excludes Tết, Hùng Kings' Day, and National Day's government-chosen
// adjacent day, since those move or are set year by year.
const VN_FIXED_HOLIDAYS = new Set(["01-01", "04-30", "05-01", "09-02"]);
function isNonWorkingDay(d: Date): boolean {
  if (isWeekend(d)) return true;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return VN_FIXED_HOLIDAYS.has(`${mm}-${dd}`);
}
// Return to Work Date is the day you're back at work, not the last day of
// leave — for a Full Day request it's an exclusive upper bound (Friday
// start, Monday return = 1 working day, not 2).
export function calcAlDays(start: string, end: string, duration: string): number {
  if (!start || !end) return 0;
  const s = parseISODate(start);
  const e = parseISODate(end);
  if (e < s) return 0;
  if (duration !== "Full Day") return s.getTime() === e.getTime() && !isNonWorkingDay(s) ? 0.5 : 0;
  let count = 0;
  const cur = new Date(s);
  while (cur < e) {
    if (!isNonWorkingDay(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}
function parseHM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}
export function calcOtHours(start: string, end: string, breakMinutes: number): number {
  if (!start || !end) return 0;
  const s = parseHM(start);
  let e = parseHM(end);
  if (e <= s) e += 24 * 60;
  const total = Math.max(0, e - s - breakMinutes);
  return Math.round((total / 60) * 100) / 100;
}
export function calcBtDays(departureAt: string, returnAt: string): number {
  if (!departureAt || !returnAt) return 0;
  const dep = new Date(departureAt);
  const ret = new Date(returnAt);
  const depDate = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate());
  const retDate = new Date(ret.getFullYear(), ret.getMonth(), ret.getDate());
  const diffDays = Math.round((retDate.getTime() - depDate.getTime()) / 86400000);
  return Math.max(1, diffDays + 1);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function FormActions({
  saving,
  submitting,
  onSaveDraft,
  onSubmit,
  onCancelEdit,
  error,
}: {
  saving: boolean;
  submitting: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onCancelEdit?: () => void;
  error: string | null;
}) {
  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-secondary" type="button" onClick={onSaveDraft} disabled={saving || submitting}>
          {saving ? "Saving…" : "Save as Draft"}
        </button>
        <button className="btn-primary" type="button" onClick={onSubmit} disabled={saving || submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </button>
        {onCancelEdit && (
          <button className="text-sm text-ink-muted hover:text-ink" type="button" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export interface RequestFormHandle<T> {
  onSaveDraft: (data: T) => Promise<void>;
  onSubmit: (data: T) => Promise<void>;
  onCancelEdit?: () => void;
  error: string | null;
  saving: boolean;
  submitting: boolean;
}

export function ALRequestForm({ initial, ...handlers }: { initial?: Partial<AlDetails> } & RequestFormHandle<Partial<AlDetails>>) {
  const [leaveType, setLeaveType] = useState(initial?.leave_type ?? "Annual Leave");
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [returnDate, setReturnDate] = useState(initial?.return_to_work_date ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "Full Day");

  const data = { leave_type: leaveType, reason, start_date: startDate, return_to_work_date: returnDate, duration };
  const days = calcAlDays(startDate, returnDate, duration);

  return (
    <div className="card !p-4 flex flex-col gap-3">
      <Field label="Leave Type *">
        <select className="input" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
          {LEAVE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Reason">
        <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date *">
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Return to Work Date *">
          <input className="input" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
        </Field>
      </div>
      {duration === "Full Day" && (
        <p className="text-xs text-ink-faint -mt-2">
          The day you're back at work — for one day off, set this to the next working day, not the same day.
        </p>
      )}
      <Field label="Leave Duration *">
        <select className="input" value={duration} onChange={(e) => setDuration(e.target.value)}>
          {LEAVE_DURATIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>
      <p className="text-sm text-ink-muted">
        Days requested (working days only): <span className="font-medium text-ink">{days}</span>
      </p>
      <Field label="Sign-off Status">
        <p className="input bg-surface-2 text-ink-muted">System-generated on submit</p>
      </Field>
      <FormActions
        saving={handlers.saving}
        submitting={handlers.submitting}
        error={handlers.error}
        onCancelEdit={handlers.onCancelEdit}
        onSaveDraft={() => handlers.onSaveDraft(data)}
        onSubmit={() => handlers.onSubmit(data)}
      />
    </div>
  );
}

export function OTRequestForm({ initial, ...handlers }: { initial?: Partial<OtDetails> } & RequestFormHandle<Partial<OtDetails>>) {
  const [otDate, setOtDate] = useState(initial?.ot_date ?? "");
  const [startTime, setStartTime] = useState(initial?.start_time ?? "");
  const [endTime, setEndTime] = useState(initial?.end_time ?? "");
  const [breakMinutes, setBreakMinutes] = useState(initial?.break_minutes ?? 0);
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [projectDepartment, setProjectDepartment] = useState(initial?.project_department ?? "");
  const [location, setLocation] = useState(initial?.location ?? "Office");

  const data = {
    ot_date: otDate,
    start_time: startTime,
    end_time: endTime,
    break_minutes: breakMinutes,
    reason,
    project_department: projectDepartment,
    location,
  };
  const hours = calcOtHours(startTime, endTime, breakMinutes);

  return (
    <div className="card !p-4 flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <Field label="OT Date *">
          <input className="input" type="date" value={otDate} onChange={(e) => setOtDate(e.target.value)} />
        </Field>
        <Field label="Start Time *">
          <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
        <Field label="End Time *">
          <input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field>
      </div>
      <Field label="Break Time (minutes), if applicable">
        <input
          className="input"
          type="number"
          min={0}
          value={breakMinutes}
          onChange={(e) => setBreakMinutes(Number(e.target.value) || 0)}
        />
      </Field>
      <p className="text-sm text-ink-muted">
        Total OT hours: <span className="font-medium text-ink">{hours}</span>
      </p>
      <Field label="Reason / Work Description *">
        <textarea className="input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Field label="Project / Department (optional)">
        <input className="input" value={projectDepartment} onChange={(e) => setProjectDepartment(e.target.value)} />
      </Field>
      <Field label="Location *">
        <select className="input" value={location} onChange={(e) => setLocation(e.target.value)}>
          {OT_LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Sign-off Status">
        <p className="input bg-surface-2 text-ink-muted">System-generated on submit</p>
      </Field>
      <FormActions
        saving={handlers.saving}
        submitting={handlers.submitting}
        error={handlers.error}
        onCancelEdit={handlers.onCancelEdit}
        onSaveDraft={() => handlers.onSaveDraft(data)}
        onSubmit={() => handlers.onSubmit(data)}
      />
    </div>
  );
}

export function BTRequestForm({ initial, ...handlers }: { initial?: Partial<BtDetails> } & RequestFormHandle<Partial<BtDetails>>) {
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [departureAt, setDepartureAt] = useState(initial?.departure_at?.slice(0, 16) ?? "");
  const [returnAt, setReturnAt] = useState(initial?.return_at?.slice(0, 16) ?? "");
  const [projectClient, setProjectClient] = useState(initial?.project_client ?? "");
  const [transportationRequired, setTransportationRequired] = useState(initial?.transportation_required ?? false);
  const [hotelRequired, setHotelRequired] = useState(initial?.hotel_required ?? false);
  const [advanceRequired, setAdvanceRequired] = useState(initial?.advance_payment_required ?? false);
  const [advanceAmount, setAdvanceAmount] = useState(initial?.advance_amount ?? undefined);
  const [advanceCurrency, setAdvanceCurrency] = useState(initial?.advance_currency ?? "VND");
  const [advanceNotes, setAdvanceNotes] = useState(initial?.advance_notes ?? "");
  const [additionalNotes, setAdditionalNotes] = useState(initial?.additional_notes ?? "");

  const data = {
    destination,
    purpose,
    departure_at: departureAt,
    return_at: returnAt,
    project_client: projectClient,
    transportation_required: transportationRequired,
    hotel_required: hotelRequired,
    advance_payment_required: advanceRequired,
    advance_amount: advanceRequired ? advanceAmount ?? null : null,
    advance_currency: advanceRequired ? advanceCurrency : null,
    advance_notes: advanceRequired ? advanceNotes : null,
    additional_notes: additionalNotes,
  };
  const days = calcBtDays(departureAt, returnAt);

  return (
    <div className="card !p-4 flex flex-col gap-3">
      <Field label="Destination *">
        <input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} />
      </Field>
      <Field label="Purpose of Trip *">
        <textarea className="input" rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Departure Date & Time *">
          <input
            className="input"
            type="datetime-local"
            value={departureAt}
            onChange={(e) => setDepartureAt(e.target.value)}
          />
        </Field>
        <Field label="Return Date & Time *">
          <input className="input" type="datetime-local" value={returnAt} onChange={(e) => setReturnAt(e.target.value)} />
        </Field>
      </div>
      <p className="text-sm text-ink-muted">
        Number of days: <span className="font-medium text-ink">{days}</span>
      </p>
      <Field label="Project / Client (optional)">
        <input className="input" value={projectClient} onChange={(e) => setProjectClient(e.target.value)} />
      </Field>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={transportationRequired} onChange={(e) => setTransportationRequired(e.target.checked)} />
          Transportation Required
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hotelRequired} onChange={(e) => setHotelRequired(e.target.checked)} />
          Hotel Required
        </label>
      </div>
      <Field label="Advance Payment Required">
        <select className="input" value={advanceRequired ? "yes" : "no"} onChange={(e) => setAdvanceRequired(e.target.value === "yes")}>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </Field>
      {advanceRequired && (
        <div className="grid grid-cols-2 gap-3 pl-3 border-l-2 border-border">
          <Field label="Requested Amount">
            <input
              className="input"
              type="number"
              min={0}
              value={advanceAmount ?? ""}
              onChange={(e) => setAdvanceAmount(e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
          <Field label="Currency">
            <input className="input" value={advanceCurrency ?? ""} onChange={(e) => setAdvanceCurrency(e.target.value)} />
          </Field>
          <div className="col-span-2">
            <Field label="Notes / Estimated Expenses">
              <textarea className="input" rows={2} value={advanceNotes ?? ""} onChange={(e) => setAdvanceNotes(e.target.value)} />
            </Field>
          </div>
        </div>
      )}
      <Field label="Additional Notes">
        <textarea className="input" rows={2} value={additionalNotes ?? ""} onChange={(e) => setAdditionalNotes(e.target.value)} />
      </Field>
      <Field label="Sign-off Status">
        <p className="input bg-surface-2 text-ink-muted">System-generated on submit</p>
      </Field>
      <FormActions
        saving={handlers.saving}
        submitting={handlers.submitting}
        error={handlers.error}
        onCancelEdit={handlers.onCancelEdit}
        onSaveDraft={() => handlers.onSaveDraft(data)}
        onSubmit={() => handlers.onSubmit(data)}
      />
    </div>
  );
}
