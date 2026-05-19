import { boolean, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const neonAuthSchema = pgSchema("neon_auth");

export const neonUser = neonAuthSchema.table("user", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  role: text("role"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
});

export type NeonUser = typeof neonUser.$inferSelect;
