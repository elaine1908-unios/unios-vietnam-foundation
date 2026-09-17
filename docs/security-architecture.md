# User Security & Management Architecture

This documents how Performance Profiles (a.k.a. Careers and Foundation)
handles identity, authentication, authorization, and account
administration, as actually implemented in the code today. It's scoped to
the user/security surface only — see [`README.md`](../README.md) for the
rest of the app.

All server-side enforcement described here lives under `server/src/` and
is what the code actually checks on every request. The client (`web/src/`)
mirrors these rules only to drive navigation and give immediate feedback —
it is never the source of truth, and every route listed below is re-checked
server-side regardless of what the frontend shows or hides.

## 1. Identity model

There is no self-service sign-up. Every account corresponds to a real,
active row in Employee Master, matched by **Work Email** — account
creation looks the employee up by email and refuses if none is found
(`server/src/routes/users.ts` `POST /`). An account's display name is
never typed by whoever creates it; it's derived live from the linked
Employee Master record (`toPublicUser` → `computedNameFor`,
`server/src/types.ts:57-64`) so it can never drift out of sync.

**Bootstrapping the first account** is the one exception: `GET
/auth/setup-status` reports whether the `users` table is empty, and `POST
/auth/setup` (`server/src/routes/auth.ts:43-70`) creates exactly one
account at access level `owner` and permanently refuses once any account
exists. This is the only account creation path that doesn't require a
matching Employee Master row.

Every other account is created from **User Management**, which only
Admin/BOD (`user.admin` capability) can reach.

## 2. Authentication

### Password storage

- Hashed with **bcrypt** at cost 10 (`bcryptjs`, pure JS — no native
  addon to compile, same reasoning as using `node:sqlite`).
  `hashPassword` / `verifyPassword` in `server/src/auth.ts:88-94`.
- **Legacy scrypt fallback**: this app briefly hashed passwords with
  scrypt (`"saltHex:hashHex"`) before switching to bcrypt. `POST
  /auth/login` detects that shape (`isLegacyScryptHash`) and, on a
  successful legacy verify, transparently re-hashes to bcrypt so it only
  ever happens once per account (`server/src/routes/auth.ts:85-94`).
- Minimum length: 8 characters, enforced wherever a password is
  set — setup, account creation, self-service change, admin reset.
- Passwords are never logged. Every audit entry that touches a password
  writes the literal placeholders `<hidden>` → `<changed>` / `<reset>`
  instead of the value (`server/src/routes/auth.ts:178`,
  `server/src/routes/users.ts:200`).

### Sessions

- A session is a **JWT** signed with `SESSION_SECRET` (`HS256`, via
  `jsonwebtoken`), carrying only `{ sub: userId }`, 30-day expiry
  (`signSession` / `verifySession`, `server/src/auth.ts:27-42`).
- Delivered as an `httpOnly`, `sameSite=lax` cookie named `session`;
  `secure` is forced on whenever `NODE_ENV=production`
  (`server/src/routes/auth.ts:22-27`). Not readable from JS, not sent
  cross-site on a plain link/form.
- **No refresh/rotation** — the same 30-day token is reused until it
  expires or the user logs out (`POST /auth/logout` just clears the
  cookie; the JWT itself isn't invalidated server-side, since there's no
  token blocklist).
- `SESSION_SECRET` is a required env var, checked at process start —
  the server refuses to boot without it (`server/src/auth.ts:5-11`).

### Login flow

`POST /auth/login` (`server/src/routes/auth.ts:72-111`):
1. Look up by email (case-insensitive), verify password (bcrypt, with
   the legacy-scrypt fallback above).
2. Reject if the account is deactivated (`is_active = 0`).
3. If 2FA is enabled, **do not** issue a session yet — respond
   `{ requires2fa: true, temp_token }` (still HTTP 200) and wait for
   step 4 below.
4. Otherwise, set the session cookie and return the user.

