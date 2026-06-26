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
import { requireUserId } from "../lib/auth";
import { createNotification } from "../lib/notifications";

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

router.get("/events/suggested", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (userId == null) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const myAttendances = await db
    .select({ eventId: attendancesTable.eventId })
    .from(attendancesTable)
    .where(eq(attendancesTable.userId, userId));
  const attendedEventIds = new Set(myAttendances.map((a) => a.eventId));

  const allEvents = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isUpcoming = (dateStr: string): boolean => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    return d.getTime() >= today.getTime();
  };

  const interestTokens = (user.interests ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const cityLower = (user.city ?? "").trim().toLowerCase();

  const preferredCategories = new Set<string>();
  for (const ev of allEvents) {
    if (ev.hostId === userId || attendedEventIds.has(ev.id)) {
      preferredCategories.add(ev.category.toLowerCase());
    }
  }

  const candidates = allEvents.filter(
    (ev) => ev.hostId !== userId && !attendedEventIds.has(ev.id) && isUpcoming(ev.date),
  );

  const scored = candidates.map((ev) => {
    let score = 0;
    const cat = ev.category.toLowerCase();
    if (preferredCategories.has(cat)) score += 2;
    if (interestTokens.some((t) => t === cat || cat.includes(t) || t.includes(cat))) score += 1;
    if (cityLower && ev.location.toLowerCase().includes(cityLower)) score += 1;
    return { ev, score };
  });

  const hasSignal = scored.some((s) => s.score > 0);
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const timeA = new Date(a.ev.date).getTime();
    const timeB = new Date(b.ev.date).getTime();
    if (!isNaN(timeA) && !isNaN(timeB)) return timeA - timeB;
    return 0;
  });

  const top = (hasSignal ? scored.filter((s) => s.score > 0) : scored).slice(0, 6);
  const result = await Promise.all(top.map(({ ev }) => buildEventResponse(ev)));
  res.json(result);
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

  const userId = requireUserId(req, res);
  if (userId == null) return;

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(attendancesTable)
    .where(and(eq(attendancesTable.eventId, params.data.id), eq(attendancesTable.userId, userId)));

  if (existing) {
    res.status(400).json({ error: "Already joined or requested this event", status: existing.status });
    return;
  }

  const status = event.joinMode === "approval_required" ? "pending" : "confirmed";

  const [attendance] = await db
    .insert(attendancesTable)
    .values({ eventId: params.data.id, userId, status })
    .returning();

  if (event.hostId !== userId) {
    const [actor] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    const actorName = actor?.name ?? "Someone";
    await createNotification({
      recipientId: event.hostId,
      actorId: userId,
      eventId: event.id,
      type: status === "pending" ? "join_request" : "event_join",
      title:
        status === "pending"
          ? `${actorName} requested to join`
          : `${actorName} joined your event`,
      body: event.title,
    });
  }

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

  const userId = requireUserId(req, res);
  if (userId == null) return;

  await db
    .delete(attendancesTable)
    .where(and(eq(attendancesTable.eventId, params.data.id), eq(attendancesTable.userId, userId)));

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

  const sessionUserId = requireUserId(req, res);
  if (sessionUserId == null) return;

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (event.hostId !== sessionUserId) {
    res.status(403).json({ error: "Only the event organizer can view requests" });
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

  const sessionUserId = requireUserId(req, res);
  if (sessionUserId == null) return;

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (event.hostId !== sessionUserId) {
    res.status(403).json({ error: "Only the event organizer can manage requests" });
    return;
  }

  const [attendance] = await db
    .update(attendancesTable)
    .set({ status: "confirmed" })
    .where(
      and(
        eq(attendancesTable.eventId, params.data.id),
        eq(attendancesTable.userId, params.data.userId),
        eq(attendancesTable.status, "pending")
      )
    )
    .returning();

  if (!attendance) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  await createNotification({
    recipientId: params.data.userId,
    actorId: sessionUserId,
    eventId: event.id,
    type: "request_approved",
    title: "Your request was approved",
    body: event.title,
  });

  res.json({ ...attendance, joinedAt: attendance.joinedAt.toISOString() });
});

router.post("/events/:id/requests/:userId/reject", async (req, res): Promise<void> => {
  const params = RejectJoinRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const sessionUserId = requireUserId(req, res);
  if (sessionUserId == null) return;

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (event.hostId !== sessionUserId) {
    res.status(403).json({ error: "Only the event organizer can manage requests" });
    return;
  }

  const [attendance] = await db
    .update(attendancesTable)
    .set({ status: "rejected" })
    .where(
      and(
        eq(attendancesTable.eventId, params.data.id),
        eq(attendancesTable.userId, params.data.userId),
        eq(attendancesTable.status, "pending")
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
