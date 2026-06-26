import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, otpsTable } from "@workspace/db";
import { SendOtpBody, VerifyOtpBody, RegisterBody } from "@workspace/api-zod";

const router: IRouter = Router();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/[()-]/g, "");
}

function isEmail(identifier: string): boolean {
  return identifier.includes("@");
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
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const identifier = parsed.data.identifier.trim();
  let phone: string;

  if (isEmail(identifier)) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, identifier.toLowerCase()))
      .limit(1);

    if (!user || !user.phone) {
      res.status(404).json({ error: "No account found with this email address" });
      return;
    }
    phone = user.phone;
  } else {
    phone = normalizePhone(identifier);
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.insert(otpsTable).values({ phone, code, expiresAt });

  res.json({
    success: true,
    message: "OTP sent",
    phone,
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

  await db.update(otpsTable).set({ used: true }).where(eq(otpsTable.id, otp.id));

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, phone))
    .limit(1);

  if (!user) {
    // Phone verified but no account — frontend should show sign-up form
    res.json({ success: true, isNewUser: true });
    return;
  }

  if (!user.phoneVerified) {
    await db.update(usersTable).set({ phoneVerified: true }).where(eq(usersTable.id, user.id));
  }

  req.session.userId = user.id;
  req.session.phone = phone;

  res.json({ success: true, user: serializeUser(user), isNewUser: false });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, phone: rawPhone, email, gender, age, profession, code } = parsed.data;
  const phone = normalizePhone(rawPhone);

  // Verify OTP
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
    res.status(401).json({ error: "Invalid or expired code. Please request a new one." });
    return;
  }

  // Check phone not already registered
  const [existingPhone] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, phone))
    .limit(1);

  if (existingPhone) {
    res.status(400).json({ error: "This phone number is already registered. Please sign in." });
    return;
  }

  // Check email not already taken
  if (email) {
    const [existingEmail] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (existingEmail) {
      res.status(400).json({ error: "This email is already registered. Please sign in." });
      return;
    }
  }

  await db.update(otpsTable).set({ used: true }).where(eq(otpsTable.id, otp.id));

  const [user] = await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      phone,
      email: email ? email.toLowerCase() : undefined,
      gender: gender ?? undefined,
      age: age ?? undefined,
      profession: profession ?? undefined,
      phoneVerified: true,
    })
    .returning();

  req.session.userId = user.id;
  req.session.phone = phone;

  res.status(201).json({ success: true, user: serializeUser(user) });
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
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

export default router;
