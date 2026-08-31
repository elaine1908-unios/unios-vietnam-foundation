import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { runMigrations } from "./migrate.js";
import { hashPassword } from "./auth.js";
import { newId } from "./ids.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DB_PATH ?? "./data/profiles.db";
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

runMigrations(db, join(__dirname, "migrations"));

// There's no self-service sign-up anymore (accounts are created manually by
// a Team Lead), which is a chicken-and-egg problem for the very first
// account. So: if the users table is empty and INITIAL_ADMIN_EMAIL/PASSWORD
// are set, seed one Team Lead on boot. No-ops on every later restart once a
// user exists.
const userCount = (db.prepare("SELECT COUNT(*) as n FROM users").get() as { n: number }).n;
if (userCount === 0 && process.env.INITIAL_ADMIN_EMAIL && process.env.INITIAL_ADMIN_PASSWORD) {
  db.prepare(
    "INSERT INTO users (id, name, email, role, password_hash, title) VALUES (?, ?, ?, 'team_lead', ?, 'Owner')",
  ).run(
    newId(),
    process.env.INITIAL_ADMIN_NAME?.trim() || "Admin",
    process.env.INITIAL_ADMIN_EMAIL.trim().toLowerCase(),
    hashPassword(process.env.INITIAL_ADMIN_PASSWORD),
  );
  console.log(`Bootstrapped initial Owner account: ${process.env.INITIAL_ADMIN_EMAIL}`);
}

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
