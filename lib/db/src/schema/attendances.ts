import { pgTable, serial, integer, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendancesTable = pgTable("attendances", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("confirmed"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertAttendanceSchema = createInsertSchema(attendancesTable).omit({ id: true, joinedAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendancesTable.$inferSelect;
