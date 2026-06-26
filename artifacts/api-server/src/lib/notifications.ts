import { db, notificationsTable } from "@workspace/db";
import { sendPushToUser } from "./push";
import { logger } from "./logger";

export interface CreateNotificationInput {
  recipientId: number;
  actorId?: number | null;
  eventId?: number | null;
  type: string;
  title: string;
  body?: string | null;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await db.insert(notificationsTable).values({
      recipientId: input.recipientId,
      actorId: input.actorId ?? null,
      eventId: input.eventId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
    });
  } catch (err) {
    logger.error({ err, recipientId: input.recipientId }, "Failed to persist notification");
    return;
  }

  void sendPushToUser(input.recipientId, {
    title: input.title,
    body: input.body,
    url: input.eventId != null ? `events/${input.eventId}` : "",
  }).catch((err) => logger.error({ err }, "Web push send failed"));
}
