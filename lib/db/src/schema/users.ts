import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  passwordHash: text("password_hash"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  profession: text("profession"),
  age: integer("age"),
  gender: text("gender"),
  city: text("city"),
  interests: text("interests"),
  phone: text("phone"),
  website: text("website"),
  instagram: text("instagram"),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  verified: boolean("verified").default(false).notNull(),
  verifiedAt: timestamp("verified_at"),
  verificationSelfieUrl: text("verification_selfie_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
