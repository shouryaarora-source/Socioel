import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, otpsTable } from "@workspace/db";
import { z } from "zod/v4";

const router: IRouter = Router();

const SendOtpBody = z.object({ phone: z.string().min(7) });
const VerifyOtpBody = z.object({ phone: z.string().min(7), code: z.string().length(6) });

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/[()-]/g, "");
}

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    verifiedAt: user.verifiedAt?.toISOString() ?? null,
  };
}

router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }

  const phone = normalizePhone(parsed.data.phone);
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(otpsTable).values({ phone, code, expiresAt });

  // In production, send SMS here (Twilio, etc.)
  // For now, return code in dev mode so the UI can display it
  res.json({
    success: true,
    message: "OTP sent",
    ...(process.env["NODE_ENV"] !== "production" && { devCode: code }),
  });
});

router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const phone = normalizePhone(parsed.data.phone);
  const { code } = parsed.data;

  const [otp] = await db
    .select()
    .from(otpsTable)
    .where(
      and(
        eq(otpsTable.phone, phone),
        eq(otpsTable.code, code),
        eq(otpsTable.used, false),
        gt(otpsTable.expiresAt, new Date()),
      )
    )
    .orderBy(otpsTable.createdAt)
    .limit(1);

  if (!otp) {
    res.status(401).json({ error: "Invalid or expired code" });
    return;
  }

  // Mark OTP as used
  await db.update(otpsTable).set({ used: true }).where(eq(otpsTable.id, otp.id));

  // Find or create user by phone
  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, phone))
    .limit(1);

  if (!user) {
    const [created] = await db
      .insert(usersTable)
      .values({ name: phone, phone, phoneVerified: true })
      .returning();
    user = created;
  } else if (!user.phoneVerified) {
    const [updated] = await db
      .update(usersTable)
      .set({ phoneVerified: true })
      .where(eq(usersTable.id, user.id))
      .returning();
    user = updated;
  }

  // Store in session
  req.session.userId = user.id;
  req.session.phone = phone;

  res.json({ success: true, user: serializeUser(user) });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));

  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(serializeUser(user));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.json({ success: true });
  });
});

export default router;
