import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, eventsTable, attendancesTable } from "@workspace/db";
import {
  CreateUserBody,
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  GetUserHostedEventsParams,
  GetUserJoinedEventsParams,
  VerifyUserParams,
  VerifyUserBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeUser(
  user: typeof usersTable.$inferSelect,
  hostedCount = 0,
  joinedCount = 0
) {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    verifiedAt: user.verifiedAt?.toISOString() ?? null,
    eventsHosted: hostedCount,
    eventsJoined: joinedCount,
  };
}

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.insert(usersTable).values(parsed.data).returning();
  res.status(201).json(serializeUser(user));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [{ hostedCount }] = await db
    .select({ hostedCount: sql<number>`cast(count(*) as int)` })
    .from(eventsTable)
    .where(eq(eventsTable.hostId, user.id));

  const [{ joinedCount }] = await db
    .select({ joinedCount: sql<number>`cast(count(*) as int)` })
    .from(attendancesTable)
    .where(eq(attendancesTable.userId, user.id));

  res.json(serializeUser(user, hostedCount, joinedCount));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [{ hostedCount }] = await db
    .select({ hostedCount: sql<number>`cast(count(*) as int)` })
    .from(eventsTable)
    .where(eq(eventsTable.hostId, user.id));

  const [{ joinedCount }] = await db
    .select({ joinedCount: sql<number>`cast(count(*) as int)` })
    .from(attendancesTable)
    .where(eq(attendancesTable.userId, user.id));

  res.json(serializeUser(user, hostedCount, joinedCount));
});

router.post("/users/:id/verify", async (req, res): Promise<void> => {
  const params = VerifyUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = VerifyUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({
      verified: true,
      verifiedAt: new Date(),
      verificationSelfieUrl: parsed.data.selfieObjectPath,
    })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [{ hostedCount }] = await db
    .select({ hostedCount: sql<number>`cast(count(*) as int)` })
    .from(eventsTable)
    .where(eq(eventsTable.hostId, user.id));

  const [{ joinedCount }] = await db
    .select({ joinedCount: sql<number>`cast(count(*) as int)` })
    .from(attendancesTable)
    .where(eq(attendancesTable.userId, user.id));

  res.json(serializeUser(user, hostedCount, joinedCount));
});

router.get("/users/:id/hosted", async (req, res): Promise<void> => {
  const params = GetUserHostedEventsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const events = await db.select().from(eventsTable).where(eq(eventsTable.hostId, params.data.id));

  const result = await Promise.all(
    events.map(async (event) => {
      const [host] = await db.select().from(usersTable).where(eq(usersTable.id, event.hostId));
      const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(attendancesTable)
        .where(eq(attendancesTable.eventId, event.id));

      return {
        ...event,
        createdAt: event.createdAt.toISOString(),
        hostName: host?.name ?? null,
        hostAvatar: host?.avatarUrl ?? null,
        attendeeCount: count,
      };
    })
  );

  res.json(result);
});

router.get("/users/:id/joined", async (req, res): Promise<void> => {
  const params = GetUserJoinedEventsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({ event: eventsTable })
    .from(attendancesTable)
    .innerJoin(eventsTable, eq(attendancesTable.eventId, eventsTable.id))
    .where(eq(attendancesTable.userId, params.data.id));

  const result = await Promise.all(
    rows.map(async ({ event }) => {
      const [host] = await db.select().from(usersTable).where(eq(usersTable.id, event.hostId));
      const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(attendancesTable)
        .where(eq(attendancesTable.eventId, event.id));

      return {
        ...event,
        createdAt: event.createdAt.toISOString(),
        hostName: host?.name ?? null,
        hostAvatar: host?.avatarUrl ?? null,
        attendeeCount: count,
      };
    })
  );

  res.json(result);
});

export default router;
