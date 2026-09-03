import type { Request, Response, NextFunction } from "express";

// Mounted globally, AFTER authRouter and BEFORE every other router (see
// index.ts). That ordering alone is what keeps sign-in, "read my profile",
// and "set my password" reachable while everything else 403s: those all
// live under /api/auth, which sits earlier in the middleware chain and so
// never reaches this gate at all — no path-exemption list to maintain here.
//
// App-level rather than per-route: a shared starter password is usually
// public knowledge inside a team, so this has to block the whole API, not
// just the routes someone remembered to protect.
export function forcePasswordChangeGate(req: Request, res: Response, next: NextFunction) {
  if (req.user?.must_change_password) {
    res.status(403).json({
      error: "You must set a new password before continuing.",
      code: "must_change_password",
    });
    return;
  }
  next();
}
