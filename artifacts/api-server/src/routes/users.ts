import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, eventsTable, attendancesTable } from "@workspace/db";
import { CreateUserBody, GetUserParams, GetUserHostedEventsParams, GetUserJoinedEventsParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.insert(usersTable).values(parsed.data).returning();
  res.status(201).json({ ...user, createdAt: user.createdAt.toISOString(), eventsHosted: 0, eventsJoined: 0 });
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

  res.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    eventsHosted: hostedCount,
    eventsJoined: joinedCount,
  });
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
