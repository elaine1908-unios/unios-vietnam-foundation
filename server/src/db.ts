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
export function transaction<T extends unknown[], R>(fn: (...args: T) => R): (...args: T) => R {
  return (...args: T) => {
    db.exec("BEGIN");
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
