import { inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { neonUser } from "~/database/neon-auth-schema";
import { users } from "~/database/schema";
import type { AuditActor } from "../utils";

/**
 * Build an actor lookup map from a set of user IDs. Used to attach
 * display data ("Mike Yeates" rather than "cd107395-…") to audit-event
 * rows when rendering activity feeds.
 */
export async function resolveAuditActors(
  db: PostgresJsDatabase<Record<string, unknown>>,
  actorIds: string[],
): Promise<Map<string, AuditActor>> {
  if (actorIds.length === 0) return new Map();

  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      name: neonUser.name,
    })
    .from(users)
    .leftJoin(neonUser, sql`${neonUser.id} = ${users.id}::uuid`)
    .where(inArray(users.id, actorIds));

  return new Map(rows.map((r) => [r.id, r]));
}
