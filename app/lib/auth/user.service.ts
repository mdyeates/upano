import { asc, eq, inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { neonUser } from "~/database/neon-auth-schema";
import { users, type User } from "~/database/schema";

export type UserWithIdentity = {
  id: string;
  role: User["role"];
  displayName: string | null;
  createdAt: Date;
  name: string | null;
  email: string | null;
  image: string | null;
};

/**
 * Every public.users row joined with their Neon identity. Ordered by
 * role (alphabetical: admin < reporter < sde, but we mostly use this
 * for the admin page where order is just "stable").
 * */
export async function listAllUsersWithIdentity(
  db: PostgresJsDatabase<Record<string, unknown>>,
): Promise<UserWithIdentity[]> {
  const rows = await db
    .select({
      id: users.id,
      role: users.role,
      displayName: users.displayName,
      createdAt: users.createdAt,
      name: neonUser.name,
      email: neonUser.email,
      image: neonUser.image,
    })
    .from(users)
    .leftJoin(neonUser, sql`${neonUser.id} = ${users.id}::uuid`)
    .orderBy(asc(users.role), asc(users.createdAt));
  return rows;
}

export type AssignableUser = {
  id: string;
  name: string;
  role: "sde" | "admin";
};

/**
 * Users who can be assigned to a bug i.e. SDEs and Admins. Reporters
 * file bugs but don't work them, so they're excluded.
 */
export async function listAssignableUsers(
  db: PostgresJsDatabase<Record<string, unknown>>,
): Promise<AssignableUser[]> {
  const rows = await db
    .select({
      id: users.id,
      role: users.role,
      displayName: users.displayName,
      name: neonUser.name,
    })
    .from(users)
    .leftJoin(neonUser, sql`${neonUser.id} = ${users.id}::uuid`)
    .where(sql`${users.role} IN ('sde', 'admin')`);

  return rows.map((r) => ({
    id: r.id,
    name: r.displayName ?? r.name ?? `(unknown ${r.id.slice(0, 8)})`,
    role: r.role as "sde" | "admin",
  }));
}

export type UserDetails = {
  id: string;
  role: User["role"];
  displayName: string | null;
  name: string;
  email: string;
  image: string | null;
};

/**
 * Batch-fetch users by id with identity attached. Used to resolve a
 * set of related users on a route (e.g. the reporter + assignee +
 * recent-actors of a bug).
 */
export async function fetchUsersByIds(
  db: PostgresJsDatabase<Record<string, unknown>>,
  userIds: string[],
): Promise<UserDetails[]> {
  if (userIds.length === 0) return [];

  const rows = await db
    .select({
      id: users.id,
      role: users.role,
      displayName: users.displayName,
      name: neonUser.name,
      email: neonUser.email,
      image: neonUser.image,
    })
    .from(users)
    .leftJoin(neonUser, sql`${neonUser.id} = ${users.id}::uuid`)
    .where(inArray(users.id, userIds));

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    displayName: row.displayName,
    name: row.name ?? `(unknown user ${row.id.slice(0, 8)})`,
    email: row.email ?? "",
    image: row.image,
  }));
}

/**
 * Fetch a single user by id with identity attached. Returns null when
 * the row doesn't exist.
 */
export async function fetchUserById(
  db: PostgresJsDatabase<Record<string, unknown>>,
  userId: string,
): Promise<UserDetails | null> {
  const rows = await db
    .select({
      id: users.id,
      role: users.role,
      displayName: users.displayName,
      name: neonUser.name,
      email: neonUser.email,
      image: neonUser.image,
    })
    .from(users)
    .leftJoin(neonUser, sql`${neonUser.id} = ${users.id}::uuid`)
    .where(eq(users.id, userId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    displayName: row.displayName,
    name: row.name ?? `(unknown user ${row.id.slice(0, 8)})`,
    email: row.email ?? "",
    image: row.image,
  };
}
