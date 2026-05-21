import type { NextFunction, Request, Response } from "express";

/** Enforces admin-only access for privileged endpoints like /v1/audit. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.authContext) {
    return res.status(401).json({ error: "missing auth context" });
  }
  if (req.authContext.role !== "admin") {
    return res.status(403).json({ error: "admin role required" });
  }
  return next();
}