If 2FA is enabled, `POST /auth/login/2fa` (`server/src/routes/auth.ts:117-140`)
takes `{ temp_token, code }`, verifies the TOTP code, and only then issues
the real session cookie. See §3 for how `temp_token` is kept from ever
being usable as a real session.

### Forced password change

Every account created by someone else — including an admin-issued
password reset — is flagged `must_change_password`. A single app-wide
gate, `forcePasswordChangeGate` (`server/src/forcePasswordChangeGate.ts`),
is mounted **after** `authRouter` and **before every other router**:
```
app.use(attachUser);
app.use("/api/auth", authRouter);       // sign-in, /me, change-password — always reachable
app.use(forcePasswordChangeGate);       // 403s everything below until password is changed
app.use("/api/users", usersRouter);
...
```
This is enforced by ordering, not a path-exemption list — anything under
`/api/auth` is simply mounted before the gate, so there's no way to add a
new router and forget to exempt it. The client mirrors this in
`RequireAuth.tsx` (the single wrapper every authenticated route passes
through), rendering a forced change-password screen instead of the
requested page.

## 3. Two-factor authentication (TOTP)

Opt-in, self-service, available to every access level. There are
**no backup codes** by design — a locked-out user is unblocked by an
Admin/BOD member disabling their 2FA (same trust model as an admin
password reset), then re-enrolling.

- **Standard**: RFC 6238 TOTP via `otplib`, 30-second step, ±1 step
  (30s) clock-drift tolerance.
- **Enrollment** (`server/src/routes/twoFactor.ts`): `POST /2fa/setup`
  generates a new secret and returns a QR code (`qrcode` →
  `data:image/png;base64,...`) plus the raw secret for manual entry.
  Nothing is enabled yet — `totp_enabled` only flips to `1` once `POST
  /2fa/confirm` verifies a real code from the app. An abandoned setup
  just leaves an inert, never-checked secret that the next setup attempt
  overwrites.
- **Disable**: `POST /2fa/disable` requires the current password — a
  hijacked-but-unlocked browser session alone can't silently turn 2FA
  off.
- **Secret storage**: `totp_secret` is encrypted at rest with
  **AES-256-GCM** (`encryptSecret`/`decryptSecret`, `server/src/auth.ts:63-84`),
  keyed by a required `TOTP_ENCRYPTION_KEY` env var (32 bytes, hex,
  checked at boot the same way `SESSION_SECRET` is). Encryption, not
  hashing, because the server must recover the plaintext secret to
  verify a live code. Stored format: `iv:authTag:ciphertext`, each
  base64. Losing/rotating this key only means everyone with 2FA enabled
  needs it disabled and re-enrolled — no other blast radius.
- **Two-phase login isolation**: the `temp_token` issued mid-login
  (§2) is a JWT signed with the *same* `SESSION_SECRET` but carrying a
  `purpose: "2fa"` claim. `verifySession` explicitly rejects any token
  with a `purpose` claim (`server/src/auth.ts:31-42`), so a temp token
  can never be replayed as a real session — verified structurally, not
  just by convention. It expires after 5 minutes.
- **Admin/BOD reset**: `POST /users/:id/reset-2fa` (Admin/BOD only, via
  `user.admin`) clears `totp_secret`/`totp_enabled` unconditionally —
  the only recovery path, since there are no backup codes. Same
  BOD-only-for-a-BOD-target rule as a password reset (below).

## 4. Authorization (RBAC)

### Access levels

Five levels, in ascending order, defined once in
`server/src/capabilities.ts`:

```
team_member → team_lead → head_of_department → admin → owner
```

### Capabilities

A capability is a specific permission string (`profile.edit`,
`employee.view`, `user.admin`, `request.manageAll`, …). Each level's
capability list is **cumulative** — built by concatenating every level
up to and including it (`ADDED_BY_LEVEL`, `CAPS_BY_LEVEL` in
`capabilities.ts:83-127`) — so a capability granted at `team_lead`
automatically flows to `head_of_department`, `admin`, and `owner` too.
There's exactly one place (`ADDED_BY_LEVEL`) that says what each level
*adds*; no level can accidentally end up missing something a lower level
has.

