import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true, createdAt: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
