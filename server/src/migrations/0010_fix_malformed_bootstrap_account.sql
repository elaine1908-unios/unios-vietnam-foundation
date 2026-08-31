-- A Railway variable was pasted as "INITIAL_ADMIN_EMAIL=elaine@unios.com"
-- into the value field (instead of just "elaine@unios.com"), so the
-- bootstrap account got created with a malformed email/name. Since the
-- bootstrap in db.ts only fires when the users table is empty, delete that
-- one malformed row so the next boot (with the Railway variables corrected)
-- re-bootstraps a clean account instead of being stuck forever.
DELETE FROM users WHERE email LIKE '=%';
