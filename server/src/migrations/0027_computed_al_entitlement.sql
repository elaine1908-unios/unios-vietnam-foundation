-- Annual Leave entitlement is now computed from tenure (commencement_date)
-- instead of a manually-set flat number — see computeAlEntitlementDays in
-- alEntitlement.ts. The stored value can never be recomputed automatically
-- as tenure crosses a threshold, so keeping a column here would just go
-- stale; every read site now derives it live instead.
ALTER TABLE employees DROP COLUMN annual_leave_entitlement_days;
