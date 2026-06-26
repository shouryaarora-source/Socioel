import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { SubscribePushBody, UnsubscribePushBody } from "@workspace/api-zod";
import { requireUserId } from "../lib/auth";
import { getVapidPublicKey } from "../lib/push";

const router: IRouter = Router();

router.get("/push/vapid-public-key", (_req, res): void => {
  res.json({ publicKey: getVapidPublicKey() ?? "" });
});

router.post("/push/subscribe", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (userId == null) return;

  const parsed = SubscribePushBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { endpoint, keys } = parsed.data;

  await db
    .insert(pushSubscriptionsTable)
    .values({ userId, endpoint, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: { userId, p256dh: keys.p256dh, auth: keys.auth },
    });

  res.sendStatus(204);
});

router.post("/push/unsubscribe", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (userId == null) return;

  const parsed = UnsubscribePushBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db
    .delete(pushSubscriptionsTable)
    .where(
      and(
        eq(pushSubscriptionsTable.endpoint, parsed.data.endpoint),
        eq(pushSubscriptionsTable.userId, userId)
      )
    );

  res.sendStatus(204);
});

export default router;
