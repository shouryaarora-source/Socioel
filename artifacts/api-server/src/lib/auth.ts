import type { Request, Response } from "express";

export function getSessionUserId(req: Request): number | null {
  return req.session.userId ?? null;
}

export function requireUserId(req: Request, res: Response): number | null {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}
