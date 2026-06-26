import { Router, type IRouter } from "express";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, notificationsTable, usersTable, eventsTable } from "@workspace/db";
import { requireUserId } from "../lib/auth";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (userId == null) return;

  const rows = await db
    .select({
      n: notificationsTable,
      actorName: usersTable.name,
      actorAvatar: usersTable.avatarUrl,
      eventTitle: eventsTable.title,
    })
    .from(notificationsTable)
    .leftJoin(usersTable, eq(notificationsTable.actorId, usersTable.id))
    .leftJoin(eventsTable, eq(notificationsTable.eventId, eventsTable.id))
    .where(eq(notificationsTable.recipientId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  const result = rows.map(({ n, actorName, actorAvatar, eventTitle }) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.readAt != null,
    createdAt: n.createdAt.toISOString(),
    actorId: n.actorId,
    actorName: actorName ?? null,
    actorAvatar: actorAvatar ?? null,
    eventId: n.eventId,
    eventTitle: eventTitle ?? null,
  }));

  res.json(result);
});

router.get("/notifications/unread-count", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (userId == null) return;

  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.recipientId, userId), isNull(notificationsTable.readAt)));

  res.json({ count });
});

router.post("/notifications/read-all", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (userId == null) return;

  await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(and(eq(notificationsTable.recipientId, userId), isNull(notificationsTable.readAt)));

  res.sendStatus(204);
});

export default router;
