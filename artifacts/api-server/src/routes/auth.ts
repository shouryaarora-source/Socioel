import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db, usersTable } from "@workspace/db";
import { LoginBody, RegisterBody } from "@workspace/api-zod";

const router: IRouter = Router();

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
  if (hashedBuf.length !== suppliedBuf.length) return false;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/[()-]/g, "");
}

function isEmail(identifier: string): boolean {
  return identifier.includes("@");
}

function regenerateSession(req: { session: { regenerate: (cb: (err?: unknown) => void) => void } }): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

function serializeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return {
    ...rest,
    createdAt: user.createdAt.toISOString(),
    verifiedAt: user.verifiedAt?.toISOString() ?? null,
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, phone: rawPhone, email, gender, age, profession, password } = parsed.data;

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const phone = normalizePhone(rawPhone);

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
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .limit(1);

    if (existingEmail) {
      res.status(400).json({ error: "This email is already registered. Please sign in." });
      return;
    }
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      phone,
      email: email ? email.trim().toLowerCase() : undefined,
      gender: gender ?? undefined,
      age: age ?? undefined,
      profession: profession ?? undefined,
      passwordHash,
    })
    .returning();

  await regenerateSession(req);
  req.session.userId = user.id;
  req.session.phone = phone;

  res.status(201).json({ success: true, user: serializeUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const identifier = parsed.data.identifier.trim();
  const { password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      isEmail(identifier)
        ? eq(usersTable.email, identifier.toLowerCase())
        : eq(usersTable.phone, normalizePhone(identifier))
    )
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid phone/email or password." });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid phone/email or password." });
    return;
  }

  await regenerateSession(req);
  req.session.userId = user.id;
  req.session.phone = user.phone ?? undefined;

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
    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  });
});

export default router;