`owner` (branded "BOD" in the UI) holds every capability. `admin` holds
everything owner does **except** `employee.deleteAll` — the Employee
Master hard-delete "danger zone" — which is the one capability reserved
for owner alone.

### Enforcement — server is the source of truth

- **`attachUser`** (`server/src/middleware.ts:13-25`) runs on every
  request, populating `req.user` from the session cookie if valid. It
  never rejects on its own — `/api/public/*` must stay reachable with no
  user at all.
- **`requireAuth`** rejects with 401 if there's no `req.user`.
- **`requireCap(cap)`** implies `requireAuth`, and additionally 403s if
  `req.user.access_level` doesn't carry `cap`
  (`server/src/middleware.ts:39-51`). This is the only way a route
  should ever be capability-gated — every protected router mounts it
  (e.g. `usersRouter.use(requireAuth, requireCap("user.admin"))`).

### Enforcement — client mirrors it, never decides it

- `toPublicUser` (`server/src/types.ts:66-78`) computes the caller's
  effective capability list **once, server-side**, and ships it on
  `/auth/me` and every login response. The client never keeps its own
  copy of the access-level → capability table — it just reads
  `user.capabilities`.
- `RequireAuth` (`web/src/auth/RequireAuth.tsx`) is the single
  route-level wrapper: redirects to `/login` if signed out, forces the
  change-password screen if required, and redirects away if `cap` isn't
  held. This is a UX convenience (hide/disable what the user can't do,
  fail fast without a round trip) — it is not itself a security boundary,
  since the server re-checks independently on every request.

### Scoping beyond capabilities

Holding a capability doesn't always mean seeing *everything* it gates.
Two capabilities are explicitly scoped by reporting-chain membership
rather than being all-or-nothing:

- **`employee.view`** — Team Lead/Head of Department hold it too, but
  `employeeScopeFor()` (`server/src/routes/employees.ts:128-150`)
  restricts what they get back to their own reporting chain
  (recursive — reports of reports, computed via a `WITH RECURSIVE`
  query), plus themselves. Owner/Admin get `ids: null` (unrestricted).
  On top of that, a scoped viewer's employee records come back with a
  fixed set of sensitive fields redacted to `null` — ID/passport
  numbers, bank details, health insurance, addresses, emergency contact
  (`REDACTED_FIELDS`, `server/src/routes/employees.ts:87-100`) — even
  though the row itself is visible.
- **`request.manageAll`** (the "Manage AL, OT & BT" page) — Head of
  Department and up. Reuses the exact same `employeeScopeFor` scope as
  Employee Master, so "who can see whose leave/OT/BT summary" and "who
  can see whose HR record" are always the same set by construction,
  not two rules that could drift apart.
- **`request.import`** (bulk historical-request import) is narrower
  still — added only at the `admin` tier, so Head of Department never
  gets it even though they hold `request.manageAll`.

### Privilege-escalation guards (BOD-only-for-a-BOD-target)

A recurring rule across `server/src/routes/users.ts` and
`server/src/routes/requests.ts`: **only an existing `owner` may act on
another `owner`-level account or grant `owner` access.** Concretely:

| Action | Guard |
|---|---|
| Create an account at `owner` level | 403 unless the requester is already `owner` |
| Promote an existing account to `owner` (`PATCH /users/:id`) | 403 unless the requester is already `owner` |
| Reset an `owner`-level account's password | 403 unless the requester is already `owner` |
| Reset an `owner`-level account's 2FA | 403 unless the requester is already `owner` |

Without this, an `admin` (who otherwise holds `user.admin` and can
manage every other account) could self-promote to `owner`, or take over
an `owner` account by resetting its password/2FA — this is exactly the
privilege-escalation path a prior security review found and fixed. There's
also a standing floor: at least one **active** `owner` must always
remain — both demoting the last active owner (`PATCH`) and deactivating
them (`DELETE`) are refused (`countActiveOwners`,
`server/src/routes/users.ts:21-29, 135-138, 156-159`).

