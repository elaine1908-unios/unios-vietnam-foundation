-- "Issued At" turned out not to be a field HR actually needs — dropped
-- outright (rather than left dormant) since it was never populated in
-- earnest and carries no historical data worth preserving.
ALTER TABLE employees DROP COLUMN issued_at;
