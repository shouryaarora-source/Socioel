import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { logger } from "./logger";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:notifications@socioel.app";

let configured = false;
if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
} else {
  logger.warn("Web Push disabled: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set");
}

export function getVapidPublicKey(): string | null {
  return publicKey ?? null;
}

export interface PushPayload {
  title: string;
  body?: string | null;
  url?: string | null;
}

export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  if (!configured) return;

  const subs = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userId, userId));

  if (subs.length === 0) return;

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "",
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, sub.id));
        } else {
          logger.error({ err, userId, endpoint: sub.endpoint }, "Failed to send web push");
        }
      }
    }),
  );
}
