-- Contract Information — plain fields, same pattern as everything else on
-- this table (no separate contract history table; a renewal or contract
-- type change just overwrites these, same as e.g. Department did before the
-- Career Map link existed).
ALTER TABLE employees ADD COLUMN contract_type TEXT;
ALTER TABLE employees ADD COLUMN contract_length TEXT;
ALTER TABLE employees ADD COLUMN contract_no TEXT;
ALTER TABLE employees ADD COLUMN contract_start_date TEXT;
ALTER TABLE employees ADD COLUMN contract_end_date TEXT;
