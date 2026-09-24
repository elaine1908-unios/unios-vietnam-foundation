import type { Request, Response, NextFunction } from "express";

// Mounted globally, AFTER authRouter + forcePasswordChangeGate + the /2fa
// router itself, and BEFORE every other router (see index.ts). That
// ordering is what keeps sign-in, "set my password", and the 2FA setup
// routes reachable while everything else 403s — same shape as
// forcePasswordChangeGate.ts, just one step later since you have to fix
// your password before setting up 2FA (a fresh account's temp password
// isn't something to build a second factor on top of).
//
// Gates on `must_setup_2fa && !has_2fa` rather than the raw column: an
// account that's had must_setup_2fa set (new account, password reset, or
// the one-time rollout — see migrations/0028_force_2fa_setup.sql) but
// already has 2FA enabled from before has nothing left to do, so it isn't
// blocked just because the column wasn't explicitly cleared for it.
export function force2faSetupGate(req: Request, res: Response, next: NextFunction) {
  if (req.user?.must_setup_2fa && !req.user.has_2fa) {
    res.status(403).json({
      error: "You must set up two-factor authentication before continuing.",
      code: "must_setup_2fa",
    });
    return;
  }
  next();
}
