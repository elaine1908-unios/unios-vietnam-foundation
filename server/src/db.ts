import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { runMigrations } from "./migrate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DB_PATH ?? "./data/profiles.db";
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
// Without this, SQLite's default busy_timeout is 0 — a second concurrent
// write (two people submitting/approving/deciding at once, which now
// happens routinely with real usage) fails immediately with
// SQLITE_BUSY/"database is locked" instead of waiting briefly for the
// first write to finish. That surfaces to the user as a bare "Something
// went wrong on the server." with no indication anything was actually
// wrong with their request — a real request retried a moment later would
// have gone through fine. 5s comfortably covers this app's write
// transactions, which are all short (single-row updates, no long scans).
db.exec("PRAGMA busy_timeout = 5000");

runMigrations(db, join(__dirname, "migrations"));

// There's no self-service sign-up (accounts are created by an Owner), which
// is a chicken-and-egg problem for the very first account — solved by
// routes/auth.ts's POST /setup, a one-time endpoint that only works while
// this table is empty, rather than an env-var seeded on boot.

// node:sqlite's DatabaseSync has no built-in .transaction() helper, so this
// wraps a callback in BEGIN/COMMIT with rollback-on-throw.
//
// BEGIN IMMEDIATE, not plain BEGIN (which defers taking a lock until the
// transaction's first write) — a plain BEGIN lets two concurrent
// transactions both read the same "current count" before either commits,
// then both try to write based on that same stale count. That's exactly
// what generated a duplicate `requests.request_code` under real concurrent
// submissions (a "check-then-write" race in generateRequestCode). BEGIN
// IMMEDIATE takes the write lock up front, so a second transaction's own
// BEGIN IMMEDIATE simply waits (via the busy_timeout above) for the first
// to fully commit before it ever runs its own read — it can't observe
// stale data mid-race the way a deferred transaction can.
export function transaction<T extends unknown[], R>(fn: (...args: T) => R): (...args: T) => R {
  return (...args: T) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn(...args);
      db.exec("COMMIT");
      return result;
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  };
}

// A second, independent line of defense for "count existing rows, then
// claim the next sequential code" patterns (generateRequestCode,
// generateEmployeeCode), on top of transaction()'s BEGIN IMMEDIATE above.
// BEGIN IMMEDIATE alone turned out not to be enough in production — the
// exact same "UNIQUE constraint failed" crash it was meant to prevent
// still happened on the live deployment (whatever the underlying cause —
// unclear from here whether it's the storage layer not honoring SQLite's
// locking the way local testing showed, multiple replicas, or something
// else). Rather than depend on getting that guarantee right, this instead
// tolerates the conflict: `fn` runs inside its own fresh transaction (so a
// failed attempt is fully rolled back, nothing partially applied), and if
// it fails specifically on the unique code column, it's retried — the
// retry naturally recomputes a fresh code against post-conflict state,
// since `fn` re-reads the current count itself rather than reusing a
// stale value. Only retries on that specific conflict; any other error
// (validation, a real FK issue, etc.) still surfaces immediately.
export function transactionWithConflictRetry<R>(fn: () => R, conflictMessageIncludes: string, maxAttempts = 5): R {
  const run = transaction(fn);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return run();
    } catch (err) {
      const isConflict = err instanceof Error && err.message.includes(conflictMessageIncludes);
      if (!isConflict || attempt === maxAttempts) throw err;
    }
  }
  // Unreachable — the loop above always either returns or throws.
  throw new Error("transactionWithConflictRetry: exhausted attempts without returning or throwing.");
}