Account deactivation is a **soft delete** (`is_active = 0`), never a hard
delete — every profile/role/request/audit row references a user by id
via `created_by`/`updated_by`/`changed_by`. Nobody can deactivate their
own account, including an owner.

## 5. Audit logging

Every account lifecycle event writes to `audit_log`
(`server/src/audit.ts`): created, access-level changed, deactivated,
reactivated, password reset, 2FA enabled/disabled/reset, imported. Each
row is `entity_type` + `entity_id` + `action` + `changed_by` +
`changed_at`, plus an optional `field_name`/`old_value`/`new_value` for
field-level changes. Password values are never recorded — only the
`<hidden>` → `<changed>`/`<reset>` placeholder. The full log (filterable
by entity type) is at **Audit Log**, gated by `user.admin` (Admin/BOD
only) — `server/src/routes/audit.ts`.

## 6. Public / unauthenticated surface

`attachUser` runs globally but never rejects, so exactly one route tree
is reachable while signed out: `/api/public/*`
(`server/src/routes/public.ts`), which re-checks visibility on every
request itself (only Job Descriptions explicitly flagged "Now Hiring",
dropped immediately if archived) rather than trusting anything cached.
Nothing else in the API is reachable without a valid session.

## 7. Required secrets

Both are validated at process boot — the server throws and refuses to
start if either is missing or malformed, the same pattern in both cases
(`server/src/auth.ts:5-25`):

| Env var | Purpose | Format | Losing it |
|---|---|---|---|
| `SESSION_SECRET` | Signs session cookies and 2FA temp tokens (JWT `HS256`) | long random string | Every session invalidates; everyone signs in again |
| `TOTP_ENCRYPTION_KEY` | Encrypts stored TOTP secrets at rest (AES-256-GCM) | 32 bytes, hex (64 hex chars) | Everyone with 2FA enabled needs an admin reset + re-enrollment |

## 8. Known gaps / non-goals

Documented honestly rather than silently — this is an internal tool
behind a login wall with a small, known user base, so these are
accepted trade-offs, not oversights to be alarmed by:

- **No login rate-limiting or account lockout** after repeated failed
  password attempts.
- **No CSRF token** — relies on the session cookie being `httpOnly` +
  `sameSite=lax` plus every mutating request requiring a JSON
  `Content-Type` (which a plain cross-site form post can't set), rather
  than an explicit per-request CSRF token.
- **No session revocation list** — a stolen session JWT is valid for the
  rest of its 30-day life; there's no server-side "log out everywhere."
  Rotating `SESSION_SECRET` invalidates *every* session at once, as the
  only lever available.
- **No backup codes for 2FA** — deliberate (§3), not an oversight, but
  worth restating: recovery always requires an Admin/BOD member.

## Quick reference — where things live

| Concern | File |
|---|---|
| Password hashing, session JWTs, 2FA crypto | `server/src/auth.ts` |
| `attachUser` / `requireAuth` / `requireCap` | `server/src/middleware.ts` |
| Access levels & capability table | `server/src/capabilities.ts` |
| Login, setup, self-service password change | `server/src/routes/auth.ts` |
| 2FA enroll/confirm/disable | `server/src/routes/twoFactor.ts` |
| Account admin (create/promote/deactivate/reset) | `server/src/routes/users.ts` |
| Forced password-change gate | `server/src/forcePasswordChangeGate.ts` |
| Employee-data scoping & field redaction | `server/src/routes/employees.ts` (`employeeScopeFor`) |
| Audit log write/read | `server/src/audit.ts`, `server/src/routes/audit.ts` |
| Public unauthenticated routes | `server/src/routes/public.ts` |
| `PublicUser` shape / capability list per user | `server/src/types.ts` |
| Client-side route gating | `web/src/auth/RequireAuth.tsx`, `web/src/auth/AuthProvider.tsx` |
