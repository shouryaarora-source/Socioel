import { Router, type IRouter } from "express";
import { eq, and, sql, desc, ilike, or } from "drizzle-orm";
import { db, eventsTable, usersTable, attendancesTable } from "@workspace/db";
import {
  ListEventsQueryParams,
  CreateEventBody,
  GetEventParams,
  UpdateEventParams,
  UpdateEventBody,
  DeleteEventParams,
  JoinEventParams,
  JoinEventBody,
  LeaveEventParams,
  LeaveEventBody,
  GetEventAttendeesParams,
  GetEventJoinRequestsParams,
  ApproveJoinRequestParams,
  RejectJoinRequestParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function buildEventResponse(event: typeof eventsTable.$inferSelect, distanceKm?: number | null) {
  const [host] = await db.select().from(usersTable).where(eq(usersTable.id, event.hostId));
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(attendancesTable)
    .where(and(eq(attendancesTable.eventId, event.id), eq(attendancesTable.status, "confirmed")));

  return {
    ...event,
    createdAt: event.createdAt.toISOString(),
    hostName: host?.name ?? null,
    hostAvatar: host?.avatarUrl ?? null,
    attendeeCount: count,
    distanceKm: distanceKm ?? null,
  };
}

router.get("/events", async (req, res): Promise<void> => {
  const params = ListEventsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(eventsTable).$dynamic();

  const conditions = [];
  if (params.data.category) {
    conditions.push(eq(eventsTable.category, params.data.category));
  }
  if (params.data.search) {
    conditions.push(
      or(
        ilike(eventsTable.title, `%${params.data.search}%`),
        ilike(eventsTable.description, `%${params.data.search}%`),
        ilike(eventsTable.location, `%${params.data.search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const events = await query.orderBy(desc(eventsTable.createdAt));

  const { nearLat, nearLng, radiusKm = 50 } = params.data;

  if (nearLat != null && nearLng != null) {
    const withDistance = events.map((event) => {
      if (event.latitude != null && event.longitude != null) {
        return { event, distanceKm: haversineKm(nearLat, nearLng, event.latitude, event.longitude) };
      }
      return { event, distanceKm: null };
    });

    const filtered = withDistance.filter((e) => e.distanceKm == null || e.distanceKm <= radiusKm);

    filtered.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    const result = await Promise.all(filtered.map(({ event, distanceKm }) => buildEventResponse(event, distanceKm)));
    res.json(result);
    return;
  }

  const result = await Promise.all(events.map((e) => buildEventResponse(e)));
  res.json(result);
});

router.post("/events", async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { latitude, longitude } = parsed.data as { latitude?: number; longitude?: number };
  if ((latitude != null) !== (longitude != null)) {
    res.status(400).json({ error: "latitude and longitude must both be present or both absent" });
    return;
  }

  const [event] = await db.insert(eventsTable).values(parsed.data).returning();
  const result = await buildEventResponse(event);
  res.status(201).json(result);
});

router.get("/events/featured", async (_req, res): Promise<void> => {
  const subq = db
    .select({ eventId: attendancesTable.eventId, count: sql<number>`cast(count(*) as int)`.as("count") })
    .from(attendancesTable)
    .where(eq(attendancesTable.status, "confirmed"))
    .groupBy(attendancesTable.eventId)
    .as("att_counts");

  const events = await db
    .select({ event: eventsTable })
    .from(eventsTable)
    .leftJoin(subq, eq(eventsTable.id, subq.eventId))
    .orderBy(desc(sql`coalesce(${subq.count}, 0)`), desc(eventsTable.createdAt))
    .limit(6);

  const result = await Promise.all(events.map(({ event }) => buildEventResponse(event)));
  res.json(result);
});

router.get("/events/stats", async (_req, res): Promise<void> => {
  const [{ totalEvents }] = await db
    .select({ totalEvents: sql<number>`cast(count(*) as int)` })
    .from(eventsTable);

  const [{ totalAttendees }] = await db
    .select({ totalAttendees: sql<number>`cast(count(*) as int)` })
    .from(attendancesTable)
    .where(eq(attendancesTable.status, "confirmed"));

  const categoryCounts = await db
    .select({
      category: eventsTable.category,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(eventsTable)
    .groupBy(eventsTable.category)
    .orderBy(desc(sql`count(*)`));

  res.json({ totalEvents, totalAttendees, categoryCounts });
});

router.get("/events/:id", async (req, res): Promise<void> => {
  const params = GetEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const result = await buildEventResponse(event);
  res.json(result);
});

router.patch("/events/:id", async (req, res): Promise<void> => {
  const params = UpdateEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db
    .update(eventsTable)
    .set(parsed.data)
    .where(eq(eventsTable.id, params.data.id))
    .returning();

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const result = await buildEventResponse(event);
  res.json(result);
});

router.delete("/events/:id", async (req, res): Promise<void> => {
  const params = DeleteEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db
    .delete(eventsTable)
    .where(eq(eventsTable.id, params.data.id))
    .returning();

  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/events/:id/join", async (req, res): Promise<void> => {
  const params = JoinEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = JoinEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(attendancesTable)
    .where(and(eq(attendancesTable.eventId, params.data.id), eq(attendancesTable.userId, parsed.data.userId)));

  if (existing) {
    res.status(400).json({ error: "Already joined or requested this event", status: existing.status });
    return;
  }

  const status = event.joinMode === "approval_required" ? "pending" : "confirmed";

  const [attendance] = await db
    .insert(attendancesTable)
    .values({ eventId: params.data.id, userId: parsed.data.userId, status })
    .returning();

  res.status(201).json({ ...attendance, joinedAt: attendance.joinedAt.toISOString() });
});

router.delete("/events/:id/leave", async (req, res): Promise<void> => {
  const params = LeaveEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = LeaveEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db
    .delete(attendancesTable)
    .where(and(eq(attendancesTable.eventId, params.data.id), eq(attendancesTable.userId, parsed.data.userId)));

  res.sendStatus(204);
});

router.get("/events/:id/attendees", async (req, res): Promise<void> => {
  const params = GetEventAttendeesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const attendees = await db
    .select({ user: usersTable })
    .from(attendancesTable)
    .innerJoin(usersTable, eq(attendancesTable.userId, usersTable.id))
    .where(and(eq(attendancesTable.eventId, params.data.id), eq(attendancesTable.status, "confirmed")));

  const result = attendees.map(({ user }) => {
    const { passwordHash: _passwordHash, ...rest } = user;
    return {
      ...rest,
      createdAt: user.createdAt.toISOString(),
      eventsHosted: null,
      eventsJoined: null,
    };
  });

  res.json(result);
});

router.get("/events/:id/requests", async (req, res): Promise<void> => {
  const params = GetEventJoinRequestsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({ attendance: attendancesTable, user: usersTable })
    .from(attendancesTable)
    .innerJoin(usersTable, eq(attendancesTable.userId, usersTable.id))
    .where(and(eq(attendancesTable.eventId, params.data.id), eq(attendancesTable.status, "pending")));

  const result = rows.map(({ attendance, user }) => ({
    id: attendance.id,
    eventId: attendance.eventId,
    userId: attendance.userId,
    status: attendance.status,
    joinedAt: attendance.joinedAt.toISOString(),
    userName: user.name ?? null,
    userAvatar: user.avatarUrl ?? null,
    userPhone: user.phone ?? null,
  }));

  res.json(result);
});

router.post("/events/:id/requests/:userId/approve", async (req, res): Promise<void> => {
  const params = ApproveJoinRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [attendance] = await db
    .update(attendancesTable)
    .set({ status: "confirmed" })
    .where(
      and(
        eq(attendancesTable.eventId, params.data.id),
        eq(attendancesTable.userId, params.data.userId)
      )
    )
    .returning();

  if (!attendance) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  res.json({ ...attendance, joinedAt: attendance.joinedAt.toISOString() });
});

router.post("/events/:id/requests/:userId/reject", async (req, res): Promise<void> => {
  const params = RejectJoinRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [attendance] = await db
    .update(attendancesTable)
    .set({ status: "rejected" })
    .where(
      and(
        eq(attendancesTable.eventId, params.data.id),
        eq(attendancesTable.userId, params.data.userId)
      )
    )
    .returning();

  if (!attendance) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  res.json({ ...attendance, joinedAt: attendance.joinedAt.toISOString() });
});

export default router;
