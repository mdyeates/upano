import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { users, type User } from "~/database/schema";
import type { AuthUser } from "./auth.server";

const LOCAL_USER_CACHE_TTL_MS = 60_000;
const localUserCache = new Map<string, { user: User; expiresAt: number }>();

/**
 * Returns the local users row for an authenticated Neon user.
 */
export async function ensureLocalUser(
  db: PostgresJsDatabase<Record<string, unknown>>,
  authUser: AuthUser,
): Promise<User> {
  const now = Date.now();
  const cached = localUserCache.get(authUser.id);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  // Fast path: user already exists (the common case after first login).
  // One round-trip; no INSERT.
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  if (existing[0]) {
    localUserCache.set(authUser.id, {
      user: existing[0],
      expiresAt: now + LOCAL_USER_CACHE_TTL_MS,
    });
    return existing[0];
  }

  // Slow path: first-ever request from this user. INSERT then return
  // the row. Use ON CONFLICT DO NOTHING + a follow-up SELECT to be
  // safe against race conditions.
  await db
    .insert(users)
    .values({ id: authUser.id })
    .onConflictDoNothing({ target: users.id });

  const inserted = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  const user = inserted[0];
  if (!user) {
    throw new Error(
      `ensureLocalUser: row missing after INSERT for id=${authUser.id}`,
    );
  }

  localUserCache.set(authUser.id, {
    user,
    expiresAt: now + LOCAL_USER_CACHE_TTL_MS,
  });
  return user;
}

/**
 * Drop the cached local user, e.g. after an admin promotes a role.
 * Forces the next ensureLocalUser call to refetch from DB.
 */
export function invalidateLocalUserCache(userId: string): void {
  localUserCache.delete(userId);
}
