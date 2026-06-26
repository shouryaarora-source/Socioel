import { pgTable, serial, text, integer, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  hostId: integer("host_id").notNull(),
  maxAttendees: integer("max_attendees").notNull(),
  imageUrl: text("image_url"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  joinMode: text("join_mode").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
