import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, commentsTable, usersTable } from "@workspace/db";
import {
  GetEventCommentsParams,
  CreateCommentParams,
  CreateCommentBody,
  DeleteCommentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/events/:id/comments", async (req, res): Promise<void> => {
  const params = GetEventCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({ comment: commentsTable, user: usersTable })
    .from(commentsTable)
    .leftJoin(usersTable, eq(commentsTable.userId, usersTable.id))
    .where(eq(commentsTable.eventId, params.data.id))
    .orderBy(asc(commentsTable.createdAt));

  const result = rows.map(({ comment, user }) => ({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    userName: user?.name ?? null,
    userAvatar: user?.avatarUrl ?? null,
  }));

  res.json(result);
});

router.post("/events/:id/comments", async (req, res): Promise<void> => {
  const params = CreateCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!parsed.data.body.trim()) {
    res.status(400).json({ error: "Comment cannot be empty" });
    return;
  }

  const [comment] = await db
    .insert(commentsTable)
    .values({ eventId: params.data.id, userId: parsed.data.userId, body: parsed.data.body })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, comment.userId));

  res.status(201).json({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    userName: user?.name ?? null,
    userAvatar: user?.avatarUrl ?? null,
  });
});

router.delete("/events/:id/comments/:commentId", async (req, res): Promise<void> => {
  const params = DeleteCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, params.data.commentId));
  res.sendStatus(204);
});

export default router;
