# Performance Profiles

An internal tool for Unios team leads to build and maintain **Job Performance Profiles** — the same document structured in `PP Site.pdf` (Senior Site Engineer) — and for team members to browse, view, and download a locked, watermarked copy.

A Performance Profile is defined **per job title/role** (e.g. "Senior Site Engineer"), not per named employee — matching how the source document is structured: responsibilities, essential requirements, OKRs, competencies, and C&B policy are defined at the role level, and everyone holding that role is measured against the same profile.

## Architecture

- **`server/`** — Node.js + Express + TypeScript API, backed by SQLite (Node's built-in `node:sqlite`, no native dependency to compile). Owns auth (Microsoft/Entra ID SSO), role-based permission checks, the audit trail, and PDF generation.
- **`web/`** — React + TypeScript frontend (Vite, Tailwind, TanStack Query), talking to the API at `/api/*`. Same design system (colors, Mark Pro typeface) as the `po-so-tracker` app, so the two internal tools read as one system.
- **root `package.json`** — orchestrates both: `npm run build` builds web then server, `npm start` runs the one production process.

In production the Express server also serves the built frontend, so the whole app is **one process on one port**.

**Roles**, enforced server-side (not just hidden in the UI — every write route checks the caller's role regardless of what the frontend shows):
- **Team Lead** — create/edit/archive Job Profiles and Job Descriptions, manage users (promote/demote, deactivate), manage the Career Map.
- **Team Member** — read-only: browse, search, view, download the watermarked Job Profile PDF, and view/download Job Descriptions (not watermarked — those are meant to be shared externally).
- **Public / logged out** — the one unauthenticated surface: `/careers`, showing only Job Descriptions a Team Lead has flagged **Now Hiring**. See "Public careers page" below.

Whoever signs in first (via Microsoft SSO) is automatically made a Team Lead — same idea as a one-time setup screen, just folded into SSO instead of a separate step. Every account after that starts as Team Member; a Team Lead promotes people from there (User Management screen).

## 1. Set up Microsoft sign-in (Azure AD / Entra ID)

The app uses your company's existing Microsoft 365 sign-in — team leads and team members log in with their normal Unios account, no separate password to manage.

1. Go to [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Name it (e.g. "Performance Profiles"), leave the default account type, and set the **Redirect URI** (platform: **Web**) to `{APP_BASE_URL}/api/auth/callback` — e.g. `http://localhost:4000/api/auth/callback` for local dev, or `https://your-deployed-url/api/auth/callback` in production.
3. From the app's **Overview** page, copy the **Application (client) ID** and **Directory (tenant) ID**.
4. Go to **Certificates & secrets** → **New client secret**, and copy its **Value** (not the ID — it's only shown once).
5. Put these into `server/.env` (see below).

No API permissions need to be added beyond the default `openid`/`profile`/`email` — the app only needs to know who signed in, not access anything else in Microsoft 365.

## 2. Configure the server

```bash
cd server
cp .env.example .env
```

Open `.env` and fill in:
- `SESSION_SECRET` — a long random string (e.g. `openssl rand -hex 32`)
- `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` — from step 1
- `APP_BASE_URL` — must match the Redirect URI you registered

`DB_PATH` defaults to `./data/profiles.db` — a single file created automatically on first run; back it up like any file.

**Trying it out before Azure AD is set up:** set `DEV_LOGIN=true` in `.env`. This adds a "sign in as any name/email, no password" option on the login page — useful for local development, but **must never be set in production** (there's no password check at all).

**Grammar scanning and English translation** need `ANTHROPIC_API_KEY` set (get one at [console.anthropic.com](https://console.anthropic.com), pay-per-use). Both features degrade gracefully without it — the grammar scan just doesn't block saving, and the English view/PDF shows a clear error with the original content instead of crashing. `ANTHROPIC_MODEL` optionally overrides the default (Haiku 4.5).

## 3. Run it

Two terminals for local development:

```bash
# terminal 1
cd server && npm install && npm run dev      # API on http://localhost:4000

# terminal 2
cd web && npm install && npm run dev         # frontend on http://localhost:5173, proxies /api to the server
```

Open `http://localhost:5173`. Sign in with Microsoft (or, with `DEV_LOGIN=true`, the dev login form) — the first account becomes Team Lead automatically.

For a real deployment, build both and run one process from the repo root:

```bash
npm run build   # builds web, then server
npm start        # serves the API and the built frontend together on $PORT
```

## Feature notes

**Job Profiles** — full CRUD for Team Leads: general info (job title, rank, division, function, location, last updated — defaults to today when creating a new profile, still freely editable), Key Responsibilities (main function / responsibilities / success criteria, all long text, any number of rows), Essential Requirements (numbered list), OKRs (objective / key results), Compensation & Benefits, and Competencies (skill / level / requirement). Team Members get the same sections read-only, styled to match the source document, plus an Audit Trail at the bottom of every profile (who created/updated/archived/restored it, and when).

**Search, sort, filter** — the Profiles list searches by job title, rank, division, function, or location; can be filtered down to one division and/or one function via dropdowns (populated from what's actually in use); and every column header is clickable to sort (click again to reverse). Team Leads can toggle "Include archived."

**Archive, not delete** — a Team Lead "removes" a profile by archiving it (hidden from the default list, restorable anytime). Nothing is ever hard-deleted, since profiles may be referenced by past PDF downloads and audit history.

**Watermarked PDF export** (`GET /api/profiles/:id/pdf`) — any signed-in user can generate a PDF styled to match the source document (brand colors, Mark Pro typeface, bilingual section headers), with a tiled diagonal watermark and a footer line naming who downloaded it and when. This is what makes the profile "locked": Team Members can always get a current copy to print, but every copy is traceably theirs. Every download is logged to `pdf_downloads` (who, which profile, when).

**Audit trail** — every profile create/update/archive/restore, and every user role change/deactivation, is logged to `audit_log` (who, what, when).

**User Management** (Team Lead only) — promote/demote between Team Lead and Team Member, deactivate/reactivate accounts. A Team Lead can't demote themselves if they're the only one left, and can't deactivate their own account — both guarded server-side.

**Career Map** — the master list of Unios Vietnam role titles (division → function → rank tier → role name), seeded from `Career Map_Draft.pdf`. Drives the "Job title" dropdown on the Job Profile form: picking a role auto-fills Rank, Division, and Function from the map, or a team lead can fall back to a free-text title for a role not yet listed. Team Leads manage the list itself at **Career Map** in the nav (add/rename/archive) — no code changes or new migration needed for routine additions, only the original seed came from a migration.

Each Job Profile created from the dropdown stores a link (`career_map_role_id`) to the Career Map role it came from — shown on the profile's detail page. This link is for traceability, **not** a live mirror: if the Career Map role is later renamed, existing profiles keep their own saved title/rank/department exactly as last saved (the detail page just notes the role's current name differs). A team lead can always re-select the role on the edit form to pull in its current values. The Career Map page shows how many active profiles reference each role and asks for confirmation before archiving a role that's still in use (archiving never touches the profiles themselves — it only removes the role from the dropdown for new ones).

**Job Descriptions** — candidate-facing recruitment postings, separate from the internal Job Profile. A Job Description is just a Job Profile + a Location: its role content (job title, key responsibilities — main function and responsibilities only, **not** the internal success criteria — essential requirements, and competencies) is pulled **live** from the linked profile every time it's viewed or downloaded, so a posting never goes stale when the underlying profile is revised. Everything else (the recruitment tagline, intro paragraph, working hours, and benefits list) is fixed company boilerplate, the same on every Job Description — see `JD_COPY` in `web/src/lib/jobDescriptionContent.ts` (kept in sync with the equivalent constants in `server/src/pdf/JobDescriptionDocument.tsx`, which generates the PDF). Unlike the Job Profile PDF, the Job Description PDF carries **no watermark or confidentiality notice** — it's meant to be shared externally with candidates.

**Public careers page** (`/careers`, no login) — the one unauthenticated surface in the app. Lists only Job Descriptions a Team Lead has flagged **Now Hiring** (off by default on every new one); archiving a Job Description or its underlying Job Profile immediately drops it from public view too. Served by `server/src/routes/public.ts`, which re-checks visibility on every route itself rather than trusting anything cached — it shares the same detail/PDF/translation logic as the authenticated Job Descriptions API, just re-gated instead of requiring a session.

**Grammar scan** — clicking Save on a Job Profile or a Job Description runs an advisory (non-blocking) scan over the text via Claude: if it flags anything, Save turns into "Save anyway" and shows the issues instead of saving on the first click; a second click saves regardless. A Job Description's scan covers its linked Job Profile's candidate-facing content (responsibilities minus success criteria, requirements, competency requirements) plus its Location, since that's what actually gets published.

**English translation** — every Job Profile detail page (and, by extension, every Job Description, which reuses its linked profile's translation) has a Tiếng Việt/English toggle. The English version is machine-translated via Claude on first request and cached (`job_profile_translations`, keyed by profile) — a "Retranslate" link on the profile page forces regeneration, and the page flags when a cached translation is older than the profile's last edit. The fixed Job Description boilerplate is a human translation, not machine-generated, since it's static content unrelated to any specific profile.

## Data model

- `users` — id, name, email, role (`team_lead` | `team_member`), is_active
- `career_map_roles` — division, function (nullable — blank for a division's "Head of X" role), rank (`core`/`specialists`/`leadership`/`divisional`), role_name, is_archived
- `job_profiles` — one row per role/position: `job_title`, `rank`, `division`, `function` (separate fields — auto-filled from the linked Career Map role but independently editable), `location`, `last_updated`, `compensation`/`benefits`/`bonuses` text, `is_archived`
- `profile_responsibilities`, `profile_requirements`, `profile_okrs`, `profile_competencies` — child rows, ordered by `sort_order`, fully replaced on every save (simplest correct approach for a form that edits whole sections at once)
- `job_descriptions` — `job_profile_id` (FK), `location`, `is_now_hiring` (drives public visibility), `is_archived`; no role content of its own — always joined live to the linked profile
- `job_profile_translations` — one row per profile, `content_json` (the whole translated shape as a blob — it's read-only derived output, never queried field-by-field), `source_updated_at` (to detect staleness), `translated_at`/`translated_by`
- `audit_log` — entity_type/entity_id/action/changed_by/changed_at
- `pdf_downloads` — job_profile_id/user_id/downloaded_at (Job Profile downloads only — Job Descriptions aren't locked, so their downloads aren't logged)

Schema lives in `server/src/migrations/` as numbered SQL files, tracked in a `schema_migrations` table so upgrading a live database never requires deleting it.

## Deploying (Railway)

The app is a single Node process that needs one thing a typical serverless platform won't give you for free: a persistent disk, since the database is a SQLite file. [Railway](https://railway.app) (or [Render](https://render.com)) both support this cleanly — same approach as `po-so-tracker`.

1. **Create the Railway project** — connect this repo via GitHub, or `railway up` from the repo root with the Railway CLI.
2. **Attach a Volume**, mounted at `/data`. This is what makes the database survive redeploys.
3. **Set environment variables**: `SESSION_SECRET`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `APP_BASE_URL` (the Railway-assigned URL, or your custom domain), `DB_PATH=/data/profiles.db`, `NODE_ENV=production`, and `ANTHROPIC_API_KEY` if you want grammar scanning/translation live. Leave `DEV_LOGIN` unset.
4. **Update the Azure AD app registration's Redirect URI** to match the deployed `APP_BASE_URL` once you know it.
5. **Deploy.** First sign-in on the live URL bootstraps the first Team Lead automatically.
